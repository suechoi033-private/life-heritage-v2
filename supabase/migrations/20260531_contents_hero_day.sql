-- =============================================================
-- contents.hero_day — '오늘 잇다가 고른 글' 큐레이션 7일 순서
--
-- 흐름: forest.html 상단 hero에서 ((today - 2026-06-03) % 7) + 1 = N
--       → hero_day = N인 콘텐츠 1편 노출. 7일 회전.
--
-- 베타 첫 7일 순서 (사장님 위임 — 시작 강도와 다양성 기준):
--   day 1: 살아 있을 확률                       (시작)
--   day 2: 오늘의 한 줄을 위해 산 하루          (일일 사용 동기 — 잇다 한 줄)
--   day 3: 어제의 나는 오늘의 내가 아니다       (잇기의 개념)
--   day 4: 사라진 것의 모양                     (상실 톤 진입)
--   day 5: 내 장례식에 틀고 싶은 음악           (음악 CTA 연결)
--   day 6: 누군가의 마지막 문장                 (일요일의 진지함)
--   day 7: 마지막 자리에서 가장 흔한 후회       (첫 주 클라이맥스)
--
-- 멱등: hero_day 컬럼 add if not exists + update by title.
--       베타 이후 운영 도구로 갱신 가능.
-- 적용: F2 (contents seed)를 먼저 실행한 뒤 이 SQL 실행.
-- =============================================================

begin;

alter table public.contents
  add column if not exists hero_day int;

create index if not exists contents_hero_day_idx
  on public.contents (hero_day) where hero_day is not null;

-- 첫 7일치
update public.contents set hero_day = 1 where title = '살아 있을 확률';
update public.contents set hero_day = 2 where title = '오늘의 한 줄을 위해 산 하루';
update public.contents set hero_day = 3 where title = '어제의 나는 오늘의 내가 아니다';
update public.contents set hero_day = 4 where title = '사라진 것의 모양';
update public.contents set hero_day = 5 where title = '내 장례식에 틀고 싶은 음악';
update public.contents set hero_day = 6 where title = '누군가의 마지막 문장';
update public.contents set hero_day = 7 where title = '마지막 자리에서 가장 흔한 후회';

commit;
