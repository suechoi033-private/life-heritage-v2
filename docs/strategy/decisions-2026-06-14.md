# 사장님 결정 — 2026-06-14 프로덕트 축 재설계

> 트리거: `docs/strategy/product-axis-not-waking-tomorrow-2026-06-14.md`의 결정 카드 8개에 대한 창업자 응답.
> 핵심: **D1(important_people 테이블 신설) 보류** → 자기성찰 시리즈 활용으로 우회. 사장님 한 줄 보호: *"이건 건드리지 마."*

---

## 1. 컨펌된 결정 (8개, all two-way door)

| # | 결정 | 컨펌 안 | 즉시 영향 |
| :-- | :-- | :-- | :-- |
| **D1** | Axis A 데이터 모델 | ❌ 신설 X / ✅ **(a) 자기성찰 시리즈 활용** — `daily_questions` + `answers` | 새 테이블 0. 잇다 핵심 인프라(오늘 잇고/ask) 그대로 |
| **D2** | A·B 위계 | 동등 두 축 (R1) | A는 사람, B는 풍요로운 삶 |
| **D3** | B의 모델 | ✅ **`goals.area`에 `joy` 추가** — "사소한 기쁨" 영역 분리 | 마이그레이션 SQL 1회 |
| **D4** | 라이프 탭 3탭화 | ❌ **보류** — 라이프 탭 IA 그대로 | 홈 카드로 노출 해소 |
| **D5** | 홈 카드 카탈로그 | A·B 진입 카드 (회원만) | 답한 사용자엔 약속 진행 한 줄 |
| **D6** | 알람 옵트인 | ✅ **사용자가 빈도 정하고 동의 → 알람** | 시스템이 권하지 않음 (헌장 일관) |
| **D7** | 사별 페르소나 안전장치 | ✅ 사별자 → 연락 알람 X, 다른 분기 | 슬픔과 행동 넛지의 균형 |
| **D8** | W26 metric M4·M5 등재 | ✅ M4 시리즈 완주율 / M5 약속 이행률 | 활성 가설 측정 보강 |

### 사장님 확정 카피 (Axis A 진입 질문)

> **"내일 다시 못 깨어난다면, 가장 후회할 일은?"**

이게 시작점. 후속 카피는 잇다 톤(잔잔·간결) 유지하며 PE/카피라이터가 채움.

## 2. Axis A·B 사용자 동선 (확정)

### Axis A — "내일 다시 못 깨어난다면 → 떠오르는 사람"
1. 자기성찰 시리즈 진입: "내일 다시 못 깨어난다면, 가장 후회할 일은?" → 답 저장
2. 답에 사람 언급되면 분기: **떠오르는 사람 입력**
3. **그 사람에게 못 한 말** 입력 (또는 하고 싶은 말)
4. **사용자가 연락 빈도 정함** (주 1·2·3회 — 사용자 선택)
5. **"정한 빈도에 맞춰 알람을 드릴까요? 동의합니다."** 옵트인
6. 약속 이행 — in-app 잔잔한 한 줄 또는 푸시 (사용자 정한 빈도대로)

### Axis B — "나를 위한 풍요로운 삶 / 사소한 기쁨"
1. 같은 자기성찰 시리즈에서 분기: 사람이 아니라 일(풍요로운 삶)
2. **내가 원하는 것** 입력 → `goals` 테이블 (area=`joy` 신설)
3. **이번 주에 하나 골라두실래요?** (사용자 선택)
4. **알람 드릴까요?** 옵트인
5. 약속 이행 — 같은 패턴 (잔잔한 한 줄)

핵심 원칙: **시스템이 권하지 않음. 사용자가 약속하고 동의함.** 헌장 일관.

## 3. PE 위임 범위 (다음 라운드)

이 결정 문서를 단일 원천으로 PE에 일괄 위임:

1. **자기성찰 시리즈 추가** (`daily_questions` 신규 시리즈)
   - 시작 질문: 사장님 확정 카피
   - 후속 분기 카피: 잇다 톤 + 사장님 정한 흐름
   - 답 저장: 기존 `answers` 테이블
   
2. **마이그레이션** `20260614_goals_area_joy.sql`
   - `goals.area` enum에 `joy` 값 추가
   - 사장님 1회 실행
   
3. **홈 카드** (`index.html` 회원 분기)
   - 답 안 한 사용자: Axis A·B 진입 카드 1개 (사장님 카피)
   - 답한 사용자: 약속 진행 한 줄 (이번 주 ○○에게 한 번 어떠세요)
   
