/**
 * Kinder Joy E.M.U.P. School - Dedicated Admin Login Logic
 */

(function () {
  'use strict';

  const TOKEN_KEY = 'kj_admin_token';

  // If already authenticated, redirect straight to admin dashboard
  if (localStorage.getItem(TOKEN_KEY)) {
    window.location.replace('admin.html');
    return;
  }

  // DOM Elements
  const standaloneLoginForm = document.getElementById('standaloneLoginForm');
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  const loginAlertBox = document.getElementById('loginAlertBox');

  // Toggle password visibility
  if (togglePasswordBtn && loginPassword) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPwd = loginPassword.type === 'password';
      loginPassword.type = isPwd ? 'text' : 'password';
      togglePasswordBtn.innerHTML = isPwd ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
    });
  }

  function showAlert(message, type = 'error') {
    if (!loginAlertBox) return;
    loginAlertBox.innerHTML = `
      <i class="fas ${type === 'error' ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i>
      <span>${message}</span>
    `;
    loginAlertBox.className = `status-alert ${type}`;
    loginAlertBox.style.display = 'flex';
  }

  // Handle Form Submission
  if (standaloneLoginForm) {
    standaloneLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginAlertBox.style.display = 'none';

      const email = loginEmail.value.trim();
      const password = loginPassword.value.trim();

      if (!email || !password) {
        showAlert('Please enter both email and password.');
        return;
      }

      loginSubmitBtn.disabled = true;
      loginSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (res.ok && data.token) {
          localStorage.setItem(TOKEN_KEY, data.token);
          showAlert('Login successful! Redirecting to Dashboard...', 'success');
          setTimeout(() => {
            window.location.href = 'admin.html';
          }, 600);
        } else {
          loginSubmitBtn.disabled = false;
          loginSubmitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In to Dashboard';
          showAlert(data.message || 'Invalid credentials. Please verify your email and password.');
        }
      } catch (err) {
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In to Dashboard';
        showAlert('Unable to connect to the authentication server. Please check your internet connection.');
      }
    });
  }
})();

