# 잇다 작업 로그 (Work Log)

모든 세션의 작업을 **날짜별로 한곳에** 쌓는 문서입니다. 무엇을 언제 했는지 한눈에 보기 위한 용도.

**유지 규칙**
- 최신 날짜가 맨 위. 같은 날 안에서는 영역별로 묶어 정리.
- 매 작업 세션은 끝에 **오늘 날짜 섹션**에 자기 작업을 추가한다 (없으면 새로 만든다).
- 출처는 git 커밋. 다른 세션 작업이 빠져 있으면 `git log --date=short` 에서 백필한다.
- 커밋 해시는 추적용 참고. 세부는 커밋 메시지/PR 참조.

**"— 잇다 한 줄" 시그니처 DB 전수 삭제** (사장님 요청)
- 콘텐츠 상세 페이지 하단에 "— 잇다 한 줄" 서명이 여전히 노출되는 문제 발견(스크린샷 제보).
- 기존 `20260531_remove_itda_oneline_signature.sql` 마이그레이션은 미적용 상태였음.
- `contents` 테이블 전 카테고리 대상 `regexp_replace` UPDATE 실행 — 23개 행 정리, 서명 잔존 0건 확인.

**main → 배포** (사장님 요청)
- `claude/hospice-recommendation-design-T31Wg` → `main` fast-forward merge 후 push. GitHub Pages는 main 브랜치 직접 서빙 (gh-pages 브랜치 없음).
- 배포 완료 후 `요양원·요양병원 찾기` 페이지는 `info.html` → "요양원·요양병원" 카드 클릭 시 접근 가능.

---

## 2026-06-11

**릴스용 AI 디지털 트윈(창업자 페르소나) 제작 가이드 + 캘리브레이션 대본 v3** (마케팅 세션, 사장님 대화)
- 사장님 요청: "나와 비슷한 느낌의 사람이 나오는 AI 영상으로 릴스, 진짜 사람처럼 자연스럽게". 결론 = 가상 인물 대신 **창업자 디지털 트윈**(HeyGen Avatar IV + 목소리 복제)으로 결정.
- 자연스러움 90%는 캘리브레이션 촬영(세로 9:16·정면광·단색 배경·평소 말투, 빠르기/감정 변화)에서 결정 → 레시피 정리.
- 페르소나 대본 3안 반복: v1(떠난 이 추모) 폐기 — 추모는 보류·잇다 축 아님 / v2(매일 한 줄 다이어리) 폐기 — 일반 다이어리와 구분 안 됨 / **v3 채택** — "끝을 생각하는 건 잘 살기 위해(North Star) + 혼자 걷지 않는다·먼저 간 사람의 기록이 다음 사람의 길(잇다=잇는다, 해자)" 축.
- 표정·제스처 디렉션 확정: "좋은 상담사의 평온함·안전감"(밝지도 침울하지도 않게) — 잔잔한 중립+옅은 미소, 낮고 열린 손동작. 아바타 표정은 캘리브레이션 원본에서 복제되므로 촬영 시 연기가 핵심.
- 릴스 제작 프롬프트 2종(자동 생성용 / v3 대본 45초 압축본) + Captions 설정 체크 정리.
- 산출물: `docs/content/reels-ai-persona-digital-twin.md` (가이드 + 승인 대본 v3 + 표정·제스처 디렉션 + 릴스 프롬프트 + 폐기안 + 다음 단계). 코드 미수정.

**홈·온보딩 종합 라운드 — 첫 화면 이원화 + G1~G5 통합 결정 카드** (마케터 세션, 사장님 새 의제 + PE QA 합침)
- 사장님 의제 A(첫 화면 이원화) / B(모바일 지면 우선순위) / C("정답은 없어요" 카드 정체)와 PE의 G1~G5(가입 흐름 결정) 분리 시 페르소나 무덤 발생 — 통합 결정 필요.
- 페르소나 매트릭스 가장 어색한 셀: ①사별 후 자기준비 50대+ × 신규 비회원("1분·정답은 없어요"가 사별 직후 페르소나에 자극적·경박, 헌장 톤 위배) ②부모 케어링 40·50대 × 재방문 비회원(같은 화면 두 번, G5 미해결과 직결).
- 추천: **H3(톤 다운 진단 + 콘텐츠 큐레이션 공존) + G1 A+B 혼합 유지 + G2~G5 일괄 도입**. 모바일 first-fold = ARPU/LTV 엔진이지만 "전환 광고"가 아닌 **콘텐츠 큐레이션 + 잔잔한 진단 입구의 retention 자산** 형태로 헌장과 양립. G2~G5 일괄 처리 안 하면 한 페르소나가 깨짐.
- 헌장 톤 점검 발견: **"정답은 없어요" 표현 자체가 '정답'을 환기시켜 부담을 역설로 만듦** — 사별 직후 페르소나엔 자극적, 제외 권장. 후보 3안(`잠깐, 지금 어디쯤이세요?` / `오늘 마음이 머무는 자리, 같이 짚어볼게요` / `오늘은 어디쯤 와 계세요?`)은 카피라이터 라운드로 위임.
- 사장님 결정 카드 7개(D1~D7) 정리: D1 비회원 첫 화면 구성(H3 추천) / D2 회원 "오늘 첫 행동" 자리(비회원·회원 시각 분리) / D3 모바일 "이웃 글" 정의(시각 처리만, 현 단계) / D4 G1 게이트 경로(A+B 혼합 추인) / D5 G2 emailRedirectTo + G3 welcome.html(일괄) / D6 G4 login.html next 보존 / **D7 G5 Supabase 답 동기화 — one-way door, 창업자 승인 필요**.
- 산출물: `docs/strategy/onboarding-home-integration-2026-06-11.md` (187줄). 코드 미수정 — 사장님 D1~D7 결정 후 PE 출동.

**인증메일 미수신 대응 + 중복가입 UX 보완 (PE)**
- 제보: 신규 가입(`yellowcamel3@naver.com`, 이름 "공산") 인증메일 미수신. Supabase auth 로그 확인 결과 `mail.send`(confirmation, from `noreply@mail.app.supabase.io`)는 정상 발사됨 → 코드 버그 아님, **배달 문제**.
- 원인: Supabase 내장 테스트용 SMTP의 네이버 배달 신뢰도 불안정(스팸 처리/silent drop) + 시간당 발송 한도(~3~4통). 네이버 가입 9건 중 6건은 정상 수신·인증, 3건(`98cocu`/`neitynamu` 오타/`yellowcamel3`) 미인증.
- 즉시 조치: `auth.users`에서 `yellowcamel3@naver.com` `email_confirmed_at` 수동 설정 → 메일 없이 로그인 가능하게 함(되돌리려면 null로 복구).
- 중복가입 UX: `signup.html` 가입 핸들러에 이미 가입된 이메일 감지 추가. Supabase는 열거 방지를 위해 기존 이메일 재가입 시 에러 없이 `data.user.identities=[]`(빈 배열)을 돌려줌 — 이를 잡아 "이미 가입된 계정" 안내 + 로그인(`login.html?email=` prefill)·비밀번호 재설정(`forgot.html`) 링크 노출. 기존엔 "인증 링크 보냈습니다"를 잘못 띄워 혼란.
- 변경 파일: `signup.html`, `sw.js`.
- 후속(대기): 운영용 커스텀 SMTP(**Resend** 공식 통합) 연결 — 발신 도메인/API 키 필요, 사장님 입력 대기. 연결 시 네이버 배달 정상화.

**가입 흐름 전수 QA + 결과 게이트 "오늘 잇고 답하기" 죽은 버튼 인상 P1 수정 (PE)**
- 트리거: 창업자 시연 — 진단 결과 게이트의 "오늘 잇고 답하기" 버튼이 "안 연결된다"는 보고.
- 진단(1줄): 비로그인 첫걸음 CTA(`cta-gate`)는 의도된 게이트 스크롤이지만 게이트가 이미 뷰포트 안에 있으면 스크롤 거리 ~0 → 죽은 버튼 인상.
- 의도(C4 결정: 결과 → CTA → 게이트)는 보존하면서 시각 시그널만 강화: ①첫걸음 카드 CTA 아래 한 줄 추가 — "답을 남기려면 가입이 필요해요. 아래에서 잠깐만요." ②클릭 시 게이트에 1.2s 펄스 애니메이션(토큰 색 `var(--primary)` 알파, 임의 hex 없음) + 게이트 뷰포트 미노출 시 스크롤 + "이메일로 시작하기" 자동 포커스. ③`.onb-gate`에 `border-radius: 16px` + box-shadow transition.
- 가입 흐름 전수 QA — `docs/strategy/onboarding-flow-qa-2026-06-11.md` 신규: ①path 5종 × 결과 카피(STAGE/Q2_MIRROR/companionFor/firstStepFor/soloFor/Q4_MIRROR) 매트릭스 전수 확인 → **빈자리·undefined 노출 0건**. ②P1 추가 1건(보류) — `auth.js`의 `emailRedirectTo`가 welcome.html 고정이라 이메일 인증 환경에선 signup의 next 무시되고 옛 onboarding으로 떨어져 이중 온보딩. ③P2 5건 — login.html `next` 미보존, 가입 후 localStorage 답 Supabase 미동기화, welcome/onboarding 이원화, 비로그인 일반 페이지 next 미보존, skip 시 답 손실. ④P3 2건 — 새로고침 시 idx 휘발, 진행률 분모 점프.
- 가입 게이트 경로 설계: 옵션 A(현재 유지) / B(CTA→가입 직행) / C(1회 무가입 + 2번째에 게이트) 비교. **추천: A+B 혼합** — 현재 미러링 클라이맥스 보존하면서 CTA 시그널만 강화(본 라운드 적용). 사장님 결정 필요 5건(G1 게이트 경로 / G2 emailRedirectTo 동봉 / G3 welcome.html 처리 / G4 login next 도입 / G5 답 Supabase 동기화) 정리.
- 변경 파일: `onboarding.html`, `sw.js`, `docs/strategy/onboarding-flow-qa-2026-06-11.md` 신규.
- 통합 CACHE_VERSION: `itda-v3-2026-06-11-onboarding-gate-cta-signup-guard-v1` (signup-dup-guard + onboarding-gate-cta 의도 합침).

**가입 진단 퀴즈 — lifecycle 분기 트리(옵션 A) 재구현 (PE)**
- 단일 원천: `docs/strategy/onboarding-quiz-qa-2026-06-10.md`. 사장님 5결정 컨펌(C1 분기 도입 / C2 Q4·Q5 제거 / C3 결과→CTA→게이트 유지 / C4 게이트 위치 결과 후 유지 / C5 "○○형" 라벨 금지, "자리" 톤 유지).
- 진단 D1~D7 정조준: ①D4 분기 부재 → Q1 답에 따라 path(caregiver/self_prep/reflector/bereaved/explorer)별 STEPS 동적 재구성. ②D1 사별 path 빈자리 → Q2를 "보내드린 지 어느 정도?"(recent/months/long/hard)로 교체, 옵션 어색 0. ③D2 의미 중첩 → Q2를 path별 다른 어휘로 분리(돌봄 상황/시작 계기/돌아봄 결/사별 시간/방문 결). ④D3 의도 덮어쓰기 → `computeStage`를 Q1 단독 결정으로 단순화. ⑤D5 Q4·Q5 dead weight → 제거(현행 Q6 강도만 Q4로 승계, 자유서술 한 문장은 Q5로 유지). ⑥D6 Q3 무게 동일 → bereaved path에서만 카피 변주("지금 곁에 누가 있어요?"). ⑦D7 결과 부재 → `Q2_MIRROR`(path×Q2 한 줄)·`companionFor`(path×Q2 동행 한 줄)·`firstStepFor`(path×Q4 강도별 첫걸음 카드 + bereaved×recent는 도구 강제 X 글 읽기로 약화)·`soloFor`(path별 SOLO 변주)·`Q4_MIRROR`(강도 한 줄)로 답 5개 모두 결과 카피에 반영.
- 진행도 바: 분기 결과 path별 총 질문 수가 동일(Q1+Q2+Q3+Q4+Q5=5)이라 N/5로 자연 표시. Q1 답을 바꾸면 path 재구성하면서 q2~q4만 무효화(q5 자유서술은 보존).
- 결과→CTA→게이트 흐름·이메일/소셜 OAuth·session 모델은 그대로. 로그인 사용자는 결과부터.
- 변경 파일: `onboarding.html`(전체 재작성), `sw.js`(CACHE_VERSION → `itda-v3-2026-06-11-quiz-branch-tree-v1`).
- 잠재 리스크: ①localStorage `itda:onboarding`의 기존 답(q2~q7 키·값 체계)이 새 모델과 불일치 → Q1 답 stage가 같아도 새 path의 q2 옵션 값이 달라 결과 미러링이 빈 칸으로 나갈 수 있음(첫 진입 시 답을 다시 받으면 정상). ②기존 q5(multi)·q6(single read/answer/do)·q7(text) 키를 그대로 쓰지 않고 새 Q4(강도=read/answer/do)·Q5(text) 키로 옮겨서, 이전 세션 답 호환은 의도적으로 끊음. ③커밋·푸시는 사장님 검토 대기.

---

## 2026-06-10

**케어링 업데이트 알림 — 인앱 알림함 1차 구현 (팀 소집, PE 메인)**
- 과업: "같은 케어링 대상자의 멤버에게 업데이트(새 기록) 알림". 현황 조사 결과 — 케어링엔 별도 '글' 개념 없고 `care_logs`(기록)만 존재, `care_subjects`(대상자 1)↔`care_members`(멤버 N) 구조, Web Push 발송기(`push-notify`)는 있으나 `care_logs` 컬럼을 잘못 읽는 버그 상태.
- 창업자 결정: ①'업데이트 글'= **기존 care_logs 등록 = 업데이트**(글쓰기 UI 신설 안 함). ②카카오 알림톡은 **건당 과금**이라 1차 제외 → **인앱 알림함 + 앱푸시(Web Push, 무료) 동시**, 카카오는 **"곧 열려요" 옵트인 문구만**.
- 마이그레이션 `20260610_care_update_notifications.sql`: `notifications` 테이블(+RLS, 본인만 조회/읽음/삭제, INSERT는 트리거 전용) + `care_logs` AFTER INSERT 트리거 `notify_care_members_on_log()`(수신 = 대상자 owner ∪ care_members − 작성자, SOS는 mood='urgent'/[SOS] 감지) + realtime publication 등록. **apply_migration 미적용(창업자 승인 후 반영 필요).**
- `js/notifications.js` 신규: 데이터 헬퍼(list/unread/markRead/markAllRead/realtime) + **탑바 벨 컴포넌트**(배지·드롭다운·알림함). 푸터에 "📱 앱 알림 받기"(Web Push 구독) + "💬 카카오톡으로도 받기 (곧 열려요)" 옵트인. 설정은 `profiles.notification_pref`.
- `nav.js`: 로그인 시 전 페이지 탑바에 벨 동적 마운트(`mountNotificationBell`).
- `push-notify/index.ts` 버그 수정: `body`→`daily_status`/`free_memo`, 수신 대상에 **owner 포함** + `author_id` 기준 작성자 제외, SOS는 `mood`로 판정.
- `sw.js CACHE_VERSION → itda-v3-2026-06-10-care-notifications-v1`.
- ⏳ **창업자 할 일(배포)**: ① `20260610_*` 마이그레이션 apply ② (앱푸시 원할 시) push-notify 재배포 + care_logs INSERT Database Webhook 연결 + VAPID 키 setup. 인앱 알림함은 마이그레이션만 적용되면 즉시 동작.

