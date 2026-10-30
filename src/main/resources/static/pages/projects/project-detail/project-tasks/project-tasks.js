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

  // Baseline data strictly adhering to ProjectTasksDto.java and reference screenshot
  const defaultTasksData = {
    id: 'featured-01',
    breadcrumb: 'PROJECTS / 02 / WEBSITE REDESIGN',
    title: 'website redesign.',
    owner: 'Design Team',
    dueDate: '15 Nov 2026',
    status: 'Active',
    workStatus: {
      totalTasks: 18,
      todoCount: 8,
      todoPercent: '44%',
      inProgressCount: 5,
      inProgressPercent: '28%',
      inReviewCount: 3,
      inReviewPercent: '17%',
      completedCount: 2,
      completedPercent: '11%',
      blockedCount: 2,
      blockedSubtitle: 'of 18 tasks'
    },
    taskGroups: [
      {
        key: 'IN_PROGRESS',
        label: 'IN PROGRESS',
        count: 5,
        dotColor: '#F59E0B',
        isExpanded: true,
        tasks: [
          {
            id: 'T-014',
            title: 'Homepage development',
            milestone: 'Milestone 06',
            subtasksCount: 3,
            linkedDocsCount: 2,
            assigneeInitials: 'MJ',
            assigneeName: 'Maria J.',
            assigneeColor: '#3B82F6',
            priority: 'High',
            priorityStyle: 'high',
            dueDate: '28 Oct',
            dueDateColor: '#DC2626',
            attachmentsCount: 2,
            isBlocked: true,
            blockerReason: 'Waiting for design approval',
            description: 'Implement the approved homepage design, ensuring consistent responsive behaviour and accessibility across supported devices.',
            startDate: '12 Oct 2026',
            fullDueDate: '28 Oct 2026',
            milestoneFull: '06 / Review',
            timeEstimate: '12h',
            subtasks: [
              { id: 'sub-1', title: 'Implement desktop layout', completed: true, assignee: 'MJ', date: '20 Oct' },
              { id: 'sub-2', title: 'Complete responsive behaviour', completed: false, assignee: 'PK', date: '24 Oct' },
              { id: 'sub-3', title: 'Verify accessibility', completed: false, assignee: 'SK', date: '28 Oct' }
            ],
            dependencies: [
              {
                type: 'WAITING_ON',
                tag: 'WAITING ON',
                title: 'Homepage design approval',
                subtext: 'T-009 · Awaiting review',
                actionLabel: 'Open task ↗',
                actionHref: '#task-T-009'
              },
              {
                type: 'BLOCKER',
                tag: 'BLOCKER',
                title: 'CMS content not finalised',
                subtext: 'Content team to confirm final copy and assets.',
                actionLabel: 'Resolve ↗',
                actionHref: '#resolve'
              }
            ]
          },
          {
            id: 'T-026',
            title: 'Mobile optimisation',
            milestone: 'Milestone 06',
            subtasksCount: 2,
            linkedDocsCount: 1,
            assigneeInitials: 'PK',
            assigneeName: 'Paul K.',
            assigneeColor: '#F97316',
            priority: 'Medium',
            priorityStyle: 'medium',
            dueDate: '2 Nov',
            dueDateColor: '#111111',
            attachmentsCount: 1,
            isBlocked: false,
            description: 'Refactor breakpoint queries and touch interaction targets to optimize mobile performance and responsiveness.',
            startDate: '15 Oct 2026',
            fullDueDate: '2 Nov 2026',
            milestoneFull: '06 / Review',
            timeEstimate: '8h',
            subtasks: [
              { id: 'sub-26-1', title: 'Touch target ergonomics review', completed: true, assignee: 'PK', date: '26 Oct' },
              { id: 'sub-26-2', title: 'Viewport rendering test on iOS/Android', completed: false, assignee: 'PK', date: '2 Nov' }
            ],
            dependencies: []
          },
          {
            id: 'T-028',
            title: 'CMS implementation',
            milestone: 'Milestone 06',
            subtasksCount: 4,
            linkedDocsCount: 0,
            assigneeInitials: 'AR',
            assigneeName: 'Alex R.',
            assigneeColor: '#8B5CF6',
            priority: 'Medium',
            priorityStyle: 'medium',
            dueDate: '5 Nov',
            dueDateColor: '#111111',
            attachmentsCount: 0,
            isBlocked: false,
            description: 'Integrate the headless CMS schema and setup API endpoints for dynamic hero banners and case studies.',
            startDate: '18 Oct 2026',
            fullDueDate: '5 Nov 2026',
            milestoneFull: '06 / Review',
            timeEstimate: '16h',
            subtasks: [
              { id: 'sub-28-1', title: 'Schema setup', completed: true, assignee: 'AR', date: '22 Oct' },
              { id: 'sub-28-2', title: 'Content model migrations', completed: true, assignee: 'AR', date: '27 Oct' },
              { id: 'sub-28-3', title: 'Preview webhook integration', completed: false, assignee: 'AR', date: '2 Nov' },
              { id: 'sub-28-4', title: 'Editor access permissions setup', completed: false, assignee: 'AR', date: '5 Nov' }
            ],
            dependencies: []
          },
          {
            id: 'T-031',
            title: 'Analytics setup',
            milestone: 'Milestone 06',
            subtasksCount: 2,
            linkedDocsCount: 1,
            assigneeInitials: 'SK',
            assigneeName: 'Sara K.',
            assigneeColor: '#14B8A6',
            priority: 'Low',
            priorityStyle: 'low',
            dueDate: '7 Nov',
            dueDateColor: '#111111',
            attachmentsCount: 1,
            isBlocked: false,
            description: 'Configure event tracking tags for primary user conversion funnels, outbound links, and navigation engagement.',
            startDate: '20 Oct 2026',
            fullDueDate: '7 Nov 2026',
            milestoneFull: '06 / Review',
            timeEstimate: '6h',
            subtasks: [
              { id: 'sub-31-1', title: 'Define custom events taxonomy', completed: true, assignee: 'SK', date: '25 Oct' },
              { id: 'sub-31-2', title: 'Verify tag firing in GTM preview', completed: false, assignee: 'SK', date: '7 Nov' }
            ],
            dependencies: []
          },
          {
            id: 'T-035',
            title: 'SEO optimisation',
            milestone: 'Milestone 06',
            subtasksCount: 3,
            linkedDocsCount: 0,
            assigneeInitials: 'MJ',
            assigneeName: 'Maya J.',
            assigneeColor: '#3B82F6',
            priority: 'Medium',
            priorityStyle: 'medium',
            dueDate: '10 Nov',
            dueDateColor: '#111111',
            attachmentsCount: 0,
            isBlocked: false,
            description: 'Ensure OpenGraph tags, semantic hierarchy, dynamic sitemap XML generation, and structured microdata are compliant.',
            startDate: '22 Oct 2026',
            fullDueDate: '10 Nov 2026',
            milestoneFull: '06 / Review',
            timeEstimate: '10h',
            subtasks: [
              { id: 'sub-35-1', title: 'Metadata audit on top 10 templates', completed: true, assignee: 'MJ', date: '28 Oct' },
              { id: 'sub-35-2', title: 'Schema.org JSON-LD generation', completed: false, assignee: 'MJ', date: '4 Nov' },
              { id: 'sub-35-3', title: 'Canonical URL validation', completed: false, assignee: 'MJ', date: '10 Nov' }
            ],
            dependencies: []
          }
        ]
      },
      {
        key: 'IN_REVIEW',
        label: 'IN REVIEW',
        count: 3,
        dotColor: '#3B82F6',
        isExpanded: false,
        tasks: [
          {
            id: 'T-019',
            title: 'Design system review',
            milestone: 'Milestone 06',
            subtasksCount: 2,
            linkedDocsCount: 1,
            assigneeInitials: 'SK',
            assigneeName: 'Sara K.',
            assigneeColor: '#14B8A6',
            priority: 'High',
            priorityStyle: 'high',
            dueDate: '29 Oct',
            dueDateColor: '#DC2626',
            attachmentsCount: 3,
            isBlocked: false,
            description: 'Cross-functional review of all typography tokens, button variants, and spacing systems.',
            startDate: '10 Oct 2026',
            fullDueDate: '29 Oct 2026',
            milestoneFull: '06 / Review',
            timeEstimate: '8h',
            subtasks: [
              { id: 'sub-19-1', title: 'Component audit', completed: true, assignee: 'SK', date: '20 Oct' },
              { id: 'sub-19-2', title: 'Accessibility contrast verification', completed: false, assignee: 'SK', date: '29 Oct' }
            ],
            dependencies: []
          },
          {
            id: 'T-022',
            title: 'User feedback collation',
            milestone: 'Milestone 06',
            subtasksCount: 1,
            linkedDocsCount: 2,
            assigneeInitials: 'AR',
            assigneeName: 'Alex R.',
            assigneeColor: '#8B5CF6',
            priority: 'Medium',
            priorityStyle: 'medium',
            dueDate: '1 Nov',
            dueDateColor: '#111111',
            attachmentsCount: 1,
            isBlocked: false,
            description: 'Synthesizing qualitative feedback from user testing sessions on the prototype checkout flow.',
            startDate: '15 Oct 2026',
            fullDueDate: '1 Nov 2026',
            milestoneFull: '06 / Review',
            timeEstimate: '6h',
            subtasks: [
              { id: 'sub-22-1', title: 'Tagging session highlights', completed: true, assignee: 'AR', date: '28 Oct' }
            ],
            dependencies: []
          },
          {
            id: 'T-025',
            title: 'Staging QA accessibility check',
            milestone: 'Milestone 06',
            subtasksCount: 3,
            linkedDocsCount: 0,
            assigneeInitials: 'PK',
            assigneeName: 'Paul K.',
            assigneeColor: '#F97316',
            priority: 'Low',
            priorityStyle: 'low',
            dueDate: '4 Nov',
            dueDateColor: '#111111',
            attachmentsCount: 0,
            isBlocked: false,
            description: 'Screen reader audit and keyboard tab-index flow validation on staging environment.',
            startDate: '18 Oct 2026',
            fullDueDate: '4 Nov 2026',
            milestoneFull: '06 / Review',
            timeEstimate: '8h',
            subtasks: [
              { id: 'sub-25-1', title: 'Keyboard focus indicators check', completed: true, assignee: 'PK', date: '25 Oct' },
              { id: 'sub-25-2', title: 'Aria labels verification', completed: true, assignee: 'PK', date: '30 Oct' },
              { id: 'sub-25-3', title: 'VoiceOver smoke test', completed: false, assignee: 'PK', date: '4 Nov' }
            ],
            dependencies: []
          }
        ]
      },
      {
        key: 'TODO',
        label: 'TO DO',
        count: 8,
        dotColor: '#9CA3AF',
        isExpanded: false,
        tasks: [
          {
            id: 'T-008',
            title: 'Prepare responsive tablet layouts',
            milestone: 'Milestone 06',
            subtasksCount: 2,
            linkedDocsCount: 1,
            assigneeInitials: 'AR',
            assigneeName: 'Alex R.',
            assigneeColor: '#8B5CF6',
            priority: 'Medium',
            priorityStyle: 'medium',
            dueDate: '12 Nov',
            dueDateColor: '#111111',
            attachmentsCount: 1,
            isBlocked: false,
            description: 'Design specific intermediate breakpoints for 768px-1024px viewport widths.',
            startDate: '25 Oct 2026',
            fullDueDate: '12 Nov 2026',
            milestoneFull: '06 / Review',
            timeEstimate: '10h',
            subtasks: [
              { id: 'sub-08-1', title: 'Wireframe iPad layout', completed: false, assignee: 'AR', date: '5 Nov' },
              { id: 'sub-08-2', title: 'Review flex wrapping points', completed: false, assignee: 'AR', date: '12 Nov' }
            ],
            dependencies: []
          },
          {
            id: 'T-010',
            title: 'Cookie consent banner implementation',
            milestone: 'Milestone 06',
            subtasksCount: 1,
            linkedDocsCount: 0,
            assigneeInitials: 'MJ',
            assigneeName: 'Maya J.',
            assigneeColor: '#3B82F6',
            priority: 'Low',
            priorityStyle: 'low',
            dueDate: '14 Nov',
            dueDateColor: '#111111',
            attachmentsCount: 0,
            isBlocked: false,
            description: 'Implement GDPR-compliant banner with category toggles and local storage preference caching.',
            startDate: '28 Oct 2026',
            fullDueDate: '14 Nov 2026',
            milestoneFull: '06 / Review',
            timeEstimate: '5h',
            subtasks: [
              { id: 'sub-10-1', title: 'Build consent modal UI', completed: false, assignee: 'MJ', date: '14 Nov' }
            ],
            dependencies: []
          }
        ]
      },
      {
        key: 'COMPLETED',
        label: 'COMPLETED',
        count: 2,
        dotColor: '#10B981',
        isCheckIcon: true,
        isExpanded: false,
        tasks: [
          {
            id: 'T-001',
            title: 'Brand audit & color token definition',
            milestone: 'Milestone 05',
            subtasksCount: 4,
            linkedDocsCount: 3,
            assigneeInitials: 'MJ',
            assigneeName: 'Maya J.',
            assigneeColor: '#3B82F6',
            priority: 'High',
            priorityStyle: 'high',
            dueDate: '20 Oct',
            dueDateColor: '#666666',
            attachmentsCount: 2,
            isBlocked: false,
            description: 'Comprehensive audit of legacy brand assets and synthesis into modern design tokens.',
            startDate: '1 Oct 2026',
            fullDueDate: '20 Oct 2026',
            milestoneFull: '05 / Content',
            timeEstimate: '18h',
            subtasks: [
              { id: 'sub-01-1', title: 'Export color palette', completed: true, assignee: 'MJ', date: '10 Oct' },
              { id: 'sub-01-2', title: 'Define CSS variables', completed: true, assignee: 'MJ', date: '15 Oct' },
              { id: 'sub-01-3', title: 'Document usage guidelines', completed: true, assignee: 'MJ', date: '18 Oct' },
              { id: 'sub-01-4', title: 'Team sign-off', completed: true, assignee: 'MJ', date: '20 Oct' }
            ],
            dependencies: []
          },
          {
            id: 'T-004',
            title: 'User persona research synthesis',
            milestone: 'Milestone 05',
            subtasksCount: 3,
            linkedDocsCount: 2,
            assigneeInitials: 'SK',
            assigneeName: 'Sara K.',
            assigneeColor: '#14B8A6',
            priority: 'Medium',
            priorityStyle: 'medium',
            dueDate: '24 Oct',
            dueDateColor: '#666666',
            attachmentsCount: 1,
            isBlocked: false,
            description: 'Synthesis of 15 user interviews into 3 target enterprise personas.',
            startDate: '5 Oct 2026',
            fullDueDate: '24 Oct 2026',
            milestoneFull: '05 / Content',
            timeEstimate: '12h',
            subtasks: [
              { id: 'sub-04-1', title: 'Collate interview recordings', completed: true, assignee: 'SK', date: '12 Oct' },
              { id: 'sub-04-2', title: 'Draft persona decks', completed: true, assignee: 'SK', date: '18 Oct' },
              { id: 'sub-04-3', title: 'Stakeholder presentation', completed: true, assignee: 'SK', date: '24 Oct' }
            ],
            dependencies: []
          }
        ]
      }
    ],
    currentMilestone: {
      number: '06',
      name: 'Review.',
      activeTasksCount: 5,
      blockedTasksCount: 2,
      progressPercent: 80
    },
    blockedTasks: [
      { id: 'T-014', title: 'Homepage development', reason: 'Waiting for design approval' },
      { id: 'T-026', title: 'Content migration', reason: 'Dependent on CMS access' }
    ],
    tasksByMilestone: [
      { num: '03', title: 'Development', count: 5, isActive: false },
      { num: '04', title: 'Testing', count: 4, isActive: false },
      { num: '05', title: 'Content', count: 3, isActive: false },
      { num: '06', title: 'Review', count: 5, isActive: true },
      { num: '07', title: 'Launch Prep', count: 1, isActive: false }
    ],
    linkedKnowledge: [
      { title: 'Homepage Design Brief', linkedTasksCount: 3, icon: 'file' },
      { title: 'Content Strategy', linkedTasksCount: 2, icon: 'file' },
      { title: 'Brand Guidelines', linkedTasksCount: 1, icon: 'link' }
    ],
    quickActions: [
      { actionKey: 'create_task', title: 'Create new task', icon: 'plus' },
      { actionKey: 'import_doc', title: 'Import from document', icon: 'file-text' },
      { actionKey: 'manage_deps', title: 'Manage dependencies', icon: 'workflow' }
    ]
  };

  /**
   * State Management Object
   */
  const State = {
    data: defaultTasksData,
    selectedTaskId: 'T-014',
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

      // 2. Fetch live project tasks data or use default
      let data = defaultTasksData;
      if (this.projectId) {
        try {
          const res = await fetch(`/api/projects/${encodeURIComponent(this.projectId)}/tasks`);
          if (res.ok) {
            const apiData = await res.json();
            if (apiData && apiData.taskGroups && apiData.taskGroups.length > 0) {
              data = this.mergeWithDefaults(apiData);
            }
          }
        } catch (netErr) {
          console.warn(`Could not fetch /api/projects/${this.projectId}/tasks, using default tasks:`, netErr);
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
      if (options.showDrawer) {
        this.selectTask(options.selectedTaskId || State.selectedTaskId || 'T-014');
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

    mergeWithDefaults(apiData) {
      // Keep rich subtasks and description from defaults if API returns standard DTO
      const defaultTasksMap = new Map();
      defaultTasksData.taskGroups.forEach(g => {
        g.tasks.forEach(t => defaultTasksMap.set(t.id, t));
      });

      const mergedGroups = apiData.taskGroups.map(group => {
        const tasks = (group.tasks || []).map(task => {
          const def = defaultTasksMap.get(task.id) || {};
          return {
            ...def,
            ...task,
            subtasks: def.subtasks || task.subtasks || [],
            dependencies: def.dependencies || task.dependencies || [],
            description: def.description || task.description || 'Task specification and acceptance criteria.',
            startDate: def.startDate || task.startDate || '12 Oct 2026',
            fullDueDate: def.fullDueDate || task.fullDueDate || (task.dueDate ? `${task.dueDate} 2026` : '28 Oct 2026'),
            milestoneFull: def.milestoneFull || (task.milestone ? `${task.milestone.replace('Milestone ', '')} / Review` : '06 / Review'),
            timeEstimate: def.timeEstimate || '12h'
          };
        });
        return {
          ...group,
          tasks
        };
      });

      return {
        ...defaultTasksData,
        ...apiData,
        taskGroups: mergedGroups
      };
    },

    /**
     * Populate 01 / WORK STATUS Summary Cards
     */
    populateWorkStatus(ws) {
      if (!ws) return;
      const totalEl = document.getElementById('work-status-total-val');
      if (totalEl) totalEl.textContent = ws.totalTasks || 18;

      const todoCount = document.getElementById('count-todo');
      const todoPct = document.getElementById('pct-todo');
      if (todoCount) todoCount.textContent = String(ws.todoCount).padStart(2, '0');
      if (todoPct) todoPct.textContent = ws.todoPercent || '44%';

      const inprogCount = document.getElementById('count-inprogress');
      const inprogPct = document.getElementById('pct-inprogress');
      if (inprogCount) inprogCount.textContent = String(ws.inProgressCount).padStart(2, '0');
      if (inprogPct) inprogPct.textContent = ws.inProgressPercent || '28%';

      const inrevCount = document.getElementById('count-inreview');
      const inrevPct = document.getElementById('pct-inreview');
      if (inrevCount) inrevCount.textContent = String(ws.inReviewCount).padStart(2, '0');
      if (inrevPct) inrevPct.textContent = ws.inReviewPercent || '17%';

      const compCount = document.getElementById('count-completed');
      const compPct = document.getElementById('pct-completed');
      if (compCount) compCount.textContent = String(ws.completedCount).padStart(2, '0');
      if (compPct) compPct.textContent = ws.completedPercent || '11%';

      const blockCount = document.getElementById('count-blocked');
      if (blockCount) blockCount.textContent = String(ws.blockedCount).padStart(2, '0');
    },

    /**
     * Populate Tasks Overview Right Rail Widgets (Current Milestone, Blocked, Milestones, Knowledge)
     */
    populateOverviewWidgets(data) {
      if (!data) return;

      // 1. Current Milestone
      const cm = data.currentMilestone || defaultTasksData.currentMilestone;
      if (cm) {
        const titleEl = document.getElementById('rail-milestone-title');
        const activeEl = document.getElementById('rail-active-tasks-count');
        const blockedEl = document.getElementById('rail-blocked-tasks-stat');
        if (titleEl) titleEl.textContent = cm.name || 'Review.';
        if (activeEl) activeEl.textContent = `${cm.activeTasksCount || 5} active tasks`;
        if (blockedEl) blockedEl.innerHTML = `${cm.blockedTasksCount || 2} blocked <span class="blocked-warn-triangle">▲</span>`;
      }

      // 2. Blocked Tasks Count
      const blocked = data.blockedTasks || defaultTasksData.blockedTasks;
      const countEl = document.getElementById('rail-blocked-huge-count');
      if (countEl && blocked) {
        countEl.textContent = String(blocked.length).padStart(2, '0');
      }

      // 3. Tasks by Milestone
      const milestones = data.tasksByMilestone || defaultTasksData.tasksByMilestone;
      const mListEl = document.getElementById('rail-milestones-list');
      if (mListEl && milestones && milestones.length > 0) {
        mListEl.innerHTML = milestones.map(m => `
          <div class="milestone-table-row ${m.isActive ? 'current-active' : ''}">
            <span class="m-seq">${escapeHtml(m.num)}</span>
            <span class="m-status-circle ${m.isActive ? 'active-lime' : ''}"></span>
            <span class="m-name">${escapeHtml(m.title)}</span>
            <span class="m-count">${m.count} ${m.count === 1 ? 'task' : 'tasks'}</span>
            <span class="m-arrow">→</span>
          </div>
        `).join('');
      }

      // 4. Linked Knowledge
      const knowledge = data.linkedKnowledge || defaultTasksData.linkedKnowledge;
      const kListEl = document.getElementById('rail-knowledge-list');
      if (kListEl && knowledge && knowledge.length > 0) {
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
      if (!groups) return;

      // Group 1: IN PROGRESS
      const inProgressGroup = groups.find(g => g.key === 'IN_PROGRESS');
      if (inProgressGroup) {
        const countPill = document.getElementById('group-count-inprogress');
        if (countPill) countPill.textContent = String(inProgressGroup.count).padStart(2, '0');
        const listEl = document.getElementById('list-in-progress');
        if (listEl && inProgressGroup.tasks && inProgressGroup.tasks.length > 0) {
          listEl.innerHTML = inProgressGroup.tasks.map(t => this.renderTaskRowHtml(t)).join('');
        }
      }

      // Group 2: IN REVIEW
      const inReviewGroup = groups.find(g => g.key === 'IN_REVIEW');
      if (inReviewGroup) {
        const countPill = document.getElementById('group-count-inreview');
        if (countPill) countPill.textContent = String(inReviewGroup.count).padStart(2, '0');
        const listEl = document.getElementById('list-in-review');
        if (listEl && inReviewGroup.tasks && inReviewGroup.tasks.length > 0) {
          listEl.innerHTML = inReviewGroup.tasks.map(t => this.renderTaskRowHtml(t)).join('');
        }
      }

      // Group 3: TO DO
      const todoGroup = groups.find(g => g.key === 'TODO');
      if (todoGroup) {
        const countPill = document.getElementById('group-count-todo');
        if (countPill) countPill.textContent = String(todoGroup.count).padStart(2, '0');
        const listEl = document.getElementById('list-to-do');
        if (listEl && todoGroup.tasks && todoGroup.tasks.length > 0) {
          listEl.innerHTML = todoGroup.tasks.map(t => this.renderTaskRowHtml(t)).join('');
        }
      }

      // Group 4: COMPLETED
      const compGroup = groups.find(g => g.key === 'COMPLETED');
      if (compGroup) {
        const countPill = document.getElementById('group-count-completed');
        if (countPill) countPill.textContent = String(compGroup.count).padStart(2, '0');
        const listEl = document.getElementById('list-completed');
        if (listEl && compGroup.tasks && compGroup.tasks.length > 0) {
          listEl.innerHTML = compGroup.tasks.map(t => this.renderTaskRowHtml(t)).join('');
        }
      }
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

      // 2. Switch rail to drawer view
      this.showRailView('drawer');

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

      if (task.id === 'T-014') {
        if (cardWaiting) cardWaiting.style.display = 'flex';
        if (cardBlocker) cardBlocker.style.display = 'flex';
      } else if (task.isBlocked) {
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

      // 3. Blocked Task Items Click in Right Rail -> opens drawer for that task
      const widgetsRail = document.getElementById('tasks-overview-widgets');
      if (widgetsRail) {
        widgetsRail.addEventListener('click', (e) => {
          const item = e.target.closest('.blocked-task-item');
          if (item) {
            e.preventDefault();
            const taskId = item.getAttribute('data-task-id');
            if (taskId) {
              this.selectTask(taskId);
            }
          }

          const createBtn = e.target.closest('#qa-create-task');
          if (createBtn) {
            e.preventDefault();
            const newBtn = document.getElementById('btn-new-task');
            if (newBtn) newBtn.click();
          }

          const manageDepsBtn = e.target.closest('#qa-manage-deps');
          if (manageDepsBtn) {
            e.preventDefault();
            alert('Opening dependency management modal.');
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
