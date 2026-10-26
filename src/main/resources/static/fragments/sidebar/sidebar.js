/**
 * Teamden by shed — Sidebar Fragment Logic (sidebar.js)
 */
const Sidebar = (() => {
  function init() {
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

    // Close sidebar on mobile when navigating
    const navItems = document.querySelectorAll('.app-sidebar .nav-item:not(.nav-item-disabled)');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth <= 1024) {
          document.body.classList.remove('sidebar-mobile-open');
        }
      });
    });
  }

  return { init };
})();

window.Sidebar = Sidebar;
