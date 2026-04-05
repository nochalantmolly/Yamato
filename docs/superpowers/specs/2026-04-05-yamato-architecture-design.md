# Yamato — Phase 1 Architecture Design

**Date:** 2026-04-05
**Scope:** Phase 1 only (Auth, Menu, Table Session, Shared Cart, Orders, Checkout)
**Stack:** React Native CLI + Django REST Framework + PostgreSQL + Django Channels + Redis

---

## 1. Overall Architecture

```
React Native App
      │
      ├── REST API (HTTP/JSON)  ──→  Django REST Framework
      │                                    │
      └── WebSocket (ws://)   ──→  Django Channels  ──→  Redis (channel layer)
                                           │
                                     PostgreSQL
```

**Runtime components:**
- **Django (ASGI)** — serves both HTTP (REST) and WebSocket via `daphne` or `uvicorn`
- **Redis** — channel layer for Django Channels (pub/sub backbone for WebSocket groups)
- **PostgreSQL** — all persistent data (users, menu, cart, orders)
- **React Native** — single app with role-based navigation (Customer / Staff / Admin views)

**Django apps layout:**
```
backend/
  apps/
    users/      — custom User model, JWT auth, roles
    menu/       — Category, MenuItem
    tables/     — Table, TableSession, WebSocket consumer
    cart/       — CartItem
    orders/     — Order, OrderItem
  config/       — settings, urls, asgi (existing)
```

---

## 2. Table Session & Shared Cart Flow

### The core design decision: TableSession

Cart items and orders are linked to a `TableSession`, not directly to a `Table`. Each time a group of customers is seated, a new `TableSession` is created. This gives complete data isolation between groups — old session data stays in the DB for order history but is invisible to the new group.

### Session lifecycle

```
Staff opens table
  → TableSession created (status: active, join_code: "A3F7")
  → Table.status = occupied

Customer scans QR / enters join code
  → Validated against active TableSession
  → session_id stored client-side (in app state + AsyncStorage)

Customer connects WebSocket
  → ws://host/ws/table/{session_id}/
  → Server adds them to channel group "table_session_{id}"

Customer adds/edits/removes cart items (REST)
  → CartItem saved to DB (FK → TableSession)
  → REST view broadcasts {type: "cart_updated"} to WebSocket group
  → All connected clients re-fetch GET /cart/?session={id}

Customer submits order (REST)
  → CartItems converted to Order + OrderItems (with price snapshot)
  → CartItems deleted
  → Staff notified via WebSocket group "staff_orders"

Staff initiates checkout
  → Table.status = billing (intermediate state — prevents new sessions on this table)

Staff confirms payment
  → TableSession.status = closed
  → Table.status = available
  → Any remaining CartItems for this session deleted
  → Next group gets a brand-new TableSession with a new join code
```

### WebSocket approach: thin notifications

The WebSocket carries **notifications only** (`{type: "cart_updated"}`), not data payloads. All business logic and data fetching goes through the REST API. This keeps the WebSocket consumer simple and testable, and the REST API is the single source of truth.

The WebSocket consumer (`tables/consumers.py`):
- On connect: validates JWT, looks up active session, joins group
- On disconnect: leaves group
- Never sends cart data — only relays broadcast events from REST views

---

## 3. Data Models

```
User
  id, email, password, name, phone
  role: "admin" | "staff" | "customer"
  created_at

Category
  id, name, sort_order

MenuItem
  id, name, description, price, image
  category → Category (FK)
  is_available (bool)

Table
  id, table_number (unique integer)
  status: "available" | "occupied" | "billing"

TableSession
  id
  table → Table (FK)
  join_code (4-char alphanumeric, unique among active sessions)
  status: "active" | "closed"
  created_at, closed_at

CartItem
  id
  session → TableSession (FK)
  menu_item → MenuItem (FK)
  quantity (integer)
  added_by → User (FK)

Order
  id
  session → TableSession (FK)
  total_amount (decimal)
  status: "pending" | "preparing" | "completed" | "paid"
  created_at, paid_at

OrderItem
  id
  order → Order (FK)
  menu_item → MenuItem (FK)
  quantity (integer)
  price (decimal) ← snapshot at time of order submission
```

