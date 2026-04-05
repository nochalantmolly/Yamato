import pytest
from rest_framework.test import APIClient


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    from apps.users.models import User
    return User.objects.create_user(
        email='admin@test.com', password='pass1234',
        name='Admin User', role='admin'
    )


@pytest.fixture
def staff_user(db):
    from apps.users.models import User
    return User.objects.create_user(
        email='staff@test.com', password='pass1234',
        name='Staff User', role='staff'
    )


@pytest.fixture
def customer_user(db):
    from apps.users.models import User
    return User.objects.create_user(
        email='customer@test.com', password='pass1234',
        name='Customer User', role='customer'
    )


@pytest.fixture
def auth_client(api_client, customer_user):
    api_client.force_authenticate(user=customer_user)
    return api_client


@pytest.fixture
def staff_client(api_client, staff_user):
    api_client.force_authenticate(user=staff_user)
    return api_client


@pytest.fixture
def admin_client(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    return api_client
