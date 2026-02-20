# LLM Analysis Phase - Implementation Plan

## Overview
Implement automatic spending behavior analysis using LLM (Language Model) to provide intelligent insights about user spending patterns.

## Features to Implement

### 1. **Detect Unusual Spending Spikes**
- **Purpose**: Identify when user spends significantly more than their typical pattern
- **Analysis Method**:
  - Calculate average spending per category (30-day rolling average)
  - Calculate standard deviation for each category
  - Flag expenses that are > (mean + 2 * std_dev)
  - Generate LLM-powered description of the spike
- **Example**: "Unusual spike: Food spending jumped 45% above your average this week"

### 2. **Identify Lifestyle Categories**
- **Purpose**: Detect user's spending lifestyle based on category distribution
- **Analysis Method**:
  - Calculate percentage breakdown of top 5 categories
  - Classify user profile based on spending distribution:
    - Food-heavy (30%+ on food/dining)
    - Travel-heavy (20%+ on transport/travel)
    - Entertainment-heavy (20%+ on entertainment/leisure)
    - Savings-focused (low discretionary spending)
    - Balanced spender
  - Generate LLM insights about lifestyle implications
- **Example**: "Your spending profile: Travel-heavy spender with emphasis on transport and accommodation"

### 3. **Detect Increasing/Decreasing Habits**
- **Purpose**: Identify trends over time
- **Analysis Method**:
  - Compare monthly spending totals (last 3 months)
  - Calculate month-over-month change percentage
  - For each major category, detect trend direction
  - Flag categories with consistent increase/decrease (>5% change for 2+ months)
  - Generate LLM insights about trend implications
- **Example**: "Your food spending has increased 12% each month for the last 2 months - trending upward"

## Technical Architecture

### Backend Components

#### 1. **New Schema: Analysis Response** (`schemas/analysis.py`)
```python
class SpendingSpike(BaseModel):
    category_id: str
    category_name: str
    amount: Decimal
    average_amount: Decimal
    percentage_increase: float
    date: date
    description: str  # LLM-generated

class LifestyleProfile(BaseModel):
    profile_type: str  # food_heavy, travel_heavy, etc.
    top_categories: list[dict]  # [{name, percentage}, ...]
    insights: str  # LLM-generated summary

class SpendingTrend(BaseModel):
    category_id: str
    category_name: str
    direction: str  # increasing, decreasing, stable
    trend_percentage: float
    months_analyzed: int
    insight: str  # LLM-generated

class BehaviorAnalysis(BaseModel):
    period: str  # "monthly", "quarterly"
    spending_spikes: list[SpendingSpike]
    lifestyle_profile: LifestyleProfile
    trends: list[SpendingTrend]
    summary: str  # LLM-generated comprehensive summary
```

#### 2. **New Service: LLM Analysis** (`services/llm_analysis.py`)
- Integration with LLM provider (OpenAI, Claude, etc.)
- Functions:
  - `detect_spending_spikes()` - Identify anomalies
  - `identify_lifestyle_profile()` - Classify spending style
  - `detect_spending_trends()` - Analyze trend direction
  - `generate_insights()` - LLM-powered insight generation
  - `generate_summary()` - Overall analysis summary

#### 3. **New API Endpoint: Analysis** (`api/v1/analysis.py`)
```
POST /analysis/behavior
Query params:
- month: int
- year: int
- analyze_months: int (default 3, for trend analysis)

Response: BehaviorAnalysis
```

### LLM Integration Details

#### Provider Options:
1. **OpenAI GPT-4/3.5-turbo** (Most capable, costs)
2. **Anthropic Claude** (Good alternative, different pricing)
3. **Open-source: Ollama/LLaMA** (Free, self-hosted)

#### Prompting Strategy:
- **Few-shot learning**: Provide examples of good analysis
- **Temperature**: Lower (0.3-0.5) for consistency
- **Max tokens**: 500-1000 depending on analysis type
- **System prompt**: Define role as spending behavior analyst

#### Implementation Approach:
```python
# Example prompt for spike detection
system_prompt = """You are a personal finance analyst. 
Analyze spending data and provide concise, actionable insights.
Focus on: unusual patterns, trends, and lifestyle implications.
Keep responses brief and specific."""

user_prompt = f"""Analyze this spending spike:
- Category: {category}
- Normal monthly spend: ${average}
- This month: ${current}
- Increase: {percentage}%

Provide a brief insight about what might be causing this and recommendations."""
```

### Database Considerations

#### Option 1: Cache Analysis Results
- Store analysis results in a new collection: `spending_analyses`
- Fields: user_id, analysis_date, analysis_data, period_type
- TTL: 24 hours (regenerate daily)
- Benefit: Fast response, reduced LLM calls

#### Option 2: Real-time Analysis
- Generate on-demand when requested
- No caching
- Higher latency but always current
- More LLM API costs

**Recommended**: Hybrid approach
- Cache results for dashboard/default analysis
- Regenerate on-demand for detailed view
- Background job to pre-generate daily analyses

### Frontend Components

#### 1. **Analysis Page** (`pages/Analysis.tsx`)
- Display behavior analysis results
- Show spending spikes with cards
- Lifestyle profile visualization
- Trend charts with insights
- Summary narrative

#### 2. **Analysis Components**
- `SpikingCategories.tsx` - Show unusual spikes
- `LifestyleProfile.tsx` - Display profile with icons
- `TrendCharts.tsx` - Visualize trends
- `AnalysisSummary.tsx` - LLM-generated text

## Implementation Phases

### Phase 1: Backend Foundation (Week 1)
- [ ] Create analysis schemas
- [ ] Set up LLM integration (API keys, client)
- [ ] Implement spike detection logic
- [ ] Implement lifestyle classification
- [ ] Implement trend detection
- [ ] Create analysis service functions

### Phase 2: API & Storage (Week 2)
- [ ] Create analysis API endpoint
- [ ] Implement caching strategy
- [ ] Add background job for pre-analysis
- [ ] Add error handling and logging

### Phase 3: Frontend Display (Week 3)
- [ ] Create analysis page layout
- [ ] Build analysis components
- [ ] Add data fetching hooks
- [ ] Add loading/error states
- [ ] Style with CSS modules

### Phase 4: Refinement (Week 4)
- [ ] Fine-tune LLM prompts
- [ ] Add more analysis types
- [ ] Optimize performance
- [ ] Testing and debugging

## Environment Configuration

```env
# .env.backend
LLM_PROVIDER=openai  # or claude, ollama
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-3.5-turbo
LLM_ANALYSIS_ENABLED=true
```

## API Key Management

- Store API keys in environment variables
- Use secure secret management in production
- Implement rate limiting for LLM calls
- Monitor API usage and costs

## Success Metrics

- Analysis generation time: < 2 seconds
- LLM API cost per analysis: < $0.05
- User engagement: 30%+ of users viewing analysis
- Accuracy: Manual review shows 90%+ relevant insights

## Future Enhancements

1. **Predictive Analysis**
   - Forecast next month spending
   - Budget recommendations

2. **Personalized Recommendations**
   - Cost-saving suggestions
   - Spending goal tracking

3. **Comparative Analytics**
   - Compare to similar users
   - Industry benchmarks

4. **Natural Language Interface**
   - "Ask AI" feature
   - Custom analysis questions

5. **Export & Sharing**
   - Export analysis as PDF
   - Share insights with advisor
