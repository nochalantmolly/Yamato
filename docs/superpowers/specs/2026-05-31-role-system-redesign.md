# Role System & App Flow Redesign

## Overview

Redesign the Yamato app entry flow to support three distinct roles (customer, staff, admin) with appropriate access levels. Customers require no authentication. Table codes rotate daily for security.

## 1. Entry Screen (Role Selection)

The app launches to a simple screen with three buttons:

- **"I'm a Customer"** — goes directly to table code entry (no auth)
- **"Staff Login"** — shows email/password login form
- **"Admin Login"** — shows email/password login form

No registration option on this screen. Staff/admin accounts are created by an existing admin only.

## 2. Customer Flow (Anonymous)

### No authentication required

- Customer taps "I'm a Customer" → enters 4-character daily table code
- Valid code creates an anonymous session tied to that table
- Customer can: browse menu, select variants (spicy, beef, etc.), set quantity, add to cart, place orders
- No account, no email, no login

### Backend changes for anonymous access

- Cart and order endpoints accept a `session_token` (UUID) stored on device
- The session token is generated client-side on first visit and stored in AsyncStorage
- Endpoints validate that the session token belongs to an active table session
- Remove JWT requirement from customer-facing endpoints (menu browsing, cart, orders)

## 3. Daily Rotating Table Codes

### 14 fixed tables (table numbers 1-14)

- Each table gets a new random 4-character alphanumeric code generated daily
- Rotation happens automatically at midnight (server time)
- Implementation: `daily_code` field on `Table` model + `code_date` field
- On access, if `code_date` != today, regenerate the code automatically
- Codes are unique across all tables for a given day

### Code validation

- Customer enters code → backend looks up table with matching `daily_code` where `code_date` = today
- If found, creates/joins a `TableSession` for that table
- If not found, show error "Invalid code"

## 4. Staff Dashboard

### Capabilities

- **View all tables**: grid/list showing all 14 tables with status (available/occupied/billing), current daily code, and number of active orders
- **View table details**: tap a table to see current session's orders, items ordered, running total
- **Actions on orders**: mark individual items or whole orders as "ready" or "served"
- **Close table**: end the session, mark table as available (generates new code on next use)
- **Add items for customer**: staff can add menu items to a table's cart on their behalf
- **Order history**: view past sessions with date, table number, total, items ordered

### Access

- Requires email/password login with role=staff
- Staff cannot modify menu items or view revenue reports

## 5. Admin Dashboard

### Everything staff can do, plus:

### Menu Management

- **Add items**: create new menu items with name, price, category, description, variants
- **Remove items**: delete menu items (soft delete via is_available=false, or hard delete)
- **Change pricing**: edit item price or variant prices
- **Change names**: edit item names

### Revenue Reports

- **Today's total**: sum of all closed orders today
- **This week**: sum for current week (Mon-Sun)
- **This month**: sum for current month
- **Category breakdown**: revenue grouped by menu category
- **Charts**: line chart showing daily revenue over the past 30 days
- **All purchases**: scrollable list of all orders with date, table, items, total

### Table Codes

- Admin sees all 14 current daily codes at a glance
- Can manually regenerate a code if needed

## 6. Data Model Changes

### Table model updates

```python
class Table(models.Model):
    table_number = models.IntegerField(unique=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='available')
    daily_code = models.CharField(max_length=4, blank=True)
    code_date = models.DateField(null=True)
```

### TableSession updates

```python
class TableSession(models.Model):
    table = models.ForeignKey(Table, on_delete=models.CASCADE)
    session_token = models.UUIDField(unique=True)  # anonymous customer identifier
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)
```

### Remove join_code from TableSession

The daily code lives on the Table now, not the session.

## 7. API Changes

### New endpoints

- `POST /tables/join/` — accepts `{code: "A7X2"}`, returns session_token (no auth required)
- `GET /tables/codes/` — staff/admin only, returns all current daily codes
- `POST /tables/<id>/regenerate-code/` — admin only, regenerates code for one table
- `PATCH /orders/<id>/status/` — staff/admin, update order item status (ready/served)
- `GET /stats/revenue/` — admin only, accepts `period` param (today/week/month)
- `GET /stats/revenue/daily/` — admin only, daily totals for chart data

### Modified endpoints

- `GET /menu/items/` — no auth required (already read-only for non-admin)
- `POST /cart/items/` — accepts session_token header instead of JWT for customers
- `POST /orders/` — accepts session_token header instead of JWT for customers
- `GET /orders/` — staff/admin sees all; customer session_token sees only their own

## 8. Frontend Navigation Changes

### AppNavigator flow

```
App Launch
  → RoleSelectionScreen (3 buttons)
    → "Customer" → CustomerNavigator (anonymous, table code → menu → cart → order)
    → "Staff Login" → LoginForm → StaffNavigator
    → "Admin Login" → LoginForm → AdminNavigator
```

### Remove existing Register screen from the main flow

Staff/admin accounts are provisioned by admin through user management.

## 9. Security Considerations

- Daily code rotation prevents reuse of overheard codes
- Anonymous session tokens are UUIDs (unguessable)
- Staff/admin endpoints still require JWT authentication
- Rate-limit code entry attempts to prevent brute force (4-char code = 1.6M combinations, but rate limiting is wise)
- Session tokens expire when table is closed
