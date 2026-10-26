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

  // Auth Mode Switching Elements
  const authMainTitle = document.getElementById('auth-main-title');
  const authMainSubtitle = document.getElementById('auth-main-subtitle');
  const tabSignIn = document.getElementById('tab-sign-in');
  const tabRegisterCompany = document.getElementById('tab-register-company');
  const switchToRegisterLink = document.getElementById('switch-to-register-link');
  const switchToLoginLink = document.getElementById('switch-to-login-link');
  const registerCompanyForm = document.getElementById('register-company-form');

  // Company Registration Elements
  const regOrgName = document.getElementById('reg-org-name');
  const regAdminName = document.getElementById('reg-admin-name');
  const regAdminEmail = document.getElementById('reg-admin-email');
  const regAdminPassword = document.getElementById('reg-admin-password');
  const regTogglePasswordBtn = document.getElementById('reg-toggle-password-btn');
  const regEyeIcon = document.getElementById('reg-eye-icon');
  const regSubmitBtn = document.getElementById('reg-submit-btn');
  const regOrgError = document.getElementById('reg-org-error');
  const regNameError = document.getElementById('reg-name-error');
  const regEmailError = document.getElementById('reg-email-error');
  const regPasswordError = document.getElementById('reg-password-error');

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

  // Mode switcher function
  function setAuthMode(mode) {
    clearErrors();
    if (mode === 'register') {
      if (tabSignIn) {
        tabSignIn.classList.remove('active');
        tabSignIn.setAttribute('aria-selected', 'false');
      }
      if (tabRegisterCompany) {
        tabRegisterCompany.classList.add('active');
        tabRegisterCompany.setAttribute('aria-selected', 'true');
      }
      if (form) form.classList.add('d-none');
      if (registerCompanyForm) registerCompanyForm.classList.remove('d-none');
      if (authMainTitle) authMainTitle.textContent = 'Register Your Company';
      if (authMainSubtitle) authMainSubtitle.textContent = 'Create a secure workspace for your organization and start collaborating';
      if (regOrgName) regOrgName.focus();
    } else {
      if (tabRegisterCompany) {
        tabRegisterCompany.classList.remove('active');
        tabRegisterCompany.setAttribute('aria-selected', 'false');
      }
      if (tabSignIn) {
        tabSignIn.classList.add('active');
        tabSignIn.setAttribute('aria-selected', 'true');
      }
      if (registerCompanyForm) registerCompanyForm.classList.add('d-none');
      if (form) form.classList.remove('d-none');
      if (authMainTitle) authMainTitle.textContent = 'Sign in to Teamden';
      if (authMainSubtitle) authMainSubtitle.textContent = 'All-in-one team and work management workspace';
      if (emailInput) emailInput.focus();
    }
  }

  // Bind Mode Switch Events
  if (tabSignIn) tabSignIn.addEventListener('click', () => setAuthMode('signin'));
  if (tabRegisterCompany) tabRegisterCompany.addEventListener('click', () => setAuthMode('register'));
  if (switchToRegisterLink) {
    switchToRegisterLink.addEventListener('click', (e) => {
      e.preventDefault();
      setAuthMode('register');
    });
  }
  if (switchToLoginLink) {
    switchToLoginLink.addEventListener('click', (e) => {
      e.preventDefault();
      setAuthMode('signin');
    });
  }

  // 2. Handle URL parameters (e.g., ?expired=true or ?logout=true or ?register=company)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('expired') === 'true') {
    showAlert('Your session has expired. Please sign in again to continue.', 'warning');
  } else if (urlParams.get('logout') === 'true') {
    showAlert('You have been signed out safely.', 'success');
  } else if (urlParams.get('error') === 'forbidden') {
    showAlert('You do not have permission to access that area.', 'danger');
  } else if (urlParams.get('setup') === 'true') {
    setupModal.classList.add('active');
    showAlert('Welcome! Please configure your initial organization and administrator account.', 'info');
  } else if (urlParams.get('register') === 'true' || urlParams.get('register') === 'company' || urlParams.get('mode') === 'register') {
    setAuthMode('register');
  }

  // Pre-fill email from query parameter (e.g., from Developer Portal)
  const prefillEmail = urlParams.get('email');
  if (prefillEmail && emailInput) {
    emailInput.value = decodeURIComponent(prefillEmail);
    if (passwordInput) {
      setTimeout(() => passwordInput.focus(), 100);
    }
  }

  // Theme toggle on login screen
  const loginThemeBtn = document.getElementById('login-theme-btn');
  if (loginThemeBtn) {
    loginThemeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const isBW = (current === 'black-and-white' || current === 'bw' || current === 'dark');
      const next = isBW ? 'light' : 'black-and-white';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('teamden-theme', next);
    });
  }

  // 3. Check workspace setup status
  checkSetupStatus();

  // 4. Password Visibility Toggle for Login
  let passwordVisible = false;
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
      passwordVisible = !passwordVisible;
      passwordInput.type = passwordVisible ? 'text' : 'password';
      togglePasswordBtn.setAttribute('aria-label', passwordVisible ? 'Hide password' : 'Show password');
      eyeIcon.innerHTML = passwordVisible
        ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`
        : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
    });
  }

  // Password Visibility Toggle for Registration
  let regPasswordVisible = false;
  if (regTogglePasswordBtn) {
    regTogglePasswordBtn.addEventListener('click', () => {
      regPasswordVisible = !regPasswordVisible;
      regAdminPassword.type = regPasswordVisible ? 'text' : 'password';
      regTogglePasswordBtn.setAttribute('aria-label', regPasswordVisible ? 'Hide password' : 'Show password');
      if (regEyeIcon) {
        regEyeIcon.innerHTML = regPasswordVisible
          ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`
          : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
      }
    });
  }

  // 5. Sign In Form Submission
  if (form) {
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
  }

  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      showAlert('To reset your password, contact your workspace administrator or support.', 'info');
    });
  }

  // 6. Register as New Company Form Submission
  if (registerCompanyForm) {
    registerCompanyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors();

      const orgName = regOrgName.value.trim();
      const adminName = regAdminName.value.trim();
      const adminEmail = regAdminEmail.value.trim();
      const adminPassword = regAdminPassword.value;

      let hasError = false;
      if (!orgName) {
        showFieldError(regOrgError, 'Please enter your company or organization name.');
        hasError = true;
      } else if (orgName.length < 2) {
        showFieldError(regOrgError, 'Company name must be at least 2 characters.');
        hasError = true;
      }

      if (!adminName) {
        showFieldError(regNameError, 'Please enter the owner full name.');
        hasError = true;
      }

      if (!adminEmail) {
        showFieldError(regEmailError, 'Please enter a work email address.');
        hasError = true;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
        showFieldError(regEmailError, 'Please enter a valid email address.');
        hasError = true;
      }

      if (!adminPassword) {
        showFieldError(regPasswordError, 'Please create a secure password.');
        hasError = true;
      } else if (adminPassword.length < 8) {
        showFieldError(regPasswordError, 'Password must be at least 8 characters long.');
        hasError = true;
      }

      if (hasError) return;

      setRegLoading(true);

      try {
        await Api.post('/api/setup/register-company', {
          organizationName: orgName,
          adminName,
          adminEmail,
          adminPassword
        });

        showAlert(`Company "${orgName}" registered successfully! Signing you in...`, 'success');

        // Auto sign-in with owner credentials
        setTimeout(async () => {
          try {
            await Auth.login(adminEmail, adminPassword);
            window.location.href = '/pages/dashboard/dashboard.html';
          } catch (loginErr) {
            setRegLoading(false);
            showAlert('Company registered! Please sign in with your owner credentials.', 'success');
            setAuthMode('signin');
            if (emailInput) emailInput.value = adminEmail;
            if (passwordInput) passwordInput.value = adminPassword;
          }
        }, 800);

      } catch (err) {
        setRegLoading(false);
        showAlert(err.message || 'Registration failed. Please check inputs and try again.', 'danger');
      }
    });
  }

  // --- Initial Setup Modal Logic ---
  async function checkSetupStatus() {
    try {
      const status = await Api.get('/api/setup/status');
      if (status && !status.provisioned && setupBanner) {
        setupBanner.classList.remove('d-none');
      }
    } catch (e) {
      console.warn('Could not check setup status', e);
    }
  }

  if (openSetupModalBtn && setupModal) {
    openSetupModalBtn.addEventListener('click', () => {
      setupModal.classList.add('active');
    });
  }

  if (closeSetupModalBtn && setupModal) {
    closeSetupModalBtn.addEventListener('click', () => {
      setupModal.classList.remove('active');
    });
  }

  if (setupForm) {
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
        if (setupBanner) setupBanner.classList.add('d-none');

        // Populate email field for quick login
        if (emailInput) emailInput.value = adminEmail;
        if (passwordInput) passwordInput.value = adminPassword;

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
  }

  // Helpers
  function setLoading(isLoading) {
    if (!submitBtn) return;
    submitBtn.disabled = isLoading;
    if (isLoading) {
      submitBtn.classList.add('btn-loading');
    } else {
      submitBtn.classList.remove('btn-loading');
    }
  }

  function setRegLoading(isLoading) {
    if (!regSubmitBtn) return;
    regSubmitBtn.disabled = isLoading;
    if (isLoading) {
      regSubmitBtn.classList.add('btn-loading');
    } else {
      regSubmitBtn.classList.remove('btn-loading');
    }
  }

  function showAlert(msg, type = 'danger') {
    if (!alertBox || !alertText) return;
    alertBox.className = `alert alert-${type}`;
    alertText.textContent = msg;
    alertBox.classList.remove('d-none');
  }

  function clearErrors() {
    if (alertBox) alertBox.classList.add('d-none');
    if (emailError) emailError.classList.add('d-none');
    if (passwordError) passwordError.classList.add('d-none');
    if (regOrgError) regOrgError.classList.add('d-none');
    if (regNameError) regNameError.classList.add('d-none');
    if (regEmailError) regEmailError.classList.add('d-none');
    if (regPasswordError) regPasswordError.classList.add('d-none');
  }

  function showFieldError(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('d-none');
  }
});
