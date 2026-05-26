from pathlib import Path
from io import BytesIO

from pypdf import PdfReader, PdfWriter
from reportlab.lib.colors import black, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
PDF_DIR = ROOT / "original-templates"
OUT_DIR = ROOT / "sample-output"
FONT_PATH = ROOT / "award-site" / "assets" / "edukai-5.1_20251208.ttf"
FONT_NAME = "EduKai"


def top_y(page_height, y_from_top):
    return page_height - y_from_top


def draw_centered(c, text, x, y, font_size=22):
    c.setFillColor(black)
    c.setFont(FONT_NAME, font_size)
    c.drawCentredString(x, y, text)


def draw_left(c, text, x, y, font_size=22):
    c.setFillColor(black)
    c.setFont(FONT_NAME, font_size)
    c.drawString(x, y, text)


def cover(c, x, y_top, width, height, page_height):
    c.setFillColor(white)
    c.setStrokeColor(white)
    c.rect(x, top_y(page_height, y_top + height), width, height, fill=1, stroke=0)


def make_overlay(page_width, page_height, draw_fn):
    packet = BytesIO()
    c = canvas.Canvas(packet, pagesize=(page_width, page_height))
    draw_fn(c, page_width, page_height)
    c.save()
    packet.seek(0)
    return PdfReader(packet).pages[0]


def write_certificate(template, out_name, draw_fn):
    reader = PdfReader(str(template))
    page = reader.pages[0]
    page_width = float(page.mediabox.width)
    page_height = float(page.mediabox.height)
    overlay = make_overlay(page_width, page_height, draw_fn)
    page.merge_page(overlay)

    writer = PdfWriter()
    writer.add_page(page)
    out_path = OUT_DIR / out_name
    with out_path.open("wb") as f:
        writer.write(f)
    return out_path


def single_student(draw_english):
    def draw(c, w, h):
        cover(c, 90, 260, 430, 88, h)
        cover(c, 205, 348, 260, 138, h)
        draw_centered(c, "雙語部 十二年B班 劉佳栩 同學", w / 2, top_y(h, 288), 22)
        if draw_english:
            draw_centered(c, "JOSHUA FRANK LIU", w / 2, top_y(h, 328), 20)
        draw_left(c, "高三男子組100公尺 決賽", 212, top_y(h, 368), 22)
        draw_left(c, "第一名 1st Place", 212, top_y(h, 408), 22)
        draw_left(c, '11"93', 212, top_y(h, 448), 22)

    return draw


def middle_school_single():
    def draw(c, w, h):
        cover(c, 90, 260, 430, 88, h)
        cover(c, 205, 348, 260, 138, h)
        draw_centered(c, "高中部 三年三班 溫唯甯 同學", w / 2, top_y(h, 288), 22)
        draw_left(c, "高三男子組100公尺 決賽", 212, top_y(h, 368), 22)
        draw_left(c, "第四名 4th Place", 212, top_y(h, 408), 22)
        draw_left(c, '12"64', 212, top_y(h, 448), 22)

    return draw


def bilingual_relay(grade_class, names, english_names, name_columns=(310, 440)):
    def draw(c, w, h):
        cover(c, 45, 225, 515, 345, h)
        draw_left(c, grade_class, 85, top_y(h, 326), 18)
        draw_left(c, "同學", 470, top_y(h, 293), 22)

        x1, x2 = name_columns
        name_y1, en_y1 = top_y(h, 285), top_y(h, 323)
        name_y2, en_y2 = top_y(h, 378), top_y(h, 415)
        for x, name, en, ny, ey in [
            (x1, names[0], english_names[0], name_y1, en_y1),
            (x2, names[1], english_names[1], name_y1, en_y1),
            (x1, names[2], english_names[2], name_y2, en_y2),
            (x2, names[3], english_names[3], name_y2, en_y2),
        ]:
            draw_centered(c, name, x, ny, 21)
            draw_centered(c, en, x, ey, 12)

        draw_left(c, "參  加", 135, top_y(h, 466), 22)
        draw_left(c, "榮  獲", 135, top_y(h, 506), 22)
        draw_left(c, "成  績", 135, top_y(h, 546), 22)
        draw_left(c, "高三男子組 1200 公尺接力", 212, top_y(h, 466), 22)
        draw_left(c, "第一名 1st Place", 212, top_y(h, 506), 22)
        draw_left(c, "2'56\"36", 212, top_y(h, 546), 22)

    return draw


def main():
    OUT_DIR.mkdir(exist_ok=True)
    pdfmetrics.registerFont(TTFont(FONT_NAME, str(FONT_PATH)))

    outputs = [
        write_certificate(
            PDF_DIR / "114運動會獎狀.pdf",
            "sample_template1_middle_school_single.pdf",
            middle_school_single(),
        ),
        write_certificate(
            PDF_DIR / "114運動會獎狀.pdf",
            "sample_template2_bilingual_single.pdf",
            single_student(draw_english=True),
        ),
        write_certificate(
            PDF_DIR / "114運動會獎狀_接力雙語_20251111.pdf",
            "sample_template3_bilingual_relay.pdf",
            bilingual_relay(
                "雙語部 十年 B 班",
                ["李浩宇", "李亮熹", "魏博紳", "朴省泫"],
                ["LEE, HAO-YU", "LEE, LIANG-HSI", "WEI, PO-SHEN", "SUNG HYOUN PARK"],
                name_columns=(285, 405),
            ),
        ),
        write_certificate(
            PDF_DIR / "114運動會獎狀_接力雙語11以上_20251111.pdf",
            "sample_template4_bilingual_relay_grade11plus.pdf",
            bilingual_relay(
                "雙語部 十二年 B 班",
                ["劉佳栩", "徐行甫", "李聖敃", "李宗翰"],
                ["JOSHUA FRANK LIU", "HSU, HSING-FU", "SUNGMIN LEE", "TSONG-HAN LEESON WU"],
            ),
        ),
    ]

    print("\n".join(str(path) for path in outputs))


if __name__ == "__main__":
    main()
