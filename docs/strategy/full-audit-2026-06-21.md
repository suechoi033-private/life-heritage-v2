# 잇다 서비스 전수검사 — 2026-06-21

> 사장님 발의: "site framework, user flow 보고 전수검사를 해야 할 것 같아."
> 기준: `service-framework-2026-06-15.md` + `two-faces-one-code-2026-06-15.md` + `decisions-2026-06-15-lemon-cafe.md` + CHARTER
> 검사 범위: 모든 *.html 페이지(39개) + js/nav.js, auth.js, sw.js + 동선(flow)
> 검사 기간: 2026-06-21 (06-21 F1 index.html 진입 카드 2개 구현 직후)

---

## 요약

**🔥 즉시 수정 필요 (3건) / ⚠️ 다음 라운드 (4건) / 💡 참고 (2건)**

| 우선순위 | 건수 | 누적 위험도 |
|---------|-----|----------|
| 🔥 즉시 | 3 | 회원 진입 카드 path 무시, 비회원 톤 위반, legacy 매핑 활용 |
| ⚠️ 다음라운드 | 4 | orphan 페이지, 중복 페이지, note 위계, entry_path 미정착 |
| 💡 참고 | 2 | 진입점 인벤토리, 헌장 일관성 |

**핵심 발견 3가지**:
1. **onboarding.html 🔥 path 파라미터 무시** — index.html?path=will|care를 받아도 일반 카피 노출 (사장님 발견과 동일 패턴)
2. **비회원 onboarding.html 진입 화면 톤 위반** — "정답은 없어요" 비회원 화면에서 남아있음 (헌장 §3 회피 톤)
3. **welcome.html entry_path 정착 1회 한정** — index.html 비회원 카드에서 localStorage 저장하나, onboarding.html을 경유하지 않으면 미정착 (현재 경로 깨짐)

---

## 1. 진입점(Entry Points) 전수 인벤토리

### 비회원 진입점 (6개)

| # | 화면 | 첫 페이지 | 파라미터 | 다음 흐름 | 상태 | 비고 |
|---|------|---------|---------|---------|------|------|
| 1 | 랜딩 | `index.html` (비회원) | 없음 | 두 진입 카드 노출 | ✅ | 06-21 F1 구현됨 |
| 2 | 네이버 카페 will | `index.html?path=will` | `?path=will` | 유언 진입 카드 강조 | ❌ | 파라미터 무시됨 (아래 E1) |
| 3 | 네이버 카페 care | `index.html?path=care` | `?path=care` | 케어 진입 카드 강조 | ❌ | 파라미터 무시됨 (아래 E1) |
| 4 | 초대 링크 | `invite-answer.html` | `?code=` | 비회원 1줄 답 → 가입 게이트 | ✅ | 06-14 작동 확인 |
| 5 | 콘텐츠 SEO | `content-detail.html?id=` | `?id=` | 비회원 글 읽기 → 댓글 시 가입 | ✅ 부분 | 경로 명확 |
| 6 | about.html | `about.html` | 없음 | 헌장·이야기 → 가입 CTA | ✅ | 회피 안내 |

### 회원 진입점 (2개)

| # | 화면 | 첫 페이지 | 다음 흐름 | 상태 | 비고 |
|---|------|---------|---------|------|------|
| 7 | 회원 홈 | `index.html` (회원) | 약속/시리즈 카드 우선 | ✅ | entry_path 분기 미구현 |
| 8 | 라이프 시리즈 | `reflection.html` | 8단계 → 결과 | ✅ | |

### 인증 흐름 (3개)

| # | 화면 | 역할 | 상태 |
|---|------|-----|------|
| 9 | `signup.html` | 회원가입 | ✅ |
| 10 | `login.html` | 로그인 | ✅ |
| 11 | `welcome.html` | 가입 직후 환영 | ⚠️ entry_path 정착만 의존 |

---

## 2. 카드/CTA → 다음 화면 일관성 검사