**대화형 삶 정리 → AI 유언 초안 (과업2, 설계 + 프로토타입)**
- `docs/product/conversational-will-builder.md` 작성. 핵심: **AI 텍스트는 그 자체로 유효 유언 아님**(민법 1066조 자필 요건/대법원 전자문서 불인정) → 포지션 = "초안 + 자필 가이드까지, 화상공증은 준비중".
- 창업자 결정 반영: 가벼운 질문 + **하단 회색글씨로 '채우는 법적 요건' 안내**, 출구는 초안+자필 가이드, 화상공증 "준비중이에요". 질문↔요건 매핑표·요건 충족도 nudge(1차 notifications 재사용) 포함.
- **프로토타입 구현**: `note/will-builder.html` — 5단계 대화형(스킵 가능)·존엄한 진행도·답변 조립 초안·자필 유언 체크리스트·화상공증 "준비중" 박스. `note/will.html`에 진입 CTA 추가.
- **서버 저장 + AI 초안 연동**: `will_entries` 테이블(본인 RLS, 사용자당 1행, answers·draft_text·requirement_met) 신설. will-builder가 답변을 localStorage 캐시 + 서버 upsert(다기기 이어쓰기). **`vault-will` Edge Function 배포**(verify_jwt=true, claude-opus-4-8 + adaptive thinking) → "✨ AI로 다듬기" 버튼이 답변→유언장 초안 생성. AI는 효력 단정 금지·존엄 톤·제공 정보만 사용. ANTHROPIC_API_KEY 시크릿 필요.

**배포** — `20260610_care_update_notifications` + `will_entries` 마이그레이션 apply_migration 원격 반영. Edge Function `push-notify`(verify_jwt=false)·`vault-will`(verify_jwt=true) 신규 배포. VAPID 공개키 클라이언트 주입. 작업 브랜치 → main → gh-pages 순 fast-forward 푸시.

---

## 2026-06-08

**커뮤니티 답변 노출 수정 — 원글(질문)에 종속시키기 (창업자 제보, PE·마케팅 소집)**
- 🐞 진단: 커뮤니티 보드 글 5개가 전부 `content_thread_id`로 **잇다 공식 원글에 단 답변**인데, forest 커뮤니티 쿼리가 그 컬럼을 select조차 안 해 원글 맥락 0 → 유저 제목만 떠 "쌩뚱맞은 개인 메모"처럼 보임. 순수 노출 레이어 버그(데이터 정상).
- 팀 수렴: **개별 답 행 유지 + 원글을 부모로 먼저 표기**(그룹핑은 답 수 경쟁 톤 유발이라 둘 다 반대).
- `forest.html`: 커뮤니티 쿼리에 `contents:content_thread_id(...)` join. `renderPostList` 2줄 행(↳ '원글 제목'에 남긴 이야기 + 답 발췌), 행 클릭 → **원글(content-detail)**(원글 공개 시, 아니면 post-detail 폴백). 헤더 "함께 잇는 이야기", 안내 한 줄, 빈 상태 카피(콘텐츠로 유도) 교체.
- `post-detail.html` + `js/community.js`: getPost에 원글 join, 답 상세 상단에 **원글로 돌아가는 배너**(양방향 연결).
- `post-write.html`: 잇기 작성 시 "남긴 이야기는 커뮤니티에도 함께 보여요" 고지 한 줄(마케팅 프라이버시 권고).
- ⚠️ **창업자 결정:** 노출 default = **전체 노출 유지**(옵트인 토글 안 만듦) — "유저도 없으니" 지금 단계엔 과설계. 작성 시 고지 한 줄은 이미 반영. 민감 원글 보드 제외 + 옵트인은 **실유저 유입/마케팅 전에 재검토**(투병·사별 추론 노출 리스크 그대로 남아있음).
- `sw.js CACHE_VERSION → itda-v3-2026-06-08-community-answer-origin-context-v1`. 모듈 4개 문법 통과, join 단일객체 확인.

**카카오 로그인 보류, 이메일 가입으로 테스트 출발** (PE 세션, 사장님 결정)
- 카카오 네이티브 OAuth 연동을 끝까지 시도: 앱키·동의항목(닉네임/프로필사진/이메일 전부 필수동의)·개인 비즈앱 전환(본인인증)까지 완료해 KOE205 해결. 마지막 KOE006(카카오 콘솔 Redirect URI 등록)에서 계속 막힘 — 콘솔에서 Supabase 콜백(`/auth/v1/callback`) 등록이 저장되지 않는 것으로 추정. Supabase Redirect 허용목록엔 github.io 이미 등록 확인.
- 약속한 하드스톱 적용: 카카오는 보류하고 **이메일 가입(이미 정상 작동)으로 테스트 출발**. `js/social-auth.js`에 `SOCIAL_LOGIN_ENABLED=false` 플래그 추가 → 카카오/구글 버튼 숨김(테스터가 KOE006 안 보게), 이메일 가입이 메인. 카카오 콘솔 Redirect URI만 마저 저장되면 플래그 true 한 줄로 복구 가능(코드·Supabase·동의항목은 이미 준비 완료).
- `sw.js` CACHE_VERSION → `itda-v3-2026-06-08-email-first-launch-v1`.

**AI 디지털 보관함 × 생전기록 — 통합 설계서 작성 (전략·PE 소집, 메인 오케스트레이션)**
- 출처: 라이브 에세이 `7591c5d9` "유서가 아니라, 비밀번호 목록을 먼저 썼습니다". 창업자 제기 — "정보 옆에 마음 한 줄"을 AI로 푸는 방안 논의.
- 전략·PE 병렬 소집, 교차 검토. 두 팀 독립 수렴: ① 정체성 = vault(저장)❌ → **"가족에게 건네는 봉투(전달·수신자 지정)"** ② 신뢰 = 실 비번 안 받고 **위치·힌트·마음만**(1Password "우리도 못 봄" 개념 차용, secret-key UX 폐기) ③ MVP = 한 카테고리 인라인 마음질문, 프런트only·DB 0.
- **창업자 결정(2026-06-08): 정체성 = "봉투" 확정.** 마음 질문 카피는 추상 금지·구체적 목적("이 계좌는 무엇을 위해 만든 거였나요?")으로. 신뢰모델·MVP 착수는 논의 보류.
- **발견: 에세이의 세 요소가 이미 self.html("나의 삶 정리") 허브 카드로 존재**(디지털 자산 노트=정보, 가족 메시지=마음, 가족 잠금 공유=봉투). 새 제품 아님 → 흩어진 카드를 꿰는 척추.
- 🐞 **배포 부채 발견:** `note/digital.html`·`note/directive-checklist.html`이 worklog상 2026-06-07 작성으로 기록됐으나 **main 미머지 → 라이브 404**. 별도 배포 정리 필요.
- 산출물: `docs/product/ai-vault-living-record.md`(데이터모델·보안·AI 파이프라인·MVP 슬라이스). 코드·DB·배포 미변경(설계 단계).

**①+② 구현·배포 (창업자 "1번 하고 2번" 지시)**
- **②(MVP 한 조각) — `note/digital.html`:** 카테고리 데이터 `string` → `{info, heart}`로 확장(구버전 문자열 자동 흡수, DB 무변경·localStorage 유지). 은행·보험·부동산 3개에 "마음 한 줄" 질문+입력칸 — **정보를 적으면 그 옆에 마음칸이 따라 노출**(에세이의 정보→마음 트리거). 억지 방지 위해 휴대폰·계정·구독·대출엔 미부착. 검증 가설 = "정보 적은 사람이 마음도 적는가".
- **①(허브 동선) — `self.html`:** 흩어진 6개 카드를 **"1.모은다(정보) → 2.마음을 얹는다(뜻) → 3.건넨다(봉투)"** 3단계 동선으로 재구성. 단일 하이라이트 제거, 단계 헤더+흐름 화살표. '가족 잠금 공유'를 **봉투=중심축**(초록 강조 카드)으로 승격(아직 stub, 클릭 시 "곧 열려요").
- **머지 충돌 해소:** 그새 다른 세션이 main에 `digital.html` 배포+카피 정리(62c3395, placeholder 단순화·'남기는 한마디' 힌트 제거). rebase로 그 결정 보존(placeholder "떠오르는 한 줄.", message hint '') + 마음 기능 얹음. → 배포 부채(404) 해소됨.
- `sw.js CACHE_VERSION → itda-v3-2026-06-08-vault-heart-hub-flow-v1`. main 배포(ff). 모듈 JS 문법 검증 통과.

**(a) 측정 + (b) 봉투(수신자 지정) 구현·배포 (창업자 "a,b 모두 해줘" 승인)**
- **(a) 전환율 측정:** 새 테이블 없이 기존 `app_events` 재사용. `note/digital.html`에서 정보/마음 칸 **첫 입력 시 1건만** `app_events`(event_type `vault_fill`, meta `{category, field}`) 기록. **내용은 미전송**(카테고리·필드만). 중복 방지 localStorage 플래그. 집계 쿼리는 설계서 §8(트리거 전환율 = info_and_heart ÷ info).
- **(b) 봉투 = 수신자 지정:** `vault_recipients` 테이블 신규(`20260608_vault_recipients.sql`, apply_migration로 원격 반영, RLS own 4정책 확인). `note/envelope.html` 신규 — 이름·관계·연락처(선택)·한마디(선택)로 "받을 사람" 지정/삭제. **사후 자동공개·dead-man switch·암호화 escrow는 미구현**(법률·보안 감수 영역, 과한 약속 방지 위해 범위 고지 배너 명시).
- **`self.html`:** '가족 잠금 공유' stub → **'가족에게 건네는 봉투'** 실제 페이지 연결. 수신자 수 조회해 카드·3단계 봉투 카드에 "받을 사람 N명" 표시. comingSoon 해제.
- `sw.js CACHE_VERSION → itda-v3-2026-06-08-vault-envelope-measure-v1`. 모듈 JS 문법 검증 통과(digital·envelope·self).
- ⚠️ DB 추가는 one-way door지만 **추가 전용(파괴 없음)** 이며 창업자 승인하에 진행.

**정보/콘텐츠/커뮤니티 허브 재정비 (창업자 제보)**
- **기본 랜딩 = 정보:** 하단 '커뮤니티'(🌳) 탭이 forest.html(콘텐츠 기본) 대신 **info.html(정보)** 로 진입하도록 `nav.js` 변경. 정보가 허브의 front door. (⚠️ 탭 라벨은 '커뮤니티' 유지 — 라벨/목적지 불일치 가능, 창업자에 리네이밍 옵션 제시.)
- **콘텐츠 = 잇다 공식만:** forest.html 콘텐츠 쿼리에 `author_type='official'` 필터(유저 글 3편은 숨김). 큐레이션 히어로도 official 조건 추가. → 콘텐츠(공식)/커뮤니티(유저) 분리 명확.
- **유저 글은 커뮤니티로 일원화:** ＋ FAB가 콘텐츠 탭에서도 `post-write.html`(커뮤니티)로. 콘텐츠 탭엔 유저 작성 진입점 없음(공식 전용). (fmt 시트 코드는 미사용으로 잔존 — 되돌리기 쉬움.)
- **커뮤니티 글 박스 → 게시판 리스트:** `renderPostList`를 큰 `.content-card` → 콘텐츠와 동일한 `.board`/`.board-row`(행 리스트)로. 헤더 "커뮤니티 · 함께 나눈 이야기"로 콘텐츠 보드와 구분.
- `sw.js CACHE_VERSION → itda-v3-2026-06-08-info-default-content-community-split-v1`. forest·nav 문법·라우팅 타깃 검증 통과.

**QA + 네비 버그 수정 (창업자 제보: 하단 '마이' 클릭 시 오류, 앞으로 이동 없음)**
- 🐞 **근본 버그:** `nav.js` 하단탭·로고·푸터 링크가 상대경로(`./root.html` 등)라 `note/`·`info/` 서브폴더 페이지에서 `note/root.html`로 404. **모든 서브폴더 페이지 공통**(기존부터). → `nav.js`가 `import.meta.url`로 사이트 루트를 계산해 **절대경로**로 링크 생성하도록 수정(어느 깊이에서도 정확). note/·info/ 전 페이지 일괄 해결.
- **앞으로 이동:** `note/digital.html`·`note/envelope.html` 하단에 "나의 삶으로 돌아가기" CTA 추가(브레드크럼 외 명시적 동선). digital.html 낡은 안내문("가족 잠금 공유 곧 열려요") → 봉투 출시 반영해 정리.
- **QA 검증(코드 실측):** 신규/관련 5개 페이지(self·digital·envelope·will·directive-checklist)의 모든 href·requireAuth·location 타깃이 실존 파일로 해석되는지 스크립트 검사 — 전부 OK(동적 템플릿 2건 제외, 실타깃 존재 확인). 하단탭 8개 타깃 루트 존재, 모듈 JS 문법 4개 통과.
- 📌 미해결(경미): note 페이지의 하드코딩 `<nav class="top-bar">` + `renderTopBar` 이중 상단바 — will.html과 동일한 기존 패턴이라 이번엔 미변경(추후 정리 후보).
- `sw.js CACHE_VERSION → itda-v3-2026-06-08-nav-abs-paths-cta-v1`.

---

## 2026-06-07

**3-탭 네비(정보|콘텐츠|커뮤니티) + 디자인 통일성 정비** (PE 세션, 사장님 요청)
- `forest.html`: 커뮤니티 탭 활성 시 필터 칩(전체·오늘 잇고) 자동 숨김(`chipsEl.hidden = seg === 'community'`). 커뮤니티 탭은 사용자 작성 포스트만 노출.
- `info.html`: 상단에 `[정보|콘텐츠|커뮤니티]` 3-탭 세그먼트 추가. `.shell` 최대 너비 480px. 대형 헤더(kicker·h1·lead) 제거. 미리/곁에/떠난뒤 탭을 `tab-segment` pill 스타일로 변경. `.category-item` 테두리·패딩 조정.
- `sw.js CACHE_VERSION → itda-v3-2026-06-07-design-unify-community-chips-v1`.

