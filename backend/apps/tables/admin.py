from django.contrib import admin
from .models import Table, TableSession

@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    list_display = ['table_number', 'status']

@admin.register(TableSession)
class TableSessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'table', 'join_code', 'status', 'created_at']
