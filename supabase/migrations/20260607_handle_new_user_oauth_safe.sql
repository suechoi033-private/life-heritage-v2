-- handle_new_user: OAuth(카카오/구글) 가입까지 안전하게.
-- - 이름: name → full_name → user_name → nickname → 이메일앞부분 → '잇다 사용자' 순 폴백
-- - 이메일: 없으면(카카오 비즈앱 전 단계 등) 고유 placeholder로 UNIQUE/NOT NULL 충돌 방지
-- - auth_provider: app_metadata.provider로 가입수단 자동 기록(리포트용)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $function$
begin
  insert into public.profiles (id, email, name, auth_provider)
  values (
    new.id,
    coalesce(nullif(new.email, ''), new.raw_user_meta_data->>'email', 'user_' || new.id || '@itda.local'),
    coalesce(
      nullif(new.raw_user_meta_data->>'name', ''),
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(new.raw_user_meta_data->>'user_name', ''),
      nullif(new.raw_user_meta_data->>'nickname', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      '잇다 사용자'
    ),
    coalesce(new.raw_app_meta_data->>'provider', 'email')
  )
  on conflict (id) do nothing;
  return new;
end;
$function$;
