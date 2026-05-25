-- =============================================================
-- 케어링 처방전 분석 (MVP 1차)
--   - 처방전 사진 업로드 → OCR → 식약처(e약은요) 약물정보 카드
--   - 민감정보(건강정보) 처리: private 버킷 + RLS + 정보주체 동의 + 30일 자동삭제
--
-- ⚠️ 진단이 아닌 "정보 제공". 모든 표시에 디스클레이머 필수.
-- 메인 마이그레이션(20260517_redesign_mvp.sql) 이후 실행.
-- =============================================================

-- -------------------------------------------------------------
-- 0. 정보주체(부모) 건강정보 처리 동의 플래그
--    care_subjects 테이블에 컬럼 추가 (없으면)
-- -------------------------------------------------------------
alter table public.care_subjects
  add column if not exists health_data_consent_at timestamptz,
  add column if not exists health_data_consent_by uuid references public.profiles(id);

-- -------------------------------------------------------------
-- 1. 처방전 1건 (이미지 + OCR 원문 + 처리 상태)
-- -------------------------------------------------------------
create table if not exists public.care_prescriptions (
  id            uuid primary key default gen_random_uuid(),
  subject_id    uuid not null references public.care_subjects(id) on delete cascade,
  uploader_id   uuid not null references public.profiles(id),
  storage_path  text not null,
  ocr_text      text,
  status        text not null default 'pending'
                  check (status in ('pending','processing','done','failed')),
  error_msg     text,
  rx_date       date,
  created_at    timestamptz default now()
);

create index if not exists care_rx_subject_idx
  on public.care_prescriptions (subject_id, created_at desc);

-- -------------------------------------------------------------
-- 2. 처방전에서 추출된 약물 N건 (식약처 조회 결과 캐시)
-- -------------------------------------------------------------
create table if not exists public.care_prescription_drugs (
  id              uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references public.care_prescriptions(id) on delete cascade,
  raw_name        text not null,
  matched_name    text,
  item_seq        text,
  efficacy        text,
  usage_text      text,
  caution         text,
  interactions    text,
  confidence      numeric,
  sort_order      int default 0,
  created_at      timestamptz default now()
);

create index if not exists care_rx_drugs_rx_idx
  on public.care_prescription_drugs (prescription_id, sort_order);

-- -------------------------------------------------------------
-- 3. RLS
--    접근 권한 = 해당 subject의 owner(care_subjects.user_id)
--               또는 care_members 협력자
--    쓰기(분석 결과 저장)는 Edge Function(service_role)만 — 정책 미부여
-- -------------------------------------------------------------
alter table public.care_prescriptions       enable row level security;
alter table public.care_prescription_drugs  enable row level security;

-- 공통 접근 판별: 주어진 subject_id에 현재 사용자가 접근 가능한가
create or replace function public.can_access_care_subject(p_subject_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.care_subjects s
    where s.id = p_subject_id and s.user_id = auth.uid()
  ) or exists (
    select 1 from public.care_members cm
    where cm.subject_id = p_subject_id and cm.user_id = auth.uid()
  );
$$;

-- 처방전: 접근 가능한 사람은 조회, 본인이 업로더로 등록(INSERT)
create policy "care_rx_member_select" on public.care_prescriptions
  for select using (public.can_access_care_subject(subject_id));

create policy "care_rx_member_insert" on public.care_prescriptions
  for insert with check (
    uploader_id = auth.uid()
    and public.can_access_care_subject(subject_id)
  );

-- 업로더 본인이 자신이 올린 처방전 삭제 가능 (이미지·약물 cascade)
create policy "care_rx_uploader_delete" on public.care_prescriptions
  for delete using (uploader_id = auth.uid());

-- 약물 카드: 부모 처방전을 볼 수 있으면 조회 가능
create policy "care_rx_drugs_member_select" on public.care_prescription_drugs
  for select using (
    exists (
      select 1 from public.care_prescriptions p
      where p.id = care_prescription_drugs.prescription_id
        and public.can_access_care_subject(p.subject_id)
    )
  );

-- -------------------------------------------------------------
-- 4. Storage 버킷 (private — 민감 건강정보)
-- -------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('care-rx', 'care-rx', false)
on conflict (id) do nothing;

-- 경로 규칙: {uploader_id}/rx/{...}  (media-upload.js makePath와 동일)
create policy "care_rx_storage_owner_select"
  on storage.objects for select
  using (
    bucket_id = 'care-rx'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "care_rx_storage_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'care-rx'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "care_rx_storage_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'care-rx'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- -------------------------------------------------------------
-- 5. 30일 자동삭제 (민감정보 최소보관 원칙)
--    원본 이미지 + 처방전 레코드를 30일 후 파기.
--    pg_cron 사용 가능 시 아래 스케줄을 등록한다(수동 1회).
--      select cron.schedule('purge-care-rx', '0 3 * * *',
--        $$ select public.purge_old_prescriptions() $$);
--    pg_cron 미사용 시 Edge Function/외부 스케줄러에서 RPC로 호출.
-- -------------------------------------------------------------
create or replace function public.purge_old_prescriptions(p_days int default 30)
returns int
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  v_count int;
  v_paths text[];
begin
  select array_agg(storage_path) into v_paths
  from public.care_prescriptions
  where created_at < now() - make_interval(days => p_days);

  -- 스토리지 오브젝트 삭제 (경로 매칭)
  if v_paths is not null then
    delete from storage.objects
    where bucket_id = 'care-rx' and name = any(v_paths);
  end if;

  delete from public.care_prescriptions
  where created_at < now() - make_interval(days => p_days);
  get diagnostics v_count = row_count;

  return v_count;
end;
$$;
