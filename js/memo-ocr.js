// 손글씨 케어 메모 OCR — 사진 → 글자 옮겨적기 → 케어 기록 칸 자동 채움
// 타이핑이 어려우신 분(예: 매일 수기 메모를 쓰시는 보호자)을 위한 입력 보조.
// ⚠️ 글자 전사(옮겨적기)이며 의학적 판단이 아니다. 저장 전 사용자가 확인한다.
import { supabase } from '../auth.js';

// 업로드 전 이미지 축소·압축 (Claude 5MB 한도·전송 속도). 긴 변 1600px, JPEG.
async function compressImage(file, maxDim = 1600, quality = 0.92) {
  if (!file.type.startsWith('image/')) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality));
    if (!blob) return file;
    if (blob.size >= file.size && file.size < 3_500_000) return file;
    return new File([blob], (file.name || 'memo').replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch (_) {
    return file;
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result || '');
      resolve(s.replace(/^data:[^;]+;base64,/, ''));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 메모 사진 한 장을 판독한다.
// 반환: { transcription, fields, compressedFile }
//   fields = { daily_status, medications, emotion, hospital_visit, cautions, nutrition, free_memo }
export async function ocrMemo(file) {
  if (!file?.type?.startsWith('image/')) throw new Error('이미지 파일만 가능합니다');
  const compressed = await compressImage(file);
  const image = await fileToBase64(compressed);

  const { data, error } = await supabase.functions.invoke('ocr-memo', {
    body: { image, media_type: compressed.type || 'image/jpeg' },
  });
  if (error) throw new Error(error.message || String(error));
  if (data?.error) throw new Error(data.error);

  return {
    transcription: data?.transcription || '',
    fields: data?.fields || {},
    compressedFile: compressed,
  };
}
