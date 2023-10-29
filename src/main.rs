mod hebrew_db;

use hebrew_db::HebrewDb;
use rusqlite::Result;

fn main() -> Result<()> {
    let data = HebrewDb::new()?;
    Ok(())
}
