use serde_derive::Deserialize;
use serde_derive::Serialize;
use tsync::tsync;

#[tsync]
#[derive(Debug, Serialize, Deserialize)]
pub struct MistakeReport {
    pub name: String,
    pub mistake: String,
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
