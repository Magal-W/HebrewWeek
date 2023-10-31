mod api;
mod hebrew_db;

use axum::{routing::get, Router};
use rusqlite::Result;
use std::net::SocketAddr;
use tokio;

use crate::api::{get_mistakes, handler, AppState};

#[tokio::main]
async fn main() -> Result<()> {
    let app = Router::new()
        .route("/", get(handler))
        .route("/api/mistakes", get(get_mistakes))
        .with_state(AppState::new()?);

    // run it
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("listening on {}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
    Ok(())
}
