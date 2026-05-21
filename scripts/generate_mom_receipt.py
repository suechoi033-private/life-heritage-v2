"""
엄마의 영수증 - 아들 방에 걸어둘 한국어 영수증 이미지 생성기
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

OUT_PATH = Path(__file__).resolve().parent.parent / "mom-receipt.png"

FONT_REG = "/usr/share/fonts/truetype/nanum/NanumGothic.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf"
FONT_MONO = "/usr/share/fonts/truetype/nanum/NanumGothicCoding.ttf"
FONT_MONO_BOLD = "/usr/share/fonts/truetype/nanum/NanumGothicCodingBold.ttf"
FONT_SQUARE_B = "/usr/share/fonts/truetype/nanum/NanumSquareB.ttf"

# 영수증 항목: (수량, 내용)
ITEMS = [
    ("9개월",   "너를 품에 안고 지냈어요"),
    ("1번",     "너를 세상에 데려왔어요"),
    ("1,248번", "눈물을 닦아줬어요"),
    ("5,785번", "엉덩이를 닦아줬어요"),
    ("516번",   "새벽 3시에 젖을 물렸어요"),
    ("432번",   "호 — 하고 불어줬어요"),
    ("907번",   "혼자 서도록 손을 잡아줬어요"),
    ("312번",   "넘어지는 걸 마음 졸이며 봤어요"),
    ("312번",   "다시 일으켜 세웠어요"),
    ("15번",    "침대 밑을 확인해줬어요"),
    ("20번",    "이빨요정이 되어줬어요"),
    ("46번",    "네 대신 침착함을 지켰어요"),
    ("149번",   "아플 때 죽을 끓여줬어요"),
    ("32번",    "쓰지만 필요한 말을 해줬어요"),
    ("1,278번", "겉옷 챙기라고 말해줬어요"),
    ("467번",   "묵묵히 응원해줬어요"),
    ("15번",    "아빠한테는 말 안 했어요"),
    ("58번",    "잠들지 않고 너를 기다렸어요"),
    ("8,765번", "그냥 들어줬어요"),
    ("1,023번", "용서해줬어요"),
    ("178번",   "모르는 척 넘어가줬어요"),
    ("24번",    "한밤중에 데리러 갔어요"),
    ("3,456번", "괜찮냐고 물어봤어요"),
    ("1,742번", "안 괜찮은 걸 알아챘어요"),
    ("4,813번", "잘 다녀오라고 안아줬어요"),
    ("2,796번", "너무 꽉 안아버렸어요"),
    ("7,398번", "언제나 너를 먼저 생각했어요"),
    ("∞",      "끝없이 사랑했어요"),
]

# 색상
WHITE = (252, 250, 246)   # 약간 따뜻한 종이색
BLACK = (28, 28, 28)
GREY = (110, 110, 110)
LINE = (180, 180, 180)
RED = (210, 50, 55)

# 캔버스 크기
W = 900
PAD_X = 70
TOP_PAD = 60
BOTTOM_PAD = 80

# 행 높이
ROW_H = 44
HEADER_H = 220
FOOTER_H = 340

H = TOP_PAD + HEADER_H + len(ITEMS) * ROW_H + FOOTER_H + BOTTOM_PAD

img = Image.new("RGB", (W, H), WHITE)
draw = ImageDraw.Draw(img)

# 폰트
f_title = ImageFont.truetype(FONT_SQUARE_B, 48)
f_subtitle = ImageFont.truetype(FONT_REG, 18)
f_banner = ImageFont.truetype(FONT_SQUARE_B, 22)
f_col = ImageFont.truetype(FONT_MONO_BOLD, 18)
f_row_qty = ImageFont.truetype(FONT_MONO_BOLD, 20)
f_row_desc = ImageFont.truetype(FONT_REG, 20)
f_row_amount = ImageFont.truetype(FONT_MONO, 20)
f_total_lbl = ImageFont.truetype(FONT_MONO_BOLD, 26)
f_total_val = ImageFont.truetype(FONT_MONO_BOLD, 26)
f_message = ImageFont.truetype(FONT_BOLD, 22)
f_small = ImageFont.truetype(FONT_REG, 16)
f_heart = ImageFont.truetype(FONT_REG, 28)

y = TOP_PAD

# ── 로고 (붉은 점) ──
dot_r = 18
cx = W // 2
draw.ellipse((cx - dot_r, y - 2, cx + dot_r, y - 2 + dot_r * 2), fill=RED)
y += dot_r * 2 + 14

# 브랜드명
draw.text((cx, y), "701호카페", font=f_title, fill=BLACK, anchor="mm")
y += 50

# 부제
draw.text((cx, y), "RECEIPT  |  701HO CAFE", font=f_subtitle, fill=GREY, anchor="mm")
y += 36

# 검은 배너
banner_h = 42
draw.rectangle((PAD_X, y, W - PAD_X, y + banner_h), fill=BLACK)
draw.text((cx, y + banner_h // 2), "담당  :  엄  마", font=f_banner, fill=WHITE, anchor="mm")
y += banner_h + 22

# 컬럼 헤더
col_qty_x = PAD_X + 10
col_desc_x = PAD_X + 170
col_amount_x = W - PAD_X - 10
draw.text((col_qty_x, y), "수량", font=f_col, fill=BLACK, anchor="lm")
draw.text((col_desc_x, y), "내역", font=f_col, fill=BLACK, anchor="lm")
draw.text((col_amount_x, y), "금액", font=f_col, fill=BLACK, anchor="rm")
y += 18
draw.line((PAD_X, y, W - PAD_X, y), fill=LINE, width=1)
y += 10

# 항목들
for qty, desc in ITEMS:
    draw.text((col_qty_x, y + ROW_H // 2), qty, font=f_row_qty, fill=BLACK, anchor="lm")
    draw.text((col_desc_x, y + ROW_H // 2), desc, font=f_row_desc, fill=BLACK, anchor="lm")
    draw.text((col_amount_x, y + ROW_H // 2), "₩0", font=f_row_amount, fill=BLACK, anchor="rm")
    y += ROW_H

# 합계 구분선
y += 6
draw.line((PAD_X, y, W - PAD_X, y), fill=BLACK, width=2)
y += 18

# TOTAL
draw.text((col_qty_x, y), "합계  TOTAL", font=f_total_lbl, fill=BLACK, anchor="lm")
draw.text((col_amount_x, y), "₩0", font=f_total_val, fill=BLACK, anchor="rm")
y += 32
draw.line((PAD_X, y, W - PAD_X, y), fill=BLACK, width=2)
y += 36

# 메시지
msg1 = "이 영수증은 평생 갚을 수 없습니다."
msg2 = "오늘, 엄마에게 \"고마워\"라고 말해주세요."
draw.text((cx, y), msg1, font=f_message, fill=BLACK, anchor="mm")
y += 36
draw.text((cx, y), msg2, font=f_message, fill=BLACK, anchor="mm")
y += 50

# 하트
draw.text((cx, y), "♥", font=f_heart, fill=RED, anchor="mm")
y += 36

# 작은 안내문
draw.text((cx, y), "사랑하는 아들에게 ㅡ 엄마가", font=f_small, fill=GREY, anchor="mm")

# 영수증 끝의 톱니 모양 (위쪽)
def zigzag(yy, top=True):
    step = 18
    points = []
    x = 0
    toggle = 0
    while x <= W:
        if top:
            points.append((x, yy + (step // 2 if toggle else 0)))
        else:
            points.append((x, yy - (step // 2 if toggle else 0)))
        x += step
        toggle = 1 - toggle
    # 닫기
    if top:
        points = [(0, 0)] + points + [(W, 0)]
    else:
        points = [(0, H)] + points + [(W, H)]
    draw.polygon(points, fill=WHITE)

# 너무 장식이 강하면 어색하므로 톱니는 생략하고 깔끔하게 마무리

img.save(OUT_PATH, "PNG", optimize=True)
print(f"saved: {OUT_PATH}  ({W}x{H})")
