from rest_framework import serializers
from .models import Table, TableSession


class TableSerializer(serializers.ModelSerializer):
    daily_code = serializers.CharField(read_only=True)

    class Meta:
        model = Table
        fields = ['id', 'table_number', 'status', 'daily_code']


class TableSessionSerializer(serializers.ModelSerializer):
    table_number = serializers.IntegerField(source='table.table_number', read_only=True)

    class Meta:
        model = TableSession
        fields = ['id', 'table', 'table_number', 'session_token', 'status', 'created_at']
