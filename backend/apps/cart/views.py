from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models import F
from rest_framework import generics, permissions, serializers as drf_serializers, status
from rest_framework.response import Response
from apps.tables.models import TableSession
from .models import CartItem
from .serializers import CartItemSerializer


def broadcast_cart_updated(session_id):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'table_session_{session_id}',
        {'type': 'cart.updated'},
    )


def get_session_from_token(request):
    """Get active session from X-Session-Token header."""
    token = request.headers.get('X-Session-Token')
    if not token:
        return None
    try:
        return TableSession.objects.get(session_token=token, status='active')
    except TableSession.DoesNotExist:
        return None


class IsAuthenticatedOrHasSessionToken(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated:
            return True
        return get_session_from_token(request) is not None


class CartView(generics.ListAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticatedOrHasSessionToken]

    def get_queryset(self):
        session_id = self.request.query_params.get('session')
        return CartItem.objects.filter(session_id=session_id).select_related('menu_item', 'variant')


class CartItemListView(generics.CreateAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticatedOrHasSessionToken]

    def perform_create(self, serializer):
        menu_item = serializer.validated_data['menu_item']
        if not menu_item.is_available:
            raise drf_serializers.ValidationError('This item is currently unavailable.')
        added_by = self.request.user if self.request.user.is_authenticated else None
        instance = serializer.save(added_by=added_by)
        broadcast_cart_updated(instance.session_id)

    def create(self, request, *args, **kwargs):
        # If item+variant already in cart, increment quantity instead
        session_id = request.data.get('session')
        menu_item_id = request.data.get('menu_item')
        variant_id = request.data.get('variant')
        existing = CartItem.objects.filter(
            session_id=session_id, menu_item_id=menu_item_id, variant_id=variant_id
        ).first()
        if existing:
            CartItem.objects.filter(pk=existing.pk).update(
                quantity=F('quantity') + int(request.data.get('quantity', 1))
            )
            existing.refresh_from_db()
            broadcast_cart_updated(session_id)
            return Response(CartItemSerializer(existing).data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)


class CartItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticatedOrHasSessionToken]

    def get_queryset(self):
        return CartItem.objects.all()

    def perform_update(self, serializer):
        instance = serializer.save()
        broadcast_cart_updated(instance.session_id)

    def perform_destroy(self, instance):
        session_id = instance.session_id
        instance.delete()
        broadcast_cart_updated(session_id)
