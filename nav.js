// 잇다 — 공통 바텀 탭 + 탑바 내비게이션 (모바일 우선 v2)
// 사용법: import { renderNav } from './nav.js';
//          renderNav({ active: 'care' });
// active: home | care | self | stories | my
// opts.infoIcon: true → 탑바 우상단에 정보 아이콘 표시

import { supabase } from './auth.js';

const TABS = [
  { key: 'home',    label: '홈',        icon: '🏠', href: './index.html' },
  { key: 'care',    label: '돌봄',      icon: '🤝', href: './care.html'   },
  { key: 'self',    label: '내 마무리', icon: '🕊',  href: './self.html'   },
  { key: 'stories', label: '기억',      icon: '🌿', href: './stories.html' },
  { key: 'my',      label: '마이',      icon: '👤', href: './my.html'     },
];

export async function renderNav(opts = {}) {
  const { active = '', infoIcon = true, title = '' } = opts;

  const { data: { session } } = await supabase.auth.getSession();
  const loggedIn = !!session;

  _renderTopBar({ loggedIn, infoIcon, title });
  _renderBottomTabs({ active, loggedIn });

  document.body.classList.add('has-bottom-nav');
}

// 탑바: 로고 + 우상단 아이콘
function _renderTopBar({ loggedIn, infoIcon, title }) {
  if (document.getElementById('itda-top-bar')) return;

  const bar = document.createElement('div');
  bar.id = 'itda-top-bar';
  bar.className = 'itda-top-bar';

  const logoText = title
    ? `<span class="itda-top-bar-pagetitle">${title}</span>`
    : `<a href="./index.html" class="logo"><span class="logo-mark">●</span> 잇다</a>`;

  const actions = [];
  if (infoIcon) {
    actions.push(`<a href="./info.html" title="정보" aria-label="정보">📚</a>`);
  }
  if (loggedIn) {
    actions.push(`<button id="itda-ask-btn" title="오늘 잇고" aria-label="오늘 잇고">✏️</button>`);
  } else {
    actions.push(`<a href="./login.html" style="font-size:14px;color:var(--ink-soft);text-decoration:none;font-weight:600;padding:4px 2px;">로그인</a>`);
  }

  bar.innerHTML = `
    ${logoText}
    <div class="itda-top-bar-actions">${actions.join('')}</div>
  `;

  // body 첫 번째 자식으로 삽입
  document.body.insertBefore(bar, document.body.firstChild);

  // "오늘 잇고" 버튼
  const askBtn = document.getElementById('itda-ask-btn');
  if (askBtn) {
    askBtn.addEventListener('click', () => {
      window.location.href = './ask.html';
    });
  }

  // 탑바 타이틀 스타일
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

// 바텀 탭 5개
function _renderBottomTabs({ active, loggedIn }) {
  if (document.getElementById('itda-bottom-nav')) return;

  const nav = document.createElement('nav');
  nav.id = 'itda-bottom-nav';
  nav.className = 'itda-bottom-nav';
  nav.setAttribute('aria-label', '메인 내비게이션');

  nav.innerHTML = TABS.map(t => {
    const isActive = t.key === active;
    // 로그인 필요 탭: self, care, my — 비로그인이면 login으로 이동
    const href = (!loggedIn && ['self', 'care', 'my'].includes(t.key))
      ? `./login.html`
      : t.href;
    return `
      <a href="${href}" class="${isActive ? 'active' : ''}" aria-label="${t.label}" aria-current="${isActive ? 'page' : 'false'}">
        <span class="nav-icon">${t.icon}</span>
        <span>${t.label}</span>
      </a>
    `;
  }).join('');

  document.body.appendChild(nav);
}

// ── 하위 호환: 기존 renderTopBar 호출도 동작하도록 ──
export async function renderTopBar(opts = {}) {
  return renderNav(opts);
}
