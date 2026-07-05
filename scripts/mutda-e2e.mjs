// 묻다 e2e — 핵심 플로우 검증
// 랜딩 → 로그인 → 온보딩 → 홈 → 유언장 위저드 → 편지 → 유품 → 안부확인 → 커뮤니티 → 나
//
// 이 샌드박스는 이그레스 정책상 cdn.jsdelivr.net / supabase.co 접근이 막혀 있어,
// supabase-js CDN import를 실제 DB 스키마를 내장한 스텁(mutda-supabase-stub.mjs)으로
// 라우팅한다. 스텁은 존재하지 않는 테이블/컬럼/RPC 사용 시 throw하므로
// 프론트-스키마 불일치가 e2e 실패로 드러난다.
// 실제 Supabase(RLS·cron·Edge Function)는 MCP로 별도 검증했다 (worklog 참고).
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const STUB = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'mutda-supabase-stub.mjs'), 'utf8');

const BASE = 'http://localhost:8734/mutda';
const SHOTS = process.env.MUTDA_SHOTS || '/tmp/mutda-e2e-shots';
const EMAIL = 'mutda-e2e-test@example.com';
const PASS = 'mutda-test-1234';

const proxy = process.env.HTTPS_PROXY
  ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' }
  : undefined;
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  proxy,
  args: ['--ignore-certificate-errors'],
});
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });

// 외부 의존성 라우팅: supabase-js CDN → 스텁, 폰트 CSS → 빈 응답
await page.route('**cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm', (route) =>
  route.fulfill({ contentType: 'application/javascript', body: STUB }));
await page.route(/pretendard|fonts\.googleapis|fonts\.gstatic/, (route) =>
  route.fulfill({ contentType: 'text/css', body: '' }));
await page.route(/t1\.daumcdn\.net/, (route) => route.abort()); // 우편번호 스크립트 — 폴백 경로 검증

const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });

const shot = (name) => page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });
const step = (msg) => console.log('▸', msg);

