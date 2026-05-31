// 음악 한 곡 — paste-link 방식 (Spotify / Apple Music / YouTube)
// Premium·OAuth·API key 의존 0. 사용자가 외부 앱에서 곡 링크 복사해 붙여넣음.
import { supabase } from '../auth.js';

const SPOTIFY_OEMBED = 'https://open.spotify.com/oembed?url=';
const YOUTUBE_OEMBED = 'https://www.youtube.com/oembed?format=json&url=';

const PATTERNS = {
  spotify: /open\.spotify\.com\/(?:intl-[a-z]+\/)?track\/([a-zA-Z0-9]+)/i,
  apple:   /music\.apple\.com\/([a-z]{2})\/album\/[^/]+\/(\d+)\?i=(\d+)/i,
  youtube: /(?:youtube\.com\/watch\?v=|youtu\.be\/|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/i,
};

export function detectService(url) {
  if (!url) return null;
  if (PATTERNS.spotify.test(url)) return 'spotify';
  if (PATTERNS.apple.test(url))   return 'apple';
  if (PATTERNS.youtube.test(url)) return 'youtube';
  return null;
}

export function extractTrackId(url) {
  const svc = detectService(url);
  if (!svc) return null;
  const m = url.match(PATTERNS[svc]);
  if (!m) return null;
  if (svc === 'spotify') return m[1];
  if (svc === 'apple')   return m[3];
  if (svc === 'youtube') return m[1];
  return null;
}

export function buildEmbedUrl(url) {
  const svc = detectService(url);
  if (!svc) return null;
  if (svc === 'spotify') {
    const id = extractTrackId(url);
    return id ? `https://open.spotify.com/embed/track/${id}?utm_source=ittda` : null;
  }
  if (svc === 'apple') {
    return url.replace(/^https?:\/\/music\.apple\.com/, 'https://embed.music.apple.com');
  }
  if (svc === 'youtube') {
    const id = extractTrackId(url);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  return null;
}

// 메타데이터 (oEmbed). CORS 허용된 공개 엔드포인트만 사용. 실패해도 빈 값으로 진행.
export async function fetchSongMetadata(url) {
  const svc = detectService(url);
  if (!svc) return null;
  const base = { service: svc, url, name: '', image: '' };
  try {
    if (svc === 'spotify') {
      const r = await fetch(`${SPOTIFY_OEMBED}${encodeURIComponent(url)}`);
      if (!r.ok) return base;
      const d = await r.json();
      return { ...base, name: d.title || '', image: d.thumbnail_url || '' };
    }
    if (svc === 'youtube') {
      const r = await fetch(`${YOUTUBE_OEMBED}${encodeURIComponent(url)}`);
      if (!r.ok) return base;
      const d = await r.json();
      return { ...base, name: d.title || '', image: d.thumbnail_url || '' };
    }
    // Apple Music: 공식 oEmbed 없음 — 임베드만 보여주고 메타는 비움.
    return base;
  } catch {
    return base;
  }
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

// 내 마지막 한 곡 — 저장 (upsert). track은 { id, name, image, external_url } 형태.
export async function saveMyFinalSong(track) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인 필요');
  if (!track?.external_url) throw new Error('곡 URL이 없어요');
  const payload = {
    user_id: user.id,
    kind: 'final',
    spotify_track_id: track.id || '',          // 컬럼명 호환(어떤 서비스든 track id)
    name: track.name || '',
    artists: track.artists || '',
    image_url: track.image || '',
    external_url: track.external_url || '',
    preview_url: null,
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

// 저장된 곡으로 임베드 URL 빌드 (external_url 우선, 옛 데이터는 spotify_track_id 폴백)
export function embedUrlForSavedSong(song) {
  if (!song) return null;
  if (song.external_url) {
    const u = buildEmbedUrl(song.external_url);
    if (u) return u;
  }
  if (song.spotify_track_id) {
    return `https://open.spotify.com/embed/track/${song.spotify_track_id}?utm_source=ittda`;
  }
  return null;
}
