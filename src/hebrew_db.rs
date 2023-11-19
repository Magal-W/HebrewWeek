use anyhow::{anyhow, ensure, Context, Result};
use itertools::Itertools;
use rusqlite::{named_params, Connection, Error::QueryReturnedNoRows};

use crate::types::{CountedMistake, MistakeReport, PersonMistake, PersonMistakes, Translation};

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
            .group_by(|element| element.name.clone());
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

    pub fn add_translation(&self, translation: Translation) -> Result<()> {
        let canonical = self.canonicalize(&translation.english)?;
        match canonical {
            Some(canonical) => self.add_translation_canonical(canonical, &translation.hebrew),
            None => Err(unknown_word_err(&translation.english)),
        }
    }

    pub fn translate(&self, english: &str) -> Result<Option<String>> {
        let canonical = self.canonicalize(english)?;
        match canonical {
            Some(canonical) => self.translate_canonical(canonical),
            None => Ok(None),
        }
    }

    /// The canonical (he-he) and only(!) way to create a `CanonicalWord`
    fn canonicalize(&self, word: &str) -> Result<Option<CanonicalWord>> {
        match self
            .0
            .prepare("SELECT Canonical FROM CanonicalWords WHERE Word = :word")?
            .query_row([word], |row| Ok(CanonicalWord(row.get("Canonical")?)))
        {
            Ok(canonical) => Ok(Some(canonical)),
            Err(QueryReturnedNoRows) => Ok(None),
            Err(err) => Err(err.into()),
        }
    }

    fn create_tables(&self) -> Result<()> {
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
            "Translations",
            [("English", DbFieldType::String)],
            [("Hebrew", DbFieldType::String)],
        )?;
        Self::create_table(
            &self.0,
            "TranslationsSuggestions",
            [
                ("English", DbFieldType::String),
                ("Hebrew", DbFieldType::String),
            ],
            [],
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
        let constraint = format!(
            "CONSTRAINT u UNIQUE({})",
            unique_fields
                .into_iter()
                .map(|(name, _)| name.to_owned())
                .join(", ")
        );
        let table_query =
            format!("CREATE TABLE IF NOT EXISTS {table_name} ({fields}, {constraint});");
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

    fn add_translation_canonical(&self, english: CanonicalWord, hebrew: &str) -> Result<()> {
        ensure!(
            self.0
                .prepare("INSERT OR REPLACE INTO Translations VALUES(:english, :hebrew)")?
                .execute([&english.0, hebrew])?
                == 1,
            format!("Failed to add translation of {} as {}", english.0, hebrew)
        );
        Ok(())
    }

    fn translate_canonical(&self, canonical: CanonicalWord) -> Result<Option<String>> {
        match self
            .0
            .prepare("SELECT Hebrew FROM Translations WHERE English = :english")?
            .query_row([canonical.0], |row| row.get(0))
        {
            Ok(translation) => Ok(Some(translation)),
            Err(QueryReturnedNoRows) => Ok(None),
            Err(err) => Err(err.into()),
        }
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
