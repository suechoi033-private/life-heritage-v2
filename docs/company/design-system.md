# 잇다 디자인 시스템 v3 (코드 기준)

> 출처: `auth-styles.css` `:root` (실제 커밋된 값). 이 한 곳이 전 페이지로 cascade되는 단일 진실 원천.
> 색을 바꾸려면 토큰만 고친다. 인라인 hex 추가 금지.

## 컬러 토큰

| 토큰 | 값 | 용도 |
|---|---|---|
| `--bg` | `#FFFFFF` | 순백 기본 배경 |
| `--bg-alt` | `#F4F6F4` | 카드·섹션 (whisper 쿨그레이) |
| `--bg-dark` | `#16201A` | 다크 면 |
| `--ink` | `#21261E` | 본문 (목업 Ink) |
| `--ink-soft` | `#3E4A43` | 보조 텍스트 |
| `--ink-muted` | `#6B756E` | 약한 텍스트 |
| `--ink-faint` | `#AFB8B2` | 가장 약한 텍스트·화살표 |
| `--primary` | `#2F6B4F` | **에버그린** — 주요 CTA·강조 |
| `--primary-hover` | `#25563F` | 호버 |
| `--primary-soft` | `#E7F1EC` | 옅은 에버그린 틴트 (배지·소프트 배경) |
| `--warm` | `#BE6440` | **클레이** — 돌봄(케어링) 미세 악센트 |
| `--warm-hover` | `#9E5234` | |
| `--warm-soft` | `#F6EEE7` | 따뜻한 카드 배경·유저 배지 |
| `--line` | `#E5EAE6` | 쿨 그레이 라인 |
| `--danger` / `--danger-soft` | `#C94F4F` / `#F5E4E4` | 경고 |
| `--success` / `--success-soft` | `#2E8A5E` / `#E4F2EA` | 성공 |

> **Gold #A8894E** (목업의 유산/추모 악센트)는 추모 보류로 현재 미사용. 추모 복원 시 토큰 추가.

## 타이포그래피

| 토큰 | 값 | 용도 |
|---|---|---|
| `--font-serif` | `'Nanum Myeongjo', 'Noto Serif KR', ...` | **성찰 표면** — 인사·질문·콘텐츠 제목·일기 |
| `--font-sans` | `'Pretendard Variable', 'Noto Sans KR', ...` | UI·본문 |

- 전역 `body { zoom: 1.1 }` — 110% 스케일 (가독성 강화, a11y).

## 형태

| 토큰 | 값 |
|---|---|
| `--radius` | `16px` (카드) |
| `--radius-sm` | `12px` (인풋·작은 요소) |

## 그라데이션 (파생, 인라인 사용 중)
- 홈 씨앗 카드: `linear-gradient(135deg, var(--primary), #3E9C72)`
- 숲 카드 아이콘: `linear-gradient(135deg, #E7F1EC, #D2E8DC)`
- 커뮤니티 "오늘의 성찰" 질문 카드: `linear-gradient(135deg, #9A6BB8, #B58FCB)` (보라 — 답변카드 시각 구분; 목업 홈 카드는 초록. 통일 여부 미정)

## 규칙
1. 색은 **토큰으로만**. 새 인라인 hex 금지 (불가피하면 위 표 값과 일치).
2. CSS/HTML/JS 변경 후 **`sw.js` `CACHE_VERSION` 갱신** → 사용자 즉시 반영.
3. 추모(memorial) UI는 **보류·숨김** — 창업자 결정 전까지 복원 금지.

## 알려진 미정 항목
- 커뮤니티 질문 카드 보라 vs 초록 통일 여부.
- (다른 세션의 `ITDA-DESIGN-HANDOFF.md`에 추가 결정 로그·산출물 위치가 있음 — 내용 확보 시 이 문서에 병합 예정.)
