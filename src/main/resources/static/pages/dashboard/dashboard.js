/**
 * Teamden by shed — Dashboard Controller (dashboard.js)
 * Fully dynamic rendering of KPIs, assigned tasks, project progress, attendance,
 * and recent activity events from backend APIs.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Guard route: verify real authenticated session
  const currentUser = await Auth.requireAuth();
  if (!currentUser) return;

  // 2. Load reusable fragments (Navbar & Sidebar)
  await loadLayoutFragments(currentUser);

  // 3. Initialize current date and initial welcome text
  initWelcomeHeader(currentUser);

  // 4. Load full dashboard summary from backend
  await refreshDashboardData();

  // 5. Wire action modals and attendance toggles
  setupQuickActions();
});

/**
 * Loads shared HTML fragments asynchronously into placeholder containers.
 */
async function loadLayoutFragments(user) {
  try {
    const [navbarRes, sidebarRes] = await Promise.all([
      fetch('/fragments/navbar/navbar.html'),
      fetch('/fragments/sidebar/sidebar.html')
    ]);

    if (navbarRes.ok) {
      document.getElementById('navbar-container').innerHTML = await navbarRes.text();
      if (window.Navbar) Navbar.init(user);
    }
    if (sidebarRes.ok) {
      document.getElementById('sidebar-container').innerHTML = await sidebarRes.text();
      if (window.Sidebar) Sidebar.init();
    }
  } catch (err) {
    console.error('Failed to load layout fragments:', err);
  }
}

/**
 * Initializes greeting and localized date.
 */
function initWelcomeHeader(user) {
  const greetingEl = document.getElementById('welcome-heading');
  const orgEl = document.getElementById('welcome-org');
  const dateEl = document.getElementById('welcome-date');

  if (greetingEl) {
    greetingEl.textContent = `Welcome back, ${user.fullName || 'there'}!`;
  }
  if (orgEl) {
    orgEl.textContent = user.activeOrganizationName || 'Workspace';
  }
  if (dateEl) {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }
}

/**
 * Central state and refresh function.
 */
let currentProjectsList = [];

async function refreshDashboardData() {
  try {
    const summary = await Api.get('/api/dashboard/summary');
    if (!summary) return;

    // 1. Render KPIs
    renderKpis(summary.kpis || {});

    // 2. Render My Tasks
    renderMyTasks(summary.myTasks || []);

    // 3. Render Projects
    currentProjectsList = summary.projects || [];
    renderProjects(currentProjectsList);
    populateProjectDropdown(currentProjectsList);

    // 4. Render Attendance
    renderAttendance(summary.attendance || {});

    // 5. Render Activity Feed
    renderActivity(summary.recentActivity || []);

  } catch (err) {
    console.error('Error loading dashboard summary:', err);
    UI.showToast(err.message || 'Failed to load dashboard data', 'error');
  }
}

/**
 * Renders the 4 KPI metric cards with real database counts.
 */
function renderKpis(kpis) {
  document.getElementById('kpi-active-projects').textContent = kpis.activeProjects ?? 0;
  document.getElementById('kpi-open-tasks').textContent = kpis.openTasks ?? 0;
  document.getElementById('kpi-completed-tasks').textContent = kpis.tasksCompletedThisWeek ?? 0;
  document.getElementById('kpi-present-today').textContent = kpis.teamMembersPresentToday ?? 0;
}

/**
 * Renders assigned tasks table or empty state.
 */
function renderMyTasks(tasks) {
  const tbody = document.getElementById('my-tasks-tbody');
  const emptyState = document.getElementById('my-tasks-empty');
  const table = document.getElementById('my-tasks-table');

  tbody.innerHTML = '';

  if (!tasks || tasks.length === 0) {
    table.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }

  table.style.display = 'table';
  emptyState.style.display = 'none';

  tasks.forEach(task => {
    const tr = document.createElement('tr');

    const tdTitle = document.createElement('td');
    tdTitle.innerHTML = `<strong>${UI.escapeHtml(task.title)}</strong>`;

    const tdProject = document.createElement('td');
    tdProject.textContent = task.projectName || '—';

    const tdPriority = document.createElement('td');
    tdPriority.innerHTML = UI.renderPriorityBadge(task.priority);

    const tdDueDate = document.createElement('td');
    tdDueDate.textContent = UI.formatDate(task.dueDate);

    const tdStatus = document.createElement('td');
    tdStatus.innerHTML = UI.renderStatusBadge(task.status);

    tr.appendChild(tdTitle);
    tr.appendChild(tdProject);
    tr.appendChild(tdPriority);
    tr.appendChild(tdDueDate);
    tr.appendChild(tdStatus);

    tbody.appendChild(tr);
  });
}

/**
 * Renders project overview cards with calculated progress bars.
 */
