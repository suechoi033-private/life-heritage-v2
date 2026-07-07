// Supabase Edge Function: ltc-search
// 공공데이터포털 국민건강보험공단 장기요양기관 검색 API CORS 프록시
// API: B550928/searchLtcInsttService02 (XML 응답)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const NHIS_API_KEY = Deno.env.get('NHIS_API_KEY') ?? '';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Service02 — 데이터포맷 XML, 오퍼레이션명 확인 필요
const SEARCH_URL =
  'https://apis.data.go.kr/B550928/searchLtcInsttService02/getBillGreentInsttSearchList02';

// 공단 장기요양기관 검색 API는 지역을 텍스트가 아니라 '시도코드(siDoCd)'로 받는다.
// 텍스트('서울')를 넘기면 필터가 무시된다 → 아래 표준 시도 2자리 코드로 변환한다.
// (frontend info/nursing-home.html 의 시도 select 값과 1:1)
const SIDO_CODE: Record<string, string> = {
  '서울': '11', '부산': '26', '대구': '27', '인천': '28', '광주': '29',
  '대전': '30', '울산': '31', '세종': '36', '경기': '41', '강원': '42',
  '충북': '43', '충남': '44', '전북': '45', '전남': '46', '경북': '47',
  '경남': '48', '제주': '50',
};

