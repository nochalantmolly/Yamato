import random
import string
import uuid
from django.db import models
from django.utils import timezone


def generate_daily_code(exclude_codes=None):
    """Generate a unique 4-char code not in exclude_codes."""
    chars = string.ascii_uppercase + string.digits
    exclude_codes = exclude_codes or set()
    while True:
        code = ''.join(random.choices(chars, k=4))
        if code not in exclude_codes:
            return code


class Table(models.Model):
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('occupied', 'Occupied'),
        ('billing', 'Billing'),
    ]
    table_number = models.IntegerField(unique=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='available')
    daily_code = models.CharField(max_length=4, blank=True)
    code_date = models.DateField(null=True, blank=True)

    def get_daily_code(self):
        """Return today's code, regenerating if stale."""
        today = timezone.now().date()
        if self.code_date == today and self.daily_code:
            return self.daily_code
        # Regenerate — collect codes already assigned today
        existing = set(
            Table.objects.filter(code_date=today)
            .exclude(pk=self.pk)
            .values_list('daily_code', flat=True)
        )
        self.daily_code = generate_daily_code(exclude_codes=existing)
        self.code_date = today
        self.save(update_fields=['daily_code', 'code_date'])
        return self.daily_code

    def __str__(self):
        return f'Table {self.table_number}'


class TableSession(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('closed', 'Closed'),
    ]
    table = models.ForeignKey(Table, on_delete=models.CASCADE, related_name='sessions')
    session_token = models.UUIDField(default=uuid.uuid4, unique=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f'Session {self.id} — Table {self.table.table_number}'
