use anyhow::{anyhow, Context, Result};
use rusqlite::{named_params, Connection};

use crate::types::{Mistake, ReportMistake};

#[derive(Debug)]
pub(crate) struct HebrewDb(Connection);

impl HebrewDb {
    const DB_PATH: &str = "hebrew.db";

    pub fn new() -> Result<Self> {
        let db = Connection::open(Self::DB_PATH).context("Failed to connect to db")?;
        let hebrew_db = HebrewDb(db);
        hebrew_db.create_tables()?;

        Ok(hebrew_db)
    }

    pub fn mistaken_words(&self) -> Result<Vec<String>> {
        let mut statement = self.0.prepare("SELECT DISTINCT Mistake FROM Mistakes")?;
        let mistakes = statement
            .query_map([], |row| row.get(0))?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(mistakes)
    }

    pub fn report_mistake(&self, report: &ReportMistake) -> Result<Mistake> {
        let name = &report.name;
        let mistake = &report.mistake;
        let mut select_stmt = self
            .0
            .prepare("SELECT * FROM Mistakes WHERE Name = :name AND Mistake = :mistake")?;

        let params = named_params! {":name": name, ":mistake": mistake};
        let mut statement = if select_stmt.exists(params)? {
            self.0
                .prepare("UPDATE SET Count = Count + 1 WHERE Name = :name AND Mistake = :mistake")?
        } else {
            self.0
                .prepare("INSERT INTO Mistakes VALUES(:name, :mistake, 1)")?
        };
        let rows_changed = statement.execute(params)?;
        if rows_changed != 1 {
            return Err(anyhow!(format!(
                "Failed to report mistake {mistake} of {name}"
            )));
        }
        select_stmt
            .query_row(params, |row| {
                Ok(Mistake {
                    name: name.to_owned(),
                    mistake: mistake.to_owned(),
                    count: row.get("Count")?,
                })
            })
            .map_err(|err| err.into())
    }

    fn create_tables(&self) -> Result<()> {
        Self::create_table(
            &self.0,
            "Mistakes",
            [
                ("Name", DbFieldType::String),
                ("Mistake", DbFieldType::String),
                ("Count", DbFieldType::Int),
            ],
        )?;
        Self::create_table(
            &self.0,
            "Translations",
            [
                ("English", DbFieldType::String),
                ("Hebrew", DbFieldType::String),
            ],
        )?;
        Self::create_table(
            &self.0,
            "TranslationsSuggestions",
            [
                ("English", DbFieldType::String),
                ("Hebrew", DbFieldType::String),
            ],
        )?;
        Ok(())
    }

    fn create_table<I: IntoIterator<Item = (&'static str, DbFieldType)>>(
        db: &Connection,
        table_name: &str,
        fields: I,
    ) -> Result<()> {
        let fields = fields
            .into_iter()
            .map(|(name, field_type)| format!("{} {}", name, field_type.to_type_string()))
            .collect::<Vec<String>>()
            .join(",\n");
        let table_query = format!("CREATE TABLE IF NOT EXISTS {table_name} ({fields});");
        db.execute(&table_query, ())
            .context(format!("Failed creating table {table_name}"))?;
        Ok(())
    }
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
