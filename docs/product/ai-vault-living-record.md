# AI 디지털 보관함 × 생전기록 — 기술 설계서 (PE)

> 작성: Product Engineer · 2026-06-07
> 출처 문제: 라이브 에세이 `7591c5d9` "유서가 아니라, 비밀번호 목록을 먼저 썼습니다"
> 단계: **구현 아님 — 설계 제안.** 메인 세션이 전략 산출물과 합쳐 결정한다.
> 범위: "어떻게 만드나"(아키텍처·보안·AI 파이프라인·MVP 슬라이스). 방향·BM·벤치마크는 전략 에이전트 담당.

---

## 0. 한 문장 요약

에세이의 발견 — **"정보를 적다 보면 마음을 한 줄 얹고 싶어진다. 진짜 그리운 건 정보가 아니라 뜻이었다"** — 을
제품 구조로 옮긴다: **항목(정보) + 마음 한 줄**을 한 단위로 묶고, **정보 입력을 마음 기록의 트리거**로 쓴다.
이미 가진 `note/digital.html`(8 카테고리 textarea, localStorage)을 **항목 단위 구조 + 종단암호화 + AI 한 명**으로 진화시킨다.
추모(memorial)는 보류 상태이므로 **건드리지 않는다.** 이 설계는 "자기준비 허브(self.html) → 디지털 보관함"의 살아있는 흐름 안에서만 동작한다.

---

## 0.5 전체 기능과의 조화 — 새 제품이 아니라 기존 허브의 척추 (창업자 지적 2026-06-08)

에세이가 가리키는 세 가지는 **이미 `self.html`("나의 삶 정리") 허브에 카드로 존재**한다. 새로 짓는 게 아니라 흩어진 카드를 꿰는 일이다.

| self.html 카드 | 상태 | 에세이 대응 |
|---|---|---|
| 디지털 자산 노트(`note/digital.html`) | **main 미배포(404)** | 디지털 보관함 = 정보 |
| 가족에게 남기는 메시지(`note/will.html`) | 라이브 | 생전기록 = 마음(일부) |
| 가족 잠금 공유(`#` 준비중) | stub | **봉투/전달** = 수신자 지정·사후공개 |

- **확정(2026-06-08): 제품 정체성 = "가족에게 건네는 봉투(전달·수신자 지정)".** 정적 vault가 아니라 전달이 심장. → `vault_recipients`/`가족 잠금 공유` 카드가 부가기능이 아니라 중심축이 된다.
- **"마음"은 한 카드의 기능이 아니라 허브 전체를 관통하는 실이다.** 디지털 노트·가족 메시지·일기·질문에 흩어진 "마음 한 줄"을 같은 모델(`heart`)로 통일해 (E)에서 한 권으로 엮는다.
- **배포 부채(별도 처리 필요):** `note/digital.html`·`note/directive-checklist.html`이 worklog엔 2026-06-07 작성으로 기록됐으나 **main에 미머지 → 라이브 404.** MVP 작업과 함께 배포 경로 정리.

---

## 1. 데이터 모델

### 1.1 설계 원칙
- 에세이의 핵심 = **마음은 항목 옆에 붙는다.** 그래서 마음(`heart`)은 별도 테이블이 아니라 **항목 row의 필드**다.
- 현재 digital.html은 카테고리당 textarea 1개(자유 한 덩어리). 이걸 **카테고리 → 항목 N개** 2단으로 쪼갠다.
  - 트레이드오프: 구조화하면 AI 빈칸 메우기·사진 추출·사후 가족 공개가 항목 단위로 가능해진다. 대신 입력 마찰이 늘 수 있어 **자유 textarea 입력도 계속 허용**하고(레거시 호환), 구조화는 AI/선택 기능으로 둔다.

### 1.2 테이블: `vault_items` (제안)

