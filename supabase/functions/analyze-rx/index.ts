// =============================================================
// Supabase Edge Function: analyze-rx (처방전 분석)
//
// ⚠️ 이 함수는 아직 배포되지 않았습니다. **창업자가 직접 배포해야 합니다.**
//    (README.md 참고)
//
// 동작:
//   1) 호출자 JWT 검증 → uid
//   2) prescription_id로 care_prescriptions 조회 + 접근권한 확인
//   3) care-rx 버킷 signed URL로 이미지 로드
//   4) Claude Vision으로 OCR + 약물명/처방일 JSON 추출
//   5) 약물별 식약처 e약은요(getDrbEasyDrugList) 조회 → 효능·용법·주의·상호작용
//   6) care_prescription_drugs 저장, status='done'
//
// 요청: POST { prescription_id: string }
// 응답: { ok: true, drugs: number } | { error }
//
// 배포: supabase functions deploy analyze-rx
// 필요 시크릿(수동 설정):
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (자동)
//   ANTHROPIC_API_KEY  (Claude Vision OCR)
//   DATA_GO_KR_KEY     (공공데이터포털 일반 인증키 — URL 인코딩된 값)
//
// ※ 의학적 진단이 아닌 정보 제공. 결과 표시에는 반드시 디스클레이머.
// =============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || '';
const DATA_GO_KR_KEY = Deno.env.get('DATA_GO_KR_KEY') || '';
const MFDS_BASE =
  'https://apis.data.go.kr/1471000/DrbEasyDrugInfoService/getDrbEasyDrugList';
// 전문약 포함 전 품목 — 의약품 제품 허가정보(효능/용법/주의 문서 제공)
// 서비스/오퍼레이션 버전이 갱신돼 와서, 동작하는 엔드포인트를 자동 탐색한다.
const PERMIT_ENDPOINTS = [
  'https://apis.data.go.kr/1471000/DrugPrdtPrmsnInfoService07/getDrugPrdtPrmsnDtlInq06',
  'https://apis.data.go.kr/1471000/DrugPrdtPrmsnInfoService07/getDrugPrdtPrmsnDtlInq05',
  'https://apis.data.go.kr/1471000/DrugPrdtPrmsnInfoService06/getDrugPrdtPrmsnDtlInq05',
  'https://apis.data.go.kr/1471000/DrugPrdtPrmsnInfoService05/getDrugPrdtPrmsnDtlInq04',
  'https://apis.data.go.kr/1471000/DrugPrdtPrmsnInfoService04/getDrugPrdtPrmsnDtlInq03',
  'https://apis.data.go.kr/1471000/DrugPrdtPrmsnInfoService03/getDrugPrdtPrmsnDtlInq03',
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders() });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  if (!ANTHROPIC_API_KEY) return json({ error: 'ANTHROPIC_API_KEY not configured' }, 500);

  const url = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  let prescriptionId = '';
  try {
    const body = await req.json();
    prescriptionId = body.prescription_id;
    if (!prescriptionId) return json({ error: 'prescription_id required' }, 400);
  } catch {
    return json({ error: 'invalid body' }, 400);
  }

  // 1) 호출자 인증
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return json({ error: 'unauthorized' }, 401);

  const authClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: userData, error: userErr } = await authClient.auth.getUser();
  if (userErr || !userData?.user) return json({ error: 'unauthorized' }, 401);
  const uid = userData.user.id;

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // 2) 처방전 조회 + 접근권한
    const { data: rx, error: rxErr } = await admin
      .from('care_prescriptions')
      .select('id, subject_id, uploader_id, storage_path, status')
      .eq('id', prescriptionId)
      .maybeSingle();
    if (rxErr || !rx) return json({ error: 'prescription not found' }, 404);

    // service_role 컨텍스트라 auth.uid()가 없으므로 owner/member를 직접 확인
    const owner = await admin
      .from('care_subjects')
      .select('user_id')
      .eq('id', rx.subject_id)
      .maybeSingle();
    const member = await admin
      .from('care_members')
      .select('user_id')
      .eq('subject_id', rx.subject_id)
      .eq('user_id', uid)
      .maybeSingle();
    const allowed = owner.data?.user_id === uid || !!member.data;
    if (!allowed) return json({ error: 'forbidden' }, 403);

    await admin.from('care_prescriptions')
      .update({ status: 'processing', error_msg: null })
      .eq('id', prescriptionId);

    // 3) signed URL로 이미지 로드
    const { data: signed, error: signErr } = await admin.storage
      .from('care-rx')
      .createSignedUrl(rx.storage_path, 120);
    if (signErr || !signed?.signedUrl) throw new Error('이미지 URL 생성 실패');

    const imgRes = await fetch(signed.signedUrl);
    if (!imgRes.ok) throw new Error('이미지 다운로드 실패');
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    const buf = new Uint8Array(await imgRes.arrayBuffer());
    const b64 = base64Encode(buf);

    // 4) Claude Vision: OCR + 구조화 추출
    const extracted = await extractWithClaude(b64, contentType);
    const drugs = (extracted.drugs || []).slice(0, 20);

    // 5) 약물별 식약처 조회
    const drugRows: any[] = [];
    for (let i = 0; i < drugs.length; i++) {
      const d = drugs[i];
      const rawName = (d.name || '').trim();
      if (!rawName) continue;
      const info = DATA_GO_KR_KEY ? await lookupMfds(rawName) : null;
      drugRows.push({
        prescription_id: prescriptionId,
        raw_name: rawName,
        matched_name: info?.itemName || null,
        item_seq: info?.itemSeq || null,
        efficacy: info?.efcyQesitm || null,
        usage_text: info?.useMethodQesitm || null,
        caution: info?.atpnQesitm || null,
        interactions: info?.intrcQesitm || null,
        confidence: info ? info._confidence : 0,
        sort_order: i,
      });
    }

    // 6) 저장
    await admin.from('care_prescription_drugs')
      .delete().eq('prescription_id', prescriptionId);
    if (drugRows.length) {
      const { error: insErr } = await admin
        .from('care_prescription_drugs')
        .insert(drugRows);
      if (insErr) throw insErr;
    }

    await admin.from('care_prescriptions').update({
      status: 'done',
      ocr_text: extracted.ocr_text || null,
      rx_date: extracted.rx_date || null,
    }).eq('id', prescriptionId);

    return json({ ok: true, drugs: drugRows.length });
  } catch (err) {
    await admin.from('care_prescriptions').update({
      status: 'failed',
      error_msg: String(err).slice(0, 500),
    }).eq('id', prescriptionId);
    return json({ error: String(err) }, 500);
  }
});

