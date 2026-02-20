from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field


class RecurringRuleCreate(BaseModel):
    category_id: str
    amount: Decimal = Field(..., gt=0)
    currency: str = Field(default="PHP", min_length=3, max_length=3)
    note: str | None = Field(None, max_length=2000)
    frequency: str = Field(..., pattern="^(daily|weekly|monthly|yearly)$")
    start_date: date | None = None  # first run date; if omitted, use today


class RecurringRuleUpdate(BaseModel):
    category_id: str | None = None
    amount: Decimal | None = Field(None, gt=0)
    currency: str | None = Field(None, min_length=3, max_length=3)
    note: str | None = None
    frequency: str | None = Field(None, pattern="^(daily|weekly|monthly|yearly)$")


class RecurringRuleResponse(BaseModel):
    id: str
    user_id: str
    category_id: str
    amount: Decimal
    currency: str
    note: str | None
    frequency: str
    next_run_at: str
    last_run_at: str | None
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}
