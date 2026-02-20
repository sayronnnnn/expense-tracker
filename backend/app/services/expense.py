from datetime import date
from decimal import Decimal
from typing import Sequence

from beanie import PydanticObjectId
from fastapi import HTTPException, status

from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse


def _expense_to_response(e: Expense) -> ExpenseResponse:
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


async def create_expense(
    user_id: PydanticObjectId,
    payload: ExpenseCreate,
) -> ExpenseResponse:
    expense = Expense(
        user_id=user_id,
        category_id=payload.category_oid(),
        amount=payload.amount,
        currency=payload.currency.upper(),
        date=payload.date,
        note=payload.note,
        is_recurring=payload.is_recurring,
        recurring_rule_id=payload.recurring_rule_oid(),
    )
    await expense.insert()
    return _expense_to_response(expense)


async def get_expense(
    expense_id: str,
    user_id: PydanticObjectId,
) -> Expense:
    oid = PydanticObjectId(expense_id)
    expense = await Expense.find_one(Expense.id == oid, Expense.user_id == user_id)
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return expense


async def list_expenses(
    user_id: PydanticObjectId,
    month: int | None = None,
    year: int | None = None,
    category_id: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[ExpenseResponse]:
    query = Expense.find(Expense.user_id == user_id)
    if month is not None and year is not None:
        from datetime import date as date_type

        start = date_type(year, month, 1)
        if month == 12:
            end = date_type(year, 12, 31)
        else:
            end = date_type(year, month + 1, 1)
        from datetime import timedelta

        end = end - timedelta(days=1)
        query = query.find(Expense.date >= start, Expense.date <= end)
    if category_id is not None:
        query = query.find(Expense.category_id == PydanticObjectId(category_id))
    expenses = await query.sort(-Expense.date).skip(skip).limit(limit).to_list()
    return [_expense_to_response(e) for e in expenses]


async def update_expense(
    expense_id: str,
    user_id: PydanticObjectId,
    payload: ExpenseUpdate,
) -> ExpenseResponse:
    expense = await get_expense(expense_id, user_id)
    data = payload.model_dump(exclude_unset=True)
    if "category_id" in data and data["category_id"] is not None:
        data["category_id"] = PydanticObjectId(data["category_id"])
    if "recurring_rule_id" in data:
        data["recurring_rule_id"] = PydanticObjectId(data["recurring_rule_id"]) if data["recurring_rule_id"] else None
    if "currency" in data and data["currency"] is not None:
        data["currency"] = data["currency"].upper()
    for k, v in data.items():
        setattr(expense, k, v)
    await expense.save()
    return _expense_to_response(expense)


async def delete_expense(expense_id: str, user_id: PydanticObjectId) -> None:
    expense = await get_expense(expense_id, user_id)
    await expense.delete()


class ExpenseService:
    create = staticmethod(create_expense)
    get_one = staticmethod(get_expense)
    list_for_user = staticmethod(list_expenses)
    update = staticmethod(update_expense)
    delete = staticmethod(delete_expense)


expense_service = ExpenseService()
