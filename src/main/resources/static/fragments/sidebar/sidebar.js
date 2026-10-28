/**
 * Teamden by shed — Sidebar Fragment Logic (sidebar.js)
 * Path: fragments/sidebar/sidebar.js
 */
const Sidebar = (() => {
  function init(user) {
    const closeBtn = document.getElementById('sidebar-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        document.body.classList.remove('sidebar-mobile-open');
      });
    }

    const collapseBtn = document.getElementById('sidebar-collapse-btn');
    if (collapseBtn) {
      collapseBtn.addEventListener('click', () => {
        const isCollapsed = document.body.classList.toggle('sidebar-collapsed');
        localStorage.setItem('teamden-sidebar-collapsed', isCollapsed ? 'true' : 'false');
      });
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
        // Toggle or display switcher feedback
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

  return { init };
})();

window.Sidebar = Sidebar;
