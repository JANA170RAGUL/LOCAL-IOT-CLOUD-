import sys
import os
from pathlib import Path

# Add backend to path so we can import app modules
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database.session import SessionLocal
from app.modules.organizations.models.organization import Organization
from app.modules.tenants.models.tenant import Tenant
from app.modules.projects.models.project import Project
from app.modules.gateways.models.gateway import Gateway
from app.modules.devices.models.device import Device
from app.modules.sensors.models.sensor import Sensor
from app.modules.dashboards.models.dashboard import Dashboard
from app.modules.widgets.models.widget import Widget
from app.modules.rules.models.rule import Rule
from app.modules.alerts.models.alert import Alert
from app.modules.users.models.user import User
from app.core.password import hash_password

def seed_users():
    db = SessionLocal()
    try:
        users_to_seed = [
            {
                "email": "admin@localiot.com",
                "first_name": "Super",
                "last_name": "Admin",
                "password": "Password@123",
                "role": "Admin",
            },

        ]

        for u in users_to_seed:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if existing:
                print(f"User {u['email']} already exists. Skipping.")
                continue

            pw = u.pop("password")
            user = User(
                **u,
                password_hash=hash_password(pw)
            )
            db.add(user)
            print(f"Created user: {u['email']} with role {u['role']}")
        
        db.commit()
        print("User seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding users: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()
