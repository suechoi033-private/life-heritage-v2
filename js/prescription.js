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
  const { data: { user } } = await supabase.auth.getUser();
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

// 업로드 → 레코드 생성 → 분석 호출
// file: 촬영/앨범에서 고른 단일 이미지
export async function uploadAndAnalyze(subjectId, file) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인 필요');
  if (!file.type.startsWith('image/')) throw new Error('이미지 파일만 업로드 가능합니다');

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

export async function deletePrescription(rx) {
  // 레코드 삭제(약물 cascade) + 스토리지 원본 삭제
  const { error } = await supabase.from('care_prescriptions').delete().eq('id', rx.id);
  if (error) throw error;
  try { await deleteMedia(BUCKET, rx.storage_path); } catch (_) {}
}

export function prescriptionImageUrl(storagePath, expiresIn = 600) {
  return getSignedUrl(BUCKET, storagePath, expiresIn);
}
