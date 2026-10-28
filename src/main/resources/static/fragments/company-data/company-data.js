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

  // Core Company Configuration
  const COMPANY_RAW = {
    name: 'teamden',
    displayName: 'Teamden',
    brandName: 'Teamden by shed',
    mail: 'teamden@gmil.com',
    email: 'teamden@gmil.com',
    supportMail: 'teamden@gmil.com',
    ph: '+1 (555) 019-2834',
    phone: '+1 (555) 019-2834',
    address: '100 Innovation Way, Suite 400, Tech City, CA 94016',
    website: 'https://teamden.com',
    websiteUrl: 'https://teamden.com',
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
    logo: '/assets/teamden-minimalist-logo.png',
    logoUrl: '/assets/teamden-minimalist-logo.png',
    logoImg: '/assets/teamden-minimalist-logo.png',
    logoAlt: 'Teamden Logo',

    // Collapsed Icon Mark & Favicon
    icon: '/assets/teamden-minimalist-icon.png',
    iconUrl: '/assets/teamden-minimalist-icon.png',
    iconImg: '/assets/teamden-minimalist-icon.png',
    iconAlt: 'Teamden Icon',
    favicon: '/assets/teamden-minimalist-icon.png',

    // Typo (Brand Typography & Emblem Logo)
    typo: '/assets/teamden-minimalist-logo.png',
    typoUrl: '/assets/teamden-minimalist-logo.png',
    typoLogo: '/assets/teamden-minimalist-logo.png',
    typoText: 'Teamden by shed',
    typoFont: 'Montserrat',
    font: 'Montserrat',
    fontFamily: 'Montserrat'
  };

  const COMPANY_DATA = Object.freeze({ ...COMPANY_RAW });

  /**
   * Universal getter for company properties.
   * If called with no arguments or with 'name', returns the company name ('teamden').
   * Examples:
   *   Company()          => "teamden"
   *   Company('name')    => "teamden"
   *   Company('logo')    => "/assets/teamden-minimalist-logo.png"
   *   Company('icon')    => "/assets/teamden-minimalist-icon.png"
   *   Company('typo')    => "/assets/teamden-minimalist-logo.png"
   *   Company('url')     => "/pages/dashboard/dashboard.html"
   *   Company('mail')    => "teamden@gmil.com"
   *   Company('ph')      => "+1 (555) 019-2834"
   *   Company('address') => "100 Innovation Way, Suite 400, Tech City, CA 94016"
   */
  function Company(key) {
    if (!key) return COMPANY_DATA.name;
    const normalizedKey = String(key).trim().toLowerCase();

    // Exact or lowercase match
    if (normalizedKey in COMPANY_DATA) {
      return COMPANY_DATA[normalizedKey];
    }
    // Handle camelCase aliases
    if (key in COMPANY_DATA) {
      return COMPANY_DATA[key];
    }
    // Aliases
    if (normalizedKey === 'typo' || normalizedKey === 'typography' || normalizedKey === 'typo_url') {
      return COMPANY_DATA.typo;
    }
    if (normalizedKey === 'typotext' || normalizedKey === 'typo_text') {
      return COMPANY_DATA.typoText;
    }
    if (normalizedKey === 'link' || normalizedKey === 'home' || normalizedKey === 'dashboard') {
      return COMPANY_DATA.url;
    }
    return COMPANY_DATA.name;
  }

  // Attach properties to Company function for direct access: Company.name, Company.logo, Company.url
  Object.keys(COMPANY_DATA).forEach((k) => {
    Object.defineProperty(Company, k, {
      get: () => COMPANY_DATA[k],
      enumerable: true
    });
  });

  /**
   * Full CompanyData API Object
   */
  const CompanyData = {
    ...COMPANY_DATA,

    /**
     * Safe lookup with fallback
     */
    get(key, fallback = '') {
      if (!key) return COMPANY_DATA.name;
      const k = String(key).trim();
      return COMPANY_DATA[k] || COMPANY_DATA[k.toLowerCase()] || fallback;
    },

    /**
     * Formats a browser title using the centralized company name
     * Example: CompanyData.formatTitle('Sign In') => 'Sign In — teamden'
     */
    formatTitle(pageTitle) {
      if (!pageTitle) return COMPANY_DATA.brandName;
      return `${pageTitle} — ${COMPANY_DATA.name}`;
    },

    /**
     * Helper getters
     */
    getLogo() {
      return COMPANY_DATA.logo;
    },

    getIcon() {
      return COMPANY_DATA.icon;
    },

    getTypo() {
      return COMPANY_DATA.typo;
    },

    getUrl() {
      return COMPANY_DATA.url;
    },

    getTypoText() {
      return COMPANY_DATA.typoText;
    },

    /**
     * HTML Generators for quick dynamic embedding in other pages
     */
    renderBrand(options = {}) {
      const url = options.url || COMPANY_DATA.url;
      const logoSrc = options.logo || COMPANY_DATA.logo;
      const iconSrc = options.icon || COMPANY_DATA.icon;
      const logoClass = options.logoClass || 'dash-brand-logo-img';
      const iconClass = options.iconClass || 'dash-brand-icon-img';
      const linkClass = options.linkClass || 'dash-brand';
      const title = options.title || COMPANY_DATA.brandName;

      return `<a href="${url}" class="${linkClass}" title="${title}" data-company="url">
        <img src="${logoSrc}" alt="${title}" class="${logoClass}" data-company="logo">
        <img src="${iconSrc}" alt="${COMPANY_DATA.displayName} Icon" class="${iconClass}" data-company="icon">
      </a>`;
    },

    renderLogo(options = {}) {
      const src = options.src || COMPANY_DATA.logo;
      const className = options.className || 'company-logo';
      const alt = options.alt || COMPANY_DATA.brandName;
      return `<img src="${src}" alt="${alt}" class="${className}" data-company="logo">`;
    },

    renderIcon(options = {}) {
      const src = options.src || COMPANY_DATA.icon;
      const className = options.className || 'company-icon';
      const alt = options.alt || COMPANY_DATA.displayName + ' Icon';
      return `<img src="${src}" alt="${alt}" class="${className}" data-company="icon">`;
    },

    /**
     * Automatically hydrates HTML elements with company data.
     * Supports:
     *   - [data-company="name|mail|ph|address|logo|icon|typo|url|..."]
     *   - [data-company-name], [data-company-logo], [data-company-url], etc.
     *   - Classes: .company-name, .company-mail, .company-logo, .company-icon, .company-url, .company-copyright
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
      Object.keys(COMPANY_DATA).forEach((k) => {
        const attr = `data-company-${k.toLowerCase()}`;
        root.querySelectorAll(`[${attr}]`).forEach((el) => {
          applyValueToElement(el, k, COMPANY_DATA[k]);
        });
      });

      // 3. Special shortcuts: [data-company-url], [data-company-logo], [data-company-icon], [data-company-typo]
      root.querySelectorAll('[data-company-url]').forEach((el) => {
        if (el.tagName === 'A') {
          el.setAttribute('href', COMPANY_DATA.url);
        } else {
          el.addEventListener('click', () => { window.location.href = COMPANY_DATA.url; });
        }
      });

      root.querySelectorAll('[data-company-logo]').forEach((el) => {
        applyValueToElement(el, 'logo', COMPANY_DATA.logo);
      });

      root.querySelectorAll('[data-company-icon]').forEach((el) => {
        applyValueToElement(el, 'icon', COMPANY_DATA.icon);
      });

      root.querySelectorAll('[data-company-typo]').forEach((el) => {
        applyValueToElement(el, 'typo', COMPANY_DATA.typo);
      });

      // 4. Common class helpers
      const classMap = {
        'company-name': COMPANY_DATA.name,
        'company-display-name': COMPANY_DATA.displayName,
        'company-brand': COMPANY_DATA.brandName,
        'company-mail': COMPANY_DATA.mail,
        'company-ph': COMPANY_DATA.ph,
        'company-address': COMPANY_DATA.address,
        'company-tagline': COMPANY_DATA.tagline,
        'company-copyright': COMPANY_DATA.copyright,
        'company-logo': COMPANY_DATA.logo,
        'company-icon': COMPANY_DATA.icon,
        'company-typo': COMPANY_DATA.typo,
        'company-url': COMPANY_DATA.url,
        'company-link': COMPANY_DATA.url
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
      el.src = val;
      if (!el.getAttribute('alt')) {
        el.alt = COMPANY_DATA.brandName || COMPANY_DATA.name;
      }
      return;
    }

    // 2. Favicon / Link elements
    if (el.tagName === 'LINK' && (k.includes('icon') || k.includes('favicon') || (el.rel && el.rel.includes('icon')))) {
      el.href = val;
      return;
    }

    // 3. Anchor tags (links, email, phone, url)
    if (el.tagName === 'A') {
      if (k === 'url' || k === 'homeurl' || k === 'dashboardurl' || k === 'website' || k === 'websiteurl' || k === 'link') {
        el.setAttribute('href', val);
        if (!el.textContent.trim() || el.hasAttribute('data-company-replace')) {
          el.textContent = COMPANY_DATA.brandName || COMPANY_DATA.name;
        }
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
    el.textContent = val;
  }

  // Expose globally
  global.CompanyData = CompanyData;
  global.Company = Company;

  // Auto-hydrate on DOM ready
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => CompanyData.hydrate());
    } else {
      CompanyData.hydrate();
    }
  }

})(typeof window !== 'undefined' ? window : globalThis);
