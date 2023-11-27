use scrypt::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Scrypt,
};
use tracing::info;
pub fn authorize(password: &str) -> bool {
    info!("Started authorize");
    let salt = SaltString::from_b64("aGVicmV3").unwrap();
    dbg!(Scrypt
        .hash_password(password.as_bytes(), &salt)
        .unwrap()
        .to_string());
    info!("Finished auth");
    dbg!(password) == "Eli"
}