**실 API 연동 — 장기요양기관 검색 Edge Function** (PE 세션, 사장님 요청)
- Supabase Edge Function `ltc-search` 신규 생성·배포. 국민건강보험공단 장기요양기관 검색 API(B550928) CORS 프록시. POST `{ sido, sigungu, grade, dementia, vacancy, page, limit }` 지원.
- `info/nursing-home.html`: 하드코딩 시드 카드 → Edge Function 실시간 조회로 대체.
- **⚠️ 미완: `NHIS_API_KEY` Supabase secret 미설정 → 실제 조회 불가**. data.go.kr 인증키 복사 후 `supabase secrets set NHIS_API_KEY=<키>` 실행 필요.

**디지털 자산 노트 신규 + 나의 삶(self.html) 노트 카드 404 수정** (PE 세션, 사장님 제보)
- 제보: 나의 삶에서 "디지털 자산 노트" 카드 클릭 → GitHub Pages 404. 원인 — self.html의 노트 카드 5개 중 4개가 없는 페이지(`note/digital·funeral·messages·family-lock.html`)로 연결돼 있었음(`note/will.html`만 존재).
- `note/digital.html` 신규 생성: will.html 패턴(인증·통합 네비·디자인 토큰·localStorage V1). 8개 카테고리(은행·통장/보험/휴대폰·잠금/온라인 계정/정기결제·구독/부동산·자동차/대출·빚/남기는 한마디), 입력 즉시 자동저장·진행바, 안심상속·관련 에세이 내부링크.
- self.html: "가족에게 남기는 메시지" 카드 → 실제 존재하는 `note/will.html`로 경로 수정. "장례 의향"·"가족 잠금 공유"는 아직 페이지가 없어 `comingSoon` 처리(클릭 시 이동 대신 "곧 열려요" 안내 — 404 차단). 하이라이트(시작 추천) 선정에서도 comingSoon 제외.
- `sw.js CACHE_VERSION → itda-v3-2026-06-07-digital-note-v1`.

**안심상속 원스톱(seed-20)에 내부 링크 추가** (PE 세션, 사장님 요청)
- 본문 내 "'상속포기'·'한정승인'" → 상속 용어집(seed-19), "잇다 '사별 후 90일 체크리스트'" → 90일 가이드로 연결. (브리지 CTA 목적지 info.html/self.html은 G3 실험 계측·창업자 결정 대기라 미변경.)
- 소스(`seed-20-…md`)·마이그레이션·라이브 DB 세 곳 동기화. content-detail 내부 링크 3개 확인.

**🔴 핸드오프 — "정보(info.html) 허브" 진입 경로 부재** (PE 세션, 사장님 제보)
- 정보 허브로 가는 메인 진입점이 없음(전부 작은 📚 아이콘/칩). 사용자는 `마이 > 나의 삶 정리 > 사전연명의료의향서 > 본문 링크`의 우회 5단계로만 도달, 하단 5탭 어디에도 "정보" 없음.
- 다른 세션이 **커뮤니티 전면 재검토 중**이라 충돌 회피 위해 nav/forest는 건드리지 않고, `docs/product/info-hub-discoverability.md`에 문제·진입점 전수조사·결정 체크리스트로 정리. **커뮤니티 재검토에서 반드시 함께 다룰 것.**
- 인접 이슈로 `나의 삶 정리`의 404 데드엔드(digital/funeral/messages/family-lock 카드 미구현)도 문서에 명시.

**카카오 로그인 활성화 + 가입/로그인 카카오 주 버튼화 (시니어 친화)** (PE 세션, 사장님 요청)
- 80대 어르신은 이메일 타이핑조차 어렵다는 사장님 우려 → "가장 쉬우면서 행동 로그 남는" 최적안 = 카카오 간편가입(타이핑 0, 닉네임=이름 자동, 행동 전부 user_id로 로그)으로 결론. 휴대폰 OTP는 한국 SMS 연동·비용·OTP 입력 마찰로 26명 테스트엔 비추.
- 사장님이 카카오 디벨로퍼스에서 앱 생성(ID 1479845 잇다/라이프헤리티지) 후 JavaScript 키 전달 → `auth.js`에 `window.__KAKAO_JS_KEY__` 전역 주입(소셜 버튼 있는 signup/login/onboarding 모두 import). `social-auth.js`는 이미 호출시점 lazy read라 즉시 작동.
- `signup.html`·`login.html`: 소셜 블록을 폼 위로 이동, **카카오를 맨 위 큰 주 버튼**(`.social-btn-primary`), 그 아래 구글, "또는 이메일로 가입/로그인" 구분선 후 이메일 폼. `renderSocialAuthButtons`에 `dividerText`·`kakaoLabel` 옵션 추가(onboarding은 옵션 미전달로 영향 없음).
- `sw.js` CACHE_VERSION → `itda-v3-2026-06-07-kakao-live-v1`.
- ⚠️ 사장님 잔여 액션(카카오 콘솔): Web 플랫폼 도메인 등록 + 카카오 로그인 ON + Redirect URI + 동의항목(닉네임/이메일). 안 켜면 키 있어도 막힘.

**정보 페이지 — 웰다잉 가이드 신규 추가** (PE 세션, 사장님 요청)
- `info/well-dying-guide.html` 신규 생성. "웰다잉(Well-Dying) — 좋은 죽음을 미리 준비한다는 것" — advance-directive.html 구조(CSS 토큰, nav.js, scroll-top.js) 동일하게 적용.
- 7개 섹션: ① 꺼내기 어려운 주제 ② 마지막 순간만의 문제가 아님(보건사회연구원 2018–2019 참고) ③ 50대부터 시작하면 좋은 이유 ④ 실제로 할 5가지(가족대화·의향서·소중한것 기록·디지털계정·장례방식) ⑤ 정리하면 지금이 더 잘 보임 ⑥ 잇다에서 시작할 수 있는 것(사전의향서 링크·의향서 양식·디지털자산·가족편지·오늘의질문) ⑦ 실천 체크리스트 7항목.
- 내부 링크: `./advance-directive.html`. 외부 링크: 보건복지부 의향서 서식, 의향서 양식 Drive. YMYL 고지 삽입. 인라인 hex 없이 CSS 토큰만 사용.
- `sw.js` CACHE_VERSION → `itda-v3-2026-06-07-well-dying-guide-v1`.

**정보 페이지 — 실버타운 가이드 신규 추가** (PE 세션, 사장님 요청)
- `info/silver-town-guide.html` 신규 생성. "실버타운 가이드 — 유형별 차이, 입주 조건, 비용까지 한눈에" — advance-directive.html 구조(CSS 토큰, nav.js, scroll-top.js) 동일하게 적용.
- 8개 섹션: ① 실버타운 vs 요양시설 ② 4가지 유형(공공·실버스테이·노인복지주택·케어형) + 비교 표 ③ 입주 조건 3가지 ④ 비용 구조(보증금·월이용료·추가비용) + 민간/공공 시설 비용표 ⑤ 유형별·지역별 시설 목록 ⑥ 공공 vs 민간 선택 ⑦ 방문 전 체크리스트(보증금 위약금 포함) ⑧ 부모님과 대화 우선 + CTA.
- 외부 링크: LH청약플러스·마이홈포털·보건복지부·국민건강보험공단. YMYL 고지 삽입. 인라인 hex 없이 CSS 토큰만 사용.
- `sw.js` CACHE_VERSION → `itda-v3-2026-06-07-silver-town-guide-v1`.

**나의 삶 정리 — 사전연명의료의향서 "방문 준비 체크리스트" 실작동 도구 추가** (PE 세션, 사장님 요청)
- `info/advance-directive.html`의 정적 "방문 전 체크리스트"(7항목)를 실제 체크·저장 가능한 도구로 구현. `note/directive-checklist.html` 신규 — 큰 체크박스(시니어 친화), 진행률 바("n/7 완료"), 항목별 안내, localStorage 영구저장(`itda:directive_checklist:{uid}` + 요약 키). 전체 완료 시 "방문하시면 됩니다" 메시지.
- `self.html`(나의 삶 정리)에 카드 "의향서 방문 준비 체크리스트" 추가 — 같은 localStorage 요약을 읽어 진행률 표시. (note_entries 테이블은 아직 미존재 → DB 없이 localStorage로 구현)
- seed-16(웰다잉 가이드) 업데이트 반영: 참고 자료로 국립연명의료관리기관(작성기관 찾기)·보건복지부 의향서 안내·의향서 서식(템플릿, Google Drive)·잇다 의향서 가이드 링크 연결.
- `sw.js` CACHE_VERSION → `itda-v3-2026-06-07-directive-checklist-v1`.

**마이페이지 정리 — 활동 통계·"내 활동" 섹션 숨김** (PE 세션, 사장님 요청)
- `root.html`(마이)에서 통계 4칸(일기·답변·게시글·가족·친구)과 "내 활동" 탭/목록 제거. 프로필 + 하단 메뉴(친구 초대·나의 삶 정리·책자·플레이리스트·알림·안내자료·운영자·로그아웃)만 노출.
- 관련 JS는 통계 그리드 존재 시에만 실행하도록 가드(`if (#stat-grid)`), `loadActivity`는 `activity-body` 없으면 early-return. render 함수는 남겨두되 미호출(추후 복구 용이). `sw.js` CACHE_VERSION → `itda-v3-2026-06-07-my-hide-activity-v1`.

**가족 초대 = 링크 수락 중심으로 재설계 + RPC 재테스트 (80대 친화)** (PE 세션, 사장님 요청)
- 백엔드 재테스트: `accept_care_invite` RPC를 트랜잭션 안에서 5개 시나리오 시뮬레이션(정상 수락·중복·본인초대·잘못된코드·소문자입력) 전부 통과, 데이터는 롤백. 기존 수락데이터 정합성도 확인(고아 멤버 0, inviter 누락 0). **백엔드는 무결.**
- 문제는 *표현*이 6자리 코드 중심이었던 것 → 링크 중심으로 전환:
  - `care.html` 초대 결과화면 재구성: "💬 카카오톡으로 초대 보내기"가 히어로 버튼, "🔗 초대 링크 복사" 추가, 6자리 코드는 "링크가 안 될 때만" 작은 폴백으로 강등. 라벨 전반 "초대 코드 만들기"→"가족 초대하기", "코드 생성"→"초대 링크 만들기". 공유 메시지/링크 빌더 공통화(`buildInviteLink`/`buildShareText`).
  - 신규 RPC `preview_care_invite(p_code)` (SECURITY DEFINER, anon 실행 가능) — `supabase/migrations/20260607_care_invite_preview.sql`. 로그인 전에도 "○○님이 □□님 돌봄에 가족으로 초대"를 보여줘 80대가 안심하고 가입하도록.
  - `signup.html`·`login.html` 초대 랜딩 문구를 "초대 코드 XXX 받으셨네요" → 미리보기 기반 "○○님이 □□님 돌봄에 초대하셨어요. 이름·이메일만 넣으면 바로 합류"로. 이름은 `esc()`로 escape(XSS 방지).
- 리텐션 리포트에 **직접 초대 26명 분모** 반영(`invited_seed=26`) — 전환율 계산 + 추천 유입 시 100% 초과 가능(입소문 신호) 명시. 추천으로 들어온 사람도 가입만 하면 자동 추적(profiles).
- `sw.js` CACHE_VERSION → `itda-v3-2026-06-07-invite-link-first-v1`.

**상속 용어집(seed-19)에 내부 링크 추가** (PE 세션, 사장님 요청)
- 글 안에서 텍스트로만 적혀 있던 "관련 가이드/관련 글" 안내를 실제 내부 링크로 연결(스크린샷 제보).
- "사별 후 90일 체크리스트"(6곳) → 90일 가이드, "안심상속 원스톱 서비스 자세히 보기" → 원스톱 가이드, "유서가 아니라, 비밀번호 목록…" → 해당 에세이, 본문 끝 그린박스의 "잇다 '디지털 보관함'" → `self.html`로 연결.
- 링크는 `./content-detail.html?id=<uuid>` 내부 경로(새 탭). 소스(`docs/content/seed-19-…md`)·마이그레이션(`20260607_seed17_20_bridge_contents.sql`)·라이브 DB(`contents` body) 세 곳 모두 동기화. 내부 링크 9개·중복 0건 확인.

**리텐션 리포트 자동화 — 수동 명단 폐기, 가입자 자동 추적** (PE 세션, 사장님 요청)
- 사장님 우려("테스터 20명 이메일을 미리 모를 수 없다 / 손으로 명단 못 넣는다")에 대응. DB 확인 결과 **가입 시 실명+이메일이 이미 수집·자동 저장**되고 있었음: `signup.html`의 name·email 입력 모두 `required`, `auth.users` → `public.profiles`로 트리거(`handle_new_user`)가 자동 복사(17/17 전원 name·email 채워짐 확인).
- 리포트를 **수동 명단 의존 → 가입일 기준 자동 코호트**로 전환: `docs/retention-test-report.sql`·`.claude/commands/retention-report.md` 재작성. `test_start`(KST) 한 줄만 초대 보낸 날로 맞추면, 그 이후 가입자가 이름·이메일·가입수단과 함께 자동 집계. `@itda.net` 내부계정 제외. 명단 입력 단계 완전 삭제.
- 쓸모없어진 `docs/retention-test-emails.txt` 삭제.
- 알아둘 한계: 초대했지만 미가입한 사람은 잡히지 않음(이메일 미수집) → "초대→가입 전환율"은 미측정, 가입 이후 행동(LQ1·LQ2)만 추적.

