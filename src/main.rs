mod hebrew_db;

use axum::extract::State;
use axum::{response::IntoResponse, Json};
use std::net::SocketAddr;
use std::sync::{Arc, Mutex};

use axum::{response::Html, routing::get, Router};
use hebrew_db::HebrewDb;
use rusqlite::Result;
use tokio;

#[derive(Clone, Debug)]
struct AppState {
    db: Arc<Mutex<HebrewDb>>,
}

impl AppState {
    fn new() -> Result<Self> {
        Ok(Self {
            db: Arc::new(Mutex::new(HebrewDb::new()?)),
        })
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    let app = Router::new()
        .route("/", get(handler))
        .route("/mistakes", get(get_mistakes))
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

async fn handler() -> Html<&'static str> {
    Html("<h1>Hello, World!</h1>")
}

async fn get_mistakes(State(state): State<AppState>) -> impl IntoResponse {
    Json(state.db.lock().unwrap().mistaken_words().unwrap())
}
