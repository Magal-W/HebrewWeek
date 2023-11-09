use crate::error::AppError;
use crate::hebrew_db::HebrewDb;
use axum::{extract::State, response::Html, Json};
use std::sync::{Arc, Mutex};

#[derive(Clone, Debug)]
pub struct AppState {
    db: Arc<Mutex<HebrewDb>>,
}

impl AppState {
    pub fn new() -> Result<Self, AppError> {
        Ok(Self {
            db: Arc::new(Mutex::new(HebrewDb::new()?)),
        })
    }
}

pub async fn home_page() -> Html<&'static str> {
    Html("<h1>Hello, World!</h1>")
}

pub async fn mistakes(State(state): State<AppState>) -> Result<Json<Vec<String>>, AppError> {
    Ok(Json(state.db.lock().unwrap().mistaken_words()?))
}