// XML 응답 → JS 객체 변환
function parseXml(xml: string): { totalCount: number; items: Record<string, string>[] } {
  const tag = (name: string, src = xml) => {
    const m = src.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i'));
    if (!m) return '';
    return m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim();
  };

  const totalCount = parseInt(tag('totalCount') || '0', 10);

  const blocks: string[] = [];
  const re = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) blocks.push(m[1]);

  const items = blocks.map(b => {
    const f = (name: string) => tag(name, b);
    return {
      lonpaTermCrInsttNm: f('lonpaTermCrInsttNm') || f('insttNm') || f('yadmNm') || f('orgNm'),
      lonpaTermCrTypNm:   f('lonpaTermCrTypNm')   || f('ltcTypeNm') || f('clCd'),
      lonpaTermCrGrDivCd: f('lonpaTermCrGrDivCd') || f('evalGrd')   || f('evalGrade'),
      sido:    f('sido')    || f('sidoNm'),
      sigungu: f('sigungu') || f('sgguNm'),
      addr:    f('addr')    || f('addrNew') || f('clAddr'),
      telno:   f('telno')   || f('tel')     || f('clTel'),
      scntCnt:    f('scntCnt')    || f('totScnt') || f('cpcty') || f('accpCpcty'),
      curScntCnt: f('curScntCnt') || f('curInpatCnt') || f('scnt'),
      ykiho:      f('ykiho')      || f('insttCd')    || f('lonpaTermCrInsttCd'),
      lonpaTermCrInsttCd: f('lonpaTermCrInsttCd'),
      mslGrdDivCd: f('mslGrdDivCd') || f('dmntYn') || f('dementiaYn') || f('dntCmplxYn'),
      evalDe:  f('evalDe') || f('evalYear'),
    };
  });

  return { totalCount, items };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (!NHIS_API_KEY) {
    return json({ error: 'API_KEY_NOT_CONFIGURED' }, 503);
  }

  let body: Record<string, string> = {};
  try { body = await req.json(); } catch (_) { /* empty body ok */ }

  const sido    = body.sido    ?? '';   // 예: '서울'
  const sigungu = body.sigungu ?? '';   // 예: '강남구'
  const page    = Math.max(1, parseInt(body.page  ?? '1',  10));
  const reqLimit = Math.min(100, Math.max(1, parseInt(body.limit ?? '20', 10)));
  // 시군구는 코드 대신 응답 텍스트로 클라이언트 필터한다(코드표 250여개 추측 회피).
  // 시군구 필터가 있으면 넉넉히 받아 필터 후 잘라낸다.
  const limit = sigungu ? 100 : reqLimit;

  const siDoCd = sido ? (SIDO_CODE[sido] ?? '') : '';

  const params = new URLSearchParams({
    serviceKey: NHIS_API_KEY,
    pageNo:     String(page),
    numOfRows:  String(limit),
  });
  // 지역 필터: API는 시도코드(siDoCd)를 요구. 시군구는 응답에서 텍스트로 거른다.
  if (siDoCd) params.set('siDoCd', siDoCd);

  let text = '';
  let httpStatus = 200;
  try {
    const res = await fetch(`${SEARCH_URL}?${params}`, {
      signal: AbortSignal.timeout(12_000),
    });
    httpStatus = res.status;
    text = await res.text();
    if (!res.ok) {
      return json({ error: 'UPSTREAM_ERROR', status: httpStatus, raw: text.slice(0, 500) }, 502);
    }
  } catch (err) {
    return json({ error: 'UPSTREAM_TIMEOUT', message: String(err) }, 502);
  }

  // JSON 또는 XML 파싱
  let totalCount = 0;
  let rawItems: Record<string, string>[] = [];

  if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(text) as Record<string, unknown>;
      const bd = (parsed?.response as Record<string, unknown>)?.body
              ?? (parsed?.body as Record<string, unknown>)
              ?? {} as Record<string, unknown>;
      totalCount = parseInt((bd as Record<string, unknown>)?.totalCount as string ?? '0', 10);
      let ri = (bd as Record<string, unknown>)?.items?.item
            ?? (bd as Record<string, unknown>)?.items ?? [];
      if (!Array.isArray(ri)) ri = ri ? [ri] : [];
      rawItems = ri as Record<string, string>[];
    } catch (_) { /* fall through */ }
  } else {
    const parsed = parseXml(text);
    totalCount = parsed.totalCount;
    rawItems   = parsed.items;
  }

  const items = rawItems.map((it) => {
    const capacity = parseInt(String(it.scntCnt    ?? it.totScnt ?? it.cpcty ?? it.accpCpcty ?? '0'), 10);
    const current  = parseInt(String(it.curScntCnt ?? it.curInpatCnt ?? it.scnt ?? '0'), 10);
    return {
      id:           String(it.ykiho ?? it.insttCd ?? it.lonpaTermCrInsttCd ?? ''),
      name:         String(it.lonpaTermCrInsttNm ?? it.insttNm ?? it.yadmNm ?? it.orgNm ?? ''),
      type:         String(it.lonpaTermCrTypNm   ?? it.ltcTypeNm ?? it.clCd  ?? ''),
      grade:        String(it.lonpaTermCrGrDivCd ?? it.evalGrd   ?? it.evalGrade ?? ''),
      sido:         String(it.sido    ?? it.sidoNm  ?? ''),
      sigungu:      String(it.sigungu ?? it.sgguNm  ?? ''),
      addr:         String(it.addr    ?? it.addrNew ?? it.clAddr  ?? ''),
      tel:          String(it.telno   ?? it.tel     ?? it.clTel   ?? ''),
      capacity,
      current,
      vacancy:      capacity > 0 ? Math.max(0, capacity - current) : null,
      dementiaRoom: !!(it.mslGrdDivCd ?? it.dmntYn ?? it.dementiaYn ?? it.dntCmplxYn),
      evalDate:     String(it.evalDe  ?? it.evalYear ?? ''),
    };
  });

  let out = items;
  // 시군구는 코드가 아니라 응답 텍스트(시군구명 또는 주소)로 필터
  if (sigungu) {
    out = out.filter(i =>
      (i.sigungu && i.sigungu.includes(sigungu)) ||
      (i.addr && i.addr.includes(sigungu))
    );
  }
  if (body.grade    === 'ab')   out = out.filter(i => /^[AB]/i.test(i.grade));
  if (body.dementia === 'true') out = out.filter(i => i.dementiaRoom);
  if (body.vacancy  === 'true') out = out.filter(i => (i.vacancy ?? 0) > 0);

  // 시군구 필터 시 클라이언트에서 잘라내므로 요청 limit로 제한
  const sliced = sigungu ? out.slice(0, reqLimit) : out;

  const payload: Record<string, unknown> = {
    ok: true,
    total: totalCount,
    page,
    items: sliced,
  };
  // self-verifying: 사장님 첫 테스트가 곧 검증. ?debug=1 일 때만 진단 노출.
  if (body.debug) {
    payload.debug = {
      sentSiDoCd: siDoCd || null,
      sidoText: sido || null,
      sigunguText: sigungu || null,
      upstreamStatus: httpStatus,
      upstreamTotalCount: totalCount,
      rawItemCount: rawItems.length,
      afterSigunguFilter: sigungu ? out.length : null,
      firstItemRegion: items[0] ? { sido: items[0].sido, sigungu: items[0].sigungu, addr: items[0].addr } : null,
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
