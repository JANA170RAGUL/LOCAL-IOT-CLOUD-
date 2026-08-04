import sys
from pathlib import Path
from sqlalchemy import text, MetaData
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database.session import engine
from scripts.seed_users import seed_users

def clear_db():
    metadata = MetaData()
    metadata.reflect(bind=engine)
    
    with engine.begin() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
        for table_name in metadata.tables:
            if table_name != "alembic_version":
                conn.execute(text(f"TRUNCATE TABLE {table_name};"))
                print(f"Truncated {table_name}")
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
        
    print("All tables truncated successfully.")
    
    print("Re-seeding super admin...")
    seed_users()

if __name__ == "__main__":
    clear_db()
