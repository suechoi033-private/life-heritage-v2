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
    key: 'assets', type: 'assets',
    q: '남기고 싶은 것과, 받을 사람을 알려주세요.',
    help: '아래에서 종류를 누르면 하나씩 담깁니다. \'누구에게\'가 막막하면 상속 순위 마법사가 도와드려요.',
    required: true,
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

// 재산 종류 칩 — 누르면 그 종류의 항목이 맞춤 예시와 함께 추가된다
export const ASSET_CATEGORIES = [
  { key: 'realestate', ico: '🏠', label: '부동산', placeholder: '예) 서울 ○○구 ○○아파트 101동 202호' },
  { key: 'money', ico: '💰', label: '예금·현금', placeholder: '예) ○○은행 예금 전부' },
  { key: 'insurance', ico: '📄', label: '보험·연금', placeholder: '예) ○○생명 종신보험' },
  { key: 'vehicle', ico: '🚗', label: '자동차', placeholder: '예) ○○ 승용차 (12가3456)' },
  { key: 'valuables', ico: '💍', label: '귀중품', placeholder: '예) 결혼 예물 시계' },
  { key: 'digital', ico: '📱', label: '디지털', placeholder: '예) 사진 클라우드, ○○ 계정' },
  { key: 'etc', ico: '➕', label: '그 밖의 것', placeholder: '예) 서재의 책 전부' },
];

// 상속 순위 마법사 — 민법 제1000조(상속의 순위)·제1003조(배우자의 상속)
// 세 번의 답(배우자→자녀→부모)으로 법정 1순위 상속인을 알려준다.
// 성년/미성년은 상속 순위에 영향이 없어 묻지 않는다.
export function inheritanceGuide({ spouse, children, parents }) {
  const common = '유언장은 이 순위와 다르게 자유롭게 지정할 수 있어요. '
    + '다만 배우자·자녀·부모에게는 법이 보장하는 최소 몫(유류분)이 있어, '
    + '전부 다른 사람에게 남기면 일부는 청구될 수 있습니다.';

  if (spouse && children) return {
    situation: '배우자와 자녀가 있으시네요.',
    heirs: '법정 1순위: 배우자와 자녀 (공동상속)',
    detail: '민법 제1000조·제1003조에 따라 배우자와 자녀가 함께 상속하며, 법정 비율은 배우자 1.5 : 자녀 각 1입니다.',
    suggest: '배우자와 자녀들에게 법정상속분대로',
    common,
  };
  if (spouse && !children && parents) return {
    situation: '기혼이지만 자녀가 없으시네요.',
    heirs: '법정 1순위: 배우자와 부모님 (공동상속)',
    detail: '자녀가 없으면 민법 제1003조에 따라 배우자가 부모님(직계존속)과 함께 상속합니다. 비율은 배우자 1.5 : 부모 각 1입니다.',
    suggest: '배우자와 부모님에게 법정상속분대로',
    common,
  };
  if (spouse && !children && !parents) return {
    situation: '배우자가 계시고, 자녀와 부모님은 안 계시네요.',
    heirs: '법정 상속: 배우자 단독',
    detail: '민법 제1003조에 따라 배우자가 단독으로 상속합니다.',
    suggest: '배우자에게',
    common,
  };
  if (!spouse && children) return {
    situation: '자녀가 있으시네요.',
    heirs: '법정 1순위: 자녀',
    detail: '민법 제1000조에 따라 자녀(직계비속)가 1순위이며, 여러 명이면 똑같이 나눕니다.',
    suggest: '자녀들에게 똑같이 나누어',
    common,
  };
  if (!spouse && !children && parents) return {
    situation: '배우자와 자녀 없이, 부모님이 계시네요.',
    heirs: '가장 먼저 상속받는 사람: 부모님',
    detail: '민법 제1000조에 따라 직계비속(자녀)이 없으면 직계존속(부모님)이 상속합니다.',
    suggest: '부모님에게',
    common,
  };
  return {
    situation: '배우자·자녀·부모님이 안 계시네요.',
    heirs: '가장 먼저 상속받는 사람: 형제자매',
    detail: '민법 제1000조에 따라 직계비속·직계존속이 없으면 형제자매가 상속하며, 여러 명이면 똑같이 나눕니다.',
    suggest: '형제자매에게 똑같이 나누어',
    common,
  };
}

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
