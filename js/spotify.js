// Spotify 검색 + 내 한 곡 저장 헬퍼
// 검색은 Supabase Edge Function(spotify-search) 프록시로. Client Secret은 서버측만.
import { supabase } from '../auth.js';
import { SUPABASE_URL } from '../supabase-config.js';

const SEARCH_URL = `${SUPABASE_URL}/functions/v1/spotify-search`;

// 검색
export async function searchSpotify(q) {
  const query = (q || '').trim();
  if (query.length < 2) return [];
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('로그인 필요');
  const r = await fetch(SEARCH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: query }),
  });
  if (!r.ok) {
    let msg = '';
    try { msg = (await r.json())?.error || ''; } catch { /* noop */ }
    throw new Error(`검색 실패 (${r.status}${msg ? ' · ' + msg : ''})`);
  }
  const data = await r.json();
  return data.tracks || [];
}

// 내 마지막 한 곡 — 조회
export async function getMyFinalSong() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('user_songs')
    .select('*')
    .eq('user_id', user.id)
    .eq('kind', 'final')
    .maybeSingle();
  return data;
}

// 내 마지막 한 곡 — 저장 (upsert)
export async function saveMyFinalSong(track) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인 필요');
  if (!track?.id) throw new Error('트랙 정보가 잘못됐어요');
  const payload = {
    user_id: user.id,
    kind: 'final',
    spotify_track_id: track.id,
    name: track.name || '',
    artists: track.artists || '',
    image_url: track.image || '',
    external_url: track.external_url || '',
    preview_url: track.preview_url || null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from('user_songs')
    .upsert(payload, { onConflict: 'user_id,kind' });
  if (error) throw error;
}

// 내 마지막 한 곡 — 삭제
export async function removeMyFinalSong() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('user_songs').delete()
    .eq('user_id', user.id).eq('kind', 'final');
}

// Spotify 임베드 위젯 URL
export function spotifyEmbedUrl(trackId) {
  return `https://open.spotify.com/embed/track/${trackId}?utm_source=ittda`;
}
