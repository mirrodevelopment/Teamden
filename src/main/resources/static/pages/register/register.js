/**
 * Teamden / Brick — Company Registration Page Controller (register.js)
 * 4-Step Onboarding Flow with Client Validation & Backend Integration
 */

// --- Constants & Lookups ---
const COMMON_COMPROMISED_PASSWORDS = new Set([
  'password', 'password123', 'password1', '12345678', '123456789', '1234567890',
  'admin123', 'admin1234', 'qwerty123', 'welcome123', 'letmein123', 'pass1234'
]);

const countryDefaults = {
  'United States': { currency: 'USD', timezone: 'America/New_York' },
  'United Kingdom': { currency: 'GBP', timezone: 'Europe/London' },
  'Canada': { currency: 'CAD', timezone: 'America/New_York' },
  'Australia': { currency: 'AUD', timezone: 'Australia/Sydney' },
  'Germany': { currency: 'EUR', timezone: 'Europe/Berlin' },
  'France': { currency: 'EUR', timezone: 'Europe/Paris' },
  'India': { currency: 'INR', timezone: 'Asia/Kolkata' },
  'Singapore': { currency: 'SGD', timezone: 'Asia/Singapore' },
  'Netherlands': { currency: 'EUR', timezone: 'Europe/Berlin' },
  'United Arab Emirates': { currency: 'AED', timezone: 'Asia/Dubai' }
};

const stepMeta = {
  1: {
    eyebrow: 'STEP 1 OF 4',
    title: 'Company Details',
    desc: 'Let’s start with some basic information about your company.'
  },
  2: {
    eyebrow: 'STEP 2 OF 4',
    title: 'Address & Legal',
    desc: 'Add your company’s registered address and regional settings.'
  },
  3: {
    eyebrow: 'STEP 3 OF 4',
    title: 'Administrator Account',
    desc: 'Set up the first user and Owner of this organization workspace.'
  },
  4: {
    eyebrow: 'STEP 4 OF 4',
    title: 'Review & Create',
    desc: 'Review your complete registration before creating your workspace.'
  }
};

// --- Top-Level Helper Functions (S7721, S8786) ---
function setText(el, text) {
  if (el) {
    el.textContent = text;
  }
}

function toggleDisplay(el, isVisible) {
  if (el) {
    el.classList.toggle('d-none', !isVisible);
  }
}

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  const at = trimmed.indexOf('@');
  const dot = trimmed.lastIndexOf('.');
  return at > 0 && dot > at + 1 && dot < trimmed.length - 1 && !trimmed.includes(' ');
}

function assertField(condition, errorId, errorMsg, inputEl, state) {
  if (condition) {
    showError(errorId, errorMsg);
    if (state.valid && inputEl) {
      inputEl.focus();
    }
    state.valid = false;
  }
}

function resolveBillingField(sameBilling, registeredVal, customInput) {
  if (sameBilling) {
    return registeredVal || null;
  }
  return customInput?.value?.trim() || null;
}

function evaluatePasswordStrength(password) {
  if (!password) return { score: 0, label: '—', color: 'var(--brick-border)', pct: 0 };
  if (COMMON_COMPROMISED_PASSWORDS.has(password.toLowerCase())) {
    return { score: 1, label: 'Compromised', color: 'var(--dash-dot-red, #ef4444)', pct: 15 };
  }
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return { score: 1, label: 'Weak', color: 'var(--dash-dot-red, #ef4444)', pct: 25 };
  } else if (score <= 2) {
    return { score: 2, label: 'Medium', color: 'var(--dash-dot-yellow, #f59e0b)', pct: 50 };
  } else if (score <= 3) {
    return { score: 3, label: 'Strong', color: 'var(--dash-col-now-border, #3b82f6)', pct: 75 };
  } else {
    return { score: 4, label: 'Very Strong', color: 'var(--dash-dot-green, #10b981)', pct: 100 };
  }
}

function showAlert(msg, type = 'danger') {
  const alertBox = document.getElementById('register-alert');
  const alertText = document.getElementById('register-alert-text');
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
  const alertBox = document.getElementById('register-alert');
  if (alertBox) alertBox.classList.add('d-none');
  document.querySelectorAll('.field-error-msg').forEach((el) => {
    el.classList.add('d-none');
    el.textContent = '';
  });
}

