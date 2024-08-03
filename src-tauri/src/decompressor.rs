use std::fs::File;
use std::io::{BufReader, Read};
use std::path::Path;

use async_trait::async_trait;
use flate2::bufread::GzDecoder;
use tar::Archive;
use tauri::Window;

use crate::error::Error;
use crate::progress_reporter::{EventProgressReporter, ProgressEvent, ProgressReporter};

#[async_trait]
pub trait Decompressor {
    /// Decompress the file to the target directory
    async fn decompress(&self, file: &str, target_dir: impl AsRef<Path> + Send) -> Result<(), Error>;
}

pub struct ProgressDecompressor<'a> {
    window: &'a Window,
}

impl<'a> ProgressDecompressor<'a> {
    pub fn new(window: &'a Window) -> Self {
        Self { window }
    }
}

struct ProgressReader<'a, R: Read> {
    delegate: R,
    total_size: usize,
    processed_size: usize,
    last_reported_size: usize,
    progress_reporter: Box<dyn ProgressReporter + Send + Sync + 'a>,
}

impl<'a, R: Read> ProgressReader<'a, R> {
    fn new(delegate: R, total_size: usize, window: &'a Window) -> Self {
        Self { delegate, total_size, processed_size: 0, last_reported_size: 0, progress_reporter: Box::new(EventProgressReporter::new("file-progress", window)) }
    }
}

impl<'a, R: Read> Read for ProgressReader<'a, R> {
    fn read(&mut self, buf: &mut [u8]) -> std::io::Result<usize> {
        let bytes_read = self.delegate.read(buf)?;
        self.processed_size += bytes_read;
        if self.last_reported_size == 0 || self.processed_size - self.last_reported_size >= 1024 * 1024 * 10 {
            tokio::task::block_in_place(|| {
                tokio::runtime::Handle::current().block_on(self.progress_reporter.report_progress(ProgressEvent::new(self.total_size, self.processed_size)));
            });
            self.last_reported_size = self.processed_size;
        }
        Ok(bytes_read)
    }
}

#[async_trait]
impl<'a> Decompressor for ProgressDecompressor<'a> {
    async fn decompress(&self, file: &str, target_dir: impl AsRef<Path> + Send) -> Result<(), Error> {
        let file = File::open(file)?;
        let tar = GzDecoder::new(BufReader::new(&file));
        let mut archive = Archive::new(tar);

        archive.unpack(target_dir)?;
        Ok(())
    }
}