#!/usr/bin/env python3
"""상속 브리지 콘텐츠(seed-13/14/15/16)를 contents 테이블 INSERT 마이그레이션으로 생성.

- 본문에서 frontmatter / 선두 H1 / 개발용 HTML 주석을 제거한 뒤 $b$ 달러 인용으로 안전 삽입.
- 멱등: 같은 title 있으면 skip (insert ... select ... where not exists).
- @itda-bridge-cta 펜스 블록(G3)은 그대로 유지 — content-detail.html 렌더러가 처리.
- author_type='official', is_published=true, content_type='text'.
- 적용: Supabase SQL Editor에서 1회 실행(데이터 안전 규칙 — 창업자 실행).
"""
import re
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
CONTENT = ROOT / "docs" / "content"
OUT = ROOT / "supabase" / "migrations" / "20260607_seed17_20_bridge_contents.sql"

# (파일, category) — contents.category 제약: finance/health/family/death_prep/memorial/reflection
FILES = [
    ("seed-17-inheritance-passbook-essay.md", "reflection"),
    ("seed-18-password-list-essay.md", "reflection"),
    ("seed-19-inheritance-glossary.md", "family"),
    ("seed-20-safe-inheritance-onestop.md", "family"),
]


def parse(md: str):
    """frontmatter title + 정제된 body 반환."""
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", md, re.DOTALL)
    if not m:
        raise ValueError("frontmatter 없음")
    fm, body = m.group(1), m.group(2)
    tm = re.search(r'^title:\s*"?(.+?)"?\s*$', fm, re.MULTILINE)
    if not tm:
        raise ValueError("title 없음")
    title = tm.group(1).strip()
    # 개발용 HTML 주석 제거
    body = re.sub(r"<!--.*?-->", "", body, flags=re.DOTALL)
    # 선두 H1 제거(제목은 DB title 컬럼이 별도 렌더)
    body = re.sub(r"^\s*#\s+.*?\n", "", body, count=1)
    # 과도한 빈 줄 정리
    body = re.sub(r"\n{3,}", "\n\n", body).strip()
    return title, body


def main():
    if "$b$" in "".join((CONTENT / f).read_text(encoding="utf-8") for f, _ in FILES):
        raise SystemExit("본문에 $b$ 토큰 존재 — 인용 충돌. 중단.")
    parts = [
        "-- =============================================================",
        "-- 상속 브리지 콘텐츠 발행 — seed-17/18/19/20 (4편)",
        "--   E1·E2 에세이(감수 불필요) / S 용어사전(감수 불필요) /",
        "--   G3 안심상속 가이드(YMYL — 창업자 결정 2026-06-07로 감수 전 발행).",
        "--   설계: author_type='official', is_published=true, 멱등(같은 title skip).",
        "--   적용: Supabase SQL Editor에서 1회 실행.",
        "-- =============================================================",
        "",
        "begin;",
        "",
    ]
    for fname, cat in FILES:
        title, body = parse((CONTENT / fname).read_text(encoding="utf-8"))
        parts.append(f"-- {fname}")
        parts.append(
            "insert into public.contents (category, title, body, content_type, author_type, is_published)\n"
            f"select '{cat}', $b${title}$b$, $b${body}$b$, 'text', 'official', true\n"
            f"where not exists (select 1 from public.contents where title = $b${title}$b$);"
        )
        parts.append("")
    parts.append("commit;")
    OUT.write_text("\n".join(parts) + "\n", encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}  ({len(FILES)} contents)")


if __name__ == "__main__":
    main()
