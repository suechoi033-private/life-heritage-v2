// 답변→공유→초대 유입 루프 — nudge UI + 초대 링크 발급 + 측정 이벤트
// 단일 원천: docs/strategy/answer-invite-loop-2026-06-14.md (C1 시나리오 b+d, C2 옵션 C, C3 기존 friend_invites 활용)
// 헌장 일관: 스트릭·랭킹·"5명 모으면" 0건. 강요·죄책감 0. 권유는 자연 시점 1회.

import { supabase } from '../auth.js';

const INVITE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const REFLECTION_CHANNEL = 'reflection_invite';

// localStorage keys (PE 6/13 패턴 — app_events 없이도 측정 가능)
const LS_EVENTS = 'itda:reflection_invite_events';
const LS_NUDGE_SHOWN = 'itda:reflection_invite_nudge_shown';

function generateInviteCode(length = 8) {
  let code = '';
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  for (let i = 0; i < length; i++) code += INVITE_CODE_CHARS[arr[i] % INVITE_CODE_CHARS.length];
  return code;
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// 측정 이벤트 — localStorage 폴백 (beta.html 패턴)
export function logReflectionInviteEvent(type, payload = {}) {
  try {
    const log = JSON.parse(localStorage.getItem(LS_EVENTS) || '[]');
    log.push({ type, payload, at: new Date().toISOString() });
    // 100개 초과 시 오래된 것 정리
    while (log.length > 100) log.shift();
    localStorage.setItem(LS_EVENTS, JSON.stringify(log));
  } catch (_) { /* storage 실패해도 진행 */ }
}

// 같은 사용자에게 같은 질문 nudge 두번 노출 안 함 (헌장 4.2 — 권유 1회)
export function hasNudgeBeenShownFor(questionId) {
  try {
    const seen = JSON.parse(localStorage.getItem(LS_NUDGE_SHOWN) || '{}');
    return !!seen[questionId];
  } catch (_) {
    return false;
  }
}

export function markNudgeShownFor(questionId) {
  try {
    const seen = JSON.parse(localStorage.getItem(LS_NUDGE_SHOWN) || '{}');
    seen[questionId] = new Date().toISOString();
    localStorage.setItem(LS_NUDGE_SHOWN, JSON.stringify(seen));
  } catch (_) {}
}

// 초대 링크 발급 — friend_invites 활용, channel='reflection_invite', metadata에 질문·익명 토글 저장
export async function createReflectionInvite({ questionId, anonymous = false, message = '' } = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) throw new Error('로그인 필요');
  if (!questionId) throw new Error('질문이 없어요');

  let code, attempt = 0, lastErr;
  while (attempt < 5) {
    code = generateInviteCode();
    const insertRow = {
      inviter_id: user.id,
      invite_code: code,
      channel: REFLECTION_CHANNEL,
      message: message || null,
      metadata: {
        kind: 'reflection_invite',
        question_id: questionId,
        anonymous: !!anonymous,
        created_at: new Date().toISOString(),
      },
    };
    const { error } = await supabase.from('friend_invites').insert(insertRow);
    if (!error) break;
    lastErr = error;
    // 23505 = unique 충돌(코드 중복) — 재시도
    if (error.code !== '23505') {
      // CHECK 제약(reflection_invite 누락) 또는 metadata 컬럼 누락이면 metadata 빼고 fallback 시도
      // 마이그레이션이 아직 안 돌았을 때 안전망 — message에 정보 동봉
      if (attempt === 0 && (
        /violates check constraint/i.test(error.message || '') ||
        /column.*metadata.*does not exist/i.test(error.message || '')
      )) {
        const fallbackMessage = JSON.stringify({
          kind: 'reflection_invite',
          question_id: questionId,
          anonymous: !!anonymous,
        });
        const fallbackRow = {
          inviter_id: user.id,
          invite_code: code,
          channel: 'link',
          message: fallbackMessage,
        };
        const { error: err2 } = await supabase.from('friend_invites').insert(fallbackRow);
        if (!err2) break;
        lastErr = err2;
      }
      throw error;
    }
    attempt++;
  }
  if (attempt >= 5) throw lastErr || new Error('초대 코드 발급 실패');

  const base = `${location.origin}${location.pathname.replace(/[^/]+$/, '')}`;
  const url = `${base}invite-answer.html?token=${encodeURIComponent(code)}&q=${encodeURIComponent(questionId)}`;
  return { code, url, anonymous: !!anonymous, question_id: questionId };
}

// 공유 시트(네이티브 + 폴백) — 답 텍스트 X, 질문 텍스트만
export async function shareReflectionInvite({ questionText, url, inviterName, anonymous }) {
  const displayName = anonymous ? '잇다 친구 한 분' : (inviterName || '잇다 친구 한 분');
  const text = `${displayName}이(가) 잇다에서 이 질문을 같이 답해보자고 보냈어요.\n\n"${questionText}"`;
  // 카카오 SDK 있으면 우선
  if (window.Kakao && window.Kakao.isInitialized()) {
    try {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: '잇다 · 같이 답해보기',
          description: text,
          imageUrl: `${location.origin}${location.pathname.replace(/[^/]+$/, '')}icons/icon-512.png`,
          link: { mobileWebUrl: url, webUrl: url },
        },
        buttons: [
          { title: '같이 답하러 가기', link: { mobileWebUrl: url, webUrl: url } },
        ],
      });
      return { method: 'kakao' };
    } catch (_) { /* fallback to web share */ }
  }
  if (navigator.share) {
    try {
      await navigator.share({ title: '잇다 · 같이 답해보기', text, url });
      return { method: 'share' };
    } catch (e) {
      if (e?.name === 'AbortError') return { method: 'cancelled' };
    }
  }
  // 폴백: 클립보드 복사
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    return { method: 'clipboard' };
  } catch (_) {
    return { method: 'manual', url };
  }
}

