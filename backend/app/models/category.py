from datetime import datetime

from beanie import Document, PydanticObjectId
from pymongo import IndexModel
from pydantic import Field

from app.utils import utc_now


class Category(Document):
    name: str
    slug: str
    type: str = "user"  # system | user
    user_id: PydanticObjectId | None = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    class Settings:
        name = "categories"
        indexes = [
            IndexModel([("slug", 1), ("user_id", 1)], unique=True),
        ]

    class Config:
        populate_by_name = True
