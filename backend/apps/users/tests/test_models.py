import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.django_db
def test_create_user_with_email():
    user = User.objects.create_user(
        email='test@example.com',
        password='pass1234',
        name='Test User',
        role='customer',
    )
    assert user.email == 'test@example.com'
    assert user.name == 'Test User'
    assert user.role == 'customer'
    assert user.check_password('pass1234')
    assert not user.is_staff


@pytest.mark.django_db
def test_user_email_is_unique():
    User.objects.create_user(email='a@a.com', password='pass1234', name='A')
    with pytest.raises(Exception):
        User.objects.create_user(email='a@a.com', password='pass1234', name='B')


@pytest.mark.django_db
def test_user_str():
    user = User.objects.create_user(email='u@u.com', password='p', name='Bob')
    assert str(user) == 'u@u.com'
