// Supabase Edge Function: ltc-search
// 공공데이터포털 국민건강보험공단 장기요양기관 검색 API CORS 프록시
//
// 요청: POST { sido, sigungu, grade, dementia, vacancy, page, limit }
// 응답: { ok: true, total, page, items: [...] }
//
// 필요 시크릿:
//   NHIS_API_KEY — data.go.kr > B550928 > 장기요양기관 서비스 신청 후 발급
//
// 배포: supabase functions deploy ltc-search

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const NHIS_API_KEY = Deno.env.get('NHIS_API_KEY') ?? '';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Service01 엔드포인트 — API 문서 확인 후 업데이트 필요
const SEARCH_URL =
  'https://apis.data.go.kr/B550928/searchLtcInsttService01/getLtcInsttSearchList01';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (!NHIS_API_KEY) {
    return json({
      error: 'API_KEY_NOT_CONFIGURED',
      message:
        'Supabase 시크릿 NHIS_API_KEY가 설정되지 않았습니다. ' +
        'data.go.kr에서 장기요양기관 API를 신청하고 ' +
        '`supabase secrets set NHIS_API_KEY=<인증키>`를 실행해 주세요.',
    }, 503);
  }

  let body: Record<string, string> = {};
  try { body = await req.json(); } catch (_) { /* empty body ok */ }

  const sido    = body.sido    ?? '';
  const sigungu = body.sigungu ?? '';
  const page    = Math.max(1, parseInt(body.page  ?? '1',  10));
  const limit   = Math.min(100, Math.max(1, parseInt(body.limit ?? '20', 10)));

  const params = new URLSearchParams({
    serviceKey:  NHIS_API_KEY,
    pageNo:      String(page),
    numOfRows:   String(limit),
    resultType:  'json',
  });
  if (sido)    params.set('sido', sido);
  if (sigungu) params.set('sigungu', sigungu);

  let raw: unknown;
  let httpStatus = 200;
  try {
    const res = await fetch(`${SEARCH_URL}?${params}`, {
      signal: AbortSignal.timeout(12_000),
    });
    httpStatus = res.status;
    const text = await res.text();
    try { raw = JSON.parse(text); } catch (_) { raw = text; }
    // HTTP 에러면 raw 응답 그대로 반환해 디버깅
    if (!res.ok) {
      return json({ error: 'UPSTREAM_ERROR', status: httpStatus, raw }, 502);
    }
  } catch (err) {
    return json({ error: 'UPSTREAM_TIMEOUT', message: String(err) }, 502);
  }

  // 공공데이터포털 표준 응답 언패킹
  const bd = (raw as Record<string, unknown>)?.response?.body
          ?? (raw as Record<string, unknown>)?.body
          ?? {} as Record<string, unknown>;

  const total = parseInt((bd as Record<string, unknown>)?.totalCount as string ?? '0', 10);
  let rawItems = (bd as Record<string, unknown>)?.items?.item
              ?? (bd as Record<string, unknown>)?.items
              ?? [];
  if (!Array.isArray(rawItems)) rawItems = rawItems ? [rawItems] : [];

  // 필드명 정규화 — API 문서가 로그인 후 열람이라 복수 후보로 대응
  const items = (rawItems as Record<string, unknown>[]).map((it) => {
    const capacity = parseInt(
      (it.scntCnt ?? it.totScnt ?? it.cpcty ?? it.accpCpcty ?? '0') as string, 10,
    );
    const current = parseInt(
      (it.curScntCnt ?? it.curInpatCnt ?? it.scnt ?? '0') as string, 10,
    );
    return {
      id:           String(it.ykiho    ?? it.insttCd  ?? it.lonpaTermCrInsttCd ?? it.idx ?? ''),
      name:         String(it.lonpaTermCrInsttNm ?? it.insttNm ?? it.yadmNm ?? it.orgNm ?? ''),
      type:         String(it.lonpaTermCrTypNm   ?? it.ltcTypeNm ?? it.clCd  ?? ''),
      grade:        String(it.lonpaTermCrGrDivCd ?? it.evalGrd  ?? it.evalGrade ?? ''),
      sido:         String(it.sido    ?? it.sidoNm  ?? ''),
      sigungu:      String(it.sigungu ?? it.sgguNm  ?? ''),
      addr:         String(it.addr    ?? it.addrNew ?? it.clAddr ?? ''),
      tel:          String(it.telno   ?? it.tel    ?? it.clTel  ?? ''),
      capacity,
      current,
      vacancy:      capacity > 0 ? Math.max(0, capacity - current) : null,
      dementiaRoom: !!(it.mslGrdDivCd ?? it.dmntYn ?? it.dementiaYn ?? it.dntCmplxYn),
      evalDate:     String(it.evalDe  ?? it.evalYear ?? ''),
    };
  });

  // 서버 측 후처리 필터 (API가 지원 안 할 경우 대비)
  let out = items;
  if (body.grade === 'ab') out = out.filter(i => /^[AB]/i.test(i.grade));
  if (body.dementia === 'true') out = out.filter(i => i.dementiaRoom);
  if (body.vacancy  === 'true') out = out.filter(i => (i.vacancy ?? 0) > 0);

  return json({ ok: true, total, page, items: out });
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
