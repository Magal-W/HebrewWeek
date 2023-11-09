mod api;
mod error;
mod hebrew_db;
mod routes;

use crate::api::AppState;
use crate::routes::routes;
use rusqlite::Result;
use std::net::SocketAddr;
use tokio;
use tower_http::cors::{Any, CorsLayer};

#[tokio::main]
async fn main() -> Result<()> {
    let cors = CorsLayer::new().allow_origin(Any);

    let app = routes().with_state(AppState::new()?).layer(cors);

    // run it
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("listening on {}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
    Ok(())
}
