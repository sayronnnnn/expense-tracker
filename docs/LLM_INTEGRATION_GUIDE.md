# LLM-Powered Spending Behavior Analysis

## Overview

The expense tracker now includes intelligent LLM-powered analysis that automatically detects spending patterns and provides personalized insights. This feature is being rolled out in phases.

## Phase 1: Backend Foundation (CURRENT)

### Implementation Status

✅ **Completed:**
- `services/llm_analysis.py` - Core analysis engine with three detection algorithms
- `schemas/analysis_behavior.py` - Data models for analysis results
- API endpoint: `GET /analytics/behavior?month=X&year=Y`
- Frontend API client with TypeScript types

### Features

#### 1. **Spending Spike Detection**
Identifies unusual expenses that deviate from your normal spending patterns.

**Algorithm:** Statistical outlier detection
- Calculates 90-day historical baseline for each category
- Flags expenses > (mean + 2 × standard deviation)
- Generates LLM insight for each spike
- Returns top 5 spikes with percentage increase and date

**Example Response:**
```json
{
  "category_id": "cat_123",
  "category_name": "Dining",
  "amount": 250.00,
  "average_amount": 45.00,
  "percentage_increase": 455.6,
  "date": "2024-01-15",
  "description": "This is significantly higher than your usual dining spending. Consider meal planning to maintain budget control."
}
```

#### 2. **Lifestyle Profile Classification**
Determines your spending lifestyle based on category distribution.

**Algorithm:** Category percentage analysis
- Groups all monthly expenses by category
- Calculates percentage of total spend per category
- Automatically classifies profile type:
  - `food_heavy` - >30% in food/dining categories
  - `travel_heavy` - >30% in travel/transport categories
  - `entertainment_heavy` - >30% in entertainment/leisure
  - `balanced` - diverse spending pattern

**Example Response:**
```json
{
  "profile_type": "food_heavy",
  "top_categories": [
    {
      "category_id": "cat_123",
      "category_name": "Dining",
      "amount": 1200.00,
      "percentage": 35.5
    },
    {
      "category_id": "cat_456",
      "category_name": "Groceries",
      "amount": 800.00,
      "percentage": 23.6
    }
  ],
  "insights": "Your spending is heavily focused on food and dining, accounting for nearly 60% of your budget. This suggests strong social dining habits or frequent restaurant visits. Consider batch cooking or setting dining limits if cost reduction is a goal."
}
```

#### 3. **Trend Detection**
Identifies spending patterns that are increasing or decreasing over time.

**Algorithm:** Month-over-month percentage change analysis
- Analyzes spending for the last 3 months
- Calculates trend percentage for each major category
- Flags trends with >5% change as increasing/decreasing
- Generates LLM insight for each significant trend

**Example Response:**
```json
{
  "category_id": "cat_789",
  "category_name": "Transportation",
  "direction": "increasing",
  "trend_percentage": 25.3,
  "months_analyzed": 3,
  "insight": "Your transportation costs are rising. This could be due to increased fuel prices, more frequent trips, or vehicle maintenance. Track usage patterns to identify the cause."
}
```

### API Endpoint

```
GET /analytics/behavior?month=1&year=2024
```

**Query Parameters:**
- `month` (required): 1-12, the month to analyze
- `year` (required): The year to analyze

**Response:**
```typescript
{
  period: "monthly",
  analysis_date: "2024-01-20",
  month: 1,
  year: 2024,
  spending_spikes: SpendingSpike[],
  lifestyle_profile: LifestyleProfile,
  trends: SpendingTrend[],
  summary: string  // Overall LLM-generated summary
}
```

## Environment Setup

### Backend Dependencies

Add to `backend/requirements.txt` (already included):
```
openai>=1.0.0
```

Install the package:
```bash
pip install -r backend/requirements.txt
```

### LLM Provider Configuration

The system supports multiple LLM providers. Configure via environment variables:

#### Option 1: OpenAI (Recommended for now)

```bash
# .env or environment variables
export LLM_PROVIDER="openai"
export LLM_MODEL="gpt-3.5-turbo"  # or "gpt-4" for higher quality
export OPENAI_API_KEY="sk-..."
```

Get your API key: https://platform.openai.com/api-keys

**Cost Estimate:**
- ~0.001 per analysis call (with gpt-3.5-turbo)
- ~0.03 per analysis call (with gpt-4)
- Caching (future): 24-hour TTL reduces redundant calls

#### Option 2: Claude (Future)

```bash
export LLM_PROVIDER="claude"
export LLM_MODEL="claude-3-sonnet"
export ANTHROPIC_API_KEY="sk-ant-..."
```

