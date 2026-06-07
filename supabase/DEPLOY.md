# Supabase 배포 가이드

프런트(정적 사이트)는 GitHub Pages로 자동 배포되지만, **Supabase 마이그레이션·Edge
Function은 별도 배포**가 필요하다. 이 환경(Claude on the web)은 Supabase 호스트가
네트워크 allowlist에 막혀 직접 배포가 불가하므로, **GitHub Actions로 배포**한다.
(GitHub 러너는 네트워크가 열려 있다.)

## 1. 일회성 설정 — GitHub 저장소 Secrets 등록

저장소 → Settings → Secrets and variables → Actions → New repository secret:

| Secret | 값 | 발급 위치 |
|---|---|---|
| `SUPABASE_ACCESS_TOKEN` | 개인 액세스 토큰 | supabase.com/dashboard/account/tokens |
| `SUPABASE_PROJECT_REF` | `zugwccngzprjjnwtajyr` | 프로젝트 설정(이미 공개값) |
| `SUPABASE_DB_PASSWORD` | DB 비밀번호 | Project Settings → Database |
| `ANTHROPIC_API_KEY` | `sk-ant-...` (선택, analyze-rx OCR) | console.anthropic.com |
| `DATA_GO_KR_KEY` | 식약처 e약은요 인증키 (선택) | data.go.kr |

## 2. 배포 실행

GitHub → **Actions** 탭 → **Deploy Supabase** → **Run workflow** → 대상 선택:

- `all` — 마이그레이션 + 함수 + 함수 시크릿
- `migrations` — 마이그레이션만 (DDL, **one-way door** — 신중히)
- `functions` — Edge Function(analyze-rx, ocr-memo)만
- `function-secrets` — 함수 시크릿만

## 3. ⚠️ 마이그레이션 히스토리 주의

`supabase db push`는 **원격에 기록되지 않은 마이그레이션**만 적용한다.
과거 마이그레이션을 SQL Editor에서 수동 적용했다면 원격 히스토리가 비어 있어,
push가 **이미 적용된 것까지 다시 적용하려다 `create policy ... already exists`
등으로 실패**할 수 있다.

- 대부분의 신규 마이그레이션(`add column if not exists`, 가드된 `do $$`)은 멱등이라 안전.
- 충돌 시: 이미 적용된 버전을 히스토리에 기록 →
  `supabase migration repair --status applied <version>`
- 또는 신규 파일만 SQL Editor에 직접 붙여넣어 적용(아래 4번).

## 4. 수동 적용 대안 (CLI/CI 없이)

Supabase 대시보드 → SQL Editor에 아래 파일 내용을 **순서대로** 붙여넣어 실행:

1. `supabase/migrations/20260524_care_prescriptions.sql`
2. `supabase/migrations/20260524_care_guides.sql`
3. `supabase/migrations/20260525_story_format.sql`
4. `supabase/migrations/20260525_inline_comments_realtime.sql`

Edge Function은 CLI 필요(로컬에서):
```bash
supabase functions deploy analyze-rx --project-ref zugwccngzprjjnwtajyr
supabase functions deploy ocr-memo --project-ref zugwccngzprjjnwtajyr
supabase secrets set ANTHROPIC_API_KEY="..." DATA_GO_KR_KEY="..." --project-ref zugwccngzprjjnwtajyr
```

## 5. 배포 후 확인 (실기기)

- 케어링: 처방전 촬영→분석 카드, 케어 가이드 노출
- 케어링 기록 쓰기: "메모 사진으로 자동 입력"(ocr-memo) — 손글씨 메모 촬영 시 칸 자동 채움
- 홈: 이야기 hero, NEW/내 글 뱃지, 하트 토글, 인라인 댓글, 새 글 pill(실시간)
- 커뮤니티: 형식 선택 시트(일반 글/이야기), 이야기 뱃지
