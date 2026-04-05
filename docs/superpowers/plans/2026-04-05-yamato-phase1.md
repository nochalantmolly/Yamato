# Yamato Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Phase 1 Yamato restaurant ordering app — custom auth, menu management, table session with QR join code, real-time shared cart via WebSockets, order submission, and checkout with full table reset.

**Architecture:** Django REST Framework handles all HTTP; Django Channels + Redis handles WebSocket connections grouped by `TableSession`. The WebSocket carries thin notifications only (`cart_updated`, `order_created`) — all data is fetched via REST. Cart and orders are scoped to a `TableSession` (not the `Table` directly) for clean checkout isolation.

**Tech Stack:** Django 4.2 + DRF + SimpleJWT · Django Channels 4 + channels-redis + daphne · PostgreSQL · pytest-django + pytest-asyncio · React Native 0.84 + TypeScript · React Navigation v7 · Axios · React Context

---

## File Map

### Backend — new files to create
```
backend/
  pytest.ini
  conftest.py
  apps/
    __init__.py
    users/
      __init__.py  apps.py  admin.py
      models.py          — User (AbstractUser, email login, role, phone)
      serializers.py     — RegisterSerializer, UserSerializer
      views.py           — RegisterView, ProfileView
      urls.py
      tests/
        __init__.py
        test_models.py
        test_views.py
    menu/
      __init__.py  apps.py  admin.py
      models.py          — Category, MenuItem
      serializers.py     — CategorySerializer, MenuItemSerializer
      views.py           — CategoryViewSet, MenuItemViewSet
      permissions.py     — IsAdminOrReadOnly
      urls.py
      tests/
        __init__.py
        test_views.py
    tables/
      __init__.py  apps.py  admin.py
      models.py          — Table, TableSession
      serializers.py     — TableSerializer, TableSessionSerializer
      views.py           — TableListView, ActivateTableView, JoinTableView
      urls.py
      consumers.py       — TableConsumer (cart ws), StaffOrderConsumer
      routing.py         — WebSocket URL patterns
      tests/
        __init__.py
        test_views.py
        test_consumers.py
    cart/
      __init__.py  apps.py  admin.py
      models.py          — CartItem
      serializers.py     — CartItemSerializer
      views.py           — CartView, CartItemDetailView
      urls.py
      tests/
        __init__.py
        test_views.py
    orders/
      __init__.py  apps.py  admin.py
      models.py          — Order, OrderItem
      serializers.py     — OrderSerializer, OrderItemSerializer
      views.py           — OrderView, OrderDetailView, CheckoutView
      urls.py
      tests/
        __init__.py
        test_views.py
```

### Backend — files to modify
```
backend/config/settings.py   — add channels, apps, AUTH_USER_MODEL, channel layer
backend/config/urls.py        — add app URL includes
backend/config/asgi.py        — replace with Channels routing
backend/requirements.txt      — add channels, daphne, pytest-django, pytest-asyncio
```

### Frontend — new files to create
```
frontend/src/
  api/
    client.ts          — axios instance with JWT interceptor + refresh
    auth.ts            — register, login, getProfile
    menu.ts            — listCategories, listItems, getItem
    tables.ts          — listTables, activateTable, joinTable
    cart.ts            — getCart, addCartItem, updateCartItem, deleteCartItem
    orders.ts          — submitOrder, listOrders, getOrder, updateStatus, checkout
  context/
    AuthContext.tsx     — auth state, JWT storage, login/logout/register actions
    TableContext.tsx    — current session_id, join/leave actions
  hooks/
    useWebSocket.ts    — connect/disconnect, onMessage callback, reconnect on focus
    useCart.ts         — cart state, refetch on cart_updated ws event
    useOrders.ts       — staff order list, refetch on order_created ws event
  navigation/
    AppNavigator.tsx   — root: AuthStack | RoleNavigator based on auth state
    CustomerNavigator.tsx
    StaffNavigator.tsx
    AdminNavigator.tsx
  screens/
    auth/
      LoginScreen.tsx
      RegisterScreen.tsx
    customer/
      TableJoinScreen.tsx
      MenuScreen.tsx
      MenuItemDetailScreen.tsx
      CartScreen.tsx
      OrderStatusScreen.tsx
      ProfileScreen.tsx
    staff/
      OrderListScreen.tsx
      OrderDetailScreen.tsx
      CheckoutScreen.tsx
    admin/
      MenuManagementScreen.tsx
      CategoryManagementScreen.tsx
      OrderHistoryScreen.tsx
      UserManagementScreen.tsx
      StatsScreen.tsx
  components/
    MenuItemCard.tsx
    CartItemRow.tsx
    OrderStatusBadge.tsx
```

### Frontend — files to modify
```
frontend/App.tsx         — replace with <AppNavigator />
frontend/package.json    — add navigation, axios, async-storage deps
frontend/tsconfig.json   — add baseUrl: "." for cleaner imports
```

---

## Task 1: Install backend dependencies & scaffold apps

**Files:**
- Modify: `backend/requirements.txt`
- Create: `backend/pytest.ini`
- Create: `backend/conftest.py`
- Create: `backend/apps/__init__.py` + one `__init__.py` per app dir

- [ ] **Step 1: Add new backend dependencies**

Edit `backend/requirements.txt` to add:
```
channels==4.0.0
channels-redis==4.2.1
daphne==4.1.2
pytest==8.3.5
pytest-django==4.10.0
pytest-asyncio==0.25.3
```

- [ ] **Step 2: Install dependencies**

```bash
cd backend && source venv/bin/activate && pip install channels==4.0.0 channels-redis==4.2.1 daphne==4.1.2 pytest==8.3.5 pytest-django==4.10.0 pytest-asyncio==0.25.3
```

Expected: all packages install without error.

- [ ] **Step 3: Create the apps directory and scaffold each Django app**

```bash
cd backend
mkdir -p apps
touch apps/__init__.py
python manage.py startapp users apps/users
python manage.py startapp menu apps/menu
python manage.py startapp tables apps/tables
python manage.py startapp cart apps/cart
python manage.py startapp orders apps/orders
```

- [ ] **Step 4: Fix AppConfig names** — each generated `apps.py` uses the wrong `name`. Update each one:

`apps/users/apps.py`:
```python
from django.apps import AppConfig

class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.users'
    label = 'users'
```

`apps/menu/apps.py`:
```python
from django.apps import AppConfig

class MenuConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.menu'
    label = 'menu'
```

`apps/tables/apps.py`:
```python
from django.apps import AppConfig

class TablesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.tables'
    label = 'tables'
```

`apps/cart/apps.py`:
```python
from django.apps import AppConfig

class CartConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.cart'
    label = 'cart'
```

`apps/orders/apps.py`:
```python
from django.apps import AppConfig

class OrdersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.orders'
    label = 'orders'
```

- [ ] **Step 5: Create pytest.ini**

`backend/pytest.ini`:
```ini
[pytest]
DJANGO_SETTINGS_MODULE = config.settings
asyncio_mode = auto
python_files = tests/test_*.py
python_classes = Test*
python_functions = test_*
```

- [ ] **Step 6: Create conftest.py with shared fixtures**

`backend/conftest.py`:
```python
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
```

- [ ] **Step 7: Create tests/ subdirectories in each app**

```bash
cd backend
for app in users menu tables cart orders; do
  mkdir -p apps/$app/tests
  touch apps/$app/tests/__init__.py
done
```

- [ ] **Step 8: Commit**

```bash
cd backend && git add -A && git commit -m "chore: add backend deps, scaffold apps, configure pytest"
```

---

## Task 2: Custom User model

**Files:**
- Create: `backend/apps/users/models.py`
- Create: `backend/apps/users/tests/test_models.py`
- Modify: `backend/config/settings.py`

- [ ] **Step 1: Write the failing test**

`backend/apps/users/tests/test_models.py`:
```python
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
```

- [ ] **Step 2: Run — expect failure (no User model yet)**

```bash
cd backend && pytest apps/users/tests/test_models.py -v
```

Expected: `ERRORS` — `AUTH_USER_MODEL` not set.

- [ ] **Step 3: Write the User model**

`backend/apps/users/models.py`:
```python
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        extra_fields.setdefault('role', 'customer')
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('staff', 'Staff'),
        ('customer', 'Customer'),
    ]

    username = None
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='customer')

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    objects = UserManager()

    def __str__(self):
        return self.email
```

- [ ] **Step 4: Add AUTH_USER_MODEL and register apps in settings.py**

Edit `backend/config/settings.py` — add after `BASE_DIR`:
```python
AUTH_USER_MODEL = 'users.User'
```

And update `INSTALLED_APPS` to:
```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'channels',
    # Local
    'apps.users.apps.UsersConfig',
    'apps.menu.apps.MenuConfig',
    'apps.tables.apps.TablesConfig',
    'apps.cart.apps.CartConfig',
    'apps.orders.apps.OrdersConfig',
]
```

- [ ] **Step 5: Create and run migrations**

```bash
cd backend && python manage.py makemigrations users && python manage.py migrate
```

Expected: migration created and applied.

- [ ] **Step 6: Run tests — expect pass**

```bash
cd backend && pytest apps/users/tests/test_models.py -v
```

Expected: 3 passed.

- [ ] **Step 7: Register User in admin**

`backend/apps/users/admin.py`:
```python
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ['email']
    list_display = ['email', 'name', 'role', 'is_active']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal', {'fields': ('name', 'phone', 'role')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
    )
    add_fieldsets = (
        (None, {'fields': ('email', 'password1', 'password2', 'name', 'role')}),
    )
    search_fields = ['email', 'name']
```

- [ ] **Step 8: Commit**

```bash
cd backend && git add -A && git commit -m "feat(users): add custom User model with email login and role"
```

---

## Task 3: Auth endpoints (register, profile)

> Note: Login (JWT token) is already wired via `TokenObtainPairView` in `config/urls.py`.

**Files:**
- Create: `backend/apps/users/serializers.py`
- Create: `backend/apps/users/views.py`
- Create: `backend/apps/users/urls.py`
- Create: `backend/apps/users/tests/test_views.py`
- Modify: `backend/config/urls.py`

- [ ] **Step 1: Write failing tests**

`backend/apps/users/tests/test_views.py`:
```python
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
```

- [ ] **Step 2: Run — expect failures**

```bash
cd backend && pytest apps/users/tests/test_views.py -v
```

Expected: errors — URL not found.

- [ ] **Step 3: Create serializers**

