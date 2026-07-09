# Supabase 배포 가이드

**2026-07-08부터: 창업자는 PR에서 Merge 버튼만 누르면 된다.**
main에 머지되는 순간 GitHub Actions(`deploy-supabase.yml`)가:

- `supabase/functions/**` 에서 **바뀐 함수만** 자동 배포하고
- `supabase/migrations/**` 에 **새로 추가된 SQL 파일만** psql로 자동 적용한다.

프런트(정적 사이트)는 기존대로 `pages.yml`이 main 푸시마다 자동 배포한다.
즉, PR 하나 머지 = 프런트 + 함수 + DB 전부 반영.

## 1. 일회성 설정 — GitHub 저장소 Secrets

저장소 → Settings → Secrets and variables → Actions:

| Secret | 값 | 발급 위치 | 용도 |
|---|---|---|---|
| `SUPABASE_ACCESS_TOKEN` | 개인 액세스 토큰 | supabase.com/dashboard/account/tokens | 함수 배포 |
| `SUPABASE_PROJECT_REF` | `zugwccngzprjjnwtajyr` | (공개값) | 함수 배포 |
| `SUPABASE_DB_URL` | **Session pooler URI** | 대시보드 → Connect → Session pooler | **마이그레이션 자동 적용** |
| `ANTHROPIC_API_KEY` | `sk-ant-...` (선택) | console.anthropic.com | 함수 시크릿 수동 설정용 |
| `DATA_GO_KR_KEY` | 공공데이터 인증키 (선택) | data.go.kr | 〃 |

`SUPABASE_DB_URL`이 없으면: 새 마이그레이션이 포함된 머지에서 잡이 **일부러 실패**해
알려준다(조용히 건너뛰지 않음). 그 경우 SQL Editor로 해당 파일을 수동 적용한 뒤
잡을 re-run 하거나, 시크릿을 넣어두면 다음부터 전자동.

## 2. 자동 배포 동작 규칙

- **함수**: 머지 diff에 등장한 함수 디렉토리만 배포. 안전장치:
  - `delete-account` 는 실데이터 삭제 로직이라 **자동 배포 제외** (수동 전용)
  - 비회원(anon)이 직접 호출하는 함수는 `--no-verify-jwt`로 배포:
    현재 `ltc-search` · `mutda-checkin-notify` · `push-notify` · `kakao-signin`.
    **새 anon 함수를 만들면 workflow의 `NO_JWT` 목록에 추가할 것.**
- **마이그레이션**: 이번 머지에서 *추가된* 파일만 파일명 순으로 `psql -f` 실행.
  과거에 SQL Editor로 수동 적용한 히스토리와 충돌하지 않는다
  (`supabase db push`를 쓰지 않는 이유). 마이그레이션은 계속 **멱등하게** 작성할 것
  (`if not exists`, `drop policy if exists` 후 create 등 — 기존 컨벤션 유지).

## 3. 비상용 수동 실행 (Actions 탭)

Actions → Deploy Supabase → Run workflow:

- `functions` — **모든** 함수 재배포 (delete-account 제외)
- `migrations-new` — 직전 커밋에서 추가된 마이그레이션만 적용
- `function-secrets` — 함수 시크릿 재설정

## 4. 완전 수동 폴백 (CI 불능 시)

- SQL: Supabase 대시보드 → SQL Editor에 마이그레이션 파일 내용 붙여넣기
- 함수(로컬 CLI): `supabase functions deploy <이름> --project-ref zugwccngzprjjnwtajyr`
  (anon 함수는 `--no-verify-jwt` 추가)

## 5. 배포 후 확인 (실기기)

- 요양원 검색(info/nursing-home.html): 시도+시군구 선택 → 해당 지역만 나오는지
- 묻다 홈: "오늘, 묻다" 질문 카드 → 답 저장 → 질문 보내기 → 링크로 응답 왕복
- 케어링: 처방전 분석, 메모 OCR
- 홈/커뮤니티: 피드·인라인 댓글·실시간 pill
