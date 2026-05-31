// =============================================================
// Supabase Edge Function: spotify-search
//
// 잇다 사용자가 "내 마지막 한 곡"을 고르기 위한 Spotify 트랙 검색 프록시.
// Client Secret을 클라이언트에 노출하지 않도록 서버 사이드에서 토큰 발급+검색.
//
// 동작:
//   1) 호출자 JWT 검증 (잇다 로그인 사용자만)
//   2) Spotify Client Credentials Flow로 access_token 발급 (warm 캐시)
//   3) Spotify Web API /v1/search?type=track 호출
//   4) 필요한 필드만 추려서 응답
//
// 요청: POST { q: string }
// 응답: { tracks: [{ id, name, artists, album, image, preview_url, external_url, uri }] }
//
// 필요 시크릿:
//   SUPABASE_URL, SUPABASE_ANON_KEY (자동)
//   SPOTIFY_CLIENT_ID
//   SPOTIFY_CLIENT_SECRET
// =============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SPOTIFY_CLIENT_ID = Deno.env.get('SPOTIFY_CLIENT_ID') || '';
const SPOTIFY_CLIENT_SECRET = Deno.env.get('SPOTIFY_CLIENT_SECRET') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';

// 토큰 캐시 (warm 인스턴스 동안만 유효 — cold start 시 재발급)
let _token: { value: string; expiresAt: number } | null = null;

async function getSpotifyToken(): Promise<string> {
  if (_token && _token.expiresAt > Date.now() + 30_000) return _token.value;
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error('SPOTIFY_CLIENT_ID/SECRET 미설정');
  }
  const creds = btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);
  const r = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!r.ok) {
    throw new Error(`spotify token: ${r.status} ${await r.text()}`);
  }
  const data = await r.json();
  _token = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
  };
  return _token.value;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  // 호출자 JWT 검증
  const authHeader = req.headers.get('Authorization') || '';
  if (!authHeader) return json({ error: 'unauthorized' }, 401);

  const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return json({ error: 'unauthorized' }, 401);

  // body 파싱
  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid json' }, 400);
  }
  const q = (body?.q || '').toString().trim();
  if (!q || q.length < 2) return json({ tracks: [] });

  // Spotify 검색
  try {
    const token = await getSpotifyToken();
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=8&market=KR`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) {
      const msg = await r.text();
      return json({ error: 'spotify_error', status: r.status, msg }, 502);
    }
    const data = await r.json();
    const tracks = (data?.tracks?.items || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      artists: (t.artists || []).map((a: any) => a.name).join(', '),
      album: t.album?.name || '',
      image: t.album?.images?.[2]?.url || t.album?.images?.[1]?.url || t.album?.images?.[0]?.url || '',
      preview_url: t.preview_url || null,
      external_url: t.external_urls?.spotify || '',
      uri: t.uri,
    }));
    return json({ tracks });
  } catch (e: any) {
    return json({ error: e?.message || String(e) }, 500);
  }
});
