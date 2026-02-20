from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryResponse
from app.services.category import category_service

router = APIRouter()


@router.get("", response_model=list[CategoryResponse])
async def list_categories(current_user: User = Depends(get_current_user)):
    """List system categories plus the current user's categories."""
    return await category_service.list_for_user(current_user.id)


@router.post("", response_model=CategoryResponse, status_code=201)
async def create_category(
    payload: CategoryCreate,
    current_user: User = Depends(get_current_user),
):
    """Create a user-specific category."""
    category = await category_service.create_user_category(current_user.id, payload)
    return CategoryResponse(
        id=str(category.id),
        name=category.name,
        slug=category.slug,
        type=category.type,
        user_id=str(category.user_id) if category.user_id else None,
    )
