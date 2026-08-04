import sys
import os
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.core.jwt import create_access_token
from app.modules.users.models.user import User

db = SessionLocal()
# Get super admin user
user = db.query(User).filter_by(role="Super Admin").first()
if not user:
    print("No Super Admin found!")
    sys.exit(1)

token = create_access_token(str(user.id))

import urllib.request
import urllib.error

try:
    url = "http://localhost:8000/organizations/?page=1&page_size=10"
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
    response = urllib.request.urlopen(req)
    print("Status:", response.status)
    print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTPError:", e.code)
    print(e.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
