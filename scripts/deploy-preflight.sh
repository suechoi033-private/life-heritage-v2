#!/usr/bin/env bash
#
# 잇다 배포 Preflight — 배포 전 자동 점검 (CLAUDE.md 배포 규칙을 코드로 강제)
#
# 막으려는 실수:
#   1) 앱 화면/동작(.html/.css/.js)을 바꿨는데 sw.js의 CACHE_VERSION을 안 올림
#      → 사용자가 캐시된 옛 화면을 계속 봄 (가장 잦고 아픈 사고)
#   2) origin/main이 앞서 있는데 force push 하려 함 (CLAUDE.md: force push 금지)
#   3) 새 화면 파일을 추가했는데 sw.js APP_SHELL 목록에 안 넣음 (오프라인 폴백 누락)
#
# 사용:
#   bash scripts/deploy-preflight.sh            # origin/main 기준으로 점검
#   bash scripts/deploy-preflight.sh <base_ref> # 임의 기준(ex: gh-pages)으로 점검
#
# 종료 코드: 0 = 통과(배포해도 됨), 1 = 차단(고친 뒤 다시), 2 = 환경 문제
#
set -euo pipefail

BASE="${1:-origin/main}"
SW="sw.js"
FAIL=0
WARN=0

# ── 출력 헬퍼 ────────────────────────────────────────────
if [ -t 1 ]; then RED=$'\033[31m'; GRN=$'\033[32m'; YLW=$'\033[33m'; DIM=$'\033[2m'; RST=$'\033[0m'
else RED=''; GRN=''; YLW=''; DIM=''; RST=''; fi
ok()   { printf "  %s✓%s %s\n" "$GRN" "$RST" "$1"; }
bad()  { printf "  %s✗ %s%s\n" "$RED" "$1" "$RST"; FAIL=1; }
warn() { printf "  %s! %s%s\n" "$YLW" "$1" "$RST"; WARN=1; }
note() { printf "  %s%s%s\n" "$DIM" "$1" "$RST"; }

cd "$(git rev-parse --show-toplevel)" 2>/dev/null || { echo "git 저장소가 아닙니다."; exit 2; }

echo "잇다 배포 Preflight  (기준: $BASE)"
echo "──────────────────────────────────────────"

# ── 기준 ref 확인 ────────────────────────────────────────
if ! git rev-parse --verify --quiet "$BASE" >/dev/null; then
  warn "기준 ref '$BASE'를 찾을 수 없습니다. 먼저 'git fetch origin main' 후 다시 실행하세요."
  note "기준 비교를 건너뛰고 working tree 변경만 점검합니다."
  BASE=""
fi

# 변경 파일 목록 = (기준 대비 커밋된 변경) + (아직 커밋 안 한 변경)
changed=$(
  {
    [ -n "$BASE" ] && git diff --name-only "$BASE...HEAD" || true
    git diff --name-only HEAD            # unstaged
    git diff --name-only --cached        # staged
  } | sort -u
)

if [ -z "$changed" ]; then
  ok "기준 대비 변경 파일 없음 — 배포할 내용이 없습니다."
  echo "──────────────────────────────────────────"
  printf "%s통과%s\n" "$GRN" "$RST"
  exit 0
fi

# ── 1) 앱 파일 변경 ↔ CACHE_VERSION 갱신 정합 ─────────────
#  앱 파일 = 루트의 .html/.css/.js. 단, sw.js 자신 / docs/ / scripts/ / .claude/ 제외.
app_changed=$(printf '%s\n' "$changed" \
  | grep -E '\.(html|css|js)$' \
  | grep -vE '^(docs/|scripts/|\.claude/)' \
  | grep -vx "$SW" || true)

