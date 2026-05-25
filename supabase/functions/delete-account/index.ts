// =============================================================
// Supabase Edge Function: delete-account (회원탈퇴 / 계정 삭제)
//
// ⚠️ 이 함수는 아직 배포되지 않았습니다. **창업자가 직접 배포해야 합니다.**
//    (one-way door — 실데이터 삭제. README.md의 배포 방법 참고)
//
// 동작:
//   1) 호출자의 JWT를 검증해 본인 user id(uid) 추출 (anon 클라이언트 + getUser)
//   2) service-role 클라이언트로 해당 uid가 소유한 모든 데이터를 삭제
//   3) auth.users 사용자 삭제 (admin.deleteUser)
//
// 삭제 전략 (중요):
//   스키마상 거의 모든 user FK가 public.profiles(id)를 ON DELETE CASCADE로
//   참조하고, profiles.id 는 auth.users.id 와 동일하다. profiles.id 가
//   auth.users(id) on delete cascade 로 묶여 있으면 admin.deleteUser(uid)
//   한 번으로 전부 정리된다. 다만 이 repo에는 profiles 테이블의 원본 정의가
//   없어 cascade 여부를 확정할 수 없으므로, **cascade에 의존하지 않고**
//   자식 테이블을 의존성 역순으로 명시 삭제한 뒤 profiles → auth user 순으로
//   삭제한다. (cascade가 이미 걸려 있어도 멱등 — 두 번 지워도 무해)
//
// 보존 정책:
//   - 사용자가 작성한 '공개 콘텐츠(contents)'와 '커뮤니티 게시글/댓글'은
//     기본적으로 함께 삭제한다(본인 데이터 전량 삭제 = PIPA 파기 원칙).
//   - 만약 커뮤니티 정합성을 위해 게시글을 익명화 보존하려면 아래
//     ANONYMIZE_INSTEAD_OF_DELETE 를 true 로 바꾸고 정책을 조정한다.
//     (기본 false = 전량 삭제)
// =============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANONYMIZE_INSTEAD_OF_DELETE = false;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() });
  }
  if (req.method !== 'POST') {
    return json({ error: 'method not allowed' }, 405);
  }

  try {
    // 1) 호출자 인증 검증 — Authorization 헤더의 JWT로 본인 확인
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) return json({ error: 'unauthorized' }, 401);

    const url = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // anon 클라이언트로 토큰 검증 (본인만 자기 계정을 지울 수 있게)
    const authClient = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: 'unauthorized' }, 401);

    const uid = userData.user.id;

    // 2) service-role 클라이언트 (RLS 우회 — 전체 데이터 삭제용)
    const admin = createClient(
      url,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 3) 자식 → 부모 순으로 사용자 소유 데이터 삭제.
    //    cascade가 이미 걸려 있어도 멱등이라 안전. 일부 테이블이 없거나
    //    컬럼이 달라 실패해도 전체를 막지 않도록 개별 try.
    const steps: Array<{ table: string; column: string }> = [
      // 푸시/북마크/리액션/리포트 등 말단
      { table: 'push_subscriptions', column: 'user_id' },
      { table: 'content_bookmarks',  column: 'user_id' },
      { table: 'reactions',          column: 'user_id' },
      { table: 'reports',            column: 'reporter_id' },
      // 커뮤니티 — 댓글 먼저, 그 다음 게시글 (게시글 삭제 시 자식 cascade)
      { table: 'comments',           column: 'user_id' },
      { table: 'community_posts',    column: 'user_id' },
      // 일기 (자식 diary_media/tags/links 는 cascade), 답변, 목표
      { table: 'daily_answers',      column: 'user_id' },
      { table: 'diary_entries',      column: 'user_id' },
      { table: 'goals',              column: 'user_id' },
      // 태그, 친구/초대
      { table: 'tags',               column: 'user_id' },
      { table: 'friend_invites',     column: 'inviter_id' },
      { table: 'friendships',        column: 'user_id' },
      { table: 'friendships',        column: 'friend_id' },
    ];

    const errors: string[] = [];
    for (const s of steps) {
      const { error } = await admin.from(s.table).delete().eq(s.column, uid);
      if (error && !/does not exist|relation|column/i.test(error.message || '')) {
        errors.push(`${s.table}.${s.column}: ${error.message}`);
      }
    }

    // 콘텐츠(contents): creator_id 는 on delete set null. 전량 삭제 원칙이면 직접 삭제.
    if (ANONYMIZE_INSTEAD_OF_DELETE) {
      await admin.from('contents').update({ creator_id: null }).eq('creator_id', uid);
    } else {
      const { error } = await admin.from('contents').delete().eq('creator_id', uid);
      if (error && !/does not exist|relation|column/i.test(error.message || '')) {
        errors.push(`contents.creator_id: ${error.message}`);
      }
    }

    // 돌봄(care_*): 스키마상 care 테이블의 소유/멤버 컬럼이 이 repo에 없어
    //   구조를 확정할 수 없다. care_members(있다면) 본인 멤버십 제거를 시도하되
    //   실패해도 전체를 막지 않는다. (creator/owner 컬럼명이 다를 수 있음)
    for (const col of ['user_id', 'member_id', 'profile_id']) {
      await admin.from('care_members').delete().eq(col, uid).then(
        () => {}, () => {}
      );
    }

    // profiles 직접 삭제 (auth user 삭제로 cascade될 수도 있으나 멱등)
    {
      const { error } = await admin.from('profiles').delete().eq('id', uid);
      if (error && !/does not exist|relation/i.test(error.message || '')) {
        errors.push(`profiles.id: ${error.message}`);
      }
    }

    // 4) auth 사용자 삭제 (최종)
    const { error: delErr } = await admin.auth.admin.deleteUser(uid);
    if (delErr) {
      return json({ error: `auth delete failed: ${delErr.message}`, partial: errors }, 500);
    }

    return json({ ok: true, user_id: uid, warnings: errors });
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
});

// ── helpers ──────────────────────────────────────────────
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}
