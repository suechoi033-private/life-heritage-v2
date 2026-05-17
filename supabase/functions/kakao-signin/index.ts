// Supabase Edge Function: 카카오 OAuth 브리지
// 클라이언트가 카카오 SDK로 받은 access_token을 Supabase 세션으로 변환
//
// 배포: supabase functions deploy kakao-signin
// 환경변수 필요:
//   SUPABASE_URL                — 자동 주입
//   SUPABASE_SERVICE_ROLE_KEY   — 자동 주입
//   KAKAO_CLIENT_ID             — 카카오 REST API 키 (선택, 검증 강화 시)
//
// 요청: POST { access_token: string }
// 응답: { access_token: string, refresh_token: string, user_id: string }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const KAKAO_USERINFO = 'https://kapi.kakao.com/v2/user/me';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() });
  }
  if (req.method !== 'POST') {
    return json({ error: 'method not allowed' }, 405);
  }

  try {
    const { access_token } = await req.json();
    if (!access_token) return json({ error: 'access_token required' }, 400);

    // 1) 카카오 사용자정보 조회
    const userResp = await fetch(KAKAO_USERINFO, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!userResp.ok) return json({ error: 'kakao verify failed' }, 401);
    const kakaoUser = await userResp.json();

    const kakaoId = String(kakaoUser.id);
    const kakaoEmail = kakaoUser.kakao_account?.email ?? `kakao_${kakaoId}@itda.local`;
    const kakaoName  = kakaoUser.properties?.nickname
                    || kakaoUser.kakao_account?.profile?.nickname
                    || '잇다 사용자';
    const kakaoAvatar = kakaoUser.properties?.profile_image
                    || kakaoUser.kakao_account?.profile?.profile_image_url
                    || null;

    // 2) Supabase Admin 클라이언트
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 3) 기존 사용자 조회 (profiles.provider_user_id로)
    const { data: existing } = await admin
      .from('profiles')
      .select('id')
      .eq('auth_provider', 'kakao')
      .eq('provider_user_id', kakaoId)
      .maybeSingle();

    let userId: string;

    if (existing) {
      userId = existing.id;
    } else {
      // 신규 사용자 생성 (이메일 충돌 시 카카오 전용 이메일 사용)
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: kakaoEmail,
        email_confirm: true,
        user_metadata: { name: kakaoName, provider: 'kakao' },
      });
      if (createErr) {
        // 이미 같은 이메일이 있으면 대안 이메일로 재시도
        const alt = `kakao_${kakaoId}@itda.local`;
        const { data: created2, error: e2 } = await admin.auth.admin.createUser({
          email: alt,
          email_confirm: true,
          user_metadata: { name: kakaoName, provider: 'kakao' },
        });
        if (e2) return json({ error: 'user create failed', detail: e2.message }, 500);
        userId = created2.user!.id;
      } else {
        userId = created.user!.id;
      }

      // profiles에 카카오 정보 기록
      await admin.from('profiles').upsert({
        id: userId,
        name: kakaoName,
        auth_provider: 'kakao',
        provider_user_id: kakaoId,
        avatar_url: kakaoAvatar,
        social_profile: { kakao: kakaoUser },
      });
    }

    // 4) Magic link 토큰 발급 → access/refresh 토큰
    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: kakaoEmail,
    });
    if (linkErr || !link) return json({ error: 'session create failed' }, 500);

    // generateLink는 이메일로 보내는 게 기본이라, 토큰만 추출하기 위해 별도 방식 사용:
    // 대신 admin.auth.admin.updateUserById로 갱신 후 임시 비밀번호로 signIn
    // 가장 신뢰성 있는 방식: signInWithIdToken 미지원이므로,
    // exchange code: admin.auth.admin.generateLink → action_link의 토큰 파싱
    const url = new URL(link.properties.action_link);
    const hashParams = new URLSearchParams(url.hash.slice(1) || url.search.slice(1));
    const access  = hashParams.get('access_token');
    const refresh = hashParams.get('refresh_token');

    if (!access || !refresh) {
      return json({
        error: 'token extraction failed',
        hint: 'Supabase 프로젝트에서 Magic Link 활성화 필요',
      }, 500);
    }

    return json({ access_token: access, refresh_token: refresh, user_id: userId });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}
