use std::collections::HashMap;
use std::io;
use std::path::PathBuf;

use bytesize::ByteSize;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::{Manager, Window};
use tera::Context;
use tokio::fs;
use tokio::fs::try_exists;

use crate::decompressor::{Decompressor, ProgressDecompressor};
use crate::error::Error;
use crate::flow_asset::FlowAsset;
use crate::hospital_settings::HospitalSettings;
use crate::package_resolver::{PackageResolver, RemoteServerPackageResolver};
use crate::session::Session;
use crate::template::TemplateEvaluator;

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FlowDefinition {
    local: bool,
    name: String,
    description: String,
    icon: String,
    parameters: Vec<FlowParameter>,
    steps: Vec<FlowStepDefinition>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FlowParameter {
    name: String,
    label: String,
    r#type: String,
    required: bool,
    multiple: bool,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FlowStepDefinition {
    r#type: String,
    name: String,
    condition: Option<String>,
    command: Option<String>,
    package: Option<String>,
    source_file_param_name: Option<String>,
    source_file: Option<String>,
    target_dir: Option<String>,
    target_file: Option<String>,
}

#[derive(Debug)]
pub struct FlowContainer {
    flows: Vec<FlowDefinition>,
}

impl FlowContainer {
    pub fn new() -> Self {
        let mut flows = vec![];
        for file in FlowAsset::iter() {
            let error_message = format!("Failed to parse flow definition: {file}");
            if let Some(ef) = FlowAsset::get(file.as_ref()) {
                let flow: FlowDefinition = serde_json::from_slice(ef.data.as_ref()).expect(error_message.as_str());
                flows.push(flow);
            }
        }

        Self { flows }
    }

    pub fn get_flow(&self, name: &str) -> Option<&FlowDefinition> {
        self.flows.iter().find(|flow| flow.name == name)
    }

    pub fn get_all_flows(&self) -> &[FlowDefinition] {
        &self.flows
    }
}

#[derive(Debug)]
pub struct FlowEngine {
    container: FlowContainer,
    template_evaluator: TemplateEvaluator,
}

#[derive(Debug, Clone, Serialize)]
struct FlowStepChangeEvent {
    data: usize,
}

impl FlowEngine {
    pub fn new() -> Self {
        let container = FlowContainer::new();

        Self { container, template_evaluator: TemplateEvaluator }
    }

    pub fn render_template(&self, template: &str, context: &Context) -> Result<String, Error> {
        self.template_evaluator.render(
            template,
            context,
        )
    }

    pub fn list_flows(&self) -> &[FlowDefinition] {
        self.container.get_all_flows()
    }

    pub async fn run_flow(&self, flow_name: &str, hospital_settings: HospitalSettings, args: HashMap<String, Value>, session: &mut Session, window: &Window) -> Result<(), Error> {
        if let Some(flow) = self.container.get_flow(flow_name) {
            let context = self.create_template_evaluation_context(&hospital_settings, &args, session).await?;
            for (index, step) in flow.steps.iter().enumerate() {
                window.emit("flow-step-change", FlowStepChangeEvent {
                    data: index
                })?;

                if let Some(ref script) = step.condition {
                    let result = session.test_command(
                        &self.render_template(script, &context)?,
                    ).await?;
                    if result {
                        println!("Condition is true, skipping step: {}", step.name);
                        continue;
                    }
                }

                self.handle_step(step, &args, &context, session, window).await?;
            }
        }

        Ok(())
    }

    async fn handle_step(&self, step: &FlowStepDefinition, args: &HashMap<String, Value>, context: &Context, session: &mut Session, window: &Window) -> Result<(), Error> {
        match step.r#type.as_str() {
            "decompressionOfflinePackage" => {
                let offline_package = args.get("offline_package").expect("No offline package specified")
                    .as_str()
                    .expect("Invalid offline package type");
                self.decompress_offline_package(offline_package, window).await
            }
            "runCommand" => {
                if let Some(ref command) = step.command {
                    self.handle_command_step(command, context, session, window).await
                } else {
                    Err(Error::FlowExecutionFailed(format!("No command specified for step {}", step.name)))
                }
            }
            "downloadPackage" => {
                self.download_package(step, context, window).await
            }
            "transferPackage" => {
                let package = step.package.as_ref().expect(format!("No package specified for step {}", step.name).as_str());
                let target_file = step.target_file.as_ref().expect(format!("No target file specified for step {}", step.name).as_str());
                self.transfer_package(package, target_file, context, session, window).await
            }
            "transferConfigFile" => {
                let source_file = step.source_file.as_ref().expect(format!("No source file specified for step {}", step.name).as_str());
                let target_file = step.target_file.as_ref().expect(format!("No target file specified for step {}", step.name).as_str());
                self.transfer_config_file(source_file, target_file, context, session, window).await
            }
            "transferFile" => {
                self.transfer_file(step, args, session, window).await
            }
            _ => {
                Err(Error::FlowExecutionFailed(format!("Unsupported step type: {}", step.r#type)))
            }
        }
    }

    /// Decompress offline package.
    async fn decompress_offline_package(&self, offline_package: &str, window: &Window) -> Result<(), Error> {
        let cache_dir = window.app_handle().path_resolver().app_cache_dir()
            .ok_or(io::Error::new(io::ErrorKind::NotFound, "Cache directory not found"))?;

        ProgressDecompressor::new(window)
            .decompress(offline_package, &cache_dir)
            .await
    }

    /// Execute the command on the target machine.
    async fn handle_command_step(&self, command: &str, context: &Context, session: &mut Session, window: &Window) -> Result<(), Error> {
        let command = self.template_evaluator.render(command, context)?;
        session.execute_command_stream(&command, window).await?;
        Ok(())
    }

    /// Get the OS version of the target machine.
    async fn get_os_version(&self, session: &mut Session) -> Result<String, Error> {
        let os_version = session.execute_command("cat /etc/os-release | grep PRETTY_NAME | cut -d '=' -f 2 | tr -d '\"'").await?;
        Ok(os_version.to_lowercase())
    }

    /// Create template evaluation context.
    async fn create_template_evaluation_context(&self, hospital_settings: &HospitalSettings, args: &HashMap<String, Value>, session: &mut Session) -> Result<Context, Error> {
        let mut context = Context::new();
        context.insert("os", &self.get_os_version(session).await?);
        context.insert("hs", hospital_settings);
        context.insert("args", args);
        println!("Template evaluation context: {:?}", context);

        Ok(context)
    }

    /// Download package from the server.
    async fn download_package(&self, step: &FlowStepDefinition, context: &Context, window: &Window) -> Result<(), Error> {
        let mut cache_dir = window.app_handle().path_resolver().app_cache_dir()
            .ok_or(io::Error::new(io::ErrorKind::NotFound, "Cache directory not found"))?;
        let target_file = step.target_file.as_ref().ok_or(Error::FlowExecutionFailed("No target file specified".to_string()))?;
        cache_dir.push(self.render_template(target_file, &context)?);
        println!("cache dir: {:?}", cache_dir);
        let exists = try_exists(&cache_dir).await?;
        if exists {
            return Ok(());
        }

        let package = step.package.as_ref().ok_or(Error::FlowExecutionFailed("No package specified".to_string()))?;
        let package = self.render_template(package, &context)?;

        RemoteServerPackageResolver::new(window)
            .resolve(&package, cache_dir.to_str().unwrap())
            .await
    }

    /// Transfer deployment package to the target directory.
    async fn transfer_package(&self, package: &str, target_file: &str, context: &Context, session: &mut Session, window: &Window) -> Result<(), Error> {
        let mut cache_dir = window.app_handle().path_resolver().app_cache_dir()
            .ok_or(io::Error::new(io::ErrorKind::NotFound, "Cache directory not found"))?;
        let package = self.render_template(package, &context)?;
        cache_dir.push(&package);
        let exists = try_exists(&cache_dir).await?;
        if !exists {
            return Err(Error::FlowExecutionFailed(format!("Package not found: {}", package)));
        }

        let target_file = self.render_template(target_file, &context)?;
        let path_buf = PathBuf::from(&target_file);
        let filename = path_buf.file_name().ok_or(Error::InvalidPath)?.to_str().ok_or(Error::InvalidPath)?;
        let dir = path_buf.parent().ok_or(Error::InvalidPath)?.to_str().ok_or(Error::InvalidPath)?;

        let package_metadata = fs::metadata(&cache_dir).await?;
        let total_size = package_metadata.len();
        let size = session.execute_command(
            format!("du {target_file} | tr -s ' ' | cut -d ' ' -f 1").as_str(),
        ).await.unwrap_or("0".into());
        if total_size < ByteSize::mb(5).as_u64() || (ByteSize::kb(size.parse().unwrap_or(0)).as_u64() as i64 - total_size as i64).abs() > ByteSize::mb(1).as_u64() as i64 {
            println!("Transfer package from {} to {}", package, target_file);
            session.transfer_file(
                dir,
                filename,
                &fs::read(&cache_dir).await?,
                window,
            ).await?;
        }

        Ok(())
    }

    /// Transfer configuration file to the target directory.
    async fn transfer_config_file(&self, source_file: &str, target_file: &str, context: &Context, session: &mut Session, window: &Window) -> Result<(), Error> {
        let mut cache_dir = window.app_handle().path_resolver().app_cache_dir()
            .ok_or(io::Error::new(io::ErrorKind::NotFound, "Cache directory not found"))?;
        let source_file = self.render_template(source_file, &context)?;
        cache_dir.push(&source_file);
        let exists = try_exists(&cache_dir).await?;
        if !exists {
            return Err(Error::FlowExecutionFailed(format!("Source config file not found: {}", source_file)));
        }

        let config_template = fs::read_to_string(cache_dir).await?;
        println!("Compile config file: {}", source_file);
        let config_content = self.render_template(&config_template, context).map_err(|e| {
            println!("Failed to compile config file: {:#?}", e);
            e
        })?;
        let target_file = self.render_template(target_file, &context)?;
        let path_buf = PathBuf::from(&target_file);
        let filename = path_buf.file_name().ok_or(Error::InvalidPath)?.to_str().ok_or(Error::InvalidPath)?;
        let dir = path_buf.parent().ok_or(Error::InvalidPath)?.to_str().ok_or(Error::InvalidPath)?;

        session.transfer_file(dir, filename, config_content.as_bytes(), window).await?;
        Ok(())
    }

    /// Transfer file from source to target directory.
    async fn transfer_file(&self, step: &FlowStepDefinition, args: &HashMap<String, Value>, session: &mut Session, window: &Window) -> Result<(), Error> {
        if let Some(ref param_name) = step.source_file_param_name {
            if let Some(value) = args.get(param_name) {
                match value {
                    Value::String(source_file) => {
                        let target_file = self.construct_target_file(step.target_dir.as_deref(), step.target_file.as_deref(), source_file)?;
                        self.do_transfer_file(source_file, &target_file, session, window).await?;
                    }
                    Value::Array(arr) => {
                        for item in arr {
                            if let Some(source_file) = item.as_str() {
                                let target_file = self.construct_target_file(step.target_dir.as_deref(), step.target_file.as_deref(), source_file)?;
                                self.do_transfer_file(source_file, &target_file, session, window).await?;
                            }
                        }
                    }
                    _ => return Err(Error::FlowExecutionFailed(format!("Invalid value type for parameter {}", param_name))),
                }
            }
        }

        Ok(())
    }

    /// Construct the target file path based on the target_dir and target_file parameters.
    /// If target_file is provided, it will be used as the target file path.
    /// If target_dir is provided, the source file name will be used as the target file name.
    /// If neither target_dir nor target_file is provided, the source file name will be used as the target file name.
    fn construct_target_file(&self, target_dir: Option<&str>, target_file: Option<&str>, source_file: &str) -> Result<String, Error> {
        if let Some(file) = target_file {
            return Ok(file.to_owned());
        }

        if let Some(dir) = target_dir {
            let mut path_buf = PathBuf::from(dir);
            path_buf.push(
                PathBuf::from(source_file).file_name().ok_or(Error::InvalidFilename(source_file.to_string()))?
            );
            path_buf.to_str().map(|s: &str| s.to_string()).ok_or(Error::InvalidPath)
        } else {
            Ok(source_file.to_owned())
        }
    }

    /// Transfer file from source to target directory.
    async fn do_transfer_file(&self, source_file: &str, target_file: &str, session: &mut Session, window: &Window) -> Result<(), Error> {
        let file_content = fs::read(source_file).await?;
        let path_buf = PathBuf::from(target_file);
        let filename = path_buf.file_name().ok_or(Error::InvalidPath)?.to_str().ok_or(Error::InvalidPath)?;
        let dir = path_buf.parent().ok_or(Error::InvalidPath)?.to_str().ok_or(Error::InvalidPath)?;

        session.transfer_file(dir, filename, &file_content, window).await?;
        Ok(())
    }
}