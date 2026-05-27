-- 자기 성찰 질문 v2 — '가벼운 입구' 신규 문항 추가
-- 근거: docs/content/questions-100-v2.md (신규 표시 문항 28·43·44 + N1~N12)
--
-- 설계 원칙 (one-way door 안전):
--   * 비파괴: 기존 daily_questions 행과 daily_answers(답변 FK) 를 건드리지 않는다.
--   * 멱등: 동일 question_text가 이미 있으면 건너뛴다(재실행해도 중복 없음).
--   * 트랜잭션: 실패 시 전체 롤백.
--   * display_order는 현재 최대값 뒤에 순서대로 부여(기존 순서·오늘질문 RPC 불변).
-- 카테고리는 앱 enum(self/relationships/work/regret/gratitude/legacy/endings) 사용.
--
-- 참고: v2의 전체 재정렬·중복 정리·1부/2부 게이팅은 라이브 테이블 확인 후 별도 진행.
--        (이 마이그레이션은 '명백히 새로운' 가벼운 문항만 추가한다.)

begin;

with new_q(category, question_text, ord) as (
  values
    ('relationships', '한동안 연락 못 한 사람에게 오늘 안부를 보낸다면, 누구에게?', 1),
    ('work',          '첫 월급(또는 첫 일)으로 무엇을 했는지 기억하나요?', 2),
    ('work',          '오늘 일하다 ''이래서 이 일을 한다'' 싶었던 순간이 있었나요?', 3),
    ('self',          '요즘 내 플레이리스트 맨 위에 있는 노래는? 왜 그 곡인가요?', 4),
    ('self',          '오늘 내 기분을 날씨로 표현한다면?', 5),
    ('self',          '혼자 있는 시간에 나는 주로 무엇을 하나요? 그게 나에 대해 말해주는 건?', 6),
    ('gratitude',     '오늘 먹은 것 중 가장 만족스러웠던 한 끼는?', 7),
    ('gratitude',     '계절이 바뀔 때 내가 꼭 챙기는 나만의 의식이 있나요?', 8),
    ('self',          '내 몸에서 가장 마음에 드는 부분 하나는?', 9),
    ('self',          '요즘 내 몸이 나에게 보내는 신호가 있나요?', 10),
    ('self',          '최근에 ''잘 썼다'' 싶은 돈은 어디에 쓴 것이었나요?', 11),
    ('self',          '돈에 대한 나의 첫 기억은 무엇인가요?', 12),
    ('self',          '내 휴대폰 사진첩에서 가장 오래된 사진은 무엇인가요?', 13),
    ('self',          'SNS에는 절대 안 올리지만 나에게는 소중한 순간이 있나요?', 14),
    ('self',          '10년째 변하지 않는 내 취향이 있다면?', 15)
),
base as (
  select coalesce(max(display_order), 0) as max_order from public.daily_questions
)
insert into public.daily_questions (category, question_text, display_order)
select n.category, n.question_text, base.max_order + n.ord
from new_q n, base
where not exists (
  select 1 from public.daily_questions d where d.question_text = n.question_text
);

commit;
