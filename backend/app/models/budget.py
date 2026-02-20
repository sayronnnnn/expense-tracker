from datetime import datetime
from decimal import Decimal
from typing import Annotated

from beanie import Document, PydanticObjectId
from pydantic import BeforeValidator, Field

from app.utils import decimal_from_bson, utc_now

DecimalAmount = Annotated[Decimal, BeforeValidator(decimal_from_bson)]


class Budget(Document):
    user_id: PydanticObjectId
    month: int = Field(ge=1, le=12)
    year: int
    amount: DecimalAmount
    currency: str = "PHP"
    category_id: PydanticObjectId | None = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    class Settings:
        name = "budgets"
        indexes = [
            [("user_id", 1), ("month", 1), ("year", 1), ("category_id", 1)],
        ]

    class Config:
        populate_by_name = True
