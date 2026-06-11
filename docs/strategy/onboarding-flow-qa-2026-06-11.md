# 가입 흐름 전수 QA + 가입 게이트 경로 설계

> 작성: 2026-06-11. PE.
> 트리거: 창업자 시연 — 진단 결과 게이트에서 "오늘 잇고 답하기" 버튼이 "안 연결된다"는 보고.
> 기준 코드: PR #40 머지 직후 작업 브랜치 (`claude/lifeheritage-growth-strategy-ZcR33`),
>          전 라운드 `feat(onboarding): 가입 진단 퀴즈를 lifecycle 분기 트리로 재구현`(aabc954).
> 범위: 진단 → 결과 → 게이트 → 가입 → 첫 행동 까지 전수 경로.
> 본 라운드: P1(죽은 버튼 인상) 최소 수정 + QA 매트릭스/게이트 경로 설계.

---

## 0. 사장님 보고 1번 — "오늘 잇고 답하기" 버튼 진단

### 0.1 원인 (코드 1줄)
`onboarding.html` L680–681. 비로그인 결과 화면에서 첫걸음 CTA는 `<button id="cta-gate">…</button>`
(`href` 없음, 클릭 핸들러는 `$('gate').scrollIntoView({ behavior: 'smooth' })` 단 1개).
**게이트가 이미 뷰포트 안에 있으면 스크롤 거리 ~0** → "살짝 스크롤만" 인상.
의도(C4 결정: 결과→CTA→게이트)는 살아 있지만 시각적 단서가 없어 "죽은 버튼"으로 읽힌다.

### 0.2 이 라운드 P1 수정 (적용함)
`onboarding.html` 한 곳:
- 비로그인 첫걸음 카드 안의 CTA 바로 아래에 `답을 남기려면 가입이 필요해요. 아래에서 잠깐만요.` 한 줄(`.onb-cta-hint`).
- 클릭 핸들러: (a) 게이트에 1.2s 펄스 애니메이션(토큰 색만 사용)으로 시선 유도,
  (b) 게이트가 뷰포트에 완전히 보이면 스크롤하지 않고 (c) `이메일로 시작하기` 1차 행동에 키보드 포커스.
- 게이트 컨테이너에 `border-radius: 16px` + 펄스용 `box-shadow` transition.
- `sw.js` CACHE_VERSION → `itda-v3-2026-06-11-onboarding-gate-cta-v2`.

수정 폭은 최소. 동작 의도(C4 결정)는 그대로 보존.
**버튼이 ask.html로 직행하게 만들 것인가**는 게이트 설계 옵션(아래 §3)이라 분리해 보고.

---

## 1. 가입 흐름 전수 QA — 매트릭스

### 1.1 진입점

| # | 경로 | 동작 | 비고 |
|---|---|---|---|
| 1 | `index.html` 비로그인 → "지금, 어느 단계에 와 계세요?" 카드 → `./onboarding.html` | OK | |
| 2 | `index.html` 비로그인 → "커뮤니티 둘러보기" 카드 → `./forest.html` | OK | 비가입 둘러보기 경로(이탈 위험은 §2의 P3) |
| 3 | `nav.js` 어디서든 `로그인 → ./login.html`, `로그인하기 → ./signup.html` | OK | |
| 4 | 외부 공유 링크(공지·콘텐츠 카드) → 해당 페이지 직진 | OK | 비로그인 콘텐츠 가독 — 가입 트리거 없음(P2) |

### 1.2 `onboarding.html` 시뮬레이션 — path × 동작 매트릭스

각 path(`caregiver / self_prep / reflector / bereaved / explorer`)에 대해 Q1→Q2→Q3→Q4→Q5→결과까지 클릭 시퀀스를 코드로 추적.

