// 콘텐츠/포스트 전체 공유 — 한 줄 선택 없이 글 전체를 잇다™ 카드 한 장으로
import { shareContentCard } from './share-card.js';

function showToast(msg) {
  let t = document.getElementById('share-sheet-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'share-sheet-toast';
    t.style.cssText = 'position:fixed;left:50%;bottom:80px;transform:translateX(-50%);background:#21261E;color:#fff;padding:11px 16px;border-radius:999px;font-size:13px;font-weight:700;z-index:1000;opacity:0;transition:opacity .25s ease;pointer-events:none;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  requestAnimationFrame(() => { t.style.opacity = '1'; });
  clearTimeout(t._h);
  t._h = setTimeout(() => { t.style.opacity = '0'; }, 2400);
}

export async function shareContent({ title = '', body = '', meta = '' } = {}) {
  if (!title.trim() && !body.trim()) {
    showToast('공유할 내용이 없어요');
    return;
  }
  showToast('카드를 만드는 중…');
  try {
    const res = await shareContentCard({ title, body, meta });
    if (res.method === 'share' || res.method === 'kakao') showToast('공유 시트를 열었어요');
    else if (res.method === 'clipboard') showToast('이미지 저장 · 캡션 복사 완료');
    else if (res.method === 'download') showToast('카드 이미지를 저장했어요');
    // cancelled는 토스트 없이 조용히
  } catch (err) {
    console.warn('[share]', err);
    showToast('공유에 실패했어요');
  }
}
