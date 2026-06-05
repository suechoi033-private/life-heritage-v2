# 잇다 / 라이프헤리티지 — 세션 가이드

모든 세션은 이 파일을 시작 시 읽는다. 최상위 기준은 `docs/company/CHARTER.md`(헌장),
전략은 `docs/strategy.md`, 디자인은 `docs/company/design-system.md`.

## 작업 로그 — 매 세션 필수

**하루의 작업을 마무리할 때(= 세션에서 의미 있는 변경을 끝냈을 때), `docs/worklog.md`에
오늘 날짜로 자기 작업을 반드시 남긴다.** 창업자가 매번 요청하지 않아도 자동으로 한다.
라이프헤리티지의 기록을 길게 잘 남기기 위한 규칙이다.

- 오늘 날짜 섹션이 없으면 새로 만들고(최신 날짜가 맨 위), 있으면 그 아래에 추가한다.
- 영역별로 묶어 한눈에 보이게. 커밋 해시를 참고로 단다.
- 다른 세션이 같은 날 작업했는데 로그에 빠졌으면 `git log --date=short` 에서 백필한다.
- worklog 갱신은 해당 작업과 같은 푸시에 함께 올린다.

## 배포 규칙

- 정적 사이트는 `gh-pages` 브랜치로 서빙. 코드 변경 후:
  1) 작업 브랜치 → 2) `main` → 3) `gh-pages` 순으로 푸시.
- `main`이 앞서 있으면 **강제 푸시 금지**. `git fetch origin main` 후 rebase로 합친다.
- 앱 동작/화면이 바뀌면 `sw.js`의 `CACHE_VERSION`을 올려 캐시를 갱신한다(docs만 바꿀 땐 불필요).
- **`main`/`gh-pages`로 푸시하기 전 `bash scripts/deploy-preflight.sh`를 돌린다.** 위 규칙(CACHE_VERSION 갱신·force push 금지·새 화면 APP_SHELL 등록)을 자동 점검한다. 차단(exit 1)되면 고친 뒤 푸시한다.

## 제품 원칙 (요약 — 자세히는 헌장)

- 죽음·돌봄·사별 주제. 톤은 조용함·존엄, **과시·경쟁 금지**(좋아요 수 경쟁은 의도적으로 걷어냈다).
- YMYL(의료·법률·재정)은 전문가 감수 없이 발행하지 않는다.
- 추모(memorial)는 보류·숨김 상태 — 피드/홈에 노출하지 않는다.
- 디자인 토큰만 사용(임의 hex 금지), 시니어 가독성 우선.
- 되돌리기 어려운 행동(돈·계약·외부 발송·force push to main 등)은 창업자 승인.

## 스택

- 정적 HTML + 바닐라 JS(ES modules) + Supabase(Auth/DB/Edge Functions). 빌드 단계 없음.
