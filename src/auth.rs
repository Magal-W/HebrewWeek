use anyhow::Result;
use async_once_cell::OnceCell;
use scrypt::{
    password_hash::{PasswordHash, PasswordVerifier},
    Scrypt,
};

static CELL_HASH: OnceCell<PasswordHash<'static>> = OnceCell::new();
static CELL_PASS: OnceCell<String> = OnceCell::new();

pub async fn authorize(password: &str) -> Result<bool> {
    Ok(Scrypt
        .verify_password(password.as_bytes(), admin_hash().await?)
        .is_ok())
}

async fn admin_hash() -> Result<&'static PasswordHash<'static>> {
    CELL_HASH
        .get_or_try_init(async {
            let pass_string = admin_pass().await?;
            let hash: PasswordHash<'static> = PasswordHash::new(pass_string)?;
            Ok(hash)
        })
        .await
}

async fn admin_pass() -> Result<&'static str> {
    CELL_PASS
        .get_or_try_init(async {
            let pass_string = tokio::fs::read_to_string("p.ass").await?;
            Ok(pass_string)
        })
        .await
        .map(|string| string.as_str())
}