`backend/apps/users/serializers.py`:
```python
from rest_framework import serializers
from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['id', 'email', 'password', 'name', 'phone', 'role']
        read_only_fields = ['id', 'role']

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'phone', 'role']
        read_only_fields = ['id', 'email', 'role']
```

- [ ] **Step 4: Create views**

`backend/apps/users/views.py`:
```python
from rest_framework import generics, permissions
from .models import User
from .serializers import RegisterSerializer, UserSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user
```

- [ ] **Step 5: Create URLs**

`backend/apps/users/urls.py`:
```python
from django.urls import path
from .views import RegisterView, ProfileView

app_name = 'users'

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', ProfileView.as_view(), name='profile'),
]
```

- [ ] **Step 6: Wire into config/urls.py**

Replace `backend/config/urls.py` with:
```python
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/', include('apps.users.urls')),
    path('api/menu/', include('apps.menu.urls')),
    path('api/tables/', include('apps.tables.urls')),
    path('api/cart/', include('apps.cart.urls')),
    path('api/orders/', include('apps.orders.urls')),
]
```

Create stub `urls.py` for the other apps so the import doesn't fail:
```bash
for app in menu tables cart orders; do
  echo "from django.urls import path; urlpatterns = []" > backend/apps/$app/urls.py
done
```

- [ ] **Step 7: Run tests — expect pass**

```bash
cd backend && pytest apps/users/tests/ -v
```

Expected: 8 passed.

- [ ] **Step 8: Commit**

```bash
cd backend && git add -A && git commit -m "feat(users): add register and profile endpoints"
```

---

## Task 4: Menu app (models + admin + CRUD endpoints)

**Files:**
- Create: `backend/apps/menu/models.py`
- Create: `backend/apps/menu/permissions.py`
- Create: `backend/apps/menu/serializers.py`
- Create: `backend/apps/menu/views.py`
- Create: `backend/apps/menu/urls.py`
- Create: `backend/apps/menu/tests/test_views.py`
- Create: `backend/apps/menu/admin.py`

- [ ] **Step 1: Write failing tests**

`backend/apps/menu/tests/test_views.py`:
```python
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
```

- [ ] **Step 2: Run — expect failures**

```bash
cd backend && pytest apps/menu/tests/ -v
```

Expected: errors — models don't exist.

- [ ] **Step 3: Create models**

`backend/apps/menu/models.py`:
```python
from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100)
    sort_order = models.IntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name


class MenuItem(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    image = models.CharField(max_length=500, blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='items')
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return self.name
```

- [ ] **Step 4: Run migrations**

```bash
cd backend && python manage.py makemigrations menu && python manage.py migrate
```

- [ ] **Step 5: Create permissions**

`backend/apps/menu/permissions.py`:
```python
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role == 'admin'
```

- [ ] **Step 6: Create serializers**

`backend/apps/menu/serializers.py`:
```python
from rest_framework import serializers
from .models import Category, MenuItem


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'sort_order']


class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = ['id', 'name', 'description', 'price', 'image', 'category', 'is_available']
```

- [ ] **Step 7: Create views**

`backend/apps/menu/views.py`:
```python
from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Category, MenuItem
from .serializers import CategorySerializer, MenuItemSerializer
from .permissions import IsAdminOrReadOnly


class CategoryListView(generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]


class MenuItemListView(generics.ListCreateAPIView):
    serializer_class = MenuItemSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = MenuItem.objects.all()
        category_id = self.request.query_params.get('category')
        if self.request.user.is_authenticated and self.request.user.role == 'admin':
            pass  # admin sees all
        else:
            qs = qs.filter(is_available=True)
        if category_id:
            qs = qs.filter(category_id=category_id)
        return qs


class MenuItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    permission_classes = [IsAdminOrReadOnly]


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def toggle_item_availability(request, pk):
    if request.user.role != 'admin':
        return Response({'detail': 'Admin only.'}, status=403)
    item = MenuItem.objects.get(pk=pk)
    item.is_available = not item.is_available
    item.save()
    return Response(MenuItemSerializer(item).data)
```

- [ ] **Step 8: Create URLs**

`backend/apps/menu/urls.py`:
```python
from django.urls import path
from .views import CategoryListView, MenuItemListView, MenuItemDetailView, toggle_item_availability

app_name = 'menu'

urlpatterns = [
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('items/', MenuItemListView.as_view(), name='item-list'),
    path('items/<int:pk>/', MenuItemDetailView.as_view(), name='item-detail'),
    path('items/<int:pk>/toggle/', toggle_item_availability, name='item-toggle'),
]
```

- [ ] **Step 9: Register in admin**

`backend/apps/menu/admin.py`:
```python
from django.contrib import admin
from .models import Category, MenuItem

admin.site.register(Category)

@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price', 'is_available']
    list_filter = ['category', 'is_available']
```

- [ ] **Step 10: Run tests — expect pass**

```bash
cd backend && pytest apps/menu/tests/ -v
```

Expected: 8 passed.

- [ ] **Step 11: Commit**

```bash
cd backend && git add -A && git commit -m "feat(menu): add Category and MenuItem models with CRUD endpoints"
```

---

## Task 5: Tables app (models + activate + join endpoints)

**Files:**
- Create: `backend/apps/tables/models.py`
- Create: `backend/apps/tables/serializers.py`
- Create: `backend/apps/tables/views.py`
- Create: `backend/apps/tables/urls.py`
- Create: `backend/apps/tables/tests/test_views.py`
- Create: `backend/apps/tables/admin.py`

- [ ] **Step 1: Write failing tests**

`backend/apps/tables/tests/test_views.py`:
```python
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
```

- [ ] **Step 2: Run — expect failures**

```bash
cd backend && pytest apps/tables/tests/test_views.py -v
```

Expected: errors — models don't exist.

- [ ] **Step 3: Create models**

`backend/apps/tables/models.py`:
```python
import random
import string
from django.db import models


def generate_join_code():
    chars = string.ascii_uppercase + string.digits
    while True:
        code = ''.join(random.choices(chars, k=4))
        if not TableSession.objects.filter(join_code=code, status='active').exists():
            return code


class Table(models.Model):
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('occupied', 'Occupied'),
        ('billing', 'Billing'),
    ]
    table_number = models.IntegerField(unique=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='available')

    def __str__(self):
        return f'Table {self.table_number}'


class TableSession(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('closed', 'Closed'),
    ]
    table = models.ForeignKey(Table, on_delete=models.CASCADE, related_name='sessions')
    join_code = models.CharField(max_length=4)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f'Session {self.id} — Table {self.table.table_number}'
```

- [ ] **Step 4: Run migrations**

```bash
cd backend && python manage.py makemigrations tables && python manage.py migrate
```

- [ ] **Step 5: Create serializers**

`backend/apps/tables/serializers.py`:
```python
from rest_framework import serializers
from .models import Table, TableSession


class TableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Table
        fields = ['id', 'table_number', 'status']


class TableSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TableSession
        fields = ['id', 'table', 'join_code', 'status', 'created_at']
```

- [ ] **Step 6: Create views**

`backend/apps/tables/views.py`:
```python
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Table, TableSession, generate_join_code
from .serializers import TableSerializer, TableSessionSerializer


class IsStaffOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('staff', 'admin')


class TableListView(generics.ListAPIView):
    queryset = Table.objects.all().order_by('table_number')
    serializer_class = TableSerializer
    permission_classes = [IsStaffOrAdmin]


class ActivateTableView(APIView):
    permission_classes = [IsStaffOrAdmin]

    def post(self, request, pk):
        try:
            table = Table.objects.get(pk=pk)
        except Table.DoesNotExist:
            return Response({'detail': 'Table not found.'}, status=404)

        if table.status != 'available':
            return Response({'detail': 'Table is not available.'}, status=400)

        session = TableSession.objects.create(
            table=table,
            join_code=generate_join_code(),
            status='active',
        )
        table.status = 'occupied'
        table.save()

        return Response(TableSessionSerializer(session).data, status=201)


class JoinTableView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        join_code = request.data.get('join_code', '').upper()
        try:
            session = TableSession.objects.get(join_code=join_code, status='active')
        except TableSession.DoesNotExist:
            return Response({'detail': 'Invalid or expired table code.'}, status=404)
        return Response({'session_id': session.id, 'table_number': session.table.table_number})
```

- [ ] **Step 7: Create URLs**

`backend/apps/tables/urls.py`:
```python
from django.urls import path
from .views import TableListView, ActivateTableView, JoinTableView

app_name = 'tables'

urlpatterns = [
    path('', TableListView.as_view(), name='table-list'),
    path('<int:pk>/activate/', ActivateTableView.as_view(), name='activate'),
    path('join/', JoinTableView.as_view(), name='join'),
]
```

- [ ] **Step 8: Register in admin**

`backend/apps/tables/admin.py`:
```python
from django.contrib import admin
from .models import Table, TableSession

@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    list_display = ['table_number', 'status']

@admin.register(TableSession)
class TableSessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'table', 'join_code', 'status', 'created_at']
```

- [ ] **Step 9: Run tests — expect pass**

```bash
cd backend && pytest apps/tables/tests/test_views.py -v
```

Expected: 6 passed.

- [ ] **Step 10: Commit**

```bash
cd backend && git add -A && git commit -m "feat(tables): add Table and TableSession models with activate/join endpoints"
```

---

## Task 6: Django Channels — ASGI setup + channel layer

**Files:**
- Modify: `backend/config/settings.py`
- Modify: `backend/config/asgi.py`
- Create: `backend/apps/tables/routing.py`

- [ ] **Step 1: Add channel layer config to settings.py**

Append to `backend/config/settings.py`:
```python
# Channels
ASGI_APPLICATION = 'config.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [(config('REDIS_HOST', default='127.0.0.1'), 6379)],
        },
    },
}
```

- [ ] **Step 2: Create WebSocket routing**

`backend/apps/tables/routing.py`:
```python
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'^ws/table/(?P<session_id>\d+)/$', consumers.TableConsumer.as_asgi()),
    re_path(r'^ws/orders/$', consumers.StaffOrderConsumer.as_asgi()),
]
```

- [ ] **Step 3: Replace asgi.py with Channels routing**

`backend/config/asgi.py`:
```python
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from apps.tables.routing import websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket': AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})
```

- [ ] **Step 4: Verify Redis is running and Django starts without error**

```bash
redis-cli ping
```

Expected: `PONG`

```bash
cd backend && python manage.py check
```

Expected: `System check identified no issues.`

- [ ] **Step 5: Commit**

```bash
cd backend && git add -A && git commit -m "feat(channels): configure ASGI with Django Channels and Redis channel layer"
```

