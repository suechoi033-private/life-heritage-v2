// 묻다 — 유언장 위저드: 질문 정의 + 초안 생성기
// "유언장을 쓰세요"가 아니라, 묻고 답하면 초안이 만들어진다.
// 결과물은 자필증서 유언(민법 제1066조)을 손으로 옮겨 쓰기 위한 '초안'이다.
// ※ 법률 자문이 아니며, 전문가(변호사·공증인) 확인을 권장한다.

export const WILL_QUESTIONS = [
  {
    key: 'name', type: 'text',
    q: '유언장에 적을 이름을 알려주세요.',
    help: '주민등록상의 성명을 적어주세요. 자필 유언장에는 성명이 반드시 들어가야 합니다.',
    placeholder: '예) 김순자', required: true,
  },
  {
    key: 'birth', type: 'text',
    q: '생년월일을 알려주세요.',
    help: '유언자가 누구인지 분명히 하기 위해 적습니다.',
    placeholder: '예) 1955년 3월 21일', required: true,
  },
  {
    key: 'address', type: 'address',
    q: '지금 살고 계신 주소를 알려주세요.',
    help: '자필 유언장에는 주소가 반드시 들어가야 합니다. 우편번호 검색으로 정확한 주소를 넣고, 동·호수까지 이어 적어주세요.',
    required: true,
  },
  {
    key: 'assets', type: 'list',
    q: '남기고 싶은 재산과, 그 재산을 받을 사람을 하나씩 알려주세요.',
    help: '집, 예금, 보험, 자동차, 디지털 자산(사진·계정), 아끼는 물건까지. 떠오르는 것부터 하나씩 적으면 됩니다.',
    fields: [
      { name: 'what', label: '무엇을', placeholder: '예) ○○은행 예금 전부' },
      { name: 'who', label: '누구에게', placeholder: '예) 딸 김하나' },
    ],
    addLabel: '+ 재산 하나 더 적기', required: true,
  },
  {
    key: 'executor', type: 'text',
    q: '유언을 실행해 줄 사람(유언집행자)을 정해두셨나요?',
    help: '유언 내용을 실제로 처리해 줄 사람입니다. 없다면 비워두어도 됩니다. 보통 배우자·자녀·형제 또는 변호사를 지정합니다.',
    placeholder: '예) 아들 김두리 (관계와 이름)', required: false,
  },
  {
    key: 'funeral', type: 'text',
    q: '장례에 대해 바라는 점이 있다면 남겨주세요.',
    help: '화장/매장, 장지, 조용한 가족장 등. 법적 효력과 별개로, 가족이 당신의 뜻을 알 수 있습니다.',
    placeholder: '예) 화장 후 ○○ 수목장에, 장례는 가족끼리 조용히', required: false,
  },
  {
    key: 'message', type: 'textarea',
    q: '마지막으로, 가족에게 남기고 싶은 말이 있나요?',
    help: '유언장에서 가장 오래 기억되는 건 재산 목록이 아니라 이 문단입니다. 편하게 쓰세요.',
    placeholder: '예) 서로 아끼며 살아라. 나는 충분히 행복했다.', required: false,
  },
];

// 주소 답은 {base(검색된 주소), detail(동·호수)} 객체 또는 옛 형식의 문자열
export function formatAddress(v) {
  if (!v) return '';
  if (typeof v === 'string') return v;
  return `${v.base || ''} ${v.detail || ''}`.trim();
}

// 답변 → 자필로 옮겨 쓸 유언장 초안 텍스트
export function generateWill(a) {
  const today = new Date();
  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
  const assets = (a.assets || []).filter(x => x.what && x.who);

  const lines = [];
  lines.push('유 언 장');
  lines.push('');
  lines.push(`유언자 ${a.name} (${a.birth}생)`);
  lines.push(`주소: ${formatAddress(a.address)}`);
  lines.push('');
  lines.push('나는 맑은 정신으로 다음과 같이 유언한다.');
  lines.push('');

  if (assets.length) {
    lines.push('제1조 (재산의 유증)');
    assets.forEach((x, i) => {
      lines.push(`  ${i + 1}. ${x.what}은(는) ${x.who}에게 남긴다.`);
    });
    lines.push('');
  }

  let clause = 2;
  if (a.executor) {
    lines.push(`제${clause}조 (유언집행자)`);
    lines.push(`  이 유언의 집행자로 ${a.executor}을(를) 지정한다.`);
    lines.push('');
    clause++;
  }
  if (a.funeral) {
    lines.push(`제${clause}조 (장례에 관한 뜻)`);
    lines.push(`  ${a.funeral}`);
    lines.push('');
    clause++;
  }
  if (a.message) {
    lines.push('남기는 말');
    lines.push(`  ${a.message}`);
    lines.push('');
  }

  lines.push(`작성일: ${dateStr}`);
  lines.push(`유언자: ${a.name} (자필 서명 후 날인)`);
  return lines.join('\n');
}

// 자필 작성 체크리스트 — 민법 제1066조(자필증서유언)의 다섯 요건
export const HANDWRITE_CHECKLIST = [
  { key: 'fulltext', label: '전문을 처음부터 끝까지 직접 손으로 썼다', desc: '컴퓨터 출력·대필·복사는 무효입니다. 반드시 본인의 손글씨여야 해요.' },
  { key: 'date', label: '작성 연·월·일을 정확히 적었다', desc: '연도와 월만 쓰고 날짜를 빠뜨리면 무효가 될 수 있습니다.' },
  { key: 'address', label: '주소를 적었다', desc: '생활의 근거가 되는 곳을 동·호수까지 구체적으로.' },
  { key: 'name', label: '성명을 직접 적었다', desc: '주민등록상 이름으로.' },
  { key: 'seal', label: '날인(도장 또는 지장)을 했다', desc: '서명만으로는 부족합니다. 도장이 없으면 지장(무인)도 인정됩니다.' },
];
