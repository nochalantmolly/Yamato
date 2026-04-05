from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'^ws/table/(?P<session_id>\d+)/$', consumers.TableConsumer.as_asgi()),
    re_path(r'^ws/orders/$', consumers.StaffOrderConsumer.as_asgi()),
]
