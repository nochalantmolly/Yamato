import pytest
from django.urls import reverse
from apps.tables.models import Table, TableSession
from apps.menu.models import Category, MenuItem
from apps.cart.models import CartItem


@pytest.fixture
def active_session(db):
    table = Table.objects.create(table_number=5, status='occupied')
    return TableSession.objects.create(table=table, join_code='CART', status='active')


@pytest.fixture
def item(db):
    cat = Category.objects.create(name='Food', sort_order=1)
    return MenuItem.objects.create(name='Ramen', price='10.00', category=cat, is_available=True)


@pytest.mark.django_db
def test_get_cart_returns_items_for_session(api_client, customer_user, active_session, item):
    CartItem.objects.create(session=active_session, menu_item=item, quantity=2, added_by=customer_user)
    api_client.force_authenticate(user=customer_user)
    url = reverse('cart:cart') + f'?session={active_session.id}'
    response = api_client.get(url)
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]['quantity'] == 2


@pytest.mark.django_db
def test_add_item_to_cart(api_client, customer_user, active_session, item):
    api_client.force_authenticate(user=customer_user)
    url = reverse('cart:cart-item-list')
    data = {'session': active_session.id, 'menu_item': item.id, 'quantity': 1}
    response = api_client.post(url, data)
    assert response.status_code == 201
    assert CartItem.objects.filter(session=active_session).count() == 1


@pytest.mark.django_db
def test_add_unavailable_item_fails(api_client, customer_user, active_session, db):
    cat = Category.objects.create(name='X', sort_order=99)
    unavailable = MenuItem.objects.create(name='Gone', price='1.00', category=cat, is_available=False)
    api_client.force_authenticate(user=customer_user)
    url = reverse('cart:cart-item-list')
    data = {'session': active_session.id, 'menu_item': unavailable.id, 'quantity': 1}
    response = api_client.post(url, data)
    assert response.status_code == 400


@pytest.mark.django_db
def test_update_cart_item_quantity(api_client, customer_user, active_session, item):
    cart_item = CartItem.objects.create(session=active_session, menu_item=item, quantity=1, added_by=customer_user)
    api_client.force_authenticate(user=customer_user)
    url = reverse('cart:cart-item-detail', args=[cart_item.id])
    response = api_client.patch(url, {'quantity': 3})
    assert response.status_code == 200
    cart_item.refresh_from_db()
    assert cart_item.quantity == 3


@pytest.mark.django_db
def test_delete_cart_item(api_client, customer_user, active_session, item):
    cart_item = CartItem.objects.create(session=active_session, menu_item=item, quantity=1, added_by=customer_user)
    api_client.force_authenticate(user=customer_user)
    url = reverse('cart:cart-item-detail', args=[cart_item.id])
    response = api_client.delete(url)
    assert response.status_code == 204
    assert not CartItem.objects.filter(id=cart_item.id).exists()


@pytest.mark.django_db
def test_cart_shows_unavailability_flag(api_client, customer_user, active_session, item):
    CartItem.objects.create(session=active_session, menu_item=item, quantity=1, added_by=customer_user)
    item.is_available = False
    item.save()
    api_client.force_authenticate(user=customer_user)
    url = reverse('cart:cart') + f'?session={active_session.id}'
    response = api_client.get(url)
    assert response.status_code == 200
    assert response.data[0]['item_unavailable'] is True
