use async_trait::async_trait;
use russh::client::Handler;
use russh::keys::key;

pub struct Client;

#[async_trait]
impl Handler for Client {
    type Error = russh::Error;

    #[allow(unused_variables)]
    async fn check_server_key(
        &mut self,
        server_public_key: &key::PublicKey,
    ) -> Result<bool, Self::Error> {
        Ok(true)
    }
}
