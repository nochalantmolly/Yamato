import pytest
from django.urls import reverse


@pytest.mark.django_db
def test_register_creates_customer(api_client):
    url = reverse('users:register')
    data = {
        'email': 'new@example.com',
        'password': 'pass1234',
        'name': 'New User',
        'phone': '0912345678',
    }
    response = api_client.post(url, data)
    assert response.status_code == 201
    assert response.data['email'] == 'new@example.com'
    assert response.data['role'] == 'customer'
    assert 'password' not in response.data


@pytest.mark.django_db
def test_register_duplicate_email_fails(api_client, customer_user):
    url = reverse('users:register')
    data = {'email': customer_user.email, 'password': 'pass1234', 'name': 'Dup'}
    response = api_client.post(url, data)
    assert response.status_code == 400


@pytest.mark.django_db
def test_get_profile_requires_auth(api_client):
    url = reverse('users:profile')
    response = api_client.get(url)
    assert response.status_code == 401


@pytest.mark.django_db
def test_get_profile_returns_own_data(auth_client, customer_user):
    url = reverse('users:profile')
    response = auth_client.get(url)
    assert response.status_code == 200
    assert response.data['email'] == customer_user.email


@pytest.mark.django_db
def test_update_profile(auth_client):
    url = reverse('users:profile')
    response = auth_client.patch(url, {'name': 'Updated Name'})
    assert response.status_code == 200
    assert response.data['name'] == 'Updated Name'
