-- ⚠️ 적용 보류: 창업자 승인 + 백업 확인 후에만 실행 (헌장 데이터 안전 — DB 함수 추가는 one-way door)
-- 가족 초대 링크 미리보기: 로그인 전(anon)에도 "누가 함께 보자고 했는지 + 한마디"를 보여준다.
-- 회의적·바쁜 형제/가족이 가입 전에 보낸 사람을 확인하고 안심하도록 (P6 "보기 먼저").
-- 보안: 유효(pending·미만료) 코드 보유자에게 표시 이름 + 개인 메시지만 노출(수락 시 어차피 보이는 정보). SECURITY DEFINER.
-- 케어링의 preview_care_invite(20260607)와 동일한 검증된 패턴.
create or replace function public.preview_friend_invite(p_code text)
returns table(inviter_name text, message text)
language sql
security definer
set search_path to 'public'
stable
as $$
  select coalesce(nullif(trim(pr.name), ''), '가족'),
         fi.message
  from friend_invites fi
  left join profiles pr on pr.id = fi.inviter_id
  where fi.invite_code = upper(p_code)
    and fi.status = 'pending'
    and fi.expires_at > now()
  limit 1;
$$;

grant execute on function public.preview_friend_invite(text) to anon, authenticated;
