use std::fmt::Display;

use axum::response::{IntoResponse, Response};
use hyper::StatusCode;

#[derive(Debug)]
pub enum AppError {
    Anyhow(anyhow::Error),
    AuthError,
}

// Tell axum how to convert `AppError` into a response.
impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        match self {
            Self::Anyhow(err) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Something went wrong: {}", err),
            )
                .into_response(),
            Self::AuthError => (StatusCode::UNAUTHORIZED).into_response(),
        }
    }
}

impl Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Anyhow(err) => write!(f, "{}", err),
            Self::AuthError => write!(f, "AuthError"),
        }
    }
}

// This enables using `?` on functions that return `Result<_, anyhow::Error>` to turn them into
// `Result<_, AppError>`. That way you don't need to do that manually.
impl<E> From<E> for AppError
where
    E: Into<anyhow::Error>,
{
    fn from(err: E) -> Self {
        Self::Anyhow(err.into())
    }
}
