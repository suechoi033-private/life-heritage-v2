// Supabase Edge Function: 푸시 알림 발송
//
// 사용 시나리오:
//   1. Database Webhook에서 호출:
//      - care_logs INSERT → 모든 협력자에게
//      - friend_invites status='accepted' → 초대자에게
//      - comments INSERT → 게시글 작성자에게
//   2. 또는 클라이언트에서 직접 호출 (제한적)
//
// 배포: supabase functions deploy push-notify
// 환경변수:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (자동)
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (수동, mailto:admin@example.com)
//
// 요청: POST { user_ids: string[], payload: { title, body, url?, tag? } }
// 응답: { sent: number, failed: number }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'https://esm.sh/web-push@3.6.7';

const VAPID_PUBLIC  = Deno.env.get('VAPID_PUBLIC_KEY')  || '';
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY') || '';
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT')     || 'mailto:noreply@itda.app';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders() });
  if (req.method !== 'POST')    return json({ error: 'method not allowed' }, 405);
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return json({ error: 'VAPID keys not configured' }, 500);
  }

  try {
    const body = await req.json();
    let { user_ids, payload } = body;

    // Database Webhook 형태인지 감지
    if (body.type && body.record && body.table) {
      const derived = await derivePushFromWebhook(body);
      if (!derived) return json({ skipped: true, reason: 'no audience' });
      user_ids = derived.user_ids;
      payload  = derived.payload;
    }

    if (!user_ids?.length || !payload?.title) {
      return json({ error: 'user_ids and payload.title required' }, 400);
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    const { data: subs } = await admin.from('push_subscriptions')
      .select('endpoint, p256dh_key, auth_key, user_id')
      .in('user_id', user_ids);

    let sent = 0, failed = 0;
    const expired: string[] = [];

    for (const s of (subs || [])) {
      const subscription = {
        endpoint: s.endpoint,
        keys: { p256dh: s.p256dh_key, auth: s.auth_key },
      };
      try {
        await webpush.sendNotification(subscription, JSON.stringify(payload));
        sent++;
      } catch (err: any) {
        failed++;
        if (err.statusCode === 410 || err.statusCode === 404) expired.push(s.endpoint);
      }
    }

    if (expired.length) {
      await admin.from('push_subscriptions').delete().in('endpoint', expired);
    }

    return json({ sent, failed, expired_removed: expired.length });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

// Database Webhook payload → push 매핑
async function derivePushFromWebhook(wh: any) {
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  );

  if (wh.table === 'care_logs' && wh.type === 'INSERT') {
    const r = wh.record;
    const isSOS = (r.body || '').startsWith('[SOS]');
    // 협력자 ID (작성자 제외)
    const { data: members } = await admin.from('care_members')
      .select('user_id').eq('subject_id', r.subject_id).neq('user_id', r.user_id);
    const user_ids = (members || []).map((m) => m.user_id);
    if (!user_ids.length) return null;

    const { data: subject } = await admin.from('care_subjects')
      .select('name').eq('id', r.subject_id).maybeSingle();

    return {
      user_ids,
      payload: {
        title: isSOS ? `🚨 ${subject?.name || '돌봄'} 응급 상황` : `${subject?.name || '돌봄'} 새 기록`,
        body: (r.body || '').slice(0, 100),
        url: `./care-dashboard.html?subject=${r.subject_id}`,
        tag: `care-${r.subject_id}`,
      },
    };
  }

  if (wh.table === 'comments' && wh.type === 'INSERT') {
    const r = wh.record;
    const { data: post } = await admin.from('community_posts')
      .select('user_id, title').eq('id', r.post_id).maybeSingle();
    if (!post || post.user_id === r.user_id) return null;
    return {
      user_ids: [post.user_id],
      payload: {
        title: '새 댓글이 달렸어요',
        body: `"${post.title}"\n${(r.body || '').slice(0, 80)}`,
        url: `./post-detail.html?id=${r.post_id}`,
        tag: `comment-${r.post_id}`,
      },
    };
  }

  if (wh.table === 'friend_invites' && wh.type === 'UPDATE' && wh.record.status === 'accepted') {
    const r = wh.record;
    if (!r.invitee_user_id) return null;
    const { data: invitee } = await admin.from('profiles')
      .select('name').eq('id', r.invitee_user_id).maybeSingle();
    return {
      user_ids: [r.inviter_id],
      payload: {
        title: '친구가 되었어요',
        body: `${invitee?.name || '잇다 사용자'}님이 친구 초대를 수락했습니다.`,
        url: './root.html',
        tag: `friend-${r.invitee_user_id}`,
      },
    };
  }

  return null;
}

function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
}
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}
