import json

from aiocoap import Code, Message, resource


class TelemetryResource(resource.Resource):
    async def render_post(self, request):
        print("=== COAP TELEMETRY RECEIVED ===")
        print(request.payload.decode("utf-8"))

        return Message(
            code=Code.CHANGED,
            payload=json.dumps({
                "status": "received"
            }).encode("utf-8")
        )

