use std::path::PathBuf;

use tokio::fs;

use crate::error::Error;

pub async fn copy_file(file: &str, target_file: &str) -> Result<(), Error> {
    if let Some(parent) = PathBuf::from(target_file).parent() {
        fs::create_dir_all(parent).await?;
    }

    fs::copy(file, target_file).await?;
    Ok(())
}