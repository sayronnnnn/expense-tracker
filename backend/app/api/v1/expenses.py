from fastapi import APIRouter, Depends, Query, HTTPException, status

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from app.services.expense import expense_service

router = APIRouter()


@router.get("", response_model=list[ExpenseResponse])
async def list_expenses(
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None),
    category_id: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
):
    """List expenses for the current user. Optionally filter by month/year and category."""
    if month is not None and year is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="year is required when month is provided",
        )
    return await expense_service.list_for_user(
        current_user.id,
        month=month,
        year=year,
        category_id=category_id,
        skip=skip,
        limit=limit,
    )


@router.post("", response_model=ExpenseResponse, status_code=201)
async def create_expense(
    payload: ExpenseCreate,
    current_user: User = Depends(get_current_user),
):
    """Create an expense."""
    return await expense_service.create(current_user.id, payload)


def _expense_to_response(e) -> ExpenseResponse:
    return ExpenseResponse(
        id=str(e.id),
        user_id=str(e.user_id),
        category_id=str(e.category_id),
        amount=e.amount,
        currency=e.currency,
        date=e.date,
        note=e.note,
        is_recurring=e.is_recurring,
        recurring_rule_id=str(e.recurring_rule_id) if e.recurring_rule_id else None,
        created_at=e.created_at.isoformat(),
        updated_at=e.updated_at.isoformat(),
    )


@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(
    expense_id: str,
    current_user: User = Depends(get_current_user),
):
    """Get a single expense by id."""
    expense = await expense_service.get_one(expense_id, current_user.id)
    return _expense_to_response(expense)


@router.patch("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: str,
    payload: ExpenseUpdate,
    current_user: User = Depends(get_current_user),
):
    """Update an expense."""
    return await expense_service.update(expense_id, current_user.id, payload)


@router.delete("/{expense_id}", status_code=204)
async def delete_expense(
    expense_id: str,
    current_user: User = Depends(get_current_user),
):
    """Delete an expense."""
    await expense_service.delete(expense_id, current_user.id)