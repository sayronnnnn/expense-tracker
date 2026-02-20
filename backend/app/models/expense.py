from datetime import date, datetime
from decimal import Decimal
from typing import Annotated

from beanie import Document, PydanticObjectId
from pydantic import BeforeValidator, Field

from app.utils import decimal_from_bson, utc_now

DecimalAmount = Annotated[Decimal, BeforeValidator(decimal_from_bson)]


class Expense(Document):
    user_id: PydanticObjectId
    category_id: PydanticObjectId
    amount: DecimalAmount
    currency: str = "PHP"
    date: date
    note: str | None = None
    is_recurring: bool = False
    recurring_rule_id: PydanticObjectId | None = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    class Settings:
        name = "expenses"
        indexes = [
            [("user_id", 1), ("date", -1)],
            [("user_id", 1), ("category_id", 1)],
        ]

    class Config:
        populate_by_name = True
