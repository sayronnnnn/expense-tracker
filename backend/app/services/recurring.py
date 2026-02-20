from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from beanie import PydanticObjectId
from fastapi import HTTPException, status

from app.models.expense import Expense
from app.models.recurring_rule import RecurringRule
from app.schemas.recurring_rule import RecurringRuleCreate, RecurringRuleUpdate, RecurringRuleResponse
from app.utils import utc_now


def _next_run_from_frequency(from_dt: datetime, frequency: str) -> datetime:
    if frequency == "daily":
        return from_dt + timedelta(days=1)
    if frequency == "weekly":
        return from_dt + timedelta(days=7)
    if frequency == "monthly":
        y, m, d = from_dt.year, from_dt.month, from_dt.day
        m += 1
        if m > 12:
            m -= 12
            y += 1
        try:
            return from_dt.replace(year=y, month=m, day=min(d, 28))
        except ValueError:
            return from_dt.replace(year=y, month=m, day=1) + timedelta(days=d - 1)
    if frequency == "yearly":
        return from_dt.replace(year=from_dt.year + 1)
    return from_dt + timedelta(days=1)


def _rule_to_response(r: RecurringRule) -> RecurringRuleResponse:
    return RecurringRuleResponse(
        id=str(r.id),
        user_id=str(r.user_id),
        category_id=str(r.category_id),
        amount=r.amount,
        currency=r.currency,
        note=r.note,
        frequency=r.frequency,
        next_run_at=r.next_run_at.isoformat(),
        last_run_at=r.last_run_at.isoformat() if r.last_run_at else None,
        created_at=r.created_at.isoformat(),
        updated_at=r.updated_at.isoformat(),
    )


async def create_rule(
    user_id: PydanticObjectId,
    payload: RecurringRuleCreate,
) -> RecurringRuleResponse:
    if payload.start_date is not None:
        when = datetime.combine(payload.start_date, datetime.min.time(), tzinfo=timezone.utc)
    else:
        when = utc_now()
    rule = RecurringRule(
        user_id=user_id,
        category_id=PydanticObjectId(payload.category_id),
        amount=payload.amount,
        currency=payload.currency.upper(),
        note=payload.note,
        frequency=payload.frequency,
        next_run_at=when,
    )
    await rule.insert()
    return _rule_to_response(rule)


async def get_rule(
    rule_id: str,
    user_id: PydanticObjectId,
) -> RecurringRule:
    oid = PydanticObjectId(rule_id)
    rule = await RecurringRule.find_one(RecurringRule.id == oid, RecurringRule.user_id == user_id)
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring rule not found")
    return rule


async def list_rules(user_id: PydanticObjectId) -> list[RecurringRuleResponse]:
    rules = await RecurringRule.find(RecurringRule.user_id == user_id).to_list()
    return [_rule_to_response(r) for r in rules]


async def update_rule(
    rule_id: str,
    user_id: PydanticObjectId,
    payload: RecurringRuleUpdate,
) -> RecurringRuleResponse:
    rule = await get_rule(rule_id, user_id)
    data = payload.model_dump(exclude_unset=True)
    if "category_id" in data and data["category_id"] is not None:
        data["category_id"] = PydanticObjectId(data["category_id"])
    if "currency" in data and data["currency"]:
        data["currency"] = data["currency"].upper()
    for k, v in data.items():
        setattr(rule, k, v)
    await rule.save()
    return _rule_to_response(rule)


async def delete_rule(rule_id: str, user_id: PydanticObjectId) -> None:
    rule = await get_rule(rule_id, user_id)
    await rule.delete()


async def process_due_rules(now: datetime | None = None) -> int:
    """
    Find rules with next_run_at <= now, create an expense for each, advance next_run_at.
    Returns count of expenses created. Avoids duplicates by checking existing expense for (rule_id, date).
    """
    when = now or utc_now()
    due = await RecurringRule.find(RecurringRule.next_run_at <= when).to_list()
    created = 0
    for rule in due:
        run_date = rule.next_run_at.date() if hasattr(rule.next_run_at, "date") else date(
            rule.next_run_at.year, rule.next_run_at.month, rule.next_run_at.day
        )
        existing = await Expense.find_one(
            Expense.recurring_rule_id == rule.id,
            Expense.date == run_date,
        )
        if existing:
            rule.next_run_at = _next_run_from_frequency(rule.next_run_at, rule.frequency)
            rule.last_run_at = when
            await rule.save()
            continue
        expense = Expense(
            user_id=rule.user_id,
            category_id=rule.category_id,
            amount=rule.amount,
            currency=rule.currency,
            date=run_date,
            note=rule.note,
            is_recurring=True,
            recurring_rule_id=rule.id,
        )
        await expense.insert()
        created += 1
        rule.last_run_at = when
        rule.next_run_at = _next_run_from_frequency(rule.next_run_at, rule.frequency)
        await rule.save()
    return created


async def get_rule_response(rule_id: str, user_id: PydanticObjectId) -> RecurringRuleResponse:
    rule = await get_rule(rule_id, user_id)
    return _rule_to_response(rule)


class RecurringService:
    create = staticmethod(create_rule)
    get_one = staticmethod(get_rule)
    get_one_response = staticmethod(get_rule_response)
    list_for_user = staticmethod(list_rules)
    update = staticmethod(update_rule)
    delete = staticmethod(delete_rule)
    process_due = staticmethod(process_due_rules)


recurring_service = RecurringService()
