#!/usr/bin/env node
/**
 * 잇다 · 삶을 되새기는 인기 콘텐츠 일일 수집기
 *
 * 매일 오전 7시(KST) 실행. YouTube Data API v3로 최근 6개월 이내,
 * 잇다 전략 키워드별 인기 영상을 수집하고 Google Sheets에 append 한다.
 *
 * 필요한 환경 변수
 *   YT_API_KEY            YouTube Data API v3 key
 *   GOOGLE_SA_JSON        Google service account JSON (raw or base64)
 *   ITDA_SHEET_ID         대상 스프레드시트 ID
 *   ITDA_SHEET_TAB        append 대상 탭 이름 (기본: "수집로그")
 *
 * 실행: node scripts/youtube-trends-to-sheets.js
 * 스케줄: .github/workflows/youtube-trends.yml (cron 0 22 * * * = 07:00 KST)
 */

const { google } = require('googleapis');

const KEYWORDS = [
  '임종 후회',
  '호스피스 간호사',
  '유품정리사',
  '부모님 마지막',
  '사전연명의료의향서',
  '유언장 쓰는법',
  '치매 부모님',
  '장기요양',
  '선불 장례',
  '웰다잉',
  '엄마 미안',
  '아빠 영정',
  '다음에 봐요',
  '못다한 말',
];

const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 30 * 6;
const PER_KEYWORD_TOP_N = 5;
const FINAL_TOP_N = 20;

function loadServiceAccount() {
  const raw = process.env.GOOGLE_SA_JSON;
  if (!raw) throw new Error('GOOGLE_SA_JSON missing');
  const text = raw.trim().startsWith('{')
    ? raw
    : Buffer.from(raw, 'base64').toString('utf-8');
  return JSON.parse(text);
}

async function searchYouTube(apiKey, q, publishedAfter) {
  const params = new URLSearchParams({
    key: apiKey,
    q,
    part: 'snippet',
    type: 'video',
    order: 'viewCount',
    maxResults: '25',
    regionCode: 'KR',
    relevanceLanguage: 'ko',
    publishedAfter,
  });
  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
  if (!res.ok) throw new Error(`search failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return (json.items || []).map((it) => ({
    videoId: it.id.videoId,
    title: it.snippet.title,
    channel: it.snippet.channelTitle,
    publishedAt: it.snippet.publishedAt,
    keyword: q,
  }));
}

async function fetchStats(apiKey, ids) {
  if (!ids.length) return {};
  const params = new URLSearchParams({
    key: apiKey,
    id: ids.join(','),
    part: 'statistics,contentDetails',
  });
  const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`);
  if (!res.ok) throw new Error(`videos failed: ${res.status}`);
  const json = await res.json();
  const map = {};
  for (const it of json.items || []) {
    map[it.id] = {
      viewCount: Number(it.statistics?.viewCount || 0),
      likeCount: Number(it.statistics?.likeCount || 0),
      duration: it.contentDetails?.duration || '',
    };
  }
  return map;
}

async function main() {
  const apiKey = process.env.YT_API_KEY;
  if (!apiKey) throw new Error('YT_API_KEY missing');
  const sheetId = process.env.ITDA_SHEET_ID;
  if (!sheetId) throw new Error('ITDA_SHEET_ID missing');
  const tab = process.env.ITDA_SHEET_TAB || '수집로그';

  const publishedAfter = new Date(Date.now() - SIX_MONTHS_MS).toISOString();

  const buckets = await Promise.all(
    KEYWORDS.map((kw) => searchYouTube(apiKey, kw, publishedAfter)),
  );
  const seen = new Set();
  const merged = [];
  for (const list of buckets) {
    for (const v of list.slice(0, PER_KEYWORD_TOP_N)) {
      if (seen.has(v.videoId)) continue;
      seen.add(v.videoId);
      merged.push(v);
    }
  }

  const stats = await fetchStats(apiKey, merged.map((v) => v.videoId));
  const ranked = merged
    .map((v) => ({ ...v, ...(stats[v.videoId] || {}) }))
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, FINAL_TOP_N);

  const today = new Date().toISOString().slice(0, 10);
  const rows = ranked.map((v, i) => [
    today,
    i + 1,
    v.title,
    v.channel,
    v.publishedAt,
    v.viewCount || 0,
    v.likeCount || 0,
    v.duration,
    v.keyword,
    `https://www.youtube.com/watch?v=${v.videoId}`,
  ]);

  const sa = loadServiceAccount();
  const auth = new google.auth.JWT(sa.client_email, undefined, sa.private_key, [
    'https://www.googleapis.com/auth/spreadsheets',
  ]);
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${tab}!A:J`,
    valueInputOption: 'RAW',
    requestBody: { values: rows },
  });

  console.log(`appended ${rows.length} rows to ${tab}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