4. **알람 옵트인 + 발송**
   - `profiles` 또는 `user_settings`에 옵트인 + 빈도 저장
   - 사용자 정한 빈도대로 in-app 알람 (푸시는 다음 라운드)
   
5. **사별 페르소나 안전장치**
   - 답 분류 (사별 vs 살아있음) — Q에 옵션 또는 답 키워드
   - 사별이면 연락 알람 권유 안 함, 추모·편지 분기
   
6. **M4·M5 metric 등재** (`docs/strategy/`)
   - M4: 자기성찰 시리즈 완주율 (≥30% 목표 — 잠정)
   - M5: 알람 옵트인 후 약속 이행률 (≥40% 잠정)

PE 결과 검토 후 main 머지 → 사장님이 시리즈 실제로 답해보며 톤 미세조정.

## 4. 보류·생략 결정

- **D1 important_people 테이블 신설**: 보류. 사장님 보호 명시.
- **D4 라이프 탭 3탭화**: 보류. 라이프 탭 IA 안 건드림.

## 5. 다음 라운드 트리거 (별도)

- 자기성찰 시리즈 카피 본격 다듬기 → 카피라이터 라운드 (사장님이 답해보신 뒤)
- M4·M5 측정 결과 — W26 게이트
- 푸시 알람 채널 — Supabase + FCM 또는 OneSignal (별도 라운드)

---

## 부록. W26 게이트 metric 보강 — M4·M5 (D8 컨펌)

`docs/strategy/acquisition-task-oriented-2026-06-13.md` 2장 M1·M2·M3와 같은 W26 합격선 라인업에 두 개 추가. 본 라운드(2026-06-14) 구현으로 측정 인프라(daily_questions.series_key + daily_answers + profiles.notification_pref) 갖춰짐.

### M4. 자기성찰 시리즈 완주율

- **정의**: 시리즈 시작(Q1 답변 1건 이상) 사용자 중, Q5(옵트인) 답변까지 완료한 사용자 비율. 사별 분기는 Q3a([사별] 마킹)까지를 완료로 봄.
- **잠정 합격선**: **≥ 30%** (W26 게이트, 가설 e 1차 신호).
- **계산 SQL 초안**:
  ```sql
  with started as (
    select distinct a.user_id from daily_answers a
    join daily_questions q on q.id = a.question_id
    where q.series_key = 'not_waking_tomorrow' and q.series_step = 1
  ),
  finished as (
    select distinct a.user_id from daily_answers a
    join daily_questions q on q.id = a.question_id
    where q.series_key = 'not_waking_tomorrow' and q.series_step = 5
  )
  select
    (select count(*) from finished)::numeric
    / nullif((select count(*) from started), 0) as completion_rate;
  ```
- **W26 액션**:
  - ≥ 30% → 가설 e 확장(케어링·자기준비 통합), 카피 최소 다듬기로 진행.
  - 15–30% → 시리즈 흐름 검토(Q3 분기·사별 노출 등), 카피라이터 라운드.
  - < 15% → 진입점 재설계 (홈 카드 카피·위치 검토).

### M5. 약속 이행률 (옵트인 후 "오늘 했어요" 1회 이상)

- **정의**: M4 완주자 중 `notification_pref.reflection_series.opt_in = true` 사용자가 약속 카드(홈 또는 reflection.html)에서 "오늘 했어요" 클릭 1회 이상.
- **잠정 합격선**: **≥ 40%** (W26 게이트, 행동 격차 검증).
- **측정 인프라 (본 라운드 미구현 — 다음 라운드)**:
  - `app_events` 테이블에 이벤트 `reflection_promise_kept` 등재.
  - 홈 카드/reflection.html "오늘 했어요" 버튼이 본 라운드 완성되면 PE 별도 라운드.
- **W26 액션**:
  - ≥ 40% → 푸시 알람 채널 결정(FCM·OneSignal 별도 라운드) 발화.
  - 20–40% → in-app 카피·노출 빈도 다듬기.
  - < 20% → 약속 자체 메커니즘 재검토(헌장 톤 유지하면서 동기 보강).

### 사별 분기 안전장치 측정 (참고 metric, 합격선 없음)

- `notification_pref.reflection_series.bereaved = true` 사용자에게 알람 카드가 **0건** 노출되는지 (스모크 테스트, 합격은 정성 확인).

---

## 부록 (추가). 답변→공유→초대 유입 루프 metric — M6·M7·M8 정식 등재

