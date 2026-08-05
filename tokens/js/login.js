// ============================================================
// LOGIN — Admin Authentication
// ============================================================

(async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    window.location.href = 'index.html';
    return;
  }
})();

supabaseClient.auth.onAuthStateChange((event, session) => {
  if (session) {
    window.location.href = 'index.html';
  }
});

const form = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorEl = document.getElementById('loginError');
const submitBtn = document.getElementById('loginBtn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.textContent = '';

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    errorEl.textContent = 'Please enter both email and password.';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = 'Signing in...';

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    errorEl.textContent = error.message === 'Invalid login credentials'
      ? 'Invalid email or password.'
      : error.message;
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Sign In';
  }
});