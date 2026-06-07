// 상속 브리지 콘텐츠 — 두 갈래 CTA 클릭 계측 (§6 검증 실험 1)
//
// 핵심 선행지표: "미래 CTA 클릭률 ÷ 지금 CTA 클릭률" (docs/content-bridge-inheritance.md §5)
// - cta_clicks 테이블(마이그레이션 20260607_cta_clicks_event_log.sql)에 INSERT.
//   ※ 그 마이그레이션은 적용 보류 상태(창업자 승인 대기). 미적용이면 INSERT가 실패하지만
//      모두 비차단(fire-and-forget)이라 글 읽기 흐름에는 영향 없음.
// - 익명(비로그인) 유입자도 측정한다 — 상속 검색자는 대부분 비회원.
// - 세션 단위 분모 산출을 위해 익명 난수 session_key를 sessionStorage에 둔다(개인 식별 불가).

import { supabase } from '../auth.js';

const SESSION_KEY_NAME = 'itda_cta_session';

// 익명 세션 키 — 같은 세션에서 두 버튼을 눌렀는지 구분하는 용도. 쿠키 아님(sessionStorage).
export function getSessionKey() {
  try {
    let k = sessionStorage.getItem(SESSION_KEY_NAME);
    if (!k) {
      k = (crypto?.randomUUID?.() || `s_${Date.now()}_${Math.random().toString(36).slice(2)}`);
      sessionStorage.setItem(SESSION_KEY_NAME, k);
    }
    return k;
  } catch (_) {
    // sessionStorage 차단(프라이빗 모드 등) — 세션 단위 집계는 포기하되 클릭 자체는 기록.
    return null;
  }
}

// 유입 맥락(UTM) 간단 수집 — §5(3) 지연 지표(상속 유입→도구 가입) 연결 고리.
function collectMeta() {
  try {
    const p = new URLSearchParams(location.search);
    const utm = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((k) => {
      const v = p.get(k);
      if (v) utm[k] = v;
    });
    const meta = {};
    if (Object.keys(utm).length) meta.utm = utm;
    if (document.referrer) meta.referrer = document.referrer.slice(0, 300);
    return Object.keys(meta).length ? meta : null;
  } catch (_) {
    return null;
  }
}

/**
 * 두 갈래 CTA 클릭 1건 기록. 비차단(실패해도 throw 안 함) — 이동을 막지 않는다.
 * @param {Object} o
 * @param {string} o.contentId   - 콘텐츠 UUID
 * @param {'now'|'future'} o.branch - 지금/미래 분기
 * @param {string} [o.label]     - 노출된 실제 버튼 문구(카피 A/B 추적)
 * @param {string} [o.href]      - 이동 목적지(경로 변경 추적)
 * @param {string} [o.experiment]- 실험 식별자(예: 'exp1-g3')
 */
export async function recordCtaClick({ contentId, branch, label = null, href = null, experiment = null }) {
  if (branch !== 'now' && branch !== 'future') return;
  let userId = null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    userId = session?.user?.id || null;
  } catch (_) { /* 비로그인 — 그대로 익명 기록 */ }

  const row = {
    content_id: contentId || null,
    cta_branch: branch,
    cta_label: label,
    cta_href: href,
    experiment,
    session_key: getSessionKey(),
    user_id: userId,
    meta: collectMeta(),
  };

  try {
    const { error } = await supabase.from('cta_clicks').insert(row);
    if (error) console.warn('[cta-bridge] 계측 기록 실패(비차단):', error.message);
  } catch (e) {
    console.warn('[cta-bridge] 계측 예외(비차단):', e?.message || e);
  }
}
