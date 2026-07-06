# 잇다 작업 로그 (Work Log)

모든 세션의 작업을 **날짜별로 한곳에** 쌓는 문서입니다. 무엇을 언제 했는지 한눈에 보기 위한 용도.

**유지 규칙**
- 최신 날짜가 맨 위. 같은 날 안에서는 영역별로 묶어 정리.
- 매 작업 세션은 끝에 **오늘 날짜 섹션**에 자기 작업을 추가한다 (없으면 새로 만든다).
- 출처는 git 커밋. 다른 세션 작업이 빠져 있으면 `git log --date=short` 에서 백필한다.
- 커밋 해시는 추적용 참고. 세부는 커밋 메시지/PR 참조.

---

## 2026-07-05

**신규 서비스 "묻다." v1 전체 구축 — 사전 죽음준비 콘텐츠·커뮤니티 앱** (사장님 의제: Epic 유저 저니 이식, 케어링 제외, 당장 배포 가능하게)
- **설계**: `docs/product/mutda-service-design.md` — Epic(온보딩 퀴즈→맞춤 서재→첫 성공 경험→스트릭·배지→매일의 이유)의 리텐션 저니를 죽음준비로 번역. 헌장 준수: 배지 경쟁 대신 "매듭", 스트릭은 "이어온 날들"(비교 없음). 이름 "묻다"는 問(질문으로 만드는 준비)·埋(마음을 묻어둠)의 중의.
- **프론트** (`/mutda/`, 정적 HTML+JS, 잇다 디자인 토큰 그대로): 랜딩·가입·로그인·환영·온보딩 퀴즈(개인화 여정 생성+첫 질문 quick win)·홈(여정 지도+오늘의 한 걸음)·**유언장 위저드**(7문답→자필증서 초안 자동 생성→민법 §1066 5요건 체크리스트→공증 연결, draft→handwritten→notarized 상태 추적)·감사/작별 편지(첫 문장 받기)·유품 미리 정리·반려동물 돌봄 플랜(인계서 인쇄)·**안부확인**·서재(샘플 아티클 2편)·커뮤니티(글/댓글, 좋아요 없음)·마이.
- **백엔드** (기존 Supabase 프로젝트, `mutda_` 접두사 11개 테이블+RLS, 잇다 테이블 무접촉): `supabase/migrations/20260705_mutda_v1.sql` **적용 완료**. 커뮤니티 시드 글 2편 삽입.
- **고독사 방지 파이프라인 (가동 중)**: 하트비트 RPC(`mutda_heartbeat`, 접속 시 5분 스로틀+복귀 시 알림 자동 해제, 위치 공유 동의 시 GPS 기록) → pg_cron 30분 스캔(임계 기본 18h, 12/18/24/48 선택) → pending 알림 → pg_net→Edge Function `mutda-checkin-notify`(**배포 완료**)가 보호 연락처 이메일 발송(Resend). 웹 한계(폰 사용시간·백그라운드 GPS 불가)는 화면에 정직 고지.
- **검증**: ①백엔드 — DB 내 시나리오 테스트로 스캔→알림 생성(20h 무활동)→함수 호출(200 응답)→하트비트 복귀 시 resolved 전환 확인. cron 잡 2개 active 확인. ②프론트 — Playwright e2e(`scripts/mutda-e2e.mjs` + 실스키마 내장 스텁 `mutda-supabase-stub.mjs`, 샌드박스 이그레스 차단 대응) 10단계 전체 PASS, JS 오류 0.
- **창업자 액션 대기**: ①Resend API 키 발급 후 `supabase secrets set RESEND_API_KEY=... MUTDA_FROM_EMAIL=...` (키 등록 즉시 이메일 발송 자동 개시) ②유언장·법률 콘텐츠 변호사 감수(현재 "감수 진행 중 베타" 라벨) ③main→gh-pages 배포 승인(잇다 파일 무변경이라 sw.js 캐시 버전 범프 불필요).

**잇다 케어 중심 개편 1단계 + 묻다 기획서·QA** (사장님 지시)
- **잇다 정보 허브(info.html) 4기둥 재구성**: ①요양병원·요양시설 찾기 ②호스피스·완화의료 ③방문진료(재택의료) ④케어링 가이드. 기존 아티클 전부 보존·재배치, 콘텐츠 없는 기둥은 베타 알림 패턴으로 정직 처리. DB 무변경 — 유저 기록(일기·성찰·케어일지) 전부 보존.
- **신규 아티클**: info/hospice-palliative.html — 호스피스·완화의료 차이/대상/절차/입원·가정·자문형/건보 적용/hospice.go.kr 안내. "의료 전문가 감수 전 참고용" 고지.
- nest.html(케어링 탭)에 정보 허브 진입 카드. 잇다 sw.js → itda-v4-care-pivot-v1.
- **묻다 서비스 기획서 v1** (`docs/product/mutda-service-plan.md`, 324줄): 배경·투브랜드·기능명세(현행)·유저저니·지표·수익 가설(전부 [가설] 라벨)·로드맵·리스크. 유품 판매 연계 톤 리스크 반대견해 기록.
- **묻다 QA 1차**: 반려동물 여부 토글(마이)·플랜 보유 시 여정 상시 노출, 로그인 상태 랜딩→홈 리다이렉트.

**묻다 Q3 목표 확정 + 묻다↔잇다 브리지 + Flutter 전환 준비** (사장님 /goal 지시)
- `docs/company/goal-2026q3.md`: 미션·투브랜드 구조(묻다=미리 준비 / 잇다=돌봄·이후→디지털납골당)·수치 목표(9/30 가입 1,000 · DAU 100+ · D7 25% · 미리 전한 마음 500통) 확정.
- `docs/product/flutter-monorepo-plan.md`: Flutter 모노레포 전환 계획서(구조·5단계·4~6주 공수·웹 존속) + **전환 기준**(가입≥500 AND 4주 D7≥25% AND 안부확인 활성≥80). 매주 월 09:00 KST 자동 점검 트리거 등록 — 기준 충족 시 "이제는 Flutter로 가도 됩니다" 알림.
- **브리지 구현**: 잇다 info.html에 묻다 카드 / 묻다 my.html·library.html에 잇다 카드 — 같은 계정으로 상호 이동. 잇다 sw.js 캐시 버전 범프.
- `docs/company/app-principles.md`: 창업자 4원칙 문서화 + CLAUDE.md 필독 포인터.
- 계정 합치기(공산→단청)는 Supabase MCP 일시 장애로 자동 재시도 예약.
- 유품 정리: '맡겨두기(돌봄 부탁)' 결정(임시 보관인+최종 수령인+부탁 전하기), 작성 단계 익명 나눔, 판매하기+공개 동의, 홈에 로그인 계정 표시(계정 혼동 방지).

**묻다 편지(감사/작별) 리텐션 루프 v2** (사장님 의제: "한 번 쓰면 끝" 탈피)
- **오늘의 마음 질문**: 14개 질문이 날짜별 순환 — 매일 다시 올 이유. 질문→편지쓰기 직결.
- **전하기**: 카톡/문자 공유(navigator.share, 폴백 클립보드) → sent_at 기록 → "🌿 미리 전한 마음, N번째예요" 리워드 카피.
- **마음의 잔디**: 최근 12주 그리드(쓴 날 연둣빛·전한 날 진초록) — 비교 없는 나만의 잔디(헌장 준수).
- **나누기**: 편지를 익명으로 커뮤니티(함께)에 공유/내리기 (mutda_posts 연동, shared_post_id).
- **집단의 아름다움**: 랜딩·편지 화면에 전체 집계("오늘까지 N번의 마음이 미리 전해졌습니다") — mutda_letters_stats() RPC(내용 미노출 숫자만).
- 마이그레이션 `20260706_mutda_letters_loop.sql` 적용. UX 밀도 개선(여백 축소, 잔디 10px). 유품정리 폼: 분류 먼저·'물건'→'품목'.

**묻다 유언장 위저드 고도화 + 법률 감수 파트너 확정** (사장님 피드백 연쇄 반영)
- 주소(3/7): 카카오 우편번호 검색 임베드(검색→도로명 자동입력+상세주소), 실패 시 직접 입력 폴백.
- 재산(4/7): 종류 칩(✨모든 재산/🏠부동산/💰예금/📄보험/🚗차/💍귀중품/📱디지털/➕기타) + 부동산 항목에도 주소 검색. '모든 재산'은 단독이면 포괄 문구, 병행이면 잔여 조항("적지 않은 나머지 재산은…")으로 생성. **상속 순위 마법사**: 배우자→자녀→부모 3답으로 민법 §1000·§1003 법정 1순위 안내 + 유류분 고지 + 배우자·자녀 등 실명 입력→실시간 문구 미리보기→'누구에게' 자동 채움(와/과 받침 처리).
- 남기는 말(7/7): 받는 사람 칩(가족 모두/배우자/엄마/아빠/자녀/형제자매/기타) — 사람별 칸+맞춤 예문, 초안에 "어머니께: …" 사람별 정리.
- 커뮤니티 글 하단에 주제별 실천 CTA 카드(물건 정리 글→유품 정리 등).
- 가입 막힘 해결: 기가입 이메일 안내+즉시 로그인 전환, auth 자동확인 트리거(베타).
- **법률 감수 파트너 확정: 법무법인 율사서재 김한나 변호사** (02-523-1579 · hss1@yulsasj.com) — 유언장·아티클 감수자 표기, will.html 상담 연락처. 사실 확인: 유언 공증은 대면만 가능(법무부 화상공증은 사서증서 인증만, 유언 제외), 공증은 공증인가 기관만 가능 → 앱에 정직 고지.
- Pages 배포 콘텐츠 검사 이슈 재발(트리거 SQL) → gh-pages에서 내부 폴더(docs/supabase/scripts/.claude) 전체 제외로 구조적 해결 + 간헐 일시 실패는 재시도로 처리.

**묻다 v2 — 안부확인 알림 앱푸시 전환 + 배포** (사장님 결정: 이메일 알림 폐기, 전화번호+지정순위 앱푸시)
- **보호자 모델 재설계**: 이름·관계·**전화번호(필수)**·**알림 순위(1~3)** + 행별 초대 링크(`guardian.html?code=…`). 문자/카톡 공유(`navigator.share`) → 보호자가 링크로 가입/로그인(온보딩 생략 경량 프로필) → `mutda_link_guardian` RPC 연결 → 웹푸시 구독. 상태 칩 "수락 대기"/"✓ 연결됨".
- **발송 파이프라인 v2**: Edge Function 재작성 — 연결된 모든 보호자 인앱 알림(`mutda_notifications`, 홈 배너) + **지정순위 캐스케이드 웹푸시**(1순위 실패 시 다음 순위). 연결된 보호자 없으면 pending 유지→연결 즉시 다음 주기 발송. 이메일 코드 제거.
- **VAPID 키 관리**: 키쌍 신규 생성 → **Supabase Vault** 저장(개인키가 코드·저장소에 안 남음). service_role 전용 `mutda_get_vapid()` RPC + 클라이언트용 공개키 GET 엔드포인트. (참고: 잇다 push-notify는 VAPID 시크릿 미설정 상태로 발송 불가였음 — 별도 정비 필요)
- **신규 파일**: `mutda/sw.js`(push 수신 SW), `mutda/js/push.js`, `mutda/guardian.html`, 마이그레이션 `20260705_mutda_v2_push.sql`(적용 완료). checkin/home/login/signup/welcome 갱신.
- **검증**: VAPID GET 200 확인, e2e 11단계 PASS(보호자 초대 화면 포함), JS 오류 0.
- **배포**: 사장님 지시로 main 머지·푸시 → pages.yml이 gh-pages 자동 동기화. 라이브: `https://suechoi033-private.github.io/life-heritage-v2/mutda/`
- **가입 막힘 해결 (인증 메일 미도착)**: 원인 두 겹 — ①Supabase 기본 SMTP는 팀원 외 주소로 인증 메일을 사실상 전달 못 함 ②기존 잇다 계정 이메일로 재가입 시 에러 없이 "메일 확인" 흐름으로 빠짐(계정 존재 은닉). 조치: auth.users BEFORE INSERT 트리거 `auto_confirm_email`로 베타 기간 가입 즉시 확인 처리(`20260705_auto_confirm_email.sql`, 잇다에도 적용됨·롤백 방법 주석) + 묻다 signup이 세션 없으면 즉시 로그인 시도→기가입 이메일이면 로그인 안내. 실 GoTrue 경로로 가입 200→auto_confirmed→비밀번호 로그인 토큰 발급까지 검증. 정식 런칭 전 커스텀 SMTP(Resend 등) 연결 후 트리거 제거 권장.
- **배포 장애 트러블슈팅**: 첫 배포 후 /mutda/ 404 — pages-build-deployment가 "Deployment failed, try again later"로 반복 실패. gh-pages 트리 이분탐색(7회 배포 실험)으로 `scripts/mutda-supabase-stub.mjs`(e2e용 가짜 Supabase 클라이언트) 단일 파일이 GitHub Pages 배포 콘텐츠 검사를 트리거함을 특정. 조치: pages.yml에서 배포 시 dev 테스트 파일(git rm) 제외 후 푸시하도록 수정 — main에는 테스트 파일 유지, 라이브에만 미포함. 교훈: 배포 성공 판정은 sync 워크플로우가 아니라 pages-build-deployment + 라이브 URL 200 기준으로.