function renderProjects(projects) {
  const container = document.getElementById('projects-list-container');
  const emptyState = document.getElementById('projects-empty');

  container.innerHTML = '';

  if (!projects || projects.length === 0) {
    container.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }

  container.style.display = 'flex';
  emptyState.style.display = 'none';

  projects.forEach(project => {
    const card = document.createElement('div');
    card.className = 'project-item-card';

    const progress = project.progressPercentage;
    const progressText = progress !== null ? `${progress}%` : 'No tasks yet';
    const progressWidth = progress !== null ? `${progress}%` : '0%';

    card.innerHTML = `
      <div class="project-item-header">
        <div>
          <div class="project-item-title">${UI.escapeHtml(project.name)}</div>
          ${project.description ? `<div class="project-item-desc">${UI.escapeHtml(project.description)}</div>` : ''}
        </div>
        ${UI.renderStatusBadge(project.status)}
      </div>

      <div class="progress-bar-wrapper">
        <div class="progress-bar-labels">
          <span>Progress (${project.completedTasks || 0}/${project.totalTasks || 0} tasks)</span>
          <span>${progressText}</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${progressWidth};"></div>
        </div>
      </div>

      <div class="project-meta-row">
        <span>Lead: <strong>${UI.escapeHtml(project.ownerName || 'Unassigned')}</strong></span>
        <span>Due: ${UI.formatDate(project.dueDate)}</span>
      </div>
    `;

    container.appendChild(card);
  });
}

/**
 * Populates Project dropdown in Create Task modal.
 */
function populateProjectDropdown(projects) {
  const select = document.getElementById('task-project-select');
  if (!select) return;

  select.innerHTML = '<option value="">No Project (General Workspace Task)</option>';

  projects.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    select.appendChild(opt);
  });
}

/**
 * Renders Attendance widget state and buttons.
 */
function renderAttendance(att) {
  const statusBadge = document.getElementById('attendance-user-status');
  const checkInTimeEl = document.getElementById('attendance-checkin-time');
  const checkOutTimeEl = document.getElementById('attendance-checkout-time');
  const toggleBtn = document.getElementById('widget-attendance-toggle-btn');
  const quickPunchBtn = document.getElementById('quick-action-punch-btn');
  const quickPunchText = document.getElementById('quick-punch-text');
  const widgetPunchText = document.getElementById('widget-punch-text');

  checkInTimeEl.textContent = att.checkInTime ? UI.formatTime(att.checkInTime) : '--:--';
  checkOutTimeEl.textContent = att.checkOutTime ? UI.formatTime(att.checkOutTime) : '--:--';

  if (!att.checkedIn) {
    statusBadge.className = 'badge badge-neutral';
    statusBadge.textContent = 'Not Checked In';
    widgetPunchText.textContent = 'Check In Now';
    quickPunchText.textContent = 'Punch In';
    toggleBtn.disabled = false;
    quickPunchBtn.disabled = false;
  } else if (att.checkedIn && !att.checkOutTime) {
    statusBadge.className = 'badge badge-completed';
    statusBadge.textContent = 'Checked In';
    widgetPunchText.textContent = 'Check Out';
    quickPunchText.textContent = 'Punch Out';
    toggleBtn.disabled = false;
    quickPunchBtn.disabled = false;
  } else {
    statusBadge.className = 'badge badge-in-progress';
    statusBadge.textContent = 'Completed';
    widgetPunchText.textContent = 'Shift Ended';
    quickPunchText.textContent = 'Shift Ended';
    toggleBtn.disabled = true;
    quickPunchBtn.disabled = true;
  }
}

/**
 * Renders recent activity items.
 */
function renderActivity(activities) {
  const feed = document.getElementById('activity-feed');
  const emptyState = document.getElementById('activity-empty');

  feed.innerHTML = '';

  if (!activities || activities.length === 0) {
    feed.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }

  feed.style.display = 'flex';
  emptyState.style.display = 'none';

  activities.forEach(item => {
    const el = document.createElement('div');
    el.className = 'activity-item';

    el.innerHTML = `
      <div class="activity-avatar">${UI.escapeHtml(item.actorInitials || 'SY')}</div>
      <div class="activity-content">
        <div class="activity-title">${UI.escapeHtml(item.title)}</div>
        ${item.description ? `<div class="activity-desc">${UI.escapeHtml(item.description)}</div>` : ''}
        <div class="activity-time">${UI.formatRelativeTime(item.eventTimestamp)} · by ${UI.escapeHtml(item.actorName || 'System')}</div>
      </div>
    `;

    feed.appendChild(el);
  });
}

/**
 * Sets up Quick Action modal triggers and attendance toggle handlers.
 */
