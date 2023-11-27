use crate::auth::authorize;
use crate::error::AppError;
use crate::hebrew_db::HebrewDb;
use crate::types::{
    CanonicalRequest, MistakeReport, MistakeSuggestion, PersonMistake, PersonMistakes, Translation,
    TranslationSuggestion,
};
use axum::extract::Path;
use axum::headers::authorization::Basic;
use axum::headers::Authorization;
use axum::routing::{delete, get, post};
use axum::{extract::State, Json};
use axum::{Router, TypedHeader};
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
        .route("/auth", get(auth))
        .route("/participants", get(participants).post(add_participant))
        .route("/mistakes", get(all_mistakes).post(report_mistake))
        .route("/mistakes/:name", get(mistakes))
        .route("/translations", get(all_translations).post(add_translation))
        .route("/translate/:english", get(translate))
        .route(
            "/suggest/mistakes",
            delete(discard_mistake_suggestion)
                .post(suggest_mistake)
                .get(all_mistake_suggestions),
        )
        .route(
            "/suggest/translations",
            delete(discard_translation_suggestion)
                .post(suggest_translation)
                .get(all_translation_suggestions),
        )
        .route("/known/:word", get(is_known_word))
        .route("/canonicalize", post(add_canonical))
}

#[instrument(skip(state), err)]
pub async fn is_known_word(
    State(state): State<AppState>,
    Path(word): Path<String>,
) -> Result<Json<bool>, AppError> {
    Ok(Json(state.db.lock().unwrap().is_known_word(&word)?))
}

#[instrument(skip(state), err)]
pub async fn all_mistakes(
    State(state): State<AppState>,
) -> Result<Json<Vec<PersonMistakes>>, AppError> {
    Ok(Json(state.db.lock().unwrap().all_mistakes()?))
}

#[instrument(skip(state), err)]
pub async fn mistakes(
    State(state): State<AppState>,
    Path(name): Path<String>,
) -> Result<Json<PersonMistakes>, AppError> {
    Ok(Json(state.db.lock().unwrap().mistakes(&name)?))
}

#[instrument(skip(state), err)]
pub async fn report_mistake(
    State(state): State<AppState>,
    Json(payload): Json<MistakeReport>,
) -> Result<Json<PersonMistake>, AppError> {
    Ok(Json(state.db.lock().unwrap().report_mistake(payload)?))
}

#[instrument(skip(state), err)]
pub async fn suggest_mistake(
    State(state): State<AppState>,
    Json(payload): Json<MistakeSuggestion>,
) -> Result<Json<i64>, AppError> {
    Ok(Json(state.db.lock().unwrap().suggest_mistake(payload)?))
}

#[instrument(skip(state), err)]
pub async fn all_translations(
    State(state): State<AppState>,
) -> Result<Json<Vec<Translation>>, AppError> {
    Ok(Json(state.db.lock().unwrap().all_translations()?))
}

#[instrument(skip(state), err)]
pub async fn add_translation(
    State(state): State<AppState>,
    Json(payload): Json<Translation>,
) -> Result<(), AppError> {
    state.db.lock().unwrap().add_translation(payload)?;
    Ok(())
}

#[instrument(skip(state), err)]
pub async fn suggest_translation(
    State(state): State<AppState>,
    Json(payload): Json<TranslationSuggestion>,
) -> Result<Json<i64>, AppError> {
    Ok(Json(state.db.lock().unwrap().suggest_translation(payload)?))
}

#[instrument(skip(state), err)]
pub async fn translate(
    State(state): State<AppState>,
    Path(english): Path<String>,
) -> Result<Json<Vec<String>>, AppError> {
    Ok(Json(state.db.lock().unwrap().translate(&english)?))
}

#[instrument(skip(state), err)]
pub async fn discard_mistake_suggestion(
    State(state): State<AppState>,
    Json(payload): Json<i64>,
) -> Result<(), AppError> {
    state
        .db
        .lock()
        .unwrap()
        .discard_mistake_suggestion(payload)?;
    Ok(())
}

#[instrument(skip(state), err)]
pub async fn discard_translation_suggestion(
    State(state): State<AppState>,
    Json(payload): Json<i64>,
) -> Result<(), AppError> {
    state
        .db
        .lock()
        .unwrap()
        .discard_translation_suggestion(payload)?;
    Ok(())
}

#[instrument(skip(state), err)]
pub async fn all_mistake_suggestions(
    State(state): State<AppState>,
) -> Result<Json<Vec<MistakeSuggestion>>, AppError> {
    Ok(Json(state.db.lock().unwrap().all_mistake_suggestions()?))
}

#[instrument(skip(state), err)]
pub async fn all_translation_suggestions(
    State(state): State<AppState>,
) -> Result<Json<Vec<TranslationSuggestion>>, AppError> {
    Ok(Json(
        state.db.lock().unwrap().all_translation_suggestions()?,
    ))
}

#[instrument(skip(state), err)]
pub async fn add_canonical(
    State(state): State<AppState>,
    Json(payload): Json<CanonicalRequest>,
) -> Result<(), AppError> {
    state.db.lock().unwrap().add_canonical(payload)?;
    Ok(())
}

#[instrument(skip(state), err)]
pub async fn participants(State(state): State<AppState>) -> Result<Json<Vec<String>>, AppError> {
    Ok(Json(state.db.lock().unwrap().participants()?))
}

#[instrument(skip(state), err)]
pub async fn add_participant(
    State(state): State<AppState>,
    Json(payload): Json<String>,
) -> Result<(), AppError> {
    state.db.lock().unwrap().add_participant(&payload)?;
    Ok(())
}

#[instrument]
pub async fn auth(TypedHeader(authorization): TypedHeader<Authorization<Basic>>) -> Json<bool> {
    Json(authorize(authorization.password()))
}
