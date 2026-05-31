-- =============================================================
-- 케어링 관리 항목(care_conditions) — 병명/약을 "기간"을 갖고 지속 관리
--   기록 1건의 태그를 넘어, 대상에게 속한 "관리 중 병명·약"을 기간과 함께 둔다.
--   start_date~end_date(또는 끝없음=만성). "지금 관리 중" 목록·기록 자동 노출의 기반.
--   처방 투약일수로 기간 자동 추천 가능.
--   ⚠️ 진단이 아닌 약물 적응증 기반 "추정". 디스클레이머 유지.
-- 20260527_care_log_conditions.sql 이후 실행.
-- =============================================================

create table if not exists public.care_conditions (
  id             uuid primary key default gen_random_uuid(),
  subject_id     uuid not null references public.care_subjects(id) on delete cascade,
  label          text not null,            -- 표시명 (예: 고혈압, 유방암)
  cond_key       text not null,            -- 그룹 기준 (카테고리 또는 효능 요약)
  efficacy       text,                     -- 효능 원문 요약
  start_date     date not null default current_date,
  end_date       date,                     -- null = 끝없음(만성, 계속)
  source_prescription_id uuid references public.care_prescriptions(id) on delete set null,
  created_by     uuid references public.profiles(id),
  created_at     timestamptz default now()
);

create index if not exists care_conditions_subject_idx
  on public.care_conditions (subject_id, end_date);

alter table public.care_conditions enable row level security;

-- 접근: 해당 subject의 owner 또는 협력자(can_access_care_subject 재사용)
create policy "care_conditions_member_all" on public.care_conditions
  for all using (public.can_access_care_subject(subject_id))
  with check (public.can_access_care_subject(subject_id));
