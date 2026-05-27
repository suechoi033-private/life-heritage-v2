# ceremony 온보딩 퍼널 — 통합 설계 (벤치마크 기반)

> 작성: 2026-05-26. 팀 4인(마케팅·PE·전략·운영) Convene + 8개 앱 벤치마크 종합.
> 대상 구현물: `/ceremony.html` (살아서 하는 장례식 설계 위저드).
> 상태: **제안(일부 one-way door는 창업자 승인 대기).** 결정 로그는 본 문서 9절.

---

## 0. 한 줄 결론

지금 MVP의 **골격(8문항 → 플랜 → 추천 → 가입 게이트)은 맞다.** 두 가지를 고치면 best-in-class가 된다:
1. **퀴즈가 "수집"만 하고 "되돌려주지" 않는다.** → 답을 거울처럼 비춰주는 *컨설팅 리포트*로 바꾼다 (Noom·Calm식 미러링).
2. **퀴즈를 끝낸 사람이 가입해도 lifecycle 어디에도 안 들어간다.** → 결과의 1순위 행동을 "매칭"이 아니라 **"내 단계의 다음 한 걸음(도구·콘텐츠)"**으로. 매칭은 후행 보너스.

그리고 **자기 전략과의 충돌 3개**(아래 9절)를 해소해야 한다 — 앱 내 명칭, 검증 순서, 매칭 단일 의존.

---

## 1. 벤치마크에서 훔칠 것 / 버릴 것

조사: Noom · Duolingo · BetterHelp · Fabulous · Cal AI · 트로스트/마인드카페 · Headspace · Calm.

**공통 전환 메커니즘 (훔친다):**
| 메커니즘 | 출처 | 잇다 적용 |
|---|---|---|
| 1문 1화면 + 진행 바 | Noom(113화면)·Calm | 8문항 1화면화, 큰 글씨·1열(시니어) |
| 점진적 약속(pre-commitment) | Fabulous "Sign to Commit" | 가입 직전 **부드러운 다짐 체크 1개** (강제·죄책감 금지) |
| 개인화 미러링(입력→결과 실시간 반영) | Noom 예측그래프·Calm | "듣고 싶은 말" 입력이 결과 식순의 클라이맥스로 등장 |
| 중간 작은 리빌 | Calm | 2~3문항마다 한 줄 ("작고 가까운 자리를 원하시는군요") |
| "정리 중" 차분한 로딩 | Noom·Cal AI | 결과 직전 3~4초 "당신의 이야기를 정리하고 있어요" |
| 결과 헤드라인에 사용자 입력 호명 | Noom 페이월 | "당신이 원하는 건 이별식이 아니라…" |
| 사회적 증거 + 감수 라벨 | Headspace·트로스트·마인드카페 | "먼저 이 자리를 가진 분 N명", YMYL시 감수자 표시 |
| 가입을 **가치 체험 뒤로** | Duolingo·BetterHelp | 결과 전부 무료 노출 → 저장/연결 순간에만 게이트 |

**반드시 버린다 (다크패턴 · "위로 말고 같이" 위반):**
- 가짜 카운트다운·"오늘만 할인"·잔여 좌석 압박 (Cal AI식 urgency) — 죽음 맥락에서 천박
- 공포 프레이밍("준비 안 하면 가족이 고통받는다") — 손실회피를 공포로 쓰는 것
- 결과를 인질로 잡는 하드 게이트(결과 안 보여주고 가입 강요) — 신뢰 훼손, 진실>아첨 위반
- 동적 가격(사람마다 다른 값)
- 113화면식 과도한 길이 — 시니어 피로. **8~12문항이 상한**

---

## 2. 통합 퍼널 — 화면별 플로우

원칙: **결과(리포트)는 가입 없이 전부 보여준다. 게이트는 "저장·연결·가족 초대" 행동에만.**

| # | 화면 | 목적 | 핵심 | 전환 장치 |
|---|---|---|---|---|
| 0 | 인트로 | 정서 후킹 | serif 헤드라인, "1분", "정답 없음" | 단일 CTA / 이어보기 |
| 1 | Q1 누구를 위한 자리 | 분기 시드 | single | 선택 즉시 auto-advance |
| 2 | Q2 계기 | 맥락 | single | auto-advance |
| 3 | **인터스티셜 A** | 몰입·미러링 | "좋아요, {who} 자리를 그려볼게요" | 부드러운 등장 |
| 4 | Q3 초대 | segmentation | multi | "다음" |
| 5 | Q4 규모 | 견적 변수 | single | auto-advance + 미니 리빌 |
| 6 | Q5 무엇을 나눌까 | 자리의 핵심 | multi | 선택 시 미리보기 변동 |
| 7 | Q6 장소 | 추천 키 | single | auto-advance |
| 8 | Q7 음식 | 추천 키 | single | auto-advance |
| 9 | Q8 듣고 싶은 말 | 정서 클라이맥스 | text(선택) | "이 한 줄이 자리를 완성합니다" |
| 10 | **정리 중** | 신뢰·기대 | 3~4초, 차분한 3단계 | "당신의 답을 잇는 중…" |
| 11 | **결과 리포트** | 가치 제공(게이트 없음) | §3 | 스크롤 끝 자연 CTA |
| 12 | 가입 게이트 | 저장·연결 시점 | 소셜 3종 우선 + 매직링크 | §4 |
| 13 | 라우팅/완료 | lifecycle 합류 or lead | §3-3 | — |

