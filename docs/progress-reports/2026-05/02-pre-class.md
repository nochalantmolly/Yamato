## Project Status Report (Pre-Class)
**Date:** 2026-05-02
**Project Name:** Yamato
**Student Name:** Molly

### Part A — Current Status
- Backend (Django): Can start? Yes
- Frontend (React Native): Can start? Yes
- Frontend-Backend connection: Working? Yes (Axios client with JWT auth, WebSocket for real-time)

### Part B — Completed Features
| Feature Name | Priority | Backend | Frontend | Overall % |
|-------------|----------|---------|----------|-----------|
| User registration & login | P0 | Done | Done | 100% |
| Menu management (Admin) | P0 | Done | Partial — no add/edit form UI; category mgmt is view-only | 70% |
| Menu browsing (Customer) | P0 | Done | Partial — no search feature | 85% |
| Table selection + shared cart | P0 | Done | Done | 95% |
| Order submission & viewing | P0 | Done | Done | 95% |
| Order processing (Staff) | P1 | Done | Partial — no print-order feature | 80% |
| Checkout & table reset | P1 | Done | Done | 90% |
| Membership tier system | P2 | Not started | Not started | 0% |
| View/edit personal profile | P0 | Done | Partial — view only, no edit UI | 70% |

### Part C — Remaining Work
- Incomplete P0 features:
  1. **Menu management (Admin)** — Frontend needs add/edit menu item forms and category add/edit/delete UI
  2. **Menu browsing (Customer)** — Search menu items not implemented (required in spec 3.3)
  3. **Profile screen** — Edit profile UI missing (name, phone update); order history not shown on profile
- Estimated execute-plan rounds to finish all P0: 2

### Part D — Issues Found
- Environment issues:
  - WebSocket URL hardcoded to Android emulator (`10.0.2.2`); iOS simulator needs `localhost` — no platform switch logic
  - API base URL similarly hardcoded for Android emulator only
- Code errors detected:
  - 12 instances of loose `any` typing in frontend (no runtime errors, but reduces type safety)
  - CartItem and Order models not registered in Django admin (minor — admin panel can't browse these tables)
- Recommendation: Fix **menu search** and **admin add/edit menu item forms** first — these are the highest-impact P0 gaps. Then add profile editing. The platform-specific URL issue should be addressed before iOS testing.
