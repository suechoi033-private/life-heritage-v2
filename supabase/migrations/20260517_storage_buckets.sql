-- =============================================================
-- 신규 Storage 버킷 + 정책
-- (메인 마이그레이션 이후 실행)
-- =============================================================

-- diary-media: 일기 첨부 (private, 작성자만)
insert into storage.buckets (id, name, public)
values ('diary-media', 'diary-media', false)
on conflict (id) do nothing;

create policy "diary_media_owner_select"
  on storage.objects for select
  using (
    bucket_id = 'diary-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "diary_media_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'diary-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "diary_media_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'diary-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- content-media: 콘텐츠 첨부 (public read, 작성자만 쓰기)
insert into storage.buckets (id, name, public)
values ('content-media', 'content-media', true)
on conflict (id) do nothing;

create policy "content_media_public_select"
  on storage.objects for select
  using (bucket_id = 'content-media');

create policy "content_media_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'content-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "content_media_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'content-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- post-media: 커뮤니티 게시글 첨부 (public read, 작성자만 쓰기)
insert into storage.buckets (id, name, public)
values ('post-media', 'post-media', true)
on conflict (id) do nothing;

create policy "post_media_public_select"
  on storage.objects for select
  using (bucket_id = 'post-media');

create policy "post_media_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'post-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "post_media_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'post-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