// 작은 토스트
function showToast(msg) {
  let t = document.getElementById('rf-invite-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'rf-invite-toast';
    t.style.cssText = 'position:fixed;left:50%;bottom:80px;transform:translateX(-50%);background:var(--ink);color:#fff;padding:11px 16px;border-radius:999px;font-size:13px;font-weight:700;z-index:1000;opacity:0;transition:opacity .25s ease;pointer-events:none;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  requestAnimationFrame(() => { t.style.opacity = '1'; });
  clearTimeout(t._h);
  t._h = setTimeout(() => { t.style.opacity = '0'; }, 2400);
}

// nudge 카드 1개 — 잔잔한 권유 + 두 버튼
// 옵션 c: 한 줄 카피·익명 토글·전용 prompt 텍스트
export function renderInviteNudge(containerEl, {
  questionId,
  questionText,
  inviterName = '',
  copy = '이 질문을 같이 답해보고 싶은 분이 있으신가요?',
  hint = '잇다에서 같은 질문을 답해볼 수 있도록 보내드릴게요.',
  primaryLabel = '이 질문 함께 답해보기',
  secondaryLabel = '다음에',
  source = 'reflection_done',
} = {}) {
  if (!containerEl || !questionId || !questionText) return;

  // 이미 같은 질문 nudge 봤으면 다시 노출 안 함 (헌장: 권유 1회)
  if (hasNudgeBeenShownFor(questionId)) return;
  markNudgeShownFor(questionId);
  logReflectionInviteEvent('reflection_invite_nudge_shown', { question_id: questionId, source });

  const card = document.createElement('div');
  card.className = 'rf-invite-nudge';
  card.style.cssText = `
    margin: 22px 0 0;
    padding: 18px 18px 16px;
    background: var(--bg-alt);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    text-align: left;
  `;
  card.innerHTML = `
    <div style="font-family:var(--font-serif);font-size:16px;font-weight:700;color:var(--ink);line-height:1.55;margin-bottom:6px;">
      ${escapeHtml(copy)}
    </div>
    <div style="font-size:13px;color:var(--ink-soft);line-height:1.65;margin-bottom:14px;">
      ${escapeHtml(hint)}
    </div>
    <label style="display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--ink-muted);margin-bottom:14px;cursor:pointer;">
      <input type="checkbox" class="rf-invite-anon">
      <span>이름 가리고 보내기</span>
    </label>
    <div style="display:flex;gap:8px;">
      <button type="button" class="rf-invite-skip" style="flex:0 0 auto;padding:11px 16px;background:transparent;border:1px solid var(--line);border-radius:999px;font-family:inherit;font-size:13px;font-weight:700;color:var(--ink-muted);cursor:pointer;">
        ${escapeHtml(secondaryLabel)}
      </button>
      <button type="button" class="rf-invite-primary" style="flex:1;padding:12px 16px;background:var(--primary);color:#fff;border:none;border-radius:999px;font-family:inherit;font-size:14px;font-weight:700;cursor:pointer;">
        ${escapeHtml(primaryLabel)} →
      </button>
    </div>
  `;
  containerEl.appendChild(card);

  const anonCheckbox = card.querySelector('.rf-invite-anon');
  const primaryBtn = card.querySelector('.rf-invite-primary');
  const skipBtn = card.querySelector('.rf-invite-skip');

  skipBtn.addEventListener('click', () => {
    logReflectionInviteEvent('reflection_invite_nudge_skipped', { question_id: questionId, source });
    card.remove();
  });

  primaryBtn.addEventListener('click', async () => {
    primaryBtn.disabled = true;
    primaryBtn.textContent = '잠시만요…';
    try {
      const invite = await createReflectionInvite({
        questionId,
        anonymous: !!anonCheckbox.checked,
      });
      logReflectionInviteEvent('reflection_invite_sent', {
        question_id: questionId,
        invite_code: invite.code,
        anonymous: invite.anonymous,
        source,
      });
      const res = await shareReflectionInvite({
        questionText,
        url: invite.url,
        inviterName,
        anonymous: invite.anonymous,
      });
      if (res.method === 'kakao' || res.method === 'share') showToast('공유 시트를 열었어요');
      else if (res.method === 'clipboard') showToast('초대 링크를 복사했어요');
      else showToast(`아래 링크를 길게 눌러 복사해 주세요: ${invite.url}`);
      // 권유 1회 — 카드는 그대로 두되 동작 잠금
      primaryBtn.textContent = '보냈어요 ✓';
      primaryBtn.style.background = 'var(--bg-alt)';
      primaryBtn.style.color = 'var(--ink-soft)';
      anonCheckbox.disabled = true;
    } catch (err) {
      console.warn('[reflection-invite] create failed', err);
      primaryBtn.disabled = false;
      primaryBtn.textContent = `${primaryLabel} →`;
      showToast('초대 링크를 만들지 못했어요');
    }
  });
}
