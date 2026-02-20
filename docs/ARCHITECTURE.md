# Smart Expense Tracker — Architecture & Design (MongoDB)

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT (React SPA)                              │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ HTTPS / JWT
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        API (FastAPI)                                      │
│  Routers │ Dependencies (auth) │ Middleware │ CORS                        │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Services    │     │  Background     │     │  Export         │
│ (business     │     │  (APScheduler)  │     │  (CSV, PDF)     │
│  logic)       │     │                 │     │                 │
└───────┬───────┘     └────────┬────────┘     └────────┬────────┘
        │                      │                       │
        └──────────────────────┼───────────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │   MongoDB           │
                    │   (Beanie ODM)      │
                    └─────────────────────┘
```

- **Database**: **MongoDB** — document store; Beanie for async ODM and Pydantic models.
- **Backend**: FastAPI, stateless JWT, services for business logic.

---

## 2. Backend Tech Stack

| Layer | Technology |
|-------|-------------|
| **Framework** | FastAPI |
| **Database** | MongoDB |
| **ODM** | Beanie (async, Pydantic-based) |
| **Validation** | Pydantic v2 |
| **Auth** | PyJWT + passlib[bcrypt] |
| **Background jobs** | APScheduler |
| **PDF export** | reportlab |

---

## 3. MongoDB Collections & Document Shape

### `users`
```json
{
  "_id": "ObjectId",
  "email": "string (unique)",
  "password_hash": "string",
  "name": "string | null",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```
Index: `email` unique.

### `categories`
- **System categories**: seeded, `user_id: null`.
- **User categories**: `user_id` set.
```json
{
  "_id": "ObjectId",
  "name": "string",
  "slug": "string",
  "type": "system | user",
  "user_id": "ObjectId | null",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```
Indexes: `(slug, user_id)` unique; `user_id`.

### `expenses`
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "category_id": "ObjectId",
  "amount": "decimal",
  "currency": "string",
  "date": "date",
  "note": "string | null",
  "is_recurring": "bool",
  "recurring_rule_id": "ObjectId | null",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```
Indexes: `(user_id, date)`, `(user_id, category_id)`.

### `budgets`
- One doc per user per month; optional `category_id` for category budgets.
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "month": "int (1-12)",
  "year": "int",
  "amount": "decimal",
  "currency": "string",
  "category_id": "ObjectId | null",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```
Index: `(user_id, month, year, category_id)` unique (with null handling).

### `recurring_rules`
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "category_id": "ObjectId",
  "amount": "decimal",
  "currency": "string",
  "note": "string | null",
  "frequency": "weekly | monthly | yearly",
  "next_run_at": "datetime",
  "last_run_at": "datetime | null",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```
Indexes: `user_id`, `next_run_at`.

---

## 4. Folder Structure

### Backend (`/backend`)

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py           # FastAPI app, lifespan (Beanie init)
│   ├── config.py
│   ├── database.py       # Beanie init, get_db not needed (Beanie is global)
│   ├── models/           # Beanie Document models
│   ├── schemas/          # Pydantic request/response (no DB)
│   ├── api/
│   │   ├── deps.py       # get_current_user
│   │   └── v1/           # auth, expenses, budgets, analytics, export
│   ├── services/
│   ├── core/
│   │   └── security.py
│   └── jobs/             # APScheduler tasks
├── requirements.txt
├── .env.example
└── Dockerfile
```

### Frontend (`/frontend`)

React + Vite + TypeScript (unchanged).

---

## 5. API Surface (prefix `/api/v1`)

| Prefix | Description |
|--------|-------------|
| `POST/GET /auth/register`, `login`, `refresh`, `GET /auth/me` | JWT auth |
| `GET/POST /categories` | List (system + user), create user category |
| `GET/POST/GET/PATCH/DELETE /expenses`, `.../expenses/{id}` | Expense CRUD, filter by month/year/category |
| `GET/POST/GET/PATCH/DELETE /budgets`, `.../budgets/{id}` | Budget CRUD; list/get include actual_spent and exceeded |
| `GET /analytics/monthly-total`, `by-category`, `trends` | Backend aggregation for dashboard |
| `GET/POST/GET/PATCH/DELETE /recurring`, `.../recurring/{id}` | Recurring rules CRUD |
| `GET /export/expenses.csv`, `GET /export/summary.pdf` | Export (user-scoped) |

Protected routes require `Authorization: Bearer <access_token>`.

## 6. Implementation Order (status)

1. Config, Beanie setup, document models, indexes. ✅
2. Auth (register, login, refresh, get_current_user). ✅
3. Categories (seed system categories), Expense CRUD. ✅
4. Budgets and alerts. ✅
5. Analytics (aggregation pipeline). ✅
6. Recurring rules + scheduler job. ✅
7. Export CSV/PDF. ✅
8. Frontend, Docker (API Dockerfile present).
