// 인앱 알림함 — 데이터 헬퍼 + 탑바 벨 컴포넌트
// 사용: import { mountNotificationBell } from './js/notifications.js';
//       nav.js의 탑바 렌더 직후 자동 호출됨(로그인 시).
import { supabase } from '../auth.js';
import { registerPWA, subscribePush } from './pwa.js';
import { getVapidPublicKey } from './app-config.js';

// ===== 데이터 =====
export async function listNotifications(limit = 30) {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, subject_id, url, title, body, read_at, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) { console.warn('[notif] list', error.message); return []; }
  return data || [];
}

export async function getUnreadCount() {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .is('read_at', null);
  if (error) { console.warn('[notif] count', error.message); return 0; }
  return count || 0;
}

export async function markRead(id) {
  await supabase.from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id).is('read_at', null);
}

export async function markAllRead() {
  await supabase.from('notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null);
}

export function subscribeNotifications(userId, onInsert) {
  const ch = supabase
    .channel(`notifications:${userId}`)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'notifications',
      filter: `user_id=eq.${userId}`,
    }, (payload) => onInsert(payload.new))
    .subscribe();
  return () => supabase.removeChannel(ch);
}

// ===== 알림 받기 설정 (profiles.notification_pref jsonb) =====
async function getPref() {
  const { data: { session } } = await supabase.auth.getSession();
  const uid = session?.user?.id; if (!uid) return {};
  const { data } = await supabase.from('profiles')
    .select('notification_pref').eq('id', uid).maybeSingle();
  return data?.notification_pref || {};
}
async function setPref(patch) {
  const { data: { session } } = await supabase.auth.getSession();
  const uid = session?.user?.id; if (!uid) return;
  const cur = await getPref();
  await supabase.from('profiles')
    .update({ notification_pref: { ...cur, ...patch } })
    .eq('id', uid);
}

