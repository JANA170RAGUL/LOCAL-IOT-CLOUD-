import asyncio

import aiocoap.resource as resource
from aiocoap import Context

from app.modules.telemetry.coap.resource import TelemetryResource


async def main():
    root = resource.Site()

    root.add_resource(
        ["telemetry"],
        TelemetryResource()
    )

    protocol = await Context.create_server_context(
        root,
        bind=("0.0.0.0", 5683),
    )

    print("======================================")
    print("CoAP Server Started")
    print("Listening on coap://0.0.0.0:5683")
    print("Endpoint: POST /telemetry")
    print("======================================")

    try:
        await asyncio.get_running_loop().create_future()
    finally:
        await protocol.shutdown()


if __name__ == "__main__":
    asyncio.run(main())