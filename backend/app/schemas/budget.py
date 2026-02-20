from decimal import Decimal

from pydantic import BaseModel, Field


class BudgetCreate(BaseModel):
    month: int = Field(..., ge=1, le=12)
    year: int = Field(...)
    amount: Decimal = Field(..., gt=0)
    currency: str = Field(default="PHP", min_length=3, max_length=3)
    category_id: str | None = None


class BudgetUpdate(BaseModel):
    month: int | None = Field(None, ge=1, le=12)
    year: int | None = None
    amount: Decimal | None = Field(None, gt=0)
    currency: str | None = Field(None, min_length=3, max_length=3)
    category_id: str | None = None


class BudgetResponse(BaseModel):
    id: str
    user_id: str
    month: int
    year: int
    amount: Decimal
    currency: str
    category_id: str | None
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class BudgetWithActualResponse(BudgetResponse):
    """Budget plus computed actual spending and threshold alert."""
    actual_spent: Decimal
    exceeded: bool
