/**
 * Teamden by shed — Authentication Helper (auth.js)
 * Manages user session checks, route protection, and login/logout actions.
 */

const Auth = (() => {
  let currentUser = null;

  async function checkSession() {
    try {
      const user = await Api.get('/api/auth/me');
      currentUser = user;
      return user;
    } catch (err) {
      currentUser = null;
      return null;
    }
  }

  async function login(email, password) {
    const authResponse = await Api.post('/api/auth/login', { email, password });
    currentUser = authResponse ? authResponse.user : null;
    return authResponse;
  }

  async function logout() {
    try {
      await Api.post('/api/auth/logout');
    } catch (e) {
      console.warn('Logout network error, clearing local state anyway');
    } finally {
      currentUser = null;
      window.location.href = '/pages/login/login.html?logout=true';
    }
  }

  /**
   * Guards protected pages: checks if user is logged in.
   * If not, redirects to login page.
   */
  async function requireAuth() {
    const user = await checkSession();
    if (!user) {
      window.location.href = '/pages/login/login.html?expired=true';
      return null;
    }
    return user;
  }

  /**
   * Used on login page: if already logged in, redirect straight to dashboard.
   */
  async function redirectIfAuthenticated() {
    const user = await checkSession();
    if (user) {
      window.location.href = '/pages/dashboard/dashboard.html';
      return user;
    }
    return null;
  }

  return {
    getCurrentUser: () => currentUser,
    checkSession,
    login,
    logout,
    requireAuth,
    redirectIfAuthenticated
  };
})();

window.Auth = Auth;
