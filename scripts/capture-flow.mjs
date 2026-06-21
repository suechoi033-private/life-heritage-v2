// 잇다 (b) 한 코드 두 얼굴 — 비회원 유저 플로우 자동 캡쳐.
// 외부 호출(CDN·Supabase) 차단 환경에서 mock 응답으로 페이지 렌더 후 캡쳐.
//
// 사용법:
//   1) 로컬 정적 서버 띄우기: (워크스페이스 루트에서)
//        python3 -m http.server 8765 > /tmp/itda-http.log 2>&1 &
//   2) 본 스크립트 실행:
//        node scripts/capture-flow.mjs
//   3) 결과: /tmp/itda-flow-screenshots/*.png (9장)
//
// 슬래시 커맨드: `/show-flow` (`.claude/commands/show-flow.md`)
// 캡쳐 화면:
//   01 index-guest         — 비회원 홈 (두 카드)
//   02 will-start          — 카드 1 클릭 (한 줄 적기)
//   03 care-start          — 카드 2 클릭 (안부 한 줄)
//   04 signup-will         — 가입 게이트
//   05 welcome             — 환영 5-step (회원 mock)
//   06 will-typed          — 한 줄 적은 상태
//   07 signup-will-full    — 가입 게이트 (full page)
//   08 welcome-step1       — 회원 환영 (full)
//   09 reflection          — reflection 시리즈 step 2 자연 진입
//
// 변경하려면: `PAGES` 배열에 페이지 추가/수정.

// Playwright 모듈 — node_modules 없는 환경에서는 글로벌 경로 fallback
let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch (_) {
  try {
    ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs'));
  } catch (_) {
    ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.js'));
  }
}

const ROOT = process.env.ITDA_BASE_URL || 'http://localhost:8765';
const OUT  = process.env.ITDA_SCREENSHOT_DIR || '/tmp/itda-flow-screenshots';
const VIEWPORT = { width: 390, height: 844 };

const FAKE_USER = {
  id: '00000000-0000-0000-0000-000000000099',
  email: 'sue.choi033+test@gmail.com',
  user_metadata: { name: '수련' },
};

const FAKE_QUESTIONS = [
  { id: 'q1', series_key: 'not_waking_tomorrow', series_step: 1, series_branch: null,
    question_text: '내일 다시 못 깨어난다면, 가장 후회할 일은?' },
  { id: 'q2', series_key: 'not_waking_tomorrow', series_step: 2, series_branch: null,
    question_text: '그 답에서 떠오른 건 — 사람인가요, 하고 싶은 일인가요?' },
  { id: 'q3', series_key: 'not_waking_tomorrow', series_step: 3, series_branch: 'person',
    question_text: '떠오른 그 사람은 누구인가요?' },
];

// 비회원 stub
const STUB_GUEST = `
const noSession = { data: { session: null }, error: null };
const noData = { data: [], error: null };
const noRow = { data: null, error: null };
const stubFrom = () => new Proxy({}, { get(_t, prop) {
  if (prop === 'then') return undefined;
  if (prop === 'maybeSingle' || prop === 'single') return async () => noRow;
  return (..._a) => stubFrom();
}});
export const createClient = () => ({
  auth: {
    getSession: async () => noSession,
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signOut: async () => ({ error: null }),
    signUp: async () => ({ data: { user: ${JSON.stringify(FAKE_USER)}, session: null }, error: null }),
  },
  from: stubFrom, rpc: async () => noData, functions: { invoke: async () => noData },
  channel: () => ({ on: () => ({ on: () => ({ subscribe: () => ({}) }), subscribe: () => ({}) }), unsubscribe: () => {} }),
  removeChannel: () => {},
});
`;

