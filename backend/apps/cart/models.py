from django.db import models
from django.conf import settings


class CartItem(models.Model):
    session = models.ForeignKey(
        'tables.TableSession', on_delete=models.CASCADE, related_name='cart_items'
    )
    menu_item = models.ForeignKey(
        'menu.MenuItem', on_delete=models.CASCADE
    )
    quantity = models.PositiveIntegerField(default=1)
    added_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )

    class Meta:
        unique_together = ('session', 'menu_item')

    def __str__(self):
        return f'{self.quantity}x {self.menu_item.name} (session {self.session_id})'
