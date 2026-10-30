/**
 * Teamden / Brick — Project Overview Tab Component Controller (project-overview.js)
 * Path: pages/project/project-overview/project-overview.js
 *
 * Responsibilities:
 * 1. Loads and binds the Project Overview Tab UI inside the parent Project Tab System
 * 2. Fetches live data from /api/projects/{id}/overview with full resilient fallback
 * 3. Populates 01 Specification, 02 Milestones Timeline, 03 Work in Motion, 04 Project Knowledge
 * 4. Populates Right Column: Project Health, Decision Register, Project Team
 * 5. Binds all interaction handlers (task card filtering, brief viewer, decision reviewer, team modal)
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

  const defaultOverviewData = {
    id: 'featured-01',
    breadcrumb: 'PROJECTS / 02 / WEBSITE REDESIGN',
    title: 'Website Redesign',
    description: 'Redesign the website into a responsive, modern experience with clearer navigation, stronger visual identity and an intuitive customer journey.',
    owner: 'Design Team',
    dueDate: '15 Nov 2026',
    projectType: 'Design / Development',
    health: 'At Risk',
    healthDotColor: 'orange',
    status: 'Active',
    statusDotColor: 'green',
    specification: {
      title: 'Build a better digital experience.',
      objectives: [
        'Improve user experience',
        'Increase conversion rate',
        'Strengthen brand presence'
      ],
      deliverables: [
        'Responsive website (desktop, tablet, mobile)',
        'CMS implementation',
        'Content migration'
      ],
      successCriteria: [
        'Higher engagement',
        'Increased conversion rate',
        'Meets accessibility standards'
      ],
      projectContext: {
        'Client': 'Acme Co.',
        'Type': 'Design / Development',
        'Focus': 'Brand, performance and growth'
      }
    },
    milestonesSummary: '06/09 COMPLETED',
    milestonesCompleted: 6,
    milestonesTotal: 9,
    milestonesList: [
      { id: 'm-1', seqNum: '01', name: 'Discovery', status: 'COMPLETED' },
      { id: 'm-2', seqNum: '02', name: 'Design', status: 'COMPLETED' },
      { id: 'm-3', seqNum: '03', name: 'Development', status: 'COMPLETED' },
      { id: 'm-4', seqNum: '04', name: 'Testing', status: 'COMPLETED' },
      { id: 'm-5', seqNum: '05', name: 'Content', status: 'COMPLETED' },
      { id: 'm-6', seqNum: '06', name: 'Review', status: 'CURRENT', statusLabel: 'In Progress' },
      { id: 'm-7', seqNum: '07', name: 'Launch Prep', status: 'UPCOMING' },
      { id: 'm-8', seqNum: '08', name: 'Go Live', status: 'UPCOMING' },
      { id: 'm-9', seqNum: '09', name: 'Post Launch', status: 'UPCOMING' }
    ],
    workInMotion: [
      { statusKey: 'TODO', statusLabel: 'TO DO', dotColor: 'gray', count: '08', exampleTask: 'Prepare responsive layouts', assigneeAvatar: 'AR' },
      { statusKey: 'IN_PROGRESS', statusLabel: 'IN PROGRESS', dotColor: 'amber', count: '05', exampleTask: 'Homepage development', assigneeAvatar: 'MJ' },
      { statusKey: 'IN_REVIEW', statusLabel: 'IN REVIEW', dotColor: 'blue', count: '03', exampleTask: 'Design system review', assigneeAvatar: 'SK' },
      { statusKey: 'BLOCKED', statusLabel: 'BLOCKED', dotColor: 'red', count: '02', exampleTask: 'Client copy approval', assigneeAvatar: 'PK' }
    ],
    knowledgeDocuments: [
      { name: 'Project Brief', fileType: 'PDF', fileSize: '1.2 MB', iconType: 'pdf' },
      { name: 'Design Review Notes', fileType: 'DOC', fileSize: '850 KB', iconType: 'doc' },
      { name: 'Design References', fileType: 'Figma', fileSize: '24 MB', iconType: 'figma' }
    ],
    unresolvedBlockersCount: 2,
    healthHeading: 'Unresolved blockers',
    healthDescription: 'Two issues need attention before the next milestone.',
    pendingDecision: {
      statusLabel: 'Awaiting Your Review',
      dueDateLabel: 'DUE 30 OCT',
      title: 'Homepage design approval',
      description: 'Final design requires your review before development continues.',
      ownerName: 'Alex R.',
      ownerInitials: 'AR'
    },
    moreDecisionsCount: 2,
    teamMemberInitials: ['PK', 'AR', 'SK', 'MJ'],
    totalTeamMembers: 4
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
      let data = defaultOverviewData;
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

      // --- 02. Milestones Timeline ---
      const ratioLabel = root.querySelector('#milestones-ratio-label');
      if (ratioLabel) {
        ratioLabel.textContent = data.milestonesSummary || '06/09 COMPLETED';
      }

      const progressBar = root.querySelector('#milestones-track-progress');
      if (progressBar && data.milestonesTotal > 0) {
        const pct = Math.min(100, Math.round((data.milestonesCompleted / data.milestonesTotal) * 100));
        progressBar.style.width = `${pct}%`;
      }

      // Render Milestone Nodes if provided
      const trackContainer = root.querySelector('#milestones-track-container');
      if (trackContainer && Array.isArray(data.milestonesList) && data.milestonesList.length > 0) {
        const line = '<div class="milestones-track-line"></div>';
        const pct = data.milestonesTotal > 0 ? Math.min(100, Math.round((data.milestonesCompleted / data.milestonesTotal) * 100)) : 62.5;
        const progress = `<div class="milestones-track-line-progress" style="width: ${pct}%;"></div>`;

        const nodesHtml = data.milestonesList.map(m => {
          const st = (m.status || 'UPCOMING').toUpperCase();
          let cls = 'milestone-node upcoming';
          let circleContent = escapeHtml(m.seqNum || '00');
          let subtagHtml = m.statusLabel ? `<span class="node-subtag">${escapeHtml(m.statusLabel)}</span>` : '';

          if (st === 'COMPLETED') {
            cls = 'milestone-node completed';
            circleContent = '<svg viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>';
          } else if (st === 'CURRENT') {
            cls = 'milestone-node current';
            circleContent = escapeHtml(m.seqNum ? parseInt(m.seqNum, 10) : '6');
          }

          return `
            <div class="${cls}" data-milestone-id="${escapeHtml(m.id || '')}" title="${escapeHtml(m.name)} (${escapeHtml(st)})">
              <div class="node-circle">${circleContent}</div>
              <div class="node-text-wrap">
                <span class="node-num">${escapeHtml(m.seqNum)}</span>
                <span class="node-label">${escapeHtml(m.name)}</span>
                ${subtagHtml}
              </div>
            </div>
          `;
        }).join('');

        trackContainer.innerHTML = line + progress + nodesHtml;
      }

      // --- 03. Work in Motion Cards ---
      const workGrid = root.querySelector('#work-cards-grid');
      if (workGrid && Array.isArray(data.workInMotion) && data.workInMotion.length > 0) {
        workGrid.innerHTML = data.workInMotion.map(card => {
          const avCls = 'avatar-' + (card.assigneeAvatar || 'ar').toLowerCase();
          return `
            <article class="work-card" data-status-filter="${escapeHtml(card.statusKey)}" tabindex="0">
              <div class="work-card-top">
                <span class="work-dot dot-${escapeHtml(card.dotColor || 'gray')}"></span>
                <span class="work-status-label">${escapeHtml(card.statusLabel)}</span>
              </div>
              <span class="work-count-huge">${escapeHtml(card.count)}</span>
              <p class="work-task-sample">${escapeHtml(card.exampleTask)}</p>
              <div class="work-card-bottom">
                <span class="work-avatar ${avCls}" title="${escapeHtml(card.assigneeAvatar)}">${escapeHtml(card.assigneeAvatar)}</span>
                <span class="work-link-text">View all →</span>
              </div>
            </article>
          `;
        }).join('');
      }

      // --- 04. Knowledge Documents ---
      const docsGrid = root.querySelector('#knowledge-cards-grid');
      if (docsGrid && Array.isArray(data.knowledgeDocuments) && data.knowledgeDocuments.length > 0) {
        docsGrid.innerHTML = data.knowledgeDocuments.map(doc => {
          const iconType = (doc.iconType || 'pdf').toLowerCase();
          let iconSvg = '';

          if (iconType === 'figma') {
            iconSvg = `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z"></path>
                <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z"></path>
                <path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z"></path>
                <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z"></path>
                <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z"></path>
              </svg>
            `;
          } else {
            iconSvg = `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                ${iconType === 'doc' ? '<line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line>' : ''}
              </svg>
            `;
          }

          return `
            <a href="#doc-${escapeHtml(doc.name.toLowerCase().replace(/\\s+/g, '-'))}" class="doc-card">
              <div class="doc-icon-box doc-${iconType}">
                ${iconSvg}
              </div>
              <div class="doc-content">
                <h4 class="doc-name">${escapeHtml(doc.name)}</h4>
                <span class="doc-meta">${escapeHtml(doc.fileType)} · ${escapeHtml(doc.fileSize)}</span>
              </div>
            </a>
          `;
        }).join('');
      }

      // --- Right Column: Health ---
      const query = (sel) => root.querySelector(sel) || document.querySelector(sel);

      const blockersCount = query('#health-blockers-count');
      if (blockersCount) {
        blockersCount.textContent = String(data.unresolvedBlockersCount ?? 2).padStart(2, '0');
      }

      const healthHeading = query('#health-heading');
      if (healthHeading) {
        healthHeading.textContent = data.healthHeading || 'Unresolved blockers';
      }

      const healthDesc = query('#health-description');
      if (healthDesc) {
        healthDesc.textContent = data.healthDescription || 'Two issues need attention before the next milestone.';
      }

      // --- Right Column: Decision Register ---
      if (data.pendingDecision) {
        const decStatus = query('#decision-status-label');
        if (decStatus) decStatus.textContent = data.pendingDecision.statusLabel || 'Awaiting Your Review';

        const decDue = query('#decision-due-str');
        if (decDue) decDue.textContent = data.pendingDecision.dueDateLabel || 'DUE 30 OCT';

        const decTitle = query('#decision-title');
        if (decTitle) decTitle.textContent = data.pendingDecision.title || 'Homepage design approval';

        const decDesc = query('#decision-desc');
        if (decDesc) decDesc.textContent = data.pendingDecision.description || 'Final design requires your review before development continues.';

        const decOwner = query('#decision-owner-name');
        if (decOwner) decOwner.textContent = data.pendingDecision.ownerName || 'Alex R.';

        const decAvatar = query('#decision-owner-avatar');
        if (decAvatar) decAvatar.textContent = data.pendingDecision.ownerInitials || 'AR';
      }

      const moreLink = query('#decision-more-link');
      if (moreLink) {
        moreLink.innerHTML = `<span>+ ${data.moreDecisionsCount || 2} more decisions</span><span>→</span>`;
      }

      // --- Right Column: Project Team ---
      const avatarsRow = query('#team-avatars-row');
      if (avatarsRow && Array.isArray(data.teamMemberInitials)) {
        const avatarsHtml = data.teamMemberInitials.map(initials => {
          const avClass = 'avatar-' + initials.toLowerCase();
          return `<span class="team-avatar-circle ${avClass}" title="${escapeHtml(initials)}">${escapeHtml(initials)}</span>`;
        }).join('');
        avatarsRow.innerHTML = avatarsHtml + `
          <button class="team-add-btn" id="btn-add-team-member" title="Add project member" aria-label="Add project member">+</button>
        `;
      }

      const teamFooter = query('#team-count-footer');
      if (teamFooter) {
        teamFooter.textContent = `${data.totalTeamMembers || 4} project members`;
      }
    },

    bindEvents(root, data) {
      if (!root) return;
      const query = (sel) => root.querySelector(sel) || document.querySelector(sel);
      const queryAll = (sel) => {
        const inside = Array.from(root.querySelectorAll(sel));
        const outside = Array.from(document.querySelectorAll(sel));
        return Array.from(new Set([...inside, ...outside]));
      };

      // 1. View full brief click
      const briefBtn = query('#spec-view-brief-link');
      if (briefBtn) {
        briefBtn.addEventListener('click', (e) => {
          e.preventDefault();
          alert('Opening full Project Brief: ' + (data.title || 'Website Redesign'));
        });
      }

      // 2. Work in motion task card click -> switch to Tasks tab or view filter
      queryAll('.work-card').forEach(card => {
        card.addEventListener('click', () => {
          const filter = card.getAttribute('data-status-filter');
          if (window.ProjectTabController && typeof window.ProjectTabController.switchTab === 'function') {
            window.ProjectTabController.switchTab('tasks', { filter });
          } else {
            alert(`Opening Tasks filtered by: ${filter}`);
          }
        });
      });

      // 3. View all tasks action
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

      // 4. View all milestones action
      const viewMilestonesBtn = query('#action-view-all-milestones');
      if (viewMilestonesBtn) {
        viewMilestonesBtn.addEventListener('click', (e) => {
          e.preventDefault();
          alert('Milestones: 6 of 9 completed. Next up: Launch Prep.');
        });
      }

      // 5. Document card click
      queryAll('.doc-card').forEach(doc => {
        doc.addEventListener('click', (e) => {
          e.preventDefault();
          const name = doc.querySelector('.doc-name')?.textContent || 'Document';
          alert(`Opening document: ${name}`);
        });
      });

      // 6. View all documents
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

      // 7. Review blockers button
      const reviewBlockersBtn = query('#btn-review-blockers');
      if (reviewBlockersBtn) {
        reviewBlockersBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (window.ProjectTabController && typeof window.ProjectTabController.switchTab === 'function') {
            window.ProjectTabController.switchTab('tasks', { filter: 'BLOCKED' });
          } else {
            alert('Reviewing 2 active blockers on Website Redesign');
          }
        });
      }

      // 8. Review decision button
      const reviewDecBtn = query('#btn-review-decision');
      if (reviewDecBtn) {
        reviewDecBtn.addEventListener('click', () => {
          alert('Reviewing Decision: Homepage design approval (Due 30 Oct)');
        });
      }

      // 9. Add team member button
      const addTeamBtn = query('#btn-add-team-member');
      if (addTeamBtn) {
        addTeamBtn.addEventListener('click', () => {
          const email = prompt('Invite team member to this project by email:');
          if (email && email.trim()) {
            alert(`Invitation sent to ${email.trim()} for project: ${data.title || 'Website Redesign'}`);
          }
        });
      }

      // 10. Milestone node click
      queryAll('.milestone-node').forEach(node => {
        node.addEventListener('click', () => {
          const name = node.querySelector('.node-label')?.textContent;
          const num = node.querySelector('.node-num')?.textContent;
          alert(`Milestone ${num}: ${name}`);
        });
      });
    }
  };

  // Expose to window
  window.ProjectOverview = ProjectOverview;

})(window);
