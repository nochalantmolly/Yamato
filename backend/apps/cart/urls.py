from django.urls import path
from .views import CartView, CartItemListView, CartItemDetailView

app_name = 'cart'

urlpatterns = [
    path('', CartView.as_view(), name='cart'),
    path('items/', CartItemListView.as_view(), name='cart-item-list'),
    path('items/<int:pk>/', CartItemDetailView.as_view(), name='cart-item-detail'),
]
