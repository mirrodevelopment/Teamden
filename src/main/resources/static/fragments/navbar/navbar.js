/**
 * Teamden by shed — Topbar / Navbar Fragment Logic (navbar.js)
 * Path: fragments/navbar/navbar.js
 */
const Navbar = (() => {
  function computeInitials(name) {
    if (!name || !name.trim()) return 'TD';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, Math.min(2, parts[0].length)).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function updateUserProfile(userData) {
    if (!userData) return;
    const avatarEl = document.getElementById('topbar-user-avatar');
    const initialsEl = document.getElementById('topbar-user-initials');
    const dropdownUserNameEl = document.getElementById('dropdown-user-name');
    const dropdownUserRoleEl = document.getElementById('dropdown-user-role');

    const name = userData.fullName || userData.name || (userData.email ? userData.email.split('@')[0] : 'User');
    const initials = userData.initials || computeInitials(name);
    if (initialsEl) {
      initialsEl.textContent = initials;
    } else if (avatarEl) {
      avatarEl.innerHTML = `<span class="user-avatar-initials" id="topbar-user-initials">${initials}</span>`;
    }

    if (dropdownUserNameEl) dropdownUserNameEl.textContent = name;
    if (dropdownUserRoleEl) dropdownUserRoleEl.textContent = `${userData.role || 'Member'} · ${userData.activeOrganizationName || 'Teamden'}`;
  }

  function updateNotificationCount(countOverride) {
    const badge = document.getElementById('topbar-bell-count');
    if (!badge) return;

    if (countOverride != null) {
      const count = Number(countOverride);
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'inline-flex';
        badge.setAttribute('aria-label', `${count} unread notifications`);
      } else {
        badge.textContent = '0';
        badge.style.display = 'none';
        badge.removeAttribute('aria-label');
      }
      return;
    }

    fetch('/api/inbox?tab=ALL')
      .then(res => res.ok ? res.json() : fetch('/api/notifications?tab=ALL').then(r => r.ok ? r.json() : null))
      .then(data => {
        if (!data || !data.counts) return;
        const unread = Number(data.counts.unread || 0);
        if (unread > 0) {
          badge.textContent = unread > 99 ? '99+' : unread;
          badge.style.display = 'inline-flex';
          badge.setAttribute('aria-label', `${unread} unread notifications`);
        } else {
          badge.textContent = '0';
          badge.style.display = 'none';
          badge.removeAttribute('aria-label');
        }
      })
      .catch(() => {});
  }

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

    // ── Inject Global Search Modal CSS + JS (once) ──────────
    if (!document.getElementById('search-modal-css')) {
      const link = document.createElement('link');
      link.id = 'search-modal-css';
      link.rel = 'stylesheet';
      link.href = '/fragments/search/search-modal.css?v=1';
      document.head.appendChild(link);
    }
    if (!document.getElementById('search-modal-js')) {
      const script = document.createElement('script');
      script.id = 'search-modal-js';
      script.src = '/fragments/search/search-modal.js?v=1';
      document.body.appendChild(script);
    }

    // ── Inject Universal Create Modal CSS + JS (once) ──────────
    if (!document.getElementById('universal-create-css')) {
      const link = document.createElement('link');
      link.id = 'universal-create-css';
      link.rel = 'stylesheet';
      link.href = '/fragments/create/universal-create.css?v=3';
      document.head.appendChild(link);
    }
    if (!document.getElementById('universal-create-js')) {
      const script = document.createElement('script');
      script.id = 'universal-create-js';
      script.src = '/fragments/create/universal-create.js?v=4';
      document.body.appendChild(script);
    }

    // ── Global Creation Bridges ────────────────────────────────
    window.openAddTaskModal = function (col, ctx) {
      if (window.UniversalCreate) {
        const initialCtx = typeof col === 'object' ? col : { column: col, ...(ctx || {}) };
        window.UniversalCreate.open('TASK', initialCtx);
      }
    };
    window.triggerAddTaskPrompt = window.openAddTaskModal;

    window.openProjectModal = function (ctx) {
      if (window.UniversalCreate) {
        window.UniversalCreate.open('PROJECT', ctx || {});
      }
    };

    // ── Wire search bar click to open modal ──────────────
    const searchBox = document.getElementById('topbar-search-box');
    if (searchBox) {
      searchBox.addEventListener('click', () => {
        if (typeof window.SearchModal !== 'undefined') {
          window.SearchModal.open();
        }
      });
      // Make the input read-only so clicks bubble to searchBox
      if (searchInput) {
        searchInput.setAttribute('readonly', 'readonly');
        searchInput.style.cursor = 'pointer';
        searchInput.style.caretColor = 'transparent';
      }
    }

    // ── Keyboard shortcut handler ────────────────────────
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (typeof window.SearchModal !== 'undefined') {
          window.SearchModal.open();
        } else if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    });

    // Notification Bell Button -> Inbox
    const notifBtn = document.getElementById('notification-btn');
    if (notifBtn) {
      notifBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '/pages/inbox/inbox.html';
      });
    }

    // Hydrate User Profile (using passed user or fetch from /api/auth/me)
    if (user) {
      updateUserProfile(user);
    } else {
      fetch('/api/auth/me')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          const profile = (data && data.data) ? data.data : data;
          if (profile) updateUserProfile(profile);
        })
        .catch(() => {});
    }

    // Hydrate Notification Bell Count & setup reactive listeners
    updateNotificationCount();
    window.addEventListener('focus', () => updateNotificationCount());
    window.addEventListener('teamden:inbox-updated', (e) => {
      if (e && e.detail && e.detail.counts) {
        updateNotificationCount(e.detail.counts.unread);
      } else {
        updateNotificationCount();
      }
    });
    window.addEventListener('teamden:notifications-updated', () => updateNotificationCount());

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

    // + Create pill & dropdown
    const createBtn = document.getElementById('btn-create-pill');
    const createMenu = document.getElementById('create-menu');

    if (createBtn && createMenu) {
      createBtn.addEventListener('click', (e) => {
        // If clicking the chevron, toggle the mini menu for secondary choices
        if (e.target.closest('.create-chevron')) {
          e.stopPropagation();
          createMenu.classList.toggle('show');
          if (userMenu) userMenu.classList.remove('show');
          return;
        }

        // Clicking the + Create button opens Universal Create modal
        e.preventDefault();
        e.stopPropagation();
        createMenu.classList.remove('show');
        if (window.UniversalCreate) {
          window.UniversalCreate.open('TASK');
        } else if (typeof window.openAddTaskModal === 'function') {
          window.openAddTaskModal('NOW');
        } else {
          createMenu.classList.toggle('show');
        }
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
          if (window.UniversalCreate) {
            window.UniversalCreate.open('TASK');
          } else if (typeof window.triggerAddTaskPrompt === 'function') {
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
          if (window.UniversalCreate) {
            window.UniversalCreate.open('PROJECT');
          } else if (typeof window.openProjectModal === 'function') {
            window.openProjectModal();
          } else {
            window.location.href = '/pages/projects/create-project/create-project.html';
          }
        });
      }

      const updateAction = document.getElementById('create-action-update');
      if (updateAction) {
        updateAction.addEventListener('click', (e) => {
          e.preventDefault();
          createMenu.classList.remove('show');
          if (typeof window.openDailyUpdateModal === 'function') {
            window.openDailyUpdateModal();
          } else {
            window.location.href = '/pages/dashboard/dashboard.html?openDailyUpdate=true';
          }
        });
      }
    }

    // --- Theme Switcher Logic ---
    function applyTheme(theme) {
      document.documentElement.dataset.theme = theme;
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

  return {
    init,
    updateUserProfile,
    updateNotificationCount,
    computeInitials
  };
})();

// Immediate theme initialization on script load
(function () {
  const t = localStorage.getItem('teamden-theme') || 'light';
  document.documentElement.dataset.theme = t;
  if (document.body) document.body.classList.toggle('dark-theme', t === 'dark');
})();

window.Navbar = Navbar;
