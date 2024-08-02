use std::io;

use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error(transparent)]
    Io(#[from] io::Error),

    #[error(transparent)]
    SshError(#[from] russh::Error),

    #[error(transparent)]
    SftpError(#[from] russh_sftp::client::error::Error),

    #[error(transparent)]
    TauriError(#[from] tauri::Error),

    #[error(transparent)]
    RequestError(#[from] reqwest::Error),

    #[error(transparent)]
    TemplateError(#[from] tera::Error),

    /// The server authentication failed.
    #[error("服务器认证失败")]
    AuthenticationFailed,

    /// The command execution timed out.
    #[error("命令执行超时")]
    CommandExecutionTimeout,

    /// The command execution failed.
    #[error("命令执行失败: {0}")]
    CommandExecutionFailed(String),

    /// The flow execution failed.
    #[error("流程执行失败: {0}")]
    FlowExecutionFailed(String),

    /// The path is invalid.
    #[error("无效的路径")]
    InvalidPath,

    /// The filename is invalid.
    #[error("无效的文件名: {0}")]
    InvalidFilename(String),
}

impl Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(self.to_string().as_str())
    }
}