기존 명명 관습(`care_prescriptions` 등 snake_case, `gen_random_uuid()`, `created_at timestamptz default now()`, RLS)을 따른다.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `user_id` | uuid NOT NULL → `profiles(id)` | 소유자. RLS 기준. |
| `category` | text NOT NULL | `bank/insurance/phone/accounts/subscription/property/debt/message` (기존 8 키 그대로) + 향후 확장 |
| `label` | text | 항목 이름. 예: "○○은행 주거래 통장" — **비민감**(검색·목록 표시용) |
| `info_plain` | text | **비민감 정보만** 평문 허용. 예: "통장 위치 = 안방 서랍", 보험사명, 연락처. (선택지 a) |
| `secret_ciphertext` | text | **민감 정보의 종단암호문**(base64). 비번/잠금번호 등. 서버·운영자 복호 불가. (선택지 b) |
| `secret_iv` | text | AES-GCM IV(base64) |
| `sensitivity` | text NOT NULL default `'normal'` | `normal` / `sensitive`(암호화 대상) / `hint_only`(실값 금지, 위치/힌트만) |
| `heart` | text | **"마음 한 줄"** — 이 항목에 얹은 뜻. 비민감 가정(서버 평문). 에세이의 그 한 줄. |
| `ai_prompt` | text | AI가 생성한 "이 돈은 어떤 마음이었어요?" 질문(저장해 재노출) |
| `source` | text default `'manual'` | `manual` / `voice` / `photo` / `ai_suggest` (입력 출처 추적 → AI 신뢰 UX) |
| `confirmed` | bool default true | AI/사진 추출값은 `false`로 시작, 사용자 확인 시 true (안전장치) |
| `sort_order` | int default 0 | |
| `created_at` / `updated_at` | timestamptz | |

> **핵심 트레이드오프 기록**: `heart`와 `label`은 평문(서버가 읽음) — 그래야 AI 회고록 엮기(E)와 가족 공개가 동작. `secret_*`만 종단암호화 — 그래야 "비밀번호 목록"이 안전. 즉 **한 row 안에서 '뜻=평문 / 비밀=암호문'을 분리**한다. 이것이 에세이의 "정보와 마음" 이중성을 그대로 스키마로 옮긴 것.

### 1.3 테이블: `vault_recipients` (사후 가족 공개 — 옵션, MVP 이후)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid → profiles | 보관함 주인 |
| `recipient_email` | text | 지정 수신자(가족) |
| `recipient_name` | text | |
| `wrapped_key` | text | 보관함 마스터키를 수신자용으로 감싼 암호문(2.4 참조) |
| `release_policy` | text | `manual`(주인이 직접 해제) / `dead_man_switch`(N일 무활동) / `verified_death`(증빙 확인 후 운영 해제) |
| `inactivity_days` | int | dead-man switch 임계(예: 90) |
| `status` | text | `pending` / `armed` / `released` / `revoked` |

### 1.4 마이그레이션 안전
- 이 테이블 생성/적용은 **DB 스키마 변경 = one-way door = 창업자 승인 + 백업 확인 후.** (CHARTER §3)
- localStorage → 서버 마이그레이션은 **읽고 합치기**만(기존 평문 키 `itda:digital_note:{uid}`를 카테고리별 `info_plain`으로 흡수). 기존 데이터 파괴 0.

---

## 2. 보안 아키텍처 — 이 제품의 사활

에세이 주제가 **'비밀번호 목록'**이다. 신뢰가 한 번 무너지면 끝(CHARTER §2.4). 평문 저장은 절대 없다.

### 2.1 세 선택지 비교

