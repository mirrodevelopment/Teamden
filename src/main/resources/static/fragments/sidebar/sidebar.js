/**
 * Teamden by shed — Sidebar Fragment Logic (sidebar.js)
 * Path: fragments/sidebar/sidebar.js
 */
const Sidebar = (() => {
  function toggle() {
    const isCollapsed = document.body.classList.toggle('sidebar-collapsed');
    document.documentElement.classList.toggle('sidebar-collapsed', isCollapsed);
    localStorage.setItem('teamden-sidebar-collapsed', isCollapsed ? 'true' : 'false');
    return isCollapsed;
  }

  // Restore persisted collapsed state immediately to avoid layout flicker
  if (localStorage.getItem('teamden-sidebar-collapsed') === 'true') {
    document.body.classList.add('sidebar-collapsed');
    document.documentElement.classList.add('sidebar-collapsed');
  }

  // Resilient event delegation on document so dynamic fragment mounts always respond
  document.addEventListener('click', (e) => {
    // 1. Collapse / expand toggle button
    const collapseBtn = e.target.closest('#sidebar-collapse-btn');
    if (collapseBtn) {
      e.preventDefault();
      e.stopPropagation();
      toggle();
      return;
    }

    // 2. Mobile hamburger menu toggle
    const mobileToggle = e.target.closest('#mobile-sidebar-toggle');
    if (mobileToggle) {
      e.preventDefault();
      e.stopPropagation();
      document.body.classList.toggle('sidebar-mobile-open');
      return;
    }

    // 3. Close mobile sidebar when clicking backdrop / outside or navigating
    if (document.body.classList.contains('sidebar-mobile-open')) {
      const sidebar = document.getElementById('app-sidebar');
      if (sidebar && !sidebar.contains(e.target)) {
        document.body.classList.remove('sidebar-mobile-open');
      } else if (e.target.closest('.nav-item, .sub-nav-item, .org-item, .sidebar-footer-link')) {
        document.body.classList.remove('sidebar-mobile-open');
      }
    }
  });

  function init(user) {
    const collapseBtn = document.getElementById('sidebar-collapse-btn');
    if (collapseBtn) {
      collapseBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      };
    }

    const mobileToggle = document.getElementById('mobile-sidebar-toggle');
    if (mobileToggle) {
      mobileToggle.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.body.classList.toggle('sidebar-mobile-open');
      };
    }

    const brandLogo = document.querySelector('.sidebar-brand-logo');
    if (brandLogo) {
      brandLogo.onclick = (e) => {
        if (document.body.classList.contains('sidebar-collapsed')) {
          e.preventDefault();
          e.stopPropagation();
          toggle();
        }
      };
    }

    if (localStorage.getItem('teamden-sidebar-collapsed') === 'true') {
      document.body.classList.add('sidebar-collapsed');
    }

    // Hydrate company branding
    if (window.CompanyData && typeof CompanyData.hydrate === 'function') {
      CompanyData.hydrate(document.getElementById('app-sidebar'));
    }

    // Set workspace name from user if available
    const workspaceNameEl = document.getElementById('sidebar-workspace-name');
    if (workspaceNameEl && user && user.activeOrganizationName) {
      workspaceNameEl.textContent = user.activeOrganizationName;
    }

    // Workspace dropdown trigger
    const wsTrigger = document.getElementById('workspace-dropdown-trigger');
    if (wsTrigger) {
      wsTrigger.addEventListener('click', () => {
        console.log('Workspace switcher clicked');
      });
    }

    // Close sidebar on mobile when navigating
    const navItems = document.querySelectorAll('.app-sidebar .nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth <= 1024) {
          document.body.classList.remove('sidebar-mobile-open');
        }
      });
    });

    // Sync active nav item with current URL
    const currentPath = window.location.pathname || '';
    const todayNav = document.getElementById('nav-today');
    const projectsNav = document.getElementById('nav-projects');
    const workspaceNav = document.getElementById('nav-workspace');
    const teamNav = document.getElementById('nav-team');
    const calendarNav = document.getElementById('nav-calendar');
    const overviewNav = document.getElementById('nav-overview');
    const insightsNav = document.getElementById('nav-insights');
    const inboxNav = document.getElementById('nav-inbox');
    const settingsNav = document.getElementById('nav-settings');

    // Remove active from all first
    [todayNav, projectsNav, workspaceNav, teamNav, calendarNav, overviewNav, insightsNav, inboxNav, settingsNav].forEach(el => {
      if (el) el.classList.remove('active');
    });

    if (currentPath.includes('/pages/settings/')) {
      if (settingsNav) settingsNav.classList.add('active');
    } else if (currentPath.includes('/pages/inbox/')) {
      if (inboxNav) inboxNav.classList.add('active');
    } else if (currentPath.includes('/pages/overview/insights/')) {
      if (insightsNav) insightsNav.classList.add('active');
    } else if (currentPath.includes('/pages/overview/')) {
      if (overviewNav) overviewNav.classList.add('active');
    } else if (currentPath.includes('/pages/calendar/')) {
      if (calendarNav) calendarNav.classList.add('active');
    } else if (currentPath.includes('/pages/projects/') || currentPath.includes('/pages/project/')) {
      if (projectsNav) projectsNav.classList.add('active');
    } else if (currentPath.includes('/pages/workspace/')) {
      if (workspaceNav) workspaceNav.classList.add('active');
    } else if (currentPath.includes('/pages/team/')) {
      if (teamNav) teamNav.classList.add('active');
    } else if (currentPath.includes('/pages/dashboard/')) {
      if (todayNav) todayNav.classList.add('active');
    }

    // Refresh inbox unread badge if present
    fetch('/api/inbox?tab=ALL')
      .then(res => res.ok ? res.json() : fetch('/api/notifications?tab=ALL').then(r => r.ok ? r.json() : null))
      .then(data => {
        if (!data || !data.counts) return;
        const badge = document.getElementById('sidebar-inbox-count');
        if (badge) {
          if (data.counts.unread > 0) {
            badge.textContent = data.counts.unread;
            badge.style.display = 'inline-block';
          } else {
            badge.style.display = 'none';
          }
        }
        const topbarBellCount = document.getElementById('topbar-bell-count');
        if (topbarBellCount) {
          const unread = Number(data.counts.unread || 0);
          if (unread > 0) {
            topbarBellCount.textContent = unread > 99 ? '99+' : unread;
            topbarBellCount.style.display = 'inline-flex';
          } else {
            topbarBellCount.textContent = '0';
            topbarBellCount.style.display = 'none';
          }
        }
      })
      .catch(() => {});

    // Pinned Projects (User-Scoped Ongoing Projects)
    loadPinnedProjects();

    const pinnedAddBtn = document.getElementById('pinned-add-btn');
    if (pinnedAddBtn) {
      pinnedAddBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        togglePinPicker();
      };
    }

    const pinnedCloseBtn = document.getElementById('pinned-picker-close');
    if (pinnedCloseBtn) {
      pinnedCloseBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        closePinPicker();
      };
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async function loadPinnedProjects() {
    const list = document.getElementById('sidebar-pinned-list');
    if (!list) return;

    try {
      const res = await fetch('/api/projects/pinned');
      if (!res.ok) {
        list.innerHTML = '<div class="pinned-empty">No pinned projects</div>';
        return;
      }
      const pinned = await res.json();
      if (!Array.isArray(pinned) || pinned.length === 0) {
        list.innerHTML = '<div class="pinned-empty">No pinned projects</div>';
        return;
      }

      const currentPath = window.location.pathname + window.location.search;
      list.innerHTML = pinned.map(p => {
        const isActive = currentPath.includes(p.id);
        return `
          <div class="pinned-item ${isActive ? 'active' : ''}" data-project-id="${p.id}" data-tooltip="${escapeHtml(p.name)}">
            <a href="${p.url || ('/pages/projects/project-detail/project-detail.html?id=' + p.id)}" class="pinned-item-main" title="${escapeHtml(p.name)}">
              <svg class="pinned-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
              <span class="pinned-label">${escapeHtml(p.name)}</span>
            </a>
            <button type="button" class="pinned-unpin-btn" data-project-id="${p.id}" title="Unpin project" aria-label="Unpin ${escapeHtml(p.name)}">&times;</button>
          </div>
        `;
      }).join('');

      // Attach unpin event listeners
      list.querySelectorAll('.pinned-unpin-btn').forEach(btn => {
        btn.onclick = async (e) => {
          e.preventDefault();
          e.stopPropagation();
          const projId = btn.getAttribute('data-project-id');
          if (!projId) return;
          try {
            const delRes = await fetch(`/api/projects/${projId}/pin`, { method: 'DELETE' });
            if (delRes.ok || delRes.status === 204) {
              loadPinnedProjects();
            }
          } catch (err) {
            console.error('Failed to unpin project', err);
          }
        };
      });
    } catch (err) {
      console.error('Error loading pinned projects', err);
      list.innerHTML = '<div class="pinned-empty">No pinned projects</div>';
    }
  }

  function closePinPicker() {
    const popover = document.getElementById('pinned-picker-popover');
    if (popover) {
      popover.style.display = 'none';
    }
  }

  async function togglePinPicker() {
    const popover = document.getElementById('pinned-picker-popover');
    if (!popover) return;

    if (popover.style.display === 'block') {
      closePinPicker();
      return;
    }

    const pickerList = document.getElementById('pinned-picker-list');
    if (pickerList) {
      pickerList.innerHTML = '<div class="pinned-picker-empty">Loading ongoing projects...</div>';
    }
    popover.style.display = 'block';

    try {
      const res = await fetch('/api/projects/ongoing-available');
      if (!res.ok) {
        if (pickerList) pickerList.innerHTML = '<div class="pinned-picker-empty">Failed to load projects</div>';
        return;
      }
      const projects = await res.json();
      if (!Array.isArray(projects) || projects.length === 0) {
        if (pickerList) pickerList.innerHTML = '<div class="pinned-picker-empty">No ongoing projects found</div>';
        return;
      }

      if (pickerList) {
        pickerList.innerHTML = projects.map(p => {
          const isPinned = !!(p.isPinned || p.pinned);
          return `
            <button type="button" class="pinned-picker-item ${isPinned ? 'already-pinned' : ''}" data-project-id="${p.id}" ${isPinned ? 'disabled' : ''}>
              <span class="pinned-picker-item-name">${escapeHtml(p.name)}</span>
              <span class="pinned-picker-badge">${isPinned ? 'Pinned' : escapeHtml(p.statusLabel || p.status)}</span>
            </button>
          `;
        }).join('');

        pickerList.querySelectorAll('.pinned-picker-item:not(.already-pinned)').forEach(btn => {
          btn.onclick = async (e) => {
            e.preventDefault();
            const projId = btn.getAttribute('data-project-id');
            if (!projId) return;
            try {
              const pinRes = await fetch(`/api/projects/${projId}/pin`, { method: 'POST' });
              if (pinRes.ok) {
                closePinPicker();
                loadPinnedProjects();
              }
            } catch (err) {
              console.error('Failed to pin project', err);
            }
          };
        });
      }
    } catch (err) {
      console.error('Error opening pin picker', err);
      if (pickerList) pickerList.innerHTML = '<div class="pinned-picker-empty">Error loading projects</div>';
    }
  }

  // Close picker when clicking outside
  document.addEventListener('click', (e) => {
    const popover = document.getElementById('pinned-picker-popover');
    if (popover && popover.style.display === 'block') {
      const pinnedSection = document.getElementById('sidebar-pinned-section');
      if (pinnedSection && !pinnedSection.contains(e.target)) {
        closePinPicker();
      }
    }
  });

  return { init, toggle, loadPinnedProjects };
})();

window.Sidebar = Sidebar;
window.toggleSidebar = () => Sidebar.toggle();
