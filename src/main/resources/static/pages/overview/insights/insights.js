/**
 * Teamden by shed — Insights Dashboard Page Controller (insights.js)
 * Path: pages/overview/insights/insights.js
 *
 * Implements complete interactive logic for Brick Insights Dashboard:
 * 1. Application Shell Integration: Sidebar (Overview highlighted in lime-green) & Topbar
 * 2. Real-time data hydration with dynamic seed store matching reference screenshot
 * 3. Interactive SVG Trendline Chart with smooth animations and hover tooltips
 * 4. Metric Switcher (MILESTONES / TASKS / PROJECTS)
 * 5. Period Filters (Last 7 days, Last 30 days, Last 90 days, Custom range)
 * 6. Team Filters (All teams, Design, Engineering, Marketing, Operations)
 * 7. Compare Periods toggle with visual delta pill indicators
 * 8. Performance Metric Cards with interactive breakdown inspection
 * 9. Decision Intelligence: Decision details modal with "Mark Resolved" workflow
 * 10. Collaboration Analysis: Interactive cross-team flow matrix
 * 11. Reporting Studio: Report generator workflow with PDF/CSV export downloads
 * 12. Quick Export: Immediate Executive Summary PDF/CSV download
 * 13. Late Milestones Inspector Drawer
 * 14. Real-time Search filtering across decisions, metrics, and reports
 * 15. Toast notifications for all user actions
 */