**케어링 — 손글씨 메모 사진 자동 입력(OCR)** (PE 세션, 사장님 요청)
- 배경: 인터뷰 유저의 아버지가 치매인 아내(어머니)를 돌보며 매일 수기 메모를 작성해 카톡으로 자녀에게 공유. 연세 많은 보호자에게 타이핑이 큰 장벽 → 메모를 사진만 찍으면 글자를 옮겨 칸을 채우고 [저장]만 누르게 함.
- `supabase/functions/ocr-memo/` 신규 — Claude Vision으로 손글씨 한국어 돌봄 메모를 전사(transcription)하고 케어 기록 칸(식사·약·기분·병원·유의점·영양·자유메모)으로 분류해 JSON 반환. DB/스토리지 저장 없음(전사만), JWT 검증으로 키 남용 방지. ⚠️ 의학적 판단 아님, 저장 전 사용자 확인.
- `js/memo-ocr.js` 신규 — 이미지 압축(긴 변 1600px JPEG)·base64 인코딩·함수 호출 래퍼 `ocrMemo(file)`.
- `care.html` 기록 모달 — 날짜 아래 시니어 친화 큰 버튼 "손으로 쓴 메모를 사진 찍어 자동 입력". 촬영→판독→해당 칸 자동 채움+퀵카드 펼침, 원본 손글씨 사진도 기록에 함께 첨부, "확인 후 [저장]만" 안내. 칸 분류 실패 시 전체 원문을 자유 메모로 폴백.
- 배포 배선: `.github/workflows/deploy-supabase.yml`에 `ocr-memo` 배포 추가, `supabase/DEPLOY.md` 갱신.
- **실배포(MCP 직접)**: GitHub Actions dispatch가 통합 토큰 권한으로 막혀(403), Supabase MCP `deploy_edge_function`으로 `ocr-memo` 직접 배포. ANTHROPIC_API_KEY는 analyze-rx와 동일 프로젝트 시크릿 재사용. (실기기 사진 촬영 시 함수 미배포로 non-2xx(404) 났던 것 해소)
- **품질 개선(실기기 피드백)**: 줄바꿈이 "/"로 합쳐지는 문제 → 프롬프트에 "실제 개행 보존, 기호로 이어붙이지 말 것" 명시 + `temperature:0`(충실 전사). 문자열 내 날것 개행으로 JSON 깨질 때 복구 sanitizer 추가. 클라 압축 품질 0.82→0.92. 에러 메시지 중복 접두 제거.
- **모델 주의**: `claude-opus-4-8` 시도했으나 이 ANTHROPIC 키 계정에 Opus 접근권이 없어 500(즉시 실패) → 로그 확인 후 `claude-sonnet-4-6`으로 복귀(analyze-rx와 동일, 200 확인). Sonnet도 한국어 손글씨 인식 양호. (향후 Opus 권한 생기면 모델만 교체)
- `sw.js` CACHE_VERSION → `itda-v3-2026-06-07-care-memo-ocr-v4`. PR #30·#31·#32·#33 머지(→ main → gh-pages).

**테스트 직전 제품 QA 풀패스 — 가입·온보딩·케어·초대·홈·커뮤니티 점검 후 수정** (PE 세션, 사장님 요청)
- 지인 20명 테스트 전 신규 사용자 경로를 3개 영역(가입·온보딩 / 케어·초대 / 홈·질문·커뮤니티) 병렬 감사. 정적 링크·모듈 참조·JS 문법 전수 통과. DB 보안 어드바이저 = 테스트 막는 P0 없음(전부 WARN).
- **핵심 발견(DB 확인):** 가입자 17명 전원 이메일 가입(소셜 가입자 0). 카카오 로그인은 `window.__KAKAO_JS_KEY__` 미주입으로 전원 실패. 이메일 인증(confirm) ON이라 17명 중 3명이 인증 안 해 막힘.
- **초대 플로우는 끝까지 정상**(care/friend 초대 → 비로그인 수신자 가입 → 자동 수락 RPC까지 배선·RLS·스키마 일치) — LQ2 측정 가능.
- 결정(사장님): 이메일 confirm은 테스트 동안 OFF, 카카오는 키 주입으로 살림.
- **수정 6건:** ① `js/social-auth.js` 카카오 키를 호출시점 lazy read(주입만 되면 전 페이지 작동) + 미설정 애플 버튼 숨김. ② `care.html` `?action=code` 딥링크로 초대코드 입력 모달 자동 오픈 + 초대 안내문 "링크 우선"으로 통일. ③ `nest.html` 빈 화면에 "가족이 보내준 초대 코드 입력하기" 동선 추가(초대받은 신규자 데드엔드 해소). ④ `ask.html` 일기 동시저장 실패를 사용자에게 표시(무성 실패 제거). ⑤ `reset.html` 만료/무효 링크 진입 시 안내+폼 숨김. ⑥ `signup.html` 이메일 인증 화면에 로그인 링크 추가.
- `sw.js` CACHE_VERSION → `itda-v3-2026-06-07-pretest-qa-v1`.
- 후속: 카카오 JS 키 받는 대로 `auth.js`에 전역 주입 + 재배포. 사장님 액션: Supabase Auth에서 Confirm email OFF.

**요양원·요양병원 찾기 — 공공데이터 실 API 연동** (PE 세션, 사장님 요청)

- `supabase/functions/ltc-search/index.ts` 신규 배포 (Supabase Edge Function v1) — 공공데이터포털 국민건강보험공단 장기요양기관 검색 API CORS 프록시. POST `{ sido, sigungu, grade, dementia, vacancy, page, limit }` 수신 → `NHIS_API_KEY` 시크릿으로 B550928 API 호출 → 필드명 정규화(복수 후보 fallback, 공식 문서가 로그인 후 열람이라 대응) → 서버 측 후처리 필터(AB등급·치매전담실·정원여유) 후 반환. API 키 미설정 시 503 + 설정 안내.
- `info/nursing-home.html` 업데이트 — 정적 시드 카드 3개 제거 → 동적 API 로딩으로 교체. 시도 선택 시 시군구 목록 자동 갱신, 검색 버튼 클릭 시 Edge Function 호출, 로딩/비어있음/API키미설정/오류 상태 분기. 정렬(평가등급순·정원여유순) 실시간 재정렬. 결과 건수 표시.
- `sw.js` CACHE_VERSION → `itda-v3-2026-06-07-ltc-api-v1`.
- **사장님 할 일**: data.go.kr에서 B550928(국민건강보험공단) > 장기요양기관 서비스 신청 → 발급 인증키를 `supabase secrets set NHIS_API_KEY=<인증키>` 로 등록하면 실제 데이터 표시.

**요양원·요양병원 찾기 v1 정적 셸 구현 + 커뮤니티·케어링 버그 수정** (PE 세션, 사장님 요청)

- `info/nursing-home.html` 신규 (792dfd8) — 필터바(시도/시군구 select, 유형/평가 칩, 치매전담실·정원여유 체크박스), 정렬바, 비교뱃지, 신뢰배너(공단 공식 데이터 출처), 시드 시설 카드 3개(A/B/C등급, 토큰 색상), 비교 플로트바(최대 3개, localStorage), `nursing-home-detail.html?id=` 라우팅. 호스피스 칩은 `.disabled` 처리(향후 콘텐츠 페이지 연결 예정).
- `info.html` 수정 — `nursing-home` ENABLED_KEYS 추가 + ENABLED 라우팅 맵 등록. 이제 "곁에" 탭 → 요양원·요양병원 클릭 시 전용 페이지로 이동.
- `forest.html` 수정 — 오늘의 글 카드 마지막 줄 "잇다 한 줄 ─" 문구 전체 삭제 (qc-entice div 제거).
- `sw.js` CACHE_VERSION 갱신 → `itda-v3-2026-06-07-nursing-home-v1`.

**커뮤니티 게시판 "미리 준비" + "기타" 추가** (사장님 요청)
- Supabase `boards` 테이블에 신규 행 2개 INSERT: `preparation` (미리 준비, sort_order=35), `other` (기타, sort_order=95).
- `post-write.html`은 `listBoards()`로 동적 렌더링 → HTML 변경 없이 즉시 반영.
- 마이그레이션: `supabase/migrations/20260607_care_emergency_rls_fix_and_boards.sql`.

**케어링 응급연락처 2종 버그 수정** (사장님 요청)
- 근본 원인 ①: `care_emergency_contacts` RLS 정책(`care_emergency_via_member`)이 `care_members`만 허용 → `care_subjects.user_id`가 본인인 owner가 INSERT/SELECT 불가. 신규 정책 `care_emergency_access`로 교체 (owner OR member 허용).
- 근본 원인 ②: 응급 연락처 진입점이 `nest.html` 🚨 버튼 하나뿐 — `care.html` 가족 탭에서는 접근 불가.
- `care.html` 가족 탭 최상단에 "응급 연락처 관리" 배너 링크 추가 (`#emerg-contacts-link`). `loadFamilyTab()`에서 `./care-emergency.html?subject=${subjectId}`로 href 동적 설정.


**브리지 콘텐츠 전략 확정 + 인터뷰 가이드 갱신** (전략 리서치 → 실행 착수)
- `docs/content-bridge-inheritance.md` 신규 작성: 마케팅·전략 에이전트 병렬 소집 → 교차비평 → 통합안. 상속·증여 47만/월 검색을 "사업 영역이 아닌 브리지"로 정의하고 잇다 본진(생전기록·유산정리)으로 넘기는 4단 템플릿·콘텐츠 슬레이트·YMYL 안전 규칙·측정 지표·공짜 검증 2개·창업자 one-way door 항목 정리.
  - 클러스터 판정: A(순수 세무·법률 79%) = 명시적 no-go / B(절차·가족·분쟁) = 감수자 확보 후 / C(사후행정·임종 틈새) = 지금 먼저.
  - 콘텐츠 슬레이트: E1·E2 에세이(감수 불필요), 용어사전 S, G3 안심상속원스톱 가이드(테스트 글), G1/G2/G4(감수 후).
  - 브리지 작동 선행지표: 미래CTA÷지금CTA 클릭률, 전환 문단 도달 후 체류, 상속 유입→도구 가입(UTM).
  - 창업자 결정 필요 항목 명시(§7).
- `docs/interview-guide.md` 갱신: Part 2(사별 경험자) 자기준비 전환 섹션에 **[브리지 실험 2]** 문항 3개(Q6-1~6-3) 추가. 판단 기준에 실험 2 go/no-go 기준선 추가(5명 중 3명+ 긍정 → 브리지 유효).

**다음 액션 (창업자 승인 후)**
1. 카피라이터 소집 → E1·E2 에세이 + 용어사전(S) + G3 가이드 초안 작성
2. PE → G3 두 갈래 CTA 계측 셋업(실험 1)
3. 진행 중 인터뷰에 브리지 실험 2 문항 삽입(실험 2)
4. 4주 후 §5 지표로 go/확장/중단 판단

**브리지 콘텐츠 4편 초안 작성** (카피라이터)
- `docs/content/seed-17-inheritance-passbook-essay.md` (E1, 에세이, 감수 불필요): "아버지 통장을 못 찾아 두 달을 헤맸다". 사별 직후 상속인 시점. 전환 문단(70~80% 지점)에서 "나는 내 아이에게는 이걸 겪게 하고 싶지 않다"를 이미 떠오른 생각의 naming으로. 두 갈래 CTA(유산정리/디지털 보관함). *(기존 고품질 초안 검토·유지)*
- `docs/content/seed-18-password-list-essay.md` (E2, 에세이, 감수 불필요): "유서가 아니라, 비밀번호 목록을 먼저 썼습니다". E1의 반대편 시점(이미 전환한 화자, lifecycle 3). 전환점: "유서는 무거워서 미룬다 → 비밀번호 목록이라는 가벼운 입구". CTA(디지털 보관함/생전기록). *(기존 고품질 초안 검토·유지)*
- `docs/content/seed-19-inheritance-glossary.md` (S, 용어사전, 감수 불필요): "상속 용어 한눈에". 상속순위·법정상속인·유류분·상속포기·한정승인·상속재산분할·증여세·상속공제·안심상속원스톱·대습상속 등 20여 개. 정의+공식 출처 링크만, 1인칭 조언 0. 숫자는 본문 금지→국세청 홈택스 링크. 미검증 deep-link는 "(출처 확인 필요)" 플레이스홀더(지어내지 않음). 각 항목→관련 가이드 내부링크.
- `docs/content/seed-20-safe-inheritance-onestop.md` (G3★, 가이드, **감수 권장 — review_required: true**): "안심상속 원스톱 서비스, 부모님 살아계실 때 알아두면 달라지는 것". §6 검증 실험 1 테스트 글. 제도 안내 중심·숫자 회피, 브리지 4단 적용, 두 갈래 CTA에 A/B 계측 예정. seed-01 검증 출처 재사용. 감수 전 발행 금지 상태로 둠.
- 공통: YMYL §4 준수(1인칭 조언 금지, YMYL 라벨+출처 섹션, 출처 URL 미창작), seed-01 frontmatter 구조 정합. **창업자 검토 대기.**

**G3 두 갈래 CTA 클릭 계측 셋업 (실험 1 측정 장치)** (PE)
- `js/cta-bridge.js` 신규: 익명 `session_key`(sessionStorage 난수, 쿠키 아님)·UTM/referrer 수집·`recordCtaClick()`로 `cta_clicks` INSERT. 전부 비차단(fire-and-forget) — 테이블 미적용/실패여도 글 읽기·이동 영향 0. 비로그인 유입자도 측정(상속 검색자 대부분 비회원).
- `content-detail.html` 수정: 본문 마크다운의 펜스 마커 `@itda-bridge-cta`(+JSON)를 두 갈래 버튼으로 치환(`renderBridgeCtas`), `data-branch`로 지금/미래 구분 계측. DOMPurify가 language class를 떼므로 sentinel로 식별, 파싱 실패 시 원본 유지(안전 폴백). 디자인 토큰만((지금)=흰배경+라인 / (미래)=`--primary-soft` 강조, 둘 다 조용함, 인라인 hex 0).
- `supabase/migrations/20260607_cta_clicks_event_log.sql`(미적용): anon INSERT 허용·SELECT 차단(집계는 service_role), `cta_branch` CHECK(now/future), 세션·실험·콘텐츠 인덱스. 하단 주석에 미래÷지금 비율 산출 쿼리 2종(raw / 세션 dedup) 포함.
- 정합성 연결: seed-20(G3) 본문의 blockquote CTA → `@itda-bridge-cta` 마커로 교체(측정 가능화). E1/E2/S는 측정 대상 아니라 blockquote 유지. 목적지 임시값(지금=`info.html`, 미래=`self.html`) — 확정 창업자 결정.
- **창업자 승인 필요(one-way door)**: ① `cta_clicks` 테이블 적용(백업 후 SQL Editor 1회 실행) ② G3 발행 + CTA 목적지 확정 ③ 라이브 배포(main/gh-pages·sw.js 캐시버전) — 모두 미실행, 발행 직전 상태까지만.

