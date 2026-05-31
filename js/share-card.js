// 한 문장 공유 카드 — canvas 렌더 + SNS 공유
// 흰 배경 + 에버그린 포인트 + Nanum Myeongjo, 정사각형(1080x1080), 하단 "잇다" 워드마크.
// 공유: navigator.canShare({files}) 지원 시 네이티브 공유 시트, 미지원 시 다운로드+클립보드(+카카오) 폴백.

const SIZE = 1080;
const BG = '#FFFFFF';
const PRIMARY = '#2F6B4F';
const INK = '#21261E';
const INK_MUTED = '#6B756E';
const LINE = '#E5EAE6';

// 앱 URL (GitHub Pages 하위 경로 고려) — 현재 페이지 디렉터리 기준
export function appUrl() {
  return `${location.origin}${location.pathname.replace(/[^/]+$/, '')}`;
}

// Nanum Myeongjo 폰트가 로드될 때까지 대기 (canvas는 폰트 미로드 시 fallback로 그려짐)
async function ensureFont() {
  if (!document.fonts || !document.fonts.load) return;
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load("800 60px 'Nanum Myeongjo'"),
        document.fonts.load("400 30px 'Nanum Myeongjo'"),
      ]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch (_) { /* 폰트 로드 실패해도 진행 */ }
}

// 한 문장을 canvas 폭에 맞춰 줄바꿈
function wrapLines(ctx, text, maxWidth) {
  const chars = [...(text || '')];
  const lines = [];
  let line = '';
  for (const ch of chars) {
    if (ch === '\n') { lines.push(line); line = ''; continue; }
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// 한 문장 카드 canvas 렌더 → Promise<canvas>
export async function renderSentenceCard(sentence, { meta = '' } = {}) {
  await ensureFont();
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');

  // 배경
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // 테두리 (옅은 라인 — 인쇄·저장 시 여백 구분)
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, SIZE - 80, SIZE - 80);

  // 상단 에버그린 따옴표 포인트
  ctx.fillStyle = PRIMARY;
  ctx.font = "800 120px 'Nanum Myeongjo', serif";
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('“', 130, 280);

  // 본문 (한 문장) — 가운데 영역
  const maxWidth = SIZE - 280;
  const text = (sentence || '').replace(/\s+/g, ' ').trim();
  // 문장 길이에 따라 폰트 크기 적응
  let fontSize = 64;
  if (text.length > 60) fontSize = 52;
  if (text.length > 100) fontSize = 44;
  if (text.length > 160) fontSize = 38;

  ctx.fillStyle = INK;
  ctx.textBaseline = 'middle';
  let lines, lineHeight;
  // 줄 수가 너무 많으면 폰트를 한 단계 더 줄임
  for (;;) {
    ctx.font = `800 ${fontSize}px 'Nanum Myeongjo', serif`;
    lineHeight = Math.round(fontSize * 1.55);
    lines = wrapLines(ctx, text, maxWidth);
    if (lines.length * lineHeight <= SIZE - 480 || fontSize <= 30) break;
    fontSize -= 4;
  }

  const blockHeight = lines.length * lineHeight;
  let y = SIZE / 2 - blockHeight / 2 + lineHeight / 2;
  for (const line of lines) {
    ctx.fillText(line, 140, y);
    y += lineHeight;
  }

  // 메타 (날짜 등) — 본문 아래
  if (meta) {
    ctx.font = "400 30px 'Nanum Myeongjo', serif";
    ctx.fillStyle = INK_MUTED;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(meta, 140, SIZE / 2 + blockHeight / 2 + 70);
  }

  // 하단 워드마크 "잇다"
  ctx.fillStyle = PRIMARY;
  ctx.font = "800 40px 'Nanum Myeongjo', serif";
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('잇다', 140, SIZE - 110);
  ctx.fillStyle = INK_MUTED;
  ctx.font = "400 26px -apple-system, 'Pretendard', sans-serif";
  ctx.fillText('질문에 답할수록, 내 삶이 또렷해집니다.', 140, SIZE - 70);

  return canvas;
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

// 카드 생성 + 공유 (네이티브 → 폴백)
// 반환: { method: 'share' | 'download' | 'clipboard' | 'kakao' | 'cancelled' }
export async function shareSentenceCard(sentence, { meta = '' } = {}) {
  const text = (sentence || '').replace(/\s+/g, ' ').trim();
  const url = appUrl();
  const caption = `${text}\n\n잇다에서 내 기록을 남기는 중 → ${url}`;

  const canvas = await renderSentenceCard(text, { meta });
  const blob = await canvasToBlob(canvas);
  const file = new File([blob], 'itda-card.png', { type: 'image/png' });

  // 1) 네이티브 공유 시트 (이미지 포함)
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text: caption });
      return { method: 'share' };
    } catch (e) {
      if (e && e.name === 'AbortError') return { method: 'cancelled' };
      // 실패 시 폴백으로 진행
    }
  }

  // 2) 폴백 ① 이미지 다운로드
  try {
    const dlUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = dlUrl;
    a.download = 'itda-card.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(dlUrl), 4000);
  } catch (_) { /* 무시 */ }

  // 폴백 ② 캡션 클립보드 복사
  let clipped = false;
  try {
    await navigator.clipboard.writeText(caption);
    clipped = true;
  } catch (_) { /* 무시 */ }

  // 폴백 ③ 카카오 공유 (키 있을 때)
  if (window.Kakao && window.Kakao.isInitialized && window.Kakao.isInitialized()) {
    try {
      window.Kakao.Share.sendDefault({
        objectType: 'text',
        text: caption,
        link: { mobileWebUrl: url, webUrl: url },
      });
      return { method: 'kakao' };
    } catch (_) { /* 무시 */ }
  }

  return { method: clipped ? 'clipboard' : 'download' };
}