# sw.js 안의 CACHE_VERSION '라인'이 실제로 바뀌었는지 (sw.js 다른 줄만 고친 건 갱신 아님)
sw_diff=""
if [ -n "$BASE" ]; then sw_diff=$(git diff "$BASE...HEAD" -- "$SW" || true); fi
sw_diff="$sw_diff
$(git diff HEAD -- "$SW" || true)
$(git diff --cached -- "$SW" || true)"
version_bumped=$(printf '%s\n' "$sw_diff" | grep -E '^[+-]const CACHE_VERSION' || true)

if [ -n "$app_changed" ]; then
  if [ -n "$version_bumped" ]; then
    ok "앱 파일 변경 있음 → CACHE_VERSION 갱신됨"
    # 날짜 부분이 오늘인지 가벼운 확인
    cur_ver=$(grep -E "^const CACHE_VERSION" "$SW" | sed -E "s/.*'([^']*)'.*/\1/")
    today=$(date +%Y-%m-%d)
    if ! printf '%s' "$cur_ver" | grep -q "$today"; then
      note "현재 버전 '$cur_ver' — 날짜가 오늘($today)이 아닙니다. 관례상 날짜를 맞추면 추적이 쉽습니다."
    fi
  else
    bad "앱 파일을 바꿨는데 sw.js의 CACHE_VERSION을 안 올렸습니다 → 사용자가 옛 화면을 봅니다."
    note "바뀐 앱 파일:"
    printf '%s\n' "$app_changed" | sed "s/^/      - /"
    note "조치: sw.js 4번째 줄 CACHE_VERSION 값을 새 날짜/설명으로 올리세요. 예) itda-v3-$(date +%Y-%m-%d)-<무엇>"
  fi
else
  ok "앱 파일(.html/.css/.js) 변경 없음 — CACHE_VERSION 갱신 불필요 (docs/scripts만 변경)"
fi

# ── 2) 새 루트 화면이 sw.js APP_SHELL에 등록됐는지 ────────
new_html=$(
  {
    [ -n "$BASE" ] && git diff --name-only --diff-filter=A "$BASE...HEAD" || true
    git diff --name-only --diff-filter=A --cached || true
    git ls-files --others --exclude-standard || true
  } | sort -u | grep -E '^[^/]+\.html$' || true
)
if [ -n "$new_html" ]; then
  missing=""
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    if ! grep -q "'\./$f'" "$SW"; then missing="$missing $f"; fi
  done <<< "$new_html"
  if [ -n "$missing" ]; then
    warn "새 화면이 sw.js APP_SHELL에 없습니다 (오프라인 폴백 누락 가능):$missing"
    note "필요하면 sw.js APP_SHELL 배열에 추가하세요."
  else
    ok "새 화면이 APP_SHELL에 등록돼 있습니다"
  fi
fi

# ── 3) main이 앞서 있는지 (force push 위험) ───────────────
if git rev-parse --verify --quiet origin/main >/dev/null; then
  behind=$(git rev-list --count "HEAD..origin/main" 2>/dev/null || echo 0)
  if [ "$behind" -gt 0 ]; then
    bad "origin/main이 ${behind}개 커밋 앞서 있습니다 → force push 금지. 'git fetch origin main' 후 rebase로 합치세요."
  else
    ok "origin/main이 앞서 있지 않음 — fast-forward 가능"
  fi
else
  note "origin/main 로컬 ref 없음 — main 동기화 점검 생략 ('git fetch origin main' 권장)"
fi

# ── 결과 ─────────────────────────────────────────────────
echo "──────────────────────────────────────────"
if [ "$FAIL" -eq 1 ]; then
  printf "%s차단 — 위 ✗ 항목을 고친 뒤 다시 실행하세요.%s\n" "$RED" "$RST"
  exit 1
elif [ "$WARN" -eq 1 ]; then
  printf "%s통과(경고 있음) — ! 항목을 확인하고 배포하세요.%s\n" "$YLW" "$RST"
  exit 0
else
  printf "%s통과 — 배포 진행해도 됩니다.%s\n" "$GRN" "$RST"
  exit 0
fi
