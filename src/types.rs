use serde_derive::Deserialize;
use serde_derive::Serialize;
use tsync::tsync;

// TODO serialize?
#[tsync]
#[derive(Debug, Serialize, Deserialize)]
pub struct MistakeReport {
    pub name: String,
    pub mistake: String,
}

#[tsync]
#[derive(Debug, Serialize, Deserialize)]
pub struct MistakeSuggestion {
    pub id: i64,
    pub name: String,
    pub mistake: String,
    pub context: String,
}

#[tsync]
#[derive(Debug, Serialize)]
pub struct SuggestedMistake {
    pub mistake: MistakeSuggestion,
    pub reporter: String,
}

#[tsync]
#[derive(Debug, Deserialize)]
pub struct DiscardMistakeSuggestion {
    pub id: i64,
    pub accepted: bool,
}

#[tsync]
#[derive(Debug, Serialize)]
pub struct CountedMistake {
    pub mistake: String,
    pub count: u32,
}

#[tsync]
#[derive(Debug, Serialize)]
pub struct PersonMistake {
    pub name: String,
    pub counted_mistake: CountedMistake,
}

#[tsync]
#[derive(Debug, Serialize)]
pub struct PersonMistakes {
    pub name: String,
    pub counted_mistakes: Vec<CountedMistake>,
}

#[tsync]
#[derive(Debug, Deserialize, Serialize)]
pub struct Translation {
    pub english: String,
    pub hebrew: String,
}

#[tsync]
#[derive(Debug, Deserialize)]
pub struct TranslationAddition {
    pub translation: Translation,
    pub suggestor: String,
}

#[tsync]
#[derive(Debug, Deserialize, Serialize)]
pub struct TranslationSuggestion {
    pub id: i64,
    pub english: String,
    pub hebrew: String,
}

#[tsync]
#[derive(Debug, Serialize)]
pub struct SuggestedTranslation {
    pub translation: TranslationSuggestion,
    pub suggestor: String,
}

#[tsync]
#[derive(Debug, Deserialize)]
pub struct CanonicalRequest {
    pub word: String,
    pub canonical: String,
}
