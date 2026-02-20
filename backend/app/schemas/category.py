from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    slug: str | None = Field(None, min_length=1, max_length=100)


class CategoryResponse(BaseModel):
    id: str
    name: str
    slug: str
    type: str
    user_id: str | None

    model_config = {"from_attributes": True}
