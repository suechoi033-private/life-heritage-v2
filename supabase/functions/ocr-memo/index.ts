// =============================================================
// Supabase Edge Function: ocr-memo (손글씨 케어 메모 판독)
//
// ⚠️ 이 함수는 아직 배포되지 않았습니다. **창업자가 직접 배포해야 합니다.**
//    (README.md 참고)
//
// 배경: 타이핑이 어려운 보호자(예: 치매 배우자를 돌보며 매일 수기 메모를
//       작성하시는 어르신)가 메모를 사진으로 찍으면, 글자를 옮겨 적어
//       케어링 기록의 칸을 자동으로 채워준다. 사용자는 확인 후 [저장]만 누른다.
//
// 동작:
//   1) 호출자 JWT 검증 (ANTHROPIC 키 남용 방지)
//   2) 요청 본문의 base64 이미지를 Claude Vision으로 판독
//   3) 손글씨 원문(transcription)을 그대로 옮기고, 내용을 케어 기록 칸으로 분류
//   4) JSON 반환 — DB·스토리지에 아무것도 저장하지 않는다(전사만 수행).
//
// 요청: POST { image: base64(no prefix), media_type: "image/jpeg" }
// 응답: { ok: true, transcription: string, fields: {...} } | { error }
//
// 배포: supabase functions deploy ocr-memo
// 필요 시크릿(수동 설정): ANTHROPIC_API_KEY  (Claude Vision)
//   SUPABASE_URL, SUPABASE_ANON_KEY 는 자동 주입.
//
// ※ 의학적 판단이 아니라 글자 옮겨적기(전사)다. 내용을 지어내지 않는다.
// =============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || '';
const SUPPORTED_IMG = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders() });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);
  if (!ANTHROPIC_API_KEY) return json({ error: 'ANTHROPIC_API_KEY not configured' }, 500);

  // 1) 호출자 인증
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return json({ error: 'unauthorized' }, 401);

  const url = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const authClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: userData, error: userErr } = await authClient.auth.getUser();
  if (userErr || !userData?.user) return json({ error: 'unauthorized' }, 401);

  // 2) 본문 파싱
  let image = '';
  let mediaType = 'image/jpeg';
  try {
    const body = await req.json();
    image = (body.image || '').replace(/^data:[^;]+;base64,/, '');
    mediaType = body.media_type || 'image/jpeg';
    if (!image) return json({ error: 'image required' }, 400);
  } catch {
    return json({ error: 'invalid body' }, 400);
  }

  if (!SUPPORTED_IMG.includes(mediaType)) {
    return json({ error: '지원하지 않는 이미지 형식입니다. JPEG·PNG로 다시 올려주세요.' }, 400);
  }
  if (image.length > 5_000_000) {
    return json({ error: '사진 용량이 너무 큽니다. 더 작게(또는 다시) 촬영해 올려주세요.' }, 413);
  }

  // 3) Claude Vision 전사 + 분류
  try {
    const result = await extractWithClaude(image, mediaType);
    return json({ ok: true, ...result });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

// ── Claude Vision 전사 + 케어 기록 칸 분류 ─────────────
async function extractWithClaude(b64: string, mediaType: string) {
  const prompt = `이 이미지는 가족을 돌보는 보호자가 손으로 쓴 한국어 "돌봄 일지 메모"입니다.
(예: 치매 어르신을 돌보며 그날의 식사·약·기분·병원·유의할 점을 적은 수기 메모)

당신의 일은 **손글씨를 한 글자도 빠뜨리지 않고 정확히 옮겨 적고(전사), 내용을 칸별로 분류**하는 것입니다.
이것은 누군가의 소중한 기록입니다. 요약하거나 바꿔 쓰지 말고, 적힌 문장을 **그대로** 옮기세요.
의학적 판단·진단·해석을 하지 마세요. 없는 내용을 지어내지 마세요.

다음을 JSON으로만 출력하세요(설명·코드블록 금지):
{
  "transcription": "손글씨 전체 원문을 그대로 옮긴 것",
  "fields": {
    "daily_status": "식사·수면·하루 컨디션·일상 활동 (없으면 null)",
    "medications": "약 복용에 관한 내용 (없으면 null)",
    "emotion": "기분·감정·정서, 하신 말씀 (없으면 null)",
    "hospital_visit": "병원·진료·검사·약 처방 방문 (없으면 null)",
    "cautions": "유의할 점·주의사항·당부 (없으면 null)",
    "nutrition": "영양·식단 관련 (없으면 null)",
    "free_memo": "위 칸에 들어가지 않는 나머지 내용 (없으면 null)"
  }
}

⚠️ 줄바꿈 규칙 (매우 중요):
- 메모에서 줄이 바뀐 곳은 **반드시 실제 줄바꿈(개행)** 으로 표현하세요. (JSON 문자열 안에서는 개행 이스케이프로 출력)
- 줄을 "/", "·", ",", " - " 같은 기호로 **이어붙이지 마세요.** 원래 줄 구조를 그대로 보존합니다.
- transcription과 각 fields 값 모두 동일하게 적용합니다.

분류 규칙:
- 각 칸에는 해당하는 줄을 **원문 그대로**(요약·의역 금지) 옮기되, 여러 줄이면 줄바꿈으로 구분합니다.
- 어느 칸에도 분명히 속하지 않으면 free_memo에 넣습니다. 한 내용을 여러 칸에 중복하지 마세요.
- 분류가 애매하면 억지로 나누지 말고 free_memo에 원문 그대로 모아 둡니다.
- 한국어로 출력합니다. 정말 못 읽는 글자만 […]로 표시하고, 최대한 끝까지 읽으려 노력하세요.
- 글자를 전혀 알아볼 수 없으면 transcription은 "" , fields의 모든 값은 null로 둡니다.`;

  const res = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-8',
      max_tokens: 4096,
      temperature: 0,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: b64 } },
          { type: 'text', text: prompt },
        ],
      }],
    }),
  }, 55000);
  if (!res.ok) throw new Error(`Claude 호출 실패: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const text = (data.content || []).map((c: any) => c.text || '').join('').trim();
  const jsonStr = text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    const m = jsonStr.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('메모 판독 결과 파싱 실패');
    // 줄바꿈을 살리다 문자열 안에 날것의 개행이 들어와 깨지는 경우를 복구
    try {
      parsed = JSON.parse(m[0]);
    } catch {
      parsed = JSON.parse(sanitizeJsonControlChars(m[0]));
    }
  }

  // 정리: fields 값은 문자열 또는 null만 허용
  const FIELD_KEYS = [
    'daily_status', 'medications', 'emotion',
    'hospital_visit', 'cautions', 'nutrition', 'free_memo',
  ];
  const fields: Record<string, string | null> = {};
  const src = parsed.fields || {};
  for (const k of FIELD_KEYS) {
    const v = src[k];
    fields[k] = (typeof v === 'string' && v.trim()) ? v.trim() : null;
  }
  const transcription = typeof parsed.transcription === 'string' ? parsed.transcription.trim() : '';
  return { transcription, fields };
}

// 문자열 값 안에 escape되지 않은 개행/탭이 있으면 이스케이프해 유효 JSON으로 복구
function sanitizeJsonControlChars(s: string): string {
  let out = '';
  let inStr = false;
  let esc = false;
  for (const ch of s) {
    if (esc) { out += ch; esc = false; continue; }
    if (ch === '\\') { out += ch; esc = true; continue; }
    if (ch === '"') { inStr = !inStr; out += ch; continue; }
    if (inStr) {
      if (ch === '\n') { out += '\\n'; continue; }
      if (ch === '\r') { out += '\\r'; continue; }
      if (ch === '\t') { out += '\\t'; continue; }
    }
    out += ch;
  }
  return out;
}

// ── utils ─────────────────────────────────────────────
async function fetchWithTimeout(url: string, opts: RequestInit = {}, ms = 8000): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
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
