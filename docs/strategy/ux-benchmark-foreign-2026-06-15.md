# 해외 죽음·웰다잉·사별 서비스 UX 벤치마크 — "베끼기 가장 적절한 서비스" 추천

> 트리거: `docs/strategy/decisions-2026-06-15-lemon-cafe.md` **L8** — "UX 설계, 벤치마킹 적극 활용. 헌장 위배 안 하는 한 베끼는 것 허용."
> 사장님 발의: *"죽음관련 서비스 살펴보고 베끼기 가장 적절한 서비스 추천해줘."*
> 단일 원천: 본 문서. 망고하다는 06-15 L1에서 카테고리 검증자로 종결 → 본 문서에서 제외.
> 작성: 2026-06-21 (전략 에이전트)

---

## 0. 30초 요약 (사장님용)

- **베끼기 1순위: Cake (joincake.com)** — 유언/웰니스 path 진입 흐름 + "free 무겁지 않게 시작" 정서. 헌장 적합도 가장 높음.
- **베끼기 2순위: Empathy (empathy.com)** — 케어링 path "오늘 무엇을 해야 하나" 액션 가이드 + AI/사람 하이브리드 컨시어지 톤. **단, B2B2C BM은 베끼지 말 것.**
- **베끼지 말 것**:
  - Trust & Will — 너무 법률·계약 무게. 잇다는 "법률 자동화 아닌 관계 자동화" (06-15 L1 차별점).
  - HereAfter AI — 추모/디지털 부활 방향. 잇다 추모 보류 헌장 위배.
  - Everplans "deputies" 용어 — 신뢰는 좋으나 단어가 차갑다. 한국어 정서 X.
- **핵심 발견 3가지**: 본 문서 §7.

---

## 1. 조사 대상 7개 — 한 줄 정의

| # | 서비스 | URL | 한 줄 정체 | 검증 가능? |
| :-- | :-- | :-- | :-- | :-- |
| 1 | **Cake** | joincake.com | 무료 end-of-life 플래닝 + 콘텐츠 허브, $99/yr 컨시어지 옵션 | ✅ (홈페이지 직접 차단, search 충분) |
| 2 | **Empathy** | empathy.com | 사별 후 실무·정서 컴패니언 ($65 1회 + B2B2C) | ✅ |
| 3 | **Everplans** | everplans.com | 디지털 볼트 + "deputies(대리인)" 협업 ($99.99/yr) | ✅ |
| 4 | **Trust & Will** | trustandwill.com | 온라인 유언·트러스트 ($199~599 + $49/yr) | ✅ |
| 5 | **HereAfter AI** | hereafter.ai | AI 음성 인터뷰 → 가족 대화형 보존 | ✅ |
| 6 | **Modern Loss** | modernloss.com | 사별 콘텐츠 + 커뮤니티 + 책 (광고/제휴 BM) | ✅ |
| 7 | **Help Texts** | helptexts.com | 문자 기반 사별·정신건강 코칭 ($9.99/월) | ✅ |
| (참고) | Lantern | lantern.co | end-of-life 플래닝. **2024년 Wellthy에 인수·서비스 종료** | 종료 — 분석 대상 제외 |

> 참고: Lantern은 2024 종료. **유언 단독 BM의 어려움** 신호 — `docs/benchmark/shukatsu-net.md`(終活ねっと 소멸)와 같은 결: 단일 의존은 위험. 잇다 BM 다각화 (구독+도구+매칭) 가설 보강 input.

---

## 2. 서비스별 카드 — 가입 흐름 · 핵심 기능 · UX 결 · BM · 헌장 적합도

### 2.1 Cake (joincake.com)