| 방식 | 서버가 보는 것 | 장점 | 단점 | 잇다 적용 |
|---|---|---|---|---|
| **(a) 위치/힌트만** | 평문이지만 "비번 자체"가 아님 | 가장 단순·안전. 유출돼도 비번 자체는 없음 | 사용자가 결국 실값을 어딘가 또 적어야 함 | **기본값.** `sensitivity='hint_only'` |
| **(b) 클라이언트 종단암호화(E2EE)** | 암호문만. 운영자도 못 봄 | 실값 보관 가능 + 최고 신뢰("사장님도 못 봅니다") | 패스프레이즈 분실 = 영구복구 불가. AI가 못 읽음(아래 충돌) | **민감필드 전용.** `sensitivity='sensitive'` |
| **(c) 서버 보관 + RLS** | 평문(RLS로 격리) | AI·검색 자유, 구현 단순 | DB 유출 시 비번 노출 = 치명. '비밀번호'에는 부적합 | **비민감 필드(label·info_plain·heart)에만** |

**채택: 필드별 혼합(field-level).** 한 항목 안에서
- `label` / `info_plain` / `heart` → (c) 서버 평문 + RLS (AI가 읽어야 동작)
- 비번·잠금번호 등 진짜 비밀 → (a) 힌트만 받기를 **기본 권장**, 사용자가 굳이 실값을 넣으면 (b) E2EE로 `secret_ciphertext`에 저장.

### 2.2 E2EE 구현 (WebCrypto, 라이브러리 0)
- 키 유도: 사용자 **보관함 패스프레이즈** → `PBKDF2`(SHA-256, 200k iters, per-user salt) → AES-GCM 256 키.
  - salt는 `vault_keys` 테이블에 저장(비밀 아님). 패스프레이즈는 **절대 서버 전송·저장 안 함**(로그인 비번과 별개).
- 암호화: `crypto.subtle.encrypt({name:'AES-GCM', iv}, key, plaintext)` → ciphertext+iv를 base64로 row에 저장.
- 빌드 단계 없음 정책과 호환: WebCrypto는 브라우저 내장, 의존성 0. ESM 모듈 한 개(`js/vault-crypto.js`)로 캡슐화.
- 세션: 패스프레이즈는 입력 후 메모리에서만 키 유지(`CryptoKey`, non-extractable). 새로고침 시 재입력(또는 sessionStorage에 짧게).

> **시니어 현실 체크**: 패스프레이즈 분실 = 영구 손실은 시니어에게 가혹하다. 그래서 **(a) 힌트만을 강하게 기본값으로**, E2EE 실값은 "원하면" 경로로 둔다. "비밀번호를 여기 직접 안 적어도 됩니다. **어디에 있는지만** 적어도 가족은 찾습니다"가 에세이의 톤과도 맞다.

### 2.3 "AI가 읽어야 함" vs "암호화로 못 읽음" 충돌 — 해법

| AI 기능 | 민감필드 필요? | 처리 |
|---|---|---|
| (A) 대화형 입력 | 아니오(구조·라벨만) | 서버 AI OK. 실 비번은 클라가 받아 즉시 암호화, 서버로 안 보냄 |
| (B) 빈칸 메우기 | 아니오(카테고리만 봄) | 서버 AI OK. "주거래은행 적음 → 구독 물어봄"은 **메타데이터만** 보면 됨 |
| (C) 사진→구조화 | 민감(증권번호 등) | **암호화 경계 주의.** 2.5 참조 |
| (D) 마음 트리거 | 아니오(label·heart만) | 서버 AI OK. 비번 절대 안 봄 |
| (E) 회고록 엮기 | 아니오(heart·diary·answers) | 서버 AI OK. `secret_*`는 입력에서 **원천 제외** |

**원칙: AI 입력에 `secret_ciphertext`는 절대 포함하지 않는다.** Edge Function은 평문 필드(label/info_plain/heart)만 받는다.
정말 민감 텍스트에 AI가 필요하면 **클라이언트에서 복호 → 클라가 직접 Anthropic 호출**(서버 우회)하는 별도 경로를 두되, MVP에서는 안 한다(키 노출·비용·복잡도).

### 2.4 사후 가족 공개 (dead-man switch / 지정 수신자 + 지연공개)

