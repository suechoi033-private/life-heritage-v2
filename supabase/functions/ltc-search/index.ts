// Supabase Edge Function: ltc-search
// 공공데이터포털 국민건강보험공단 장기요양기관 검색 API CORS 프록시
// API: B550928/searchLtcInsttService02/getBillGreentInsttSearchList02 (XML 응답)
//
// 지역 필터: 텍스트가 아니라 '시도코드(siDoCd)'로 전달해야 API가 필터한다.
// 실제 응답 태그(2026-07 라이브 확인): adminNm(기관명)·siDoCd·siGunGuCd·
//   longTermAdminSym(기관식별)·serviceKind(급여종류)·locTelNo_1/2/3(전화)·detailAddr.
//   ※ 이 오퍼레이션은 등급·정원·현원·시군구명·전체주소는 제공하지 않는다.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const NHIS_API_KEY = Deno.env.get('NHIS_API_KEY') ?? '';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SEARCH_URL =
  'https://apis.data.go.kr/B550928/searchLtcInsttService02/getBillGreentInsttSearchList02';

// 시도명 → 시도코드 (frontend info/nursing-home.html select 값과 1:1)
const SIDO_CODE: Record<string, string> = {
  '서울': '11', '부산': '26', '대구': '27', '인천': '28', '광주': '29',
  '대전': '30', '울산': '31', '세종': '36', '경기': '41', '강원': '42',
  '충북': '43', '충남': '44', '전북': '45', '전남': '46', '경북': '47',
  '경남': '48', '제주': '50',
};
// 코드 → 시도명 (응답에는 시도명 텍스트가 없어 역매핑으로 채운다)
const SIDO_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(SIDO_CODE).map(([k, v]) => [v, k]),
);
// 급여종류 코드 → 라벨 (공단 serviceKind. 확인된 것만, 나머지는 코드 그대로)
const SERVICE_KIND: Record<string, string> = {
  '001': '방문요양', '002': '방문목욕', '003': '방문간호',
  '004': '주야간보호', '005': '단기보호', '006': '노인요양시설',
  '007': '노인요양공동생활가정',
};

function tagAll(xml: string, name: string): string[] {
  const re = new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, 'gi');
  const out: string[] = [];
  let m;
  while ((m = re.exec(xml)) !== null) {
    out.push(m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim());
  }
  return out;
}
function tag(src: string, name: string): string {
  const m = src.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i'));
  return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';
}
function unescapeXml(s: string): string {
  return s.replace(/&quot;/g, '"').replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'");
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (!NHIS_API_KEY) return json({ error: 'API_KEY_NOT_CONFIGURED' }, 503);

  let body: Record<string, string> = {};
  try { body = await req.json(); } catch (_) { /* empty body ok */ }

  const sido  = body.sido ?? '';                  // 예: '서울'
  const page  = Math.max(1, parseInt(body.page ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(body.limit ?? '20', 10)));
  const siDoCd = sido ? (SIDO_CODE[sido] ?? '') : '';

  const params = new URLSearchParams({
    serviceKey: NHIS_API_KEY,
    pageNo:     String(page),
    numOfRows:  String(limit),
  });
  // 지역 필터는 시도코드로. (이 오퍼레이션은 시군구명을 안 주므로 시군구 텍스트 필터는 불가 → 시도 단위)
  if (siDoCd) params.set('siDoCd', siDoCd);

  let text = '';
  let httpStatus = 200;
  try {
    const res = await fetch(`${SEARCH_URL}?${params}`, { signal: AbortSignal.timeout(12_000) });
    httpStatus = res.status;
    text = await res.text();
    if (!res.ok) {
      return json({ error: 'UPSTREAM_ERROR', status: httpStatus, raw: text.slice(0, 500) }, 502);
    }
  } catch (err) {
    return json({ error: 'UPSTREAM_TIMEOUT', message: String(err) }, 502);
  }

  const totalCount = parseInt(tag(text, 'totalCount') || '0', 10);
  const blocks = tagAll(text, 'item');

  const items = blocks.map((b) => {
    const telParts = [tag(b, 'locTelNo_1'), tag(b, 'locTelNo_2'), tag(b, 'locTelNo_3')].filter(Boolean);
    const kindCd = tag(b, 'serviceKind');
    const sidoCd = tag(b, 'siDoCd');
    return {
      id:      tag(b, 'longTermAdminSym') || tag(b, 'ykiho'),
      name:    unescapeXml(tag(b, 'adminNm') || tag(b, 'lonpaTermCrInsttNm')),
      type:    SERVICE_KIND[kindCd] || (kindCd ? `급여종류 ${kindCd}` : ''),
      grade:   '',                                   // 이 오퍼레이션 미제공
      sido:    SIDO_NAME[sidoCd] || '',
      sigungu: '',                                   // 코드만 있고 이름 없음
      addr:    unescapeXml(tag(b, 'detailAddr')),
      tel:     telParts.join('-'),
      capacity: null as number | null,               // 미제공
      current:  null as number | null,               // 미제공
      vacancy:  null as number | null,               // 미제공
      dementiaRoom: false,                           // 미제공
      evalDate: '',                                  // 미제공
    };
  });

  let out = items;
  // 등급/치매/공실 필터는 이 오퍼레이션이 데이터를 안 줘서 적용 시 전부 제외됨 → 무시(경고는 응답에).
  const unsupported: string[] = [];
  if (body.grade === 'ab')   unsupported.push('grade');
  if (body.dementia === 'true') unsupported.push('dementia');
  if (body.vacancy === 'true')  unsupported.push('vacancy');

  const payload: Record<string, unknown> = {
    ok: true,
    total: totalCount,
    page,
    items: out,
  };
  if (unsupported.length) payload.unsupportedFilters = unsupported;
  if (body.debug) {
    payload.debug = {
      sentSiDoCd: siDoCd || null,
      upstreamStatus: httpStatus,
      upstreamTotalCount: totalCount,
      itemCount: items.length,
      firstItem: items[0] ?? null,
    };
  }

  return json(payload);
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