try {
  // 1. 랜딩 — 시드 글 미리보기가 로드되는지 (anon read RLS 검증)
  step('랜딩');
  await page.goto(`${BASE}/index.html`);
  await page.waitForSelector('#preview-posts .card', { timeout: 15000 });
  await shot('01-landing');

  // 2. 로그인
  step('로그인');
  await page.goto(`${BASE}/login.html`);
  await page.fill('#email', EMAIL);
  await page.fill('#password', PASS);
  await page.click('#submit-btn');
  await page.waitForURL(/onboarding|home/, { timeout: 20000 });
  const afterLogin = page.url();
  console.log('  → 로그인 후:', afterLogin);

  // 3. 온보딩 (프로필 없으면)
  if (afterLogin.includes('onboarding')) {
    step('온보딩 퀴즈');
    await page.waitForSelector('#in-name');
    await page.fill('#in-name', '테스트');
    await page.click('#next');
    await page.click('button.choice:has-text("1950년대")');
    await page.click('button.choice:has-text("혼자 지내는")');
    await page.click('button.choice:has-text("유언장")');
    await page.click('button.choice:has-text("안부확인")');
    await page.click('#multi-next');
    await page.click('button.choice:has-text("네, 함께 살아요")');
    await page.waitForSelector('#in-ans');
    await page.fill('#in-ans', '매일 전화해주는 딸에게 늘 고맙다.');
    await shot('02-onboarding-last');
    await page.click('#next');
    await page.waitForURL(/home/, { timeout: 20000 });
  }

  // 4. 홈 — 여정/스트릭/오늘의 한 걸음
  step('홈');
  await page.waitForSelector('.journey-step', { timeout: 15000 });
  const knots = await page.locator('.journey-step').count();
  console.log(`  → 여정 매듭 ${knots}개 렌더 (반려동물 포함 7 기대)`);
  await shot('03-home');

  // 5. 유언장 위저드 전체 통과
  step('유언장 위저드');
  await page.goto(`${BASE}/will.html`);
  await page.waitForSelector('#wizard, #result', { timeout: 15000 });
  if (await page.locator('#wizard').isVisible()) {
    const fill = async (v) => { await page.fill('#box #in', v); await page.click('#next'); };
    await page.waitForSelector('#box #in');
    await fill('김테스트');
    await fill('1955년 3월 21일');
    // 주소 단계: 샌드박스에선 우편번호 스크립트가 차단됨 → 직접 입력 폴백 검증
    await page.waitForSelector('#addr-search');
    await page.click('#addr-search');
    await page.waitForFunction(() => !document.querySelector('#addr-base')?.readOnly, { timeout: 15000 });
    await page.fill('#addr-base', '서울특별시 테스트구 테스트로 12');
    await page.fill('#addr-detail', '101동 202호');
    await page.click('#next');
    // 재산 단계 — 종류 칩으로 담기
    await page.click('button[data-chip="money"]');
    await page.fill('.asset-row input[data-name="what"]', '테스트은행 예금 전부');
    // 상속 순위 마법사: 배우자 있음·자녀 없음·부모 생존 → "배우자와 부모님" 안내 기대
    await page.click('#heir-open');
    await page.click('button[data-h="spouse-yes"]');
    await page.click('button[data-h="children-no"]');
    await page.click('button[data-h="parents-yes"]');
    const guide = await page.locator('#heir-result').innerText();
    if (!guide.includes('배우자와 부모')) throw new Error('상속 마법사 결과 이상: ' + guide);
    // 이름을 넣으면 실명이 들어간 문구가 만들어진다
    await page.fill('input[data-heir-name="spouse"]', '이몽룡');
    const preview = await page.locator('#heir-preview').innerText();
    if (!preview.includes('배우자 이몽룡과 부모님에게')) throw new Error('이름 미리보기 이상: ' + preview);
    await page.click('#heir-insert');
    const whoVal = await page.inputValue('.asset-row input[data-name="who"]');
    if (!whoVal.includes('배우자 이몽룡과 부모님에게')) throw new Error('마법사 제안이 누구에게에 안 들어감: ' + whoVal);
    await page.fill('.asset-row input[data-name="who"]', '딸 김하나');
    // '모든 재산' 칩 — 다른 재산이 있으면 잔여(나머지) 조항이 된다
    await page.click('button[data-chip="all"]');
    const allWhat = await page.inputValue('.asset-row[data-category="all"] input[data-name="what"]');
    if (!allWhat.includes('나머지')) throw new Error('모든 재산 칩 문구 이상: ' + allWhat);
    await page.fill('.asset-row[data-category="all"] input[data-name="who"]', '남편 이몽룡');
    await page.click('#next');
    await fill('아들 김두리');
    await fill('화장 후 수목장');
    // 남기는 말 — 받는 사람 칩으로
    await page.click('button[data-msg-chip="family"]');
    await page.fill('.msg-block textarea[data-name="body"]', '서로 아끼며 살아라.');
    await page.click('button[data-msg-chip="mother"]');
    await page.fill('.msg-block:nth-of-type(2) textarea[data-name="body"]', '엄마, 고마웠어요.');
    await page.click('#next'); // 초안 만들기
  }
  await page.waitForSelector('.will-paper', { timeout: 15000 });
  const paper = await page.locator('.will-paper').innerText();
  if (!paper.includes('유 언 장') || !paper.includes('김하나')) throw new Error('유언장 초안 내용 이상: ' + paper.slice(0, 80));
  if (!paper.includes('나머지 재산은 모두 남편 이몽룡에게')) throw new Error('잔여 조항 누락: ' + paper);
  if (!paper.includes('어머니께') || !paper.includes('사랑하는 가족에게')) throw new Error('받는 사람별 남기는 말 누락: ' + paper);
  console.log('  → 초안 생성 확인 (', paper.split('\n')[0], ')');
  await shot('04-will-draft');
  await page.click('#handwritten-btn');
  await page.waitForTimeout(800);

  // 6. 편지 (감사)
  step('감사의 말');
  await page.goto(`${BASE}/letters.html?kind=gratitude`);
  await page.waitForSelector('#in-body', { timeout: 15000 });
  await page.click('#starter-btn');
  await page.fill('#in-recipient', '딸 하나에게');
  const cur = await page.inputValue('#in-body');
  await page.fill('#in-body', cur + ' 네 웃음이었다.');
  await page.click('#save-btn');
  await page.waitForSelector('#letter-list .item-row', { timeout: 15000 });
  await shot('05-letters');

  // 7. 유품 정리
  step('유품 정리');
  await page.goto(`${BASE}/belongings.html`);
  await page.waitForSelector('#in-name', { timeout: 15000 });
  await page.fill('#in-name', '아버지의 손목시계');
  await page.selectOption('#in-decision', 'give');
  await page.fill('#in-recipient', '큰아들');
  await page.click('#add-btn');
  await page.waitForSelector('#list .item-row', { timeout: 15000 });
  await shot('06-belongings');

  // 8. 안부확인 — 보호자(전화번호+순위) 등록 후 켜기
  step('안부확인');
  await page.goto(`${BASE}/checkin.html`);
  await page.waitForSelector('#g-name', { timeout: 15000 });
  await page.fill('#g-name', '김하나');
  await page.fill('#g-relation', '딸');
  await page.fill('#g-phone', '010-1234-5678');
  await page.selectOption('#g-priority', '1');
  await page.click('#g-add');
  await page.waitForSelector('#guardian-list .item-row', { timeout: 15000 });
  const guardianRow = await page.locator('#guardian-list .item-row').innerText();
  if (!guardianRow.includes('수락 대기')) throw new Error('보호자 초대 대기 상태 미표시: ' + guardianRow);
  await page.click('#toggle-btn');
  await page.waitForSelector('#status-line .chip.green', { timeout: 15000 });
  await shot('07-checkin-on');

  // 8-b. 보호자 초대 링크 미리보기 (guardian.html — 초대 코드로 접근)
  step('보호자 초대 화면');
  const inviteCode = await page.evaluate(() => {
    const st = JSON.parse(localStorage.getItem('mutda-stub-state'));
    return st.tables.mutda_guardians[0].invite_code;
  });
  await page.goto(`${BASE}/guardian.html?code=${inviteCode}`);
  await page.waitForSelector('#actions .btn', { timeout: 15000 });
  const pvText = await page.locator('#pv-title').innerText();
  if (!pvText.includes('보호자로 모셨어요')) throw new Error('보호자 초대 미리보기 이상: ' + pvText);
  await page.evaluate(() => localStorage.removeItem('mutda:guardian_code'));
  await shot('07b-guardian-invite');

  // 9. 커뮤니티 글 + 상세
  step('커뮤니티');
  await page.goto(`${BASE}/community.html`);
  await page.waitForSelector('.post-card', { timeout: 15000 });
  await page.click('.post-card');
  await page.waitForSelector('#comments', { timeout: 15000 });
  await shot('08-post');

  // 10. 마이
  step('나');
  await page.goto(`${BASE}/my.html`);
  await page.waitForSelector('#summary .item-row', { timeout: 15000 });
  await shot('09-my');

  const fatal = errors.filter(e => !e.includes('favicon') && !e.includes('net::'));
  console.log('\nJS 오류:', fatal.length ? fatal : '없음');
  console.log(fatal.length ? 'E2E: FAIL(오류 있음)' : 'E2E: PASS');
  process.exit(fatal.length ? 1 : 0);
} catch (e) {
  console.error('E2E FAIL @', page.url(), '\n', e.message);
  console.error('수집된 오류:', errors);
  await shot('ZZ-failure');
  process.exit(1);
} finally {
  await browser.close();
}
