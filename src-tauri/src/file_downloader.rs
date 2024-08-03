use std::path::PathBuf;

use futures_util::StreamExt;
use reqwest::Client;
use tauri::Window;
use tokio::fs::{create_dir_all, File};
use tokio::io::AsyncWriteExt;

use crate::error::Error;
use crate::progress_reporter::{EventProgressReporter, ProgressEvent, ProgressReporter};

pub struct FileDownloader<'a> {
    progress_reporter: Box<dyn ProgressReporter + Send + Sync + 'a>,
}

impl<'a> FileDownloader<'a> {
    pub fn new(progress_reporter: Box<dyn ProgressReporter + Send + Sync + 'a>) -> Self {
        Self { progress_reporter }
    }

    pub fn new_with_event_progress_reporter(window: &'a Window) -> Self {
        let progress_reporter = Box::new(EventProgressReporter::new("file-progress", window));
        Self::new(progress_reporter)
    }

    pub async fn download_file(&self, url: &str, target_file: &str) -> Result<(), Error> {
        println!("Downloading file from {} to {}", url, target_file);

        let client = Client::new();
        let response = client.get(url).send().await?;
        if !response.status().is_success() {
            return Err(Error::FlowExecutionFailed(format!("Failed to download file from {} to {}. Response status: {}, Response message: {}", url, target_file, response.status(), response.text().await?)));
        }

        let total_size = response.content_length().ok_or(Error::FlowExecutionFailed("Content-Length header is missing when downloading file".to_string()))?;
        if let Some(parent) = PathBuf::from(target_file).parent() {
            create_dir_all(parent).await?;
        }
        let mut file = File::create(target_file).await?;
        let mut downloaded_size = 0;
        let mut stream = response.bytes_stream();

        while let Some(chunk) = stream.next().await {
            let chunk = chunk?;
            file.write_all(&chunk).await?;
            downloaded_size += chunk.len();
            self.progress_reporter.report_progress(ProgressEvent::new(total_size as usize, downloaded_size)).await;
        }

        Ok(file.sync_all().await?)
    }
}