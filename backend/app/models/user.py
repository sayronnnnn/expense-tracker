from datetime import datetime

from beanie import Document, Indexed
from pydantic import Field

from app.utils import utc_now


class User(Document):
    email: Indexed(str, unique=True)
    password_hash: str
    name: str | None = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    class Settings:
        name = "users"

    class Config:
        populate_by_name = True
