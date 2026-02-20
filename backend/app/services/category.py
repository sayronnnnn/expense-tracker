import re
from typing import Sequence

from beanie import PydanticObjectId
from beanie.odm.operators.find.logical import Or

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryResponse


def _slug_from_name(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[-\s]+", "-", s)
    return s or "category"


async def list_categories_for_user(user_id: PydanticObjectId) -> list[CategoryResponse]:
    """List system categories (user_id=None) plus user's own categories."""
    system = await Category.find(Category.user_id == None).to_list()
    user_cats = await Category.find(Category.user_id == user_id).to_list()
    all_cats = system + user_cats
    return [
        CategoryResponse(
            id=str(c.id),
            name=c.name,
            slug=c.slug,
            type=c.type,
            user_id=str(c.user_id) if c.user_id else None,
        )
        for c in all_cats
    ]


async def create_user_category(
    user_id: PydanticObjectId,
    payload: CategoryCreate,
) -> Category:
    slug = payload.slug or _slug_from_name(payload.name)
    existing = await Category.find_one(
        Category.slug == slug,
        Or(Category.user_id == user_id, Category.user_id == None),
    )
    if existing:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A category with this slug already exists",
        )
    category = Category(
        name=payload.name,
        slug=slug,
        type="user",
        user_id=user_id,
    )
    await category.insert()
    return category


async def seed_system_categories() -> int:
    """Insert default system categories if none exist. Returns count inserted."""
    existing = await Category.find_one(Category.user_id == None)
    if existing:
        return 0
    defaults = [
        ("Food & Dining", "food-dining"),
        ("Transportation", "transportation"),
        ("Shopping", "shopping"),
        ("Entertainment", "entertainment"),
        ("Bills & Utilities", "bills-utilities"),
        ("Health", "health"),
        ("Travel", "travel"),
        ("Education", "education"),
        ("Personal", "personal"),
        ("Other", "other"),
    ]
    for name, slug in defaults:
        c = Category(name=name, slug=slug, type="system", user_id=None)
        await c.insert()
    return len(defaults)


class CategoryService:
    list_for_user = staticmethod(list_categories_for_user)
    create_user_category = staticmethod(create_user_category)
    seed_system = staticmethod(seed_system_categories)


category_service = CategoryService()