| 항목 | 내용 |
| :-- | :-- |
| **타깃** | 본인 end-of-life 미리 정리 + (간접적으로) 사별 후 가족 |
| **가입 흐름** | 이메일/Facebook → "yes/no 질문 시리즈" (장례 선호 · 재정 · 가보고 싶은 곳 · 관계 만족도) → 자동 플랜 생성 |
| **핵심 기능** | (a) 가이드 질문 (b) 문서 업로드/볼트 (c) 가족 공유 (d) 콘텐츠 허브 (수천 개 article) (e) $99/yr "컨시어지" = 1:1 상담 + 가족 대화 facilitate |
| **UX 결** | "death app" 느낌 X. 따뜻·일상적·"케이크" 메타포. **무겁지 않게 시작 가능**. 첫 질문이 "yes/no" → 진입 마찰 매우 낮음 |
| **BM** | Freemium ($99/yr 컨시어지) + B2B (Foundation Partners 인수, 장의업체 채널) — **콘텐츠가 acquisition 엔진** (수천 article SEO) |
| **헌장 적합도** | ✅ 과시·경쟁 0 / ✅ 조용한 톤 / ⚠️ 추모(celebration of life) 일부 — 잇다는 보류 |

### 2.2 Empathy (empathy.com)

| 항목 | 내용 |
| :-- | :-- |
| **타깃** | 가족 사별 직후 (실무·서류·정서 동시 무너지는 사람) |
| **가입 흐름** | 위치·종교 질문 → 상황 분기 ("Immediate Arrangements" / "Searching for Documents" / "Bills and Debt") → 개인화 케어 플랜 생성 → Care Manager 배정 |
| **핵심 기능** | (a) 단계별 to-do (b) **AI + 사람 Care Manager 하이브리드** (c) AI 부고문 작성 (d) 계정·구독 자동 해지 (e) 5인까지 가족 협업 (f) 유족 혜택 청구 도움 |
| **UX 결** | "혼란의 한복판에서 손 잡아주는" 정서. "다음에 뭘 해야 하는지" 명확한 액션 카드. 한 화면에 너무 많이 보이지 않음 |
| **BM** | $65 1회 (개인) + **B2B2C 주력** (보험사·은행·HR 파트너십이 매출 대부분, $72M Series C 2025) |
| **헌장 적합도** | ✅ 조용함·존엄 / ✅ 가족 협업 (잇다와 일치) / ⚠️ AI 부고문 = 잇다 추모 보류와 충돌 / ✅ YMYL = 사람 Care Manager 개입 |

### 2.3 Everplans (everplans.com)

| 항목 | 내용 |
| :-- | :-- |
| **타깃** | 30~60대 estate planning에 막 관심 갖기 시작한 사람 |
| **가입 흐름** | 가입 → 대시보드가 비어있는 슬롯 prompt (운전면허 · 은행 · 장례 선호 · 펫 케어 등) → 채울수록 진행률 ↑ |
| **핵심 기능** | (a) 디지털 볼트 (b) **"Deputies(대리인)"** = 가족·집행인에 슬롯별 접근 권한 (c) 체크리스트·article 라이브러리 (d) 무료는 3 항목만, $99.99/yr부터 무제한 + 가져오기 + 가이드 |
| **UX 결** | "내 인생 한 곳에 정리" — 정리정돈 정서. 헤드라인: *"All the pieces of your world in one safe place"* |
| **BM** | Freemium ($99.99/yr) + B2B (재무설계사 채널) |
| **헌장 적합도** | ✅ 시니어 가독성 / ✅ 가족 협업 / ⚠️ "Deputies" 용어 = 한국 정서에서 차갑다. "대리인"이 아닌 "함께 보는 사람" 같은 따뜻한 단어 필요 |

### 2.4 Trust & Will (trustandwill.com)

