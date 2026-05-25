// 태그 관리 + 입력 컴포넌트 (키워드·감정 공용)
import { supabase } from '../auth.js';

export const EMOTION_PRESETS = [
  { name: '기쁨',   emoji: '😊' },
  { name: '슬픔',   emoji: '😢' },
  { name: '화남',   emoji: '😡' },
  { name: '두려움', emoji: '😨' },
  { name: '평온',   emoji: '😌' },
  { name: '고민',   emoji: '🤔' },
  { name: '사랑',   emoji: '🥰' },
  { name: '피곤',   emoji: '😴' },
  { name: '의지',   emoji: '💪' },
  { name: '감사',   emoji: '🙏' },
];

export function emojiFor(emotionName) {
  return EMOTION_PRESETS.find((e) => e.name === emotionName)?.emoji || '🌿';
}

// 사용자의 기존 태그 목록
export async function listMyTags(tagType = null) {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return [];
  let q = supabase.from('tags').select('id, name, tag_type, is_favorite').eq('user_id', user.id);
  if (tagType) q = q.eq('tag_type', tagType);
  const { data, error } = await q.order('name');
  if (error) throw error;
  return data || [];
}

// 태그 upsert — 이름·타입 기준, 없으면 생성하고 ID 반환
export async function ensureTags(items) {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) throw new Error('로그인 필요');
  if (!items?.length) return [];

  const normalized = items
    .map((t) => ({ name: t.name.trim(), tag_type: t.tag_type }))
    .filter((t) => t.name);
  if (!normalized.length) return [];

  // 한번에 upsert (unique 제약: user_id, tag_type, name)
  const { data, error } = await supabase
    .from('tags')
    .upsert(
      normalized.map((t) => ({ user_id: user.id, name: t.name, tag_type: t.tag_type })),
      { onConflict: 'user_id,tag_type,name', ignoreDuplicates: false }
    )
    .select('id, name, tag_type');
  if (error) throw error;
  return data || [];
}

// ============================================================
// 태그 입력 컴포넌트 (DOM 직접 조작)
//
// 사용 예:
//   const tagInput = createTagInput(container, {
//     tagType: 'keyword',  // or 'emotion'
//     initial: [{ name: '여행' }],
//     suggestions: [{ name: '운동' }, ...],
//   });
//   tagInput.getValue()  // → [{ name: '여행', tag_type: 'keyword' }]
// ============================================================
export function createTagInput(container, opts = {}) {
  const tagType = opts.tagType || 'keyword';
  let selected = [...(opts.initial || [])];
  const suggestions = opts.suggestions || [];

  container.classList.add('tag-input-wrap');
  container.innerHTML = `
    <div class="tag-chips" data-role="chips"></div>
    ${tagType === 'emotion' ? renderEmotionPresets() : ''}
    <div class="tag-input-row">
      <input type="text" class="tag-input" data-role="input"
        placeholder="${tagType === 'emotion' ? '감정을 직접 입력하거나 위에서 선택' : '키워드를 입력하고 Enter'}"
        autocomplete="off">
    </div>
    ${suggestions.length ? `
      <div class="tag-suggestions">
        <span class="tag-sug-label">자주 쓰는 태그:</span>
        ${suggestions.slice(0, 8).map((t) => `<button type="button" class="tag-sug" data-name="${escapeAttr(t.name)}">#${escapeHtml(t.name)}</button>`).join('')}
      </div>
    ` : ''}
  `;

  const chipsEl = container.querySelector('[data-role="chips"]');
  const inputEl = container.querySelector('[data-role="input"]');

  function render() {
    chipsEl.innerHTML = selected.map((t, i) => `
      <span class="tag-chip">
        ${tagType === 'emotion' ? emojiFor(t.name) + ' ' : '#'}${escapeHtml(t.name)}
        <button type="button" class="tag-chip-x" data-idx="${i}" aria-label="삭제">×</button>
      </span>
    `).join('');
  }

  function add(name) {
    name = name.trim();
    if (!name) return;
    if (selected.some((t) => t.name === name)) return;
    selected.push({ name, tag_type: tagType });
    inputEl.value = '';
    render();
  }

  function renderEmotionPresets() {
    return `
      <div class="emotion-presets">
        ${EMOTION_PRESETS.map((e) => `
          <button type="button" class="emotion-preset" data-name="${e.name}">
            ${e.emoji} ${e.name}
          </button>
        `).join('')}
      </div>`;
  }

  // 이벤트 위임
  container.addEventListener('click', (e) => {
    const x = e.target.closest('.tag-chip-x');
    if (x) {
      selected.splice(parseInt(x.dataset.idx, 10), 1);
      render();
      return;
    }
    const sug = e.target.closest('.tag-sug, .emotion-preset');
    if (sug) {
      add(sug.dataset.name);
    }
  });

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(inputEl.value);
    } else if (e.key === 'Backspace' && !inputEl.value && selected.length) {
      selected.pop();
      render();
    }
  });
  inputEl.addEventListener('blur', () => { if (inputEl.value) add(inputEl.value); });

  render();

  return {
    getValue: () => [...selected],
    setValue: (arr) => { selected = [...arr]; render(); },
    add,
  };
}

function escapeHtml(s) { return (s || '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function escapeAttr(s) { return escapeHtml(s).replace(/`/g, '&#96;'); }