---

## Task 7: WebSocket consumers (cart notifications + staff order notifications)

**Files:**
- Create: `backend/apps/tables/consumers.py`
- Create: `backend/apps/tables/tests/test_consumers.py`

- [ ] **Step 1: Write failing consumer tests**

`backend/apps/tables/tests/test_consumers.py`:
```python
import pytest
from channels.testing import WebsocketCommunicator
from channels.layers import get_channel_layer
from config.asgi import application
from apps.tables.models import Table, TableSession


@pytest.fixture
def active_session(db):
    table = Table.objects.create(table_number=99, status='occupied')
    return TableSession.objects.create(table=table, join_code='ZZ99', status='active')


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_customer_connects_to_table_session(active_session, customer_user):
    communicator = WebsocketCommunicator(
        application, f'/ws/table/{active_session.id}/'
    )
    communicator.scope['user'] = customer_user
    connected, _ = await communicator.connect()
    assert connected
    await communicator.disconnect()


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_cart_updated_broadcast_received(active_session, customer_user):
    communicator = WebsocketCommunicator(
        application, f'/ws/table/{active_session.id}/'
    )
    communicator.scope['user'] = customer_user
    await communicator.connect()

    channel_layer = get_channel_layer()
    await channel_layer.group_send(
        f'table_session_{active_session.id}',
        {'type': 'cart.updated'},
    )

    message = await communicator.receive_json_from(timeout=3)
    assert message['type'] == 'cart_updated'
    await communicator.disconnect()
```

- [ ] **Step 2: Run — expect failures**

```bash
cd backend && pytest apps/tables/tests/test_consumers.py -v
```

Expected: errors — consumers.py doesn't exist.

- [ ] **Step 3: Create consumers**

`backend/apps/tables/consumers.py`:
```python
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import TableSession


class TableConsumer(AsyncWebsocketConsumer):
    """
    Customers connect to ws/table/{session_id}/.
    Receives 'cart_updated' broadcasts and forwards them to the client.
    The client then re-fetches cart data via REST.
    """

    async def connect(self):
        self.session_id = self.scope['url_route']['kwargs']['session_id']
        self.group_name = f'table_session_{self.session_id}'

        session_exists = await self._session_is_active(self.session_id)
        if not session_exists:
            await self.close()
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    # Called by channel_layer.group_send with type='cart.updated'
    async def cart_updated(self, event):
        await self.send(text_data=json.dumps({'type': 'cart_updated'}))

    @database_sync_to_async
    def _session_is_active(self, session_id):
        return TableSession.objects.filter(id=session_id, status='active').exists()


class StaffOrderConsumer(AsyncWebsocketConsumer):
    """
    Staff connect to ws/orders/.
    Receives 'order_created' broadcasts when a customer submits an order.
    """

    GROUP_NAME = 'staff_orders'

    async def connect(self):
        user = self.scope.get('user')
        if not user or not user.is_authenticated or user.role not in ('staff', 'admin'):
            await self.close()
            return
        await self.channel_layer.group_add(self.GROUP_NAME, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.GROUP_NAME, self.channel_name)

    # Called by channel_layer.group_send with type='order.created'
    async def order_created(self, event):
        await self.send(text_data=json.dumps({'type': 'order_created'}))
```

- [ ] **Step 4: Run tests — expect pass**

```bash
cd backend && pytest apps/tables/tests/test_consumers.py -v
```

Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
cd backend && git add -A && git commit -m "feat(channels): add TableConsumer and StaffOrderConsumer"
```

---

## Task 8: Cart app (model + REST endpoints + WebSocket broadcast)

**Files:**
- Create: `backend/apps/cart/models.py`
- Create: `backend/apps/cart/serializers.py`
- Create: `backend/apps/cart/views.py`
- Create: `backend/apps/cart/urls.py`
- Create: `backend/apps/cart/tests/test_views.py`

- [ ] **Step 1: Write failing tests**

`backend/apps/cart/tests/test_views.py`:
```python
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


@pytest.fixture
def customer_in_session(auth_client, active_session):
    """Simulate a customer who has joined a session."""
    auth_client.session_id = active_session.id
    return auth_client, active_session


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
```

- [ ] **Step 2: Run — expect failures**

```bash
cd backend && pytest apps/cart/tests/test_views.py -v
```

Expected: errors — models don't exist.

- [ ] **Step 3: Create model**

`backend/apps/cart/models.py`:
```python
from django.db import models
from django.conf import settings


class CartItem(models.Model):
    session = models.ForeignKey(
        'tables.TableSession', on_delete=models.CASCADE, related_name='cart_items'
    )
    menu_item = models.ForeignKey(
        'menu.MenuItem', on_delete=models.CASCADE
    )
    quantity = models.PositiveIntegerField(default=1)
    added_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )

    class Meta:
        unique_together = ('session', 'menu_item')

    def __str__(self):
        return f'{self.quantity}x {self.menu_item.name} (session {self.session_id})'
```

- [ ] **Step 4: Run migrations**

```bash
cd backend && python manage.py makemigrations cart && python manage.py migrate
```

- [ ] **Step 5: Create serializer**

`backend/apps/cart/serializers.py`:
```python
from rest_framework import serializers
from .models import CartItem


class CartItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='menu_item.name', read_only=True)
    item_price = serializers.DecimalField(source='menu_item.price', max_digits=8, decimal_places=2, read_only=True)
    item_unavailable = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ['id', 'session', 'menu_item', 'item_name', 'item_price', 'quantity', 'item_unavailable', 'added_by']
        read_only_fields = ['id', 'item_name', 'item_price', 'item_unavailable', 'added_by']

    def get_item_unavailable(self, obj):
        return not obj.menu_item.is_available
```

- [ ] **Step 6: Create views with broadcast**

`backend/apps/cart/views.py`:
```python
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import CartItem
from .serializers import CartItemSerializer


def broadcast_cart_updated(session_id):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'table_session_{session_id}',
        {'type': 'cart.updated'},
    )


class CartView(generics.ListAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        session_id = self.request.query_params.get('session')
        return CartItem.objects.filter(session_id=session_id).select_related('menu_item')


class CartItemListView(generics.CreateAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        menu_item = serializer.validated_data['menu_item']
        if not menu_item.is_available:
            raise serializers.ValidationError('This item is currently unavailable.')
        instance = serializer.save(added_by=self.request.user)
        broadcast_cart_updated(instance.session_id)

    def create(self, request, *args, **kwargs):
        # If item already in cart, increment quantity instead
        session_id = request.data.get('session')
        menu_item_id = request.data.get('menu_item')
        existing = CartItem.objects.filter(session_id=session_id, menu_item_id=menu_item_id).first()
        if existing:
            existing.quantity += int(request.data.get('quantity', 1))
            existing.save()
            broadcast_cart_updated(session_id)
            return Response(CartItemSerializer(existing).data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)


class CartItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CartItem.objects.all()
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_update(self, serializer):
        instance = serializer.save()
        broadcast_cart_updated(instance.session_id)

    def perform_destroy(self, instance):
        session_id = instance.session_id
        instance.delete()
        broadcast_cart_updated(session_id)
```

Fix the import at the top of views.py — add:
```python
from rest_framework import serializers as drf_serializers
```

And change the raise in `perform_create`:
```python
raise drf_serializers.ValidationError('This item is currently unavailable.')
```

- [ ] **Step 7: Create URLs**

`backend/apps/cart/urls.py`:
```python
from django.urls import path
from .views import CartView, CartItemListView, CartItemDetailView

app_name = 'cart'

urlpatterns = [
    path('', CartView.as_view(), name='cart'),
    path('items/', CartItemListView.as_view(), name='cart-item-list'),
    path('items/<int:pk>/', CartItemDetailView.as_view(), name='cart-item-detail'),
]
```

- [ ] **Step 8: Run tests — expect pass**

```bash
cd backend && pytest apps/cart/tests/test_views.py -v
```

Expected: 6 passed.

- [ ] **Step 9: Commit**

```bash
cd backend && git add -A && git commit -m "feat(cart): add CartItem model with REST endpoints and WebSocket broadcast"
```

---

## Task 9: Orders app (submit + status update + checkout)

**Files:**
- Create: `backend/apps/orders/models.py`
- Create: `backend/apps/orders/serializers.py`
- Create: `backend/apps/orders/views.py`
- Create: `backend/apps/orders/urls.py`
- Create: `backend/apps/orders/tests/test_views.py`

- [ ] **Step 1: Write failing tests**

`backend/apps/orders/tests/test_views.py`:
```python
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
```

- [ ] **Step 2: Run — expect failures**

```bash
cd backend && pytest apps/orders/tests/test_views.py -v
```

Expected: errors — models don't exist.

- [ ] **Step 3: Create models**

`backend/apps/orders/models.py`:
```python
from django.db import models


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('preparing', 'Preparing'),
        ('completed', 'Completed'),
        ('paid', 'Paid'),
    ]
    session = models.ForeignKey(
        'tables.TableSession', on_delete=models.PROTECT, related_name='orders'
    )
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f'Order {self.id} — Table {self.session.table.table_number}'


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='orderitems')
    menu_item = models.ForeignKey('menu.MenuItem', on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=8, decimal_places=2)  # snapshot

    def __str__(self):
        return f'{self.quantity}x {self.menu_item.name}'
```

- [ ] **Step 4: Run migrations**

```bash
cd backend && python manage.py makemigrations orders && python manage.py migrate
```

- [ ] **Step 5: Create serializers**

`backend/apps/orders/serializers.py`:
```python
from rest_framework import serializers
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='menu_item.name', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'menu_item', 'item_name', 'quantity', 'price']


class OrderSerializer(serializers.ModelSerializer):
    orderitems = OrderItemSerializer(many=True, read_only=True)
    table_number = serializers.IntegerField(source='session.table.table_number', read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'session', 'table_number', 'total_amount', 'status', 'created_at', 'paid_at', 'orderitems']
        read_only_fields = ['id', 'total_amount', 'status', 'created_at', 'paid_at', 'table_number', 'orderitems']
```

- [ ] **Step 6: Create views**

`backend/apps/orders/views.py`:
```python
from decimal import Decimal
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.cart.models import CartItem
from apps.tables.models import TableSession
from .models import Order, OrderItem
from .serializers import OrderSerializer


class IsStaffOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('staff', 'admin')


class OrderListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role in ('staff', 'admin'):
            orders = Order.objects.exclude(status='paid').select_related('session__table').prefetch_related('orderitems__menu_item')
        else:
            session_id = request.query_params.get('session')
            orders = Order.objects.filter(session_id=session_id).prefetch_related('orderitems__menu_item')
        return Response(OrderSerializer(orders, many=True).data)

    def post(self, request):
        session_id = request.data.get('session')
        try:
            session = TableSession.objects.get(id=session_id, status='active')
        except TableSession.DoesNotExist:
            return Response({'detail': 'Session not found or closed.'}, status=404)

        cart_items = CartItem.objects.filter(session=session).select_related('menu_item')
        if not cart_items.exists():
            return Response({'detail': 'Cart is empty.'}, status=400)

        total = sum(item.menu_item.price * item.quantity for item in cart_items)

        order = Order.objects.create(session=session, total_amount=total)
        for cart_item in cart_items:
            OrderItem.objects.create(
                order=order,
                menu_item=cart_item.menu_item,
                quantity=cart_item.quantity,
                price=cart_item.menu_item.price,
            )
        cart_items.delete()

        # Notify staff
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            'staff_orders', {'type': 'order.created'}
        )

        return Response(OrderSerializer(order).data, status=201)


class OrderDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            order = Order.objects.prefetch_related('orderitems__menu_item').get(pk=pk)
        except Order.DoesNotExist:
            return Response(status=404)
        return Response(OrderSerializer(order).data)


class OrderStatusView(APIView):
    permission_classes = [IsStaffOrAdmin]

    def patch(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response(status=404)
        new_status = request.data.get('status')
        valid = {'pending': 'preparing', 'preparing': 'completed'}
        if order.status not in valid or valid[order.status] != new_status:
            return Response({'detail': f'Cannot transition from {order.status} to {new_status}.'}, status=400)
        order.status = new_status
        order.save()
        return Response(OrderSerializer(order).data)


class CheckoutView(APIView):
    permission_classes = [IsStaffOrAdmin]

    def post(self, request, pk):
        try:
            order = Order.objects.select_related('session__table').get(pk=pk)
        except Order.DoesNotExist:
            return Response(status=404)

        if order.status != 'completed':
            return Response({'detail': 'Order must be completed before checkout.'}, status=400)

        # Mark order paid
        order.status = 'paid'
        order.paid_at = timezone.now()
        order.save()

        # Close session and reset table
        session = order.session
        session.status = 'closed'
        session.closed_at = timezone.now()
        session.save()

        # Clean up any leftover cart items
        CartItem.objects.filter(session=session).delete()

        # Reset table
        table = session.table
        table.status = 'available'
        table.save()

        return Response({'detail': 'Checkout complete. Table is now available.'})
```

- [ ] **Step 7: Create URLs**

`backend/apps/orders/urls.py`:
```python
from django.urls import path
from .views import OrderListView, OrderDetailView, OrderStatusView, CheckoutView

app_name = 'orders'

urlpatterns = [
    path('', OrderListView.as_view(), name='order-list'),
    path('<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('<int:pk>/status/', OrderStatusView.as_view(), name='order-status'),
    path('<int:pk>/checkout/', CheckoutView.as_view(), name='checkout'),
]
```

- [ ] **Step 8: Run all backend tests**

```bash
cd backend && pytest -v
```

Expected: all tests pass.

- [ ] **Step 9: Commit**

```bash
cd backend && git add -A && git commit -m "feat(orders): add order submit, status update, and checkout with table reset"
```

---

## Task 10: Frontend — install dependencies & project structure

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/tsconfig.json`
- Create: `frontend/src/api/client.ts`

- [ ] **Step 1: Install frontend dependencies**

```bash
cd frontend && npm install \
  @react-navigation/native@^7 \
  @react-navigation/native-stack@^7 \
  @react-navigation/bottom-tabs@^7 \
  react-native-screens@^4 \
  axios@^1.8 \
  @react-native-async-storage/async-storage@^2
```

- [ ] **Step 2: Create src directory structure**

```bash
cd frontend && mkdir -p \
  src/api \
  src/context \
  src/hooks \
  src/navigation \
  src/screens/auth \
  src/screens/customer \
  src/screens/staff \
  src/screens/admin \
  src/components
```

- [ ] **Step 3: Update tsconfig.json for baseUrl**

Edit `frontend/tsconfig.json`:
```json
{
  "extends": "@react-native/typescript-config",
  "compilerOptions": {
    "types": ["jest"],
    "baseUrl": "."
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["**/node_modules", "**/Pods"]
}
```

- [ ] **Step 4: Create the axios client with JWT interceptor**

`frontend/src/api/client.ts`:
```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://10.0.2.2:8000/api'; // Android emulator; use localhost for iOS simulator

const client = axios.create({
  baseURL: BASE_URL,
  headers: {'Content-Type': 'application/json'},
});

// Attach access token to every request
client.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh token on 401
client.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = await AsyncStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const res = await axios.post(`${BASE_URL}/auth/token/refresh/`, {refresh});
          const newAccess = res.data.access;
          await AsyncStorage.setItem('access_token', newAccess);
          original.headers.Authorization = `Bearer ${newAccess}`;
          return client(original);
        } catch {
          await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
        }
      }
    }
    return Promise.reject(error);
  },
);

export default client;
```

- [ ] **Step 5: Create API modules**

`frontend/src/api/auth.ts`:
```typescript
import client from './client';

export const register = (data: {email: string; password: string; name: string; phone?: string}) =>
  client.post('/auth/register/', data);

export const login = (email: string, password: string) =>
  client.post('/auth/login/', {email, password});

export const getProfile = () => client.get('/auth/profile/');

export const updateProfile = (data: {name?: string; phone?: string}) =>
  client.patch('/auth/profile/', data);
```

`frontend/src/api/menu.ts`:
```typescript
import client from './client';

export const listCategories = () => client.get('/menu/categories/');
export const listItems = (params?: {category?: number}) =>
  client.get('/menu/items/', {params});
export const getItem = (id: number) => client.get(`/menu/items/${id}/`);
export const createItem = (data: object) => client.post('/menu/items/', data);
export const updateItem = (id: number, data: object) => client.patch(`/menu/items/${id}/`, data);
export const deleteItem = (id: number) => client.delete(`/menu/items/${id}/`);
export const toggleItem = (id: number) => client.patch(`/menu/items/${id}/toggle/`);
```

`frontend/src/api/tables.ts`:
```typescript
import client from './client';

export const listTables = () => client.get('/tables/');
export const activateTable = (tableId: number) =>
  client.post(`/tables/${tableId}/activate/`);
export const joinTable = (joinCode: string) =>
  client.post('/tables/join/', {join_code: joinCode});
```

`frontend/src/api/cart.ts`:
```typescript
import client from './client';

export const getCart = (sessionId: number) =>
  client.get('/cart/', {params: {session: sessionId}});
export const addCartItem = (data: {session: number; menu_item: number; quantity: number}) =>
  client.post('/cart/items/', data);
export const updateCartItem = (id: number, quantity: number) =>
  client.patch(`/cart/items/${id}/`, {quantity});
export const deleteCartItem = (id: number) =>
  client.delete(`/cart/items/${id}/`);
```

`frontend/src/api/orders.ts`:
```typescript
import client from './client';

export const submitOrder = (sessionId: number) =>
  client.post('/orders/', {session: sessionId});
export const listOrders = (params?: {session?: number}) =>
  client.get('/orders/', {params});
export const getOrder = (id: number) => client.get(`/orders/${id}/`);
export const updateOrderStatus = (id: number, status: string) =>
  client.patch(`/orders/${id}/status/`, {status});
export const checkout = (orderId: number) =>
  client.post(`/orders/${orderId}/checkout/`);
```

- [ ] **Step 6: Commit**

```bash
cd frontend && git add -A && git commit -m "feat(frontend): add project structure, axios client, and API modules"
```

---

## Task 11: Frontend — AuthContext + Login + Register screens

**Files:**
- Create: `frontend/src/context/AuthContext.tsx`
- Create: `frontend/src/screens/auth/LoginScreen.tsx`
- Create: `frontend/src/screens/auth/RegisterScreen.tsx`

- [ ] **Step 1: Create AuthContext**

`frontend/src/context/AuthContext.tsx`:
```typescript
import React, {createContext, useContext, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {login as apiLogin, register as apiRegister, getProfile} from 'src/api/auth';

interface User {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: 'admin' | 'staff' | 'customer';
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {email: string; password: string; name: string; phone?: string}) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        try {
          const res = await getProfile();
          setUser(res.data);
        } catch {
          await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
        }
      }
      setIsLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    await AsyncStorage.setItem('access_token', res.data.access);
    await AsyncStorage.setItem('refresh_token', res.data.refresh);
    const profile = await getProfile();
    setUser(profile.data);
  };

  const register = async (data: {email: string; password: string; name: string; phone?: string}) => {
    await apiRegister(data);
    await login(data.email, data.password);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{user, isLoading, login, register, logout}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

- [ ] **Step 2: Create LoginScreen**

`frontend/src/screens/auth/LoginScreen.tsx`:
```typescript
import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {useAuth} from 'src/context/AuthContext';

export default function LoginScreen({navigation}: any) {
  const {login} = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      Alert.alert('Login Failed', 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Yamato</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', padding: 24},
  title: {fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 32},
  input: {borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12},
  button: {backgroundColor: '#E84545', padding: 14, borderRadius: 8, alignItems: 'center'},
  buttonText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
  link: {textAlign: 'center', marginTop: 16, color: '#666'},
});
```

- [ ] **Step 3: Create RegisterScreen**

`frontend/src/screens/auth/RegisterScreen.tsx`:
```typescript
import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView} from 'react-native';
import {useAuth} from 'src/context/AuthContext';

export default function RegisterScreen({navigation}: any) {
  const {register} = useAuth();
  const [form, setForm] = useState({email: '', password: '', name: '', phone: ''});
  const [loading, setLoading] = useState(false);

  const set = (key: string) => (val: string) => setForm(f => ({...f, [key]: val}));

  const handleRegister = async () => {
    if (!form.email || !form.password || !form.name) {
      Alert.alert('Error', 'Email, password, and name are required.');
      return;
    }
    setLoading(true);
    try {
      await register(form);
    } catch (e: any) {
      const msg = e.response?.data?.email?.[0] || 'Registration failed.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      {(['name', 'email', 'phone'] as const).map(field => (
        <TextInput
          key={field}
          style={styles.input}
          placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
          autoCapitalize={field === 'email' ? 'none' : 'words'}
          keyboardType={field === 'email' ? 'email-address' : field === 'phone' ? 'phone-pad' : 'default'}
          value={form[field]}
          onChangeText={set(field)}
        />
      ))}
      <TextInput
        style={styles.input}
        placeholder="Password (min 8 characters)"
        secureTextEntry
        value={form.password}
        onChangeText={set('password')}
      />
      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Creating account...' : 'Register'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Sign In</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flexGrow: 1, justifyContent: 'center', padding: 24},
  title: {fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 24},
  input: {borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12},
  button: {backgroundColor: '#E84545', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8},
  buttonText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
  link: {textAlign: 'center', marginTop: 16, color: '#666'},
});
```

- [ ] **Step 4: Commit**

```bash
cd frontend && git add -A && git commit -m "feat(auth): add AuthContext, LoginScreen, RegisterScreen"
```

---

## Task 12: Frontend — Navigation (role-based routing)

**Files:**
- Create: `frontend/src/navigation/AppNavigator.tsx`
- Create: `frontend/src/navigation/CustomerNavigator.tsx`
- Create: `frontend/src/navigation/StaffNavigator.tsx`
- Create: `frontend/src/navigation/AdminNavigator.tsx`
- Create stub screens for all remaining screens
- Modify: `frontend/App.tsx`

- [ ] **Step 1: Create stub screens for all remaining screens**

Create each file with a minimal placeholder. Example for `TableJoinScreen.tsx` — apply the same pattern to all stubs:
```typescript
// frontend/src/screens/customer/TableJoinScreen.tsx
import React from 'react';
import {View, Text} from 'react-native';
export default function TableJoinScreen() {
  return <View><Text>TableJoin</Text></View>;
}
```

Create stubs for:
- `src/screens/customer/MenuScreen.tsx`
- `src/screens/customer/MenuItemDetailScreen.tsx`
- `src/screens/customer/CartScreen.tsx`
- `src/screens/customer/OrderStatusScreen.tsx`
- `src/screens/customer/ProfileScreen.tsx`
- `src/screens/staff/OrderListScreen.tsx`
- `src/screens/staff/OrderDetailScreen.tsx`
- `src/screens/staff/CheckoutScreen.tsx`
- `src/screens/admin/MenuManagementScreen.tsx`
- `src/screens/admin/CategoryManagementScreen.tsx`
- `src/screens/admin/OrderHistoryScreen.tsx`
- `src/screens/admin/UserManagementScreen.tsx`
- `src/screens/admin/StatsScreen.tsx`

- [ ] **Step 2: Create CustomerNavigator**

`frontend/src/navigation/CustomerNavigator.tsx`:
```typescript
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import TableJoinScreen from 'src/screens/customer/TableJoinScreen';
import MenuScreen from 'src/screens/customer/MenuScreen';
import MenuItemDetailScreen from 'src/screens/customer/MenuItemDetailScreen';
import CartScreen from 'src/screens/customer/CartScreen';
import OrderStatusScreen from 'src/screens/customer/OrderStatusScreen';
import ProfileScreen from 'src/screens/customer/ProfileScreen';

