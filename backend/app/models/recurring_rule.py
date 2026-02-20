from datetime import datetime
from decimal import Decimal
from typing import Annotated

from beanie import Document, PydanticObjectId
from pydantic import BeforeValidator, Field

from app.utils import decimal_from_bson, utc_now

DecimalAmount = Annotated[Decimal, BeforeValidator(decimal_from_bson)]


class RecurringRule(Document):
    user_id: PydanticObjectId
    category_id: PydanticObjectId
    amount: DecimalAmount
    currency: str = "PHP"
    note: str | None = None
    frequency: str  # daily | weekly | monthly | yearly
    next_run_at: datetime
    last_run_at: datetime | None = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    class Settings:
        name = "recurring_rules"
        indexes = [
            [("user_id", 1)],
            [("next_run_at", 1)],
        ]

    class Config:
        populate_by_name = True
