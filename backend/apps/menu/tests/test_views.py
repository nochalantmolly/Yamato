import pytest
from django.urls import reverse
from apps.menu.models import Category, MenuItem


@pytest.fixture
def category(db):
    return Category.objects.create(name='Drinks', sort_order=1)


@pytest.fixture
def menu_item(db, category):
    return MenuItem.objects.create(
        name='Green Tea', description='Hot', price='3.50',
        category=category, is_available=True,
    )


@pytest.mark.django_db
def test_list_categories_is_public(api_client, category):
    url = reverse('menu:category-list')
    response = api_client.get(url)
    assert response.status_code == 200
    assert len(response.data) == 1


@pytest.mark.django_db
def test_list_items_is_public(api_client, menu_item):
    url = reverse('menu:item-list')
    response = api_client.get(url)
    assert response.status_code == 200
    assert len(response.data) == 1


@pytest.mark.django_db
def test_list_items_filters_by_category(api_client, category, menu_item):
    other = Category.objects.create(name='Food', sort_order=2)
    MenuItem.objects.create(name='Rice', price='5.00', category=other, is_available=True)
    url = reverse('menu:item-list')
    response = api_client.get(url, {'category': category.id})
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]['name'] == 'Green Tea'


@pytest.mark.django_db
def test_create_item_requires_admin(auth_client, category):
    url = reverse('menu:item-list')
    data = {'name': 'Ramen', 'price': '10.00', 'category': category.id, 'is_available': True}
    response = auth_client.post(url, data)
    assert response.status_code == 403


@pytest.mark.django_db
def test_admin_can_create_item(admin_client, category):
    url = reverse('menu:item-list')
    data = {'name': 'Ramen', 'price': '10.00', 'category': category.id, 'is_available': True}
    response = admin_client.post(url, data)
    assert response.status_code == 201


@pytest.mark.django_db
def test_toggle_availability(admin_client, menu_item):
    url = reverse('menu:item-toggle', args=[menu_item.id])
    response = admin_client.patch(url)
    assert response.status_code == 200
    menu_item.refresh_from_db()
    assert menu_item.is_available is False


@pytest.mark.django_db
def test_unavailable_items_excluded_from_public_list(api_client, category):
    MenuItem.objects.create(name='Sold Out', price='5.00', category=category, is_available=False)
    url = reverse('menu:item-list')
    response = api_client.get(url)
    assert response.status_code == 200
    assert len(response.data) == 0
