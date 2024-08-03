use async_trait::async_trait;
use bytesize::ByteSize;
use serde::Serialize;
use tauri::Window;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProgressEvent {
    pub total_size: usize,
    pub total_size_format: String,
    pub processed_size: usize,
    pub processed_size_format: String,
    pub progress_percent: f64,
}

impl ProgressEvent {
    pub fn new(total_size: usize, processed_size: usize) -> Self {
        let progress_percent = (processed_size as f64 / total_size as f64) * 100f64;
        Self {
            total_size,
            total_size_format: ByteSize::b(total_size as u64).to_string_as(false),
            processed_size,
            processed_size_format: ByteSize::b(processed_size as u64).to_string_as(false),
            progress_percent,
        }
    }
}

#[async_trait]
pub trait ProgressReporter {
    async fn report_progress(&self, progress: ProgressEvent);
}

pub struct NoopProgressReporter;

#[async_trait]
impl ProgressReporter for NoopProgressReporter {
    async fn report_progress(&self, _progress: ProgressEvent) {}
}

pub struct EventProgressReporter<'a> {
    event_name: &'a str,
    window: &'a Window,
}

#[async_trait]
impl<'a> ProgressReporter for EventProgressReporter<'a> {
    async fn report_progress(&self, progress: ProgressEvent) {
        self.window.emit(self.event_name, progress).unwrap();
    }
}

impl<'a> EventProgressReporter<'a> {
    pub fn new(event_name: &'a str, window: &'a Window) -> Self {
        Self { event_name, window }
    }
}

