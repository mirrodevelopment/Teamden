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

    if (searchInput && window.innerWidth <= 480) {
      searchInput.placeholder = 'Search...';
    }

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
          } else if (typeof window.openAddTaskModal === 'function') {
            window.openAddTaskModal('NOW');
          } else {
            window.location.href = '/pages/tasks/create.html';
          }
        });
      }

      const projectAction = document.getElementById('create-action-project');
      if (projectAction) {
        projectAction.addEventListener('click', (e) => {
          e.preventDefault();
          createMenu.classList.remove('show');
          if (typeof window.openProjectModal === 'function') {
            window.openProjectModal();
          } else {
            window.location.href = '/pages/projects/create-project/create-project.html';
          }
        });
      }
    }

    // --- Theme Switcher Logic ---
    function applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      if (document.body) document.body.classList.toggle('dark-theme', theme === 'dark');
      localStorage.setItem('teamden-theme', theme);

      const themeBtn = document.getElementById('topbar-theme-toggle');
      if (themeBtn) {
        themeBtn.setAttribute('title', theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme');
        themeBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme');
      }

      const dropdownLabel = document.getElementById('dropdown-theme-label');
      if (dropdownLabel) {
        dropdownLabel.textContent = theme === 'dark' ? '☀️ Switch to Light Theme' : '🌙 Switch to Dark Theme';
      }

      window.dispatchEvent(new CustomEvent('teamden:themechange', { detail: { theme } }));
    }

    function toggleTheme() {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const isDark = (current === 'dark' || current === 'black-and-white' || current === 'bw');
      const next = isDark ? 'light' : 'dark';
      applyTheme(next);
      if (typeof window.showToast === 'function') {
        window.showToast(`Theme switched to ${next === 'dark' ? 'Dark' : 'Light'}`);
      }
    }

    const themeToggleBtn = document.getElementById('topbar-theme-toggle');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleTheme();
      });
    }

    const dropdownThemeBtn = document.getElementById('dropdown-theme-toggle');
    if (dropdownThemeBtn) {
      dropdownThemeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleTheme();
        if (userMenu) userMenu.classList.remove('show');
      });
    }

    // Live Topbar Date Updater
    function updateNavbarDate() {
      const topbarDateEl = document.getElementById('topbar-date-display');
      if (!topbarDateEl) return;
      const now = new Date();
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const dow = days[now.getDay()];
      const dayNum = String(now.getDate()).padStart(2, '0');
      const month = months[now.getMonth()];
      const year = now.getFullYear();
      topbarDateEl.textContent = `${dow}, ${dayNum} ${month} ${year}`;
    }
    updateNavbarDate();
    setInterval(updateNavbarDate, 30000);

    // Apply stored theme on init
    const currentStoredTheme = localStorage.getItem('teamden-theme') || 'light';
    applyTheme(currentStoredTheme);

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

// Immediate theme initialization on script load
(function () {
  const t = localStorage.getItem('teamden-theme') || 'light';
  document.documentElement.setAttribute('data-theme', t);
  if (document.body) document.body.classList.toggle('dark-theme', t === 'dark');
})();

window.Navbar = Navbar;
