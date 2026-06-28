from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.cart.models import CartItem
from .models import Table, TableSession
from .serializers import TableSerializer, TableSessionSerializer


class IsStaffOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('staff', 'admin')


class TableListView(generics.ListAPIView):
    """Staff/admin: list all tables with status and current daily codes."""
    queryset = Table.objects.all().order_by('table_number')
    serializer_class = TableSerializer
    permission_classes = [IsStaffOrAdmin]

    def list(self, request, *args, **kwargs):
        tables = self.get_queryset()
        # Ensure all codes are fresh for today
        for table in tables:
            table.get_daily_code()
        serializer = self.get_serializer(tables, many=True)
        return Response(serializer.data)


class TableCodesView(APIView):
    """Staff/admin: get all current daily codes."""
    permission_classes = [IsStaffOrAdmin]

    def get(self, request):
        tables = Table.objects.all().order_by('table_number')
        codes = []
        for table in tables:
            codes.append({
                'table_number': table.table_number,
                'daily_code': table.get_daily_code(),
                'status': table.status,
            })
        return Response(codes)


class RegenerateCodeView(APIView):
    """Admin only: manually regenerate a table's code."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        if request.user.role != 'admin':
            return Response({'detail': 'Admin only.'}, status=403)
        try:
            table = Table.objects.get(pk=pk)
        except Table.DoesNotExist:
            return Response({'detail': 'Table not found.'}, status=404)
        table.code_date = None
        table.save(update_fields=['code_date'])
        new_code = table.get_daily_code()
        return Response({'table_number': table.table_number, 'daily_code': new_code})


class JoinTableView(APIView):
    """Anonymous: customer enters daily code to join a table."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        code = request.data.get('code', '').upper().strip()
        if not code:
            return Response({'detail': 'Code is required.'}, status=400)

        today = timezone.now().date()
        try:
            table = Table.objects.get(daily_code=code, code_date=today)
        except Table.DoesNotExist:
            return Response({'detail': 'Invalid or expired table code.'}, status=404)

        # Close any old sessions and start fresh
        old_sessions = TableSession.objects.filter(table=table, status='active')
        for old in old_sessions:
            CartItem.objects.filter(session=old).delete()
            old.status = 'closed'
            old.closed_at = timezone.now()
            old.save()

        session = TableSession.objects.create(table=table)
        table.status = 'occupied'
        table.save(update_fields=['status'])

        return Response({
            'session_id': session.id,
            'session_token': str(session.session_token),
            'table_number': table.table_number,
        })


class ToggleTableStatusView(APIView):
    """Staff/admin: toggle a table between available and occupied."""
    permission_classes = [IsStaffOrAdmin]

    def post(self, request, pk):
        try:
            table = Table.objects.get(pk=pk)
        except Table.DoesNotExist:
            return Response({'detail': 'Table not found.'}, status=404)

        if table.status == 'available':
            table.status = 'occupied'
            table.save(update_fields=['status'])
        else:
            # Close any active session first and clear cart
            session = TableSession.objects.filter(table=table, status='active').first()
            if session:
                CartItem.objects.filter(session=session).delete()
                session.status = 'closed'
                session.closed_at = timezone.now()
                session.save()
            table.status = 'available'
            table.save(update_fields=['status'])

        return Response({'table_number': table.table_number, 'status': table.status})


class CloseTableView(APIView):
    """Staff/admin: close a table session."""
    permission_classes = [IsStaffOrAdmin]

    def post(self, request, pk):
        try:
            table = Table.objects.get(pk=pk)
        except Table.DoesNotExist:
            return Response({'detail': 'Table not found.'}, status=404)

        session = TableSession.objects.filter(table=table, status='active').first()
        if not session:
            return Response({'detail': 'No active session for this table.'}, status=400)

        CartItem.objects.filter(session=session).delete()
        session.status = 'closed'
        session.closed_at = timezone.now()
        session.save()

        table.status = 'available'
        table.save(update_fields=['status'])

        return Response({'detail': f'Table {table.table_number} closed.'})