| 항목 | 내용 |
| :-- | :-- |
| **타깃** | 자녀 있는 30~50대 (특히 가디언 지정 동기) |
| **가입 흐름** | "Answer a few questions and we'll suggest a plan to fit your unique needs" → 기본 정보 → 가디언(아이·반려동물) → 수익자 → 집행인 → 디지털 집행인 |
| **핵심 기능** | (a) 유언/트러스트 작성 (b) 가디언 지정 (c) 디지털 볼트 (d) 모든 플랜에 living will + POA + HIPAA + advance healthcare directive 기본 포함 (e) 주별 공증 가이드 |
| **UX 결** | **법률 신뢰감 강조**. "bank-level security" · 변호사 검토. Trustpilot 97% 4·5점 |
| **BM** | $199 (개인 유언) ~ $599 (joint trust) + $49/yr 멤버십. Fifth Third Bank 같은 B2B2C 채널 확장 중 |
| **헌장 적합도** | ❌ **법률·계약 무게가 너무 강하다**. 잇다 차별점(관계 자동화·마음 정리부터)과 정면 충돌. "테키하게 경쟁" 사장님 발의에 맞지 않음 |

### 2.5 HereAfter AI (hereafter.ai)

| 항목 | 내용 |
| :-- | :-- |
| **타깃** | 자기 목소리·이야기를 가족에 남기고 싶은 시니어 + 그 가족 |
| **가입 흐름** | 가상 인터뷰어가 수백 개 prompt로 음성 인터뷰 → AI가 voice avatar 자동 생성 → 가족이 스마트스피커·앱으로 대화 |
| **핵심 기능** | (a) 음성 인터뷰 prompt 라이브러리 (b) 사진 연동 (c) **사후 가족이 AI와 대화** (d) "Dadbot" 창업 스토리 |
| **UX 결** | 따뜻하지만 **"디지털 부활"** 영역. 호불호 강함 |
| **BM** | 구독 (월/연간) + B2B (시니어 케어 시설) |
| **헌장 적합도** | ❌ **잇다 추모(memorial) 보류 헌장과 정면 충돌**. AI 부활은 한국 정서에서 더 무겁고, YMYL/윤리 리스크 큼. 베끼기 0 |

### 2.6 Modern Loss (modernloss.com)

| 항목 | 내용 |
| :-- | :-- |
| **타깃** | 사별 경험한 밀레니얼·X세대 (특히 부모 사별) |
| **가입 흐름** | 회원가입 거의 없음 (콘텐츠 사이트). 뉴스레터·책 구매·기고 |
| **핵심 기능** | (a) candid essay (b) user-submitted story platform (c) 책 ("The Modern Loss Handbook") (d) "Triggers · Intimacy · Journeys · Secrets" 같은 비전통 카테고리 (e) resource map |
| **UX 결** | **"슬픔 초보자 환영"** (Beginners welcome) — 사장님 헌장 톤과 가장 가까움. 솔직·일상어 |
| **BM** | 책 + 광고 + 제휴. **acquisition 엔진 = 콘텐츠 단독**. 06-14 결정 D7(콘텐츠=핵심 acquisition) 검증 사례 |
| **헌장 적합도** | ✅ 톤 (조용함·솔직·존엄) / ✅ "초보자 환영" 진입 마찰 0 / ⚠️ 도구·BM 약함 — 잇다와 보완 관계 |

> 참고: `docs/benchmark/modern-loss.md` 별도 존재. 본 문서는 UX 진입 흐름 관점만 다룸.

### 2.7 Help Texts (helptexts.com)

| 항목 | 내용 |
| :-- | :-- |
| **타깃** | 사별 직후~1년차 (스마트폰 없어도 OK, 시니어 친화) |
| **가입 흐름** | 짧은 questionnaire (상실 종류·관계·중요 날짜) → 주 2회 맞춤 텍스트 시작 + 기념일·명절 추가 |
| **핵심 기능** | (a) 전문가 작성 텍스트 (b) **최대 2명 "supporter" 추가** = 친구·가족이 "어떻게 도울지" 텍스트 받음 (c) 호스피스 B2B 파트너십 |
| **UX 결** | "앱 X, 약속 X, 보험 X" — **마찰 0**. 텍스트 = 가장 가까운 채널 |
| **BM** | $9.99/월 + 호스피스 13개월 패키지 B2B2C |
| **헌장 적합도** | ✅ 시니어 가독성 (텍스트) / ✅ "혼자 아닙니다" 톤 / ✅ supporter 패턴 = 잇다 가족 협업과 일치 |

