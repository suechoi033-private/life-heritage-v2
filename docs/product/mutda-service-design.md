# 묻다. — 서비스 설계 v1 (2026-07-05)

> 사전 죽음준비 콘텐츠·커뮤니티 앱. 잇다에서 케어링을 제외하고,
> "유언장을 쓰세요"가 아니라 **묻고 답하면 만들어지는** 준비 경험으로 재설계.
> 코드: `/mutda/` · DB: 잇다와 같은 Supabase 프로젝트, `mutda_` 접두사 테이블로 격리.

## 1. 이름과 컨셉

**묻다.** — 두 가지 뜻의 중의.
1) **묻다(問)**: 서비스의 모든 핵심 기능이 질문으로 시작한다. 유언장도, 편지도, 온보딩도.
2) **묻다(埋)**: 마음과 물건의 자리를 정해 고이 묻어(남겨)둔다.

톤: 헌장 그대로 — 조용함, 존엄, 과시·경쟁 금지. 좋아요 수·순위·비교 없음.

## 2. 유저 저니 — Epic 이식 매핑

Epic(콘텐츠 기반 어린이 독서앱)의 검증된 리텐션 저니를 죽음준비 도메인으로 번역했다.
Epic의 핵심: 짧은 온보딩 퀴즈 → 관심사 기반 맞춤 서재 → 즉각적 첫 성공 경험 →
스트릭·배지 → 마스코트가 함께 크는 여정. (참고: unlearninglabs Epic teardown,
ideausher Epic 분석)

| 단계 | Epic | 묻다 | 구현 |
|---|---|---|---|
| 가입 | 부모 계정 + 자녀 프로필 | 이메일 가입 (3분 약속) | `signup.html` |
| 개인화 퀴즈 | 나이·읽기수준·관심 주제 | 연령대·방문 동기·가장 마음 쓰이는 것·반려동물 유무 | `onboarding.html` |
| 맞춤 추천 | 관심사 기반 서재 | **개인화된 준비 여정** — 고른 순서대로 매듭이 앞에 배치, '혼자의 안전' 동기면 안부확인이 맨 앞 | `journey.js` |
| 첫 성공 경험 | 첫 책 1권 읽기 | **첫 질문 답하기** — "지금 가장 고마운 사람은?" 한 문장 (감사편지 초안으로 자동 저장) | 온보딩 마지막 스텝 |
| 스트릭 | 읽기 스트릭 | **이어온 날들** — 남과 비교하지 않는 조용한 스트릭 칩 | `app.js touchStreak` |
| 배지/보상 | 41종 배지 | **매듭** — 여정 단계 완료 표시 (7개). 경쟁 없음, 내 진행만 | 홈 여정 지도 |
| 마스코트 성장 | 알→동물 성장 | 🌱 새싹 메타포 (기록이 쌓일수록 자람 — v2에서 시각화 예정) | streak-chip |
| 매일의 이유 | 새 책 추천 | 홈 "오늘의 한 걸음" = 여정의 다음 매듭 1개만 제시 | `home.html` |
| 커뮤니티 | 학급/친구 | **함께** — 조용한 이야기 나눔 (좋아요·순위 없음) | `community.html` |
| 콘텐츠 | 4만 권 서재 | **서재** — 짧은 아티클 (샘플 2편 탑재) | `library.html` |

## 3. 핵심 기능

### 3-1. 유언장 위저드 (`will.html`)
- 7개 질문(성명→생년월일→주소→재산과 수령인(반복입력)→유언집행자→장례 희망→남기는 말)에
  답하면 **자필증서 유언 초안**이 자동 생성된다. 답은 `mutda_will_answers`에 문항별 저장 —
  중단 후 이어쓰기 가능.
- 초안 다음 단계가 핵심: ① **자필 옮겨쓰기 체크리스트** (민법 §1066의 5요건:
  전문 자서·연월일·주소·성명·날인) ② 자필 완료 마킹 ③ **공증 연결** —
  공정증서 유언 안내 + 대한공증인협회 링크 + 준비물, 공증 완료 마킹.
- 상태 머신: `draft → handwritten → notarized` (`mutda_wills.status`).
- YMYL: 모든 화면에 "법률 자문 아님 · 전문가 감수 진행 중 베타" 고지. **정식 발행(마케팅
  노출) 전 변호사 감수 필수** — 헌장 규칙.

