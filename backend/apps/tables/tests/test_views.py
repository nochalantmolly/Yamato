import pytest
from django.urls import reverse
from apps.tables.models import Table, TableSession


@pytest.fixture
def table(db):
    return Table.objects.create(table_number=1, status='available')


@pytest.mark.django_db
def test_staff_can_list_tables(staff_client, table):
    url = reverse('tables:table-list')
    response = staff_client.get(url)
    assert response.status_code == 200
    assert len(response.data) == 1


@pytest.mark.django_db
def test_customer_cannot_list_tables(auth_client, table):
    url = reverse('tables:table-list')
    response = auth_client.get(url)
    assert response.status_code == 403


@pytest.mark.django_db
def test_staff_activates_table_creates_session(staff_client, table):
    url = reverse('tables:activate', args=[table.id])
    response = staff_client.post(url)
    assert response.status_code == 201
    assert 'join_code' in response.data
    assert len(response.data['join_code']) == 4
    table.refresh_from_db()
    assert table.status == 'occupied'


@pytest.mark.django_db
def test_cannot_activate_already_occupied_table(staff_client, table):
    table.status = 'occupied'
    table.save()
    url = reverse('tables:activate', args=[table.id])
    response = staff_client.post(url)
    assert response.status_code == 400


@pytest.mark.django_db
def test_customer_joins_table_with_valid_code(auth_client, table):
    session = TableSession.objects.create(table=table, join_code='AB12', status='active')
    url = reverse('tables:join')
    response = auth_client.post(url, {'join_code': 'AB12'})
    assert response.status_code == 200
    assert response.data['session_id'] == session.id


@pytest.mark.django_db
def test_join_with_invalid_code_returns_404(auth_client):
    url = reverse('tables:join')
    response = auth_client.post(url, {'join_code': 'XXXX'})
    assert response.status_code == 404
