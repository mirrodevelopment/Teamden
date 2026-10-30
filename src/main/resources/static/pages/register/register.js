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

  // Step 2 Elements
  const selectCountry = document.getElementById('address-country');
  const inputStreet = document.getElementById('address-street');
  const inputLine2 = document.getElementById('address-line2');
  const inputCity = document.getElementById('address-city');
  const inputState = document.getElementById('address-state');
  const inputZip = document.getElementById('address-zip');
  const selectCurrency = document.getElementById('currency-preference');
  const inputRegNumber = document.getElementById('legal-reg-number');
  const inputTaxId = document.getElementById('legal-tax-id');

  // Step 3 Elements
  const inputAdminName = document.getElementById('admin-name');
  const inputAdminEmail = document.getElementById('admin-email');
  const inputAdminPassword = document.getElementById('admin-password');
  const inputAdminConfirmPassword = document.getElementById('admin-confirm-password');
  const inputJobTitle = document.getElementById('admin-job-title');
  const inputPhone = document.getElementById('admin-phone');
  const checkTerms = document.getElementById('consent-terms');
  const toggleAdminPwBtn = document.getElementById('toggle-admin-pw');
  const eyeIconAdmin = document.getElementById('eye-icon-admin');

  // Step 4 Summary Elements
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

  // Jump Step Buttons
  const jumpButtons = document.querySelectorAll('.btn-jump-step');

  // Theme Toggle
  const themeBtn = document.getElementById('register-theme-btn');

  // State Management
  let currentStep = 1;
  const totalSteps = 4;
  let uploadedLogoFile = null;

  const stepMeta = {
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

  // --- Step Navigation & UI Rendering ---
  function updateStepUI() {
    clearErrors();

    // 1. Update Stepper Header
    const meta = stepMeta[currentStep];
    if (stepEyebrow) stepEyebrow.textContent = meta.eyebrow;
    if (stepTitle) stepTitle.textContent = meta.title;
    if (stepDesc) stepDesc.textContent = meta.desc;

    // 2. Toggle Step Section Visibility
    for (let i = 1; i <= totalSteps; i++) {
      const section = document.getElementById(`section-step-i`.replace('i', i));
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

    // 3. Update Progress Stepper Nodes & Connectors
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

    // 4. Update Navigation Buttons
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
      // Step 4: Review
      if (btnCancel) btnCancel.classList.add('d-none');
      if (btnBack) btnBack.classList.remove('d-none');
      if (btnContinue) btnContinue.classList.add('d-none');
      if (btnSubmit) btnSubmit.classList.remove('d-none');
      populateReviewSummary();
    }

    // Smooth scroll to top of form
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

      const state = inputState.value.trim();
      if (!state) {
        showError('error-address-state', 'Please enter the state or province.');
        if (isValid) inputState.focus();
        isValid = false;
      }

      const zip = inputZip.value.trim();
      if (!zip) {
        showError('error-address-zip', 'Please enter the postal or ZIP code.');
        if (isValid) inputZip.focus();
        isValid = false;
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

      const password = inputAdminPassword.value;
      if (!password || password.length < 8) {
        showError('error-admin-password', 'Password must be at least 8 characters long.');
        if (isValid) inputAdminPassword.focus();
        isValid = false;
      }

      const confirmPw = inputAdminConfirmPassword.value;
      if (password !== confirmPw) {
        showError('error-admin-confirm-password', 'Passwords do not match.');
        if (isValid) inputAdminConfirmPassword.focus();
        isValid = false;
      }

      if (!checkTerms.checked) {
        showError('error-consent-terms', 'You must agree to the Terms of Service and Privacy Policy to proceed.');
        isValid = false;
      }
    }

    return isValid;
  }

  // --- Populate Step 4 Review Summary ---
  function populateReviewSummary() {
    if (summaryCompanyName) summaryCompanyName.textContent = inputCompanyName.value.trim() || '—';
    if (summaryLegalName) summaryLegalName.textContent = inputLegalName.value.trim() || 'Same as display name';
    if (summaryCompanyType) summaryCompanyType.textContent = selectCompanyType.value || '—';
    if (summaryIndustry) summaryIndustry.textContent = selectIndustry.value || '—';
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

    if (summaryAdminName) summaryAdminName.textContent = inputAdminName.value.trim() || '—';
    if (summaryAdminEmail) summaryAdminEmail.textContent = inputAdminEmail.value.trim() || '—';
    if (summaryJobTitle) summaryJobTitle.textContent = inputJobTitle.value.trim() || 'Administrator / Owner';
    if (summaryPhone) summaryPhone.textContent = inputPhone.value.trim() || 'None provided';
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

  // Jump to specific step from Review summary
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

      // Validate size (< 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError('error-logo-file', 'Logo file size must be less than 5MB.');
        logoFileInput.value = '';
        return;
      }

      // Validate type
      if (!file.type.startsWith('image/')) {
        showError('error-logo-file', 'Please select a valid image file (PNG, JPG, SVG).');
        logoFileInput.value = '';
        return;
      }

      clearFieldError('error-logo-file');
      uploadedLogoFile = file;

      // Display preview
      const reader = new FileReader();
      reader.onload = (re) => {
        if (logoPreviewImg) logoPreviewImg.src = re.target.result;
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
      uploadedLogoFile = null;
      if (logoFileInput) logoFileInput.value = '';
      if (logoPreviewImg) logoPreviewImg.src = '';
      if (uploadPreviewState) uploadPreviewState.classList.add('d-none');
      if (uploadIdleState) uploadIdleState.classList.remove('d-none');
      clearFieldError('error-logo-file');
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

      // Ensure all 3 steps are valid before submission
      currentStep = 1;
      if (!validateCurrentStep()) {
        updateStepUI();
        return;
      }
      currentStep = 2;
      if (!validateCurrentStep()) {
        updateStepUI();
        return;
      }
      currentStep = 3;
      if (!validateCurrentStep()) {
        updateStepUI();
        return;
      }
      currentStep = 4;
      updateStepUI();

      // Gather submission payload matching SetupRequest DTO
      const organizationName = inputCompanyName.value.trim();
      const adminName = inputAdminName.value.trim();
      const adminEmail = inputAdminEmail.value.trim();
      const adminPassword = inputAdminPassword.value;

      // Lock button & show loading state
      setSubmittingState(true);

      try {
        // Backend API call: POST /api/setup/register-company
        await Api.post('/api/setup/register-company', {
          organizationName,
          adminName,
          adminEmail,
          adminPassword
        });

        showAlert(`Company "${organizationName}" registered successfully! Launching your workspace...`, 'success');

        // Automatic authentication and dashboard dispatch
        setTimeout(async () => {
          try {
            await Auth.login(adminEmail, adminPassword);
            const targetUrl = (typeof Company === 'function' ? Company('url') : '/pages/dashboard/dashboard.html');
            window.location.href = targetUrl;
          } catch (loginErr) {
            setSubmittingState(false);
            showAlert('Company registered! Redirecting to sign in...', 'success');
            setTimeout(() => {
              window.location.href = `/pages/login/login.html?email=${encodeURIComponent(adminEmail)}`;
            }, 1000);
          }
        }, 800);

      } catch (err) {
        setSubmittingState(false);
        showAlert(err.message || 'Company registration failed. Please check your information and try again.', 'danger');
      }
    });
  }

  // --- Helper Functions ---
  function setSubmittingState(isSubmitting) {
    if (!btnSubmit) return;
    btnSubmit.disabled = isSubmitting;
    if (btnBack) btnBack.disabled = isSubmitting;

    if (btnSubmitText) {
      btnSubmitText.textContent = isSubmitting ? 'Creating Company...' : 'Create Company';
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