| 시나리오 | 발견 | 우선순위 |
|---|---|---|
| Q1 5종 모두 → 인터스티셜 → Q2 path별 4종 → Q3 4종 → Q4 3종 → Q5(빈칸 OK) → 결과 | 정상. `STAGE`, `Q2_MIRROR`, `companionFor`, `firstStepFor`, `soloFor`, `Q4_MIRROR` 모두 5×4=20 케이스 채워져 있음. undefined 노출 없음. | — |
| Q1 답 변경(예: `care` → `bereaved`) | `rebuildAfterQ1`가 `q2/q3/q4`만 비우고 `q5`(자유서술) 보존. 의도된 동작. | — |
| Q5만 비우고 결과 보기 | `nextBtn.disabled`는 text형은 무시 → 통과. 결과 화면에서 `quoteBlock`이 비어 자연스럽게 생략. 정상. | — |
| 인터스티셜에서 `이전`(처음으로 돌아가서 Q1 다시) | `backBtn.textContent`가 `idx===0`이면 `처음으로`. 처음 화면 복원 정상. | — |
| 뒤로가기(브라우저) | 단일 페이지 라우팅이라 한 단계가 아닌 페이지 전체 이탈. (현 단계만 보존되고 답은 localStorage에 있어 다시 진입 시 복원됨.) | P2 |
| 새로고침 시 | `loadAns()`가 localStorage에서 복원, `buildSteps(computeStage(answers))`로 steps 재구성. `idx=0`으로 다시 시작 (이전에 어디까지 갔는지 idx는 휘발). 답은 보존, 시작점만 잃음. | P3 |
| **이미 로그인 + answers.stage 있음** | L693–696: intro 숨기고 바로 `showResult()`. **그러나 로그인 사용자는 결과만 보고 게이트가 안 나오니 첫걸음 CTA는 `<a href=fs.href>`로 직행. OK.** | — |
| **Q5에 `<script>` 등 입력** | `escapeHtml()` 거침 — 안전. | — |
| 진행률 분모 | `questionTotal()`이 현재 steps 안의 key 가진 단계만 셈. Q1 미답 부팅 시 steps=[Q1]뿐이라 `1 / 1`로 보일 수 있는 순간. 첫 답 이후 `5/5`로 점프 — UX 어색함. | P3 |

### 1.3 결과 → 게이트 흐름

| 시나리오 | 발견 | 우선순위 |
|---|---|---|
| **비로그인 + "오늘 잇고 답하기"** (사장님 보고) | 게이트 스크롤만, 시각적 신호 없음. → **P1 수정함**. | P1 |
| 비로그인 + "이메일로 시작하기" → `signup.html?next=./ask.html` | `signup.html`의 `safeNext` 정규식 매치 통과. 가입 직후 세션 잡히면 `redirectAfterSignup`로 직진. OK. | — |
| 비로그인 + "지금은 저장 없이 둘러볼게요"(`#skip`) | `window.location.href = fs.href`로 첫걸음 페이지 직진. OK. **단** 답은 localStorage에만 있고 Supabase에는 미동기화. | P2 |
| 비로그인 + "처음부터 다시 해보기" | confirm 후 answers 초기화 + intro 복귀. OK. | — |
| **이메일 인증 필요한 가입(자동승인 OFF)** | `signup.html` L195–202: 가입 알림 표시 후 form 숨김. 이메일 링크는 `auth.js` L45 — **`emailRedirectTo`가 항상 `welcome.html` 고정**. `next` 쿼리 무시. → **인증 후 옛 온보딩(welcome.html, place 기반)으로 떨어져 이중 온보딩.** | **P1** |
| 게이트 "이메일로 시작하기" 누른 사용자가 사실 기존 회원이면 `signup.html`에서 `redirectIfAuthed` 작동, login.html로 가지 않고 next로 직행. OK. | — | |
| 그러나 사용자가 "이미 계정이 있어요" 보고 login.html로 가면 → **login.html은 `next` 파라미터를 처리하지 않음** (L99 `redirectAfterLogin = './index.html'` 고정). 로그인 후 index로 떨어짐 — 첫걸음 페이지 못 감, 결과/답 잃음. | **P2** | |