E2EE와 "사후 가족이 봐야 함"은 충돌한다(주인만 키를 안다). 해법 = **봉투 암호화(envelope)**:
- 보관함 마스터키로 민감필드 암호화.
- 마스터키를 **수신자(가족)용으로 한 번 더 감싼다**(`wrapped_key`). 감싸는 방식 두 안:
  1. **운영 escrow(MVP 현실안)**: 마스터키를 분할(Shamir 2-of-3: 주인·가족·잇다)하거나, 가족 지정 시 별도 키로 감싸 보관. 사망 증빙 확인 후 운영이 가족 몫을 전달. → 신뢰는 잇다에 일부 의존(완전 zero-knowledge 아님). **투명하게 고지.**
  2. **순수 E2EE(이상안)**: 가족의 공개키로 wrap. 가족도 잇다 계정+키쌍 필요. 시니어·가족 모두 키관리 = 비현실. **MVP 제외.**
- 트리거:
  - `dead_man_switch`: `inactivity_days` 무로그인 → 경고 알림 수회 → 미응답 시 `armed`. (오발동 방지가 사활. 충분한 유예·다중 알림.)
  - `verified_death`: 가족이 사망 증빙 제출 → 운영 검토 → 해제. (가장 안전, 수동 비용.)
- **이 전체는 MVP 이후.** one-way door(법·신탁·계정승계) 성격이라 창업자·법률 감수 필수(YMYL 인접).

### 2.5 민감 사진(C) 경계
- 보험증권·카드 사진은 **민감**. 처리 후 **원본 즉시 폐기**(care-rx의 30일 자동삭제 패턴 차용, 또는 분석 직후 삭제).
- 추출된 증권번호·카드 일부 = `sensitive` → E2EE. 보험사명·연락처 = 비민감 → 평문.
- 멀티모달 처리 중 base64는 Edge Function 메모리에만 존재, **저장 안 함**(ocr-memo와 동일: "전사만, 저장 안 함").

### 2.6 인프라 안전
- 모든 vault 테이블 RLS = `user_id = auth.uid()`(care_prescriptions 패턴). 쓰기 중 AI 결과만 service_role.
- 사진 버킷은 **private**(`public:false`) + 경로 `{uid}/vault/...`(기존 media-upload 관습).
- Anthropic 호출은 **반드시 Edge Function 경유**(JWT 검증 → 키 남용 방지). 키를 프런트에 절대 노출 안 함. (기존 analyze-rx/ocr-memo와 동일.)

---

## 3. AI 파이프라인 (Supabase Edge Function + Claude)

### 3.0 모델 선택 & 단가 (2026-06 공식 확인)

| 모델 | 입력 $/Mtok | 출력 $/Mtok | 용도 |
|---|---|---|---|
| Claude Haiku 4.5 | $1 | $5 | (B)빈칸 제안, (D)마음 질문 — 짧고 잦음 |
| Claude Sonnet 4.6 | $3 | $15 | (A)대화 구조화, (C)사진 멀티모달, (E)회고록 — 품질 중요 |
| Claude Opus 4.8 | $5 | $25 | 회고록 최종 윤문 등 고품질 한정 |

- 기존 함수가 이미 `claude-sonnet-4-6`을 쓴다 → **일관성 위해 Sonnet 4.6 기본**, 경량 작업만 Haiku 4.5로 내려 비용 절감.
- 비용 감각: (D) 마음 질문 1회 ≈ 입력 300 + 출력 60 토큰 ≈ Haiku로 **0.0006달러 미만**. 사실상 무시 가능. (E) 회고록은 입력이 커도 수 센트.
- 절감: 공통 프롬프트는 prompt caching(캐시읽기 = 입력가 10%), 대량 비실시간은 Batch(-50%).
- 호출 규약: `POST https://api.anthropic.com/v1/messages`, 헤더 `x-api-key` + `anthropic-version: 2023-06-01`(기존과 동일). 시크릿 `ANTHROPIC_API_KEY`(이미 존재).

