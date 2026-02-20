from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings
from app.models.user import User
from app.models.category import Category
from app.models.expense import Expense
from app.models.budget import Budget
from app.models.recurring_rule import RecurringRule

document_models = [User, Category, Expense, Budget, RecurringRule]
_motor_client: AsyncIOMotorClient | None = None


async def init_db() -> None:
    global _motor_client
    _motor_client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
        database=_motor_client[settings.MONGODB_DB_NAME],
        document_models=document_models,
    )


async def close_db() -> None:
    global _motor_client
    if _motor_client is not None:
        _motor_client.close()
        _motor_client = None
