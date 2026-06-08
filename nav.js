// 잇다 v3 — 5탭 하단 네비 (홈 · 라이프 · 케어링 · 커뮤니티 · 마이)
// 사용법: import { renderNav } from './nav.js';
//          renderNav({ active: 'seed' });
// active: home | seed | nest | forest | root
// 하위 호환: 'care'→nest, 'stories'→forest, 'self'→forest, 'my'→root, 'ask'→home, 'note'→seed

import { supabase } from './auth.js';

// nav.js는 사이트 루트에 위치한다 → 자기 URL의 디렉터리 = 사이트 루트.
// 이렇게 절대 경로로 만들면 note/·info/ 같은 서브폴더 페이지에서도 링크가 안 깨진다.
const ROOT = new URL('.', import.meta.url).href;

const TABS = [
  { key: 'home',   label: '홈',       icon: '🏠', href: ROOT + 'index.html'  },
  { key: 'seed',   label: '라이프',   icon: '🌱', href: ROOT + 'seed.html'   },
  { key: 'nest',   label: '케어링',   icon: '🪺', href: ROOT + 'nest.html'   },
  { key: 'forest', label: '커뮤니티', icon: '🌳', href: ROOT + 'info.html' },
  { key: 'root',   label: '마이',     icon: '🌿', href: ROOT + 'root.html'   },
];

// 기존 키 → 신규 키 매핑 (점진적 마이그레이션 기간 동안)
const LEGACY_ACTIVE_MAP = {
  care: 'nest',
  stories: 'forest',
  story: 'forest',
  self: 'forest',
  my: 'root',
  ask: 'home',
  note: 'seed',
  info: 'forest',
};

// 로그인 필요 탭
const PROTECTED_TABS = new Set(['seed', 'nest', 'root']);

export async function renderNav(opts = {}) {
  const rawActive = opts.active || '';
  const active = LEGACY_ACTIVE_MAP[rawActive] || rawActive;
  const { infoIcon = false, title = '', quickWrite = true, footer = true } = opts;

  const { data: { session } } = await supabase.auth.getSession();
  const loggedIn = !!session;

  _renderTopBar({ loggedIn, infoIcon, title, quickWrite });
  _renderBottomTabs({ active, loggedIn });
  if (footer) _renderFooter();

  document.body.classList.add('has-bottom-nav');
}

// 탑바
function _renderTopBar({ loggedIn, infoIcon, title, quickWrite = true }) {
  if (document.getElementById('itda-top-bar')) return;

  const bar = document.createElement('div');
  bar.id = 'itda-top-bar';
  bar.className = 'itda-top-bar';

  const logoText = title
    ? `<span class="itda-top-bar-pagetitle">${title}</span>`
    : `<a href="${ROOT}index.html" class="logo"><span class="logo-mark">●</span> 잇다</a>`;

  const actions = [];
  if (infoIcon) {
    actions.push(`<a href="${ROOT}info.html" title="정보 허브" aria-label="정보 허브">📚</a>`);
  }
  if (loggedIn && quickWrite) {
    actions.push(`<button id="itda-ask-btn" title="오늘 일기" aria-label="오늘 일기">✏️</button>`);
  } else if (!loggedIn) {
    actions.push(`<a href="${ROOT}login.html" style="font-size:14px;color:var(--ink-soft);text-decoration:none;font-weight:600;padding:4px 2px;">로그인</a>`);
  }

  bar.innerHTML = `
    ${logoText}
    <div class="itda-top-bar-actions">${actions.join('')}</div>
  `;
  document.body.insertBefore(bar, document.body.firstChild);

  const askBtn = document.getElementById('itda-ask-btn');
  if (askBtn) {
    askBtn.addEventListener('click', () => {
      window.location.href = ROOT + 'seed.html?tab=diary&action=new';
    });
  }

  if (!document.getElementById('itda-topbar-style')) {
    const st = document.createElement('style');
    st.id = 'itda-topbar-style';
    st.textContent = `
      .itda-top-bar-pagetitle {
        font-size: 16px;
        font-weight: 800;
        letter-spacing: -0.01em;
        color: var(--ink);
      }
    `;
    document.head.appendChild(st);
  }
}

// 바텀 탭
function _renderBottomTabs({ active, loggedIn }) {
  if (document.getElementById('itda-bottom-nav')) return;

  const nav = document.createElement('nav');
  nav.id = 'itda-bottom-nav';
  nav.className = 'itda-bottom-nav';
  nav.setAttribute('aria-label', '메인 내비게이션');

  nav.innerHTML = TABS.map(t => {
    const isActive = t.key === active;
    const href = (!loggedIn && PROTECTED_TABS.has(t.key)) ? `${ROOT}login.html` : t.href;
    return `
      <a href="${href}" class="${isActive ? 'active' : ''}" aria-label="${t.label}" aria-current="${isActive ? 'page' : 'false'}">
        <span class="nav-icon">${t.icon}</span>
        <span>${t.label}</span>
      </a>
    `;
  }).join('');

  document.body.appendChild(nav);
}

// 콘텐츠 끝 푸터 — 모든 페이지 공통. 회사정보·잇다 이야기·약관/개인정보 링크.
function _renderFooter() {
  if (document.getElementById('itda-footer')) return;

  const f = document.createElement('footer');
  f.id = 'itda-footer';
  f.className = 'itda-footer';
  f.innerHTML = `
    <a class="itda-footer-link" href="${ROOT}about.html">잇다 이야기</a>
    <span class="itda-footer-sep">·</span>
    <a class="itda-footer-link" href="#" data-itda-terms>이용약관</a>
    <span class="itda-footer-sep">·</span>
    <a class="itda-footer-link" href="#" data-itda-privacy>개인정보</a>
    <div class="itda-footer-copy">© 라이프헤리티지 · ITDA</div>
  `;

  // 바텀 내비 위에 자연스럽게 들어가도록, main 다음(또는 body 끝, 바텀 내비 앞)에 삽입.
  const bottomNav = document.getElementById('itda-bottom-nav');
  if (bottomNav) {
    document.body.insertBefore(f, bottomNav);
  } else {
    document.body.appendChild(f);
  }

  if (!document.getElementById('itda-footer-style')) {
    const st = document.createElement('style');
    st.id = 'itda-footer-style';
    st.textContent = `
      .itda-footer {
        max-width: 480px;
        margin: 40px auto 24px;
        padding: 18px 22px 22px;
        text-align: center;
        font-size: 12px;
        color: var(--ink-muted);
        line-height: 1.8;
        border-top: 1px solid var(--line);
      }
      .itda-footer-link {
        color: var(--ink-soft);
        text-decoration: none;
        font-weight: 600;
        transition: color 0.15s;
      }
      .itda-footer-link:hover { color: var(--primary); }
      .itda-footer-sep { color: var(--line); margin: 0 4px; }
      .itda-footer-copy {
        margin-top: 8px;
        font-size: 11px;
        color: var(--ink-muted);
        letter-spacing: 0.02em;
      }
    `;
    document.head.appendChild(st);
  }
}

// 하위 호환
export async function renderTopBar(opts = {}) {
  return renderNav(opts);
}
