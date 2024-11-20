use anyhow::{anyhow, ensure, Context, Result};
use itertools::Itertools;
use rusqlite::{named_params, Connection, Error::QueryReturnedNoRows};

use crate::types::{
    CanonicalRequest, CountedMistake, DiscardMistakeSuggestion, MistakeReport, MistakeSuggestion,
    PersonMistake, PersonMistakes, SuggestedMistake, SuggestedTranslation, Translation,
    TranslationAddition, TranslationSuggestion,
};

/// Represents a canonical representation (dictionary choice) that can be stored in "source-of-truth" tables
#[derive(Debug)]
struct CanonicalWord(pub String);

#[derive(Debug)]
pub(crate) struct HebrewDb(Connection);

impl HebrewDb {
    const DB_PATH: &'static str = "hebrew.db";

    pub fn new() -> Result<Self> {
        let db = Connection::open(Self::DB_PATH).context("Failed to connect to db")?;
        let hebrew_db = HebrewDb(db);
        hebrew_db.create_tables()?;

        Ok(hebrew_db)
    }

    pub fn is_known_word(&self, word: &str) -> Result<bool> {
        Ok(self.canonicalize(word)?.is_some())
    }

    pub fn participants(&self) -> Result<Vec<String>> {
        Ok(self
            .0
            .prepare("SELECT Name FROM Participants")?
            .query_map([], |row| row.get("Name"))?
            .collect::<Result<Vec<_>, _>>()?)
    }

    pub fn add_participant(&self, name: &str) -> Result<()> {
        self.0
            .prepare("INSERT INTO Participants VALUES(:name)")?
            .insert([name])?;
        Ok(())
    }

    pub fn all_mistakes(&self) -> Result<Vec<PersonMistakes>> {
        let mut statement = self.0.prepare("SELECT * FROM Mistakes ORDER BY Name")?;
        let mistakes_group = statement
            .query_map([], |row| {
                Ok(PersonMistake {
                    name: row.get("Name")?,
                    counted_mistake: CountedMistake {
                        mistake: row.get("Mistake")?,
                        count: row.get("Count")?,
                    },
                })
            })?
            .collect::<Result<Vec<_>, _>>()?
            .into_iter()
            .chunk_by(|element| element.name.clone());
        let mistakes = mistakes_group
            .into_iter()
            .map(|(key, group)| PersonMistakes {
                name: key,
                counted_mistakes: group.map(|mis| mis.counted_mistake).collect(),
            })
            .collect();
        Ok(mistakes)
    }

