-- 묻다 — 감사/작별인사를 리텐션 루프로
-- ① 전하기: 카톡/문자로 실제 전한 날을 기록 (sent_at)
-- ② 나누기: 익명으로 커뮤니티에 공유한 글 연결 (shared_post_id)
-- ③ 집계: 랜딩에 "미리 전해진 마음 N통" — 내용 노출 없는 숫자만

alter table public.mutda_letters
  add column if not exists sent_at timestamptz,
  add column if not exists shared_post_id uuid references public.mutda_posts(id) on delete set null;

-- 전체 집계 (익명·내용 없음) — 랜딩/편지 화면의 "집단의 아름다움" 표시용
create or replace function public.mutda_letters_stats()
returns table (total bigint, sent bigint, senders bigint)
language sql security definer set search_path = public as $$
  select count(*)::bigint,
         count(sent_at)::bigint,
         count(distinct user_id)::bigint
    from public.mutda_letters;
$$;

grant execute on function public.mutda_letters_stats() to anon, authenticated;
