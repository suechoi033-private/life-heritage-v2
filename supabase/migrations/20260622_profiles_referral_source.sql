-- =============================================================
-- profiles.referral_source — 유입 경로 트래킹 (베타 인바이트 자동화)
-- 단일 원천: docs/worklog.md 2026-06-22 항목
--
-- 목적: 사용자가 어느 채널로 진입했는지 알기 위함(Form vs IG vs 그 외).
-- 초기 값 예: 'beta_form' | 'beta_ig' | 'organic' | null.
-- CHECK 없이 유연하게 (앞으로 채널 추가돼도 코드 배포만으로 사용 가능).
--
-- 클라이언트 흐름:
--   1) 진입 URL의 ?ref= 파싱 → localStorage('itda:referral_source') 저장 (first-touch 보존)
--   2) welcome.html에서 첫 로그인 시 profiles.referral_source 로 이관 (한 번만)
--
-- 데이터 안전:
--   - nullable, CHECK 없음 → 기존 행 영향 0
--   - RLS는 기존 profiles 정책 그대로 (본인 update 허용)
--   - 멱등: if not exists 로 재실행 안전
-- =============================================================

alter table public.profiles
  add column if not exists referral_source text;

comment on column public.profiles.referral_source is
  '유입 경로 태그(예: beta_form, beta_ig, organic). URL ?ref= 파라미터를 첫 진입 시 localStorage로 캡처 → welcome.html에서 이관.';

-- 인덱스: 채널별 코호트 리텐션·전환 분석용 (nullable 다수라 부분 인덱스로 비용 절감)
create index if not exists profiles_referral_source_idx
  on public.profiles (referral_source)
  where referral_source is not null;
