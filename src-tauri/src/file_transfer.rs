use std::cmp;

use russh_sftp::client::SftpSession;
use tauri::Window;
use tokio::io::AsyncWriteExt;

use crate::error::Error;
use crate::progress_reporter::{EventProgressReporter, ProgressEvent, ProgressReporter};

pub struct FileTransfer<'a> {
    session: &'a mut SftpSession,
    progress_reporter: Box<dyn ProgressReporter + Send + Sync + 'a>
}

impl<'a> FileTransfer<'a> {
    pub fn new(session: &'a mut SftpSession, progress_reporter: Box<dyn ProgressReporter + Send + Sync + 'a>) -> Self {
        Self { session, progress_reporter }
    }

    pub fn new_with_event_progress_reporter(session: &'a mut SftpSession, window: &'a Window) -> Self {
        let progress_reporter = Box::new(EventProgressReporter::new("file-progress", window));
        Self::new(session, progress_reporter)
    }

    pub async fn transfer_file(&mut self, file: &str, data: &[u8]) -> Result<(), Error> {
        let mut file = self.session.create(file).await?;

        let total_size = data.len();
        let chunk_size = 8092;
        let mut written = 0;
        while written < total_size {
            let end = cmp::min(written + chunk_size, total_size);
            file.write_all(&data[written..end]).await?;
            written = end;

            self.progress_reporter.report_progress(ProgressEvent::new(total_size, written)).await;
        }

        file.flush().await?;
        file.shutdown().await?;

        Ok(())
    }
}