---

## 2026-06-13

**프로덕트 디자인 원칙 문서 신설 — `docs/company/product-design-principles.md`** (오케스트레이터 세션, 사장님 의제)
- 사장님이 공유한 오늘의집(버킷플레이스) PM 진행공유 1년치 + 디자인 블로그("60점의 시대" 글)를 벤치마킹.
- 핵심 분리: **메서드(문제→가설→솔루션, 퀵 UT, 정보위계, 데드엔드 금지, 입력비용 절감 등 7개)는 차용 / 전술(카운트다운·경쟁형 소셜프루프·업셀·뱃지남발 등)은 헌장 위반으로 폐기·반전.**
- 잇다 디자인 원칙 7개(P1~P7) 정립 + 실제 화면 매핑 개편 인사이트 7건(★형제초대·★lifecycle nudge·홈피드·사전연명·오늘의질문·케어일지·온보딩) + PR 리뷰 체크리스트.
- 북극성: 요한 인터뷰("60점의 시대") 원문 반영 — AI는 평균(Good)을 올리고 최고치(Great)는 사람 손/디자이너는 '서명하는 건축사'/Great 3신호(유저문제 출발·자기언어 설명·실행 깊이)를 PR 기준으로 채택/마지막 두 질문(더 나은 디자인인가 vs 더 많은 결과물인가 · 책임은 누가)을 체크리스트 캡스톤으로.
- 다음 액션: 잇다 '안목 자산' 적립(원문 198크리틱→10원칙 방법 차용) — 이 문서가 씨앗, 크리틱 쌓이면 skill 파일화. 단 최종 서명은 사람.
- (원문 블로그는 봇 차단으로 직접 fetch 불가 → 사장님이 본문 제공해 정확 반영함.)

---

**개편 1번 타자 — 형제(가족) 초대 플로우 재설계** (오케스트레이터 + 팀 소집: 전략·카피·PE)
- 프로덕트 디자인 원칙(P5 관계=리텐션, P6 보기먼저, M5 데드엔드 금지) 첫 적용 과업. 사업 사활(리텐션 해자 ③) + 20명 테스트 핵심.
- **팀 소집 결과:** 전략(성공기준 2개: 일지작성자 30%+ 발송 / 수락쌍 7일내 공동행동) · 카피(전 상태 카피 덱, "친구/초대/수락"→"가족과 같이 보기") · PE(데이터 안전 경계 판정).
- **프런트만으로 구현(Two-way door, 승인 불필요) — 적용 완료:**
  - 카피 전면 reframe: 친구→가족, "초대/수락"→"같이 보기/나중에", 카톡 메시지 앱홍보문→사람 대 사람("OO · 함께 기록을 봐요/열어보기"), 성공·에러·만료 문구.
  - 개인 메시지 입력칸 신설(`createFriendInvite({message})` 연결, 카톡 본문 대체).
  - 발급 후 대기 상태(데드엔드 제거) + 함께하는 가족 목록 노출(`listMyPendingInvites` 헬퍼 신설).
  - 진입점 라벨 일관화: root.html 메뉴·빈상태, login/signup 안내, nav 타이틀, og/title.
  - sw.js CACHE_VERSION → `2026-06-13-family-invite-reframe-v1`.
  - 파일: invite.html, js/friends.js, root.html, login.html, signup.html, sw.js.
- **백엔드 1건 — 창업자 승인 보류(one-way door):** "보기 먼저"용 `preview_friend_invite` RPC. 케어링 `preview_care_invite` 동일 검증 패턴. 마이그레이션 파일 `20260613_friend_invite_preview.sql` **준비만**(미적용). 프런트는 RPC 호출→실패시 폴백으로 전향 설계 → 승인·적용 시 재배포 없이 자동 작동.
- **남은 것(승인/후속):** ①RPC 적용 승인 ②트리거 배치(첫 일지 직후 + care-dashboard 상시 — 발송률 성공기준 직결, 별도 과업) ③퀵 UT(형제 3~5명, 특히 카톡 메시지 "눌러볼까" 검증) ④strategy.md에 성공기준 반영(승인 후).
- **전략 리스크 경고:** 진짜 장벽이 UI가 아니라 "형제에게 기록 들이미는 관계적 마찰"일 수 있음 → 미발송자에 "왜 안 보냈나" 정성 확인 필수.

---

**프로덕트 디자인 원칙 문서 신설 — `docs/company/product-design-principles.md`** (오케스트레이터 세션, 사장님 의제)
- 콘텐츠 상세 페이지 하단에 "— 잇다 한 줄" 서명이 여전히 노출되는 문제 발견(스크린샷 제보).
- 기존 `20260531_remove_itda_oneline_signature.sql` 마이그레이션은 미적용 상태였음.
- `contents` 테이블 전 카테고리 대상 `regexp_replace` UPDATE 실행 — 23개 행 정리, 서명 잔존 0건 확인.

**main → 배포** (사장님 요청)
- `claude/hospice-recommendation-design-T31Wg` → `main` fast-forward merge 후 push. GitHub Pages는 main 브랜치 직접 서빙 (gh-pages 브랜치 없음).
- 배포 완료 후 `요양원·요양병원 찾기` 페이지는 `info.html` → "요양원·요양병원" 카드 클릭 시 접근 가능.

---

## 2026-06-21

> 06-15 결정 트리거의 후속 작업 일괄(전략·구체화·프레임워크·해외 벤치마킹). 결정 카드 문서명은 트리거 날짜 06-15 유지(컨벤션), 실제 작업·커밋 날짜는 06-21.

**🔧 자택 임종 콘텐츠 표 모바일 잘림 수정 + 브런치 inbound 글 3편 + 카드뉴스** (PE·마케팅 세션, 사장님 제보)
- **표 버그(사장님 캡쳐 제보)**: `info/home-death-korea.html` 섹션 2 한·일 비교표의 우측열(한국 현재)이 모바일에서 화면 밖으로 잘림. → `<640px`에서 표를 행 단위 카드로 세로 스택(thead 숨김, td[data-label]::before로 열 이름 노출). Playwright 모바일 캡쳐로 검증. `sw.js` → v6. 커밋 `6c1c75e`, main+gh-pages 배포.
  - 후속: `choosing-charnel-house`·`silver-town-guide`에도 표 있음 — 동일 패턴 점검 필요(미착수).
- **방향 판단(사장님 질문 "카드뉴스+브런치 연결?")**: 앱 안 사용자를 브런치로 내보내는 건 유출 → 반대로 **브런치=inbound 채널**(브런치→잇다)로 쓰는 게 맞다고 정리. 06-15 L2(콘텐츠=acquisition 엔진) 일관.
- **브런치 글 3편 작성** (`docs/content/brunch/`, 사장님 데이터: 상속·상속세 등 '돈' 검색 유입 최다):
  - `01-inheritance-2026-reform.md` — 2026 상속세 개정(자녀공제 5천만→5억 방향). YMYL이라 수치 단정 회피·구조 중심·홈택스 확인 안내. WebSearch로 현행 확인(출처 엇갈려 방향만 서술).
  - `02-inheritance-is-not-about-money.md` — 상속 준비=관계·정리(잇다 차별점 각도), 1인칭 에세이.
  - `03-home-death-korea.md` — 앱 콘텐츠의 브런치판, 전문은 앱으로 되돌리는 유입 장치.
  - `README.md` — 브런치 발행 규칙(draft·게시는 사장님·YMYL·UTM) + 다음 글 후보 파이프라인(재정 우선 5 + 정서 3 + 정보 2).
- **인스타 카드뉴스 8장**(마케팅 에이전트): `docs/marketing/insta-home-death-cardnews-2026-06-21.md` — 자택 임종 콘텐츠 재가공. 훅 "자택에서 맞는 마지막. 한국에선 왜 이렇게 어려울까요." YMYL 완충·자극색 0·CTA는 앱 전문(+UTM)으로 유입.
- **게시 승인**: 브런치 실 게시·인스타 실 게시 모두 외부 발송=사장님 직접(one-way door). 문서는 준비물.

---

**📚 브런치 콘텐츠 전략 + 4주 발행 캘린더 + 1주차 원고 2편** (마케팅 세션, 사장님 발의)
- 사장님 지적: 첫 발행 글과 새 드래프트들(상속·돈) 사이 맥락 점프가 큼 → 전략 문서 필요. 목표: **1개월 구독자 100명**.
- **전략 단일 원천**: `docs/marketing/brunch-strategy-2026-06-21.md` — ①계정 정체성 한 줄("죽음 이후의 일들을 미리 정리해드립니다") ②매거진 2개(에세이=구독 엔진 / 정보=검색 유입 엔진 — ②가 데려오고 ①이 붙잡는 구조) ③4주 발행 캘린더 8편+예비1(서사 아크: 죽음의 절차→남은 사람의 실무→준비의 마음→돈→자기 준비) ④100명 산수(내부 30·검색 30·외부 공유 30·지인 10)와 경로별 액션 ⑤모든 글 끝=다음 글 예고+구독 유도 규칙.
- **1주차 원고 2편 신규**: `04-passbook-two-months.md`(seed-17 브런치판 — 첫 글과의 다리, 구독 전환 1순위) · `05-safe-inheritance-onestop.md`(seed-20 브런치판 — 04의 실무 해답편). 둘 다 앞 글 연결 문장 + 다음 글 예고 반영.
- **순서 재배치**: 기존 드래프트 02→발행 3번째, 01(상속세)→4번째. `03-home-death-korea.md`는 첫 글과 중복이라 **발행하지 않음** 처리. `docs/content/brunch/README.md`를 순서 매핑표로 갱신.
- 가정(확인 필요): 첫 발행 글 = 자택 임종 글. 다르면 캘린더만 재배열.
- 후속: 3~4주차 원고 4편(비밀번호·증여vs상속·살아있는 장례식·못 깨어난다면) · PE(앱 콘텐츠 하단 "브런치 연재 중" 1줄) · 주간 구독자 측정 리듬.

---

**✂️ 브런치 원고 v2 — 3분 규칙 + 인스타 카드뉴스 페어 (사장님 피드백 반영)** (마케팅 세션)
- 사장님 피드백 3개: ①글이 길면 가독성 하락 → **3분(1,200~1,500자)** ②연결 내용은 **본문 링크**로 ③**인스타 카드뉴스 형태도 같이** 구성.
- **정정**: 첫 발행 글 = `brunch.co.kr/magazine/itda`의 글 (자택 임종 글 아님 — 팀 가정 오류). 브런치 봇 차단으로 직접 확인 불가 → 원고의 연결 문장을 특정 글에 의존하지 않게 일반화. **사장님이 첫 글 제목 주면 캘린더 다리 확정.**
- **4편 전부 v2 재작성** (01·02·04·05): 각 1,200~1,500자로 축약, 본문에 지난 글/정부24/홈택스/잇다 인라인 링크, **파일 하단에 6장 카드뉴스 스펙 동봉** (같은 날 브런치+인스타 동시 발행 → 인스타 "프로필 링크에서 전문" → 브런치 → 구독 퍼널).
- 전략 문서 §0-1 형식 규칙 추가 · README에 페어 규칙 + "지난 글 링크는 게시 시 실제 URL로 교체" 주의 추가.
- 후속: 사장님 첫 글 제목 확인 · 게시 시 지난 글 URL 교체 · 3~4주차 원고 4편(같은 페어 형식).

---

**📝 브런치 3~4주차 + 예비 원고 5편 완성 — 캘린더 9편 전부 draft 완료** (마케팅 세션)
- 사장님 확인: 첫 발행 글 = `brunch.co.kr/@nonaksan/70` (매거진 잇다). 봇 차단으로 본문 미확인 — 연결 문장은 일반화 유지, 게시 시 URL 채움.
- **신규 5편** (모두 3분 본문 + 인스타 카드뉴스 6장 페어): `06-password-list-first`(seed-18 — 유서 대신 비밀번호 목록) · `07-gift-vs-inheritance`(신규 — 증여·상속 오해 3가지, YMYL 수치 무기재) · `08-living-funeral`(seed-11 — 미검증 수치 완충) · `09-not-waking-tomorrow`(제품 질문 → will-start UTM 유입, 광고 A2와 톤 통일) · `10-advance-directive`(seed-02 — 30분 등록법).
- **캘린더 9편 전부 원고 완료** — 1주차(04·05)→2주차(02·01)→3주차(06·07)→4주차(08·09)→예비(10). 글 끝 "다음 글 예고"가 실제 다음 원고와 연결되도록 체인 구성.
- README 순서표 갱신(첫 글 URL 반영). 남은 것: 사장님 게시(주 2회) + 카드뉴스 이미지 제작 + `[지난 글]` URL 채우기.

