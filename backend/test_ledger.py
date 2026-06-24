# test_ledger.py
from fastapi_face_engine import models, crud, schemas
from fastapi_face_engine.database import SessionLocal, engine
from sqlalchemy.orm import Session

models.Base.metadata.create_all(bind=engine)

print("Testing database connection...")
db: Session = SessionLocal()
try:
    print("Testing get_ledger_entries...")
    entries = crud.get_ledger_entries(db)
    print(f"Found {len(entries)} entries!")
    
    print("Testing getLedgerStats...")
    stats = crud.getLedgerStats(db)
    print(f"Stats: {stats}")
    
    print("Everything is OK!")
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
    import traceback
    print(f"Traceback:\n{traceback.format_exc()}")
finally:
    db.close()
