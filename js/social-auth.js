// 잇다 — 소셜 로그인 헬퍼 (카카오 + 구글)
// 카카오/구글 모두 Supabase 네이티브 OAuth(signInWithOAuth) 사용.
// (카카오 JS SDK v2는 Kakao.Auth.login()이 없고 authorize() 리다이렉트 방식뿐이라,
//  Supabase 네이티브 카카오 프로바이더로 통일 — 더 단순하고 안정적.)

import { supabase } from '../auth.js';

// 현재 페이지 기준 같은 폴더의 redirectAfter로 절대 URL 생성
function oauthRedirectTo(redirectAfter) {
  return `${location.origin}${location.pathname.replace(/[^/]+$/, '')}${redirectAfter.replace('./', '')}`;
}

// ========================================
// 카카오 로그인 (Supabase 네이티브)
// ========================================
export async function signInWithKakao(opts = {}) {
  const { redirectAfter = './index.html', inviteCode } = opts;
  // 초대 코드는 리다이렉트 왕복 동안 보존(care.html이 localStorage에서 읽어 자동 수락)
  if (inviteCode) localStorage.setItem('itda:pending_invite', inviteCode);
  // 동의항목은 "닉네임"만 요청. (Supabase 기본은 account_email까지 요청하는데,
  //  비즈앱 전이라 이메일 동의를 못 켜서 KOE205가 난다 → profile_nickname으로 한정)
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: { redirectTo: oauthRedirectTo(redirectAfter), scopes: 'profile_nickname' },
  });
  if (error) throw error;
}

// ========================================
// 구글 로그인 (Supabase 네이티브)
// ========================================
export async function signInWithGoogle(opts = {}) {
  const { redirectAfter = './index.html' } = opts;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: oauthRedirectTo(redirectAfter) },
  });
  if (error) throw error;
}

// ========================================
// 애플 로그인 (Supabase 네이티브)
// ========================================
export async function signInWithApple(opts = {}) {
  const { redirectAfter = './index.html' } = opts;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: { redirectTo: oauthRedirectTo(redirectAfter) },
  });
  if (error) throw error;
}

// ========================================
// 소셜 로그인 버튼 렌더링 (공용)
// ========================================
export function renderSocialAuthButtons(container, opts = {}) {
  const {
    redirectAfter = './index.html',
    inviteCode = '',
    dividerText = '',                    // 있으면 버튼 아래에 구분선 표시
    kakaoLabel = '카카오로 계속하기',
  } = opts;
  // 카카오를 가장 쉬운 주 경로로: 맨 위 큰 버튼. 구분선은 아래(이메일 폼과의 사이).
  const divider = dividerText
    ? `<div class="social-auth-divider" style="margin-top:14px;"><span>${dividerText}</span></div>`
    : '';
  container.innerHTML = `
    <div class="social-auth-wrap">
      <button type="button" class="social-btn social-btn-kakao social-btn-primary" data-provider="kakao">
        <span class="social-btn-icon">💬</span>
        <span>${kakaoLabel}</span>
      </button>
      <button type="button" class="social-btn social-btn-google" data-provider="google">
        <span class="social-btn-icon">G</span>
        <span>Google로 계속하기</span>
      </button>
      ${divider}
    </div>
  `;

  container.querySelectorAll('.social-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const provider = btn.dataset.provider;
      btn.disabled = true;
      const originalText = btn.querySelector('span:last-child').textContent;
      btn.querySelector('span:last-child').textContent = '연결 중...';
      try {
        if (provider === 'kakao')  await signInWithKakao({ redirectAfter, inviteCode });
        if (provider === 'google') await signInWithGoogle({ redirectAfter });
        if (provider === 'apple')  await signInWithApple({ redirectAfter });
      } catch (err) {
        alert(`로그인 실패: ${err.message || err}`);
        btn.disabled = false;
        btn.querySelector('span:last-child').textContent = originalText;
      }
    });
  });
}