### 3.1 공통 패턴 (기존 함수에서 검증된 형태)
모든 함수: ① CORS/OPTIONS ② JWT 검증(`authClient.auth.getUser`) ③ 입력 검증 ④ Claude 호출(`fetchWithTimeout`) ⑤ **JSON-only 출력 + 코드블록 스트립 + 정규식 폴백 파싱**. 실패는 `{error}` + 사용자 친화 메시지. (analyze-rx/ocr-memo와 동일 골격 — 새 발명 최소화.)

### (A) 대화형 입력 — `vault-converse`
- 폼 대신 AI가 **한 항목씩** 부드럽게 묻고 JSON으로 구조화. 시니어 음성입력 정리 포함.
- 음성: 브라우저 `webkitSpeechRecognition`(ko-KR, 의존성 0, 온디바이스) → 텍스트 → Edge로. (Whisper류 별도 STT는 비용·복잡 ↑, MVP 제외.)
- 모델: Sonnet 4.6. 멀티턴은 클라가 대화이력 유지, 매 턴 누적 전송.
- 출력: `{ reply: "다음 질문(존엄·조용한 톤)", extracted: { category, label, info_plain, sensitivity } | null, done: bool }`.
- 프롬프트 개요: "당신은 잇다의 조용한 안내자. 어르신이 디지털 자산을 한 번에 한 가지씩 떠올리게 돕는다. 재촉·과시·이모지 금지. 비밀번호 실값은 묻지 말고 '어디에 있는지'를 묻는다. 한 항목이 정리되면 extracted로 구조화."
- 실패: AI 무응답 시 즉시 기존 textarea 폼으로 폴백(AI는 보조, 입력은 항상 가능).

### (B) 빈칸 메우기 — `vault-suggest`
- 입력한 **카테고리·라벨 메타만**(실값 없이) → "흔히 빠뜨리는 것" 능동 제안. 예: bank 있고 subscription 없음 → "자동이체·구독은 정리해 두셨어요?"
- 모델: Haiku 4.5(짧고 잦음, 초저가).
- 출력: `{ suggestions: [{ category, label, why_short }] }` (최대 3개, 톤 조용).
- 한국 맥락 룰 시드: 통신요금 자동이체, 상조, OTT 구독, 도시가스, 청약통장 등 — 프롬프트에 예시로 주입.
- 안전장치: 제안은 **카드로 보여주고 사용자가 추가/거절**. 자동 생성 저장 금지(`confirmed=false`로만).

### (C) 사진→구조화 — `vault-photo` (analyze-rx 멀티모달 패턴 재사용)
- 보험증권/카드 사진 → Sonnet 4.6 Vision → 보험사·증권번호·연락처 추출.
- 5MB·지원포맷 가드(기존과 동일). base64 저장 안 함, 원본 즉시 폐기(2.5).
- 출력: `{ items: [{ category, label, info_plain, secret_candidate, sensitivity }] }`.
  - `secret_candidate`(증권번호 등)는 서버가 **돌려보내기만** 하고 저장 안 함 → 클라가 받아 E2EE 후 저장.
- 안전: 모든 추출 항목 `confirmed=false` → 사용자가 화면에서 확인/수정 후 저장(ocr-memo의 "확인 후 저장" UX).

