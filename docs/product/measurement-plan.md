# 잇다 측정 플랜 — 한 장 지도 (리텐션 + 콘텐츠 소비)

> 목적: 베타 테스트에서 **무엇을 어떻게 보고 있는지**를 한곳에 모은 지도.
> 측정 설계의 배경·근거는 각 원본 문서를 참조. 이 문서는 "지금 어디까지 됐나"를 추적한다.
> 작성: 2026-06-13

## 0. 두 가지 학습 질문 (모든 계측의 뿌리)

- **LQ1 — 무엇이 사람을 *다시* 돌아오게 하는가** (재방문·2회차). 원본: `docs/interview-guide.md` §리텐션 행동 추적.
- **LQ2 — 함께 쓰기(초대)가 *실제로* 일어나는가** (가설③ 해자 검증). 원본: 같은 문서.

가입수는 vanity. **activation = 가입 후 첫 lifecycle 행동 1건**(원본: `docs/product/ceremony-funnel.md` §6).

## 1. 지금 보는 법 (매일)

- `/retention-report` — 가입자 전원(=초대한 사람) 누적, 사람마다 **가입 후 N일째·재방문(D1+)·2회차·초대**. 운영자(단청) 자동 제외.
- 정의: 명령 파일 `.claude/commands/retention-report.md`.

## 2. 계측 인벤토리 — 플랜 vs 구현

| # | 무엇을 보나 | 어디에 기록 | 원본 플랜 | 상태 |
|---|---|---|---|---|
| 1 | 페이지뷰(어느 페이지·재방문) | `app_events` (`pageview`) | interview-guide §리텐션 | ✅ 구현 (auth.js 자동) |
| 2 | 2회차 작성·기능별 | 각 기능 테이블 `created_at` | interview-guide §LQ1 | ✅ 구현 |
| 3 | 초대 발송·수락·혼자vs함께 | `care_members`·`friend_invites`·`care_subjects` | interview-guide §LQ2 | ✅ 구현 |
| 4 | 보관함 정보→마음 전환 | `app_events` (`vault_fill`) | ai-vault §(a) | ✅ 구현 (쿼리: 해당 문서 §(a)) |
| 5 | CTA 클릭(콘텐츠→도구 브리지) | `cta_clicks` | content-bridge §6 | ✅ 구현 (js/cta-bridge.js) |
| 6 | **콘텐츠 정독 깊이**(스크롤·체류·완독) | `app_events` (`content_read`) | 본 문서 §3 | ✅ 구현 (content-detail.html, 2026-06-13) |
| 7 | **ceremony 퍼널 6단계** | `funnel_events` | ceremony-funnel §6~8 | ✅ 테이블·계측·admin 대시보드 (2026-06-13) |

## 3. 콘텐츠 정독 계측 (`content_read`)

콘텐츠를 "열었다"(pageview)와 "읽었다"를 구분한다. 콘텐츠 상세에서 페이지를 떠날 때 1건 기록.

- 이벤트: `app_events` `event_type='content_read'`
- `path`: `content-detail.html`
- `meta`: `{ contentId, category, maxScrollPct, dwellSec, reachedEnd }`
  - `maxScrollPct` — 본문 기준 도달한 최대 스크롤 비율(0~100). 짧은 글(스크롤 없음)은 100.
  - `dwellSec` — 페이지에 머문 초(표시 상태 기준, 비활성 탭 시간 제외).
  - `reachedEnd` — 본문 90% 이상 도달 여부(완독 근사).
- 내용 본문은 전송하지 않는다(프라이버시).

### 정독 집계 쿼리 (운영자)
```sql
select
  (meta->>'category')                                    as 카테고리,
  meta->>'contentId'                                     as 콘텐츠,
  count(*)                                               as 열람,
  count(*) filter (where (meta->>'reachedEnd')::bool)    as 완독,
  round(avg((meta->>'maxScrollPct')::numeric))           as 평균스크롤,
  round(avg((meta->>'dwellSec')::numeric))               as 평균체류초
from app_events
where event_type = 'content_read'
group by 1, 2
order by 열람 desc;
```

## 4. ceremony 퍼널 (`funnel_events`)

`ceremony.html` 위저드의 단계별 진행·이탈을 본다. 익명 가능(로그인 전 진입), `session_id`로 묶는다.

- 테이블: `funnel_events(id, session_id, event, props jsonb, created_at)` — anon insert-only, select 차단(RLS). 마이그레이션 `supabase/migrations/20260613_funnel_events.sql`.
- 구현된 이벤트 6종: `cer_view` · `cer_start` · `cer_step` · `cer_complete` · `cer_signup_click` · `cer_reco_click`.
- `props`: 단계 번호·variant 등(PII 금지, session_id만).
- **대시보드: `admin.html` → 측정 탭** — 운영자(sue.choi033@gmail.com)만. 단계별 도달 세션·전환율(직전 대비 포함) + content_read 정독 표.
- 집계는 RLS 우회용 SECURITY DEFINER RPC(`admin_funnel_summary`·`admin_content_read_summary`, 마이그레이션 `20260613_admin_metrics_rpc.sql`)로만 노출 — 운영자 이메일 확인.
- ⏳ **백로그 `cer_signup_done`**: signup 완료를 퍼널 session_id와 잇는 처리(가입 `next`에 session_id 전달) 필요해 보류.
- ⚠️ lead 서버 전송(`ceremony_leads`)·plan 저장(`ceremony_plans`)은 **별개**이고 유료 매칭 검증 후 — 본 작업 범위 아님(ceremony-funnel §9 D5).

## 5. 다음에 볼 것 (미구현 백로그)
- 콘텐츠 정독 → 가입 전환(정독한 사람이 가입·재방문 더 하나) 코호트 교차.
- A/B(ceremony 게이트 위치·문항수·결과구성) — 트래픽 유입 선행 필요(ceremony-funnel §6).
