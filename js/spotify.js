// 나의 장례식 플레이리스트 — paste-link 방식 (Spotify / Apple Music / YouTube)
// Premium·OAuth·API key 의존 0. 사용자가 외부 앱에서 곡 링크 복사해 붙여넣음.
// MVP: kind='final' 하나의 컬렉션. user당 여러 곡 추가 가능.
import { supabase } from '../auth.js';

const SPOTIFY_OEMBED = 'https://open.spotify.com/oembed?url=';
const YOUTUBE_OEMBED = 'https://www.youtube.com/oembed?format=json&url=';

const PATTERNS = {
  // Spotify: track / playlist / album (캡처: kind, id)
  spotify: /open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|playlist|album)\/([a-zA-Z0-9]+)/i,
  // Apple Music: album/playlist (i= 있으면 곡, 없으면 전체)
  apple:   /music\.apple\.com\/([a-z]{2})\/(album|playlist)\/[^/]+\/([a-zA-Z0-9.]+)(?:\?.*?i=(\d+))?/i,
  // YouTube: video / playlist
  youtubeVideo:    /(?:youtube\.com\/watch\?v=|youtu\.be\/|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/i,
  youtubePlaylist: /youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/i,
};

export function detectService(url) {
  if (!url) return null;
  if (PATTERNS.spotify.test(url)) return 'spotify';
  if (PATTERNS.apple.test(url))   return 'apple';
  if (PATTERNS.youtubeVideo.test(url) || PATTERNS.youtubePlaylist.test(url)) return 'youtube';
  return null;
}

export function extractTrackId(url) {
  const svc = detectService(url);
  if (!svc) return null;
  if (svc === 'spotify') {
    const m = url.match(PATTERNS.spotify);
    return m ? m[2] : null;
  }
  if (svc === 'apple') {
    const m = url.match(PATTERNS.apple);
    return m ? (m[4] || m[3]) : null;
  }
  if (svc === 'youtube') {
    const v = url.match(PATTERNS.youtubeVideo);
    if (v) return v[1];
    const p = url.match(PATTERNS.youtubePlaylist);
    if (p) return p[1];
  }
  return null;
}

export function buildEmbedUrl(url) {
  const svc = detectService(url);
  if (!svc) return null;
  if (svc === 'spotify') {
    const m = url.match(PATTERNS.spotify);
    if (!m) return null;
    return `https://open.spotify.com/embed/${m[1].toLowerCase()}/${m[2]}?utm_source=ittda`;
  }
  if (svc === 'apple') {
    return url.replace(/^https?:\/\/music\.apple\.com/, 'https://embed.music.apple.com');
  }
  if (svc === 'youtube') {
    const v = url.match(PATTERNS.youtubeVideo);
    if (v) return `https://www.youtube.com/embed/${v[1]}`;
    const p = url.match(PATTERNS.youtubePlaylist);
    if (p) return `https://www.youtube.com/embed/videoseries?list=${p[1]}`;
  }
  return null;
}

// 메타데이터 (oEmbed)
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
    return base; // Apple Music: 공식 oEmbed 없음
  } catch {
    return base;
  }
}

// ───────── 플레이리스트 CRUD ─────────

// 내 플레이리스트 곡 목록 (생성순)
export async function listMyPlaylist() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from('user_songs')
    .select('*')
    .eq('user_id', user.id)
    .eq('kind', 'final')
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });
  return data || [];
}

// 곡 추가 (마지막 자리에 append)
export async function addToPlaylist(track) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인 필요');
  if (!track?.external_url) throw new Error('곡 URL이 없어요');
  // 마지막 position 다음 자리
  const { data: lastRow } = await supabase
    .from('user_songs')
    .select('position')
    .eq('user_id', user.id).eq('kind', 'final')
    .order('position', { ascending: false }).limit(1);
  const nextPos = ((lastRow?.[0]?.position) ?? -1) + 1;
  const payload = {
    user_id: user.id,
    kind: 'final',
    spotify_track_id: track.id || '',
    name: track.name || '',
    artists: track.artists || '',
    image_url: track.image || '',
    external_url: track.external_url || '',
    preview_url: null,
    position: nextPos,
  };
  const { error } = await supabase.from('user_songs').insert(payload);
  if (error) throw error;
}

// 한 곡 삭제 (row id로)
export async function removeFromPlaylist(rowId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !rowId) return;
  await supabase.from('user_songs').delete()
    .eq('user_id', user.id).eq('id', rowId);
}

// 임베드 URL (개별 곡)
export function embedUrlForSong(song) {
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
