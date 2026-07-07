// 묻다 — 공통 상단 바 + 하단 내비게이션
import { url } from './app.js';

const TABS = [
  { key: 'home',      href: 'home.html',      ico: '🏠', label: '홈' },
  { key: 'library',   href: 'library.html',   ico: '🧭', label: '길잡이' },
  { key: 'community', href: 'community.html', ico: '🕯️', label: '함께' },
  { key: 'my',        href: 'my.html',        ico: '🌱', label: '나' },
];

export function renderNav({ active = '', title = '' } = {}) {
  const top = document.createElement('header');
  top.className = 'mutda-top-bar';
  top.innerHTML = `
    <div class="inner">
      <a class="mutda-logo" href="${url('home.html')}">묻다</a>
      <span class="muted small">${title}</span>
    </div>`;
  document.body.prepend(top);

  const nav = document.createElement('nav');
  nav.className = 'mutda-bottom-nav';
  nav.innerHTML = `
    <div class="inner">
      ${TABS.map(t => `
        <a href="${url(t.href)}" class="${t.key === active ? 'active' : ''}">
          <span class="ico">${t.ico}</span>${t.label}
        </a>`).join('')}
    </div>`;
  document.body.appendChild(nav);
}

export function renderFooter() {
  const f = document.createElement('div');
  f.className = 'mutda-footer';
  f.innerHTML = `묻다 — 삶에게 묻고, 마음을 남기다<br/>라이프헤리티지`;
  document.querySelector('main')?.appendChild(f);
}