**출처**: `docs/strategy/answer-invite-loop-2026-06-14.md`(9장 결정 카드 C6) + 사장님 컨펌(2026-06-14).
**측정 인프라**: 1차는 localStorage 이벤트 카운트(`itda:reflection_invite_events`). 2차는 `app_events` 테이블 신설(다음 라운드). 코호트 SQL은 W26 직전 정교화.

### M6. 답변 후 공유율

- **정의**: 자기성찰 시리즈 Q5 완주 사용자 또는 `daily_answers` 저장 사용자 중, 답변 직후 노출된 nudge 카드의 "이 질문 함께 답해보기" 버튼을 1회 이상 클릭한 사용자 비율.
- **이벤트**: `reflection_invite_nudge_shown` 대비 `reflection_invite_sent`.
- **잠정 합격선**: **≥ 15%** (W26).
- **W26 액션**:
  - ≥ 15% → 시리즈 흐름이 공유 동기 작동. (a) 카드 공유(C7) 추가 검토.
  - 5–15% → 카피·노출 위치 다듬기(카피라이터 라운드).
  - < 5% → 시나리오 (b)·(d) 자체 재설계 또는 본 루프 보류.

### M7. 초대 링크 → 가입 전환율

- **정의**: 발급된 `friend_invites` 중 `channel = 'reflection_invite'`(또는 `metadata->>'kind' = 'reflection_invite'`) 링크 → 비로그인 invite-answer.html 진입 → 가입 완료 funnel 전환율.
- **이벤트**: `reflection_invite_opened` 대비 `reflection_invite_signed_up`.
- **잠정 합격선**: **≥ 5%** (W26).
- **W26 액션**:
  - ≥ 5% → 초대가 organic acquisition 채널로 작동 → 카피 다듬기 + 다음 시리즈로 확장.
  - 1–5% → 초대장 카피·첫 화면 다듬기.
  - < 1% → 친구 진입 동기 부족 — (d) 그 사람에게 보내기에 집중, (b) 보류.

### M8. 초대받아 가입한 사용자의 D30 retention

- **정의**: 초대 토큰으로 가입한 사용자 중 D30 안에 1회 이상 재방문한 비율 (Supabase auth/세션 로그 + `friend_invites.invitee_user_id` 코호트).
- **잠정 합격선**: **≥ 30%** (W26). M1(organic D30 ≥ 20%) 대비 +10%p.
- **W26 액션**:
  - ≥ 30% → **organic 초대가 인스타보다 강한 acquisition 채널**임을 입증 → paid 광고 진입(D7) 더 미룰 근거.
  - 15–30% → 초대 시점 카피·온보딩 다듬기.
  - < 15% → 초대 동기와 retention 사이 격차 — 가입 직후 nudge 보강.

### 사장님 결정 카드 컨펌 요약 (C1~C7, 2026-06-14)

| C# | 결정 | 컨펌 안 |
|---|---|---|
| C1 | 답변→공유 시나리오 본진 | (b) 질문 공유 + (d) 그 사람에게 직접 보내기 조합 |
| C2 | 초대받은 친구 첫 화면 | **옵션 C** (질문 노출 + 비로그인 답 1줄 → 가입 게이트) |
| C3 | 초대 인프라 | 기존 `friend_invites` 활용 (신규 테이블 0) — `channel='reflection_invite'`, `metadata jsonb` 보강 |
| C4 | 초대장 카피 | 초대자 이름 **default 노출 + "이름 가리고 보내기" 토글** |
| C5 | 가입 완료 후 초대자 알림 | **보류** (다음 라운드 in-app 한 줄 검토) |
| C6 | M6·M7·M8 등재 | **등재** (잠정 합격선 15% / 5% / 30%) |
| C7 | (a) 답 텍스트 카드 공유 | **보류** (M6 측정 후 별도 결정) |

### 안전 가드 (격리)

- 답 텍스트 공유 X — `friend_invites`에 답 본문 저장 0. URL에 질문 id만.
- 초대받은 친구에겐 초대자의 답 노출 X — privacy + 사별 페르소나 안전(2장 4.1·5.4).
- 권유 nudge는 같은 질문에 대해 1회만 노출(localStorage `itda:reflection_invite_nudge_shown`).
- 사별 페르소나(`bereaved=true`)에겐 reflection.html `renderDone()`에서 nudge 노출 X.
- 만료 30일은 `friend_invites` 기본값(2026-05 마이그레이션 유지) — 코드 변경 0.