---

## 3. 페르소나별 적합도 매트릭스

> 잇다 두 페르소나 (06-15 L3 (b) 한 코드 두 얼굴): **유언/웰니스** + **케어링**.

### 3.1 유언/웰니스 path 적합도

| 서비스 | 진입 카피 적합도 | 동선 적합도 | 베낄 부분 | 베끼지 말 부분 |
| :-- | :-- | :-- | :-- | :-- |
| **Cake** | ★★★★★ | ★★★★★ | yes/no 첫 질문 / 가벼운 진입 / 콘텐츠 허브 | celebration of life (추모) |
| Everplans | ★★★ | ★★★★ | 빈 슬롯 prompt / 진행률 ↑ 정서 | "deputies" 용어 |
| Trust & Will | ★★ | ★★ | "Answer a few questions and we'll suggest" 카피 | 법률·계약 무게 |
| HereAfter AI | ★ | ★ | 음성 prompt 라이브러리 아이디어 | AI 부활 / 추모 영역 |

### 3.2 케어링 path 적합도

| 서비스 | 진입 카피 적합도 | 동선 적합도 | 베낄 부분 | 베끼지 말 부분 |
| :-- | :-- | :-- | :-- | :-- |
| **Empathy** | ★★★★★ | ★★★★★ | 상황 분기 (즉시 해야 할 일/서류/돈) / 5인 협업 / "다음 단계" 액션 카드 | AI 부고문 / B2B2C BM (지금은) |
| Help Texts | ★★★★ | ★★★★ | supporter 패턴 (친구도 텍스트 받음) / 짧은 questionnaire | 텍스트 단독 채널 (잇다는 앱 우선) |
| Modern Loss | ★★★★ | ★★ | "초보자 환영" 톤 / candid essay | 도구 없음 (콘텐츠만) |
| Cake | ★★★ | ★★★ | 가족 공유 / 콘텐츠 허브 | 본인 유언 중심 |

---

## 4. 베끼기 추천 — Top 2 + 구체 베낄 부분

### 4.1 1순위: **Cake** — 유언/웰니스 path 진입에 베껴라

**왜 Cake인가:**
- 잇다 유언/웰니스 path 진입 카피(*"내일 다시 못 깨어난다면, 가장 후회할 일은?"*)가 Cake의 yes/no 질문 시리즈와 정확히 결이 같음 — **"무겁지 않게 시작"** 정서.
- $99/yr 컨시어지가 free 위에 얹힌 freemium 구조 = 잇다 BM 다각화(구독+도구+매칭) 검증 input.
- **콘텐츠 허브 (수천 article)** = 06-14 D7 / 06-15 L2 "콘텐츠=acquisition 엔진" 가설 검증 사례.

**구체 베낄 부분 (PE 위임 가능):**

| # | 베낄 것 | 잇다 어디에 적용 | 카피 안 |
| :-- | :-- | :-- | :-- |
| C1 | **yes/no 첫 질문 → 자동 플랜 생성** 흐름 | `reflection.html` step 1을 yes/no 3~5개로 압축 | "내일 못 깨어난다면, ① 가족에 남길 말이 있나요? Y/N ② 정리할 일이 있나요? Y/N ③ 후회되는 관계가 있나요? Y/N" |
| C2 | **콘텐츠 허브 = 진입 입구** 위계 | `forest.html`을 단순 큐레이션 → **"오늘의 질문" + "주제별 article 30+개"** 구조로 (info와 통합, E4 진단) | "오늘잇고" 유지하되 article 인벤토리 노출 |
| C3 | **freemium 정서** = "free로 시작하고, 더 깊은 건 옵션" | 유언 빌더 무료 / 가족 협업·전문가 감수가 옵션 (BM 결정 시) | "유언, 무료로 시작하세요. 공증·법적 효력은 필요할 때 안내드려요" |
| C4 | **"케이크" 같은 따뜻한 메타포** 한국어 검토 | 잇다 = "잇다"는 이미 좋은 메타포 → 카드/페이지명에 무거운 단어 (유산·죽음·종말) 배제 | "준비" · "정리" · "남길 말" 우선 |