function setupFileUpload({ dropzone, fileInput, removeBtn, imgEl, nameEl, idleState, previewState, errorId, onLoaded, onRemoved }) {
  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', (e) => {
    if (e.target !== removeBtn) {
      fileInput.click();
    }
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showError(errorId, 'File size must be less than 5MB.');
      fileInput.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      showError(errorId, 'Please select a valid image file (PNG, JPG).');
      fileInput.value = '';
      return;
    }

    clearFieldError(errorId);
    const reader = new FileReader();
    reader.onload = (re) => {
      const dataUrl = re.target.result;
      if (imgEl) imgEl.src = dataUrl;
      if (nameEl) nameEl.textContent = file.name;
      toggleDisplay(idleState, false);
      toggleDisplay(previewState, true);
      onLoaded(dataUrl);
    };
    reader.readAsDataURL(file);
  });

  if (removeBtn) {
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.value = '';
      if (imgEl) imgEl.src = '';
      toggleDisplay(previewState, false);
      toggleDisplay(idleState, true);
      clearFieldError(errorId);
      onRemoved();
    });
  }
}

function setupPasswordVisibility(toggleBtn, inputEl, eyeIcon) {
  if (!toggleBtn || !inputEl) return;
  let isVisible = false;
  toggleBtn.addEventListener('click', () => {
    isVisible = !isVisible;
    inputEl.type = isVisible ? 'text' : 'password';
    if (eyeIcon) {
      eyeIcon.innerHTML = isVisible
        ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`
        : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof Auth !== 'undefined' && typeof Auth.redirectIfAuthenticated === 'function') {
    await Auth.redirectIfAuthenticated();
  }

  // --- Element Selectors ---
  const form = document.getElementById('multi-step-form');

  // Step Header
  const stepEyebrow = document.getElementById('current-step-eyebrow');
  const stepTitle = document.getElementById('current-step-title');
  const stepDesc = document.getElementById('current-step-desc');

  // Navigation Buttons
  const btnCancel = document.getElementById('btn-nav-cancel');
  const btnBack = document.getElementById('btn-nav-back');
  const btnContinue = document.getElementById('btn-nav-continue');
  const btnSubmit = document.getElementById('btn-nav-submit');
  const btnSubmitText = document.getElementById('btn-submit-text');

  // Step 1 Elements
  const inputCompanyName = document.getElementById('company-name');
  const inputLegalName = document.getElementById('legal-company-name');
  const selectCompanyType = document.getElementById('company-type');
  const selectIndustry = document.getElementById('company-industry');
  const groupIndustryOther = document.getElementById('company-industry-other-group');
  const inputIndustryOther = document.getElementById('company-industry-other');
  const selectCompanySize = document.getElementById('company-size');
  const inputWebsite = document.getElementById('company-website');
  const inputYear = document.getElementById('company-year');

  // Logo upload state
  let logoBase64 = null;
  setupFileUpload({
    dropzone: document.getElementById('logo-dropzone'),
    fileInput: document.getElementById('logo-file-input'),
    removeBtn: document.getElementById('remove-logo-btn'),
    imgEl: document.getElementById('logo-preview-img'),
    nameEl: document.getElementById('logo-file-name'),
    idleState: document.getElementById('upload-idle-state'),
    previewState: document.getElementById('upload-preview-state'),
    errorId: 'error-logo-file',
    onLoaded: (data) => { logoBase64 = data; },
    onRemoved: () => { logoBase64 = null; }
  });

  // Step 2 Elements
  const selectCountry = document.getElementById('address-country');
  const inputStreet = document.getElementById('address-street');
  const inputLine2 = document.getElementById('address-line2');
  const inputCity = document.getElementById('address-city');
  const inputState = document.getElementById('address-state');
  const inputZip = document.getElementById('address-zip');
  const stateReqIndicator = document.getElementById('state-req-indicator');
  const stateOptHint = document.getElementById('state-opt-hint');
  const zipReqIndicator = document.getElementById('zip-req-indicator');
  const zipOptHint = document.getElementById('zip-opt-hint');
  const tzSuggestionHint = document.getElementById('timezone-suggestion-hint');
  const selectCurrency = document.getElementById('currency-preference');
  const selectTimezone = document.getElementById('timezone-preference');
  const inputRegNumber = document.getElementById('legal-reg-number');
  const inputTaxId = document.getElementById('legal-tax-id');
  const checkBillingSame = document.getElementById('billing-same-as-registered');
  const groupBillingAddress = document.getElementById('billing-address-group');
  const selectBillingCountry = document.getElementById('billing-country');
  const inputBillingStreet = document.getElementById('billing-street');
  const inputBillingLine2 = document.getElementById('billing-line2');
  const inputBillingCity = document.getElementById('billing-city');
  const inputBillingState = document.getElementById('billing-state');
  const inputBillingZip = document.getElementById('billing-zip');

  // Step 3 Elements
  const inputAdminName = document.getElementById('admin-name');
  const inputAdminEmail = document.getElementById('admin-email');
  const inputVerificationCode = document.getElementById('verification-code');
  const btnSendCode = document.getElementById('btn-send-code');
  const btnVerifyCode = document.getElementById('btn-verify-code');
  const badgeEmailVerified = document.getElementById('email-verified-badge');
  const otpHintText = document.getElementById('otp-hint-text');
  let emailVerified = false;

  const inputAdminPassword = document.getElementById('admin-password');
  const inputAdminConfirmPassword = document.getElementById('admin-confirm-password');
  const strengthBarFill = document.getElementById('strength-bar-fill');
  const strengthLabel = document.getElementById('strength-label');
  const toggleAdminPwBtn = document.getElementById('toggle-admin-pw');
  const eyeIconAdmin = document.getElementById('eye-icon-admin');

  const inputJobTitle = document.getElementById('admin-job-title');
  const inputPhone = document.getElementById('admin-phone');

  // Avatar upload state
  let avatarBase64 = null;
  setupFileUpload({
    dropzone: document.getElementById('avatar-dropzone'),
    fileInput: document.getElementById('avatar-file-input'),
    removeBtn: document.getElementById('remove-avatar-btn'),
    imgEl: document.getElementById('avatar-preview-img'),
    nameEl: document.getElementById('avatar-file-name'),
    idleState: document.getElementById('avatar-idle-state'),
    previewState: document.getElementById('avatar-preview-state'),
    errorId: 'error-avatar-file',
    onLoaded: (data) => { avatarBase64 = data; },
    onRemoved: () => { avatarBase64 = null; }
  });

  setupPasswordVisibility(toggleAdminPwBtn, inputAdminPassword, eyeIconAdmin);

  // Consent Checkboxes
  const checkConsentTerms = document.getElementById('consent-terms');
  const checkConsentPrivacy = document.getElementById('consent-privacy');
  const checkConsentAuth = document.getElementById('consent-auth');

  // Step 4 Elements
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
  const summaryBillingAddress = document.getElementById('summary-billing-address');

  const summaryAdminName = document.getElementById('summary-admin-name');
  const summaryAdminEmail = document.getElementById('summary-admin-email');
  const summaryVerificationStatus = document.getElementById('summary-verification-status');
  const summaryJobTitle = document.getElementById('summary-job-title');
  const summaryPhone = document.getElementById('summary-phone');
  const summaryCurrency = document.getElementById('summary-currency');
  const summaryTimezone = document.getElementById('summary-timezone');
  const checkFinalConfirm = document.getElementById('final-confirm-checkbox');

  // Jump Step Buttons
  const jumpButtons = document.querySelectorAll('.btn-jump-step');

  // Theme Toggle
  const themeBtn = document.getElementById('register-theme-btn');

  // State Management
  let currentStep = 1;
  const totalSteps = 4;

  // --- Step Navigation & UI Rendering ---
  function updateHeaderInfo(step) {
    const meta = stepMeta[step];
    setText(stepEyebrow, meta.eyebrow);
    setText(stepTitle, meta.title);
    setText(stepDesc, meta.desc);
  }

  function updateStepSections(step) {
    for (let i = 1; i <= totalSteps; i++) {
      const section = document.getElementById(`section-step-${i}`);
      if (section) {
        const isActive = (i === step);
        toggleDisplay(section, isActive);
        section.classList.toggle('active', isActive);
      }
    }
  }

  function updateStepStepper(step) {
    for (let i = 1; i <= totalSteps; i++) {
      const node = document.getElementById(`step-node-${i}`);
      const connector = document.getElementById(`connector-${i}`);

      if (node) {
        node.classList.remove('active', 'completed');
        if (i === step) {
          node.classList.add('active');
        } else if (i < step) {
          node.classList.add('completed');
        }
      }

      if (connector) {
        connector.classList.toggle('completed', i < step);
      }
    }
  }

  function updateNavButtons(step) {
    const isFirst = (step === 1);
    const isLast = (step === totalSteps);
    toggleDisplay(btnCancel, isFirst);
    toggleDisplay(btnBack, !isFirst);
    toggleDisplay(btnContinue, !isLast);
    toggleDisplay(btnSubmit, isLast);
    if (isLast) {
      populateReviewSummary();
    }
  }

  function updateStepUI() {
    clearErrors();
    updateHeaderInfo(currentStep);
    updateStepSections(currentStep);
    updateStepStepper(currentStep);
    updateNavButtons(currentStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Step 1 Dynamic Industry Other ---
  if (selectIndustry && groupIndustryOther) {
    selectIndustry.addEventListener('change', () => {
      const isOther = (selectIndustry.value === 'Other');
      toggleDisplay(groupIndustryOther, isOther);
      if (!isOther) {
        if (inputIndustryOther) inputIndustryOther.value = '';
        clearFieldError('error-company-industry-other');
      }
    });
  }

  // --- Step 2 Country Conditional Rules ---
  function applyCountryDefaults(selected) {
    const def = countryDefaults[selected];
    if (def) {
      if (selectCurrency && def.currency) {
        selectCurrency.value = def.currency;
      }
      if (selectTimezone && def.timezone) {
        selectTimezone.value = def.timezone;
      }
      if (tzSuggestionHint) {
        tzSuggestionHint.textContent = `Suggested for ${selected} (${def.timezone}) — please confirm.`;
      }
    } else if (tzSuggestionHint) {
      tzSuggestionHint.textContent = 'Please confirm the workspace time zone.';
    }
  }

  function updateStateRequirement(selected) {
    const requiresState = ['United States', 'Canada', 'Australia', 'India'].includes(selected);
    toggleDisplay(stateReqIndicator, requiresState);
    toggleDisplay(stateOptHint, !requiresState);
  }

  function updateZipRequirement(selected) {
    const requiresZip = ['United States', 'United Kingdom', 'Canada', 'Australia', 'India', 'Germany', 'France'].includes(selected);
    toggleDisplay(zipReqIndicator, requiresZip);
    toggleDisplay(zipOptHint, !requiresZip);
  }

  function updateCountryConditionalRules() {
    if (!selectCountry) return;
    const selected = selectCountry.value;
    applyCountryDefaults(selected);
    updateStateRequirement(selected);
    updateZipRequirement(selected);
  }

  if (selectCountry) {
    selectCountry.addEventListener('change', updateCountryConditionalRules);
    if (selectCountry.value) {
      updateCountryConditionalRules();
    }
  }

  // --- Step 2 Billing Address Same Toggle ---
  if (checkBillingSame && groupBillingAddress) {
    checkBillingSame.addEventListener('change', () => {
      const isDifferent = !checkBillingSame.checked;
      toggleDisplay(groupBillingAddress, isDifferent);
      if (isDifferent && selectBillingCountry && selectCountry?.value) {
        selectBillingCountry.value = selectCountry.value;
      }
    });
  }

  // --- Step 3 Email Verification OTP Handling ---
  if (btnSendCode && inputAdminEmail) {
    btnSendCode.addEventListener('click', async () => {
      const email = inputAdminEmail.value.trim();
      clearFieldError('error-verification-code');
      clearFieldError('error-admin-email');

      if (!isValidEmail(email)) {
        showError('error-admin-email', 'Please enter a valid work email address before requesting an OTP code.');
        inputAdminEmail.focus();
        return;
      }

      btnSendCode.disabled = true;
      btnSendCode.textContent = 'Sending...';

      try {
        const res = await Api.post('/api/setup/send-verification-code', { email });
        const code = res.data?.code || '';
        btnSendCode.textContent = 'Resend Code';
        btnSendCode.disabled = false;

        if (otpHintText) {
          otpHintText.textContent = `Verification code sent to ${email}. (Dev hint: ${code})`;
          otpHintText.style.color = 'var(--brick-text-primary)';
        }
        if (inputVerificationCode) {
          inputVerificationCode.value = code;
          inputVerificationCode.focus();
        }
      } catch (err) {
        btnSendCode.textContent = 'Send Code';
        btnSendCode.disabled = false;
        showError('error-verification-code', err.message || 'Failed to send verification code. Please try again.');
      }
    });
  }

  if (btnVerifyCode && inputVerificationCode && inputAdminEmail) {
    btnVerifyCode.addEventListener('click', async () => {
      const email = inputAdminEmail.value.trim();
      const code = inputVerificationCode.value.trim();
      clearFieldError('error-verification-code');

      if (!email) {
        showError('error-admin-email', 'Please enter your work email.');
        return;
      }
      if (!code || code.length < 4) {
        showError('error-verification-code', 'Please enter the 6-digit verification code.');
        inputVerificationCode.focus();
        return;
      }

      btnVerifyCode.disabled = true;
      btnVerifyCode.textContent = 'Verifying...';

      try {
        await Api.post('/api/setup/verify-code', { email, code });
        emailVerified = true;
        btnVerifyCode.textContent = 'Verified ✓';
        btnVerifyCode.disabled = true;
        if (btnSendCode) btnSendCode.disabled = true;

        if (badgeEmailVerified) {
          badgeEmailVerified.className = 'verification-pill verified';
          badgeEmailVerified.innerHTML = '<span class="pill-dot"></span> Verified ✓';
        }
        if (otpHintText) {
          otpHintText.textContent = 'Email address verified successfully!';
          otpHintText.style.color = 'var(--brick-success)';
        }
      } catch (err) {
        btnVerifyCode.disabled = false;
        btnVerifyCode.textContent = 'Verify';
        showError('error-verification-code', err.message || 'Invalid or expired verification code.');
      }
    });
  }

  // --- Step 3 Password Strength Meter & Confirm Checks ---
  if (inputAdminPassword) {
    inputAdminPassword.addEventListener('input', () => {
      const pw = inputAdminPassword.value;
      const res = evaluatePasswordStrength(pw);
      if (strengthBarFill) {
        strengthBarFill.style.width = `${res.pct}%`;
        strengthBarFill.style.backgroundColor = res.color;
      }
      if (strengthLabel) {
        strengthLabel.textContent = `Strength: ${res.label}`;
        strengthLabel.style.color = res.color;
      }
      if (inputAdminConfirmPassword?.value && inputAdminPassword.value === inputAdminConfirmPassword.value) {
        clearFieldError('error-admin-confirm-password');
      }
    });
  }

  if (inputAdminConfirmPassword) {
    inputAdminConfirmPassword.addEventListener('input', () => {
      if (inputAdminPassword?.value && inputAdminConfirmPassword.value) {
        if (inputAdminPassword.value !== inputAdminConfirmPassword.value) {
          showError('error-admin-confirm-password', 'Passwords do not match.');
        } else {
          clearFieldError('error-admin-confirm-password');
        }
      }
    });
  }

  // --- Step Validations (S3776 Refactored) ---
  function validateStep1() {
    const state = { valid: true };
    const compName = inputCompanyName.value.trim();
    assertField(!compName || compName.length < 2, 'error-company-name', 'Company name must be at least 2 characters.', inputCompanyName, state);
    assertField(!selectCompanyType.value, 'error-company-type', 'Please select a company type.', selectCompanyType, state);
    assertField(!selectIndustry.value, 'error-company-industry', 'Please select an industry.', selectIndustry, state);

    if (selectIndustry.value === 'Other') {
      const indOther = inputIndustryOther?.value?.trim() || '';
      assertField(!indOther, 'error-company-industry-other', 'Please specify your industry.', inputIndustryOther, state);
    }

    assertField(!selectCompanySize.value, 'error-company-size', 'Please select company size.', selectCompanySize, state);

    const website = inputWebsite.value.trim();
    assertField(Boolean(website && !/^https?:\/\/.+\..+/.test(website)), 'error-company-website', 'Please enter a valid URL (e.g. https://yourcompany.com).', inputWebsite, state);

    const year = inputYear.value.trim();
    if (year) {
      const currentYear = new Date().getFullYear();
      const parsedYear = Number.parseInt(year, 10);
      assertField(parsedYear < 1800 || parsedYear > currentYear, 'error-company-year', `Please enter a valid established year between 1800 and ${currentYear}.`, inputYear, state);
    }

    return state.valid;
  }

  function validateBillingFields(state) {
    assertField(!selectBillingCountry.value, 'error-billing-country', 'Please select a billing country.', selectBillingCountry, state);
    assertField(!inputBillingStreet.value.trim(), 'error-billing-street', 'Please enter the billing address.', inputBillingStreet, state);
    assertField(!inputBillingCity.value.trim(), 'error-billing-city', 'Please enter the billing city.', inputBillingCity, state);
  }

  function validateStep2() {
    const state = { valid: true };
    assertField(!selectCountry.value, 'error-address-country', 'Please select a country or region.', selectCountry, state);
    assertField(!inputStreet.value.trim(), 'error-address-street', 'Please enter the registered street address.', inputStreet, state);
    assertField(!inputCity.value.trim(), 'error-address-city', 'Please enter the city or town.', inputCity, state);

    const country = selectCountry.value;
    const requiresState = ['United States', 'Canada', 'Australia', 'India'].includes(country);
    assertField(requiresState && !inputState.value.trim(), 'error-address-state', `State or province is required for ${country}.`, inputState, state);

    const requiresZip = ['United States', 'United Kingdom', 'Canada', 'Australia', 'India', 'Germany', 'France'].includes(country);
    assertField(requiresZip && !inputZip.value.trim(), 'error-address-zip', `Postal or ZIP code is required for ${country}.`, inputZip, state);

    if (checkBillingSame && !checkBillingSame.checked) {
      validateBillingFields(state);
    }

    return state.valid;
  }

  function validateStep3() {
    const state = { valid: true };
    const name = inputAdminName.value.trim();
    assertField(!name || name.length < 2, 'error-admin-name', 'Please enter the administrator full name.', inputAdminName, state);

    const email = inputAdminEmail.value.trim();
    assertField(!isValidEmail(email), 'error-admin-email', 'Please enter a valid work email address.', inputAdminEmail, state);

    const password = inputAdminPassword.value;
    const isShortPw = !password || password.length < 8;
    assertField(isShortPw, 'error-admin-password', 'Password must be at least 8 characters long.', inputAdminPassword, state);

    if (!isShortPw && COMMON_COMPROMISED_PASSWORDS.has(password.toLowerCase())) {
      assertField(true, 'error-admin-password', 'This password is too commonly used and easily compromised. Please choose a stronger password.', inputAdminPassword, state);
    }

    const confirmPw = inputAdminConfirmPassword.value;
    assertField(password !== confirmPw, 'error-admin-confirm-password', 'Passwords do not match.', inputAdminConfirmPassword, state);

    assertField(Boolean(checkConsentTerms && !checkConsentTerms.checked), 'error-consent-terms', 'You must agree to the Terms of Service to proceed.', null, state);
    assertField(Boolean(checkConsentPrivacy && !checkConsentPrivacy.checked), 'error-consent-privacy', 'You must agree to the Privacy Policy to proceed.', null, state);
    assertField(Boolean(checkConsentAuth && !checkConsentAuth.checked), 'error-consent-auth', 'You must confirm authorization to register this company.', null, state);

    return state.valid;
  }

  function validateStep4() {
    if (checkFinalConfirm && !checkFinalConfirm.checked) {
      showError('error-final-confirm', 'Please confirm that all information is accurate to create your workspace.');
      return false;
    }
    return true;
  }

  function validateCurrentStep() {
    clearErrors();
    switch (currentStep) {
      case 1:
        return validateStep1();
      case 2:
        return validateStep2();
      case 3:
        return validateStep3();
      case 4:
        return validateStep4();
      default:
        return true;
    }
  }

  // --- Populate Step 4 Review Summary ---
  function populateCompanySummary() {
    setText(summaryCompanyName, inputCompanyName.value.trim() || '—');
    setText(summaryLegalName, inputLegalName.value.trim() || 'Same as company name');
    setText(summaryCompanyType, selectCompanyType.value || '—');

    let indText = selectIndustry.value || '—';
    if (selectIndustry.value === 'Other' && inputIndustryOther?.value?.trim()) {
      indText = `Other (${inputIndustryOther.value.trim()})`;
    }
    setText(summaryIndustry, indText);

    setText(summaryCompanySize, selectCompanySize.value || '—');
    setText(summaryWebsite, inputWebsite.value.trim() || 'None provided');
    setText(summaryYear, inputYear.value.trim() || '—');
  }

  function populateAddressSummary() {
    const addr1 = inputStreet.value.trim();
    const addr2 = inputLine2.value.trim();
    const fullStreet = addr2 ? `${addr1}, ${addr2}` : addr1;
    setText(summaryAddress, fullStreet || '—');

    const city = inputCity.value.trim();
    const state = inputState.value.trim();
    setText(summaryCityState, (city && state) ? `${city}, ${state}` : (city || state || '—'));

    setText(summaryCountry, selectCountry.value || '—');
    setText(summaryZip, inputZip.value.trim() || '—');
    setText(summaryRegNum, inputRegNumber.value.trim() || 'None provided');
    setText(summaryTaxId, inputTaxId.value.trim() || 'None provided');

    if (summaryBillingAddress) {
      if (!checkBillingSame || checkBillingSame.checked) {
        summaryBillingAddress.textContent = 'Same as registered address';
      } else {
        const bStreet = inputBillingStreet.value.trim();
        const bCity = inputBillingCity.value.trim();
        const bCountry = selectBillingCountry.value;
        summaryBillingAddress.textContent = `${bStreet}, ${bCity}, ${bCountry}`;
      }
    }
  }

  function populateAdminSummary() {
    setText(summaryAdminName, inputAdminName.value.trim() || '—');
    setText(summaryAdminEmail, inputAdminEmail.value.trim() || '—');
    setText(summaryVerificationStatus, emailVerified ? 'Verified ✓' : 'Verification on hold (Active)');
    setText(summaryJobTitle, inputJobTitle.value.trim() || 'Administrator');
    setText(summaryPhone, inputPhone.value.trim() || 'None provided');
    setText(summaryCurrency, selectCurrency ? selectCurrency.value : 'USD');
    setText(summaryTimezone, selectTimezone ? selectTimezone.value : 'UTC');
  }

  function populateReviewSummary() {
    populateCompanySummary();
    populateAddressSummary();
    populateAdminSummary();
  }

  // --- Button Listeners ---
  if (btnContinue) {
    btnContinue.addEventListener('click', (e) => {
      e.preventDefault();
      if (validateCurrentStep() && currentStep < totalSteps) {
        currentStep++;
        updateStepUI();
      }
    });
  }

  if (btnBack) {
    btnBack.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentStep > 1) {
        currentStep--;
        updateStepUI();
      }
    });
  }

  if (btnCancel) {
    btnCancel.addEventListener('click', (e) => {
      e.preventDefault();
      const hasInput = (inputCompanyName && inputCompanyName.value.trim().length > 0);
      if (!hasInput || confirm('Are you sure you want to cancel? Any details entered will not be saved.')) {
        window.location.href = '/pages/login/login.html';
      }
    });
  }

  jumpButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetStep = Number.parseInt(btn.dataset.targetStep || '', 10);
      if (targetStep >= 1 && targetStep <= 3) {
        currentStep = targetStep;
        updateStepUI();
      }
    });
  });

  // --- Theme Toggle ---
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.dataset.theme || 'light';
      const isDark = (current === 'dark' || current === 'black-and-white' || current === 'bw');
      const next = isDark ? 'light' : 'black-and-white';
      document.documentElement.dataset.theme = next;
      localStorage.setItem('teamden-theme', next);
    });
  }

  // --- Build Registration Payload ---
  function buildRegistrationPayload() {
    const sameBilling = !checkBillingSame || checkBillingSame.checked;

    return {
      organizationName: inputCompanyName.value.trim(),
      legalName: inputLegalName.value.trim() || null,
      companyLogo: logoBase64 || null,
      companyType: selectCompanyType.value,
      industry: selectIndustry.value,
      industryOther: (selectIndustry.value === 'Other' && inputIndustryOther) ? inputIndustryOther.value.trim() : null,
      companySize: selectCompanySize.value,
      websiteUrl: inputWebsite.value.trim() || null,
      yearEstablished: inputYear.value.trim() ? Number.parseInt(inputYear.value.trim(), 10) : null,

      country: selectCountry.value,
      registeredAddress: inputStreet.value.trim(),
      addressLine2: inputLine2.value.trim() || null,
      city: inputCity.value.trim(),
      state: inputState.value.trim() || null,
      postalCode: inputZip.value.trim() || null,
      currency: selectCurrency ? selectCurrency.value : 'USD',
      timezone: selectTimezone ? selectTimezone.value : 'UTC',
      businessRegNumber: inputRegNumber.value.trim() || null,
      taxId: inputTaxId.value.trim() || null,

      billingSameAsRegistered: sameBilling,
      billingAddress: resolveBillingField(sameBilling, inputStreet.value.trim(), inputBillingStreet),
      billingAddressLine2: resolveBillingField(sameBilling, inputLine2.value.trim(), inputBillingLine2),
      billingCity: resolveBillingField(sameBilling, inputCity.value.trim(), inputBillingCity),
      billingState: resolveBillingField(sameBilling, inputState.value.trim(), inputBillingState),
      billingPostalCode: resolveBillingField(sameBilling, inputZip.value.trim(), inputBillingZip),
      billingCountry: resolveBillingField(sameBilling, selectCountry.value, selectBillingCountry),

      adminName: inputAdminName.value.trim(),
      adminEmail: inputAdminEmail.value.trim(),
      verificationCode: inputVerificationCode ? inputVerificationCode.value.trim() : null,
      adminPassword: inputAdminPassword.value,
      jobTitle: inputJobTitle.value.trim() || null,
      phoneNumber: inputPhone.value.trim() || null,
      profilePicture: avatarBase64 || null,

      termsAccepted: checkConsentTerms ? checkConsentTerms.checked : true,
      privacyAccepted: checkConsentPrivacy ? checkConsentPrivacy.checked : true,
      authorizedToRegister: checkConsentAuth ? checkConsentAuth.checked : true
    };
  }

  async function handleAutoLogin(payload) {
    try {
      await Auth.login(payload.adminEmail, payload.adminPassword);
      const targetUrl = (typeof Company === 'function' ? Company('url') : '/pages/dashboard/dashboard.html');
      window.location.href = targetUrl;
    } catch (loginErr) {
      console.warn('Auto-login after registration failed, redirecting to login page:', loginErr);
      setSubmittingState(false);
      showAlert('Workspace created! Redirecting to sign in...', 'success');
      setTimeout(() => {
        window.location.href = `/pages/login/login.html?email=${encodeURIComponent(payload.adminEmail)}`;
      }, 1000);
    }
  }

  // --- Final Form Submission (Step 4) ---
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors();

      for (let s = 1; s <= 4; s++) {
        currentStep = s;
        if (!validateCurrentStep()) {
          updateStepUI();
          return;
        }
      }
      currentStep = 4;
      updateStepUI();

      const payload = buildRegistrationPayload();
      setSubmittingState(true);

      try {
        await Api.post('/api/setup/register-company', payload);
        showAlert(`Workspace "${payload.organizationName}" created successfully! Launching your workspace...`, 'success');
        setTimeout(() => handleAutoLogin(payload), 800);
      } catch (err) {
        setSubmittingState(false);
        showAlert(err.message || 'Company registration failed. Please review your details and try again.', 'danger');
      }
    });
  }

  // --- Helper Functions ---
  function setSubmittingState(isSubmitting) {
    if (!btnSubmit) return;
    btnSubmit.disabled = isSubmitting;
    if (btnBack) btnBack.disabled = isSubmitting;

    if (btnSubmitText) {
      btnSubmitText.textContent = isSubmitting ? 'Creating Workspace...' : 'Create Workspace';
    }

    if (isSubmitting) {
      btnSubmit.classList.add('btn-loading');
    } else {
      btnSubmit.classList.remove('btn-loading');
    }
  }

  // Initialize Stepper on DOM Ready
  updateStepUI();
});
