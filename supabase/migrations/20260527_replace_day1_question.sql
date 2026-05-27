-- Day 1 첫 질문 교체 — 약한 오프너 제거
-- 근거: 첫 질문은 첫인상. "지금의 나를 한 단어로…"가 약해, 더 따뜻하고
--       잇다다운(연결·감사) 오프너로 교체. (창업자 피드백 2026-05-27)
-- 안전(one-way door):
--   * 비파괴 — 행 삭제 없음. display_order 유지 → 같은 행이 그대로 Day 1.
--   * 멱등 — 교체본이 이미 있으면 변화 없음(중복 방지 가드).
--   * 트랜잭션 — 실패 시 롤백.
-- 적용: Supabase SQL Editor에서 실행. (프런트 anon 키로는 daily_questions 쓰기 불가)
--       또는 Table Editor에서 해당 행 question_text 1칸만 직접 수정해도 동일.

begin;

update public.daily_questions
set question_text = '오늘, 고맙다고 말하고 싶은 사람이 한 명 떠오르나요?',
    category = 'gratitude'
where question_text = '지금의 나를 한 단어로 고른다면 무엇인가요?'
  and not exists (
    select 1 from public.daily_questions d2
    where d2.question_text = '오늘, 고맙다고 말하고 싶은 사람이 한 명 떠오르나요?'
  );

commit;

-- 다른 오프너를 원하면 위 question_text만 바꿔서 실행하세요. 후보:
--   · '요즘 당신을 가장 자주 웃게 하는 건 무엇인가요?'            (가벼움·긍정)
--   · '오늘 하루, 마음이 가장 편안했던 순간은 언제였나요?'        (성찰·부담 0)
--   · '오늘 내 기분을 날씨로 표현한다면?'  ← 이미 목록에 있어 중복 주의
