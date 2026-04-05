from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Table, TableSession, generate_join_code
from .serializers import TableSerializer, TableSessionSerializer


class IsStaffOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('staff', 'admin')


class TableListView(generics.ListAPIView):
    queryset = Table.objects.all().order_by('table_number')
    serializer_class = TableSerializer
    permission_classes = [IsStaffOrAdmin]


class ActivateTableView(APIView):
    permission_classes = [IsStaffOrAdmin]

    def post(self, request, pk):
        try:
            table = Table.objects.get(pk=pk)
        except Table.DoesNotExist:
            return Response({'detail': 'Table not found.'}, status=404)

        if table.status != 'available':
            return Response({'detail': 'Table is not available.'}, status=400)

        session = TableSession.objects.create(
            table=table,
            join_code=generate_join_code(),
            status='active',
        )
        table.status = 'occupied'
        table.save()

        return Response(TableSessionSerializer(session).data, status=201)


class JoinTableView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        join_code = request.data.get('join_code', '').upper()
        try:
            session = TableSession.objects.get(join_code=join_code, status='active')
        except TableSession.DoesNotExist:
            return Response({'detail': 'Invalid or expired table code.'}, status=404)
        return Response({'session_id': session.id, 'table_number': session.table.table_number})