### (D) 정보→마음 트리거 — `vault-heart-prompt`
- **에세이의 심장.** 항목 저장 시 AI가 "이 돈은 어떤 마음이었어요?" 류 한 줄 질문 생성 → `heart` 입력 유도.
- 모델: Haiku 4.5. 입력: `{ category, label }`(민감값 제외). 출력: `{ prompt: "한 줄 질문" }`.
- 프롬프트(톤이 전부): "헌장 톤 — 조용함·존엄. 과시·경쟁·이모지·느낌표 금지. 이 항목 뒤에 있을 '마음'을 떠올리게 하는 **나눔명조에 어울리는 한 문장**. 강요 금지, 권유. 추상적 '마음' 대신 **구체적 목적**을 묻는다(창업자 카피 방향 2026-06-08). 예: 통장/계좌 → '이 계좌는 무엇을 위해 만든 거였나요? 목적이 있었나요? (예: 아이 학비, 아내와의 한 달 살기, 손주 여행)'"
- UX: 항목 카드 아래 회색 한 줄로 떠오름. **건너뛰기 항상 가능**(마음은 의무 아님).

### (E) 흩어진 한 줄 엮기 — `vault-memoir` → book-export 연결
- 입력: 보관함 `heart`들 + `diary_entries` + `daily_answers`(book-export가 이미 읽는 소스) → 회고록 초안.
- 모델: Sonnet 4.6(초안), 필요 시 Opus 4.8(최종 윤문) — 비실시간이라 Batch 가능.
- 출력: 장(章) 구조 마크다운 초안. **사용자가 전부 수정 가능**한 draft. book-export.html이 이미 `diary`/`answers`를 모아 PDF로 내보내므로, 거기에 `source: 'vault_heart'` + `source: 'ai_memoir'`를 추가하는 게 최소 통합.
- 안전: AI 초안은 "초안"으로 명시, 발행 전 사용자 승인. 지어내기 금지(있는 한 줄만 엮음).

### 3.2 지연·실패 처리(공통)
- 타임아웃: 텍스트 25s, 사진 55s(기존 값). 초과 시 폼 폴백.
- 모든 AI 결과는 `confirmed=false`/draft로만 들어오고, **사용자 확인 전 확정 저장 없음**. AI는 절대 마지막 결정자가 아니다.

---

## 4. 시니어 UX 제약

- **1열 · 큰 글씨 · 전역 zoom 1.1**(현행 유지). 디자인 토큰만, 인라인 hex 금지.
- **음성 우선**: 각 항목에 마이크 버튼(webkitSpeechRecognition). 타이핑 못 해도 입력 가능(ocr-memo가 겨냥한 그 사용자).
- **AI는 항상 보조, 폼은 항상 살아있음.** AI 실패·거부해도 textarea로 끝까지 입력 가능(현재 digital.html이 그 안전한 바닥).
- **AI 오류 안전장치**: 모든 AI 산출 = 회색 "제안"/"초안" 라벨 + [수정]/[건너뛰기]/[지우기]. 사용자가 손대기 전엔 내 데이터에 안 박힌다.
- **신뢰 카피**: E2EE 항목엔 "이건 잠겨 있어요. 잇다도 못 봅니다." 평문 항목엔 그런 말 안 붙임(거짓 약속 금지).
- **마음은 의무가 아님**: (D) 질문은 권유, 건너뛰기 항상. 압박은 헌장 위반.

---

## 5. MVP 슬라이스 — digital.html을 진화시키는 가장 작은 한 조각

### 지금 (MVP — Two-way door, 프런트 중심)
**"마음 트리거 (D) + 항목별 마음칸"만 먼저.** DB·암호화·새 AI 인프라 없이 에세이의 핵심을 증명한다.
1. `note/digital.html`의 8 카테고리 textarea **아래에 "마음 한 줄" 입력칸 추가** (현재 8번째 message 칸이 이미 마음칸 — 이걸 **모든 카테고리로 확장**).
2. 사용자가 정보를 적으면, 그 칸 아래 회색으로 **(D) 마음 질문 한 줄**을 띄운다.
   - **MVP는 AI 호출 없이 카테고리별 정적 질문 사전**으로 시작(예: bank→"이 계좌는 무엇을 위해 만든 거였나요? 목적이 있었나요? — 예: 아이 학비, 아내와의 한 달 살기"). 비용 0, 지연 0, 톤은 카피라이터가 마감.
   - 저장은 기존 localStorage 구조를 `{ [key]: { info, heart } }`로 확장(하위호환: 기존 문자열이면 `{info}`로 흡수).
