---
description: 잇다 비회원·답 후 유저 플로우 9 화면 자동 캡쳐 — 라이브 변경 후 사장님 검증용
---

# `/show-flow` — 잇다 유저 플로우 자동 캡쳐

(b) 한 코드 두 얼굴 결정(06-15 L3)의 유저 플로우 화면 9장을 자동 캡쳐해 보여준다.
사장님이 코드 변경 후 "다음 화면 보여줘" 또는 "흐름 확인하고 싶어" 할 때 사용.

**환경 제약**: 클라우드 컨테이너는 외부 도메인(itda.life, *.supabase.co, cdn.jsdelivr.net) 차단.
→ **로컬 정적 서버 + Playwright route mock**으로 우회. Supabase 클라이언트는 stub으로 대체.

**캡쳐 화면 (12장)**:

| # | 화면 | 무엇 |
| :-- | :-- | :-- |
| 01 | index-guest | 비회원 홈 (두 카드 동등) |
| 02 | will-start | 카드 1 클릭 → 한 줄 적기 |
| 03 | care-start | 카드 2 클릭 → 안부 한 줄 |
| 04 | signup-will | 가입 게이트 |
| 05 | welcome-step1 | 회원 환영 Step 1 (이름) |
| 06 | will-typed | 한 줄 적은 상태 |
| 07 | signup-will-full | 가입 게이트 full |
| 08 | welcome-step2 | 환영 Step 2 (자리 선택) |
| 09 | welcome-step3 | 환영 Step 3 (첫걸음 추천) |
| 10 | welcome-step4 | 환영 Step 4 (가족 초대) |
| 11 | welcome-step5 | 환영 Step 5 (잇다 시작하기) |
| 12 | reflection | reflection 시리즈 step 2 자연 진입 |

## 절차

1. **로컬 HTTP 서버 띄우기** (워크스페이스 루트에서):

   ```bash
   pkill -f "http.server 8765" 2>/dev/null; sleep 0.5
   python3 -m http.server 8765 > /tmp/itda-http.log 2>&1 &
   sleep 1
   curl -sf http://localhost:8765/index.html > /dev/null && echo "server up"
   ```

2. **Playwright 모듈 symlink** (한 번만 필요 — 이미 있으면 skip):

   ```bash
   mkdir -p /tmp/node_modules
   ln -sf /opt/node22/lib/node_modules/playwright /tmp/node_modules/playwright 2>/dev/null
   ln -sf /opt/node22/lib/node_modules/playwright-core /tmp/node_modules/playwright-core 2>/dev/null
   ```

3. **캡쳐 스크립트 실행**:

   ```bash
   cd /tmp && node /home/user/life-heritage-v2/scripts/capture-flow.mjs
   ```

   결과: `/tmp/itda-flow-screenshots/01-..09-.png` 9장.

4. **사장님께 전달** — `SendUserFile` 도구로 12장 전송. 캡션에 "잇다 유저 플로우 12장. (b) 한 코드 두 얼굴 검증."

5. **종료**:

   ```bash
   pkill -f "http.server 8765" 2>/dev/null
   ```

## 변경하고 싶을 때

- 추가 페이지: `scripts/capture-flow.mjs` 의 `PAGES` 배열에 한 줄 추가.
- 다른 stub 모드: `stub: 'guest'` 또는 `stub: 'user'`. mock 데이터는 `FAKE_QUESTIONS` / `FAKE_USER` 수정.
- 다른 뷰포트: `VIEWPORT` 상수.
- 다른 base URL: `ITDA_BASE_URL` 환경변수.

## 한계

- Supabase 통신은 stub — 실제 daily_questions/daily_answers 데이터는 mock.
- 실시간 동작(realtime channel·push 알림)은 stub만.
- 라이브 itda.life의 진짜 상태 검증이 필요하면 사장님이 직접 (시크릿 창).

## 의도

매번 사장님이 시크릿 창 → 임시 이메일 → 가입 → DB 확인하지 않아도
**코드상 흐름이 카피 약속을 지키는지 시각 검증** 가능.
06-21 F1 v2 "엉망" 발견 이후, 다음 라운드부터는 자동 캡쳐로 빠르게 사전 검증.
