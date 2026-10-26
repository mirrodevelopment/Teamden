/**
 * Teamden by shed — Central API Client (api.js)
 * Robust fetch wrapper handling CSRF tokens, session state, and uniform errors.
 */

const Api = (() => {
  /**
   * Helper to get cookie value by name (used for XSRF-TOKEN)
   */
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop().split(';').shift();
    }
    return null;
  }

  /**
   * Performs an HTTP request with proper headers, credentials, and CSRF handling.
   */
  async function request(endpoint, options = {}) {
    const defaultHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    // Attach CSRF header on state-changing requests if token cookie is present
    const method = (options.method || 'GET').toUpperCase();
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const xsrfToken = getCookie('XSRF-TOKEN');
      if (xsrfToken) {
        defaultHeaders['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
      }
    }

    const config = {
      method,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {})
      },
      credentials: 'same-origin',
      ...options
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(endpoint, config);

      // Handle session expiration / unauthorized
      if (response.status === 401) {
        const isAuthCheck = endpoint.includes('/api/auth/me') || endpoint.includes('/api/auth/login');
        if (!isAuthCheck && !window.location.pathname.includes('/pages/login/')) {
          console.warn('Session expired or unauthorized. Redirecting to login.');
          window.location.href = '/pages/login/login.html?expired=true';
          return;
        }
      }

      let data = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }

      if (!response.ok) {
        const errorMessage = (data && data.message) ? data.message : `Request failed with status ${response.status}`;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.errors = (data && data.errors) ? data.errors : [];
        error.data = data;
        throw error;
      }

      return data ? data.data : null;

    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        const netErr = new Error('Network error. Unable to reach the server.');
        netErr.status = 0;
        throw netErr;
      }
      throw err;
    }
  }

  return {
    get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
    post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body }),
    put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PUT', body }),
    delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
    getCsrfToken: () => getCookie('XSRF-TOKEN')
  };
})();

// Export globally for vanilla JS pages
window.Api = Api;