#### Option 3: Self-hosted Ollama (Future - Free)

```bash
export LLM_PROVIDER="ollama"
export LLM_MODEL="mistral"
export OLLAMA_BASE_URL="http://localhost:11434"
```

### Docker Setup

If using Docker, add to `backend/.env`:
```env
LLM_PROVIDER=openai
LLM_MODEL=gpt-3.5-turbo
OPENAI_API_KEY=sk-...
```

## Usage

### Backend Service Direct Call

```python
from app.services.llm_analysis import generate_behavior_analysis
from bson import ObjectId

# Generate analysis for January 2024
analysis = await generate_behavior_analysis(
    user_id=ObjectId("..."),
    month=1,
    year=2024
)

print(analysis.summary)
print(f"Found {len(analysis.spending_spikes)} spikes")
print(f"Profile: {analysis.lifestyle_profile.profile_type}")
```

### API Call

```bash
curl "http://localhost:8000/api/v1/analytics/behavior?month=1&year=2024" \
  -H "Authorization: Bearer <token>"
```

### Frontend TypeScript

```typescript
import { getBehaviorAnalysis } from '@/api/analytics'

const analysis = await getBehaviorAnalysis(1, 2024)
console.log(analysis.summary)
console.log(analysis.lifestyle_profile.profile_type)
console.log(analysis.spending_spikes)
```

## Implementation Details

### LLM Integration

Each component (spikes, lifestyle, trends) uses LLM to generate human-readable insights:

1. **Spike Description**: Why this expense is unusual and what to do about it
2. **Lifestyle Insights**: What your spending reveals about your lifestyle
3. **Trend Insight**: What's changing and why it matters
4. **Overall Summary**: Comprehensive financial health assessment

### Prompting Strategy

The system uses structured prompts with:
- **System Role**: Expert financial analyst with specific expertise
- **Constraints**: Conciseness (1-3 sentences), actionability, honesty
- **Temperature**: 0.4 (consistent, focused responses)
- **Max Tokens**: 500 per insight

### Error Handling

If LLM calls fail:
- Returns fallback text: "Unable to generate insight at this time"
- Analysis still completes with available data
- No disruption to user experience

## Testing

### Manual Testing

1. Set up environment variables with OpenAI API key
2. Create test user and add various expenses
3. Call the endpoint:
   ```bash
   curl "http://localhost:8000/api/v1/analytics/behavior?month=1&year=2024" \
     -H "Authorization: Bearer <token>"
   ```
4. Verify response contains spikes, lifestyle profile, trends, and summary

### Test Data Scenarios

1. **Spike Detection**: Add one $500 dining expense when average is $50
2. **Lifestyle Classification**: Add 10 dining expenses + 5 groceries vs others
3. **Trend Detection**: Add increasing transport expenses over 3 months

## Next Phases

### Phase 2: API Enhancement & Caching (Week 2)
- Database model for storing analysis results
- 24-hour caching to reduce API calls
- Background job for daily pre-analysis
- Rate limiting for LLM calls

### Phase 3: Frontend Visualization (Week 3)
- New "Analysis" page with card components
- Interactive charts for trends
- Lifestyle profile visualization
- Spike timeline view

### Phase 4: Advanced Features (Week 4)
- Fine-tuned LLM prompts
- Budget recommendations based on profile
- Goal-setting based on trends
- Comparative insights (vs. similar users)

## Troubleshooting

### Import Error: "openai could not be resolved"
- Run: `pip install openai>=1.0.0`
- Check that requirements.txt is updated
- Restart Python/IDE

### Error: "Unsupported LLM provider"
- Verify `LLM_PROVIDER` environment variable is set
- Check supported values: "openai" (others coming soon)

### Error: "No baseline data available"
- Spike detection requires 3+ historical expenses per category
- Trend detection needs data from previous months
- More data will be available over time

### API Returns null insights
- LLM API may be rate limited
- Check OpenAI account usage and credits
- Verify API key is valid
- Check network connectivity

## Performance Considerations

- **First Analysis**: ~3-5 seconds (multiple LLM calls)
- **Subsequent Calls**: Instant with caching (future)
- **LLM Cost**: ~$0.001-0.03 per analysis
- **Database Queries**: ~10-15 queries per analysis

## Future Enhancements

1. **Comparative Analysis**: How you compare to similar users
2. **Budget Recommendations**: "You should budget $X for dining"
3. **Anomaly Alerts**: Real-time notifications for unusual spending
4. **Goal Tracking**: Progress toward personal financial goals
5. **Multi-month Analysis**: Seasonal patterns and yearly trends
6. **Custom Alerts**: User-defined spending thresholds per category
