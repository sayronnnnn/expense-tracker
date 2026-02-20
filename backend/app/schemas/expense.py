from datetime import date as date_type
from decimal import Decimal

from beanie import PydanticObjectId
from pydantic import BaseModel, Field


class ExpenseCreate(BaseModel):
    category_id: str
    amount: Decimal = Field(..., gt=0)
    currency: str = Field(default="PHP", min_length=3, max_length=3)
    date: date_type
    note: str | None = Field(None, max_length=2000)
    is_recurring: bool = False
    recurring_rule_id: str | None = None

    def category_oid(self) -> PydanticObjectId:
        return PydanticObjectId(self.category_id)

    def recurring_rule_oid(self) -> PydanticObjectId | None:
        return PydanticObjectId(self.recurring_rule_id) if self.recurring_rule_id else None


class ExpenseUpdate(BaseModel):
    category_id: str | None = None
    amount: Decimal | None = Field(None, gt=0)
    currency: str | None = Field(None, min_length=3, max_length=3)
    date: date_type | None = None
    note: str | None = None
    is_recurring: bool | None = None
    recurring_rule_id: str | None = None


class ExpenseResponse(BaseModel):
    id: str
    user_id: str
    category_id: str
    amount: Decimal
    currency: str
    date: date_type
    note: str | None
    is_recurring: bool
    recurring_rule_id: str | None
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}
