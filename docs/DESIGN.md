# Smart Expense Tracker — Design & Implementation Plan

This document extends `ARCHITECTURE.md` with detailed design for production readiness: error handling, schemas, services, jobs, export, and optional AI.

---

## 1. Architecture Summary

- **Backend**: FastAPI, MongoDB (Beanie), JWT auth, **services** for business logic, **schemas** for request/response DTOs, **jobs** for recurring expense creation and optional alerts.
- **Frontend**: React + Vite + TypeScript — pages, components, API layer, hooks; no business logic in UI.
- **Deploy**: Docker (API + optional frontend), docker-compose (MongoDB + API).

**Layers (backend):**

| Layer | Responsibility | No |
|-------|----------------|-----|
| **Routes** | HTTP, validation (via schemas), call services, return responses | No DB, no business logic |
| **Services** | Business logic, orchestration, calls to models/DB | No HTTP, no request objects |
| **Models** | Beanie documents, persistence | No business rules |
| **Schemas** | Pydantic request/response DTOs, validation | No DB coupling |
| **Core** | Security (JWT, hashing), config | — |
| **Jobs** | Scheduled tasks (recurring expenses, optional notifications) | Use services |

---

## 2. Database Schema (Reference)

As in `ARCHITECTURE.md`:

- **users**: email (unique), password_hash, name, created_at, updated_at
- **categories**: name, slug, type (system | user), user_id (null = system), created_at, updated_at. Index: (slug, user_id) unique
- **expenses**: user_id, category_id, amount, currency, date, note, is_recurring, recurring_rule_id, created_at, updated_at. Indexes: (user_id, date), (user_id, category_id)
- **budgets**: user_id, month, year, amount, currency, category_id (null = total), created_at, updated_at. Index: (user_id, month, year, category_id)
- **recurring_rules**: user_id, category_id, amount, currency, note, frequency (weekly|monthly|yearly), next_run_at, last_run_at, created_at, updated_at. Indexes: user_id, next_run_at

---

## 3. Backend Folder Structure

```
backend/app/
├── __init__.py
├── main.py              # FastAPI app, lifespan, CORS
├── config.py
├── database.py
├── models/              # Beanie Document models only
│   ├── __init__.py
│   ├── user.py
│   ├── category.py
│   ├── expense.py
│   ├── budget.py
│   └── recurring_rule.py
├── schemas/             # Pydantic DTOs (request/response)
│   ├── __init__.py
│   ├── category.py
│   ├── expense.py
│   ├── budget.py
│   ├── recurring_rule.py
│   └── analytics.py
├── services/            # Business logic
│   ├── __init__.py
│   ├── category.py
│   ├── expense.py
│   ├── budget.py
│   ├── recurring.py
│   ├── analytics.py
│   └── export.py
├── api/
│   ├── deps.py          # get_current_user
│   └── v1/
│       ├── __init__.py  # router aggregation
│       ├── auth.py
│       ├── categories.py
│       ├── expenses.py
│       ├── budgets.py
│       ├── analytics.py
│       ├── recurring.py
│       └── export.py
├── core/
│   ├── __init__.py
│   ├── security.py
│   └── exceptions.py   # HTTP exception helpers (optional)
├── jobs/
│   ├── __init__.py
│   └── recurring_expenses.py  # APScheduler: create expenses from rules
└── utils/
    └── __init__.py     # utc_now, etc.
```

---

## 4. Centralized Error Handling

- Use FastAPI `HTTPException` with consistent status codes and a small set of detail keys (e.g. `detail`, `code`).
- Optional: `core/exceptions.py` with custom exception classes and an exception handler that maps them to HTTP responses.
- Validation: Pydantic schemas on all inputs; 422 for validation errors (automatic).

---

## 5. Implementation Order (Incremental)

1. **Auth** — Done (register, login, refresh, /me, get_current_user).
2. **Categories** — Seed system categories; list (system + user); create user category; service + schemas.
3. **Expenses** — Full CRUD; monthly filter; list by user with optional date range/category; service + schemas; strict validation.
4. **Budgets** — CRUD; monthly and category-level; endpoint for “budget vs actual” and threshold exceeded (alert).
5. **Analytics** — Backend aggregation: monthly total, by category, spending trend (e.g. by month); return JSON for charts.
6. **Recurring** — RecurringRule CRUD; APScheduler job to create expenses from rules (respect next_run_at, update last_run_at/next_run_at); avoid duplicates (e.g. by rule + date).
7. **Export** — CSV (expenses), PDF (summary); generated on backend; secure (user-scoped).
8. **Frontend** — Pages, components, API client, auth flow (to be added).
9. **Docker** — Dockerfile for backend; docker-compose service for API.
10. **Bonus** — AI prediction endpoint; email notifications; logging/rate limiting.

---

## 6. Security & Validation

- All mutation endpoints require JWT (get_current_user).
- Queries always scoped by `user_id` (from token).
- Passwords: min length, hashed with bcrypt.
- Input: Pydantic schemas with sensible limits (amount > 0, date ranges, etc.).
- Export: only the authenticated user’s data.

---

## 7. AI-Ready Extension (Optional)

- Reserved endpoint e.g. `GET /api/v1/analytics/prediction` that consumes existing analytics (monthly totals, category breakdown) and returns a simple forecast (e.g. next month).
- Implementation: simple regression or call to an LLM API; keep logic in a dedicated service module so it can be swapped or disabled.

---

## 8. Code Quality

- Strict typing (no untyped defs in new code).
- Clear naming; no unnecessary abstraction.
- Business logic in services; routes thin.
- Production-ready structure as above; scalable but not overengineered.
