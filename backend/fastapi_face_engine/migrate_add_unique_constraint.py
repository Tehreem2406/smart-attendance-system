# Script to add unique constraint to marks table
from database import engine, SessionLocal
from sqlalchemy import text

def migrate():
    db = SessionLocal()
    try:
        # First, check if the constraint already exists
        with engine.connect() as conn:
            # For SQLite, check if the index exists
            result = conn.execute(text("PRAGMA index_list(marks)"))
            indexes = [row[1] for row in result.fetchall()]
        
        if "_mark_uc" not in indexes:
            print("Adding unique constraint to marks table...")
            # SQLite requires recreating the table to add a unique constraint
            with engine.connect() as conn:
                # Begin transaction
                trans = conn.begin()
                try:
                    # 1. Create a new table with the unique constraint
                    conn.execute(text("""
                        CREATE TABLE marks_new (
                            id INTEGER NOT NULL,
                            student_username VARCHAR,
                            class_id INTEGER,
                            type VARCHAR,
                            item_no INTEGER,
                            score INTEGER NOT NULL,
                            total INTEGER NOT NULL,
                            PRIMARY KEY (id),
                            UNIQUE (student_username, class_id, type, item_no)
                        )
                    """))
                    
                    # 2. Copy data from old table to new table
                    conn.execute(text("""
                        INSERT INTO marks_new 
                        SELECT id, student_username, class_id, type, item_no, score, total 
                        FROM marks
                    """))
                    
                    # 3. Drop old table
                    conn.execute(text("DROP TABLE marks"))
                    
                    # 4. Rename new table to original name
                    conn.execute(text("ALTER TABLE marks_new RENAME TO marks"))
                    
                    # 5. Recreate indexes
                    conn.execute(text("CREATE INDEX ix_marks_id ON marks (id)"))
                    conn.execute(text("CREATE INDEX ix_marks_student_username ON marks (student_username)"))
                    conn.execute(text("CREATE INDEX ix_marks_class_id ON marks (class_id)"))
                    
                    trans.commit()
                    print("Unique constraint added successfully!")
                except Exception as e:
                    trans.rollback()
                    print(f"Error during migration: {e}")
                    raise
        else:
            print("Unique constraint already exists!")
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
