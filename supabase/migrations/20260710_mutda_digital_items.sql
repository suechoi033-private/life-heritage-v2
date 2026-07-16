-- =============================================================
-- 묻다 — 디지털·금융 정리 (2026-07-10, 사장님 지시)
--
-- 목적: "내가 사라지면 아무도 모르는 것들"을 한 곳에 —
--   · 금융(은행·보험·증권): 어카운트인포/내보험다보여로 생전 조회 → 위치·힌트 기록
--   · 디지털 계정: 플랫폼별 폐쇄/추모/이관/유지 의사 + 사전 설정 여부
--     (구글·애플·페북은 생전 설정 가능 / 인스타·네이버·카카오는 유족이 할 일)
--   · 구독·자동이체: 멈춰야 할 정기결제
--
-- 원칙: 비밀번호·인증정보는 저장하지 않는다(위치와 힌트만) — UI에서 고지.
-- 잇다 note/digital.html(디지털 자산 노트, localStorage)의 묻다 이관 후속 —
-- 서버 저장으로 승격. 멱등.
-- =============================================================

begin;

create table if not exists public.mutda_digital_items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  kind         text not null check (kind in ('finance','account','subscription')),
  platform_key text,            -- account 프리셋: google/apple/facebook/instagram/naver/kakao (custom은 null)
  label        text not null,   -- 은행/플랫폼/서비스 이름
  decision     text check (decision is null or decision in ('close','memorial','transfer','keep')),
  note         text,            -- 위치·힌트·남기는 말 (비밀번호 금지)
  preset_done  boolean not null default false,  -- 구글 휴면관리자 등 생전 설정 완료
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 프리셋 플랫폼은 사용자당 1행 (custom/finance/subscription은 자유)
create unique index if not exists mutda_digital_items_platform_uniq
  on public.mutda_digital_items (user_id, platform_key)
  where platform_key is not null;

create index if not exists mutda_digital_items_user_idx
  on public.mutda_digital_items (user_id, kind);

alter table public.mutda_digital_items enable row level security;

drop policy if exists mutda_digital_items_owner on public.mutda_digital_items;
create policy mutda_digital_items_owner on public.mutda_digital_items
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

commit;
