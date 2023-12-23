mod api;
mod auth;
mod error;
mod hebrew_db;
mod types;

use crate::api::routes;
use crate::api::AppState;
use hyper::Method;
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::fmt::init;

#[tokio::main]
async fn main() {
    init();

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_headers(Any)
        .allow_methods([Method::GET, Method::POST, Method::DELETE]);

    let app = routes()
        .with_state(AppState::new().expect("Failed creating app state"))
        .layer(cors);

    // run it
    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    println!("listening on {}", addr);
    axum::serve(listener, app.into_make_service())
        .await
        .unwrap();
}
