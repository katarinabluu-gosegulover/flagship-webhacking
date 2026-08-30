(async function initAuthPage() {
  const backend = window.flagshipBackend;
  const form = document.querySelector('#authForm');
  const message = document.querySelector('#authMessage');
  const tabs = document.querySelectorAll('[data-mode]');
  let mode = 'login';

  if (!backend.configured) document.querySelector('#configWarning').hidden = false;
  if (await backend.getSession()) {
    const next = new URLSearchParams(location.search).get('next') || 'index.html';
    location.replace(next);
    return;
  }

  function setMode(nextMode) {
    mode = nextMode;
    tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.mode === mode));
    document.querySelector('#nameField').hidden = mode === 'login';
    document.querySelector('#displayName').required = mode === 'signup';
    document.querySelector('#authTitle').textContent = mode === 'login' ? '다시 만나서 반가워요.' : '새 멤버로 합류하세요.';
    document.querySelector('#authDesc').textContent = mode === 'login' ? '등록한 이메일과 비밀번호로 로그인하세요.' : '가입 후 운영자가 권한과 활동 기수를 확인합니다.';
    document.querySelector('#authSubmit').textContent = mode === 'login' ? '로그인 →' : '가입 신청 →';
    document.querySelector('#password').autocomplete = mode === 'login' ? 'current-password' : 'new-password';
    message.textContent = '';
    message.className = 'auth-message';
  }

  tabs.forEach((tab) => tab.addEventListener('click', () => setMode(tab.dataset.mode)));
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!backend.configured) {
      message.textContent = 'config.js에 Supabase 연결 정보를 먼저 입력하세요.';
      return;
    }
    const button = document.querySelector('#authSubmit');
    button.disabled = true;
    button.textContent = '처리 중...';
    message.textContent = '';
    try {
      const email = document.querySelector('#email').value.trim();
      const password = document.querySelector('#password').value;
      if (mode === 'login') {
        await backend.signIn(email, password);
        const next = new URLSearchParams(location.search).get('next') || 'index.html';
        location.replace(next);
      } else {
        const result = await backend.signUp(email, password, document.querySelector('#displayName').value.trim());
        message.className = 'auth-message success';
        message.textContent = result.session ? '가입되었습니다. 학습 공간으로 이동합니다.' : '확인 메일을 보냈습니다. 이메일 인증 후 로그인하세요.';
        if (result.session) setTimeout(() => location.replace('index.html'), 700);
      }
    } catch (error) {
      message.textContent = error.message || '인증 처리 중 오류가 발생했습니다.';
    } finally {
      button.disabled = false;
      button.textContent = mode === 'login' ? '로그인 →' : '가입 신청 →';
    }
  });
})();
