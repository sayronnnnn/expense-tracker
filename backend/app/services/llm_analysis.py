"""
LLM-powered spending behavior analysis service.
Detects spending spikes, lifestyle patterns, and trends.
"""

import os
from datetime import date, timedelta
from decimal import Decimal
from statistics import mean, stdev

from beanie import PydanticObjectId

from app.models.expense import Expense
from app.models.category import Category
from app.schemas.analysis_behavior import (
    SpendingSpike,
    LifestyleProfile,
    CategoryProfile,
    SpendingTrend,
    BehaviorAnalysisResponse,
)


# LLM Configuration
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
LLM_MODEL = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")

# Cache LLM client to avoid recreation
_llm_client = None


def _get_llm_client():
    """Initialize LLM client based on provider"""
    global _llm_client
    
    if _llm_client is not None:
        return _llm_client
    
    if LLM_PROVIDER == "openai":
        from openai import OpenAI
        _llm_client = OpenAI(api_key=OPENAI_API_KEY)
    elif LLM_PROVIDER == "groq":
        from groq import Groq
        import httpx
        
        # Docker environment has proxy environment variables that break httpx
        # Create a custom httpx client with mounts to bypass proxy detection
        _transport = httpx.HTTPTransport(verify=True)
        _mounts = {
            "https://": _transport,
            "http://": _transport,
        }
        http_client = httpx.Client(mounts=_mounts)
        _llm_client = Groq(api_key=GROQ_API_KEY, http_client=http_client)
    else:
        raise ValueError(f"Unsupported LLM provider: {LLM_PROVIDER}")
    
    return _llm_client


def _call_llm(system_prompt: str, user_prompt: str) -> str:
    """Call LLM with system and user prompts"""
    try:
        client = _get_llm_client()
        
        # Create completion request
        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.4,
            max_tokens=500,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"LLM API error: {e}")
        import traceback
        traceback.print_exc()
        # Return fallback text on error
        return "Unable to generate insight at this time."


async def _get_category_name(category_id: str) -> str:
    """Get category name from ID"""
    try:
        cat = await Category.get(category_id)
        return cat.name if cat else "Unknown"
    except:
        return "Unknown"


async def detect_spending_spikes(
    user_id: PydanticObjectId,
    month: int,
    year: int,
) -> list[SpendingSpike]:
    """
    Detect unusual spending spikes compared to historical average.
    Uses statistical method: flag expenses > (mean + 2 * std_dev)
    """
    spikes = []
    
    # Get current month expenses
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(year, month + 1, 1) - timedelta(days=1)
    
    current_month_expenses = await Expense.find(
        Expense.user_id == user_id,
        Expense.date >= start_date,
        Expense.date <= end_date,
    ).to_list()
    
    # Get last 90 days for baseline
    baseline_start = start_date - timedelta(days=90)
    baseline_expenses = await Expense.find(
        Expense.user_id == user_id,
        Expense.date >= baseline_start,
        Expense.date < start_date,
    ).to_list()
    
    # Group by category
    category_baseline = {}
    for exp in baseline_expenses:
        cat_id = str(exp.category_id)
        if cat_id not in category_baseline:
            category_baseline[cat_id] = []
        category_baseline[cat_id].append(float(exp.amount))
    
    # Check current month expenses for spikes
    for exp in current_month_expenses:
        cat_id = str(exp.category_id)
        
        if cat_id not in category_baseline or len(category_baseline[cat_id]) < 3:
            continue  # Not enough data
        
        baseline_amounts = category_baseline[cat_id]
        avg = mean(baseline_amounts)
        
        # Only calculate std_dev if we have enough variation
        if len(baseline_amounts) > 1:
            std_dev_val = stdev(baseline_amounts)
        else:
            std_dev_val = avg * 0.1  # Default to 10% of average
        
        # Check if this expense is an outlier (mean + 2 * std_dev)
        threshold = avg + (2 * std_dev_val)
        
        if exp.amount > threshold:
            percentage_increase = ((float(exp.amount) - avg) / avg) * 100 if avg > 0 else 0
            
            # Generate LLM insight
            cat_name = await _get_category_name(cat_id)
            system_prompt = """You are a personal finance analyst. 
Analyze unusual spending and provide a brief, actionable insight.
Focus on: possible causes, whether it's concerning, and recommendations.
Keep response to 1-2 sentences."""
            
            user_prompt = f"""Spending spike analysis:
Category: {cat_name}
Normal monthly average: ${avg:.2f}
Current expense: ${float(exp.amount):.2f}
Increase: {percentage_increase:.1f}%

Provide insight about this spike."""
            
            description = _call_llm(system_prompt, user_prompt)
            
            spikes.append(
                SpendingSpike(
                    category_id=cat_id,
                    category_name=cat_name,
                    amount=exp.amount,
                    average_amount=Decimal(str(round(avg, 2))),
                    percentage_increase=round(percentage_increase, 1),
                    date=exp.date,
                    description=description,
                )
            )
    
    return spikes[:5]  # Return top 5 spikes


