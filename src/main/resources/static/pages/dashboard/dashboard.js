/**
 * Teamden by shed — Dashboard Controller (dashboard.js)
 * High-performance interactive controller for the Modern Workspace Dashboard.
 * Supports: Real-time task management, project creation, attendance, and theme toggling.
 */

let loggedInUser = null;
let currentSummary = null;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Guard route: verify real authenticated session
  try {
    loggedInUser = await Auth.requireAuth();
  } catch (err) {
    console.warn('Session check warning:', err);
  }

  // 2. Initialize dates, user names, and workspace context
  initDashboardHeader(loggedInUser);

  // 3. Setup interactive UI elements (modals, dropdowns, shortcuts)
  setupDashboardInteractions();

  // 4. Fetch live data from backend summary API
  await loadDashboardData();
});

/**
 * Sets current dynamic dates, weekday labels, and workspace info.
 */
function initDashboardHeader(user) {
  const now = new Date();
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const fullDayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  const weekdayShort = dayNames[now.getDay()];
  const weekdayFull = fullDayNames[now.getDay()];
  const dayNum = String(now.getDate()).padStart(2, '0');
  const monthStr = monthNames[now.getMonth()];
  const yearStr = now.getFullYear();

  // Formatted date string, e.g. "SUN, 25 OCT 2026"
  const formattedHeaderDate = `${weekdayShort}, ${dayNum} ${monthStr} ${yearStr}`;

  const headerDateEl = document.getElementById('dash-header-date');
  if (headerDateEl) headerDateEl.textContent = formattedHeaderDate;

  const activitySubtitle = document.getElementById('activity-date-subtitle');
  if (activitySubtitle) activitySubtitle.textContent = `LATEST MOVEMENTS  /  ${formattedHeaderDate}`;

  // Big Calendar Widget in Right Panel
  const calMonth = document.getElementById('cal-month-text');
  const calYear = document.getElementById('cal-year-text');
  const calDayNum = document.getElementById('cal-day-number');
  const calWeekday = document.getElementById('cal-weekday-text');

  if (calMonth) calMonth.textContent = monthStr;
  if (calYear) calYear.textContent = yearStr;
  if (calDayNum) calDayNum.textContent = dayNum;
  if (calWeekday) calWeekday.textContent = weekdayFull;

  // Next Priority Card due block
  const heroDueDay = document.getElementById('hero-due-day');
  const heroDueMonth = document.getElementById('hero-due-month');
  if (heroDueDay) heroDueDay.textContent = dayNum;
  if (heroDueMonth) heroDueMonth.textContent = `${monthStr} ${yearStr}`;

  // Workspace Name
  const wsNameEl = document.getElementById('current-workspace-name');
  if (wsNameEl && user && user.activeOrganizationName) {
    wsNameEl.textContent = user.activeOrganizationName;
  }

  // User Profile Initials Avatar (Double letter of user name)
  const avatarEl = document.getElementById('topbar-user-avatar');
  if (avatarEl) {
    let doubleLetter = 'TD';
    if (user && user.initials) {
      doubleLetter = user.initials;
    } else if (user && user.fullName) {
      const parts = user.fullName.trim().split(/\s+/);
      doubleLetter = parts.length === 1 ? parts[0].substring(0, Math.min(2, parts[0].length())).toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    avatarEl.textContent = doubleLetter;
    if (user && user.fullName) {
      avatarEl.setAttribute('title', `${user.fullName} (${user.email || ''})`);
    }
  }

  // Populate dropdown header elements
  const profileNameEl = document.getElementById('dropdown-profile-name');
  const profileEmailEl = document.getElementById('dropdown-profile-email');
  const profileRoleEl = document.getElementById('dropdown-profile-role');
  if (profileNameEl && user && user.fullName) profileNameEl.textContent = user.fullName;
  if (profileEmailEl && user && user.email) profileEmailEl.textContent = user.email;
  if (profileRoleEl && user && user.role) profileRoleEl.textContent = user.role;
}

/**
 * Loads backend summary data and updates dashboard metrics.
 */
async function loadDashboardData() {
  try {
    const summary = await Api.get('/api/dashboard/summary');
    if (!summary) return;
    currentSummary = summary;

    // Populate projects in Create Task modal
    if (summary.projects && summary.projects.length > 0) {
      populateProjectSelect(summary.projects);
    }

    // If real tasks exist, render top priority in hero card
    if (summary.myTasks && summary.myTasks.length > 0) {
      const topTask = summary.myTasks[0];
      const heroTitle = document.getElementById('hero-task-title');
      const heroProject = document.getElementById('hero-task-project');
      const heroDesc = document.getElementById('hero-task-desc');

      if (heroTitle) heroTitle.textContent = topTask.title;
      if (heroProject && topTask.projectName) heroProject.textContent = `📁 ${topTask.projectName}`;
      if (heroDesc && topTask.description) heroDesc.textContent = topTask.description;

      // Update total task count badge
      const taskCountLink = document.getElementById('view-all-tasks-link');
      if (taskCountLink) {
        const total = summary.myTasks.length;
        taskCountLink.textContent = `${String(total).padStart(2, '0')} TASKS  →`;
      }
    }

    // Update Attendance state on menu
    if (summary.attendance) {
      const isOwner = summary.attendance.ownerExempt;
      const hasCheckedIn = !!summary.attendance.checkInTime;
      const punchTextEl = document.getElementById('menu-punch-text');
      if (punchTextEl) {
        if (isOwner) {
          punchTextEl.textContent = 'Owner (Exempt)';
        } else {
          punchTextEl.textContent = hasCheckedIn ? 'Punch Out' : 'Punch In';
        }
      }
    }
  } catch (err) {
    console.warn('Backend summary load info:', err);
  }
}

/**
 * Populates Project Select dropdown.
 */
function populateProjectSelect(projects) {
  const select = document.getElementById('task-project-select');
  if (!select) return;
  select.innerHTML = '';

  projects.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    select.appendChild(opt);
  });
}

