use serde_derive::Deserialize;
use serde_derive::Serialize;
use tsync::tsync;

#[tsync]
#[derive(Debug, Deserialize)]
pub struct ReportMistake {
    pub name: String,
    pub mistake: String,
}

#[tsync]
#[derive(Debug, Serialize)]
pub struct Mistake {
    pub name: String,
    pub mistake: String,
    pub count: u32,
}
