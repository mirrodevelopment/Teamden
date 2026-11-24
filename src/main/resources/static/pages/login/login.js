/**
 * Teamden / Brick — Auth & Company Registration Controller (login.js)
 * Dual-Mode: Neo-Editorial Login & 4-Step Company Registration Flow
 */

// --- Top-Level Constants & Helpers (S7721, S8786) ---
const regStepMeta = {
  1: {
    eyebrow: 'STEP 1 OF 4',
    title: 'Company Details',
    desc: 'Let’s start with some basic information about your company.'
  },
  2: {
    eyebrow: 'STEP 2 OF 4',
    title: 'Address & Legal',
    desc: 'Add your company’s registered address and relevant business details.'
  },
  3: {
    eyebrow: 'STEP 3 OF 4',
    title: 'Set up your administrator account',
    desc: 'Choose the person who will manage this company workspace.'
  },
  4: {
    eyebrow: 'STEP 4 OF 4',
    title: 'Review your company',
    desc: 'Check your information before creating your workspace.'
  }
};

function setText(el, val) {
  if (el) el.textContent = val || '—';
}

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  const at = trimmed.indexOf('@');
  const dot = trimmed.lastIndexOf('.');
  return at > 0 && dot > at + 1 && dot < trimmed.length - 1 && !trimmed.includes(' ');
}

function showAlert(msg, type = 'danger') {
  const alertBox = document.getElementById('login-alert');
  const alertText = document.getElementById('login-alert-text');
  if (!alertBox || !alertText) return;
  alertBox.className = `alert alert-${type}`;
  alertText.textContent = msg;
  alertBox.classList.remove('d-none');
  alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showError(errorId, msg) {
  const el = document.getElementById(errorId);
  if (el) {
    el.textContent = msg;
    el.classList.remove('d-none');
  }
}

function clearFieldError(errorId) {
  const el = document.getElementById(errorId);
  if (el) {
    el.classList.add('d-none');
    el.textContent = '';
  }
}

function clearErrors() {
  const alertBox = document.getElementById('login-alert');
  alertBox?.classList.add('d-none');
  document.querySelectorAll('.field-error-msg, .form-error').forEach((el) => {
    el.classList.add('d-none');
    el.textContent = '';
  });
}

function setupSocialSsoButtons() {
  ['btn-auth-google', 'btn-auth-microsoft', 'btn-auth-apple'].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const providerName = id.replace('btn-auth-', '');
        const capitalized = providerName.charAt(0).toUpperCase() + providerName.slice(1);
        showAlert(`${capitalized} Single Sign-On (SSO) is managed by your workspace administrator. Please sign in with your email and password.`, 'info');
      });
    }
  });
}

