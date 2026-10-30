/**
 * Teamden / Brick — Project Activity Tab Controller (project-activity.js)
 * Path: pages/project/project-activity/project-activity.js
 *
 * Responsibilities:
 * 1. Mounts and renders the Project Chronicle Activity Journal and Right Information Panel.
 * 2. Fetches live data from /api/projects/{id}/activity with resilient fallback.
 * 3. Handles category filter pills (Important, All activity, Mentions).
 * 4. Real-time activity search filter across title, description, category, and author.
 * 5. Chronological sorting (Latest first vs Oldest first).
 * 6. Right rail interactive features: Since Your Last Visit, Jump To date navigation,
 *    Activity Filters sidebar, and Notification Preferences dialog.
 * 7. Seamless deep-linking from event action buttons (View task -> Tasks drawer,
 *    Open discussion -> Documents, View milestone -> Overview).
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

  // Baseline data strictly adhering to ProjectActivityDto and reference screenshot
  const defaultActivityData = {
    id: 'featured-01',
    breadcrumb: 'PROJECTS / 02 / WEBSITE REDESIGN',
    title: 'website redesign.',
    owner: 'Design Team',
    dueDate: '15 Nov 2026',
    status: 'Active',
    sinceLastVisit: {
      count: 6,
      title: 'Relevant updates',
      description: 'Including one decision requiring your review.',
      actionLabel: 'Review new activity ↗'
    },
    filterCounts: {
      milestones: 6,
      decisions: 4,
      taskUpdates: 18,
      documentActivity: 12,
      comments: 9,
      filesAndAttachments: 5,
      mentions: 7
    },
    dateGroups: [
      {
        dayNumber: '26',
        monthYear: 'OCT 2026',
        weekday: 'MONDAY',
        fullDate: '2026-10-26',
        events: [
          {
            id: 'act-01',
            time: '09:42',
            category: 'MILESTONE COMPLETED',
            categoryKey: 'milestones',
            dotColor: 'lime',
            iconType: 'flag',
            iconBgClass: 'icon-bg-lime',
            title: 'Design approved.',
            description: 'Milestone 05 / Design has been completed and work can proceed to the next stage.',
            userInitials: 'MJ',
            userName: 'Maria J.',
            userTeam: 'Design Team',
            avatarColor: 'avatar-mj',
            actionLabel: 'View milestone ↗',
            actionType: 'milestone',
            actionTargetId: 'ms-05',
            isImportant: true,
            isMention: false
          },
          {
            id: 'act-02',
            time: '08:15',
            category: 'COMMENT',
            categoryKey: 'comments',
            dotColor: 'amber',
            iconType: 'comment',
            iconBgClass: 'icon-bg-amber',
            title: 'Alex R. commented on Design Review Notes.',
            description: '“The navigation direction looks good. Please refine the mobile interaction.”',
            userInitials: 'AR',
            userName: 'Alex R.',
            userTeam: 'Design Team',
            avatarColor: 'avatar-ar',
            actionLabel: 'Open discussion ↗',
            actionType: 'comment',
            actionTargetId: 'doc-01',
            isImportant: true,
            isMention: true
          },
          {
            id: 'act-03',
            time: '07:28',
            category: 'TASK UPDATED',
            categoryKey: 'tasks',
            dotColor: 'blue',
            iconType: 'check-circle',
            iconBgClass: 'icon-bg-blue',
            title: 'Homepage development moved to In Progress.',
            description: 'Status changed from',
            statusFrom: 'To Do',
            statusTo: 'In Progress',
            userInitials: 'PK',
            userName: 'Peter K.',
            userTeam: 'Development',
            avatarColor: 'avatar-pk',
            actionLabel: 'View task ↗',
            actionType: 'task',
            actionTargetId: 'T-014',
            isImportant: true,
            isMention: false
          }
        ]
      },
      {
        dayNumber: '25',
        monthYear: 'OCT 2026',
        weekday: 'SUNDAY',
        fullDate: '2026-10-25',
        events: [
          {
            id: 'act-04',
            time: '15:30',
            category: 'DOCUMENT UPDATED',
            categoryKey: 'documents',
            dotColor: 'purple',
            iconType: 'document',
            iconBgClass: 'icon-bg-purple',
            title: 'Design Review Notes updated.',
            description: 'Version 2.3 · 5 changes',
            userInitials: 'PK',
            userName: 'Peter K.',
            userTeam: 'Design Team',
            avatarColor: 'avatar-pk',
            actionLabel: 'View changes ↗',
            actionType: 'document',
            actionTargetId: 'doc-01',
            isImportant: true,
            isMention: false
          },
          {
            id: 'act-05',
            time: '11:14',
            category: 'DECISION RECORDED',
            categoryKey: 'decisions',
            dotColor: 'amber',
            iconType: 'decision',
            iconBgClass: 'icon-bg-amber',
            title: 'Homepage layout approved (pending client confirmation).',
            description: 'Awaiting final client sign-off.',
            userInitials: 'MJ',
            userName: 'Maria J.',
            userTeam: 'Design Team',
            avatarColor: 'avatar-mj',
            actionLabel: 'View decision ↗',
            actionType: 'decision',
            actionTargetId: 'dec-01',
            isImportant: true,
            isMention: false
          },
          {
            id: 'act-06',
            time: '09:02',
            category: 'FILE ADDED',
            categoryKey: 'files',
            dotColor: 'gray',
            iconType: 'attachment',
            iconBgClass: 'icon-bg-gray',
            title: 'Added file to Project Brief.',
            description: 'homepage-wireframes-v2.fig · 12 MB',
            userInitials: 'SK',
            userName: 'Sarah K.',
            userTeam: 'Design Team',
            avatarColor: 'avatar-sk',
            actionLabel: 'Open document ↗',
            actionType: 'file',
            actionTargetId: 'doc-02',
            isImportant: false,
            isMention: false
          }
        ]
      }
    ]
  };

  const State = {
    projectId: 'featured-01',
    data: defaultActivityData,
    activePill: 'important', // 'important', 'all', 'mentions'
    secondaryFilter: null,   // null or 'milestones', 'decisions', 'tasks', 'documents', 'comments', 'files', 'mentions'
    searchQuery: '',
    sortOrder: 'latest'     // 'latest' or 'oldest'
  };

  /**
   * Main ProjectActivity Controller Object
   */
  const ProjectActivity = {
    container: null,
    projectId: 'featured-01',
    _eventsBound: false,

    /**
     * Mounts the Project Activity component into target DOM container
     */
    async mount(container, projectId, options = {}) {
      if (!container) return;
      this.container = container;
      this.projectId = projectId || 'featured-01';
      State.projectId = this.projectId;

      // 1. Fetch template fragment if not already in container
      if (!container.querySelector('.activity-workspace-split')) {
        try {
          let res = await fetch(`project-activity/project-activity.html?t=${Date.now()}`);
          if (!res.ok) {
            res = await fetch(`/pages/projects/project-detail/project-activity/project-activity.html?t=${Date.now()}`);
          }
          if (res.ok) {
            container.innerHTML = await res.text();
          } else {
            console.warn('Failed loading project-activity.html fragment, check network path.');
          }
        } catch (err) {
          console.warn('Error loading project-activity.html fragment:', err);
        }
      }

      // 2. Remove duplicate rail inside container if top-level #project-activity-rail is present
      const topActivityRail = document.getElementById('project-activity-rail');
      const railInContainer = container.querySelector('#activity-right-rail');
      if (topActivityRail && railInContainer) {
        railInContainer.remove();
      }

      // 3. Fetch live data from /api/projects/{id}/activity or fallback
      let data = defaultActivityData;
      if (this.projectId) {
        try {
          const res = await fetch(`/api/projects/${encodeURIComponent(this.projectId)}/activity`);
          if (res.ok) {
            const apiData = await res.json();
            if (apiData && apiData.dateGroups && apiData.dateGroups.length > 0) {
              data = apiData;
            }
          }
        } catch (netErr) {
          console.warn(`Could not fetch /api/projects/${this.projectId}/activity, using baseline:`, netErr);
        }
      }

      State.data = data;
      if (options.filter) {
        State.secondaryFilter = options.filter;
      }

      // 3. Populate Right Rail Summary Stats
      this.populateRightRail(data);

      // 4. Render main activity timeline
      this.renderTimeline();

      // 5. Bind event listeners
      this.bindEvents();
    },

    /**
     * Populates right rail counts and information cards
     */
    populateRightRail(data) {
      if (!data) return;

      // Card 1: Since Your Last Visit
      const lastVisit = data.sinceLastVisit || defaultActivityData.sinceLastVisit;
      const countEl = document.getElementById('last-visit-count');
      const titleEl = document.getElementById('last-visit-title');
      const descEl = document.getElementById('last-visit-desc');
      if (countEl) countEl.textContent = String(lastVisit.count).padStart(2, '0');
      if (titleEl && lastVisit.title) titleEl.textContent = lastVisit.title;
      if (descEl && lastVisit.description) descEl.textContent = lastVisit.description;

      // Card 3: Activity Filter Counts
      const fc = data.filterCounts || defaultActivityData.filterCounts;
      const setCt = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val !== undefined ? val : 0;
      };
      setCt('count-milestones', fc.milestones);
      setCt('count-decisions', fc.decisions);
      setCt('count-tasks', fc.taskUpdates);
      setCt('count-documents', fc.documentActivity);
      setCt('count-comments', fc.comments);
      setCt('count-files', fc.filesAndAttachments);
      setCt('count-mentions', fc.mentions);
    },

    /**
     * Filters, sorts, and renders the activity timeline
     */
    renderTimeline() {
      const container = document.getElementById('activity-timeline-container');
      const emptyState = document.getElementById('activity-empty-state');
      const banner = document.getElementById('active-filter-banner');
      const bannerLabel = document.getElementById('filter-banner-label');
      if (!container) return;

      // Handle secondary filter banner visibility
      if (banner) {
        if (State.secondaryFilter) {
          banner.style.display = 'flex';
          const filterNames = {
            milestones: 'Milestones',
            decisions: 'Decisions',
            tasks: 'Task updates',
            documents: 'Document activity',
            comments: 'Comments',
            files: 'Files & attachments',
            mentions: 'Mentions'
          };
          if (bannerLabel) bannerLabel.textContent = filterNames[State.secondaryFilter] || State.secondaryFilter;
        } else {
          banner.style.display = 'none';
        }
      }

      // Update active state on right rail filter items
      document.querySelectorAll('.filter-item-row').forEach(row => {
        const cat = row.getAttribute('data-cat');
        row.classList.toggle('active', State.secondaryFilter === cat);
      });

      const q = State.searchQuery.toLowerCase().trim();
      let rawGroups = JSON.parse(JSON.stringify(State.data.dateGroups || defaultActivityData.dateGroups));

      // Filter groups and events
      let totalVisibleEvents = 0;
      const filteredGroups = [];

      rawGroups.forEach(group => {
        const matchingEvents = (group.events || []).filter(ev => {
          // 1. Primary Category Pill Filter
          if (State.activePill === 'important' && !ev.isImportant) {
            return false;
          }
          if (State.activePill === 'mentions' && !ev.isMention) {
            return false;
          }

          // 2. Secondary Sidebar Category Filter
          if (State.secondaryFilter) {
            if (State.secondaryFilter === 'mentions') {
              if (!ev.isMention) return false;
            } else if (ev.categoryKey !== State.secondaryFilter) {
              return false;
            }
          }

          // 3. Search Query Filter
          if (q) {
            const haystack = `${ev.title} ${ev.description} ${ev.category} ${ev.userName} ${ev.userTeam}`.toLowerCase();
            if (!haystack.includes(q)) return false;
          }

          return true;
        });

        if (matchingEvents.length > 0) {
          totalVisibleEvents += matchingEvents.length;
          group.events = matchingEvents;
          filteredGroups.push(group);
        }
      });

      // Sort chronological order
      if (State.sortOrder === 'oldest') {
        filteredGroups.reverse();
        filteredGroups.forEach(g => {
          if (g.events) g.events.reverse();
        });
      }

      // Handle empty states
      if (totalVisibleEvents === 0) {
        container.style.display = 'none';
        if (emptyState) {
          emptyState.style.display = 'flex';
          const titleEl = document.getElementById('empty-state-title');
          const descEl = document.getElementById('empty-state-desc');
          if (q) {
            if (titleEl) titleEl.textContent = 'No activities match your search';
            if (descEl) descEl.textContent = `No results found for "${escapeHtml(State.searchQuery)}". Try another search or reset.`;
          } else if (State.activePill === 'mentions') {
            if (titleEl) titleEl.textContent = 'No mentions found';
            if (descEl) descEl.textContent = 'You have not been mentioned in any activity records yet.';
          } else {
            if (titleEl) titleEl.textContent = 'No activity recorded';
            if (descEl) descEl.textContent = 'No activity items recorded for the selected filter criteria.';
          }
        }
        return;
      }

      // Hide empty state and show timeline
      if (emptyState) emptyState.style.display = 'none';
      container.style.display = 'flex';

      // Build HTML
      container.innerHTML = filteredGroups.map(group => `
        <div class="timeline-date-group" data-date="${escapeHtml(group.fullDate)}" id="group-${escapeHtml(group.fullDate)}">
          <div class="timeline-date-col">
            <span class="timeline-day-num">${escapeHtml(group.dayNumber)}</span>
            <span class="timeline-month-year">${escapeHtml(group.monthYear)}</span>
            <span class="timeline-weekday">${escapeHtml(group.weekday)}</span>
          </div>

          <div class="timeline-events-stack">
            ${group.events.map(ev => this.renderEventRowHtml(ev)).join('')}
          </div>
        </div>
      `).join('');
    },

    /**
     * Renders a single event row HTML
     */
    renderEventRowHtml(ev) {
      let iconSvg = '';
      if (ev.iconType === 'flag') {
        iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>`;
      } else if (ev.iconType === 'comment') {
        iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
      } else if (ev.iconType === 'check-circle' || ev.iconType === 'task') {
        iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
      } else if (ev.iconType === 'document') {
        iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`;
      } else if (ev.iconType === 'decision') {
        iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
      } else {
        iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>`;
      }

      // Format description with badges if task update
      let descHtml = `<p class="event-desc">${escapeHtml(ev.description)}</p>`;
      if (ev.statusFrom && ev.statusTo) {
        descHtml = `
          <div class="event-desc event-status-flow">
            <span>Status changed from</span>
            <span class="status-badge badge-todo">${escapeHtml(ev.statusFrom)}</span>
            <span class="status-arrow">→</span>
            <span class="status-badge badge-inprogress">${escapeHtml(ev.statusTo)}</span>
          </div>
        `;
      } else if (ev.categoryKey === 'comments') {
        descHtml = `<p class="event-desc event-quote">${escapeHtml(ev.description)}</p>`;
      }

      return `
        <div class="timeline-event-row" data-category="${escapeHtml(ev.categoryKey)}" data-important="${ev.isImportant}" data-mention="${ev.isMention}" data-id="${escapeHtml(ev.id)}">
          <div class="timeline-spine-col">
            <span class="timeline-dot dot-${escapeHtml(ev.dotColor || 'gray')}"></span>
            <div class="timeline-line"></div>
          </div>

          <div class="timeline-event-card">
            <div class="event-icon-box ${escapeHtml(ev.iconBgClass || 'icon-bg-gray')}" title="${escapeHtml(ev.category)}">
              ${iconSvg}
            </div>

            <div class="event-body-col">
              <div class="event-meta-top">
                <span class="event-time">${escapeHtml(ev.time)}</span>
                <span class="meta-separator">·</span>
                <span class="event-category-tag">${escapeHtml(ev.category)}</span>
              </div>

              <h3 class="event-title">${escapeHtml(ev.title)}</h3>
              ${descHtml}

              <div class="event-author-row">
                <span class="user-avatar-circle ${escapeHtml(ev.avatarColor || 'avatar-mj')}">${escapeHtml(ev.userInitials)}</span>
                <span class="user-name-bold">${escapeHtml(ev.userName)}</span>
                <span class="meta-separator">·</span>
                <span class="user-team-muted">${escapeHtml(ev.userTeam)}</span>
              </div>
            </div>

            <div class="event-action-col">
              <button class="btn-event-action" data-action="${escapeHtml(ev.actionType)}" data-target="${escapeHtml(ev.actionTargetId)}" title="${escapeHtml(ev.actionLabel)}">
                <span>${escapeHtml(ev.actionLabel.replace(' ↗', ''))}</span>
                <span class="action-arrow">↗</span>
              </button>
            </div>
          </div>
        </div>
      `;
    },

    /**
     * Binds all UI interactions, search, filter pills, jump to, and action links
     */
    bindEvents() {
      // 1. Search Box Input & Clear
      const searchInput = document.getElementById('activity-search-input');
      const searchClearBtn = document.getElementById('activity-search-clear-btn');
      if (searchInput) {
        searchInput.oninput = (e) => {
          State.searchQuery = e.target.value;
          if (searchClearBtn) {
            searchClearBtn.style.display = State.searchQuery ? 'block' : 'none';
          }
          this.renderTimeline();
        };
      }
      if (searchClearBtn) {
        searchClearBtn.onclick = () => {
          if (searchInput) {
            searchInput.value = '';
            State.searchQuery = '';
            searchClearBtn.style.display = 'none';
            this.renderTimeline();
          }
        };
      }

      // 2. Category Filter Pills (Important, All activity, Mentions)
      const pills = document.querySelectorAll('.activity-pill-btn');
      pills.forEach(pill => {
        pill.onclick = (e) => {
          e.preventDefault();
          pills.forEach(p => {
            p.classList.remove('active');
            p.setAttribute('aria-selected', 'false');
          });
          pill.classList.add('active');
          pill.setAttribute('aria-selected', 'true');
          State.activePill = pill.getAttribute('data-pill') || 'important';
          this.renderTimeline();
        };
      });

      // 3. Sort Dropdown Toggle & Options
      const sortBtn = document.getElementById('activity-sort-btn');
      const sortMenu = document.getElementById('activity-sort-menu');
      const sortLabel = document.getElementById('activity-sort-label');
      if (sortBtn && sortMenu) {
        sortBtn.onclick = (e) => {
          e.stopPropagation();
          const isShown = sortMenu.style.display === 'flex';
          sortMenu.style.display = isShown ? 'none' : 'flex';
        };

        sortMenu.querySelectorAll('.sort-option').forEach(opt => {
          opt.onclick = (e) => {
            e.stopPropagation();
            const order = opt.getAttribute('data-sort');
            State.sortOrder = order;
            if (sortLabel) sortLabel.textContent = opt.textContent;
            sortMenu.querySelectorAll('.sort-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            sortMenu.style.display = 'none';
            this.renderTimeline();
          };
        });

        document.addEventListener('click', () => {
          sortMenu.style.display = 'none';
        });
      }

      // 4. Secondary Filter Banner Clear Button & Reset Button
      const bannerClearBtn = document.getElementById('filter-banner-clear-btn');
      if (bannerClearBtn) {
        bannerClearBtn.onclick = () => {
          State.secondaryFilter = null;
          this.renderTimeline();
        };
      }

      const resetBtn = document.getElementById('btn-reset-filters');
      if (resetBtn) {
        resetBtn.onclick = () => {
          State.searchQuery = '';
          State.secondaryFilter = null;
          State.activePill = 'all';
          if (searchInput) searchInput.value = '';
          if (searchClearBtn) searchClearBtn.style.display = 'none';
          pills.forEach(p => {
            const isAll = p.getAttribute('data-pill') === 'all';
            p.classList.toggle('active', isAll);
            p.setAttribute('aria-selected', isAll ? 'true' : 'false');
          });
          this.renderTimeline();
        };
      }

      // 5. Right Rail Card 1: Review New Activity Button
      const reviewNewBtn = document.getElementById('btn-review-new-activity');
      if (reviewNewBtn) {
        reviewNewBtn.onclick = () => {
          // Switch to "all" activity and scroll to first date group
          State.activePill = 'all';
          pills.forEach(p => {
            const isAll = p.getAttribute('data-pill') === 'all';
            p.classList.toggle('active', isAll);
            p.setAttribute('aria-selected', isAll ? 'true' : 'false');
          });
          this.renderTimeline();
          const firstGroup = document.querySelector('.timeline-date-group');
          if (firstGroup) firstGroup.scrollIntoView({ behavior: 'smooth' });
          this.showToast('Showing all recent updates since your last visit.');
        };
      }

      // 6. Right Rail Card 2: Jump To Navigation Rows
      const jumpButtons = document.querySelectorAll('.jump-to-row');
      jumpButtons.forEach(btn => {
        btn.onclick = () => {
          const jumpType = btn.getAttribute('data-jump');
          if (jumpType === 'today') {
            const todayGroup = document.getElementById('group-2026-10-26');
            if (todayGroup) {
              todayGroup.scrollIntoView({ behavior: 'smooth' });
              this.showToast('Jumped to today\'s activity.');
            } else {
              this.showToast('No new activity recorded for today.');
            }
          } else if (jumpType === 'week') {
            const weekGroup = document.getElementById('group-2026-10-25');
            if (weekGroup) {
              weekGroup.scrollIntoView({ behavior: 'smooth' });
              this.showToast('Jumped to previous week activity.');
            }
          } else if (jumpType === 'month') {
            const group = document.querySelector('.timeline-date-group:last-child');
            if (group) {
              group.scrollIntoView({ behavior: 'smooth' });
              this.showToast('Jumped to previous month activity.');
            }
          } else if (jumpType === 'choose') {
            const chosen = prompt('Enter date to jump to (YYYY-MM-DD):', '2026-10-26');
            if (chosen) {
              const target = document.getElementById(`group-${chosen.trim()}`);
              if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                this.showToast(`Jumped to activity on ${chosen.trim()}`);
              } else {
                this.showToast(`No activity recorded on ${chosen.trim()}`);
              }
            }
          }
        };
      });

      // 7. Right Rail Card 3: Activity Filter Items
      const filterItems = document.querySelectorAll('.filter-item-row');
      filterItems.forEach(row => {
        row.onclick = () => {
          const cat = row.getAttribute('data-cat');
          if (State.secondaryFilter === cat) {
            State.secondaryFilter = null; // Toggle off
          } else {
            State.secondaryFilter = cat;  // Toggle on
          }
          this.renderTimeline();
        };
      });

      // 8. Right Rail Card 4: Following Project Notification Preferences
      const notifBtn = document.getElementById('btn-notification-prefs');
      if (notifBtn) {
        notifBtn.onclick = () => {
          this.showToast('Notification preferences: Watching milestone and decision events.');
        };
      }

      // 9. Delegated Click for Event Action Buttons (View task, View milestone, Open discussion, etc.)
      const timelineContainer = document.getElementById('activity-timeline-container');
      if (timelineContainer && !this._eventsBound) {
        timelineContainer.addEventListener('click', (e) => {
          const btn = e.target.closest('.btn-event-action');
          if (!btn) return;
          e.preventDefault();

          const actionType = btn.getAttribute('data-action');
          const targetId = btn.getAttribute('data-target');

          if (window.ProjectTabController && typeof window.ProjectTabController.switchTab === 'function') {
            if (actionType === 'task') {
              // Switch to Tasks tab with selected task open in drawer!
              window.ProjectTabController.switchTab('tasks', { selectedTaskId: targetId || 'T-014', showDrawer: true });
            } else if (actionType === 'document' || actionType === 'comment' || actionType === 'file') {
              // Switch to Documents tab
              window.ProjectTabController.switchTab('documents', { selectedDocId: targetId || 'doc-01' });
            } else if (actionType === 'milestone' || actionType === 'decision') {
              // Switch to Overview tab
              window.ProjectTabController.switchTab('overview');
            }
          } else {
            this.showToast(`Navigating to ${actionType} ${targetId}...`);
          }
        });
      }

      this._eventsBound = true;
    },

    /**
     * Lightweight Toast Notification Helper
     */
    showToast(message) {
      let toast = document.getElementById('project-activity-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'project-activity-toast';
        toast.style.position = 'fixed';
        toast.style.bottom = '24px';
        toast.style.right = '24px';
        toast.style.backgroundColor = '#111111';
        toast.style.color = '#FFFFFF';
        toast.style.padding = '0.65rem 1.15rem';
        toast.style.borderRadius = '8px';
        toast.style.fontSize = '0.8125rem';
        toast.style.fontWeight = '600';
        toast.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
        toast.style.zIndex = '99999';
        toast.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(12px)';
        toast.style.pointerEvents = 'none';
        document.body.appendChild(toast);
      }

      toast.textContent = message;
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';

      if (this.toastTimeout) clearTimeout(this.toastTimeout);
      this.toastTimeout = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(12px)';
      }, 2600);
    }
  };

  // Expose to window for ProjectTabController
  window.ProjectActivity = ProjectActivity;

})(window);
