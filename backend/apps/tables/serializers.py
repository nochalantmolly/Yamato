from rest_framework import serializers
from .models import Table, TableSession


class TableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Table
        fields = ['id', 'table_number', 'status']


class TableSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TableSession
        fields = ['id', 'table', 'join_code', 'status', 'created_at']
