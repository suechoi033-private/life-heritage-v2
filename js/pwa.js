// PWA 등록 + Web Push 구독 헬퍼
// 모든 페이지에서 호출 가능: import { registerPWA } from './js/pwa.js';

export async function registerPWA() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('./sw.js', { scope: './' });
    return reg;
  } catch (err) {
    console.warn('[PWA] SW 등록 실패', err);
    return null;
  }
}

// 푸시 권한 요청 + 구독 — 사용자 액션(버튼 클릭)에서 호출 권장
// VAPID 공개키는 환경설정에서 주입. 미설정 시 푸시 비활성.
export async function subscribePush(supabase, vapidPublicKey) {
  if (!vapidPublicKey) {
    console.info('[PWA] VAPID 키 미설정 — 푸시 비활성');
    return null;
  }
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.info('[PWA] 이 브라우저는 푸시를 지원하지 않습니다');
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;

  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });

  // Supabase에 구독 정보 저장
  const sub = subscription.toJSON();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('push_subscriptions').upsert({
      user_id: user.id,
      endpoint: sub.endpoint,
      p256dh_key: sub.keys.p256dh,
      auth_key: sub.keys.auth,
      user_agent: navigator.userAgent,
    }, { onConflict: 'user_id,endpoint' });
  }

  return subscription;
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}