// 가입자 stub (welcome, reflection)
const STUB_USER = `
const FAKE_USER = ${JSON.stringify(FAKE_USER)};
const FAKE_SESSION = { user: FAKE_USER, access_token: 'fake' };
const session = { data: { session: FAKE_SESSION }, error: null };
const QUESTIONS = ${JSON.stringify(FAKE_QUESTIONS)};
const ANSWERS = ${JSON.stringify([{ user_id: FAKE_USER.id, question_id: 'q1',
  content: '엄마한테 잘 못한 거. 더 자주 안부 못한 거.', visibility: 'private',
  created_at: '2026-06-21T14:00:00Z' }])};

function makeQuery(rows) {
  let filtered = rows.slice();
  const proxy = new Proxy({}, {
    get(_t, prop) {
      if (prop === 'then') return (res) => res({ data: filtered, error: null });
      if (prop === 'maybeSingle' || prop === 'single') return async () => ({ data: filtered[0] || null, error: null });
      if (prop === 'eq') return (col, val) => { filtered = filtered.filter(r => r[col] === val); return proxy; };
      if (prop === 'in') return (col, vals) => { filtered = filtered.filter(r => vals.includes(r[col])); return proxy; };
      if (prop === 'order' || prop === 'limit' || prop === 'select' || prop === 'is'
          || prop === 'gte' || prop === 'lte' || prop === 'insert' || prop === 'upsert'
          || prop === 'update' || prop === 'delete') return () => proxy;
      return () => proxy;
    }
  });
  return proxy;
}
export const createClient = () => ({
  auth: {
    getSession: async () => session,
    getUser: async () => ({ data: { user: FAKE_USER }, error: null }),
    onAuthStateChange: (cb) => { cb('SIGNED_IN', FAKE_SESSION); return { data: { subscription: { unsubscribe: () => {} } } }; },
    signOut: async () => ({ error: null }),
    updateUser: async () => ({ data: { user: FAKE_USER }, error: null }),
  },
  from: (table) => {
    if (table === 'daily_questions') return makeQuery(QUESTIONS);
    if (table === 'daily_answers')   return makeQuery(ANSWERS);
    if (table === 'profiles')        return makeQuery([{ id: FAKE_USER.id, entry_path: 'will', name: '수련' }]);
    return makeQuery([]);
  },
  rpc: async () => ({ data: [], error: null }),
  functions: { invoke: async () => ({ data: [], error: null }) },
  channel: () => ({ on: () => ({ on: () => ({ subscribe: () => ({}) }), subscribe: () => ({}) }), unsubscribe: () => {} }),
  removeChannel: () => {},
});
`;

