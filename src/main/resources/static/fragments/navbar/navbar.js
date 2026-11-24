/**
 * Teamden by shed — Topbar / Navbar Fragment Logic (navbar.js)
 * Path: fragments/navbar/navbar.js
 */
const Navbar = (() => {
  function computeInitials(name) {
    if (!name?.trim()) return 'TD';
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

  function renderBadgeCount(badge, count) {
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.style.display = 'inline-flex';
      badge.setAttribute('aria-label', `${count} unread notifications`);
    } else {
      badge.textContent = '0';
      badge.style.display = 'none';
      badge.removeAttribute('aria-label');
    }
  }

  async function updateNotificationCount(countOverride) {
    const badge = document.getElementById('topbar-bell-count');
    if (!badge) return;

    if (countOverride != null) {
      renderBadgeCount(badge, Number(countOverride));
      return;
    }

    try {
      let res = await fetch('/api/inbox?tab=ALL');
      if (!res.ok) {
        res = await fetch('/api/notifications?tab=ALL');
      }
      if (!res.ok) return;
      const data = await res.json();
      if (!data?.counts) return;
      const unread = Number(data.counts.unread || 0);
      renderBadgeCount(badge, unread);
    } catch (_) {
      // Ignore background notification count fetch failures
    }
  }

  function injectModalAssets() {
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
  }

  function setupCreationBridges() {
    window.openAddTaskModal = function (col, ctx) {
      if (window.UniversalCreate) {
        const initialCtx = typeof col === 'object' ? col : { column: col, ...ctx };
        window.UniversalCreate.open('TASK', initialCtx);
      }
    };
    window.triggerAddTaskPrompt = window.openAddTaskModal;

    window.openProjectModal = function (ctx) {
      if (window.UniversalCreate) {
        window.UniversalCreate.open('PROJECT', ctx || {});
      }
    };
  }

  function setupSearchBox(searchInput) {
    const searchBox = document.getElementById('topbar-search-box');
    if (searchBox) {
      searchBox.addEventListener('click', () => {
        if (window.SearchModal !== undefined) {
          window.SearchModal.open();
        }
      });
      if (searchInput) {
        searchInput.setAttribute('readonly', 'readonly');
        searchInput.style.cursor = 'pointer';
        searchInput.style.caretColor = 'transparent';
      }
    }

    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (window.SearchModal !== undefined) {
          window.SearchModal.open();
        } else if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    });
  }

  function setupCreateDropdown(createBtn, createMenu, userMenu) {
    if (!createBtn || !createMenu) return;

    createBtn.addEventListener('click', (e) => {
      if (e.target.closest('.create-chevron')) {
        e.stopPropagation();
        createMenu.classList.toggle('show');
        if (userMenu) userMenu.classList.remove('show');
        return;
      }
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

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    if (document.body) document.body.classList.toggle('dark-theme', theme === 'dark');
    localStorage.setItem('teamden-theme', theme);

    const themeBtn = document.getElementById('topbar-theme-toggle');
    if (themeBtn) {
      const label = theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme';
      themeBtn.setAttribute('title', label);
      themeBtn.setAttribute('aria-label', label);
    }

    const dropdownLabel = document.getElementById('dropdown-theme-label');
    if (dropdownLabel) {
      dropdownLabel.textContent = theme === 'dark' ? '☀️ Switch to Light Theme' : '🌙 Switch to Dark Theme';
    }

    window.dispatchEvent(new CustomEvent('teamden:themechange', { detail: { theme } }));
  }

  function toggleTheme() {
    const current = document.documentElement.dataset.theme || 'light';
    const isDark = (current === 'dark' || current === 'black-and-white' || current === 'bw');
    const next = isDark ? 'light' : 'dark';
    applyTheme(next);
    if (typeof window.showToast === 'function') {
      window.showToast(`Theme switched to ${next === 'dark' ? 'Dark' : 'Light'}`);
    }
  }

  function setupThemeControls(userMenu) {
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

    applyTheme(localStorage.getItem('teamden-theme') || 'light');
  }

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

  function init(user) {
    const searchInput = document.getElementById('global-search-input');
    const kbdShortcut = document.getElementById('search-kbd-shortcut');

    if (searchInput && window.innerWidth <= 480) {
      searchInput.placeholder = 'Search...';
    }

    if (kbdShortcut) {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      kbdShortcut.textContent = isMac ? '⌘ K' : 'Ctrl K';
    }

    injectModalAssets();
    setupCreationBridges();
    setupSearchBox(searchInput);

    const notifBtn = document.getElementById('notification-btn');
    if (notifBtn) {
      notifBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '/pages/inbox/inbox.html';
      });
    }

    if (user) {
      updateUserProfile(user);
    } else {
      fetch('/api/auth/me')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          const profile = data?.data ?? data;
          if (profile) updateUserProfile(profile);
        })
        .catch(() => {});
    }

    updateNotificationCount().catch(() => {});
    window.addEventListener('focus', () => {
      updateNotificationCount().catch(() => {});
    });
    window.addEventListener('teamden:inbox-updated', (e) => {
      if (e?.detail?.counts) {
        updateNotificationCount(e.detail.counts.unread).catch(() => {});
      } else {
        updateNotificationCount().catch(() => {});
      }
    });
    window.addEventListener('teamden:notifications-updated', () => {
      updateNotificationCount().catch(() => {});
    });

    const userBtn = document.getElementById('user-profile-btn');
    const userMenu = document.getElementById('user-dropdown-menu');
    const createBtn = document.getElementById('btn-create-pill');
    const createMenu = document.getElementById('create-menu');

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

    setupCreateDropdown(createBtn, createMenu, userMenu);
    setupThemeControls(userMenu);

    updateNavbarDate();
    setInterval(updateNavbarDate, 30000);

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
