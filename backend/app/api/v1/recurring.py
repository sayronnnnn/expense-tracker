from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.recurring_rule import RecurringRuleCreate, RecurringRuleUpdate, RecurringRuleResponse
from app.services.recurring import recurring_service

router = APIRouter()


@router.get("", response_model=list[RecurringRuleResponse])
async def list_recurring_rules(current_user: User = Depends(get_current_user)):
    """List all recurring rules for the current user."""
    return await recurring_service.list_for_user(current_user.id)


@router.post("", response_model=RecurringRuleResponse, status_code=201)
async def create_recurring_rule(
    payload: RecurringRuleCreate,
    current_user: User = Depends(get_current_user),
):
    """Create a recurring expense rule. Expenses are created by a background job when due."""
    return await recurring_service.create(current_user.id, payload)


@router.get("/{rule_id}", response_model=RecurringRuleResponse)
async def get_recurring_rule(
    rule_id: str,
    current_user: User = Depends(get_current_user),
):
    """Get a recurring rule by id."""
    return await recurring_service.get_one_response(rule_id, current_user.id)


@router.patch("/{rule_id}", response_model=RecurringRuleResponse)
async def update_recurring_rule(
    rule_id: str,
    payload: RecurringRuleUpdate,
    current_user: User = Depends(get_current_user),
):
    """Update a recurring rule."""
    return await recurring_service.update(rule_id, current_user.id, payload)


@router.delete("/{rule_id}", status_code=204)
async def delete_recurring_rule(
    rule_id: str,
    current_user: User = Depends(get_current_user),
):
    """Delete a recurring rule."""
    await recurring_service.delete(rule_id, current_user.id)
