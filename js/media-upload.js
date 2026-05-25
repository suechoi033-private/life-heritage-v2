// 미디어 업로드 (Supabase Storage) — 일기·게시글·콘텐츠 공용
import { supabase } from '../auth.js';

const MAX_IMAGE_MB = 8;
const MAX_VIDEO_MB = 50;

function makePath(userId, scope, filename) {
  const safe = filename.replace(/[^\w.-]/g, '_');
  return `${userId}/${scope}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safe}`;
}

export async function uploadMedia(bucket, file, { scope = 'misc' } = {}) {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) throw new Error('로그인 필요');

  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  if (!isImage && !isVideo) throw new Error('이미지 또는 동영상 파일만 업로드 가능합니다');

  const sizeMB = file.size / (1024 * 1024);
  const limit = isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB;
  if (sizeMB > limit) throw new Error(`파일이 너무 큽니다 (최대 ${limit}MB)`);

  const path = makePath(user.id, scope, file.name);
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;

  return {
    storage_path: path,
    media_type: isVideo ? 'video' : 'image',
    bucket,
  };
}

export function getPublicUrl(bucket, path) {
  if (!path) return '';
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function getSignedUrl(bucket, path, expiresIn = 3600) {
  if (!path) return '';
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) return '';
  return data.signedUrl;
}

export async function deleteMedia(bucket, path) {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

// ============================================================
// 미디어 업로더 UI 컴포넌트
//
// 사용 예:
//   const uploader = createMediaUploader(container, {
//     bucket: 'diary-media',
//     scope: 'diary',
//     maxFiles: 6,
//     initial: [{ storage_path: '...', media_type: 'image' }],
//   });
//   uploader.getValue()  // → [{ storage_path, media_type, sort_order, _file?, _pending? }]
// ============================================================
export function createMediaUploader(container, opts = {}) {
  const bucket   = opts.bucket || 'diary-media';
  const scope    = opts.scope || 'misc';
  const maxFiles = opts.maxFiles || 6;
  let items = [...(opts.initial || [])].map((m, i) => ({ ...m, sort_order: i }));

  container.classList.add('media-uploader');
  container.innerHTML = `
    <div class="media-grid" data-role="grid"></div>
    <label class="media-add" data-role="add-label">
      <input type="file" accept="image/*,video/*" multiple style="display:none;" data-role="file">
      <span class="media-add-icon">+</span>
      <span class="media-add-text">사진·동영상 추가</span>
    </label>
    <div class="media-progress" data-role="progress" style="display:none;"></div>
  `;

  const gridEl     = container.querySelector('[data-role="grid"]');
  const fileEl     = container.querySelector('[data-role="file"]');
  const progressEl = container.querySelector('[data-role="progress"]');
  const addLabel   = container.querySelector('[data-role="add-label"]');

  async function render() {
    // 각 아이템 미리보기 URL 비동기 조회
    const previews = await Promise.all(items.map(async (m) => {
      if (m._pending && m._localUrl) return m._localUrl;
      // diary-media는 private이라 signed URL 사용 권장
      return await getSignedUrl(bucket, m.storage_path, 3600);
    }));

    gridEl.innerHTML = items.map((m, i) => `
      <div class="media-cell ${m._pending ? 'media-pending' : ''}">
        ${m.media_type === 'video'
          ? `<video src="${previews[i] || ''}" muted></video>`
          : `<img src="${previews[i] || ''}" alt="첨부 ${i + 1}">`}
        <button type="button" class="media-remove" data-idx="${i}" aria-label="삭제">×</button>
        ${m._pending ? '<div class="media-pending-tag">업로드 중</div>' : ''}
      </div>
    `).join('');
    addLabel.style.display = items.length >= maxFiles ? 'none' : '';
  }

  gridEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.media-remove');
    if (!btn) return;
    const idx = parseInt(btn.dataset.idx, 10);
    items.splice(idx, 1);
    items.forEach((it, i) => { it.sort_order = i; });
    render();
  });

  fileEl.addEventListener('change', async () => {
    const files = [...fileEl.files];
    fileEl.value = '';
    if (!files.length) return;
    if (items.length + files.length > maxFiles) {
      alert(`최대 ${maxFiles}개까지 첨부 가능합니다`);
      return;
    }

    progressEl.style.display = 'block';
    let done = 0;
    for (const file of files) {
      const localUrl = URL.createObjectURL(file);
      const tmp = {
        _pending: true,
        _localUrl: localUrl,
        media_type: file.type.startsWith('video/') ? 'video' : 'image',
        sort_order: items.length,
      };
      items.push(tmp);
      await render();

      try {
        const uploaded = await uploadMedia(bucket, file, { scope });
        Object.assign(tmp, { ...uploaded, _pending: false, _localUrl: undefined });
        URL.revokeObjectURL(localUrl);
      } catch (err) {
        alert(`${file.name} 업로드 실패: ${err.message || err}`);
        items = items.filter((it) => it !== tmp);
      }
      done++;
      progressEl.textContent = `${done} / ${files.length} 업로드 완료`;
      await render();
    }
    progressEl.style.display = 'none';
  });

  render();

  return {
    getValue: () => items
      .filter((m) => !m._pending && m.storage_path)
      .map((m, i) => ({ storage_path: m.storage_path, media_type: m.media_type, sort_order: i })),
    isUploading: () => items.some((m) => m._pending),
    bucket,
  };
}
