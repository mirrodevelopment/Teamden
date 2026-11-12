/**
 * Teamden / Brick — Project Overview Tab Component Controller (project-overview.js)
 * Path: pages/projects/project-detail/project-overview/project-overview.js
 *
 * Responsibilities:
 * 1. Loads and binds the Project Overview Tab UI inside the parent Project Tab System
 * 2. Fetches live data from /api/projects/{id}/overview with full resilient fallback
 * 3. Populates 01 Specification, 02 Milestones (Timeline & Table view), 03 Work in Motion, 04 Project Knowledge
 * 4. Populates Right Column: Project Health, Decision Register, Project Team
 * 5. Supports full Milestones CRUD, Template Initialization, and View Switching
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

  let currentProjectId = null;
  let currentMilestones = [];
  let activeMilestoneView = 'timeline';
  let activeRootElement = null;

  const emptyOverviewData = {
    id: '',
    breadcrumb: 'PROJECTS',
    title: 'Project Overview',
    description: '',
    owner: 'Team',
    dueDate: '',
    projectType: 'General',
    health: 'Active',
    healthDotColor: 'green',
    status: 'Active',
    statusDotColor: 'green',
    specification: {
      title: 'Project specification',
      objectives: [],
      deliverables: [],
      successCriteria: [],
      projectContext: {}
    },
    milestonesSummary: '00/00 COMPLETED',
    milestonesCompleted: 0,
    milestonesTotal: 0,
    milestonesList: [],
    workInMotion: [],
    knowledgeDocuments: [],
    unresolvedBlockersCount: 0,
    healthHeading: 'No active blockers',
    healthDescription: 'All project milestones and tasks are on track.',
    pendingDecision: null,
    moreDecisionsCount: 0,
    teamMemberInitials: [],
    totalTeamMembers: 0
  };

  /**
   * Component API
   */
  const ProjectOverview = {
    /**
     * Mounts and renders Project Overview inside target container
     */
    async mount(container, projectId) {
      if (!container) return;
      currentProjectId = projectId;
      activeRootElement = container;

      // 1. Fetch template fragment if not already in container
      if (!container.querySelector('.overview-tab-root')) {
        try {
          const res = await fetch('/pages/projects/project-detail/project-overview/project-overview.html?t=' + Date.now());
          if (res.ok) {
            container.innerHTML = await res.text();
          }
        } catch (err) {
          console.warn('Failed loading project-overview.html fragment, using in-memory structure:', err);
        }
      }

      // 2. Fetch live project overview data or fallback
      let data = emptyOverviewData;
      if (projectId) {
        try {
          const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/overview`);
          if (res.ok) {
            data = await res.json();
          }
        } catch (netErr) {
          console.warn(`Could not fetch /api/projects/${projectId}/overview, using baseline:`, netErr);
        }
      }

      // 3. Populate DOM elements
      this.populate(container, data);

      // 4. Bind event handlers
      this.bindEvents(container, data);
    },

    populate(root, data) {
      if (!root || !data) return;
      activeRootElement = root;

      const query = (sel) => root.querySelector(sel) || document.querySelector(sel);

      // --- 01. Specification Card ---
      const specTitle = root.querySelector('#spec-title');
      if (specTitle && data.specification && data.specification.title) {
        specTitle.textContent = data.specification.title;
      }

      // Objectives list
      const objList = root.querySelector('#spec-objectives-list');
      if (objList && data.specification && Array.isArray(data.specification.objectives)) {
        objList.innerHTML = data.specification.objectives.map(item => `<li>${escapeHtml(item)}</li>`).join('');
      }

      // Deliverables list
      const delList = root.querySelector('#spec-deliverables-list');
      if (delList && data.specification && Array.isArray(data.specification.deliverables)) {
        delList.innerHTML = data.specification.deliverables.map(item => `<li>${escapeHtml(item)}</li>`).join('');
      }

      // Success criteria list
      const critList = root.querySelector('#spec-criteria-list');
      if (critList && data.specification && Array.isArray(data.specification.successCriteria)) {
        critList.innerHTML = data.specification.successCriteria.map(item => `<li>${escapeHtml(item)}</li>`).join('');
      }

      // Project context
      const ctxBlock = root.querySelector('#spec-context-block');
      if (ctxBlock && data.specification && data.specification.projectContext) {
        const ctx = data.specification.projectContext;
        ctxBlock.innerHTML = Object.entries(ctx).map(([k, v]) => `
          <div class="spec-context-row">
            <span class="spec-context-label">${escapeHtml(k)}:</span>
            <span class="spec-context-val">${escapeHtml(v)}</span>
          </div>
        `).join('');
      }

      // --- 02. Milestones Management ---
      currentMilestones = Array.isArray(data.milestonesList) ? [...data.milestonesList] : [];
      this.renderMilestonesUI(root);

      // --- 03. Work in Motion Cards ---
      const workGrid = root.querySelector('#work-cards-grid');
      if (workGrid && Array.isArray(data.workInMotion) && data.workInMotion.length > 0) {
        workGrid.innerHTML = data.workInMotion.map(card => {
          const avCls = 'avatar-' + (card.assigneeAvatar || 'ar').toLowerCase();
          const dotCls = 'dot-' + (card.dotColor || 'gray');
          return `
            <article class="work-card" data-status-filter="${escapeHtml(card.statusFilter || card.status)}" tabindex="0">
              <div class="work-card-top">
                <span class="work-dot ${dotCls}"></span>
                <span class="work-status-label">${escapeHtml(card.status)}</span>
              </div>
              <span class="work-count-huge">${escapeHtml(card.count)}</span>
              <p class="work-task-sample">${escapeHtml(card.sampleTaskTitle || '')}</p>
              <div class="work-card-bottom">
                <span class="work-avatar ${avCls}" title="${escapeHtml(card.assigneeName || '')}">${escapeHtml(card.assigneeAvatar || '')}</span>
                <span class="work-link-text">View all →</span>
              </div>
            </article>
          `;
        }).join('');
      }

      // --- 04. Knowledge Documents ---
      const docGrid = root.querySelector('#knowledge-docs-grid');
      if (docGrid && Array.isArray(data.knowledgeDocuments) && data.knowledgeDocuments.length > 0) {
        docGrid.innerHTML = data.knowledgeDocuments.map(doc => {
          const avCls = 'avatar-' + (doc.authorAvatar || 'pk').toLowerCase();
          return `
            <article class="doc-card" data-doc-id="${escapeHtml(doc.id)}" tabindex="0">
              <div class="doc-top-row">
                <div class="doc-title-group">
                  <span class="doc-badge-type">${escapeHtml(doc.typeBadge)}</span>
                  <h4 class="doc-name">${escapeHtml(doc.title)}</h4>
                </div>
                <button class="doc-arrow-btn" aria-label="Open document" title="Open document">
                  <svg viewBox="0 0 24 24" fill="none"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                </button>
              </div>
              <p class="doc-description">${escapeHtml(doc.description || '')}</p>
              <div class="doc-bottom-row">
                <div class="doc-author-lockup">
                  <span class="work-avatar ${avCls}">${escapeHtml(doc.authorAvatar || '')}</span>
                  <span class="doc-author-name">${escapeHtml(doc.authorName)}</span>
                </div>
                <span class="doc-time">${escapeHtml(doc.updatedTime)}</span>
              </div>
            </article>
          `;
        }).join('');
      }

      // --- Right Column: Health Status ---
      const healthDot = query('#health-status-dot');
      if (healthDot && data.healthDotColor) {
        healthDot.className = `health-status-dot dot-${data.healthDotColor}`;
      }
      const healthVal = query('#health-status-value');
      if (healthVal) {
        healthVal.textContent = data.health || 'Active';
      }
      const healthHead = query('#health-heading');
      if (healthHead) {
        healthHead.textContent = data.healthHeading || (data.unresolvedBlockersCount > 0 ? `${data.unresolvedBlockersCount} Blockers` : 'No active blockers');
      }
      const healthDesc = query('#health-description');
      if (healthDesc) {
        healthDesc.textContent = data.healthDescription || (data.unresolvedBlockersCount > 0 ? `${data.unresolvedBlockersCount} issue(s) need attention.` : 'All project milestones and tasks are on track.');
      }

      // --- Right Column: Decision Register ---
      const decCard = query('#overview-decision-card');
      if (data.pendingDecision) {
        const decStatus = query('#decision-status-badge');
        if (decStatus) decStatus.textContent = data.pendingDecision.statusBadge || 'PENDING';

        const decTitle = query('#decision-title');
        if (decTitle) decTitle.textContent = data.pendingDecision.title || 'Decision';

        const decDesc = query('#decision-desc');
        if (decDesc) decDesc.textContent = data.pendingDecision.description || '';

        const decDue = query('#decision-due');
        if (decDue) decDue.textContent = data.pendingDecision.dueLabel ? `Due ${data.pendingDecision.dueLabel}` : 'Due Soon';

        const moreDec = query('#more-decisions-count');
        if (moreDec) moreDec.textContent = data.moreDecisionsCount ? `+${data.moreDecisionsCount} more decisions` : '';
      }

      // --- Right Column: Project Team ---
      const teamAvatars = query('#team-avatars-row');
      if (teamAvatars && Array.isArray(data.teamMemberInitials)) {
        teamAvatars.innerHTML = data.teamMemberInitials.map(m => {
          const cls = 'avatar-' + (m.initials || 'u').toLowerCase();
          return `<span class="team-avatar-circle ${cls}" title="${escapeHtml(m.name || '')}">${escapeHtml(m.initials || '')}</span>`;
        }).join('');
      }
      const teamCount = query('#team-count-label');
      if (teamCount) {
        teamCount.textContent = data.totalTeamMembers ? `${data.totalTeamMembers} members` : '4 members';
      }
    },

    /**
     * Renders Milestones Section (Timeline vs Table vs Empty State)
     */
    renderMilestonesUI(root) {
      const query = (sel) => (root || activeRootElement || document).querySelector(sel);
      const ratioLabel = query('#milestones-ratio-label');
      const timelineView = query('#milestones-timeline-view');
      const tableView = query('#milestones-table-view');
      const emptyBox = query('#milestones-empty-container');
      const btnTimeline = query('#btn-milestones-view-timeline');
      const btnTable = query('#btn-milestones-view-table');
      const progressBar = query('#milestones-track-progress');

      const total = currentMilestones.length;
      const completed = currentMilestones.filter(m => (m.status || '').toUpperCase() === 'COMPLETED').length;

      if (ratioLabel) {
        ratioLabel.textContent = `${String(completed).padStart(2, '0')}/${String(total).padStart(2, '0')}`;
      }

      if (progressBar) {
        const pct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
        progressBar.style.width = `${pct}%`;
      }

      if (total === 0) {
        if (timelineView) timelineView.style.display = 'none';
        if (tableView) tableView.style.display = 'none';
        if (emptyBox) emptyBox.style.display = 'flex';
        return;
      }

      if (emptyBox) emptyBox.style.display = 'none';

      if (activeMilestoneView === 'timeline') {
        if (timelineView) timelineView.style.display = 'block';
        if (tableView) tableView.style.display = 'none';
        if (btnTimeline) {
          btnTimeline.classList.add('is-active');
          btnTimeline.setAttribute('aria-selected', 'true');
        }
        if (btnTable) {
          btnTable.classList.remove('is-active');
          btnTable.setAttribute('aria-selected', 'false');
        }
        this.renderTimelineNodes(root, completed, total);
      } else {
        if (timelineView) timelineView.style.display = 'none';
        if (tableView) tableView.style.display = 'block';
        if (btnTimeline) {
          btnTimeline.classList.remove('is-active');
          btnTimeline.setAttribute('aria-selected', 'false');
        }
        if (btnTable) {
          btnTable.classList.add('is-active');
          btnTable.setAttribute('aria-selected', 'true');
        }
        this.renderTableRows(root);
      }
    },

    renderTimelineNodes(root, completed, total) {
      const query = (sel) => (root || activeRootElement || document).querySelector(sel);
      const trackContainer = query('#milestones-track-container');
      if (!trackContainer) return;

      const line = '<div class="milestones-track-line"></div>';
      const pct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
      const progress = `<div class="milestones-track-line-progress" style="width: ${pct}%;"></div>`;

      const nodesHtml = currentMilestones.map((m, idx) => {
        const st = (m.status || 'UPCOMING').toUpperCase();
        let cls = 'milestone-node upcoming';
        let circleContent = escapeHtml(String(m.seqNum || idx + 1));
        let subtagHtml = m.statusLabel ? `<span class="node-subtag">${escapeHtml(m.statusLabel)}</span>` : '';

        if (st === 'COMPLETED') {
          cls = 'milestone-node completed';
          circleContent = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        } else if (st === 'CURRENT') {
          cls = 'milestone-node current';
          circleContent = escapeHtml(String(m.seqNum || idx + 1));
        } else if (st === 'DELAYED') {
          cls = 'milestone-node delayed';
          circleContent = '!';
        }

        const seqDisplay = String(m.seqNum || idx + 1).padStart(2, '0');

        return `
          <div class="${cls}" data-milestone-id="${escapeHtml(m.id || '')}" title="${escapeHtml(m.name)} (${escapeHtml(st)})" onclick="window.ProjectOverview.openEditModal('${escapeHtml(m.id)}')">
            <div class="node-circle">${circleContent}</div>
            <div class="node-text-wrap">
              <span class="node-num">${seqDisplay}</span>
              <span class="node-label">${escapeHtml(m.name)}</span>
              ${subtagHtml}
            </div>
          </div>
        `;
      }).join('');

      trackContainer.innerHTML = line + progress + nodesHtml;
    },

    renderTableRows(root) {
      const query = (sel) => (root || activeRootElement || document).querySelector(sel);
      const tableBody = query('#milestones-table-body');
      if (!tableBody) return;

      tableBody.innerHTML = currentMilestones.map((m, idx) => {
        const seqDisplay = String(m.seqNum || idx + 1).padStart(2, '0');
        const st = (m.status || 'UPCOMING').toUpperCase();
        const statusClass = 'status-' + st.toLowerCase();
        const dueStr = m.dueDateFormatted || m.dueDate || '--';
        const tasksCount = m.tasksCount !== undefined && m.tasksCount !== null ? m.tasksCount : 0;

        return `
          <tr data-milestone-id="${escapeHtml(m.id)}">
            <td class="tbl-seq">${seqDisplay}</td>
            <td>
              <div class="tbl-title-block">
                <span class="tbl-title">${escapeHtml(m.name)}</span>
                ${m.description ? `<span class="tbl-desc">${escapeHtml(m.description)}</span>` : ''}
              </div>
            </td>
            <td>
              <select class="milestone-status-select ${statusClass}" onchange="window.ProjectOverview.handleStatusChange('${escapeHtml(m.id)}', this.value)">
                <option value="UPCOMING" ${st === 'UPCOMING' ? 'selected' : ''}>Upcoming</option>
                <option value="CURRENT" ${st === 'CURRENT' ? 'selected' : ''}>Current</option>
                <option value="COMPLETED" ${st === 'COMPLETED' ? 'selected' : ''}>Completed</option>
                <option value="DELAYED" ${st === 'DELAYED' ? 'selected' : ''}>Delayed</option>
              </select>
            </td>
            <td>${escapeHtml(dueStr)}</td>
            <td><span style="font-weight: 700;">${tasksCount}</span> tasks</td>
            <td>
              <div class="tbl-actions">
                <button class="btn-tbl-action" type="button" onclick="window.ProjectOverview.openEditModal('${escapeHtml(m.id)}')">Edit</button>
                <button class="btn-tbl-action btn-tbl-del" type="button" onclick="window.ProjectOverview.deleteMilestone('${escapeHtml(m.id)}')">Del</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    },

    async handleStatusChange(milestoneId, newStatus) {
      if (!currentProjectId || !milestoneId) return;

      // Optimistic local state update
      const target = currentMilestones.find(m => m.id === milestoneId);
      if (target) {
        target.status = newStatus;
        if (newStatus === 'COMPLETED') {
          target.statusLabel = 'Completed';
        } else if (newStatus === 'CURRENT') {
          target.statusLabel = 'In Progress';
        } else {
          target.statusLabel = 'Upcoming';
        }
      }
      this.renderMilestonesUI();

      try {
        const res = await fetch(`/api/projects/${encodeURIComponent(currentProjectId)}/milestones/${encodeURIComponent(milestoneId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
        if (!res.ok) {
          throw new Error('Failed to update status');
        }
        const updated = await res.json();
        if (target && updated) {
          Object.assign(target, updated);
        }
        this.renderMilestonesUI();
        if (window.showToast) window.showToast(`Updated milestone status to ${newStatus}`);
      } catch (err) {
        console.error('Status update failed:', err);
        alert('Could not update milestone status. Please try again.');
        this.refreshMilestonesData();
      }
    },

    async deleteMilestone(milestoneId) {
      if (!currentProjectId || !milestoneId) return;
      const target = currentMilestones.find(m => m.id === milestoneId);
      const name = target ? target.name : 'this milestone';

      if (!confirm(`Are you sure you want to delete "${name}"?`)) {
        return;
      }

      try {
        const res = await fetch(`/api/projects/${encodeURIComponent(currentProjectId)}/milestones/${encodeURIComponent(milestoneId)}`, {
          method: 'DELETE'
        });
        if (!res.ok) throw new Error('Delete failed');

        currentMilestones = currentMilestones.filter(m => m.id !== milestoneId);
        this.renderMilestonesUI();
        if (window.showToast) window.showToast(`Milestone removed`);
      } catch (err) {
        console.error('Delete milestone failed:', err);
        alert('Failed to delete milestone');
      }
    },

    async refreshMilestonesData() {
      if (!currentProjectId) return;
      try {
        const res = await fetch(`/api/projects/${encodeURIComponent(currentProjectId)}/milestones`);
        if (res.ok) {
          currentMilestones = await res.json();
          this.renderMilestonesUI();
        }
      } catch (err) {
        console.error('Failed to refresh milestones:', err);
      }
    },

    async initializeLifecycleTemplate() {
      if (!currentProjectId) return;
      try {
        const res = await fetch(`/api/projects/${encodeURIComponent(currentProjectId)}/milestones/initialize-template`, {
          method: 'POST'
        });
        if (!res.ok) throw new Error('Initialization failed');
        currentMilestones = await res.json();
        this.renderMilestonesUI();
        if (window.showToast) window.showToast('Initialized standard 9-stage lifecycle stages');
      } catch (err) {
        console.error('Failed to initialize lifecycle template:', err);
        alert('Could not initialize template stages. Please try again.');
      }
    },

    openAddModal() {
      const modal = document.querySelector('#milestone-modal');
      const titleEl = document.querySelector('#milestone-modal-title');
      const form = document.querySelector('#milestone-form');
      if (!modal || !form) return;

      form.reset();
      document.querySelector('#milestone-form-id').value = '';
      if (titleEl) titleEl.textContent = 'Add Milestone';

      const nextSeq = currentMilestones.length > 0 ? (currentMilestones[currentMilestones.length - 1].seqNum || currentMilestones.length) + 1 : 1;
      document.querySelector('#milestone-form-seq').value = nextSeq;
      document.querySelector('#milestone-form-status').value = 'UPCOMING';

      modal.style.display = 'flex';
    },

    openEditModal(milestoneId) {
      const modal = document.querySelector('#milestone-modal');
      const titleEl = document.querySelector('#milestone-modal-title');
      if (!modal) return;

      const m = currentMilestones.find(item => item.id === milestoneId);
      if (!m) return;

      document.querySelector('#milestone-form-id').value = m.id;
      document.querySelector('#milestone-form-name').value = m.name || '';
      document.querySelector('#milestone-form-seq').value = m.seqNum || 1;
      document.querySelector('#milestone-form-status').value = m.status || 'UPCOMING';
      document.querySelector('#milestone-form-due').value = m.dueDate || '';
      document.querySelector('#milestone-form-desc').value = m.description || '';

      if (titleEl) titleEl.textContent = `Edit Milestone: ${m.name}`;
      modal.style.display = 'flex';
    },

    closeModal() {
      const modal = document.querySelector('#milestone-modal');
      if (modal) modal.style.display = 'none';
    },

    async saveMilestone(e) {
      if (e) e.preventDefault();
      if (!currentProjectId) return;

      const id = document.querySelector('#milestone-form-id')?.value;
      const name = document.querySelector('#milestone-form-name')?.value?.trim();
      const seqVal = document.querySelector('#milestone-form-seq')?.value;
      const status = document.querySelector('#milestone-form-status')?.value;
      const dueDate = document.querySelector('#milestone-form-due')?.value;
      const desc = document.querySelector('#milestone-form-desc')?.value?.trim();

      if (!name) {
        alert('Milestone title is required');
        return;
      }

      const payload = {
        name: name,
        seqNum: seqVal ? parseInt(seqVal, 10) : null,
        status: status,
        dueDate: dueDate || null,
        description: desc || ''
      };

      try {
        let res;
        if (id) {
          res = await fetch(`/api/projects/${encodeURIComponent(currentProjectId)}/milestones/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } else {
          res = await fetch(`/api/projects/${encodeURIComponent(currentProjectId)}/milestones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }

        if (!res.ok) throw new Error('Save failed');

        this.closeModal();
        await this.refreshMilestonesData();
        if (window.showToast) window.showToast(id ? 'Milestone updated' : 'Milestone created');
      } catch (err) {
        console.error('Failed to save milestone:', err);
        alert('Could not save milestone. Please check inputs.');
      }
    },

    bindEvents(root, data) {
      if (!root) return;

      const query = (sel) => root.querySelector(sel) || document.querySelector(sel);
      const queryAll = (sel) => root.querySelectorAll(sel);

      // --- View Switcher ---
      const btnTimeline = query('#btn-milestones-view-timeline');
      if (btnTimeline) {
        btnTimeline.onclick = () => {
          activeMilestoneView = 'timeline';
          this.renderMilestonesUI(root);
        };
      }

      const btnTable = query('#btn-milestones-view-table');
      if (btnTable) {
        btnTable.onclick = () => {
          activeMilestoneView = 'table';
          this.renderMilestonesUI(root);
        };
      }

      // --- Add Milestone Buttons ---
      const btnAdd = query('#btn-add-milestone');
      if (btnAdd) btnAdd.onclick = () => this.openAddModal();

      const btnEmptyAdd = query('#btn-empty-add-milestone');
      if (btnEmptyAdd) btnEmptyAdd.onclick = () => this.openAddModal();

      // --- Initialize Lifecycle Template ---
      const btnInit = query('#btn-init-lifecycle-template');
      if (btnInit) btnInit.onclick = () => this.initializeLifecycleTemplate();

      // --- Milestone Modal Close / Cancel ---
      const btnCloseModal = query('#btn-close-milestone-modal');
      if (btnCloseModal) btnCloseModal.onclick = () => this.closeModal();

      const btnCancelModal = query('#btn-cancel-milestone');
      if (btnCancelModal) btnCancelModal.onclick = () => this.closeModal();

      const milestoneForm = query('#milestone-form');
      if (milestoneForm) milestoneForm.onsubmit = (e) => this.saveMilestone(e);

      // Close modal on backdrop click
      const modalBackdrop = query('#milestone-modal');
      if (modalBackdrop) {
        modalBackdrop.onclick = (e) => {
          if (e.target === modalBackdrop) this.closeModal();
        };
      }

      // --- Work card filter click ---
      queryAll('.work-card').forEach(card => {
        card.addEventListener('click', (e) => {
          e.preventDefault();
          const filter = card.getAttribute('data-status-filter');
          if (window.ProjectTabController && typeof window.ProjectTabController.switchTab === 'function') {
            window.ProjectTabController.switchTab('tasks', { filter: filter });
          } else {
            alert(`Opening tasks with filter: ${filter}`);
          }
        });
      });

      // --- View all tasks action ---
      const viewTasksBtn = query('#action-view-all-tasks');
      if (viewTasksBtn) {
        viewTasksBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (window.ProjectTabController && typeof window.ProjectTabController.switchTab === 'function') {
            window.ProjectTabController.switchTab('tasks');
          } else {
            alert('Switching to Tasks tab');
          }
        });
      }

      // --- Document card click ---
      queryAll('.doc-card').forEach(doc => {
        doc.addEventListener('click', (e) => {
          e.preventDefault();
          const name = doc.querySelector('.doc-name')?.textContent || 'Document';
          alert(`Opening document: ${name}`);
        });
      });

      // --- View all documents ---
      const viewDocsBtn = query('#action-view-all-docs');
      if (viewDocsBtn) {
        viewDocsBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (window.ProjectTabController && typeof window.ProjectTabController.switchTab === 'function') {
            window.ProjectTabController.switchTab('documents');
          } else {
            alert('Switching to Documents tab');
          }
        });
      }

      // --- Review blockers button ---
      const reviewBlockersBtn = query('#btn-review-blockers');
      if (reviewBlockersBtn) {
        reviewBlockersBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (window.ProjectTabController && typeof window.ProjectTabController.switchTab === 'function') {
            window.ProjectTabController.switchTab('tasks', { filter: 'BLOCKED' });
          } else {
            alert('Reviewing active blockers on project');
          }
        });
      }

      // --- Review decision button ---
      const reviewDecBtn = query('#btn-review-decision');
      if (reviewDecBtn) {
        reviewDecBtn.addEventListener('click', () => {
          alert('Reviewing Decision: Homepage design approval');
        });
      }

      // --- Add team member button ---
      const addTeamBtn = query('#btn-add-team-member');
      if (addTeamBtn) {
        addTeamBtn.addEventListener('click', () => {
          const email = prompt('Invite team member to this project by email:');
          if (email && email.trim()) {
            alert(`Invitation sent to ${email.trim()} for project: ${data.title || 'Project'}`);
          }
        });
      }
    }
  };

  // Expose to window
  window.ProjectOverview = ProjectOverview;

})(window);
