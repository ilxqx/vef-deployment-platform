use std::path::PathBuf;

use async_trait::async_trait;
use tauri::Window;

use crate::{error::Error, file_downloader::FileDownloader};
use crate::util::copy_file;

const BASE_REMOTE_PACKAGE_URL: &str = "http://192.168.10.207:5959/packages/";

#[async_trait]
pub trait PackageResolver {
    async fn resolve(&self, package_name: &str, target_file: &str) -> Result<(), Error>;
}

pub struct RemoteServerPackageResolver<'a> {
    file_downloader: FileDownloader<'a>,
}

impl<'a> RemoteServerPackageResolver<'a> {
    pub fn new(window: &'a Window) -> Self {
        Self {
            file_downloader: FileDownloader::new_with_event_progress_reporter(window)
        }
    }
}

#[async_trait]
impl<'a> PackageResolver for RemoteServerPackageResolver<'a> {
    async fn resolve(&self, package_name: &str, target_file: &str) -> Result<(), Error> {
        let url = format!("{}{}", BASE_REMOTE_PACKAGE_URL, package_name);
        self.file_downloader.download_file(&url, target_file).await
    }
}

macro_rules! join_path {
  ($($s:expr),*) => {
      {
          let mut pb = PathBuf::new();
          $(
              let s: &str = $s.as_ref();
              pb.push(s);
          )*
          pb.to_str().unwrap().to_string()
      }
  };
}

pub struct LocalPackageResolver<'a> {
    local_dir: &'a str,
}

impl<'a> LocalPackageResolver<'a> {
    pub fn new(local_dir: &'a str) -> Self {
        Self { local_dir }
    }

    async fn handle_docker_package(&self, package_name: &str, target_file: &str) -> Result<(), Error> {
        let os = package_name.replacen("docker/", "", 1);
        let file_name = if os == "ubuntu" { "debs.tar.gz" } else { "rpms.tar.gz" };
        let file = join_path!(self.local_dir, "docker", file_name);

        copy_file(&file, target_file).await
    }

    async fn handle_docker_image(&self, package_name: &str, target_file: &str) -> Result<(), Error> {
        let image_name = package_name.replacen("docker/images/", "", 1);
        let file = join_path!(self.local_dir, "docker/images", &image_name);

        copy_file(&file, target_file).await
    }

    async fn handle_service_package(&self, package_name: &str, target_file: &str) -> Result<(), Error> {
        let service_name = package_name.replacen("service/", "", 1);
        let file_name = format!("{}.tar.gz", service_name);
        let file = join_path!(self.local_dir, service_name, file_name);

        copy_file(&file, target_file).await
    }

    async fn handle_config_template_file(&self, package_name: &str, target_file: &str) -> Result<(), Error> {
        let package_name = package_name.replacen("config/", "", 1);
        let (app, filename) = package_name.split_once("/").unwrap();
        let file = join_path!(self.local_dir, "config", app, filename);

        copy_file(&file, target_file).await
    }
}

const DOCKER_IMAGES_PREFIX: &str = "docker/images/";
const DOCKER_PREFIX: &str = "docker/";
const SERVICE_PREFIX: &str = "service/";
const CONFIG_PREFIX: &str = "config/";

#[async_trait]
impl<'a> PackageResolver for LocalPackageResolver<'a> {
    async fn resolve(&self, package_name: &str, target_file: &str) -> Result<(), Error> {
        match package_name {
            _ if package_name.starts_with(DOCKER_IMAGES_PREFIX) => {
                self.handle_docker_image(package_name, target_file).await
            }
            _ if package_name.starts_with(DOCKER_PREFIX) => {
                self.handle_docker_package(package_name, target_file).await
            }
            _ if package_name.starts_with(SERVICE_PREFIX) => {
                self.handle_service_package(package_name, target_file).await
            }
            _ if package_name.starts_with(CONFIG_PREFIX) => {
                self.handle_config_template_file(package_name, target_file).await
            }
            _ => Ok(()),
        }
    }
}