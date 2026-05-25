from pathlib import Path
import re

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageTemplate,
    Paragraph,
    Preformatted,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"


def clean_inline(text: str) -> str:
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"`(.+?)`", r"<font name='Courier'>\1</font>", text)
    return text


class NumberedDoc(BaseDocTemplate):
    def __init__(self, filename: str, title: str):
        self.doc_title = title
        super().__init__(
            filename,
            pagesize=A4,
            leftMargin=3 * cm,
            rightMargin=2.5 * cm,
            topMargin=2.5 * cm,
            bottomMargin=2.5 * cm,
        )
        frame = Frame(
            self.leftMargin,
            self.bottomMargin,
            self.width,
            self.height,
            id="normal",
        )
        self.addPageTemplates(
            [
                PageTemplate(
                    id="doc",
                    frames=[frame],
                    onPage=self.draw_page,
                )
            ]
        )

    def draw_page(self, canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(colors.HexColor("#6b7280"))
        canvas.drawString(3 * cm, 1.5 * cm, self.doc_title)
        canvas.drawRightString(A4[0] - 2.5 * cm, 1.5 * cm, f"Pagina {doc.page}")
        canvas.restoreState()


def styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "DocTitle",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=24,
            leading=30,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#111827"),
            spaceAfter=22,
        ),
        "h1": ParagraphStyle(
            "Heading1Custom",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=17,
            leading=21,
            textColor=colors.HexColor("#0f172a"),
            spaceBefore=16,
            spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "Heading2Custom",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=17,
            textColor=colors.HexColor("#1f2937"),
            spaceBefore=10,
            spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "BodyCustom",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=11,
            leading=18,
            alignment=TA_LEFT,
            spaceAfter=6,
        ),
        "bullet": ParagraphStyle(
            "BulletCustom",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=11,
            leading=17,
            leftIndent=14,
            firstLineIndent=-8,
            spaceAfter=4,
        ),
        "code": ParagraphStyle(
            "CodeCustom",
            parent=base["Code"],
            fontName="Courier",
            fontSize=8.5,
            leading=11,
            leftIndent=8,
            rightIndent=8,
            spaceBefore=4,
            spaceAfter=8,
            backColor=colors.HexColor("#f3f4f6"),
        ),
    }


def render_markdown(markdown_path: Path, pdf_path: Path):
    st = styles()
    lines = markdown_path.read_text(encoding="utf-8").splitlines()
    title = lines[0].lstrip("# ").strip() if lines else markdown_path.stem
    story = [Paragraph(clean_inline(title), st["title"])]
    in_code = False
    code_lines: list[str] = []
    bullet_lines: list[str] = []

    def flush_bullets():
        nonlocal bullet_lines
        for item in bullet_lines:
            story.append(Paragraph(clean_inline("- " + item), st["bullet"]))
        bullet_lines = []

    def flush_code():
        nonlocal code_lines
        if code_lines:
            story.append(Preformatted("\n".join(code_lines), st["code"]))
            code_lines = []

    for raw in lines[1:]:
        line = raw.rstrip()
        if line.startswith("```"):
            if in_code:
                flush_code()
                in_code = False
            else:
                flush_bullets()
                in_code = True
            continue
        if in_code:
            code_lines.append(line)
            continue
        if not line.strip():
            flush_bullets()
            story.append(Spacer(1, 4))
            continue
        if line.startswith("## "):
            flush_bullets()
            story.append(Paragraph(clean_inline(line[3:].strip()), st["h1"]))
            continue
        if line.startswith("### "):
            flush_bullets()
            story.append(Paragraph(clean_inline(line[4:].strip()), st["h2"]))
            continue
        if line.startswith("- "):
            bullet_lines.append(line[2:].strip())
            continue
        if re.match(r"^\d+\. ", line):
            flush_bullets()
            story.append(Paragraph(clean_inline(line), st["body"]))
            continue
        flush_bullets()
        story.append(Paragraph(clean_inline(line), st["body"]))

    flush_bullets()
    flush_code()

    doc = NumberedDoc(str(pdf_path), title)
    doc.build(story)


def main():
    targets = [
        ("manual-de-uso.md", "Manual de uso - Footy IQ.pdf"),
        ("documentacion-aplicacion.md", "Documentacion de la aplicacion - Footy IQ.pdf"),
    ]
    for md_name, pdf_name in targets:
        render_markdown(DOCS / md_name, DOCS / pdf_name)
        print(DOCS / pdf_name)


if __name__ == "__main__":
    main()