// ── Claude Vision OCR + 추출 ─────────────────────────
const SUPPORTED_IMG = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

async function extractWithClaude(b64: string, mediaType: string) {
  if (!SUPPORTED_IMG.includes(mediaType)) {
    throw new Error('지원하지 않는 이미지 형식입니다. JPEG·PNG로 다시 올려주세요.');
  }
  const prompt = `이 이미지는 한국 병원/약국의 처방전 또는 약 봉투입니다.
다음을 JSON으로만 출력하세요(설명·코드블록 금지):
{
  "ocr_text": "이미지에서 읽은 전체 텍스트",
  "rx_date": "YYYY-MM-DD 또는 null (처방일/조제일)",
  "drugs": [{ "name": "약품명(제품명, 용량 포함 가능)", "dose": "1회 투약량 또는 null", "frequency": "1일 투여횟수 또는 null", "days": "총 투약일수 또는 null" }]
}
약품명은 식별 가능한 제품명 위주로 정확히 적으세요. 읽을 수 없으면 drugs는 빈 배열.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: b64 } },
          { type: 'text', text: prompt },
        ],
      }],
    }),
  });
  if (!res.ok) throw new Error(`Claude 호출 실패: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const text = (data.content || []).map((c: any) => c.text || '').join('').trim();
  const jsonStr = text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  try {
    return JSON.parse(jsonStr);
  } catch {
    // JSON 본문만 추출 재시도
    const m = jsonStr.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error('처방전 판독 결과 파싱 실패');
  }
}