**베끼지 말 것:**
- celebration of life / 추모 페이지 — 잇다 헌장 추모 보류
- 장례업체 매칭 (Foundation Partners 인수 이후 무거워짐) — 잇다 매칭 BM은 분기 게이트 이후 (L6)

### 4.2 2순위: **Empathy** — 케어링 path 동선에 베껴라

**왜 Empathy인가:**
- 케어링 path는 "오늘 무엇을 해야 하는지" 액션 가이드가 핵심. Empathy의 **상황 분기 + 단계별 to-do 카드**가 정확히 그 자리.
- 5인 가족 협업 = 잇다 "가족 협업 케어 기록"(06-15 (b) 차별점)과 일치.
- $72M Series C (2025) — 카테고리 자본 검증 가장 강함.

**구체 베낄 부분 (PE 위임 가능):**

| # | 베낄 것 | 잇다 어디에 적용 | 카피 안 |
| :-- | :-- | :-- | :-- |
| E1 | **상황 분기 진입** (즉시/서류/돈/정서) | `care-dashboard.html` 첫 화면을 4~5개 상황 카드로 | "오늘 부모님께… ① 안부 한 줄 ② 병원 동행 기록 ③ 형제와 공유할 일 ④ 약/돌봄 일정" |
| E2 | **"다음에 뭘 해야 하나" 단일 액션 카드** | 케어 대시보드에 "오늘의 다음 한 가지" 카드 1개 (헌장: 시스템이 권하지 않음 — 단, 사용자가 선택한 path 안에서는 가이드 허용) | "오늘 ${부모님} 안부, 한 줄 어떠세요" (06-14 약속 카드 카피 계승) |
| E3 | **5인 가족 협업 슬롯** | `invite.html`을 "최대 5인" 명시 + 역할(주 보호자·형제·자녀·친구) | "함께 보는 사람 최대 5명까지 초대할 수 있어요" |
| E4 | **단계별 progress** ("Searching for Documents" 류 진행 단계 표시) | 케어 일지에 "이번 주 케어 완료한 일" 요약 (카운터·뱃지 X — 헌장 일관, 단순 텍스트 요약) | "이번 주 안부 3회 · 병원 동행 1회 — 잘 잇고 계세요" |

**베끼지 말 것:**
- **AI 부고문 작성** — 잇다 추모 보류 + YMYL/감정 리스크
- **B2B2C BM (보험사·은행 채널)** — 잇다는 06-15 L2에서 네이버 카페 acquisition 1순위로 결정. B2B는 한참 뒤 (Q4 분기 게이트 이후 재검토)
- Care Manager 사람 상담 — 운영비 폭증 위험. 잇다 3인 팀 규모에 부적합. 콘텐츠·도구로 먼저.

---

## 5. PE 위임 카피·동선 — 다음 라운드 input

### 5.1 유언/웰니스 path 진입 카드 (Cake C1 베끼기)

현재 `index.html` 진입 카드 1:
> "내일 다시 못 깨어난다면, 가장 후회할 일은?"

→ 클릭 → `reflection.html` 8 step (현재)

**제안: 첫 step을 yes/no 3개로 압축한 다음 8 step으로 분기**

```
[reflection.html step 0 — 신규]
세 가지만 빠르게 답해주세요. 30초면 됩니다.

① 가족이나 가까운 사람에게 남기고 싶은 말이 있나요? (예/아니오)
② 정리해두고 싶은 일이 있나요? (예/아니오)
③ 후회되는 관계가 있나요? (예/아니오)

→ 답한 조합으로 다음 step 분기 (사람/일/혼합)
```

