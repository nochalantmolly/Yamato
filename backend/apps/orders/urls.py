from django.urls import path
from .views import OrderListView, OrderDetailView, OrderStatusView, CheckoutView, stats_view

app_name = 'orders'

urlpatterns = [
    path('', OrderListView.as_view(), name='order-list'),
    path('<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('<int:pk>/status/', OrderStatusView.as_view(), name='order-status'),
    path('<int:pk>/checkout/', CheckoutView.as_view(), name='checkout'),
    path('stats/', stats_view, name='stats'),
]