    pub fn mistakes(&self, name: &str) -> Result<PersonMistakes> {
        let mut statement = self
            .0
            .prepare("SELECT * FROM Mistakes WHERE Name = :name")?;
        let mistakes = statement
            .query_map(named_params! {":name": name}, |row| {
                Ok(CountedMistake {
                    mistake: row.get("Mistake")?,
                    count: row.get("Count")?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(PersonMistakes {
            name: name.to_owned(),
            counted_mistakes: mistakes,
        })
    }

    pub fn report_mistake(&self, report: MistakeReport) -> Result<PersonMistake> {
        let name = &report.name;
        let mistake = self.canonicalize(&report.mistake)?;

        match mistake {
            Some(mistake) => self.report_mistake_canonical(mistake, name),
            None => Err(unknown_word_err(&report.mistake)),
        }
    }

    pub fn suggest_mistake(&self, suggestion: SuggestedMistake) -> Result<i64> {
        self.0
            .prepare(
                "INSERT INTO MistakesSuggestions VALUES(:name, :mistake, :context, :reporter)",
            )?
            .insert([
                suggestion.mistake.name,
                suggestion.mistake.mistake,
                suggestion.mistake.context,
                suggestion.reporter,
            ])
            .map_err(|err| err.into())
    }

    pub fn suggest_translation(&self, suggestion: SuggestedTranslation) -> Result<i64> {
        self.0
            .prepare("INSERT INTO TranslationsSuggestions VALUES(:english, :hebrew, :suggestor)")?
            .insert([
                suggestion.translation.english,
                suggestion.translation.hebrew,
                suggestion.suggestor,
            ])
            .map_err(|err| err.into())
    }

    pub fn all_translations(&self) -> Result<Vec<Translation>> {
        let mut statement = self.0.prepare("SELECT * FROM Translations")?;
        let translations = statement
            .query_map([], |row| {
                Ok(Translation {
                    english: row.get("English")?,
                    hebrew: row.get("Hebrew")?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(translations)
    }

    pub fn add_translation(&self, translation: TranslationAddition) -> Result<()> {
        let canonical = self.canonicalize(&translation.translation.english)?;
        match canonical {
            Some(canonical) => self.add_translation_canonical(
                canonical,
                &translation.translation.hebrew,
                &translation.suggestor,
            ),
            None => Err(unknown_word_err(&translation.translation.english)),
        }
    }

    pub fn translate(&self, english: &str) -> Result<Vec<String>> {
        let canonical = self.canonicalize(english)?;
        match canonical {
            Some(canonical) => self.translate_canonical(canonical),
            None => Ok(vec![]),
        }
    }

    pub fn discard_mistake_suggestion(&self, suggestion: DiscardMistakeSuggestion) -> Result<()> {
        let suggested_mistake: SuggestedMistake = self
            .0
            .prepare("SELECT * FROM MistakesSuggestions WHERE ROWID = :id")?
            .query_row([suggestion.id], |row| {
                Ok(SuggestedMistake {
                    mistake: MistakeSuggestion {
                        id: suggestion.id,
                        name: row.get("Name")?,
                        mistake: row.get("Mistake")?,
                        context: row.get("Context")?,
                    },
                    reporter: row.get("Reporter")?,
                })
            })?;
        ensure!(
            self.0
                .prepare("DELETE FROM MistakesSuggestions WHERE ROWID = :id")?
                .execute([suggestion.id])?
                == 1,
            format!(
                "Failed to delete mistake suggestion with id {}",
                suggestion.id
            )
        );
        let params = named_params! {
            ":name": suggested_mistake.mistake.name,
             ":mistake":suggested_mistake.mistake.mistake,
             ":context":suggested_mistake.mistake.context,
             ":reporter": suggested_mistake.reporter,
             ":accepted": suggestion.accepted
        };
        self.0
            .prepare("INSERT INTO MistakesSuggestionsArchive VALUES(:name, :mistake, :context, :reporter, :accepted)")?
            .insert(params)?;
        Ok(())
    }

    pub fn discard_translation_suggestion(&self, suggestion_id: i64) -> Result<()> {
        ensure!(
            self.0
                .prepare("DELETE FROM TranslationsSuggestions WHERE ROWID = :id")?
                .execute([suggestion_id])?
                == 1,
            format!("Failed to delete mistake suggestion with id {suggestion_id}")
        );
        Ok(())
    }

    pub fn all_mistake_suggestions(&self) -> Result<Vec<SuggestedMistake>> {
        self.0
            .prepare("SELECT ROWID,* FROM MistakesSuggestions")?
            .query_map([], |row| {
                Ok(SuggestedMistake {
                    mistake: MistakeSuggestion {
                        id: row.get("ROWID")?,
                        name: row.get("Name")?,
                        mistake: row.get("Mistake")?,
                        context: row.get("Context")?,
                    },
                    reporter: row.get("Reporter")?,
                })
            })?
            .try_collect()
            .map_err(|err| err.into())
    }

    pub fn all_translation_suggestions(&self) -> Result<Vec<SuggestedTranslation>> {
        self.0
            .prepare("SELECT ROWID,* FROM TranslationsSuggestions")?
            .query_map([], |row| {
                Ok(SuggestedTranslation {
                    translation: TranslationSuggestion {
                        id: row.get("ROWID")?,
                        english: row.get("English")?,
                        hebrew: row.get("Hebrew")?,
                    },
                    suggestor: row.get("Suggestor")?,
                })
            })?
            .try_collect()
            .map_err(|err| err.into())
    }

    pub fn add_canonical(&self, request: CanonicalRequest) -> Result<()> {
        self.add_canonical_imp(&request)?;

        let tertiary_request = CanonicalRequest {
            word: request.canonical.clone(),
            canonical: request.canonical.clone(),
        };
        self.add_canonical_imp(&tertiary_request)?;
        Ok(())
    }

    fn add_canonical_imp(&self, request: &CanonicalRequest) -> Result<()> {
        let rows_changed = self
            .0
            .prepare("INSERT OR REPLACE INTO CanonicalWords VALUES(:word, :canonical)")?
            .execute([&request.word.to_lowercase(), &request.canonical])?;
        ensure!(
            rows_changed == 1 || rows_changed == 2,
            format!(
                "Couldn't insert canonicalization of {} as {}",
                request.word, request.canonical
            )
        );
        Ok(())
    }

    pub fn canonicalize_word(&self, word: &str) -> Result<String> {
        let canonical = self.canonicalize(word)?;
        match canonical {
            Some(w) => Ok(w.0),
            None => Err(unknown_word_err(word)),
        }
    }

    /// The canonical (he-he) and only(!) way to create a `CanonicalWord`
    fn canonicalize(&self, word: &str) -> Result<Option<CanonicalWord>> {
        match self
            .0
            .prepare("SELECT Canonical FROM CanonicalWords WHERE Word = :word")?
            .query_row([word.to_lowercase()], |row| {
                Ok(CanonicalWord(row.get("Canonical")?))
            }) {
            Ok(canonical) => Ok(Some(canonical)),
            Err(QueryReturnedNoRows) => Ok(None),
            Err(err) => Err(err.into()),
        }
    }

    fn create_tables(&self) -> Result<()> {
        Self::create_table(&self.0, "Participants", [("Name", DbFieldType::String)], [])?;
        Self::create_table(
            &self.0,
            "Mistakes",
            [
                ("Name", DbFieldType::String),
                ("Mistake", DbFieldType::String),
            ],
            [("Count", DbFieldType::Int)],
        )?;
        Self::create_table(
            &self.0,
            "MistakesSuggestions",
            [],
            [
                ("Name", DbFieldType::String),
                ("Mistake", DbFieldType::String),
                ("Context", DbFieldType::String),
                ("Reporter", DbFieldType::String),
            ],
        )?;
        Self::create_table(
            &self.0,
            "MistakesSuggestionsArchive",
            [],
            [
                ("Name", DbFieldType::String),
                ("Mistake", DbFieldType::String),
                ("Context", DbFieldType::String),
                ("Reporter", DbFieldType::String),
                ("Accepted", DbFieldType::Int),
            ],
        )?;
        Self::create_table(
            &self.0,
            "Translations",
            [
                ("English", DbFieldType::String),
                ("Hebrew", DbFieldType::String),
            ],
            [("Suggestor", DbFieldType::String)],
        )?;
        Self::create_table(
            &self.0,
            "TranslationsSuggestions",
            [
                ("English", DbFieldType::String),
                ("Hebrew", DbFieldType::String),
            ],
            [("Suggestor", DbFieldType::String)],
        )?;
        Self::create_table(
            &self.0,
            "CanonicalWords",
            [("Word", DbFieldType::String)],
            [("Canonical", DbFieldType::String)],
        )?;
        Ok(())
    }

    fn create_table<
        IUnique: IntoIterator<Item = (&'static str, DbFieldType)> + Copy,
        IOther: IntoIterator<Item = (&'static str, DbFieldType)>,
    >(
        db: &Connection,
        table_name: &str,
        unique_fields: IUnique,
        other_fields: IOther,
    ) -> Result<()> {
        let fields = unique_fields
            .into_iter()
            .chain(other_fields)
            .map(|(name, field_type)| format!("{} {}", name, field_type.to_type_string()))
            .collect::<Vec<String>>()
            .join(",\n");
        let constraint = if unique_fields.into_iter().peekable().peek().is_some() {
            format!(
                ", CONSTRAINT u UNIQUE({})",
                unique_fields
                    .into_iter()
                    .map(|(name, _)| name.to_owned())
                    .join(", ")
            )
        } else {
            String::from("")
        };
        let table_query =
            format!("CREATE TABLE IF NOT EXISTS {table_name} ({fields}{constraint});");
        db.execute(&table_query, ())
            .context(format!("Failed creating table {table_name}"))?;
        Ok(())
    }

    fn report_mistake_canonical(
        &self,
        mistake: CanonicalWord,
        name: &str,
    ) -> Result<PersonMistake> {
        let mistake = mistake.0;
        let params = named_params! {":name": name, ":mistake": mistake};

        let mut upsert_statement = self.0.prepare(
            "INSERT INTO Mistakes VALUES(:name, :mistake, 1)
             ON CONFLICT(Name, Mistake) DO UPDATE SET Count = Count + 1",
        )?;

        let rows_changed = upsert_statement.execute(params)?;
        ensure!(
            rows_changed == 1,
            format!("Failed to report mistake {mistake} of {name}")
        );

        let mut select_stmt = self
            .0
            .prepare("SELECT * FROM Mistakes WHERE Name = :name AND Mistake = :mistake")?;
        select_stmt
            .query_row(params, |row| {
                Ok(PersonMistake {
                    name: name.to_owned(),
                    counted_mistake: CountedMistake {
                        mistake: mistake.to_owned(),
                        count: row.get("Count")?,
                    },
                })
            })
            .map_err(|err| err.into())
    }

    fn add_translation_canonical(
        &self,
        english: CanonicalWord,
        hebrew: &str,
        suggestor: &str,
    ) -> Result<()> {
        let rows_changed = self
            .0
            .prepare("INSERT OR REPLACE INTO Translations VALUES(:english, :hebrew, :suggestor)")?
            .execute([&english.0, hebrew, suggestor])?;
        ensure!(
            rows_changed == 1 || rows_changed == 2,
            format!("Failed to add translation of {} as {}", english.0, hebrew)
        );
        Ok(())
    }

    fn translate_canonical(&self, canonical: CanonicalWord) -> Result<Vec<String>> {
        Ok(self
            .0
            .prepare("SELECT Hebrew FROM Translations WHERE English = :english")?
            .query_map([canonical.0], |row| row.get(0))?
            .collect::<Result<Vec<_>, _>>()?)
    }
}

fn unknown_word_err(word: &str) -> anyhow::Error {
    anyhow!(format!("{} is an unknown word!", word))
}

#[derive(Debug, Clone, Copy)]
enum DbFieldType {
    Int,
    String,
}

impl DbFieldType {
    pub fn to_type_string(self) -> &'static str {
        match self {
            Self::Int => "int",
            Self::String => "varchar(40)",
        }
    }
}
