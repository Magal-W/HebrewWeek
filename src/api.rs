use crate::error::AppError;
use crate::hebrew_db::HebrewDb;
use crate::types::{MistakeReport, Translation};
use axum::extract::Path;
use axum::response::IntoResponse;
use axum::{extract::State, Json};
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
        .route("/mistakes", get(all_mistakes).post(report_mistake))
        .route("/mistakes/:name", get(mistakes))
        .route("/translations", get(all_translations).post(add_translation))
        .route("/translate/:english", get(translate))
        .route("/known/:word", get(is_known_word))
}

#[instrument(skip(state), err)]
pub async fn is_known_word(
    State(state): State<AppState>,
    Path(word): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    Ok(Json(state.db.lock().unwrap().is_known_word(&word)?))
}

#[instrument(skip(state), err)]
pub async fn all_mistakes(State(state): State<AppState>) -> Result<impl IntoResponse, AppError> {
    Ok(Json(state.db.lock().unwrap().all_mistakes()?))
}

#[instrument(skip(state), err)]
pub async fn mistakes(
    State(state): State<AppState>,
    Path(name): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    Ok(Json(state.db.lock().unwrap().mistakes(&name)?))
}

#[instrument(skip(state), err)]
pub async fn report_mistake(
    State(state): State<AppState>,
    Json(payload): Json<MistakeReport>,
) -> Result<impl IntoResponse, AppError> {
    Ok(Json(state.db.lock().unwrap().report_mistake(payload)?))
}

#[instrument(skip(state), err)]
pub async fn all_translations(
    State(state): State<AppState>,
) -> Result<impl IntoResponse, AppError> {
    Ok(Json(state.db.lock().unwrap().all_translations()?))
}

#[instrument(skip(state), err)]
pub async fn add_translation(
    State(state): State<AppState>,
    Json(payload): Json<Translation>,
) -> Result<impl IntoResponse, AppError> {
    state.db.lock().unwrap().add_translation(payload)?;
    Ok(())
}

#[instrument(skip(state), err)]
pub async fn translate(
    State(state): State<AppState>,
    Path(english): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    Ok(Json(state.db.lock().unwrap().translate(&english)?))
}
