from rest_framework import serializers
from .models import CartItem


class CartItemSerializer(serializers.ModelSerializer):
    item_name = serializers.SerializerMethodField()
    item_price = serializers.SerializerMethodField()
    item_unavailable = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ['id', 'session', 'menu_item', 'variant', 'item_name', 'item_price', 'quantity', 'item_unavailable', 'added_by']
        read_only_fields = ['id', 'item_name', 'item_price', 'item_unavailable', 'added_by']

    def get_item_name(self, obj):
        if obj.variant:
            return f'{obj.menu_item.name} - {obj.variant.name}'
        return obj.menu_item.name

    def get_item_price(self, obj):
        if obj.variant:
            return str(obj.variant.price)
        return str(obj.menu_item.price)

    def get_item_unavailable(self, obj):
        return not obj.menu_item.is_available