/**
 * Toggles interactive task checkbox.
 */
function toggleTaskCheckbox(checkboxEl) {
  const card = checkboxEl.closest('.task-item-box');
  if (!card) return;
  const isDone = card.classList.toggle('task-completed');
  const taskTitle = card.querySelector('.task-item-title')?.textContent || 'Task';

  if (isDone) {
    if (window.UI) UI.showToast(`Completed: ${taskTitle}`, 'success');
  }
}

/**
 * Wires modals, dropdowns, keyboard shortcuts, and theme switcher.
 */
function setupDashboardInteractions() {
  // 1. Create ⌵ Dropdown
  const createBtn = document.getElementById('topbar-create-btn');
  const createDropdown = document.getElementById('create-dropdown-menu');

  if (createBtn && createDropdown) {
    createBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      createDropdown.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      createDropdown.classList.remove('show');
    });
  }

  // 2. Modals wiring
  const taskModal = document.getElementById('create-task-modal');
  const projectModal = document.getElementById('create-project-modal');

  document.getElementById('menu-create-task')?.addEventListener('click', () => {
    openModal(taskModal);
  });

  document.getElementById('menu-create-project')?.addEventListener('click', () => {
    openModal(projectModal);
  });

  document.getElementById('close-task-modal-btn')?.addEventListener('click', () => closeModal(taskModal));
  document.getElementById('cancel-task-btn')?.addEventListener('click', () => closeModal(taskModal));

  document.getElementById('close-project-modal-btn')?.addEventListener('click', () => closeModal(projectModal));
  document.getElementById('cancel-project-btn')?.addEventListener('click', () => closeModal(projectModal));

  // 3. Create Task Form Submission
  const taskForm = document.getElementById('create-task-form');
  if (taskForm) {
    taskForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('task-title-input').value.trim();
      const projectId = document.getElementById('task-project-select').value;
      const priority = document.getElementById('task-priority-select').value;
      const dueDate = document.getElementById('task-due-date-input').value || null;
      const description = document.getElementById('task-desc-input').value.trim();

      try {
        await Api.post('/api/tasks', {
          title,
          projectId: projectId || null,
          priority,
          dueDate,
          description
        });
        closeModal(taskModal);
        taskForm.reset();
        if (window.UI) UI.showToast('Task created successfully!', 'success');
        await loadDashboardData();
      } catch (err) {
        if (window.UI) UI.showToast(err.message || 'Failed to create task', 'error');
      }
    });
  }

  // 4. Create Project Form Submission
  const projectForm = document.getElementById('create-project-form');
  if (projectForm) {
    projectForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('project-name-input').value.trim();
      const dueDate = document.getElementById('project-due-date-input').value || null;
      const description = document.getElementById('project-desc-input').value.trim();

      try {
        await Api.post('/api/projects', {
          name,
          dueDate,
          description
        });
        closeModal(projectModal);
        projectForm.reset();
        if (window.UI) UI.showToast('Project created successfully!', 'success');
        await loadDashboardData();
      } catch (err) {
        if (window.UI) UI.showToast(err.message || 'Failed to create project', 'error');
      }
    });
  }

  // 5. Hero Card Continue Task Button
  document.getElementById('hero-continue-task-btn')?.addEventListener('click', () => {
    const heroTitle = document.getElementById('hero-task-title')?.textContent || 'Current task';
    if (window.UI) UI.showToast(`Resumed focus on "${heroTitle}"`, 'info');
  });

  // 6. Theme Switcher (Warm Almond Cream / Black & White)
  const themeBtn = document.getElementById('theme-toggle-btn');
  const themeIcon = document.getElementById('theme-btn-icon');

  function updateThemeUI(t) {
    const isBW = (t === 'black-and-white' || t === 'dark');
    if (themeIcon) themeIcon.textContent = isBW ? '☀️' : '🌙';
  }

  const currentTheme = localStorage.getItem('teamden-theme') || 'light';
  updateThemeUI(currentTheme);

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const active = document.documentElement.getAttribute('data-theme') || 'light';
      const nextTheme = (active === 'light') ? 'black-and-white' : 'light';
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('teamden-theme', nextTheme);
      updateThemeUI(nextTheme);
      if (window.UI) UI.showToast(`Switched to ${nextTheme === 'light' ? 'Warm Cream' : 'Obsidian Black & White'} theme`, 'info');
    });
  }

  // 7. Global Search Shortcut (Cmd+K / Ctrl+K)
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('global-search-input')?.focus();
    }
  });

  // 8. Pinned add button
  document.getElementById('pinned-add-btn')?.addEventListener('click', () => {
    openModal(projectModal);
  });

  // 9. User profile dropdown & Sign Out
  const userProfileWrapper = document.getElementById('user-profile-wrapper');
  const userProfileDropdown = document.getElementById('user-profile-dropdown');
  const userLogoutBtn = document.getElementById('topbar-logout-btn');

  if (userProfileWrapper && userProfileDropdown) {
    userProfileWrapper.addEventListener('click', (e) => {
      e.stopPropagation();
      userProfileDropdown.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      userProfileDropdown.classList.remove('show');
    });
  }

  if (userLogoutBtn) {
    userLogoutBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (window.Auth) {
        await Auth.logout();
      } else {
        window.location.href = '/pages/login/login.html';
      }
    });
  }

  // 10. Sidebar Collapse Toggle
  const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
  const topbarSidebarToggleBtn = document.getElementById('topbar-sidebar-toggle-btn');

  function toggleSidebar(forceState) {
    const isCurrentlyCollapsed = document.body.classList.contains('dash-sidebar-collapsed');
    const newState = (typeof forceState === 'boolean') ? forceState : !isCurrentlyCollapsed;

    if (newState) {
      document.body.classList.add('dash-sidebar-collapsed');
      document.documentElement.classList.add('dash-sidebar-collapsed');
      localStorage.setItem('teamden-sidebar-collapsed', 'true');
      if (sidebarToggleBtn) sidebarToggleBtn.setAttribute('title', 'Expand Sidebar (Ctrl+[)');
    } else {
      document.body.classList.remove('dash-sidebar-collapsed');
      document.documentElement.classList.remove('dash-sidebar-collapsed');
      localStorage.setItem('teamden-sidebar-collapsed', 'false');
      if (sidebarToggleBtn) sidebarToggleBtn.setAttribute('title', 'Collapse Sidebar (Ctrl+[)');
    }

    // On mobile, also toggle drawer
    if (window.innerWidth <= 900) {
      document.body.classList.toggle('dash-sidebar-mobile-open');
    }
  }

  // Restore saved state
  if (localStorage.getItem('teamden-sidebar-collapsed') === 'true') {
    document.body.classList.add('dash-sidebar-collapsed');
    document.documentElement.classList.add('dash-sidebar-collapsed');
    if (sidebarToggleBtn) sidebarToggleBtn.setAttribute('title', 'Expand Sidebar (Ctrl+[)');
  }

  sidebarToggleBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSidebar();
  });

  topbarSidebarToggleBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSidebar();
  });

  // Keyboard shortcut Ctrl+[ or Cmd+[
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === '[' || e.key === 'b')) {
      e.preventDefault();
      toggleSidebar();
    }
  });
}

/**
 * Opens task modal with pre-selected priority.
 */
function openCreateTaskForPriority(priority) {
  const modal = document.getElementById('create-task-modal');
  const select = document.getElementById('task-priority-select');
  if (select) select.value = priority;
  openModal(modal);
}

function openModal(modal) {
  if (modal) modal.classList.add('open');
}

function closeModal(modal) {
  if (modal) modal.classList.remove('open');
}

/**
 * Handles Daily Update / Attendance punch.
 */
async function handleDailyUpdateClick() {
  try {
    const res = await Api.post('/api/attendance/check-in', {});
    if (window.UI) UI.showToast('Daily check-in recorded successfully!', 'success');
  } catch (err) {
    // If already checked in or exempt
    if (window.UI) UI.showToast(err.message || 'Daily update opened', 'info');
  }
}

function openBlockedTasks() {
  if (window.UI) UI.showToast('Filtering for 2 blocked tasks requiring attention...', 'info');
}

function openWaitingTasks() {
  if (window.UI) UI.showToast('Filtering for 3 tasks waiting for team updates...', 'info');
}

function openUnreadMentions() {
  if (window.UI) UI.showToast('Opening 1 unread mention in Website Redesign...', 'info');
}