### 🔥 발견 E1: onboarding.html path 파라미터 무시 (사장님 발견과 동일)

| 파일 | 라인 | 카드 카피 | 링크 | 실제 행동 | 약속 | 현상 |
|------|-----|---------|------|---------|------|------|
| `index.html` | 625 | "한 줄 적어볼게요" | `./onboarding.html?path=will` | 유언 카드 강조 | ✅ 약속됨 | ❌ 무시: 일반 intro 노출 |
| `index.html` | 632 | "오늘 안부 시작" | `./onboarding.html?path=care` | 케어 카드 강조 | ✅ 약속됨 | ❌ 무시: 일반 intro 노출 |

**원인**: onboarding.html이 URL 파라미터 `?path=` 미구현. 로컬스토리지(`itda:entry_path`)로 대체 기대했으나, index.html 비회원 카드는 onboarding.html 진입 후 실제 가입 게이트(welcome.html)에만 정착 → 경로 중간 절단.

**영향**: 카페 검색자의 기대 카피(유언 또는 케어 관점)가 일반 "지금, 어디에 마음이 머무세요?" 화면으로 전환 → 첫인상 부조화 → 가입률 저하 위험.

**결정과 충돌**: 
- `two-faces-one-code-2026-06-15.md` §4 "URL 파라미터(?path=)도 폴백으로 수용"
- `decisions-2026-06-15-lemon-cafe.md` L2 "카페 답글 → 잇다 클릭한 사람에게 잇다 진입 화면은 카페 검색어와 동일한 카드(유언/케어링) 우선"

---

### ⚠️ 발견 E2: 비회원 onboarding.html 진입 화면 톤 위반

| 파일 | 라인 | 텍스트 | 헌장 항목 | 발견 |
|------|-----|--------|---------|------|
| `onboarding.html` | 119 | "정답은 없어요." | CHARTER §3 회피(ambiguity) 톤 | ❌ 비회원 화면에서 노출 |
| `ceremony.html` | 133 | "정답은 없어요." | 동일 | ❌ 동일 위반 |

**원인**: index.html 비회원 진입 카드가 의도적으로 "정답은 없어요" 제거(`index.html:623 주석`) → onboarding.html이 도입 문구 다시 노출.

**영향**: 헌장 "정답은 없어요" 톤은 자기성찰 시리즈 중도(reflection.html)에서 사용자가 갈등할 때 용법 → 비회원 첫인상에서는 "임의 선택 OK" 톤이 약함. 대신 "한 줄로 시작" 톤 강조 취지 깨짐.

---

### 💡 발견 E3: welcome.html entry_path 정착 1회 한정 (설계 한계)

| 경로 | 흐름 | entry_path 정착 | 비고 |
|------|------|---------------|------|
| index 비회원 카드 → onboarding? → signup → welcome | ✅ | ✅ localStorage → profiles | 예상 흐름 |
| index 비회원 카드 → **직접 signup** (onboarding 스킵) | ❌ | ❌ entry_path 미정착 | 현재 버그 |
| index 비회원 카드 → onboarding → **직접 가입** (welcome 스킵) | ❌ | ❌ entry_path 미정착 | 현재 버그 |

**원인**: welcome.html line 422 조건 `.is('entry_path', null)` — 첫 정착 이후 덮지 않음(의도). 그런데 두 진입 카드의 localStorage 값이 welcome.html에만 의존하고, onboarding.html → signup.html 경로는 entry_path를 전달 메커니즘 없음.

**영향**: "실제 사용자는 onboarding.html을 거칠까?" 검증 필요. 만약 많은 사용자가 스킵하면 entry_path 미정착 → 회원 index.html 분기 로직 작동 불가 → "다른 path 활성화 카드" 기능 무의미.

---

## 3. 데드엔드(Dead End) 검사

### 🔥 발견 E4: 회원 index.html entry_path 분기 미구현

