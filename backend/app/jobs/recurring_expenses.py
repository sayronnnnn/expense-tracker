"""APScheduler job: create expenses from recurring rules that are due."""
from app.services.recurring import recurring_service
from app.utils import utc_now


async def run_recurring_expenses_job() -> None:
    """Create expenses for all recurring rules that are due. Call from AsyncIOScheduler."""
    await recurring_service.process_due(utc_now())
