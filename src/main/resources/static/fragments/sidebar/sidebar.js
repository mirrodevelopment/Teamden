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
