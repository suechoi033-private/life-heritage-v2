// 묻다 — 준비 여정 정의와 진행률 계산
// Epic의 "개인화된 서재 + 성장하는 여정"을 죽음 준비에 이식:
// 온보딩 답에 따라 트랙 순서가 개인화되고, 각 매듭(단계)은 실제 기록이 생기면 완료된다.
import { supabase } from './app.js';

export const STEPS = [
  {
    key: 'first_question',
    ico: '💬', title: '첫 질문에 답하기',
    desc: '3분이면 충분해요. 나를 위한 첫 기록.',
    href: 'onboarding.html',
  },
  {
    key: 'gratitude',
    ico: '💐', title: '감사의 말 전하기',
    desc: '가장 고마운 한 사람에게, 미리 쓰는 한 통.',
    href: 'letters.html?kind=gratitude',
  },
  {
    key: 'will',
    ico: '📜', title: '유언장 초안 만들기',
    desc: '질문에 답하면 초안이 완성됩니다. 자필 작성과 공증까지.',
    href: 'will.html',
  },
  {
    key: 'belongings',
    ico: '🎁', title: '내 물건 미리 정리하기',
    desc: '하루 하나씩. 이 물건은 누구에게, 어떻게.',
    href: 'belongings.html',
  },
  {
    key: 'pet',
    ico: '🐾', title: '반려동물 돌봄 플랜',
    desc: '내게 무슨 일이 생기면, 이 아이는 누가 돌보나요.',
    href: 'pet.html', petOnly: true,
  },
  {
    key: 'checkin',
    ico: '🔔', title: '안부확인 켜기',
    desc: '오래 소식이 없으면 가족에게 알려드립니다.',
    href: 'checkin.html',
  },
  {
    key: 'farewell',
    ico: '🕊️', title: '작별인사 남기기',
    desc: '언젠가 전해질, 그러나 지금 쓰는 인사.',
    href: 'letters.html?kind=farewell',
  },
];

// 사용자의 실제 기록으로 각 단계 완료 여부 계산
export async function getJourneyState(user, profile) {
  const uid = user.id;
  const [wills, letters, belongings, pets] = await Promise.all([
    supabase.from('mutda_wills').select('id,status').eq('user_id', uid),
    supabase.from('mutda_letters').select('id,kind').eq('user_id', uid),
    supabase.from('mutda_belongings').select('id').eq('user_id', uid).limit(1),
    supabase.from('mutda_pet_plans').select('id').eq('user_id', uid).limit(1),
  ]);

  const kinds = new Set((letters.data || []).map(l => l.kind));
  const done = {
    first_question: !!profile?.onboarding?.first_answer,
    gratitude: kinds.has('gratitude'),
    will: (wills.data || []).length > 0,
    belongings: (belongings.data || []).length > 0,
    pet: (pets.data || []).length > 0,
    checkin: !!profile?.checkin_enabled,
    farewell: kinds.has('farewell'),
  };

  const steps = STEPS.filter(s => !s.petOnly || profile?.has_pet)
    .map(s => ({ ...s, done: !!done[s.key] }));

  // 개인화: 온보딩에서 고른 '가장 마음 쓰이는 것'이 앞으로 온다 (완료 여부 우선 정렬은 유지)
  const focus = profile?.journey_focus || [];
  steps.sort((a, b) => {
    const fa = focus.indexOf(a.key), fb = focus.indexOf(b.key);
    return (fa === -1 ? 99 : fa) - (fb === -1 ? 99 : fb);
  });

  const doneCount = steps.filter(s => s.done).length;
  const next = steps.find(s => !s.done) || null;
  return { steps, doneCount, total: steps.length, next };
}
