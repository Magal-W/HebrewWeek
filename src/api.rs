use crate::hebrew_db::HebrewDb;
use axum::{
    extract::State,
    response::{Html, IntoResponse},
    Json,
};
use rusqlite::Result;
use std::sync::{Arc, Mutex};

#[derive(Clone, Debug)]
pub struct AppState {
    db: Arc<Mutex<HebrewDb>>,
}

impl AppState {
    pub fn new() -> Result<Self> {
        Ok(Self {
            db: Arc::new(Mutex::new(HebrewDb::new()?)),
        })
    }
}

pub async fn handler() -> Html<&'static str> {
    Html("<h1>Hello, World!</h1>")
}

pub async fn get_mistakes(State(state): State<AppState>) -> impl IntoResponse {
    Json(state.db.lock().unwrap().mistaken_words().unwrap())
}
