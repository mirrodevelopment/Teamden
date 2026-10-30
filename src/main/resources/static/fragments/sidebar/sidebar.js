/**
 * Teamden by shed — Sidebar Fragment Logic (sidebar.js)
 * Path: fragments/sidebar/sidebar.js
 */
const Sidebar = (() => {
  function toggle() {
    const isCollapsed = document.body.classList.toggle('sidebar-collapsed');
    localStorage.setItem('teamden-sidebar-collapsed', isCollapsed ? 'true' : 'false');
    return isCollapsed;
  }

  // Restore persisted collapsed state immediately to avoid layout flicker
  if (localStorage.getItem('teamden-sidebar-collapsed') === 'true') {
    document.body.classList.add('sidebar-collapsed');
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

    // 3. Close mobile sidebar when clicking backdrop / outside
    if (document.body.classList.contains('sidebar-mobile-open')) {
      const sidebar = document.getElementById('app-sidebar');
      if (sidebar && !sidebar.contains(e.target)) {
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
    if (currentPath.includes('/pages/projects/') || currentPath.includes('/pages/project/')) {
      if (todayNav) todayNav.classList.remove('active');
      if (projectsNav) projectsNav.classList.add('active');
    } else if (currentPath.includes('/pages/dashboard/')) {
      if (todayNav) todayNav.classList.add('active');
      if (projectsNav) projectsNav.classList.remove('active');
    }

    // Pinned add button
    const pinnedAddBtn = document.getElementById('pinned-add-btn');
    if (pinnedAddBtn) {
      pinnedAddBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const pinTitle = prompt('Enter item name to pin to sidebar:');
        if (pinTitle && pinTitle.trim()) {
          const list = document.querySelector('.pinned-list');
          if (list) {
            const item = document.createElement('a');
            item.href = '#' + pinTitle.trim().toLowerCase().replace(/\s+/g, '-');
            item.className = 'pinned-item';
            item.innerHTML = `
              <svg class="pinned-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
              <span class="pinned-label">${pinTitle.trim()}</span>
            `;
            list.appendChild(item);
          }
        }
      });
    }
  }

  return { init, toggle };
})();

window.Sidebar = Sidebar;
window.toggleSidebar = () => Sidebar.toggle();
