from dataclasses import dataclass

from fastapi import Depends, HTTPException, status

from app.core.auth import get_current_user
from app.core.permissions import Role
from app.modules.users.models.user import User


@dataclass(frozen=True)
class AccessScope:
    """
    Describes which part of the platform a logged-in user may access.

    Super Admin:
        is_global=True

    Org Admin:
        organization_id=<their organization>
        tenant_id=None

    Operator / Viewer:
        organization_id=<their organization>
        tenant_id=<their assigned tenant>
    """

    is_global: bool
    organization_id: str | None
    tenant_id: str | None
    role: str


def get_access_scope(
    current_user: User = Depends(get_current_user),
) -> AccessScope:

    # ---------------------------------------------------------
    # Super Admin has platform-wide access
    # ---------------------------------------------------------
    if current_user.role == Role.SUPER_ADMIN.value:
        return AccessScope(
            is_global=True,
            organization_id=None,
            tenant_id=None,
            role=str(current_user.role),
        )

    # ---------------------------------------------------------
    # Every customer user MUST belong to an organization
    # ---------------------------------------------------------
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not assigned to an organization.",
        )

    # ---------------------------------------------------------
    # Org Admin can access the entire organization
    # ---------------------------------------------------------
    if current_user.role == Role.ORG_ADMIN.value:
        return AccessScope(
            is_global=False,
            organization_id=str(current_user.organization_id),
            tenant_id=None,
            role=str(current_user.role),
        )

    # ---------------------------------------------------------
    # Operator / Viewer must belong to a tenant
    # ---------------------------------------------------------
    if current_user.role in {
        Role.OPERATOR.value,
        Role.VIEWER.value,
    }:
        if not current_user.tenant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not assigned to a tenant.",
            )

        return AccessScope(
            is_global=False,
            organization_id=str(current_user.organization_id),
            tenant_id=str(current_user.tenant_id),
            role=str(current_user.role),
        )

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Invalid user role.",
    )