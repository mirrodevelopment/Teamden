/**
 * Teamden — Team Work Tab Controller (team-work.js)
 * Path: pages/team/team-detail/team-work/team-work.js
 *
 * Exposes window.TeamWork with init(teamId, customTasks).
 * Responsibilities:
 * 1. Renders Team Execution Task Register with expandable status groups (In Progress, In Review, To Do, Completed).
 * 2. Real-time filtering: All Team Work vs My Work, By Project, By Status, By Owner, and Search query.
 * 3. Task Details slide-out drawer with status changing and subtask completion toggles.
 * 4. Interactive New Task creation modal with dynamic count updates and toasts.
 * 5. Right rail: Review Desk approvals, Handoff Queue inspection, and Work by Owner filtering.
 */

(function (window) {
  'use strict';

  let currentTeamId = 'team-design';
  let activeScope = 'all'; // 'all' | 'my'
  let filterProject = 'all';
  let filterStatus = 'all';
  let filterOwner = 'all';
  let searchQuery = '';
  let selectedTaskIds = new Set();
  let expandedGroups = {
    'IN_PROGRESS': true,
    'IN_REVIEW': false,
    'TODO': false,
    'COMPLETED': false
  };

  /* ── Baseline Tasks Seed Data adhering to Screenshot & Specifications ──── */
  let TASKS = [
    // ── IN PROGRESS ────────────────────────────────────────────────────────
    {
      id: 'TASK-014',
      num: 'TASK 014',
      project: 'Website Redesign',
      title: 'Homepage interaction refinements',
      dueDate: 'Due 28 Oct 2026',
      docs: '2 linked documents',
      priority: 'High priority',
      assignee: 'MJ',
      assigneeName: 'Maria J.',
      assigneeBg: 'avatar--mj',
      status: 'IN_PROGRESS',
      statusLabel: 'In progress',
      statusClass: 'tw-status-pill--progress',
      iconType: 'purple',
      iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`,
      desc: 'Finalise interactive hero states, navigation hover feedback, and mobile drawer transitions.',
      subtasks: [
        { id: 'st1', title: 'Header elevation on scroll threshold', completed: true },
        { id: 'st2', title: 'Navigation drawer gesture handling', completed: true },
        { id: 'st3', title: 'Responsive viewport validation (390px, 768px, 1280px)', completed: false }
      ]
    },
    {
      id: 'TASK-028',
      num: 'TASK 028',
      project: 'Client Application',
      title: 'Component system development',
      dueDate: 'Due 30 Oct 2026',
      docs: '4 subtasks',
      priority: 'Normal priority',
      assignee: 'PK',
      assigneeName: 'Peter K.',
      assigneeBg: 'avatar--pk',
      status: 'IN_PROGRESS',
      statusLabel: 'In progress',
      statusClass: 'tw-status-pill--progress',
      iconType: 'blue',
      iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`,
      desc: 'Build and document core component library including button variants, input fields, and dialog wrappers.',
      subtasks: [
        { id: 'st4', title: 'Button variant token mappings', completed: true },
        { id: 'st5', title: 'Accessible focus ring styling', completed: true },
        { id: 'st6', title: 'Modal dialog focus lock', completed: false },
        { id: 'st7', title: 'Documentation & Storybook stories', completed: false }
      ]
    },
    {
      id: 'TASK-007',
      num: 'TASK 007',
      project: 'Brand Development',
      title: 'Icon set exploration',
      dueDate: 'Due 2 Nov 2026',
      docs: '1 linked document',
      priority: 'Normal priority',
      assignee: 'SK',
      assigneeName: 'Sarah K.',
      assigneeBg: 'avatar--sk',
      status: 'IN_PROGRESS',
      statusLabel: 'In progress',
      statusClass: 'tw-status-pill--progress',
      iconType: 'green',
      iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="2" x2="22" y2="6"></line><path d="M7.5 20.5 19 9l-4-4L3.5 16.5 2 22z"></path></svg>`,
      desc: 'Design set of 48 coherent line icons on 24x24 grid with standard 1.5px stroke.',
      subtasks: [
        { id: 'st8', title: 'Core system navigation icons', completed: true },
        { id: 'st9', title: 'Action and utility glyphs', completed: false }
      ]
    },
    {
      id: 'TASK-031',
      num: 'TASK 031',
      project: 'Website Redesign',
      title: 'Typography and responsive scale audit',
      dueDate: 'Due 5 Nov 2026',
      docs: '2 linked documents',
      priority: 'Normal priority',
      assignee: 'AR',
      assigneeName: 'Alex R.',
      assigneeBg: 'avatar--ar',
      status: 'IN_PROGRESS',
      statusLabel: 'In progress',
      statusClass: 'tw-status-pill--progress',
      iconType: 'purple',
      iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>`,
      desc: 'Audit all heading levels and body font scales across desktop and mobile screens.',
      subtasks: []
    },
    {
      id: 'TASK-019',
      num: 'TASK 019',
      project: 'Client Application',
      title: 'Header micro-interactions and transitions',
      dueDate: 'Due 8 Nov 2026',
      docs: '3 subtasks',
      priority: 'Normal priority',
      assignee: 'MJ',
      assigneeName: 'Maria J.',
      assigneeBg: 'avatar--mj',
      status: 'IN_PROGRESS',
      statusLabel: 'In progress',
      statusClass: 'tw-status-pill--progress',
      iconType: 'blue',
      iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
      desc: 'Add subtle interactive feedback for hover and click states across primary navigation headers.',
      subtasks: []
    },

    // ── IN REVIEW ──────────────────────────────────────────────────────────
    {
      id: 'TASK-009',
      num: 'TASK 009',
      project: 'Website Redesign',
      title: 'Mobile navigation drawer patterns',
      dueDate: 'Due 29 Oct 2026',
      docs: 'Awaiting Design Lead',
      priority: 'High priority',
      assignee: 'AR',
      assigneeName: 'Alex R.',
      assigneeBg: 'avatar--ar',
      status: 'IN_REVIEW',
      statusLabel: 'In review',
      statusClass: 'tw-status-pill--review',
      iconType: 'amber',
      iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>`,
      desc: 'Reviewed by Peter K. for ergonomic finger reach and contrast against dark backgrounds.',
      subtasks: []
    },
    {
      id: 'TASK-022',
      num: 'TASK 022',
      project: 'Client Application',
      title: 'Component spacing matrix and 8pt grid',
      dueDate: 'Due 1 Nov 2026',
      docs: 'Review requested',
      priority: 'Normal priority',
      assignee: 'PK',
      assigneeName: 'Peter K.',
      assigneeBg: 'avatar--pk',
      status: 'IN_REVIEW',
      statusLabel: 'In review',
      statusClass: 'tw-status-pill--review',
      iconType: 'blue',
      iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
      desc: 'Standardized padding and margin rules across card containers and split panels.',
      subtasks: []
    },

    // ── TO DO ──────────────────────────────────────────────────────────────
    {
      id: 'TASK-035',
      num: 'TASK 035',
      project: 'Website Redesign',
      title: 'Dark mode elevation styles and shadow tokens',
      dueDate: 'Due 10 Nov 2026',
      docs: 'Backlog item',
      priority: 'Normal priority',
      assignee: 'SK',
      assigneeName: 'Sarah K.',
      assigneeBg: 'avatar--sk',
      status: 'TODO',
      statusLabel: 'To do',
      statusClass: 'tw-status-pill--todo',
      iconType: 'purple',
      iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
      desc: 'Define box-shadow elevations and ambient lighting layers for dark theme.',
      subtasks: []
    },
    {
      id: 'TASK-042',
      num: 'TASK 042',
      project: 'Client Application',
      title: 'Form validation and inline feedback patterns',
      dueDate: 'Due 12 Nov 2026',
      docs: '3 subtasks',
      priority: 'High priority',
      assignee: 'MJ',
      assigneeName: 'Maria J.',
      assigneeBg: 'avatar--mj',
      status: 'TODO',
      statusLabel: 'To do',
      statusClass: 'tw-status-pill--todo',
      iconType: 'blue',
      iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
      desc: 'Specify accessible error, warning, and success indicators for inputs.',
      subtasks: []
    },
    {
      id: 'TASK-047',
      num: 'TASK 047',
      project: 'Brand Development',
      title: 'Editorial illustration guidelines and color harmonies',
      dueDate: 'Due 15 Nov 2026',
      docs: '1 linked document',
      priority: 'Normal priority',
      assignee: 'PK',
      assigneeName: 'Peter K.',
      assigneeBg: 'avatar--pk',
      status: 'TODO',
      statusLabel: 'To do',
      statusClass: 'tw-status-pill--todo',
      iconType: 'green',
      iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="m4.93 4.93 4.24 4.24"></path></svg>`,
      desc: 'Establish guidelines for isometric spot illustrations and product hero artwork.',
      subtasks: []
    },

    // ── COMPLETED ──────────────────────────────────────────────────────────
    {
      id: 'TASK-001',
      num: 'TASK 001',
      project: 'Website Redesign',
      title: 'Design kickoff, stakeholder brief and scope definition',
      dueDate: 'Completed 15 Oct 2026',
      docs: 'Approved reference',
      priority: 'High priority',
      assignee: 'PK',
      assigneeName: 'Peter K.',
      assigneeBg: 'avatar--pk',
      status: 'COMPLETED',
      statusLabel: 'Completed',
      statusClass: 'tw-status-pill--done',
      iconType: 'purple',
      iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
      desc: 'Project roadmap, team allocation and milestone targets approved by Product VP.',
      subtasks: []
    },
    {
      id: 'TASK-003',
      num: 'TASK 003',
      project: 'Website Redesign',
      title: 'Competitive UX benchmarking and wireframes',
      dueDate: 'Completed 18 Oct 2026',
      docs: '4 documents linked',
      priority: 'Normal priority',
      assignee: 'AR',
      assigneeName: 'Alex R.',
      assigneeBg: 'avatar--ar',
      status: 'COMPLETED',
      statusLabel: 'Completed',
      statusClass: 'tw-status-pill--done',
      iconType: 'purple',
      iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
      desc: 'Comprehensive UX research document mapping top industry peer patterns.',
      subtasks: []
    }
  ];

  /* ── Helper: Escape HTML ───────────────────────────────────────────────── */
  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function toast(msg) {
    if (typeof window.teamShowToast === 'function') {
      window.teamShowToast(msg);
    } else {
      console.log('Toast:', msg);
    }
  }

  /* ── Filtering Logic ───────────────────────────────────────────────────── */
  function getFilteredTasks() {
    return TASKS.filter(t => {
      // 1. All vs My work
      if (activeScope === 'my') {
        // My work matches Maria J. (MJ) or current authenticated user initials
        if (t.assignee !== 'MJ') return false;
      }

      // 2. Project filter
      if (filterProject !== 'all' && t.project !== filterProject) {
        return false;
      }

      // 3. Status filter
      if (filterStatus !== 'all' && t.status !== filterStatus) {
        return false;
      }

      // 4. Owner filter
      if (filterOwner !== 'all' && t.assignee !== filterOwner) {
        return false;
      }

      // 5. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchNum = t.num.toLowerCase().includes(q);
        const matchProj = t.project.toLowerCase().includes(q);
        const matchOwner = t.assigneeName.toLowerCase().includes(q);
        if (!matchTitle && !matchNum && !matchProj && !matchOwner) return false;
      }

      return true;
    });
  }

  /* ── Render Group Counts & Task Rows ───────────────────────────────────── */
  function renderTaskRegister() {
    const filtered = getFilteredTasks();

    const groups = [
      { key: 'IN_PROGRESS', label: 'IN PROGRESS', dot: 'blue', bodyId: 'body-in-progress', countId: 'count-in-progress', isBlue: true },
      { key: 'IN_REVIEW', label: 'IN REVIEW', dot: 'amber', bodyId: 'body-in-review', countId: 'count-in-review', isBlue: false },
      { key: 'TODO', label: 'TO DO', dot: 'gray', bodyId: 'body-todo', countId: 'count-todo', isBlue: false },
      { key: 'COMPLETED', label: 'COMPLETED', dot: 'green', bodyId: 'body-completed', countId: 'count-completed', isBlue: false }
    ];

    groups.forEach(g => {
      const gTasks = filtered.filter(t => t.status === g.key);
      const countEl = document.getElementById(g.countId);
      const bodyEl = document.getElementById(g.bodyId);

      if (countEl) {
        countEl.textContent = String(gTasks.length).padStart(2, '0');
      }

      if (bodyEl) {
        if (gTasks.length === 0) {
          bodyEl.innerHTML = `
            <div style="padding:1.25rem 1.5rem; color:var(--dash-text-muted); font-size:0.75rem; text-align:center;">
              No tasks in this category.
            </div>
          `;
        } else {
          bodyEl.innerHTML = gTasks.map(t => {
            const isChecked = selectedTaskIds.has(t.id);
            return `
              <div class="tw-task-row" data-task-id="${t.id}" role="button" tabindex="0">
                <input type="checkbox" class="tw-task-checkbox" ${isChecked ? 'checked' : ''} aria-label="Select task ${esc(t.title)}">
                
                <div class="tw-task-icon-wrap tw-task-icon--${t.iconType}">
                  ${t.iconSvg}
                </div>

                <div class="tw-task-info-col">
                  <span class="tw-task-meta-top">${esc(t.project)} / ${esc(t.num)}</span>
                  <strong class="tw-task-title">${esc(t.title)}</strong>
                  <div class="tw-task-meta-sub">
                    <span>${esc(t.dueDate)}</span>
                    ${t.docs ? `<span class="tw-task-meta-sep">·</span><span>${esc(t.docs)}</span>` : ''}
                    ${t.priority ? `<span class="tw-task-meta-sep">·</span><span>${esc(t.priority)}</span>` : ''}
                  </div>
                </div>

                <div class="tw-task-avatar ${t.assigneeBg}" title="${esc(t.assigneeName)}">${esc(t.assignee)}</div>
                <span class="tw-status-pill ${t.statusClass}">${esc(t.statusLabel)}</span>
                <span class="tw-task-arrow">&#8594;</span>
              </div>
            `;
          }).join('');

          // Bind checkbox events
          bodyEl.querySelectorAll('.tw-task-checkbox').forEach(chk => {
            chk.addEventListener('click', (e) => {
              e.stopPropagation();
              const row = chk.closest('.tw-task-row');
              const tId = row.getAttribute('data-task-id');
              if (chk.checked) {
                selectedTaskIds.add(tId);
                row.style.background = 'rgba(201, 243, 74, 0.15)';
              } else {
                selectedTaskIds.delete(tId);
                row.style.background = '';
              }
            });
          });

          // Bind row clicks to open drawer
          bodyEl.querySelectorAll('.tw-task-row').forEach(row => {
            row.addEventListener('click', (e) => {
              if (e.target.classList.contains('tw-task-checkbox')) return;
              const tId = row.getAttribute('data-task-id');
              const task = TASKS.find(item => item.id === tId);
              if (task) openTaskDrawer(task);
            });
          });
        }
      }
    });

    // Update Accordion display based on expanded state
    groups.forEach(g => {
      const isExp = expandedGroups[g.key];
      const grpEl = document.getElementById(`group-${g.key.toLowerCase().replace('_', '-')}`);
      const bodyEl = document.getElementById(g.bodyId);
      if (grpEl && bodyEl) {
        bodyEl.style.display = isExp ? 'block' : 'none';
        const chevron = grpEl.querySelector('.tw-group-chevron');
        if (chevron) {
          chevron.innerHTML = isExp ? '&#8963;' : '&#8964;';
        }
        const hdr = grpEl.querySelector('.tw-group-header');
        if (hdr) hdr.setAttribute('aria-expanded', isExp ? 'true' : 'false');
      }
    });
  }

  /* ── Task Details Slide-out Drawer ─────────────────────────────────────── */
  function openTaskDrawer(task) {
    const backdrop = document.getElementById('tw-drawer-backdrop');
    const projEl = document.getElementById('tw-drawer-project');
    const idEl = document.getElementById('tw-drawer-id');
    const contentEl = document.getElementById('tw-drawer-content');
    if (!backdrop || !contentEl) return;

    if (projEl) projEl.textContent = task.project;
    if (idEl) idEl.textContent = task.num;

    const subtasksHtml = (task.subtasks && task.subtasks.length > 0)
      ? `
        <div style="background:#FFFFFF; border:1px solid var(--dash-border); border-radius:8px; padding:1rem;">
          <strong style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.06em; color:var(--dash-text-muted); display:block; margin-bottom:0.75rem;">Subtasks (${task.subtasks.filter(s => s.completed).length}/${task.subtasks.length})</strong>
          <div style="display:flex; flex-direction:column; gap:0.5rem;" id="drawer-subtasks-list">
            ${task.subtasks.map(s => `
              <label style="display:flex; align-items:center; gap:0.6rem; font-size:0.78rem; color:#111; cursor:pointer;">
                <input type="checkbox" data-sub-id="${s.id}" ${s.completed ? 'checked' : ''} style="accent-color:#111;">
                <span style="${s.completed ? 'text-decoration:line-through; color:var(--dash-text-muted);' : ''}">${esc(s.title)}</span>
              </label>
            `).join('')}
          </div>
        </div>
      `
      : '';

    contentEl.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:0.4rem;">
        <span style="font-size:0.65rem; font-weight:700; letter-spacing:0.1em; color:#111; text-transform:uppercase; background:#EFF1E2; border:1px solid #DEE1CC; padding:0.2rem 0.55rem; border-radius:999px; width:fit-content;">${esc(task.statusLabel)}</span>
        <h3 style="margin:0.2rem 0 0; font-size:1.25rem; font-weight:800; color:#111; font-family:'Inter Tight', sans-serif;">${esc(task.title)}</h3>
        <p style="margin:0; font-size:0.8125rem; color:var(--dash-text-body); line-height:1.55;">${esc(task.desc || 'No detailed description provided.')}</p>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; background:#FFFFFF; border:1px solid var(--dash-border); border-radius:8px; padding:1rem;">
        <div>
          <span style="font-size:0.65rem; font-weight:700; color:var(--dash-text-muted); text-transform:uppercase;">Assignee</span>
          <div style="display:flex; align-items:center; gap:0.4rem; margin-top:0.25rem;">
            <div class="tw-task-avatar ${task.assigneeBg}" style="width:24px; height:24px; font-size:0.6rem;">${esc(task.assignee)}</div>
            <strong style="font-size:0.78rem;">${esc(task.assigneeName)}</strong>
          </div>
        </div>

        <div>
          <span style="font-size:0.65rem; font-weight:700; color:var(--dash-text-muted); text-transform:uppercase;">Due Date</span>
          <div style="margin-top:0.35rem; font-size:0.78rem; font-weight:700; color:#111;">
            ${esc(task.dueDate)}
          </div>
        </div>

        <div>
          <span style="font-size:0.65rem; font-weight:700; color:var(--dash-text-muted); text-transform:uppercase;">Priority</span>
          <div style="margin-top:0.35rem; font-size:0.78rem; font-weight:700; color:#111;">
            ${esc(task.priority || 'Normal')}
          </div>
        </div>

        <div>
          <span style="font-size:0.65rem; font-weight:700; color:var(--dash-text-muted); text-transform:uppercase;">Workflow Status</span>
          <select id="drawer-status-select" style="margin-top:0.25rem; width:100%; padding:0.3rem 0.45rem; border:1px solid var(--dash-border); border-radius:4px; font-size:0.75rem; background:#FAF7F1;">
            <option value="IN_PROGRESS" ${task.status === 'IN_PROGRESS' ? 'selected' : ''}>In progress</option>
            <option value="IN_REVIEW" ${task.status === 'IN_REVIEW' ? 'selected' : ''}>In review</option>
            <option value="TODO" ${task.status === 'TODO' ? 'selected' : ''}>To do</option>
            <option value="COMPLETED" ${task.status === 'COMPLETED' ? 'selected' : ''}>Completed</option>
          </select>
        </div>
      </div>

      ${subtasksHtml}

      <div style="display:flex; gap:0.65rem; margin-top:auto;">
        <button id="drawer-save-btn" style="flex:1; padding:0.65rem; background:#111; color:#fff; border:none; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">Done</button>
      </div>
    `;

    // Status change listener in drawer
    const selectEl = document.getElementById('drawer-status-select');
    if (selectEl) {
      selectEl.addEventListener('change', () => {
        const newStatus = selectEl.value;
        task.status = newStatus;
        if (newStatus === 'IN_PROGRESS') { task.statusLabel = 'In progress'; task.statusClass = 'tw-status-pill--progress'; }
        if (newStatus === 'IN_REVIEW') { task.statusLabel = 'In review'; task.statusClass = 'tw-status-pill--review'; }
        if (newStatus === 'TODO') { task.statusLabel = 'To do'; task.statusClass = 'tw-status-pill--todo'; }
        if (newStatus === 'COMPLETED') { task.statusLabel = 'Completed'; task.statusClass = 'tw-status-pill--done'; }
        renderTaskRegister();
        toast(`Task status updated to ${task.statusLabel}`);
      });
    }

    // Subtask checkbox toggles
    contentEl.querySelectorAll('#drawer-subtasks-list input[type="checkbox"]').forEach(chk => {
      chk.addEventListener('change', () => {
        const sId = chk.getAttribute('data-sub-id');
        const sub = task.subtasks.find(s => s.id === sId);
        if (sub) {
          sub.completed = chk.checked;
          openTaskDrawer(task); // re-render drawer
        }
      });
    });

    const saveBtn = document.getElementById('drawer-save-btn');
    if (saveBtn) saveBtn.onclick = closeTaskDrawer;

    backdrop.classList.add('open');
  }

  function closeTaskDrawer() {
    const backdrop = document.getElementById('tw-drawer-backdrop');
    if (backdrop) backdrop.classList.remove('open');
  }

  /* ── Modal Launcher (for New Task, Reviews, Handoffs) ──────────────────── */
  function openModal(title, bodyHtml, footerHtml = '') {
    let backdrop = document.getElementById('tw-modal-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'tw-modal-backdrop';
      backdrop.style.cssText = `
        position: fixed; inset: 0;
        background: rgba(17, 17, 17, 0.45);
        backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center;
        z-index: 10005;
        opacity: 0;
        transition: opacity 150ms ease;
        padding: 1.5rem;
      `;
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeModal();
      });
      document.body.appendChild(backdrop);
    }

    backdrop.innerHTML = `
      <div style="
        background: var(--dash-bg-card, #FAF7F1);
        border: 1px solid var(--dash-border, #E5E1D9);
        border-radius: 12px;
        width: 100%;
        max-width: 520px;
        box-shadow: 0 12px 36px rgba(0,0,0,0.2);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      ">
        <div style="display:flex; align-items:center; justify-content:space-between; padding: 1rem 1.25rem; border-bottom: 1px solid var(--dash-border, #E5E1D9);">
          <h3 style="margin:0; font-size:0.95rem; font-weight:700; color:var(--dash-text-primary, #111);">${esc(title)}</h3>
          <button id="tw-modal-close-btn" style="background:none; border:none; font-size:1.35rem; cursor:pointer; color:var(--dash-text-muted, #77736C); padding:0.2rem 0.4rem; line-height:1;">&times;</button>
        </div>
        <div style="padding: 1.25rem; font-size:0.8125rem; color:var(--dash-text-body, #2B2B2B); max-height:70vh; overflow-y:auto; line-height:1.55;">
          ${bodyHtml}
        </div>
        ${footerHtml ? `<div style="padding: 0.75rem 1.25rem; border-top: 1px solid var(--dash-border, #E5E1D9); background: var(--dash-bg-search, #F3EFE7); display:flex; justify-content:flex-end; gap:0.5rem;">${footerHtml}</div>` : ''}
      </div>
    `;

    document.getElementById('tw-modal-close-btn').onclick = closeModal;
    backdrop.style.opacity = '1';
  }

  function closeModal() {
    const backdrop = document.getElementById('tw-modal-backdrop');
    if (backdrop) {
      backdrop.style.opacity = '0';
      setTimeout(() => {
        if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      }, 150);
    }
  }

  /* ── Interactive Modal: Create New Task ────────────────────────────────── */
  function openNewTaskModal() {
    const content = `
      <div style="display:flex; flex-direction:column; gap:0.85rem;">
        <div>
          <label style="font-size:0.7rem; font-weight:700; color:var(--dash-text-muted); display:block; margin-bottom:0.25rem;">TASK TITLE</label>
          <input type="text" id="new-task-title" placeholder="e.g. Design tokens export for Android" style="width:100%; padding:0.5rem 0.75rem; border:1px solid var(--dash-border); border-radius:6px; background:#fff; font-size:0.8125rem;">
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.65rem;">
          <div>
            <label style="font-size:0.7rem; font-weight:700; color:var(--dash-text-muted); display:block; margin-bottom:0.25rem;">ASSOCIATED PROJECT</label>
            <select id="new-task-project" style="width:100%; padding:0.45rem; border:1px solid var(--dash-border); border-radius:6px; background:#fff; font-size:0.78rem;">
              <option value="Website Redesign">Website Redesign</option>
              <option value="Client Application">Client Application</option>
              <option value="Brand Development">Brand Development</option>
            </select>
          </div>

          <div>
            <label style="font-size:0.7rem; font-weight:700; color:var(--dash-text-muted); display:block; margin-bottom:0.25rem;">ASSIGNEE</label>
            <select id="new-task-assignee" style="width:100%; padding:0.45rem; border:1px solid var(--dash-border); border-radius:6px; background:#fff; font-size:0.78rem;">
              <option value="MJ">Maria J. (MJ)</option>
              <option value="PK">Peter K. (PK)</option>
              <option value="AR">Alex R. (AR)</option>
              <option value="SK">Sarah K. (SK)</option>
            </select>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.65rem;">
          <div>
            <label style="font-size:0.7rem; font-weight:700; color:var(--dash-text-muted); display:block; margin-bottom:0.25rem;">STATUS</label>
            <select id="new-task-status" style="width:100%; padding:0.45rem; border:1px solid var(--dash-border); border-radius:6px; background:#fff; font-size:0.78rem;">
              <option value="IN_PROGRESS">In Progress</option>
              <option value="TODO">To Do</option>
              <option value="IN_REVIEW">In Review</option>
            </select>
          </div>

          <div>
            <label style="font-size:0.7rem; font-weight:700; color:var(--dash-text-muted); display:block; margin-bottom:0.25rem;">DUE DATE</label>
            <input type="text" id="new-task-due" value="Due 12 Nov 2026" style="width:100%; padding:0.45rem; border:1px solid var(--dash-border); border-radius:6px; background:#fff; font-size:0.78rem;">
          </div>
        </div>
      </div>
    `;

    const footer = `
      <button onclick="document.getElementById('tw-modal-close-btn').click();" style="padding:0.45rem 0.85rem; background:none; border:1px solid var(--dash-border); border-radius:6px; font-size:0.75rem; cursor:pointer; color:var(--dash-text-muted);">Cancel</button>
      <button id="btn-confirm-create-task" style="padding:0.45rem 1rem; background:var(--dash-accent-lime, #C9F34A); color:#111; border:none; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">Create Task</button>
    `;

    openModal('Create New Task', content, footer);

    const confirmBtn = document.getElementById('btn-confirm-create-task');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        const titleVal = document.getElementById('new-task-title').value.trim();
        if (!titleVal) {
          toast('Please enter a task title');
          return;
        }

        const proj = document.getElementById('new-task-project').value;
        const assigneeVal = document.getElementById('new-task-assignee').value;
        const statusVal = document.getElementById('new-task-status').value;
        const dueVal = document.getElementById('new-task-due').value;

        const newTaskNum = 'TASK ' + String(Math.floor(Math.random() * 800) + 100);
        const assigneeNames = { 'MJ': 'Maria J.', 'PK': 'Peter K.', 'AR': 'Alex R.', 'SK': 'Sarah K.' };
        const assigneeBgs = { 'MJ': 'avatar--mj', 'PK': 'avatar--pk', 'AR': 'avatar--ar', 'SK': 'avatar--sk' };

        const newTask = {
          id: newTaskNum.replace(' ', '-'),
          num: newTaskNum,
          project: proj,
          title: titleVal,
          dueDate: dueVal || 'Due 15 Nov 2026',
          docs: 'New item',
          priority: 'Normal priority',
          assignee: assigneeVal,
          assigneeName: assigneeNames[assigneeVal] || 'Team Member',
          assigneeBg: assigneeBgs[assigneeVal] || 'avatar--mj',
          status: statusVal,
          statusLabel: statusVal === 'IN_PROGRESS' ? 'In progress' : (statusVal === 'IN_REVIEW' ? 'In review' : 'To do'),
          statusClass: statusVal === 'IN_PROGRESS' ? 'tw-status-pill--progress' : (statusVal === 'IN_REVIEW' ? 'tw-status-pill--review' : 'tw-status-pill--todo'),
          iconType: 'blue',
          iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`,
          desc: 'Newly created task in ' + proj,
          subtasks: []
        };

        TASKS.unshift(newTask);
        expandedGroups[statusVal] = true;
        closeModal();
        renderTaskRegister();
        toast(`Task "${titleVal}" created`);
      });
    }
  }

  /* ── Wire Interactions & Dropdowns ─────────────────────────────────────── */
  function wireEvents() {
    // 1. New Task Button
    const newBtn = document.getElementById('tw-new-task-btn');
    if (newBtn) newBtn.addEventListener('click', openNewTaskModal);

    // 2. All team work vs My work pills
    const pillAll = document.getElementById('tw-pill-all');
    const pillMy = document.getElementById('tw-pill-my');
    if (pillAll) {
      pillAll.addEventListener('click', () => {
        activeScope = 'all';
        pillAll.classList.add('active');
        pillMy.classList.remove('active');
        pillAll.setAttribute('aria-checked', 'true');
        pillMy.setAttribute('aria-checked', 'false');
        renderTaskRegister();
      });
    }
    if (pillMy) {
      pillMy.addEventListener('click', () => {
        activeScope = 'my';
        pillMy.classList.add('active');
        pillAll.classList.remove('active');
        pillMy.setAttribute('aria-checked', 'true');
        pillAll.setAttribute('aria-checked', 'false');
        renderTaskRegister();
      });
    }

    // 3. Dropdowns logic (Project, Status, Owner)
    const setupDropdown = (btnId, menuId, labelId, defaultText, onSelect) => {
      const btn = document.getElementById(btnId);
      const menu = document.getElementById(menuId);
      const label = document.getElementById(labelId);
      if (!btn || !menu) return;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = menu.classList.contains('open');
        document.querySelectorAll('.tw-dropdown-menu').forEach(m => m.classList.remove('open'));
        if (!isOpen) menu.classList.add('open');
        btn.setAttribute('aria-expanded', !isOpen);
      });

      menu.querySelectorAll('.tw-dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const val = item.getAttribute('data-val');
          menu.querySelectorAll('.tw-dropdown-item').forEach(i => i.classList.remove('active'));
          item.classList.add('active');
          menu.classList.remove('open');
          btn.setAttribute('aria-expanded', 'false');
          if (label) label.textContent = val === 'all' ? defaultText : item.textContent;
          onSelect(val);
        });
      });
    };

    setupDropdown('tw-filter-project-btn', 'tw-menu-project', 'tw-filter-project-label', 'By project', (val) => {
      filterProject = val;
      renderTaskRegister();
    });

    setupDropdown('tw-filter-status-btn', 'tw-menu-status', 'tw-filter-status-label', 'By status', (val) => {
      filterStatus = val;
      renderTaskRegister();
    });

    setupDropdown('tw-filter-owner-btn', 'tw-menu-owner', 'tw-filter-owner-label', 'By owner', (val) => {
      filterOwner = val;
      renderTaskRegister();
    });

    // Close dropdowns on outside click
    document.addEventListener('click', () => {
      document.querySelectorAll('.tw-dropdown-menu').forEach(m => m.classList.remove('open'));
      document.querySelectorAll('.tw-dropdown-btn').forEach(b => b.setAttribute('aria-expanded', 'false'));
    });

    // 4. Search Input Toggle
    const searchToggleBtn = document.getElementById('tw-search-toggle-btn');
    const searchInput = document.getElementById('tw-search-input');
    if (searchToggleBtn && searchInput) {
      searchToggleBtn.addEventListener('click', () => {
        const isOpen = searchInput.classList.contains('open');
        if (isOpen) {
          searchInput.classList.remove('open');
        } else {
          searchInput.classList.add('open');
          searchInput.focus();
        }
      });

      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderTaskRegister();
      });
    }

    // 5. Accordion expand/collapse headers
    ['in-progress', 'in-review', 'todo', 'completed'].forEach(slug => {
      const key = slug.toUpperCase().replace('-', '_');
      const grpEl = document.getElementById(`group-${slug}`);
      if (grpEl) {
        const hdr = grpEl.querySelector('.tw-group-header');
        if (hdr) {
          hdr.addEventListener('click', () => {
            expandedGroups[key] = !expandedGroups[key];
            renderTaskRegister();
          });
        }
      }
    });

    // 6. Drawer close button and backdrop click
    const drawerCloseBtn = document.getElementById('tw-drawer-close');
    const drawerBackdrop = document.getElementById('tw-drawer-backdrop');
    if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeTaskDrawer);
    if (drawerBackdrop) {
      drawerBackdrop.addEventListener('click', (e) => {
        if (e.target === drawerBackdrop) closeTaskDrawer();
      });
    }

    // 7. Right Rail: Review Desk items
    document.querySelectorAll('.tw-review-item').forEach(item => {
      item.addEventListener('click', () => {
        const rName = item.querySelector('.tw-review-name').textContent;
        openModal(
          `Review: ${rName}`,
          `
            <div style="display:flex; flex-direction:column; gap:0.75rem;">
              <span style="font-size:0.65rem; font-weight:700; letter-spacing:0.1em; color:#7A5520; text-transform:uppercase; background:#FBF3E8; border:1px solid #EADCCC; padding:0.2rem 0.5rem; border-radius:999px; width:fit-content;">REVIEW REQUIRED</span>
              <h4 style="margin:0; font-size:1.05rem;">${esc(rName)}</h4>
              <p style="margin:0; color:var(--dash-text-body);">Please inspect the typography spacing and responsive touch states before sign-off.</p>
              <div style="background:var(--dash-bg-search, #F3EFE7); padding:0.75rem; border-radius:6px; font-size:0.75rem;">
                <strong>Project:</strong> Website Redesign<br>
                <strong>Reviewer:</strong> Design Lead
              </div>
            </div>
          `,
          `
            <button onclick="document.getElementById('tw-modal-close-btn').click();" style="padding:0.4rem 0.8rem; background:none; border:1px solid var(--dash-border); border-radius:6px; font-size:0.75rem; cursor:pointer;">Cancel</button>
            <button onclick="document.getElementById('tw-modal-close-btn').click(); window.teamShowToast('Feedback sent to author');" style="padding:0.4rem 0.8rem; background:none; border:1px solid #EADCCC; border-radius:6px; font-size:0.75rem; font-weight:600; color:#7A5520; cursor:pointer;">Request Changes</button>
            <button onclick="document.getElementById('tw-modal-close-btn').click(); window.teamShowToast('Review approved');" style="padding:0.4rem 0.85rem; background:#3A6B2E; color:#fff; border:none; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">✓ Approve</button>
          `
        );
      });
    });

    const viewReviewsBtn = document.getElementById('tw-view-all-reviews-btn');
    if (viewReviewsBtn) {
      viewReviewsBtn.addEventListener('click', () => {
        filterStatus = 'IN_REVIEW';
        const statusLabel = document.getElementById('tw-filter-status-label');
        if (statusLabel) statusLabel.textContent = 'In Review';
        expandedGroups['IN_REVIEW'] = true;
        renderTaskRegister();
        toast('Filtered to reviews');
      });
    }

    // 8. Right Rail: Handoff Queue
    const openHandoffBtn = document.getElementById('tw-open-handoff-btn');
    if (openHandoffBtn) {
      openHandoffBtn.addEventListener('click', () => {
        openModal(
          'Handoff: Design Tokens & Component Specifications',
          `
            <div style="display:flex; flex-direction:column; gap:0.75rem;">
              <div style="display:flex; align-items:center; gap:0.4rem;">
                <span class="tw-flow-badge tw-flow-badge--lavender">DESIGN</span>
                <span style="color:var(--dash-text-muted);">&#8594;</span>
                <span class="tw-flow-badge tw-flow-badge--blue">ENGINEERING</span>
              </div>
              <p style="margin:0.25rem 0 0; color:var(--dash-text-body);">Package containing CSS variables, JSON tokens, and SVG assets for sprint implementation.</p>
              <div style="background:var(--dash-bg-search, #F3EFE7); padding:0.75rem; border-radius:6px; font-size:0.75rem;">
                <strong>Branch:</strong> <code>feat/v2-design-system-tokens</code><br>
                <strong>Approved by:</strong> Priya K. (Design Lead)
              </div>
            </div>
          `,
          `<button onclick="document.getElementById('tw-modal-close-btn').click();" style="padding:0.4rem 0.85rem; background:#111; color:#fff; border:none; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">Close</button>`
        );
      });
    }

    // 9. Right Rail: Work by Owner rows
    document.querySelectorAll('.tw-owner-row').forEach(row => {
      row.addEventListener('click', () => {
        const ownerKey = row.getAttribute('data-owner');
        filterOwner = ownerKey;
        const ownerLabel = document.getElementById('tw-filter-owner-label');
        if (ownerLabel) {
          const name = row.querySelector('.tw-owner-name').textContent;
          ownerLabel.textContent = name;
        }
        renderTaskRegister();
        toast(`Filtered to ${row.querySelector('.tw-owner-name').textContent}'s tasks`);
      });
    });

    const ownerViewAll = document.getElementById('tw-owner-view-all');
    if (ownerViewAll) {
      ownerViewAll.addEventListener('click', () => {
        filterOwner = 'all';
        const ownerLabel = document.getElementById('tw-filter-owner-label');
        if (ownerLabel) ownerLabel.textContent = 'By owner';
        renderTaskRegister();
        toast('Showing all owners');
      });
    }
  }

  /* ── Public API ────────────────────────────────────────────────────────── */
  const TeamWork = {
    init(teamId) {
      currentTeamId = teamId || 'team-design';
      wireEvents();
      renderTaskRegister();
    }
  };

  window.TeamWork = TeamWork;

  if (document.getElementById('team-work-root')) {
    TeamWork.init();
  }
})(window);
