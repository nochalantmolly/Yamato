import pytest
from django.urls import reverse
from apps.tables.models import Table, TableSession
from apps.menu.models import Category, MenuItem
from apps.cart.models import CartItem
from apps.orders.models import Order


@pytest.fixture
def setup(db, customer_user):
    table = Table.objects.create(table_number=10, status='occupied')
    session = TableSession.objects.create(table=table, join_code='ORD1', status='active')
    cat = Category.objects.create(name='Food', sort_order=1)
    item = MenuItem.objects.create(name='Sushi', price='15.00', category=cat, is_available=True)
    CartItem.objects.create(session=session, menu_item=item, quantity=2, added_by=customer_user)
    return session, item


@pytest.mark.django_db
def test_submit_order_converts_cart(api_client, customer_user, setup):
    session, item = setup
    api_client.force_authenticate(user=customer_user)
    url = reverse('orders:order-list')
    response = api_client.post(url, {'session': session.id})
    assert response.status_code == 201
    assert Order.objects.filter(session=session).count() == 1
    order = Order.objects.get(session=session)
    assert order.total_amount == 30  # 2 x 15.00
    assert order.orderitems.count() == 1
    assert CartItem.objects.filter(session=session).count() == 0


@pytest.mark.django_db
def test_submit_order_with_empty_cart_fails(api_client, customer_user, db):
    table = Table.objects.create(table_number=11, status='occupied')
    session = TableSession.objects.create(table=table, join_code='EMP1', status='active')
    api_client.force_authenticate(user=customer_user)
    url = reverse('orders:order-list')
    response = api_client.post(url, {'session': session.id})
    assert response.status_code == 400


@pytest.mark.django_db
def test_staff_updates_order_status(staff_client, customer_user, setup):
    session, item = setup
    order = Order.objects.create(session=session, total_amount=30, status='pending')
    url = reverse('orders:order-status', args=[order.id])
    response = staff_client.patch(url, {'status': 'preparing'})
    assert response.status_code == 200
    order.refresh_from_db()
    assert order.status == 'preparing'


@pytest.mark.django_db
def test_customer_cannot_update_order_status(auth_client, customer_user, setup):
    session, item = setup
    order = Order.objects.create(session=session, total_amount=30, status='pending')
    url = reverse('orders:order-status', args=[order.id])
    response = auth_client.patch(url, {'status': 'preparing'})
    assert response.status_code == 403


@pytest.mark.django_db
def test_checkout_closes_session_and_resets_table(staff_client, customer_user, setup):
    session, item = setup
    order = Order.objects.create(session=session, total_amount=30, status='completed')
    url = reverse('orders:checkout', args=[order.id])
    response = staff_client.post(url)
    assert response.status_code == 200
    session.refresh_from_db()
    assert session.status == 'closed'
    session.table.refresh_from_db()
    assert session.table.status == 'available'


@pytest.mark.django_db
def test_checkout_fails_if_order_not_completed(staff_client, customer_user, setup):
    session, item = setup
    order = Order.objects.create(session=session, total_amount=30, status='preparing')
    url = reverse('orders:checkout', args=[order.id])
    response = staff_client.post(url)
    assert response.status_code == 400
