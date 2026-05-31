-- =============================================================
-- Day 2 = "장례식 흐를 한 곡" 질문 고정 + answer_kind 컬럼 추가
--
-- 배경: forest 상단의 장례식 플레이리스트 CTA는 첫 인상 부담.
--       가입 후 2일째 질문 자리로 옮긴다. (사장님 결정 2026-05-31)
--
-- 변경:
--   1) daily_questions.answer_kind text default 'text' 컬럼 추가
--   2) display_order=2 자리에 song 질문 신규 삽입
--      - 기존 display_order >= 2 행을 모두 +1 시프트
--      - song 질문은 answer_kind='song'으로 마킹
--   3) 시드 답변 4개 (곡 이름 + 출처) seed_answers에 같이 묶음
--
-- 멱등: song 질문 행이 이미 있으면 시프트/삽입 둘 다 skip.
-- 적용: Supabase SQL Editor에서 실행.
-- =============================================================

begin;

-- (1) answer_kind 컬럼 — UI 분기 신호. 'text'(기본) / 'song'(my-song.html 진입).
alter table public.daily_questions
  add column if not exists answer_kind text not null default 'text';

-- (2) song 질문이 아직 없다면: display_order 시프트 + 삽입
--     UNIQUE(display_order) 제약 때문에 한 칸씩 올리면 충돌 →
--     음수로 한 번 밀어두고 다시 양수+1로 옮긴다.
do $do$
declare
  v_song_text constant text := '당신의 장례식에 흐를 한 곡이 있다면, 어떤 곡인가요?';
begin
  if not exists (
    select 1 from public.daily_questions where question_text = v_song_text
  ) then
    -- day 2 이상을 잠깐 음수로
    update public.daily_questions
       set display_order = -display_order
     where display_order >= 2;

    -- 다시 양수로 + 1
    update public.daily_questions
       set display_order = -display_order + 1
     where display_order < 0;

    -- day 2 자리에 song 질문 삽입
    insert into public.daily_questions
      (category, question_text, display_order, answer_kind, seed_answers)
    values (
      'legacy',
      v_song_text,
      2,
      'song',
      $j${"answers":[
        {"persona":"민지(35)","content":"Coldplay — Yellow. 남편이 좋아했던 곡."},
        {"persona":"정훈(42)","content":"이소라 — 바람이 분다. 처음 들었을 때부터 끝까지 갈 곡."},
        {"persona":"수영(38)","content":"김광석 — 일어나. 슬프게 보내고 싶지 않아서."},
        {"persona":"다영(36)","content":"검정치마 — Antifreeze. 둘이 같이 들었던 노래라서."}
      ]}$j$::jsonb
    );
  end if;
end
$do$;

commit;
