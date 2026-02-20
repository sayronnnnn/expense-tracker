from fastapi import APIRouter, Depends, Query

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetResponse, BudgetWithActualResponse
from app.services.budget import budget_service

router = APIRouter()


@router.get("", response_model=list[BudgetWithActualResponse])
async def list_budgets(
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None),
    include_actual: bool = Query(True),
    current_user: User = Depends(get_current_user),
):
    """List budgets for the current user. Optionally filter by month/year. Includes actual spent and exceeded flag."""
    return await budget_service.list_for_user(
        current_user.id,
        month=month,
        year=year,
        include_actual=include_actual,
    )


@router.post("", response_model=BudgetResponse, status_code=201)
async def create_budget(
    payload: BudgetCreate,
    current_user: User = Depends(get_current_user),
):
    """Create a monthly budget (optionally per category)."""
    return await budget_service.create(current_user.id, payload)


@router.get("/{budget_id}", response_model=BudgetWithActualResponse)
async def get_budget(
    budget_id: str,
    current_user: User = Depends(get_current_user),
):
    """Get a budget by id with actual spent and exceeded flag."""
    return await budget_service.get_one_with_actual(budget_id, current_user.id)


@router.patch("/{budget_id}", response_model=BudgetResponse)
async def update_budget(
    budget_id: str,
    payload: BudgetUpdate,
    current_user: User = Depends(get_current_user),
):
    """Update a budget."""
    return await budget_service.update(budget_id, current_user.id, payload)


@router.delete("/{budget_id}", status_code=204)
async def delete_budget(
    budget_id: str,
    current_user: User = Depends(get_current_user),
):
    """Delete a budget."""
    await budget_service.delete(budget_id, current_user.id)