(function () {
  'use strict';

  // State Management
  let currentUser = null;
  let activeMetric = 'milestones'; // 'milestones' | 'tasks' | 'projects'
  let selectedRange = '30';       // '7' | '30' | '90' | 'custom'
  let selectedTeam = 'all';       // 'all' | 'Design' | 'Engineering' | 'Marketing' | 'Operations'
  let isComparing = false;        // compare periods toggled

  // Master Dataset strictly aligned with Reference Screenshot & Teamden Schema
  const INSIGHTS_DATA = {
    // Delivery Intelligence Datasets
    metrics: {
      milestones: {
        label: 'MILESTONES',
        heading: 'Delivery reliability.',
        periods: {
          '7': {
            rate: '83%',
            completedCount: '5 of 6 milestones',
            completedText: 'Completed on time',
            deltaText: '5% vs previous period',
            banner: 'One milestone required rescheduling during the past week.',
            points: [
              { label: 'Mon', val: 78 },
              { label: 'Tue', val: 80 },
              { label: 'Wed', val: 82 },
              { label: 'Thu', val: 85 },
              { label: 'Fri', val: 80 },
              { label: 'Sun', val: 83, active: true }
            ]
          },
          '30': {
            rate: '80%',
            completedCount: '12 of 15 milestones',
            completedText: 'Completed on time',
            deltaText: '8% vs previous period',
            banner: 'Three milestones were not completed on time in this reporting period.',
            points: [
              { label: 'May', val: 72 },
              { label: 'Jun', val: 76 },
              { label: 'Jul', val: 74 },
              { label: 'Aug', val: 83 },
              { label: 'Sep', val: 86 },
              { label: 'Oct', val: 80, active: true }
            ]
          },
          '90': {
            rate: '79%',
            completedCount: '38 of 48 milestones',
            completedText: 'Completed on time',
            deltaText: '11% vs previous quarter',
            banner: 'Ten milestones required deadline extensions across Q3 and Q4.',
            points: [
              { label: 'Aug W1', val: 74 },
              { label: 'Aug W3', val: 81 },
              { label: 'Sep W1', val: 84 },
              { label: 'Sep W3', val: 88 },
              { label: 'Oct W1', val: 82 },
              { label: 'Oct W4', val: 79, active: true }
            ]
          },
          'custom': {
            rate: '82%',
            completedCount: '23 of 28 milestones',
            completedText: 'Completed on time',
            deltaText: '7% vs custom baseline',
            banner: 'Custom period delivery reliability shows positive convergence.',
            points: [
              { label: 'T-5', val: 75 },
              { label: 'T-4', val: 79 },
              { label: 'T-3', val: 83 },
              { label: 'T-2', val: 85 },
              { label: 'T-1', val: 81 },
              { label: 'Now', val: 82, active: true }
            ]
          }
        }
      },
      tasks: {
        label: 'TASKS',
        heading: 'Task completion on time.',
        periods: {
          '7': {
            rate: '91%',
            completedCount: '41 of 45 tasks',
            completedText: 'Resolved without blocker',
            deltaText: '4% vs previous period',
            banner: 'Task velocity accelerated following sprint boundary sync.',
            points: [
              { label: 'Mon', val: 85 },
              { label: 'Tue', val: 88 },
              { label: 'Wed', val: 90 },
              { label: 'Thu', val: 92 },
              { label: 'Fri', val: 94 },
              { label: 'Sun', val: 91, active: true }
            ]
          },
          '30': {
            rate: '88%',
            completedCount: '142 of 161 tasks',
            completedText: 'Resolved on schedule',
            deltaText: '6% vs previous period',
            banner: 'Nineteen tasks experienced brief blocked durations in this reporting period.',
            points: [
              { label: 'May', val: 81 },
              { label: 'Jun', val: 84 },
              { label: 'Jul', val: 82 },
              { label: 'Aug', val: 89 },
              { label: 'Sep', val: 92 },
              { label: 'Oct', val: 88, active: true }
            ]
          },
          '90': {
            rate: '86%',
            completedCount: '412 of 479 tasks',
            completedText: 'Completed on schedule',
            deltaText: '9% vs previous quarter',
            banner: 'Overall task execution velocity remained above benchmark targets.',
            points: [
              { label: 'Aug W1', val: 80 },
              { label: 'Aug W3', val: 83 },
              { label: 'Sep W1', val: 87 },
              { label: 'Sep W3', val: 91 },
              { label: 'Oct W1', val: 89 },
              { label: 'Oct W4', val: 86, active: true }
            ]
          },
          'custom': {
            rate: '87%',
            completedCount: '194 of 223 tasks',
            completedText: 'Completed on schedule',
            deltaText: '5% vs custom baseline',
            banner: 'Consistent task throughput observed across custom window.',
            points: [
              { label: 'T-5', val: 82 },
              { label: 'T-4', val: 85 },
              { label: 'T-3', val: 88 },
              { label: 'T-2', val: 91 },
              { label: 'T-1', val: 89 },
              { label: 'Now', val: 87, active: true }
            ]
          }
        }
      },
      projects: {
        label: 'PROJECTS',
        heading: 'Project milestone health.',
        periods: {
          '7': {
            rate: '78%',
            completedCount: '7 of 9 projects',
            completedText: 'Currently on track',
            deltaText: '10% vs previous period',
            banner: 'Two projects are currently flagged with pending client approvals.',
            points: [
              { label: 'Mon', val: 72 },
              { label: 'Tue', val: 74 },
              { label: 'Wed', val: 76 },
              { label: 'Thu', val: 79 },
              { label: 'Fri', val: 78 },
              { label: 'Sun', val: 78, active: true }
            ]
          },
          '30': {
            rate: '75%',
            completedCount: '6 of 8 projects',
            completedText: 'Currently on track',
            deltaText: '12% vs previous period',
            banner: 'Brand Development and Client Application require cross-team resolution.',
            points: [
              { label: 'May', val: 68 },
              { label: 'Jun', val: 70 },
              { label: 'Jul', val: 75 },
              { label: 'Aug', val: 72 },
              { label: 'Sep', val: 78 },
              { label: 'Oct', val: 75, active: true }
            ]
          },
          '90': {
            rate: '73%',
            completedCount: '11 of 15 projects',
            completedText: 'Delivered or on track',
            deltaText: '14% vs previous quarter',
            banner: 'Quarterly roadmap delivery sustained steady performance.',
            points: [
              { label: 'Aug W1', val: 66 },
              { label: 'Aug W3', val: 69 },
              { label: 'Sep W1', val: 72 },
              { label: 'Sep W3', val: 76 },
              { label: 'Oct W1', val: 75 },
              { label: 'Oct W4', val: 73, active: true }
            ]
          },
          'custom': {
            rate: '76%',
            completedCount: '8 of 10 projects',
            completedText: 'Currently on track',
            deltaText: '8% vs custom baseline',
            banner: 'Custom period projects maintain healthy milestone velocity.',
            points: [
              { label: 'T-5', val: 69 },
              { label: 'T-4', val: 72 },
              { label: 'T-3', val: 75 },
              { label: 'T-2', val: 78 },
              { label: 'T-1', val: 76 },
              { label: 'Now', val: 76, active: true }
            ]
          }
        }
      }
    },

    // 3 Performance Metrics by Team & Range
    performance: {
      all: {
        turnaround: { val: '2.4d', delta: '18% vs previous period', change: '-18%' },
        blocked: { val: '1.8d', delta: '25% vs previous period', change: '-25%' },
        handoff: { val: '3.2d', delta: '20% vs previous period', change: '-20%' }
      },
      Design: {
        turnaround: { val: '1.9d', delta: '22% vs previous period', change: '-22%' },
        blocked: { val: '1.2d', delta: '30% vs previous period', change: '-30%' },
        handoff: { val: '1.6d', delta: '25% vs previous period', change: '-25%' }
      },
      Engineering: {
        turnaround: { val: '2.1d', delta: '15% vs previous period', change: '-15%' },
        blocked: { val: '2.4d', delta: '18% vs previous period', change: '-18%' },
        handoff: { val: '2.8d', delta: '16% vs previous period', change: '-16%' }
      },
      Marketing: {
        turnaround: { val: '1.8d', delta: '20% vs previous period', change: '-20%' },
        blocked: { val: '1.0d', delta: '35% vs previous period', change: '-35%' },
        handoff: { val: '2.2d', delta: '18% vs previous period', change: '-18%' }
      },
      Operations: {
        turnaround: { val: '2.9d', delta: '12% vs previous period', change: '-12%' },
        blocked: { val: '2.1d', delta: '14% vs previous period', change: '-14%' },
        handoff: { val: '3.5d', delta: '10% vs previous period', change: '-10%' }
      }
    },

    // Decisions Database (Where decisions slow down)
    decisions: [
      {
        id: 'dec-homepage',
        title: 'Homepage approval',
        project: 'Brand Development',
        team: 'Design',
        status: 'overdue',
        statusBadge: '2 days overdue',
        iconClass: 'circle-amber',
        owner: 'Marcus Jones',
        timeWaiting: '4.8 days (Median is 2.4d)',
        dateCreated: '24 Oct 2026',
        impact: 'Blocks Client Presentation deck handoff and staging deployment'
      },
      {
        id: 'dec-pricing',
        title: 'Pricing update',
        project: 'Client Application',
        team: 'Engineering',
        status: 'resolved',
        statusBadge: 'Resolved',
        iconClass: 'circle-green',
        owner: 'Elena Rostova',
        timeWaiting: '1.2 days',
        dateCreated: '20 Oct 2026',
        impact: 'Annual enterprise subscription tier launch'
      },
      {
        id: 'dec-brand-system',
        title: 'Design System 2.0 Tokens',
        project: 'Website Redesign',
        team: 'Design',
        status: 'awaiting',
        statusBadge: 'Awaiting decision',
        iconClass: 'circle-amber',
        owner: 'Sarah Chen',
        timeWaiting: '1.5 days',
        dateCreated: '28 Oct 2026',
        impact: 'Blocks unified CSS token deployment across mobile & web'
      },
      {
        id: 'dec-api-contract',
        title: 'GraphQL schema federation',
        project: 'Client Application',
        team: 'Engineering',
        status: 'overdue',
        statusBadge: '1 day overdue',
        iconClass: 'circle-amber',
        owner: 'David Kim',
        timeWaiting: '3.6 days',
        dateCreated: '27 Oct 2026',
        impact: 'Blocks mobile application sprint handoff'
      }
    ],

    // Collaboration Flow (How work moves)
    collaboration: {
      all: {
        from: 'Design',
        to: 'Engineering',
        title: 'Design handoffs',
        desc: 'Average 1.6 days to acceptance',
        fromPill: 'pill-lavender',
        toPill: 'pill-blue'
      },
      Design: {
        from: 'Design',
        to: 'Engineering',
        title: 'Design handoffs',
        desc: 'Average 1.6 days to acceptance',
        fromPill: 'pill-lavender',
        toPill: 'pill-blue'
      },
      Engineering: {
        from: 'Engineering',
        to: 'QA',
        title: 'Engineering handoffs',
        desc: 'Average 2.1 days to acceptance',
        fromPill: 'pill-blue',
        toPill: 'pill-green'
      },
      Marketing: {
        from: 'Content',
        to: 'Design',
        title: 'Content handoffs',
        desc: 'Average 1.2 days to acceptance',
        fromPill: 'pill-peach',
        toPill: 'pill-lavender'
      },
      Operations: {
        from: 'Operations',
        to: 'All teams',
        title: 'Operational handoffs',
        desc: 'Average 1.9 days to acceptance',
        fromPill: 'pill-blue',
        toPill: 'pill-green'
      }
    },

    // Late Milestones Breakdown (For Bottom Banner Details Modal)
    lateMilestones: [
      {
        title: 'Client Deck Approval',
        project: 'Brand Development',
        team: 'Creative & Marketing',
        overdueDays: '2 days overdue',
        reason: 'Waiting on executive sign-off from client steering committee.'
      },
      {
        title: 'Design System 2.0 Tokens',
        project: 'Website Redesign',
        team: 'Design',
        overdueDays: '1 day overdue',
        reason: 'Accessibility contrast audits required token refinement.'
      },
      {
        title: 'API Gateway Migration',
        project: 'Client Application',
        team: 'Engineering',
        overdueDays: '3 days overdue',
        reason: 'Security key rotation dependency in staging cluster.'
      }
    ],

    // Key Insights Panel
    keyInsights: [
      {
        dotClass: 'dot-green',
        title: 'Delivery reliability improved',
        delta: '(+8% vs previous period)',
        targetSection: 'delivery-intelligence-card'
      },
      {
        dotClass: 'dot-purple',
        title: 'Decision turnaround reduced',
        delta: '(-18% vs previous period)',
        targetSection: 'perf-card-decisions'
      },
      {
        dotClass: 'dot-blue',
        title: 'More work in Engineering',
        delta: '(+12% vs previous period)',
        targetSection: 'collaboration-analysis-section'
      }
    ]
  };

  /* ==========================================================================
     INITIALIZATION & LIFECYCLE
     ========================================================================== */
  document.addEventListener('DOMContentLoaded', initInsights);

  async function initInsights() {
    initShellComponents();
    initFilters();
    initMetricSwitcher();
    initLineChartInteractions();
    initPerformanceCards();
    initDecisionsSection();
    initCollaborationSection();
    initReportingStudio();
    initQuickExport();
    initKeyInsightsPanel();
    initGlobalSearch();
    initModals();

    // Hydrate user and attempt remote server fetch
    await hydrateUserData();

    // Initial render
    renderDashboard();
  }

  /* ==========================================================================
     SHELL INTEGRATION (SIDEBAR & TOPBAR)
     ========================================================================== */
  function initShellComponents() {
    // Initialize external fragments if loaded
    if (window.Sidebar && typeof window.Sidebar.init === 'function') {
      window.Sidebar.init();
    }
    if (window.Navbar && typeof window.Navbar.init === 'function') {
      window.Navbar.init();
    }

    // Ensure 06 Overview is highlighted in sidebar
    const navOverview = document.getElementById('nav-overview');
    if (navOverview) {
      document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => item.classList.remove('active'));
      navOverview.classList.add('active');
    }

    // Sidebar collapse toggle
    const collapseBtn = document.getElementById('sidebar-collapse-btn');
    const sidebar = document.getElementById('app-sidebar');
    if (collapseBtn && sidebar) {
      collapseBtn.addEventListener('click', () => {
        const isCollapsed = sidebar.classList.toggle('collapsed');
        document.body.classList.toggle('sidebar-is-collapsed', isCollapsed);
      });
    }

    // Mobile sidebar toggle
    const mobileToggle = document.getElementById('mobile-sidebar-toggle');
    if (mobileToggle && sidebar) {
      mobileToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('mobile-open');
      });
      document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !mobileToggle.contains(e.target)) {
          sidebar.classList.remove('mobile-open');
        }
      });
    }

    // Topbar Create Dropdown
    const createBtn = document.getElementById('btn-create-pill');
    const createMenu = document.getElementById('create-menu');
    if (createBtn && createMenu) {
      createBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = createMenu.classList.toggle('open');
        createBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
      document.addEventListener('click', () => {
        createMenu.classList.remove('open');
        createBtn.setAttribute('aria-expanded', 'false');
      });
    }

    // Notifications toggle
    const notifBtn = document.getElementById('notification-btn');
    if (notifBtn) {
      notifBtn.addEventListener('click', () => {
        showToast('You have 2 pending approval alerts for Review.');
        const redDot = notifBtn.querySelector('.bell-red-dot');
        if (redDot) redDot.style.display = 'none';
      });
    }

    // Keyboard shortcut Cmd+K / Ctrl+K
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) searchInput.focus();
      }
      if (e.key === 'Escape') {
        closeAllModals();
      }
    });
  }

  /* ==========================================================================
     USER & AUTH HYDRATION
     ========================================================================== */
  async function hydrateUserData() {
    try {
      if (window.Auth && typeof window.Auth.getCurrentUser === 'function') {
        currentUser = await window.Auth.getCurrentUser();
      }
      if (currentUser && currentUser.name) {
        const initials = currentUser.name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
        const avatarEl = document.getElementById('topbar-user-avatar');
        if (avatarEl) avatarEl.textContent = initials || 'PB';
      }
    } catch (e) {
      console.warn('Auth hydrate optional:', e);
    }

    // Attempt fetching live projects data to enrich metrics
    try {
      const res = await fetch('/api/projects/data');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.projects)) {
          console.log('Hydrated live projects data count:', data.projects.length);
        }
      }
    } catch (err) {
      // Graceful fallback to rich built-in seed dataset
    }
  }

  /* ==========================================================================
     FILTERS CONTROLLER (DATE RANGE, TEAMS, COMPARE PERIODS)
     ========================================================================== */
  function initFilters() {
    // 1. Date Range Dropdown
    const dateBtn = document.getElementById('date-filter-btn');
    const dateMenu = document.getElementById('date-filter-menu');
    const dateLabel = document.getElementById('date-filter-label');

    if (dateBtn && dateMenu) {
      dateBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllDropdowns(dateMenu);
        const isOpen = dateMenu.classList.toggle('open');
        dateBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });

      dateMenu.querySelectorAll('.filter-option').forEach(option => {
        option.addEventListener('click', () => {
          dateMenu.querySelectorAll('.filter-option').forEach(o => o.classList.remove('selected'));
          option.classList.add('selected');
          selectedRange = option.getAttribute('data-range') || '30';
          if (dateLabel) dateLabel.textContent = option.textContent.trim();
          dateMenu.classList.remove('open');
          dateBtn.setAttribute('aria-expanded', 'false');

          renderDashboard();
          showToast(`Reporting window updated: ${option.textContent.trim()}`);
        });
      });
    }

    // 2. Team Filter Dropdown
    const teamBtn = document.getElementById('team-filter-btn');
    const teamMenu = document.getElementById('team-filter-menu');
    const teamLabel = document.getElementById('team-filter-label');

    if (teamBtn && teamMenu) {
      teamBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllDropdowns(teamMenu);
        const isOpen = teamMenu.classList.toggle('open');
        teamBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });

      teamMenu.querySelectorAll('.filter-option').forEach(option => {
        option.addEventListener('click', () => {
          teamMenu.querySelectorAll('.filter-option').forEach(o => o.classList.remove('selected'));
          option.classList.add('selected');
          selectedTeam = option.getAttribute('data-team') || 'all';
          if (teamLabel) teamLabel.textContent = option.textContent.trim();
          teamMenu.classList.remove('open');
          teamBtn.setAttribute('aria-expanded', 'false');

          renderDashboard();
          showToast(`Filtered by team: ${option.textContent.trim()}`);
        });
      });
    }

    // 3. Compare Periods Toggle Button
    const compareBtn = document.getElementById('btn-compare-periods');
    if (compareBtn) {
      compareBtn.addEventListener('click', () => {
        isComparing = !isComparing;
        compareBtn.classList.toggle('active', isComparing);
        compareBtn.setAttribute('aria-pressed', isComparing ? 'true' : 'false');

        // Toggle deltas display
        document.querySelectorAll('.perf-metric-delta').forEach(deltaEl => {
          if (isComparing) {
            deltaEl.style.display = 'inline-flex';
            deltaEl.classList.add('delta-highlight');
          } else {
            deltaEl.classList.remove('delta-highlight');
          }
        });

        renderDashboard();
        showToast(isComparing ? 'Comparison mode enabled: Showing variance against previous cycle.' : 'Comparison mode disabled.');
      });
    }

    // Close menus on outside click
    document.addEventListener('click', () => closeAllDropdowns());
  }

  function closeAllDropdowns(except = null) {
    const menus = [
      document.getElementById('date-filter-menu'),
      document.getElementById('team-filter-menu'),
      document.getElementById('chart-selector-menu')
    ];
    menus.forEach(m => {
      if (m && m !== except) m.classList.remove('open');
    });
    const triggers = [
      document.getElementById('date-filter-btn'),
      document.getElementById('team-filter-btn'),
      document.getElementById('chart-selector-btn')
    ];
    triggers.forEach(t => {
      if (t) t.setAttribute('aria-expanded', 'false');
    });
  }

  /* ==========================================================================
     METRIC SWITCHER (MILESTONES / TASKS / PROJECTS)
     ========================================================================== */
  function initMetricSwitcher() {
    const selectorBtn = document.getElementById('chart-selector-btn');
    const selectorMenu = document.getElementById('chart-selector-menu');
    const selectorLabel = document.getElementById('chart-selector-label');

    if (selectorBtn && selectorMenu) {
      selectorBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllDropdowns(selectorMenu);
        const isOpen = selectorMenu.classList.toggle('open');
        selectorBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });

      selectorMenu.querySelectorAll('.chart-selector-option').forEach(option => {
        option.addEventListener('click', () => {
          selectorMenu.querySelectorAll('.chart-selector-option').forEach(o => o.classList.remove('selected'));
          option.classList.add('selected');
          activeMetric = option.getAttribute('data-metric') || 'milestones';
          if (selectorLabel) selectorLabel.textContent = option.textContent.trim();
          selectorMenu.classList.remove('open');
          selectorBtn.setAttribute('aria-expanded', 'false');

          renderDeliveryIntelligence();
          showToast(`Viewing delivery intelligence by ${option.textContent.trim().toLowerCase()}`);
        });
      });
    }
  }

  /* ==========================================================================
     LINE CHART & TOOLTIP INTERACTIONS
     ========================================================================== */
  function initLineChartInteractions() {
    const chartSvg = document.getElementById('intel-line-chart');
    const tooltip = document.getElementById('chart-tooltip');

    if (!chartSvg || !tooltip) return;

    // Attach delegated hover listeners on data point circles
    chartSvg.addEventListener('mouseover', (e) => {
      const dot = e.target.closest('.chart-dot');
      if (dot) {
        const month = dot.getAttribute('data-month') || '';
        const val = dot.getAttribute('data-val') || '';
        const rect = dot.getBoundingClientRect();
        const containerRect = chartSvg.parentElement.getBoundingClientRect();

        tooltip.innerHTML = `<strong>${month}</strong>: ${val} on-time reliability`;
        tooltip.style.left = `${rect.left - containerRect.left + (rect.width / 2)}px`;
        tooltip.style.top = `${rect.top - containerRect.top - 36}px`;
        tooltip.classList.add('visible');

        dot.setAttribute('r', '7');
      }
    });

    chartSvg.addEventListener('mouseout', (e) => {
      const dot = e.target.closest('.chart-dot');
      if (dot) {
        const isActive = dot.classList.contains('chart-dot-active');
        dot.setAttribute('r', isActive ? '5.5' : '4.5');
        tooltip.classList.remove('visible');
      }
    });
  }

  /* ==========================================================================
     RENDER PRIMARY DELIVERY INTELLIGENCE CARD & CHART
     ========================================================================== */
  function renderDeliveryIntelligence() {
    const metricConfig = INSIGHTS_DATA.metrics[activeMetric] || INSIGHTS_DATA.metrics.milestones;
    const periodData = metricConfig.periods[selectedRange] || metricConfig.periods['30'];

    // 1. Update text & numbers
    const rateNumberEl = document.getElementById('intel-rate-number');
    const countEl = document.getElementById('intel-completed-count');
    const bannerMsgEl = document.getElementById('intel-banner-message');

    if (rateNumberEl) rateNumberEl.textContent = periodData.rate;
    if (countEl) countEl.textContent = periodData.completedCount;
    const labelEl = document.getElementById('intel-completed-label');
    if (labelEl) labelEl.textContent = periodData.completedText;
    if (bannerMsgEl) {
      bannerMsgEl.textContent = periodData.banner;
    }

    // 2. Recompute SVG line chart path, points, and labels dynamically
    renderSvgLineChart(periodData.points);
  }

  function renderSvgLineChart(points) {
    if (!points || !points.length) return;

    const pointsGroup = document.getElementById('chart-points-group');
    const linePath = document.getElementById('chart-line-path');
    const areaPath = document.getElementById('chart-area-path');

    if (!pointsGroup || !linePath || !areaPath) return;

    // Canvas bounds: x: 60 to 500, y: 20 (100%) to 172 (0%)
    const xStart = 60;
    const xEnd = 500;
    const yTop = 20;
    const yBottom = 172;
    const yRange = yBottom - yTop; // 152 px

    const count = points.length;
    const xStep = count > 1 ? (xEnd - xStart) / (count - 1) : 0;

    let pathCommands = [];
    let areaCommands = [`M ${xStart} ${yBottom}`];
    let groupHtml = '';

    points.forEach((pt, idx) => {
      const x = Math.round(xStart + (idx * xStep));
      // Invert Y: 100% is yTop (20), 0% is yBottom (172)
      const ratio = Math.max(0, Math.min(100, pt.val)) / 100;
      const y = Math.round(yBottom - (ratio * yRange));

      if (idx === 0) {
        pathCommands.push(`M ${x} ${y}`);
        areaCommands.push(`L ${x} ${y}`);
      } else {
        pathCommands.push(`L ${x} ${y}`);
        areaCommands.push(`L ${x} ${y}`);
      }

      const isActive = !!pt.active;
      const dotRadius = isActive ? 5.5 : 4.5;
      const dotClass = isActive ? 'chart-dot chart-dot-active' : 'chart-dot';
      const axisClass = isActive ? 'chart-axis-lbl chart-axis-active' : 'chart-axis-lbl';

      // SVG Elements for this point
      groupHtml += `<circle cx="${x}" cy="${y}" r="${dotRadius}" class="${dotClass}" data-month="${pt.label}" data-val="${pt.val}%"></circle>`;

      if (isActive) {
        // Render purple badge for active point
        groupHtml += `
          <rect x="${x - 20}" y="${y - 20}" width="40" height="18" rx="9" fill="#7C3AED"></rect>
          <text x="${x}" y="${y - 7}" text-anchor="middle" class="chart-badge-text">${pt.val}%</text>
        `;
      } else {
        groupHtml += `<text x="${x}" y="${y - 14}" text-anchor="middle" class="chart-val-lbl">${pt.val}%</text>`;
      }

      groupHtml += `<text x="${x}" y="190" text-anchor="middle" class="${axisClass}">${pt.label}</text>`;
    });

    areaCommands.push(`L ${xEnd} ${yBottom} Z`);

    // Animate path update
    linePath.setAttribute('d', pathCommands.join(' '));
    areaPath.setAttribute('d', areaCommands.join(' '));
    pointsGroup.innerHTML = groupHtml;
  }

  /* ==========================================================================
     RENDER PERFORMANCE METRIC CARDS (BEIGE, BLUE, LAVENDER)
     ========================================================================== */
  function renderPerformanceMetrics() {
    const teamMetrics = INSIGHTS_DATA.performance[selectedTeam] || INSIGHTS_DATA.performance.all;

    // Turnaround
    const turnVal = document.getElementById('metric-turnaround-val');
    const turnDelta = document.getElementById('metric-turnaround-delta');
    if (turnVal) turnVal.textContent = teamMetrics.turnaround.val;
    if (turnDelta) turnDelta.textContent = teamMetrics.turnaround.delta;

    // Blocked
    const blockVal = document.getElementById('metric-blocked-val');
    const blockDelta = document.getElementById('metric-blocked-delta');
    if (blockVal) blockVal.textContent = teamMetrics.blocked.val;
    if (blockDelta) blockDelta.textContent = teamMetrics.blocked.delta;

    // Handoff
    const handVal = document.getElementById('metric-handoff-val');
    const handDelta = document.getElementById('metric-handoff-delta');
    if (handVal) handVal.textContent = teamMetrics.handoff.val;
    if (handDelta) handDelta.textContent = teamMetrics.handoff.delta;
  }

  /* ==========================================================================
     PERFORMANCE METRIC CARDS CLICK INTERACTIONS
     ========================================================================== */
  function initPerformanceCards() {
    // 1. Decisions Turnaround Card
    const cardDecisions = document.getElementById('perf-card-decisions');
    if (cardDecisions) {
      cardDecisions.addEventListener('click', () => {
        openDecisionModal('dec-homepage');
      });
      cardDecisions.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') openDecisionModal('dec-homepage');
      });
    }

    // 2. Blocked Duration Card
    const cardBlockers = document.getElementById('perf-card-blockers');
    if (cardBlockers) {
      cardBlockers.addEventListener('click', () => {
        openMilestonesModal();
      });
      cardBlockers.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') openMilestonesModal();
      });
    }

    // 3. Handoff Acceptance Card
    const cardHandoffs = document.getElementById('perf-card-handoffs');
    if (cardHandoffs) {
      cardHandoffs.addEventListener('click', () => {
        openCollabModal();
      });
      cardHandoffs.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') openCollabModal();
      });
    }
  }

  /* ==========================================================================
     DECISION INTELLIGENCE (WHERE DECISIONS SLOW DOWN)
     ========================================================================== */
  function initDecisionsSection() {
    const listEl = document.getElementById('decision-slowdown-list');
    if (listEl) {
      listEl.addEventListener('click', (e) => {
        const item = e.target.closest('.slowdown-row-item');
        if (item) {
          const decId = item.getAttribute('data-id') || 'dec-homepage';
          openDecisionModal(decId);
        }
      });
    }

    const viewAllBtn = document.getElementById('btn-view-all-decisions');
    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', () => {
        showToast('Displaying all 4 organizational decisions.');
        renderDecisions(true);
      });
    }
  }

  function renderDecisions(showAll = false) {
    const listEl = document.getElementById('decision-slowdown-list');
    if (!listEl) return;

    let items = INSIGHTS_DATA.decisions;
    if (selectedTeam !== 'all') {
      items = items.filter(d => d.team === selectedTeam);
    }
    if (!showAll && items.length > 2) {
      items = items.slice(0, 2);
    }

    if (items.length === 0) {
      listEl.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--text-tertiary); font-size: 13px;">
          No pending decision bottlenecks recorded for ${selectedTeam}.
        </div>
      `;
      return;
    }

    listEl.innerHTML = items.map(dec => `
      <div class="slowdown-row-item" data-id="${dec.id}" role="button" tabindex="0">
        <div class="row-left-group">
          <div class="row-icon-circle ${dec.iconClass}">
            ${dec.status === 'resolved' 
              ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`
              : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`}
          </div>
          <div class="row-text-meta">
            <span class="row-main-title">${escapeHtml(dec.title)}</span>
            <span class="row-sub-meta">${escapeHtml(dec.project)} · ${escapeHtml(dec.statusBadge)}</span>
          </div>
        </div>
        <svg class="row-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </div>
    `).join('');
  }

  function openDecisionModal(decisionId) {
    const modal = document.getElementById('modal-decision-backdrop');
    const dec = INSIGHTS_DATA.decisions.find(d => d.id === decisionId) || INSIGHTS_DATA.decisions[0];
    if (!modal || !dec) return;

    const headingEl = document.getElementById('modal-decision-heading');
    const bodyEl = document.getElementById('modal-decision-body');
    const resolveBtn = document.getElementById('btn-resolve-decision-action');

    if (headingEl) headingEl.textContent = dec.title;
    if (bodyEl) {
      bodyEl.innerHTML = `
        <h2 class="modal-heading-large" id="modal-decision-heading">${escapeHtml(dec.title)}</h2>
        <p class="modal-lead-text">Decision awaiting review in ${escapeHtml(dec.project)}. Status: ${escapeHtml(dec.statusBadge)}.</p>

        <div class="modal-meta-box">
          <div class="meta-row"><span class="meta-lbl">Project</span><span class="meta-val">${escapeHtml(dec.project)}</span></div>
          <div class="meta-row"><span class="meta-lbl">Responsible Team</span><span class="meta-val">${escapeHtml(dec.team)}</span></div>
          <div class="meta-row"><span class="meta-lbl">Time Waiting</span><span class="meta-val text-amber">${escapeHtml(dec.timeWaiting)}</span></div>
          <div class="meta-row"><span class="meta-lbl">Decision Owner</span><span class="meta-val">${escapeHtml(dec.owner)}</span></div>
          <div class="meta-row"><span class="meta-lbl">Date Created</span><span class="meta-val">${escapeHtml(dec.dateCreated)}</span></div>
          <div class="meta-row"><span class="meta-lbl">Impact</span><span class="meta-val">${escapeHtml(dec.impact)}</span></div>
        </div>
      `;
    }

    if (resolveBtn) {
      if (dec.status === 'resolved') {
        resolveBtn.textContent = 'Already Resolved';
        resolveBtn.disabled = true;
      } else {
        resolveBtn.textContent = 'Mark Resolved';
        resolveBtn.disabled = false;
        resolveBtn.onclick = () => {
          dec.status = 'resolved';
          dec.statusBadge = 'Resolved';
          dec.iconClass = 'circle-green';
          renderDecisions();
          closeModal(modal);
          showToast(`Decision '${dec.title}' marked as resolved.`);
        };
      }
    }

    openModal(modal);
  }

  /* ==========================================================================
     COLLABORATION ANALYSIS (HOW WORK MOVES)
     ========================================================================== */
  function initCollaborationSection() {
    const cardEl = document.getElementById('btn-open-collab-details');
    if (cardEl) {
      cardEl.addEventListener('click', openCollabModal);
      cardEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') openCollabModal();
      });
    }

    const viewCollabBtn = document.getElementById('btn-view-all-collab');
    if (viewCollabBtn) {
      viewCollabBtn.addEventListener('click', openCollabModal);
    }
  }

  function renderCollaboration() {
    const collabConfig = INSIGHTS_DATA.collaboration[selectedTeam] || INSIGHTS_DATA.collaboration.all;
    const cardEl = document.getElementById('btn-open-collab-details');
    if (!cardEl) return;

    cardEl.innerHTML = `
      <div class="collab-flow-pill-row">
        <div class="team-flow-pill ${collabConfig.fromPill}">${escapeHtml(collabConfig.from)}</div>
        <svg class="team-flow-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
        <div class="team-flow-pill ${collabConfig.toPill}">${escapeHtml(collabConfig.to)}</div>
      </div>

      <div class="collab-metric-footer">
        <div class="collab-footer-text">
          <span class="collab-title">${escapeHtml(collabConfig.title)}</span>
          <span class="collab-desc">${escapeHtml(collabConfig.desc)}</span>
        </div>
        <svg class="collab-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </div>
    `;
  }

  function openCollabModal() {
    const modal = document.getElementById('modal-collab-backdrop');
    if (modal) openModal(modal);
  }

  /* ==========================================================================
     LATE MILESTONES BANNER DETAILS
     ========================================================================== */
  function initLateMilestonesBanner() {
    const btn = document.getElementById('btn-view-milestone-details');
    if (btn) {
      btn.addEventListener('click', openMilestonesModal);
    }
  }

  function openMilestonesModal() {
    let modal = document.getElementById('modal-milestones-backdrop');
    if (!modal) {
      // Create dynamically if not in DOM
      modal = document.createElement('div');
      modal.className = 'insights-modal-backdrop';
      modal.id = 'modal-milestones-backdrop';
      modal.innerHTML = `
        <div class="insights-modal-dialog" role="dialog" aria-modal="true">
          <div class="modal-dialog-header">
            <div class="modal-eyebrow">DELIVERY INTELLIGENCE · LATE MILESTONES</div>
            <button class="modal-close-btn" id="btn-close-milestones-modal" aria-label="Close dialog">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div class="modal-dialog-body">
            <h2 class="modal-heading-large">Milestones Requiring Attention</h2>
            <p class="modal-lead-text">3 of 15 milestones missed scheduled target dates during the selected 30-day reporting window.</p>
            <div class="collab-matrix-list" id="late-milestones-list-container"></div>
          </div>
          <div class="modal-dialog-footer">
            <button class="btn-primary-action" id="btn-close-milestones-footer" type="button">Understood</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector('#btn-close-milestones-modal').addEventListener('click', () => closeModal(modal));
      modal.querySelector('#btn-close-milestones-footer').addEventListener('click', () => closeModal(modal));
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
      });
    }

    const listContainer = modal.querySelector('#late-milestones-list-container');
    if (listContainer) {
      listContainer.innerHTML = INSIGHTS_DATA.lateMilestones.map(m => `
        <div class="matrix-flow-row" style="flex-direction:column; align-items:flex-start; gap:8px;">
          <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
            <strong>${escapeHtml(m.title)}</strong>
            <span class="flow-badge badge-warning">${escapeHtml(m.overdueDays)}</span>
          </div>
          <div style="font-size:12px; color:var(--text-secondary);">Project: ${escapeHtml(m.project)} · Team: ${escapeHtml(m.team)}</div>
          <div style="font-size:12px; color:var(--text-muted); line-height:1.4;">${escapeHtml(m.reason)}</div>
        </div>
      `).join('');
    }

    openModal(modal);
  }

  /* ==========================================================================
     REPORTING STUDIO & MODAL WORKFLOW
     ========================================================================== */
  function initReportingStudio() {
    const createReportBtn = document.getElementById('btn-open-create-report');
    const reportModal = document.getElementById('modal-report-backdrop');
    const generateBtn = document.getElementById('btn-generate-report-action');

    if (createReportBtn && reportModal) {
      createReportBtn.addEventListener('click', () => {
        openModal(reportModal);
      });
    }

    if (generateBtn && reportModal) {
      generateBtn.addEventListener('click', () => {
        const titleInput = document.getElementById('report-title-input');
        const periodSelect = document.getElementById('report-period-select');
        const formatSelect = document.getElementById('report-format-select');

        const title = titleInput ? titleInput.value.trim() : 'Executive Delivery & Decision Intelligence Report';
        const format = formatSelect ? formatSelect.value : 'pdf';
        const period = periodSelect ? periodSelect.options[periodSelect.selectedIndex].text : 'Last 30 days';

        generateAndDownloadReport(title, format, period);
        closeModal(reportModal);
      });
    }

    // Saved Reports interactions
    const savedReportsList = document.getElementById('saved-reports-list');
    if (savedReportsList) {
      savedReportsList.querySelectorAll('.exec-rail-item').forEach(item => {
        item.addEventListener('click', () => {
          const reportName = item.getAttribute('data-report') || 'Executive Report';
          generateAndDownloadReport(reportName, 'pdf', 'Last 30 days');
        });
      });
    }

    const viewAllReportsBtn = document.getElementById('btn-view-all-reports');
    if (viewAllReportsBtn) {
      viewAllReportsBtn.addEventListener('click', () => {
        showToast('All 12 archived organizational reports are ready for export.');
      });
    }
  }

  function generateAndDownloadReport(title, format, period) {
    showToast(`Generating ${format.toUpperCase()} report: "${title}"...`);

    const deliveryRate = document.getElementById('intel-rate-number')?.textContent || '80%';
    const turnaround = document.getElementById('metric-turnaround-val')?.textContent || '2.4d';
    const blocked = document.getElementById('metric-blocked-val')?.textContent || '1.8d';
    const handoff = document.getElementById('metric-handoff-val')?.textContent || '3.2d';

    if (format === 'csv') {
      const csvContent = [
        ['Teamden / Brick Executive Analytics Report'],
        ['Report Title', title],
        ['Period', period],
        ['Generated Date', new Date().toISOString().split('T')[0]],
        [''],
        ['Metric', 'Value', 'Benchmark Target'],
        ['Delivery Reliability', deliveryRate, '85%'],
        ['Median Decision Turnaround', turnaround, '2.0d'],
        ['Median Blocked Duration', blocked, '1.5d'],
        ['Median Handoff Acceptance', handoff, '2.5d'],
        [''],
        ['Bottlenecks & Overdue Decisions'],
        ['Homepage approval', 'Brand Development', '2 days overdue', 'Owner: Marcus Jones'],
        ['Pricing update', 'Client Application', 'Resolved', 'Owner: Elena Rostova']
      ].map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n');

      downloadFile(csvContent, `${title.toLowerCase().replace(/\s+/g, '_')}.csv`, 'text/csv');
      showToast(`Downloaded CSV: ${title}.csv`);
    } else {
      // Formatted HTML printable document for PDF export
      const htmlDoc = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${escapeHtml(title)}</title>
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; background: #FAF8F5; color: #111; padding: 48px; max-width: 800px; margin: 0 auto; }
            h1 { font-size: 32px; font-weight: 900; letter-spacing: -0.04em; margin-bottom: 8px; }
            .eyebrow { font-size: 11px; font-weight: 800; letter-spacing: 0.12em; color: #777; margin-bottom: 16px; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 32px 0; }
            .card { background: #fff; padding: 20px; border-radius: 12px; border: 1px solid rgba(0,0,0,0.08); }
            .val { font-size: 28px; font-weight: 800; margin-top: 8px; }
            .banner { background: #EFF6EE; border: 1px solid #C8E6C9; padding: 16px; border-radius: 8px; font-size: 13px; font-weight: 600; color: #2E7D32; }
          </style>
        </head>
        <body>
          <div class="eyebrow">ORGANISATION / EXECUTIVE INTELLIGENCE REPORT</div>
          <h1>${escapeHtml(title)}</h1>
          <p style="color:#666;">Generated on ${new Date().toLocaleDateString()} · Reporting period: ${escapeHtml(period)}</p>
          <div class="banner">Delivery Reliability: ${deliveryRate} on-time milestone execution rate.</div>
          <div class="grid">
            <div class="card" style="background:#FFF0E6;"><strong>Decision Turnaround</strong><div class="val">${turnaround}</div></div>
            <div class="card" style="background:#E1F0FE;"><strong>Blocked Duration</strong><div class="val">${blocked}</div></div>
            <div class="card" style="background:#EAE6FD;"><strong>Handoff Acceptance</strong><div class="val">${handoff}</div></div>
          </div>
          <h3>Active Decisions & Handoffs</h3>
          <p>• Homepage approval (Brand Development) · 2 days overdue</p>
          <p>• Pricing update (Client Application) · Resolved</p>
        </body>
        </html>
      `;
      downloadFile(htmlDoc, `${title.toLowerCase().replace(/\s+/g, '_')}.html`, 'text/html');
      showToast(`Exported report: ${title}.html (Ready to print to PDF)`);
    }
  }

  function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  /* ==========================================================================
     QUICK EXPORT (EXECUTIVE SUMMARY PDF)
     ========================================================================== */
  function initQuickExport() {
    const quickExportBtn = document.getElementById('btn-quick-export-summary');
    if (quickExportBtn) {
      quickExportBtn.addEventListener('click', () => {
        generateAndDownloadReport('Executive Summary - Organization Insights', 'pdf', 'Last 30 days');
      });
      quickExportBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          generateAndDownloadReport('Executive Summary - Organization Insights', 'pdf', 'Last 30 days');
        }
      });
    }
  }

  /* ==========================================================================
     KEY INSIGHTS PANEL ("What's changed?")
     ========================================================================== */
  function initKeyInsightsPanel() {
    const listEl = document.getElementById('key-insights-list');
    if (listEl) {
      listEl.querySelectorAll('.key-insight-bullet').forEach((bullet, idx) => {
        bullet.addEventListener('click', () => {
          const insight = INSIGHTS_DATA.keyInsights[idx];
          if (insight && insight.targetSection) {
            const targetEl = document.getElementById(insight.targetSection);
            if (targetEl) {
              targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              targetEl.classList.add('section-highlight');
              setTimeout(() => targetEl.classList.remove('section-highlight'), 1800);
            }
          }
        });
      });
    }

    const viewAnalysisBtn = document.getElementById('btn-view-detailed-analysis');
    if (viewAnalysisBtn) {
      viewAnalysisBtn.addEventListener('click', openCollabModal);
    }
  }

  /* ==========================================================================
     GLOBAL SEARCH FILTER
     ========================================================================== */
  function initGlobalSearch() {
    const searchInput = document.getElementById('global-search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase().trim();
      const rows = document.querySelectorAll('.slowdown-row-item');

      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (!q || text.includes(q)) {
          row.style.display = 'flex';
        } else {
          row.style.display = 'none';
        }
      });
    });
  }

  /* ==========================================================================
     MODALS UTILITIES
     ========================================================================== */
  function initModals() {
    // Report Modal Close Buttons
    document.getElementById('btn-close-report-modal')?.addEventListener('click', () => {
      closeModal(document.getElementById('modal-report-backdrop'));
    });
    document.getElementById('btn-cancel-report-modal')?.addEventListener('click', () => {
      closeModal(document.getElementById('modal-report-backdrop'));
    });

    // Decision Modal Close Buttons
    document.getElementById('btn-close-decision-modal')?.addEventListener('click', () => {
      closeModal(document.getElementById('modal-decision-backdrop'));
    });
    document.getElementById('btn-dismiss-decision-modal')?.addEventListener('click', () => {
      closeModal(document.getElementById('modal-decision-backdrop'));
    });

    // Collaboration Modal Close Buttons
    document.getElementById('btn-close-collab-modal')?.addEventListener('click', () => {
      closeModal(document.getElementById('modal-collab-backdrop'));
    });
    document.getElementById('btn-close-collab-footer')?.addEventListener('click', () => {
      closeModal(document.getElementById('modal-collab-backdrop'));
    });

    // Backdrop click to close
    document.querySelectorAll('.insights-modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
      });
    });

    initLateMilestonesBanner();
  }

  function openModal(modal) {
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function closeAllModals() {
    document.querySelectorAll('.insights-modal-backdrop').forEach(m => closeModal(m));
  }

  /* ==========================================================================
     MASTER RENDER DISPATCHER
     ========================================================================== */
  function renderDashboard() {
    renderDeliveryIntelligence();
    renderPerformanceMetrics();
    renderDecisions();
    renderCollaboration();
  }

  /* ==========================================================================
     TOAST NOTIFICATIONS
     ========================================================================== */
  function showToast(message, type = 'info') {
    const container = document.getElementById('insights-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `insights-toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));

    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
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

})();
