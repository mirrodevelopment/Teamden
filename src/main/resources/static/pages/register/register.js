/**
 * Teamden / Brick — Company Registration Page Controller (register.js)
 * 4-Step Onboarding Flow with Client Validation & Backend Integration
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Redirect if already authenticated
  if (typeof Auth !== 'undefined' && typeof Auth.redirectIfAuthenticated === 'function') {
    await Auth.redirectIfAuthenticated();
  }

  // --- Element Selectors ---
  const form = document.getElementById('multi-step-form');
  const alertBox = document.getElementById('register-alert');
  const alertText = document.getElementById('register-alert-text');

  // Step Header
  const stepEyebrow = document.getElementById('current-step-eyebrow');
  const stepTitle = document.getElementById('current-step-title');
  const stepDesc = document.getElementById('current-step-desc');

  // Navigation Buttons
  const btnCancel = document.getElementById('btn-nav-cancel');
  const btnBack = document.getElementById('btn-nav-back');
  const btnContinue = document.getElementById('btn-nav-continue');
  const btnContinueText = document.getElementById('btn-continue-text');
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

  // Logo upload
  const logoDropzone = document.getElementById('logo-dropzone');
  const logoFileInput = document.getElementById('logo-file-input');
  const uploadIdleState = document.getElementById('upload-idle-state');
  const uploadPreviewState = document.getElementById('upload-preview-state');
  const logoPreviewImg = document.getElementById('logo-preview-img');
  const logoFileName = document.getElementById('logo-file-name');
  const removeLogoBtn = document.getElementById('remove-logo-btn');
  const errorLogoFile = document.getElementById('error-logo-file');
  let logoBase64 = null;

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

  // Avatar upload
  const avatarDropzone = document.getElementById('avatar-dropzone');
  const avatarFileInput = document.getElementById('avatar-file-input');
  const avatarIdleState = document.getElementById('avatar-idle-state');
  const avatarPreviewState = document.getElementById('avatar-preview-state');
  const avatarPreviewImg = document.getElementById('avatar-preview-img');
  const avatarFileName = document.getElementById('avatar-file-name');
  const removeAvatarBtn = document.getElementById('remove-avatar-btn');
  let avatarBase64 = null;

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

  // --- Step Navigation & UI Rendering ---
  function updateStepUI() {
    clearErrors();

    const meta = stepMeta[currentStep];
    if (stepEyebrow) stepEyebrow.textContent = meta.eyebrow;
    if (stepTitle) stepTitle.textContent = meta.title;
    if (stepDesc) stepDesc.textContent = meta.desc;

    for (let i = 1; i <= totalSteps; i++) {
      const section = document.getElementById(`section-step-${i}`);
      if (section) {
        if (i === currentStep) {
          section.classList.remove('d-none');
          section.classList.add('active');
        } else {
          section.classList.add('d-none');
          section.classList.remove('active');
        }
      }
    }

    for (let i = 1; i <= totalSteps; i++) {
      const node = document.getElementById(`step-node-${i}`);
      const connector = document.getElementById(`connector-${i}`);

      if (node) {
        node.classList.remove('active', 'completed');
        if (i === currentStep) {
          node.classList.add('active');
        } else if (i < currentStep) {
          node.classList.add('completed');
        }
      }

      if (connector) {
        if (i < currentStep) {
          connector.classList.add('completed');
        } else {
          connector.classList.remove('completed');
        }
      }
    }

    if (currentStep === 1) {
      if (btnCancel) btnCancel.classList.remove('d-none');
      if (btnBack) btnBack.classList.add('d-none');
      if (btnContinue) btnContinue.classList.remove('d-none');
      if (btnSubmit) btnSubmit.classList.add('d-none');
    } else if (currentStep < totalSteps) {
      if (btnCancel) btnCancel.classList.add('d-none');
      if (btnBack) btnBack.classList.remove('d-none');
      if (btnContinue) btnContinue.classList.remove('d-none');
      if (btnSubmit) btnSubmit.classList.add('d-none');
    } else {
      if (btnCancel) btnCancel.classList.add('d-none');
      if (btnBack) btnBack.classList.remove('d-none');
      if (btnContinue) btnContinue.classList.add('d-none');
      if (btnSubmit) btnSubmit.classList.remove('d-none');
      populateReviewSummary();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Step 1 Dynamic Industry Other ---
  if (selectIndustry && groupIndustryOther) {
    selectIndustry.addEventListener('change', () => {
      if (selectIndustry.value === 'Other') {
        groupIndustryOther.classList.remove('d-none');
      } else {
        groupIndustryOther.classList.add('d-none');
        if (inputIndustryOther) inputIndustryOther.value = '';
        clearFieldError('error-company-industry-other');
      }
    });
  }

  // --- Step 2 Country Change Suggestions & Conditional Rules ---
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

  function updateCountryConditionalRules() {
    if (!selectCountry) return;
    const selected = selectCountry.value;
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
    } else {
      if (tzSuggestionHint) {
        tzSuggestionHint.textContent = 'Please confirm the workspace time zone.';
      }
    }

    const requiresState = ['United States', 'Canada', 'Australia', 'India'].includes(selected);
    if (stateReqIndicator) {
      if (requiresState) {
        stateReqIndicator.classList.remove('d-none');
        if (stateOptHint) stateOptHint.classList.add('d-none');
      } else {
        stateReqIndicator.classList.add('d-none');
        if (stateOptHint) stateOptHint.classList.remove('d-none');
      }
    }

    const requiresZip = ['United States', 'United Kingdom', 'Canada', 'Australia', 'India', 'Germany', 'France'].includes(selected);
    if (zipReqIndicator) {
      if (requiresZip) {
        zipReqIndicator.classList.remove('d-none');
        if (zipOptHint) zipOptHint.classList.add('d-none');
      } else {
        zipReqIndicator.classList.add('d-none');
        if (zipOptHint) zipOptHint.classList.remove('d-none');
      }
    }
  }

  if (selectCountry) {
    selectCountry.addEventListener('change', updateCountryConditionalRules);
    // Initial evaluation
    if (selectCountry.value) {
      updateCountryConditionalRules();
    }
  }

  // --- Step 2 Billing Address Same Toggle ---
  if (checkBillingSame && groupBillingAddress) {
    checkBillingSame.addEventListener('change', () => {
      if (checkBillingSame.checked) {
        groupBillingAddress.classList.add('d-none');
      } else {
        groupBillingAddress.classList.remove('d-none');
        if (selectBillingCountry && selectCountry.value) {
          selectBillingCountry.value = selectCountry.value;
        }
      }
    });
  }

  // --- Step 3 Email Verification OTP Handling ---
  if (btnSendCode && inputAdminEmail) {
    btnSendCode.addEventListener('click', async () => {
      const email = inputAdminEmail.value.trim();
      clearFieldError('error-verification-code');
      clearFieldError('error-admin-email');

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError('error-admin-email', 'Please enter a valid work email address before requesting an OTP code.');
        inputAdminEmail.focus();
        return;
      }

      btnSendCode.disabled = true;
      btnSendCode.textContent = 'Sending...';

      try {
        const res = await Api.post('/api/setup/send-verification-code', { email });
        const code = res.data ? res.data.code : '';
        btnSendCode.textContent = 'Resend Code';
        btnSendCode.disabled = false;

        if (otpHintText) {
          otpHintText.textContent = `Verification code sent to ${email}. (Dev hint: ${code})`;
          otpHintText.style.color = 'var(--brick-text-primary)';
        }
        if (inputVerificationCode) {
          inputVerificationCode.value = code; // Auto-fill for convenience in local dev
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

  // --- Step 3 Password Strength Meter & Compromised Checks ---
  const COMMON_COMPROMISED_PASSWORDS = [
    'password', 'password123', 'password1', '12345678', '123456789', '1234567890',
    'admin123', 'admin1234', 'qwerty123', 'welcome123', 'letmein123', 'pass1234'
  ];

  function evaluatePasswordStrength(password) {
    if (!password) return { score: 0, label: '—', color: 'var(--brick-border)', pct: 0 };
    if (COMMON_COMPROMISED_PASSWORDS.includes(password.toLowerCase())) {
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
      if (inputAdminConfirmPassword && inputAdminConfirmPassword.value) {
        if (inputAdminPassword.value === inputAdminConfirmPassword.value) {
          clearFieldError('error-admin-confirm-password');
        }
      }
    });
  }

  if (inputAdminConfirmPassword) {
    inputAdminConfirmPassword.addEventListener('input', () => {
      if (inputAdminPassword.value && inputAdminConfirmPassword.value) {
        if (inputAdminPassword.value !== inputAdminConfirmPassword.value) {
          showError('error-admin-confirm-password', 'Passwords do not match.');
        } else {
          clearFieldError('error-admin-confirm-password');
        }
      }
    });
  }

  // --- Step Validations ---
  function validateCurrentStep() {
    clearErrors();
    let isValid = true;

    if (currentStep === 1) {
      const compName = inputCompanyName.value.trim();
      if (!compName || compName.length < 2) {
        showError('error-company-name', 'Company name must be at least 2 characters.');
        inputCompanyName.focus();
        isValid = false;
      }

      if (!selectCompanyType.value) {
        showError('error-company-type', 'Please select a company type.');
        if (isValid) selectCompanyType.focus();
        isValid = false;
      }

      if (!selectIndustry.value) {
        showError('error-company-industry', 'Please select an industry.');
        if (isValid) selectIndustry.focus();
        isValid = false;
      } else if (selectIndustry.value === 'Other') {
        const indOther = inputIndustryOther ? inputIndustryOther.value.trim() : '';
        if (!indOther) {
          showError('error-company-industry-other', 'Please specify your industry.');
          if (isValid && inputIndustryOther) inputIndustryOther.focus();
          isValid = false;
        }
      }

      if (!selectCompanySize.value) {
        showError('error-company-size', 'Please select company size.');
        if (isValid) selectCompanySize.focus();
        isValid = false;
      }

      const website = inputWebsite.value.trim();
      if (website && !/^https?:\/\/.+\..+/.test(website)) {
        showError('error-company-website', 'Please enter a valid URL (e.g. https://yourcompany.com).');
        if (isValid) inputWebsite.focus();
        isValid = false;
      }

      const year = inputYear.value.trim();
      const currentYear = new Date().getFullYear();
      if (year && (parseInt(year, 10) < 1800 || parseInt(year, 10) > currentYear)) {
        showError('error-company-year', `Please enter a valid established year between 1800 and ${currentYear}.`);
        if (isValid) inputYear.focus();
        isValid = false;
      }
    } else if (currentStep === 2) {
      if (!selectCountry.value) {
        showError('error-address-country', 'Please select a country or region.');
        selectCountry.focus();
        isValid = false;
      }

      const street = inputStreet.value.trim();
      if (!street) {
        showError('error-address-street', 'Please enter the registered street address.');
        if (isValid) inputStreet.focus();
        isValid = false;
      }

      const city = inputCity.value.trim();
      if (!city) {
        showError('error-address-city', 'Please enter the city or town.');
        if (isValid) inputCity.focus();
        isValid = false;
      }

      // State required for US, CA, AU, IN
      const requiresState = ['United States', 'Canada', 'Australia', 'India'].includes(selectCountry.value);
      const state = inputState.value.trim();
      if (requiresState && !state) {
        showError('error-address-state', `State or province is required for ${selectCountry.value}.`);
        if (isValid) inputState.focus();
        isValid = false;
      }

      // ZIP / Postal code required for major regions
      const requiresZip = ['United States', 'United Kingdom', 'Canada', 'Australia', 'India', 'Germany', 'France'].includes(selectCountry.value);
      const zip = inputZip.value.trim();
      if (requiresZip && !zip) {
        showError('error-address-zip', `Postal or ZIP code is required for ${selectCountry.value}.`);
        if (isValid) inputZip.focus();
        isValid = false;
      }

      // If billing address differs, validate billing fields
      if (checkBillingSame && !checkBillingSame.checked) {
        if (!selectBillingCountry.value) {
          showError('error-billing-country', 'Please select a billing country.');
          if (isValid) selectBillingCountry.focus();
          isValid = false;
        }
        if (!inputBillingStreet.value.trim()) {
          showError('error-billing-street', 'Please enter the billing address.');
          if (isValid) inputBillingStreet.focus();
          isValid = false;
        }
        if (!inputBillingCity.value.trim()) {
          showError('error-billing-city', 'Please enter the billing city.');
          if (isValid) inputBillingCity.focus();
          isValid = false;
        }
      }
    } else if (currentStep === 3) {
      const name = inputAdminName.value.trim();
      if (!name || name.length < 2) {
        showError('error-admin-name', 'Please enter the administrator full name.');
        inputAdminName.focus();
        isValid = false;
      }

      const email = inputAdminEmail.value.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError('error-admin-email', 'Please enter a valid work email address.');
        if (isValid) inputAdminEmail.focus();
        isValid = false;
      }

      // Email verification temporarily on hold: do not block registration if not yet verified
      // (User can still optionally test OTP via Send Code / Verify)

      const password = inputAdminPassword.value;
      if (!password || password.length < 8) {
        showError('error-admin-password', 'Password must be at least 8 characters long.');
        if (isValid) inputAdminPassword.focus();
        isValid = false;
      } else if (COMMON_COMPROMISED_PASSWORDS.includes(password.toLowerCase())) {
        showError('error-admin-password', 'This password is too commonly used and easily compromised. Please choose a stronger password.');
        if (isValid) inputAdminPassword.focus();
        isValid = false;
      }

      const confirmPw = inputAdminConfirmPassword.value;
      if (password !== confirmPw) {
        showError('error-admin-confirm-password', 'Passwords do not match.');
        if (isValid) inputAdminConfirmPassword.focus();
        isValid = false;
      }

      if (checkConsentTerms && !checkConsentTerms.checked) {
        showError('error-consent-terms', 'You must agree to the Terms of Service to proceed.');
        isValid = false;
      }

      if (checkConsentPrivacy && !checkConsentPrivacy.checked) {
        showError('error-consent-privacy', 'You must agree to the Privacy Policy to proceed.');
        isValid = false;
      }

      if (checkConsentAuth && !checkConsentAuth.checked) {
        showError('error-consent-auth', 'You must confirm authorization to register this company.');
        isValid = false;
      }
    } else if (currentStep === 4) {
      if (checkFinalConfirm && !checkFinalConfirm.checked) {
        showError('error-final-confirm', 'Please confirm that all information is accurate to create your workspace.');
        isValid = false;
      }
    }

    return isValid;
  }

  // --- Populate Step 4 Review Summary ---
  function populateReviewSummary() {
    if (summaryCompanyName) summaryCompanyName.textContent = inputCompanyName.value.trim() || '—';
    if (summaryLegalName) summaryLegalName.textContent = inputLegalName.value.trim() || 'Same as company name';
    if (summaryCompanyType) summaryCompanyType.textContent = selectCompanyType.value || '—';

    let indText = selectIndustry.value || '—';
    if (selectIndustry.value === 'Other' && inputIndustryOther && inputIndustryOther.value.trim()) {
      indText = `Other (${inputIndustryOther.value.trim()})`;
    }
    if (summaryIndustry) summaryIndustry.textContent = indText;

    if (summaryCompanySize) summaryCompanySize.textContent = selectCompanySize.value || '—';
    if (summaryWebsite) summaryWebsite.textContent = inputWebsite.value.trim() || 'None provided';
    if (summaryYear) summaryYear.textContent = inputYear.value.trim() || '—';

    const addr1 = inputStreet.value.trim();
    const addr2 = inputLine2.value.trim();
    const fullStreet = addr2 ? `${addr1}, ${addr2}` : addr1;
    if (summaryAddress) summaryAddress.textContent = fullStreet || '—';

    const city = inputCity.value.trim();
    const state = inputState.value.trim();
    if (summaryCityState) summaryCityState.textContent = (city && state) ? `${city}, ${state}` : (city || state || '—');

    if (summaryCountry) summaryCountry.textContent = selectCountry.value || '—';
    if (summaryZip) summaryZip.textContent = inputZip.value.trim() || '—';
    if (summaryRegNum) summaryRegNum.textContent = inputRegNumber.value.trim() || 'None provided';
    if (summaryTaxId) summaryTaxId.textContent = inputTaxId.value.trim() || 'None provided';

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

    if (summaryAdminName) summaryAdminName.textContent = inputAdminName.value.trim() || '—';
    if (summaryAdminEmail) summaryAdminEmail.textContent = inputAdminEmail.value.trim() || '—';
    if (summaryVerificationStatus) {
      summaryVerificationStatus.textContent = emailVerified ? 'Verified ✓' : 'Verification on hold (Active)';
    }
    if (summaryJobTitle) summaryJobTitle.textContent = inputJobTitle.value.trim() || 'Administrator';
    if (summaryPhone) summaryPhone.textContent = inputPhone.value.trim() || 'None provided';

    if (summaryCurrency) summaryCurrency.textContent = selectCurrency ? selectCurrency.value : 'USD';
    if (summaryTimezone) summaryTimezone.textContent = selectTimezone ? selectTimezone.value : 'UTC';
  }

  // --- Button Listeners ---
  if (btnContinue) {
    btnContinue.addEventListener('click', (e) => {
      e.preventDefault();
      if (validateCurrentStep()) {
        if (currentStep < totalSteps) {
          currentStep++;
          updateStepUI();
        }
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
      const targetStep = parseInt(btn.getAttribute('data-target-step'), 10);
      if (targetStep >= 1 && targetStep <= 3) {
        currentStep = targetStep;
        updateStepUI();
      }
    });
  });

  // --- Logo File Upload Handling ---
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
        logoBase64 = re.target.result;
        if (logoPreviewImg) logoPreviewImg.src = logoBase64;
        if (logoFileName) logoFileName.textContent = file.name;
        if (uploadIdleState) uploadIdleState.classList.add('d-none');
        if (uploadPreviewState) uploadPreviewState.classList.remove('d-none');
      };
      reader.readAsDataURL(file);
    });
  }

  if (removeLogoBtn) {
    removeLogoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      logoBase64 = null;
      if (logoFileInput) logoFileInput.value = '';
      if (logoPreviewImg) logoPreviewImg.src = '';
      if (uploadPreviewState) uploadPreviewState.classList.add('d-none');
      if (uploadIdleState) uploadIdleState.classList.remove('d-none');
      clearFieldError('error-logo-file');
    });
  }

  // --- Avatar File Upload Handling ---
  if (avatarDropzone && avatarFileInput) {
    avatarDropzone.addEventListener('click', (e) => {
      if (e.target !== removeAvatarBtn) {
        avatarFileInput.click();
      }
    });

    avatarFileInput.addEventListener('change', () => {
      const file = avatarFileInput.files[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        showError('error-avatar-file', 'Photo file size must be less than 5MB.');
        avatarFileInput.value = '';
        return;
      }

      if (!file.type.startsWith('image/')) {
        showError('error-avatar-file', 'Please select a valid image file (PNG, JPG).');
        avatarFileInput.value = '';
        return;
      }

      clearFieldError('error-avatar-file');
      const reader = new FileReader();
      reader.onload = (re) => {
        avatarBase64 = re.target.result;
        if (avatarPreviewImg) avatarPreviewImg.src = avatarBase64;
        if (avatarFileName) avatarFileName.textContent = file.name;
        if (avatarIdleState) avatarIdleState.classList.add('d-none');
        if (avatarPreviewState) avatarPreviewState.classList.remove('d-none');
      };
      reader.readAsDataURL(file);
    });
  }

  if (removeAvatarBtn) {
    removeAvatarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      avatarBase64 = null;
      if (avatarFileInput) avatarFileInput.value = '';
      if (avatarPreviewImg) avatarPreviewImg.src = '';
      if (avatarPreviewState) avatarPreviewState.classList.add('d-none');
      if (avatarIdleState) avatarIdleState.classList.remove('d-none');
      clearFieldError('error-avatar-file');
    });
  }

  // --- Password Visibility Toggle ---
  let adminPwVisible = false;
  if (toggleAdminPwBtn && inputAdminPassword) {
    toggleAdminPwBtn.addEventListener('click', () => {
      adminPwVisible = !adminPwVisible;
      inputAdminPassword.type = adminPwVisible ? 'text' : 'password';
      if (eyeIconAdmin) {
        eyeIconAdmin.innerHTML = adminPwVisible
          ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`
          : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
      }
    });
  }

  // --- Theme Toggle ---
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const isDark = (current === 'dark' || current === 'black-and-white' || current === 'bw');
      const next = isDark ? 'light' : 'black-and-white';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('teamden-theme', next);
    });
  }

  // --- Final Form Submission (Step 4) ---
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors();

      // Ensure all 4 steps are validated
      for (let s = 1; s <= 4; s++) {
        currentStep = s;
        if (!validateCurrentStep()) {
          updateStepUI();
          return;
        }
      }
      currentStep = 4;
      updateStepUI();

      // Gather complete payload matching CompleteRegistrationRequestDto
      const sameBilling = !checkBillingSame || checkBillingSame.checked;

      const payload = {
        organizationName: inputCompanyName.value.trim(),
        legalName: inputLegalName.value.trim() || null,
        companyLogo: logoBase64 || null,
        companyType: selectCompanyType.value,
        industry: selectIndustry.value,
        industryOther: (selectIndustry.value === 'Other' && inputIndustryOther) ? inputIndustryOther.value.trim() : null,
        companySize: selectCompanySize.value,
        websiteUrl: inputWebsite.value.trim() || null,
        yearEstablished: inputYear.value.trim() ? parseInt(inputYear.value.trim(), 10) : null,

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
        billingAddress: sameBilling ? inputStreet.value.trim() : (inputBillingStreet ? inputBillingStreet.value.trim() : null),
        billingAddressLine2: sameBilling ? (inputLine2.value.trim() || null) : (inputBillingLine2 ? inputBillingLine2.value.trim() || null : null),
        billingCity: sameBilling ? inputCity.value.trim() : (inputBillingCity ? inputBillingCity.value.trim() : null),
        billingState: sameBilling ? (inputState.value.trim() || null) : (inputBillingState ? inputBillingState.value.trim() || null : null),
        billingPostalCode: sameBilling ? (inputZip.value.trim() || null) : (inputBillingZip ? inputBillingZip.value.trim() || null : null),
        billingCountry: sameBilling ? selectCountry.value : (selectBillingCountry ? selectBillingCountry.value : null),

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

      setSubmittingState(true);

      try {
        await Api.post('/api/setup/register-company', payload);

        showAlert(`Workspace "${payload.organizationName}" created successfully! Launching your workspace...`, 'success');

        setTimeout(async () => {
          try {
            await Auth.login(payload.adminEmail, payload.adminPassword);
            const targetUrl = (typeof Company === 'function' ? Company('url') : '/pages/dashboard/dashboard.html');
            window.location.href = targetUrl;
          } catch (loginErr) {
            setSubmittingState(false);
            showAlert('Workspace created! Redirecting to sign in...', 'success');
            setTimeout(() => {
              window.location.href = `/pages/login/login.html?email=${encodeURIComponent(payload.adminEmail)}`;
            }, 1000);
          }
        }, 800);

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

  function showAlert(msg, type = 'danger') {
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
    if (alertBox) alertBox.classList.add('d-none');
    document.querySelectorAll('.field-error-msg').forEach((el) => {
      el.classList.add('d-none');
      el.textContent = '';
    });
  }

  // Initialize Stepper on DOM Ready
  updateStepUI();
});
