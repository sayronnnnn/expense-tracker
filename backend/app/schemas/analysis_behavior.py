from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class SpendingSpike(BaseModel):
    """Represents an unusual spending spike in a category"""
    category_id: str
    category_name: str
    amount: Decimal
    average_amount: Decimal
    percentage_increase: float
    date: date
    description: str  # LLM-generated insight
    
    class Config:
        json_encoders = {
            Decimal: float
        }


class CategoryProfile(BaseModel):
    """Category breakdown for lifestyle profile"""
    category_id: str
    category_name: str
    amount: Decimal
    percentage: float
    
    class Config:
        json_encoders = {
            Decimal: float
        }


class LifestyleProfile(BaseModel):
    """User's spending lifestyle classification"""
    profile_type: str  # food_heavy, travel_heavy, balanced, savings_focused, entertainment_heavy
    top_categories: list[CategoryProfile]
    insights: str  # LLM-generated summary


class SpendingTrend(BaseModel):
    """Trend analysis for a category over time"""
    category_id: str
    category_name: str
    direction: str  # increasing, decreasing, stable
    trend_percentage: float  # month-over-month percentage change
    months_analyzed: int
    insight: str  # LLM-generated explanation


class BehaviorAnalysisResponse(BaseModel):
    """Complete spending behavior analysis"""
    period: str  # "monthly" or "quarterly"
    analysis_date: date
    month: int
    year: int
    
    # Analysis components
    spending_spikes: list[SpendingSpike]
    lifestyle_profile: LifestyleProfile
    trends: list[SpendingTrend]
    
    # LLM-generated summary
    summary: str