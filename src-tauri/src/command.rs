use std::collections::HashMap;
use std::sync::LazyLock;

use serde_json::Value;
use tauri::Window;

use crate::error::Error;
use crate::flow::{FlowDefinition, FlowEngine};
use crate::hospital_settings::HospitalSettings;
use crate::server_settings::ServerSettings;
use crate::session::Session;

static FLOW_ENGINE: LazyLock<FlowEngine> = LazyLock::new(|| FlowEngine::new());

async fn create_session(server_settings: ServerSettings) -> Result<Session, Error> {
    let session = Session::connect(
        server_settings.username,
        server_settings.password,
        (server_settings.host, server_settings.port),
    ).await?;
    Ok(session)
}

#[tauri::command]
pub async fn test_ssh_connection(server_settings: ServerSettings) -> Result<String, Error> {
    let mut session = create_session(server_settings).await?;
    let result = session.execute_command("cat /etc/os-release | grep PRETTY_NAME | cut -d '=' -f 2 | tr -d '\"'").await?;
    Ok(result)
}

#[tauri::command]
pub async fn execute_command(server_settings: ServerSettings, command: String) -> Result<String, Error> {
    let mut session = create_session(server_settings).await?;
    let result = session.execute_command(&command).await?;
    Ok(result)
}

#[tauri::command]
pub async fn execute_command_stream(server_settings: ServerSettings, command: String, window: Window) -> Result<(), Error> {
    let mut session = create_session(server_settings).await?;
    session.execute_command_stream(&command, &window).await?;
    Ok(())
}

#[tauri::command]
pub fn list_flows() -> &'static [FlowDefinition] {
    FLOW_ENGINE.list_flows()
}

#[tauri::command]
pub async fn execute_flow(server_settings: ServerSettings, hospital_settings: HospitalSettings, flow_name: String, args: Option<HashMap<String, Value>>, window: Window) -> Result<(), Error> {
    let mut session = create_session(server_settings).await?;
    FLOW_ENGINE.run_flow(&flow_name, hospital_settings, args.unwrap_or(HashMap::new()), &mut session, &window).await
}