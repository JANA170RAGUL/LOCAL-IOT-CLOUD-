"""
app/modules/channels/dependencies.py

FastAPI ``Depends()`` helpers scoped to the Channel module.
"""

from __future__ import annotations

# from app.modules.channels.services.channel_service import ChannelService  # noqa: E501
# Uncomment the import above once the service class is implemented.


def get_channel_service():  # type: ignore[return]
    """
    Provide a ``ChannelService`` instance.
    Uncomment the body once the service class is implemented.
    """
    # return ChannelService()
    raise NotImplementedError("ChannelService is not yet implemented.")
