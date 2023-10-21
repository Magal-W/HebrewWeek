use rusqlite::{Connection, Result};

fn create_tables(db: &Connection) -> Result<()> {
    db.execute(
        "CREATE TABLE IF NOT EXISTS mistakes (
            name int,
            mistake varchar(40),
            count int
        );",
        (),
    )?;
    db.execute(
        "CREATE TABLE IF NOT EXISTS translations (
            english varchar(40),
            hebrew varchar(40)
        );",
        (),
    )?;
    db.execute(
        "CREATE TABLE IF NOT EXISTS translations_suggestions (
            english varchar(40),
            hebrew varchar(40)
        );",
        (),
    )?;
    Ok(())
}

fn main() -> Result<()> {
    let db = Connection::open("hebrew.db")?;
    create_tables(&db)?;
    Ok(())
}