export type CustomerStackParams = {
  TableJoin: undefined;
  Menu: undefined;
  MenuItemDetail: {itemId: number};
  Cart: undefined;
  OrderStatus: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<CustomerStackParams>();

export default function CustomerNavigator() {
  return (
    <Stack.Navigator initialRouteName="TableJoin">
      <Stack.Screen name="TableJoin" component={TableJoinScreen} options={{title: 'Select Table'}} />
      <Stack.Screen name="Menu" component={MenuScreen} options={{title: 'Menu'}} />
      <Stack.Screen name="MenuItemDetail" component={MenuItemDetailScreen} options={{title: 'Item Details'}} />
      <Stack.Screen name="Cart" component={CartScreen} options={{title: 'Cart'}} />
      <Stack.Screen name="OrderStatus" component={OrderStatusScreen} options={{title: 'Order Status'}} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{title: 'Profile'}} />
    </Stack.Navigator>
  );
}
```

- [ ] **Step 3: Create StaffNavigator**

`frontend/src/navigation/StaffNavigator.tsx`:
```typescript
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import OrderListScreen from 'src/screens/staff/OrderListScreen';
import OrderDetailScreen from 'src/screens/staff/OrderDetailScreen';
import CheckoutScreen from 'src/screens/staff/CheckoutScreen';

export type StaffStackParams = {
  OrderList: undefined;
  OrderDetail: {orderId: number};
  Checkout: {orderId: number};
};

const Stack = createNativeStackNavigator<StaffStackParams>();

export default function StaffNavigator() {
  return (
    <Stack.Navigator initialRouteName="OrderList">
      <Stack.Screen name="OrderList" component={OrderListScreen} options={{title: 'Orders'}} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{title: 'Order Detail'}} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{title: 'Checkout'}} />
    </Stack.Navigator>
  );
}
```

- [ ] **Step 4: Create AdminNavigator**

`frontend/src/navigation/AdminNavigator.tsx`:
```typescript
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import MenuManagementScreen from 'src/screens/admin/MenuManagementScreen';
import CategoryManagementScreen from 'src/screens/admin/CategoryManagementScreen';
import OrderHistoryScreen from 'src/screens/admin/OrderHistoryScreen';
import UserManagementScreen from 'src/screens/admin/UserManagementScreen';
import StatsScreen from 'src/screens/admin/StatsScreen';

const Stack = createNativeStackNavigator();

export default function AdminNavigator() {
  return (
    <Stack.Navigator initialRouteName="MenuManagement">
      <Stack.Screen name="MenuManagement" component={MenuManagementScreen} options={{title: 'Menu'}} />
      <Stack.Screen name="CategoryManagement" component={CategoryManagementScreen} options={{title: 'Categories'}} />
      <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} options={{title: 'Order History'}} />
      <Stack.Screen name="UserManagement" component={UserManagementScreen} options={{title: 'Users'}} />
      <Stack.Screen name="Stats" component={StatsScreen} options={{title: 'Statistics'}} />
    </Stack.Navigator>
  );
}
```

- [ ] **Step 5: Create AppNavigator**

`frontend/src/navigation/AppNavigator.tsx`:
```typescript
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {ActivityIndicator, View} from 'react-native';
import {useAuth} from 'src/context/AuthContext';
import LoginScreen from 'src/screens/auth/LoginScreen';
import RegisterScreen from 'src/screens/auth/RegisterScreen';
import CustomerNavigator from './CustomerNavigator';
import StaffNavigator from './StaffNavigator';
import AdminNavigator from './AdminNavigator';

const Stack = createNativeStackNavigator();

function RoleNavigator() {
  const {user} = useAuth();
  if (user?.role === 'staff') return <StaffNavigator />;
  if (user?.role === 'admin') return <AdminNavigator />;
  return <CustomerNavigator />;
}

export default function AppNavigator() {
  const {user, isLoading} = useAuth();

  if (isLoading) {
    return <View style={{flex: 1, justifyContent: 'center'}}><ActivityIndicator size="large" /></View>;
  }

  return (
    <NavigationContainer>
      {user ? (
        <RoleNavigator />
      ) : (
        <Stack.Navigator screenOptions={{headerShown: false}}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
```

- [ ] **Step 6: Update App.tsx**

`frontend/App.tsx`:
```typescript
import React from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthProvider} from 'src/context/AuthContext';
import AppNavigator from 'src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 7: Verify the app builds**

```bash
cd frontend && npx react-native start
```

In a separate terminal:
```bash
cd frontend && npx react-native run-ios
```

Expected: app launches, shows LoginScreen.

- [ ] **Step 8: Commit**

```bash
cd frontend && git add -A && git commit -m "feat(navigation): add role-based AppNavigator with stub screens"
```

---

## Task 13: Frontend — TableContext + TableJoinScreen + useWebSocket

**Files:**
- Create: `frontend/src/context/TableContext.tsx`
- Create: `frontend/src/hooks/useWebSocket.ts`
- Implement: `frontend/src/screens/customer/TableJoinScreen.tsx`

- [ ] **Step 1: Create TableContext**

`frontend/src/context/TableContext.tsx`:
```typescript
import React, {createContext, useContext, useState} from 'react';

interface TableContextValue {
  sessionId: number | null;
  tableNumber: number | null;
  joinSession: (sessionId: number, tableNumber: number) => void;
  leaveSession: () => void;
}

const TableContext = createContext<TableContextValue | null>(null);

export function TableProvider({children}: {children: React.ReactNode}) {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [tableNumber, setTableNumber] = useState<number | null>(null);

  const joinSession = (id: number, num: number) => {
    setSessionId(id);
    setTableNumber(num);
  };

  const leaveSession = () => {
    setSessionId(null);
    setTableNumber(null);
  };

  return (
    <TableContext.Provider value={{sessionId, tableNumber, joinSession, leaveSession}}>
      {children}
    </TableContext.Provider>
  );
}

export function useTable() {
  const ctx = useContext(TableContext);
  if (!ctx) throw new Error('useTable must be used within TableProvider');
  return ctx;
}
```

- [ ] **Step 2: Add TableProvider to App.tsx**

Edit `frontend/App.tsx`:
```typescript
import React from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthProvider} from 'src/context/AuthContext';
import {TableProvider} from 'src/context/TableContext';
import AppNavigator from 'src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <TableProvider>
          <AppNavigator />
        </TableProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 3: Create useWebSocket hook**

`frontend/src/hooks/useWebSocket.ts`:
```typescript
import {useEffect, useRef, useCallback} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AppState} from 'react-native';

const WS_BASE = 'ws://10.0.2.2:8000'; // Android emulator; use localhost for iOS simulator

export function useWebSocket(path: string | null, onMessage: (data: any) => void) {
  const ws = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(async () => {
    if (!path) return;
    const token = await AsyncStorage.getItem('access_token');
    const url = `${WS_BASE}${path}${token ? `?token=${token}` : ''}`;
    const socket = new WebSocket(url);

    socket.onmessage = event => {
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current(data);
      } catch {}
    };

    socket.onclose = () => {
      // Reconnect after 3 seconds on unexpected close
      setTimeout(connect, 3000);
    };

    ws.current = socket;
  }, [path]);

  useEffect(() => {
    connect();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') connect();
    });
    return () => {
      sub.remove();
      ws.current?.close();
    };
  }, [connect]);
}
```

> **Note:** Django Channels' `AuthMiddlewareStack` uses Django session auth. To pass a JWT via WebSocket (which can't send custom headers), you need to accept the token as a query param and validate it in the consumer. Update `TableConsumer.connect` to check `self.scope['query_string']` if `self.scope['user']` is anonymous:

Add to `backend/apps/tables/consumers.py` — update `TableConsumer.connect`:
```python
async def connect(self):
    self.session_id = self.scope['url_route']['kwargs']['session_id']
    self.group_name = f'table_session_{self.session_id}'

    # Validate JWT from query string if user not set by middleware
    user = self.scope.get('user')
    if not user or not user.is_authenticated:
        user = await self._get_user_from_token()
    if not user:
        await self.close()
        return

    session_exists = await self._session_is_active(self.session_id)
    if not session_exists:
        await self.close()
        return

    await self.channel_layer.group_add(self.group_name, self.channel_name)
    await self.accept()