### 1.4 가입 직후 첫걸음

| 시나리오 | 발견 | 우선순위 |
|---|---|---|
| 가입 → `ask.html` (오늘 잇고) | 정상. ask.html은 비로그인 접근도 허용(질문 조회) / 답 제출만 로그인 강제(L729, L852). | — |
| 가입 → `care.html` / `info.html` / `forest.html` / `seed.html` | 모두 정적 페이지 라우팅 정상. | — |
| **온보딩 답이 Supabase에 동기화되는가** | **안 됨.** localStorage `itda:onboarding`에만 존재. 가입 후에도 동기화 코드 없음. 기기 변경/캐시 클리어 시 손실. 추후 stage 기반 개인화 추천도 못 함. | **P2** |
| `welcome.html`(옛 온보딩)에서 본 결과를 새 `onboarding.html`이 무시 | welcome.html은 `itda:onboarding_place` 만 저장. 신 onboarding.html은 그 키를 안 봄. 두 흐름이 완전 분리·중복. | **P2** |

### 1.5 비로그인 둘러보기

| 시나리오 | 발견 | 우선순위 |
|---|---|---|
| `forest.html`, `info.html` 등 콘텐츠 페이지 | 비로그인 가독 OK. 좋아요/댓글/저장 시점에 로그인 강제. | — |
| 비로그인이 콘텐츠 읽다가 "저장/답글"에서 로그인 페이지로 가면 — `next` 보존? | 코드 확인 필요. 현재 대부분 `window.location.href = './login.html'` 직진(예: ask.html L729). next 없음. | **P2** |

### 1.6 카운트
- **P1**: 2건 (CTA 죽은 인상 — 수정함, `emailRedirectTo` 고정 — 보류)
- **P2**: 5건 (login.html next 미지원, Supabase 미동기화, welcome/onboarding 이원화, skip 시 답 손실, 일반 페이지 next 미보존)
- **P3**: 2건 (진행률 분모 점프, 새로고침 시 idx 휘발)

---

## 2. 결과 화면 빈자리·undefined 노출 점검 (path 5종)

`showResult()` 매트릭스를 코드 단위로 확인.

| path | STAGE.name | STAGE.companion | Q2_MIRROR (×4) | companionFor 변주 | firstStepFor (×Q4 3종 = 12 케이스) | soloFor | Q4_MIRROR | 결과 |
|---|---|---|---|---|---|---|---|---|
| caregiver | ✅ | ✅ | ✅ 4 | distance/beginning 2건 변주 | ✅ 3×3=9 | ✅ | ✅ | undefined 노출 위험 0 |
| self_prep | ✅ | ✅ | ✅ 4 | parent/health 2건 변주 | ✅ 9 | ✅ | ✅ | 0 |
| reflector | ✅ | ✅ | ✅ 4 | family/listener 2건 변주 | ✅ 9 | ✅ | ✅ | 0 |
| bereaved | ✅ | ✅ | ✅ 4 | recent/long 2건 변주 + recent 강제 가드 | ✅ 9 (recent는 read/answer/do 모두 "글 한 편 읽기"로 가드) | ✅ | ✅ | 0 |
| explorer | ✅ | ✅ | ✅ 4 | 없음(base 사용) | ✅ 9 | ✅ | ✅ | 0 |

폴백 안전 장치: `STAGE[stage]` 미존재 시 `computeStage` 폴백 `'explorer'`, `firstStepFor`/`companionFor`도 그 경로 보장. **빈자리·undefined 노출 0건.**

다만 두 카피 사소한 어색 후보(P3):
- self_prep × milestone × Q4=`read` — "미리 챙긴 분의 글 읽기" — 다소 단조롭지만 동작은 정상.
- explorer × `unsure` × Q4=`do` — "도구 둘러보기"가 seed.html 직링크 — seed가 라이프 탭이라 의도 적합.

