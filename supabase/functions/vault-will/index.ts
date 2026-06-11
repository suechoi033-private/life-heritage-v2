// Supabase Edge Function: 유언장 초안 생성 (vault-will)
//
// 입력: POST { answers: { distribute, special, executor, message, name, address } }
// 출력: { draft: string }
// 모델: claude-opus-4-8 (민감·존엄 콘텐츠 — 가장 신중한 표현)
// 배포: verify_jwt=true (인증 사용자만). 시크릿: ANTHROPIC_API_KEY (수동)

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || '';

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}
function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json', ...cors() } });
}

const SYSTEM = [
  "당신은 '잇다'의 따뜻하고 신중한 유언장 초안 작성 도우미입니다.",
  "사용자가 가볍게 답한 내용을 모아, 한국에서 통용되는 자필 유언장의 형식과 표현으로 '초안'을 작성합니다.",
  "규칙:",
  "- 결과는 유언장 초안 본문만 출력합니다. 머리말·설명·코드블록 금지.",
  "- 사용자가 준 정보만 사용합니다. 없는 사실을 지어내지 않고, 빈 항목은 자연스럽게 생략합니다.",
  "- 형식: '유언장' 제목, 유언자 표명, 번호를 매긴 유언 사항(재산·분배·특정유증·유언집행자), 필요 시 '남기는 말', 마지막에 작성일·주소·성명·날인 자리.",
  "- 어조는 조용하고 존엄하게. 과장·미사여구 금지.",
  "- 법적 효력을 단정하거나 '이것은 법적으로 유효하다'고 말하지 않습니다. 효력 안내는 앱이 별도로 합니다.",
  "- 분량은 간결하게.",
].join('\n');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors() });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);
  if (!ANTHROPIC_API_KEY) return json({ error: 'ANTHROPIC_API_KEY not configured' }, 500);

  try {
    const { answers } = await req.json();
    const a = answers || {};
    const lines: string[] = [];
    if (a.distribute) lines.push(`- 남기고 싶은 내용(재산·분배): ${a.distribute}`);
    if (a.special)    lines.push(`- 따로 챙기고 싶은 사람·물건(특정유증): ${a.special}`);
    if (a.executor)   lines.push(`- 유언집행자: ${a.executor}`);
    if (a.message)    lines.push(`- 남기는 말: ${a.message}`);
    if (a.name)       lines.push(`- 이름: ${a.name}`);
    if (a.address)    lines.push(`- 주소: ${a.address}`);
    if (!lines.length) return json({ error: 'no answers' }, 400);

    const userContent = '다음은 사용자의 답변입니다:\n' + lines.join('\n')
      + '\n\n빈 항목은 생략하고, 위 형식으로 유언장 초안을 작성해 주세요.';

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 3000,
        thinking: { type: 'adaptive' },
        system: SYSTEM,
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    if (!r.ok) {
      const errText = await r.text();
      return json({ error: 'anthropic error', status: r.status, detail: errText.slice(0, 500) }, 502);
    }
    const data = await r.json();
    const textBlock = (data.content || []).find((b: any) => b.type === 'text');
    const draft = textBlock?.text?.trim() || '';
    if (!draft) return json({ error: 'empty draft' }, 502);
    return json({ draft });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