**Trade-off**: 현 8 step이 더 깊지만, 첫 step에서 이탈하면 의미 없음. yes/no는 진입 마찰을 낮춘다. **반대 견해**: 잇다 톤이 "조용·깊이"인데 yes/no는 가벼울 수 있음. **완충**: 카피를 "30초면 됩니다" 정도로 부담 없이.

### 5.2 케어링 path 진입 카드 (Empathy E1·E2 베끼기)

현재 `index.html` 진입 카드 2 (06-15 두 페르소나 문서 §12 결정 대기):
> (A) "부모님께 오늘, 안부 한 줄" / (B) "오늘, 부모님께 안부 한 줄 어떠세요" / (C) "부모님 안부, 오늘 어떠세요"

→ 클릭 → `nest.html` / `care-dashboard.html`

**제안: 클릭 후 케어 대시보드 첫 화면을 4 카드 분기로**

```
[care-dashboard.html 첫 진입 — 비/신규 회원]
오늘, 무엇부터 하시겠어요?

[카드 1] 안부 한 줄 남기기
[카드 2] 병원·약·일정 기록하기
[카드 3] 형제·가족과 함께 보기
[카드 4] 긴급 카드 만들기

(시스템이 우선순위 권하지 않음 — 사용자 선택, 헌장 일관)
```

**Trade-off**: 4 카드는 첫 인상 부담될 수 있음. **완충**: 카드 디자인을 단순 텍스트 위주, 동등 위계 (헌장).

### 5.3 가족 협업 카피 (Empathy E3 + Help Texts supporter 패턴)

현재 `invite.html` — "가족 초대" 일반 카피.

**제안:**
```
[invite.html 카피 안]
잇다는 혼자 쓰지 않습니다.
함께 보는 사람 최대 5명까지 초대할 수 있어요.

- 주 보호자 (나)
- 형제·자매
- 자녀
- 가까운 친구
- (선택) 케어 매니저
```

**Trade-off**: 5인 슬롯은 Empathy 직접 베낌. 정당화: 가족 협업이 잇다 핵심 차별점 (06-15 (b) 한 코드 두 얼굴 §7).

### 5.4 콘텐츠 허브 위계 (Cake C2 베끼기 + E4·E9 진단 해결)

현재 `forest.html` + `info.html` 중복 (E4 진단).

**제안:**
- `info.html` 폐기, `forest.html`에 흡수
- `forest.html` 구조 = (a) 오늘잇고 1개 카드 (b) **주제별 article 4~6 섹션** (마음 / 유언 / 케어 / 사별 / 정리 / 의례) (c) 검색

이 부분은 **마케팅 에이전트 + 카피라이터** 위임 (콘텐츠 인벤토리·SEO·카피 craft).

---

## 6. 결정 표 — 사장님 컨펌 필요한 5개

| # | 결정 | 옵션 | 전략 추천 | 가장 큰 trade-off | 반대 견해 |
| :-- | :-- | :-- | :-- | :-- | :-- |
| **B1** | reflection.html step 0 yes/no 추가? | (a) 추가 (Cake C1) (b) 현 8 step 유지 | **(a)** | 가벼움 risk | "잇다는 깊이가 자산. yes/no는 본질 희석" |
| **B2** | care-dashboard 4 카드 분기? | (a) 적용 (Empathy E1) (b) 현 단일 진입 유지 | **(a)** | 첫 인상 부담 | "케어는 즉시성. 분기보다 한 액션이 낫다" — Help Texts 패턴 (단일 텍스트) |
| **B3** | invite 5인 슬롯 명시? | (a) 명시 (b) 무제한 (c) 2~3인만 | **(a) 5인** | Empathy 직접 베낌 표시 risk | "잇다는 더 친밀. 2~3인이 한국 정서" |
| **B4** | forest ↔ info 통합? | (a) 통합 (Cake C2) (b) 분리 유지 | **(a)** — E4 진단과도 일치 | 콘텐츠 마이그레이션 작업량 | "info는 YMYL 색이 강해 분리 유지" |
| **B5** | "freemium 정서" 명시? | (a) "무료로 시작" 카피 명시 (b) 가격 언급 0 (현재) | **보류** — L6 BM 결정 보류 중 | 가격 카피는 BM 결정 후 | — |

