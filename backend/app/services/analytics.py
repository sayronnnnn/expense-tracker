from datetime import date, timedelta
from decimal import Decimal

from beanie import PydanticObjectId
from beanie.odm.operators.find.comparison import In

from app.models.expense import Expense
from app.models.category import Category
from app.schemas.analytics import (
    MonthlyTotalResponse,
    CategoryDistributionResponse,
    CategoryBreakdownItem,
    SpendingTrendResponse,
    TrendPoint,
)
from app.schemas.daily_breakdown import (
    DailyBreakdownResponse,
    DailyBreakdownItem,
)


async def get_monthly_total(
    user_id: PydanticObjectId,
    month: int,
    year: int,
    currency: str = "PHP",
) -> MonthlyTotalResponse:
    start = date(year, month, 1)
    end = start.replace(day=28) + timedelta(days=4)
    end = end.replace(day=1) - timedelta(days=1)  # last day of month
    expenses = await Expense.find(
        Expense.user_id == user_id,
        Expense.date >= start,
        Expense.date <= end,
    ).to_list()
    total = sum(e.amount for e in expenses)
    return MonthlyTotalResponse(month=month, year=year, total=Decimal(str(total)), currency=currency)


async def get_category_distribution(
    user_id: PydanticObjectId,
    month: int,
    year: int,
    currency: str = "PHP",
) -> CategoryDistributionResponse:
    start = date(year, month, 1)
    end = start.replace(day=28) + timedelta(days=4)
    end = end.replace(day=1) - timedelta(days=1)
    expenses = await Expense.find(
        Expense.user_id == user_id,
        Expense.date >= start,
        Expense.date <= end,
    ).to_list()
    total = sum(e.amount for e in expenses)
    # Group by category_id
    by_cat: dict[str, Decimal] = {}
    for e in expenses:
        cid = str(e.category_id)
        by_cat[cid] = by_cat.get(cid, Decimal("0")) + e.amount
    # Resolve category names
    category_ids = list(by_cat.keys())
    oids = [PydanticObjectId(cid) for cid in category_ids]
    categories = await Category.find(In(Category.id, oids)).to_list()
    name_by_id = {str(c.id): c.name for c in categories}
    by_category = [
        CategoryBreakdownItem(
            category_id=cid,
            category_name=name_by_id.get(cid, "Unknown"),
            total=amt,
            currency=currency,
        )
        for cid, amt in sorted(by_cat.items(), key=lambda x: -x[1])
    ]
    return CategoryDistributionResponse(
        month=month,
        year=year,
        total=Decimal(str(total)),
        currency=currency,
        by_category=by_category,
    )


async def get_spending_trend(
    user_id: PydanticObjectId,
    months_back: int = 12,
    currency: str = "PHP",
) -> SpendingTrendResponse:
    """Return monthly totals for the last N months (newest first)."""
    today = date.today()
    points: list[TrendPoint] = []
    for i in range(months_back):
        # month/year going back
        m = today.month - 1 - i
        y = today.year
        while m <= 0:
            m += 12
            y -= 1
        start = date(y, m, 1)
        end = start.replace(day=28) + timedelta(days=4)
        end = end.replace(day=1) - timedelta(days=1)
        expenses = await Expense.find(
            Expense.user_id == user_id,
            Expense.date >= start,
            Expense.date <= end,
        ).to_list()
        total = sum(e.amount for e in expenses)
        points.append(TrendPoint(month=m, year=y, total=Decimal(str(total)), currency=currency))
    return SpendingTrendResponse(points=points, currency=currency)


async def get_daily_breakdown(
    user_id: PydanticObjectId,
    month: int,
    year: int,
    currency: str = "PHP",
) -> DailyBreakdownResponse:
    """Return daily spending totals for a given month (calendar view)."""
    start = date(year, month, 1)
    end = start.replace(day=28) + timedelta(days=4)
    end = end.replace(day=1) - timedelta(days=1)  # last day of month
    
    expenses = await Expense.find(
        Expense.user_id == user_id,
        Expense.date >= start,
        Expense.date <= end,
    ).to_list()
    
    # Group by day
    by_day: dict[int, tuple[Decimal, int]] = {}  # day -> (total, count)
    for e in expenses:
        day = e.date.day
        total, count = by_day.get(day, (Decimal("0"), 0))
        by_day[day] = (total + e.amount, count + 1)
    
    # Create response items for all days with spending
    daily_items = [
        DailyBreakdownItem(
            day=day,
            total=total,
            currency=currency,
            transaction_count=count,
        )
        for day, (total, count) in sorted(by_day.items())
    ]
    
    total = sum(e.amount for e in expenses)
    return DailyBreakdownResponse(
        month=month,
        year=year,
        total=Decimal(str(total)),
        currency=currency,
        by_day=daily_items,
    )


class AnalyticsService:
    monthly_total = staticmethod(get_monthly_total)
    category_distribution = staticmethod(get_category_distribution)
    spending_trend = staticmethod(get_spending_trend)
    daily_breakdown = staticmethod(get_daily_breakdown)


analytics_service = AnalyticsService()