문항 수 **8 유지**(6~9 권장 충족). 추가 대신 인터스티셜·미니리빌로 리듬만 보강.

---

## 3. 결과 리포트 = "컨설팅" (이 화면이 전부)

데이터 요약이 아니라 **"사용자가 미처 말로 못 한 걸 정리해 보여주는 거울."** 전부 `plan` 객체로 클라이언트 룰 생성(LLM·서버 불필요).

**3-1. 의미 명명 (serif, 가장 큼)** — Calm state-naming
- `who`+`occasion`+`program` 룰 10~12패턴. 예: "당신이 원하는 건 이별식이 아니라, 살아있을 때 고맙다는 말을 직접 듣는 자리입니다."

**3-2. 추천 식순 초안 (타임라인)** — 컨설팅의 핵심, 미러링
- 선택한 `program`을 순서 룰로 배열(영접→video→story→letters→thanks→songs→food→마무리), 미선택은 생략. 각 항목 예상 소요 → **"예상 진행 약 90분"** 자동 합산.
- **"듣고 싶은 말"을 클라이맥스 위치에 그대로 박는다.**

**3-3. 다음 한 걸음 (CTA) — ⚠️ 전략 핵심**
- **1순위 = lifecycle 도구/콘텐츠** (매칭 아님). 퀴즈 답을 단계 시그널로 매핑:

| 퀴즈 답 | 시그널 | 1순위 다음 걸음 |
|---|---|---|
| `who=self`+`occasion=health` | ③ 자기준비자(트리거 발동) | 사전연명의향서 + 디지털정리 |
| `who=self`+`occasion=now/retire` | ④ 회고자 | 오늘의 질문 + 회고록 |
| `who=parent` | ① 케어링자 | **ceremony 아님 → 케어 온보딩으로 라우팅** |
| `wish` 자유서술 | 가장 강한 감정 | "이 말을 편지로 남기시겠어요?" → 가족에게 남기는 말 |

- **2순위(후행) = 장소·음식 추천** — "예시" 라벨 유지, "실제 파트너 매칭 준비 중". 연결 요청에만 게이트.

**(부가) 준비 체크리스트 + 예산·분위기 레인지** — `venue`·`food`·`scale`·`program` 파생. 체크박스 localStorage 저장. 총예산 "약 80~150만원" 룰 산출.

---

## 4. 가입 게이트 — 위치·마찰·복귀

- **위치:** 결과 무료 노출 → "저장 / 연결 / 가족 초대" 행동에만 바텀시트. **결과 가리기 금지.**
- **마찰 최소화:** 소셜 3종(카카오·구글·애플, `renderSocialAuthButtons` 재사용 — 이미 `redirectAfter` 받음) 먼저, 이메일+비번은 접어서 보조. **매직링크(`signInWithOtp`) 헬퍼 추가**로 비번 없는 가입(two-way 코드).
- **복귀(최대 누수 — 최우선 수정):** `ceremony.html`이 `signup.html?next=ceremony.html` 전달 + `signup.html`이 `next` 파라미터 처리(현 invite 분기와 동형). plan은 이미 localStorage에 있어 `planComplete && loggedIn` 분기가 결과 자동 표시 → **next만 이으면 끊김 해결.**
- 가입 직전 **부드러운 다짐 체크 1개**(Fabulous식, 서명 강제·죄책감 금지).

---

## 5. 전략 가드레일 (충돌 해소) — ⚠️ 일부 one-way

현재 `ceremony.html`이 `docs/strategy.md` 4절과 **충돌**. 해소안:
1. **앱 내 "장례식" 미표기.** 위저드 제목 → "살아있을 때 듣고 싶은 말의 밤" / "미리 쓰는 마지막 편지의 밤". "장례식"은 외부 PR 후크에서만. *(브랜드 메시지 = 창업자 결정)*
2. **결과 1순위 CTA = lifecycle 도구**, 매칭은 2순위·후행. *(전략 결정)*
3. **③자기준비자 + ④회고자 전용.** `who=parent`(①케어링)는 케어 온보딩으로 라우팅 — 한 위저드가 두 입구 겸하면 둘 다 어설퍼짐.
4. **매칭 lead 서버 전송은 검증 후.** "무료 1건 검증 → 유료 전환" 순서(strategy §4) 준수. 파트너 0건일 때 lead 받으면 약속 불이행 → "대기명단" 표현 + 연락 SLA.
5. **IA 위치:** 별도 도메인 금지(슈카츠넷 교훈). 잇다 앱 내 독립 랜딩 `/ceremony`, 홈 기본 메뉴엔 미노출, **SEO/SNS 캠페인 진입 전용 lead magnet**.

