import csv
import io
from datetime import date, timedelta
from decimal import Decimal

from beanie import PydanticObjectId
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

from app.models.expense import Expense
from app.models.category import Category
from app.services.analytics import get_monthly_total, get_category_distribution


async def export_expenses_csv(
    user_id: PydanticObjectId,
    month: int | None = None,
    year: int | None = None,
) -> str:
    """Export user's expenses as CSV. If month/year given, filter to that month."""
    if month is not None and year is not None:
        start = date(year, month, 1)
        end = start.replace(day=28) + timedelta(days=4)
        end = end.replace(day=1) - timedelta(days=1)
        expenses = await Expense.find(
            Expense.user_id == user_id,
            Expense.date >= start,
            Expense.date <= end,
        ).sort(-Expense.date).to_list()
    else:
        expenses = await Expense.find(Expense.user_id == user_id).sort(-Expense.date).limit(10_000).to_list()

    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(["Date", "Amount", "Currency", "Category ID", "Note", "Recurring"])
    for e in expenses:
        writer.writerow([
            e.date.isoformat(),
            str(e.amount),
            e.currency,
            str(e.category_id),
            (e.note or ""),
            "Yes" if e.is_recurring else "No",
        ])
    return out.getvalue()


async def export_summary_pdf(
    user_id: PydanticObjectId,
    month: int,
    year: int,
) -> bytes:
    """Generate a one-page PDF summary for the given month: total and by-category breakdown."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=inch,
        leftMargin=inch,
        topMargin=inch,
        bottomMargin=inch,
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Heading1"],
        fontSize=16,
        spaceAfter=12,
    )
    flow = []
    flow.append(Paragraph(f"Expense Summary — {year}-{month:02d}", title_style))
    flow.append(Spacer(1, 0.25 * inch))

    total_resp = await get_monthly_total(user_id, month, year)
    flow.append(Paragraph(f"Total spending: {total_resp.currency} {total_resp.total}", styles["Normal"]))
    flow.append(Spacer(1, 0.25 * inch))

    dist = await get_category_distribution(user_id, month, year)
    if dist.by_category:
        data = [["Category", "Amount"]] + [
            [item.category_name, f"{item.total} {item.currency}"]
            for item in dist.by_category
        ]
        t = Table(data, colWidths=[3 * inch, 1.5 * inch])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("FONTSIZE", (0, 0), (-1, 0), 10),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
            ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        flow.append(t)
    doc.build(flow)
    buffer.seek(0)
    return buffer.read()


class ExportService:
    expenses_csv = staticmethod(export_expenses_csv)
    summary_pdf = staticmethod(export_summary_pdf)


export_service = ExportService()
