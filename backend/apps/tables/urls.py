from django.urls import path
from .views import TableListView, TableCodesView, RegenerateCodeView, JoinTableView, CloseTableView, ToggleTableStatusView

app_name = 'tables'

urlpatterns = [
    path('', TableListView.as_view(), name='table-list'),
    path('codes/', TableCodesView.as_view(), name='table-codes'),
    path('<int:pk>/regenerate-code/', RegenerateCodeView.as_view(), name='regenerate-code'),
    path('<int:pk>/close/', CloseTableView.as_view(), name='close-table'),
    path('<int:pk>/toggle-status/', ToggleTableStatusView.as_view(), name='toggle-status'),
    path('join/', JoinTableView.as_view(), name='join'),
]