**브리지 콘텐츠 발행 셋업 (창업자 결정 2026-06-07: 진행)**
- 창업자 결정: 4편 모두 발행(코드 배포 진행, SQL은 창업자가 SQL Editor에서 실행). **G3는 헌장 YMYL 감수 규칙과 충돌 — 팀이 명확히 반대 의견을 제시**(잘못된 법률·재정 정보 한 줄이 신뢰 전체를 흔들 수 있음). 창업자 최종 결정 존중하되 위험완화 적용.
- G3 위험완화: ① 사실 주장을 발행된 seed-01과 대조 — 새 미검증 주장 없음(오히려 구체 숫자·1인칭 조언 회피, seed-01보다 보수적). 신규 사실은 "행정안전부 운영"(정확) 하나. ② 하단 모순 문구("감수 전 발행 안 함") 삭제, 가짜 감수 표기 대신 정직한 면책(공식 출처 기반 명시)으로 교체. ③ frontmatter `published_without_review: true`로 정직 기록, 감수자 확보 후 교체 예정.
- 깨진 내부 링크 정리: 4편의 `[…](./seed-*.md)` 내부 상호링크 9개를 라벨 텍스트로 변환(앱은 `?id=UUID` 라우팅이라 .md 링크는 404). 외부 공식 출처 링크는 보존.
- 발행 마이그레이션: `scripts/gen_bridge_seed_sql.py`로 4편의 본문(frontmatter·선두 H1·개발주석 제거) → `supabase/migrations/20260607_seed17_20_bridge_contents.sql` 생성(멱등·`$b$` 인용·`is_published=true`·`author_type='official'`). **미적용 — 창업자가 SQL Editor 실행.**
- 코드 배포: `sw.js CACHE_VERSION → itda-v3-2026-06-07-bridge-cta-v1`. 작업 브랜치→main→gh-pages 배포(렌더러 라이브화).
- CTA 목적지 임시값: 지금=`info.html`, 미래=`self.html`(자기준비 허브). 전용 "90일 체크리스트" 페이지 생기면 교체(reversible).
- **창업자 실행 필요(SQL Editor 1회씩)**: ① `20260607_cta_clicks_event_log.sql`(계측 테이블) ② `20260607_seed17_20_bridge_contents.sql`(콘텐츠 발행). 둘 다 실행해야 글이 라이브에 뜨고 클릭이 집계됨.

---

## 2026-06-06

**전체 서비스 화면 와이어프레임 + v1 배치 지도** (오케스트레이터 세션, 사장님 요청)
- `docs/product/service-wireframes-v1.md` 신규 — 5탭(홈·라이프·케어링·커뮤니티·마이)·정보 허브·v1 요양시설 신규 화면(A/B/C/D·N4) 전체 ASCII 와이어프레임. v1 배치 종합 지도(어느 탭·페이지·화면에서 어떻게 진입하는지) + 기존/신규/v1.5/콘텐츠 분류.

**요양시설 찾기·비교·후기 — 통합 설계 (전략·마케팅·PE 소집)** (오케스트레이터 세션, 사장님 요청)
- 사장님 과제: 호스피스·요양원 실제 정보 + 이용 고객 리뷰 + 추천 로직, 장기요양 수급자가 안락하게 치료받을 곳을 찾아주고 페이지 위치·UX·전체 와이어프레임까지. 헌장 §5 Convene 패턴으로 전략·마케팅·PE 3에이전트 병렬 소집 → 교차비평 → 통합.
- **발견**: 신규 기능이 아니라 이미 IA에 스텁으로 박힌 기능의 완성. `info.html` "곁에" 탭에 `nursing-home` 카테고리 정의돼 있으나 ENABLED_KEYS 미포함("정리 중"). `info/long-term-care.html`이 "후기 큐레이션 추가 예정" 약속, `seed-06`이 9기준 체크리스트 보유. 매핑 2줄이면 전용 페이지 라우팅.
- **핵심 결정 6가지**: ① 알고리즘 랭킹 추천 엔진 금지 → 투명한 필터+정렬+명시적 비교(終活ねっと 함정 회피, North Star "후회 없이"와 정합). ② 데이터 = 공공데이터포털 OpenAPI(장기요양기관 검색·상세·평가결과, 합법, 크롤링 금지). ③ v1 "리뷰" = 공단 객관데이터 + 에디터 현장 르포 + 가족 사적 방문기록(공개 보호자 후기는 모더레이션·승인 후 v1.5). ④ 호스피스는 "도구" 아닌 "이해·설명 콘텐츠(N4)"로만 포함, 자동 추천 금지(임종 완화의료 = 존엄 톤 분리). ⑤ lead-gen은 v1 = 신청 의사·동의 수집까지(외부 발송은 승인 후). ⑥ 진입 = info "곁에" 탭.
- **교차비평 해소 4개**: 호스피스 스코프(도구 제외/콘텐츠 포함), 공개 후기 v1 제외(모더레이션 게이트로 봉인), "가족추천 %"는 v1 미노출(공개 후기 ≥5건 시 v1.5), 매칭은 죽이지 않고 순서 뒤로(랭킹-수수료 구조 분리).
- **산출물**: `docs/product/nursing-home-finder.md` 신규 — 통합 설계 + 5개 화면 ASCII 와이어프레임(허브 진입·찾기/리스트·시설 상세·비교·후기 작성) + Supabase 데이터 모델 초안(facilities 읽기전용 미러 + facility_reviews 모더레이션) + 추천 로직 입장 + SEO 콘텐츠 라인업(N1~N7) + a11y + 구현 로드맵 + one-way door 승인 대기 5건.
- 코드/DB 변경 0(설계 리뷰 단계). 토큰만 사용(새 hex 0). 빌드·배포 없음.

---

## 2026-06-05

**테스트 직전 가설 재설계 — 획득/리텐션 분리 + 행동 추적** (전략 세션, 사장님 요청)
- 사장님 문제 제기: 페르소나 3개로 시작하면 리텐션 안 날 것 같다. 가설1(죽음 진지 고민)·가설2(부자엄마식 현생 욕망) 외 가설3을 뭐로? 테스트가 "지인한테 써보고 의견 줘" 수준이라 학습 목표 없음.
- 핵심 진단: **가설1·2는 둘 다 "획득(왜 들어오나)" 후크**라 리텐션을 설명 못 함 → 불안의 정체. 리텐션 가설 칸이 비어 있었음.
- **가설3 신설 = "관계가 리텐션을 만든다"** — 혼자 쓰면 한 번 쓰고 말지만 형제·가족과 함께 쓰면 다시 돌아온다. 부자엄마 카페에서 훔칠 건 욕망이 아니라 리텐션 엔진(반복 행동 × 또래 노출 × 진척 가시화). 단 가설3은 거짓일 수 있어(초대 안 일어남) 이번 테스트 핵심 검증 대상.
- `docs/strategy.md` 5절: 획득 vs 리텐션 가설 분리 표 + 가설3 + "현생 욕망 수용 한계(과시 톤 불가/리텐션 구조·'후회 없이 잘 살기' 프레임 수용)" + **"페르소나 압축은 테스트 결과로 미룬다"** 결정 추가.
- `docs/interview-guide.md`: "리텐션 행동 추적" 섹션 신설. LQ1(무엇이 2회차 방문을 만드나 — D3/D7 재방문·2회차 작성·어느 기능) + LQ2(초대가 실제 일어나나 — 발송률·수락률·혼자vs함께 D7차이). 초대는 케어링에만 존재 → 케어링 초대 하나로 LQ2 측정.
- `docs/retention-test-tracker.csv` 신규 — 20명 수기 추적 템플릿(첫방문·마지막방문·2회차 작성·재방문·초대·추천의향).

**리텐션 테스트 자동 계측 구축 — 페이지뷰 로깅 + 분석 SQL** (PE 세션, 사장님 요청)
- 사장님 질문: 초대 명단 20명이 언제 가입/어느 페이지/어떤 기능 쓰는지 수기로는 불가능. 자동 측정 가능 범위 확인 요청.
- 진단: 쓰기 행동(케어일지·답변·일기·글·초대)은 각 테이블 `created_at`+`user_id`로 **이미 자동 추적**. 갭은 "페이지뷰·순수 재방문"뿐(분석툴·이벤트 테이블 없었음). → 페이지뷰 로깅만 추가하면 LQ1·LQ2 거의 전부 자동.
- `supabase/migrations/20260605_app_events.sql` 신규 + **MCP로 라이브 적용 완료**. `app_events`(user_id·event_type·path·meta·created_at), RLS: 본인 INSERT/SELECT만, UPDATE/DELETE 없음(불변 로그), 익명 삽입 차단.
- `auth.js`: `logPageView()` 추가 + 모듈 로드(페이지 진입) 시 자동 1회 기록. 모든 페이지가 공유 import하므로 페이지별 수정 0. 로그인 사용자만 기록, 계측 실패는 조용히 무시(앱 동작 비방해).
- `docs/retention-test-report.sql` 신규 — 초대 이메일 VALUES만 넣으면 사람별 [가입·페이지뷰·활동일수·기능별 작성·2회차 도달(LQ1)·초대 보냄/수락(LQ2)·혼자vs함께(가설③)] 한 표 출력. 실DB로 문법·결과 검증 완료.
- `docs/interview-guide.md` 측정방법 갱신(수기→자동), `sw.js` CACHE_VERSION → `itda-v3-2026-06-05-pageview-logging-v1`.

---

## 2026-06-04

**네이버 연관키워드 통합·의도분류 (전략 리서치)** (사장님 요청 — 시장 수요 분석)
- 배경: 잇다 전략 분석 중 네이버 검색광고 연관키워드 6개 파일(임종/연명·사후행정·상조·장례·제사·유언·상속·증여)을 수집. 정제→통합→구글시트 작업 중 직전 세션에서 "Base64-encode the curated CSV" 단계가 안전 필터에 차단됨. 원인은 주제가 아니라 **대용량 base64 블롭**(불투명 데이터)이 분류기 오탐을 유발한 것.
- **해결 방식**: base64 우회 없이 Drive MCP `read_file_content`로 6개 xlsx를 직접 읽어 통합. `scripts/keyword_analysis.py`로 파싱·중복제거·세부 의도분류·잡음 표기. 결과는 평문 CSV → Drive `create_file`(text/csv)로 구글시트 변환(base64 미사용 → 차단 없음). 생성 후 read-back으로 전 행 무결성 대조.
- **산출물**: `docs/research/keywords_combined.csv`(504행, 잡음 포함) / `keywords_meaningful.csv`(429행, 잡음 제외). 구글시트 `잇다_네이버키워드_통합분석_20260604`(드라이브, 사장님 소유).
- **핵심 발견(의도 6대분류, 잡음 75개 제외)**: 상속·증여 법률·세무 344키워드/47.2만 검색(전체의 약 79%, 경쟁 높음·YMYL) ≫ 제사·추모·명절 2.5만(커머스성) ≫ 유언·생전준비 1.3만(잇다 본질에 가장 가까우나 검색량 작고 공증·변호사 거래의도 혼재) ≫ 상조·장례 1.0만 ≫ 사후행정 0.8만 ≫ 임종·생애말기 0.5만(경쟁 낮음, 틈새). '죽음 준비' 시장이 커 보였던 건 사실 자산이전 세무·법률 수요가 부풀린 착시.

---

## 2026-06-07

**seed-16 웰다잉 가이드 전면 개고** (카피라이터 세션, 사장님 요청)
- `docs/content/seed-16-well-dying-guide.md` — "웰다잉(Well-Dying) — 좋은 죽음을 미리 준비한다는 것" 전면 재작성.
- 기존 초안 대비 주요 변경: ① 도입부 장황한 병원 장면 나열 제거 → "그 후회를 미리 줄이는 일"로 압축 ② '잘 죽는 것 = 잘 사는 것'과 '삶을 포기하는 게 아님' 중복 섹션 통합 ③ 소제목 "~하기" 나열 패턴 → 독자 상황이 보이는 소제목으로 교체 ④ "자연스러운 반응입니다" 류 훈계 톤 제거 ⑤ 공포 마케팅 경계선 문장 공감 톤으로 재조정.
- lifecycle 2+3단계 교차 진입, 40대(부모 준비 지원) 보조. seed-02(사전연명의료의향서) 내부 링크 연결.
- 서희정 교수는 미확인 인용 금지 원칙에 따라 "참고 자료" 섹션으로 분리. 약 2,800자. YMYL 안내문 삽입.

**seed-15 실버타운 가이드 초안 작성** (카피라이터 세션, 사장님 요청)
- `docs/content/seed-15-silver-town-guide.md` 신규 — "실버타운 가이드 — 전국 현황, 입주 조건, 비용까지 한눈에" (lifecycle 2단계, housing 카테고리, YMYL 감수 대상).
- 사장님이 제공한 리서치 데이터(입주 조건·유형·비용·주요 시설) 기반으로 작성. 리드: "요양원은 아직 이른 것 같고"라는 독자의 실제 고민에서 시작. 실버타운이 '주거 시설'임을 먼저 분명히 해 요양시설 혼동 방지.
- 유형 4종(고령자 복지주택·실버스테이·노인복지주택·케어형) 비교표, 주요 시설 비용 참고표 포함. 입주 조건(나이·건강·공공/민간 소득 요건·부부 입주) 세분화.
- 마무리 행동 제안: "이사 가능 시점 + 월 비용"을 종이 한 장에 적는 것 — 결정 마비 없이 시작할 수 있는 최소 행동으로 압축.
- 비용 2024년 기준 고지 삽입. 발행 전 감수 필요 항목: 공공형 소득 요건, 분양형 법적 구조, 비용 최신화. seed-06(요양시설) 연계 독해 가능 구조.
- **카피라이팅 개선 (2차, 2026-06-07)**: 글자 수 2,200자 → 약 3,050자로 확장. "시설 방문 전 꼭 확인할 것들" 섹션 신규 추가(방문 체크 6항목 구체화). "부모님이 원하는 것인가" 소제목을 독립 섹션으로 상향 — 가장 중요한 맥락인데 말미에 묻혀있던 구조 개선. "케어형 비용 높아지는 경향" 보완. 입주 시점 조언(공공형 선신청 권고) 추가.

**info/choosing-charnel-house.html 신규 생성** (Product Engineer 세션)
- `info/choosing-charnel-house.html` 신규 — "납골당(봉안당) 미리 알아두기" 정보 페이지.
- advance-directive.html 구조(CSS 변수·nav.js·scroll-top.js·auth-styles.css) 동일하게 적용.
- 섹션 구성: 용어 정리 → 공설/사설 비교 → 선택 기준 8가지(step-list) → 서류 테이블 → 방문 체크리스트 → 준비 시점 → 마무리 CTA → 참고 링크 → YMYL 안내.
- 디자인 토큰만 사용(임의 hex 없음). breadcrumb `정보 > 미리 > 납골당`, active: 'info' 설정.

