// Login logic copied for backend/public
document.addEventListener('DOMContentLoaded', () => {
  if (Auth.getToken()) { window.location.href = 'dashboard.html'; return; }
  const form = document.getElementById('loginForm');
  const errorBox = document.getElementById('loginError');
  const errorText = document.getElementById('loginErrorText');
  const loginBtn = document.getElementById('loginBtn');
  const loginBtnText = document.getElementById('loginBtnText');
  const togglePass = document.getElementById('togglePass');
  const passwordInput = document.getElementById('password');

  togglePass.addEventListener('click', () => {
    const isPass = passwordInput.type === 'password';
    passwordInput.type = isPass ? 'text' : 'password';
    togglePass.innerHTML = isPass ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
  });

  function showError(msg) { errorText.textContent = msg; errorBox.classList.add('show'); }
  function hideError() { errorBox.classList.remove('show'); }

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); hideError();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    if (!username || !password) { showError('Please enter both username and password.'); return; }
    loginBtn.disabled = true; loginBtnText.innerHTML = '<span class="spinner"></span>';
    try {
      const res = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
      Auth.setToken(res.token); Auth.setAdmin(res.admin);
      loginBtnText.textContent = 'Success! Redirecting...'; setTimeout(() => window.location.href = 'dashboard.html', 400);
    } catch (err) { showError(err.message || 'Login failed. Please try again.'); loginBtn.disabled = false; loginBtnText.textContent = 'Sign In'; }
  });
});
