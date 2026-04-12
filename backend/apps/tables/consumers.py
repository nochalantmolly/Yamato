import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import TableSession


class TableConsumer(AsyncWebsocketConsumer):
    """
    Customers connect to ws/table/{session_id}/.
    Receives 'cart_updated' broadcasts and forwards them to the client.
    The client then re-fetches cart data via REST.
    """

    async def connect(self):
        self.session_id = self.scope['url_route']['kwargs']['session_id']
        self.group_name = f'table_session_{self.session_id}'

        # Validate JWT from query string if user not set by middleware
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            user = await self._get_user_from_token()
        if not user:
            await self.close()
            return

        session_exists = await self._session_is_active(self.session_id)
        if not session_exists:
            await self.close()
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    # Called by channel_layer.group_send with type='cart.updated'
    async def cart_updated(self, event):
        await self.send(text_data=json.dumps({'type': 'cart_updated'}))

    @database_sync_to_async
    def _session_is_active(self, session_id):
        return TableSession.objects.filter(id=session_id, status='active').exists()

    @database_sync_to_async
    def _get_user_from_token(self):
        from rest_framework_simplejwt.tokens import AccessToken
        from apps.users.models import User
        qs = self.scope.get('query_string', b'').decode()
        for part in qs.split('&'):
            if part.startswith('token='):
                token_str = part[6:]
                try:
                    token = AccessToken(token_str)
                    return User.objects.get(id=token['user_id'])
                except Exception:
                    return None
        return None


class StaffOrderConsumer(AsyncWebsocketConsumer):
    """
    Staff connect to ws/orders/.
    Receives 'order_created' broadcasts when a customer submits an order.
    """

    GROUP_NAME = 'staff_orders'

    async def connect(self):
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            user = await self._get_user_from_token()
        if not user or user.role not in ('staff', 'admin'):
            await self.close()
            return
        await self.channel_layer.group_add(self.GROUP_NAME, self.channel_name)
        self._joined_staff_group = True
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, '_joined_staff_group'):
            await self.channel_layer.group_discard(self.GROUP_NAME, self.channel_name)

    # Called by channel_layer.group_send with type='order.created'
    async def order_created(self, event):
        await self.send(text_data=json.dumps({'type': 'order_created'}))

    @database_sync_to_async
    def _get_user_from_token(self):
        from rest_framework_simplejwt.tokens import AccessToken
        from apps.users.models import User
        qs = self.scope.get('query_string', b'').decode()
        for part in qs.split('&'):
            if part.startswith('token='):
                token_str = part[6:]
                try:
                    token = AccessToken(token_str)
                    return User.objects.get(id=token['user_id'])
                except Exception:
                    return None
        return None
