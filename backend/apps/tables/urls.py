from django.urls import path
from .views import TableListView, ActivateTableView, JoinTableView

app_name = 'tables'

urlpatterns = [
    path('', TableListView.as_view(), name='table-list'),
    path('<int:pk>/activate/', ActivateTableView.as_view(), name='activate'),
    path('join/', JoinTableView.as_view(), name='join'),
]
