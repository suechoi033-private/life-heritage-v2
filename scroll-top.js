// 잇다 — 맨 위로 floating button
// 사용법: <script src="scroll-top.js" defer></script>

(function () {
  if (document.getElementById('scroll-to-top')) return;

  const btn = document.createElement('button');
  btn.id = 'scroll-to-top';
  btn.type = 'button';
  btn.setAttribute('aria-label', '맨 위로 이동');
  btn.innerHTML = '<span aria-hidden="true">↑</span>';
  document.body.appendChild(btn);

  const style = document.createElement('style');
  style.id = 'scroll-to-top-style';
  style.textContent = `
    #scroll-to-top {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.96);
      color: #B46E5A;
      border: 1px solid #E8E8ED;
      box-shadow: 0 4px 14px rgba(20, 20, 20, 0.08);
      font-size: 20px;
      font-weight: 700;
      line-height: 1;
      cursor: pointer;
      opacity: 0;
      pointer-events: none;
      transform: translateY(8px);
      transition: opacity 0.22s ease, transform 0.22s ease, background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
      z-index: 60;
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      font-family: -apple-system, 'Pretendard Variable', 'Pretendard', sans-serif;
    }
    #scroll-to-top.visible {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }
    #scroll-to-top:hover {
      background: #B46E5A;
      color: #FFFFFF;
      border-color: #B46E5A;
    }
    #scroll-to-top:focus-visible {
      outline: 2px solid #B46E5A;
      outline-offset: 3px;
    }
    @media (max-width: 480px) {
      #scroll-to-top {
        bottom: 18px;
        right: 18px;
        width: 40px;
        height: 40px;
        font-size: 18px;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      #scroll-to-top {
        transition: opacity 0.15s ease;
        transform: none;
      }
    }
  `;
  document.head.appendChild(style);

  const SHOW_AT = 400;
  let ticking = false;
  function update() {
    const scrolled = window.scrollY || document.documentElement.scrollTop;
    btn.classList.toggle('visible', scrolled > SHOW_AT);
    ticking = false;
  }
  update();
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  });
})();
