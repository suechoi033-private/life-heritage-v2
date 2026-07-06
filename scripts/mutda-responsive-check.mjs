// 좁은 화면(아이폰 디스플레이 확대 모드 등)에서 유품 정리 목록이
// 버튼에 눌려 글자가 한 글자씩 줄바꿈되던 문제의 수정 확인용 1회성 스크립트.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const STUB = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'mutda-supabase-stub.mjs'), 'utf8');
const BASE = 'http://localhost:8734/mutda';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 320, height: 900 } }); // 아이폰 디스플레이 확대 모드 근사치
await page.route('**cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm', (route) =>
  route.fulfill({ contentType: 'application/javascript', body: STUB }));
await page.route(/pretendard|fonts\.googleapis|fonts\.gstatic|t1\.daumcdn\.net/, (route) =>
  route.fulfill({ contentType: 'text/css', body: '' }));

page.on('console', (m) => console.log(`[console:${m.type()}]`, m.text()));
page.on('pageerror', (e) => console.log('pageerror:', e.message));
page.on('requestfailed', (r) => console.log('requestfailed:', r.url(), r.failure()?.errorText));

await page.goto(`${BASE}/login.html`);
await page.fill('#email', 'mutda-e2e-test@example.com');
await page.fill('#password', 'mutda-test-1234');
await page.click('#submit-btn');
await page.waitForTimeout(3000);
console.log('클릭 3초 후 URL:', page.url());
console.log('폼 에러 텍스트:', await page.locator('#err').innerText().catch(() => '(없음)'));
await page.waitForFunction(() => /onboarding|home/.test(location.href), { timeout: 15000 });
if (page.url().includes('onboarding')) {
  await page.fill('#in-name', '테스트'); await page.click('#next');
  await page.click('button.choice:has-text("1950년대")');
  await page.click('button.choice:has-text("혼자 지내는")');
  await page.click('button.choice:has-text("유언장")');
  await page.click('button.choice:has-text("안부확인")');
  await page.click('#multi-next');
  await page.click('button.choice:has-text("네, 함께 살아요")');
  await page.waitForSelector('#in-ans');
  await page.fill('#in-ans', '매일 전화해주는 딸에게 늘 고맙다.');
  await page.click('#next');
  await page.waitForFunction(() => /home/.test(location.href), { timeout: 15000 });
}

await page.goto(`${BASE}/belongings.html`);
await page.waitForSelector('#in-name', { timeout: 15000 });
// 긴 메모가 있는, 실제 신고된 사례와 유사한 품목 추가
await page.selectOption('#in-category', '디지털');
await page.fill('#in-name', '각종 디지털 자산');
await page.selectOption('#in-decision', 'discard');
await page.fill('#in-note', '미리 삭제 폐기하겠습니다만 역시 다하지 못하면 추모계정은 남기지 말고 모두 삭제해주세요.');
await page.click('#add-btn');
await page.waitForSelector('#list .item-row', { timeout: 15000 });
await page.waitForTimeout(3000); // 토스트가 사라진 뒤 캡처
await page.locator('#list .item-row').first().scrollIntoViewIfNeeded();
await page.screenshot({ path: '/tmp/mutda-e2e-shots/responsive-320.png' });

const row = page.locator('#list .item-row').first();
const box = await row.boundingBox();
const grow = await row.locator('.grow').boundingBox();
console.log('row width:', box.width, '| grow(본문) width:', grow.width, '| ratio:', (grow.width / box.width).toFixed(2));
if (grow.width < 150) throw new Error('본문 영역이 여전히 너무 좁음: ' + grow.width);

await browser.close();
console.log('OK — 320px에서 본문 최소폭 확보됨');