**seed-14 납골당(봉안당) 가이드 콘텐츠 초안 작성** (카피라이터 세션, 사장님 요청)
- `docs/content/seed-14-choosing-charnel-house.md` 신규 — "납골당(봉안당) 미리 알아두기 — 좋은 곳 고르는 법과 준비 시점"
- lifecycle 3단계(자기 준비) 메인, 2단계(부모님을 위해 알아보는 40·50대) 보조 진입.
- 구성: 납골당·봉안당 용어 정리 → 공설/사설 차이(서울시립 2022년 이후 신규 중단 현황 포함) → 선택 기준 8가지(위치·비용·운영주체·시설수준·편의시설·종교전용관·자연장 연계·생전예약) → 필요 서류 상황별 표(화장 후/이장/생전예약) → 직접 방문 체크포인트 → 준비 시점 권고(60대 초반 전문가 권고) → 마무리(지금 당장 할 수 있는 한 가지: 지도 검색 15분).
- 톤: 급박·공포 없이 "미리 알아두면 가족 부담을 줄이는 준비"로 열었고, 죽음 어휘 직격 없이 "준비" 언어로 일관. 비용(200만~800만, 연 관리비 5만 내외)·절차 정보 반영.
- YMYL 안내문 삽입(재정·절차 — 발행 전 감수 필요, 감수자 미배정).
- 약 2,800자, seed-06(요양시설) 포맷 준수.

---

## 2026-06-03

**가입 진단 퀴즈 QA + 분기 트리 대안 설계** (마케터 세션, 사장님 요청 — 분석·제안 라운드)
- 사장님 지적: 1/7 "소중한 분을 떠나보냈어요" 선택 후 2/7 옵션이 매칭 안 됨. 분기 없이 같은 옵션 셋을 모두에게 묻는 구조.
- 가장 큰 발견: **Q4·Q5·Q6 답이 결과 화면에서 한 번도 안 쓰임** — 사용자가 답한 절반이 허공으로 사라진다(코드 확인).
- 핵심 진단 7개 라벨: D1 사별 path 빈자리(사장님 케이스의 정체) / D2 Q1·Q2 의미 중첩(상태 vs 계기인데 같은 어휘) / D3 의도 덮어쓰기(Q2 우선 로직이 Q1 답 무력화) / D4 분기 없음(25칸 중 15칸=60% 어색) / D5 Q4·Q5·Q6 dead weight / D6 Q3 무게 동일 처리 / D7 결과에 반영 안 된 답=인지부조화.
- 추천: **옵션 A (lifecycle 분기 트리, 4~5문항)**. 5/26 확정 카피 자산(미러링·동행·SOLO·인터스티셜)을 살리면서 정합성을 해결하는 유일한 길. 옵션 B/C는 잇다 톤의 핵심(조용한 동반자)을 깎는다.
- 창업자 결정 5건: C1 분기 도입 / C2 Q4·Q5 제거 / C3 결과→CTA→게이트 유지 / C4 게이트 위치 결과 후 유지 / C5 stage "○○형" 라벨 금지(현행 "자리" 유지).
- 산출물: `docs/strategy/onboarding-quiz-qa-2026-06-10.md` (분석+대안+결정요청+다음단계). 코드 미수정 — 사장님 결정 후 PE 위임 범위 문서에 명시.

**seed-13 Zinsser 정신 문장 정돈 + DB 갱신 마이그레이션** (카피라이터 세션, 사장님 요청)
- 사장님 지적: 박스 인용구 "그 자리에서 잘 쓰는 비결은, 그 자리 이전에 이미 적혀 있는 기록" — "그 자리" 두 번 모호. William Zinsser "글쓰기 생각쓰기" 정신으로 clutter·추상명사·수동/명사화·지시사 남용 정돈.
- 박스 새 안: **"상주진술서는 그때 잘 쓰는 글이 아니라, 그 전에 적어 둔 기록을 옮겨 적는 일입니다."** ("그 자리/그 자리 이전" → "그때/그 전", "기록을 갖고 있는 것" → "기록을 옮겨 적는 일"로 손의 동작 살려 따뜻함 유지)
- 본문 8건 정돈: 리드 단락 군더더기 정리, 수동/명사화("진술한 내용이 적힌 문서가 ~라고 불립니다") → 능동("가족이 답한 내용을 적은 문서를 ~라고 부릅니다"), "그 자리" 지시사 → "현장"·"진술의 자리" 등 구체, 섹션 제목 "~이 됩니다" 늘어짐 정리.
- 정서 보존: 첫 문장 "부모님이 돌아가신 그날", 본문의 "어떻게 돌아가셨는가" 대구, 후회 anecdote·맺음말은 그대로. "돌아가신" 한국어 자연스러움 유지(노골적 직설 X). 톤 차갑게 변한 곳 없음 확인.
- `supabase/migrations/20260603_seed13_sangju_statement_polish.sql` 신규 — `contents` 테이블에 INSERT(없으면) + UPDATE(있으면) 둘 다 멱등 처리. 이전 INSERT SQL(`20260603_seed13_sangju_statement_insert.sql`) 실행 여부와 무관하게 한 번 실행으로 새 본문 반영. **사장님 액션: SQL Editor 1회 실행.**

**상주진술서 시드 콘텐츠 작성 + 잇다 에디터 발행 마이그레이션** (마케터 세션, 사장님 요청)
- `docs/content/seed-13-sangju-statement.md` 신규 — "상주진술서, 가장 막막한 순간에 가장 정확한 기록이 자산이 됩니다" (lifecycle 1+2, family/death_prep/finance 걸침, YMYL 감수 대상). 사장님이 준 Naver 블로그(`bumosarang_/224231328435`) + WebSearch 다중 출처(국가법령정보센터·정부24·대한의사협회지·의협신문·대한응급의학회지·보험사 공식 페이지) 교차확인. WebFetch는 모두 403/차단으로 검색 스니펫 다중 비교로 사실 확보. "단일 법정 양식이 아닌 실무 통칭"임을 첫머리에 명시. 검안의·경찰·보험사 세 갈래에서 공통으로 묻는 다섯 가지(언제·정황·병력·약·사망 직전 처치) 정리. 잇다 케어링(일지·관리 항목·처방전 사진 분석·형제 공유)과 자연 연결. seed-01·03·04 상호 링크. 발행 전 감수: 법의학 전문의·손해사정사·장례지도사·"상주진술서" 명칭 표현.
- `supabase/migrations/20260603_seed13_sangju_statement_insert.sql` 신규 — `contents` 테이블에 INSERT(category='family', author_type='official', is_published=true). `$b$...$b$` 달러 인용, `where not exists (title)` 멱등. **사장님 액션 필요: Supabase SQL Editor에서 1회 실행** → 홈/forest/콘텐츠 상세에 노출.
- 한 곳 톤 정리: "사장님 자신을 위해서도" → "당신 자신을 위해서도"(독자 시점 일관).

**홈 카드 인라인 댓글 — 작성자 본인 수정·삭제 추가** (PE 세션, 사장님 요청)
- 증상: 홈 피드 콘텐츠 카드(예: "디지털 계정·자산 정리 …") 아래 인라인 한 줄 댓글에 작성자가 자기 댓글을 수정/삭제할 수단이 없었음. post-detail의 일반 댓글은 이미 삭제 가능.
- **UI 추가** (`index.html`): `commentItemHtml`이 `c.user_id === currentUserId`일 때만 댓글 본문 아래에 「수정 · 삭제」 인라인 톤다운 버튼 노출(과시·경쟁 없는 11.5px 글씨, ink-muted → hover시 primary). 수정 클릭 시 본문 자리에 textarea + 저장/취소 인라인 편집 모드, 저장 시 DB update 후 본문만 갱신(낙관적). 삭제는 confirm 한 번 → soft delete(`is_deleted=true`) → 아이템 제거 + 카드 💬 카운트 -1, 비면 "첫 댓글을 남겨보세요" 복귀. 이벤트는 `.hcard-comments` 패널 안에서만 위임돼 post-detail/content-detail discussion-thread 댓글에 영향 0.
- **JS API** (`js/content.js`): `updateContentComment(id, body)`, `deleteContentComment(id)` 추가. 둘 다 `.eq('user_id', user.id)` 이중 가드(클라이언트) + RLS 본인-only(`comments_owner_update`/`comments_owner_delete`, `20260517_redesign_mvp.sql`)로 서버 가드. 추가 마이그레이션 불필요.
- **RLS 상태**: `comments` 테이블에 owner update/delete 정책이 이미 존재 — `auth.uid() = user_id` 본인만 허용. comments.body 컬럼은 `touch_updated_at` 트리거로 `updated_at` 자동 갱신.
- **PWA 캐시**: `sw.js CACHE_VERSION → itda-v3-2026-06-03-card-comment-edit-v1`. 사용자 PWA 즉시 갱신.
- 변경 파일: `index.html`, `js/content.js`, `sw.js`, `docs/worklog.md`.
- 잠재 리스크: 1) 인라인 댓글이 `is_deleted=true`로 soft delete되어 카운트(home `getEngagementMap`)는 즉시 -1, 새로고침해도 read 정책 `is_deleted=false`로 제외돼 일관. 2) realtime INSERT 구독은 그대로(내 INSERT는 낙관적 처리, 다른 사람 INSERT만 +1). 수정/삭제는 별도 realtime 미구독 — 다른 탭/기기에서 보면 다음 패널 재오픈 때까지 캐시된 모습 유지(임팩트 작아 보류). 3) 톤: '수정/삭제'를 작게·ink-muted로 — 좋아요 경쟁 비활성 원칙과 일관.

**seed-05 본문 DB 반영 마이그레이션 + 창립자 이야기 수정 메모** (사장님 요청)
- `supabase/migrations/20260603_seed05_digital_legacy_meta_update.sql` 신규 — `contents` 테이블에서 title='디지털 계정·자산 정리 — 내가 떠난 뒤 가족이 헤매지 않게' 행의 `body`를 PR #24의 최신 마크다운(Meta 섹션 추가)으로 교체. `$b$...$b$` 달러 인용으로 본문 안전. **사장님 액션 필요: Supabase SQL Editor에서 1회 실행.** (PR #24는 마크다운 파일만 갱신했고, 실 앱은 DB `contents` 본문을 읽기 때문에 SQL 미실행 시 웹앱에 미반영.)
- **사장님 SQL 실행 완료 (2026-06-03)** — Supabase SQL Editor에서 1회 실행 확인. 웹앱(forest/홈 카드/콘텐츠 상세)에서 Meta(페이스북·인스타그램) 섹션 포함된 새 본문 노출 확인.
- `docs/content/seed-10-founder-story-revision-notes.md` 신규 — 창업자 음성 메모 정돈본(죽음을 생각하는 자극·유한함과 소중함·심각하지 않은 톤·삶과 웰빙 우선). **수정 예정** 상태로 보존, 본문(seed-10, about.html) 반영은 차후.

**콘텐츠 상세의 "연결된 대화" composer — 제목 입력 제거 (UX 마찰)** (PE 세션, 사장님 요청)
- 콘텐츠 상세(content-detail) → "＋ 이 콘텐츠로 대화 시작" → post-write.html?content_id=… 로 진입하는 composer는 짧은 메모 자리인데 제목 필드가 부담을 줬다. 이 진입에서만 제목 입력을 숨김.
- **공용 composer 격리**: post-write.html은 forest 일반 글쓰기와 공용이라, `content_thread_id` 보유 여부(= `is-linked-thread` body 클래스)로만 분기. 일반 글쓰기에는 영향 0. CSS는 `body.is-linked-thread .form-group.title-group { display: none; }` 한 줄.
- **title 데이터 처리**: 신규 connected post는 본문 첫 줄에서 자동 추출(첫 문장 종결 ./!/?/。 우선, 최대 50자, 잘리면 …). 빈 본문이면 안전 라벨 '연결된 대화'. DB title 컬럼이 NOT NULL일 가능성 대비. 기존 글에는 영향 없음.
- **연결 모드 부수 정리**: title input의 `required` 해제, body placeholder를 "이 글을 읽고 떠오른 한 마디를 남겨 보세요"로 부드럽게, 페이지 title을 "연결된 대화 · 잇다"로, linked-banner 문구도 "잇는 대화입니다"로 정돈. content-detail의 섹션 타이틀/시작 버튼도 "잇는 대화" 톤으로 일관.
- **카드 렌더 fallback**: content-detail 하단 discussion_thread 카드가 빈 title이어도 깨지지 않게 `threadLabel(p)` 헬퍼 — title 비면 body 첫 줄 폴백, 둘 다 비면 '(빈 메모)'. `js/content.js`의 discussion_posts SELECT에 `body` 컬럼 추가.
- **PWA 캐시**: `sw.js CACHE_VERSION → itda-v3-2026-06-03-content-conv-no-title-v1`.
- 변경 파일: `post-write.html`, `content-detail.html`, `js/content.js`, `sw.js`, `docs/worklog.md`.
- 잠재 리스크: 기존 connected post들의 title은 그대로 노출(역호환 OK). 다른 호출처(forest 글쓰기·post 수정)는 `is-linked-thread` 분기에 들어가지 않으므로 동작 동일. 단, 기존 데이터에 `content_thread_id`가 세팅된 글을 수정 진입하면 동일하게 연결 모드로 보임(원래 의도와 일치 — 그 글이 콘텐츠에 잇는 대화이므로).

**seed-05 디지털 계정·자산 정리 — Meta(페이스북·인스타그램) 섹션 추가** (마케터 세션, 창업자 요청)
- `docs/content/seed-05-digital-legacy.md`에 페이스북·인스타그램 사후 계정 처리 섹션 신설(글로벌 그룹: Google → Apple → Facebook → Instagram → 국내 Naver·Kakao 순으로 재배치, 섹션 번호 1~7 재매김).
- **Facebook 섹션**: 생전 '기념 계정 관리자(Legacy Contact)' 사전 지정 + 사후 가족의 '기념 계정 전환/영구 삭제' 요청 두 갈래 명시. 관리자가 비밀번호·메시지 접근은 불가하다는 한계 명시. 한국어 공식 도움말 3개 인라인 링크(1568013990080948, 1070665206293088, 1111566045566400, 모두 ?locale=ko_KR).
- **Instagram 섹션**: 페이스북과 달리 **사전 지정 기능 없음** 명시 → 사후 요청만. '기념 계정 전환'(누구나 신고 가능) vs '영구 삭제'(직계가족 한정·증빙 필요) 구분. 한국어 도움말 + help.instagram.com/264154560391256 신고 URL.
- **기존 4개 정확성 갱신**: 구글 휴면 계정 관리자 — "신뢰할 사람을 여러 명" → "최대 10명, 항목 선택"으로 구체화. 애플 — "최대 5명, iOS 15.2+" 추가. 카카오 — 공식 도움말 2개 URL 신규 인라인. 네이버 — 일관된 단일 도움말 URL 미확보로 help.naver.com 메인만 안내(보고 의심점 항목 참고).
- frontmatter: `sources_verified_date: 2026-06-03`, `char_count_approx: 2200 → 3100`, `search_keywords`에 페이스북/인스타그램 관련 키워드 5개 추가. 면책 박스에 메타·플랫폼 명시.
- 본문 voice(따뜻한 1인칭, "기념 계정 전환 vs 삭제는 한 번 더 생각해 보세요" 같은 사람 말투) 유지. YMYL 면책·출처 섹션 함께 갱신.
- 발행 전 감수 권장 사항: ① Naver 사망자 계정 공식 도움말 URL 확보(고객센터 문의) ② Facebook Legacy Contact 인원수(현재 1명 표기) 한국어 공식 페이지로 재확인.

