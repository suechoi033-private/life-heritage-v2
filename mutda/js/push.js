// 묻다 — 웹푸시 구독 (보호자용 안부확인 알림)
// VAPID 공개키는 Edge Function GET에서 받아온다 (Vault 저장, 코드에 키 없음).
import { supabase, SUPABASE_URL } from './app.js';

export async function registerSW() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('./sw.js', { scope: './' });
  } catch (err) {
    console.warn('[묻다] SW 등록 실패', err);
    return null;
  }
}

export function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

async function getVapidPublicKey() {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/mutda-checkin-notify`);
  if (!res.ok) throw new Error('VAPID 키 조회 실패');
  const { vapidPublicKey } = await res.json();
  return vapidPublicKey;
}

// 사용자 액션(버튼 클릭)에서 호출할 것 — 권한 팝업이 뜬다
export async function subscribePush() {
  if (!pushSupported()) return { ok: false, reason: 'unsupported' };

  await registerSW();
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: 'denied' };

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const key = await getVapidPublicKey();
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: 'no-auth' };

  const json = sub.toJSON();
  const { error } = await supabase.from('mutda_push_subscriptions').upsert({
    user_id: user.id,
    endpoint: json.endpoint,
    p256dh_key: json.keys.p256dh,
    auth_key: json.keys.auth,
    user_agent: navigator.userAgent,
  }, { onConflict: 'user_id,endpoint' });

  return error ? { ok: false, reason: error.message } : { ok: true };
}

export async function hasPushSubscription() {
  if (!pushSupported()) return false;
  const reg = await navigator.serviceWorker.getRegistration('./');
  const sub = await reg?.pushManager?.getSubscription();
  return !!sub;
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}
