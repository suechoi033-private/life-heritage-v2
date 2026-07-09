// Supabase Edge Function: ltc-search
// 국민건강보험공단 장기요양기관 검색 프록시 (공공데이터포털 B550928)
//
// [2026-07 재작성 — 지역 필터 미작동 근본 수정]
// 실측으로 확정한 사실 (docs/worklog.md 2026-07-08):
//  · 올바른 오퍼레이션: searchLtcInsttService02/getLtcInsttSeachList02
//    ("Seach" — 공식 API 오타 그대로. getBillGreentInsttSearchList02는
//     전국 80건짜리 특수 목록이라 검색용이 아님)
//  · 지역 파라미터: siDoCd(법정동 시도 2자리, 신코드: 강원 51·전북 52),
//    siGunGuCd(법정동 시군구 3자리). 한글명(sido=서울)은 조용히 무시됨.
//  · 응답(_type=json): adminNm, adminPttnCd(급여유형), longTermAdminSym(기관기호),
//    siDoCd, siGunGuCd, stpRptDt. 주소·전화·정원은 이 리스트엔 없음 —
//    "시설별 상세조회 서비스"(15058856) 활용신청 후 detail 보강 가능(403이면 스킵).
//  · 같은 기관이 급여유형별 중복 행으로 옴 → longTermAdminSym 기준 병합.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const NHIS_API_KEY = Deno.env.get('NHIS_API_KEY') ?? '';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LIST_URL =
  'https://apis.data.go.kr/B550928/searchLtcInsttService02/getLtcInsttSeachList02';
// 시설별 상세(주소·전화·정원) — 활용신청 전이면 403이라 자동 스킵
const DETAIL_GENERAL_URL =
  'https://apis.data.go.kr/B550928/getLtcInsttDetailInfoService02/getGeneralSttusDetailInfoItem02';

// 급여유형 코드 → 라벨.
// 실측 확정: C 계열 = 재가급여 (C01 방문요양 · C02 방문목욕 · C06 복지용구 관측).
// 시설급여(요양원) 코드는 문서 미확보 — C가 아닌 코드를 시설로 판정(코드표 몰라도 견고).
// 미등록 코드는 계열 기본 라벨로 표시.
const PTTN_LABEL: Record<string, string> = {
  C01: '방문요양',
  C02: '방문목욕',
  C03: '방문간호',
  C04: '주야간보호',
  C05: '단기보호',
  C06: '복지용구',
};
const isHomeCareCd = (c: string) => c.startsWith('C');
const labelFor = (c: string) => PTTN_LABEL[c] ?? (isHomeCareCd(c) ? '재가급여' : '시설급여(요양원)');

type ListItem = {
  adminNm?: string; adminPttnCd?: string; longTermAdminSym?: number | string;
  siDoCd?: number | string; siGunGuCd?: number | string; stpRptDt?: number | string;
};

