// 묻다 — 안부확인 알림 발송 (고독사 방지) · v2 앱푸시
//
// pg_cron(mutda-checkin-notify, 30분 주기)이 이 함수를 호출한다.
// pending 상태의 mutda_checkin_alerts 를 읽어:
//   1) 연결된 모든 보호자에게 인앱 알림(mutda_notifications) 생성
//   2) 지정순위(sort_order) 순서로 웹푸시 발송 — 1순위 전달 실패 시 다음 순위로 캐스케이드
//   3) 전달됐으면 notified 마킹. 연결된 보호자가 아직 없으면 pending 유지
//      (보호자가 초대 링크로 연결되는 즉시 다음 주기에 발송)
//
// VAPID 키쌍은 Vault(mutda_vapid_public/private)에 있고,
// service_role 전용 RPC mutda_get_vapid() 로 읽는다. 코드에 키를 두지 않는다.
//
// GET  → { vapidPublicKey }  (클라이언트 푸시 구독용)
// POST → 발송 실행 (pg_cron)

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.7";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

let vapid: { public_key: string; private_key: string } | null = null;
async function loadVapid() {
  if (vapid) return vapid;
  const { data, error } = await supabase.rpc("mutda_get_vapid");
  if (error) throw new Error("VAPID 조회 실패: " + error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.public_key || !row?.private_key) throw new Error("VAPID 키가 Vault에 없습니다");
  webpush.setVapidDetails("mailto:noreply@mutda.app", row.public_key, row.private_key);
  vapid = row;
  return vapid;
}

async function pushToUser(userId: string, payload: unknown): Promise<number> {
  const { data: subs } = await supabase.from("mutda_push_subscriptions")
    .select("endpoint, p256dh_key, auth_key").eq("user_id", userId);
  let sent = 0;
  const expired: string[] = [];
  for (const s of subs ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh_key, auth: s.auth_key } },
        JSON.stringify(payload),
      );
      sent++;
    } catch (err) {
      const code = (err as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) expired.push(s.endpoint);
      console.error("push failed", code);
    }
  }
  if (expired.length) {
    await supabase.from("mutda_push_subscriptions").delete().in("endpoint", expired);
  }
  return sent;
}

Deno.serve(async (req) => {
  // 클라이언트 구독용 공개키
  if (req.method === "GET") {
    try {
      const v = await loadVapid();
      return Response.json({ vapidPublicKey: v.public_key }, {
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    } catch (e) {
      return Response.json({ error: String(e) }, { status: 500 });
    }
  }

  const { data: alerts, error } = await supabase
    .from("mutda_checkin_alerts")
    .select("id, user_id, hours_inactive")
    .eq("status", "pending")
    .limit(50);

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  if (!alerts?.length) return Response.json({ ok: true, notified: 0 });

  try { await loadVapid(); } catch (e) {
    console.error(String(e));
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }

  let notifiedCount = 0;
  for (const alert of alerts) {
    const [{ data: profile }, { data: guardians }] = await Promise.all([
      supabase.from("mutda_profiles").select("name").eq("user_id", alert.user_id).single(),
      supabase.from("mutda_guardians")
        .select("id, name, phone, sort_order, guardian_user_id")
        .eq("user_id", alert.user_id)
        .order("sort_order").order("created_at"),
    ]);

    const userName = profile?.name || "가족";
    const linked = (guardians ?? []).filter((g) => g.guardian_user_id);
    if (!linked.length) {
      // 아직 연결된 보호자가 없음 — pending 유지, 연결되는 즉시 다음 주기에 발송
      console.warn(`alert ${alert.id}: 연결된 보호자 없음 (pending 유지)`);
      continue;
    }

    const hours = Math.round(Number(alert.hours_inactive) || 0);
    const payload = {
      title: `🚨 ${userName}님의 안부를 확인해 주세요`,
      body: `${userName}님이 묻다에 ${hours}시간째 소식이 없어요. 전화나 방문으로 직접 확인해 주세요. 단순히 휴대폰을 쓰지 않으셨을 수도 있습니다.`,
      url: "./home.html",
      tag: `mutda-checkin-${alert.user_id}`,
    };

    // 1) 연결된 모든 보호자에게 인앱 알림 (앱을 열면 보이도록)
    await supabase.from("mutda_notifications").insert(linked.map((g) => ({
      user_id: g.guardian_user_id,
      kind: "checkin_alert",
      title: payload.title,
      body: payload.body,
      url: payload.url,
    })));

    // 2) 지정순위 캐스케이드 푸시: 1순위 전달 성공 시 멈춤, 실패하면 다음 순위
    let delivered = 0;
    for (const g of linked) {
      delivered = await pushToUser(g.guardian_user_id as string, payload);
      if (delivered > 0) break;
    }

    // 인앱 알림은 생성됐으므로 notified 처리 (푸시 실패해도 중복 인앱 방지)
    await supabase.from("mutda_checkin_alerts")
      .update({ status: "notified", notified_at: new Date().toISOString() })
      .eq("id", alert.id);
    notifiedCount++;
    console.log(`alert ${alert.id}: 인앱 ${linked.length}명, 푸시 전달 ${delivered}건`);
  }

  return Response.json({ ok: true, notified: notifiedCount });
});