// ── 식약처 e약은요 조회 ───────────────────────────────
async function lookupMfds(rawName: string) {
  // 괄호(성분)·용량·단위를 제거해 제품명 위주로 정리
  const noParen = rawName.replace(/\([^)]*\)/g, ' ');
  const noDose = noParen
    .replace(/\d+(\.\d+)?\s*(mg|g|ml|밀리그람|밀리그램|마이크로그램|mcg|iu|％|%)/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const core = noDose.split(' ')[0]; // 제품명 본체 (예: 아빌리파이정, 웰부트린엑스엘정)
  // 후보: 정리된 전체명 → 본체 → 원문 순으로 시도
  const tryNames = [...new Set([noDose, core, rawName].filter((v) => v && v.length >= 2))];

  for (const name of tryNames) {
    const u = `${MFDS_BASE}?serviceKey=${DATA_GO_KR_KEY}&type=json&numOfRows=3&pageNo=1&itemName=${encodeURIComponent(name)}`;
    try {
      const res = await fetch(u);
      const raw = await res.text();
      console.log(`[easydrug] name="${name}" status=${res.status} body=${raw.slice(0, 500)}`);
      if (!res.ok) continue;
      let data: any;
      try { data = JSON.parse(raw); } catch { continue; }
      const items = data?.body?.items;
      if (Array.isArray(items) && items.length) {
        const it = items[0];
        const norm = (s: string) => (s || '').replace(/\s/g, '');
        const exact = norm(it.itemName).includes(norm(core)) || norm(it.itemName).includes(norm(noDose));
        return { ...it, _confidence: exact ? 1 : 0.6 };
      }
    } catch {
      // 다음 후보로
    }
  }
  // e약은요에 없으면(주로 전문의약품) 의약품 제품 허가정보로 재조회
  const permit = await lookupPermit(noDose, core);
  if (permit) return permit;
  return null;
}

// ── 의약품 제품 허가정보(전 품목) 조회 ─────────────────
// 식약처 문서(XML)는 본문 텍스트 + ARTICLE/PARAGRAPH의 title="..." 속성에
// 내용이 흩어져 있다. 효능효과(EE)는 주로 title 속성에 들어있어, 태그만 지우면
// 텍스트가 사라진다. → title 속성값과 본문 텍스트를 모두 합쳐 추출한다.
function stripXml(s: string): string {
  if (!s) return '';
  // ARTICLE/PARAGRAPH의 title 속성(효능효과가 주로 여기 있음)을 먼저 본문화한 뒤 태그 제거
  const withTitles = s.replace(/<[^>]*?\btitle="([^"]*)"[^>]*>/gi, ' $1 ');
  return withTitles
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 800);
}
function mapPermitItem(it: any, fallbackName: string) {
  const eeRaw = it.EE_DOC_DATA || it.eeDocData || '';
  const udRaw = it.UD_DOC_DATA || it.udDocData || '';
  const nbRaw = it.NB_DOC_DATA || it.nbDocData || '';
  console.log(`[permit-doc] EE=${String(eeRaw).length} UD=${String(udRaw).length} NB=${String(nbRaw).length}`);
  const ee = stripXml(String(eeRaw));
  const ud = stripXml(String(udRaw));
  const nb = stripXml(String(nbRaw));
  if (!ee && !ud && !nb && !(it.ITEM_NAME || it.itemName)) return null;
  return {
    itemName: it.ITEM_NAME || it.itemName || fallbackName,
    itemSeq: it.ITEM_SEQ || it.itemSeq || null,
    efcyQesitm: ee || null,
    useMethodQesitm: ud || null,
    atpnQesitm: nb || null,
    intrcQesitm: null,
    _confidence: 0.85,
  };
}
async function lookupPermit(noDose: string, core: string) {
  if (!DATA_GO_KR_KEY) return null;
  const names = [...new Set([noDose, core].filter((v) => v && v.length >= 2))];
  for (const base of PERMIT_ENDPOINTS) {
    let endpointValid = false;
    for (const name of names) {
      const u = `${base}?serviceKey=${DATA_GO_KR_KEY}&type=json&numOfRows=3&pageNo=1&item_name=${encodeURIComponent(name)}`;
      try {
        const res = await fetch(u);
        const raw = await res.text();
        console.log(`[permit] op=${base.split('/').pop()} name="${name}" status=${res.status} body=${raw.slice(0, 280)}`);
        if (res.status === 404) break;        // 이 엔드포인트 자체가 없음 → 다음 후보 base
        endpointValid = true;
        if (!res.ok) continue;
        let data: any;
        try { data = JSON.parse(raw); } catch { continue; }
        let items = data?.body?.items;
        if (items && !Array.isArray(items)) items = items.item ? [].concat(items.item) : [];
        if (Array.isArray(items) && items.length) {
          const it = items[0];
          console.log(`[permit-item] keys=${Object.keys(it).join('|')}`);
          const mapped = mapPermitItem(it, name);
          if (mapped) return mapped;
        }
      } catch (e) {
        console.log(`[permit] op=${base.split('/').pop()} name="${name}" error=${String(e).slice(0, 120)}`);
      }
    }
    if (endpointValid) break; // 동작하는 엔드포인트를 찾았으면(결과 0건이어도) 다른 후보는 시도 안 함
  }
  return null;
}

// ── utils ─────────────────────────────────────────────
function base64Encode(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), {
    status: s,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}
