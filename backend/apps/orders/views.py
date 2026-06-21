import datetime
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum, Count
from apps.cart.models import CartItem
from apps.cart.views import get_session_from_token, IsAuthenticatedOrHasSessionToken
from apps.tables.models import TableSession
from .models import Order, OrderItem
from .serializers import OrderSerializer


class IsStaffOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('staff', 'admin')


class OrderListView(APIView):
    permission_classes = [IsAuthenticatedOrHasSessionToken]

    def get(self, request):
        if request.user.is_authenticated and request.user.role in ('staff', 'admin'):
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

        cart_items = CartItem.objects.filter(session=session).select_related('menu_item', 'variant')
        if not cart_items.exists():
            return Response({'detail': 'Cart is empty.'}, status=400)

        total = sum(
            (item.variant.price if item.variant else item.menu_item.price) * item.quantity
            for item in cart_items
        )

        order = Order.objects.create(session=session, total_amount=total)
        for cart_item in cart_items:
            price = cart_item.variant.price if cart_item.variant else cart_item.menu_item.price
            OrderItem.objects.create(
                order=order,
                menu_item=cart_item.menu_item,
                variant=cart_item.variant,
                quantity=cart_item.quantity,
                price=price,
            )
        cart_items.delete()

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            'staff_orders', {'type': 'order.created'}
        )

        return Response(OrderSerializer(order).data, status=201)


class OrderDetailView(APIView):
    permission_classes = [IsAuthenticatedOrHasSessionToken]

    def get(self, request, pk):
        try:
            order = Order.objects.prefetch_related('orderitems__menu_item', 'orderitems__variant').get(pk=pk)
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
        if new_status == 'completed':
            order.completed_at = timezone.now()
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

        session = order.session
        blocking = Order.objects.filter(session=session).exclude(pk=order.pk).exclude(status__in=('completed', 'paid'))
        if blocking.exists():
            return Response(
                {'detail': 'All orders for this session must be completed before checkout.'},
                status=400,
            )

        order.status = 'paid'
        order.paid_at = timezone.now()
        order.save()

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
    """Admin revenue stats: today, week, month, category breakdown, daily chart."""
    if request.user.role != 'admin':
        return Response({'detail': 'Admin only.'}, status=403)

    today = timezone.now().date()
    week_start = today - datetime.timedelta(days=today.weekday())
    month_start = today.replace(day=1)

    paid_orders = Order.objects.filter(status='paid')

    today_revenue = paid_orders.filter(paid_at__date=today).aggregate(
        total=Sum('total_amount'), count=Count('id')
    )
    week_revenue = paid_orders.filter(paid_at__date__gte=week_start).aggregate(
        total=Sum('total_amount'), count=Count('id')
    )
    month_revenue = paid_orders.filter(paid_at__date__gte=month_start).aggregate(
        total=Sum('total_amount'), count=Count('id')
    )

    # Category breakdown for this month
    from apps.menu.models import Category
    categories = Category.objects.all()
    category_breakdown = []
    for cat in categories:
        cat_total = OrderItem.objects.filter(
            order__status='paid',
            order__paid_at__date__gte=month_start,
            menu_item__category=cat,
        ).aggregate(total=Sum('price'))['total']
        if cat_total:
            category_breakdown.append({'category': cat.name, 'total': str(cat_total)})

    # Daily revenue for past 30 days (for chart)
    thirty_days_ago = today - datetime.timedelta(days=30)
    daily_data = (
        paid_orders.filter(paid_at__date__gte=thirty_days_ago)
        .extra(select={'day': "DATE(paid_at)"})
        .values('day')
        .annotate(total=Sum('total_amount'))
        .order_by('day')
    )
    daily_chart = [{'date': str(d['day']), 'total': str(d['total'])} for d in daily_data]

    return Response({
        'today': {'total': str(today_revenue['total'] or '0.00'), 'orders': today_revenue['count']},
        'week': {'total': str(week_revenue['total'] or '0.00'), 'orders': week_revenue['count']},
        'month': {'total': str(month_revenue['total'] or '0.00'), 'orders': month_revenue['count']},
        'category_breakdown': category_breakdown,
        'daily_chart': daily_chart,
    })