function setupQuickActions() {
  // Modals
  const taskModal = document.getElementById('create-task-modal');
  const projectModal = document.getElementById('create-project-modal');

  const openTaskBtn = document.getElementById('open-create-task-modal-btn');
  const sectionTaskBtn = document.getElementById('section-new-task-btn');
  const closeTaskBtn = document.getElementById('close-task-modal-btn');
  const cancelTaskBtn = document.getElementById('cancel-task-btn');

  const openProjectBtn = document.getElementById('open-create-project-modal-btn');
  const sectionProjectBtn = document.getElementById('section-new-project-btn');
  const closeProjectBtn = document.getElementById('close-project-modal-btn');
  const cancelProjectBtn = document.getElementById('cancel-project-btn');

  const openModal = (m) => m.classList.add('open');
  const closeModal = (m) => m.classList.remove('open');

  if (openTaskBtn) openTaskBtn.addEventListener('click', () => openModal(taskModal));
  if (sectionTaskBtn) sectionTaskBtn.addEventListener('click', () => openModal(taskModal));
  if (closeTaskBtn) closeTaskBtn.addEventListener('click', () => closeModal(taskModal));
  if (cancelTaskBtn) cancelTaskBtn.addEventListener('click', () => closeModal(taskModal));

  if (openProjectBtn) openProjectBtn.addEventListener('click', () => openModal(projectModal));
  if (sectionProjectBtn) sectionProjectBtn.addEventListener('click', () => openModal(projectModal));
  if (closeProjectBtn) closeProjectBtn.addEventListener('click', () => closeModal(projectModal));
  if (cancelProjectBtn) cancelProjectBtn.addEventListener('click', () => closeModal(projectModal));

  // Close on backdrop click
  window.addEventListener('click', (e) => {
    if (e.target === taskModal) closeModal(taskModal);
    if (e.target === projectModal) closeModal(projectModal);
  });

  // Attendance Toggle handler (both quick button and card button)
  const handleAttendanceToggle = async () => {
    try {
      const summary = await Api.post('/api/dashboard/attendance/toggle');
      UI.showToast('Attendance updated successfully', 'success');
      await refreshDashboardData();
    } catch (err) {
      UI.showToast(err.message || 'Failed to update attendance', 'error');
    }
  };

  const widgetAttendanceBtn = document.getElementById('widget-attendance-toggle-btn');
  const quickPunchBtn = document.getElementById('quick-action-punch-btn');
  if (widgetAttendanceBtn) widgetAttendanceBtn.addEventListener('click', handleAttendanceToggle);
  if (quickPunchBtn) quickPunchBtn.addEventListener('click', handleAttendanceToggle);

  // Create Task form submission
  const taskForm = document.getElementById('create-task-form');
  const taskSubmitBtn = document.getElementById('submit-task-btn');
  const taskErrorAlert = document.getElementById('create-task-error');

  taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    taskErrorAlert.style.display = 'none';

    const title = document.getElementById('task-title-input').value.trim();
    const projectId = document.getElementById('task-project-select').value || null;
    const priority = document.getElementById('task-priority-select').value;
    const dueDate = document.getElementById('task-due-date-input').value || null;
    const description = document.getElementById('task-desc-input').value.trim() || null;

    if (!title) {
      taskErrorAlert.textContent = 'Please enter a task title';
      taskErrorAlert.style.display = 'block';
      return;
    }

    try {
      taskSubmitBtn.disabled = true;
      taskSubmitBtn.textContent = 'Creating...';

      await Api.post('/api/dashboard/tasks', {
        title,
        projectId,
        priority,
        dueDate,
        description
      });

      UI.showToast('Task created successfully', 'success');
      taskForm.reset();
      closeModal(taskModal);
      await refreshDashboardData();
    } catch (err) {
      taskErrorAlert.textContent = err.message || 'Failed to create task';
      taskErrorAlert.style.display = 'block';
    } finally {
      taskSubmitBtn.disabled = false;
      taskSubmitBtn.textContent = 'Create Task';
    }
  });

  // Create Project form submission
  const projectForm = document.getElementById('create-project-form');
  const projectSubmitBtn = document.getElementById('submit-project-btn');
  const projectErrorAlert = document.getElementById('create-project-error');

  projectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    projectErrorAlert.style.display = 'none';

    const name = document.getElementById('project-name-input').value.trim();
    const startDate = document.getElementById('project-start-date-input').value || null;
    const dueDate = document.getElementById('project-due-date-input').value || null;
    const description = document.getElementById('project-desc-input').value.trim() || null;

    if (!name) {
      projectErrorAlert.textContent = 'Please enter a project name';
      projectErrorAlert.style.display = 'block';
      return;
    }

    try {
      projectSubmitBtn.disabled = true;
      projectSubmitBtn.textContent = 'Creating...';

      await Api.post('/api/dashboard/projects', {
        name,
        startDate,
        dueDate,
        description
      });

      UI.showToast('Project created successfully', 'success');
      projectForm.reset();
      closeModal(projectModal);
      await refreshDashboardData();
    } catch (err) {
      projectErrorAlert.textContent = err.message || 'Failed to create project';
      projectErrorAlert.style.display = 'block';
    } finally {
      projectSubmitBtn.disabled = false;
      projectSubmitBtn.textContent = 'Create Project';
    }
  });
}
