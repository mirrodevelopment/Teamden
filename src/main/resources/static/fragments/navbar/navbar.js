/**
 * Teamden by shed — Topbar / Navbar Fragment Logic (navbar.js)
 * Path: fragments/navbar/navbar.js
 */
const Navbar = (() => {
  function init(user) {
    const avatarEl = document.getElementById('topbar-user-avatar');
    const dropdownUserNameEl = document.getElementById('dropdown-user-name');
    const dropdownUserRoleEl = document.getElementById('dropdown-user-role');
    const searchInput = document.getElementById('global-search-input');
    const kbdShortcut = document.getElementById('search-kbd-shortcut');

    // Adapt shortcut text for Mac vs Windows/Linux
    if (kbdShortcut) {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      kbdShortcut.textContent = isMac ? '⌘ K' : 'Ctrl K';
    }

    // Keyboard shortcut handler
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    });

    if (user) {
      if (avatarEl) {
        let initials = 'TD';
        if (user.initials) {
          initials = user.initials;
        } else if (user.fullName) {
          const parts = user.fullName.trim().split(/\s+/);
          initials = parts.length === 1 
            ? parts[0].substring(0, Math.min(2, parts[0].length)).toUpperCase() 
            : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        avatarEl.textContent = initials;
      }
      if (dropdownUserNameEl) dropdownUserNameEl.textContent = user.fullName || 'User';
      if (dropdownUserRoleEl) dropdownUserRoleEl.textContent = `${user.role || 'Member'} · ${user.activeOrganizationName || 'Teamden'}`;
    }

    // User Profile dropdown
    const userBtn = document.getElementById('user-profile-btn');
    const userMenu = document.getElementById('user-dropdown-menu');

    if (userBtn && userMenu) {
      userBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userMenu.classList.toggle('show');
        if (createMenu) createMenu.classList.remove('show');
      });

      document.addEventListener('click', (e) => {
        if (!userMenu.contains(e.target) && !userBtn.contains(e.target)) {
          userMenu.classList.remove('show');
        }
      });
    }

    // + Create dropdown
    const createBtn = document.getElementById('btn-create-pill');
    const createMenu = document.getElementById('create-menu');

    if (createBtn && createMenu) {
      createBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        createMenu.classList.toggle('show');
        if (userMenu) userMenu.classList.remove('show');
      });

      document.addEventListener('click', (e) => {
        if (!createMenu.contains(e.target) && !createBtn.contains(e.target)) {
          createMenu.classList.remove('show');
        }
      });

      // Handlers for menu actions
      const taskAction = document.getElementById('create-action-task');
      if (taskAction) {
        taskAction.addEventListener('click', (e) => {
          e.preventDefault();
          createMenu.classList.remove('show');
          if (typeof window.triggerAddTaskPrompt === 'function') {
            window.triggerAddTaskPrompt('NOW');
          }
        });
      }
    }

    // Logout button handler
    const logoutBtn = document.getElementById('topbar-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (window.Auth && typeof Auth.logout === 'function') {
          await Auth.logout();
        } else {
          window.location.href = '/pages/login/login.html';
        }
      });
    }
  }

  return { init };
})();

window.Navbar = Navbar;
