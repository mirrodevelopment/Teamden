/**
 * Teamden / Brick — Projects Dashboard Controller (projects.js)
 * Path: pages/projects/projects.js
 *
 * Responsibilities:
 * 1. Asynchronously mounts modular Sidebar and Navbar fragments from /fragments/
 * 2. Fetches live project data from /api/projects/data with rich resilient fallback
 * 3. Renders Statistics Row, Featured Project in Focus, Filter Toolbar, and Project Cards Grid/List
 * 4. Renders Right Rail (Decisions Required, Project Attention, Upcoming Milestones)
 * 5. Handles interactive filtering, search, view switching (grid/list), and project creation
 */

(function () {
  'use strict';

  let currentProjectData = null;
  let currentUser = null;
  let currentFilter = 'all';
  let searchQuery = '';
  let currentViewMode = 'grid'; // 'grid' | 'list'

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

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Render dynamic date in header (e.g. THU, 29 OCT 2026)
   */
  function updateLiveDateHeader() {
    const dateEl = document.getElementById('projects-current-date');
    if (!dateEl) return;
    const now = new Date();
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const dayName = days[now.getDay()];
    const dayNum = String(now.getDate()).padStart(2, '0');
    const monthName = months[now.getMonth()];
    const year = now.getFullYear();
    dateEl.textContent = `${dayName}, ${dayNum} ${monthName} ${year}`;
  }

  /**
   * Render Project Statistics Row
   */
  function renderStats(data) {
    const totalEl = document.getElementById('stat-total-projects');
    const activeEl = document.getElementById('stat-active-projects');
    const atRiskEl = document.getElementById('stat-at-risk-projects');
    const dueSoonEl = document.getElementById('stat-due-soon-projects');

    if (totalEl) totalEl.textContent = String(data.totalProjects != null ? data.totalProjects : 0).padStart(2, '0');
    if (activeEl) activeEl.textContent = String(data.activeCount != null ? data.activeCount : 0).padStart(2, '0');
    if (atRiskEl) atRiskEl.textContent = String(data.atRiskCount != null ? data.atRiskCount : 0).padStart(2, '0');
    if (dueSoonEl) dueSoonEl.textContent = String(data.dueSoonCount != null ? data.dueSoonCount : 0).padStart(2, '0');
  }

  /**
   * Render Featured Project (Website Redesign)
   */
  function renderFeaturedCard(feat) {
    if (!feat) return;
    const titleEl = document.getElementById('featured-title');
    const descEl = document.getElementById('featured-desc');
    const teamEl = document.getElementById('featured-team');
    const dueEl = document.getElementById('featured-due');
    const priorityEl = document.getElementById('featured-priority');
    const ratioEl = document.getElementById('featured-milestone-ratio');
    const progressEl = document.getElementById('featured-progress-bar');
    const blockersEl = document.getElementById('featured-blockers-count');

    if (titleEl) titleEl.textContent = feat.name || 'Website Redesign';
    if (descEl) descEl.textContent = feat.description || 'Deliver a responsive, approved website ready for production.';
    if (teamEl) teamEl.textContent = feat.team || 'Design Team';
    if (dueEl) dueEl.textContent = feat.dueDate || 'Due 15 Nov 2026';
    if (priorityEl) priorityEl.textContent = feat.priority || 'High Priority';
    if (ratioEl) ratioEl.textContent = feat.milestonesLabel || '06/09';
    if (blockersEl) blockersEl.textContent = String(feat.blockersCount || 2).padStart(2, '0');

    if (progressEl && feat.milestonesTotal > 0) {
      const pct = Math.round((feat.milestonesCompleted / feat.milestonesTotal) * 100);
      progressEl.style.width = `${pct}%`;
    }
  }

  /**
   * Update Filter Chips Count Badges
   */
  function updateFilterCounts(projects) {
    const list = projects || [];
    const counts = {
      all: list.length,
      active: 0,
      in_review: 0,
      planning: 0,
      completed: 0,
      on_hold: 0
    };

    list.forEach(p => {
      const st = (p.status || 'ACTIVE').toLowerCase();
      if (counts.hasOwnProperty(st)) {
        counts[st]++;
      }
    });

    const setBadge = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setBadge('count-all', counts.all !== undefined ? counts.all : 12);
    setBadge('count-active', counts.active !== undefined ? counts.active : 8);
    setBadge('count-in-review', counts.in_review !== undefined ? counts.in_review : 2);
    setBadge('count-planning', counts.planning !== undefined ? counts.planning : 1);
    setBadge('count-completed', counts.completed !== undefined ? counts.completed : 0);
    setBadge('count-on-hold', counts.on_hold !== undefined ? counts.on_hold : 0);
  }

  /**
   * Render Filtered Project Cards Grid/List
   */
  function renderProjectsCollection() {
    const container = document.getElementById('projects-cards-container');
    const emptyState = document.getElementById('projects-empty-state');
    if (!container) return;

    const allProjects = (currentProjectData && currentProjectData.projects) ? currentProjectData.projects : [];

    // Filter by active chip
    let filtered = allProjects.filter(p => {
      if (currentFilter === 'all') return true;
      const st = (p.status || '').toLowerCase();
      return st === currentFilter;
    });

    // Filter by search text
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => {
        const name = (p.name || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const team = (p.team || '').toLowerCase();
        return name.includes(q) || desc.includes(q) || team.includes(q);
      });
    }

    if (filtered.length === 0) {
      container.innerHTML = '';
      container.classList.add('d-none');
      if (emptyState) emptyState.classList.remove('d-none');
      return;
    }

    container.classList.remove('d-none');
    if (emptyState) emptyState.classList.add('d-none');

    container.innerHTML = filtered.map(p => {
      const statCls = 'status-' + (p.status || 'ACTIVE').toLowerCase();
      const healthCls = 'health-' + (p.health || 'ON_TRACK').toLowerCase();
      const statDot = p.statusDotColor || 'green';
      const healthDot = p.healthDotColor || 'green';

      const avatarsHtml = (p.avatars || []).map(av => `
        <span class="avatar-circle" title="Team Member ${escapeHtml(av)}">${escapeHtml(av)}</span>
      `).join('');

      const overflowHtml = p.avatarOverflow ? `
        <span class="avatar-circle avatar-overflow">${escapeHtml(p.avatarOverflow)}</span>
      ` : '';

      return `
        <article class="project-card" data-project-id="${p.id || ''}" tabindex="0">
          <div class="card-top-header">
            <div class="card-badges-left">
              <span class="card-project-num">${escapeHtml(p.indexNum || '02')}</span>
              <span class="card-status-pill ${statCls}">
                <span class="stat-dot dot-${statDot}"></span>
                <span>${escapeHtml(p.statusLabel || p.status || 'ACTIVE')}</span>
              </span>
              <span class="card-health-pill ${healthCls}">
                <span class="stat-dot dot-${healthDot}"></span>
                <span>${escapeHtml(p.healthLabel || 'ON TRACK')}</span>
              </span>
            </div>
            <button class="card-menu-btn" title="Options" aria-label="Card options">•••</button>
          </div>

          <div class="card-body-content">
            <h3 class="card-title">${escapeHtml(p.name)}</h3>
            <p class="card-desc">${escapeHtml(p.description || '')}</p>
          </div>

          <div class="card-footer-meta">
            <div class="card-meta-indicators">
              <span class="card-milestones-meta">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
                <span>${escapeHtml(p.milestonesLabel || '3/5 milestones')}</span>
              </span>

              <span class="card-meta-divider" aria-hidden="true"></span>

              <span class="card-due-meta">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>${escapeHtml(p.dueDate || 'Due soon')}</span>
              </span>
            </div>

            <div class="card-avatar-wrap">
              <span class="card-meta-divider" aria-hidden="true"></span>
              <div class="card-avatar-stack">
                ${avatarsHtml}
                ${overflowHtml}
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  /**
   * Wire Toolbar Filter Chips, Search, and View Toggles
   */
  function bindToolbarEvents() {
    // Filter chips
    const chipBtns = document.querySelectorAll('.filter-chip');
    chipBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        chipBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.getAttribute('data-filter') || 'all';
        renderProjectsCollection();
      });
    });

    // Search Toggle & Input
    const searchWrap = document.querySelector('.toolbar-search-wrap');
    const searchBtn = document.getElementById('btn-toggle-search');
    const searchInput = document.getElementById('projects-search-input');

    if (searchBtn && searchWrap && searchInput) {
      searchBtn.addEventListener('click', () => {
        searchWrap.classList.toggle('active');
        if (searchWrap.classList.contains('active')) {
          searchInput.focus();
        }
      });

      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderProjectsCollection();
      });
    }

    // Grid vs List View Toggles
    const btnGrid = document.getElementById('btn-view-grid');
    const btnList = document.getElementById('btn-view-list');
    const collectionArea = document.getElementById('projects-cards-container');

    if (btnGrid && btnList && collectionArea) {
      btnGrid.addEventListener('click', () => {
        btnGrid.classList.add('active');
        btnGrid.setAttribute('aria-checked', 'true');
        btnList.classList.remove('active');
        btnList.setAttribute('aria-checked', 'false');
        collectionArea.className = 'projects-collection-area view-mode-grid';
        currentViewMode = 'grid';
      });

      btnList.addEventListener('click', () => {
        btnList.classList.add('active');
        btnList.setAttribute('aria-checked', 'true');
        btnGrid.classList.remove('active');
        btnGrid.setAttribute('aria-checked', 'false');
        collectionArea.className = 'projects-collection-area view-mode-list';
        currentViewMode = 'list';
      });
    }

    // Clear filters button
    const clearBtn = document.getElementById('btn-clear-filters');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        currentFilter = 'all';
        searchQuery = '';
        if (searchInput) searchInput.value = '';
        if (searchWrap) searchWrap.classList.remove('active');
        chipBtns.forEach(b => {
          if (b.getAttribute('data-filter') === 'all') b.classList.add('active');
          else b.classList.remove('active');
        });
        renderProjectsCollection();
      });
    }

    // Filter popover trigger
    const filterBtn = document.getElementById('btn-open-filter-modal');
    if (filterBtn) {
      filterBtn.addEventListener('click', () => {
        const nextFilter = (currentFilter === 'all' ? 'active' : 'all');
        const targetBtn = document.querySelector(`.filter-chip[data-filter="${nextFilter}"]`);
        if (targetBtn) targetBtn.click();
      });
    }
  }

  let cachedOptions = null;

  async function loadProjectOptions() {
    try {
      const res = await Api.get('/api/projects/options');
      if (res) {
        cachedOptions = res;
        populateOwnerSelect(res.owners);
      }
    } catch (err) {
      console.warn('Could not load project options:', err);
    }
  }

  function populateOwnerSelect(owners) {
    const ownerSelect = document.getElementById('select-project-owner');
    if (!ownerSelect) return;
    ownerSelect.innerHTML = '<option value="">Unassigned (No Lead Assigned)</option>';
    if (owners && owners.length > 0) {
      owners.forEach(o => {
        const opt = document.createElement('option');
        opt.value = o.id;
        opt.textContent = `${o.name} (${o.role || 'Member'})`;
        ownerSelect.appendChild(opt);
      });
    }
  }

  /**
   * Wire Project Creation Modal
   */
  function bindProjectModal() {
    const modal = document.getElementById('project-create-modal');
    const closeBtn = document.getElementById('btn-close-project-modal');
    const cancelBtn = document.getElementById('btn-cancel-project-modal');
    const form = document.getElementById('form-create-project');
    const newProjectBtn = document.getElementById('btn-open-create-project');

    const openModal = () => {
      if (modal) {
        modal.classList.remove('d-none');
        loadProjectOptions();
        const nameInput = document.getElementById('input-project-name');
        if (nameInput) nameInput.focus();
      }
    };

    window.openProjectModal = openModal;

    if (newProjectBtn) {
      newProjectBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      });
    }

    const closeModal = () => {
      if (modal) modal.classList.add('d-none');
      if (form) form.reset();
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    // Listen to navbar "+ New Project" click if present in modular navbar fragment
    document.addEventListener('click', (e) => {
      const projAction = e.target.closest('#create-action-project');
      if (projAction) {
        e.preventDefault();
        openModal();
      }
    });

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = (document.getElementById('input-project-name') || {}).value || '';
        const desc = (document.getElementById('input-project-desc') || {}).value || '';
        const ownerId = (document.getElementById('select-project-owner') || {}).value || null;
        const projectType = (document.getElementById('select-project-type') || {}).value || 'General';
        const status = (document.getElementById('select-project-status') || {}).value || 'ACTIVE';
        const priority = (document.getElementById('select-project-priority') || {}).value || 'MEDIUM';
        const health = (document.getElementById('select-project-health') || {}).value || 'ON_TRACK';
        const dueDate = (document.getElementById('input-project-due') || {}).value || null;

        if (!name.trim()) {
          alert('Please enter a project name.');
          return;
        }

        const submitBtn = document.getElementById('btn-submit-project');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Creating...';
        }

        try {
          const payload = {
            name: name.trim(),
            description: desc.trim(),
            ownerId: ownerId || null,
            projectType,
            status,
            priority,
            health,
            dueDate: dueDate || null
          };

          await Api.post('/api/projects', payload);
          closeModal();
          await fetchAndRenderProjectData();
        } catch (err) {
          console.error('Failed to create project:', err);
          alert('Could not create project: ' + (err.message || 'Please check your inputs and try again.'));
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Project';
          }
        }
      });
    }
  }

  async function fetchAndRenderProjectData() {
    try {
      const res = await fetch('/api/projects/data');
      if (res.ok) {
        currentProjectData = await res.json();
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      console.warn('Could not load from /api/projects/data:', err);
      currentProjectData = {
        workspaceBreadcrumb: 'YOUR WORKSPACE / 02',
        currentDateLabel: '',
        totalProjects: 0,
        activeCount: 0,
        atRiskCount: 0,
        dueSoonCount: 0,
        featuredProject: null,
        projects: [],
        decisions: [],
        projectAttention: [],
        upcomingMilestones: []
      };
    }

    if (currentProjectData) {
      renderStats(currentProjectData);
      renderFeaturedCard(currentProjectData.featuredProject);
      updateFilterCounts(currentProjectData.projects);
      renderProjectsCollection();
    }
  }

  /**
   * Initialize Page & Mount Fragments
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

    // 2. Mount Sidebar and Navbar fragments from /fragments/
    await Promise.all([
      loadFragment('/fragments/sidebar/sidebar.html', 'sidebar-mount'),
      loadFragment('/fragments/navbar/navbar.html', 'navbar-mount')
    ]);

    // 3. Initialize Fragment behaviors
    if (window.Sidebar && typeof Sidebar.init === 'function') {
      Sidebar.init(currentUser);
    }
    if (window.Navbar && typeof Navbar.init === 'function') {
      Navbar.init(currentUser);
    }

    // Ensure #nav-projects is highlighted with active class in sidebar
    const navProjects = document.getElementById('nav-projects');
    const navToday = document.getElementById('nav-today');
    if (navProjects) navProjects.classList.add('active');
    if (navToday) navToday.classList.remove('active');

    // 4. Start dynamic live date clock
    updateLiveDateHeader();
    setInterval(updateLiveDateHeader, 60000);

    // 5. Fetch & Populate Projects Dashboard Data from backend
    await fetchAndRenderProjectData();

    // 7. Bind Interactive Events
    bindToolbarEvents();
    bindProjectModal();

    // 8. Open featured project button
    const openFeaturedBtn = document.getElementById('btn-open-featured');
    if (openFeaturedBtn) {
      openFeaturedBtn.addEventListener('click', () => {
        window.location.href = '/pages/projects/project-detail/project-detail.html?id=featured-01';
      });
    }

    // Delegate project cards click
    const cardsContainer = document.getElementById('projects-cards-container');
    if (cardsContainer) {
      cardsContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.project-card');
        const menuBtn = e.target.closest('.card-menu-btn');
        if (card && !menuBtn) {
          const pid = card.getAttribute('data-project-id') || 'featured-01';
          window.location.href = `/pages/projects/project-detail/project-detail.html?id=${encodeURIComponent(pid)}`;
        }
      });
    }

    // 9. Review decision buttons
    document.querySelectorAll('.btn-review-decision').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        alert('Reviewing Decision: Identity Approval for Brand Development');
      });
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
