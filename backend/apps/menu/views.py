from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from .models import Category, MenuItem
from .serializers import CategorySerializer, MenuItemSerializer
from .permissions import IsAdminOrReadOnly


class CategoryListView(generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]


class MenuItemListView(generics.ListCreateAPIView):
    serializer_class = MenuItemSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = MenuItem.objects.all()
        category_id = self.request.query_params.get('category')
        if self.request.user.is_authenticated and self.request.user.role == 'admin':
            pass  # admin sees all
        else:
            qs = qs.filter(is_available=True)
        if category_id:
            qs = qs.filter(category_id=category_id)
        return qs


class MenuItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    permission_classes = [IsAdminOrReadOnly]


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def toggle_item_availability(request, pk):
    if request.user.role != 'admin':
        return Response({'detail': 'Admin only.'}, status=403)
    item = get_object_or_404(MenuItem, pk=pk)
    item.is_available = not item.is_available
    item.save()
    return Response(MenuItemSerializer(item).data)
