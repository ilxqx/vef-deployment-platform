use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HospitalSettings {
    pub id: String,
    pub name: String,
    pub main_server_ip: String,
    pub database_server_ip: String,
    pub redis_server_ip: String,
    pub minio_server_ip: String,
    pub report_server_ip: String,
    pub file_preview_server_ip: String,
    pub dashboard_server_ip: String,
    pub big_screen_server_ip: String,
}