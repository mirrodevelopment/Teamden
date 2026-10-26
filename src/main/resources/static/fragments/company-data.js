/**
 * Root fragment alias for /fragments/company-data/company-data.js
 */
(function () {
  if (typeof window !== 'undefined' && window.CompanyData) return;
  var s = document.createElement('script');
  s.src = '/fragments/company-data/company-data.js';
  document.head.appendChild(s);
})();
