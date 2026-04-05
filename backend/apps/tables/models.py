import random
import string
from django.db import models


def generate_join_code():
    chars = string.ascii_uppercase + string.digits
    while True:
        code = ''.join(random.choices(chars, k=4))
        if not TableSession.objects.filter(join_code=code, status='active').exists():
            return code


class Table(models.Model):
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('occupied', 'Occupied'),
        ('billing', 'Billing'),
    ]
    table_number = models.IntegerField(unique=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='available')

    def __str__(self):
        return f'Table {self.table_number}'


class TableSession(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('closed', 'Closed'),
    ]
    table = models.ForeignKey(Table, on_delete=models.CASCADE, related_name='sessions')
    join_code = models.CharField(max_length=4)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f'Session {self.id} — Table {self.table.table_number}'
