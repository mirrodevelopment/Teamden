/**
 * Teamden by shed — Recent Activity & Movements Page Logic (activity.js)
 * Path: pages/activity/activity.js
 */
(function () {
  'use strict';

  // State
  let currentRange = 'all';
  let startDate = '';
  let endDate = '';
  let currentType = 'all';
  let searchQuery = '';
  let searchDebounceTimer = null;
  let currentActivities = [];
  let currentView = localStorage.getItem('teamden-activity-view') || 'timeline';

  // DOM Elements
  const timelineContainer = document.getElementById('activity-timeline-container');
  const paneTimeline = document.getElementById('pane-timeline');
  const paneTable = document.getElementById('pane-table');
  const viewTimelineBtn = document.getElementById('view-timeline-btn');
  const viewTableBtn = document.getElementById('view-table-btn');
  const tableTbody = document.getElementById('activity-table-tbody');
  const emptyState = document.getElementById('activity-empty-state');
  const filterStatusText = document.getElementById('filter-status-text');
  const movementsLabel = document.getElementById('activity-movements-label');

  // KPI Elements
  const chipTotal = document.getElementById('chip-total-count');
  const chipCompleted = document.getElementById('chip-completed-count');
  const chipDocuments = document.getElementById('chip-documents-count');
  const chipComments = document.getElementById('chip-comments-count');

  // Custom date elements
  const customDatePanel = document.getElementById('custom-date-panel');
  const customStartDateInput = document.getElementById('custom-start-date');
  const customEndDateInput = document.getElementById('custom-end-date');
  const customApplyBtn = document.getElementById('custom-date-apply-btn');
  const customResetBtn = document.getElementById('custom-date-reset-btn');

  // Search elements
  const searchInput = document.getElementById('activity-search-input');
  const searchClearBtn = document.getElementById('activity-search-clear');

  // Drawer elements
  const drawerOverlay = document.getElementById('activity-drawer-overlay');
  const drawerCloseBtn = document.getElementById('drawer-close-btn');
  const drawerBadge = document.getElementById('drawer-badge');
  const drawerTimeTag = document.getElementById('drawer-time-tag');
  const drawerTitle = document.getElementById('drawer-title');
  const drawerSubmeta = document.getElementById('drawer-submeta');
  const drawerInfoText = document.getElementById('drawer-info-text');
  const drawerEventId = document.getElementById('drawer-event-id');
  const drawerActorName = document.getElementById('drawer-actor-name');
  const drawerOrgName = document.getElementById('drawer-org-name');
  const drawerCopyIdBtn = document.getElementById('drawer-copy-id-btn');

  document.addEventListener('DOMContentLoaded', () => {
    initSharedFragments();
    initFilters();
    initDrawer();
    loadActivityData();
  });

  /**
   * Load shared sidebar and navbar fragments
   */
  async function initSharedFragments() {
    try {
      const [sidebarRes, navbarRes] = await Promise.all([
        fetch('/fragments/sidebar/sidebar.html'),
        fetch('/fragments/navbar/navbar.html')
      ]);

      if (sidebarRes.ok) {
        const sidebarHtml = await sidebarRes.text();
        const sidebarMount = document.getElementById('sidebar-mount');
        if (sidebarMount) {
          sidebarMount.innerHTML = sidebarHtml;
          if (window.Sidebar && typeof window.Sidebar.init === 'function') {
            window.Sidebar.init();
          }
        }
      }

      if (navbarRes.ok) {
        const navbarHtml = await navbarRes.text();
        const navbarMount = document.getElementById('navbar-mount');
        if (navbarMount) {
          navbarMount.innerHTML = navbarHtml;
          if (window.Navbar && typeof window.Navbar.init === 'function') {
            window.Navbar.init();
          }
        }
      }
    } catch (e) {
      console.warn('Could not load shared fragments:', e);
    }
  }

  /**
   * Initialize interactive filter buttons & inputs
   */
  function initFilters() {
    // 1. Date Range Segmented Buttons
    const rangeGroup = document.getElementById('range-filter-group');
    if (rangeGroup) {
      rangeGroup.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-seg-btn');
        if (!btn) return;

        const range = btn.dataset.range;
        if (range === 'custom') {
          // Toggle custom date panel
          const isVisible = customDatePanel.style.display !== 'none';
          customDatePanel.style.display = isVisible ? 'none' : 'block';
          if (!isVisible) {
            btn.classList.add('is-active');
          } else if (currentRange !== 'custom') {
            btn.classList.remove('is-active');
          }
          return;
        }

        // Standard range selected
        rangeGroup.querySelectorAll('.filter-seg-btn').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        customDatePanel.style.display = 'none';

        currentRange = range;
        startDate = '';
        endDate = '';
        loadActivityData();
      });
    }

    // 2. Custom Date Apply & Reset
    if (customApplyBtn) {
      customApplyBtn.addEventListener('click', () => {
        const s = customStartDateInput.value;
        const e = customEndDateInput.value;
        if (!s && !e) {
          alert('Please select at least a start or end date.');
          return;
        }
        currentRange = 'custom';
        startDate = s;
        endDate = e;
        loadActivityData();
      });
    }

    if (customResetBtn) {
      customResetBtn.addEventListener('click', () => {
        customStartDateInput.value = '';
        customEndDateInput.value = '';
        customDatePanel.style.display = 'none';
        currentRange = 'all';
        startDate = '';
        endDate = '';
        const allBtn = document.querySelector('.filter-seg-btn[data-range="all"]');
        if (allBtn) allBtn.click();
      });
    }

    // 3. Type Filter Pills
    const typeGroup = document.getElementById('type-filter-group');
    if (typeGroup) {
      typeGroup.addEventListener('click', (e) => {
        const pill = e.target.closest('.type-pill');
        if (!pill) return;

        typeGroup.querySelectorAll('.type-pill').forEach(p => p.classList.remove('is-active'));
        pill.classList.add('is-active');

        currentType = pill.dataset.type;
        loadActivityData();
      });
    }

    // 4. Live Search Input
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const val = searchInput.value.trim();
        searchClearBtn.style.display = val ? 'block' : 'none';

        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
          searchQuery = val;
          loadActivityData();
        }, 300);
      });
    }

    if (searchClearBtn) {
      searchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchClearBtn.style.display = 'none';
        searchQuery = '';
        loadActivityData();
      });
    }

    // 5. Empty State Reset
    const emptyResetBtn = document.getElementById('empty-reset-btn');
    if (emptyResetBtn) {
      emptyResetBtn.addEventListener('click', () => {
        currentRange = 'all';
        currentType = 'all';
        searchQuery = '';
        if (searchInput) searchInput.value = '';
        if (searchClearBtn) searchClearBtn.style.display = 'none';
        customDatePanel.style.display = 'none';

        const allRangeBtn = document.querySelector('.filter-seg-btn[data-range="all"]');
        if (allRangeBtn) {
          rangeGroup.querySelectorAll('.filter-seg-btn').forEach(b => b.classList.remove('is-active'));
          allRangeBtn.classList.add('is-active');
        }

        const allTypeBtn = document.querySelector('.type-pill[data-type="all"]');
        if (allTypeBtn) {
          typeGroup.querySelectorAll('.type-pill').forEach(p => p.classList.remove('is-active'));
          allTypeBtn.classList.add('is-active');
        }

        loadActivityData();
      });
    }

    // 6. View Switcher (Timeline vs Table View)
    if (viewTimelineBtn) {
      viewTimelineBtn.addEventListener('click', () => switchView('timeline'));
    }
    if (viewTableBtn) {
      viewTableBtn.addEventListener('click', () => switchView('table'));
    }
  }

  /**
   * Switch between Timeline and Table views
   */
  function switchView(viewMode) {
    currentView = (viewMode === 'table') ? 'table' : 'timeline';
    try {
      localStorage.setItem('teamden-activity-view', currentView);
    } catch (e) {
      // Ignore private storage limitations
    }

    if (viewTimelineBtn) {
      viewTimelineBtn.classList.toggle('is-active', currentView === 'timeline');
      viewTimelineBtn.setAttribute('aria-selected', currentView === 'timeline');
    }
    if (viewTableBtn) {
      viewTableBtn.classList.toggle('is-active', currentView === 'table');
      viewTableBtn.setAttribute('aria-selected', currentView === 'table');
    }

    if (currentActivities && currentActivities.length > 0) {
      if (paneTimeline) paneTimeline.style.display = (currentView === 'timeline') ? 'block' : 'none';
      if (paneTable) paneTable.style.display = (currentView === 'table') ? 'block' : 'none';
      if (emptyState) emptyState.style.display = 'none';
    } else {
      if (paneTimeline) paneTimeline.style.display = 'none';
      if (paneTable) paneTable.style.display = 'none';
      if (emptyState) emptyState.style.display = 'flex';
    }
  }

  /**
   * Fetch activity data from the backend database
   */
  async function loadActivityData() {
    try {
      const params = new URLSearchParams();
      if (currentRange) params.append('range', currentRange);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (currentType && currentType !== 'all') params.append('type', currentType);
      if (searchQuery) params.append('query', searchQuery);

      const res = await fetch(`/api/activity/data?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();
      currentActivities = data.activities || [];

      // Update counters
      if (chipTotal) chipTotal.textContent = data.totalCount || 0;
      if (chipCompleted) chipCompleted.textContent = data.completedCount || 0;
      if (chipDocuments) chipDocuments.textContent = data.documentCount || 0;
      if (chipComments) chipComments.textContent = data.commentCount || 0;

      // Update live header date
      if (movementsLabel && data.currentDateLabel) {
        movementsLabel.textContent = data.currentDateLabel;
      }

      // Update active filter text
      updateFilterStatus(data.totalCount);

      // Render both views and apply current view preference
      renderTimeline(currentActivities);
      renderTable(currentActivities);
      switchView(currentView);
    } catch (err) {
      console.warn('Failed to load activity data from database:', err);
      currentActivities = [];
      if (paneTimeline) paneTimeline.style.display = 'none';
      if (paneTable) paneTable.style.display = 'none';
      if (emptyState) emptyState.style.display = 'flex';
      if (filterStatusText) {
        filterStatusText.textContent = 'Error connecting to database. Please refresh or check connection.';
      }
    }
  }

  /**
   * Update filter status message
   */
  function updateFilterStatus(totalCount) {
    if (!filterStatusText) return;
    const countStr = `${totalCount} ${totalCount === 1 ? 'record' : 'records'}`;
    let rangeDesc = 'all time';
    if (currentRange === 'today') rangeDesc = 'today';
    else if (currentRange === 'yesterday') rangeDesc = 'yesterday';
    else if (currentRange === 'last_week') rangeDesc = 'the last week';
    else if (currentRange === 'custom') {
      rangeDesc = `custom range (${startDate || 'start'} to ${endDate || 'end'})`;
    }

    let typeDesc = currentType !== 'all' ? ` · ${currentType.toLowerCase()}` : '';
    let searchDesc = searchQuery ? ` · matching "${searchQuery}"` : '';

    filterStatusText.textContent = `Showing ${countStr} for ${rangeDesc}${typeDesc}${searchDesc}`;
  }

  /**
   * Render the timeline with group headers
   */
  function renderTimeline(activities) {
    if (!timelineContainer) return;

    if (!activities || activities.length === 0) {
      timelineContainer.innerHTML = '';
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    // Group activities by dayLabel
    let currentDayGroup = null;
    let html = '';

    activities.forEach(item => {
      const day = item.dayLabel || 'TODAY';
      if (day !== currentDayGroup) {
        currentDayGroup = day;
        html += `
          <div class="activity-day-group-header">
            <span class="activity-day-group-title">${escapeHtml(currentDayGroup)}</span>
          </div>
        `;
      }

      html += createActivityRowHtml(item);
    });

    timelineContainer.innerHTML = html;
  }

  /**
   * Generate row HTML matching the uploaded design
   */
  function createActivityRowHtml(item) {
    const badgeType = (item.badgeType || 'COMMENT').toUpperCase();
    const badgeClass = 'badge-' + badgeType.toLowerCase();
    const dotColor = item.dotColor || 'purple';

    let badgeIcon = '';
    if (badgeType === 'COMPLETED') {
      badgeIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (badgeType === 'DOCUMENT') {
      badgeIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`;
    } else if (badgeType === 'ASSIGNED') {
      badgeIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;
    } else {
      badgeIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
    }

    let sentenceHtml = '';
    if (item.author) {
      sentenceHtml = `<strong>${escapeHtml(item.author)}</strong> ${escapeHtml(item.actionText)} <strong>${escapeHtml(item.targetTitle)}</strong>`;
    } else {
      sentenceHtml = `<strong>${escapeHtml(item.targetTitle)}</strong> ${item.actionText ? escapeHtml(item.actionText) : ''}`;
    }

    let detailHtml = '';
    if (item.quotePreview) {
      detailHtml = `<div class="act-quote-preview">"${escapeHtml(item.quotePreview)}"</div>`;
    } else if (item.infoText) {
      detailHtml = `<div class="act-info-desc">${escapeHtml(item.infoText)}</div>`;
    }

    return `
      <div class="activity-item-row" id="act-row-${escapeHtml(item.id)}">
        <div class="act-time-col">
          <span class="act-time">${escapeHtml(item.time || '12:00')}</span>
          <span class="act-day-badge">${escapeHtml(item.dayLabel || 'TODAY')}</span>
        </div>

        <span class="act-node-dot dot-${dotColor}"></span>

        <div class="act-content-card">
          <div class="act-card-left">
            <div class="act-badge-pill ${badgeClass}">
              ${badgeIcon}
              <span>${escapeHtml(badgeType)}</span>
            </div>

            <div class="act-desc-block">
              <div class="act-sentence">${sentenceHtml}</div>
              ${item.subMeta ? `<div class="act-submeta">${escapeHtml(item.subMeta)}</div>` : ''}
            </div>
          </div>

          <div class="act-card-mid">
            ${detailHtml}
          </div>

          <div class="act-card-right">
            <button type="button" class="act-action-btn" onclick="window.openActivityDrawer('${escapeHtml(item.id)}')" title="View details" aria-label="View details">↗</button>
            <button type="button" class="act-action-btn" onclick="window.openActivityOptions('${escapeHtml(item.id)}')" title="More options" aria-label="More options">•••</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render the table view with full structured details
   */
  function renderTable(activities) {
    if (!tableTbody) return;
    tableTbody.innerHTML = '';

    if (!activities || activities.length === 0) {
      return;
    }

    const rows = activities.map(item => {
      const badgeType = (item.badgeType || 'COMMENT').toUpperCase();
      const badgeClass = 'badge-' + badgeType.toLowerCase();
      const dotColor = item.dotColor || 'purple';

      let movementTarget = '';
      if (item.author) {
        movementTarget = `${escapeHtml(item.actionText)} <strong>${escapeHtml(item.targetTitle)}</strong>`;
      } else {
        movementTarget = `<strong>${escapeHtml(item.targetTitle)}</strong> ${item.actionText ? escapeHtml(item.actionText) : ''}`;
      }

      let detailContent = '';
      if (item.quotePreview) {
        detailContent = `<div class="quote-italic">"${escapeHtml(item.quotePreview)}"</div>`;
      } else if (item.infoText) {
        detailContent = `<div>${escapeHtml(item.infoText)}</div>`;
      } else {
        detailContent = `<span style="opacity: 0.5;">—</span>`;
      }

      return `
        <tr id="act-tbl-row-${escapeHtml(item.id)}">
          <td class="act-cell-time">
            <span>${escapeHtml(item.time || '12:00')}</span>
            <span class="act-tbl-day">${escapeHtml(item.dayLabel || 'TODAY')}</span>
          </td>
          <td>
            <span class="act-table-badge ${badgeClass}">
              <span class="act-tbl-dot dot-${dotColor}"></span>
              <span>${escapeHtml(badgeType)}</span>
            </span>
          </td>
          <td class="act-cell-actor">
            ${escapeHtml(item.author || 'System')}
          </td>
          <td class="act-cell-target">
            ${movementTarget}
          </td>
          <td class="act-cell-project">
            ${escapeHtml(item.subMeta || 'Workspace / General')}
          </td>
          <td class="act-cell-details">
            ${detailContent}
          </td>
          <td style="text-align: right;">
            <button type="button" class="act-tbl-inspect-btn" onclick="window.openActivityDrawer('${escapeHtml(item.id)}')" title="Inspect details" aria-label="Inspect details">↗</button>
          </td>
        </tr>
      `;
    }).join('');

    tableTbody.innerHTML = rows;
  }

  /**
   * Detail Drawer Logic
   */
  function initDrawer() {
    if (drawerCloseBtn) {
      drawerCloseBtn.addEventListener('click', closeActivityDrawer);
    }

    if (drawerOverlay) {
      drawerOverlay.addEventListener('click', (e) => {
        if (e.target === drawerOverlay) {
          closeActivityDrawer();
        }
      });
    }

    if (drawerCopyIdBtn) {
      drawerCopyIdBtn.addEventListener('click', () => {
        const id = drawerEventId.textContent;
        if (id && id !== '-') {
          navigator.clipboard.writeText(id).then(() => {
            const orig = drawerCopyIdBtn.textContent;
            drawerCopyIdBtn.textContent = 'Copied!';
            setTimeout(() => { drawerCopyIdBtn.textContent = orig; }, 1500);
          });
        }
      });
    }
  }

  window.openActivityDrawer = function (id) {
    const item = currentActivities.find(a => a.id === id) || {
      id: id,
      time: '12:46',
      dayLabel: 'TODAY',
      badgeType: 'COMPLETED',
      author: 'Marcus',
      actionText: 'completed',
      targetTitle: 'Set up staging environment',
      subMeta: 'Client Application / Engineering',
      infoText: 'Task marked complete'
    };

    if (drawerBadge) {
      drawerBadge.textContent = item.badgeType || 'ACTIVITY';
      drawerBadge.className = 'drawer-badge-pill badge-' + (item.badgeType || 'comment').toLowerCase();
    }
    if (drawerTimeTag) drawerTimeTag.textContent = `${item.time || '12:00'} · ${item.dayLabel || 'TODAY'}`;
    if (drawerTitle) {
      drawerTitle.textContent = item.author
        ? `${item.author} ${item.actionText} ${item.targetTitle}`
        : `${item.targetTitle} ${item.actionText || ''}`;
    }
    if (drawerSubmeta) drawerSubmeta.textContent = item.subMeta || 'Workspace Movement';
    if (drawerInfoText) {
      drawerInfoText.textContent = item.quotePreview
        ? `"${item.quotePreview}"`
        : (item.infoText || 'Movement registered in system log.');
    }
    if (drawerEventId) drawerEventId.textContent = item.id;
    if (drawerActorName) drawerActorName.textContent = item.author || 'System';

    if (drawerOverlay) drawerOverlay.style.display = 'flex';
  };

  function closeActivityDrawer() {
    if (drawerOverlay) drawerOverlay.style.display = 'none';
  }

  window.closeActivityDrawer = closeActivityDrawer;

  window.openActivityOptions = function (id) {
    window.openActivityDrawer(id);
  };

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
})();