// ─────────────────────────────────────────────────────────────────────────────
// 전체-콘텐츠 카드 (제목 + 본문 + 잇다™ 워드마크). 4:5 (1080×1350), 인스타 카드뉴스 결.
// ─────────────────────────────────────────────────────────────────────────────
const W2 = 1080;
const H2 = 1350;

function stripMarkdown(s) {
  return (s || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function renderContentCard({ title = '', body = '', meta = '' } = {}) {
  await ensureFont();
  const canvas = document.createElement('canvas');
  canvas.width = W2;
  canvas.height = H2;
  const ctx = canvas.getContext('2d');

  // 배경
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W2, H2);

  // 외곽 테두리 (저장·인쇄 시 여백 구분)
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 30, W2 - 60, H2 - 60);

  const PAD = 80;
  let y = 0;

  // 상단 잇다™ 발행 칩 (TM 명시)
  const chipTxt = '✦ 잇다™ 발행';
  ctx.font = "800 26px 'Nanum Myeongjo', serif";
  const chipW = ctx.measureText(chipTxt).width + 36;
  const chipH = 44;
  const chipX = PAD;
  const chipY = 110;
  ctx.fillStyle = PRIMARY;
  const r = chipH / 2;
  ctx.beginPath();
  ctx.moveTo(chipX + r, chipY);
  ctx.lineTo(chipX + chipW - r, chipY);
  ctx.arc(chipX + chipW - r, chipY + r, r, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(chipX + r, chipY + chipH);
  ctx.arc(chipX + r, chipY + r, r, Math.PI / 2, -Math.PI / 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.textBaseline = 'middle';
  ctx.fillText(chipTxt, chipX + 18, chipY + chipH / 2 + 2);
  y = chipY + chipH + 50;

  // 제목 (있을 때만) — 줄당 3줄까지, 폰트 자동 축소
  const innerMaxW = W2 - PAD * 2;
  ctx.textBaseline = 'alphabetic';
  if (title && title.trim()) {
    let tSize = 56;
    let tLines;
    for (;;) {
      ctx.font = `800 ${tSize}px 'Nanum Myeongjo', serif`;
      tLines = wrapLines(ctx, title.trim(), innerMaxW);
      if (tLines.length <= 3 || tSize <= 38) break;
      tSize -= 4;
    }
    ctx.fillStyle = INK;
    const lineH = Math.round(tSize * 1.32);
    for (const line of tLines) {
      ctx.fillText(line, PAD, y + tSize);
      y += lineH;
    }
    y += 14;
  }

  // 메타 (작성자·날짜)
  if (meta) {
    ctx.font = "400 24px 'Nanum Myeongjo', serif";
    ctx.fillStyle = INK_MUTED;
    ctx.fillText(meta, PAD, y + 22);
    y += 40;
  }

  // 구분선
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, y + 24);
  ctx.lineTo(W2 - PAD, y + 24);
  ctx.stroke();
  y += 56;

  // 본문 — 폰트 자동 축소 + 넘치면 줄 단위 말줄임표
  const bodyTop = y;
  const bodyBottom = H2 - 200;   // 하단 워드마크 영역 보호
  const bodyMaxH = bodyBottom - bodyTop;

  const cleanBody = stripMarkdown(body);
  let bSize = 38;
  let bLines, bLineH;
  for (;;) {
    ctx.font = `400 ${bSize}px 'Nanum Myeongjo', serif`;
    bLines = wrapLines(ctx, cleanBody, innerMaxW);
    bLineH = Math.round(bSize * 1.55);
    if (bLines.length * bLineH <= bodyMaxH || bSize <= 24) break;
    bSize -= 2;
  }
  const maxLines = Math.max(1, Math.floor(bodyMaxH / bLineH));
  if (bLines.length > maxLines) {
    bLines = bLines.slice(0, maxLines);
    const last = bLines[bLines.length - 1] || '';
    bLines[bLines.length - 1] = last.length > 1 ? last.slice(0, -1) + '…' : '…';
  }
  ctx.fillStyle = INK;
  let by = bodyTop + bSize;
  for (const line of bLines) {
    ctx.fillText(line, PAD, by);
    by += bLineH;
  }

  // 하단 잇다™ 워드마크 + URL/태그라인 (TM 풀)
  ctx.fillStyle = PRIMARY;
  ctx.font = "800 44px 'Nanum Myeongjo', serif";
  ctx.fillText('잇다™', PAD, H2 - 105);
  ctx.fillStyle = INK_MUTED;
  ctx.font = "400 24px -apple-system, 'Pretendard', sans-serif";
  ctx.fillText('ittda.kr · 질문에 답할수록 내 삶이 또렷해집니다.', PAD, H2 - 68);

  return canvas;
}

export async function shareContentCard({ title = '', body = '', meta = '' } = {}) {
  const url = appUrl();
  const cleanBody = stripMarkdown(body);
  const captionTitle = title && title.trim() ? `${title.trim()}\n\n` : '';
  const captionBody  = cleanBody.slice(0, 200);
  const caption = `${captionTitle}${captionBody}\n\n잇다™에서 더 보기 → ${url}`;

  const canvas = await renderContentCard({ title, body, meta });
  const blob = await canvasToBlob(canvas);
  const file = new File([blob], 'itda-card.png', { type: 'image/png' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text: caption });
      return { method: 'share' };
    } catch (e) {
      if (e && e.name === 'AbortError') return { method: 'cancelled' };
    }
  }

  try {
    const dlUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = dlUrl;
    a.download = 'itda-card.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(dlUrl), 4000);
  } catch (_) { /* 무시 */ }

  let clipped = false;
  try {
    await navigator.clipboard.writeText(caption);
    clipped = true;
  } catch (_) { /* 무시 */ }

  if (window.Kakao && window.Kakao.isInitialized && window.Kakao.isInitialized()) {
    try {
      window.Kakao.Share.sendDefault({
        objectType: 'text',
        text: caption,
        link: { mobileWebUrl: url, webUrl: url },
      });
      return { method: 'kakao' };
    } catch (_) { /* 무시 */ }
  }

  return { method: clipped ? 'clipboard' : 'download' };
}