### 3-2. 감사의 말 · 작별인사 (`letters.html`)
- 두 종류(kind: gratitude/farewell). 빈 화면 공포를 없애는 **"첫 문장 받기"** —
  이어 쓰기만 하면 되는 시작 문장 제공.
- 철학: "보내지 않아도 됩니다. 쓰는 것만으로 시작입니다." 감사는 생전에 직접 전하도록 권유.

### 3-3. 유품 미리 정리 (`belongings.html`)
- 물건 하나 = {이름, 분류(귀중품/추억/일상/디지털), 자리(물려주기/기부/간직/비우기/고민 중),
  받을 사람, 이야기 메모}. "하루 하나" 리듬. 실제 정리 완료 체크 별도.

### 3-4. 반려동물 돌봄 플랜 (`pet.html`)
- 비상시 인계서: 식사·건강·주치의·비상 돌봄인(사전 동의 체크)·인계 메모. 인쇄 지원.

### 3-5. 안부확인 — 고독사 방지 (`checkin.html`)
- **하트비트**: 앱을 열면 `mutda_heartbeat()` RPC가 `last_active_at` 갱신(5분 스로틀) +
  미해결 알림 자동 resolve. 위치 공유 동의 시 접속 순간의 GPS도 기록.
- **스캔**: pg_cron `mutda-checkin-scan` (30분 주기) — `checkin_enabled` 사용자 중
  임계시간(기본 18h, 12/18/24/48 선택) 초과 + 보호 연락처 존재 + 24h 내 중복 없음 →
  `mutda_checkin_alerts` pending 생성.
- **발송**: pg_cron `mutda-checkin-notify` (30분 주기) → Edge Function
  `mutda-checkin-notify` 호출 → Resend로 보호 연락처 이메일 발송 → notified 마킹.
  `RESEND_API_KEY` 미설정 시 pending 유지(키 등록 즉시 자동 발송 재개). **← 창업자 액션 필요**
- 정직한 한계 고지: 웹앱은 폰 전체 사용시간·백그라운드 GPS를 측정할 수 없다.
  "묻다 접속" 기준임을 화면에 명시. (네이티브 앱 전환 시 Screen Time/Significant
  Location Change API로 업그레이드 경로 있음.)

## 4. 데이터 (모두 RLS, 소유자 전용 — 커뮤니티 읽기만 공개)

`mutda_profiles`(온보딩·여정·안부설정·스트릭) · `mutda_guardians` · `mutda_checkin_alerts`
· `mutda_will_answers` · `mutda_wills` · `mutda_letters` · `mutda_belongings`
· `mutda_pet_plans` · `mutda_posts` · `mutda_post_comments` · `mutda_events`(퍼널)

마이그레이션: `supabase/migrations/20260705_mutda_v1.sql` (적용 완료).
Edge Function: `supabase/functions/mutda-checkin-notify/` (배포 완료, verify_jwt=false).

## 5. 리텐션 루프 요약

매일: 홈 인사 + 이어온 날들 + "오늘의 한 걸음" 1개 →
매주: 여정 매듭 하나 완성 → 기록이 자산으로 쌓임(유언장 버전, 편지 수, 물건 수) →
안부확인이 켜진 사용자는 **앱을 여는 것 자체가 가족을 안심시키는 행위**가 됨
(가장 강한 일일 방문 이유). 커뮤니티 글·서재 아티클이 보조 방문 이유.

## 6. 배포·운영

- 정적 서빙: gh-pages 규칙 그대로 (`/life-heritage-v2/mutda/`). 잇다 sw.js APP_SHELL에
  미포함(network-first라 무관) — 묻다 전용 PWA/SW는 v2.
- 퍼널 이벤트: landing_view → signup_view/done → onboarding_start/done → home_view →
  will_view/draft/handwritten/notarized, letter_saved, belonging_added, pet_plan_saved,
  checkin_on, guardian_added, post_created (`mutda_events`).
- **창업자 승인/액션 대기**: ① Resend API 키 발급·등록(이메일 발송 활성화)
  ② 유언장·법률 콘텐츠 변호사 감수 ③ main→gh-pages 배포 승인.
