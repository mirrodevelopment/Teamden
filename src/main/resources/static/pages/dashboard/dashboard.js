/**
 * Teamden by shed — Dashboard Logic (dashboard.js)
 * Path: pages/dashboard/dashboard.js
 *
 * Pixel-accurate matching of neo-editorial 'brick' dashboard layout.
 * Full interactivity for tasks, hero card, activities, calendar, attention, and daily update.
 */

(function () {
  'use strict';

  let currentDashboardData = null;
  let currentUser = null;
  let showAllActivities = false;

  /**
   * Helper to fetch and inject external HTML fragments (Sidebar & Navbar)
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
  window.showToast = function (message) {
    let container = document.getElementById('dash-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'dash-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'dash-toast';
    toast.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9F34A" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      <span>${escapeHtml(message)}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all 180ms ease';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 180);
    }, 2800);
  };

  /**
   * Modal dialog system
   */
  window.openModal = function (title, contentHtml, footerHtml = '') {
    let backdrop = document.getElementById('dash-modal-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'dash-modal-backdrop';
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) window.closeModal();
      });
      document.body.appendChild(backdrop);
    }

    backdrop.innerHTML = `
      <div class="dash-modal-card">
        <div class="dash-modal-header">
          <h3>${escapeHtml(title)}</h3>
          <button class="dash-modal-close-btn" onclick="window.closeModal()" title="Close">&times;</button>
        </div>
        <div class="dash-modal-body">
          ${contentHtml}
        </div>
        ${footerHtml ? `<div class="dash-modal-footer">${footerHtml}</div>` : ''}
      </div>
    `;

    backdrop.style.opacity = '1';
  };

  window.closeModal = function () {
    const backdrop = document.getElementById('dash-modal-backdrop');
    if (backdrop) {
      backdrop.style.opacity = '0';
      setTimeout(() => {
        if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      }, 150);
    }
  };

  /**
   * Render tasks into a kanban column
   */
  function renderTaskList(tasks, containerId, badgeId) {
    const listEl = document.getElementById(containerId);
    const badgeEl = document.getElementById(badgeId);
    if (!listEl) return;

    if (badgeEl) {
      const activeCount = tasks.filter(t => !t.completed).length;
      badgeEl.textContent = String(activeCount).padStart(2, '0');
    }

    listEl.innerHTML = tasks.map(task => `
      <div class="task-card ${task.completed ? 'task-completed' : ''}" id="card-${task.id}" data-task-id="${task.id}">
        <div class="task-top-row">
          <button class="task-checkbox-custom" 
                  aria-label="Toggle task completion" 
                  onclick="event.stopPropagation(); window.toggleTaskCompletion('${task.id}')"
                  title="${task.completed ? 'Mark incomplete' : 'Mark complete'}">
          </button>
          <div class="task-content-block" onclick="window.openTaskDetails('${task.id}')" style="cursor: pointer;">
            <div class="task-title-wrap">
              <span class="task-num">${task.indexNum || '01'}</span>
              <span class="task-text">${escapeHtml(task.title)}</span>
            </div>
            <div class="task-meta-row">
              <span class="task-tag-badge">${escapeHtml(task.tag || 'General')}</span>
              <span class="task-due-status">
                <span class="pill-dot dot-${task.dotColor || 'gray'}"></span>
                <span>${escapeHtml(task.dueDateLabel || 'Today')}</span>
              </span>
            </div>
          </div>
          <button class="task-card-menu-btn" onclick="event.stopPropagation(); window.openTaskMenu('${task.id}')" title="Options">•••</button>
        </div>
      </div>
    `).join('');
  }

  /**
   * Render Recent Activity Timeline
   */
  function renderActivityTimeline(activities) {
    const container = document.getElementById('activity-timeline-list');
    if (!container) return;

    const allActivities = activities && activities.length > 0 ? activities : [
      {
        id: 'act-01',
        time: '09:42',
        dayLabel: 'TODAY',
        badgeType: 'COMMENT',
        dotColor: 'purple',
        author: 'Sonia',
        actionText: 'commented on',
        targetTitle: 'Design review notes',
        subMeta: 'Website Redesign / Design Team',
        quotePreview: "The new visual direction looks great. Let's make a few minor adjustments to the icon spacing."
      },
      {
        id: 'act-02',
        time: '08:15',
        dayLabel: 'TODAY',
        badgeType: 'COMPLETED',
        dotColor: 'green',
        author: 'Marcus',
        actionText: 'completed',
        targetTitle: 'Set up staging environment',
        subMeta: 'Client Application / Engineering',
        infoText: 'Task marked complete'
      },
      {
        id: 'act-03',
        time: '07:30',
        dayLabel: 'TODAY',
        badgeType: 'DOCUMENT',
        dotColor: 'amber',
        author: '',
        actionText: '',
        targetTitle: 'Product brief was updated',
        subMeta: 'Product / Workspace',
        infoText: 'Version 1.2 · 3 pages'
      },
      {
        id: 'act-04',
        time: '06:12',
        dayLabel: 'TODAY',
        badgeType: 'ASSIGNED',
        dotColor: 'blue',
        author: 'You',
        actionText: 'assigned a task to',
        targetTitle: 'Priya',
        subMeta: 'Website Redesign / Design Team',
        infoText: 'Client feedback session · Tomorrow, 2:00 PM'
      }
    ];

    const displayList = showAllActivities ? allActivities : allActivities.slice(0, 4);

    container.innerHTML = displayList.map(item => {
      const badgeType = (item.badgeType || 'COMMENT').toUpperCase();
      const badgeClass = 'badge-' + badgeType.toLowerCase();

      let badgeIcon = '';
      if (badgeType === 'COMMENT') {
        badgeIcon = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
      } else if (badgeType === 'COMPLETED') {
        badgeIcon = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
      } else if (badgeType === 'DOCUMENT') {
        badgeIcon = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`;
      } else {
        badgeIcon = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;
      }

      let sentenceHtml = '';
      if (item.author) {
        sentenceHtml = `<strong>${escapeHtml(item.author)}</strong> ${escapeHtml(item.actionText)} <strong>${escapeHtml(item.targetTitle)}</strong>`;
      } else {
        sentenceHtml = `<strong>${escapeHtml(item.targetTitle)}</strong>`;
      }

      return `
        <div class="activity-item" id="act-item-${item.id}">
          <div class="activity-time-block">
            <span class="activity-time">${escapeHtml(item.time)}</span>
            <span class="activity-day-label">${escapeHtml(item.dayLabel || 'TODAY')}</span>
          </div>
          <span class="activity-node-dot dot-${item.dotColor || 'purple'}"></span>
          
          <div class="activity-row-content">
            <div class="activity-badge ${badgeClass}">
              ${badgeIcon}
              <span>${escapeHtml(badgeType)}</span>
            </div>

            <div class="activity-desc-col">
              <div class="activity-sentence">
                ${sentenceHtml}
              </div>
              ${item.subMeta ? `<div class="activity-submeta">${escapeHtml(item.subMeta)}</div>` : ''}
            </div>

            <div class="activity-context-col">
              ${item.quotePreview ? `<div class="activity-quote-preview">"${escapeHtml(item.quotePreview)}"</div>` : ''}
              ${item.infoText ? `<div class="activity-info-text">${escapeHtml(item.infoText)}</div>` : ''}
            </div>

            <div class="activity-actions-right">
              <button class="activity-action-btn" onclick="window.openActivityRecord('${item.id}')" title="View details" aria-label="View details">↗</button>
              <button class="activity-action-btn" onclick="window.openActivityMenu('${item.id}')" title="Options" aria-label="Options">•••</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Wire up "View all →" / "Show less ↑" link
    const viewAllLink = document.getElementById('activity-view-all-link');
    if (viewAllLink && allActivities.length > 4) {
      viewAllLink.style.display = 'inline-block';
      viewAllLink.textContent = showAllActivities ? 'Show less ↑' : 'View all →';
      viewAllLink.onclick = (e) => {
        e.preventDefault();
        showAllActivities = !showAllActivities;
        renderActivityTimeline(allActivities);
      };
    } else if (viewAllLink && allActivities.length <= 4) {
      viewAllLink.style.display = 'inline-block';
      viewAllLink.textContent = 'View all →';
      viewAllLink.onclick = (e) => {
        e.preventDefault();
        window.openAllActivitiesModal();
      };
    }
  }

  /**
   * Render YOUR DAY Schedule Agenda
   */
  function renderSchedule(scheduleItems) {
    const container = document.getElementById('rail-schedule-list');
    if (!container) return;

    const items = scheduleItems && scheduleItems.length > 0 ? scheduleItems : [
      { id: 'sch-1', time: '09:00', title: 'Team standup', subMeta: 'Engineering · 30 min', dotColor: 'green' },
      { id: 'sch-2', time: '10:00', title: 'Design review', subMeta: 'Website Redesign · 1 hr', dotColor: 'purple' },
      { id: 'sch-3', time: '12:00', title: 'Lunch break', subMeta: '', dotColor: 'gray' },
      { id: 'sch-4', time: '14:00', title: 'Client feedback session', subMeta: 'Acme Co. · 1 hr', dotColor: 'blue' },
      { id: 'sch-5', time: '16:00', title: 'Focus time', subMeta: 'No meetings', dotColor: 'gray' }
    ];

    container.innerHTML = items.map(item => `
      <div class="schedule-item" onclick="window.openCalendarEvent('${item.id}')" style="cursor: pointer;">
        <span class="schedule-time">${escapeHtml(item.time)}</span>
        <div class="schedule-dot-wrap">
          <span class="schedule-dot pill-dot dot-${item.dotColor || 'gray'}"></span>
        </div>
        <div class="schedule-details">
          <span class="schedule-title">${escapeHtml(item.title)}</span>
          ${item.subMeta ? `<span class="schedule-submeta">${escapeHtml(item.subMeta)}</span>` : ''}
        </div>
      </div>
    `).join('');
  }

  /**
   * Render NEEDS ATTENTION Summary Cards
   */
  function renderAttention(attentionItems) {
    const container = document.getElementById('rail-attention-list');
    if (!container) return;

    const items = attentionItems && attentionItems.length > 0 ? attentionItems : [
      { id: 'att-1', count: '02', title: 'Blocked tasks', subtitle: 'Require your input', bgType: 'peach' },
      { id: 'att-2', count: '03', title: 'Tasks waiting for others', subtitle: 'No update in 2+ days', bgType: 'neutral' },
      { id: 'att-3', count: '01', title: 'Unread mention', subtitle: 'In Website Redesign', bgType: 'neutral-light' }
    ];

    container.innerHTML = items.map((item, idx) => {
      let clickHandler = `window.openAttentionCard('${item.id}', '${escapeHtml(item.title)}')`;
      if (item.title && item.title.toLowerCase().includes('blocked')) {
        clickHandler = `window.openBlockedTasksModal()`;
      } else if (item.title && item.title.toLowerCase().includes('waiting')) {
        clickHandler = `window.openWaitingTasksModal()`;
      } else if (item.title && item.title.toLowerCase().includes('mention')) {
        clickHandler = `window.openUnreadMentionModal()`;
      }

      const cardClass = item.bgType ? `card-${item.bgType}` : (idx === 0 ? 'card-peach' : (idx === 1 ? 'card-neutral' : 'card-neutral-light'));

      return `
        <div class="attention-card ${cardClass}" onclick="${clickHandler}">
          <span class="attention-count">${escapeHtml(item.count)}</span>
          <div class="attention-copy">
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(item.subtitle)}</span>
          </div>
          <span class="attention-arrow">→</span>
        </div>
      `;
    }).join('');
  }

  /**
   * Update Total Task Count in Header
   */
  function updateTotalTaskCount() {
    if (!currentDashboardData) return;
    const total = (currentDashboardData.nowTasks?.length || 0) +
      (currentDashboardData.nextTasks?.length || 0) +
      (currentDashboardData.laterTasks?.length || 0);
    const countEl = document.getElementById('dash-total-tasks-count');
    if (countEl) {
      countEl.textContent = `${String(total).padStart(2, '0')} TASKS`;
    }
  }

  /**
   * Interactive Toggle Task Completion
   */
  window.toggleTaskCompletion = async function (taskId) {
    if (!currentDashboardData) return;

    let targetTask = null;
    for (const list of [currentDashboardData.nowTasks, currentDashboardData.nextTasks, currentDashboardData.laterTasks]) {
      const found = list.find(t => t.id === taskId);
      if (found) {
        found.completed = !found.completed;
        targetTask = found;
        const cardEl = document.getElementById(`card-${taskId}`);
        if (cardEl) {
          cardEl.classList.toggle('task-completed', found.completed);
        }
        break;
      }
    }

    renderTaskList(currentDashboardData.nowTasks, 'list-tasks-now', 'badge-count-now');
    renderTaskList(currentDashboardData.nextTasks, 'list-tasks-next', 'badge-count-next');
    renderTaskList(currentDashboardData.laterTasks, 'list-tasks-later', 'badge-count-later');
    updateTotalTaskCount();

    if (targetTask) {
      window.showToast(targetTask.completed ? `Completed: "${targetTask.title}"` : `Reopened: "${targetTask.title}"`);
    }

    // Synchronize with backend API
    try {
      await fetch(`/api/dashboard/tasks/${encodeURIComponent(taskId)}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      console.warn('Backend toggle synchronization notice:', err);
    }
  };

  /**
   * Open Task Details Modal
   */
  window.openTaskDetails = function (taskId) {
    if (!currentDashboardData) return;
    let task = null;
    let colName = 'NOW';
    for (const list of [currentDashboardData.nowTasks, currentDashboardData.nextTasks, currentDashboardData.laterTasks]) {
      const found = list.find(t => t.id === taskId);
      if (found) {
        task = found;
        colName = list === currentDashboardData.nowTasks ? 'NOW' : (list === currentDashboardData.nextTasks ? 'NEXT' : 'LATER');
        break;
      }
    }
    if (!task) return;

    const content = `
      <div style="display:flex; flex-direction:column; gap:1rem;">
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <span style="font-size:0.6875rem; font-weight:700; color:var(--dash-text-muted); text-transform:uppercase;">Priority Group: ${colName}</span>
          <span style="display:inline-flex; align-items:center; gap:0.35rem; font-size:0.75rem; font-weight:600;">
            <span class="pill-dot dot-${task.dotColor || 'gray'}"></span>
            <span>Due: ${escapeHtml(task.dueDateLabel || 'Today')}</span>
          </span>
        </div>
        <div>
          <h4 style="margin:0 0 0.5rem 0; font-size:1.15rem; font-weight:800; color:var(--dash-text-primary); line-height:1.25;">${escapeHtml(task.title)}</h4>
          <span class="task-tag-badge" style="font-size:0.75rem; padding:0.25rem 0.5rem;">${escapeHtml(task.tag || 'Website Redesign')}</span>
        </div>
        <div style="background:rgba(0,0,0,0.03); border:1px solid var(--dash-border); border-radius:8px; padding:0.85rem; font-size:0.8125rem; line-height:1.45; color:var(--dash-text-muted);">
          ${escapeHtml(task.description || 'Assigned to your active workstream. Complete deliverables and submit for team review.')}
        </div>
        <div style="display:flex; align-items:center; gap:0.5rem; font-size:0.75rem; color:var(--dash-text-muted);">
          <span>Status:</span>
          <strong style="color:var(--dash-text-primary);">${task.completed ? 'Completed' : 'Action Required'}</strong>
        </div>
      </div>
    `;

    const footer = `
      <button onclick="window.closeModal()" style="padding:0.45rem 0.85rem; background:none; border:1px solid var(--dash-border); border-radius:6px; font-size:0.75rem; font-weight:600; cursor:pointer; color:var(--dash-text-muted);">Close</button>
      <button onclick="window.toggleTaskCompletion('${task.id}'); window.closeModal();" style="padding:0.45rem 0.95rem; background:#111; color:#fff; border:none; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">
        ${task.completed ? 'Mark Incomplete' : 'Mark Complete'}
      </button>
    `;

    window.openModal(`Task Details — ${task.indexNum || '01'}`, content, footer);
  };

  /**
   * Task Options Menu Modal
   */
  window.openTaskMenu = function (taskId) {
    if (!currentDashboardData) return;
    let task = null;
    for (const list of [currentDashboardData.nowTasks, currentDashboardData.nextTasks, currentDashboardData.laterTasks]) {
      const found = list.find(t => t.id === taskId);
      if (found) { task = found; break; }
    }
    if (!task) return;

    const content = `
      <div style="display:flex; flex-direction:column; gap:0.5rem;">
        <button onclick="window.closeModal(); window.openTaskDetails('${task.id}')" style="text-align:left; padding:0.6rem 0.8rem; background:none; border:none; border-radius:6px; font-size:0.8125rem; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:0.6rem;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          View Full Details
        </button>
        <button onclick="window.toggleTaskCompletion('${task.id}'); window.closeModal();" style="text-align:left; padding:0.6rem 0.8rem; background:none; border:none; border-radius:6px; font-size:0.8125rem; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:0.6rem;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          ${task.completed ? 'Mark as Incomplete' : 'Mark as Complete'}
        </button>
        <button onclick="window.copyTaskLink('${task.id}')" style="text-align:left; padding:0.6rem 0.8rem; background:none; border:none; border-radius:6px; font-size:0.8125rem; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:0.6rem;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          Copy Task Link
        </button>
      </div>
    `;

    window.openModal(`Task Options: ${task.title}`, content);
  };

  window.copyTaskLink = function (taskId) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/pages/dashboard/dashboard.html#task-${taskId}`);
    }
    window.closeModal();
    window.showToast('Task link copied to clipboard');
  };

  /**
   * Hero Task Details Drawer / Modal ("Continue task →")
   */
  window.openHeroTaskDrawer = function () {
    const heroTitle = document.getElementById('hero-title')?.innerText?.replace(/\n/g, ' ') || 'Finalise the website service card';
    const heroProject = document.getElementById('hero-project-tag')?.innerText || 'Website Redesign';
    const heroTeam = document.getElementById('hero-team-tag')?.innerText || 'Design Team';
    const heroDesc = document.getElementById('hero-desc')?.innerText || 'Update the content, refine the visuals and get approval from the client.';

    const content = `
      <div style="display:flex; flex-direction:column; gap:1.15rem;">
        <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--dash-border); padding-bottom:0.75rem;">
          <span style="font-size:0.6875rem; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:var(--dash-text-muted);">01 / NEXT PRIORITY</span>
          <span style="display:inline-flex; align-items:center; gap:0.35rem; background:rgba(229,57,53,0.12); color:#E53935; padding:0.15rem 0.5rem; border-radius:9999px; font-size:0.7rem; font-weight:700;">
            <span class="pill-dot dot-red"></span>
            <span>High Priority · Due Today</span>
          </span>
        </div>

        <div>
          <h2 style="margin:0 0 0.5rem 0; font-size:1.35rem; font-weight:800; color:var(--dash-text-primary); line-height:1.2;">${escapeHtml(heroTitle)}</h2>
          <div style="display:flex; align-items:center; gap:0.6rem; font-size:0.75rem; color:var(--dash-text-muted);">
            <span>📁 ${escapeHtml(heroProject)}</span>
            <span>•</span>
            <span>👥 ${escapeHtml(heroTeam)}</span>
          </div>
        </div>

        <p style="margin:0; font-size:0.875rem; line-height:1.5; color:var(--dash-text-body); background:rgba(0,0,0,0.03); border:1px solid var(--dash-border); border-radius:8px; padding:0.85rem;">
          ${escapeHtml(heroDesc)}
        </p>

        <div>
          <h4 style="margin:0 0 0.5rem 0; font-size:0.75rem; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:var(--dash-text-muted);">Linked Resources</h4>
          <div style="display:flex; flex-direction:column; gap:0.4rem;">
            <div onclick="window.openAttachmentPreview('Design File')" style="display:flex; align-items:center; justify-content:space-between; padding:0.55rem 0.75rem; background:#fff; border:1px solid var(--dash-border); border-radius:6px; cursor:pointer;">
              <span style="font-size:0.8125rem; font-weight:600;">🎨 Design File (Figma)</span>
              <span style="font-size:0.75rem; color:var(--dash-text-light);">Open ↗</span>
            </div>
            <div onclick="window.openAttachmentPreview('Client Brief')" style="display:flex; align-items:center; justify-content:space-between; padding:0.55rem 0.75rem; background:#fff; border:1px solid var(--dash-border); border-radius:6px; cursor:pointer;">
              <span style="font-size:0.8125rem; font-weight:600;">📄 Client Brief v1.4</span>
              <span style="font-size:0.75rem; color:var(--dash-text-light);">Open ↗</span>
            </div>
            <div onclick="window.openAttachmentPreview('References')" style="display:flex; align-items:center; justify-content:space-between; padding:0.55rem 0.75rem; background:#fff; border:1px solid var(--dash-border); border-radius:6px; cursor:pointer;">
              <span style="font-size:0.8125rem; font-weight:600;">🖼️ Visual References & Moodboard</span>
              <span style="font-size:0.75rem; color:var(--dash-text-light);">Open ↗</span>
            </div>
          </div>
        </div>
      </div>
    `;

    const footer = `
      <button onclick="window.closeModal()" style="padding:0.45rem 0.85rem; background:none; border:1px solid var(--dash-border); border-radius:6px; font-size:0.75rem; font-weight:600; cursor:pointer; color:var(--dash-text-muted);">Close</button>
      <button onclick="window.showToast('Hero task marked complete'); window.closeModal();" style="padding:0.45rem 0.95rem; background:#111; color:#fff; border:none; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">Complete Task</button>
    `;

    window.openModal('Featured Priority Task', content, footer);
  };

  /**
   * Hero Options Menu
   */
  window.openHeroOptions = function () {
    const content = `
      <div style="display:flex; flex-direction:column; gap:0.5rem;">
        <button onclick="window.closeModal(); window.openHeroTaskDrawer()" style="text-align:left; padding:0.6rem 0.8rem; background:none; border:none; border-radius:6px; font-size:0.8125rem; font-weight:600; cursor:pointer;">
          Continue Task & View Attachments
        </button>
        <button onclick="window.showToast('Hero priority re-scheduled'); window.closeModal();" style="text-align:left; padding:0.6rem 0.8rem; background:none; border:none; border-radius:6px; font-size:0.8125rem; font-weight:600; cursor:pointer;">
          Reschedule Due Date
        </button>
        <button onclick="window.showToast('Priority delegated'); window.closeModal();" style="text-align:left; padding:0.6rem 0.8rem; background:none; border:none; border-radius:6px; font-size:0.8125rem; font-weight:600; cursor:pointer;">
          Reassign to Team Member
        </button>
        <button onclick="window.copyTaskLink('hero-01')" style="text-align:left; padding:0.6rem 0.8rem; background:none; border:none; border-radius:6px; font-size:0.8125rem; font-weight:600; cursor:pointer;">
          Copy Priority Task Link
        </button>
      </div>
    `;
    window.openModal('Hero Priority Options', content);
  };

  /**
   * Attachment Preview Modal
   */
  window.openAttachmentPreview = function (attachmentName) {
    const content = `
      <div style="display:flex; flex-direction:column; gap:1rem;">
        <div style="background:#fff; border:1px solid var(--dash-border); border-radius:8px; padding:1.25rem; text-align:center;">
          <div style="font-size:2rem; margin-bottom:0.5rem;">📄</div>
          <h4 style="margin:0 0 0.25rem 0; font-size:1rem; font-weight:800;">${escapeHtml(attachmentName)}</h4>
          <span style="font-size:0.75rem; color:var(--dash-text-muted);">Synchronized from Workspace Assets</span>
        </div>
        <p style="margin:0; font-size:0.8125rem; color:var(--dash-text-body); line-height:1.45;">
          This resource is linked to the <strong>Finalise the website service card</strong> deliverable. Verified by Design Team.
        </p>
      </div>
    `;
    const footer = `
      <button onclick="window.closeModal()" style="padding:0.45rem 0.85rem; background:none; border:1px solid var(--dash-border); border-radius:6px; font-size:0.75rem; font-weight:600; cursor:pointer; color:var(--dash-text-muted);">Close</button>
      <button onclick="window.showToast('Downloading asset...'); window.closeModal();" style="padding:0.45rem 0.95rem; background:#111; color:#fff; border:none; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">Open Asset</button>
    `;
    window.openModal(`Resource: ${attachmentName}`, content, footer);
  };

  /**
   * Interactive Add Task Modal
   */
  window.openAddTaskModal = function (column) {
    const colName = column || 'NOW';
    const content = `
      <div style="display:flex; flex-direction:column; gap:1rem;">
        <div>
          <label style="display:block; font-size:0.75rem; font-weight:700; margin-bottom:0.35rem;">Task Title</label>
          <input type="text" id="add-task-title" placeholder="e.g. Prepare client presentation" style="width:100%; padding:0.6rem 0.75rem; border:1px solid var(--dash-border); border-radius:6px; font-size:0.8125rem; outline:none; background:#fff;">
        </div>
        <div>
          <label style="display:block; font-size:0.75rem; font-weight:700; margin-bottom:0.35rem;">Project / Tag</label>
          <input type="text" id="add-task-tag" value="Website Redesign" placeholder="e.g. Client Application" style="width:100%; padding:0.6rem 0.75rem; border:1px solid var(--dash-border); border-radius:6px; font-size:0.8125rem; outline:none; background:#fff;">
        </div>
        <div>
          <label style="display:block; font-size:0.75rem; font-weight:700; margin-bottom:0.35rem;">Priority Column</label>
          <select id="add-task-col" style="width:100%; padding:0.6rem 0.75rem; border:1px solid var(--dash-border); border-radius:6px; font-size:0.8125rem; background:#fff;">
            <option value="NOW" ${colName === 'NOW' ? 'selected' : ''}>NOW (Immediate / Due Today)</option>
            <option value="NEXT" ${colName === 'NEXT' ? 'selected' : ''}>NEXT (Upcoming Work Period)</option>
            <option value="LATER" ${colName === 'LATER' ? 'selected' : ''}>LATER (Future Tasks)</option>
          </select>
        </div>
      </div>
    `;

    const footer = `
      <button onclick="window.closeModal()" style="padding:0.45rem 0.85rem; background:none; border:1px solid var(--dash-border); border-radius:6px; font-size:0.75rem; font-weight:600; cursor:pointer; color:var(--dash-text-muted);">Cancel</button>
      <button onclick="window.submitNewTask()" style="padding:0.45rem 0.95rem; background:#111; color:#fff; border:none; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">Create Task</button>
    `;

    window.openModal(`Add Task to ${colName}`, content, footer);
    setTimeout(() => {
      const input = document.getElementById('add-task-title');
      if (input) input.focus();
    }, 100);
  };

  window.submitNewTask = async function () {
    const titleInput = document.getElementById('add-task-title');
    const tagInput = document.getElementById('add-task-tag');
    const colSelect = document.getElementById('add-task-col');

    if (!titleInput || !titleInput.value.trim()) {
      alert('Please enter a task title');
      return;
    }

    const title = titleInput.value.trim();
    const tag = tagInput ? tagInput.value.trim() : 'General';
    const col = colSelect ? colSelect.value : 'NOW';

    const newTask = {
      id: 'task-' + Date.now(),
      column: col,
      indexNum: String((currentDashboardData?.nowTasks?.length || 0) + (currentDashboardData?.nextTasks?.length || 0) + 1).padStart(2, '0'),
      title: title,
      tag: tag || 'General',
      dueDateLabel: col === 'NOW' ? 'Today' : (col === 'NEXT' ? 'Tomorrow' : 'Fri, 27 Oct'),
      dotColor: col === 'NOW' ? 'red' : (col === 'NEXT' ? 'orange' : 'blue'),
      completed: false
    };

    if (currentDashboardData) {
      if (col === 'NEXT') {
        currentDashboardData.nextTasks = currentDashboardData.nextTasks || [];
        currentDashboardData.nextTasks.push(newTask);
        renderTaskList(currentDashboardData.nextTasks, 'list-tasks-next', 'badge-count-next');
      } else if (col === 'LATER') {
        currentDashboardData.laterTasks = currentDashboardData.laterTasks || [];
        currentDashboardData.laterTasks.push(newTask);
        renderTaskList(currentDashboardData.laterTasks, 'list-tasks-later', 'badge-count-later');
      } else {
        currentDashboardData.nowTasks = currentDashboardData.nowTasks || [];
        currentDashboardData.nowTasks.push(newTask);
        renderTaskList(currentDashboardData.nowTasks, 'list-tasks-now', 'badge-count-now');
      }
      updateTotalTaskCount();
    }

    window.closeModal();
    window.showToast(`Task added: "${title}"`);

    // Synchronize with API
    try {
      await fetch('/api/dashboard/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ column: col, title: title, tag: tag })
      });
    } catch (err) {
      console.warn('Backend task create notification:', err);
    }
  };

  /**
   * Open All Tasks Modal ("06 TASKS →")
   */
  window.openAllTasksModal = function (e) {
    if (e) e.preventDefault();
    if (!currentDashboardData) return;

    const all = [
      ...(currentDashboardData.nowTasks || []),
      ...(currentDashboardData.nextTasks || []),
      ...(currentDashboardData.laterTasks || [])
    ];

    const content = `
      <div style="display:flex; flex-direction:column; gap:0.6rem;">
        ${all.map(t => `
          <div onclick="window.closeModal(); window.openTaskDetails('${t.id}')" style="display:flex; align-items:center; justify-content:space-between; padding:0.65rem 0.85rem; background:#fff; border:1px solid var(--dash-border); border-radius:6px; cursor:pointer;">
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <span class="task-num">${t.indexNum}</span>
              <strong style="font-size:0.8125rem;">${escapeHtml(t.title)}</strong>
            </div>
            <span class="task-tag-badge">${escapeHtml(t.tag)}</span>
          </div>
        `).join('')}
      </div>
    `;

    window.openModal(`All Assigned Tasks (${String(all.length).padStart(2, '0')})`, content);
  };

  /**
   * Activity Record Details Modal
   */
  window.openActivityRecord = function (actId) {
    const container = document.getElementById(`act-item-${actId}`);
    const title = container ? container.querySelector('.activity-sentence')?.innerText : 'Activity Record';
    const submeta = container ? container.querySelector('.activity-submeta')?.innerText : '';

    const content = `
      <div style="display:flex; flex-direction:column; gap:1rem;">
        <div style="background:#fff; border:1px solid var(--dash-border); border-radius:8px; padding:1rem;">
          <h4 style="margin:0 0 0.35rem 0; font-size:0.95rem; font-weight:800;">${escapeHtml(title)}</h4>
          <span style="font-size:0.75rem; color:var(--dash-text-muted);">${escapeHtml(submeta)}</span>
        </div>
        <div style="font-size:0.8125rem; color:var(--dash-text-body); line-height:1.5;">
          This record was logged in the workspace activity feed and associated with your daily movements.
        </div>
      </div>
    `;
    const footer = `
      <button onclick="window.closeModal()" style="padding:0.45rem 0.85rem; background:none; border:1px solid var(--dash-border); border-radius:6px; font-size:0.75rem; font-weight:600; cursor:pointer; color:var(--dash-text-muted);">Close</button>
      <button onclick="window.showToast('Navigating to thread...'); window.closeModal();" style="padding:0.45rem 0.95rem; background:#111; color:#fff; border:none; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">Open in Feed</button>
    `;
    window.openModal('Activity Details', content, footer);
  };

  window.openActivityMenu = function (actId) {
    const content = `
      <div style="display:flex; flex-direction:column; gap:0.5rem;">
        <button onclick="window.closeModal(); window.openActivityRecord('${actId}')" style="text-align:left; padding:0.6rem 0.8rem; background:none; border:none; border-radius:6px; font-size:0.8125rem; font-weight:600; cursor:pointer;">
          View Full Event Log
        </button>
        <button onclick="window.showToast('Activity link copied'); window.closeModal();" style="text-align:left; padding:0.6rem 0.8rem; background:none; border:none; border-radius:6px; font-size:0.8125rem; font-weight:600; cursor:pointer;">
          Copy Activity Link
        </button>
      </div>
    `;
    window.openModal('Activity Options', content);
  };

  /**
   * Calendar Modals
   */
  window.openCalendarView = function (e) {
    if (e) e.preventDefault();
    const content = `
      <div style="display:flex; flex-direction:column; gap:0.75rem;">
        <p style="margin:0; font-size:0.8125rem; color:var(--dash-text-body);">Your scheduled events for today are synchronized with Google Calendar and Workspace Meeting Services.</p>
        <div style="display:flex; flex-direction:column; gap:0.4rem;">
          <div style="padding:0.6rem 0.8rem; background:#fff; border:1px solid var(--dash-border); border-radius:6px; font-size:0.8125rem;">09:00 · Team standup (Engineering · 30 min)</div>
          <div style="padding:0.6rem 0.8rem; background:#fff; border:1px solid var(--dash-border); border-radius:6px; font-size:0.8125rem;">10:00 · Design review (Website Redesign · 1 hr)</div>
          <div style="padding:0.6rem 0.8rem; background:#fff; border:1px solid var(--dash-border); border-radius:6px; font-size:0.8125rem;">12:00 · Lunch break</div>
          <div style="padding:0.6rem 0.8rem; background:#fff; border:1px solid var(--dash-border); border-radius:6px; font-size:0.8125rem;">14:00 · Client feedback session (Acme Co. · 1 hr)</div>
          <div style="padding:0.6rem 0.8rem; background:#fff; border:1px solid var(--dash-border); border-radius:6px; font-size:0.8125rem;">16:00 · Focus time (No meetings)</div>
        </div>
      </div>
    `;
    window.openModal('Your Day — Calendar Overview', content);
  };

  window.openCalendarEvent = function (eventId) {
    const titles = {
      'sch-1': { title: 'Team standup', time: '09:00 - 09:30', meta: 'Engineering Team · Video Call', link: 'https://meet.google.com' },
      'sch-2': { title: 'Design review', time: '10:00 - 11:00', meta: 'Website Redesign · Room 3A', link: 'https://meet.google.com' },
      'sch-3': { title: 'Lunch break', time: '12:00 - 13:00', meta: 'Personal time', link: '' },
      'sch-4': { title: 'Client feedback session', time: '14:00 - 15:00', meta: 'Acme Co. Presentation', link: 'https://meet.google.com' },
      'sch-5': { title: 'Focus time', time: '16:00 - 17:30', meta: 'Deep work · Notifications muted', link: '' }
    };
    const ev = titles[eventId] || { title: 'Calendar Event', time: 'Today', meta: 'Meeting room' };

    const content = `
      <div style="display:flex; flex-direction:column; gap:1rem;">
        <div style="background:#fff; border:1px solid var(--dash-border); border-radius:8px; padding:1rem;">
          <span style="font-size:0.6875rem; font-weight:700; color:var(--dash-text-muted); text-transform:uppercase;">${escapeHtml(ev.time)}</span>
          <h4 style="margin:0.25rem 0 0.25rem 0; font-size:1.1rem; font-weight:800;">${escapeHtml(ev.title)}</h4>
          <span style="font-size:0.75rem; color:var(--dash-text-muted);">${escapeHtml(ev.meta)}</span>
        </div>
      </div>
    `;
    const footer = `
      <button onclick="window.closeModal()" style="padding:0.45rem 0.85rem; background:none; border:1px solid var(--dash-border); border-radius:6px; font-size:0.75rem; font-weight:600; cursor:pointer; color:var(--dash-text-muted);">Close</button>
      <button onclick="window.showToast('Opening meeting room...'); window.closeModal();" style="padding:0.45rem 0.95rem; background:#111; color:#fff; border:none; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">Join Meeting</button>
    `;
    window.openModal(`Event: ${ev.title}`, content, footer);
  };

  /**
   * Needs Attention Modals
   */
  window.openBlockedTasksModal = function (e) {
    if (e) e.preventDefault();
    const content = `
      <div style="display:flex; flex-direction:column; gap:0.75rem;">
        <p style="margin:0; font-size:0.8125rem; color:var(--dash-text-body);">2 tasks are currently blocked and require your input to proceed:</p>
        <div style="display:flex; flex-direction:column; gap:0.5rem;">
          <div style="padding:0.75rem; background:#fff; border:1px solid var(--dash-border); border-radius:6px;">
            <div style="display:flex; justify-content:space-between; align-items:baseline;">
              <strong style="font-size:0.8125rem;">API Key Approval</strong>
              <span style="font-size:0.65rem; color:#E53935; font-weight:700;">Blocked</span>
            </div>
            <p style="margin:0.25rem 0 0 0; font-size:0.75rem; color:var(--dash-text-muted);">Client Application · Waiting on Staging Environment Token</p>
          </div>
          <div style="padding:0.75rem; background:#fff; border:1px solid var(--dash-border); border-radius:6px;">
            <div style="display:flex; justify-content:space-between; align-items:baseline;">
              <strong style="font-size:0.8125rem;">Brand Asset Signoff</strong>
              <span style="font-size:0.65rem; color:#E53935; font-weight:700;">Blocked</span>
            </div>
            <p style="margin:0.25rem 0 0 0; font-size:0.75rem; color:var(--dash-text-muted);">Website Redesign · Client design feedback pending</p>
          </div>
        </div>
      </div>
    `;
    const footer = `
      <button onclick="window.closeModal()" style="padding:0.45rem 0.85rem; background:none; border:1px solid var(--dash-border); border-radius:6px; font-size:0.75rem; font-weight:600; cursor:pointer; color:var(--dash-text-muted);">Close</button>
      <button onclick="window.showToast('Unblock requests sent'); window.closeModal();" style="padding:0.45rem 0.95rem; background:#111; color:#fff; border:none; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">Resolve Blockers</button>
    `;
    window.openModal('Blocked Tasks (02)', content, footer);
  };

  window.openWaitingTasksModal = function (e) {
    if (e) e.preventDefault();
    const content = `
      <div style="display:flex; flex-direction:column; gap:0.75rem;">
        <p style="margin:0; font-size:0.8125rem; color:var(--dash-text-body);">3 assigned tasks have had no updates in 2+ days:</p>
        <div style="display:flex; flex-direction:column; gap:0.5rem;">
          <div style="padding:0.75rem; background:#fff; border:1px solid var(--dash-border); border-radius:6px;">
            <strong style="font-size:0.8125rem;">Homepage Wireframes Review</strong>
            <p style="margin:0.25rem 0 0 0; font-size:0.75rem; color:var(--dash-text-muted);">Assigned to Marcus · 3 days ago</p>
          </div>
          <div style="padding:0.75rem; background:#fff; border:1px solid var(--dash-border); border-radius:6px;">
            <strong style="font-size:0.8125rem;">Staging Server Migration</strong>
            <p style="margin:0.25rem 0 0 0; font-size:0.75rem; color:var(--dash-text-muted);">Assigned to DevOps · 2 days ago</p>
          </div>
          <div style="padding:0.75rem; background:#fff; border:1px solid var(--dash-border); border-radius:6px;">
            <strong style="font-size:0.8125rem;">Color Palette Feedback</strong>
            <p style="margin:0.25rem 0 0 0; font-size:0.75rem; color:var(--dash-text-muted);">Assigned to Client · 4 days ago</p>
          </div>
        </div>
      </div>
    `;
    const footer = `
      <button onclick="window.closeModal()" style="padding:0.45rem 0.85rem; background:none; border:1px solid var(--dash-border); border-radius:6px; font-size:0.75rem; font-weight:600; cursor:pointer; color:var(--dash-text-muted);">Close</button>
      <button onclick="window.showToast('Gentle ping sent to assignees'); window.closeModal();" style="padding:0.45rem 0.95rem; background:#111; color:#fff; border:none; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">Ping Assignees</button>
    `;
    window.openModal('Tasks Waiting for Others (03)', content, footer);
  };

  window.openUnreadMentionModal = function (e) {
    if (e) e.preventDefault();
    const content = `
      <div style="display:flex; flex-direction:column; gap:1rem;">
        <div style="background:#fff; border:1px solid var(--dash-border); border-radius:8px; padding:1rem;">
          <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:0.35rem;">
            <strong style="font-size:0.875rem;">Sonia mentioned you in Website Redesign</strong>
            <span style="font-size:0.7rem; color:var(--dash-text-muted);">09:42 Today</span>
          </div>
          <p style="margin:0; font-size:0.8125rem; font-style:italic; color:var(--dash-text-body); background:rgba(0,0,0,0.03); padding:0.65rem; border-radius:6px;">
            "The new visual direction looks great. Let's make a few minor adjustments to the icon spacing."
          </p>
        </div>
        <div>
          <label style="display:block; font-size:0.75rem; font-weight:700; margin-bottom:0.35rem;">Quick Reply</label>
          <input type="text" id="mention-reply-input" placeholder="Type your reply..." style="width:100%; padding:0.6rem 0.75rem; border:1px solid var(--dash-border); border-radius:6px; font-size:0.8125rem; outline:none; background:#fff;">
        </div>
      </div>
    `;
    const footer = `
      <button onclick="window.closeModal()" style="padding:0.45rem 0.85rem; background:none; border:1px solid var(--dash-border); border-radius:6px; font-size:0.75rem; font-weight:600; cursor:pointer; color:var(--dash-text-muted);">Close</button>
      <button onclick="window.showToast('Reply posted'); window.closeModal();" style="padding:0.45rem 0.95rem; background:#111; color:#fff; border:none; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">Send Reply</button>
    `;
    window.openModal('Unread Mention (01)', content, footer);
  };

  window.openAttentionSummaryModal = function (e) {
    if (e) e.preventDefault();
    window.openBlockedTasksModal();
  };

  /**
   * Daily Update Modal
   */
  window.openDailyUpdateModal = function (e) {
    if (e) e.preventDefault();
    const content = `
      <div style="display:flex; flex-direction:column; gap:1rem;">
        <div style="background:#EFF1E2; border:1px solid var(--dash-border); border-radius:8px; padding:1rem;">
          <span style="font-size:0.6875rem; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:var(--dash-text-muted);">Daily Standup Draft</span>
          <h4 style="margin:0.25rem 0 0.5rem 0; font-size:1.05rem; font-weight:800;">Your draft is ready for review</h4>
          <p style="margin:0; font-size:0.8125rem; color:var(--dash-text-muted);">Compiled automatically from your workspace actions today.</p>
        </div>

        <div style="background:#fff; border:1px solid var(--dash-border); border-radius:8px; padding:1rem; font-size:0.8125rem; line-height:1.6;">
          <strong>What I worked on today:</strong>
          <ul style="margin:0.35rem 0 0.75rem 1.25rem; padding:0;">
            <li>Finalised website service card content and visuals.</li>
            <li>Reviewed mobile application screens for Client App.</li>
            <li>Updated homepage hero copy for Website Redesign.</li>
          </ul>

          <strong>Next focus:</strong>
          <ul style="margin:0.35rem 0 0 1.25rem; padding:0;">
            <li>Prepare Acme Co. client presentation for tomorrow.</li>
            <li>Refine brand development colour palette.</li>
          </ul>
        </div>
      </div>
    `;

    const footer = `
      <button onclick="window.closeModal()" style="padding:0.45rem 0.85rem; background:none; border:1px solid var(--dash-border); border-radius:6px; font-size:0.75rem; font-weight:600; cursor:pointer; color:var(--dash-text-muted);">Save as Draft</button>
      <button onclick="window.showToast('Daily update shared with team'); window.closeModal();" style="padding:0.45rem 0.95rem; background:#111; color:#fff; border:none; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">Share with Team ➔</button>
    `;

    window.openModal('Daily Update', content, footer);
  };

  /**
   * Real-time dynamic live clock and date updater
   */
  function startLiveDateTimeClock() {
    function updateClock() {
      const now = new Date();
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const fullDays = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

      const dow = days[now.getDay()];
      const fullDow = fullDays[now.getDay()];
      const dayNum = String(now.getDate()).padStart(2, '0');
      const month = months[now.getMonth()];
      const year = now.getFullYear();

      const dateStr = `${dow}, ${dayNum} ${month} ${year}`;

      // Update Top-Right Header Date
      const dashHeaderDate = document.getElementById('dash-header-date');
      if (dashHeaderDate) {
        dashHeaderDate.textContent = dateStr;
      }

      // Update Right rail date card
      const railCard = document.getElementById('rail-date-card');
      const isStatic = railCard && railCard.getAttribute('data-static') === 'true';

      if (!isStatic) {
        const railDay = document.getElementById('rail-day');
        const railMonth = document.getElementById('rail-month');
        const railYear = document.getElementById('rail-year');
        const railDow = document.getElementById('rail-dow');

        if (railDay) railDay.textContent = dayNum;
        if (railMonth) railMonth.textContent = month;
        if (railYear) railYear.textContent = String(year);
        if (railDow) railDow.textContent = fullDow;
      }

      // Update movements subtitle
      const actLabel = document.getElementById('activity-movements-label');
      if (actLabel) {
        actLabel.textContent = `LATEST MOVEMENTS / ${dateStr}`;
      }

      // Update hero due date
      const heroDueDay = document.getElementById('hero-due-day');
      const heroDueMy = document.getElementById('hero-due-my');
      if (heroDueDay) heroDueDay.textContent = dayNum;
      if (heroDueMy) heroDueMy.innerHTML = `${month}<br>${year}`;
    }

    updateClock();
    setInterval(updateClock, 1000);
  }

  /**
   * Main Initialization Procedure
   */
  async function init() {
    // 1. Check User Session
    try {
      if (window.Auth && typeof Auth.checkSession === 'function') {
        currentUser = await Auth.checkSession();
      }
    } catch (e) {
      console.warn('Session check skipped in dev mode');
    }

    // 2. Asynchronously load fragments (Sidebar & Navbar)
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

    // 4. Default Seed Structure (matching screenshot exactly)
    currentDashboardData = {
      workspaceBreadcrumb: 'YOUR WORKSPACE / 01',
      currentDateLabel: 'SUN, 25 OCT 2026',
      dayNumber: '25',
      month: 'OCT',
      year: '2026',
      dayOfWeek: 'SUNDAY',
      heroPriority: {
        prefix: '01 / NEXT PRIORITY',
        title: 'Finalise the website service card',
        projectTag: 'Website Redesign',
        teamTag: 'Design Team',
        priorityLabel: 'High',
        description: 'Update the content, refine the visuals and get approval from the client.',
        attachments: ['Design File', 'Client Brief', 'References', '+2'],
        dueDayNum: '25',
        dueMonthYear: 'OCT 2026',
        ctaText: 'Continue task →'
      },
      nowTasks: [
        { id: 'task-01', column: 'NOW', indexNum: '01', title: 'Review mobile app screens', tag: 'Client Application', dueDateLabel: 'Today', dotColor: 'red', completed: false },
        { id: 'task-02', column: 'NOW', indexNum: '02', title: 'Update homepage content', tag: 'Website Redesign', dueDateLabel: 'Today', dotColor: 'red', completed: false }
      ],
      nextTasks: [
        { id: 'task-03', column: 'NEXT', indexNum: '03', title: 'Prepare client presentation', tag: 'Acme Co.', dueDateLabel: 'Tomorrow', dotColor: 'orange', completed: false },
        { id: 'task-04', column: 'NEXT', indexNum: '04', title: 'Refine brand colour palette', tag: 'Brand Development', dueDateLabel: 'Fri, 27 Oct', dotColor: 'blue', completed: false }
      ],
      laterTasks: [
        { id: 'task-05', column: 'LATER', indexNum: '05', title: 'Set up analytics tracking', tag: 'Website Redesign', dueDateLabel: 'Fri, 27 Oct', dotColor: 'blue', completed: false },
        { id: 'task-06', column: 'LATER', indexNum: '06', title: 'Write project summary', tag: 'Acme Co.', dueDateLabel: 'Mon, 30 Oct', dotColor: 'gray', completed: false }
      ],
      activities: [
        {
          id: 'act-01',
          time: '09:42',
          dayLabel: 'TODAY',
          badgeType: 'COMMENT',
          dotColor: 'purple',
          author: 'Sonia',
          actionText: 'commented on',
          targetTitle: 'Design review notes',
          subMeta: 'Website Redesign / Design Team',
          quotePreview: "The new visual direction looks great. Let's make a few minor adjustments to the icon spacing."
        },
        {
          id: 'act-02',
          time: '08:15',
          dayLabel: 'TODAY',
          badgeType: 'COMPLETED',
          dotColor: 'green',
          author: 'Marcus',
          actionText: 'completed',
          targetTitle: 'Set up staging environment',
          subMeta: 'Client Application / Engineering',
          infoText: 'Task marked complete'
        },
        {
          id: 'act-03',
          time: '07:30',
          dayLabel: 'TODAY',
          badgeType: 'DOCUMENT',
          dotColor: 'amber',
          author: '',
          actionText: '',
          targetTitle: 'Product brief was updated',
          subMeta: 'Product / Workspace',
          infoText: 'Version 1.2 · 3 pages'
        },
        {
          id: 'act-04',
          time: '06:12',
          dayLabel: 'TODAY',
          badgeType: 'ASSIGNED',
          dotColor: 'blue',
          author: 'You',
          actionText: 'assigned a task to',
          targetTitle: 'Priya',
          subMeta: 'Website Redesign / Design Team',
          infoText: 'Client feedback session · Tomorrow, 2:00 PM'
        }
      ],
      schedule: [
        { id: 'sch-1', time: '09:00', title: 'Team standup', subMeta: 'Engineering · 30 min', dotColor: 'green' },
        { id: 'sch-2', time: '10:00', title: 'Design review', subMeta: 'Website Redesign · 1 hr', dotColor: 'purple' },
        { id: 'sch-3', time: '12:00', title: 'Lunch break', subMeta: '', dotColor: 'gray' },
        { id: 'sch-4', time: '14:00', title: 'Client feedback session', subMeta: 'Acme Co. · 1 hr', dotColor: 'blue' },
        { id: 'sch-5', time: '16:00', title: 'Focus time', subMeta: 'No meetings', dotColor: 'gray' }
      ],
      attentionItems: [
        { id: 'att-1', count: '02', title: 'Blocked tasks', subtitle: 'Require your input', bgType: 'peach' },
        { id: 'att-2', count: '03', title: 'Tasks waiting for others', subtitle: 'No update in 2+ days', bgType: 'neutral' },
        { id: 'att-3', count: '01', title: 'Unread mention', subtitle: 'In Website Redesign', bgType: 'neutral-light' }
      ]
    };

    // 5. Fetch Dashboard Data from Backend API if reachable
    try {
      const res = await fetch('/api/dashboard/data');
      if (res.ok) {
        const apiData = await res.json();
        if (apiData) {
          if (apiData.nowTasks && apiData.nowTasks.length > 0) currentDashboardData.nowTasks = apiData.nowTasks;
          if (apiData.nextTasks && apiData.nextTasks.length > 0) currentDashboardData.nextTasks = apiData.nextTasks;
          if (apiData.laterTasks && apiData.laterTasks.length > 0) currentDashboardData.laterTasks = apiData.laterTasks;
          if (apiData.activities && apiData.activities.length > 0) currentDashboardData.activities = apiData.activities;
          if (apiData.schedule && apiData.schedule.length > 0) currentDashboardData.schedule = apiData.schedule;
          if (apiData.attentionItems && apiData.attentionItems.length > 0) currentDashboardData.attentionItems = apiData.attentionItems;
          if (apiData.heroPriority) currentDashboardData.heroPriority = apiData.heroPriority;
        }
      }
    } catch (err) {
      console.warn('API data fetch notice, using verified dashboard state:', err);
    }

    // 6. Populate DOM Elements
    if (currentDashboardData) {
      // Hero Card
      const hero = currentDashboardData.heroPriority;
      if (hero) {
        const heroTitle = document.getElementById('hero-title');
        const heroProj = document.getElementById('hero-project-tag');
        const heroTeam = document.getElementById('hero-team-tag');
        const heroPriority = document.getElementById('hero-priority-label');
        const heroDesc = document.getElementById('hero-desc');
        const dueDay = document.getElementById('hero-due-day');
        const dueMy = document.getElementById('hero-due-my');

        if (heroTitle) heroTitle.innerHTML = (hero.title || '').includes('\n') || (hero.title || '').includes('<br>') ? hero.title : (hero.title || '').replace(' the ', ' the<br>');
        if (heroProj) heroProj.textContent = hero.projectTag;
        if (heroTeam) heroTeam.textContent = hero.teamTag;
        if (heroPriority) heroPriority.textContent = hero.priorityLabel;
        if (heroDesc) heroDesc.textContent = hero.description;
        if (dueDay && hero.dueDayNum) dueDay.textContent = hero.dueDayNum;
        if (dueMy && hero.dueMonthYear) dueMy.innerHTML = hero.dueMonthYear.replace(' ', '<br>');
      }

      // Kanban Columns
      renderTaskList(currentDashboardData.nowTasks || [], 'list-tasks-now', 'badge-count-now');
      renderTaskList(currentDashboardData.nextTasks || [], 'list-tasks-next', 'badge-count-next');
      renderTaskList(currentDashboardData.laterTasks || [], 'list-tasks-later', 'badge-count-later');
      updateTotalTaskCount();

      // Activities
      renderActivityTimeline(currentDashboardData.activities || []);

      // Schedule
      renderSchedule(currentDashboardData.schedule || []);

      // Attention
      renderAttention(currentDashboardData.attentionItems || []);
    }

    // 7. Start Real Time and Date Live Clock
    startLiveDateTimeClock();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
