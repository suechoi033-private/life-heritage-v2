# 잇다 작업 로그 (Work Log)

모든 세션의 작업을 **날짜별로 한곳에** 쌓는 문서입니다. 무엇을 언제 했는지 한눈에 보기 위한 용도.

**유지 규칙**
- 최신 날짜가 맨 위. 같은 날 안에서는 영역별로 묶어 정리.
- 매 작업 세션은 끝에 **오늘 날짜 섹션**에 자기 작업을 추가한다 (없으면 새로 만든다).
- 출처는 git 커밋. 다른 세션 작업이 빠져 있으면 `git log --date=short` 에서 백필한다.
- 커밋 해시는 추적용 참고. 세부는 커밋 메시지/PR 참조.

---

## 2026-06-03

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
