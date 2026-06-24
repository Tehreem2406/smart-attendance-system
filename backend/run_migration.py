import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from fastapi_face_engine.database import DB_PATH
import sqlite3

print(f"Using database: {DB_PATH}")
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# First, check what tables exist
print("\nTables in database:")
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = [row[0] for row in cursor.fetchall()]
for t in tables:
    print(f"  - {t}")

# Step 1: Check if ledger_entries exists, if not, it will be created automatically later!
if "ledger_entries" not in tables:
    print("\nledger_entries table doesn't exist yet, no migration needed for columns!")
else:
    print("\nChecking columns in ledger_entries...")
    cursor.execute("PRAGMA table_info(ledger_entries)")
    cols = [row[1] for row in cursor.fetchall()]
    print(f"Current columns: {cols}")
    if "attachment_url" not in cols:
        try:
            cursor.execute("ALTER TABLE ledger_entries ADD COLUMN attachment_url TEXT")
            print("✓ Added attachment_url to ledger_entries")
        except Exception as e:
            print(f"Note: {e}")
    else:
        print("✓ attachment_url already present")

# Step 2: Create budgets table
if "budgets" not in tables:
    print("\nCreating budgets table...")
    cursor.execute("""
        CREATE TABLE budgets (
            id INTEGER PRIMARY KEY,
            category TEXT,
            limit_amount INTEGER,
            current_spent INTEGER DEFAULT 0,
            month INTEGER,
            year INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    # Add indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_budgets_category ON budgets (category)")
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_budgets_id ON budgets (id)")
    print("✓ Created budgets table")
else:
    print("\nbudgets table already exists!")

conn.commit()
conn.close()
print("\n✅ All migrations complete!")
