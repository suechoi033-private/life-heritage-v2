// 묻다 — 안부확인 알림 발송 (고독사 방지)
//
// pg_cron(mutda-checkin-notify, 30분 주기)이 이 함수를 호출한다.
// pending 상태의 mutda_checkin_alerts 를 읽어, 사용자가 지정한 보호 연락처(가족)에게
// 이메일을 발송하고 notified 로 표시한다.
//
// 이메일 발송은 Resend(https://resend.com) 사용:
//   supabase secrets set RESEND_API_KEY=... MUTDA_FROM_EMAIL=...
// RESEND_API_KEY 가 없으면 알림을 pending 으로 남겨두고 로그만 남긴다
// (키 등록 즉시 다음 주기부터 자동 발송).

import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL = Deno.env.get("MUTDA_FROM_EMAIL") ?? "onboarding@resend.dev";

function alertEmail(userName: string, guardianName: string, hours: number) {
  const h = Math.round(hours);
  return {
    subject: `[묻다] ${userName}님의 안부를 확인해 주세요`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#21261E;">
        <h2 style="color:#2F6B4F;">묻다 안부확인 알림</h2>
        <p>${guardianName}님, 안녕하세요.</p>
        <p><strong>${userName}</strong>님이 묻다 앱을 <strong>약 ${h}시간</strong> 동안
        사용하지 않아, 사전에 지정하신 보호 연락처로 알림을 드립니다.</p>
        <p style="background:#F4F6F4;border-radius:12px;padding:16px;">
          전화나 방문으로 ${userName}님의 안부를 직접 확인해 주세요.<br/>
          단순히 휴대폰을 사용하지 않으셨을 수도 있습니다.
        </p>
        <p style="color:#6B756E;font-size:13px;">
          이 알림은 ${userName}님이 묻다에서 직접 설정한 안부확인 서비스입니다.
          ${userName}님이 앱에 다시 접속하면 알림은 자동으로 해제됩니다.
        </p>
      </div>`,
  };
}

Deno.serve(async (_req) => {
  // 1) pending 알림 조회
  const { data: alerts, error } = await supabase
    .from("mutda_checkin_alerts")
    .select("id, user_id, hours_inactive")
    .eq("status", "pending")
    .limit(50);

  if (error) {
    console.error("alert query failed", error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
  if (!alerts?.length) return Response.json({ ok: true, sent: 0 });

  if (!RESEND_API_KEY) {
    console.warn(`RESEND_API_KEY not set — ${alerts.length} alert(s) left pending`);
    return Response.json({ ok: true, sent: 0, pending: alerts.length, reason: "no_api_key" });
  }

  let sent = 0;
  for (const alert of alerts) {
    const [{ data: profile }, { data: guardians }] = await Promise.all([
      supabase.from("mutda_profiles").select("name").eq("user_id", alert.user_id).single(),
      supabase.from("mutda_guardians").select("name, email").eq("user_id", alert.user_id)
        .order("sort_order"),
    ]);

    const userName = profile?.name || "가족";
    const targets = (guardians ?? []).filter((g) => g.email);
    if (!targets.length) {
      // 이메일 있는 보호 연락처가 없으면 발송 불가 — notified 처리해 무한 재시도 방지
      await supabase.from("mutda_checkin_alerts")
        .update({ status: "notified", notified_at: new Date().toISOString() })
        .eq("id", alert.id);
      continue;
    }

    let delivered = false;
    for (const g of targets) {
      const mail = alertEmail(userName, g.name, Number(alert.hours_inactive) || 0);
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: `묻다 <${FROM_EMAIL}>`, to: g.email, ...mail }),
      });
      if (res.ok) delivered = true;
      else console.error("resend failed", g.email, await res.text());
    }

    if (delivered) {
      await supabase.from("mutda_checkin_alerts")
        .update({ status: "notified", notified_at: new Date().toISOString() })
        .eq("id", alert.id);
      sent++;
    }
  }

  return Response.json({ ok: true, sent });
});
