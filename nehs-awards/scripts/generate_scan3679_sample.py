from pathlib import Path

from reportlab.lib.colors import black
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "sample-output"
FONT_PATH = ROOT / "award-site" / "assets" / "edukai-5.1_20251208.ttf"
BACKGROUND = ROOT / "award-site" / "assets" / "certificate-background.png"
FONT_NAME = "EduKai"


def draw_centered(c, text, y, font_size):
    c.setFillColor(black)
    c.setFont(FONT_NAME, font_size)
    c.drawCentredString(A4[0] / 2, y, text)


def draw_centered_at(c, text, x, y, font_size):
    c.setFillColor(black)
    c.setFont(FONT_NAME, font_size)
    c.drawCentredString(x, y, text)


def draw_label_value(c, label, value, y, font_size=22, label_x=90, value_x=170):
    c.setFillColor(black)
    c.setFont(FONT_NAME, font_size)
    c.drawString(label_x, y, label)
    c.drawString(value_x, y, value)


def begin_certificate(out_path):
    c = canvas.Canvas(str(out_path), pagesize=A4)
    c.drawImage(str(BACKGROUND), 0, 0, width=A4[0], height=A4[1], preserveAspectRatio=False)
    return c


def finish(c, out_path):
    c.save()
    return out_path


def draw_footer(c):
    draw_centered(c, "表現優異，特頒發獎狀，以資鼓勵。", 350, 23)
    draw_centered(c, "中華民國一一五年十一月十五日", 68, 23)


def draw_relay_footer(c, encouragement_y=236):
    draw_centered(c, "表現優異，特頒發獎狀，以資鼓勵。", encouragement_y, 23)
    draw_centered(c, "中華民國一一五年十一月十五日", 68, 23)


def make_middle_school_single():
    out_path = OUT_DIR / "scan3679_template1_middle_school_single.pdf"
    c = begin_certificate(out_path)

    draw_centered(c, "一一五學年度全校運動大會", 600, 28)
    draw_centered(c, "高中部 三年三班  溫唯甯  同學", 550, 22)
    draw_label_value(c, "參  加", "高三男子組100公尺 決賽", 505, label_x=135, value_x=215)
    draw_label_value(c, "榮  獲", "第四名  4th Place", 465, label_x=135, value_x=215)
    draw_label_value(c, "成  績", '12"64', 425, label_x=135, value_x=215)
    draw_footer(c)

    return finish(c, out_path)


def make_bilingual_single():
    out_path = OUT_DIR / "scan3679_template2_bilingual_single.pdf"
    c = begin_certificate(out_path)

    draw_centered(c, "一一五學年度全校運動大會", 600, 28)
    draw_centered(c, "雙語部 十二年B班  劉佳栩  同學", 550, 22)
    draw_centered_at(c, "JOSHUA FRANK LIU", 355, 520, 18)

    draw_label_value(c, "參  加", "高三男子組100公尺 決賽", 475, label_x=135, value_x=215)
    draw_label_value(c, "榮  獲", "第一名  1st Place", 435, label_x=135, value_x=215)
    draw_label_value(c, "成  績", '11"93', 395, label_x=135, value_x=215)
    draw_footer(c)

    return finish(c, out_path)


def make_bilingual_relay(out_name, grade_class, names, english_names, name_shift_x=0):
    out_path = OUT_DIR / out_name
    c = begin_certificate(out_path)

    draw_centered(c, "一一五學年度全校運動大會", 600, 28)
    c.setFillColor(black)
    c.setFont(FONT_NAME, 20)
    c.drawString(65, 520, grade_class)
    c.drawString(470, 520, "同學")

    positions = [
        (285 + name_shift_x, 552, 285 + name_shift_x, 520),
        (405 + name_shift_x, 552, 405 + name_shift_x, 520),
        (285 + name_shift_x, 490, 285 + name_shift_x, 462),
        (405 + name_shift_x, 490, 405 + name_shift_x, 462),
    ]
    for name, ename, (name_x, name_y, ename_x, ename_y) in zip(names, english_names, positions):
        draw_centered_at(c, name, name_x, name_y, 21)
        draw_centered_at(c, ename, ename_x, ename_y, 12)

    draw_label_value(c, "參  加", "高三男子組 1200 公尺接力", 415, label_x=135, value_x=215)
    draw_label_value(c, "榮  獲", "第一名  1st Place", 375, label_x=135, value_x=215)
    draw_label_value(c, "成  績", "2'56\"36", 335, label_x=135, value_x=215)
    draw_relay_footer(c)

    return finish(c, out_path)


def make_middle_school_relay():
    out_path = OUT_DIR / "scan3679_template5_middle_school_relay.pdf"
    c = begin_certificate(out_path)

    draw_centered(c, "一一五學年度全校運動大會", 600, 28)
    c.setFillColor(black)
    c.setFont(FONT_NAME, 20)
    c.drawString(90, 535, "高中部")
    c.drawString(165, 535, "三年二班")
    c.drawString(425, 535, "同學")

    for name, x, y in [
        ("羅致勛", 300, 552),
        ("彭映元", 370, 552),
        ("陳品羲", 300, 512),
        ("林至迦", 370, 512),
    ]:
        draw_centered_at(c, name, x, y, 21)

    draw_label_value(c, "參  加", "高三男子組 1200 公尺接力", 460)
    draw_label_value(c, "榮  獲", "第四名  4th Place", 420)
    draw_label_value(c, "成  績", "3'01\"24", 380)
    draw_relay_footer(c)

    return finish(c, out_path)


def main():
    OUT_DIR.mkdir(exist_ok=True)
    pdfmetrics.registerFont(TTFont(FONT_NAME, str(FONT_PATH)))

    outputs = [
        make_middle_school_single(),
        make_bilingual_single(),
        make_bilingual_relay(
            "scan3679_template3_bilingual_relay.pdf",
            "雙語部 十年 B 班",
            ["李浩宇", "李亮熹", "魏博紳", "朴省泫"],
            ["LEE, HAO-YU", "LEE, LIANG-HSI", "WEI, PO-SHEN", "SUNG HYOUN PARK"],
        ),
        make_bilingual_relay(
            "scan3679_template4_bilingual_relay_grade11plus.pdf",
            "雙語部 十二年 B 班",
            ["劉佳栩", "徐行甫", "李聖敃", "李宗翰"],
            ["JOSHUA FRANK LIU", "HSU, HSING-FU", "SUNGMIN LEE", "TSONG-HAN LEESON WU"],
            name_shift_x=15,
        ),
        make_middle_school_relay(),
    ]

    legacy_path = OUT_DIR / "sample_scan3679_background_certificate.pdf"
    legacy_path.write_bytes(outputs[1].read_bytes())

    print("\n".join(str(path) for path in outputs))
    print(legacy_path)


if __name__ == "__main__":
    main()