@database_sync_to_async
def _get_user_from_token(self):
    from rest_framework_simplejwt.tokens import AccessToken
    from apps.users.models import User
    qs = self.scope.get('query_string', b'').decode()
    for part in qs.split('&'):
        if part.startswith('token='):
            token_str = part[6:]
            try:
                token = AccessToken(token_str)
                return User.objects.get(id=token['user_id'])
            except Exception:
                return None
    return None
```

Apply the same `_get_user_from_token` pattern to `StaffOrderConsumer.connect`.

- [ ] **Step 4: Implement TableJoinScreen**

`frontend/src/screens/customer/TableJoinScreen.tsx`:
```typescript
import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {joinTable} from 'src/api/tables';
import {useTable} from 'src/context/TableContext';

export default function TableJoinScreen({navigation}: any) {
  const {joinSession} = useTable();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (code.trim().length !== 4) {
      Alert.alert('Error', 'Please enter a 4-character table code.');
      return;
    }
    setLoading(true);
    try {
      const res = await joinTable(code.toUpperCase());
      joinSession(res.data.session_id, res.data.table_number);
      navigation.replace('Menu');
    } catch (e: any) {
      const msg = e.response?.status === 404 ? 'Invalid or expired code.' : 'Could not join table.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Table Code</Text>
      <Text style={styles.subtitle}>Ask your server for the 4-character code</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. A3F7"
        autoCapitalize="characters"
        maxLength={4}
        value={code}
        onChangeText={setCode}
      />
      <TouchableOpacity style={styles.button} onPress={handleJoin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Joining...' : 'Join Table'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', padding: 24, alignItems: 'center'},
  title: {fontSize: 24, fontWeight: 'bold', marginBottom: 8},
  subtitle: {color: '#666', marginBottom: 32, textAlign: 'center'},
  input: {borderWidth: 2, borderColor: '#E84545', borderRadius: 8, padding: 16, fontSize: 24, letterSpacing: 8, textAlign: 'center', width: 200, marginBottom: 24},
  button: {backgroundColor: '#E84545', padding: 14, borderRadius: 8, width: 200, alignItems: 'center'},
  buttonText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
});
```

- [ ] **Step 5: Commit**

```bash
cd frontend && git add -A && git commit -m "feat(tables): add TableContext, useWebSocket hook, TableJoinScreen"
```

---

## Task 14: Frontend — Menu browsing screens

**Files:**
- Create: `frontend/src/components/MenuItemCard.tsx`
- Implement: `frontend/src/screens/customer/MenuScreen.tsx`
- Implement: `frontend/src/screens/customer/MenuItemDetailScreen.tsx`

- [ ] **Step 1: Create MenuItemCard component**

`frontend/src/components/MenuItemCard.tsx`:
```typescript
import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';

interface Props {
  item: {id: number; name: string; description: string; price: string};
  onPress: () => void;
}

export default function MenuItemCard({item, onPress}: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
      </View>
      <Text style={styles.price}>${item.price}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#eee'},
  info: {flex: 1},
  name: {fontSize: 16, fontWeight: '600'},
  desc: {color: '#888', marginTop: 4, fontSize: 13},
  price: {fontSize: 16, fontWeight: 'bold', color: '#E84545', marginLeft: 12},
});
```

- [ ] **Step 2: Implement MenuScreen**

`frontend/src/screens/customer/MenuScreen.tsx`:
```typescript
import React, {useEffect, useState} from 'react';
import {View, FlatList, TouchableOpacity, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {listCategories, listItems} from 'src/api/menu';
import MenuItemCard from 'src/components/MenuItemCard';

export default function MenuScreen({navigation}: any) {
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCategories().then(res => setCategories(res.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    listItems(selectedCat ? {category: selectedCat} : undefined)
      .then(res => setItems(res.data))
      .finally(() => setLoading(false));
  }, [selectedCat]);

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        data={[{id: null, name: 'All'}, ...categories]}
        keyExtractor={c => String(c.id)}
        renderItem={({item: cat}) => (
          <TouchableOpacity
            style={[styles.catBtn, selectedCat === cat.id && styles.catBtnActive]}
            onPress={() => setSelectedCat(cat.id)}>
            <Text style={[styles.catText, selectedCat === cat.id && styles.catTextActive]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        )}
        style={styles.catList}
        showsHorizontalScrollIndicator={false}
      />
      {loading ? (
        <ActivityIndicator style={{flex: 1}} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => String(i.id)}
          renderItem={({item}) => (
            <MenuItemCard item={item} onPress={() => navigation.navigate('MenuItemDetail', {itemId: item.id})} />
          )}
        />
      )}
      <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('Cart')}>
        <Text style={styles.cartBtnText}>View Cart</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  catList: {maxHeight: 52, paddingHorizontal: 12, paddingVertical: 8},
  catBtn: {paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#eee', marginRight: 8},
  catBtnActive: {backgroundColor: '#E84545'},
  catText: {color: '#333'},
  catTextActive: {color: '#fff', fontWeight: 'bold'},
  cartBtn: {backgroundColor: '#E84545', margin: 16, padding: 14, borderRadius: 8, alignItems: 'center'},
  cartBtnText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
});
```

- [ ] **Step 3: Implement MenuItemDetailScreen**

`frontend/src/screens/customer/MenuItemDetailScreen.tsx`:
```typescript
import React, {useEffect, useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator} from 'react-native';
import {getItem} from 'src/api/menu';
import {addCartItem} from 'src/api/cart';
import {useTable} from 'src/context/TableContext';

export default function MenuItemDetailScreen({route, navigation}: any) {
  const {itemId} = route.params;
  const {sessionId} = useTable();
  const [item, setItem] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    getItem(itemId).then(res => setItem(res.data));
  }, [itemId]);

  const handleAdd = async () => {
    if (!sessionId) {
      Alert.alert('No table', 'You have not joined a table yet.');
      return;
    }
    setAdding(true);
    try {
      await addCartItem({session: sessionId, menu_item: itemId, quantity});
      Alert.alert('Added', `${item.name} added to cart.`, [
        {text: 'Keep browsing'},
        {text: 'View Cart', onPress: () => navigation.navigate('Cart')},
      ]);
    } catch {
      Alert.alert('Error', 'Could not add item to cart.');
    } finally {
      setAdding(false);
    }
  };

  if (!item) return <ActivityIndicator style={{flex: 1}} />;

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.price}>${item.price}</Text>
      <Text style={styles.desc}>{item.description}</Text>
      <View style={styles.qtyRow}>
        <TouchableOpacity onPress={() => setQuantity(q => Math.max(1, q - 1))} style={styles.qtyBtn}>
          <Text style={styles.qtyBtnText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.qty}>{quantity}</Text>
        <TouchableOpacity onPress={() => setQuantity(q => q + 1)} style={styles.qtyBtn}>
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.addBtn} onPress={handleAdd} disabled={adding}>
        <Text style={styles.addBtnText}>{adding ? 'Adding...' : `Add to Cart — $${(item.price * quantity).toFixed(2)}`}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 24, backgroundColor: '#fff'},
  name: {fontSize: 24, fontWeight: 'bold', marginBottom: 8},
  price: {fontSize: 20, color: '#E84545', marginBottom: 16},
  desc: {fontSize: 15, color: '#555', lineHeight: 22, marginBottom: 32},
  qtyRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 24},
  qtyBtn: {width: 44, height: 44, borderRadius: 22, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center'},
  qtyBtnText: {fontSize: 22, fontWeight: 'bold'},
  qty: {fontSize: 20, fontWeight: 'bold', marginHorizontal: 24},
  addBtn: {backgroundColor: '#E84545', padding: 16, borderRadius: 8, alignItems: 'center'},
  addBtnText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
});
```

- [ ] **Step 4: Commit**

```bash
cd frontend && git add -A && git commit -m "feat(menu): implement MenuScreen and MenuItemDetailScreen"
```

---

## Task 15: Frontend — Cart screen + useCart hook

**Files:**
- Create: `frontend/src/hooks/useCart.ts`
- Create: `frontend/src/components/CartItemRow.tsx`
- Implement: `frontend/src/screens/customer/CartScreen.tsx`

- [ ] **Step 1: Create useCart hook**

`frontend/src/hooks/useCart.ts`:
```typescript
import {useState, useCallback, useEffect} from 'react';
import {getCart} from 'src/api/cart';
import {useWebSocket} from './useWebSocket';
import {useTable} from 'src/context/TableContext';

export function useCart() {
  const {sessionId} = useTable();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await getCart(sessionId);
      setCartItems(res.data);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const wsPath = sessionId ? `/ws/table/${sessionId}/` : null;
  useWebSocket(wsPath, msg => {
    if (msg.type === 'cart_updated') fetchCart();
  });

  const total = cartItems.reduce((sum, item) => sum + parseFloat(item.item_price) * item.quantity, 0);

  return {cartItems, loading, fetchCart, total};
}
```

- [ ] **Step 2: Create CartItemRow component**

`frontend/src/components/CartItemRow.tsx`:
```typescript
import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {updateCartItem, deleteCartItem} from 'src/api/cart';

interface Props {
  item: {id: number; item_name: string; item_price: string; quantity: number; item_unavailable: boolean};
  onChanged: () => void;
}