---

## 3. 회원가입 게이트 경로 설계 (사장님 질문)

> "어느 경로에서 회원가입을 받아야 하는가?"

### 3.1 옵션 비교

| 축 | A — 현재 (결과 후 게이트) | B — CTA 클릭 직전 게이트 | C — 1회 무가입 행동 + 2번째에 게이트 |
|---|---|---|---|
| **흐름** | 5문항 → 결과(미러링·동행·SOLO·첫걸음 카드) → 게이트(가입/소셜/스킵) | 5문항 → 결과 → CTA 누름 → 모달/가입화면 직행("답을 남기려면 가입") | 5문항 → 결과 → CTA 누르면 ask.html 1회 응답 무가입 허용 → 2번째 행동(저장·답글·다시 답하기)에서 게이트 |
| **가입 전환 가설** | 중–상. 미러링 클라이맥스 직후라 결합 강함. 단 게이트 UI가 무거우면 이탈. | 상. "왜 가입해야 하는지"가 행동 직전에 명확. 카피만 잘 쓰면 마찰 최소. | 하–중. 1회 응답 후 만족하고 떠나는 비율이 높음. 단 2회차 진입 시 가입 결합력은 최강. |
| **이탈 위험** | 게이트 페이지가 너무 길면 이탈(현재 길이는 무난). "오늘 잇고 답하기" CTA가 가입게이트로 보이지 않아 혼란(=사장님 보고) | 낮음. 모달이면 컨텍스트 잃지 않음. | 낮음(1차) / 보통(2차) |
| **D7 인지부조화** | "왜 물었지?" → C4 결정으로 결과 화면이 답함. 이번 라운드 분기 트리로 해소. 단 **CTA가 무엇으로 가는지 명확하지 않으면 새 D7 재발**. | 없음. CTA = "여기를 누르면 가입 + 답글" 명시. | 있음. 1회차 후 "어? 답이 사라졌네"(2회차에서) 인지부조화. |
| **구현 비용** | 0 (현재 코드 그대로). P1 수정만 추가. | 중. CTA 핸들러를 게이트로 강제 이동 + 카피 1줄. (자유롭게 둘러보기는 보장 안 됨) | 상. ask.html 비로그인 응답 임시 저장 + 가입 후 마이그레이션 로직 + 2회차 게이트. |
| **데이터 동기화** | 가입 시 localStorage → Supabase 동기화 별도 작업 필요(현재 미구현). | 같음. 가입 직전 답 직접 폼에 동봉 가능. | 1회차 응답을 익명 row로 저장 → 가입 시 user_id 마이그레이션. 복잡. |

### 3.2 추천 — **옵션 A 유지 + B 보강** (혼합형)

**근거**:
1. C4 결정(결과 → CTA → 게이트)으로 미러링 클라이맥스의 가치 보존. 옵션 B로 통째 옮기면 결과 화면이 가벼워지고 게이트 자체가 무거워진다.
2. 단 현재 A의 CTA가 "죽은 버튼" 인상 — 이 라운드 P1 수정으로 시각 시그널은 잡았지만, **여전히 ask.html로 직행 가능하다는 오해**가 남는다.
3. 옵션 B의 강점만 흡수 — **CTA 카피에 "가입 후 답을 남길 수 있어요" 한 줄 + 펄스 + 게이트 강조** 가 가성비 최고.
4. 1회 무가입(C)은 잇다 톤("조용한 동반자")과 맞지만 D7 재발 위험이 크고 구현 비용 큼. **다음 페이즈 후보로 보류**.

### 3.3 추천안 안의 결정 사항

