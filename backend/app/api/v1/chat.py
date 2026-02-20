from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.models.user import User
from app.services.llm_analysis import _call_llm
from app.services.analytics import analytics_service

router = APIRouter()


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    chat_history: list[ChatMessage] = []


class ChatResponse(BaseModel):
    response: str


@router.post("/financial-advice", response_model=ChatResponse)
async def financial_advice(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Get financial advice from AI advisor based on user's question.
    Optionally uses user's spending data for personalized advice.
    """
    try:
        # Get user's recent spending data for context
        current_month = __import__('datetime').datetime.now().month
        current_year = __import__('datetime').datetime.now().year
        
        monthly_total = await analytics_service.monthly_total(
            current_user.id, current_month, current_year
        )
        category_dist = await analytics_service.category_distribution(
            current_user.id, current_month, current_year
        )
        
        # Build context about user's spending
        spending_context = f"""
User's current month (${current_month}/{current_year}):
- Total spending: ₱{monthly_total.total:.2f}
- Average daily spending: ₱{monthly_total.average_daily:.2f}
- Top categories: {', '.join(f"{c.category_name} (₱{c.amount:.2f})" for c in category_dist.categories[:3])}
"""
    except Exception:
        spending_context = ""

    # Build conversation history
    history_text = ""
    for msg in request.chat_history[-5:]:  # Last 5 messages for context
        history_text += f"{msg.role.upper()}: {msg.content}\n"

    system_prompt = """You are an expert financial advisor helping users manage their spending and finances.
You provide personalized, actionable advice based on their situation.
Be encouraging but honest about financial decisions.
Keep responses concise and practical (2-3 paragraphs max).
When relevant, reference their spending data to provide specific recommendations."""

    user_prompt = f"""{spending_context}

Previous conversation:
{history_text}

User's current question: {request.message}

Provide helpful financial advice."""

    response_text = _call_llm(system_prompt, user_prompt)
    
    return ChatResponse(response=response_text)
