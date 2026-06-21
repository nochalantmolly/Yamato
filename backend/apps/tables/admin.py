from django.contrib import admin
from .models import Table, TableSession

@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    list_display = ['table_number', 'status', 'daily_code', 'code_date']

@admin.register(TableSession)
class TableSessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'table', 'session_token', 'status', 'created_at']
