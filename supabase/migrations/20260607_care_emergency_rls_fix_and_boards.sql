-- 1. care_emergency_contacts RLS 수정
--    기존 정책은 care_members만 허용 → 직접 생성한 케어링 owner도 허용하도록 확장

drop policy if exists "care_emergency_via_member" on public.care_emergency_contacts;

create policy "care_emergency_access" on public.care_emergency_contacts
  for all using (
    -- care_members로 초대받은 협력자
    exists (
      select 1 from public.care_members cm
      where cm.subject_id = care_emergency_contacts.subject_id
        and cm.user_id = auth.uid()
    )
    or
    -- care_subjects를 직접 생성한 owner
    exists (
      select 1 from public.care_subjects cs
      where cs.id = care_emergency_contacts.subject_id
        and cs.user_id = auth.uid()
    )
  );

-- 2. boards 신규 항목 추가
--    미리 준비(preparation) · 기타(other)

insert into public.boards (slug, name, description, sort_order) values
  ('preparation', '미리 준비', '삶의 마무리를 미리 차분하게 준비하는 이야기', 35),
  ('other',       '기타',      '어느 게시판에도 맞지 않는 이야기',             95)
on conflict (slug) do nothing;