function setupThemeToggle(themeBtn) {
  if (!themeBtn) return;
  themeBtn.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme || 'light';
    const isDark = (current === 'dark' || current === 'black-and-white' || current === 'bw');
    const next = isDark ? 'light' : 'black-and-white';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('teamden-theme', next);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  // 1. If already authenticated, redirect immediately to dashboard
  if (typeof Auth !== 'undefined' && typeof Auth.redirectIfAuthenticated === 'function') {
    await Auth.redirectIfAuthenticated();
  }

  // --- Layout Containers ---
  const splitContainer = document.getElementById('auth-split-container');
  const leftSigninContent = document.getElementById('left-signin-content');
  const leftRegisterContent = document.getElementById('left-register-content');
  const previewHeading = document.getElementById('preview-stage-heading');
  const previewDesc = document.getElementById('preview-stage-desc');
  const previewStats = document.getElementById('preview-stats-row');

  // --- Top Switch Bar ---
  const topSwitchPrompt = document.getElementById('top-switch-prompt');
  const topSwitchBtn = document.getElementById('top-switch-btn');
  const loginThemeBtn = document.getElementById('login-theme-btn');

  // --- Sign-In Elements ---
  const signinWrapper = document.getElementById('signin-view-wrapper');
  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const togglePasswordBtn = document.getElementById('toggle-password-btn');
  const eyeIcon = document.getElementById('eye-icon');
  const submitBtn = document.getElementById('submit-btn');
  const btnText = document.getElementById('btn-text');
  const forgotPasswordLink = document.getElementById('forgot-password-link');

  // --- Registration 4-Step Elements ---
  const registerWrapper = document.getElementById('register-flow-wrapper');
  const registerForm = document.getElementById('register-company-form');

  // Stepper Header
  const currentStepEyebrow = document.getElementById('current-step-eyebrow');
  const currentStepTitle = document.getElementById('current-step-title');
  const currentStepDesc = document.getElementById('current-step-desc');

  // Step Navigation Buttons
  const btnRegCancel = document.getElementById('btn-reg-cancel');
  const btnRegBack = document.getElementById('btn-reg-back');
  const btnRegContinue = document.getElementById('btn-reg-continue');
  const regSubmitBtn = document.getElementById('reg-submit-btn');
  const regBtnText = document.getElementById('reg-btn-text');

  // Step 1 Fields
  const regOrgName = document.getElementById('reg-org-name');
  const regLegalName = document.getElementById('reg-legal-name');
  const regCompanyType = document.getElementById('reg-company-type');
  const regIndustry = document.getElementById('reg-industry');
  const regCompanySize = document.getElementById('reg-company-size');
  const regWebsite = document.getElementById('reg-website');
  const regYear = document.getElementById('reg-year');

  // Logo upload
  const logoDropzone = document.getElementById('logo-dropzone');
  const logoFileInput = document.getElementById('logo-file-input');
  const uploadIdleState = document.getElementById('upload-idle-state');
  const uploadPreviewState = document.getElementById('upload-preview-state');
  const logoPreviewImg = document.getElementById('logo-preview-img');
  const logoFileName = document.getElementById('logo-file-name');
  const removeLogoBtn = document.getElementById('remove-logo-btn');

  // Step 2 Fields
  const regCountry = document.getElementById('reg-country');
  const regStreet = document.getElementById('reg-street');
  const regLine2 = document.getElementById('reg-line2');
  const regCity = document.getElementById('reg-city');
  const regState = document.getElementById('reg-state');
  const regZip = document.getElementById('reg-zip');
  const regBusinessNum = document.getElementById('reg-business-num');
  const regTaxId = document.getElementById('reg-tax-id');

  // Step 3 Fields
  const regAdminName = document.getElementById('reg-admin-name');
  const regAdminEmail = document.getElementById('reg-admin-email');
  const regAdminPassword = document.getElementById('reg-admin-password');
  const regConfirmPassword = document.getElementById('reg-confirm-password');
  const regJobTitle = document.getElementById('reg-job-title');
  const regPhone = document.getElementById('reg-phone');
  const regConsentTerms = document.getElementById('reg-consent-terms');
  const regTogglePasswordBtn = document.getElementById('reg-toggle-password-btn');
  const regEyeIcon = document.getElementById('reg-eye-icon');

  // Step 4 Summary Fields
  const summaryCompanyName = document.getElementById('summary-company-name');
  const summaryLegalName = document.getElementById('summary-legal-name');
  const summaryCompanyType = document.getElementById('summary-company-type');
  const summaryIndustry = document.getElementById('summary-industry');
  const summaryCompanySize = document.getElementById('summary-company-size');
  const summaryWebsite = document.getElementById('summary-website');
  const summaryYear = document.getElementById('summary-year');

  const summaryAddress = document.getElementById('summary-address');
  const summaryCityState = document.getElementById('summary-city-state');
  const summaryCountry = document.getElementById('summary-country');
  const summaryZip = document.getElementById('summary-zip');
  const summaryRegNum = document.getElementById('summary-reg-num');
  const summaryTaxId = document.getElementById('summary-tax-id');

  const summaryAdminName = document.getElementById('summary-admin-name');
  const summaryAdminEmail = document.getElementById('summary-admin-email');
  const summaryJobTitle = document.getElementById('summary-job-title');
  const summaryPhone = document.getElementById('summary-phone');

  const jumpButtons = document.querySelectorAll('.btn-jump-step');

  // Stepper State
  let currentRegStep = 1;
  const totalRegSteps = 4;

  // --- Auth Mode Switcher ---
  function applyRegisterMode() {
    splitContainer?.classList.remove('mode-signin');
    splitContainer?.classList.add('mode-register');

    leftSigninContent?.classList.add('d-none');
    leftRegisterContent?.classList.remove('d-none');
    if (previewHeading) previewHeading.textContent = 'Welcome to your workspace';
    if (previewDesc) previewDesc.textContent = 'All-in-one team & work management';
    previewStats?.classList.add('d-none');

    signinWrapper?.classList.add('d-none');
    registerWrapper?.classList.remove('d-none');
    if (topSwitchPrompt) topSwitchPrompt.textContent = 'Already have an account?';
    if (topSwitchBtn) topSwitchBtn.textContent = 'Sign in';

    currentRegStep = 1;
    updateRegStepUI();
    regOrgName?.focus();
  }

  function applySigninMode() {
    splitContainer?.classList.remove('mode-register');
    splitContainer?.classList.add('mode-signin');

    leftRegisterContent?.classList.add('d-none');
    leftSigninContent?.classList.remove('d-none');
    if (previewHeading) previewHeading.textContent = 'projects';
    if (previewDesc) previewDesc.textContent = 'Everything we\'re building, in one place.';
    previewStats?.classList.remove('d-none');

    registerWrapper?.classList.add('d-none');
    signinWrapper?.classList.remove('d-none');
    if (topSwitchPrompt) topSwitchPrompt.textContent = 'New to Brick?';
    if (topSwitchBtn) topSwitchBtn.textContent = 'Create account';

    emailInput?.focus();
  }

  function setAuthMode(mode) {
    clearErrors();
    if (mode === 'register') {
      applyRegisterMode();
    } else {
      applySigninMode();
    }
  }

  if (window.location.hash === '#register' || window.location.search.includes('mode=register')) {
    window.location.replace('/pages/register/register.html');
    return;
  }

  if (topSwitchBtn) {
    topSwitchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '/pages/register/register.html';
    });
  }

  // --- Stepper Navigation & UI Rendering ---
  function updateStepSections() {
    for (let i = 1; i <= totalRegSteps; i++) {
      const section = document.getElementById(`section-step-${i}`);
      if (!section) continue;
      const isActive = i === currentRegStep;
      section.classList.toggle('d-none', !isActive);
      section.classList.toggle('active', isActive);
    }
  }

  function updateStepNodes() {
    for (let i = 1; i <= totalRegSteps; i++) {
      const node = document.getElementById(`step-node-${i}`);
      const connector = document.getElementById(`connector-${i}`);
      if (node) {
        node.classList.remove('active', 'completed');
        if (i === currentRegStep) node.classList.add('active');
        else if (i < currentRegStep) node.classList.add('completed');
      }
      if (connector) {
        connector.classList.toggle('completed', i < currentRegStep);
      }
    }
  }

  function updateStepButtons() {
    const isFirst = currentRegStep === 1;
    const isLast = currentRegStep === totalRegSteps;

    btnRegCancel?.classList.toggle('d-none', !isFirst);
    btnRegBack?.classList.toggle('d-none', isFirst);
    btnRegContinue?.classList.toggle('d-none', isLast);
    regSubmitBtn?.classList.toggle('d-none', !isLast);

    if (isLast) populateReviewSummary();
  }

  function updateRegStepUI() {
    clearErrors();
    const meta = regStepMeta[currentRegStep];
    if (currentStepEyebrow) currentStepEyebrow.textContent = meta.eyebrow;
    if (currentStepTitle) currentStepTitle.textContent = meta.title;
    if (currentStepDesc) currentStepDesc.textContent = meta.desc;

    updateStepSections();
    updateStepNodes();
    updateStepButtons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Step Validations ---
  function validateStep1() {
    const compName = regOrgName ? regOrgName.value.trim() : '';
    if (!compName || compName.length < 2) {
      showError('reg-org-error', 'Company name must be at least 2 characters.');
      regOrgName?.focus();
      return false;
    }
    if (regCompanyType && !regCompanyType.value) {
      showError('error-company-type', 'Please select a company type.');
      regCompanyType.focus();
      return false;
    }
    if (regIndustry && !regIndustry.value) {
      showError('error-industry', 'Please select an industry.');
      regIndustry.focus();
      return false;
    }
    if (regCompanySize && !regCompanySize.value) {
      showError('error-company-size', 'Please select company size.');
      regCompanySize.focus();
      return false;
    }
    const website = regWebsite ? regWebsite.value.trim() : '';
    if (website && !/^https?:\/\/\S+\.\S+/.test(website)) {
      showError('error-website', 'Please enter a valid website URL (e.g. https://yourcompany.com).');
      regWebsite?.focus();
      return false;
    }
    const year = regYear ? regYear.value.trim() : '';
    const currentYear = new Date().getFullYear();
    if (year) {
      const parsedYear = Number.parseInt(year, 10);
      if (parsedYear < 1800 || parsedYear > currentYear) {
        showError('error-year', `Please enter a reasonable 4-digit year between 1800 and ${currentYear}.`);
        regYear?.focus();
        return false;
      }
    }
    return true;
  }

  function validateStep2() {
    if (regCountry && !regCountry.value) {
      showError('error-country', 'Please select a country or region.');
      regCountry.focus();
      return false;
    }
    const fields = [
      { el: regStreet, id: 'error-street', msg: 'Please enter the registered street address.' },
      { el: regCity, id: 'error-city', msg: 'Please enter the city or town.' },
      { el: regState, id: 'error-state', msg: 'Please enter the state or province.' },
      { el: regZip, id: 'error-zip', msg: 'Please enter the postal or ZIP code.' }
    ];
    for (const f of fields) {
      const val = f.el ? f.el.value.trim() : '';
      if (!val) {
        showError(f.id, f.msg);
        f.el?.focus();
        return false;
      }
    }
    return true;
  }

  function validateStep3() {
    const name = regAdminName ? regAdminName.value.trim() : '';
    if (!name || name.length < 2) {
      showError('reg-name-error', 'Please enter the administrator full name.');
      regAdminName?.focus();
      return false;
    }
    const email = regAdminEmail ? regAdminEmail.value.trim() : '';
    if (!isValidEmail(email)) {
      showError('reg-email-error', 'Please enter a valid work email address.');
      regAdminEmail?.focus();
      return false;
    }
    const password = regAdminPassword ? regAdminPassword.value : '';
    if (!password || password.length < 8) {
      showError('reg-password-error', 'Password must be at least 8 characters long.');
      regAdminPassword?.focus();
      return false;
    }
    const confirmPw = regConfirmPassword ? regConfirmPassword.value : '';
    if (password !== confirmPw) {
      showError('error-confirm-password', 'Passwords do not match.');
      regConfirmPassword?.focus();
      return false;
    }
    if (regConsentTerms && !regConsentTerms.checked) {
      showError('error-consent-terms', 'You must agree to the Terms of Service and Privacy Policy to proceed.');
      return false;
    }
    return true;
  }

  function validateCurrentRegStep() {
    clearErrors();
    if (currentRegStep === 1) return validateStep1();
    if (currentRegStep === 2) return validateStep2();
    if (currentRegStep === 3) return validateStep3();
    return true;
  }

  // --- Populate Step 4 Review Summary ---
  function populateReviewSummary() {
    setText(summaryCompanyName, regOrgName?.value?.trim());
    setText(summaryLegalName, regLegalName?.value?.trim() || 'Same as display name');
    setText(summaryCompanyType, regCompanyType?.value);
    setText(summaryIndustry, regIndustry?.value);
    setText(summaryCompanySize, regCompanySize?.value);
    setText(summaryWebsite, regWebsite?.value?.trim() || 'None provided');
    setText(summaryYear, regYear?.value?.trim());

    const addr1 = regStreet?.value?.trim() || '';
    const addr2 = regLine2?.value?.trim() || '';
    setText(summaryAddress, addr2 ? `${addr1}, ${addr2}` : addr1);

    const city = regCity?.value?.trim() || '';
    const state = regState?.value?.trim() || '';
    setText(summaryCityState, city && state ? `${city}, ${state}` : (city || state));

    setText(summaryCountry, regCountry?.value);
    setText(summaryZip, regZip?.value?.trim());
    setText(summaryRegNum, regBusinessNum?.value?.trim() || 'None provided');
    setText(summaryTaxId, regTaxId?.value?.trim() || 'None provided');

    setText(summaryAdminName, regAdminName?.value?.trim());
    setText(summaryAdminEmail, regAdminEmail?.value?.trim());
    setText(summaryJobTitle, regJobTitle?.value?.trim() || 'Administrator / Owner');
    setText(summaryPhone, regPhone?.value?.trim() || 'None provided');
  }

  // --- Registration Stepper Buttons ---
  if (btnRegContinue) {
    btnRegContinue.addEventListener('click', (e) => {
      e.preventDefault();
      if (validateCurrentRegStep() && currentRegStep < totalRegSteps) {
        currentRegStep++;
        updateRegStepUI();
      }
    });
  }

  if (btnRegBack) {
    btnRegBack.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentRegStep > 1) {
        currentRegStep--;
        updateRegStepUI();
      }
    });
  }

  if (btnRegCancel) {
    btnRegCancel.addEventListener('click', (e) => {
      e.preventDefault();
      setAuthMode('signin');
    });
  }

  jumpButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = Number.parseInt(btn.dataset.targetStep || '0', 10);
      if (target >= 1 && target <= 3) {
        currentRegStep = target;
        updateRegStepUI();
      }
    });
  });

  // --- Logo Upload Handling ---
  if (logoDropzone && logoFileInput) {
    logoDropzone.addEventListener('click', (e) => {
      if (e.target !== removeLogoBtn) {
        logoFileInput.click();
      }
    });

    logoFileInput.addEventListener('change', () => {
      const file = logoFileInput.files[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        showError('error-logo-file', 'Logo file size must be less than 5MB.');
        logoFileInput.value = '';
        return;
      }

      if (!file.type.startsWith('image/')) {
        showError('error-logo-file', 'Please select a valid image file (PNG, JPG, SVG).');
        logoFileInput.value = '';
        return;
      }

      clearFieldError('error-logo-file');
      const reader = new FileReader();
      reader.onload = (re) => {
        if (logoPreviewImg) logoPreviewImg.src = re.target.result;
        if (logoFileName) logoFileName.textContent = file.name;
        uploadIdleState?.classList.add('d-none');
        uploadPreviewState?.classList.remove('d-none');
      };
      reader.readAsDataURL(file);
    });
  }

  if (removeLogoBtn) {
    removeLogoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (logoFileInput) logoFileInput.value = '';
      if (logoPreviewImg) logoPreviewImg.src = '';
      uploadPreviewState?.classList.add('d-none');
      uploadIdleState?.classList.remove('d-none');
      clearFieldError('error-logo-file');
    });
  }

  // --- Registration Password Visibility ---
  let regPasswordVisible = false;
  if (regTogglePasswordBtn && regAdminPassword) {
    regTogglePasswordBtn.addEventListener('click', () => {
      regPasswordVisible = !regPasswordVisible;
      regAdminPassword.type = regPasswordVisible ? 'text' : 'password';
      if (regEyeIcon) {
        regEyeIcon.innerHTML = regPasswordVisible
          ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`
          : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
      }
    });
  }

  // --- Step 4 Final Registration Form Submission ---
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors();

      for (let s = 1; s <= 3; s++) {
        currentRegStep = s;
        if (!validateCurrentRegStep()) {
          updateRegStepUI();
          return;
        }
      }
      currentRegStep = 4;
      updateRegStepUI();

      const organizationName = regOrgName ? regOrgName.value.trim() : '';
      const adminName = regAdminName ? regAdminName.value.trim() : '';
      const adminEmail = regAdminEmail ? regAdminEmail.value.trim() : '';
      const adminPassword = regAdminPassword ? regAdminPassword.value : '';

      setRegLoading(true);

      try {
        await Api.post('/api/setup/register-company', {
          organizationName,
          adminName,
          adminEmail,
          adminPassword
        });

        showAlert(`Company "${organizationName}" registered successfully! Launching your workspace...`, 'success');

        setTimeout(async () => {
          try {
            await Auth.login(adminEmail, adminPassword);
            const targetUrl = (typeof Company === 'function' ? Company('url') : '/pages/dashboard/dashboard.html');
            window.location.href = targetUrl;
          } catch (loginErr) {
            console.warn('Auto-login after registration failed, falling back to signin:', loginErr);
            setRegLoading(false);
            showAlert('Company registered! Redirecting to sign in...', 'success');
            setTimeout(() => {
              setAuthMode('signin');
              if (emailInput) emailInput.value = adminEmail;
              if (passwordInput) passwordInput.value = adminPassword;
            }, 1000);
          }
        }, 800);

      } catch (err) {
        setRegLoading(false);
        showAlert(err.message || 'Registration failed. Please check inputs and try again.', 'danger');
      }
    });
  }

  // --- Sign-In Form Elements & Submission ---
  let loginPasswordVisible = false;
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      loginPasswordVisible = !loginPasswordVisible;
      passwordInput.type = loginPasswordVisible ? 'text' : 'password';
      if (eyeIcon) {
        eyeIcon.innerHTML = loginPasswordVisible
          ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`
          : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors();

      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';

      if (!email) {
        showError('email-error', 'Please enter your work email.');
        return;
      }
      if (!isValidEmail(email)) {
        showError('email-error', 'Please enter a valid email address.');
        return;
      }
      if (!password) {
        showError('password-error', 'Please enter your password.');
        return;
      }

      setLoginLoading(true);

      try {
        await Auth.login(email, password);
        const targetUrl = (typeof Company === 'function' ? Company('url') : '/pages/dashboard/dashboard.html');
        window.location.href = targetUrl;
      } catch (err) {
        setLoginLoading(false);
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

  // --- Social SSO & Theme Toggle ---
  setupSocialSsoButtons();
  setupThemeToggle(loginThemeBtn);

  // --- URL Parameters Handling ---
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('expired') === 'true') {
    showAlert('Your session has expired. Please sign in again to continue.', 'warning');
  } else if (urlParams.get('logout') === 'true') {
    showAlert('You have been signed out safely.', 'success');
  } else if (urlParams.get('setup') === 'true' || urlParams.get('register') === 'true' || urlParams.get('register') === 'company' || urlParams.get('mode') === 'register') {
    setAuthMode('register');
  }

  const prefillEmail = urlParams.get('email');
  if (prefillEmail) {
    if (emailInput) emailInput.value = decodeURIComponent(prefillEmail);
    if (regAdminEmail) regAdminEmail.value = decodeURIComponent(prefillEmail);
  }

  // --- Helper Functions ---
  function setLoginLoading(isLoading) {
    if (!submitBtn) return;
    submitBtn.disabled = isLoading;
    if (btnText) btnText.textContent = isLoading ? 'Signing in...' : 'Log in';
    submitBtn.classList.toggle('btn-loading', isLoading);
  }

  function setRegLoading(isLoading) {
    if (!regSubmitBtn) return;
    regSubmitBtn.disabled = isLoading;
    if (btnRegBack) btnRegBack.disabled = isLoading;
    if (regBtnText) regBtnText.textContent = isLoading ? 'Creating Company...' : 'Create Company';
    regSubmitBtn.classList.toggle('btn-loading', isLoading);
  }
});