async def identify_lifestyle_profile(
    user_id: PydanticObjectId,
    month: int,
    year: int,
) -> LifestyleProfile:
    """
    Identify user's spending lifestyle based on category distribution.
    Returns profile type and top categories.
    """
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(year, month + 1, 1) - timedelta(days=1)
    
    expenses = await Expense.find(
        Expense.user_id == user_id,
        Expense.date >= start_date,
        Expense.date <= end_date,
    ).to_list()
    
    total_spend = sum(e.amount for e in expenses)
    
    if total_spend == 0:
        return LifestyleProfile(
            profile_type="no_data",
            top_categories=[],
            insights="No spending data available for this period.",
        )
    
    # Group by category
    category_totals = {}
    for exp in expenses:
        cat_id = str(exp.category_id)
        if cat_id not in category_totals:
            category_totals[cat_id] = Decimal("0")
        category_totals[cat_id] += exp.amount
    
    # Get top 5 categories with percentages
    top_categories = []
    for cat_id, amount in sorted(
        category_totals.items(),
        key=lambda x: x[1],
        reverse=True
    )[:5]:
        percentage = (float(amount) / float(total_spend)) * 100
        cat_name = await _get_category_name(cat_id)
        top_categories.append(
            CategoryProfile(
                category_id=cat_id,
                category_name=cat_name,
                amount=amount,
                percentage=round(percentage, 1),
            )
        )
    
    # Determine profile type based on top categories
    profile_type = "balanced"
    top_cat_name = top_categories[0].category_name.lower() if top_categories else ""
    
    if top_categories[0].percentage > 30:
        if any(x in top_cat_name for x in ["food", "dining", "restaurant"]):
            profile_type = "food_heavy"
        elif any(x in top_cat_name for x in ["travel", "transport", "flight", "hotel"]):
            profile_type = "travel_heavy"
        elif any(x in top_cat_name for x in ["entertainment", "leisure", "gaming"]):
            profile_type = "entertainment_heavy"
    
    # Generate LLM insight
    category_text = ", ".join([f"{c.category_name} ({c.percentage}%)" for c in top_categories])
    system_prompt = """You are a lifestyle analyst. 
Analyze spending categories and describe the person's spending lifestyle.
Be concise and specific. Highlight lifestyle implications.
Keep to 2-3 sentences."""
    
    user_prompt = f"""Spending breakdown:
{category_text}
Profile: {profile_type}

Describe this person's spending lifestyle and what it reveals about their priorities."""
    
    insights = _call_llm(system_prompt, user_prompt)
    
    return LifestyleProfile(
        profile_type=profile_type,
        top_categories=top_categories,
        insights=insights,
    )


