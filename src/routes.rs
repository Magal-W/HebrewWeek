use axum::{routing::get, Router};

use crate::api::{home_page, mistakes, AppState};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(home_page))
        .route("/api/mistakes", get(mistakes))
}