**Key notes:**
- `OrderItem.price` is a snapshot copied from `MenuItem.price` at submission time. Historical orders stay accurate if prices change later.
- `join_code` is unique only among active sessions — closed sessions can reuse codes, keeping them short and human-friendly.

---

## 4. API Endpoints

All endpoints require JWT auth unless marked public.

```
/api/auth/
  POST  /register/              — create customer account
  POST  /login/                 — returns access + refresh tokens
  POST  /token/refresh/         — refresh access token
  GET   /profile/               — view own profile
  PATCH /profile/               — edit own profile

/api/menu/
  GET   /categories/            — list categories (public)
  GET   /items/                 — list available items, filter by category (public)
  GET   /items/{id}/            — item detail (public)
  POST  /items/                 — create item (admin only)
  PATCH /items/{id}/            — edit item (admin only)
  DELETE /items/{id}/           — delete item (admin only)
  PATCH /items/{id}/toggle/     — toggle availability (admin only)

/api/tables/
  GET   /                       — list all tables (staff/admin)
  POST  /{id}/activate/         — staff opens table → creates TableSession, returns join_code
  POST  /join/                  — customer submits join_code → returns session_id
  GET   /sessions/{id}/         — get session detail

/api/cart/
  GET   /                       — get all CartItems for current session
  POST  /items/                 — add item to cart
  PATCH /items/{id}/            — update quantity
  DELETE /items/{id}/           — remove item

/api/orders/
  POST  /                       — submit order (converts cart → order, clears CartItems)
  GET   /                       — list orders (staff: all active; customer: own session)
  GET   /{id}/                  — order detail
  PATCH /{id}/status/           — update status: pending→preparing→completed (staff only)
  POST  /{id}/checkout/         — confirm payment, close session, reset table (staff only)

/api/admin/
  GET   /orders/                — full order history
  GET   /stats/                 — daily revenue, order count
  GET   /users/                 — list users
  PATCH /users/{id}/role/       — change user role

WebSocket
  ws://host/ws/table/{session_id}/   — cart update notifications (customer)
  ws://host/ws/orders/               — new order notifications (staff)
```

---

## 5. Error Handling & Edge Cases

**Simultaneous cart edits:**
- Each `CartItem` row is independent, so concurrent edits to different items don't conflict
- Concurrent edits to the same item use Django's `F()` expressions for atomic DB updates
- After any write, a `cart_updated` broadcast triggers all clients to refetch, converging on DB state

**Invalid or expired join code:**
- `POST /tables/join/` returns `404` — client shows "Invalid or expired table code"

**Order submitted with empty cart:**
- `POST /orders/` returns `400 Bad Request`

**Staff tries to checkout before order is completed:**
- `POST /orders/{id}/checkout/` checks `Order.status` — returns `400` if not `completed`; staff must mark it completed first

**Menu item goes unavailable after being added to cart:**
- `GET /cart/` includes a flag for each item if `MenuItem.is_available` is now `False`
- Frontend shows a warning; customer must remove the item before submitting

**App goes offline mid-session:**
- On reconnect, client re-fetches cart state via REST on WebSocket reconnect
- PostgreSQL is the source of truth; no state is lost

---

## 6. Testing Strategy

**Backend (pytest-django):**
- Unit tests: model methods, permission classes (customer cannot access staff endpoints)
- Integration tests hit a real DB — no mocks:
  - Full flow: join session → add items → submit order → checkout
  - Concurrent quantity update does not corrupt `CartItem`
- WebSocket tests: use Django Channels' `WebsocketCommunicator` to verify `cart_updated` broadcast reaches all session members

**Frontend (Jest + React Native Testing Library):**
- Component tests for Cart screen, Menu screen, Order Status screen
- Mock REST responses, verify UI state transitions
- WebSocket reconnect logic

---

## 7. New Dependencies Required

```
# Backend additions to requirements.txt
channels==4.0.0
channels-redis==4.2.1
daphne==4.1.2
```

Redis must be running locally for development (e.g., `brew install redis` on macOS).
