from fastapi import APIRouter

from app.api.v1 import auth, categories, expenses, budgets, analytics, recurring, export, chat

router = APIRouter()
router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(categories.router, prefix="/categories", tags=["categories"])
router.include_router(expenses.router, prefix="/expenses", tags=["expenses"])
router.include_router(budgets.router, prefix="/budgets", tags=["budgets"])
router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
router.include_router(recurring.router, prefix="/recurring", tags=["recurring"])
router.include_router(export.router, prefix="/export", tags=["export"])
router.include_router(chat.router, prefix="/chat", tags=["chat"])
