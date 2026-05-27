#!/usr/bin/env python3
"""
docs/content/seed-*.md (단일 원본) -> supabase/seed-content.sql 생성기.

결정문 0001: docs/content/*.md = 콘텐츠 단일 원본. 이 스크립트는 그 원본을
contents 테이블 INSERT 스크립트로 변환한다. 본문 수정은 항상 .md를 먼저 고치고
이 스크립트를 다시 돌린다(드리프트 방지).

사용:  python3 supabase/build-seed-content.py
결과:  supabase/seed-content.sql  (SQL Editor에 통째로 붙여넣고 Run)
"""
import re
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
CONTENT_DIR = ROOT / "docs" / "content"
OUT = ROOT / "supabase" / "seed-content.sql"

# 본문에 등장하지 않을 dollar-quote 태그 (작은따옴표 이스케이프 불필요)
BODY_TAG = "lhbody"


def split_frontmatter(text):
    """첫 --- ~ --- 블록만 frontmatter로 분리. 본문 내 --- (수평선)은 건드리지 않음."""
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        raise ValueError("frontmatter 시작(---)이 없습니다")
    end = next(i for i in range(1, len(lines)) if lines[i].strip() == "---")
    return lines[1:end], "\n".join(lines[end + 1:])


def scalar(front_lines, key):
    """top-level 단일 라인 스칼라만 추출 (블록 스칼라/리스트 무시)."""
    pat = re.compile(rf"^{re.escape(key)}:\s*(.*)$")
    for ln in front_lines:
        m = pat.match(ln)
        if m:
            v = m.group(1).strip()
            if v[:1] in "\"'":  # 따옴표 값: 닫는 따옴표까지
                q = v[0]
                end = v.find(q, 1)
                return v[1:end] if end != -1 else v[1:]
            # 맨몸 스칼라: 인라인 주석(#) 제거 후 첫 토큰
            v = v.split("#", 1)[0].strip()
            return v.split()[0] if v else None
    return None


def strip_leading_h1(body):
    """제목과 중복되는 맨 앞 # H1 한 줄 제거 (상세페이지가 title을 따로 렌더)."""
    lines = body.splitlines()
    i = 0
    while i < len(lines) and lines[i].strip() == "":
        i += 1
    if i < len(lines) and lines[i].lstrip().startswith("# "):
        i += 1
        while i < len(lines) and lines[i].strip() == "":
            i += 1
        lines = lines[i:]
    return "\n".join(lines).strip()


def sql_str(s):
    return "'" + s.replace("'", "''") + "'"


def build_one(path):
    front, raw_body = split_frontmatter(path.read_text(encoding="utf-8"))
    title = scalar(front, "title")
    category = scalar(front, "category")
    fmt_raw = scalar(front, "format")
    review_required = (scalar(front, "review_required") or "false").lower() == "true"

    if not title or not category:
        raise ValueError(f"{path.name}: title/category 누락")

    body = strip_leading_h1(raw_body)
    fmt = "story" if fmt_raw == "essay" else "article"
    has_blanks = "【" in body
    # 즉시 공개 조건: 감수 불필요 + 미완성 빈칸 없음
    published = (not review_required) and (not has_blanks)

    assert BODY_TAG not in body, f"{path.name}: dollar-quote 태그 충돌"

    reasons = []
    if review_required:
        reasons.append("YMYL 감수 대기")
    if has_blanks:
        reasons.append("【창업자 빈칸】 미완")
    note = "공개" if published else "비공개(" + ", ".join(reasons) + ")"

    return {
        "file": path.name, "title": title, "category": category,
        "format": fmt, "published": published, "note": note, "body": body,
    }


def render(items):
    out = []
    out.append("-- =============================================================")
    out.append("-- 잇다 시드 콘텐츠 발행 스크립트  (자동 생성 — 직접 편집 금지)")
    out.append("-- 생성: python3 supabase/build-seed-content.py")
    out.append("-- 원본: docs/content/seed-*.md  (결정문 0001 — 단일 원본)")
    out.append("--")
    out.append("-- 적용: Supabase 대시보드 -> SQL Editor -> 통째로 붙여넣고 Run")
    out.append("-- 멱등: 같은 제목이 이미 있으면 건너뜀(NOT EXISTS). 여러 번 실행해도 안전.")
    out.append("--")
    out.append("-- 작성자: author_type='official' (피드 '✓ 잇다 에디터' / 상세 '공식' 배지)")
    out.append("--   결정문 0001은 '공식' 배지를 창업자 승인 후로 게이트함. 이 시드 업로드가")
    out.append("--   바로 그 승인 행위 — 공식 편집 콘텐츠이므로 official 로 표기한다.")
    out.append("--")
    out.append("-- 공개 상태 (is_published):")
    for it in items:
        flag = "TRUE " if it["published"] else "FALSE"
        out.append(f"--   [{flag}] {it['title']}  -> {it['note']}")
    out.append("-- 비공개 글은 감수 완료/빈칸 작성 후 맨 아래 '전체 공개' 블록으로 켠다.")
    out.append("-- =============================================================")
    out.append("")
    out.append("begin;")
    out.append("")

    for it in items:
        out.append(f"-- ── {it['file']}  ({it['note']}) ──")
        out.append("insert into public.contents")
        out.append("  (category, title, body, content_type, format, author_type, creator_id, is_published)")
        out.append("select")
        out.append(f"  {sql_str(it['category'])},")
        out.append(f"  {sql_str(it['title'])},")
        out.append(f"  ${BODY_TAG}${it['body']}${BODY_TAG}$,")
        out.append("  'text',")
        out.append(f"  {sql_str(it['format'])},")
        out.append("  'official',")
        out.append("  null,")
        out.append(f"  {'true' if it['published'] else 'false'}")
        out.append("where not exists (")
        out.append(f"  select 1 from public.contents where title = {sql_str(it['title'])}")
        out.append(");")
        out.append("")

    out.append("commit;")
    out.append("")
    out.append("-- ── (선택) 감수/빈칸 완료 후 전체 공개 — 필요할 때 주석 해제하고 Run ──")
    out.append("-- update public.contents set is_published = true")
    out.append("-- where author_type = 'official' and title in (")
    titles = ",\n".join(f"--   {sql_str(it['title'])}" for it in items if not it["published"])
    out.append(titles)
    out.append("-- );")
    out.append("")
    return "\n".join(out)


def main():
    files = sorted(CONTENT_DIR.glob("seed-*.md"))
    items = [build_one(p) for p in files]
    OUT.write_text(render(items), encoding="utf-8")
    print(f"생성 완료: {OUT.relative_to(ROOT)}  ({len(items)}편)")
    for it in items:
        print(f"  - [{'공개' if it['published'] else '비공개'}] {it['file']}: {it['note']}")


if __name__ == "__main__":
    main()
