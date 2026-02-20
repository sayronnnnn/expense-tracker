from decimal import Decimal

from pydantic import BaseModel


class DailyBreakdownItem(BaseModel):
    """Spending breakdown for a single day."""
    day: int
    total: Decimal
    currency: str = "PHP"
    transaction_count: int


class DailyBreakdownResponse(BaseModel):
    """Spending totals per day for a given month (calendar view)."""
    month: int
    year: int
    total: Decimal
    currency: str = "PHP"
    by_day: list[DailyBreakdownItem]
