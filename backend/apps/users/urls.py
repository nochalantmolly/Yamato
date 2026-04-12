from django.urls import path
from .views import RegisterView, ProfileView, AdminUserListView

app_name = 'users'

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('users/', AdminUserListView.as_view(), name='admin-user-list'),
]
