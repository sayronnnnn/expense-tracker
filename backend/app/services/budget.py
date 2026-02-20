from datetime import date
from decimal import Decimal

from beanie import PydanticObjectId
from fastapi import HTTPException, status

from app.models.budget import Budget
from app.models.expense import Expense
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetResponse, BudgetWithActualResponse


def _budget_to_response(b: Budget) -> BudgetResponse:
    return BudgetResponse(
        id=str(b.id),
        user_id=str(b.user_id),
        month=b.month,
        year=b.year,
        amount=b.amount,
        currency=b.currency,
        category_id=str(b.category_id) if b.category_id else None,
        created_at=b.created_at.isoformat(),
        updated_at=b.updated_at.isoformat(),
    )


async def _actual_spent(
    user_id: PydanticObjectId,
    month: int,
    year: int,
    category_id: PydanticObjectId | None,
) -> Decimal:
    """Sum of expenses for the user in the given month (and category if set)."""
    start = date(year, month, 1)
    if month == 12:
        end = date(year, 12, 31)
    else:
        end = date(year, month + 1, 1)
    from datetime import timedelta
    end = end - timedelta(days=1)

    if category_id is not None:
        expenses = await Expense.find(
            Expense.user_id == user_id,
            Expense.date >= start,
            Expense.date <= end,
            Expense.category_id == category_id,
        ).to_list()
    else:
        expenses = await Expense.find(
            Expense.user_id == user_id,
            Expense.date >= start,
            Expense.date <= end,
        ).to_list()
    total = sum(e.amount for e in expenses)
    return Decimal(str(total))


async def create_budget(
    user_id: PydanticObjectId,
    payload: BudgetCreate,
) -> BudgetResponse:
    cat_oid = PydanticObjectId(payload.category_id) if payload.category_id else None
    existing = await Budget.find_one(
        Budget.user_id == user_id,
        Budget.month == payload.month,
        Budget.year == payload.year,
        Budget.category_id == cat_oid,
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A budget for this month/year and category already exists",
        )
    budget = Budget(
        user_id=user_id,
        month=payload.month,
        year=payload.year,
        amount=payload.amount,
        currency=payload.currency.upper(),
        category_id=cat_oid,
    )
    await budget.insert()
    return _budget_to_response(budget)


async def get_budget(
    budget_id: str,
    user_id: PydanticObjectId,
) -> Budget:
    oid = PydanticObjectId(budget_id)
    budget = await Budget.find_one(Budget.id == oid, Budget.user_id == user_id)
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")
    return budget


async def get_budget_with_actual(
    budget_id: str,
    user_id: PydanticObjectId,
) -> BudgetWithActualResponse:
    budget = await get_budget(budget_id, user_id)
    actual = await _actual_spent(user_id, budget.month, budget.year, budget.category_id)
    return BudgetWithActualResponse(
        **_budget_to_response(budget).model_dump(),
        actual_spent=actual,
        exceeded=actual >= budget.amount,
    )


async def list_budgets(
    user_id: PydanticObjectId,
    month: int | None = None,
    year: int | None = None,
    include_actual: bool = True,
) -> list[BudgetResponse] | list[BudgetWithActualResponse]:
    conditions: list = [Budget.user_id == user_id]
    if month is not None:
        conditions.append(Budget.month == month)
    if year is not None:
        conditions.append(Budget.year == year)
    budgets = await Budget.find(*conditions).to_list()
    out = []
    for b in budgets:
        if include_actual:
            actual = await _actual_spent(user_id, b.month, b.year, b.category_id)
            exceeded = actual >= b.amount
        else:
            actual = Decimal("0")
            exceeded = False
        out.append(
            BudgetWithActualResponse(
                **_budget_to_response(b).model_dump(),
                actual_spent=actual,
                exceeded=exceeded,
            )
        )
    return out


async def update_budget(
    budget_id: str,
    user_id: PydanticObjectId,
    payload: BudgetUpdate,
) -> BudgetResponse:
    budget = await get_budget(budget_id, user_id)
    data = payload.model_dump(exclude_unset=True)
    if "category_id" in data:
        data["category_id"] = PydanticObjectId(data["category_id"]) if data["category_id"] else None
    if "currency" in data and data["currency"]:
        data["currency"] = data["currency"].upper()
    for k, v in data.items():
        setattr(budget, k, v)
    await budget.save()
    return _budget_to_response(budget)


async def delete_budget(budget_id: str, user_id: PydanticObjectId) -> None:
    budget = await get_budget(budget_id, user_id)
    await budget.delete()


class BudgetService:
    create = staticmethod(create_budget)
    get_one = staticmethod(get_budget)
    get_one_with_actual = staticmethod(get_budget_with_actual)
    list_for_user = staticmethod(list_budgets)
    update = staticmethod(update_budget)
    delete = staticmethod(delete_budget)


budget_service = BudgetService()
