// 잇다·묻다·개인홈 공용 경량 웹 트래커 — web_events에 페이지뷰 1건 기록.
// SDK 불필요(REST insert). 어느 사이트든 아래 한 줄로 심는다:
//   <script src="https://suechoi033-private.github.io/life-heritage-v2/js/track.js" data-site="suechoi" defer></script>
// 잇다 페이지는 auth.js가 자동 주입하므로 별도 태그 불필요.
// 수집: path·referrer 호스트·utm(source/medium/campaign)·랜덤 방문자/세션 id.
// 이름·이메일 등 PII는 수집하지 않는다. 실패는 조용히 무시(앱 동작 무방해).
(function () {
  'use strict';
  var SUPA = 'https://zugwccngzprjjnwtajyr.supabase.co';
  var KEY = 'sb_publishable_OhOQp9Q-v6bGM9TnVPKG1g_4PFUT6dN'; // 공개키 (RLS: insert-only)

  try {
    var el = document.currentScript;
    var site = (el && el.dataset && el.dataset.site) || 'itda';

    // 중복 방지: 같은 페이지 로드에서 한 번만
    if (window.__itdaTracked) return;
    window.__itdaTracked = true;

    var rnd = function () {
      return (crypto && crypto.randomUUID) ? crypto.randomUUID()
        : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    };
    var store = function (storage, key) {
      try {
        var v = storage.getItem(key);
        if (!v) { v = rnd(); storage.setItem(key, v); }
        return v;
      } catch (_) { return null; }
    };
    var vid = store(localStorage, 'itda:web_vid');    // 방문자 (기기 지속)
    var sid = store(sessionStorage, 'itda:web_sid');  // 세션 (탭 수명)

    // 로그인 사용자면 user_id 첨부 (supabase-js가 localStorage에 두는 세션 토큰에서 추출)
    var uid = null;
    try {
      var raw = localStorage.getItem('sb-zugwccngzprjjnwtajyr-auth-token');
      if (raw) uid = (JSON.parse(raw).user || {}).id || null;
    } catch (_) { /* 무시 */ }

    // referrer: 같은 호스트(내부 이동)는 유입이 아니므로 비움
    var ref = document.referrer || '';
    var refHost = null;
    try { if (ref) refHost = new URL(ref).hostname; } catch (_) { /* 무시 */ }
    if (refHost === location.hostname) { ref = ''; refHost = null; }

    var q = new URLSearchParams(location.search);
    var utm = null;
    if (q.get('utm_source') || q.get('utm_medium') || q.get('utm_campaign')) {
      utm = { source: q.get('utm_source'), medium: q.get('utm_medium'), campaign: q.get('utm_campaign') };
    }

    var path = location.pathname.split('/').filter(Boolean).slice(-2).join('/') || 'index.html';
    if (!/\.html?$/.test(path)) path += (path ? '/' : '') + 'index.html';

    fetch(SUPA + '/rest/v1/web_events', {
      method: 'POST',
      keepalive: true,
      headers: {
        apikey: KEY,
        Authorization: 'Bearer ' + KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        site: site, event: 'pageview', path: path,
        vid: vid, sid: sid, user_id: uid,
        ref: ref || null, ref_host: refHost, utm: utm,
      }),
    }).catch(function () { /* 계측 실패 무시 */ });
  } catch (_) { /* 계측 실패 무시 */ }
})();
