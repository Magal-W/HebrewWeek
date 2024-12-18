use crate::auth::authorize;
use crate::error::AppError;
use crate::hebrew_db::HebrewDb;
use crate::types::{
    CanonicalRequest, DiscardMistakeSuggestion, MistakeReport, MistakeSuggestion, PersonMistake,
    PersonMistakes, SuggestedMistake, SuggestedTranslation, Translation, TranslationAddition,
    TranslationSuggestion,
};
use axum::extract::Path;
use axum::routing::{delete, get, post};
use axum::Router;
use axum::{extract::State, Json};
use axum_client_ip::XForwardedFor;
use axum_extra::headers::authorization::Basic;
use axum_extra::headers::Authorization;
use axum_extra::TypedHeader;
use std::net::IpAddr;
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
        .route("/canonicalize/:word", get(get_canonical))
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
    TypedHeader(authorization): TypedHeader<Authorization<Basic>>,
    Json(payload): Json<MistakeReport>,
) -> Result<Json<PersonMistake>, AppError> {
    authenticate(authorization).await?;
    Ok(Json(state.db.lock().unwrap().report_mistake(payload)?))
}

#[instrument(skip(state), err)]
pub async fn suggest_mistake(
    State(state): State<AppState>,
    XForwardedFor(ips): XForwardedFor,
    Json(payload): Json<MistakeSuggestion>,
) -> Result<Json<i64>, AppError> {
    let reporter = reporter(ips);
    Ok(Json(state.db.lock().unwrap().suggest_mistake(
        SuggestedMistake {
            mistake: payload,
            reporter,
        },
    )?))
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
    TypedHeader(authorization): TypedHeader<Authorization<Basic>>,
    Json(payload): Json<TranslationAddition>,
) -> Result<(), AppError> {
    authenticate(authorization).await?;
    state.db.lock().unwrap().add_translation(payload)?;
    Ok(())
}

#[instrument(skip(state), err)]
pub async fn suggest_translation(
    State(state): State<AppState>,
    XForwardedFor(ips): XForwardedFor,
    Json(payload): Json<TranslationSuggestion>,
) -> Result<Json<i64>, AppError> {
    let suggestor = reporter(ips);
    Ok(Json(state.db.lock().unwrap().suggest_translation(
        SuggestedTranslation {
            translation: payload,
            suggestor,
        },
    )?))
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
    TypedHeader(authorization): TypedHeader<Authorization<Basic>>,
    Json(payload): Json<DiscardMistakeSuggestion>,
) -> Result<(), AppError> {
    authenticate(authorization).await?;
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
    TypedHeader(authorization): TypedHeader<Authorization<Basic>>,
    Json(payload): Json<i64>,
) -> Result<(), AppError> {
    authenticate(authorization).await?;
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
) -> Result<Json<Vec<SuggestedMistake>>, AppError> {
    Ok(Json(state.db.lock().unwrap().all_mistake_suggestions()?))
}

#[instrument(skip(state), err)]
pub async fn all_translation_suggestions(
    State(state): State<AppState>,
) -> Result<Json<Vec<SuggestedTranslation>>, AppError> {
    Ok(Json(
        state.db.lock().unwrap().all_translation_suggestions()?,
    ))
}

#[instrument(skip(state), err)]
pub async fn add_canonical(
    State(state): State<AppState>,
    TypedHeader(authorization): TypedHeader<Authorization<Basic>>,
    Json(payload): Json<CanonicalRequest>,
) -> Result<(), AppError> {
    state.db.lock().unwrap().add_canonical(payload)?;
    Ok(())
}

#[instrument(skip(state), err)]
pub async fn get_canonical(
    State(state): State<AppState>,
    Path(word): Path<String>,
) -> Result<Json<String>, AppError> {
    Ok(Json(state.db.lock().unwrap().canonicalize_word(&word)?))
}

#[instrument(skip(state), err)]
pub async fn participants(State(state): State<AppState>) -> Result<Json<Vec<String>>, AppError> {
    Ok(Json(state.db.lock().unwrap().participants()?))
}

#[instrument(skip(state), err)]
pub async fn add_participant(
    State(state): State<AppState>,
    TypedHeader(authorization): TypedHeader<Authorization<Basic>>,
    Json(payload): Json<String>,
) -> Result<(), AppError> {
    authenticate(authorization).await?;
    state.db.lock().unwrap().add_participant(&payload)?;
    Ok(())
}

#[instrument]
pub async fn auth(
    TypedHeader(authorization): TypedHeader<Authorization<Basic>>,
) -> Result<Json<bool>, AppError> {
    Ok(Json(authorize(authorization.password()).await?))
}

async fn authenticate(header: Authorization<Basic>) -> Result<(), AppError> {
    if authorize(header.password()).await? {
        Ok(())
    } else {
        Err(AppError::AuthError)
    }
}

fn reporter(ips: Vec<IpAddr>) -> String {
    let ip = ips.first();
    match ip {
        None => "No IP".to_owned(),
        Some(ip) => dns_lookup::lookup_addr(ip).unwrap_or(ip.to_string()),
    }
}
