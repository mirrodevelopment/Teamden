/**
 * Teamden by shed — Dashboard Logic (dashboard.js)
 * Path: pages/dashboard/dashboard.js
 *
 * Responsibilities:
 * 1. Asynchronously mounts modular Sidebar and Navbar fragments from /fragments/
 * 2. Fetches live dashboard data from /api/dashboard/data
 * 3. Renders Hero Priority Card, 3-column Kanban, Activity Timeline, and Right Rail
 * 4. Handles interactive task checkbox completion toggles
 * 5. Handles inline + Add task and + Create actions
 */

(function () {
  'use strict';

  let currentDashboardData = null;
  let currentUser = null;

  /**
   * Helper to fetch and inject external HTML fragments
   */
  async function loadFragment(url, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
      const html = await res.text();
      container.innerHTML = html;
    } catch (err) {
      console.error(`Failed to load fragment from ${url}:`, err);
    }
  }

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
                  onclick="window.toggleTaskCompletion('${task.id}')"
                  title="${task.completed ? 'Mark incomplete' : 'Mark complete'}">
          </button>
          <div class="task-content-block">
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
          <button class="task-card-menu-btn" title="Options">•••</button>
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

    container.innerHTML = activities.map(item => {
      const badgeClass = 'badge-' + (item.badgeType || 'comment').toLowerCase();
      return `
        <div class="activity-item" id="act-item-${item.id}">
          <div class="activity-time-block">
            <span class="activity-time">${escapeHtml(item.time)}</span>
            <span class="activity-day-label">${escapeHtml(item.dayLabel || 'TODAY')}</span>
          </div>
          <span class="activity-node-dot dot-${item.dotColor || 'purple'}"></span>
          
          <div class="activity-main-line">
            <span class="activity-badge ${badgeClass}">${escapeHtml(item.badgeType)}</span>
            <span class="activity-sentence">
              <strong>${escapeHtml(item.author)}</strong> ${escapeHtml(item.actionText)} <strong>${escapeHtml(item.targetTitle)}</strong>
            </span>
            <div class="activity-actions-right">
              <button class="activity-action-btn" title="View details">↗</button>
              <button class="activity-action-btn" title="Options">•••</button>
            </div>
          </div>

          ${item.subMeta ? `<div class="activity-submeta">${escapeHtml(item.subMeta)}</div>` : ''}

          ${item.quotePreview ? `
            <div class="activity-quote-box">
              "${escapeHtml(item.quotePreview)}"
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  /**
   * Render YOUR DAY Schedule Agenda
   */
  function renderSchedule(scheduleItems) {
    const container = document.getElementById('rail-schedule-list');
    if (!container) return;

    container.innerHTML = scheduleItems.map(item => `
      <div class="schedule-item">
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

    container.innerHTML = attentionItems.map(item => `
      <a href="${item.url || '#'}" class="attention-card card-${item.bgType || 'neutral'}">
        <span class="attention-count">${escapeHtml(item.count)}</span>
        <div class="attention-copy">
          <strong>${escapeHtml(item.title)}</strong>
          <span>${escapeHtml(item.subtitle)}</span>
        </div>
        <span class="attention-arrow">→</span>
      </a>
    `).join('');
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
   * Interactive Toggle Task Completion
   */
  window.toggleTaskCompletion = async function (taskId) {
    if (!currentDashboardData) return;

    // Find and toggle locally for instant feedback
    for (const list of [currentDashboardData.nowTasks, currentDashboardData.nextTasks, currentDashboardData.laterTasks]) {
      const found = list.find(t => t.id === taskId);
      if (found) {
        found.completed = !found.completed;
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

    // Notify backend
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
   * Interactive Add Task Modal / Prompt
   */
  window.openAddTaskModal = async function (column) {
    const title = prompt(`Add new task to ${column}:`);
    if (!title || !title.trim()) return;

    const tag = prompt('Enter project / category tag (e.g. Website Redesign, Client Application):', 'General');

    try {
      const res = await fetch('/api/dashboard/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ column: column, title: title.trim(), tag: tag || 'General' })
      });
      const newTask = await res.json();

      if (column === 'NEXT') {
        currentDashboardData.nextTasks.push(newTask);
        renderTaskList(currentDashboardData.nextTasks, 'list-tasks-next', 'badge-count-next');
      } else if (column === 'LATER') {
        currentDashboardData.laterTasks.push(newTask);
        renderTaskList(currentDashboardData.laterTasks, 'list-tasks-later', 'badge-count-later');
      } else {
        currentDashboardData.nowTasks.push(newTask);
        renderTaskList(currentDashboardData.nowTasks, 'list-tasks-now', 'badge-count-now');
      }
      updateTotalTaskCount();
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  /**
   * Bind topbar create action
   */
  window.triggerAddTaskPrompt = function (col) {
    window.openAddTaskModal(col || 'NOW');
  };

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

    // 4. Fetch Dashboard Data
    try {
      const res = await fetch('/api/dashboard/data');
      if (res.ok) {
        currentDashboardData = await res.json();
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      console.warn('Could not load from API, falling back to seed structure:', err);
      // Fallback seed data if offline
      currentDashboardData = {
        currentDateLabel: 'SUN, 25 OCT 2026',
        dayNumber: '25',
        month: 'OCT',
        year: '2026',
        dayOfWeek: 'SUNDAY',
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
        activities: [],
        schedule: [],
        attentionItems: []
      };
    }

    // 5. Populate DOM Elements
    if (currentDashboardData) {
      const dateEl = document.getElementById('dash-date-text');
      if (dateEl && currentDashboardData.currentDateLabel) {
        dateEl.textContent = currentDashboardData.currentDateLabel;
      }
      const actLabel = document.getElementById('activity-movements-label');
      if (actLabel && currentDashboardData.currentDateLabel) {
        actLabel.textContent = `LATEST MOVEMENTS / ${currentDashboardData.currentDateLabel}`;
      }

      // Right rail date card
      const railDay = document.getElementById('rail-day');
      const railMonth = document.getElementById('rail-month');
      const railYear = document.getElementById('rail-year');
      const railDow = document.getElementById('rail-dow');
      if (railDay) railDay.textContent = currentDashboardData.dayNumber || '25';
      if (railMonth) railMonth.textContent = currentDashboardData.month || 'OCT';
      if (railYear) railYear.textContent = currentDashboardData.year || '2026';
      if (railDow) railDow.textContent = currentDashboardData.dayOfWeek || 'SUNDAY';

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

        if (heroTitle) heroTitle.textContent = hero.title;
        if (heroProj) heroProj.textContent = hero.projectTag;
        if (heroTeam) heroTeam.textContent = hero.teamTag;
        if (heroPriority) heroPriority.textContent = hero.priorityLabel;
        if (heroDesc) heroDesc.textContent = hero.description;
        if (dueDay) dueDay.textContent = hero.dueDayNum || '25';
        if (dueMy) dueMy.innerHTML = (hero.dueMonthYear || 'OCT 2026').replace(' ', '<br>');
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

    // 6. Hook Continue Task CTA button
    const continueBtn = document.getElementById('hero-continue-btn');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        alert('Continuing: Finalise the website service card');
      });
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
