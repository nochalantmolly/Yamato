from django.db import models


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('preparing', 'Preparing'),
        ('completed', 'Completed'),
        ('paid', 'Paid'),
    ]
    session = models.ForeignKey(
        'tables.TableSession', on_delete=models.PROTECT, related_name='orders'
    )
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f'Order {self.id} — Table {self.session.table.table_number}'


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='orderitems')
    menu_item = models.ForeignKey('menu.MenuItem', on_delete=models.PROTECT)
    variant = models.ForeignKey('menu.MenuItemVariant', on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=8, decimal_places=2)  # snapshot at order time

    def __str__(self):
        name = f'{self.menu_item.name} - {self.variant.name}' if self.variant else self.menu_item.name
        return f'{self.quantity}x {name}'
