-- 오늘의 질문 추가 (창업자 지정, 2026-07-29): "이 세상에서 가장 소중한 것은 무엇인가요?"
-- 라이브에는 MCP로 선적용됨 — 이 파일은 기록 + 멱등 재적용용.
insert into mutda_daily_questions (text, display_order, is_active)
select '이 세상에서 가장 소중한 것은 무엇인가요?', coalesce(max(display_order), 0) + 1, true
from mutda_daily_questions
where not exists (
  select 1 from mutda_daily_questions where text like '%가장 소중한 것은 무엇%'
);
