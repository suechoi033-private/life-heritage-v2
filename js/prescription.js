// 처방전 분석 헬퍼 — 업로드(촬영/앨범) → analyze-rx → 약물 카드
// ⚠️ 의학적 진단이 아닌 정보 제공. 표시 화면에 디스클레이머 필수.
import { supabase } from '../auth.js';
import { uploadMedia, getSignedUrl, deleteMedia } from './media-upload.js';

const BUCKET = 'care-rx';

// 정보주체(부모) 건강정보 처리 동의 여부
export function hasHealthConsent(subject) {
  return !!subject?.health_data_consent_at;
}

export async function recordHealthConsent(subjectId) {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) throw new Error('로그인 필요');
  const { data, error } = await supabase
    .from('care_subjects')
    .update({
      health_data_consent_at: new Date().toISOString(),
      health_data_consent_by: user.id,
    })
    .eq('id', subjectId)
    .select('health_data_consent_at')
    .single();
  if (error) throw error;
  return data;
}

// 처방전 목록 + 각 처방전의 약물 카드
export async function listPrescriptions(subjectId) {
  const { data: rxs, error } = await supabase
    .from('care_prescriptions')
    .select('id, storage_path, status, error_msg, rx_date, created_at')
    .eq('subject_id', subjectId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (!rxs?.length) return [];

  const { data: drugs } = await supabase
    .from('care_prescription_drugs')
    .select('*')
    .in('prescription_id', rxs.map((r) => r.id))
    .order('sort_order', { ascending: true });

  const byRx = {};
  (drugs || []).forEach((d) => {
    (byRx[d.prescription_id] = byRx[d.prescription_id] || []).push(d);
  });
  return rxs.map((r) => ({ ...r, drugs: byRx[r.id] || [] }));
}

// 업로드 전 이미지 축소·압축 (Claude 5MB 한도·업로드 속도). 긴 변 1600px, JPEG.
async function compressImage(file, maxDim = 1600, quality = 0.82) {
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
    // 압축본이 더 크면(이미 작은 파일 등) 원본 유지
    if (blob.size >= file.size && file.size < 3_500_000) return file;
    return new File([blob], (file.name || 'rx').replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch (_) {
    return file; // 변환 실패 시 원본 (HEIC 등) — 서버가 용량 가드로 안내
  }
}

// 업로드 → 레코드 생성 → 분석 호출
// file: 촬영/앨범에서 고른 단일 이미지
export async function uploadAndAnalyze(subjectId, file) {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) throw new Error('로그인 필요');
  if (!file.type.startsWith('image/')) throw new Error('이미지 파일만 업로드 가능합니다');

  file = await compressImage(file);
  const { storage_path } = await uploadMedia(BUCKET, file, { scope: 'rx' });

  const { data: rx, error } = await supabase
    .from('care_prescriptions')
    .insert({ subject_id: subjectId, uploader_id: user.id, storage_path, status: 'pending' })
    .select('id')
    .single();
  if (error) {
    // 업로드 실패 정리
    try { await deleteMedia(BUCKET, storage_path); } catch (_) {}
    throw error;
  }

  const { data, error: fnErr } = await supabase.functions.invoke('analyze-rx', {
    body: { prescription_id: rx.id },
  });
  if (fnErr) throw new Error('분석 호출 실패: ' + (fnErr.message || fnErr));
  return { prescription_id: rx.id, ...data };
}

// 이미 업로드된 처방전을 (재업로드 없이) 다시 분석 — 저장된 이미지로 재실행
export async function reanalyzePrescription(prescriptionId) {
  const { data, error } = await supabase.functions.invoke('analyze-rx', {
    body: { prescription_id: prescriptionId },
  });
  if (error) throw new Error('분석 호출 실패: ' + (error.message || error));
  return data;
}

export async function deletePrescription(rx) {
  // 레코드 삭제(약물 cascade) + 스토리지 원본 삭제
  const { error } = await supabase.from('care_prescriptions').delete().eq('id', rx.id);
  if (error) throw error;
  try { await deleteMedia(BUCKET, rx.storage_path); } catch (_) {}
}

export function prescriptionImageUrl(storagePath, expiresIn = 600) {
  return getSignedUrl(BUCKET, storagePath, expiresIn);
}

// ── 추정 관리 영역 (진단 아님) ───────────────────────
// 약물 적응증(효능) 텍스트의 키워드로 케어 카테고리를 추정한다.
// 결정적(deterministic) 규칙 — AI 진단이 아니라 일반 정보 매핑.
const CATEGORY_KEYWORDS = {
  hypertension:  ['고혈압', '혈압'],
  diabetes:      ['당뇨', '혈당', '인슐린'],
  dyslipidemia:  ['고지혈', '콜레스테롤', '이상지질', '중성지방'],
  bone_joint:    ['관절염', '골다공증', '관절', '연골'],
};

const CATEGORY_LABEL_KO = {
  hypertension: '고혈압', diabetes: '당뇨', dyslipidemia: '고지혈증', bone_joint: '관절·뼈',
};

// drugs: care_prescription_drugs 행 배열 → 추정 카테고리 키 배열
export function deriveCategories(drugs) {
  const found = new Set();
  (drugs || []).forEach((d) => {
    const text = `${d.efficacy || ''} ${d.matched_name || ''} ${d.raw_name || ''}`;
    Object.entries(CATEGORY_KEYWORDS).forEach(([cat, kws]) => {
      if (kws.some((k) => text.includes(k))) found.add(cat);
    });
  });
  return Array.from(found);
}

// 약물들 → 추정 병명 태그 [{ key, label, efficacy, category }]
// key=그룹 기준(큰 분류 또는 효능 요약) · label=표시명(고혈압 등) · efficacy=효능 원문 요약
export function deriveConditionTags(drugs) {
  const byKey = new Map();
  (drugs || []).forEach((d) => {
    const eff = (d.efficacy || '').replace(/\s+/g, ' ').trim();
    if (!eff) return;
    const text = `${eff} ${d.matched_name || ''} ${d.raw_name || ''}`;
    let cat = null;
    for (const [c, kws] of Object.entries(CATEGORY_KEYWORDS)) {
      if (kws.some((k) => text.includes(k))) { cat = c; break; }
    }
    const efficacy = eff.slice(0, 60);
    const key = cat || efficacy;
    const label = cat ? CATEGORY_LABEL_KO[cat] : (efficacy.length > 18 ? efficacy.slice(0, 18) + '…' : efficacy);
    if (!byKey.has(key)) byKey.set(key, { key, label, efficacy, category: cat });
  });
  return Array.from(byKey.values());
}

// 카테고리 키 배열 → 케어 가이드 콘텐츠
export async function listCareGuides(categories) {
  if (!categories?.length) return [];
  const { data, error } = await supabase
    .from('care_guides')
    .select('*')
    .in('category', categories)
    .eq('is_published', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}
