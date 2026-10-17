import sys
from pathlib import Path

# Add backend to path so we can import app modules
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database.session import SessionLocal
from sqlalchemy import text
from app.core.password import hash_password

db = SessionLocal()
try:
    admin_pw = os.getenv("ADMIN_PASSWORD", "Password@123")
    new_hash = hash_password(admin_pw)
    result = db.execute(text("UPDATE users SET password_hash = :hash, role = 'Super Admin', failed_login_attempts = 0, locked_until = NULL WHERE email = 'admin@localiot.com'"), {"hash": new_hash})
    db.commit()
    if result.rowcount > 0:
        print('Admin password re-hashed and unlocked successfully!')
    else:
        print('Admin not found!')
finally:
    db.close()
