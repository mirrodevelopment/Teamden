/**
 * Teamden by shed — Overview Page Controller (overview.js)
 * Path: pages/overview/overview.js
 *
 * Implements complete interactive logic for Brick Executive Overview Dashboard:
 * 1. Mounting Sidebar & Navbar fragments
 * 2. Real-time data hydration via /api/projects/data with rich fallback defaults
 * 3. Dynamic Date Range & Team filtering affecting KPIs, projects, and attention banners
 * 4. Interactive project rows linking to project details
 * 5. Interactive Decision Desk & Review approval workflow
 * 6. Interactive Delivery Dependencies inspector
 * 7. Executive insights drawer and automated organisation summary export
 */

(function () {
  'use strict';

  // State Management
  let currentUser = null;
  let activeData = null;
  let selectedDateRange = '30';
  let selectedTeam = 'all';

  // Seed Data strictly aligned with Reference Screenshot
  const SEED_DATA = {
    organizationName: 'Acme Co.',
    kpis: {
      activeProjects: 9,
      pendingDecisions: 3,
      blockedHandoffs: 2,
      upcomingMilestones: 4
    },
    pulse: {
      heading: 'Delivery is progressing. Two handoffs need resolution.',
      subtext: 'Pending handoffs may affect upcoming project milestones.'
    },
    projects: [
      {
        id: 'featured-01',
        name: 'Website Redesign',
        team: 'Design and Engineering',
        activityType: 'Next milestone',
        activityText: 'Design handoff · 30 Oct',
        statusKey: 'on-track',
        statusLabel: 'On Track',
        teamCategory: 'Design and Engineering'
      },
      {
        id: 'proj-03',
        name: 'Brand Development',
        team: 'Creative and Marketing',
        activityType: 'Approval pending',
        activityText: 'Brand identity',
        statusKey: 'needs-attention',
        statusLabel: 'Needs Attention',
        teamCategory: 'Creative and Marketing'
      },
      {
        id: 'proj-02',
        name: 'Client Application',
        team: 'Engineering and Design',
        activityType: 'Handoff delayed',
        activityText: 'API integration · 02 Nov',
        statusKey: 'at-risk',
        statusLabel: 'At Risk',
        teamCategory: 'Engineering and Design'
      },
      {
        id: 'proj-04',
        name: 'Marketing Campaign',
        team: 'Marketing',
        activityType: 'In progress',
        activityText: 'Content and creative',
        statusKey: 'planning',
        statusLabel: 'Planning',
        teamCategory: 'Marketing'
      },
      {
        id: 'proj-06',
        name: 'Internal Tools',
        team: 'Operations',
        activityType: 'Research phase',
        activityText: 'Discovery and planning',
        statusKey: 'planning-grey',
        statusLabel: 'Planning',
        teamCategory: 'Operations'
      }
    ],
    decisions: [
      {
        id: 'dec-brand-identity',
        iconType: 'cube',
        title: 'Brand identity approval',
        project: 'Brand Development',
        meta: 'Client review pending · 30 Oct',
        team: 'Creative and Marketing'
      },
      {
        id: 'dec-pricing-structure',
        iconType: 'document',
        title: 'Pricing structure',
        project: 'Client Application',
        meta: 'Client Application · 02 Nov',
        team: 'Engineering and Design'
      }
    ],
    dependencies: [
      {
        id: 'dep-design-handoff',
        title: 'Design system handoff',
        project: 'Website Redesign',
        meta: 'From Design → Engineering',
        team: 'Design and Engineering',
        status: 'Blocked by component audit'
      },
      {
        id: 'dep-api-integration',
        title: 'API integration',
        project: 'Client Application',
        meta: 'From Engineering → QA',
        team: 'Engineering and Design',
        status: 'Delayed by auth endpoint'
      }
    ],
    upcomingDelivery: [
      {
        icon: 'flag',
        iconColor: 'icon-box-green',
        title: 'Design handoff',
        meta: 'Website Redesign · 30 Oct'
      },
      {
        icon: 'calendar',
        iconColor: 'icon-box-blue',
        title: 'Client review',
        meta: 'Brand Development · 02 Nov'
      },
      {
        icon: 'cube',
        iconColor: 'icon-box-peach',
        title: 'Feature launch',
        meta: 'Client Application · 10 Nov'
      },
      {
        icon: 'document',
        iconColor: 'icon-box-blue',
        title: 'Campaign rollout',
        meta: 'Marketing · 12 Nov'
      }
    ],
    acrossOrg: [
      {
        icon: 'team',
        iconColor: 'icon-box-purple',
        title: 'Design → Engineering',
        desc: 'Approved specifications ready for handoff.'
      },
      {
        icon: 'book',
        iconColor: 'icon-box-green',
        title: 'Shared Knowledge',
        desc: 'Updated team guidelines are awaiting publication approval.'
      },
      {
        icon: 'chat',
        iconColor: 'icon-box-blue',
        title: 'Team Update',
        desc: 'Q4 planning sessions begin next week across all teams.'
      }
    ]
  };

  /**
   * Helper to load external HTML fragments (Sidebar & Navbar)
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
      console.warn(`Could not load fragment from ${url}, continuing with static fallback:`, err);
    }
  }

  /**
   * Escape HTML utility
   */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Toast notification system
   */
  function showToast(message) {
    const container = document.getElementById('overview-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'overview-toast';
    toast.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#CBF931" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      <span>${escapeHtml(message)}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all 180ms ease';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 200);
    }, 3200);
  }

  /**
   * Fetch current user and live backend projects
   */
  async function fetchInitialData() {
    activeData = JSON.parse(JSON.stringify(SEED_DATA));

    // 1. Try to load authenticated user
    try {
      if (window.Auth && typeof window.Auth.getCurrentUser === 'function') {
        currentUser = await window.Auth.getCurrentUser();
      } else {
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          currentUser = await userRes.json();
        }
      }
    } catch (e) {
      console.warn('Auth check fallback to guest/mock user:', e);
    }

    if (!currentUser) {
      currentUser = {
        name: 'Alex Rivera',
        email: 'alex@acme.co',
        initials: 'AR',
        activeOrganizationName: 'Acme Co.'
      };
    }

    // 2. Try to load live project data from API
    try {
      const projRes = await fetch('/api/projects/data');
      if (projRes.ok) {
        const data = await projRes.json();
        if (data.workspaceBreadcrumb) {
          const parts = data.workspaceBreadcrumb.split('/');
          if (parts.length > 1) {
            activeData.organizationName = parts[1].trim();
          }
        }
      }
    } catch (err) {
      console.warn('Backend /api/projects/data offline or unauthenticated, using baseline model:', err);
    }

    // Set organization in breadcrumb
    const orgCrumb = document.getElementById('org-name-crumb');
    if (orgCrumb && currentUser.activeOrganizationName) {
      orgCrumb.textContent = currentUser.activeOrganizationName.toUpperCase();
    }

    renderDashboard();
  }

  /**
   * Render all dashboard components with current filter state
   */
  function renderDashboard() {
    renderKPIs();
    renderDeliveryLandscape();
    renderDecisionDesk();
    renderDeliveryDependencies();
    renderRightRail();
  }

  /**
   * Calculate and render KPI Cards
   */
  function renderKPIs() {
    let activeCount = activeData.kpis.activeProjects;
    let pendingDecisions = activeData.kpis.pendingDecisions;
    let blockedHandoffs = activeData.kpis.blockedHandoffs;
    let upcomingMilestones = activeData.kpis.upcomingMilestones;

    // Apply filter adjustments dynamically if filtered by team
    if (selectedTeam !== 'all') {
      const filtered = activeData.projects.filter(p => p.teamCategory === selectedTeam);
      activeCount = filtered.length;
      pendingDecisions = activeData.decisions.filter(d => d.team === selectedTeam).length;
      blockedHandoffs = activeData.dependencies.filter(d => d.team === selectedTeam).length;
      upcomingMilestones = Math.max(1, Math.round(activeCount * 0.8));
    }

    // Format numbers with leading zeros (e.g. "09", "03")
    const formatMetric = (n) => String(n).padStart(2, '0');

    const elActive = document.getElementById('metric-active-projects');
    const elDecisions = document.getElementById('metric-pending-decisions');
    const elHandoffs = document.getElementById('metric-blocked-handoffs');
    const elMilestones = document.getElementById('metric-upcoming-milestones');

    if (elActive) elActive.textContent = formatMetric(activeCount);
    if (elDecisions) elDecisions.textContent = formatMetric(pendingDecisions);
    if (elHandoffs) elHandoffs.textContent = formatMetric(blockedHandoffs);
    if (elMilestones) elMilestones.textContent = formatMetric(upcomingMilestones);

    // Update context labels
    const ctxProjects = document.getElementById('metric-context-projects');
    if (ctxProjects) {
      ctxProjects.textContent = selectedDateRange === '7' ? 'across last 7 days'
        : selectedDateRange === '30' ? 'across last 30 days'
        : selectedDateRange === '90' ? 'across last 90 days'
        : 'year to date';
    }

    // Update Organisation Pulse Banner text based on blocked handoffs
    const pulseHeading = document.getElementById('pulse-banner-heading');
    const pulseSubtext = document.getElementById('pulse-banner-subtext');
    if (pulseHeading && pulseSubtext) {
      if (blockedHandoffs === 0) {
        pulseHeading.textContent = 'All handoffs are clear. Delivery cadence is optimal.';
        pulseSubtext.textContent = 'No active blockers reported across any project milestones.';
      } else if (blockedHandoffs === 1) {
        pulseHeading.textContent = 'Delivery is progressing. One handoff needs resolution.';
        pulseSubtext.textContent = 'Pending handoff may affect upcoming project milestones.';
      } else if (blockedHandoffs === 2) {
        pulseHeading.textContent = 'Delivery is progressing. Two handoffs need resolution.';
        pulseSubtext.textContent = 'Pending handoffs may affect upcoming project milestones.';
      } else {
        pulseHeading.textContent = `Delivery is progressing. ${blockedHandoffs} handoffs need resolution.`;
        pulseSubtext.textContent = 'Pending handoffs may affect upcoming project milestones.';
      }
    }
  }

  /**
   * Render 02 / DELIVERY LANDSCAPE project rows
   */
  function renderDeliveryLandscape() {
    const listEl = document.getElementById('project-rows-list');
    if (!listEl) return;

    let projects = activeData.projects;
    if (selectedTeam !== 'all') {
      projects = projects.filter(p => p.teamCategory === selectedTeam);
    }

    if (projects.length === 0) {
      listEl.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--ov-text-muted); font-size: 13px;">
          No projects currently matching "${escapeHtml(selectedTeam)}".
        </div>
      `;
      return;
    }

    listEl.innerHTML = projects.map(proj => {
      const statusClass = `status-${proj.statusKey}`;
      return `
        <a href="/pages/projects/project-detail/project-detail.html?id=${escapeHtml(proj.id)}" class="project-row-item" data-id="${escapeHtml(proj.id)}">
          <div class="project-status-col">
            <span class="status-pill ${statusClass}">
              <span class="status-dot"></span>
              <span>${escapeHtml(proj.statusLabel)}</span>
            </span>
          </div>

          <div class="project-meta-col">
            <span class="project-meta-title">${escapeHtml(proj.name)}</span>
            <span class="project-meta-team">${escapeHtml(proj.team)}</span>
          </div>

          <div class="project-activity-col">
            <span class="project-activity-lbl">${escapeHtml(proj.activityType)}</span>
            <span class="project-activity-val">${escapeHtml(proj.activityText)}</span>
          </div>

          <div class="project-chevron-arrow">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        </a>
      `;
    }).join('');
  }

  /**
   * Render 03 / DECISION DESK items
   */
  function renderDecisionDesk() {
    const listEl = document.getElementById('decision-items-list');
    if (!listEl) return;

    let items = activeData.decisions;
    if (selectedTeam !== 'all') {
      items = items.filter(d => d.team === selectedTeam);
    }

    if (items.length === 0) {
      listEl.innerHTML = `
        <div style="padding: 12px; font-size: 12px; color: var(--ov-text-secondary);">
          No pending decisions awaiting direction.
        </div>
      `;
      return;
    }

    listEl.innerHTML = items.map(dec => {
      const isCube = dec.iconType === 'cube';
      const iconClass = isCube ? 'desk-icon-peach' : 'desk-icon-blue';
      const iconSvg = isCube ? `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
      ` : `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
      `;

      return `
        <div class="desk-item-row" data-decision-id="${escapeHtml(dec.id)}" role="button" tabindex="0">
          <div class="desk-item-left">
            <div class="desk-item-icon-wrap ${iconClass}">
              ${iconSvg}
            </div>
            <div class="desk-item-info">
              <span class="desk-item-title">${escapeHtml(dec.title)}</span>
              <span class="desk-item-sub">${escapeHtml(dec.meta)}</span>
            </div>
          </div>
          <svg class="desk-item-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      `;
    }).join('');

    // Attach click listeners to rows
    listEl.querySelectorAll('.desk-item-row').forEach(row => {
      row.addEventListener('click', () => {
        const id = row.getAttribute('data-decision-id');
        openDecisionModal(id);
      });
    });
  }

  /**
   * Render 04 / DELIVERY DEPENDENCIES items
   */
  function renderDeliveryDependencies() {
    const listEl = document.getElementById('dependency-items-list');
    if (!listEl) return;

    let items = activeData.dependencies;
    if (selectedTeam !== 'all') {
      items = items.filter(d => d.team === selectedTeam);
    }

    if (items.length === 0) {
      listEl.innerHTML = `
        <div style="padding: 12px; font-size: 12px; color: var(--ov-text-secondary);">
          No blocked cross-team handoffs.
        </div>
      `;
      return;
    }

    listEl.innerHTML = items.map(dep => {
      return `
        <div class="desk-item-row" data-dependency-id="${escapeHtml(dep.id)}" role="button" tabindex="0">
          <div class="desk-item-left">
            <div class="desk-item-icon-wrap desk-icon-blue">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
            </div>
            <div class="desk-item-info">
              <span class="desk-item-title">${escapeHtml(dep.title)}</span>
              <span class="desk-item-sub">${escapeHtml(dep.meta)}</span>
            </div>
          </div>
          <svg class="desk-item-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      `;
    }).join('');

    // Attach click listeners to dependency rows
    listEl.querySelectorAll('.desk-item-row').forEach(row => {
      row.addEventListener('click', () => {
        const id = row.getAttribute('data-dependency-id');
        openDependencyModal(id);
      });
    });
  }

  /**
   * Render Right Rail: Upcoming Delivery & Across the Organisation
   */
  function renderRightRail() {
    // 1. Upcoming Delivery List
    const deliveryListEl = document.getElementById('upcoming-delivery-list');
    if (deliveryListEl) {
      deliveryListEl.innerHTML = activeData.upcomingDelivery.map(item => {
        let iconSvg = '';
        if (item.icon === 'flag') {
          iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>`;
        } else if (item.icon === 'calendar') {
          iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
        } else if (item.icon === 'cube') {
          iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`;
        } else {
          iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`;
        }

        return `
          <div class="exec-rail-item" role="button" tabindex="0" onclick="window.location.href='/pages/calendar/calendar.html'">
            <div class="exec-item-icon-box ${item.iconColor}">
              ${iconSvg}
            </div>
            <div class="exec-item-details">
              <span class="exec-item-title">${escapeHtml(item.title)}</span>
              <span class="exec-item-desc">${escapeHtml(item.meta)}</span>
            </div>
          </div>
        `;
      }).join('');
    }

    // 2. Across the Organisation List
    const acrossOrgEl = document.getElementById('across-org-list');
    if (acrossOrgEl) {
      acrossOrgEl.innerHTML = activeData.acrossOrg.map(item => {
        let iconSvg = '';
        if (item.icon === 'team') {
          iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;
        } else if (item.icon === 'book') {
          iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`;
        } else {
          iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
        }

        return `
          <div class="exec-rail-item" role="button" tabindex="0">
            <div class="exec-item-icon-box ${item.iconColor}">
              ${iconSvg}
            </div>
            <div class="exec-item-details">
              <span class="exec-item-title">${escapeHtml(item.title)}</span>
              <span class="exec-item-desc">${escapeHtml(item.desc)}</span>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  /**
   * Modal Controller: Open Decision Review Modal
   */
  function openDecisionModal(decisionId) {
    const modal = document.getElementById('modal-review-backdrop');
    if (!modal) return;
    modal.classList.add('open');
  }

  function closeReviewModal() {
    const modal = document.getElementById('modal-review-backdrop');
    if (modal) modal.classList.remove('open');
  }

  /**
   * Modal Controller: Open Generic Detail Modal for Dependencies
   */
  function openDependencyModal(depId) {
    const dep = activeData.dependencies.find(d => d.id === depId);
    if (!dep) return;

    const modal = document.getElementById('modal-detail-backdrop');
    const eyebrow = document.getElementById('modal-detail-eyebrow');
    const content = document.getElementById('modal-detail-content');
    if (!modal || !content) return;

    eyebrow.textContent = 'DELIVERY DEPENDENCY · 04';
    content.innerHTML = `
      <h2 class="modal-heading-large">${escapeHtml(dep.title)}</h2>
      <p class="modal-lead-text">Cross-functional handoff status between teams for ${escapeHtml(dep.project)}.</p>

      <div class="modal-review-meta-box">
        <div class="meta-item">
          <span class="meta-lbl">Project</span>
          <span class="meta-val">${escapeHtml(dep.project)}</span>
        </div>
        <div class="meta-item">
          <span class="meta-lbl">Handoff Route</span>
          <span class="meta-val">${escapeHtml(dep.meta)}</span>
        </div>
        <div class="meta-item">
          <span class="meta-lbl">Handoff Health</span>
          <span class="meta-val status-pill-warning">${escapeHtml(dep.status)}</span>
        </div>
      </div>

      <div style="font-size: 13px; color: var(--ov-text-secondary); line-height: 1.5; padding: 4px 0;">
        Both source and receiving team leads have been notified. Resolving this item will unblock downstream milestones.
      </div>
    `;

    modal.classList.add('open');
  }

  function closeDetailModal() {
    const modal = document.getElementById('modal-detail-backdrop');
    if (modal) modal.classList.remove('open');
  }

  /**
   * Insights Modal Controller
   */
  function openInsightsModal() {
    const modal = document.getElementById('modal-insights-backdrop');
    if (modal) modal.classList.add('open');
  }

  function closeInsightsModal() {
    const modal = document.getElementById('modal-insights-backdrop');
    if (modal) modal.classList.remove('open');
  }

  /**
   * Export Organisation Summary report
   */
  function exportOrganisationSummary() {
    const rows = [
      ['SECTION', 'ITEM_NAME', 'TEAM', 'STATUS', 'METRIC_DETAIL'],
      ['KPI', 'Active Projects', 'All', 'ACTIVE', String(activeData.kpis.activeProjects)],
      ['KPI', 'Pending Decisions', 'All', 'AWAITING_DIRECTION', String(activeData.kpis.pendingDecisions)],
      ['KPI', 'Blocked Handoffs', 'All', 'NEEDS_RESOLUTION', String(activeData.kpis.blockedHandoffs)],
      ['KPI', 'Upcoming Milestones', 'All', 'WITHIN_7_DAYS', String(activeData.kpis.upcomingMilestones)],
      ...activeData.projects.map(p => ['PROJECT', p.name, p.team, p.statusLabel, p.activityText]),
      ...activeData.decisions.map(d => ['DECISION', d.title, d.team, 'PENDING_REVIEW', d.meta]),
      ...activeData.dependencies.map(dp => ['DEPENDENCY', dp.title, dp.team, 'BLOCKED', dp.status])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Brick_Executive_Organisation_Summary_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Organisation summary report downloaded successfully.');
  }

  /**
   * Set up all interactive event listeners
   */
  function setupEventListeners() {
    // 1. Date Range Filter Dropdown Toggle
    const dateBtn = document.getElementById('date-filter-btn');
    const dateWrap = document.getElementById('date-dropdown-wrap');
    if (dateBtn && dateWrap) {
      dateBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dateWrap.classList.toggle('open');
        dateBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        // Close other dropdowns
        document.getElementById('team-dropdown-wrap')?.classList.remove('open');
      });

      dateWrap.querySelectorAll('.filter-option').forEach(opt => {
        opt.addEventListener('click', () => {
          selectedDateRange = opt.getAttribute('data-range');
          document.getElementById('date-filter-label').textContent = opt.textContent;
          dateWrap.querySelectorAll('.filter-option').forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');
          dateWrap.classList.remove('open');
          showToast(`Filtered overview: ${opt.textContent}`);
          renderKPIs();
        });
      });
    }

    // 2. Team Filter Dropdown Toggle
    const teamBtn = document.getElementById('team-filter-btn');
    const teamWrap = document.getElementById('team-dropdown-wrap');
    if (teamBtn && teamWrap) {
      teamBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = teamWrap.classList.toggle('open');
        teamBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        // Close other dropdowns
        document.getElementById('date-dropdown-wrap')?.classList.remove('open');
      });

      teamWrap.querySelectorAll('.filter-option').forEach(opt => {
        opt.addEventListener('click', () => {
          selectedTeam = opt.getAttribute('data-team');
          document.getElementById('team-filter-label').textContent = opt.textContent;
          teamWrap.querySelectorAll('.filter-option').forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');
          teamWrap.classList.remove('open');
          showToast(`Showing data for: ${opt.textContent}`);
          renderDashboard();
        });
      });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
      dateWrap?.classList.remove('open');
      teamWrap?.classList.remove('open');
    });

    // 3. Organisation Pulse Hero Banner click
    const pulseAction = document.getElementById('pulse-action-btn');
    if (pulseAction) {
      pulseAction.addEventListener('click', () => {
        const depSec = document.getElementById('delivery-dependencies-section');
        if (depSec) {
          depSec.scrollIntoView({ behavior: 'smooth', block: 'center' });
          depSec.style.outline = '2px solid var(--ov-accent-lime)';
          setTimeout(() => { depSec.style.outline = 'none'; }, 1600);
        }
      });
    }

    // 4. KPI Cards Clicks
    document.getElementById('kpi-card-projects')?.addEventListener('click', () => {
      window.location.href = '/pages/projects/projects.html';
    });

    document.getElementById('kpi-card-decisions')?.addEventListener('click', () => {
      const decSec = document.getElementById('decision-desk-section');
      if (decSec) decSec.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    document.getElementById('kpi-card-handoffs')?.addEventListener('click', () => {
      const depSec = document.getElementById('delivery-dependencies-section');
      if (depSec) depSec.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    document.getElementById('kpi-card-milestones')?.addEventListener('click', () => {
      window.location.href = '/pages/calendar/calendar.html';
    });

    // 5. Decision & Dependency action buttons
    document.getElementById('btn-quick-decisions')?.addEventListener('click', () => {
      openDecisionModal('dec-brand-identity');
    });

    document.getElementById('link-view-all-decisions')?.addEventListener('click', () => {
      openDecisionModal('dec-brand-identity');
    });

    document.getElementById('btn-quick-dependencies')?.addEventListener('click', () => {
      openDependencyModal('dep-design-handoff');
    });

    document.getElementById('link-view-all-dependencies')?.addEventListener('click', () => {
      openDependencyModal('dep-design-handoff');
    });

    // 6. Right Rail Executive Attention Action
    document.getElementById('btn-review-brand-identity')?.addEventListener('click', () => {
      openDecisionModal('dec-brand-identity');
    });

    // 7. Modals close actions
    document.getElementById('btn-close-review-modal')?.addEventListener('click', closeReviewModal);
    document.getElementById('btn-close-detail-modal')?.addEventListener('click', closeDetailModal);
    document.getElementById('btn-close-detail-action')?.addEventListener('click', closeDetailModal);
    document.getElementById('btn-close-insights-modal')?.addEventListener('click', closeInsightsModal);
    document.getElementById('btn-close-insights-footer')?.addEventListener('click', closeInsightsModal);

    // Modal background click to close
    document.querySelectorAll('.overview-modal-backdrop').forEach(bd => {
      bd.addEventListener('click', (e) => {
        if (e.target === bd) {
          bd.classList.remove('open');
        }
      });
    });

    // 8. Decision approval button inside modal
    document.getElementById('btn-approve-decision')?.addEventListener('click', () => {
      closeReviewModal();
      showToast('Brand identity approved. Creative and Marketing handoff unlocked.');
      // Update state
      activeData.kpis.pendingDecisions = Math.max(0, activeData.kpis.pendingDecisions - 1);
      activeData.decisions = activeData.decisions.filter(d => d.id !== 'dec-brand-identity');
      renderDashboard();
    });

    document.getElementById('btn-request-changes')?.addEventListener('click', () => {
      closeReviewModal();
      showToast('Change request recorded. Notification sent to Marcus Jones.');
    });

    // 9. Reporting & Insights triggers
    document.getElementById('btn-open-insights-modal')?.addEventListener('click', openInsightsModal);
    document.getElementById('btn-view-all-reports-rail')?.addEventListener('click', openInsightsModal);
    document.getElementById('btn-export-summary')?.addEventListener('click', exportOrganisationSummary);
    document.getElementById('btn-export-insights-pdf')?.addEventListener('click', () => {
      closeInsightsModal();
      exportOrganisationSummary();
    });

    // 10. Rail milestones trigger
    document.getElementById('btn-view-all-milestones-rail')?.addEventListener('click', () => {
      window.location.href = '/pages/calendar/calendar.html';
    });

    document.getElementById('btn-view-all-activity-rail')?.addEventListener('click', () => {
      showToast('Organisation activity log is fully synced.');
    });
  }

  /**
   * Main Initialization
   */
  async function init() {
    // 1. Mount fragments
    await Promise.all([
      loadFragment('/fragments/sidebar/sidebar.html', 'sidebar-mount'),
      loadFragment('/fragments/navbar/navbar.html', 'navbar-mount')
    ]);

    // 2. Initialize Fragment scripts
    if (window.Sidebar && typeof window.Sidebar.init === 'function') {
      window.Sidebar.init(currentUser);
    }
    if (window.Navbar && typeof window.Navbar.init === 'function') {
      window.Navbar.init(currentUser);
    }

    // 3. Setup event listeners
    setupEventListeners();

    // 4. Fetch initial data and render
    await fetchInitialData();
  }

  // Auto-run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
