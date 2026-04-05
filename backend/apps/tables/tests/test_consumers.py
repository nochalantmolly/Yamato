import pytest
from channels.testing import WebsocketCommunicator
from channels.layers import get_channel_layer
from config.asgi import application
from apps.tables.models import Table, TableSession


@pytest.fixture
def active_session(db):
    table = Table.objects.create(table_number=99, status='occupied')
    return TableSession.objects.create(table=table, join_code='ZZ99', status='active')


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_customer_connects_to_table_session(active_session, customer_user):
    communicator = WebsocketCommunicator(
        application, f'/ws/table/{active_session.id}/'
    )
    communicator.scope['user'] = customer_user
    connected, _ = await communicator.connect()
    assert connected
    await communicator.disconnect()


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_cart_updated_broadcast_received(active_session, customer_user):
    communicator = WebsocketCommunicator(
        application, f'/ws/table/{active_session.id}/'
    )
    communicator.scope['user'] = customer_user
    await communicator.connect()

    channel_layer = get_channel_layer()
    await channel_layer.group_send(
        f'table_session_{active_session.id}',
        {'type': 'cart.updated'},
    )

    message = await communicator.receive_json_from(timeout=3)
    assert message['type'] == 'cart_updated'
    await communicator.disconnect()
