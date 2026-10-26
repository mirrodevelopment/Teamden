/**
 * Teamden by shed — Login Page Controller (login.js)
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const togglePasswordBtn = document.getElementById('toggle-password-btn');
  const eyeIcon = document.getElementById('eye-icon');
  const submitBtn = document.getElementById('submit-btn');
  const btnText = document.getElementById('btn-text');
  const alertBox = document.getElementById('login-alert');
  const alertText = document.getElementById('login-alert-text');
  const emailError = document.getElementById('email-error');
  const passwordError = document.getElementById('password-error');
  const forgotPasswordLink = document.getElementById('forgot-password-link');

  // Setup Elements
  const setupBanner = document.getElementById('setup-banner');
  const setupModal = document.getElementById('setup-modal');
  const openSetupModalBtn = document.getElementById('open-setup-modal-btn');
  const closeSetupModalBtn = document.getElementById('close-setup-modal-btn');
  const setupForm = document.getElementById('setup-form');
  const setupAlert = document.getElementById('setup-modal-alert');
  const setupAlertText = document.getElementById('setup-modal-alert-text');
  const setupSubmitBtn = document.getElementById('setup-submit-btn');

  // 1. If already authenticated, redirect immediately to dashboard
  await Auth.redirectIfAuthenticated();

  // 2. Handle URL parameters (e.g., ?expired=true or ?logout=true)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('expired') === 'true') {
    showAlert('Your session has expired. Please sign in again to continue.', 'warning');
  } else if (urlParams.get('logout') === 'true') {
    showAlert('You have been signed out safely.', 'success');
  } else if (urlParams.get('error') === 'forbidden') {
    showAlert('You do not have permission to access that area.', 'danger');
  }

  // 3. Check workspace setup status
  checkSetupStatus();

  // 4. Password Visibility Toggle
  let passwordVisible = false;
  togglePasswordBtn.addEventListener('click', () => {
    passwordVisible = !passwordVisible;
    passwordInput.type = passwordVisible ? 'text' : 'password';
    togglePasswordBtn.setAttribute('aria-label', passwordVisible ? 'Hide password' : 'Show password');
    eyeIcon.innerHTML = passwordVisible
      ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`
      : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
  });

  // 5. Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    let hasError = false;
    if (!email) {
      showFieldError(emailError, 'Please enter your work email.');
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFieldError(emailError, 'Please enter a valid email address.');
      hasError = true;
    }

    if (!password) {
      showFieldError(passwordError, 'Please enter your password.');
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);

    try {
      await Auth.login(email, password);
      // Success: redirect to dashboard
      window.location.href = '/pages/dashboard/dashboard.html';
    } catch (err) {
      setLoading(false);
      showAlert(err.message || 'Invalid email or password.', 'danger');
    }
  });

  forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    showAlert('To reset your password, contact your workspace administrator or support.', 'info');
  });

  // --- Initial Setup Modal Logic ---
  async function checkSetupStatus() {
    try {
      const status = await Api.get('/api/setup/status');
      if (status && !status.provisioned) {
        setupBanner.classList.remove('d-none');
      }
    } catch (e) {
      console.warn('Could not check setup status', e);
    }
  }

  openSetupModalBtn.addEventListener('click', () => {
    setupModal.classList.add('active');
  });

  closeSetupModalBtn.addEventListener('click', () => {
    setupModal.classList.remove('active');
  });

  setupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setupAlert.classList.add('d-none');

    const orgName = document.getElementById('setup-org-name').value.trim();
    const adminName = document.getElementById('setup-admin-name').value.trim();
    const adminEmail = document.getElementById('setup-admin-email').value.trim();
    const adminPassword = document.getElementById('setup-admin-password').value;

    if (!orgName || !adminName || !adminEmail || !adminPassword) {
      setupAlertText.textContent = 'All fields are required.';
      setupAlert.classList.remove('d-none');
      return;
    }

    if (adminPassword.length < 8) {
      setupAlertText.textContent = 'Password must be at least 8 characters long.';
      setupAlert.classList.remove('d-none');
      return;
    }

    setupSubmitBtn.disabled = true;
    setupSubmitBtn.classList.add('btn-loading');

    try {
      await Api.post('/api/setup/initialize', {
        organizationName: orgName,
        adminName,
        adminEmail,
        adminPassword
      });

      setupModal.classList.remove('active');
      setupBanner.classList.add('d-none');

      // Populate email field for quick login
      emailInput.value = adminEmail;
      passwordInput.value = adminPassword;

      showAlert('Workspace provisioned successfully! Signing you in...', 'success');

      // Auto sign-in
      setTimeout(async () => {
        try {
          await Auth.login(adminEmail, adminPassword);
          window.location.href = '/pages/dashboard/dashboard.html';
        } catch (err) {
          showAlert('Workspace created. Please sign in with your credentials.', 'success');
        }
      }, 800);

    } catch (err) {
      setupSubmitBtn.disabled = false;
      setupSubmitBtn.classList.remove('btn-loading');
      setupAlertText.textContent = err.message || 'Setup failed. Please check inputs.';
      setupAlert.classList.remove('d-none');
    }
  });

  // Helpers
  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    if (isLoading) {
      submitBtn.classList.add('btn-loading');
    } else {
      submitBtn.classList.remove('btn-loading');
    }
  }

  function showAlert(msg, type = 'danger') {
    alertBox.className = `alert alert-${type}`;
    alertText.textContent = msg;
    alertBox.classList.remove('d-none');
  }

  function clearErrors() {
    alertBox.classList.add('d-none');
    emailError.classList.add('d-none');
    passwordError.classList.add('d-none');
  }

  function showFieldError(el, msg) {
    el.textContent = msg;
    el.classList.remove('d-none');
  }
});
