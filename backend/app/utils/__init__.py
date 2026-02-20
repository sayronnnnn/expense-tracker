from datetime import datetime, timezone
from decimal import Decimal


def utc_now() -> datetime:
    """Timezone-aware UTC now (avoids deprecated datetime.utcnow())."""
    return datetime.now(timezone.utc)


def decimal_from_bson(value: object) -> Decimal:
    """Convert MongoDB Decimal128 or other numeric input to Python Decimal for Pydantic."""
    if value is None:
        raise ValueError("decimal value required")
    if hasattr(value, "to_decimal"):
        return value.to_decimal()
    return Decimal(str(value))
