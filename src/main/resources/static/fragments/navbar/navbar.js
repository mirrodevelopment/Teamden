/**
 * Teamden by shed — Topbar Fragment Logic (navbar.js)
 */
const Navbar = (() => {
  function init(user) {
    const orgNameEl = document.getElementById('topbar-org-name');
    const userRoleEl = document.getElementById('topbar-user-role');
    const avatarEl = document.getElementById('topbar-user-avatar');
    const userNameEl = document.getElementById('topbar-user-name');
    const userEmailEl = document.getElementById('topbar-user-email');
    const dropdownUserNameEl = document.getElementById('dropdown-user-name');
    const dropdownUserRoleEl = document.getElementById('dropdown-user-role');

    if (user) {
      if (orgNameEl) orgNameEl.textContent = user.activeOrganizationName || 'My Workspace';
      if (userRoleEl) userRoleEl.textContent = user.role || 'MEMBER';
      if (avatarEl) avatarEl.textContent = user.initials || 'U';
      if (userNameEl) userNameEl.textContent = user.fullName || 'User';
      if (userEmailEl) userEmailEl.textContent = user.email || '';
      if (dropdownUserNameEl) dropdownUserNameEl.textContent = user.fullName || 'User';
      if (dropdownUserRoleEl) dropdownUserRoleEl.textContent = `${user.role || 'MEMBER'} · ${user.activeOrganizationName || ''}`;
    }

    // Toggle dropdown
    const userBtn = document.getElementById('user-profile-btn');
    const menu = document.getElementById('user-dropdown-menu');

    if (userBtn && menu) {
      userBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('show');
      });

      document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && !userBtn.contains(e.target)) {
          menu.classList.remove('show');
        }
      });
    }

    // Logout button handler
    const logoutBtn = document.getElementById('topbar-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await Auth.logout();
      });
    }

    // Sidebar toggle trigger
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    if (sidebarToggleBtn) {
      sidebarToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('sidebar-collapsed');
        document.body.classList.toggle('sidebar-mobile-open');
      });
    }
  }

  return { init };
})();

window.Navbar = Navbar;
