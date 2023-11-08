mod api;
mod hebrew_db;

use axum::{routing::get, Router};
use rusqlite::Result;
use std::net::SocketAddr;
use tokio;
use tower_http::cors::{Any, CorsLayer};

use crate::api::{home_page, mistakes, AppState};

#[tokio::main]
async fn main() -> Result<()> {
    let cors = CorsLayer::new().allow_origin(Any);

    let app = Router::new()
        .route("/", get(home_page))
        .route("/api/mistakes", get(mistakes))
        .with_state(AppState::new()?)
        .layer(cors);

    // run it
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("listening on {}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
    Ok(())
}
