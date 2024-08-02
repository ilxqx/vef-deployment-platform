use tera::{Context, Tera};

use crate::error::Error;

#[derive(Debug)]
pub struct TemplateEvaluator;

impl TemplateEvaluator {
    pub fn render(&self, template: &str, context: &Context) -> Result<String, Error> {
        let mut engine = Tera::default();
        let content = engine.render_str(
            template,
            context,
        )?;

        Ok(content)
    }
}