async function fetchList(params: URLSearchParams): Promise<{ total: number; items: ListItem[] }> {
  const res = await fetch(`${LIST_URL}?${params}`, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`UPSTREAM_${res.status}`);
  const parsed = JSON.parse(await res.text());
  const body = parsed?.response?.body ?? {};
  let items = body?.items?.item ?? [];
  if (!Array.isArray(items)) items = items ? [items] : [];
  return { total: parseInt(String(body?.totalCount ?? '0'), 10), items };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (!NHIS_API_KEY) return json({ error: 'API_KEY_NOT_CONFIGURED' }, 503);

  let body: Record<string, string> = {};
  try { body = await req.json(); } catch (_) { /* empty ok */ }

  // 프론트가 법정동 코드를 직접 보냄 (숫자만 통과 — 인젝션 방어)
  const siDoCd    = /^\d{2}$/.test(body.siDoCd ?? '')    ? body.siDoCd    : '';
  const siGunGuCd = /^\d{3}$/.test(body.siGunGuCd ?? '') ? body.siGunGuCd : '';
  const type  = body.type === 'home_care' ? 'home_care' : 'nursing_home';
  const name  = (body.name ?? '').trim().slice(0, 40);
  const page  = Math.max(1, parseInt(body.page ?? '1', 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(body.limit ?? '30', 10) || 30));

  if (!siDoCd) return json({ error: 'SIDO_REQUIRED' }, 400);

  // 시군구 단위면 한 번에 다 받고(최대 2000행), 시도 전체면 상한까지만 받아 정직하게 표기
  const fetchRows = siGunGuCd ? 2000 : 3000;
  const params = new URLSearchParams({
    serviceKey: NHIS_API_KEY,
    numOfRows: String(fetchRows),
    pageNo: '1',
    _type: 'json',
    siDoCd,
  });
  if (siGunGuCd) params.set('siGunGuCd', siGunGuCd);
  if (name) params.set('adminNm', name);

  let total = 0;
  let raw: ListItem[] = [];
  try {
    ({ total, items: raw } = await fetchList(params));
  } catch (err) {
    return json({ error: 'UPSTREAM_ERROR', message: String(err) }, 502);
  }

  // 기관 단위 병합 (급여유형별 중복 행 → 한 기관에 유형 배열)
  const bySym = new Map<string, { name: string; sym: string; siDoCd: string; siGunGuCd: string; pttn: string[]; since: string }>();
  for (const it of raw) {
    const sym = String(it.longTermAdminSym ?? '');
    if (!sym) continue;
    const cur = bySym.get(sym) ?? {
      name: String(it.adminNm ?? ''), sym,
      siDoCd: String(it.siDoCd ?? ''), siGunGuCd: String(it.siGunGuCd ?? ''),
      pttn: [], since: String(it.stpRptDt ?? ''),
    };
    const cd = String(it.adminPttnCd ?? '');
    if (cd && !cur.pttn.includes(cd)) cur.pttn.push(cd);
    bySym.set(sym, cur);
  }

  // 유형 필터: 요양원 = 시설급여(비 C계열) 보유 기관, 재가 = C 계열 보유 기관
  const wantFacility = type === 'nursing_home';
  const merged = [...bySym.values()].filter((f) =>
    wantFacility
      ? f.pttn.some((c) => !isHomeCareCd(c))
      : f.pttn.some((c) => isHomeCareCd(c)),
  );

  merged.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  const pageItems = merged.slice((page - 1) * limit, (page - 1) * limit + limit);

  // 상세 보강 (활용신청 완료 시 자동 활성 — 403이면 조용히 리스트만)
  let detailEnabled = false;
  const details = await Promise.all(pageItems.map(async (f) => {
    try {
      const p = new URLSearchParams({ serviceKey: NHIS_API_KEY, longTermAdminSym: f.sym, _type: 'json' });
      const res = await fetch(`${DETAIL_GENERAL_URL}?${p}`, { signal: AbortSignal.timeout(8_000) });
      if (!res.ok) return null;
      const parsed = JSON.parse(await res.text());
      const b = parsed?.response?.body ?? {};
      return b?.item ?? b?.items?.item ?? null;
    } catch (_) { return null; }
  }));
  detailEnabled = details.some((d) => d);

  const items = pageItems.map((f, i) => {
    const d = (details[i] ?? {}) as Record<string, unknown>;
    return {
      id: f.sym,
      name: f.name,
      types: [...new Set(f.pttn.map(labelFor))],
      isFacility: f.pttn.some((c) => !isHomeCareCd(c)),
      siDoCd: f.siDoCd,
      siGunGuCd: f.siGunGuCd,
      since: f.since ? String(f.since).replace(/^(\d{4})(\d{2})(\d{2})$/, '$1.$2.$3') : '',
      addr: String(d.locAddr ?? d.addr ?? ''),
      tel:  String(d.locTelNo ?? d.telNo ?? ''),
      capacity: parseInt(String(d.aceptncNmpr ?? d.entrncNmpr ?? '0'), 10) || null,
    };
  });

  return json({
    ok: true,
    total,                       // 업스트림 원본 행수(급여유형 중복 포함)
    matched: merged.length,      // 병합·유형필터 후 기관 수 — UI 표기는 이 값
    truncated: raw.length >= fetchRows, // 상한 도달 → "시군구를 좁혀보세요" 안내용
    page, limit,
    detailEnabled,               // false면 주소·전화 미표기 (활용신청 대기)
    items,
  });
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
