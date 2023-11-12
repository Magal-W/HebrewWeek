use crate::hebrew_db::HebrewDb;
use crate::{error::AppError, types::ReportMistake};
use axum::response::IntoResponse;
use axum::{extract::State, response::Html, Json};
use axum::{routing::get, Router};
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

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(home_page))
        .route("/mistakes", get(mistakes).post(report_mistake))
}

pub async fn home_page() -> Html<&'static str> {
    Html("<h1>Hello, World!</h1>")
}

pub async fn mistakes(State(state): State<AppState>) -> Result<impl IntoResponse, AppError> {
    Ok(Json(state.db.lock().unwrap().mistaken_words()?))
}

pub async fn report_mistake(
    State(state): State<AppState>,
    Json(payload): Json<ReportMistake>,
) -> Result<impl IntoResponse, AppError> {
    eprintln!("Reported mistake {0} by {1}", payload.mistake, payload.name);
    match state.db.lock().unwrap().report_mistake(&payload) {
        Ok(ok) => Ok(Json(ok)),
        Err(err) => {
            eprintln!("Failed {err}");
            Err(err.into())
        }
    }
}
