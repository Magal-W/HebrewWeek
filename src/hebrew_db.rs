use rusqlite::{Connection, Result};

#[derive(Debug)]
pub(crate) struct HebrewDb(Connection);

impl HebrewDb {
    const DB_PATH: &str = "hebrew.db";

    pub fn new() -> Result<Self> {
        let db = Connection::open(Self::DB_PATH)?;
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
        db.execute(&table_query, ())?;
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
