"""
app/core/permissions.py

Role-Based Access Control (RBAC) permissions mappings.
"""
from enum import Enum
from typing import List

class Role(str, Enum):
    SUPER_ADMIN = "Super Admin"
    ORG_ADMIN = "Org Admin"
    OPERATOR = "Operator"
    VIEWER = "Viewer"

ROLE_PERMISSIONS: dict[Role, List[str]] = {
    Role.SUPER_ADMIN: ["*"], # Super Admin has all permissions
    Role.ORG_ADMIN: [
        "user:create",
        "user:read",
        "user:update",
        "user:delete",
        "organization:read",
        "organization:update",
        "project:create",
        "project:read",
        "project:update",
        "project:delete",
        "view:telemetry",
        "ack:alerts",
        "view:dashboards",
        "view:projects",
        "view:gateways",
        "view:devices",
        "view:sensors"
    ],
    Role.OPERATOR: [
        "user:read",
        "view:telemetry",
        "ack:alerts",
        "view:dashboards",
        "view:projects",
        "view:gateways",
        "view:devices",
        "view:sensors",
        "create:devices",
        "edit:devices",
        "create:sensors",
        "edit:sensors",
        "create:rules",
        "edit:rules"
    ],
    Role.VIEWER: [
        "view:dashboards",
        "view:telemetry",
        "view:alerts"
    ]
}

def has_permission(user_role: str, required_permission: str) -> bool:
    if not user_role:
        return False
        
    try:
        role = Role(user_role)
    except ValueError:
        return False

    permissions = ROLE_PERMISSIONS.get(role, [])
    
    if "*" in permissions:
        return True
        
    return required_permission in permissions
