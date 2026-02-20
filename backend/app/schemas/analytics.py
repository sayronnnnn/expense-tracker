from decimal import Decimal

from pydantic import BaseModel


class MonthlyTotalResponse(BaseModel):
    """Total spending for a single month."""
    month: int
    year: int
    total: Decimal
    currency: str = "PHP"


class CategoryBreakdownItem(BaseModel):
    category_id: str
    category_name: str
    total: Decimal
    currency: str = "PHP"


class CategoryDistributionResponse(BaseModel):
    """Spending by category for a given month."""
    month: int
    year: int
    total: Decimal
    currency: str = "PHP"
    by_category: list[CategoryBreakdownItem]


class TrendPoint(BaseModel):
    month: int
    year: int
    total: Decimal
    currency: str = "PHP"


class SpendingTrendResponse(BaseModel):
    """Spending totals per month for trend chart."""
    points: list[TrendPoint]
    currency: str = "PHP"
