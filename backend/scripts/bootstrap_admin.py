import sys
import os
import argparse
import getpass
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database.session import SessionLocal
from app.modules.users.models.user import User
from app.core.password import hash_password


def main():
    parser = argparse.ArgumentParser(description="One-time Production Super Admin Bootstrap CLI")
    parser.add_argument("--email", type=str, help="Super Admin email address")
    parser.add_argument("--password", type=str, help="Super Admin password")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        # Check if Super Admin already exists
        existing = db.query(User).filter(
            User.role.in_(["Super Admin", "SUPER_ADMIN", "ADMIN"])
        ).first()

        if existing:
            print("Super Admin already exists. Bootstrap refused.")
            sys.exit(0)

        email = args.email
        if not email:
            email = input("Enter Super Admin email: ").strip()

        if not email or "@" not in email:
            print("Error: Invalid email address provided.")
            sys.exit(1)

        password = args.password
        if not password:
            password = getpass.getpass("Enter Super Admin password (min 12 chars): ")
            confirm = getpass.getpass("Confirm password: ")
            if password != confirm:
                print("Error: Passwords do not match.")
                sys.exit(1)

        if len(password) < 12:
            print("Error: Password must be at least 12 characters long.")
            sys.exit(1)

        admin_user = User(
            email=email.strip().lower(),
            first_name="Super",
            last_name="Admin",
            password_hash=hash_password(password),
            role="Super Admin",
            status="ACTIVE",
            is_active=True,
            is_verified=True,
        )

        db.add(admin_user)
        db.commit()
        print(f"Super Admin user '{email}' created successfully.")

    except Exception as e:
        db.rollback()
        print(f"Error executing bootstrap: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