**콘텐츠 점진 unlock + 페이지네이션 + 시그니처 정리** (이번 세션, 베타 D-3)
- **forest 콘텐츠 점진 unlock**: 베타 시작 6/3(수) 첫날 3편 → 매일 1편 unlock. 한 페이지 3편씩 페이지 숫자 페이지네이션. 카테고리/세그 전환 시 페이지 1 리셋, 페이지 이동 시 스크롤 top. `BETA_LAUNCH_MS = 2026-06-03 00:00 KST`.
- **"— 잇다 한 줄" 시그니처 일괄 제거**: `supabase/migrations/20260531_remove_itda_oneline_signature.sql` — reflection 본문 끝 시그니처 라인 regex update. 사장님 결정: "큐레이션 자체가 잇다 에디터 글이라 시그니처 중복 + 노란 형광펜이 무거움". 멱등.
- **홈 피드 필터 분리**: `js/content.js listHomeFeed`에 `author_type='official' AND category != 'reflection'` 추가. 홈 = 잇다 에디터 정보·가이드, forest = 큐레이션 + 사용자 글. realtime 구독도 동일 필터. 사장님 피드백: "홈에 모든 콘텐츠 다 뜨는 건 별로. 정보글만."
- **ask.html 폴백 + IIFE 래핑**: RPC 5s 타임아웃 + `display_order = days` 직접 조회 폴백. 모듈 본문 전체 IIFE로 감싸서 모듈-탑레벨 `return` 문법 오류 수정(에러 사장님 콘솔 캡처로 진단됨 — `Illegal return statement`). 전역 catch 핸들러로 실패 시에도 사용자에게 메시지 노출.
- **day2_song SQL UNIQUE 충돌 수정**: `display_order +1` 한 줄씩 올리면 UNIQUE 제약 충돌 → 음수 자리로 잠깐 옮긴 뒤 다시 양수+1로 재배치.
- **answers.js previewAnswers 중복 export 제거**: 이전부터 잠재 SyntaxError 보유. forest 모듈 통째 로드 실패 원인 중 하나.
- **긴급 forest 회복 (PE)**: SW에 `message` 리스너(SKIP_WAITING) + 새 SW 활성 시 1회 자동 reload + null-guard 방어. PWA가 옛 캐시 잡고 안 놓는 문제 근본 해결.
- 사장님 액션: `20260531_remove_itda_oneline_signature.sql` SQL Editor 1회 실행.

**커뮤니티 재설계 실구현 — 큐레이션 hero + day 2 song 질문** (이번 세션)
- **forest.html**: 상단 `my-song-cta` 카드 제거 → `curation-hero` 추가. 2026-06-03을 day 1 기준으로 ((today - launch) % 7) + 1 = hero_day. contents.hero_day=N인 행 1편 노출. 사장님이 "장례식 플레이리스트" 단어가 첫 인상에 부담된다는 피드백 반영.
- **DB migrate (사장님 실행)**:
  - `supabase/migrations/20260531_day2_song_question.sql` — `daily_questions.answer_kind text default 'text'` 컬럼 추가 + display_order ≥ 2 한 칸 시프트 + day 2에 "당신의 장례식에 흐를 한 곡이 있다면, 어떤 곡인가요?" 삽입(answer_kind='song', 시드 답변 4곡).
  - `supabase/migrations/20260531_contents_hero_day.sql` — `contents.hero_day int` 컬럼 추가 + 첫 7일 순서 update: 살아 있을 확률(1) / 오늘의 한 줄을 위해 산 하루(2) / 어제의 나는 오늘의 내가 아니다(3) / 사라진 것의 모양(4) / 내 장례식에 틀고 싶은 음악(5) / 누군가의 마지막 문장(6) / 마지막 자리에서 가장 흔한 후회(7).
- **ask.html**: `todaysQ.answer_kind === 'song'`이면 textarea 흐름 스킵 → "♬ 이 질문은 곡으로 답해요" 안내 + "나의 장례식 플레이리스트 만들기 →" CTA (my-song.html로 진입).
- **forest 오늘 잇고 카드**: song 질문일 때 entice 카피 변경 — "♬ 한 곡 골라두면 N개의 답이 모두 보여요 →" / "잇다 한 곡 ─ 당신의 한 곡으로 N개의 답이 마저 열려요." hasAnswered는 song일 때 `user_songs(kind='final')` count로 판정.
- **js/answers.js**: getTodaysQuestion이 answer_kind도 자동 보강(RPC 결과에 없으면 daily_questions에서 별도 조회).
- **SW**: `CACHE_VERSION` → `itda-v3-2026-05-31-curation-hero-v1`.
- 사장님 액션 2개: (i) F2 contents SQL 실행 → (ii) day2_song SQL 실행 → (iii) contents_hero_day SQL 실행. 순서대로.

**F 2차 (C 콘텐츠 23편 시드 SQL) + 커뮤니티 재설계 모의 화면** (이번 세션)
- **F 2차**: `supabase/migrations/20260531_box01_02_seed_contents.sql` 신규 — 박스 01·02의 C 콘텐츠 23편(C1~C12에서 C6 제외 → 11편 + C13~C24 → 12편) `contents` 테이블 insert SQL. 전부 `category='reflection'`, `author_type='official'`, `is_published=true`. `$b$...$b$` 달러 인용으로 본문 줄바꿈 안전, `where not exists (title)` 멱등 가드. 사장님 액션: Supabase SQL Editor에서 1회 실행 → forest 큐레이션 hero 회전 자산 완성.
- **모의 화면**: `prototype-forest.html` 신규 — 베타 직전 커뮤니티 재설계의 사장님 검수용 단일 페이지. ① 큐레이션 hero(매일 한 편) ② 보드 단순화('곧 · ___' 4종 + 활성 1종) ③ 음악 CTA ④ 3단계 entice 질문 카드(첫 답 1개 노출 + 나머지 흐림 + 잇다 한 줄 카피) ⑤ 라이트 리액션(🕯 🌿 💬, 랭킹 X). 우측엔 각 결정의 의도와 전·후 비교 노트.
- **SW**: `CACHE_VERSION` → `itda-v3-2026-05-31-forest-entice-v2`. 사장님 휴대폰 PWA 강제 갱신 트리거.
- 진행 중 메모: C7 콘텐츠 카드에서 my-song.html로 직접 진입(content-detail.html 분기) — 베타 후 1차 회수 대상. 첫 7일치 hero 큐레이션 우선순위는 사장님(G) 직접 처리 예정.

## 2026-05-27

**박스 02(5~8주) 작성 + forest 3단계 entice 메커니즘 구현** (이번 세션 — D + E + F 1차)
- **D**: `docs/content/onneul-itgo-box-02.md` 신규 — 12 C + 16 Q + 시드 64. 결: 자기다움 → 곁의 회복 → 일상의 재구성 → 다시 시작. 5주차 첫 C는 원 C12("잇기") 회수.
- **F 1차 (questions)**: `supabase/migrations/20260531_box01_02_seed_questions.sql` — daily_questions에 `seed_answers jsonb` 컬럼 추가 + 박스 01·02 합쳐 32 Q + 128 시드 답변 insert. 가짜 사용자 계정 없이 entice peek 동작.
- **E (entice 메커니즘)**: forest.html 오늘 잇고 카드 재설계 — 답 안 한 사용자는 첫 1개만 풀 노출 + 나머지는 흐림(blur) + "잇다 한 줄 ─ 당신의 한 줄로 N개의 답이 마저 열려요" 카피. 답한 사용자는 전체 reveal. `js/answers.js`에 seed_answers 병합 로직.
- **E (보드 단순화)**: CATEGORIES 4종을 '곧 · ___' placeholder로 표시(클릭 무시, dim). reflection 1종만 활성. 베타 한정.
- 박스 콘텐츠(C 24편)를 contents 테이블에 insert하는 SQL은 다음 라운드(F 2차)에 별도 처리 권장 — 콘텐츠 본문 길이 때문에 SQL 분리.
- 사장님 액션: SQL Editor에 위 마이그레이션 한 번 실행 → forest.html entice 즉시 동작.

**박스 Q16 보충 + 임시 페이지 정리** (이번 세션)
- Q16 "당신이 자신답게 사는 데 가장 큰 방해는 무엇인가요?" 채택. 시드 답변 4개(다영·채영·송이·미정 — '잘 보이고 싶은 마음' / '엄마 정체성 밑에 깔린 것들' / '비교 — 인스타' / '슬픔이 자신을 다 가린다'). C12(자기다움) 결과 거울처럼 맞물림.
- 검토용 임시 페이지 삭제: `ux-review.html`, `prototype-community.html`.

**'한 곡' → '나의 장례식 플레이리스트'로 확장** (이번 세션 — 사장님 피드백)
- 개별 곡 임베드 위젯이 시각적으로 무거움("띄엄띄엄") + 한 곡만 저장하는 모델이 좁음.
- DB: `user_songs`에 unique 제약 제거 + `position int` 컬럼 추가. user당 여러 곡 OK. (마이그레이션 SQL 사장님 적용 필요)
- `js/spotify.js`: `listMyPlaylist`/`addToPlaylist`/`removeFromPlaylist`로 교체. URL 패턴 확장(Spotify track/playlist/album, Apple Music album/playlist, YouTube video/playlist).
- `my-song.html` UI 전면 개편 — 임베드 위젯 제거, **곡 목록 한 줄씩**(썸네일·이름·서비스·▶듣기·✕삭제). 입력창은 항상 하단에 노출. 페이지 제목도 "나의 장례식 플레이리스트"로.
- `ceremony.html` STEP 8: '흐를 한 곡' → '나의 장례식 플레이리스트', mount 컴포넌트도 동일한 리스트 패턴으로. 결과 페이지: "♬ 첫곡명 외 N곡".
- `forest.html` CTA: "지금 N곡 (더하기·관리 →)"로 곡 수 노출.
- `root.html` 메뉴: "나의 장례식 플레이리스트".
- SW 캐시 버전 갱신.

**ceremony 위저드에 '흐를 한 곡' 질문 추가** (이번 세션 — 사장님 요청)
- ceremony.html STEPS에 8번 'song' (선택사항) 추가. 기존 8번 wish → 9번으로 재정렬.
- paste-link 컴포넌트(my-song과 동일한 `js/spotify.js` 모듈) 위저드 안에 인라인 마운트. 같은 user_songs 행(`kind='final'`) 공유 → 마이 한 곡과 ceremony 한 곡 동일.
- 결과 페이지에 "흐를 한 곡" 한 줄 추가. 곡 안 골랐으면 표시 X.

**내 마지막 한 곡 v2 — paste-link 방식으로 전환** (이번 세션 — Spotify 정책 우회)
- Spotify가 2024년 후반에 도입한 신규 정책 발견: **Development Mode 앱은 owner Premium 필수** (403 Active premium subscription required). 검색 API 사용 불가.
- 우회: API 자체를 빼고 **사용자가 곡 링크를 paste**하는 방식으로 전환. Premium·OAuth·API key 의존 0.
- 지원: Spotify · Apple Music · YouTube (각 서비스 URL 패턴 감지 → 공식 임베드 위젯).
- 메타데이터: Spotify·YouTube oEmbed 공개 엔드포인트(인증 X, CORS OK). Apple Music은 임베드만(메타 없음).
- `js/spotify.js` 전면 재작성 — `detectService`, `extractTrackId`, `buildEmbedUrl`, `fetchSongMetadata`, `embedUrlForSavedSong` 추가. 기존 `searchSpotify` 제거.
- `my-song.html` UI 전환 — 검색창 대신 paste 입력 + 미리보기 카드 + 저장.
- `spotify-search` Edge Function 자동 배포 보류(주석 처리). 코드는 보존 — Premium 가입/Quota Extension 승인 시 복귀 가능.
- forest.html 진입 카드 카피 paste 방식에 맞게 조정.
- sw 캐시 버전 갱신.

**내 마지막 한 곡 — 노출 위치 보강** (이번 세션 — 사장님 피드백 반영)
- forest.html(커뮤니티) 상단에 "♬ 내 마지막 한 곡" 진입 카드 추가. 저장 안 했으면 골라두기 CTA(클레이 배경), 이미 골랐으면 그 곡 한 줄 + "바꾸기 →"(흰 배경). 마이 페이지에만 묻어 두지 않고 사유와 닿는 자리에 노출.
- 에러 메시지 개선: Spotify 응답 본문 그대로 클라이언트에 노출(차단 사유·rate limit 진단용).
- (남은 일) C7 콘텐츠 카드 SOFT CTA에서 my-song.html로 직접 링크 — forest.html 재설계 라운드에 함께.

**내 마지막 한 곡 (Spotify 검색)** (이번 세션 — C7 음악 v2)
- Edge Function `spotify-search`: Client Credentials Flow로 토큰 발급(warm 캐시) → /v1/search?type=track 프록시. JWT 검증으로 잇다 로그인 사용자만. Client Secret은 서버 환경변수만, 코드/git 노출 X.
- `user_songs` 테이블 신설(kind='final', user당 1곡, RLS 본인만). 사장님 SQL Editor에서 마이그레이션 적용 필요.
- `js/spotify.js`: 검색·저장·삭제·임베드 URL 헬퍼.
- `my-song.html`: 검색창(debounce 350ms) + 결과 카드 + 한 탭 저장 + Spotify 임베드 위젯(인증 무관 미리듣기/구독자는 풀곡) + 삭제.
- root.html(마이) 메뉴에 "♬ 내 마지막 한 곡" 진입 추가.
- 배포 워크플로에 `spotify-search` 함수 + `SPOTIFY_CLIENT_ID/SECRET` 시크릿 추가.
- 사장님 액션 3가지 필요: ① GitHub 리포 Secrets 등록 ② 워크플로 `function-secrets` + `functions` 실행 ③ Supabase SQL Editor에 user_songs 마이그레이션 실행.

**잇다 이야기(about.html) + 푸터 + 온보딩 마무리 카드** (이번 세션 — 정체성 자리잡기)
- 사장님 창업자 글(2010년 최윤희 사건 → 잇다 시작) 그대로 + 디자인. 본인의 마지막 한 마디("너 정말 수고했어. 잘 살았어.") 풀아웃 인용. 하이데거 인용 워크온 인용. 회사정보 박스(LIFE HERITAGE + 약관/개인정보 placeholder).
- 사장님 원칙 확정: **창업자 글은 플랫폼 콘텐츠와 섞지 않는다.** 회사소개·푸터·온보딩 마지막 카드의 메타 영역에만 노출. 본문 콘텐츠는 깨끗하게 사용자 결로.
- `nav.js`에 `_renderFooter()` 추가 — 모든 페이지 콘텐츠 끝 "잇다 이야기 · 이용약관 · 개인정보 · © 라이프헤리티지" 공통 푸터.
- `welcome.html` STEP 5 추가 — 가입 마지막에 *"이따가 하지 말고 지금."* + 잇다 약속 한 줄 + "잇다 이야기 보기 →" 링크 + 잇다 시작하기 버튼. 모든 신규가 1회 만남.