| 항목 | 안 |
|---|---|
| **결과 화면 첫걸음 CTA 카피** | path별 현행 유지. 그러나 아래에 작은 안내 한 줄 추가(P1으로 적용함): `답을 남기려면 가입이 필요해요. 아래에서 잠깐만요.` |
| **CTA 클릭 동작** | (a) 게이트 펄스 1.2s (P1 적용), (b) 보이지 않으면 스크롤 (c) "이메일로 시작하기" 자동 포커스. **ask.html로 직행은 하지 않음** — 그러면 답은 잃어버린다. |
| **게이트 1차 행동** | "이메일로 시작하기" (`signup.html?next=fs.href`) — 현행 유지. |
| **게이트 2차 행동** | "지금은 저장 없이 둘러볼게요" → `fs.href` 직진. 답은 localStorage에 남음. |
| **이탈자 가드** | 게이트 미가입 → 다음 진입(첫걸음 페이지 안 — ask/care/forest 등) 상단에 작은 배너 "방금 그려본 자리, 저장하시려면…" 한 줄(이 라운드 미적용 — 별도 라운드). |

### 3.4 사장님 결정 필요 (5건)

| ID | 결정 | 옵션 | PE 권장 |
|---|---|---|---|
| **G1** | 게이트 경로 | A 현재 / B CTA→가입 직행 / C 1회 무가입 / A+B 혼합 | **A+B 혼합** (현행 + CTA 시그널 강화 — 본 라운드 적용) |
| **G2** | `auth.js`의 `emailRedirectTo` 고정 처리 | welcome.html 고정 유지 / signup의 next를 인코딩해 동봉 / 페이지 분리 | **signup의 next를 emailRedirectTo에 동봉.** welcome.html이 이중 온보딩을 만드는 근본 원인. |
| **G3** | welcome.html(옛 흐름) 처리 | 유지 / 삭제 / 리다이렉트(→ onboarding.html 또는 index.html) | **리다이렉트 → index.html.** 옛 흐름의 이름·자리 선택 데이터가 새 onboarding에 안 쓰이므로 보존 가치 낮음. 단 이메일 인증 후 도착지 카피는 `welcome.html`에 의존 — 분리 작업 필요. |
| **G4** | login.html의 next 보존 | 도입 / 미도입 | **도입**(signup.html과 동일 `safeNext` 정규식 적용). 게이트 → signup → 기존회원이 login으로 빠지면 결과·답 손실 방지. |
| **G5** | 가입 직후 localStorage 답을 Supabase로 동기화 | 도입(profile.onboarding_stage·answers JSONB) / 미도입(local만) | **도입.** stage 기반 홈 카드 개인화·추천 기반. 다만 DB 스키마 변경 필요 → 사장님 승인 + 백업 후. |

### 3.5 본 라운드 적용 범위
- G1: A+B 혼합 — **적용함**(P1 코드 수정).
- G2 / G3 / G4 / G5 — **사장님 승인 후 별도 라운드.**

---

## 4. 잠재 리스크 / 메모

- 이 P1 수정은 결과 카피·결정 트리 변경 0. 시각·핸들러만. 데이터 안전 0 영향.
- `sw.js` 캐시 버전 갱신했으므로 사용자는 다음 진입 시 갱신본 받음. 첫 1회는 구버전이 잠시 보일 수 있음(서비스워커 한 turn 지연).
- 옵션 C(무가입 1회 응답)는 익명 데이터 저장 모델이 RLS 정책에 맞아야 하고, 가입 후 user_id 마이그레이션이 까다롭다. **현 라운드 도입 비추천**.
- `signup.html`의 `safeNext` 정규식이 `?` 쿼리만 허용하고 `#` 해시는 막아둠. 현재 fs.href는 해시 없으니 안전.
- `emailRedirectTo` 고정 문제(G2)는 **자동 이메일 확인이 켜져 있어 세션이 즉시 잡히는 환경**에서는 표면화되지 않음. 그러나 Supabase 설정 변경 또는 이메일 확인 강제 환경에서 즉시 폭발 — 우선순위 P1로 분류.
