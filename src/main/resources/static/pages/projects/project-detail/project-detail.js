/**
 * Teamden / Brick — Project Details & Tab Host Controller (project.js)
 * Path: pages/project/project.js
 *
 * Responsibilities:
 * 1. Mounts modular Sidebar and Navbar fragments from /fragments/
 * 2. Reads project ID and route parameters from URL (?id=... & tab=...)
 * 3. Manages Project Tab System (Overview, Tasks, Documents, Activity)
 * 4. Mounts the Project Overview component from project-overview/
 * 5. Handles responsive layout, status dropdowns, and tab state transitions
 */

(function (window) {
  'use strict';

  let currentProjectId = 'featured-01';
  let currentActiveTab = 'overview';
  let currentUser = null;

  /**
   * Helper to fetch and inject external HTML fragments
   */
  async function loadFragment(url, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    try {
      const cacheBustUrl = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
      const res = await fetch(cacheBustUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
      const html = await res.text();
      container.innerHTML = html;
    } catch (err) {
      console.error(`Failed to load fragment from ${url}:`, err);
    }
  }

  /**
   * Parse Query String parameters
   */
  function getUrlParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  /**
   * Tab Navigation System
   */
  const ProjectTabController = {
    tabs: ['overview', 'tasks', 'documents', 'activity'],

    init(initialTab) {
      this.bindTabButtons();
      const tabToActivate = this.tabs.includes(initialTab) ? initialTab : 'overview';
      this.switchTab(tabToActivate, {}, false);
    },

    bindTabButtons() {
      const buttons = document.querySelectorAll('.project-tab-btn');
      buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const targetTab = btn.getAttribute('data-tab');
          if (targetTab) {
            this.switchTab(targetTab);
          }
        });
      });
    },

    switchTab(tabName, options = {}, updateHistory = true) {
      if (!this.tabs.includes(tabName)) tabName = 'overview';
      currentActiveTab = tabName;

      // Update Tab Button States
      document.querySelectorAll('.project-tab-btn').forEach(btn => {
        const isTarget = btn.getAttribute('data-tab') === tabName;
        btn.classList.toggle('active', isTarget);
        btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
      });

      // Update Tab Pane Visibility
      document.querySelectorAll('.tab-view-pane').forEach(pane => {
        pane.classList.remove('active');
      });

      const activePane = document.getElementById(`pane-${tabName}`);
      if (activePane) {
        activePane.classList.add('active');
      }

      // Toggle right rail and tasks-mode layout for overview tab vs sub-tabs
      const rightRail = document.getElementById('project-right-rail');
      const drawerRail = document.getElementById('project-tasks-drawer-rail');
      const activityRail = document.getElementById('project-activity-rail');
      const contentSplit = document.querySelector('.project-content-split');
      const contentContainer = document.querySelector('.project-content-container');
      const titleDisplay = document.getElementById('project-title-display');

      if (rightRail) {
        rightRail.style.display = (tabName === 'overview') ? 'flex' : 'none';
      }
      if (drawerRail) {
        drawerRail.style.display = (tabName === 'tasks') ? 'flex' : 'none';
      }
      if (activityRail) {
        activityRail.style.display = (tabName === 'activity') ? 'flex' : 'none';
      }
      if (contentSplit) {
        contentSplit.classList.toggle('full-width', tabName === 'documents');
      }
      if (contentContainer) {
        contentContainer.classList.toggle('tab-tasks-mode', tabName === 'tasks');
        contentContainer.classList.toggle('tab-documents-mode', tabName === 'documents');
        contentContainer.classList.toggle('tab-activity-mode', tabName === 'activity');
        if (tabName !== 'tasks') {
          contentContainer.classList.remove('drawer-active');
        }
      }
      if (titleDisplay) {
        if (tabName === 'documents' || tabName === 'activity') {
          titleDisplay.innerHTML = 'website redesign. <span class="title-inline-status"><span class="project-status-dot"></span><span class="title-status-text">Active</span></span>';
        } else if (tabName === 'tasks') {
          titleDisplay.textContent = 'website redesign.';
        } else {
          titleDisplay.innerHTML = 'website<br>redesign.';
        }
      }

      // Update URL without full refresh
      if (updateHistory) {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tabName);
        window.history.replaceState({}, '', url.toString());
      }

      // Render Active Tab Content
      if (tabName === 'overview') {
        const mount = document.getElementById('project-overview-mount');
        if (mount && window.ProjectOverview) {
          window.ProjectOverview.mount(mount, currentProjectId);
        }
      } else if (tabName === 'tasks') {
        const mount = document.getElementById('project-tasks-mount');
        if (mount && window.ProjectTasks) {
          window.ProjectTasks.mount(mount, currentProjectId, options);
        } else {
          this.renderTasksTab(options);
        }
      } else if (tabName === 'documents') {
        const mount = document.getElementById('project-documents-mount');
        if (mount && window.ProjectDocuments) {
          window.ProjectDocuments.mount(mount, currentProjectId, options);
        } else {
          this.renderDocumentsTab(options);
        }
      } else if (tabName === 'activity') {
        const mount = document.getElementById('project-activity-mount');
        if (mount && window.ProjectActivity) {
          window.ProjectActivity.mount(mount, currentProjectId, options);
        } else {
          this.renderActivityTab(options);
        }
      }
    },

    renderTasksTab(options) {
      const mount = document.getElementById('project-tasks-mount');
      if (!mount) return;
      const filterText = options.filter ? `Filtered by status: <strong>${options.filter}</strong>` : 'Showing all project tasks';
      mount.innerHTML = `
        <div style="padding: 1rem 0; display: flex; flex-direction: column; gap: 0.75rem;">
          <p style="font-size: 0.8125rem; color: #555555; margin: 0;">${filterText}</p>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
            <div style="background: #FAF9F5; border: 1px solid #E5E2DC; border-radius: 8px; padding: 1rem;">
              <span style="font-size: 0.625rem; font-weight: 800; color: #777777;">TASK 01 · TO DO</span>
              <h4 style="margin: 0.35rem 0; font-size: 0.9375rem; font-weight: 700; color: #111111;">Prepare responsive layouts</h4>
              <span style="font-size: 0.75rem; color: #666666;">Assignee: Alex R. (AR)</span>
            </div>
            <div style="background: #FAF9F5; border: 1px solid #E5E2DC; border-radius: 8px; padding: 1rem;">
              <span style="font-size: 0.625rem; font-weight: 800; color: #F59E0B;">TASK 02 · IN PROGRESS</span>
              <h4 style="margin: 0.35rem 0; font-size: 0.9375rem; font-weight: 700; color: #111111;">Homepage development</h4>
              <span style="font-size: 0.75rem; color: #666666;">Assignee: Maya J. (MJ)</span>
            </div>
            <div style="background: #FAF9F5; border: 1px solid #E5E2DC; border-radius: 8px; padding: 1rem;">
              <span style="font-size: 0.625rem; font-weight: 800; color: #3B82F6;">TASK 03 · IN REVIEW</span>
              <h4 style="margin: 0.35rem 0; font-size: 0.9375rem; font-weight: 700; color: #111111;">Design system review</h4>
              <span style="font-size: 0.75rem; color: #666666;">Assignee: Sara K. (SK)</span>
            </div>
            <div style="background: #FAF9F5; border: 1px solid #E5E2DC; border-radius: 8px; padding: 1rem;">
              <span style="font-size: 0.625rem; font-weight: 800; color: #EF4444;">TASK 04 · BLOCKED</span>
              <h4 style="margin: 0.35rem 0; font-size: 0.9375rem; font-weight: 700; color: #111111;">Client copy approval</h4>
              <span style="font-size: 0.75rem; color: #666666;">Assignee: Paul K. (PK)</span>
            </div>
          </div>
        </div>
      `;
    },

    renderDocumentsTab() {
      const mount = document.getElementById('project-documents-mount');
      if (!mount) return;
      mount.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; padding: 1rem 0;">
          <div style="background: #FAF9F5; border: 1px solid #E5E2DC; border-radius: 8px; padding: 1rem;">
            <span style="font-size: 0.625rem; font-weight: 800; color: #E53E3E;">PDF</span>
            <h4 style="margin: 0.35rem 0; font-size: 0.9375rem; font-weight: 700; color: #111111;">Project Brief</h4>
            <span style="font-size: 0.75rem; color: #666666;">1.2 MB · Updated 2 days ago</span>
          </div>
          <div style="background: #FAF9F5; border: 1px solid #E5E2DC; border-radius: 8px; padding: 1rem;">
            <span style="font-size: 0.625rem; font-weight: 800; color: #3182CE;">DOC</span>
            <h4 style="margin: 0.35rem 0; font-size: 0.9375rem; font-weight: 700; color: #111111;">Design Review Notes</h4>
            <span style="font-size: 0.75rem; color: #666666;">850 KB · Updated yesterday</span>
          </div>
          <div style="background: #FAF9F5; border: 1px solid #E5E2DC; border-radius: 8px; padding: 1rem;">
            <span style="font-size: 0.625rem; font-weight: 800; color: #111111;">FIGMA</span>
            <h4 style="margin: 0.35rem 0; font-size: 0.9375rem; font-weight: 700; color: #111111;">Design References</h4>
            <span style="font-size: 0.75rem; color: #666666;">24 MB · Synced via Cloud</span>
          </div>
        </div>
      `;
    },

    renderActivityTab(options = {}) {
      const mount = document.getElementById('project-activity-mount');
      if (!mount) return;
      if (window.ProjectActivity) {
        window.ProjectActivity.mount(mount, currentProjectId, options);
        return;
      }
      mount.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.85rem; padding: 1rem 0;">
          <div style="display: flex; align-items: center; gap: 0.75rem; border-bottom: 1px solid #F0ECE4; padding-bottom: 0.65rem;">
            <span style="font-size: 0.6875rem; font-weight: 800; color: #111111;">10:30 AM</span>
            <span style="font-size: 0.8125rem; color: #333333;"><strong>Alex R.</strong> uploaded <em>Design Review Notes</em></span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.75rem; border-bottom: 1px solid #F0ECE4; padding-bottom: 0.65rem;">
            <span style="font-size: 0.6875rem; font-weight: 800; color: #111111;">Yesterday</span>
            <span style="font-size: 0.8125rem; color: #333333;"><strong>Paul K.</strong> flagged <em>Client copy approval</em> as Blocked</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.75rem; border-bottom: 1px solid #F0ECE4; padding-bottom: 0.65rem;">
            <span style="font-size: 0.6875rem; font-weight: 800; color: #111111;">2 days ago</span>
            <span style="font-size: 0.8125rem; color: #333333;">Milestone <strong>05 Content</strong> marked as Completed</span>
          </div>
        </div>
      `;
    }
  };

  // Expose TabController to window for cross-component coordination
  window.ProjectTabController = ProjectTabController;

  /**
   * Bind Header Status and Options Events
   */
  function bindHeaderEvents() {
    const statusBtn = document.getElementById('project-status-btn');
    if (statusBtn) {
      statusBtn.addEventListener('click', () => {
        const statuses = ['ACTIVE', 'IN REVIEW', 'PLANNING', 'ON HOLD', 'COMPLETED'];
        const current = document.getElementById('project-status-label')?.textContent || 'ACTIVE';
        const nextIdx = (statuses.indexOf(current) + 1) % statuses.length;
        const nextStatus = statuses[nextIdx];
        const label = document.getElementById('project-status-label');
        if (label) label.textContent = nextStatus;
      });
    }

    const moreBtn = document.getElementById('btn-project-more');
    if (moreBtn) {
      moreBtn.addEventListener('click', () => {
        alert('Project Settings & Options: Export Brief, Archive Project, or Duplicate.');
      });
    }
  }

  /**
   * Initialize Project Page
   */
  async function init() {
    // 1. Session verification
    if (typeof Auth !== 'undefined' && typeof Auth.checkSession === 'function') {
      try {
        currentUser = await Auth.checkSession();
      } catch (err) {
        console.warn('Session check skipped:', err);
      }
    }

    // 2. Read route parameters
    currentProjectId = getUrlParam('id') || 'featured-01';
    const initialTab = getUrlParam('tab') || 'activity';

    // 3. Mount Sidebar and Navbar fragments from /fragments/
    await Promise.all([
      loadFragment('/fragments/sidebar/sidebar.html', 'sidebar-mount'),
      loadFragment('/fragments/navbar/navbar.html', 'navbar-mount')
    ]);

    // 4. Initialize Fragment behaviors
    if (window.Sidebar && typeof Sidebar.init === 'function') {
      Sidebar.init(currentUser);
    }
    if (window.Navbar && typeof Navbar.init === 'function') {
      Navbar.init(currentUser);
    }

    // Direct fallback for sidebar collapse button
    const collapseBtn = document.getElementById('sidebar-collapse-btn');
    if (collapseBtn && window.Sidebar && typeof window.Sidebar.toggle === 'function') {
      collapseBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.Sidebar.toggle();
      };
    }

    // Highlight #nav-projects in sidebar
    const navProjects = document.getElementById('nav-projects');
    const navToday = document.getElementById('nav-today');
    if (navProjects) navProjects.classList.add('active');
    if (navToday) navToday.classList.remove('active');

    // 5. Initialize Tabs and Mount Overview Component
    ProjectTabController.init(initialTab);
    bindHeaderEvents();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window);
