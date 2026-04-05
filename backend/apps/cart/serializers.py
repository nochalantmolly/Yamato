from rest_framework import serializers
from .models import CartItem


class CartItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='menu_item.name', read_only=True)
    item_price = serializers.DecimalField(source='menu_item.price', max_digits=8, decimal_places=2, read_only=True)
    item_unavailable = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ['id', 'session', 'menu_item', 'item_name', 'item_price', 'quantity', 'item_unavailable', 'added_by']
        read_only_fields = ['id', 'item_name', 'item_price', 'item_unavailable', 'added_by']

    def get_item_unavailable(self, obj):
        return not obj.menu_item.is_available
