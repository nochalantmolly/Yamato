from django.urls import path
from .views import CategoryListView, MenuItemListView, MenuItemDetailView, toggle_item_availability

app_name = 'menu'

urlpatterns = [
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('items/', MenuItemListView.as_view(), name='item-list'),
    path('items/<int:pk>/', MenuItemDetailView.as_view(), name='item-detail'),
    path('items/<int:pk>/toggle/', toggle_item_availability, name='item-toggle'),
]
