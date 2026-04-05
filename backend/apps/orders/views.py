from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.cart.models import CartItem
from apps.tables.models import TableSession
from .models import Order, OrderItem
from .serializers import OrderSerializer
from django.db.models import Sum, Count


class IsStaffOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('staff', 'admin')


class OrderListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role in ('staff', 'admin'):
            orders = Order.objects.exclude(status='paid').select_related('session__table').prefetch_related('orderitems__menu_item')
        else:
            session_id = request.query_params.get('session')
            orders = Order.objects.filter(session_id=session_id).prefetch_related('orderitems__menu_item')
        return Response(OrderSerializer(orders, many=True).data)

    def post(self, request):
        session_id = request.data.get('session')
        try:
            session = TableSession.objects.get(id=session_id, status='active')
        except TableSession.DoesNotExist:
            return Response({'detail': 'Session not found or closed.'}, status=404)

        cart_items = CartItem.objects.filter(session=session).select_related('menu_item')
        if not cart_items.exists():
            return Response({'detail': 'Cart is empty.'}, status=400)

        total = sum(item.menu_item.price * item.quantity for item in cart_items)

        order = Order.objects.create(session=session, total_amount=total)
        for cart_item in cart_items:
            OrderItem.objects.create(
                order=order,
                menu_item=cart_item.menu_item,
                quantity=cart_item.quantity,
                price=cart_item.menu_item.price,
            )
        cart_items.delete()

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            'staff_orders', {'type': 'order.created'}
        )

        return Response(OrderSerializer(order).data, status=201)


class OrderDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            order = Order.objects.prefetch_related('orderitems__menu_item').get(pk=pk)
        except Order.DoesNotExist:
            return Response(status=404)
        return Response(OrderSerializer(order).data)


class OrderStatusView(APIView):
    permission_classes = [IsStaffOrAdmin]

    def patch(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response(status=404)
        new_status = request.data.get('status')
        valid = {'pending': 'preparing', 'preparing': 'completed'}
        if order.status not in valid or valid[order.status] != new_status:
            return Response({'detail': f'Cannot transition from {order.status} to {new_status}.'}, status=400)
        order.status = new_status
        order.save()
        return Response(OrderSerializer(order).data)


class CheckoutView(APIView):
    permission_classes = [IsStaffOrAdmin]

    def post(self, request, pk):
        try:
            order = Order.objects.select_related('session__table').get(pk=pk)
        except Order.DoesNotExist:
            return Response(status=404)

        if order.status != 'completed':
            return Response({'detail': 'Order must be completed before checkout.'}, status=400)

        order.status = 'paid'
        order.paid_at = timezone.now()
        order.save()

        session = order.session
        session.status = 'closed'
        session.closed_at = timezone.now()
        session.save()

        CartItem.objects.filter(session=session).delete()

        table = session.table
        table.status = 'available'
        table.save()

        return Response({'detail': 'Checkout complete. Table is now available.'})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def stats_view(request):
    if request.user.role != 'admin':
        return Response({'detail': 'Admin only.'}, status=403)
    today = timezone.now().date()
    today_orders = Order.objects.filter(created_at__date=today, status='paid')
    data = today_orders.aggregate(
        order_count=Count('id'),
        total_revenue=Sum('total_amount'),
    )
    data['total_revenue'] = str(data['total_revenue'] or '0.00')
    return Response(data)