export default function CartItemRow({item, onChanged}: Props) {
  const handleQty = async (delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty < 1) {
      await deleteCartItem(item.id);
    } else {
      await updateCartItem(item.id, newQty);
    }
    onChanged();
  };

  return (
    <View style={[styles.row, item.item_unavailable && styles.unavailable]}>
      <View style={styles.info}>
        <Text style={styles.name}>{item.item_name}</Text>
        {item.item_unavailable && <Text style={styles.warn}>Item no longer available</Text>}
      </View>
      <View style={styles.controls}>
        <TouchableOpacity onPress={() => handleQty(-1)} style={styles.btn}>
          <Text style={styles.btnText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.qty}>{item.quantity}</Text>
        <TouchableOpacity onPress={() => handleQty(1)} style={styles.btn}>
          <Text style={styles.btnText}>+</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.price}>${(parseFloat(item.item_price) * item.quantity).toFixed(2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderColor: '#eee'},
  unavailable: {opacity: 0.5},
  info: {flex: 1},
  name: {fontSize: 15, fontWeight: '500'},
  warn: {color: '#E84545', fontSize: 12, marginTop: 2},
  controls: {flexDirection: 'row', alignItems: 'center', marginHorizontal: 12},
  btn: {width: 30, height: 30, borderRadius: 15, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center'},
  btnText: {fontSize: 18, fontWeight: 'bold'},
  qty: {fontSize: 16, fontWeight: 'bold', marginHorizontal: 10},
  price: {fontSize: 15, fontWeight: '600', color: '#333', width: 64, textAlign: 'right'},
});
```

- [ ] **Step 3: Implement CartScreen**

`frontend/src/screens/customer/CartScreen.tsx`:
```typescript
import React, {useState} from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator} from 'react-native';
import {useCart} from 'src/hooks/useCart';
import {useTable} from 'src/context/TableContext';
import {submitOrder} from 'src/api/orders';
import CartItemRow from 'src/components/CartItemRow';

export default function CartScreen({navigation}: any) {
  const {sessionId, tableNumber} = useTable();
  const {cartItems, loading, fetchCart, total} = useCart();
  const [submitting, setSubmitting] = useState(false);

  const hasUnavailable = cartItems.some(i => i.item_unavailable);

  const handleSubmit = async () => {
    if (hasUnavailable) {
      Alert.alert('Remove unavailable items', 'Please remove unavailable items before submitting.');
      return;
    }
    if (cartItems.length === 0) {
      Alert.alert('Empty cart', 'Add items before placing an order.');
      return;
    }
    setSubmitting(true);
    try {
      await submitOrder(sessionId!);
      Alert.alert('Order placed!', 'Your order has been sent to the kitchen.', [
        {text: 'OK', onPress: () => navigation.navigate('OrderStatus')},
      ]);
    } catch {
      Alert.alert('Error', 'Could not place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <ActivityIndicator style={{flex: 1}} />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Table {tableNumber} — Cart</Text>
      {cartItems.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
            <Text style={styles.link}>Browse Menu</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={i => String(i.id)}
            renderItem={({item}) => <CartItemRow item={item} onChanged={fetchCart} />}
          />
          <View style={styles.footer}>
            <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>
            <TouchableOpacity
              style={[styles.orderBtn, hasUnavailable && styles.disabledBtn]}
              onPress={handleSubmit}
              disabled={submitting || hasUnavailable}>
              <Text style={styles.orderBtnText}>{submitting ? 'Placing order...' : 'Place Order'}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  header: {fontSize: 18, fontWeight: 'bold', padding: 16, borderBottomWidth: 1, borderColor: '#eee'},
  empty: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  emptyText: {fontSize: 16, color: '#888', marginBottom: 12},
  link: {color: '#E84545', fontSize: 16},
  footer: {padding: 16, borderTopWidth: 1, borderColor: '#eee'},
  total: {fontSize: 18, fontWeight: 'bold', marginBottom: 12},
  orderBtn: {backgroundColor: '#E84545', padding: 16, borderRadius: 8, alignItems: 'center'},
  disabledBtn: {backgroundColor: '#ccc'},
  orderBtnText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
});
```

- [ ] **Step 4: Commit**

```bash
cd frontend && git add -A && git commit -m "feat(cart): implement CartScreen with real-time shared cart via WebSocket"
```

---

## Task 16: Frontend — OrderStatusScreen + Staff screens

**Files:**
- Create: `frontend/src/hooks/useOrders.ts`
- Create: `frontend/src/components/OrderStatusBadge.tsx`
- Implement: `frontend/src/screens/customer/OrderStatusScreen.tsx`
- Implement: `frontend/src/screens/staff/OrderListScreen.tsx`
- Implement: `frontend/src/screens/staff/OrderDetailScreen.tsx`
- Implement: `frontend/src/screens/staff/CheckoutScreen.tsx`

- [ ] **Step 1: Create useOrders hook (staff)**

`frontend/src/hooks/useOrders.ts`:
```typescript
import {useState, useCallback, useEffect} from 'react';
import {listOrders} from 'src/api/orders';
import {useWebSocket} from './useWebSocket';

export function useStaffOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listOrders();
      setOrders(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useWebSocket('/ws/orders/', msg => {
    if (msg.type === 'order_created') fetchOrders();
  });

  return {orders, loading, fetchOrders};
}
```

- [ ] **Step 2: Create OrderStatusBadge**

`frontend/src/components/OrderStatusBadge.tsx`:
```typescript
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const COLORS: Record<string, string> = {
  pending: '#F5A623',
  preparing: '#4A90E2',
  completed: '#7ED321',
  paid: '#9B9B9B',
};

export default function OrderStatusBadge({status}: {status: string}) {
  return (
    <View style={[styles.badge, {backgroundColor: COLORS[status] || '#ccc'}]}>
      <Text style={styles.text}>{status.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start'},
  text: {color: '#fff', fontSize: 11, fontWeight: 'bold'},
});
```

- [ ] **Step 3: Implement OrderStatusScreen (customer)**

`frontend/src/screens/customer/OrderStatusScreen.tsx`:
```typescript
import React, {useEffect, useState} from 'react';
import {View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity} from 'react-native';
import {listOrders} from 'src/api/orders';
import {useTable} from 'src/context/TableContext';
import OrderStatusBadge from 'src/components/OrderStatusBadge';

export default function OrderStatusScreen({navigation}: any) {
  const {sessionId} = useTable();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    listOrders({session: sessionId})
      .then(res => setOrders(res.data))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return <ActivityIndicator style={{flex: 1}} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={o => String(o.id)}
        renderItem={({item: order}) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.orderId}>Order #{order.id}</Text>
              <OrderStatusBadge status={order.status} />
            </View>
            {order.orderitems.map((oi: any) => (
              <Text key={oi.id} style={styles.itemLine}>{oi.quantity}x {oi.item_name} — ${oi.price}</Text>
            ))}
            <Text style={styles.total}>Total: ${order.total_amount}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No orders yet.</Text>}
      />
      <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.navigate('Menu')}>
        <Text style={styles.menuBtnText}>Back to Menu</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  card: {backgroundColor: '#fff', margin: 12, padding: 16, borderRadius: 8},
  cardHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12},
  orderId: {fontSize: 16, fontWeight: 'bold'},
  itemLine: {fontSize: 14, color: '#555', marginBottom: 4},
  total: {fontSize: 15, fontWeight: 'bold', marginTop: 8},
  empty: {textAlign: 'center', padding: 40, color: '#888'},
  menuBtn: {margin: 16, padding: 14, backgroundColor: '#E84545', borderRadius: 8, alignItems: 'center'},
  menuBtnText: {color: '#fff', fontWeight: 'bold'},
});
```

- [ ] **Step 4: Implement OrderListScreen (staff)**

`frontend/src/screens/staff/OrderListScreen.tsx`:
```typescript
import React from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator} from 'react-native';
import {useStaffOrders} from 'src/hooks/useOrders';
import OrderStatusBadge from 'src/components/OrderStatusBadge';

export default function OrderListScreen({navigation}: any) {
  const {orders, loading, fetchOrders} = useStaffOrders();

  if (loading) return <ActivityIndicator style={{flex: 1}} />;

  return (
    <FlatList
      data={orders}
      keyExtractor={o => String(o.id)}
      onRefresh={fetchOrders}
      refreshing={loading}
      renderItem={({item: order}) => (
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('OrderDetail', {orderId: order.id})}>
          <View style={styles.info}>
            <Text style={styles.table}>Table {order.table_number}</Text>
            <Text style={styles.meta}>{order.orderitems.length} items · ${order.total_amount}</Text>
          </View>
          <OrderStatusBadge status={order.status} />
        </TouchableOpacity>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No active orders</Text>}
    />
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#eee', backgroundColor: '#fff'},
  info: {flex: 1},
  table: {fontSize: 16, fontWeight: 'bold'},
  meta: {color: '#888', marginTop: 4},
  empty: {textAlign: 'center', padding: 40, color: '#888'},
});
```

- [ ] **Step 5: Implement OrderDetailScreen (staff)**

`frontend/src/screens/staff/OrderDetailScreen.tsx`:
```typescript
import React, {useEffect, useState} from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator} from 'react-native';
import {getOrder, updateOrderStatus} from 'src/api/orders';
import OrderStatusBadge from 'src/components/OrderStatusBadge';

const NEXT_STATUS: Record<string, string> = {
  pending: 'preparing',
  preparing: 'completed',
};

