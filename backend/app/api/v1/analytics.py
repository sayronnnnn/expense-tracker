from fastapi import APIRouter, Depends, Query

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.analytics import (
    MonthlyTotalResponse,
    CategoryDistributionResponse,
    SpendingTrendResponse,
)
from app.schemas.daily_breakdown import DailyBreakdownResponse
from app.schemas.analysis_behavior import BehaviorAnalysisResponse
from app.services.analytics import analytics_service
from app.services.llm_analysis import generate_behavior_analysis

router = APIRouter()


@router.get("/monthly-total", response_model=MonthlyTotalResponse)
async def monthly_total(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(...),
    current_user: User = Depends(get_current_user),
):
    """Total spending for a given month (backend aggregation)."""
    return await analytics_service.monthly_total(current_user.id, month, year)


@router.get("/by-category", response_model=CategoryDistributionResponse)
async def by_category(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(...),
    current_user: User = Depends(get_current_user),
):
    """Spending by category for a given month (for charts)."""
    return await analytics_service.category_distribution(current_user.id, month, year)


@router.get("/trends", response_model=SpendingTrendResponse)
async def spending_trend(
    months: int = Query(12, ge=1, le=24),
    current_user: User = Depends(get_current_user),
):
    """Monthly totals for the last N months (spending trend)."""
    return await analytics_service.spending_trend(current_user.id, months_back=months)


@router.get("/daily-breakdown", response_model=DailyBreakdownResponse)
async def daily_breakdown(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(...),
    current_user: User = Depends(get_current_user),
):
    """Daily spending totals for a given month (calendar view)."""
    return await analytics_service.daily_breakdown(current_user.id, month, year)


@router.get("/behavior", response_model=BehaviorAnalysisResponse)
async def behavior_analysis(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(...),
    current_user: User = Depends(get_current_user),
):
    """
    LLM-powered spending behavior analysis.
    Detects spending spikes, lifestyle patterns, and trends.
    """
    return await generate_behavior_analysis(current_user.id, month, year)