// ===== 시간 표기 =====
function ago(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return '방금';
  if (s < 3600) return `${Math.floor(s / 60)}분 전`;
  if (s < 86400) return `${Math.floor(s / 3600)}시간 전`;
  if (s < 604800) return `${Math.floor(s / 86400)}일 전`;
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

// ===== 탑바 벨 컴포넌트 =====
let _mounted = false;
export async function mountNotificationBell() {
  if (_mounted) return;
  const actions = document.querySelector('#itda-top-bar .itda-top-bar-actions');
  if (!actions) return; // 탑바가 아직 없으면 호출측에서 재시도
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return; // 비로그인은 벨 없음
  _mounted = true;

  injectStyle();

  const wrap = document.createElement('div');
  wrap.className = 'itda-notif';
  wrap.innerHTML = `
    <button class="itda-notif-bell" id="itda-notif-bell" aria-label="알림" title="알림">
      🔔<span class="itda-notif-badge" id="itda-notif-badge" hidden>0</span>
    </button>
    <div class="itda-notif-panel" id="itda-notif-panel" hidden role="dialog" aria-label="알림">
      <div class="itda-notif-head">
        <span>알림</span>
        <button class="itda-notif-readall" id="itda-notif-readall">모두 읽음</button>
      </div>
      <div class="itda-notif-list" id="itda-notif-list">
        <div class="itda-notif-empty">불러오는 중…</div>
      </div>
      <div class="itda-notif-foot" id="itda-notif-foot"></div>
    </div>`;
  // 벨은 ✏️/📚 액션보다 앞(왼쪽)에 둔다
  actions.insertBefore(wrap, actions.firstChild);

  const bell  = wrap.querySelector('#itda-notif-bell');
  const badge = wrap.querySelector('#itda-notif-badge');
  const panel = wrap.querySelector('#itda-notif-panel');
  const list  = wrap.querySelector('#itda-notif-list');

  function setBadge(n) {
    if (n > 0) { badge.textContent = n > 99 ? '99+' : String(n); badge.hidden = false; }
    else badge.hidden = true;
  }

  async function refreshBadge() { setBadge(await getUnreadCount()); }

  function renderList(items) {
    if (!items.length) {
      list.innerHTML = `<div class="itda-notif-empty">아직 알림이 없어요.<br>케어링에 새 기록이 올라오면 여기로 알려드릴게요.</div>`;
      return;
    }
    list.innerHTML = items.map((n) => `
      <a class="itda-notif-item ${n.read_at ? '' : 'unread'}" href="${n.url || './nest.html'}" data-id="${n.id}">
        <div class="itda-notif-item-title">${escapeHtml(n.title)}</div>
        ${n.body ? `<div class="itda-notif-item-body">${escapeHtml(n.body)}</div>` : ''}
        <div class="itda-notif-item-time">${ago(n.created_at)}</div>
      </a>`).join('');
    list.querySelectorAll('.itda-notif-item').forEach((el) => {
      el.addEventListener('click', () => { markRead(el.dataset.id); });
    });
  }

  async function openPanel() {
    panel.hidden = false;
    list.innerHTML = `<div class="itda-notif-empty">불러오는 중…</div>`;
    renderList(await listNotifications());
    renderFoot();
  }
  function closePanel() { panel.hidden = true; }

  bell.addEventListener('click', (e) => {
    e.stopPropagation();
    if (panel.hidden) openPanel(); else closePanel();
  });
  document.addEventListener('click', (e) => {
    if (!panel.hidden && !wrap.contains(e.target)) closePanel();
  });
  wrap.querySelector('#itda-notif-readall').addEventListener('click', async () => {
    await markAllRead();
    await refreshBadge();
    renderList(await listNotifications());
  });

  // 알림 받기 설정(앱 푸시 + 카카오 옵트인)
  async function renderFoot() {
    const foot = wrap.querySelector('#itda-notif-foot');
    const pref = await getPref();
    const pushOn = pref.push_optin === true;
    const kakaoOn = pref.kakao_optin === true;
    foot.innerHTML = `
      <div class="itda-notif-foot-title">알림 받는 방법</div>
      <button class="itda-notif-opt" id="opt-push" ${pushOn ? 'data-on="1"' : ''}>
        <span>📱 앱 알림 받기</span>
        <span class="itda-notif-opt-state">${pushOn ? '켜짐' : '받기'}</span>
      </button>
      <button class="itda-notif-opt soon" id="opt-kakao" ${kakaoOn ? 'data-on="1"' : ''}>
        <span>💬 카카오톡으로도 받기</span>
        <span class="itda-notif-opt-state">${kakaoOn ? '신청됨 · 곧 열려요' : '곧 열려요'}</span>
      </button>`;
    foot.querySelector('#opt-push').addEventListener('click', async (e) => {
      e.preventDefault();
      const vapid = getVapidPublicKey();
      if (!vapid) { alert('앱 알림은 곧 열려요. 조금만 기다려 주세요.'); return; }
      await registerPWA();
      const sub = await subscribePush(supabase, vapid);
      if (sub) { await setPref({ push_optin: true }); renderFoot(); }
      else alert('알림 권한이 꺼져 있어요. 브라우저 설정에서 허용해 주세요.');
    });
    // 카카오: 1차에선 발송하지 않고 '받고 싶다'는 의사만 저장(곧 열려요)
    foot.querySelector('#opt-kakao').addEventListener('click', async (e) => {
      e.preventDefault();
      const next = !(pref.kakao_optin === true);
      await setPref({ kakao_optin: next });
      renderFoot();
    });
  }

  await refreshBadge();
  subscribeNotifications(userId, () => { refreshBadge(); if (!panel.hidden) openPanel(); });
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function injectStyle() {
  if (document.getElementById('itda-notif-style')) return;
  const st = document.createElement('style');
  st.id = 'itda-notif-style';
  st.textContent = `
    /* 벨 자체는 position:static — 패널의 containing block을 .itda-top-bar(sticky)로
       올려 두 가지를 동시에 얻는다: (1) right:0 이 탑바 우측에 붙어 화면 밖 왼쪽으로 흘러
       나가지 않음, (2) 어떤 액션 아이콘 옆에 와도 안정적. */
    .itda-notif { display: inline-flex; }
    .itda-notif-bell {
      position: relative; background: transparent; border: none; cursor: pointer;
      font-size: 20px; line-height: 1; padding: 4px; border-radius: 8px;
    }
    .itda-notif-bell:hover { background: var(--bg-alt, #f4f2ee); }
    .itda-notif-badge {
      position: absolute; top: -2px; right: -2px; min-width: 16px; height: 16px;
      padding: 0 4px; border-radius: 999px; background: #E5484D; color: #fff;
      font-size: 10px; font-weight: 800; line-height: 16px; text-align: center;
    }
    .itda-notif-panel {
      position: absolute; top: 56px; right: 12px; width: 320px;
      /* 줌(1.1)이 컨테이너에 걸린 환경에서도 작은 폰(iPhone SE)에서 가로로 흘러나가지 않도록
         실제 화면 폭 기준으로 안전 여백. calc() 안에 zoom 보정을 포함. */
      max-width: calc((100vw - 24px) / 1.1);
      background: #fff; border: 1px solid var(--line, #e8e4dd); border-radius: 14px;
      box-shadow: 0 12px 32px rgba(0,0,0,0.14); z-index: 1200; overflow: hidden;
    }
    .itda-notif-head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 14px; border-bottom: 1px solid var(--line, #e8e4dd);
      font-weight: 800; color: var(--ink, #2b2723); font-size: 15px;
    }
    .itda-notif-readall {
      background: none; border: none; color: var(--ink-soft, #7a736a);
      font-size: 12px; font-weight: 600; cursor: pointer;
    }
    .itda-notif-list { max-height: 50vh; overflow-y: auto; }
    .itda-notif-item {
      display: block; padding: 12px 14px; border-bottom: 1px solid var(--line, #f0ede7);
      text-decoration: none; color: var(--ink, #2b2723);
    }
    .itda-notif-item:hover { background: var(--bg-alt, #faf8f4); }
    .itda-notif-item.unread { background: #FBF6EE; }
    .itda-notif-item.unread .itda-notif-item-title::before {
      content: ''; display: inline-block; width: 7px; height: 7px; border-radius: 50%;
      background: #E5933B; margin-right: 6px; vertical-align: middle;
    }
    .itda-notif-item-title { font-weight: 700; font-size: 14px; }
    .itda-notif-item-body {
      font-size: 13px; color: var(--ink-soft, #7a736a); margin-top: 2px;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .itda-notif-item-time { font-size: 11px; color: var(--ink-muted, #a89f93); margin-top: 4px; }
    .itda-notif-empty { padding: 28px 16px; text-align: center; color: var(--ink-muted, #a89f93); font-size: 13px; line-height: 1.7; }
    .itda-notif-foot { padding: 10px 12px 12px; border-top: 1px solid var(--line, #e8e4dd); background: var(--bg-alt, #faf8f4); }
    .itda-notif-foot-title { font-size: 11px; font-weight: 700; color: var(--ink-muted, #a89f93); margin: 2px 2px 8px; }
    .itda-notif-opt {
      width: 100%; display: flex; align-items: center; justify-content: space-between;
      background: #fff; border: 1px solid var(--line, #e8e4dd); border-radius: 10px;
      padding: 10px 12px; margin-bottom: 6px; cursor: pointer; font-size: 13px;
      font-weight: 600; color: var(--ink, #2b2723);
    }
    .itda-notif-opt[data-on="1"] { border-color: var(--primary, #4CAE5C); }
    .itda-notif-opt-state { font-size: 12px; color: var(--ink-soft, #7a736a); font-weight: 600; }
    .itda-notif-opt.soon { opacity: 0.92; }
    .itda-notif-opt.soon .itda-notif-opt-state { color: var(--ink-muted, #a89f93); }
  `;
  document.head.appendChild(st);
}