**🐞 F1 후속 — 사장님 라이브 검증 발견: 두 카드 약속 깨짐 → 비회원 답 화면 신규 (F1 v2)** (PE 세션)
- 사장님 라이브 검증 직후 발견: 카드 1 "한 줄 적어볼게요" 클릭 → onboarding.html `?path` 파라미터 무시 → 일반 카피 "지금, 어디에 마음이 머무세요?" 노출. 카드 2 "오늘 안부 시작"도 같은 결로 약속 깨짐. 사장님 한 줄: *"엉망이야"*.
- 진단: 06-21 F1에서 카드 카피만 정하고 다음 흐름은 onboarding.html이 받게 둠 → onboarding.html line 118의 일반 카피 노출. path 분기 미구현.
- **백그라운드 전수검사**: Explore 에이전트가 잇다 전체 검사 → `docs/strategy/full-audit-2026-06-21.md` (신규, 12 섹션, ~400행). 🔥 즉시 3건(path 무시·"정답은 없어요" 톤 위반·entry_path 분기 미구현) + ⚠️ 다음 라운드 4건. 사장님 발견과 동일.
- **신규 화면 2개** (invite-answer.html 패턴 차용 → 비회원 답 1줄 → localStorage → signup 게이트 → 가입 후 정착):
  - `will-start.html` — 사장님 확정 카피 "내일 다시 못 깨어난다면, 가장 후회할 일은?" + textarea. localStorage `itda:will_pending_answer` 저장. 가입 후 welcome.html에서 `daily_answers` (series_key='not_waking_tomorrow' step 1) 정착 → reflection.html 진입.
  - `care-start.html` — 사장님 확정 카피 "부모님께 오늘, 안부 한 줄" + 부모 이름 + 안부 입력. localStorage `itda:care_pending_answer` 저장. 가입 후 welcome.html → care-dashboard.html 진입. 정식 저장은 다음 라운드(care_log 통합).
- **index.html 카드 링크 변경**: `./onboarding.html?path=will|care` → `./will-start.html` · `./care-start.html`. onboarding.html은 그대로(다른 진입에서 여전히 사용).
- **welcome.html 정착 코드 보강**:
  - 기존 entry_path 정착 옆에 will pending answer → daily_answers 정착 추가.
  - 최종 진입(`enter-itda`·`skip-onboarding` 버튼) → `resolvedEntryPath` 기준 분기. will=reflection.html · care=care-dashboard.html · null=index.html.
