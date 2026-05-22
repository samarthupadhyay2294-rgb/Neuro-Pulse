import os
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from config import DISCLAIMER, REPORTS_FOLDER


def generate_pdf_report(entry: dict) -> str:
    os.makedirs(REPORTS_FOLDER, exist_ok=True)
    entry_id = entry.get("id", "report")
    path = os.path.join(REPORTS_FOLDER, f"neuro_pulse_{entry_id}.pdf")

    doc = SimpleDocTemplate(path, pagesize=letter)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "Title",
        parent=styles["Heading1"],
        textColor=colors.HexColor("#2563EB"),
        spaceAfter=12,
    )
    story = []

    story.append(Paragraph("Neuro Pulse — Health Screening Report", title_style))
    story.append(
        Paragraph(
            f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}",
            styles["Normal"],
        )
    )
    story.append(Spacer(1, 0.25 * inch))

    result = entry.get("result", {})
    rows = [
        ["Risk Level", result.get("risk_level", "—")],
        ["Confidence", f"{result.get('confidence_percent', 0)}%"],
        ["ML Prediction", "Parkinson's indicated" if result.get("ml_prediction") == 1 else "Healthy pattern"],
        ["Symptom Score", str(result.get("symptom_score", "—"))],
    ]
    table = Table(rows, colWidths=[2.2 * inch, 4 * inch])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F1F5F9")),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#1E293B")),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E2E8F0")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(table)
    story.append(Spacer(1, 0.2 * inch))

    story.append(Paragraph("<b>Symptom Summary</b>", styles["Heading3"]))
    story.append(Paragraph(result.get("symptom_summary", "—"), styles["Normal"]))
    story.append(Spacer(1, 0.15 * inch))

    assessment = result.get("assessment_type", "")
    if assessment == "symptoms_only":
        story.append(Paragraph("<b>Assessment Mode</b>", styles["Heading3"]))
        story.append(
            Paragraph("Symptom questionnaire only (voice not provided).", styles["Normal"])
        )
        story.append(Spacer(1, 0.1 * inch))

    story.append(Paragraph("<b>Voice Analysis Summary</b>", styles["Heading3"]))
    story.append(Paragraph(result.get("voice_summary", "—"), styles["Normal"]))
    story.append(Spacer(1, 0.15 * inch))

    story.append(Paragraph("<b>Recommendation</b>", styles["Heading3"]))
    story.append(Paragraph(result.get("recommendation", "—"), styles["Normal"]))
    story.append(Spacer(1, 0.3 * inch))

    story.append(Paragraph("<b>Medical Disclaimer</b>", styles["Heading4"]))
    story.append(Paragraph(DISCLAIMER, styles["Italic"]))

    doc.build(story)
    return path
