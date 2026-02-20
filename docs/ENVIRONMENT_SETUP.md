# Environment & Deployment Setup Guide

## Environment Variables

### Backend Environment Variables

#### Required for LLM Analysis
```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-key-here
LLM_PROVIDER=openai
LLM_MODEL=gpt-3.5-turbo
```

#### Optional - For Production
```env
# Rate Limiting
LLM_MAX_CALLS_PER_HOUR=60
LLM_CACHE_TTL=86400  # 24 hours in seconds

# Logging
LLM_DEBUG=false
LOG_LEVEL=INFO
```

### Where to Set Them

#### Option 1: Shell Environment (Development)

**Windows PowerShell:**
```powershell
$env:OPENAI_API_KEY = "sk-your-key"
$env:LLM_PROVIDER = "openai"
$env:LLM_MODEL = "gpt-3.5-turbo"
```

**macOS/Linux Bash:**
```bash
export OPENAI_API_KEY="sk-your-key"
export LLM_PROVIDER="openai"
export LLM_MODEL="gpt-3.5-turbo"
```

#### Option 2: .env File (Development)

Create `backend/.env`:
```env
# Database
MONGODB_URL=mongodb://localhost:27017/expense_tracker

# Auth
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256

# LLM
OPENAI_API_KEY=sk-your-key-here
LLM_PROVIDER=openai
LLM_MODEL=gpt-3.5-turbo
```

Load with:
```bash
# Add to backend/run.py or use python-dotenv
from dotenv import load_dotenv
load_dotenv()
```

#### Option 3: Docker Compose (Development/Production)

Update `docker-compose.yml`:
```yaml
services:
  backend:
    image: expense-tracker-backend
    environment:
      - MONGODB_URL=mongodb://mongo:27017/expense_tracker
      - JWT_SECRET_KEY=your-secret-key
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - LLM_PROVIDER=openai
      - LLM_MODEL=gpt-3.5-turbo
    ports:
      - "8000:8000"
    depends_on:
      - mongo

  frontend:
    image: expense-tracker-frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend

  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

Run with env vars:
```bash
OPENAI_API_KEY=sk-your-key docker-compose up
```

#### Option 4: Environment File with Docker

Create `.env.docker`:
```env
OPENAI_API_KEY=sk-your-key
LLM_PROVIDER=openai
LLM_MODEL=gpt-3.5-turbo
```

In `docker-compose.yml`:
```yaml
services:
  backend:
    env_file:
      - .env.docker
```

Run:
```bash
docker-compose up
```

#### Option 5: Kubernetes Secrets (Production)

```bash
kubectl create secret generic llm-config \
  --from-literal=openai-api-key=sk-your-key \
  --from-literal=llm-provider=openai \
  --from-literal=llm-model=gpt-3.5-turbo

kubectl create secret generic llm-config \
  --from-file=.env.k8s
```

In `deployment.yaml`:
```yaml
spec:
  template:
    spec:
      containers:
      - name: backend
        envFrom:
        - secretRef:
            name: llm-config
```

## Security Best Practices

### 1. API Key Management

❌ **Never do this:**
```
# DON'T commit to git!
OPENAI_API_KEY=sk-xxx in code/config files
```

✅ **Do this instead:**
```bash
# Use environment variables
export OPENAI_API_KEY="sk-..."

# Use .env with .gitignore
# .env (add to .gitignore)
OPENAI_API_KEY=sk-...
```

### 2. Rotate Keys Regularly

```bash
# Monthly key rotation recommended
# 1. Create new API key in OpenAI console
# 2. Update environment variable
# 3. Test endpoints
# 4. Revoke old key
```

### 3. Rate Limiting

Implement in production:
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.get("/analytics/behavior")
@limiter.limit("10/minute")  # Max 10 analyses per minute per IP
async def behavior_analysis(...):
    ...
```

### 4. Monitor API Usage

```python
# Log all LLM calls
import logging

logger = logging.getLogger("llm_usage")

async def generate_behavior_analysis(...):
    logger.info(f"Analysis called for user {user_id}, month {month}/{year}")
    # ... rest of function
```

Check OpenAI usage dashboard regularly

## Development Setup

### Prerequisites

- Python 3.10+
- Node.js 16+
- MongoDB (local or Docker)
- OpenAI API key (free tier available)

### First Time Setup

```bash
# Clone repo
git clone <repo>
cd expense-tracker

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set environment
export OPENAI_API_KEY="sk-..."
export LLM_PROVIDER="openai"

# Frontend setup
cd ../frontend
npm install

# Run backend
cd ../backend
python run.py

# In new terminal, run frontend
cd frontend
npm run dev
```

### Running with Docker

```bash
# Set API key
export OPENAI_API_KEY="sk-your-key"

# Run stack
docker-compose up

# App available at:
# Frontend: http://localhost:5173
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

## Testing Environments

### Test with Different Models

```bash
# Test with GPT-4 (higher quality, more expensive)
export LLM_MODEL="gpt-4"

# Test with GPT-3.5-turbo (faster, cheaper)
export LLM_MODEL="gpt-3.5-turbo"
```

### Test with Mock LLM (No API Key Needed)

Create `test_llm.py`:
```python
import os
from unittest.mock import patch

# Mock response
MOCK_RESPONSE = "This is a test insight from the mock LLM."