---

## 6. KPI — 북극성·가드 (가입수는 vanity)

- **1차 성공 = activation(가입 후 첫 lifecycle 행동 1건)**, 가입수 아님. (사전연명·디지털정리 시작 / 콘텐츠 정독+저장 / "내 단계" 설정 중 하나)
- **북극성(매출 직결): 주간 확정 lead 수** — 단, 매칭 검증·파트너 확보 후. 그 전엔 activation이 북극성.
- **가드:** ① 가입 후 D7 재방문 ≥30% ② lead 진정성(연결 후 실제 상담 ≥50%, 수동 태깅) ③ 완주자 결과 체류·재방문.

**계측(현재 0):** `funnel_events`(anon insert-only, select 차단 RLS) 단일 테이블에 7개 이벤트(`cer_view/start/step/complete/signup_click/signup_done/reco_click/lead`)를 `session_id`·`event`·`props jsonb`로 적재. 이미 import된 supabase 클라이언트로 insert 1줄. 대시보드는 `admin.html`. *(테이블 신설 = one-way)*

**종단 전환 현실선:** 노출→lead ~5% (0.5 완주율 × 0.6 결과도달 × 0.3 게이트CTR × 0.7 가입완료 × 잔여).

**A/B 톱3:** ① 게이트 위치(현재안=가치 먼저가 옳은지) ② 문항 8 vs 5 ③ 결과 구성(추천중심 vs 공유용 "내 자리 카드"). `Math.random()` 50/50 + `props.variant`. 변형당 100완주 전 판단 보류.

---

## 7. 데이터 모델 (제안 — 마이그레이션은 창업자 승인)

```
ceremony_plans
  id uuid pk, user_id uuid refs auth.users (null 허용=익명 후 병합)
  who/occasion/scale/venue/food text, guests/program text[], wish text
  generated jsonb (리포트 산출 스냅샷), created_at/updated_at
  RLS: select/insert/update using (auth.uid() = user_id)

ceremony_leads
  id uuid pk, plan_id refs ceremony_plans, user_id refs auth.users
  kind text(venue|food), partner text, status text default 'new'
  contact text(동의 후), created_at
  RLS: insert/select 본인만. 운영 조회는 service_role.

funnel_events
  id uuid pk, session_id text, event text, props jsonb, created_at
  RLS: anon insert-only, select 차단(PII 금지, session_id만).
```

---

## 8. 빌드 시퀀스 (우선순위 + 문 방향)

| 순위 | 작업 | 문 | Sprint |
|---|---|---|---|
| 1 | signup `next` 처리 + ceremony가 `next` 전달 (복귀 누수 해결) | two-way | S0 |
| 2 | `funnel_events` 테이블 + 7개 이벤트 적재 + admin 집계 | **one-way(DB)** | S0 |
| 3 | 결과 리포트 3블록(의미명명·식순타임라인·다음걸음) + lifecycle 라우팅 | two-way | S1 |
| 4 | 게이트 위치 변경(블러 제거, 저장/연결 액션에만) | two-way | S1 |
| 5 | "정리 중" 로딩 + 미니 리빌 + single auto-advance + 진행바 | two-way | S1 |
| 6 | 앱 내 명칭 교체("장례식"→"마지막 편지의 밤"류) | **one-way(브랜드)** | S1 |
| 7 | 매직링크 헬퍼 + 게이트 노출 | two-way(코드)/인증설정 주의 | S2 |
| 8 | `ceremony_leads` 서버 전송 + 가입 후 plan 병합 + lead 태깅 | **one-way(DB)** | S2 |
| 9 | A/B(#1 게이트·#2 문항수·#3 결과구성) | two-way | S3 |
| 10 | 검증 게이트: 지인 ≥5명 인터뷰 + 랜딩 결제의향 → 통과해야 유료 | **one-way(지출·게시)** | S4 |
| — | 매 변경 후 `sw.js` CACHE_VERSION 갱신, `git fetch+rebase` 후 push | — | 상시 |

**의존성:** A/B(S3)는 트래픽 전제 → 마케팅 유입(에세이·SNS) 선행 필요. 운영 단독 불가.

---

## 9. 결정 로그 (창업자 승인 항목)

| # | 결정 | 문 | 상태 |
|---|---|---|---|
| D1 | 결과 1순위 CTA = lifecycle 도구(매칭 2순위) | 전략 | **승인 대기** |
| D2 | 앱 내 "장례식" 미표기 → 명칭 교체 | 브랜드 | **승인 대기** |
| D3 | ③+④ 전용, ①parent는 케어 온보딩 라우팅 | 전략 | **승인 대기** |
| D4 | DB 테이블 신설(funnel_events·ceremony_plans·ceremony_leads) + RLS | DB | **승인 대기** |
| D5 | 유료 매칭은 무료 검증(지인 인터뷰·랜딩) 통과 후 | 지출·게시 | **승인 대기** |
