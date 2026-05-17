// 일기 CRUD 헬퍼
import { supabase } from '../auth.js';

export const TEMPLATES = {
  daily:          { label: '일상 일기',  prompt: '오늘 하루는 어땠나요? 떠오르는 대로 적어보세요.' },
  gratitude:      { label: '감사 일기',  prompt: '오늘 감사했던 일 세 가지를 떠올려보세요.' },
  future_mission: { label: '미래 미션',  prompt: '미래의 나에게 어떤 한 걸음을 남기고 싶나요?' },
};

export const VISIBILITY = {
  private: { label: '나만 보기', icon: '🔒' },
  friends: { label: '친구 보기', icon: '👥' },
  public:  { label: '전체 공개', icon: '🌍' },
};

export async function listMyDiariesByMonth(year, monthIndex) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const start = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
  const endDate = new Date(year, monthIndex + 1, 1);
  const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-01`;
  const { data, error } = await supabase
    .from('diary_entries')
    .select('id, entry_date, template_type, title, visibility')
    .eq('user_id', user.id)
    .gte('entry_date', start)
    .lt('entry_date', end)
    .order('entry_date', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function listMyDiariesTimeline(limit = 20, beforeDate = null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  let q = supabase
    .from('diary_entries')
    .select('id, entry_date, template_type, title, content, visibility, created_at')
    .eq('user_id', user.id)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (beforeDate) q = q.lt('entry_date', beforeDate);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function getDiary(id) {
  const { data: entry, error } = await supabase
    .from('diary_entries')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!entry) return null;

  const [{ data: media }, { data: entryTags }] = await Promise.all([
    supabase.from('diary_media').select('id, storage_path, media_type, sort_order')
      .eq('entry_id', id).order('sort_order', { ascending: true }),
    supabase.from('diary_entry_tags').select('tag_id, tags(id, name, tag_type)')
      .eq('entry_id', id),
  ]);

  return {
    ...entry,
    media: media || [],
    tags: (entryTags || []).map((t) => t.tags).filter(Boolean),
  };
}

export async function createDiary({ entry_date, template_type, title, content, visibility }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인 필요');
  const { data, error } = await supabase.from('diary_entries').insert({
    user_id: user.id,
    entry_date: entry_date || new Date().toISOString().slice(0, 10),
    template_type: template_type || 'daily',
    title: title || null,
    content: content || '',
    visibility: visibility || 'private',
  }).select().single();
  if (error) throw error;
  return data;
}

export async function updateDiary(id, patch) {
  const { data, error } = await supabase
    .from('diary_entries')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDiary(id) {
  const { error } = await supabase.from('diary_entries').delete().eq('id', id);
  if (error) throw error;
}

// 일기 검색 — 제목/본문 키워드 + 태그명 모두 매칭
// RLS가 user_id를 강제하므로 본인 일기만 조회됨.
export async function searchDiaries(query, { limit = 30 } = {}) {
  const q = (query || '').trim();
  if (!q) return [];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const like = `%${q.replace(/[%_]/g, (m) => '\\' + m)}%`;

  // 1) 제목/본문 매칭
  const { data: textHits, error: e1 } = await supabase
    .from('diary_entries')
    .select('id, entry_date, template_type, title, content, visibility, created_at')
    .eq('user_id', user.id)
    .or(`title.ilike.${like},content.ilike.${like}`)
    .order('entry_date', { ascending: false })
    .limit(limit);
  if (e1) throw e1;

  // 2) 태그명 매칭 → entry_id 모음
  const { data: tagRows } = await supabase
    .from('tags')
    .select('id')
    .eq('user_id', user.id)
    .ilike('name', like);
  const tagIds = (tagRows || []).map((t) => t.id);

  let tagHits = [];
  if (tagIds.length) {
    const { data: links } = await supabase
      .from('diary_entry_tags')
      .select('entry_id')
      .in('tag_id', tagIds);
    const entryIds = [...new Set((links || []).map((l) => l.entry_id))];
    if (entryIds.length) {
      const { data: tagged } = await supabase
        .from('diary_entries')
        .select('id, entry_date, template_type, title, content, visibility, created_at')
        .eq('user_id', user.id)
        .in('id', entryIds)
        .order('entry_date', { ascending: false })
        .limit(limit);
      tagHits = tagged || [];
    }
  }

  // 합치고 id 중복 제거 (텍스트 매칭 우선)
  const map = new Map();
  for (const e of textHits || []) map.set(e.id, e);
  for (const e of tagHits)       if (!map.has(e.id)) map.set(e.id, e);
  return [...map.values()].slice(0, limit);
}

// 일기-태그 동기화
export async function syncDiaryTags(entryId, tagIds) {
  const { data: existing } = await supabase
    .from('diary_entry_tags').select('tag_id').eq('entry_id', entryId);
  const existingIds = new Set((existing || []).map((r) => r.tag_id));
  const targetIds = new Set(tagIds);

  const toAdd    = [...targetIds].filter((id) => !existingIds.has(id));
  const toRemove = [...existingIds].filter((id) => !targetIds.has(id));

  if (toAdd.length) {
    await supabase.from('diary_entry_tags').insert(toAdd.map((tag_id) => ({ entry_id: entryId, tag_id })));
  }
  if (toRemove.length) {
    await supabase.from('diary_entry_tags').delete().eq('entry_id', entryId).in('tag_id', toRemove);
  }
}
