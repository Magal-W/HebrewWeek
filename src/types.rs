use serde_derive::Deserialize;
use serde_derive::Serialize;
use tsync::tsync;

#[tsync]
pub type Mistake = String;

#[tsync]
#[derive(Debug, Serialize, Deserialize)]
pub struct MistakeReport {
    pub name: String,
    pub mistake: Mistake,
}

#[tsync]
#[derive(Debug, Serialize)]
pub struct CountedMistake {
    pub mistake: Mistake,
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
