from channels.generic.websocket import AsyncWebsocketConsumer


class TableConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.close()


class StaffOrderConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.close()
