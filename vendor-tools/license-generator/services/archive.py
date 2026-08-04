import os
import json
from datetime import datetime

def get_archive_path():
    base_dir = os.path.dirname(os.path.dirname(__file__))
    return os.path.join(base_dir, "output", "archive.json")

def load_archive() -> list:
    path = get_archive_path()
    if not os.path.exists(path):
        return []
    try:
        with open(path, "r") as f:
            return json.load(f)
    except:
        return []

def save_to_archive(license_data: dict, file_path: str):
    archive = load_archive()
    record = {
        "customer": license_data.get("customer"),
        "company": license_data.get("company"),
        "plan": license_data.get("plan"),
        "expires": license_data.get("expires"),
        "machine": license_data.get("machine"),
        "file_path": file_path,
        "issue_date": datetime.now().isoformat()
    }
    archive.append(record)
    
    with open(get_archive_path(), "w") as f:
        json.dump(archive, f, indent=2)
