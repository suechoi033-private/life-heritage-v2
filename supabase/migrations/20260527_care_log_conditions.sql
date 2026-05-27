-- =============================================================
-- 케어링 기록 ↔ 처방전 연결 + 추정 병명 태그
--   기록(care_logs)에 처방전에서 끌어온 "추정 병명" 태그를 붙인다.
--   병명별 기록 모아보기·유사 병명 인사이트의 기반.
--   ⚠️ 진단이 아닌 약물 적응증 기반 "추정". 디스클레이머 유지.
-- 20260524_care_prescriptions.sql 이후 실행.
-- =============================================================

alter table public.care_logs
  add column if not exists condition_tags jsonb,   -- [{ key, label, efficacy }]
  add column if not exists linked_prescription_id uuid
    references public.care_prescriptions(id) on delete set null;

-- 병명별 모아보기 조회용 (jsonb 태그 내 key 기준)
create index if not exists care_logs_condition_idx
  on public.care_logs using gin (condition_tags);
