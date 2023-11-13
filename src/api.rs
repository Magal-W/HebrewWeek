use crate::hebrew_db::HebrewDb;
use crate::{error::AppError, types::ReportMistake};
use axum::response::IntoResponse;
use axum::{extract::State, response::Html, Json};
use axum::{routing::get, Router};
use std::sync::{Arc, Mutex};
use tracing::instrument;

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

#[instrument(skip(state), err)]
pub async fn mistakes(State(state): State<AppState>) -> Result<impl IntoResponse, AppError> {
    Ok(Json(state.db.lock().unwrap().mistaken_words()?))
}

#[instrument(skip(state), err)]
pub async fn report_mistake(
    State(state): State<AppState>,
    Json(payload): Json<ReportMistake>,
) -> Result<impl IntoResponse, AppError> {
    Ok(Json(state.db.lock().unwrap().report_mistake(&payload)?))
}
