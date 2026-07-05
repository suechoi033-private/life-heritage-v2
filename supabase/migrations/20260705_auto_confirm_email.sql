-- 이메일 가입 시 인증 메일 없이 즉시 시작 (베타 운영 결정, 2026-07-05)
--
-- 배경: Supabase 기본 SMTP는 프로젝트 팀원 외 주소로 인증 메일을 사실상
-- 전달하지 못한다. 커스텀 SMTP를 붙이기 전까지는 이메일 인증이 곧
-- "아무도 가입 못 함"이 된다. 베타 기간 동안 가입 즉시 확인 처리한다.
--
-- 영향 범위: 같은 프로젝트를 쓰는 잇다·묻다 모두의 이메일 가입.
-- 롤백: drop trigger auto_confirm_email on auth.users;
-- 정식 SMTP(예: Resend) 연결 후에는 이 트리거를 제거하고
-- 대시보드의 이메일 인증을 다시 활성화할 것.

create or replace function public.auto_confirm_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.email_confirmed_at is null then
    new.email_confirmed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists auto_confirm_email on auth.users;
create trigger auto_confirm_email
  before insert on auth.users
  for each row execute function public.auto_confirm_new_user();
