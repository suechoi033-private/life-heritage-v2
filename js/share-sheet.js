// 공유 시트 — 글의 한 문장을 골라 카드뉴스로 SNS 공유
// content-detail / post-detail 등에서 공통 사용
import { shareSentenceCard } from './share-card.js';

const SENT = '<<<S>>>'; // 본문에 거의 나오지 않는 문장 경계 sentinel

function extractSentences({ title = '', body = '' }) {
  const out = [];
  if (title && title.trim()) out.push(title.trim());
  const b = (body || '').replace(/\s+/g, ' ').trim();
  if (b) {
    b.replace(/([.!?。…])\s+/g, `$1${SENT}`)
     .replace(/(다)\s+(?=[가-힣])/g, `$1${SENT}`)
     .split(SENT)
     .map(s => s.trim())
     .filter(s => s.length >= 6 && s.length <= 200)
     .forEach(s => out.push(s));
  }
  return [...new Set(out)].slice(0, 10);
}

function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}

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

export function openShareSheet({ title = '', body = '', meta = '' }) {
  const sentences = extractSentences({ title, body });
  if (!sentences.length) { showToast('공유할 문장이 없어요'); return; }

  const root = document.createElement('div');
  root.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:999;display:flex;align-items:flex-end;justify-content:center;animation:ss-fade .18s ease;';
  root.innerHTML = `
    <style>
      @keyframes ss-fade { from { opacity:0; } to { opacity:1; } }
      @keyframes ss-up { from { transform: translateY(20px); } to { transform: translateY(0); } }
    </style>
    <div style="background:#fff;width:100%;max-width:520px;border-radius:18px 18px 0 0;padding:18px 18px 28px;animation:ss-up .22s ease;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <div style="font-size:16px;font-weight:800;color:#21261E;">✦ 카드뉴스로 공유</div>
        <button data-close aria-label="닫기" style="background:none;border:none;font-size:22px;color:#6B756E;cursor:pointer;line-height:1;padding:4px 8px;">×</button>
      </div>
      <div style="font-size:12.5px;color:#6B756E;margin-bottom:14px;">공유할 한 문장을 골라주세요.</div>
      <div data-opts style="display:flex;flex-direction:column;gap:8px;max-height:55vh;overflow-y:auto;"></div>
    </div>`;
  const optsEl = root.querySelector('[data-opts]');
  optsEl.innerHTML = sentences.map((s, i) =>
    `<button type="button" data-idx="${i}" style="text-align:left;background:#F4F6F4;border:1px solid #E5EAE6;border-radius:12px;padding:13px 14px;font-size:14px;line-height:1.55;color:#21261E;font-family:inherit;cursor:pointer;">${escapeHtml(s)}</button>`
  ).join('');

  document.body.appendChild(root);
  const close = () => root.remove();
  root.addEventListener('click', e => { if (e.target === root) close(); });
  root.querySelector('[data-close]').addEventListener('click', close);
  optsEl.querySelectorAll('button[data-idx]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const sentence = sentences[Number(btn.dataset.idx)];
      close();
      showToast('카드를 만드는 중…');
      try {
        const res = await shareSentenceCard(sentence, { meta });
        if (res.method === 'share' || res.method === 'kakao') showToast('공유 시트를 열었어요');
        else if (res.method === 'clipboard') showToast('이미지 저장 · 캡션 복사 완료');
        else if (res.method === 'download') showToast('카드 이미지를 저장했어요');
      } catch (err) {
        console.warn('[share-sheet]', err);
        showToast('공유에 실패했어요');
      }
    });
  });
}