async def detect_spending_trends(
    user_id: PydanticObjectId,
    month: int,
    year: int,
    num_months: int = 3,
) -> list[SpendingTrend]:
    """
    Detect spending trends over time.
    Analyzes month-over-month changes in major categories.
    """
    trends = []
    
    # Get current month and previous months
    months_data = []
    for i in range(num_months):
        m = month - i
        y = year
        if m <= 0:
            m += 12
            y -= 1
        months_data.append((m, y))
    
    months_data.reverse()  # Oldest to newest
    
    # Get expenses for each month
    monthly_expenses = []
    for m, y in months_data:
        start = date(y, m, 1)
        if m == 12:
            end = date(y + 1, 1, 1) - timedelta(days=1)
        else:
            end = date(y, m + 1, 1) - timedelta(days=1)
        
        expenses = await Expense.find(
            Expense.user_id == user_id,
            Expense.date >= start,
            Expense.date <= end,
        ).to_list()
        monthly_expenses.append(expenses)
    
    # Group by category and find trends
    all_categories = set()
    for month_exp in monthly_expenses:
        for exp in month_exp:
            all_categories.add(str(exp.category_id))
    
    for cat_id in all_categories:
        category_amounts = []
        for month_exp in monthly_expenses:
            total = sum(e.amount for e in month_exp if str(e.category_id) == cat_id)
            category_amounts.append(total)
        
        # Calculate trend
        if len(category_amounts) < 2:
            continue
        
        first_amount = float(category_amounts[0])
        last_amount = float(category_amounts[-1])
        
        if first_amount == 0:
            continue  # Skip if no baseline
        
        trend_percentage = ((last_amount - first_amount) / first_amount) * 100
        
        # Only flag significant trends (>5% change)
        if abs(trend_percentage) < 5:
            direction = "stable"
        elif trend_percentage > 5:
            direction = "increasing"
        else:
            direction = "decreasing"
        
        if direction != "stable":
            cat_name = await _get_category_name(cat_id)
            system_prompt = """You are a financial trend analyst.
Explain spending trend changes and their implications.
Be specific about causes and recommendations.
Keep to 1-2 sentences."""
            
            user_prompt = f"""Spending trend for {cat_name}:
3 months ago: ${first_amount:.2f}
Current: ${last_amount:.2f}
Change: {trend_percentage:+.1f}%
Direction: {direction}

Explain this trend and its implications."""
            
            insight = _call_llm(system_prompt, user_prompt)
            
            trends.append(
                SpendingTrend(
                    category_id=cat_id,
                    category_name=cat_name,
                    direction=direction,
                    trend_percentage=round(trend_percentage, 1),
                    months_analyzed=num_months,
                    insight=insight,
                )
            )
    
    return sorted(trends, key=lambda x: abs(x.trend_percentage), reverse=True)[:5]


async def generate_behavior_analysis(
    user_id: PydanticObjectId,
    month: int,
    year: int,
) -> BehaviorAnalysisResponse:
    """
    Generate comprehensive behavior analysis combining all components.
    """
    # Get all components
    spikes = await detect_spending_spikes(user_id, month, year)
    lifestyle = await identify_lifestyle_profile(user_id, month, year)
    trends = await detect_spending_trends(user_id, month, year)
    
    # Generate overall summary
    spike_text = f"{len(spikes)} unusual spikes detected" if spikes else "No unusual spikes"
    trend_text = f"{len(trends)} significant trends" if trends else "Spending patterns stable"
    
    system_prompt = """You are a comprehensive financial analyst.
Summarize spending behavior analysis in a helpful, actionable way.
Provide 3-4 key takeaways about the user's finances.
Be encouraging but honest about areas for improvement.
Keep to 4-5 sentences."""
    
    user_prompt = f"""User spending analysis for {month}/{year}:

Profile: {lifestyle.profile_type}
Spikes: {spike_text}
Trends: {trend_text}

Top categories: {', '.join(c.category_name for c in lifestyle.top_categories[:3])}

Provide a comprehensive summary and key recommendations."""
    
    summary = _call_llm(system_prompt, user_prompt)
    
    return BehaviorAnalysisResponse(
        period="monthly",
        analysis_date=date.today(),
        month=month,
        year=year,
        spending_spikes=spikes,
        lifestyle_profile=lifestyle,
        trends=trends,
        summary=summary,
    )