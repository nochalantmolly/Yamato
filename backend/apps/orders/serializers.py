from rest_framework import serializers
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    item_name = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'menu_item', 'variant', 'item_name', 'quantity', 'price']

    def get_item_name(self, obj):
        if obj.variant:
            return f'{obj.menu_item.name} - {obj.variant.name}'
        return obj.menu_item.name


class OrderSerializer(serializers.ModelSerializer):
    orderitems = OrderItemSerializer(many=True, read_only=True)
    table_number = serializers.IntegerField(source='session.table.table_number', read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'session', 'table_number', 'total_amount', 'status', 'created_at', 'completed_at', 'paid_at', 'orderitems']
        read_only_fields = ['id', 'total_amount', 'status', 'created_at', 'completed_at', 'paid_at', 'table_number', 'orderitems']
