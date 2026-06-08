-- 가족에게 건네는 봉투 — 수신자 지정(최소형)
-- 목적: "이 기록을 누구에게 건네고 싶은가"를 정해두게 한다. 작성의 '이유'이자 리텐션 핵심.
-- 범위 한정(중요): 지금은 '지정'만 한다. 실제 전달·열람권 이양·사후 자동공개(dead-man switch)는
--   법률·보안 감수 후 영역이므로 포함하지 않는다. 민감 비밀값도 저장하지 않는다(이름·관계·메모만).
-- 적용: 2026-06-08 apply_migration 으로 원격 반영됨(창업자 "a,b 모두 해줘" 승인).
create table if not exists public.vault_recipients (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  relation    text,           -- 배우자/자녀/형제/부모/그 외
  contact     text,           -- 선택: 연락처(표시·기록만, 자동 발송 없음)
  note        text,           -- 선택: "왜 이 사람에게 건네고 싶은지" 한마디
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists vault_recipients_user_idx
  on public.vault_recipients (user_id, created_at);

alter table public.vault_recipients enable row level security;

drop policy if exists vault_recipients_select_own on public.vault_recipients;
create policy vault_recipients_select_own on public.vault_recipients
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists vault_recipients_insert_own on public.vault_recipients;
create policy vault_recipients_insert_own on public.vault_recipients
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists vault_recipients_update_own on public.vault_recipients;
create policy vault_recipients_update_own on public.vault_recipients
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists vault_recipients_delete_own on public.vault_recipients;
create policy vault_recipients_delete_own on public.vault_recipients
  for delete to authenticated using (auth.uid() = user_id);
