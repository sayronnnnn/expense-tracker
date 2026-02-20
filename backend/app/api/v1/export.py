from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response

from app.api.deps import get_current_user
from app.models.user import User
from app.services.export import export_service

router = APIRouter()


@router.get("/expenses.csv")
async def export_expenses_csv(
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None),
    current_user: User = Depends(get_current_user),
):
    """Export expenses as CSV. Optionally filter by month and year."""
    content = await export_service.expenses_csv(current_user.id, month=month, year=year)
    return Response(
        content=content.encode("utf-8"),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": "attachment; filename=expenses.csv",
        },
    )


@router.get("/summary.pdf")
async def export_summary_pdf(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(...),
    current_user: User = Depends(get_current_user),
):
    """Export monthly summary as PDF."""
    content = await export_service.summary_pdf(current_user.id, month, year)
    return Response(
        content=content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=expense-summary-{year}-{month:02d}.pdf",
        },
    )
