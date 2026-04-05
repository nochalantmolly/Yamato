from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework import generics, permissions, serializers as drf_serializers, status
from rest_framework.response import Response
from .models import CartItem
from .serializers import CartItemSerializer


def broadcast_cart_updated(session_id):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'table_session_{session_id}',
        {'type': 'cart.updated'},
    )


class CartView(generics.ListAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        session_id = self.request.query_params.get('session')
        return CartItem.objects.filter(session_id=session_id).select_related('menu_item')


class CartItemListView(generics.CreateAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        menu_item = serializer.validated_data['menu_item']
        if not menu_item.is_available:
            raise drf_serializers.ValidationError('This item is currently unavailable.')
        instance = serializer.save(added_by=self.request.user)
        broadcast_cart_updated(instance.session_id)

    def create(self, request, *args, **kwargs):
        # If item already in cart, increment quantity instead
        session_id = request.data.get('session')
        menu_item_id = request.data.get('menu_item')
        existing = CartItem.objects.filter(session_id=session_id, menu_item_id=menu_item_id).first()
        if existing:
            existing.quantity += int(request.data.get('quantity', 1))
            existing.save()
            broadcast_cart_updated(session_id)
            return Response(CartItemSerializer(existing).data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)


class CartItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CartItem.objects.all()
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_update(self, serializer):
        instance = serializer.save()
        broadcast_cart_updated(instance.session_id)

    def perform_destroy(self, instance):
        session_id = instance.session_id
        instance.delete()
        broadcast_cart_updated(session_id)
