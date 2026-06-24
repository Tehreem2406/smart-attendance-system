# migrate_add_ledger_columns.py
from .database import engine, DB_PATH
import sqlite3

def migrate():
    print("Starting migration...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Step 1: Check and add attachment_url to ledger_entries
    try:
        cursor.execute("ALTER TABLE ledger_entries ADD COLUMN attachment_url TEXT")
        print("✓ Added attachment_url to ledger_entries")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("✓ attachment_url already exists (OK)")
        else:
            raise e
    
    # Step 2: Create budgets table if it doesn't exist
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS budgets (
                id INTEGER PRIMARY KEY,
                category TEXT,
                limit_amount INTEGER,
                current_spent INTEGER DEFAULT 0,
                month INTEGER,
                year INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✓ Created budgets table (or already exists)")
        
        # Add unique constraint on category, month, year
        try:
            cursor.execute("""
                CREATE UNIQUE INDEX IF NOT EXISTS ix_budgets_category_month_year 
                ON budgets (category, month, year)
            """)
            print("✓ Created unique index on budgets")
        except Exception as e:
            print(f"  Note: index may already exist: {e}")
    except Exception as e:
        print(f"Error creating budgets table: {e}")
        
    conn.commit()
    conn.close()
    print("✅ Migration completed successfully!")

if __name__ == "__main__":
    migrate()