def test_analysis_with_mock():
    with patch("app.services.llm_analysis._call_llm", return_value=MOCK_RESPONSE):
        # Run tests here
        pass
```

### Load Testing

```bash
# Install Apache Bench
# Ubuntu: sudo apt-get install apache2-utils
# macOS: brew install httpd
# Windows: use Docker image

ab -n 100 -c 10 "http://localhost:8000/analytics/behavior?month=1&year=2024"
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] API key configured in environment
- [ ] `.env` file NOT committed to git
- [ ] `requirements.txt` includes openai package
- [ ] All tests passing
- [ ] Rate limiting configured
- [ ] Logging configured
- [ ] Error handling tested
- [ ] Database backups configured
- [ ] Monitoring alerts set up
- [ ] Documentation updated

### Heroku Deployment

```bash
# Install Heroku CLI
# Create app
heroku create expense-tracker

# Set config variables
heroku config:set OPENAI_API_KEY=sk-... -a expense-tracker
heroku config:set LLM_PROVIDER=openai -a expense-tracker
heroku config:set LLM_MODEL=gpt-3.5-turbo -a expense-tracker

# Deploy
git push heroku main

# View logs
heroku logs -a expense-tracker --tail
```

### AWS EC2 Deployment

```bash
# Connect to instance
ssh -i key.pem ec2-user@your-instance.amazonaws.com

# Install dependencies
sudo apt-get update
sudo apt-get install python3.10 python3-pip nodejs npm

# Clone and setup
git clone <repo>
cd expense-tracker

# Create environment file
sudo nano /etc/environment
# Add: OPENAI_API_KEY=sk-...

# Start services
docker-compose -f docker-compose.yml up -d
```

### GCP Cloud Run Deployment

```bash
# Build image
gcloud builds submit --tag gcr.io/PROJECT/expense-tracker-backend

# Deploy
gcloud run deploy expense-tracker-backend \
  --image gcr.io/PROJECT/expense-tracker-backend \
  --set-env-vars OPENAI_API_KEY=sk-... \
  --memory 512Mi \
  --timeout 300s
```

### Azure Container Instances

```bash
# Create container registry
az acr create --resource-group mygroup --name myregistry --sku Basic

# Build image
az acr build --registry myregistry --image expense-tracker:latest .

# Deploy
az container create \
  --resource-group mygroup \
  --name expense-tracker \
  --image myregistry.azurecr.io/expense-tracker:latest \
  --environment-variables OPENAI_API_KEY=sk-... \
  --cpu 1 --memory 1
```

## Monitoring & Logging

### Application Logging

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)
```

### LLM API Monitoring

Track:
- API calls per hour/day
- Average response time
- Error rate
- Cost per analysis
- Cache hit rate

### Alerting Rules

Set alerts for:
- API response time > 10 seconds
- Error rate > 1%
- API quota approaching limit
- Unusual spike in API calls

## Troubleshooting Production Issues

### Issue: "API rate limit exceeded"

**Solution:**
```python
# Implement exponential backoff
import time

def retry_with_backoff(max_retries=3):
    for attempt in range(max_retries):
        try:
            return _call_llm(...)
        except RateLimitError:
            wait_time = 2 ** attempt
            time.sleep(wait_time)
    raise Exception("Max retries exceeded")
```

### Issue: "LLM service unavailable"

**Solution:**
- Return cached results if available
- Use fallback insights
- Alert ops team
- Automatically retry after delay

### Issue: "High API costs"

**Solution:**
- Implement 24-hour caching
- Pre-analyze common scenarios
- Use GPT-3.5-turbo instead of GPT-4
- Set up usage alerts

## Cost Optimization

### Caching Strategy (Phase 2)

```python
# Cache results for 24 hours
async def get_analysis_cached(user_id, month, year):
    cache_key = f"analysis:{user_id}:{month}:{year}"
    
    # Check cache
    cached = await redis.get(cache_key)
    if cached:
        return json.loads(cached)
    
    # Generate if not cached
    analysis = await generate_behavior_analysis(user_id, month, year)
    
    # Store in cache
    await redis.setex(cache_key, 86400, json.dumps(analysis))
    
    return analysis
```

### Batch Processing

Process multiple users at night when rates might be cheaper

### Model Selection

- GPT-3.5-turbo: $0.0005/1K tokens (~$0.001/analysis)
- GPT-4: $0.03/1K tokens (~$0.03/analysis)
- Choose based on quality requirements

## Compliance & Privacy

### Data Privacy
- User data never sent to LLM without consent
- Analysis stored in your database only
- No cross-user comparisons without consent

### Audit Logging
```python
# Log all analysis requests
async def audit_log(user_id, action, details):
    await AuditLog.insert_one({
        "user_id": user_id,
        "action": action,
        "details": details,
        "timestamp": datetime.now(),
        "ip_address": request.client.host
    })
```

### GDPR Compliance
- User can request analysis data export
- User can request deletion of analysis
- Clear terms about LLM usage

## Summary

Key takeaways:
1. Always use environment variables for secrets
2. Never commit `.env` files
3. Implement rate limiting in production
4. Monitor API usage and costs
5. Set up proper logging and alerting
6. Use caching to reduce costs
7. Test before deploying
8. Document your setup

For questions, check:
- `docs/LLM_INTEGRATION_GUIDE.md` - Feature details
- `docs/PHASE_1_SETUP.md` - Setup guide
- Backend code comments - Implementation details