3. 데이터/배포 안전: **프런트만 수정 = DB 영향 0.** localStorage만. `sw.js` `CACHE_VERSION` 갱신 + gh-pages 배포 규칙 준수.

→ 이 한 조각이 에세이 가설("정보 입력이 마음 기록을 트리거한다")을 **코드·서버 변경 없이** 20명 검증에 올린다.

### 다음 (검증 후 — one-way door 시작)
4. `vault_items` 테이블 + RLS (창업자 승인·백업 후 마이그레이션). localStorage → 서버 동기화.
5. **(D)를 정적 사전 → `vault-heart-prompt` Edge Function(Haiku)** 으로 교체(톤 다양화).
6. 음성 입력(webkitSpeechRecognition) + (B) 빈칸 메우기(Haiku).
7. 민감필드 E2EE(`js/vault-crypto.js`) + "힌트만" 기본 UX.

### 나중 (인프라·법률 동반)
8. (C) 사진→구조화(Vision), (A) 대화형 입력, (E) 회고록 → book-export.
9. `vault_recipients` + 사후 가족 공개(dead-man switch / 증빙 해제) — **법률·창업자 감수 필수**(YMYL 인접, one-way door).

---

## 6. 데이터/배포 안전 요약 (자기 점검)

- MVP(§5 지금)는 **프런트 + localStorage만** → DB·실데이터 영향 0, two-way door, 팀 실행 후 보고 가능.
- `vault_*` **테이블 생성·마이그레이션은 one-way door** → 창업자 승인 + 백업 확인 필수. 이 문서는 스키마를 **제안만** 하고 적용하지 않는다.
- Edge Function 신규 배포는 **창업자가 직접**(기존 analyze-rx/ocr-memo 주석과 동일: "아직 배포되지 않음, 창업자가 배포"). `ANTHROPIC_API_KEY`는 시크릿.
- 사후 공개·암호화 escrow는 **법률 감수 + 창업자 결정** 전까지 구현 금지.
- 코드 변경 시 `sw.js` `CACHE_VERSION` 갱신, main rebase 후 push, force는 gh-pages만.
- **추모(memorial) 기능은 보류 — 이 설계는 추모와 무관하며 복원하지 않는다.**

---

## 7. 메인 세션에 넘기는 결정 질문

1. **MVP를 §5처럼 "정적 마음질문 + 항목별 마음칸(프런트only)"으로 먼저 낼지** — PE 권고: 예(가장 빠르고 안전한 가설검증).
2. 민감 비밀의 기본을 **"힌트만(a)"으로 둘지, E2EE 실값(b)까지 열지** — PE 권고: a를 기본, b는 옵트인.
3. 사후 가족 공개를 **escrow 현실안**으로 갈지(잇다 신뢰 일부 의존, 투명 고지) **순수 E2EE 이상안**으로 갈지 — PE 권고: 법률 감수 후 escrow. MVP 범위 밖.

---

## 8. 결정 로그 (2026-06-08, 메인 세션)

- ✅ **정체성 = "가족에게 건네는 봉투(전달·수신자 지정)" 확정** (창업자).
- ⏳ 신뢰 모델(위치·힌트 vs 실값 E2EE), MVP 착수 여부 — 논의 중(창업자 dismiss, 결정 보류).
- 📌 마음 질문 카피 = 추상('어떤 마음') 금지, **구체적 목적**으로(창업자). 최종 마감은 카피라이터.
- 📌 발견: 에세이의 세 요소가 이미 self.html 허브 카드로 존재 → 새 제품 아님, 척추.
- 🐞 배포 부채: digital.html·directive-checklist.html main 미배포(404). 별도 처리.
