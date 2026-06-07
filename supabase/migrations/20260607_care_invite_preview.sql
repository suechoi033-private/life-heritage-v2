-- 초대 링크 미리보기: 로그인 전(anon)에도 "누가 누구를 어떤 역할로 초대했는지" 보여준다.
-- 80대 가족도 링크를 열자마자 "딸이 어머니 돌봄에 초대했구나"를 알아 안심하고 가입하도록.
-- 보안: 유효(미만료) 코드 보유자에게 표시 이름만 노출(수락 시 어차피 보이는 정보). SECURITY DEFINER.
create or replace function public.preview_care_invite(p_code text)
returns table(subject_name text, inviter_name text, role text)
language sql
security definer
set search_path to 'public'
stable
as $$
  select s.name,
         coalesce(nullif(trim(pr.name), ''), '가족'),
         ci.role
  from care_invites ci
  join care_subjects s on s.id = ci.subject_id
  left join profiles pr on pr.id = ci.created_by
  where ci.invite_code = upper(p_code)
    and ci.expires_at > now()
  limit 1;
$$;

grant execute on function public.preview_care_invite(text) to anon, authenticated;