| 상황 | 현재 | 기대 | 간극 |
|------|-----|------|------|
| 회원 홈 진입 | 시리즈 + 오늘 질문 + 장례희망 카드 (3개) | entry_path='will'면 유언 관련 카드 우선 노출 | 미구현 |
| | | entry_path='care'면 케어 대시보드 카드 우선 노출 | 미구현 |

**원인**: welcome.html에서 profiles.entry_path 저장(`line 420`)하나, index.html 회원 카드 렌더 시점(`line 531~`)에서 entry_path 로드 없음.

**결정과 충돌**: 
- `two-faces-one-code-2026-06-15.md` §4 "회원 분기 로직 — entry_path 기준 우선 카드 노출"
- `decisions-2026-06-15-lemon-cafe.md` L7 "회원 분기 로직"

---

### ⚠️ 발견 E5: 회원 다른 path 활성화 카드 미노출

| 경로 | 현재 상태 | 기대 | 비고 |
|------|---------|------|------|
| 유언 path 활성 | 라이프·약속 중심 | 마이/라이프에서 "케어링 시작" 카드 | 미구현 |
| 케어 path 활성 | 케어링 탭 | 마이에서 "유언 시작" 카드 | 미구현 |

**결정과 충돌**: `two-faces-one-code-2026-06-15.md` §3 "마이 탭에 '다른 path 활성화 카드'"

---

## 4. path 파라미터 무시 검사 (E1 심화)

### 확인된 path 파라미터 사용처

| 파일 | 파라미터 | 수신처 | 처리 여부 |
|------|---------|--------|----------|
| `index.html` | `?path=will\|care` | `onboarding.html?path=` | ❌ 무시 |
| `welcome.html` | `?path=` (폴백) | URL 폴백 읽음 | ✅ 부분 |
| `ask.html` | `?next=` | 리다이렉트 | ✅ |
| `care-dashboard.html` | `?subject=` | 대상 ID | ✅ |
| `signup.html` | `?next=` | 가입 후 리다이렉트 | ✅ |

**한 줄 요약**: index.html의 두 새 진입 카드가 onboarding.html?path를 보내지만, onboarding.html이 수신 안 함 = **새 기능 도입 후 동선 미연결**.

---

## 5. legacy 페이지 정리 상태 (service-framework §3 실행 진척도)

### 삭제 대상 (§6.1 무손실 정리)

