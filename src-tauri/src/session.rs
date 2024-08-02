use std::{sync::Arc, time::Duration};
use std::path::PathBuf;

use russh::{ChannelMsg, client::{self, Handle}, Disconnect};
use russh_sftp::client::SftpSession;
use serde::Serialize;
use tauri::Window;
use tokio::net::ToSocketAddrs;

use crate::{client::Client, error::Error};
use crate::file_transfer::FileTransfer;

/// A session to a remote SSH server.
pub struct Session {
    session: Handle<Client>,
}

#[derive(Debug, Clone, Serialize)]
struct PartialResult<'a> {
    data: &'a str,
}

impl Session {
    /// Connects to a remote SSH server.
    pub async fn connect<A: ToSocketAddrs>(
        username: impl Into<String>,
        password: impl Into<String>,
        address: A,
    ) -> Result<Self, Error> {
        let config = client::Config {
            inactivity_timeout: Some(Duration::from_secs(60 * 5)),
            ..<_>::default()
        };

        let config = Arc::new(config);
        let mut session = client::connect(config, address, Client).await?;
        let auth_result = session.authenticate_password(username, password).await?;
        if !auth_result {
            return Err(Error::AuthenticationFailed);
        }

        Ok(Self { session })
    }

    /// Executes a command on the remote server.
    pub async fn execute_command(&mut self, command: &str) -> Result<String, Error> {
        let mut channel = self.session.channel_open_session().await?;
        channel.exec(true, command).await?;
        let mut code = None;
        let mut error = None;
        let mut buffer = Vec::new();

        loop {
            let Some(message) = channel.wait().await else {
                break;
            };

            match message {
                ChannelMsg::Data { ref data } => {
                    buffer.extend_from_slice(data);
                }
                ChannelMsg::ExitStatus { exit_status } => {
                    code = Some(exit_status);
                }
                ChannelMsg::ExitSignal { error_message, .. } => {
                    error = Some(error_message);
                }
                ChannelMsg::ExtendedData { ref data, .. } => {
                    let error_message = String::from_utf8_lossy(data).to_string();
                    error = Some(error_message);
                }
                _ => {}
            }
        }

        code.ok_or(Error::CommandExecutionTimeout).and_then(|code| {
            if code == 0 {
                Ok(String::from_utf8_lossy(&buffer).into())
            } else {
                Err(Error::CommandExecutionFailed(error.unwrap_or("未知错误".into())))
            }
        })
    }

    /// Executes a command on the remote server and streams the output to the window.
    pub async fn execute_command_stream(&mut self, command: &str, window: &Window) -> Result<(), Error> {
        let mut channel = self.session.channel_open_session().await?;
        channel.exec(true, command).await?;
        let mut code = None;
        let mut error = None;

        loop {
            let Some(message) = channel.wait().await else {
                break;
            };

            match message {
                ChannelMsg::Data { ref data } => {
                    window.emit("command-result", PartialResult {
                        data: String::from_utf8_lossy(data).as_ref()
                    })?;
                }
                ChannelMsg::ExitStatus { exit_status } => {
                    code = Some(exit_status);
                }
                ChannelMsg::ExitSignal { error_message, .. } => {
                    error = Some(error_message);
                }
                ChannelMsg::ExtendedData { ref data, .. } => {
                    let error_message = String::from_utf8_lossy(data).to_string();
                    error = Some(error_message);
                }
                _ => {}
            }
        }

        code.ok_or(Error::CommandExecutionTimeout).and_then(|code| {
            if code == 0 {
                Ok(())
            } else {
                Err(Error::CommandExecutionFailed(error.unwrap_or("未知错误".into())))
            }
        })
    }

    /// Tests a command on the remote server.
    pub async fn test_command(&mut self, command: &str) -> Result<bool, Error> {
        let mut channel = self.session.channel_open_session().await?;
        channel.exec(true, command).await?;
        let mut code = None;

        loop {
            let Some(message) = channel.wait().await else {
                break;
            };

            match message {
                ChannelMsg::ExitStatus { exit_status } => {
                    code = Some(exit_status);
                }
                _ => {}
            }
        }

        code.ok_or(Error::CommandExecutionTimeout).map(|code| code == 0)
    }

    pub async fn transfer_file(&mut self, dir: &str, filename: &str, data: &[u8], window: &Window) -> Result<(), Error> {
        let _ = self.execute_command(format!("mkdir -p {dir}").as_ref()).await?;
        let channel = self.session.channel_open_session().await?;
        channel.request_subsystem(true, "sftp").await?;
        let mut sftp = SftpSession::new(channel.into_stream()).await?;
        let mut buf = PathBuf::new();
        buf.push(dir);
        buf.push(filename);

        let mut file_transfer = FileTransfer::new_with_event_progress_reporter(&mut sftp, window);
        file_transfer.transfer_file(buf.to_str().unwrap(), data).await
    }

    /// Closes the session.
    pub async fn close(&mut self) -> Result<(), Error> {
        self.session.disconnect(Disconnect::ByApplication, "", "English").await?;
        Ok(())
    }
}
