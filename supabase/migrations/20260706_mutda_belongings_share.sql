-- 묻다 — 유품 정리 이야기를 익명으로 커뮤니티(함께)에 나누기
-- 편지 나눔(shared_post_id)과 동일한 구조.

alter table public.mutda_belongings
  add column if not exists shared_post_id uuid references public.mutda_posts(id) on delete set null;