---

## 7. 핵심 발견 3가지

### 발견 1: **유언 단독 BM은 위험하다 — Lantern 2024 종료가 신호**

Lantern은 2018~2024 = 6년. Cake보다 작았지만 일정 규모. Wellthy 인수 후 종료. 終活ねっと 소멸과 같은 결.

→ **잇다 시사점**: L6 BM 결정 보류 잘함. 유언 단독 X. **콘텐츠(acquisition) + 도구(유언/케어) + (Q4 이후) 매칭** 3축 가설 강화. `docs/benchmark/shukatsu-net.md`와 동일 교훈.

### 발견 2: **승자는 다 "콘텐츠 허브"를 가진다** — Cake / Modern Loss / Empathy(blog 강함)

수천 article SEO가 유료 광고 없이 사용자 끌어옴. 06-14 D7 / 06-15 L2 결정 정확함.

→ **잇다 시사점**: 콘텐츠 마케팅을 부수가 아닌 **핵심 자산**으로. `forest.html` 정비 (B4) + 마케팅·카피라이터 위임 콘텐츠 시드 30+개가 다음 라운드 최우선.

### 발견 3: **케어링 path = "다음 단계 액션 카드" 패턴이 universal** — Empathy·Help Texts·Cake 다 채택

사별·케어 사용자는 인지 부담이 극도로 높음. "선택지 많이"보다 "다음 한 가지 명확히"가 압도. 헌장 "시스템이 권하지 않음"과 미묘한 긴장 — **단, 사용자가 path를 선택한 후엔 가이드가 친절함**.

→ **잇다 시사점**: 케어 path 안에서는 "오늘의 다음 한 가지" 카드 OK (헌장 위배 아님 — 사용자가 path를 선택한 후의 가이드). 유언 path는 yes/no로 첫 마찰 ↓.

---

## 8. 의도적으로 안 베낀 것 (헌장 일관)

| 안 베낄 것 | 출처 | 이유 |
| :-- | :-- | :-- |
| AI 부고문 / AI 부활 / 음성 avatar | Empathy · HereAfter AI | 잇다 추모 보류 헌장 + YMYL 리스크 |
| 법률 자동화 / 변호사 검토 강조 | Trust & Will | 잇다 차별점 = 관계 자동화 (망고하다와 분리 핵심) |
| 좋아요 수 / 댓글 수 카운터 | (해당 없음 — 어느 서비스도 안 함) | 헌장 과시·경쟁 0 |
| celebration of life / 추모 페이지 | Cake | 헌장 추모 보류 |
| "Deputies(대리인)" 용어 | Everplans | 한국 정서에 차갑다. "함께 보는 사람"으로 |
| B2B2C 의존 BM | Empathy · Cake (Foundation Partners) | 06-15 L2에서 네이버 카페 acquisition 1순위. B2B는 Q4 분기 게이트 이후 |
| 컨시어지 사람 상담 | Cake · Empathy Care Manager | 운영비 폭증. 잇다 3인 팀 부적합. 도구·콘텐츠 먼저 |

---

## 9. 헌장 일관성 확인

- ✅ **과시·경쟁 0** — 베낄 부분에 카운터·뱃지·랭킹 0
- ✅ **YMYL** — 법률·의료 단정 X. Trust & Will 법률 무게는 명시 배제
- ✅ **추모 보류** — HereAfter AI / Cake celebration / Empathy AI 부고문 명시 배제
- ✅ **시니어 가독성** — Help Texts 텍스트 채널 / Everplans 슬롯 prompt / Empathy 단계별 to-do 가독성 강함
- ✅ **디자인 토큰** — 임의 hex 0. 본 문서는 카피·동선 위주
- ✅ **시스템이 권하지 않음** — 추천에서 시스템이 path 골라주는 패턴은 모두 배제. 사용자 선택 후 가이드만 OK

