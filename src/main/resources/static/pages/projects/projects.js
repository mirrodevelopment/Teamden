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
   * Render Featured Project
   */
  function renderFeaturedCard(feat) {
    const card = document.getElementById('featured-project-card');
    if (!card) return;
    if (!feat) {
      card.innerHTML = `
        <div class="featured-empty-state" style="padding: 32px; width: 100%;">
          <span class="featured-tag-id">01 / PROJECT IN FOCUS</span>
          <h2 class="featured-project-title" style="margin-top: 12px;">No active projects</h2>
          <p class="featured-project-desc" style="margin-top: 8px; color: var(--dash-text-muted);">Create your first project to track milestones, tasks, and team deliverables.</p>
          <button class="btn-create-project-primary" style="margin-top: 16px; padding: 10px 18px; border-radius: 8px; background: var(--dash-accent-lime); color: var(--dash-card-dark); font-weight: 600; cursor: pointer; border: none;" onclick="document.getElementById('btn-open-create-project')?.click()">+ Create Project</button>
        </div>
      `;
      return;
    }

    const pct = feat.milestonesTotal > 0 ? Math.round((feat.milestonesCompleted / feat.milestonesTotal) * 100) : 0;
    card.innerHTML = `
      <div class="featured-left-col">
        <div class="featured-top-row">
          <span class="featured-tag-id">01 / PROJECT IN FOCUS</span>
          <span class="status-pill pill-active">
            <span class="pill-dot dot-green"></span>
            <span>${escapeHtml(feat.status || 'ACTIVE')}</span>
          </span>
        </div>

        <h2 class="featured-project-title" id="featured-title">${escapeHtml(feat.name)}</h2>
        <p class="featured-project-desc" id="featured-desc">${escapeHtml(feat.description || '')}</p>

        <div class="featured-meta-row">
          <span class="featured-meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            <span id="featured-team">${escapeHtml(feat.team || 'Design Team')}</span>
          </span>
          <span class="featured-meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span id="featured-due">${escapeHtml(feat.dueDate || 'Due soon')}</span>
          </span>
          <span class="featured-meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--dash-status-urgent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
              <line x1="4" y1="22" x2="4" y2="15"></line>
            </svg>
            <span id="featured-priority">${escapeHtml(feat.priority || 'Medium Priority')}</span>
          </span>
        </div>
      </div>

      <div class="featured-right-col">
        <div class="featured-metrics-wrap">
          <div class="featured-milestones-box">
            <span class="feat-metric-label">MILESTONES</span>
            <span class="feat-metric-val" id="featured-milestone-ratio">${escapeHtml(feat.milestonesLabel || '0/0')}</span>
            <div class="feat-progress-track">
              <div class="feat-progress-fill" id="featured-progress-bar" style="width: ${pct}%;"></div>
            </div>
          </div>

          <div class="featured-blockers-box">
            <span class="feat-metric-label">BLOCKERS</span>
            <span class="feat-metric-val" id="featured-blockers-count">${String(feat.blockersCount || 0).padStart(2, '0')}</span>
          </div>
        </div>

        <button class="btn-open-project" id="btn-open-featured" onclick="window.location.href='/pages/projects/project-detail/project-detail.html?id=${escapeHtml(feat.id)}'">
          <span>Open project</span>
          <span class="arrow-glyph">→</span>
        </button>
      </div>
    `;
  }

  /**
   * Render Right Rail: Decisions Required, Project Attention, Upcoming Milestones
   */
  function renderRightRail(decisions, attention, milestones) {
    // 1. Decisions Required
    const decisionsListEl = document.getElementById('decisions-items-list');
    const decisionsLargeNum = document.getElementById('decisions-large-num');
    const decList = decisions || [];
    if (decisionsLargeNum) {
      decisionsLargeNum.textContent = String(decList.length).padStart(2, '0');
    }
    if (decisionsListEl) {
      if (decList.length === 0) {
        decisionsListEl.innerHTML = '<div style="padding: 16px; font-size: 12px; color: var(--dash-text-muted); text-align: center;">No approvals awaiting action</div>';
      } else {
        decisionsListEl.innerHTML = decList.map((d, idx) => `
          <div class="decision-card-item ${idx === 0 ? 'card-primary-highlight' : ''}">
            <div class="decision-top-meta">
              <span class="decision-dot dot-amber"></span>
              <span class="decision-project-tag">${escapeHtml(d.project || 'PROJECT')}</span>
            </div>
            <h4 class="decision-title">${escapeHtml(d.title)}</h4>
            <span class="decision-sub">${escapeHtml(d.sub || 'Pending review')}</span>
            <div class="decision-action-row">
              <span class="decision-due-date">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>${escapeHtml(d.dueDate || 'Due soon')}</span>
              </span>
              <button class="btn-review-decision" onclick="window.location.href='/pages/projects/projects.html'">Review →</button>
            </div>
          </div>
        `).join('');
      }
    }

    // 2. Project Attention
    const attentionListEl = document.getElementById('attention-items-list');
    const attList = attention || [];
    if (attentionListEl) {
      if (attList.length === 0) {
        attentionListEl.innerHTML = '<div style="padding: 16px; font-size: 12px; color: var(--dash-text-muted); text-align: center;">All projects are currently on track. No active risks or blockers.</div>';
      } else {
        attentionListEl.innerHTML = attList.map((att, idx) => `
          <div class="attention-card-item">
            <div class="att-num-col">
              <span class="att-num">${String(idx + 1).padStart(2, '0')}</span>
              <span class="att-num-line"></span>
            </div>
            <div class="att-body">
              <div class="att-top-row">
                <span class="att-status-badge ${att.badgeClass || 'badge-blocked'}">
                  <span class="att-badge-dot ${att.dotClass || 'dot-red'}"></span>
                  <span>${escapeHtml(att.status || 'ATTENTION')}</span>
                </span>
                <span class="att-meta-label">${escapeHtml(att.metaLabel || '')}</span>
              </div>
              <div class="att-content-row">
                <div class="att-info-col">
                  <h4 class="att-project-name">${escapeHtml(att.projectName || 'Project')}</h4>
                  <p class="att-detail-text">${escapeHtml(att.detail || '')}</p>
                </div>
                <span class="att-arrow">→</span>
              </div>
            </div>
          </div>
        `).join('');
      }
    }

    // 3. Upcoming Milestones
    const milestonesListEl = document.getElementById('milestones-timeline-list');
    const msList = milestones || [];
    if (milestonesListEl) {
      if (msList.length === 0) {
        milestonesListEl.innerHTML = '<div style="padding: 16px; font-size: 12px; color: var(--dash-text-muted); text-align: center;">No upcoming milestones scheduled.</div>';
      } else {
        milestonesListEl.innerHTML = msList.map(ms => `
          <div class="milestone-timeline-item">
            <div class="milestone-date-col">
              <span class="milestone-date-str">${escapeHtml(ms.day || '')}</span>
              <span class="milestone-month-str">${escapeHtml(ms.month || '')}</span>
            </div>
            <span class="milestone-node-dot dot-green"></span>
            <div class="milestone-content">
              <h5 class="milestone-item-title">${escapeHtml(ms.title)}</h5>
              <span class="milestone-item-sub">${escapeHtml(ms.project || '')}</span>
            </div>
            <span class="milestone-arrow">→</span>
          </div>
        `).join('');
      }
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
      if (window.UniversalCreate) {
        window.UniversalCreate.open('PROJECT');
        return;
      }
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
      renderRightRail(currentProjectData.decisions, currentProjectData.projectAttention, currentProjectData.upcomingMilestones);
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
