"""
app/modules/assets/dependencies.py

FastAPI ``Depends()`` helpers scoped to the Asset module.
"""

from __future__ import annotations

# from app.modules.assets.services.asset_service import AssetService  # noqa: E501
# Uncomment the import above once the service class is implemented.


def get_asset_service():  # type: ignore[return]
    """
    Provide a ``AssetService`` instance.
    Uncomment the body once the service class is implemented.
    """
    # return AssetService()
    raise NotImplementedError("AssetService is not yet implemented.")