---

## 10. 다음 라운드 위임 — 단일 원천

### 즉시 (Two-way door, PE 위임 가능)
1. **`index.html` 진입 카드 2개** — `two-faces-one-code-2026-06-15.md` §3 + 본 문서 §5.1·5.2 카피 통합
2. **`care-dashboard.html` 4 카드 분기** — 본 문서 §5.2 (B2 결정 후)
3. **`reflection.html` step 0 yes/no** — 본 문서 §5.1 (B1 결정 후)
4. **`invite.html` 5인 슬롯 카피** — 본 문서 §5.3 (B3 결정 후)

### 다음 라운드 (마케팅 + 카피라이터 위임)
5. **`forest.html` 콘텐츠 허브 재설계** — 본 문서 §5.4 (B4 결정 후) + 콘텐츠 시드 30+개 인벤토리
6. **콘텐츠 시드 30+개 주제 정리** — Cake/Modern Loss article 카테고리 참고, 한국 정서 매핑

### 사장님 결정 필요 (One-way door 아닌 카피 결정 5개)
- 본 문서 §6 결정 표 B1~B5

### 의도적으로 안 함
- ❌ AI 기능 추가 (추모/부활 영역)
- ❌ 법률 자동화 깊이 (Trust & Will 방향)
- ❌ B2B2C BM 즉시 도입 (네이버 카페 1순위 결정과 충돌)

---

## 11. 이 문서가 닿을 후속 문서

- `docs/strategy/two-faces-one-code-2026-06-15.md` §12 — 케어링 진입 카피 결정에 본 문서 §5.2 input
- `docs/strategy/service-framework-2026-06-15.md` §6.2 E4 (forest ↔ info) — 본 문서 §5.4가 통합 근거 보강
- (신규, 다음 라운드) `docs/marketing/content-seed-inventory-2026-06-W.md` — 콘텐츠 30+개 (Cake/Modern Loss 카테고리 매핑)
- `docs/benchmark/shukatsu-net.md` — Lantern 2024 종료 신호 추가 (BM 다각화 가설 보강)

---

## 부록: 출처 (단일 원천 검증)

- Cake: https://www.joincake.com/ · https://corporateinsight.com/end-of-life-planning-platforms-cake/ · https://www.huffpost.com/entry/cake-app-death_n_564104f7e4b0b24aee4b5e07
- Empathy: https://www.empathy.com/ · https://techcrunch.com/2024/03/12/empathy-berevement-death-ai/ · https://hospicenews.com/2025/05/30/bereavement-care-company-empathy-raises-72m-in-series-c-round/ · https://www.fastcompany.com/90622540/a-family-death-can-mean-a-nightmare-of-forms-this-app-helps-you-through-the-process
- Everplans: https://www.everplans.com/ · https://www.everplans.com/pricing · https://www.seniorliving.org/finance/estate-planning/everplans/
- Trust & Will: https://trustandwill.com/ · https://www.cnbc.com/select/trust-will-review/ · https://trustandwill.com/get-started
- HereAfter AI: https://www.hereafter.ai/ · https://www.freethink.com/technology/chatting-with-my-digital-twin
- Modern Loss: https://modernloss.com/ · `docs/benchmark/modern-loss.md` (기존 잇다 문서)
- Help Texts: https://helptexts.com/ · https://helptexts.com/packages/ · https://hospicenews.com/2023/01/09/grief-coach-rebrands-to-help-texts-launches-health-care-worker-support-service/
- Lantern (종료): https://www.lantern.co/ · https://techcrunch.com/2021/01/12/lantern-is-a-startup-looking-to-ignite-a-conversation-about-how-to-die-well/

[추정] 표기 부분: 잇다 카피 안 (§5)은 사장님 컨펌 전 가설. trade-off는 본 문서 §6 결정 표 참조.
