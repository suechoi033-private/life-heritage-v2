-- (b) 한 코드, 두 얼굴 — 진입 path 기록 (06-15 L3 / two-faces-one-code-2026-06-15.md §6).
-- 사용자가 처음 누른 진입 카드(유언/웰니스 = 'will' / 케어링 = 'care')를 profile에 기록.
-- nullable: 둘 다 답한 사용자는 그대로 null 또는 첫 카드 기록만 유지.
-- 마케팅 채널 분석(M9) + 회원 분기 우선 노출(L3 후속 PE)에 사용.

alter table public.profiles
  add column if not exists entry_path text
  check (entry_path is null or entry_path in ('will','care'));

comment on column public.profiles.entry_path is
  '진입 카드로 시작한 첫 path. will=유언/웰니스, care=케어링. (b) 한 코드 두 얼굴 결정의 회원 분기 input.';