// 캡쳐 페이지 정의
const PAGES = [
  // 비회원 흐름
  { id: '01-index-guest',    url: '/index.html',                          stub: 'guest', label: '비회원 홈 (두 카드)' },
  { id: '02-will-start',     url: '/will-start.html',                     stub: 'guest', label: '카드 1 → 한 줄 적기' },
  { id: '03-care-start',     url: '/care-start.html',                     stub: 'guest', label: '카드 2 → 안부 한 줄' },
  { id: '04-signup-will',    url: '/signup.html?path=will',               stub: 'guest', label: '가입 게이트 (유언)' },
  { id: '05-welcome-step1',  url: '/welcome.html?path=will',              stub: 'user',  label: 'welcome Step 1 (이름)' },
  // 답 입력 후 흐름
  { id: '06-will-typed',     url: '/will-start.html',                     stub: 'guest', label: '한 줄 적은 상태',
    fill: { '#ws-answer': '엄마한테 잘 못한 거. 더 자주 안부 못한 거.' } },
  { id: '07-signup-will-full', url: '/signup.html?next=%2Fwill-start.html&path=will', stub: 'guest', label: '가입 게이트 full', fullPage: true },
  // welcome 5-step 위저드 진행
  { id: '08-welcome-step2',  url: '/welcome.html?path=will',              stub: 'user',  label: 'welcome Step 2 (자리 선택)',
    actions: [
      { fill: { '#display-name': '수련' } },
      { click: '#step1-next' },
      { wait: 500 },
    ]},
  { id: '09-welcome-step3',  url: '/welcome.html?path=will',              stub: 'user',  label: 'welcome Step 3 (첫걸음 추천)',
    actions: [
      { fill: { '#display-name': '수련' } },
      { click: '#step1-next' },
      { wait: 300 },
      { click: '.choice[data-place="reflect"]' },
      { wait: 200 },
      { click: '#step2-next' },
      { wait: 500 },
    ]},
  { id: '10-welcome-step4',  url: '/welcome.html?path=will',              stub: 'user',  label: 'welcome Step 4 (가족 초대)',
    actions: [
      { fill: { '#display-name': '수련' } },
      { click: '#step1-next' }, { wait: 300 },
      { click: '.choice[data-place="reflect"]' }, { wait: 200 },
      { click: '#step2-next' }, { wait: 300 },
      { click: '#step3-next' }, { wait: 500 },
    ]},
  { id: '11-welcome-step5',  url: '/welcome.html?path=will',              stub: 'user',  label: 'welcome Step 5 (잇다 시작)',
    actions: [
      { fill: { '#display-name': '수련' } },
      { click: '#step1-next' }, { wait: 300 },
      { click: '.choice[data-place="reflect"]' }, { wait: 200 },
      { click: '#step2-next' }, { wait: 300 },
      { click: '#step3-next' }, { wait: 300 },
      { click: '#finish-onboarding' }, { wait: 500 },
    ]},
  // 시리즈 진입
  { id: '12-reflection',     url: '/reflection.html',                     stub: 'user',  label: 'reflection 시리즈 step 2 자연 진입', fullPage: true },
];

async function setupMocks(page, stubKind) {
  const stubBody = stubKind === 'user' ? STUB_USER : STUB_GUEST;
  await page.route('**/cdn.jsdelivr.net/**', (route) => {
    if (route.request().url().includes('supabase-js')) {
      return route.fulfill({ status: 200, contentType: 'application/javascript; charset=utf-8', body: stubBody });
    }
    return route.abort();
  });
  await page.route('**/esm.sh/**', (route) => route.abort());
  await page.route('**/*.supabase.co/**', (route) => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify({ data: [], error: null }),
  }));
}

async function main() {
  // 출력 폴더 준비
  const fs = await import('node:fs');
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    locale: 'ko-KR',
  });

  for (const p of PAGES) {
    const page = await context.newPage();
    await setupMocks(page, p.stub);
    page.on('pageerror', (err) => console.log(`[${p.id}] pageerror:`, err.message));
    try {
      await page.goto(`${ROOT}${p.url}`, { waitUntil: 'load', timeout: 8000 });
    } catch (e) {
      console.log(`[${p.id}] goto fallback:`, e.message);
    }
    await page.waitForTimeout(1200);
    if (p.fill) {
      for (const [sel, val] of Object.entries(p.fill)) {
        try { await page.fill(sel, val); } catch (_) {}
      }
      await page.waitForTimeout(300);
    }
    if (Array.isArray(p.actions)) {
      for (const step of p.actions) {
        if (step.fill) {
          for (const [sel, val] of Object.entries(step.fill)) {
            try { await page.fill(sel, val); } catch (e) { console.log(`[${p.id}] fill fail ${sel}`, e.message); }
          }
        }
        if (step.click) {
          try { await page.click(step.click, { timeout: 3000 }); } catch (e) { console.log(`[${p.id}] click fail ${step.click}`, e.message); }
        }
        if (step.wait) await page.waitForTimeout(step.wait);
      }
    }
    await page.screenshot({ path: `${OUT}/${p.id}.png`, fullPage: !!p.fullPage });
    console.log(`✅ ${p.id} — ${p.label}`);
    await page.close();
  }

  await browser.close();
  console.log(`\n📂 결과: ${OUT}/`);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
