from django.db import models
from django.conf import settings


class CartItem(models.Model):
    session = models.ForeignKey(
        'tables.TableSession', on_delete=models.CASCADE, related_name='cart_items'
    )
    menu_item = models.ForeignKey(
        'menu.MenuItem', on_delete=models.CASCADE
    )
    variant = models.ForeignKey(
        'menu.MenuItemVariant', on_delete=models.SET_NULL, null=True, blank=True
    )
    quantity = models.PositiveIntegerField(default=1)
    added_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )

    class Meta:
        unique_together = ('session', 'menu_item', 'variant')

    def __str__(self):
        name = self.variant.name if self.variant else self.menu_item.name
        return f'{self.quantity}x {name} (session {self.session_id})'
