from rest_framework import serializers
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='menu_item.name', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'menu_item', 'item_name', 'quantity', 'price']


class OrderSerializer(serializers.ModelSerializer):
    orderitems = OrderItemSerializer(many=True, read_only=True)
    table_number = serializers.IntegerField(source='session.table.table_number', read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'session', 'table_number', 'total_amount', 'status', 'created_at', 'paid_at', 'orderitems']
        read_only_fields = ['id', 'total_amount', 'status', 'created_at', 'paid_at', 'table_number', 'orderitems']
