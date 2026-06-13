// 잇다 — 의견·요청·오류 진입점 (auth 계열 페이지 공용)
//
// 목적: nav.js를 사용하지 않는 페이지(signup·login·forgot·reset·welcome·beta 등)에서도
//       사용자가 어디서든 의견·요청·오류를 보낼 수 있게 footer 한 줄 링크 자동 삽입.
//
// 동작: 페이지에 `<footer class="auth-footer">` 가 있으면 그 안 맨 앞에 "잇다에 의견 보내기 →"
//       링크를 prepend 한다. 이미 nav.js의 itda-footer가 떠 있으면 중복 노출 회피.
//
// 클릭 시: 구글폼을 새 탭으로 열고 현재 페이지 URL을 `entry.1462653906` 에 URL 인코딩으로 채움.
//
// 헌장: 조용함·존엄. 디자인 토큰만(--ink-soft·--primary·--line). 임의 hex 0.
// 격리: DOM에 자체 만든 노드 1개만 추가, 기존 동작에 영향 0.

(function () {
  function openFeedback() {
    var base = 'https://docs.google.com/forms/d/e/1FAIpQLSfmsc33WCvi-Fwr7at7ci4HSXeNfL8dTN4JuoNCmhRp32kQXg/viewform?usp=pp_url&entry.1462653906=';
    window.open(base + encodeURIComponent(location.href), '_blank', 'noopener');
  }

  function mount() {
    // nav.js가 이미 itda-footer를 그렸으면(즉, 의견 링크가 이미 존재) 중복 추가 안 함.
    if (document.getElementById('itda-footer')) return;
    if (document.getElementById('itda-feedback-link')) return;

    var authFooter = document.querySelector('footer.auth-footer');
    if (!authFooter) return;

    var link = document.createElement('a');
    link.id = 'itda-feedback-link';
    link.href = '#';
    link.className = 'itda-auth-feedback-link';
    link.innerHTML = '잇다에 의견 보내기 <span aria-hidden="true">&rarr;</span>';
    link.addEventListener('click', function (e) {
      e.preventDefault();
      openFeedback();
    });

    // auth-footer 맨 앞에 prepend, 그 다음 줄바꿈
    authFooter.insertBefore(link, authFooter.firstChild);
    authFooter.insertBefore(document.createElement('br'), link.nextSibling);

    if (!document.getElementById('itda-feedback-link-style')) {
      var st = document.createElement('style');
      st.id = 'itda-feedback-link-style';
      st.textContent = [
        '.itda-auth-feedback-link {',
        '  display: inline-block;',
        '  margin-bottom: 8px;',
        '  font-size: 12.5px;',
        '  font-weight: 700;',
        '  color: var(--ink-soft);',
        '  text-decoration: none;',
        '  letter-spacing: -0.005em;',
        '  transition: color 0.15s;',
        '}',
        '.itda-auth-feedback-link:hover { color: var(--primary); }'
      ].join('\n');
      document.head.appendChild(st);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
