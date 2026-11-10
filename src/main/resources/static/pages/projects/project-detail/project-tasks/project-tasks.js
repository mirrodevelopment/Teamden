/**
 * Teamden / Brick — Project Tasks Tab & Details Drawer Controller (project-tasks.js)
 * Path: pages/project/project-tasks/project-tasks.js
 *
 * Responsibilities:
 * 1. Mounts and renders Project Tasks Workspace & Details Drawer inside the target container.
 * 2. Fetches live data from /api/projects/{id}/tasks with resilient fallback to default tasks.
 * 3. Handles task selection, opening/closing the drawer, row beige highlights.
 * 4. Drawer interactions: Prev/Next task navigation, Mark Complete toggle, drawer tabs switching.
 * 5. Subtasks interactions: Checkbox completion toggle with progress bar and ratio calculation.
 * 6. Work Status summary metrics and Task Groups accordions expand/collapse.
 * 7. Real-time Search filter and View mode switcher (Register, Board, Timeline, Calendar).
 */

(function (window) {
  'use strict';

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Empty state baseline data
  const emptyTasksData = {
    id: '',
    breadcrumb: 'PROJECTS',
    title: 'Project Tasks',
    owner: 'Team',
    dueDate: '',
    status: 'Active',
    workStatus: {
      totalTasks: 0,
      todoCount: 0,
      todoPercent: '0%',
      inProgressCount: 0,
      inProgressPercent: '0%',
      inReviewCount: 0,
      inReviewPercent: '0%',
      completedCount: 0,
      completedPercent: '0%',
      blockedCount: 0,
      blockedSubtitle: 'of 0 tasks'
    },
    taskGroups: [],
    blockedTasks: [],
    tasksByMilestone: [],
    linkedKnowledge: [],
    quickActions: []
  };

  /**
   * State Management Object
   */
  const State = {
    data: emptyTasksData,
    selectedTaskId: null,
    isDrawerOpen: false,
    activeRailView: 'widgets', // 'widgets' or 'drawer'
    activeDrawerTab: 'details',
    currentView: 'register',
    searchQuery: '',

    findTask(id) {
      if (!this.data || !this.data.taskGroups) return null;
      for (const group of this.data.taskGroups) {
        if (!group.tasks) continue;
        const found = group.tasks.find(t => t.id === id);
        if (found) return found;
      }
      return null;
    },

    getAllTasks() {
      const all = [];
      if (!this.data || !this.data.taskGroups) return all;
      for (const group of this.data.taskGroups) {
        if (group.tasks) {
          all.push(...group.tasks);
        }
      }
      return all;
    }
  };

  /**
   * Component API
   */
  const ProjectTasks = {
    container: null,
    projectId: 'featured-01',

    /**
     * Mounts the Project Tasks Component
     */
    async mount(container, projectId, options = {}) {
      if (!container) return;
      this.container = container;
      this.projectId = projectId || 'featured-01';

      const drawerRail = document.getElementById('project-tasks-drawer-rail');

      // 1. Fetch template fragment if not already in container or drawerRail
      const hasWorkspace = container.querySelector('.tasks-workspace-split') || container.querySelector('.tasks-main-workspace');
      const hasWidgets = (drawerRail && drawerRail.querySelector('#tasks-overview-widgets')) || container.querySelector('#tasks-overview-widgets');
      const hasDrawer = (drawerRail && drawerRail.querySelector('#tasks-details-drawer')) || container.querySelector('#tasks-details-drawer');

      if (!hasWorkspace || !hasWidgets || !hasDrawer) {
        try {
          const res = await fetch('/pages/projects/project-detail/project-tasks/project-tasks.html?t=' + Date.now());
          if (res.ok) {
            const html = await res.text();
            if (!hasWorkspace) {
              container.innerHTML = html;
            } else {
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = html;
              const newWidgets = tempDiv.querySelector('#tasks-overview-widgets');
              const newDrawer = tempDiv.querySelector('#tasks-details-drawer');
              if (drawerRail) {
                if (!drawerRail.querySelector('#tasks-overview-widgets') && newWidgets) {
                  drawerRail.appendChild(newWidgets);
                }
                if (!drawerRail.querySelector('#tasks-details-drawer') && newDrawer) {
                  drawerRail.appendChild(newDrawer);
                }
              }
            }
          }
        } catch (err) {
          console.warn('Failed loading project-tasks.html fragment, using in-memory baseline:', err);
        }
      }

      // Relocate any widgets rail or details drawer still sitting in container into #project-tasks-drawer-rail
      if (drawerRail) {
        const widgetsInContainer = container.querySelector('#tasks-overview-widgets');
        const drawerInContainer = container.querySelector('#tasks-details-drawer');

        if (widgetsInContainer) {
          const existingWidgets = drawerRail.querySelector('#tasks-overview-widgets');
          if (existingWidgets && existingWidgets !== widgetsInContainer) {
            existingWidgets.remove();
          }
          drawerRail.appendChild(widgetsInContainer);
        }

        if (drawerInContainer) {
          const existingDrawer = drawerRail.querySelector('#tasks-details-drawer');
          if (existingDrawer && existingDrawer !== drawerInContainer) {
            existingDrawer.remove();
          }
          drawerRail.appendChild(drawerInContainer);
        }

        drawerRail.style.display = 'flex';
      }

      const contentContainer = document.querySelector('.project-content-container');
      if (contentContainer) {
        contentContainer.classList.add('tab-tasks-mode');
        contentContainer.classList.remove('drawer-closed');
      }

      // 2. Fetch live project tasks data or use empty baseline
      let data = emptyTasksData;
      if (this.projectId) {
        try {
          const res = await fetch(`/api/projects/${encodeURIComponent(this.projectId)}/tasks`);
          if (res.ok) {
            const apiData = await res.json();
            if (apiData) {
              data = apiData;
            }
          }
        } catch (netErr) {
          console.warn(`Could not fetch /api/projects/${this.projectId}/tasks:`, netErr);
        }
      }

      State.data = data;
      if (options.selectedTaskId) {
        State.selectedTaskId = options.selectedTaskId;
      }

      // 3. Populate Work Status Metrics
      this.populateWorkStatus(data.workStatus);

      // 4. Populate Right Rail Overview Widgets
      this.populateOverviewWidgets(data);

      // 5. Render or hydrate Task Groups and Rows
      this.renderTaskGroups(data.taskGroups);

      // 6. Set initial right rail view (restore drawer if it was open, or show widgets)
      if (options.showDrawer && (options.selectedTaskId || State.selectedTaskId)) {
        this.selectTask(options.selectedTaskId || State.selectedTaskId);
      } else if (options.selectedTaskId) {
        this.selectTask(options.selectedTaskId);
      } else if (State.isDrawerOpen && State.selectedTaskId) {
        this.selectTask(State.selectedTaskId);
      } else {
        this.showRailView(State.activeRailView || 'widgets');
      }

      // 7. Bind Event Listeners
      this.bindEvents();
    },

    /**
     * Populate 01 / WORK STATUS Summary Cards
     */
    populateWorkStatus(ws) {
      if (!ws) return;
      const totalEl = document.getElementById('work-status-total-val');
      if (totalEl) totalEl.textContent = ws.totalTasks != null ? ws.totalTasks : 0;

      const todoCount = document.getElementById('count-todo');
      const todoPct = document.getElementById('pct-todo');
      if (todoCount) todoCount.textContent = String(ws.todoCount != null ? ws.todoCount : 0).padStart(2, '0');
      if (todoPct) todoPct.textContent = ws.todoPercent || '0%';

      const inprogCount = document.getElementById('count-inprogress');
      const inprogPct = document.getElementById('pct-inprogress');
      if (inprogCount) inprogCount.textContent = String(ws.inProgressCount != null ? ws.inProgressCount : 0).padStart(2, '0');
      if (inprogPct) inprogPct.textContent = ws.inProgressPercent || '0%';

      const inrevCount = document.getElementById('count-inreview');
      const inrevPct = document.getElementById('pct-inreview');
      if (inrevCount) inrevCount.textContent = String(ws.inReviewCount != null ? ws.inReviewCount : 0).padStart(2, '0');
      if (inrevPct) inrevPct.textContent = ws.inReviewPercent || '0%';

      const compCount = document.getElementById('count-completed');
      const compPct = document.getElementById('pct-completed');
      if (compCount) compCount.textContent = String(ws.completedCount != null ? ws.completedCount : 0).padStart(2, '0');
      if (compPct) compPct.textContent = ws.completedPercent || '0%';

      const blockCount = document.getElementById('count-blocked');
      if (blockCount) blockCount.textContent = String(ws.blockedCount != null ? ws.blockedCount : 0).padStart(2, '0');
    },

    /**
     * Populate Tasks Overview Right Rail Widgets (Current Milestone, Blocked, Milestones, Knowledge)
     */
    populateOverviewWidgets(data) {
      if (!data) return;

      // 1. Current Milestone
      const cm = data.currentMilestone;
      const titleEl = document.getElementById('rail-milestone-title');
      const activeEl = document.getElementById('rail-active-tasks-count');
      const blockedEl = document.getElementById('rail-blocked-tasks-stat');
      if (cm) {
        if (titleEl) titleEl.textContent = cm.name || '—';
        if (activeEl) activeEl.textContent = `${cm.activeTasksCount || 0} active tasks`;
        if (blockedEl) {
          const bCount = cm.blockedTasksCount != null ? cm.blockedTasksCount : 0;
          blockedEl.innerHTML = `${bCount} blocked <svg class="triangle-icon" width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M7.134 2.5a1 1 0 0 1 1.732 0l6.062 10.5A1 1 0 0 1 14.062 14H1.938a1 1 0 0 1-.866-1.5L7.134 2.5z" fill="#EF4444"/><path d="M8 6v3.5M8 11.5v.5" stroke="#FFFFFF" stroke-width="1.4" stroke-linecap="round"/></svg>`;
        }
      } else {
        if (titleEl) titleEl.textContent = '—';
        if (activeEl) activeEl.textContent = '0 active tasks';
        if (blockedEl) blockedEl.textContent = '0 blocked';
      }

      // 2. Blocked Tasks Count & List
      const blocked = data.blockedTasks || [];
      const countEl = document.getElementById('rail-blocked-huge-count');
      if (countEl) {
        countEl.textContent = String(blocked.length).padStart(2, '0');
      }
      const bListEl = document.getElementById('rail-blocked-tasks-list');
      if (bListEl) {
        if (blocked.length > 0) {
          bListEl.innerHTML = blocked.map(b => `
            <div class="blocked-task-item" data-task-id="${escapeHtml(b.id)}" tabindex="0">
              <svg class="blocked-doc-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              <div class="blocked-item-info">
                <h5 class="blocked-item-title">${escapeHtml(b.title)}</h5>
                <span class="blocked-item-sub">${escapeHtml(b.sub || b.reason || 'Blocked')}</span>
              </div>
              <span class="blocked-item-arrow">→</span>
            </div>
          `).join('');
        } else {
          bListEl.innerHTML = '';
        }
      }

      // 3. Tasks by Milestone
      const milestones = data.tasksByMilestone || [];
      const mListEl = document.getElementById('rail-milestones-list');
      if (mListEl) {
        if (milestones.length > 0) {
          mListEl.innerHTML = milestones.map(m => `
            <div class="milestone-table-row ${m.isActive ? 'current-active' : ''}" tabindex="0" role="button" aria-label="Milestone ${escapeHtml(m.num)} ${escapeHtml(m.title)}" data-milestone-num="${escapeHtml(m.num)}" data-milestone-title="${escapeHtml(m.title)}" data-milestone-count="${m.count}">
              <span class="m-seq">${escapeHtml(m.num)}</span>
              <span class="m-status-circle ${m.isActive ? 'active-lime' : ''}"></span>
              <span class="m-name">${escapeHtml(m.title)}</span>
              <span class="m-count">${m.count} ${m.count === 1 ? 'task' : 'tasks'}</span>
              <span class="m-arrow">→</span>
            </div>
          `).join('');
        } else {
          mListEl.innerHTML = '';
        }
      }

      // 4. Linked Knowledge
      const knowledge = data.linkedKnowledge || [];
      const kListEl = document.getElementById('rail-knowledge-list');
      if (kListEl) {
        if (knowledge.length > 0) {
          kListEl.innerHTML = knowledge.map(k => `
            <div class="knowledge-link-item">
              <svg class="knowledge-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              <div class="knowledge-item-info">
                <span class="knowledge-title">${escapeHtml(k.title)}</span>
                <span class="knowledge-meta">${k.linkedTasksCount} tasks linked</span>
              </div>
              <span class="knowledge-arrow">→</span>
            </div>
          `).join('');
        } else {
          kListEl.innerHTML = '';
        }
      }
    },

    /**
     * Toggle between Right Rail Overview Widgets and Task Details Drawer
     */
    showRailView(viewName) {
      State.activeRailView = viewName;
      const widgetsRail = document.getElementById('tasks-overview-widgets');
      const drawer = document.getElementById('tasks-details-drawer');
      const drawerRail = document.getElementById('project-tasks-drawer-rail');
      const contentContainer = document.querySelector('.project-content-container');

      if (drawerRail) {
        drawerRail.style.display = 'flex';
      }

      if (viewName === 'drawer') {
        if (widgetsRail) widgetsRail.style.display = 'none';
        if (drawer) {
          drawer.style.display = 'flex';
          drawer.classList.remove('closed');
          drawer.scrollTop = 0;
        }
        if (drawerRail) {
          drawerRail.scrollTop = 0;
        }
        if (contentContainer) {
          contentContainer.classList.add('drawer-active');
        }
        State.isDrawerOpen = true;
      } else {
        if (drawer) {
          drawer.style.display = 'none';
          drawer.classList.add('closed');
        }
        if (widgetsRail) {
          widgetsRail.style.display = 'flex';
        }
        if (contentContainer) {
          contentContainer.classList.remove('drawer-active');
        }
        State.isDrawerOpen = false;
        // remove row selection highlight
        document.querySelectorAll('.task-row.selected').forEach(r => r.classList.remove('selected'));
      }
    },

    /**
     * Render Groups and Rows into Accordion Cards
     */
    renderTaskGroups(groups) {
      const gList = groups || [];

      // Helper to update each group cleanly
      const updateGroup = (key, countId, listId) => {
        const group = gList.find(g => g.key === key);
        const countPill = document.getElementById(countId);
        const listEl = document.getElementById(listId);
        const count = group ? (group.count || 0) : 0;
        if (countPill) countPill.textContent = String(count).padStart(2, '0');
        if (listEl) {
          if (group && group.tasks && group.tasks.length > 0) {
            listEl.innerHTML = group.tasks.map(t => this.renderTaskRowHtml(t)).join('');
          } else {
            listEl.innerHTML = '<div style="padding: 0.85rem 1rem; font-size: 0.8125rem; color: var(--dash-text-muted); font-style: italic;">No tasks in this group.</div>';
          }
        }
      };

      updateGroup('IN_PROGRESS', 'group-count-inprogress', 'list-in-progress');
      updateGroup('IN_REVIEW', 'group-count-inreview', 'list-in-review');
      updateGroup('TODO', 'group-count-todo', 'list-to-do');
      updateGroup('COMPLETED', 'group-count-completed', 'list-completed');
    },

    renderTaskRowHtml(task) {
      const isSelected = (task.id === State.selectedTaskId);
      const isUrgentDue = task.dueDate === '28 Oct';
      const avatarClass = 'avatar-' + (task.assigneeInitials || 'mj').toLowerCase();
      const priorityClass = 'pill-' + (task.priorityStyle || 'medium').toLowerCase();

      return `
        <div class="task-row ${isSelected ? 'selected' : ''}" data-task-id="${escapeHtml(task.id)}" tabindex="0">
          <div class="td-col td-select">
            <input type="checkbox" class="task-row-checkbox" aria-label="Select ${escapeHtml(task.title)}">
          </div>
          <div class="td-col td-task">
            <svg class="task-doc-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            <div class="task-name-desc-wrap">
              <span class="task-title-text">${escapeHtml(task.title)}</span>
              <span class="task-sub-meta">${escapeHtml(task.milestone || 'Milestone 06')} · ${task.subtasksCount || 0} subtasks${task.linkedDocsCount ? ` · ${task.linkedDocsCount} linked document${task.linkedDocsCount > 1 ? 's' : ''}` : ''}</span>
            </div>
          </div>
          <div class="td-col td-assignee">
            <span class="assignee-avatar ${avatarClass}" title="${escapeHtml(task.assigneeName || task.assigneeInitials)}">${escapeHtml(task.assigneeInitials || 'MJ')}</span>
          </div>
          <div class="td-col td-priority">
            <span class="priority-pill ${priorityClass}">${escapeHtml(task.priority || 'Medium')}</span>
          </div>
          <div class="td-col td-due">
            <span class="due-text ${isUrgentDue ? 'due-urgent' : ''}">${escapeHtml(task.dueDate || '28 Oct')}</span>
          </div>
          <div class="td-col td-links">
            ${task.attachmentsCount ? `
              <svg class="paperclip-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
              </svg>
              <span>${task.attachmentsCount}</span>
            ` : '<span>0</span>'}
          </div>
          <div class="td-col td-actions">
            <button class="row-more-btn" title="More options" aria-label="Row options">•••</button>
          </div>
        </div>
      `;
    },

    /**
     * Select a Task: updates highlight, opens drawer, hydrates content
     */
    selectTask(taskId) {
      if (!taskId) return;
      State.selectedTaskId = taskId;

      // 1. Update row highlights across all groups
      document.querySelectorAll('.task-row').forEach(row => {
        const isTarget = (row.getAttribute('data-task-id') === taskId);
        row.classList.toggle('selected', isTarget);
      });

      // 2. Switch rail to drawer view and scroll to top
      this.showRailView('drawer');
      const drawer = document.getElementById('tasks-details-drawer');
      if (drawer) drawer.scrollTop = 0;
      const drawerRail = document.getElementById('project-tasks-drawer-rail');
      if (drawerRail) drawerRail.scrollTop = 0;

      // 3. Hydrate drawer with task data
      const task = State.findTask(taskId);
      if (task) {
        this.hydrateDrawer(task);
      }
    },

    /**
     * Hydrate Task Details Drawer with Task Object
     */
    hydrateDrawer(task) {
      // Header breadcrumb
      const headerBreadcrumb = document.getElementById('drawer-header-breadcrumb');
      if (headerBreadcrumb) {
        headerBreadcrumb.textContent = `WEBSITE REDESIGN / ${task.id}`;
      }
      const seqTag = document.getElementById('drawer-task-seq');
      if (seqTag) {
        seqTag.textContent = `WEBSITE REDESIGN / ${task.id}`;
      }

      // Title
      const titleEl = document.getElementById('drawer-task-title');
      if (titleEl) {
        titleEl.textContent = (task.title || '').toLowerCase() + (task.title?.endsWith('.') ? '' : '.');
      }

      // ID Badge
      const idBadge = document.getElementById('drawer-task-id-badge');
      if (idBadge) {
        idBadge.textContent = task.id;
      }

      // Status Pills
      const pillBlocked = document.getElementById('drawer-pill-blocked');
      if (pillBlocked) {
        pillBlocked.style.display = task.isBlocked ? 'inline-flex' : 'none';
      }

      const pillStatus = document.getElementById('drawer-pill-status');
      if (pillStatus) {
        const dot = pillStatus.querySelector('.pill-dot');
        const textSpan = pillStatus.querySelector('span:not(.pill-dot)');
        if (task.completed) {
          pillStatus.className = 'drawer-pill pill-completed';
          if (dot) dot.className = 'pill-dot dot-dark';
          if (textSpan) textSpan.textContent = 'Completed';
        } else {
          pillStatus.className = 'drawer-pill pill-inprogress';
          if (dot) dot.className = 'pill-dot dot-amber';
          if (textSpan) textSpan.textContent = 'In progress';
        }
      }

      // "Mark complete" button text
      const completeBtnLabel = document.querySelector('#btn-mark-complete .btn-complete-label');
      if (completeBtnLabel) {
        completeBtnLabel.textContent = task.completed ? 'Completed' : 'Mark complete';
      }

      // 01 / Task Properties
      const avatarEl = document.getElementById('prop-avatar');
      if (avatarEl) {
        avatarEl.textContent = task.assigneeInitials || 'MJ';
        avatarEl.className = 'assignee-avatar prop-avatar avatar-' + (task.assigneeInitials || 'mj').toLowerCase();
      }
      const nameEl = document.getElementById('prop-assignee-name');
      if (nameEl) {
        nameEl.textContent = task.assigneeName || 'Maria J.';
      }

      const dueEl = document.getElementById('prop-duedate-val');
      if (dueEl) {
        dueEl.textContent = task.fullDueDate || '28 Oct 2026';
      }

      const prioEl = document.getElementById('prop-priority-val');
      if (prioEl) {
        prioEl.textContent = task.priority || 'High';
      }
      const prioDot = document.querySelector('#prop-card-priority .prop-dot');
      if (prioDot) {
        prioDot.className = 'prop-dot ' + (task.priority === 'High' ? 'dot-red' : task.priority === 'Low' ? 'dot-blue' : 'dot-amber');
      }

      const msEl = document.getElementById('prop-milestone-val');
      if (msEl) {
        msEl.textContent = task.milestoneFull || '06 / Review';
      }

      const startEl = document.getElementById('prop-startdate-val');
      if (startEl) {
        startEl.textContent = task.startDate || '12 Oct 2026';
      }

      const estEl = document.getElementById('prop-estimate-val');
      if (estEl) {
        estEl.textContent = task.timeEstimate || '12h';
      }

      // 02 / Description
      const descEl = document.getElementById('drawer-desc-text');
      if (descEl) {
        descEl.textContent = task.description || 'Implement the approved homepage design, ensuring consistent responsive behaviour and accessibility across supported devices.';
      }

      // 03 / Subtasks
      this.renderDrawerSubtasks(task);

      // 04 / Dependencies & Blockers
      this.renderDrawerDependencies(task);
    },

    /**
     * Render Subtasks Checklist in Drawer
     */
    renderDrawerSubtasks(task) {
      const listEl = document.getElementById('subtasks-list');
      if (!listEl) return;

      const subtasks = task.subtasks || [];
      const completedCount = subtasks.filter(s => s.completed).length;
      const totalCount = subtasks.length;

      // Update count & ratio
      const ratioEl = document.getElementById('subtasks-ratio-text');
      if (ratioEl) {
        ratioEl.textContent = `${completedCount} of ${totalCount} complete`;
      }
      const badgeEl = document.getElementById('dtab-sub-count');
      if (badgeEl) {
        badgeEl.textContent = `(${completedCount}/${totalCount})`;
      }

      // Update progress bar
      const barEl = document.getElementById('subtasks-progress-bar');
      if (barEl) {
        const pct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
        barEl.style.width = pct + '%';
      }

      // Render items
      listEl.innerHTML = subtasks.map((sub, idx) => {
        const avatarClass = 'avatar-' + (sub.assignee || 'mj').toLowerCase();
        return `
          <div class="subtask-row ${sub.completed ? 'completed' : ''}" data-subtask-id="${escapeHtml(sub.id || 'sub-' + idx)}">
            <button class="subtask-checkbox-btn ${sub.completed ? 'checked' : ''}" aria-label="Toggle ${escapeHtml(sub.title)}">
              ${sub.completed ? `
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ` : ''}
            </button>
            <span class="subtask-title">${escapeHtml(sub.title)}</span>
            <span class="assignee-avatar ${avatarClass} subtask-avatar">${escapeHtml(sub.assignee || 'MJ')}</span>
            <span class="subtask-date">${escapeHtml(sub.date || '20 Oct')}</span>
            <button class="subtask-more-btn" title="Subtask options">•••</button>
          </div>
        `;
      }).join('');
    },

    /**
     * Render Dependencies & Blockers Cards
     */
    renderDrawerDependencies(task) {
      const cardWaiting = document.getElementById('dep-card-waiting');
      const cardBlocker = document.getElementById('dep-card-blocker');

      if (task.isBlocked) {
        if (cardWaiting) cardWaiting.style.display = 'none';
        if (cardBlocker) {
          cardBlocker.style.display = 'flex';
          const title = cardBlocker.querySelector('.dep-title');
          const sub = cardBlocker.querySelector('.dep-subtext');
          if (title) title.textContent = task.blockerReason || 'Unresolved blocker issue';
          if (sub) sub.textContent = 'Dependent team action required.';
        }
      } else {
        // Empty state / clean stack
        if (cardWaiting) cardWaiting.style.display = 'none';
        if (cardBlocker) cardBlocker.style.display = 'none';
      }
    },

    /**
     * Event Listeners Registration
     */
    bindEvents() {
      // Ensure close button handler is always wired
      const closeBtn = document.getElementById('btn-close-drawer');
      if (closeBtn) {
        closeBtn.onclick = (e) => {
          e.preventDefault();
          this.showRailView('widgets');
        };
      }

      // Guard against duplicate delegated event listeners on container & widgetsRail
      if (this._eventsBound) return;
      this._eventsBound = true;

      const container = this.container || document;

      // 1. Task Row Click (Selection)
      container.addEventListener('click', (e) => {
        const row = e.target.closest('.task-row');
        if (row && !e.target.closest('.row-more-btn') && !e.target.closest('input[type="checkbox"]')) {
          const taskId = row.getAttribute('data-task-id');
          if (taskId) {
            this.selectTask(taskId);
          }
        }
      });

      // 2. Accordion Group Toggle
      container.addEventListener('click', (e) => {
        const header = e.target.closest('.group-header-row');
        if (header) {
          const card = header.closest('.task-group-card');
          if (card) {
            card.classList.toggle('expanded');
            card.classList.toggle('collapsed');
            const isExpanded = card.classList.contains('expanded');
            header.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
          }
        }
      });

      // 3. Right Rail Widgets Click & Keyboard Handling (Milestone Rows, Blocked Items, Quick Actions)
      const widgetsRail = document.getElementById('tasks-overview-widgets');
      if (widgetsRail) {
        widgetsRail.addEventListener('click', (e) => {
          // A. Click on Milestone Row -> Select or Unclick active milestone
          const mRow = e.target.closest('.milestone-table-row');
          if (mRow) {
            e.preventDefault();
            const isAlreadyActive = mRow.classList.contains('current-active');

            // Deselect all active rows
            widgetsRail.querySelectorAll('.milestone-table-row').forEach(r => {
              r.classList.remove('current-active');
              const circle = r.querySelector('.m-status-circle');
              if (circle) circle.classList.remove('active-lime');
            });

            const tagEl = document.querySelector('.milestone-tag');
            const titleEl = document.getElementById('rail-milestone-title');
            const activeEl = document.getElementById('rail-active-tasks-count');

            if (isAlreadyActive) {
              // Unclicked: reset top card back to default milestone state
              if (tagEl) tagEl.textContent = 'CURRENT MILESTONE / 06';
              if (titleEl) titleEl.textContent = 'Review.';
              if (activeEl) activeEl.textContent = '5 active tasks';
              return;
            }

            // Activate clicked row with neon green
            mRow.classList.add('current-active');
            const circle = mRow.querySelector('.m-status-circle');
            if (circle) circle.classList.add('active-lime');

            // Extract data
            const num = mRow.getAttribute('data-milestone-num') || mRow.querySelector('.m-seq')?.textContent?.trim() || '06';
            const title = mRow.getAttribute('data-milestone-title') || mRow.querySelector('.m-name')?.textContent?.trim() || 'Review';
            const count = mRow.getAttribute('data-milestone-count') || mRow.querySelector('.m-count')?.textContent?.trim()?.split(' ')[0] || '5';

            // Update Current Milestone top dark card
            if (tagEl) tagEl.textContent = `CURRENT MILESTONE / ${num}`;
            if (titleEl) titleEl.textContent = title.endsWith('.') ? title : `${title}.`;
            if (activeEl) activeEl.textContent = `${count} active ${count === '1' ? 'task' : 'tasks'}`;
            return;
          }

          // B. Click on Blocked Task Item -> open drawer
          const item = e.target.closest('.blocked-task-item');
          if (item) {
            e.preventDefault();
            const taskId = item.getAttribute('data-task-id');
            if (taskId) {
              this.selectTask(taskId);
            }
            return;
          }

          // C. Quick Actions
          const createBtn = e.target.closest('#qa-create-task');
          if (createBtn) {
            e.preventDefault();
            const newBtn = document.getElementById('btn-new-task');
            if (newBtn) newBtn.click();
            return;
          }

          const manageDepsBtn = e.target.closest('#qa-manage-deps');
          if (manageDepsBtn) {
            e.preventDefault();
            alert('Opening dependency management modal.');
            return;
          }
        });

        // Accessible Keyboard selection for milestone rows
        widgetsRail.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            const mRow = e.target.closest('.milestone-table-row');
            if (mRow) {
              e.preventDefault();
              mRow.click();
            }
          }
        });
      }

      // 4. Previous / Next Task Navigation
      const prevBtn = document.getElementById('btn-prev-task');
      const nextBtn = document.getElementById('btn-next-task');

      if (prevBtn) {
        prevBtn.onclick = (e) => {
          e.preventDefault();
          this.navigateTask(-1);
        };
      }
      if (nextBtn) {
        nextBtn.onclick = (e) => {
          e.preventDefault();
          this.navigateTask(1);
        };
      }

      // 5. Mark Complete Button
      const markCompleteBtn = document.getElementById('btn-mark-complete');
      if (markCompleteBtn) {
        markCompleteBtn.onclick = async (e) => {
          e.preventDefault();
          const task = State.findTask(State.selectedTaskId);
          if (!task) return;

          task.completed = !task.completed;
          this.hydrateDrawer(task);

          // Update corresponding row
          const row = document.querySelector(`.task-row[data-task-id="${task.id}"]`);
          if (row) {
            const check = row.querySelector('.task-row-checkbox');
            if (check) check.checked = task.completed;
          }
        };
      }

      // 6. Drawer Navigation Tabs Switching
      const tabButtons = document.querySelectorAll('.drawer-tab-btn');
      tabButtons.forEach(btn => {
        btn.onclick = (e) => {
          e.preventDefault();
          const tab = btn.getAttribute('data-tab');
          if (!tab) return;

          State.activeDrawerTab = tab;
          tabButtons.forEach(b => {
            const isTarget = (b === btn);
            b.classList.toggle('active', isTarget);
            b.setAttribute('aria-selected', isTarget ? 'true' : 'false');
          });

          document.querySelectorAll('.drawer-pane').forEach(pane => {
            pane.classList.remove('active');
          });
          const targetPane = document.getElementById(`dpane-${tab}`);
          if (targetPane) targetPane.classList.add('active');
          if (typeof btn.scrollIntoView === 'function') {
            btn.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
          }
        };
      });

      // 7. Subtasks Checkbox Toggle
      const subtasksList = document.getElementById('subtasks-list');
      if (subtasksList) {
        subtasksList.onclick = (e) => {
          const btn = e.target.closest('.subtask-checkbox-btn');
          if (!btn) return;

          e.preventDefault();
          const row = btn.closest('.subtask-row');
          if (!row) return;

          const subtaskId = row.getAttribute('data-subtask-id');
          const task = State.findTask(State.selectedTaskId);
          if (!task || !task.subtasks) return;

          const sub = task.subtasks.find(s => s.id === subtaskId);
          if (sub) {
            sub.completed = !sub.completed;
            this.renderDrawerSubtasks(task);
          }
        };
      }

      // 8. Add Subtask Button
      const addSubtaskBtn = document.getElementById('btn-add-subtask');
      if (addSubtaskBtn) {
        addSubtaskBtn.onclick = (e) => {
          e.preventDefault();
          const task = State.findTask(State.selectedTaskId);
          if (!task) return;
          const newTitle = prompt('Enter new subtask title:');
          if (newTitle && newTitle.trim()) {
            task.subtasks = task.subtasks || [];
            task.subtasks.push({
              id: 'sub-' + Date.now(),
              title: newTitle.trim(),
              completed: false,
              assignee: 'MJ',
              date: '31 Oct'
            });
            task.subtasksCount = task.subtasks.length;
            this.renderDrawerSubtasks(task);
          }
        };
      }

      // 9. View Switcher Pills (Register, Board, Timeline, Calendar)
      const viewButtons = container.querySelectorAll('.view-btn');
      viewButtons.forEach(btn => {
        btn.onclick = (e) => {
          e.preventDefault();
          viewButtons.forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
          });
          btn.classList.add('active');
          btn.setAttribute('aria-selected', 'true');
          State.currentView = btn.getAttribute('data-view') || 'register';
        };
      });

      // 10. Search Tasks Filter
      const searchInput = document.getElementById('tasks-search-input');
      if (searchInput) {
        searchInput.oninput = (e) => {
          const query = (e.target.value || '').toLowerCase().trim();
          State.searchQuery = query;

          const allRows = container.querySelectorAll('.task-row');
          allRows.forEach(row => {
            const titleEl = row.querySelector('.task-title-text');
            const titleText = (titleEl?.textContent || '').toLowerCase();
            const taskId = (row.getAttribute('data-task-id') || '').toLowerCase();
            const matches = !query || titleText.includes(query) || taskId.includes(query);
            row.style.display = matches ? 'flex' : 'none';
          });
        };
      }

      // 11. "More properties ∨" Toggle
      const morePropBtn = document.getElementById('btn-more-properties');
      if (morePropBtn) {
        morePropBtn.onclick = (e) => {
          e.preventDefault();
          alert('Showing additional custom fields: Sprint, Epics, Story points, Tags, and Component scope.');
        };
      }

      // 12. Resolve Blocker Link
      const resolveBtn = document.getElementById('btn-resolve-blocker');
      if (resolveBtn) {
        resolveBtn.onclick = (e) => {
          e.preventDefault();
          const task = State.findTask(State.selectedTaskId);
          if (task && confirm('Mark CMS blocker as resolved?')) {
            task.isBlocked = false;
            this.hydrateDrawer(task);
            const pillBlocked = document.getElementById('drawer-pill-blocked');
            if (pillBlocked) pillBlocked.style.display = 'none';
          }
        };
      }

      // 13. Dependency Open Task
      const openDepLink = document.getElementById('link-open-dep-task');
      if (openDepLink) {
        openDepLink.onclick = (e) => {
          e.preventDefault();
          alert('Opening dependency task T-009 (Homepage design approval).');
        };
      }
    },

    navigateTask(delta) {
      const allTasks = State.getAllTasks();
      if (!allTasks.length) return;

      const currentIndex = allTasks.findIndex(t => t.id === State.selectedTaskId);
      let newIndex = currentIndex + delta;
      if (newIndex < 0) newIndex = allTasks.length - 1;
      if (newIndex >= allTasks.length) newIndex = 0;

      const nextTask = allTasks[newIndex];
      if (nextTask) {
        this.selectTask(nextTask.id);
      }
    }
  };

  // Expose to window
  window.ProjectTasks = ProjectTasks;

})(window);
