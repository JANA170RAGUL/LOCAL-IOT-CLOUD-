from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
import os
import subprocess
from datetime import datetime
from typing import List

from app.core.auth import require_permission
from app.config.settings import settings
from app.modules.administration.schemas.backup import BackupFile, BackupCreateResponse, RestoreRequest

router = APIRouter(prefix="/admin/backups", tags=["Administration - Backup & Restore"])
admin_dep = [Depends(require_permission("system:admin"))]

BACKUP_DIR = os.path.join(os.getcwd(), "backups")

if not os.path.exists(BACKUP_DIR):
    os.makedirs(BACKUP_DIR, exist_ok=True)

def parse_db_url(url: str):
    # Simplistic parser for mysql+pymysql://user:pass@host:port/dbname
    if not url.startswith("mysql"):
        return None
    try:
        parts = url.split("://")[1].split("@")
        credentials = parts[0].split(":")
        user = credentials[0]
        password = credentials[1] if len(credentials) > 1 else ""
        
        host_db = parts[1].split("/")
        host_port = host_db[0].split(":")
        host = host_port[0]
        port = host_port[1] if len(host_port) > 1 else "3306"
        db = host_db[1].split("?")[0]
        
        return {"user": user, "password": password, "host": host, "port": port, "db": db}
    except Exception:
        return None

def run_backup_task(filename: str):
    db_info = parse_db_url(settings.database_url)
    if not db_info:
        return # Skip if not MySQL
        
    filepath = os.path.join(BACKUP_DIR, filename)
    cmd = [
        "mysqldump",
        f"-u{db_info['user']}",
        f"-h{db_info['host']}",
        f"-P{db_info['port']}",
        db_info['db']
    ]
    if db_info['password']:
        cmd.insert(2, f"-p{db_info['password']}")
        
    try:
        with open(filepath, "w") as f:
            subprocess.run(cmd, stdout=f, check=True)
    except Exception as e:
        print(f"Backup failed: {e}")

@router.post("/", response_model=BackupCreateResponse, dependencies=admin_dep, summary="22.9 Create Backup")
def create_backup(background_tasks: BackgroundTasks):
    db_info = parse_db_url(settings.database_url)
    if not db_info:
        raise HTTPException(status_code=400, detail="Database backup only supported for MySQL in this setup.")
        
    filename = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sql"
    background_tasks.add_task(run_backup_task, filename)
    
    return {"message": "Backup started in the background", "filename": filename}

@router.get("/", response_model=List[BackupFile], dependencies=admin_dep, summary="22.9 List Backups")
def list_backups():
    files = []
    if os.path.exists(BACKUP_DIR):
        for f in os.listdir(BACKUP_DIR):
            if f.endswith(".sql"):
                path = os.path.join(BACKUP_DIR, f)
                stat = os.stat(path)
                files.append(BackupFile(
                    filename=f,
                    size_mb=stat.st_size / (1024 * 1024),
                    created_at=datetime.fromtimestamp(stat.st_ctime)
                ))
    # Sort descending
    files.sort(key=lambda x: x.created_at, reverse=True)
    return files

@router.post("/restore", dependencies=admin_dep, summary="22.10 Restore Database")
def restore_backup(payload: RestoreRequest):
    safe_filename = os.path.basename(payload.filename)
    filepath = os.path.join(BACKUP_DIR, safe_filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Backup file not found")
        
    db_info = parse_db_url(settings.database_url)
    if not db_info:
        raise HTTPException(status_code=400, detail="Database restore only supported for MySQL in this setup.")
        
    cmd = [
        "mysql",
        f"-u{db_info['user']}",
        f"-h{db_info['host']}",
        f"-P{db_info['port']}",
        db_info['db']
    ]
    if db_info['password']:
        cmd.insert(2, f"-p{db_info['password']}")
        
    try:
        with open(filepath, "r") as f:
            subprocess.run(cmd, stdin=f, check=True)
        return {"message": f"Database restored successfully from {payload.filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Restore failed: {str(e)}")
