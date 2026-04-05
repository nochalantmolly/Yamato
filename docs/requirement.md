# Yamato Restaurant Online Ordering System — Requirements Document

**Student:** Molly
**Project Name:** Yamato
**Tech Stack:** React Native CLI + Django REST Framework + PostgreSQL

---

## 1. Project Overview

Yamato is an online ordering Mobile App for a restaurant. Customers dine in and use the app to browse the menu, select a table number, and submit orders. Staff receive the orders and print them for the kitchen. After the meal, customers pay at the counter by card or cash — no online payment is provided.

---

## 2. User Roles

| Role | Description |
|------|-------------|
| **Admin** | Restaurant owner/manager — manages menu items, views all orders, manages staff and users |
| **Staff** | Front desk/servers — views and processes customer orders, prints orders |
| **Customer** | Dine-in guest — browses the menu, selects a table, places orders, views order total |

---

## 3. Feature Requirements

### Phase 1 (Core Features)

#### 3.1 Authentication Module

- User registration (email + password)
- User login (JWT authentication)
- Role-based access (Admin / Staff / Customer)
- View and edit personal profile

#### 3.2 Menu Management Module (Admin)

- Add menu items (name, description, price, category, image)
- Edit menu item details
- Delete menu items
- Toggle item availability (available / unavailable)
- Manage menu categories (e.g., Appetizers, Main Courses, Drinks, Desserts)

#### 3.3 Menu Browsing Module (Customer)

- Browse all available menu items by category
- View item details (image, description, price)
- Search menu items

#### 3.4 Table Number & Shared Cart Module (Core Feature)

- **Select Table Number:** Customer must enter/select a table number before ordering
- **Shared Cart:** All customers who select the same table number can see the cart for that table
- **Add Items to Cart:** Any customer at the table can add items
- **View Cart:** Displays all selected items and total amount for the current table
- **Edit Cart:** Increase/decrease quantity or remove items

> **Important Rule:** The cart is shared by table number, not by individual user. All customers at the same table see the same cart.

#### 3.5 Order Module

**Customer Side:**
- Submit order (convert the current table's cart into an order)
- View current table's order status
- View order amount breakdown

**Staff Side:**
- View all new orders (real-time updates)
- View order details (table number, items, quantities, amount)
- Print order (for kitchen use)
- Update order status (Pending → Preparing → Completed)

**Admin Side:**
- View all orders (history)
- Order statistics (daily revenue, order count, etc.)

#### 3.6 Checkout & Table Reset Module (Core Feature)

- Staff confirms customer payment (card/cash)
- After checkout, automatically clear the table's cart and order data
- Table status resets to available for the next group of customers

> **Very Important:** The checkout reset must be thorough to prevent the next group of customers from seeing the previous group's order history.

---

### Phase 2 (Membership System)

#### 3.7 Membership Tier Module

- Automatically upgrade membership tier based on cumulative spending
- Membership tier design (e.g., Regular → Silver → Gold → Platinum)
- Different tiers receive different discount rates
- Admin can manage tier rules (spending thresholds, discount percentages)
- Users can view their membership tier and cumulative spending

---

## 4. Data Models (Reference)

### User
| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key |
| email | String | Email (unique) |
| password | String | Password (encrypted) |
| name | String | Full name |
| phone | String | Phone number |
| role | String | Role: admin / staff / customer |
| created_at | DateTime | Registration date |

### Category
| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key |
| name | String | Category name |
| sort_order | Integer | Display order |

### MenuItem
| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key |
| name | String | Item name |
| description | Text | Item description |
| price | Decimal | Price |
| image | String | Image path |
| category | ForeignKey | Related category |
| is_available | Boolean | Whether the item is available |

### Table
| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key |
| table_number | Integer | Table number |
| status | String | Status: available / occupied / billing |

### Cart (Shared by Table)
| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key |
| table | ForeignKey | Related table |
| menu_item | ForeignKey | Related menu item |
| quantity | Integer | Quantity |
| added_by | ForeignKey | User who added the item |

### Order
| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key |
| table | ForeignKey | Related table |
| total_amount | Decimal | Order total |
| status | String | Status: pending / preparing / completed / paid |
| created_at | DateTime | Order time |
| paid_at | DateTime | Payment time |

### OrderItem
| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key |
| order | ForeignKey | Related order |
| menu_item | ForeignKey | Related menu item |
| quantity | Integer | Quantity |
| price | Decimal | Price at time of order |

---

## 5. Screen List

### Customer Screens
1. **Registration Screen** — Email, password, name, phone
2. **Login Screen** — Email, password
3. **Table Selection Screen** — Enter or select a table number
4. **Menu Browsing Screen** — Menu items listed by category
5. **Item Detail Screen** — Image, description, price, add to cart button
6. **Cart Screen** — All items for the current table, quantities, total, submit order button
7. **Order Status Screen** — Current table's order progress
8. **Profile Screen** — Personal info, order history

### Staff Screens
1. **Order List Screen** — All pending and in-progress orders
2. **Order Detail Screen** — Table number, item breakdown, total amount
3. **Checkout Screen** — Confirm payment, clear table

### Admin Screens
1. **Menu Management Screen** — Add/edit/delete/toggle menu items
2. **Category Management Screen** — Manage menu categories
3. **Order Management Screen** — View all orders and history
4. **User Management Screen** — Manage staff and users
5. **Statistics Screen** — Daily revenue, order count, etc.

---

## 6. Development Priority

| Priority | Feature | Notes |
|----------|---------|-------|
| P0 | User registration & login | Foundation — other features depend on this |
| P0 | Menu management (Admin) | Menu data must exist first |
| P0 | Menu browsing (Customer) | Core user experience |
| P0 | Table selection + shared cart | Core business logic |
| P0 | Order submission & viewing | Core business logic |
| P1 | Order processing (Staff) | Print orders, update status |
| P1 | Checkout & table reset | Ensure data isolation between groups |
| P2 | Membership tier system | Phase 2 development |
