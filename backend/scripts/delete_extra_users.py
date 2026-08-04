import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database.session import SessionLocal
from app.modules.users.models.user import User

def run():
    db = SessionLocal()
    try:
        # Delete operator, viewer, developer, disabled
        emails = [
            "operator@localiot.com",
            "viewer@localiot.com",
            "developer@localiot.com",
            "disabled@localiot.com"
        ]
        
        deleted_count = db.query(User).filter(User.email.in_(emails)).delete(synchronize_session=False)
        db.commit()
        print(f"Users deleted successfully. Count: {deleted_count}")
    except Exception as e:
        db.rollback()
        print(f"Error deleting users: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run()