export default function OrderDetailScreen({route, navigation}: any) {
  const {orderId} = route.params;
  const [order, setOrder] = useState<any>(null);
  const [updating, setUpdating] = useState(false);

  const load = () => getOrder(orderId).then(res => setOrder(res.data));
  useEffect(() => { load(); }, [orderId]);

  const handleAdvance = async () => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setUpdating(true);
    try {
      await updateOrderStatus(orderId, next);
      await load();
    } finally {
      setUpdating(false);
    }
  };

  const handleCheckout = () => {
    navigation.navigate('Checkout', {orderId});
  };

  if (!order) return <ActivityIndicator style={{flex: 1}} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Table {order.table_number} — Order #{order.id}</Text>
        <OrderStatusBadge status={order.status} />
      </View>
      <FlatList
        data={order.orderitems}
        keyExtractor={(i: any) => String(i.id)}
        renderItem={({item}: any) => (
          <View style={styles.itemRow}>
            <Text style={styles.itemName}>{item.quantity}x {item.item_name}</Text>
            <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
          </View>
        )}
      />
      <View style={styles.footer}>
        <Text style={styles.total}>Total: ${order.total_amount}</Text>
        {NEXT_STATUS[order.status] && (
          <TouchableOpacity style={styles.actionBtn} onPress={handleAdvance} disabled={updating}>
            <Text style={styles.actionBtnText}>
              {updating ? 'Updating...' : `Mark as ${NEXT_STATUS[order.status]}`}
            </Text>
          </TouchableOpacity>
        )}
        {order.status === 'completed' && (
          <TouchableOpacity style={[styles.actionBtn, styles.checkoutBtn]} onPress={handleCheckout}>
            <Text style={styles.actionBtnText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#eee'},
  title: {fontSize: 16, fontWeight: 'bold'},
  itemRow: {flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderColor: '#f0f0f0'},
  itemName: {fontSize: 15},
  itemPrice: {fontWeight: '600'},
  footer: {padding: 16, borderTopWidth: 1, borderColor: '#eee'},
  total: {fontSize: 18, fontWeight: 'bold', marginBottom: 12},
  actionBtn: {backgroundColor: '#4A90E2', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 8},
  checkoutBtn: {backgroundColor: '#7ED321'},
  actionBtnText: {color: '#fff', fontWeight: 'bold', fontSize: 15},
});
```

- [ ] **Step 6: Implement CheckoutScreen (staff)**

`frontend/src/screens/staff/CheckoutScreen.tsx`:
```typescript
import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {checkout} from 'src/api/orders';

export default function CheckoutScreen({route, navigation}: any) {
  const {orderId} = route.params;
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await checkout(orderId);
      Alert.alert('Done', 'Payment confirmed. Table is now available.', [
        {text: 'OK', onPress: () => navigation.popToTop()},
      ]);
    } catch (e: any) {
      const msg = e.response?.data?.detail || 'Checkout failed.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirm Payment</Text>
      <Text style={styles.sub}>Once confirmed, the table will be reset for the next group.</Text>
      <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} disabled={loading}>
        <Text style={styles.confirmBtnText}>{loading ? 'Processing...' : 'Confirm Payment'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.cancel}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', padding: 32, alignItems: 'center'},
  title: {fontSize: 24, fontWeight: 'bold', marginBottom: 12},
  sub: {textAlign: 'center', color: '#666', marginBottom: 40, lineHeight: 22},
  confirmBtn: {backgroundColor: '#7ED321', padding: 18, borderRadius: 8, width: '100%', alignItems: 'center', marginBottom: 16},
  confirmBtnText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
  cancel: {color: '#888', fontSize: 15},
});
```

- [ ] **Step 7: Commit**

```bash
cd frontend && git add -A && git commit -m "feat(orders): implement order status, staff order management, and checkout screens"
```

---

## Task 17: Frontend — Admin screens

**Files:**
- Implement: `frontend/src/screens/admin/MenuManagementScreen.tsx`
- Implement: `frontend/src/screens/admin/CategoryManagementScreen.tsx`
- Implement: `frontend/src/screens/admin/OrderHistoryScreen.tsx`
- Implement: `frontend/src/screens/admin/UserManagementScreen.tsx`
- Implement: `frontend/src/screens/admin/StatsScreen.tsx`

> The admin screens follow the same data-fetching pattern. Full implementations below.

- [ ] **Step 1: MenuManagementScreen**

`frontend/src/screens/admin/MenuManagementScreen.tsx`:
```typescript
import React, {useEffect, useState} from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Switch} from 'react-native';
import {listItems, deleteItem, toggleItem} from 'src/api/menu';

export default function MenuManagementScreen({navigation}: any) {
  const [items, setItems] = useState<any[]>([]);

  const load = () => listItems().then(res => setItems(res.data));
  useEffect(() => { load(); }, []);

  const handleDelete = (id: number, name: string) => {
    Alert.alert('Delete', `Delete "${name}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: async () => { await deleteItem(id); load(); }},
    ]);
  };

  const handleToggle = async (id: number) => {
    await toggleItem(id);
    load();
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={i => String(i.id)}
        onRefresh={load}
        refreshing={false}
        renderItem={({item}) => (
          <View style={styles.row}>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>${item.price}</Text>
            </View>
            <Switch value={item.is_available} onValueChange={() => handleToggle(item.id)} />
            <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.del}>
              <Text style={styles.delText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => navigation.navigate('CategoryManagement')}>
        <Text style={styles.addBtnText}>Manage Categories</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  row: {flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderColor: '#eee'},
  info: {flex: 1},
  name: {fontSize: 15, fontWeight: '500'},
  price: {color: '#888', fontSize: 13},
  del: {marginLeft: 12},
  delText: {color: '#E84545'},
  addBtn: {margin: 16, backgroundColor: '#4A90E2', padding: 14, borderRadius: 8, alignItems: 'center'},
  addBtnText: {color: '#fff', fontWeight: 'bold'},
});
```

- [ ] **Step 2: OrderHistoryScreen**

`frontend/src/screens/admin/OrderHistoryScreen.tsx`:
```typescript
import React, {useEffect, useState} from 'react';
import {View, Text, FlatList, StyleSheet, ActivityIndicator} from 'react-native';
import {listOrders} from 'src/api/orders';
import OrderStatusBadge from 'src/components/OrderStatusBadge';

export default function OrderHistoryScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listOrders().then(res => setOrders(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator style={{flex: 1}} />;

  return (
    <FlatList
      data={orders}
      keyExtractor={o => String(o.id)}
      renderItem={({item: o}) => (
        <View style={styles.row}>
          <View style={styles.info}>
            <Text style={styles.title}>Table {o.table_number} — Order #{o.id}</Text>
            <Text style={styles.meta}>{o.orderitems?.length} items · ${o.total_amount}</Text>
          </View>
          <OrderStatusBadge status={o.status} />
        </View>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No order history.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#eee', backgroundColor: '#fff'},
  info: {flex: 1},
  title: {fontWeight: 'bold', fontSize: 15},
  meta: {color: '#888', marginTop: 4},
  empty: {textAlign: 'center', padding: 40, color: '#888'},
});
```

- [ ] **Step 3: StatsScreen (placeholder — backend /api/admin/stats/ endpoint needed)**

`frontend/src/screens/admin/StatsScreen.tsx`:
```typescript
import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import client from 'src/api/client';

export default function StatsScreen() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    client.get('/admin/stats/').then(res => setStats(res.data)).catch(() => {});
  }, []);

  if (!stats) return <ActivityIndicator style={{flex: 1}} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today's Stats</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Total Orders</Text>
        <Text style={styles.value}>{stats.order_count}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Total Revenue</Text>
        <Text style={styles.value}>${stats.total_revenue}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 20, backgroundColor: '#f5f5f5'},
  title: {fontSize: 22, fontWeight: 'bold', marginBottom: 20},
  card: {backgroundColor: '#fff', padding: 20, borderRadius: 8, marginBottom: 12},
  label: {color: '#888', fontSize: 14},
  value: {fontSize: 28, fontWeight: 'bold', marginTop: 4},
});
```

> **Note:** The `/api/admin/stats/` endpoint needs a view in the backend. Add to `backend/apps/orders/views.py`:

```python
from django.db.models import Sum, Count
from django.utils import timezone

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def stats_view(request):
    if request.user.role != 'admin':
        return Response({'detail': 'Admin only.'}, status=403)
    today = timezone.now().date()
    today_orders = Order.objects.filter(created_at__date=today, status='paid')
    data = today_orders.aggregate(
        order_count=Count('id'),
        total_revenue=Sum('total_amount'),
    )
    data['total_revenue'] = data['total_revenue'] or '0.00'
    return Response(data)
```

Add import at top of `orders/views.py`: `from rest_framework.decorators import api_view`

Add to `backend/apps/orders/urls.py`:
```python
from .views import OrderListView, OrderDetailView, OrderStatusView, CheckoutView, stats_view

urlpatterns = [
    path('', OrderListView.as_view(), name='order-list'),
    path('<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('<int:pk>/status/', OrderStatusView.as_view(), name='order-status'),
    path('<int:pk>/checkout/', CheckoutView.as_view(), name='checkout'),
    path('stats/', stats_view, name='stats'),
]
```

- [ ] **Step 4: CategoryManagementScreen and UserManagementScreen stubs**

Create minimal but functional list screens:

`frontend/src/screens/admin/CategoryManagementScreen.tsx`:
```typescript
import React, {useEffect, useState} from 'react';
import {View, Text, FlatList, StyleSheet} from 'react-native';
import {listCategories} from 'src/api/menu';

export default function CategoryManagementScreen() {
  const [cats, setCats] = useState<any[]>([]);
  useEffect(() => { listCategories().then(r => setCats(r.data)); }, []);
  return (
    <FlatList
      data={cats}
      keyExtractor={c => String(c.id)}
      renderItem={({item}) => (
        <View style={{padding: 16, borderBottomWidth: 1, borderColor: '#eee'}}>
          <Text style={{fontSize: 16}}>{item.name}</Text>
        </View>
      )}
    />
  );
}
```

`frontend/src/screens/admin/UserManagementScreen.tsx`:
```typescript
import React, {useEffect, useState} from 'react';
import {View, Text, FlatList} from 'react-native';
import client from 'src/api/client';

export default function UserManagementScreen() {
  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => { client.get('/admin/users/').then(r => setUsers(r.data)).catch(() => {}); }, []);
  return (
    <FlatList
      data={users}
      keyExtractor={u => String(u.id)}
      renderItem={({item}) => (
        <View style={{padding: 16, borderBottomWidth: 1, borderColor: '#eee'}}>
          <Text style={{fontWeight: 'bold'}}>{item.name}</Text>
          <Text style={{color: '#888'}}>{item.email} · {item.role}</Text>
        </View>
      )}
    />
  );
}
```

> **Note:** The `/api/admin/users/` endpoint needs a view in `users/views.py`. Add:

```python
class AdminUserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'admin':
            return User.objects.none()
        return User.objects.all().order_by('role', 'name')
```

And add to `apps/users/urls.py`:
```python
from .views import RegisterView, ProfileView, AdminUserListView
urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('users/', AdminUserListView.as_view(), name='admin-user-list'),
]
```

- [ ] **Step 5: Run all backend tests one final time**

```bash
cd backend && pytest -v
```

Expected: all tests pass.

- [ ] **Step 6: Final commit**

```bash
cd frontend && git add -A && git commit -m "feat(admin): implement admin screens — menu management, order history, stats, users"
cd backend && git add -A && git commit -m "feat(admin): add stats and user list endpoints"
```

---

## Appendix: Running the project

```bash
# Terminal 1 — Redis
redis-server

# Terminal 2 — Django (ASGI via daphne)
cd backend && source venv/bin/activate
daphne -b 0.0.0.0 -p 8000 config.asgi:application

# Terminal 3 — React Native Metro bundler
cd frontend && npx react-native start

# Terminal 4 — iOS simulator or Android emulator
cd frontend && npx react-native run-ios
# or
cd frontend && npx react-native run-android
```

> **Android note:** `10.0.2.2` maps to the host machine from the Android emulator. For iOS simulator, use `localhost`.
