/**
 * Teamden by shed — Centralized Company Data Fragment
 * Path: /fragments/company-data/company-data.js
 *
 * Single source of truth for company metadata, identity, contact, and branding.
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
    tagline: 'Team Productivity, Work Management & SaaS Platform',
    copyright: '© 2026 Teamden. All rights reserved.',
    foundedYear: '2026',
    parentCompany: 'shed',
    version: '1.0'
  };

  const COMPANY_DATA = Object.freeze({ ...COMPANY_RAW });

  /**
   * Universal getter for company properties.
   * If called with no arguments or with 'name', returns the company name ('teamden').
   * Example:
   *   Company()          => "teamden"
   *   Company('name')    => "teamden"
   *   Company('mail')    => "teamden@gmil.com"
   *   Company('ph')      => "+1 (555) 019-2834"
   *   Company('address') => "100 Innovation Way, Suite 400, Tech City, CA 94016"
   */
  function Company(key) {
    if (!key) return COMPANY_DATA.name;
    const normalizedKey = String(key).trim().toLowerCase();
    if (normalizedKey in COMPANY_DATA) {
      return COMPANY_DATA[normalizedKey];
    }
    // Handle camelCase aliases
    if (key in COMPANY_DATA) {
      return COMPANY_DATA[key];
    }
    return COMPANY_DATA.name;
  }

  // Attach properties to Company function for direct access: Company.name, Company.mail
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
     * Automatically hydrates HTML elements with company data.
     * Supports:
     *   - [data-company="name|mail|ph|address|..."]
     *   - [data-company-name], [data-company-mail], etc.
     *   - Classes: .company-name, .company-mail, .company-ph, .company-address, .company-copyright
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

      // 3. Common class helpers
      const classMap = {
        'company-name': COMPANY_DATA.name,
        'company-display-name': COMPANY_DATA.displayName,
        'company-brand': COMPANY_DATA.brandName,
        'company-mail': COMPANY_DATA.mail,
        'company-ph': COMPANY_DATA.ph,
        'company-address': COMPANY_DATA.address,
        'company-tagline': COMPANY_DATA.tagline,
        'company-copyright': COMPANY_DATA.copyright
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
    // Anchor tags for email
    if (el.tagName === 'A' && (k.includes('mail') || k.includes('email'))) {
      if (!el.getAttribute('href') || el.getAttribute('href') === '#' || el.getAttribute('href').startsWith('mailto:')) {
        el.setAttribute('href', `mailto:${val}`);
      }
      if (!el.textContent.trim() || el.hasAttribute('data-company-replace')) {
        el.textContent = val;
      }
      return;
    }

    // Anchor tags for phone
    if (el.tagName === 'A' && (k.includes('ph') || k.includes('phone'))) {
      if (!el.getAttribute('href') || el.getAttribute('href') === '#' || el.getAttribute('href').startsWith('tel:')) {
        el.setAttribute('href', `tel:${val.replace(/[^+\d]/g, '')}`);
      }
      if (!el.textContent.trim() || el.hasAttribute('data-company-replace')) {
        el.textContent = val;
      }
      return;
    }

    // Inputs / textareas
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      if (el.hasAttribute('data-company-placeholder')) {
        el.placeholder = val;
      } else {
        el.value = val;
      }
      return;
    }

    // Standard elements
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