- **sw.js**: `CACHE_VERSION` → `itda-v3-2026-06-21-two-faces-flow-fix-v3`. APP_SHELL에 `./will-start.html` · `./care-start.html` 추가.
- **변경 파일**: `will-start.html`(신규) · `care-start.html`(신규) · `index.html` · `welcome.html` · `sw.js` · `docs/strategy/full-audit-2026-06-21.md`(신규).
- **이번 라운드 미진행 (다음)**: care 답을 care_log/care_target에 정식 정착 · onboarding.html "정답은 없어요" 톤 위반 정리 · index.html 회원 화면에서 entry_path 기반 path별 카드 우선 노출(전수검사 🔥 #3) · note/* 위계 단순화.
- 작업 브랜치: `claude/two-faces-flow-fix-2026-06-21`. main 머지 후 gh-pages 배포 예정.

---

**자동화 — `/show-flow` 슬래시 커맨드 + Playwright 캡쳐 스크립트** (PE 세션, 사장님 발의)
- 사장님 발의: "5분만 더 들이면 slash command로 저장해둬서 매번 자동 호출 가능 — 만들어둬." 매번 시크릿 창·임시 이메일·DB 확인 부담을 자동 캡쳐로 대체.
- **신규 스크립트**: `scripts/capture-flow.mjs` (~200줄). Playwright + Supabase 클라이언트 stub(비회원·회원 두 종류) + route mock(CDN·Supabase 차단 환경 대응). 12장 화면(01 비회원 홈 → 02-03 두 카드 → 04·07 가입 게이트 → 05·08~11 welcome 5-step → 06 답 입력 → 12 reflection step 2)을 한 번에 캡쳐. iPhone 12 Pro 뷰포트(390×844). 환경변수로 ITDA_BASE_URL·ITDA_SCREENSHOT_DIR 조정 가능.
- **신규 커맨드**: `.claude/commands/show-flow.md`. 절차: 로컬 HTTP 서버 띄움 → Playwright symlink → 스크립트 실행 → SendUserFile 12장. 사용자가 페이지 추가하려면 PAGES 배열에 한 줄.
- **사장님 라이브 검증 흐름 보강 발견**: 08(welcome step 1) → 09(reflection) 직접 연결 아님. welcome 5-step 위저드(step 1 이름 → step 2 자리 선택 → step 3 첫걸음 추천 → step 4 가족 초대 → step 5 "잇다 시작하기 →") 거친 후 reflection. 스크립트가 자동 클릭으로 step 2~5도 캡쳐.
- **welcome step 5 카피 발견 (정정 후보)**: "이따가 하지 말고 지금." — "잇다" 발음 유희 의도일 수 있으나 "이따가"로 띄어쓰기 시 다르게 읽힘. 카피라이터 검토 필요.
- **변경 파일**: `scripts/capture-flow.mjs`(신규) · `.claude/commands/show-flow.md`(신규).
- 후속(다음 라운드): step 5 카피 검토 · F1d 가입 path별 분기 카피 · F1c Cake/Empathy 패턴 · F2 콘텐츠 허브 재설계 · 회원 entry_path 기반 분기.

---

**잇다 현재 유저 플로우 도식 — 배포 시점 정리** (사장님 발의)
- 사장님 발의 + manyfast.io 예시 캡쳐 첨부: *"배포한 것을 마지막으로 현재의 화면이 어떻게 구성되어 있는지 정리해줘. 저 형태로 지금 현재의 잇다의 유저플로우를 정리해줘."*
- manyfast 스타일(시작 검정·섹션 최상위 진한 보라·페이지 연한 보라·행동 점선 원형·신규는 녹색) 차용한 HTML 정적 도식 작성: `docs/strategy/userflow-current-2026-06-21.html` (신규).
- **9 섹션 정리**: ①비회원 진입 유언 ②비회원 진입 케어 ③초대 링크 진입(가족/친구) ④홈(회원) ⑤라이프(seed) ⑥케어링(nest) ⑦콘텐츠(forest) ⑧마이(root) ⑨어드민.
- 강조: (b) 두 얼굴 분기점 ★ 표시 / F1 v2 신규(will-start·care-start) 녹색.
- Playwright로 1400×scrollHeight 캡쳐 → 사장님 송부.
- 변경 추적·다음 라운드 후보가 도식 푸터에 명시: F1c·F1d·F2·회원 entry_path 분기·care 정착·note/* 단순화·welcome step 5 "이따가" 카피.
- 작업 브랜치: `claude/userflow-diagram-2026-06-21`. main 머지 + gh-pages 배포 예정.

---

**🐞 questions.html에 reflection 시리즈가 `-108`·`-107`·… 마이너스 번호로 노출** (사장님 라이브 발견 → 즉시 수정)
- 사장님 라이브 발견(캡쳐): "지난 질문 보기" 클릭 시 reflection 시리즈 8개 질문이 상단에 `-108`, `-107`, `-106`… 음수 번호로 표시됨.
- **근본 원인**: 06-14 reflection 시리즈 마이그레이션에서 `display_order`를 NULL로 두려 했으나 NOT NULL constraint로 실패 → 음수 (-101 ~ -108)로 우회 저장. `questions.html` line 324는 `daily_questions` 전체를 `display_order` ascending 정렬해 표시하므로 음수가 가장 앞에 노출됨.
- **수정**: `questions.html` 쿼리에 `.is('series_key', null)` 추가 — 일반 "오늘의 질문"만 표시, reflection 시리즈는 reflection.html에서만 진입.
- **다른 daily_questions 쿼리 4건 검토** (안전 확인): `ask.html`(id eq · display_order=days(양수만) · prev display_order-1) · `index.html`(series_key='not_waking_tomorrow' 명시) · `admin.html`(어드민 전체 노출 OK) · `welcome.html`(시리즈 정착, series_key 명시) · `reflection.html` · `will-start.html` 동일.
- **sw.js**: `CACHE_VERSION` → `itda-v3-2026-06-21-questions-exclude-series-v4`.
- **변경 파일**: `questions.html` · `sw.js`.
- 작업 브랜치: `claude/questions-exclude-series-2026-06-21`. main 머지 + gh-pages 배포 예정.

---

**📝 정보 콘텐츠 신규 — "자택 임종·사망 절차 (한국)"** (사장님 발의 · 사장님이 공유한 일본책 페이지 트리거)
- 사장님 발의: 일본책의 "고독사 시 주치의 부르면 된다" 안내를 한국 현실과 비교 요청 → 답 후 콘텐츠 발행 지시.
- **신규 페이지**: `info/home-death-korea.html` — 다음 5 섹션: ①자택 사망 확인 시 절차(5-step) ②병원 임종이 흔한 이유(한·일 비교표) ③한국형 주치의 시범(2026-07 시작) ④성남시 자택 임종 지원 사례 ⑤실용 체크리스트.
- **YMYL 준수**: 상단 배지 "정보 안내 · 전문 상담 대체 불가" · 하단 sources 7 출처 · 각 사실에 근거 명시.
- **info.html 카테고리 등록**: "미리(pre)" 세그먼트에 `home-death-korea` 추가(`well-dying` 다음). `ENABLED_KEYS` + 라우팅 매핑 추가 → NEW 배지 자동 노출.
- 관련 링크 (in-page): 사전연명의료의향서·웰다잉·장기요양보험·유언 빌더.
- **sw.js**: `CACHE_VERSION` → `itda-v3-2026-06-21-info-home-death-korea-v5`. APP_SHELL은 info/* 개별 파일 미포함 컨벤션(다른 info/* 페이지와 동일 처리) 유지.
- **변경 파일**: `info/home-death-korea.html`(신규) · `info.html` · `sw.js`.
- **후속(승인 필요)**: 실제 배포 전 **의료법·장사법 조항 변호사·의사 감수** (헌장 YMYL). 이번 라운드는 배포 준비까지, 사장님 판단으로 즉시 배포 또는 감수 후 배포.
- 작업 브랜치: `claude/info-home-death-korea-2026-06-21`. main 머지 + gh-pages 배포 예정.

---

**📣 잇다 SNS 광고 캠페인 — 10 각도 + Canva 크리에이티브 3점 승인** (마케팅 세션, 사장님 발의)
- 사장님 발의: 브랜드 목소리 추출 → 10 광고 각도 → 이미지 툴로 생성 → 까다로운 크리에이티브 디렉터 검수 → 승인 보고. 배포 채널: 인스타그램·페이스북.
- **브랜드 보이스 한 줄**: "조용히, 사실만, 마침표로." (헌장 + 기존 카드뉴스 가이드에서 추출 — 느낌표·긴급·죄책감·과시 금지 / 화이트+에버그린+잉크 / 무약속 CTA).
- **10 각도**: A1 후회 · **A2 호기심(제품 첫 질문 그대로, 1순위)** · A3 사실(살아 있을 확률) · A4 실용(자택 임종 콘텐츠 연계) · **A5 관계(케어링 카드 카피, 2순위)** · A6 정체성(독신·딩크) · **A7 안심(공포 반전)** · A8 스토리(보류—브랜드스토리 수정 대기) · A9 사회적 증명(**영구 반려**—과시 금지) · A10 긴급성(**영구 반려**—죽음 주제에서 협박화).
- **Canva 생성·검수**: 4 각도 × 4 후보 생성 → 검수·수정 후 **3점 승인** (A2 `DAHOfIWRVhg` · A5 `DAHOfKhUix4` · A7 `DAHOfOYezhs`, 사장님 Canva 계정 저장). 검수에서 고친 것: 잉크색 정합·반투명 오버레이 제거·CTA 줄꺾임·**철자 오류 "잋다" 적발·수정**·서브라인→CTA 전환 등. A6는 두 후보 모두 반려(레이아웃 붕괴·카피 왜곡·플레이스홀더 잔존)—카드뉴스 수동 포맷으로 후속.
- 단일 원천: `docs/marketing/ad-campaign-10angles-2026-06-21.md` (10 각도 + UTM 랜딩 연결 + 검수 결과 부록).
- **남은 것 (사장님)**: ①Canva에서 폰트를 나눔명조로 교체(MCP 미지원) ②A2 배경 노이즈 1회 정리 ③실제 게시 = 외부 발송 = 사장님 승인·직접 게시 (헌장 one-way door).

---

**잇다 분리·acquisition 전략 결정 — 레몬테라스 신호** (전략 세션, 사장님 발의)
- 사장님이 직접 본 네이버 카페 **레몬테라스** "유언/유서" 검색 결과 캡쳐 2건이 단일 원천. 카페 회원 3,016,256명(여성, 1966~2006년생), 22년 된 메가카페. "유언" 검색 시 4가지 결: A.실무질문(답 없음) · B.부모 케어+유언 교집합 · C.본인 유언 의향 · D.뉴스/가십. → 한 카페에 두 페르소나 공존 = 잇다 케어링·유언 path 둘 다 정확 명중.
- **결정 (L1~L8)**: L1 망고하다=카테고리 검증자(경쟁자 X) · L2 acquisition 1순위=네이버 카페 · **L3 분리방식=(b) 한 코드 두 얼굴 (사장님 컨펌: "팀의 의견대로 유입경로만 바꾸고 하나의 앱 내에서 운영")** · L4 케어링·유언 동시 진행("순서대로 해서는 늦어") · L5 acquisition 3개월 가설 M1(답글)→M2(SEO글)→M3(사례) · L6 BM 보류(D5 유지) · **L7 데이터 대시보드 전면 재설계** · **L8 UX 벤치마킹 적극 활용**.
- 단일 원천: `docs/strategy/decisions-2026-06-15-lemon-cafe.md` (신규, 결정 카드 + 카페 신호 분석 + 망고하다 종결 + acquisition 가설 + M9 metric 신규 + 헌장 일관성 확인).
- **(b) 분리 구체화 문서**: `docs/strategy/two-faces-one-code-2026-06-15.md` (신규) — 두 얼굴 정의 / 진입 카드 / 가입 흐름 / 데이터 모델(`profiles.entry_path` 1개 컬럼만) / nav 영향 / 차별점 노출(망고하다 대비) / 위험·완충 / PE 위임 / 3개월 후 (b)/(c) 재판단 기준.
- **벤치마크 종결**: 망고하다 = "카테고리 존재 증명자" 한 줄로 마감. UX·카피 모방 0.
- 사장님 결정 발의: "난 충분히 유언장을 남기는 것 테키하게 경쟁할 수 있을 것 같아. 케어링, 유언 남기는것 둘 다 할거고 망고하다와는 달리 가야지." → "테키하게 경쟁"의 구체 의미 = 법률 자동화가 아니라 관계 자동화(가족 협업 유언 + 케어링 ↔ 유언 자연 전환).
- 후속(다음 세션): L7 대시보드 전면 재설계 = 별도 브랜치(`claude/dashboard-redesign-2026-06-15`) 시작·보류 (사장님: "100명 아니어도 만들어서 url링크따서 매일봐야겠어 너무 불편해") · L8 UX 벤치마킹 전략 문서 · `index.html` 두 진입 카드 PE 위임.

---

**잇다 서비스 프레임워크 + 유저 플로우 + 비효율 진단** (전략 세션, 사장님 발의)
- 사장님 발의: *"지금 잇다의 서비스 프레임워크와 유저 플로우를 프레임워크로 그려줘. 유저 플로우워크 비효율 검토하고 서비스 정리하기 위함."* 참고 글: [Manyfast AI — UXUI 바이브 기획 도구](https://brunch.co.kr/@ghidesigner/455) (ghidesigner 브런치, 본문은 브런치 차단으로 검색 요지만 확보).
- 4축 차용 (Manyfast): **PRD · IA · 기능 명세 · User Flow** — 각 축 유기적 연결, 하나 어긋나면 비효율.
- **잇다 인벤토리**: HTML 50+ 페이지. 5탭 메인(홈·라이프·케어링·콘텐츠·마이) + 진입/인증 8 + 라이프 하위 10 + 케어링 5 + 콘텐츠 8 + 마이 4 + 어드민 1 + **orphan 5** + **legacy 의심 3쌍**.
- **Mermaid 다이어그램 4개**: IA Tree View / 비회원→가입 플로우 / 회원 첫 7일 유언 path / 회원 첫 7일 케어 path / Edge case 8개 노드.
- **비효율 진단 10개 (E1~E10)**: orphan 5개 · 중복 3쌍(care/care-dashboard, my/root, questions/ask) · note/* 5개 위계 흐림 · forest↔info 경계 · 알람 옵트인 후 푸시 미구현(06-14 사장님 제보) · 두 path 자연 전환 미설계 · 비회원 첫 인상 부조화 · 가입 직후 데드엔드 가능성 · 콘텐츠 분류 모호 · 너무 깊은 구조.
- **정리안 3단계**: §6.1 무손실 정리(50→38 페이지, PE 즉시) · §6.2 IA 깊이 줄이기((b) 분리 적용 라운드와 함께) · §6.3 사장님 결정 4개(푸시 채널·유언 빌더 위치·콘텐츠/정보·자연 전환 트리거).
- **PE 위임**: 즉시(orphan/중복 삭제 + sw.js APP_SHELL + legacy active map 7개 정리) · 후속(진입 카드 + `20260615_profiles_entry_path` 마이그레이션 + note/* 단순화) · 결정 후(푸시 채널 1차=이메일 추천).
- 단일 원천: `docs/strategy/service-framework-2026-06-15.md` (신규).
- 트랙 평행: 대시보드(B) 브랜치는 보류 상태 — 프레임워크 정리가 대시보드 metric 설계 input으로 활용 가능.

---

**해외 죽음·웰다잉·사별 서비스 UX 벤치마크 (L8 후속)** (전략 에이전트 백그라운드 위임)
- 사장님 발의: *"죽음관련 서비스 살펴보고 베끼기 가장 적절한 서비스 추천해줘."* → life-heritage-strategy 에이전트 백그라운드 위임.
- **조사 7개 + 종료 1개**: Cake · Empathy · Everplans · Trust & Will · HereAfter AI · Modern Loss · Help Texts (+ Lantern 2024 종료).
- **베끼기 추천 Top 2**:
  - **1순위 Cake (joincake.com)** → 유언/웰니스 path 진입: yes/no 첫 질문 3개로 마찰 ↓ · 콘텐츠 허브 = acquisition 엔진 위계 · freemium "무료로 시작" 정서.
  - **2순위 Empathy (empathy.com)** → 케어링 path 동선: "오늘 무엇부터" 상황 분기 4 카드 · "다음 한 가지" 단일 액션 카드 · 5인 가족 협업 슬롯 명시.
- **베끼지 말 것**: HereAfter AI/Empathy AI 부고문 (추모 보류 헌장 위배) · Trust & Will 법률 자동화 무게 (잇다 차별점 "관계 자동화" 충돌, 망고하다와 분리 핵심) · B2B2C BM 즉시 도입 (06-15 L2 네이버 카페 1순위 충돌, Q4 분기 게이트 이후).
- **핵심 발견 3가지**: ① 유언 단독 BM 위험 — Lantern 종료(2018~2024) = `docs/benchmark/shukatsu-net.md` 終活ねっと와 같은 결, L6 BM 보류 잘함, 콘텐츠+도구+매칭 3축 가설 보강 · ② 승자는 다 콘텐츠 허브 — Cake/Modern Loss/Empathy 공통, forest.html 정비 + 시드 30+ 다음 라운드 최우선 · ③ "다음 한 가지" 패턴은 케어링 universal — Empathy/Help Texts/Cake 공통, 헌장 "시스템이 권하지 않음"과 충돌 X (path 선택 후엔 가이드 허용).
- **사장님 컨펌 필요 카피 결정 5개 (B1~B5)**: 문서 §6.
- 단일 원천: `docs/strategy/ux-benchmark-foreign-2026-06-15.md` (신규, ~11페이지 표 기반).
- 후속(다음 세션): B1~B5 컨펌 후 PE 위임 (index.html 진입 카드 통합 카피 · care-dashboard 4 카드 · reflection step 0 yes/no · invite 5인 카피) · 콘텐츠 허브 재설계는 마케팅+카피라이터 위임.

---

**F1 PE 정리 라운드 — orphan 삭제 + 진입 카드 두 얼굴** (PE 세션, 사장님 결정 컨펌 후)
- 사장님 컨펌 받음: ① §6.3 4번 케어→유언 자연 전환 = (a) 자연 ② 벤치마킹 Top 2 (Cake·Empathy) 베끼기 받아들임 ③ 다음 트랙 F1→F2 순.
- **F1a 무손실 정리**: orphan 4개 파일 삭제(`stories.html` · `prototype-forest.html` · `footprint-preview.html` · `my.html`(13줄 redirect shim)). admin.html `./my.html` → `./root.html` 참조 갱신. welcome.html 코멘트 정합성 정리.
- **진단 수정 (이전 §6.1 오류 정정)**: `story.html` (admin.html 2건 참조) · `note.html` (note/will, info/* 등 3건 참조)는 살아있는 페이지 — **삭제 X**. `care.html` (참조 15건)은 통합 비용 커서 보류. `questions.html` (438줄)은 "지난 질문들" 별도 페이지 — 유지. 검색 패턴 보강(`[^/a-z-]${f}|/${f}`)으로 재검증.
- **F1b 진입 카드 두 얼굴 적용** (L3 (b) / two-faces-one-code-2026-06-15.md §3·§6):
  - index.html 비회원 진입 카드를 1개 → 2개로 분리: ① "내일 다시 못 깨어난다면, 가장 후회할 일은?" → `onboarding.html?path=will` ② "부모님께 오늘, 안부 한 줄" → `onboarding.html?path=care`. 카드 클릭 시 `localStorage.setItem('itda:entry_path', ...)` 저장.
  - welcome.html: 가입 직후 localStorage 또는 URL `?path` 파라미터에서 entry_path 읽어 `profiles.entry_path`에 1회 정착(`is('entry_path', null)` 가드).
- **마이그레이션 신규**: `supabase/migrations/20260621_profiles_entry_path.sql` — `entry_path text check (in 'will','care')` 컬럼 추가. 사장님 1회 SQL Editor 실행 필요.
- **sw.js**: `CACHE_VERSION` → `itda-v3-2026-06-21-pe-cleanup-two-faces-v2`. APP_SHELL은 orphan들 이미 빠져 있어 변경 없음.
- **변경 파일**: `index.html` · `welcome.html` · `admin.html` · `sw.js` · `supabase/migrations/20260621_profiles_entry_path.sql`(신규) · 삭제 4개(`stories/prototype-forest/footprint-preview/my.html`).
- **이번 라운드 미진행**: Cake yes/no step 0 (B1) · Empathy care 4 카드 (B2) · invite 5인 슬롯 (B3) · forest↔info 통합 (B4) — 다음 라운드(F1c·F2).
- **단발 브랜치 예외**: strategy 브랜치(`claude/benchmark-research-2026-06-15`) main fast-forward 머지 후 main 위에 직접 F1 commit(작업 브랜치 `claude/pe-cleanup-2026-06-21` 따왔으나 working tree 그대로 main 머지에 흡수). 다음 작업부터 다시 작업 브랜치 → main 워크플로.
- 후속(다음 세션): F1c(Cake/Empathy 세부 패턴 적용) · F2(콘텐츠 허브 forest 재설계 — 마케팅+카피라이터) · 사장님 마이그레이션 실행 확인 · note/* 위계 단순화 · `care.html` 15건 참조 통합 결정.

---

**시나리오 메모 — (b) 검증 후 재고민 트리거** (사장님 발의)
- 사장님 한 줄: *"일단 제안대로 해보자. 봐서 여전히 복잡하다면 잇다는 그대로 두고 새롭게 두개 분리 운영하는 것. 아님 잇다를 아예 없애고 두개로 쪼개서 운영하는 것으로 다시 고민할듯."*
- `docs/strategy/two-faces-one-code-2026-06-15.md` §10 말미에 시나리오 표 추가: (b) 유지 · (b+) 잇다 유지 + 두 신규 분리 · (c) 잇다 폐지 + 두 서비스만. 비용·트리거 명시.
- 검증 게이트 (Q3 2026 또는 명백 신호 시): 두 path 다 활성 ≥30% · 자연 전환 ≥10% · "잇다 너무 복잡" 정성 피드백 ≥3건 · 한 path 사용자가 다른 path를 노이즈로 ≥30%.
- 결정 아닌 **시나리오 트리거 기록**. 이번 라운드 데이터 보고 사장님 직접 판단.
- 사장님 현재 상태: F1 라이브 확인 대기. 마이그레이션 1회 실행 + 두 카드 동작 확인 후 F1c·F2 결정.

---

## 2026-06-14

**🐞 유언 빌더 "AI 정리" 무반응 근본 원인 = vault-will CORS preflight 차단 (사장님 제보 → 로그로 확정)**
- 증상: 결과 화면이 항상 `buildDraft()` 폴백("1. 1.", "을(를) 지정합니다", "— 남기는 말 —")으로 떴고 "다시 정리"를 눌러도 동일. 사장님 "AI로 정리 눌러도 차이가 없다".
- 진단(Supabase edge-function 로그): 오늘 vault-will에 `OPTIONS 200` 프리플라이트만 3건, 뒤따르는 `POST`가 **0건**. 브라우저가 프리플라이트 응답이 실제 요청 헤더를 허용하지 않아 POST 자체를 **차단** → `supabase.functions.invoke`가 네트워크 에러 → 클라이언트가 매번 폴백.
- 원인: `vault-will`의 `Access-Control-Allow-Headers`가 `Content-Type, Authorization`만 허용. supabase-js `functions.invoke`는 `apikey`·`x-client-info` 헤더를 항상 붙이는데 이게 미허용 → 프리플라이트 실패.
- 수정: `Access-Control-Allow-Headers: 'authorization, x-client-info, apikey, content-type'`로 교체. **MCP로 vault-will v2 배포 완료**(ACTIVE). 참고로 `thinking: {type:'adaptive'}`는 Opus 4.8에서 유효해 문제 아님이었음.
- 후속: 라이브에서 유언 빌더 끝까지 → 결과가 AI 정리본으로 뜨는지 확인 필요. (다른 vault-* 엣지함수도 같은 CORS 패턴이면 동일 증상 가능 — 추후 점검.)


- ⚖️ 법령 확인(YMYL): ① 유언장에 '연명치료 거부'를 적어도 **그 자체로는 효력 없음** — 연명의료 중단은 「연명의료결정법」상 **사전연명의료의향서(공식 등록)/연명의료계획서 + 의료진 임종과정 판단**으로만 효력. 유언은 사후·재산 중심이라 시점·대상 불일치. ② **자필유언 사진 업로드→디지털/화상공증으로 효력 부여 불가** — 자필증서는 직접 손으로 쓴 **원본 종이**라야 효력(민법 §1066, 대법원: 전자문서 서면요건 불충족). **화상공증은 '사서증서 인증'만 대상이고 공정증서(유언) 작성은 제외.**
- 반영(`note/will-builder.html`): '연명의료에 대한 생각' 질문 추가(required=false) — **유언장 본문(번호 항목)에는 넣지 않고**(효력 오해 방지, vault-will이 이 필드 미사용) 결과 화면에 **'🕊️ 연명의료에 대한 나의 뜻' 별도 카드**로 분리 + "효력은 사전연명의료의향서 등록으로" 안내 + lst.go.kr 연결. '화상 공증 연동 준비중' 부정확 박스 → **'공증사무소 연결(대면 공정증서)'**로 교체, 사진=보관용·효력=원본/공정증서 명시.
- `sw.js → itda-v3-2026-06-14-content-tab-to-forest-v3-will-life-sustaining-v1`(다른 세션 콘텐츠탭 변경과 통합 머지). 모듈 문법 통과.
- ⚠️ **남은 권고:** 유저 노출 법률 문구는 실제 acquisition 전 **변호사·법무사 감수** 후 확정(헌장 YMYL). 사장님 컨펌으로 선반영.

**콘텐츠 노출 진단 → "오늘 잇고" 큐레이션 콘텐츠 탭 노출 (PE 배포)** (사장님 세션: 릴스→콘텐츠 노출)
- 사장님 제보: "잇다 콘텐츠가 노출 안 됨, 지면 바뀐 탓?" 원격 DB 직접 확인 + 코드 추적으로 진단.
- **근본 원인**: `forest.html`이 이미 "오늘 잇다가 고른 글" 큐레이션 히어로(hero_day 7일 회전) + reflection 에세이 목록을 갖춘 완성된 콘텐츠 지면인데, 하단 **콘텐츠 탭이 info.html(정보 기본 랜딩, 6/8 결정 #2173c8f)** 을 가리켜 에세이가 2탭 깊이에 묻혀 있었음. "살아 있을 확률" 외 6편(hero_day 1~7)은 is_published=true이나 홈 피드는 `category='reflection'` 의도적 제외(`js/content.js`).
- **수정(배포)**: 6/8 정보-기본-랜딩 결정은 유지하고, **info.html(콘텐츠 탭 랜딩) 최상단에 "🌿 오늘 잇다가 고른 글" 큐레이션 히어로 추가** — forest.html과 동일 로직(hero_day 회전) 재사용, 오늘의 에세이 제목·발췌를 바로 노출 + content-detail 링크 + "오늘 잇고 전체 보기 →" forest.html 링크. 콘텐츠 탭 진입 즉시 오늘의 글이 보임. 추가만(기존 카테고리 브라우저·세그먼트 영향 0).
- 파일: `info.html`(히어로 마크업+스타일+로더 IIFE), `sw.js` CACHE_VERSION → `itda-v3-2026-06-14-itgo-curation-on-content-tab-v1`.
- **보완(v2, 사장님 피드백 "목록까지 안 보임")**: 히어로 아래에 **나머지 오늘잇고 글 목록을 인라인으로 펼침**(`#itgo-list`, category='reflection' 전체를 한 쿼리로 받아 오늘 글=hero·나머지=목록, 각 행 → content-detail). 작은 "전체 보기" 링크에만 의존하지 않도록. `sw.js` → `itda-v3-2026-06-14-itgo-curation-list-v2`.
- **검증 한계**: 샌드박스 네트워크 정책이 jsdelivr CDN(supabase-js)·Supabase를 403 차단 → 데이터 호출 로컬 검증 불가. 정적 렌더 정상 + 히어로 로직은 프로덕션 동작 중인 forest.html과 동일(ID만 상이). 배포 후 라이브 확인 필요.
- 후속(미착수): info.html 히어로를 승인 목업(`docs/product/onneul-itgo-surface-mockup.html`)처럼 커버 이미지·"나에게 닿는 질문" 입력까지 폴리시 / 홈 진입점 추가 여부.
- **최종(v3, 사장님 "콘텐츠 탭 UX 별로" → 팀 추천안 채택)**: info.html에 큐레이션 욱여넣은 게 '정보 브라우저 + 오늘잇고 피드' 한 화면 혼재 → UX 망침. **info.html 완전 원복(f73b073, itgo 0)** + **nav.js 콘텐츠 탭 href `info.html` → `forest.html`** 변경. 이유: forest.html("콘텐츠" 세그먼트)이 이미 오늘잇고 글을 단일 목적으로 잘 모은 페이지 — 라벨('콘텐츠')과 목적지 일치 + 콘텐츠 1탭 노출. 정보(미리/곁에/떠난뒤)는 forest.html 세그먼트 '정보'로 1탭 유지. **6/8 '정보 기본 랜딩'(#2173c8f) 의도적 뒤집음**(콘텐츠 노출 우선, 되돌리기 1줄). `sw.js` → `itda-v3-2026-06-14-content-tab-to-forest-v3`.

**릴스용 AI 디지털 트윈(창업자 페르소나) + "살아 있을 확률" 카드뉴스** (마케팅 세션, 사장님 대화)
- 디지털 트윈 제작 가이드 + 캘리브레이션 대본 v3(끝을 생각해 잘 살기+함께) + 표정·제스처 디렉션(상담사의 평온·안전감) + 릴스 제작 프롬프트: `docs/content/reels-ai-persona-digital-twin.md`.
- 인스타 카드뉴스 "살아 있을 확률" 8장(seed-12 포맷 계승): `docs/marketing/insta-alive-probability-cardnews-2026-06-14.md`.
- "오늘 잇고" 전용 지면 목업·지면 할당 흐름도(Playwright 렌더): `docs/product/onneul-itgo-surface-mockup.html`, `docs/product/onneul-itgo-allocation-flow.html`.

**답변→공유→초대 유입 루프 PE 구현 (사장님 컨펌 후 1차 배포 준비)**
- 단일 원천: `docs/strategy/answer-invite-loop-2026-06-14.md`(467줄, C1~C7 결정 카드). 사장님 컨펌: C1 (b)질문 공유 + (d)그 사람에게 직접 보내기 조합 · C2 옵션 C(질문 노출 + 비로그인 답 1줄 → 가입 게이트) · C3 기존 friend_invites 활용 · C4 이름 default + 익명 토글 · C5 보류 · C6 M6·M7·M8 등재 · C7 카드 공유 보류 · 만료 30일 기본.
- **신규 모듈** `js/reflection-invite.js`: `createReflectionInvite`(친구 초대 토큰 발급, channel='reflection_invite', metadata jsonb에 question_id·anonymous 저장), `shareReflectionInvite`(카카오 SDK 우선 → Web Share → 클립보드 fallback), `renderInviteNudge`(잔잔한 권유 카드 + 익명 토글 + 두 버튼), `logReflectionInviteEvent`(localStorage 폴백 측정). 헌장 일관 — 권유 1회 게이트 (`itda:reflection_invite_nudge_shown` 질문별 마킹).
- **nudge 노출 위치**: `reflection.html` `renderDone()` 직후 — 사별 페르소나(`state.bereaved=true`)는 노출 X (안전장치). `ask.html` 자동저장 직후 — 첫 저장 시 자동저장 status 위에 카드. 질문 텍스트만 공유(답 본문 노출 X).
- **신규 페이지** `invite-answer.html`: URL 파라미터(`?token=&q=`)로 friend_invites 검증 → 만료/사용여부 체크 → metadata 또는 message JSON에서 익명 여부 추출 → 익명이면 "잇다 친구 한 분", 아니면 inviter profile.name 노출. 질문 텍스트 노출 + 비로그인 textarea 1줄 → "답을 저장하고 이어서 잇다 만나기" 버튼. 이미 로그인된 사용자는 즉시 `daily_answers` 정식 저장 + `mark_reflection_invite_consumed` RPC 호출. 비로그인은 localStorage `itda:invite_pending_answer` 임시 저장 후 `signup.html?next=./invite-answer.html?...&invite_answer=1`로 이동.
- **가입 직후 임시 답 정착 안전망** (`index.html` 회원 분기 진입 시): `itda:invite_pending_answer` 발견되면 `daily_answers`에 정식 저장(upsert) + `reflection_invite_signed_up` 이벤트 로깅 + localStorage 정리. signup.html은 `invite_answer=1` 파라미터로 lead 카피만 부드럽게 갈음.
- **마이그레이션** `supabase/migrations/20260614_friend_invites_reflection.sql` (idempotent): (a) `friend_invites.channel` CHECK 제약을 동적 drop → reflection_invite 값 허용으로 재생성. (b) `metadata jsonb default '{}'` 컬럼 추가 + `(metadata->>'kind')` 인덱스. (c) `mark_reflection_invite_consumed(uuid)` RPC 신설(security definer) — accept_friend_invite와 별개. friendships 생성 X. 마이그레이션 미적용 환경에서도 동작하도록 `createReflectionInvite`는 metadata 컬럼 누락/CHECK 위반 시 message에 JSON fallback.
- **M6·M7·M8 정식 등재** (`docs/strategy/decisions-2026-06-14.md` 부록 추가): M6 답변 후 공유율 ≥ 15%, M7 초대 링크 → 가입 전환율 ≥ 5%, M8 초대받아 가입한 D30 retention ≥ 30%. 측정 이벤트 정의 + W26 액션 기준 + 사장님 결정 카드 C1~C7 컨펌 표 + 격리 안전 가드 명시.
- **격리·안전 확인**: 케어링·일기·버킷리스트·기존 share-card·invite.html(친구수락)·기존 share-sheet 사용처(content-detail·diary-detail) 영향 0. 답 본문 공유 X, 친구 답 노출 X, 사별 페르소나 nudge 노출 X. 추모 페이지 복원 0. 임의 hex 0(디자인 토큰만). streak·랭킹·"5명 모으면" 0건.
- **sw.js**: `CACHE_VERSION` → `itda-v3-2026-06-14-reflection-invite-measurement-v1`(다른 세션의 measurement-deploy 작업과 통합 머지). `APP_SHELL`에 `./invite-answer.html`, `./js/reflection-invite.js` 추가.
- **변경 파일**: `js/reflection-invite.js`(신규), `invite-answer.html`(신규), `supabase/migrations/20260614_friend_invites_reflection.sql`(신규), `reflection.html`(renderDone에 nudge slot + import), `ask.html`(자동저장 직후 nudge 동적 import), `index.html`(가입 후 pending answer 정착 안전망), `signup.html`(invite_answer=1 lead 카피), `sw.js`(캐시 버전·APP_SHELL), `docs/strategy/decisions-2026-06-14.md`(M6·M7·M8 등재 + 결정 카드 컨펌 표).
- **사장님 액션**: Supabase SQL Editor에서 `20260614_friend_invites_reflection.sql` 1회 실행 — (a) friend_invites.channel CHECK 제약 reflection_invite 허용, (b) metadata jsonb 컬럼 추가, (c) mark_reflection_invite_consumed RPC. 멱등(재실행 안전). 미실행 시에도 코드는 message JSON 폴백으로 동작하나 익명·질문 ID 추적이 message 파싱에 의존 — 가능한 빨리 실행 권장.
- 잠재 리스크: (a) 토큰 도용 — 30일 만료 + status='pending' 1회성. 도용 시 도용자 본인 답으로 저장되는 정도이며 inviter 답·정보 노출 0. (b) 만료 후 진입 — invite-answer.html이 만료 메시지로 안내 (가입 게이트 없음). (c) 익명 토글이 자랑 동기 더 약화 가능 — M6 측정 후 카피라이터 라운드에서 익명 default 검토. (d) 비로그인 답 1줄 임시저장 후 가입 이탈 시 localStorage에 답 보존됨 — 다음 진입 시 자동 정착(폴백 안전망). (e) 마이그레이션 미적용 환경에서 message에 JSON 직렬화로 fallback 작동하나 invitee 마킹은 RPC 의존 — 마이그레이션 실행 필수.

**측정 더 자세히 보기 — 콘텐츠 정독 + ceremony 퍼널 + admin 대시보드, 배포** (창업자 요청, PE/운영)
- **측정 플랜 지도** `docs/product/measurement-plan.md` 신설 — 세 문서(interview-guide·ceremony-funnel·ai-vault)에 흩어진 계측을 한 장에 모으고 구현/미구현 현황 표로 정리.
- **콘텐츠 정독 계측(`content_read`):** `auth.js`에 범용 `logEvent` 추가, `content-detail.html`이 떠날 때 `app_events`에 maxScrollPct·dwellSec·reachedEnd 1건 기록. "열람(pageview)"과 "정독" 구분.
- **ceremony 퍼널(`funnel_events`):** 테이블(anon insert-only RLS) + 위저드 6개 이벤트(view·start·step·complete·signup_click·reco_click) 계측. `cer_signup_done`은 백로그(가입 `next`에 session_id 전달 필요).
- **admin 측정 대시보드:** `admin.html` "측정" 탭 — 퍼널 단계별 도달 세션·전환율(직전 대비) + 정독 표. RLS 우회는 운영자 이메일 확인 SECURITY DEFINER RPC(`admin_funnel_summary`·`admin_content_read_summary`).
- 마이그레이션 `20260613_funnel_events.sql`·`20260613_admin_metrics_rpc.sql` 적용. `sw.js` → `2026-06-14-measurement-deploy-v1`. 작업브랜치 → main merge 배포.

**리텐션 리포트 틀 — 롤링(가입 후 N일째) 코호트 + 운영자 제외** (창업자 요청, 운영)
- 한 명씩 알음알음 초대하는 방식에 맞춰 고정 `test_start` 코호트 폐기. `/retention-report`를 "가입 실사용자 전원(=초대한 사람) 누적, 사람마다 가입 후 N일째·재방문(D1+)·2회차·초대" 틀로 재작성.
- 운영자 본인(단청, `sue.choi033@gmail.com`) 계정 SQL 자동 제외.

**형제(가족) 초대 플로우 — 프로덕션 배포 + "보기 먼저" RPC 적용 + 케어 트리거 + UT 키트** (오케스트레이터, 사장님 "배포해/M2/2,3번 go")
- **"보기 먼저" RPC 적용 완료(라이브):** `preview_friend_invite`(anon, SECURITY DEFINER, 읽기전용) Supabase 적용·검증(잘못된 코드→0행). 케어링 `preview_care_invite` 동일 패턴. 보안 어드바이저 신규 경고 0. 비로그인 가족이 가입 전 초대자 이름+한마디 확인(P6). 프런트는 RPC 실패시 폴백 전향설계라 적용 즉시 작동.
- **케어 트리거 배치(발송률 출처):** care.html — ①일지 탭 상시 진입점 1줄(가족 0명→"가족과 함께 보기", N명→"함께하는 가족 N명") ②첫 일지 저장 직후 권유 모달 1회(사용자당 localStorage 가드, 이미 가족 있으면 미노출, 닫기 가능). 기존 modal 패턴·토큰 재사용, DB 무변경. (PE 세션)
- **퀵 UT 키트(M2):** `docs/research/invite-flow-ut-kit.md` — 전략 핵심리스크(UI vs 관계 마찰)를 결정 분기로. 미발송/미클릭을 A(방법 모름)/B(보내기 부담)로 가르는 질문 + 판정·다음액션 분기표. (ops 세션)
- **배포:** 작업브랜치 → main fast-forward(main이 다른 세션 PR #43~53로 크게 앞서 있어 rebase로 합침; sw.js 캐시버전 충돌 통합 해소 → `2026-06-14-invite-care-share-v1`). gh-pages 없음(main 직접 서빙).
- **⚠️ 수렴 알림(사장님 확인 필요):** 다른 06-14 세션의 "답변→공유→초대 유입 루프"(아래)가 같은 `invite.html`·`friends.js`·`friend_invites`를 공유 인프라로 씀. 내 리프레임은 **케어 맥락**("이 기록, 가족과 같이 봐요"), 그쪽은 **성찰 맥락**(질문 공유). 두 트랙이 한 초대 화면에 모이므로, invite.html 카피를 channel(care vs reflection_q1)에 따라 분기시키는 정리가 차주 필요. 내 `preview_friend_invite` RPC는 그쪽 "직접 보내기"에도 유용(시너지).



**W26 게이트 측정 대시보드 — M1~M8 통합 (사업전략 세션, 분석·통합만 — 코드 0)**
- 사장님 트리거: "W26 게이트의 M1~M8을 한 곳에서 일목요연하게 + 베타테스트(retention-report skill) 데이터와 합쳐 한 화면에서 합격 여부 판단할 수 있게." 산출: `docs/strategy/measurement-dashboard-w26-2026-06-14.md`.
- 단일 원천 통합: `acquisition-task-oriented-2026-06-13.md`(M1·M2·M3) + `decisions-2026-06-14.md` 부록(M4·M5) + `answer-invite-loop-2026-06-14.md`(M6·M7·M8) + `business-plan-v3.md` 10·11장(QAU 북극성, 가설 a~e, 분기 게이트) + `.claude/commands/retention-report.md`(베타테스트 일일 SQL).
- 한 화면 요약: 즉시 측정 가능 = **M4·M7 (2개)**, 부분 측정 = **M1·M3·M8 (3개)**, 인프라 갭 = **M2·M5·M6 (3개)**. 우선순위 metric 3개 = **M1·M7·M8** (활성 가설 + 관계 리텐션 직접 시험).
- retention-report와의 매핑: M7·M8은 사실상 retention-report가 자동 측정 중(`초대수락`·`페이지뷰누적`·`마지막방문` 컬럼). 단일 원천 결정 = **M7·M8은 retention-report 우선**, 본 대시보드는 W26 시점 정형 판정 라인만. M1·M4는 둘 다 사용, M2·M3·M5·M6은 본 대시보드 책임.
- 통합 단일 SQL 초안: M4·M7·M8 3개는 한 번에 실측 가능, M2·M5·M6은 "미구현" 라벨 + null 반환. M1·M3는 referrer/UTM 메타가 부분이라 분모 과소. 즉 한 번에 8개 다 측정 **불가**.
- W26 판정 매트릭스 6개 시나리오(A 완전합격 / B 관계 강세 / C 활성 강세 / D 시리즈만 / E 우선순위 3개 모두 미달 / F 인프라 갭으로 보류). paid 검토는 **시나리오 C에서만** 발화(D7 조건).
- 인프라 갭 + 다음 PE 위임 한 줄: **referrer/UTM 정형화 + content_scroll·reflection_promise_kept·share_card_click 3개 이벤트 등재 + reflection.html invited_by 모드 — 총 PE 라운드 1회 (약 5~7일).**
- 정직성 라벨: 모든 합격선 [추정], W13 기준선 데이터로 재보정 1회 필수. 가장 큰 약점 — M2·M5·M6 미구현이라 W26이 시나리오 F(보류)로 빠질 risk. PE 우선순위 1·2(referrer + reflection 초대 모드)만이라도 W20 전에 끝내야 한다.

**답변→공유→초대 유입 루프 종합 설계 (사업전략 세션, 분석·설계만 — 코드 0)**

- 사장님 통찰: "잇다 성찰과 매일 노출되는 질문에 답변하고 지인을 초대할 수 있는 유인경로를 설계해줘." 산출: `docs/strategy/answer-invite-loop-2026-06-14.md`.
- 단일 원천 종합 검토: 어제 `decisions-2026-06-14.md`(자기성찰 시리즈 5단계·사별 분기) + `acquisition-task-oriented-2026-06-13.md`(M1·M2·M3·organic 우선) + `business-plan-v3.md`(양면 시장·D5 신호) + 헌장 5장(좋아요 경쟁 의도적 제거) + 코드(`reflection.html`·`js/share-card.js`·`js/share-sheet.js`·`js/friends.js`·`invite.html`·`friend_invites`/`friendships`/`accept_friend_invite` RPC).
- 가치 진단: 답 텍스트는 사적 결이라 공유 약함, **본진은 (b) 질문 공유 + 같이 답하기 + (d) 그 사람에게 직접 보내기**. 답 카드 공유 (a)는 보조·M6 데이터 후 결정(C7). 비교 회고 (c)·잇다 친구 양방향 (e)·미래 봉투 (f)는 본 라운드 보류.
- 헌장 일관 초대 메커니즘: "친구 N명 보상" 금지·"지금만" 금지·랭킹·뱃지·점수 0. 권유는 시리즈 완주(Q5) 직후 1회만. 강요·죄책감 0.
- 초대 인프라: **신규 테이블 0**. 기존 `friend_invites.channel`에 `reflection_q1` 값 추가만(스키마 변경 0), 기존 `accept_friend_invite` RPC 그대로. one-way door 0건.
- 초대받은 친구 첫 화면 추천 = **옵션 C** (질문 노출 + 비로그인 답 1줄 임시 작성(localStorage) → 가입 게이트). 친구 답은 노출 X (privacy + 사별 안전).
- W26 게이트 metric 보강 — **M6·M7·M8 등재 권고**: M6 답변 후 공유율 ≥ 15%, M7 초대 링크 → 가입 전환율 ≥ 5%, M8 초대받아 가입한 D30 retention ≥ 30%. M4·M5(어제 D8)와 같은 라인업.
- 사장님 결정 카드 7개(C1~C7, 모두 two-way door): C1 본진 시나리오 / C2 초대받은 친구 첫 화면 / C3 초대 인프라(기존 활용) / C4 초대자 이름 노출 + 익명 토글 / C5 가입 후 초대자 알림(보류) / C6 M6~M8 등재 / C7 (a) 카드 공유 보류.
- 정직성 라벨: 답변→공유 동력 가설·M7 5% 추정·초대 acquisition이 인스타보다 강한 retention 가설 모두 **미검증**. 가장 큰 약점 — 잇다 톤이 자랑 동기를 의도적으로 걷어내서 공유 동기 자체가 약할 risk. M6 5% 미만이면 "헌장은 지켰는데 acquisition은 안 일어남" 함정.
- 다음 단계: 사장님 결정 후 PE(C1·C2·C3·C6 1차 측정 인프라 = localStorage), 카피라이터(7.1·7.2·7.3 후보 확정), 마케터(D3 인스타와 연결 시나리오), 운영(M6~M8 W26 등재 + 지인 인터뷰 가이드 보강).

**자기성찰 시리즈 + Axis A·B 홈 카드 구현 (PE 세션, 사장님 결정 8개 일괄)**
- 단일 원천: `docs/strategy/decisions-2026-06-14.md`(사장님 결정 8개), `docs/strategy/product-axis-not-waking-tomorrow-2026-06-14.md`. **D1 보류**(important_people 신설 X) → 기존 daily_questions + daily_answers + profiles.notification_pref 활용으로 우회. **D4 라이프 탭 IA 손대지 않음**.
- **자기성찰 시리즈 마이그레이션** (`supabase/migrations/20260614_reflection_series.sql`): `daily_questions`에 `series_key`·`series_step`·`series_branch` 컬럼 추가(전부 NULL 허용, 기존 행 영향 0). `not_waking_tomorrow` 시리즈 8문항 멱등 INSERT — Q1(사장님 확정 카피 그대로) + Q2 분기 + 사람 Q3a·4a·5a + 일 Q3b·4b·5b. `display_order=NULL`로 두어 `get_todays_question` RPC와 충돌 0.
- **goals.area joy 추가 마이그레이션** (`supabase/migrations/20260614_goals_area_joy.sql`): pg_constraint 동적 조회 → 기존 CHECK 제약 drop → `goals_area_check`로 재생성(`finance`·`health`·`family`·`growth`·`joy`). 기존 데이터 영향 0, reversible.
- **신규 페이지** `reflection.html`: 5단계 시리즈 UI(Q1·Q2·Q3·Q4·Q5). 분기 처리(사람·일), 사별 체크박스 → Q4·Q5 스킵 + 일기 편지 분기, 진행률 dot, 이어쓰기(기존 답 자동 로드), 옵트인 결과는 `profiles.notification_pref.reflection_series` JSON에 저장(컬럼 신규 0).
- **홈 카드 (`index.html` 회원 분기)**: 자기성찰 시리즈 상태 조회(`loadReflectionSeriesState`) → 미답=진입 카드(사장님 확정 카피), 미완료=이어가기, 사별=일기 편지 카드(알람 0건), 사람/일 path + 옵트인 + 알람 노출일=잔잔한 한 줄 약속 카드, 그 외 완료=다시 보기. `.card-quiet` 차용, 임의 hex 0건. 알람 노출일 룰: 주1=일, 주2=월·목, 주3=월·수·금(`shouldShowReminderToday`).
- **사별 안전장치**: Q3a(사람 이름)에 "이미 떠나신 분이에요" 체크박스 → 답에 `[사별]` 접두사 마킹 → reflection.html이 Q4·Q5 스킵, 일기 편지 분기. 홈에서도 알람 카드 대신 일기 진입 카드. profile에 `bereaved: true` 보존.
- **M4·M5 metric 등재**: `docs/strategy/decisions-2026-06-14.md` 부록에 M4(시리즈 완주율 ≥30%) / M5(약속 이행률 ≥40%) 잠정 합격선 + 계산 SQL 초안 + W26 액션. M5의 "오늘 했어요" 이벤트는 다음 라운드 PE.
- 변경 파일: `supabase/migrations/20260614_reflection_series.sql`(신규), `supabase/migrations/20260614_goals_area_joy.sql`(신규), `reflection.html`(신규), `index.html`(회원 카드 분기), `sw.js`(CACHE_VERSION → `itda-v3-2026-06-14-reflection-series-v1`, APP_SHELL에 `./reflection.html` 추가), `docs/strategy/decisions-2026-06-14.md`(부록 M4·M5).
- **사장님 액션**: Supabase SQL Editor에서 두 마이그레이션 1회 실행 — (1) `20260614_reflection_series.sql` → daily_questions 컬럼 추가 + 시리즈 8문항 INSERT, (2) `20260614_goals_area_joy.sql` → goals.area CHECK 갱신. 순서 무관, 둘 다 멱등(재실행 안전).
- 격리 확인: 케어링·일기·버킷리스트·자기준비 허브·라이프 탭 IA 비변경. 비회원 홈 비변경. 추모 페이지 복원 0건. 임의 hex 0건(디자인 토큰만).
- 잠재 리스크: (a) 사별 페르소나 오분류 — 체크박스 단일 시그널만 사용. 답에 "엄마(돌아가심)" 같이 자유서술하면 잡지 못함. 다음 라운드에서 키워드 보강 검토. (b) Q5 옵트인 흐름이 5단계 끝에 와서 사용자가 도달 전 이탈할 수 있음 — M4 < 30%면 흐름 재검토. (c) 알람 노출일 룰(요일 고정)은 in-app only, 사용자 가입 요일·타임존 무시 — 푸시 라운드에서 정교화.

**프로덕트 축 재설계 종합 설계 (사업전략 세션, 분석·제안만 — 코드 0)**
- 사장님 통찰(seed-12 카드뉴스 제작 중) → 카드뉴스의 결을 프로덕트 축으로 옮기는 종합 설계 라운드. 산출: `docs/strategy/product-axis-not-waking-tomorrow-2026-06-14.md`.
- 코드 사실관계 확인(seed.html·plan-write.html·js/goals.js·index.html·nav.js·migrations): (a) 버킷리스트는 `goals` 테이블로 모델 완비 — 사장님 표현 "일기에 묻혀 있다"는 테이블 통합이 아니라 **진입 동선(seed.html 탭2)·영역 분류(재정·건강·가족·성장 4개, "사소한 기쁨" 없음)·홈 노출 0 합성어**. (b) "내 삶에서 중요한 사람" 객체가 잇다 코드 어디에도 없음 — Axis A는 새 1급 객체 추가.
- 두 축 정의: **Axis A** = 떠오르는 사람 + 연락 빈도 + 행동 넛지(신규 `important_people` 테이블 = one-way door 후보). **Axis B** = 풍요로운 삶/사소한 기쁨(기존 `goals.area` enum에 `joy` 추가 + UI 분리 노출, B3 옵션). 위계는 **동등 두 축(R1)** 추천(모델 정합).
- IA: 라이프 탭 2탭(일기·버킷리스트) → 3탭(+관계). 일기·버킷 페이지 분리(S3)는 비추(학습 비용). 회원 홈에 "이번 주 ○○에게" + "사소한 기쁨" 카드 추가(D5).
- 행동 넛지(헌장 일관): streak·잔디·!! 강조 금지 / "이번 주 ○○에게 한 번 어떠세요" 잔잔한 한 줄. 푸시는 옵트인 기본 OFF, 주 1회 상한, 3주 무시 시 자동 중지. 기존 push-notify 인프라 재사용.
- 사별 페르소나 안전장치(D7): onboarding stage `bereaved` 시 가입 후 30일간 "사람 적어둘까요?" 카드 자동 숨김 + archived 안내.
- W26 게이트 새 metric 후보: **M4 첫 사람 입력률(D7)**, **M5 last_contact_at 갱신율(주 1회 이상)**.
- v3 BM 매핑: 활성 가설(20-40대 일상 진입)에 **강한 강화 신호**. D5 보류(구독 BM 약화)와는 본 축 자체로 BM 결합 0 — Axis A·B는 무료, 결제 트리거는 별도 라운드(완성물·캡슐화).
- 사장님 결정 카드 8개: D1(Axis A 도입, one-way) / D2(위계 R1) / D3(B3 goals 확장) / D4(라이프 3탭) / D5(홈 카드 추가) / D6(in-app + 푸시 옵트인 OFF) / D7(사별 안전장치) / D8(M4·M5 등재).
- **one-way door 명시**: D1(`important_people` 테이블 신설) — 창업자 승인 + 백업 필수. D3 mid-grade. 나머지 reversible.
- 본 라운드 산출은 분석·설계 단일 문서. 코드 변경·푸시 0. 사장님 승인 후 PE·카피라이터 위임 범위 9·10장에 명시.

**seed-12 인스타 카드뉴스 정돈 + Canva 생성 (사장님 4번 채택)**
- 사장님이 GitHub 웹에서 카드뉴스 본문 직접 편집(commit `7dc7d3e`): 카드 1 호흡(`잠들고 → 잠들었다가`), 카드 3 표현(`답합니다 → 떠올립니다`, `거의 언제나 사람입니다 → 거의. 언제나. 사람입니다.` 마침표 강조), 카드 4 구체화(`마지막을 → 마지막 떠나는 이를`, `표현하지 못한 마음 → 그 사람에게 표현하지 못한 마음`), 카드 6 순서(2↔3).
- 후속 정돈(commit `95e22db`): 카드 1 자판 오타 `꺠어난다면 → 깨어난다면`, 캡션을 사장님 새 본문 톤 그대로 옮김(메모 줄 제거).
- **Canva 8슬라이드 카드뉴스 생성** — outline-review 후 4종 후보, 사장님 4번 채택. minimalist 스타일(흰 배경 + 에버그린 액센트선 + 명조체 + 여백, 아이콘·사진 0).
- Canva 산출: 디자인 ID `DAHMgnzKi_w` / 편집 `canva.com/d/f4gyXIDzOfyfIWA` / 보기 `canva.com/d/wuM9ITHJWrColQA`.
- 사장님 후속(앱 외): Canva 편집 → 인스타 비율 resize(1080×1350) → 로고 추가(옵션) → PNG export 8장 → 인스타 캐러셀 게시(캡션은 정돈본 그대로).

## 2026-06-13

**잇다 의견·요청 폼 진입점 구현 (PE 세션, 사장님 결정 반영)**
- 단일 원천: 사장님 확정 구글폼 URL(`docs.google.com/forms/d/e/1FAIpQLSfmsc33WCvi-Fwr7at7ci4HSXeNfL8dTN4JuoNCmhRp32kQXg/viewform?usp=pp_url&entry.1462653906=URL_HERE`) + 다수 오류 시 안내용 이메일(`itda.life.heritage@gmail.com`). `URL_HERE` 자리는 클릭 시점에 `encodeURIComponent(location.href)`로 자동 치환.
- **공통 footer 진입점 (작업 1)**: nav.js를 쓰는 39개 페이지는 `_renderFooter()` 한 곳에 "잇다에 의견 보내기 →" 한 줄 링크를 추가(© 라인 위, 약관/개인정보 링크와 시각 분리). nav.js를 안 쓰는 auth 계열 페이지(signup·login·forgot·reset·welcome·beta)에는 신규 `js/feedback-link.js`가 `footer.auth-footer` 안에 동일 링크를 동적 prepend(중복 방지를 위해 `itda-footer`가 이미 떠 있으면 no-op). 카피 선택: **"잇다에 의견 보내기 →"** — "잇다에"를 살려 발신자(사용자)와 수신자(잇다)의 관계를 분명히 하고, 헌장의 조용·존엄 톤과 일치. 6개 페이지에 `<script src="./js/feedback-link.js"></script>` 한 줄씩 추가.
- **beta.html 피드백 채널 교체 (작업 2)**: 이전 라운드의 `<textarea>` + localStorage(`itda:beta_feedback`) 저장 흐름 전부 제거, `hello@lifeheritage.kr` 표기도 제거. 교체: (a) `.quiet-card` 톤의 "구글폼 진입 카드" — `의견·요청·오류는 짧은 폼으로 보내주세요.` + 알약 CTA `의견·요청 보내기 →` (b) 이메일 안내(사장님 카피 그대로) `오류가 있는 페이지가 다수인 경우, 캡처하여 이메일로 알려주시면 더 나은 서비스로 보답하겠습니다. (이메일: itda.life.heritage@gmail.com)`. M3 이벤트 이름은 `beta_feedback_submit` → **`beta_click_feedback_form`** 으로 명료화(클릭 ≠ 제출).
- 변경 파일: `nav.js`(footer 마크업·스타일·이벤트 핸들러), `js/feedback-link.js`(신규, 자립형 IIFE), `signup.html`·`login.html`·`forgot.html`·`reset.html`·`welcome.html`·`beta.html`(`<script src="./js/feedback-link.js"></script>` 한 줄 추가), `beta.html`(피드백 섹션 마크업·CSS·JS 교체), `sw.js`(`CACHE_VERSION` → `itda-v3-2026-06-13-feedback-form-v1`, APP_SHELL에 `./js/feedback-link.js` 추가).
- 검증: 브라우저 콘솔 한 줄로 동작 확인 가능 — `window.open('https://docs.google.com/forms/d/e/1FAIpQLSfmsc33WCvi-Fwr7at7ci4HSXeNfL8dTN4JuoNCmhRp32kQXg/viewform?usp=pp_url&entry.1462653906=' + encodeURIComponent(location.href), '_blank', 'noopener')`. 폼 열렸을 때 "URL" 항목에 현재 페이지 주소가 자동 채워져 있어야 함.
- 디자인 토큰만 사용(--ink-soft/--primary/--bg-alt/--line/--radius-sm), 임의 hex 0건. 헌장(조용함·존엄·과시 금지) 일관.
- 잠재 리스크: ①신규 구글폼 entry ID(`entry.1462653906`)가 사장님 폼에 실재해야 자동 채움이 동작 — 사장님 검토 시 폼을 한 번 열어 "URL" 필드 prefilled 확인 필요. ②`feedback-link.js`는 `type="module"`이 아닌 일반 스크립트 — auth 페이지가 module 로딩 전이라도 footer는 정적이므로 mount 시점에 footer가 이미 DOM에 있어 정상 동작. ③beta.html의 `beta_feedback_submit` 이벤트를 운영자가 수집/분석 중이었다면 새 이름 `beta_click_feedback_form`으로 파이프라인 갱신 필요(현재 수집은 localStorage only → 영향 0). ④사용자가 footer까지 스크롤하지 않으면 진입점 발견율이 낮을 수 있음 — 본 라운드는 "어디서든 접근 가능한 안전망" 목적이고, 강한 진입(예: 우측 하단 floating)은 다음 라운드 결정.

**seed-12 인스타 카드뉴스 1편 (8장) — D3 컨펌·D5 보류 반영** (마케터 세션)
- 단일 원천: `docs/content/seed-12-live-without-regret.md`(원본 글), `docs/strategy/acquisition-task-oriented-2026-06-13.md` 3장(인스타 channel 설계), `docs/company/CHARTER.md`(조용함·존엄·과시 금지).
- 결 흐름 8장: Hook(질문) → "잘 죽는 것=잘 사는 것" → 0.5초 만에 떠오른 사람 → 4가지 후회 카테고리 → 미룸의 누적 → 오늘부터 할 수 있는 3가지 → 잇다 소개 → 무약속 CTA.
- Hook 카피: `오늘 밤 잠들고 / 다시 못 깬다면, / 가장 후회할 한 가지는 무엇인가요.` (seed-12 27행 직접 변주, `당신이`만 삭제로 인스타 호흡 살림)
- **CTA 카피 (D5 보류 반영)**: `잇다 베타 사용자로 / 함께해 주실래요? // 먼저 시작한 분들의 피드백으로 / 잇다는 만들어집니다.` 정체성·관계만 약속. **가격·기간·인원 캡 표현 본문·캡션·해시태그 전체 0건**.
- 시각 가이드(텍스트): 차분·여백·명조 한 폰트, 흰 배경 + 잇다 에버그린/잉크 토큰만, 임의 hex 금지. 한 카드 한 메시지·좌측/중앙 정렬. 실 이미지 제작은 사장님.
- 산출: `docs/marketing/insta-seed-12-cardnews-2026-06-13.md` 신규.

**잇다 베타 랜딩 페이지 신설 (`beta.html`)** — PE 세션, 사장님 D4 컨펌·D5 보류 반영
- 단일 원천: `docs/strategy/acquisition-task-oriented-2026-06-13.md` 3장(인스타 channel 설계) + `docs/business-plan-v3.md` 10장(M3 정의). 4단계 funnel의 2단계: **인스타 → `beta.html` → `signup.html` → onboarding 결과**.
- **사장님 D5 보류 신호 반영**: "구독료 형태로 못 갈 것 같다" → beta.html에서 **가격·기간·캡 약속 0건**. ("12개월 무료", "캡 50명", "정식 1년 무료" 표현 전부 제외) 정체성·관계 약속만 — "잇다 베타에 자리를 남겨 두었어요", "함께 만들어가는 단계", "피드백 채널은 늘 열어 두었어요".
- 페이지 구조(섹션 순서): (1) BETA 키커 + 헤드라인 + 리드 → (2) `.quiet-card` "잇다가 뭐 하는 곳인지"(죽음·돌봄·사별·후회 없이 살기) → (3) `.quiet-card` 베타 단계 안내(정직한 톤) → (4) 시작 CTA `같이 시작해볼게요` + 둘러보기 `먼저 잇다를 둘러볼게요 →` → (5) 피드백 채널(이메일 `hello@lifeheritage.kr` + 가벼운 textarea, localStorage 보관).
- 톤·디자인: `index.html` 비회원 분기 `.card-quiet` 어휘를 그대로 차용(`.quiet-card`/`.quiet-eyebrow`/`.quiet-title`/`.quiet-body`). 디자인 토큰만(--bg/--bg-alt/--ink/--primary/--primary-soft/--line), 임의 hex 0건. nav·footer는 signup.html 구조 차용.
- **M3 측정용 이벤트 로그(localStorage only — 분석 도구는 다음 라운드)**: 인라인 스크립트가 (i) UTM 캡처 → `itda:utm:first`(first-touch 보존) + `itda:utm:last`(last-touch) (ii) 이벤트 push → `itda:beta_events`(최대 200건, `beta_view`/`beta_click_signup`/`beta_click_browse`/`beta_feedback_submit`) (iii) CTA `href`에 UTM 파라미터·`via=beta` 자동 패스스루 → signup.html attribution 유지 (iv) `itda:beta_signup_pending` 시각 보존(향후 signup.html이 읽어 M3 = signup/beta_view 계산). 위 키들은 익명·로컬·개인식별정보 0건(헌장 일치).
- index.html에서 beta.html로의 진입점 **미추가**(인스타 외 진입은 다음 라운드 결정). `beta.html`에서 `index.html`·`signup.html`로 나가는 출구만 있음.
- 변경 파일: `beta.html`(신설, 1파일 in-line CSS+JS), `sw.js`(`CACHE_VERSION` → `itda-v3-2026-06-13-beta-landing-v1`, APP_SHELL에 `./beta.html` 추가), `docs/worklog.md`.
- 잠재 리스크: ①UTM 미동봉 진입(직접 URL 공유) → attribution 빈 채로 기록되지만 `beta_view`는 잡힘(허용). ②현재 Supabase analytics 테이블 없음 → 데이터는 사용자 디바이스 localStorage에 갇혀 있음(다음 라운드 `analytics_events` 또는 `cta_clicks` 패턴 확장 필요). ③signup 완료 시점 측정은 signup.html이 `itda:beta_signup_pending`을 읽도록 다음 라운드에서 연결 필요 — 현재는 클릭까지만. ④피드백 textarea 내용도 localStorage에만 → 운영자가 사용자 디바이스에 접근 못 함, 메일 채널이 사실상의 1차 수신처(textarea는 비공식 보조).

**task-oriented acquisition 전략 — v3 가설 매핑 + 인스타 organic 채널 설계** (전략 세션, 사장님 통찰 위임)
- 사장님 통찰(가입 유저 데이터: 케어링 대상 있을 때만 재로그인, 쏘카 비유 — task-oriented 본질)을 v3 가설에 매핑.
- 매핑 결론: 사장님 데이터 = **활성 가설(20-40대 일상 진입) 약화 신호** + 케어링자 task-oriented 페르소나(가설 a 본질) 부분 확증. 단 콘텐츠 인덱싱·SNS 유통 전이라 측정 조건 미충족 → **W26 게이트에서 판정**(즉시 폐기 X).
- 활성 가설 측정 metric 3개: M1 organic 진입자 D30 재방문율 ≥20% / M2 가입자 30일 시드 3편 정독 ≥15% / M3 organic 글→가입 전환율 ≥1%.
- 인스타 organic 채널 추천: **seed-12(후회 없이 살기) 카드뉴스 7~10장 1편 4주 테스트**. 활성 가설 직타 + YMYL 감수 불필요 + 헌장 톤 가장 깨끗. **`beta.html` 베타 랜딩 페이지 신설** — 인스타→약속 페이지(피드백 채널·인원 캡·12개월 무료)→가입 4단계 funnel로 M3 측정. seed-13/seed-01은 감수 완료 후.
- 지인 병행안: **20명 → 10명 축소, 20분/명, "카피·UX 막힘 잡기"에 한정.** 지불 의향·needs 강도는 베타 코호트로 이전.
- 헌장 일관성: 인스타 채널은 시각적 카드 만들지만 잇다 톤(차분·여백·명조 한 폰트)로 살림. paid 광고는 W26 후 LTV>CAC 증명 시 조건부 검토.
- 사장님 결정 카드 6개: D1 활성 가설 폐기 시점(추천 W26 유보) / D2 M1·M2·M3 등재 / D3 seed-12 인스타 1편 진입 / D4 베타 랜딩 페이지 신설 / **D5 베타 약속 정의(one-way door — 무료 12개월·캡 50명·정식 1년 무료 잠정 추천)** / D6 지인 인터뷰 10명 축소 / D7 paid 광고 게이트(W26 후 조건부).
- 산출물: `docs/strategy/acquisition-task-oriented-2026-06-13.md` (266줄). 코드 미수정.

**홈 H3 적용 라운드 — D1·D2·D3 일괄 구현 + D4 추인 (PE 세션, 사장님 컨펌)**
- 단일 원천: `docs/strategy/onboarding-home-integration-2026-06-11.md` 5·6장. 7개 결정 카드 중 본 라운드는 D1~D4(two-way door 4건)만. D5·D6·D7은 별도 라운드(D7은 DB one-way, 창업자 승인 필요).
- **D1 — 비회원 첫 화면 재구성 (H3)**: `index.html` 비회원 분기 first-fold 순서를 (1) `greeting-block` 인사 → (2) 톤 다운 진단 입구 카드 → (3) `요즘, 잇다에선` 피드 → (4) 작은 "둘러보기" 링크(below the fold) 로 재배치. "정답은 없어요" 표현은 비회원 화면에서 완전 제거(헌장 톤 점검 결과 — 사별 직후 페르소나 자극·경박 위험). 채택 카피 = 후보 (c) `오늘은 어디쯤 와 계세요?`(eyebrow `잇다 · 같이 짚어보기`, 부제 `일곱 번만 답하면, 지금 결에 맞는 다음 한 걸음을 같이 찾아볼게요.`, CTA `같이 짚어볼게요 →`). 카드 양이 줄어 피드가 자연히 first-fold로 끌어올려짐.
- **D2 — 회원/비회원 카드 시각 분리**: 회원의 "오늘 잇고" 카드(`.card-seed`, 에버그린 그라데이션)는 그대로 유지(엔게이지·매일 첫 행동 자리). 비회원의 진단 입구 카드는 **신규 클래스 `.card-quiet`** 로 분리 — `var(--bg-alt)` 솔리드 + `var(--line)` 보더 + 본문 `var(--ink)` + CTA만 `var(--primary-soft)` 알약. 디자인 토큰만, 임의 hex 0. 컴포넌트 분리 방식(같은 슬롯에 다른 클래스) — mode prop 없이 마크업 자체가 분기되므로 회원 홈 동작에 영향 0.
- **D3 — "이웃 글" 정의 = 시각·언어 처리만**: `js/content.js` `listHomeFeed` 필터(`author_type='official'`)는 **건드리지 않음**(v3 가설 a/b/c 1차 판정 후 별도 라운드). 대신 `index.html` 피드 카드 작성자 칩 라벨을 `✓ 잇다 에디터` → **`먼저 겪은 이웃`** 으로 변경. 본문·제목·작성자 표기(`잇다 에디터`)는 그대로 — 본 라운드는 시각 톤만, 카피 본격 라운드는 카피라이터 위임.
- **D4 — G1 게이트 경로 (A+B 혼합) 추인**: PR #41(2026-06-11 PE 라운드)에서 적용 완료. 본 라운드 추가 변경 0 — 결정 카드의 추인만 명시.
- 변경 파일: `index.html`(비회원 카드 마크업·CSS, 피드 칩 라벨), `sw.js`(CACHE_VERSION → `itda-v3-2026-06-13-home-h3-d1d4-v1`). `js/content.js` 미변경. 마이그레이션 0. 커밋·푸시 보류(창업자 검토 대기).
- 격리 확인: 회원 분기 (`if (user) { ... }`) 마크업·스타일 비변경 → 회원 홈 동작 영향 0. `.card-seed` 그라데이션 정의는 그대로 회원 카드에만 적용됨. 피드 칩 라벨 변경은 회원·비회원 공통 적용(에디터 글이라는 사실은 같음).
- 잠재 리스크: ①첫 진입 사용자가 SW 캐시 적용 전 옛 "정답은 없어요" 카드를 잠시 볼 수 있음 — `CACHE_VERSION` 갱신으로 새로고침 1회면 해소. ②피드가 first-fold로 올라오면서 비회원의 회유 전환점이 "진단 카드 vs 피드 카드"로 양분 — 진단 입구 카드의 잔잔한 톤이 묻힐 가능성. D1 카피의 시각 위계(eyebrow/title/desc/CTA 4단)로 보강했으나, 1주 후 행동 데이터로 추가 미세조정 가능. ③`먼저 겪은 이웃` 라벨이 실제 작성자(잇다 에디터)와 살짝 어긋남 — 본문/제목을 안 건드린 결과의 의도된 시각·언어 차이이며, 카피라이터 라운드에서 본문 톤이 따라오면 자연 정합. ④`.card-quiet` 라는 신규 클래스명은 다른 페이지에서 미사용 → 충돌 0 확인.

| 카드 | 결정 | 적용 위치 | 채택 카피 한 줄 |
|---|---|---|---|
| D1 비회원 첫 화면 | H3 (톤 다운 + 콘텐츠 공존) | `index.html` L389-410 비회원 분기 | `오늘은 어디쯤 와 계세요?` |
| D2 카드 시각 분리 | 컴포넌트 분리 (`.card-quiet`) | `index.html` `<style>` + 비회원 분기 | (시각 차원 — 솔리드 톤 vs 그라데이션) |
| D3 이웃 글 정의 | (a) 시각·언어 처리만 | `index.html` `feedCard()` 칩 라벨 | `먼저 겪은 이웃` |
| D4 게이트 경로 | A+B 혼합 추인 | (PR #41 적용 완료) | — (변경 0, 추인만) |

**버그 수정 — 하단 nav가 스크롤 중 화면 중간으로 떠오르는 문제** (PE 세션)
- 원인: `body { zoom: 1.1 }` 가 iOS Safari에서 `position: fixed` 의 좌표 기준을 zoom된 공간으로 잡아 하단 메뉴바가 viewport 바닥이 아닌 본문 중간에 붙어 보였음(콘텐츠 상세처럼 본문이 긴 페이지에서 두드러짐).
- 수정: zoom을 body에서 떼고 컨테이너(`.itda-top-bar` · `body > main` · `.itda-bottom-nav`) 각자에 적용 — 110% 가독성 스케일은 유지, 고정 nav는 viewport 기준으로 정확히 바닥에 고정.

**오늘 잇고 — "← 어제 질문" 링크** (PE 세션, 사장님 요청)
- 사장님 요청: "어제 올라온 질문이 뭔지 보고 싶다." 현 로직(가입 N일째 = `display_order`)에선 "유저 기준 어제" = `display_order − 1` 로 정의(플랫폼 캘린더 기준 어제는 `published_at` 컬럼 부재로 불가, 두 시간축 통일 결정 필요 — 별도 라운드).
- 수정(`ask.html`): q-meta 줄에 `← 어제 질문` 링크 추가, 기본 `hidden`. 오늘 질문 로드 후 `display_order > 1` 이면 `display_order − 1` 인 질문 id를 조회해 링크 노출. 클릭 시 기존 `?id=` 분기로 자연스럽게 "지난 질문" 헤더(`지난 질문 · N번째`)로 진입. 가입 1일째 유저엔 숨김.

---

## 2026-06-12

**유언장 빌더 — 결과를 처음부터 AI로 정리해 보여주기 (사장님 제보)**
- 🐞 문제: `will-builder.html` 결과 화면이 `buildDraft()`로 답을 **질문 맥락 없이 번호만 붙여** 이어붙여 "1. 1. 남편에게…" 식 깨진 초안이 먼저 뜸. "✨ AI로 다듬기"를 눌러야 vault-will(claude-opus-4-8)이 정리 → 한 단계 더 거쳐야 읽을 만한 글이 나옴.
- 사장님 제안: "애초부터 AI로 정리해서 나오게 하자."
- 수정(`note/will-builder.html`): 결과 진입 시 **자동으로 vault-will 호출**(로딩 상태 "정리하고 있어요…"). 정리되면 바로 표시·서버 저장. 실패 시 `buildDraft()` 구조 초안으로 **폴백**(빈 화면 방지). "AI로 다듬기" 버튼 → "✨ 다시 정리"로 변경. 첫 질문 안내에 "다 답하시면 AI가 한 편의 유언장으로 정리해드려요" 기대치 명시. 면책 문구에 "답한 내용 그대로 담고 없는 내용 지어내지 않음" 추가(엣지함수 system 규칙과 일치).
- vault-will 엣지함수는 기존 그대로(보존적 정리 — 준 정보만 사용, 빈 항목 생략). 법적 효력 면책·자필 체크리스트 유지.
- `sw.js → itda-v3-2026-06-12-will-auto-organize-v1`. 모듈 문법 통과.
- 운영 메모: 작업 브랜치가 main보다 뒤처져 있었음(PR #40~#42로 will-builder·onboarding·notifications가 main에 머지됨) → 최신 main으로 동기화 후 작업. gh-pages는 `pages.yml` Action이 main push마다 자동 동기화하므로 main까지만 올리면 배포됨.

---
## 2026-06-11

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