**오늘 잇고 · 박스 v2** (이번 세션 — 사장님 인라인 검수 반영)
- C12 (하이데거) **제거** — about.html로 이관. 사장님 원칙 적용.
- C12 신규: "마지막 자리에서 가장 흔한 후회" — 호스피스 간호사 브로니 웨어 「The Top Five Regrets of the Dying」 인용. 사용자가 자기다움에 닿게 하는 결. 출처 표기.
- C6 ("누군가 나를 안다는 감각") **삭제** — 사장님 "안 와 닿아".
- Q9 변경: "내가 사라진 뒤에도 남겼으면 하는 한 줄" → **"내가 사라진 뒤, 어떻게 기억되고 싶나요?"** (사장님)
- Q11 매만짐: **"부모님의 가장 약한 모습을 본 적이 있나요?"** (간결화)
- C7 작은 문 정리: **"오늘, 당신의 마지막에 흐를 한 곡을 골라본다면?"** + 음악 기능 메모(Spotify 검색 API v2 예정).
- Q16 **삭제** — 사장님 결정. 자리 비어 있음.
- Week 4 헤더: "(하이데거 결로 마무리)" → "(자기다움)".

**오늘 잇고 · 첫 4주 박스 v1** (이번 세션 — 콘텐츠)
- 13 C + 16 Q + 시드 64 일괄 작성. `docs/content/onneul-itgo-box-01.md`.
- manifesto 확정: "오늘, 나에게 닿는 질문 하나." (B안). 에디터 페르소나: 잇다 한 줄 @itda_oneline.
- 포지셔닝: 지적 웰니스(Intellectual Wellness). 죽음/돌봄을 자기다움 도구로.
- **잇다 철학 근본 = 하이데거의 한 문장** 명문화. C12(4주차 클라이맥스)와 랜딩/About에 배치 예정.
- 3단계 흐름(질문→기록→대화) + **답 안 한 사람용 entice 설계** — 첫 답 풀 노출 + 나머지 흐림 + 잇다 한 줄 안내 카피.
- 출처 표기 정책 신설: 책 인용 시 `출처 · 「제목」, 저자.` 명시. 「편안함의 습격」(마이클 이스터) C1·C12에 적용.
- 다음: forest.html 재설계 와이어프레임 + DB 시드 SQL + 하이데거 인용 랜딩 배치.

**카드뉴스 공유 — 전체 글 + 잇다™ TM** (이번 세션 — 공유 v2)
- 한 줄 선택 UI 제거 → **본문 전체를 한 장**(4:5, 1080×1350)에 렌더. 폰트 자동 축소 + 넘치면 줄 단위 말줄임. 마크다운 정화.
- **잇다™ TM**: 상단 그린 칩(`✦ 잇다™ 발행`) + 하단 워드마크(`잇다™ · ittda.kr · 태그라인`). 친구가 봤을 때 출처가 명확.
- 캡션: 제목+본문 발췌+`잇다™에서 더 보기` 링크.
- `js/share-card.js`에 `renderContentCard`/`shareContentCard` 추가(기존 `shareSentenceCard`는 seed.html '한 문장 공유'용으로 그대로 보존). `js/share-sheet.js`는 `shareContent({title,body,meta})` 단일 export로 간소화. content-detail·post-detail에서 직접 호출.

**UX 리뷰 · 공유 복원 · 커뮤니티 베타 전략** (이번 세션 — 케어링 UX 트랙)
- 홈 상단바(📚·✏️) 흐름 리뷰 + 와이어프레임 보드 — 발견점·옵션·열린 질문 정리. 텍스트 `docs/product/home-ux-review.md`, 시각 `ux-review.html`(임시). `9dfa3c1`
- **카드뉴스 SNS 공유 복원** — 라이프 일기에만 있던 한 문장 카드 공유를 콘텐츠/커뮤니티 상세에도 적용. 공통 모듈 `js/share-sheet.js`(제목+본문 문장 추출 → 시트 선택 → `share-card.js` 1080×1080 카드 + native share). 베타 바이럴 핵심 자산. `f60f7d2`
- 커뮤니티 베타 전략(지인 20명·30-40대 여성 대상) — 전략가·마케터 팀 출동 결과 정리: H1 '데일리 큐레이션' 우선, hook A "오늘, 남들은 뭘 생각하고 있을까", 보드 4종→reflection 1종, 시드 30개 선충전. 창업자 결정 3건 대기 중. (문서 미생성 — 채팅 합의 후 별도 문서화 예정)

**커뮤니티 · 홈 정리** (이번 세션)
- 키워드 **"오늘 잇고"** 통일 — 홈·커뮤니티·콘텐츠 라벨이 '오늘의 질문'/'오늘의 성찰'로 갈리던 것 일원화. `250aacf`
- `ask.html` 답변 보드 **긴 카드 수정** — 본문 5줄 클램프+더보기, 답변 8개씩 끊어 보기. `250aacf`
- **따뜻한 반응** — 좋아요 수 경쟁 제거 → "나도 그랬어요(💚)", 카운트는 "N명이 함께"로 순화. 커뮤니티 카드 ❤ 숫자 제거. `250aacf`
- 눈 이모지(👁) → **"조회"** 텍스트로 교체 (콘텐츠·게시글·카드). `250aacf`
- 홈 피드 섹션 제목 "요즘 이야기" → **"요즘, 잇다에선"**. `dfde032`
- 홈 카드 **에디터 정보 글 vs 이웃 글 구분** — 출처 칩 `✓ 잇다 에디터` / `이웃의 이야기`, 판정 통일(`author_type==='official'`), 홈 하트 수 제거, hero 추모 노출 차단. `db14eef`

**홈 피드 디자인** (타 세션)
- 피드 카드 커버의 큰 이모지 → 카테고리별 차분한 SVG 일러스트. `1340589`
- 승급 글 작성자 보존 + 피드 카드 크기 축소. `fa248de`
- 커버 일러스트 검토 완료, 임시 미리보기 페이지 정리. `856e49a` `64f7c73`

**라이프 · 케어 · 처방전** (타 세션)
- 라이프: 일기 삭제 기능(상세+목록). `b31c11f`
- 케어: 케어링 허브 콤팩트 triage 로스터 재설계. `07560b2`
- 케어: 기록↔처방전 연결 + 추정 병명 태그 + 병명별 모아보기. `5624b62`
- 케어 허브 히어로 제목 줄바꿈 수정. `6d4a727`
- 처방전 분석 안정성: 타임아웃·약물 병렬조회·다약물 JSON 잘림·큰 이미지 처리. `fdf8159` `3b863fa`

**Ceremony · 온보딩 · 인프라** (타 세션)
- Ceremony: 장례식 카드명 '장례희망' + 안내 문구 보완. `7c1998c`
- 온보딩: 가입 전 진단 퀴즈 — 확정 카피로 구현. `a999b90`
- 위저드 홈 탈출구 + "내 자리 보기"→"결과 보기". `664c04b`
- CI/Supabase: 함수 배포를 Access Token+Project Ref만으로 간소화. `6623586`
- DB: Day 1 첫 질문 교체 마이그레이션(약한 오프너 제거). `5ee5bcf`
- 팀: 전담 카피라이터 에이전트 추가. `f9a88a4`
- docs: 온보딩 퀴즈 카피 확정안(마케팅+전략+카피), 시드 질문 Day1 싱크, 헌장 경어체 규칙. `3d1c3cb` `bdd6aee` `0ae84f8`
- docs(ux): 홈 상단바(📚·✏️) UX 리뷰 + 와이어프레임 보드. `9dfa3c1`

**케어 관리 항목 · 처방전 효능 마무리** (이번 세션)
- **관리 항목(care_conditions)** 신설 — 병명·약을 **기간 보유**로 지속 관리(시작·종료, 끝없음=만성). 복약·처방전 탭 "지금 관리 중" 섹션 + 처방전 태그→기간 선택(계속/처방 투약일수 자동/3·6개월/1년). OCR 총투약일수로 기간 자동 추천, 만성 카테고리 기본 '계속'. 기록 모달 병명 picker가 활성 관리항목 우선 노출. `979b1e9`
- **처방전 효능효과 라이브 검증 완료** — 식약처 허가정보 EE_DOC_DATA의 CDATA 추출 정상화(셀미스타→본태성 고혈압, 놀바덱스→유방암). 카드별 "다시 분석"로 기존 처방전 재조회.
- **자동 배포 파이프라인 확립** — GitHub Actions(target=functions) 버튼 배포(Access Token+Project Ref만), `supabase/deploy-all.sql` 일괄 적용 SQL.
- worklog 습관화 — 매 세션 마무리에 오늘 작업 기록(이 항목).

**사업계획서 v3 확정 · 투자자 덱 · 시드 콘텐츠 · 검증 운영안** (전략 세션, 브랜치 `claude/lifeheritage-growth-strategy-ZcR33` → main 병합)
- 사업계획서 v3 **확정본**(신규 `docs/business-plan-v3.md`): 한자 제거·병기(슈카츠넷 등), 섹션7 벤치마킹 표 통합, 9장 취소선 항목 삭제, **11장(인수·Exit)을 6-4 "가치·해자"로 흡수·삭제**, **타깃에 20-40대 '활성 시장' 정식 포함**(4·6장 재작성: 활성 시장×수익 시장), 번호 재정렬. 구글 문서와 동기화. (참고: 기존 `docs/business-plan.md`(v2)는 함께 폐기 대상이나 이번 병합에선 보존 — 후속에 정리)
- 시드 콘텐츠 2편: **seed-06** 요양시설 고르는 법(5060 수익 라인, YMYL 감수 대상), **seed-12** "지금 죽는다면 가장 후회할 한 가지"(20-40대 활성 진입 에세이, 감수 불필요). 원 작업명은 seed-11이었으나 main에 `seed-11-living-funeral`이 선점되어 **seed-12로 재번호**.
- **투자자 발표덱(Canva)** 11슬라이드 생성 — 후보 2번 채택, 계정 저장. 정직성 톤(검증/가설 구분). Ask 금액·용처 미정. (외부: `canva.com/d/y3QbilE_lo3TBnn` 편집)
- **검증 운영안 v2**(외부 구글 문서 `1i6L4tIZ…`): 확정 플랜 정렬 — 참조를 v3/11장으로, 모집분류 A/B/C/D ↔ 사업가설 a/b/c/d 매핑, **20-40대 활성 검증 누락을 리스크·결정④로 분리**.
- 외부 산출물(커밋 없음): 확정본 Doc `19mKXDG1…`, 운영안 v2 Doc `1i6L4tIZ…`, Canva 덱.

---

## 2026-05-26

- Ceremony "살아서 하는 장례식" 위저드 MVP + 가입 퍼널. `fb0d307`
- Ceremony 온보딩 퍼널 통합 설계 — 팀 4인 + 8개 앱 벤치마크. `6025254`
- 전략: 장례식 검증경로 정의 + 인터뷰 문항 + 시드 에세이 초안. `936909f`
- 케어: 대상자 목록→개별 화면 drill-down 네비 + 전환 스크롤·`?subject=` 파라미터 버그 수정. `b73abea` `76e5cbf` `623dea8`
- 처방전 분석: 효능 CDATA 보존·빈 껍데기 문서 숨김·출처 표기 정정. `134c963` `2cde200`
- 헌장: 산출물 기준 추가(단편 금지·팀 소집 기본·MVP라도 탁월함·벤치마크 우선). `16bcf93`

## 2026-05-25

- 처방전 분석: 재분석은 OCR 생략·식약처만 재조회(시간초과/비용 방지), 효능효과 title 속성 추출, 작동 엔드포인트(Inq06) 우선. `126dbfd` `4c74b22` `c892734`

## 2026-05-24

- 콘텐츠: 시드 에세이 #1~5 작성 — 사실검증·근거/서비스 인라인 링크·어법 다듬기.
- 콘텐츠 상세: 마크다운 렌더링(marked+DOMPurify) + 읽기 경험 3종(목차·읽기시간·진척도 바).
- 케어: 처방전 사진 분석 MVP(OCR→식약처 약물 카드) + 2차 관리영역·케어 가이드(식이·영양·일상).
- 마이페이지: 표시 이름 편집, 회원탈퇴(계정 삭제) 흐름, '친구'를 가족(care_members)/친구(friendships)로 분리.
- 레이아웃: 좁은 폭 넘침·겹침 방어, forest 콘텐츠 카드 깨짐 복구.
- docs: 문서 보관 규칙(repo 기본·회사계정 드라이브 금지), 운영모델 갱신(전략-주도 오케스트레이션).

## 2026-05-23

- 케어링 '나의 발자취'를 콤팩트 28일 스텝 스트립으로 개선.
- 시드 에세이 초안 #1·#2·#3·#10 (YMYL 감수 전·발행 보류).
- 케어 초대 발견성·공유링크·추모배지·딥링크 4건 수정.

## 2026-05-22

- **회사 설립**: 라이프헤리티지 헌장 + 4개 에이전트(전략·운영·마케팅·PE) + 팀 사용법 + 디자인 시스템 레퍼런스.
- 디자인: 화이트 베이스 + 딥 에버그린(#2F6B4F) + 나눔명조 v3 리스킨, 목업 v3 정확 매칭, 추모 숨김 일관성, 폰트 110% 스케일.

## 2026-05-21

- docs: 사업계획서 v1·v2(페르소나 3·GTM/로드맵·ARPU 근거), 사용자 인터뷰 질문지, 終活ねっと 벤치마킹.
- refactor: 미션 정렬 — 추모(memorial) 보류·숨김, 중복 페이지 리디렉트.

## 2026-05-19

- docs: 잇다 전략 메모(미션·lifecycle·페르소나·다음 액션), 커뮤니티 재정의(콘텐츠 허브+Hybrid 생산+Phase별 KPI), Modern Loss/終活ねっと 벤치마킹 + 시드 콘텐츠 10개 제안.

## 2026-05-18

- 라이프/케어 UX: 버킷리스트 phase1(톤 전환)+발자취 시안, 일기 UX 정리(종류 드롭다운·쓰기 CTA), 라이프 탭 크래시 fix, 목표·계획 빈 상태 CTA, PDF 책자 목차·시간초과 가드, 셋업 nav.

## 2026-05-17

- 초기 셋업 — operator setup wizard 등 (#8).