| 파일 | 참조 수 | 상태 | 비고 |
|------|--------|------|------|
| `story.html` | 0 | 🔥 삭제 가능 | orphan (admin.html은 story.html?id= 사용만 남음 — 폴드 필요) |
| `stories.html` | 0 | 🔥 삭제 가능 | orphan |
| `note.html` | 1 | ⚠️ 삭제 블로킹 | `/note/*`의 인트로 역할 (info/* FAQ에서 참조) — 제거 후 리다이렉트 필요 |
| `prototype-forest.html` | 0 | 🔥 삭제 가능 | orphan |
| `footprint-preview.html` | 0 | 🔥 삭제 가능 | orphan |
| `care.html` | 다수 | ⚠️ 이중 참조 | admin(670), root(677,681), onboarding(418,433), welcome(439), care-dashboard(305), nest(185,187,255,268), login(110), signup(116) 모두 `care.html` 사용. `care-dashboard.html`로 통합하면 8개 파일 갱신 필요 |
| `my.html` | 1 | ⚠️ 이중 참조 | admin만 참조 (root.html로 통합하면 admin 1개 파일 갱신) |
| `questions.html` | 1 | ⚠️ 이중 참조 | ask.html line 399에서 "지난 질문 보기" 링크. ask.html 통합 필요 |

**SW 캐시 현황** (sw.js line 5~39):
- APP_SHELL에 story/stories/note 미포함 ✅ (이미 clean)
- care/my 미포함 ✅
- care-dashboard/care-emergency/nest는 포함 ✅

**결론**: orphan 5개 + care(8개 파일 참조 정리 필요) + my(1개) + questions(1개) = 최소 3단계 정리.

---

## 6. 헌장 위배 가능 카피 검사

| 파일 | 라인 | 텍스트 | 조항 | 평가 |
|------|-----|--------|------|------|
| `onboarding.html` | 119 | "정답은 없어요" | CHARTER §3 회피 톤 | ❌ 비회원 노출 (E2) |
| `ceremony.html` | 133 | "정답은 없어요" | 동일 | ❌ 동일 |
| 모든 페이지 | 전체 | 과시·경쟁 톤 | CHARTER §3 | ✅ 검출 안 됨 |
| 모든 페이지 | 전체 | YMYL 단정 | CHARTER §3 | ✅ 유언 페이지는 "법적 효력" 표현 0 |
| 모든 페이지 | 전체 | 추모 노출 | CHARTER §3 | ✅ 검출 안 됨 |

---

## 7. invite-answer.html 패턴 재현 가능성

### 비회원 1줄 답 → 가입 게이트 패턴 (06-14 작동)

```
invite-answer.html 비회원 → textarea 입력 → "가입하기" 
  → signup.html → welcome.html 
  → localStorage('itda:invite_pending_answer') 읽어 정식 저장
  → index.html 회원 (home.js:404~438)
```

**재현 가능 여부**: 
- ✅ 진입 카드 2개(will/care)에 동일 패턴 적용 가능 (현재 onboarding.html이 장벽)
- ✅ localStorage 메커니즘은 entry_path로 검증 중
- ❌ onboarding.html이 경유하지 않으면 경로 절단

---

## 8. 우선순위별 실행 로드맵

### 🔥 즉시 (1주일 내)

| # | 과제 | 파일 | 동작 | 검증 |
|----|------|------|------|------|
| 1 | onboarding.html path 파라미터 수신 구현 | `onboarding.html` | URL 파라미터 `?path=will\|care` 읽어 Q1 기본값 설정 | `?path=will` 접근 시 유언 경로 자동 선택 |
| 2 | onboarding.html 비회원 톤 수정 | `onboarding.html` line 119 | "정답은 없어요" → "한 줄로 시작하면 돼요" | 비회원 intro 노출 시 헌장 일관 확인 |
| 3 | 회원 index.html entry_path 분기 구현 | `index.html` | 로그인 시 profiles.entry_path 로드 → 카드 순서 재배열 | entry_path='will'일 때 유언 카드 우선 노출 |

### ⚠️ 다음 라운드 (2~3주)

| # | 과제 | 파일 | 동작 | 검증 |
|----|------|------|------|------|
| 4 | orphan 5개 + care/my/questions 정리 | `*.html` + `admin.html` + `sw.js` | 삭제 + 참조 갱신 + SW 캐시 | APP_SHELL 라인 수 감소 |
| 5 | 다른 path 활성화 카드 추가 | `root.html` `seed.html` | 마이/라이프에서 다른 path 시작 CTA | entry_path와 실제 경로 일관성 |
| 6 | note/* 위계 단순화 | `note/` 폴더 | 라이프 탭 안에 단일 진입 카드 "유언 시작하기" | will-builder와 다른 note 페이지의 동선 명확 |
| 7 | welcome.html entry_path 정착 경로 다원화 | `onboarding.html` `signup.html` | onboarding.html의 Q1 답을 signup.html로 전달 → welcome.html 정착 | 모든 경로에서 entry_path 정착 확인 |

### 💡 참고 (검증용 / 문서화)

| # | 항목 | 현황 |
|----|------|------|
| A | 진입점 6개 전수 문서화 | 본 감사서 §1 완성 |
| B | 헌장 일관성 평가 | 본 감사서 §6 완성 |

---

## 9. 부록 A: 페이지 인벤토리 재확인

### 총 페이지 수

- 루트 목록: 39개 (about, ask, beta, ..., write)
- /note/: 5개 (digital, directive-checklist, envelope, will, will-builder)
- /info/: 7개 (advance-directive, choosing-charnel-house, funeral-prepay, long-term-care, nursing-home, silver-town-guide, well-dying-guide)
- **총 51개** (service-framework "50+" 확인)

### 살아있음 분류

| 분류 | 수 | 목록 |
|-----|---|------|
| 활성 (참조 O, 사용 O) | 38 | index, seed, nest, forest, root, reflection, ask, ... 대부분 |
| 이중 활성 (legacy 매핑 O, 신규 매핑 O) | 3 | care↔care-dashboard, my↔root, questions↔ask |
| orphan (참조 0) | 5 | story, stories, note.html, prototype-forest, footprint-preview |
| **합계** | **51** | |

---

## 10. 부록 B: 코드 위치 요약

### 🔥 즉시 수정 항목 코드 위치

| 발견 | 파일 | 라인 | 코드 |
|-----|------|-----|------|
| E1 path 무시 | `index.html` | 625, 632 | `href="./onboarding.html?path=will"` 등 |
| E1 수신 미구현 | `onboarding.html` | 133~724 | URL 파라미터 읽기 로직 없음 |
| E2 톤 위반 | `onboarding.html` | 119 | `"정답은 없어요."` |
| E2 톤 위반 | `ceremony.html` | 133 | `"정답은 없어요."` |
| E4 분기 미구현 | `index.html` | 531 | `if (user) { ... }` 진입 시 entry_path 미로드 |

### ⚠️ 다음 라운드 항목 코드 위치

| 발견 | 파일 | 라인 | 동작 |
|-----|------|-----|------|
| E3 entry_path 정착 경로 다원화 | `welcome.html` | 410~426 | `profiles.entry_path` 정착 로직 현재 위치 |
| 삭제 대상 | `story.html` | 전체 | 참조 0 |
| 삭제 대상 | `care.html` | 전체 | 참조 다수 (8개 파일) |
| legacy map | `nav.js` | 22~31 | LEGACY_ACTIVE_MAP 정리 (sw.js APP_SHELL과 연동) |

---

## 11. 헌장·결정 교차 참조

### 이 감사서가 발견한 결함과 헌장/결정의 충돌

| 결함 | 헌장 항목 | 결정 문서 | 충돌 내용 |
|-----|---------|---------|---------|
| E1: path 무시 | — | two-faces-one-code §4, decisions L2 | "URL 파라미터 수용" 미구현 |
| E2: 톤 위반 | CHARTER §3 회피 톤 | — | "정답 없음" 비회원 노출 위반 |
| E3: entry_path 경로 부족 | — | two-faces-one-code §6 | "3개 경로에서 entry_path 정착" 미달성 |
| E4: 분기 미구현 | — | two-faces-one-code §3, decisions L3 | "회원 분기 로직" 미구현 |
| E5: 다른 path 카드 미노출 | CHARTER §3 "시스템 권유 X" | two-faces-one-code §2 | "마이에서 다른 path 활성화 카드" 미구현 |

---

## 12. 사장님 다음 행동

1. **즉시 승인 필요 (🔥 3건)** — 위 §8 로드맵 첫 번째 블록
2. **06-21 F1 이후 다음 PE 라운드 타이밍 확인** — onboarding.html 수정이 welcome.html entry_path 정착과 함께 작동하는지 통합 검증 필요
3. **M1(카페 운영자 답글) 시작 전 E1 수정 완료 필수** — decisions L2 "카페 검색자가 기대하는 카드 우선" 구현 필요 시점

---

**작성**: 2026-06-21  
**기준**: service-framework-2026-06-15.md + two-faces-one-code-2026-06-15.md + decisions-2026-06-15-lemon-cafe.md + CHARTER  
**검사 범위**: 39개 루트 HTML + 5개 note/* + 7개 info/* + nav.js, auth.js, sw.js  
**상태**: 진행 중 (이 감사서는 스냅샷이며, 실시간 업데이트 불가능)
