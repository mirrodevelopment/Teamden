/**
 * Teamden by shed — Centralized Company Data Fragment
 * Path: /fragments/company-data/company-data.js
 *
 * Single source of truth for company metadata, identity, contact, branding,
 * logo, typo, and URLs.
 * Accessible globally via window.CompanyData and shortcut function window.Company(key).
 */
(function (global) {
  'use strict';

  // Internal Company Configuration State
  const COMPANY_STATE = {
    name: 'BRICK',
    displayName: 'BRICK',
    brandName: 'BRICK by shed',
    mail: 'teamden@gmil.com',
    email: 'teamden@gmil.com',
    supportMail: 'teamden@gmil.com',
    ph: '+1 (555) 019-2834',
    phone: '+1 (555) 019-2834',
    address: '100 Innovation Way, Suite 400, Tech City, CA 94016',
    website: 'https://teamden.com',
    websiteUrl: 'https://teamden.com',

    // Primary Application URLs
    url: '/pages/dashboard/dashboard.html',
    homeUrl: '/pages/dashboard/dashboard.html',
    dashboardUrl: '/pages/dashboard/dashboard.html',
    loginUrl: '/pages/login/login.html',

    tagline: 'Team Productivity, Work Management & SaaS Platform',
    copyright: '© 2026 Teamden. All rights reserved.',
    foundedYear: '2026',
    parentCompany: 'shed',
    version: '1.0',

    // Logo & Visual Branding
    logo: '/assets/bric-typography.png',
    logoUrl: '/assets/bric-typography.png',
    logoImg: '/assets/bric-typography.png',
    logoAlt: 'BRICK',

    // Collapsed Icon Mark & Favicon
    icon: '/assets/bric-icon.png',
    iconUrl: '/assets/bric-icon.png',
    iconImg: '/assets/bric-icon.png',
    iconAlt: 'BRICK Icon',
    favicon: '/assets/bric-icon.png',

    // Typo (Brand Typography & Emblem Logo)
    typo: '/assets/bric-typography.png',
    typoUrl: '/assets/bric-typography.png',
    typoLogo: '/assets/bric-typography.png',
    typoText: 'BRICK Team and Work Management',
    typoFont: 'Montserrat',
    font: 'Montserrat',
    fontFamily: 'Montserrat'
  };

  /**
   * Universal getter for company properties.
   * If called with no arguments or with 'name', returns company name ('teamden').
   * Examples:
   *   Company()          => "teamden"
   *   Company('name')    => "teamden"
   *   Company('logo')    => "/assets/teamden-minimalist-logo.png"
   *   Company('icon')    => "/assets/teamden-minimalist-icon.png"
   *   Company('typo')    => "/assets/teamden-minimalist-logo.png"
   *   Company('url')     => "/"
   *   Company('mail')    => "teamden@gmil.com"
   */
  function Company(key) {
    if (!key) return COMPANY_STATE.name;
    const normalizedKey = String(key).trim().toLowerCase();

    // Exact match
    if (key in COMPANY_STATE) {
      return COMPANY_STATE[key];
    }
    // Lowercase match
    if (normalizedKey in COMPANY_STATE) {
      return COMPANY_STATE[normalizedKey];
    }
    // Common aliases
    if (normalizedKey === 'typo' || normalizedKey === 'typography' || normalizedKey === 'typo_url') {
      return COMPANY_STATE.typo;
    }
    if (normalizedKey === 'typotext' || normalizedKey === 'typo_text') {
      return COMPANY_STATE.typoText;
    }
    if (normalizedKey === 'link' || normalizedKey === 'home' || normalizedKey === 'dashboard') {
      return COMPANY_STATE.url;
    }
    if (normalizedKey === 'login') {
      return COMPANY_STATE.loginUrl;
    }
    return COMPANY_STATE.name;
  }

  // Attach dynamic getter properties to Company function: Company.name, Company.logo, Company.url
  Object.keys(COMPANY_STATE).forEach((k) => {
    Object.defineProperty(Company, k, {
      get: () => COMPANY_STATE[k],
      set: (val) => {
        COMPANY_STATE[k] = val;
        CompanyData.hydrate();
      },
      enumerable: true,
      configurable: true
    });
  });

  /**
   * Full CompanyData API Object
   */
  const CompanyData = {
    // Dynamic getters
    get name() { return COMPANY_STATE.name; },
    get displayName() { return COMPANY_STATE.displayName; },
    get brandName() { return COMPANY_STATE.brandName; },
    get mail() { return COMPANY_STATE.mail; },
    get email() { return COMPANY_STATE.email; },
    get ph() { return COMPANY_STATE.ph; },
    get phone() { return COMPANY_STATE.phone; },
    get address() { return COMPANY_STATE.address; },
    get website() { return COMPANY_STATE.website; },
    get websiteUrl() { return COMPANY_STATE.websiteUrl; },
    get url() { return COMPANY_STATE.url; },
    get homeUrl() { return COMPANY_STATE.homeUrl; },
    get dashboardUrl() { return COMPANY_STATE.dashboardUrl; },
    get loginUrl() { return COMPANY_STATE.loginUrl; },
    get tagline() { return COMPANY_STATE.tagline; },
    get copyright() { return COMPANY_STATE.copyright; },
    get logo() { return COMPANY_STATE.logo; },
    get icon() { return COMPANY_STATE.icon; },
    get typo() { return COMPANY_STATE.typo; },
    get typoText() { return COMPANY_STATE.typoText; },
    get fontFamily() { return COMPANY_STATE.fontFamily; },

    /**
     * Safe lookup with fallback
     */
    get(key, fallback = '') {
      if (!key) return COMPANY_STATE.name;
      const k = String(key).trim();
      return COMPANY_STATE[k] || COMPANY_STATE[k.toLowerCase()] || fallback;
    },

    /**
     * Runtime setters (automatically re-hydrates all pages and elements)
     */
    setUrl(newUrl) {
      if (!newUrl) return;
      COMPANY_STATE.url = newUrl;
      COMPANY_STATE.homeUrl = newUrl;
      COMPANY_STATE.dashboardUrl = newUrl;
      CompanyData.hydrate();
      return newUrl;
    },

    setLoginUrl(newLoginUrl) {
      if (!newLoginUrl) return;
      COMPANY_STATE.loginUrl = newLoginUrl;
      CompanyData.hydrate();
      return newLoginUrl;
    },

    setLogo(newLogo) {
      if (!newLogo) return;
      COMPANY_STATE.logo = newLogo;
      COMPANY_STATE.logoUrl = newLogo;
      COMPANY_STATE.typo = newLogo;
      CompanyData.hydrate();
      return newLogo;
    },

    setIcon(newIcon) {
      if (!newIcon) return;
      COMPANY_STATE.icon = newIcon;
      COMPANY_STATE.iconUrl = newIcon;
      COMPANY_STATE.favicon = newIcon;
      CompanyData.hydrate();
      return newIcon;
    },

    formatTitle(pageTitle) {
      if (!pageTitle) return COMPANY_STATE.brandName;
      return `${pageTitle} — ${COMPANY_STATE.name}`;
    },

    getLogo() { return COMPANY_STATE.logo; },
    getIcon() { return COMPANY_STATE.icon; },
    getTypo() { return COMPANY_STATE.typo; },
    getUrl() { return COMPANY_STATE.url; },
    getLoginUrl() { return COMPANY_STATE.loginUrl; },
    getTypoText() { return COMPANY_STATE.typoText; },

    /**
     * HTML Generators for quick dynamic embedding in other pages
     */
    renderBrand(options = {}) {
      const url = options.url || COMPANY_STATE.url;
      const logoSrc = options.logo || COMPANY_STATE.logo;
      const iconSrc = options.icon || COMPANY_STATE.icon;
      const logoClass = options.logoClass || 'dash-brand-logo-img';
      const iconClass = options.iconClass || 'dash-brand-icon-img';
      const linkClass = options.linkClass || 'dash-brand';
      const title = options.title || COMPANY_STATE.brandName;

      return `<a href="${url}" class="${linkClass}" title="${title}" data-company="url">
        <img src="${logoSrc}" alt="${title}" class="${logoClass}" data-company="logo">
        <img src="${iconSrc}" alt="${COMPANY_STATE.displayName} Icon" class="${iconClass}" data-company="icon">
      </a>`;
    },

    renderLogo(options = {}) {
      const src = options.src || COMPANY_STATE.logo;
      const className = options.className || 'company-logo';
      const alt = options.alt || COMPANY_STATE.brandName;
      return `<img src="${src}" alt="${alt}" class="${className}" data-company="logo">`;
    },

    renderIcon(options = {}) {
      const src = options.src || COMPANY_STATE.icon;
      const className = options.className || 'company-icon';
      const alt = options.alt || COMPANY_STATE.displayName + ' Icon';
      return `<img src="${src}" alt="${alt}" class="${className}" data-company="icon">`;
    },

    /**
     * Automatically hydrates HTML elements with company data.
     */
    hydrate(root = document) {
      if (!root || typeof root.querySelectorAll !== 'function') return;

      // 1. data-company="<key>"
      root.querySelectorAll('[data-company]').forEach((el) => {
        const key = el.getAttribute('data-company');
        const val = Company(key);
        if (val) {
          applyValueToElement(el, key, val);
        }
      });

      // 2. Individual data-company-* attributes
      Object.keys(COMPANY_STATE).forEach((k) => {
        const attr = `data-company-${k.toLowerCase()}`;
        root.querySelectorAll(`[${attr}]`).forEach((el) => {
          applyValueToElement(el, k, COMPANY_STATE[k]);
        });
      });

      // 3. Special shortcuts: [data-company-url], [data-company-logo], [data-company-icon], [data-company-typo]
      root.querySelectorAll('[data-company-url]').forEach((el) => {
        applyValueToElement(el, 'url', COMPANY_STATE.url);
      });

      root.querySelectorAll('[data-company-login]').forEach((el) => {
        applyValueToElement(el, 'loginUrl', COMPANY_STATE.loginUrl);
      });

      root.querySelectorAll('[data-company-logo]').forEach((el) => {
        applyValueToElement(el, 'logo', COMPANY_STATE.logo);
      });

      root.querySelectorAll('[data-company-icon]').forEach((el) => {
        applyValueToElement(el, 'icon', COMPANY_STATE.icon);
      });

      root.querySelectorAll('[data-company-typo]').forEach((el) => {
        applyValueToElement(el, 'typo', COMPANY_STATE.typo);
      });

      // 4. Common class helpers
      const classMap = {
        'company-name': COMPANY_STATE.name,
        'company-display-name': COMPANY_STATE.displayName,
        'company-brand': COMPANY_STATE.brandName,
        'company-mail': COMPANY_STATE.mail,
        'company-ph': COMPANY_STATE.ph,
        'company-address': COMPANY_STATE.address,
        'company-tagline': COMPANY_STATE.tagline,
        'company-copyright': COMPANY_STATE.copyright,
        'company-logo': COMPANY_STATE.logo,
        'company-icon': COMPANY_STATE.icon,
        'company-typo': COMPANY_STATE.typo,
        'company-url': COMPANY_STATE.url,
        'company-link': COMPANY_STATE.url
      };

      Object.entries(classMap).forEach(([className, val]) => {
        root.querySelectorAll(`.${className}`).forEach((el) => {
          if (!el.hasAttribute('data-company-custom')) {
            applyValueToElement(el, className, val);
          }
        });
      });
    }
  };

  function applyValueToElement(el, key, val) {
    const k = String(key).toLowerCase();

    // 1. Image elements (logo, icon, typo)
    if (el.tagName === 'IMG') {
      if (el.src !== val && !el.src.endsWith(val)) {
        el.src = val;
      }
      if (!el.getAttribute('alt')) {
        el.alt = COMPANY_STATE.brandName || COMPANY_STATE.name;
      }
      return;
    }

    // 2. Favicon / Link elements
    if (el.tagName === 'LINK' && (k.includes('icon') || k.includes('favicon') || (el.rel && el.rel.includes('icon')))) {
      if (el.href !== val && !el.href.endsWith(val)) {
        el.href = val;
      }
      return;
    }

    // 3. Anchor tags (links, email, phone, url)
    if (el.tagName === 'A') {
      if (k === 'url' || k === 'homeurl' || k === 'dashboardurl' || k === 'website' || k === 'websiteurl' || k === 'link') {
        el.setAttribute('href', val);
        if (el.children.length === 0 && (!el.textContent.trim() || el.hasAttribute('data-company-replace'))) {
          el.textContent = COMPANY_STATE.brandName || COMPANY_STATE.name;
        }
        return;
      }
      if (k === 'loginurl' || k === 'login') {
        el.setAttribute('href', val);
        return;
      }
      if (k.includes('mail') || k.includes('email')) {
        if (!el.getAttribute('href') || el.getAttribute('href') === '#' || el.getAttribute('href').startsWith('mailto:')) {
          el.setAttribute('href', `mailto:${val}`);
        }
        if (!el.textContent.trim() || el.hasAttribute('data-company-replace')) {
          el.textContent = val;
        }
        return;
      }
      if (k.includes('ph') || k.includes('phone')) {
        if (!el.getAttribute('href') || el.getAttribute('href') === '#' || el.getAttribute('href').startsWith('tel:')) {
          el.setAttribute('href', `tel:${val.replace(/[^+\d]/g, '')}`);
        }
        if (!el.textContent.trim() || el.hasAttribute('data-company-replace')) {
          el.textContent = val;
        }
        return;
      }
    }

    // 4. Inputs / textareas
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      if (el.hasAttribute('data-company-placeholder')) {
        el.placeholder = val;
      } else {
        el.value = val;
      }
      return;
    }

    // 5. Standard text elements
    if (el.textContent !== val) {
      el.textContent = val;
    }
  }

  // Setup DOM MutationObserver to auto-hydrate any elements dynamically added later
  let mutationTimeout = null;
  function setupMutationObserver() {
    if (typeof MutationObserver === 'undefined' || typeof document === 'undefined') return;
    const observer = new MutationObserver((mutations) => {
      let shouldHydrate = false;
      for (let i = 0; i < mutations.length; i++) {
        const m = mutations[i];
        if (m.addedNodes && m.addedNodes.length > 0) {
          shouldHydrate = true;
          break;
        }
      }
      if (shouldHydrate) {
        if (mutationTimeout) clearTimeout(mutationTimeout);
        mutationTimeout = setTimeout(() => CompanyData.hydrate(), 30);
      }
    });

    observer.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true
    });
  }

  // Global click delegator fallback for brand and company links
  if (typeof document !== 'undefined') {
    document.addEventListener('click', (e) => {
      const link = e.target && e.target.closest ? e.target.closest('[data-company-url], [data-company="url"]') : null;
      if (link && link.tagName === 'A') {
        const currentUrl = Company('url');
        if (currentUrl && link.getAttribute('href') !== currentUrl) {
          link.setAttribute('href', currentUrl);
        }
      }
    }, true);
  }

  // Expose globally
  global.CompanyData = CompanyData;
  global.Company = Company;

  // Auto-hydrate on DOM ready & setup observer
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        CompanyData.hydrate();
        setupMutationObserver();
      });
    } else {
      CompanyData.hydrate();
      setupMutationObserver();
    }
  }

})(typeof window !== 'undefined' ? window : globalThis);
