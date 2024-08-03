// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use command::execute_command;
use command::execute_command_stream;
use command::execute_flow;
use command::list_flows;
use command::test_ssh_connection;

mod error;
mod client;
mod session;
mod server_settings;
mod command;
mod flow;
mod flow_asset;
mod script;
mod progress_reporter;
mod package_resolver;
mod file_transfer;
mod hospital_settings;
mod file_downloader;
mod template;
mod util;
mod decompressor;

fn main() {
    tauri::Builder::default()
        .invoke_handler(
            tauri::generate_handler!(
                test_ssh_connection,
                execute_command,
                execute_command_stream,
                list_flows,
                execute_flow
            )
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

