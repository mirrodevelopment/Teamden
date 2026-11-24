/**
 * Teamden / Brick — Universal Create & Task Creation Modal
 * Path: fragments/create/universal-create.js
 * Strictly follows the Brick Neo-Editorial Design Reference (media_1794909754042_81d5fe2f.png)
 */
(function () {
  'use strict';

  // ── State ─────────────────────────────────────────────────────────────
  let _isOpen = false;
  let _currentType = 'TASK'; // 'TASK' | 'PROJECT' | 'DOCUMENT' | 'MEETING'
  let _taskOptions = null; // { projects: [], assignees: [], columns: [], priorities: [] }
  let _projectOptions = null; // { teams: [], owners: [], clients: [], statuses: [], priorities: [] }
  let _isLoadingOptions = false;
  let _selectedProject = null;
  let _selectedAssignee = null;
  let _selectedDueDate = '';
  let _linkedSource = null;
  let _isMoreDetailsOpen = false;
  let _isProjectMoreDetailsOpen = false;
  let _drafts = {
    TASK: {},
    PROJECT: {},
    DOCUMENT: {},
    MEETING: {}
  };

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // ── Helper: Format Date ──────────────────────────────────────────────
  function formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const y = parts[0];
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        return `${d} ${MONTH_NAMES[m] || ''} ${y}`;
      }
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
      }
    } catch (e) {
      // Fallback
    }
    return dateStr;
  }

  function getTodayIso() {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // ── Ensure Modal HTML Loaded ─────────────────────────────────────────
  let _loadPromise = null;
  let _eventsBound = false;
  async function ensureLoaded() {
    if (document.getElementById('universal-create-backdrop')) {
      if (!_eventsBound) {
        _bindDomEvents();
        _eventsBound = true;
      }
      return true;
    }
    if (_loadPromise) return _loadPromise;

    _loadPromise = (async () => {
      try {
        const res = await fetch('/fragments/create/universal-create.html?v=2');
        if (res.ok) {
          const html = await res.text();
          const wrapper = document.createElement('div');
          wrapper.innerHTML = html.trim();
          while (wrapper.firstChild) {
            document.body.appendChild(wrapper.firstChild);
          }
        } else {
          console.error('[UniversalCreate] Failed to fetch universal-create.html:', res.status);
        }
      } catch (err) {
        console.error('[UniversalCreate] Error fetching universal-create.html:', err);
      }
      if (!_eventsBound) {
        _bindDomEvents();
        _eventsBound = true;
      }
      return true;
    })();

    return _loadPromise;
  }

  // ── Fetch Options (/api/tasks/options & /api/projects/options) ──────
  async function loadOptions(force = false) {
    if (_taskOptions && _projectOptions && !force) return _taskOptions;
    if (_isLoadingOptions) return;
    _isLoadingOptions = true;

    try {
      const [taskRes, projRes] = await Promise.all([
        fetch('/api/tasks/options').catch(err => { console.warn('task options fetch error:', err); return null; }),
        fetch('/api/projects/options').catch(err => { console.warn('project options fetch error:', err); return null; })
      ]);

      if (taskRes && taskRes.ok) {
        _taskOptions = await taskRes.json();
        _populateProjectDropdown();
        _populateAssigneeDropdown();
        _populateSecondaryProjectDropdowns();
      }

      if (projRes && projRes.ok) {
        _projectOptions = await projRes.json();
        _populateProjectFormOptions();
      }
    } catch (err) {
      console.warn('[UniversalCreate] Could not load creation options:', err);
    } finally {
      _isLoadingOptions = false;
    }
    return _taskOptions;
  }

  // ── Populate Project Form Options ─────────────────────────────────────
  function _populateProjectFormOptions() {
    if (!_projectOptions) return;

    // Populate team select
    const teamSelect = document.getElementById('project-team-select');
    if (teamSelect && _projectOptions.teams) {
      const currentVal = teamSelect.value;
      const optionsHtml = '<option value="" disabled ' + (!currentVal ? 'selected' : '') + '>Select team</option>' +
        _projectOptions.teams.map(t => {
          const sub = t.subtitle ? ` (${t.subtitle})` : '';
          return `<option value="${t.id}" ${currentVal === String(t.id) ? 'selected' : ''}>${escapeHtml(t.name)}${escapeHtml(sub)}</option>`;
        }).join('');
      teamSelect.innerHTML = optionsHtml;
      if (teamSelect.value) {
        _onProjectTeamChanged(teamSelect.value);
      }
    }

    // Populate clients datalist
    const clientsDatalist = document.getElementById('project-clients-datalist');
    if (clientsDatalist && _projectOptions.clients) {
      clientsDatalist.innerHTML = _projectOptions.clients
        .map(c => `<option value="${escapeHtml(c)}"></option>`)
        .join('');
    }

    // Set default target due date (today + 30 days)
    const dueInput = document.getElementById('project-due-input');
    if (dueInput && !dueInput.value) {
      const target = new Date();
      target.setDate(target.getDate() + 30);
      dueInput.value = target.toISOString().split('T')[0];
    }

    // Set default start date (today)
    const startInput = document.getElementById('project-start-date-input');
    if (startInput && !startInput.value) {
      startInput.value = getTodayIso();
    }
  }

  function _onProjectTeamChanged(teamId) {
    const leadSelect = document.getElementById('project-team-lead-select');
    const membersChecklist = document.getElementById('project-members-checklist');
    if (!leadSelect) return;

    if (!teamId || !_projectOptions || !_projectOptions.teams) {
      leadSelect.innerHTML = '<option value="" disabled selected>Select team first</option>';
      leadSelect.disabled = true;
      if (membersChecklist) {
        membersChecklist.innerHTML = '<span class="placeholder-text text-sm">Select a team above to view eligible members.</span>';
      }
      return;
    }

    const team = _projectOptions.teams.find(t => String(t.id) === String(teamId));
    if (!team || !team.members || team.members.length === 0) {
      leadSelect.innerHTML = '<option value="" disabled selected>No members in selected team</option>';
      leadSelect.disabled = true;
      if (membersChecklist) {
        membersChecklist.innerHTML = '<span class="placeholder-text text-sm">No other members in this team.</span>';
      }
      return;
    }

    const members = team.members;
    leadSelect.disabled = false;

    // Populate lead options
    leadSelect.innerHTML = '<option value="" disabled>Select team lead</option>' +
      members.map(m => {
        const idVal = m.userId || m.id;
        const isHead = team.headUserId && String(team.headUserId) === String(idVal);
        return `<option value="${idVal}">${escapeHtml(m.name || 'Member')}${m.role ? ` · ${escapeHtml(m.role)}` : ''}${isHead ? ' (Team Head)' : ''}</option>`;
      }).join('');

    // Pre-select team head if present, else first member
    if (team.headUserId && members.some(m => String(m.userId || m.id) === String(team.headUserId))) {
      leadSelect.value = team.headUserId;
    } else if (members.length > 0) {
      leadSelect.value = members[0].userId || members[0].id;
    }

    _updateProjectMembersChecklist(members, leadSelect.value);
  }

  function _updateProjectMembersChecklist(members, selectedLeadId) {
    const membersChecklist = document.getElementById('project-members-checklist');
    if (!membersChecklist) return;

    const availableMembers = (members || []).filter(m => String(m.userId || m.id) !== String(selectedLeadId));
    if (availableMembers.length === 0) {
      membersChecklist.innerHTML = '<span class="placeholder-text text-sm">No additional members in this team.</span>';
      return;
    }

    membersChecklist.innerHTML = availableMembers.map(m => {
      const idVal = m.userId || m.id;
      return `
        <label class="member-checkbox-item">
          <input type="checkbox" name="project-member" value="${idVal}">
          <span>${escapeHtml(m.name || 'Member')}${m.role ? ` <small style="color:var(--dash-text-muted);">(${escapeHtml(m.role)})</small>` : ''}</span>
        </label>
      `;
    }).join('');
  }

  function toggleProjectMoreDetails() {
    const panel = document.getElementById('project-more-details-panel');
    const btn = document.getElementById('btn-toggle-project-more-details');
    const textSpan = document.getElementById('project-more-details-text');
    if (!panel) return;

    _isProjectMoreDetailsOpen = !_isProjectMoreDetailsOpen;
    panel.style.display = _isProjectMoreDetailsOpen ? 'block' : 'none';
    if (textSpan) textSpan.textContent = _isProjectMoreDetailsOpen ? 'Fewer details' : 'More details';
    if (btn) {
      btn.classList.toggle('active', _isProjectMoreDetailsOpen);
      btn.setAttribute('aria-expanded', _isProjectMoreDetailsOpen ? 'true' : 'false');
    }
  }

  // ── Populate Projects Dropdown ────────────────────────────────────────
  function _populateProjectDropdown(filterText = '') {
    const list = document.getElementById('task-project-options');
    if (!list || !_taskOptions) return;

    list.innerHTML = '';
    const projects = _taskOptions.projects || [];
    const query = (filterText || '').toLowerCase().trim();

    const filtered = projects.filter(p => !query || (p.name && p.name.toLowerCase().includes(query)));

    if (filtered.length === 0) {
      list.innerHTML = `<div class="select-option-empty">${query ? 'No matching projects found' : 'No projects created yet'}</div>`;
      return;
    }

    filtered.forEach(proj => {
      const opt = document.createElement('div');
      opt.className = 'custom-select-option select-option-item';
      if (_selectedProject && _selectedProject.id === proj.id) {
        opt.classList.add('selected');
      }
      opt.setAttribute('role', 'option');
      opt.dataset.id = proj.id;
      opt.dataset.name = proj.name;

      opt.innerHTML = `
        <svg class="option-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
        <div class="option-text">
          <span class="option-name">${escapeHtml(proj.name)}</span>
          ${proj.description ? `<span class="option-sub">${escapeHtml(proj.description)}</span>` : ''}
        </div>
      `;

      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        selectProject(proj);
      });

      list.appendChild(opt);
    });
  }

  function _populateSecondaryProjectDropdowns() {
    if (!_taskOptions || !_taskOptions.projects) return;
    const docSelect = document.getElementById('doc-project-select');
    const meetingSelect = document.getElementById('meeting-project-select');

    const optionsHtml = '<option value="">None / General</option>' +
      _taskOptions.projects.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');

    if (docSelect) docSelect.innerHTML = optionsHtml;
    if (meetingSelect) meetingSelect.innerHTML = optionsHtml;
  }

  function selectProject(proj) {
    _selectedProject = proj;
    const nameEl = document.getElementById('task-project-selected-name');
    const hiddenEl = document.getElementById('task-project-hidden-val');
    if (nameEl) {
      nameEl.textContent = proj ? proj.name : 'Select project...';
      nameEl.classList.toggle('placeholder-text', !proj);
    }
    if (hiddenEl) hiddenEl.value = proj ? (proj.id || '') : '';

    // Close dropdown cleanly
    closeProjectDropdown();

    // Update selection highlight
    const list = document.getElementById('task-project-options');
    if (list) {
      list.querySelectorAll('.custom-select-option, .select-option-item').forEach(el => {
        el.classList.toggle('selected', el.dataset.id === (proj ? proj.id : ''));
      });
    }
  }

  // ── Populate Assignee Dropdown ────────────────────────────────────────
  function _populateAssigneeDropdown() {
    const list = document.getElementById('task-assignee-options');
    if (!list || !_taskOptions) return;

    list.innerHTML = '';
    const assignees = _taskOptions.assignees || [];

    if (assignees.length === 0) {
      list.innerHTML = '<div class="select-option-empty">No active members found</div>';
      return;
    }

    assignees.forEach(assignee => {
      const opt = document.createElement('div');
      opt.className = 'custom-select-option select-option-item';
      if (_selectedAssignee && _selectedAssignee.id === assignee.id) {
        opt.classList.add('selected');
      }
      opt.setAttribute('role', 'option');
      opt.dataset.id = assignee.id;

      const initials = assignee.initials || (assignee.name ? assignee.name.substring(0, 2).toUpperCase() : 'TD');

      opt.innerHTML = `
        <div class="assignee-avatar-badge">${escapeHtml(initials)}</div>
        <div class="option-text">
          <span class="option-name">${escapeHtml(assignee.name || 'Unnamed')}</span>
          ${assignee.role ? `<span class="option-sub">${escapeHtml(assignee.role)}</span>` : ''}
        </div>
      `;

      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        selectAssignee(assignee);
      });

      list.appendChild(opt);
    });
  }

  function selectAssignee(assignee) {
    _selectedAssignee = assignee;
    const avatarEl = document.getElementById('task-assignee-selected-avatar');
    const nameEl = document.getElementById('task-assignee-selected-name');
    const hiddenEl = document.getElementById('task-assignee-hidden-val');

    const initials = assignee ? (assignee.initials || (assignee.name ? assignee.name.substring(0, 2).toUpperCase() : 'TD')) : '--';
    if (avatarEl) avatarEl.textContent = initials;
    if (nameEl) {
      nameEl.textContent = assignee ? assignee.name : 'Select assignee...';
      nameEl.classList.toggle('placeholder-text', !assignee);
    }
    if (hiddenEl) hiddenEl.value = assignee ? (assignee.id || '') : '';

    // Close dropdown cleanly
    closeAssigneeDropdown();

    // Update selection highlight
    const list = document.getElementById('task-assignee-options');
    if (list) {
      list.querySelectorAll('.custom-select-option, .select-option-item').forEach(el => {
        el.classList.toggle('selected', el.dataset.id === (assignee ? assignee.id : ''));
      });
    }
  }

  // ── Set Due Date ──────────────────────────────────────────────────────
  function setDueDate(isoDate) {
    _selectedDueDate = isoDate || '';
    const rawInput = document.getElementById('task-due-date-raw');
    const displayEl = document.getElementById('task-due-formatted-display');
    if (rawInput) rawInput.value = _selectedDueDate;
    if (displayEl) {
      if (_selectedDueDate) {
        displayEl.textContent = formatDisplayDate(_selectedDueDate);
        displayEl.classList.remove('placeholder-text');
      } else {
        displayEl.textContent = 'Select due date...';
        displayEl.classList.add('placeholder-text');
      }
    }
  }

  // ── Switch Creation Type (Task, Project, Document, Meeting) ────────────
  function switchType(type) {
    if (!type) return;
    const targetType = type.toUpperCase();

    // 1. Save current form inputs into memory draft
    _saveDraft(_currentType);

    _currentType = targetType;

    // 2. Update Type Cards
    const cards = document.querySelectorAll('.create-type-card');
    cards.forEach(card => {
      const cardType = card.dataset.type;
      const isActive = cardType === targetType;
      card.classList.toggle('active', isActive);
      card.setAttribute('aria-selected', isActive ? 'true' : 'false');
      card.setAttribute('tabindex', isActive ? '0' : '-1');
    });

    // 3. Update Form Panels
    const panels = {
      TASK: document.getElementById('form-panel-task'),
      PROJECT: document.getElementById('form-panel-project'),
      DOCUMENT: document.getElementById('form-panel-document'),
      MEETING: document.getElementById('form-panel-meeting')
    };

    Object.keys(panels).forEach(key => {
      const panel = panels[key];
      if (panel) {
        if (key === targetType) {
          panel.style.display = 'block';
          panel.classList.add('active');
        } else {
          panel.style.display = 'none';
          panel.classList.remove('active');
        }
      }
    });

    // 4. Restore draft if available
    _restoreDraft(targetType);

    // 5. Auto focus relevant input
    setTimeout(() => {
      if (targetType === 'TASK') {
        const inp = document.getElementById('task-name-input');
        if (inp) inp.focus();
      } else if (targetType === 'PROJECT') {
        const inp = document.getElementById('project-name-input');
        if (inp) inp.focus();
      } else if (targetType === 'DOCUMENT') {
        const inp = document.getElementById('doc-title-input');
        if (inp) inp.focus();
      } else if (targetType === 'MEETING') {
        const inp = document.getElementById('meeting-title-input');
        if (inp) inp.focus();
      }
    }, 60);
  }

  function _saveDraft(type) {
    if (type === 'TASK') {
      const title = document.getElementById('task-name-input');
      const desc = document.getElementById('task-desc-textarea');
      _drafts.TASK = {
        title: title ? title.value : '',
        desc: desc ? desc.value : ''
      };
    } else if (type === 'PROJECT') {
      const name = document.getElementById('project-name-input');
      const desc = document.getElementById('project-desc-textarea');
      const team = document.getElementById('project-team-select');
      const lead = document.getElementById('project-team-lead-select');
      const cat = document.getElementById('project-category-select');
      const prio = document.getElementById('project-priority-select');
      const due = document.getElementById('project-due-input');
      const client = document.getElementById('project-client-input');
      const cover = document.getElementById('project-cover-image-input');
      const start = document.getElementById('project-start-date-input');
      const deliv = document.getElementById('project-deliverables-textarea');
      const tags = document.getElementById('project-tags-input');
      _drafts.PROJECT = {
        name: name ? name.value : '',
        desc: desc ? desc.value : '',
        teamId: team ? team.value : '',
        teamLeadId: lead ? lead.value : '',
        category: cat ? cat.value : 'Design',
        priority: prio ? prio.value : 'Medium',
        dueDate: due ? due.value : '',
        clientName: client ? client.value : '',
        coverImageUrl: cover ? cover.value : '',
        startDate: start ? start.value : '',
        deliverables: deliv ? deliv.value : '',
        tags: tags ? tags.value : ''
      };
    } else if (type === 'DOCUMENT') {
      const title = document.getElementById('doc-title-input');
      const content = document.getElementById('doc-content-textarea');
      _drafts.DOCUMENT = {
        title: title ? title.value : '',
        content: content ? content.value : ''
      };
    } else if (type === 'MEETING') {
      const title = document.getElementById('meeting-title-input');
      const desc = document.getElementById('meeting-desc-textarea');
      _drafts.MEETING = {
        title: title ? title.value : '',
        desc: desc ? desc.value : ''
      };
    }
  }

  function _restoreDraft(type) {
    const draft = _drafts[type];
    if (!draft) return;
    if (type === 'TASK') {
      const title = document.getElementById('task-name-input');
      const desc = document.getElementById('task-desc-textarea');
      if (title && draft.title !== undefined) title.value = draft.title;
      if (desc && draft.desc !== undefined) desc.value = draft.desc;
    } else if (type === 'PROJECT') {
      const name = document.getElementById('project-name-input');
      const desc = document.getElementById('project-desc-textarea');
      const team = document.getElementById('project-team-select');
      const lead = document.getElementById('project-team-lead-select');
      const cat = document.getElementById('project-category-select');
      const prio = document.getElementById('project-priority-select');
      const due = document.getElementById('project-due-input');
      const client = document.getElementById('project-client-input');
      const cover = document.getElementById('project-cover-image-input');
      const start = document.getElementById('project-start-date-input');
      const deliv = document.getElementById('project-deliverables-textarea');
      const tags = document.getElementById('project-tags-input');
      if (name && draft.name !== undefined) name.value = draft.name;
      if (desc && draft.desc !== undefined) desc.value = draft.desc;
      if (team && draft.teamId) {
        team.value = draft.teamId;
        _onProjectTeamChanged(draft.teamId);
      }
      if (lead && draft.teamLeadId) lead.value = draft.teamLeadId;
      if (cat && draft.category) cat.value = draft.category;
      if (prio && draft.priority) prio.value = draft.priority;
      if (due && draft.dueDate) due.value = draft.dueDate;
      if (client && draft.clientName) client.value = draft.clientName;
      if (cover && draft.coverImageUrl) cover.value = draft.coverImageUrl;
      if (start && draft.startDate) start.value = draft.startDate;
      if (deliv && draft.deliverables) deliv.value = draft.deliverables;
      if (tags && draft.tags) tags.value = draft.tags;
    } else if (type === 'DOCUMENT') {
      const title = document.getElementById('doc-title-input');
      const content = document.getElementById('doc-content-textarea');
      if (title && draft.title !== undefined) title.value = draft.title;
      if (content && draft.content !== undefined) content.value = draft.content;
    } else if (type === 'MEETING') {
      const title = document.getElementById('meeting-title-input');
      const desc = document.getElementById('meeting-desc-textarea');
      if (title && draft.title !== undefined) title.value = draft.title;
      if (desc && draft.desc !== undefined) desc.value = draft.desc;
    }
  }

  // ── Toggle More Details Panel ─────────────────────────────────────────
  function toggleMoreDetails() {
    const panel = document.getElementById('task-more-details-panel');
    const btn = document.getElementById('btn-toggle-more-details');
    const textSpan = document.getElementById('more-details-text');
    if (!panel) return;

    _isMoreDetailsOpen = !_isMoreDetailsOpen;
    panel.style.display = _isMoreDetailsOpen ? 'block' : 'none';
    if (textSpan) textSpan.textContent = _isMoreDetailsOpen ? 'Fewer details' : 'More details';
    if (btn) {
      btn.classList.toggle('active', _isMoreDetailsOpen);
      btn.setAttribute('aria-expanded', _isMoreDetailsOpen ? 'true' : 'false');
    }
  }

  // ── Linked Source Context ─────────────────────────────────────────────
  function setLinkedSource(source) {
    _linkedSource = source;
    const card = document.getElementById('task-linked-source-card');
    const nameEl = document.getElementById('linked-source-name');
    const subEl = document.getElementById('linked-source-sub');
    const idEl = document.getElementById('linked-source-id');

    if (!card) return;

    if (source && source.title) {
      if (nameEl) nameEl.textContent = source.title;
      if (subEl) {
        const proj = source.project || 'General';
        const snip = source.snippet ? ` · ${source.snippet}` : '';
        subEl.textContent = `${proj}${snip}`;
      }
      if (idEl) idEl.value = source.id || '';
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
      if (idEl) idEl.value = '';
    }
  }

  function removeLinkedSource() {
    setLinkedSource(null);
  }

  // ── Open / Close Modal ────────────────────────────────────────────────
  async function open(type = 'TASK', initialContext = {}) {
    await ensureLoaded();
    await loadOptions();

    const backdrop = document.getElementById('universal-create-backdrop');
    if (!backdrop) return;

    // Set Context
    if (initialContext.column) {
      const colSelect = document.getElementById('task-column-select');
      if (colSelect) colSelect.value = initialContext.column;
    }
    if (initialContext.priority) {
      const prioSelect = document.getElementById('task-priority-select');
      if (prioSelect) prioSelect.value = initialContext.priority;
    }

    // Default Date to today or provided date
    const initialDate = initialContext.dueDate || getTodayIso();
    setDueDate(initialDate);

    // Pre-select project if specified, or default to first project
    if (initialContext.projectId && _taskOptions && _taskOptions.projects) {
      const match = _taskOptions.projects.find(p => p.id === initialContext.projectId);
      if (match) selectProject(match);
      else selectProject(null);
    } else if (!_selectedProject && _taskOptions && _taskOptions.projects && _taskOptions.projects.length > 0) {
      selectProject(_taskOptions.projects[0]);
    } else if (!_selectedProject) {
      selectProject(null);
    }

    // Pre-select assignee if specified, or default to first assignee
    if (initialContext.assigneeId && _taskOptions && _taskOptions.assignees) {
      const match = _taskOptions.assignees.find(a => a.id === initialContext.assigneeId);
      if (match) selectAssignee(match);
      else selectAssignee(null);
    } else if (!_selectedAssignee && _taskOptions && _taskOptions.assignees && _taskOptions.assignees.length > 0) {
      selectAssignee(_taskOptions.assignees[0]);
    } else if (!_selectedAssignee) {
      selectAssignee(null);
    }

    // Handle Linked Source Context
    if (initialContext.linkedSource) {
      setLinkedSource(initialContext.linkedSource);
    } else {
      setLinkedSource(null);
    }

    // Pre-fill Title if passed
    if (initialContext.title) {
      const taskInput = document.getElementById('task-name-input');
      if (taskInput) taskInput.value = initialContext.title;
    }

    // Switch to requested type
    switchType(type || 'TASK');

    // Show Modal
    backdrop.classList.add('open');
    backdrop.removeAttribute('inert');
    document.body.style.overflow = 'hidden';
    _isOpen = true;
  }

  function close() {
    const backdrop = document.getElementById('universal-create-backdrop');
    if (backdrop) {
      backdrop.classList.remove('open');
      backdrop.setAttribute('inert', '');
    }
    document.body.style.overflow = '';
    _isOpen = false;

    // Close any open custom dropdowns
    _closeAllDropdowns();
  }

  // ── Dropdown Toggle Functions ─────────────────────────────────────────
  function closeProjectDropdown() {
    const wrap = document.getElementById('task-project-select-wrap');
    const trigger = document.getElementById('task-project-trigger');
    const dropdown = document.getElementById('task-project-dropdown');
    if (wrap) {
      wrap.classList.remove('active');
      wrap.closest('.form-field-group')?.classList.remove('active-dropdown');
    }
    if (dropdown) dropdown.classList.remove('open');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  }

  function closeAssigneeDropdown() {
    const wrap = document.getElementById('task-assignee-select-wrap');
    const trigger = document.getElementById('task-assignee-trigger');
    const dropdown = document.getElementById('task-assignee-dropdown');
    if (wrap) {
      wrap.classList.remove('active');
      wrap.closest('.form-field-group')?.classList.remove('active-dropdown');
    }
    if (dropdown) dropdown.classList.remove('open');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  }

  async function toggleProjectDropdown(force) {
    const wrap = document.getElementById('task-project-select-wrap');
    const trigger = document.getElementById('task-project-trigger');
    const dropdown = document.getElementById('task-project-dropdown');
    const searchInput = document.getElementById('task-project-search');
    if (!dropdown || !wrap) return;

    const currentlyOpen = wrap.classList.contains('active');
    const willOpen = typeof force === 'boolean' ? force : !currentlyOpen;

    if (!willOpen) {
      closeProjectDropdown();
      return;
    }

    // Close other dropdown directly without recursion
    closeAssigneeDropdown();

    if (!_taskOptions) {
      await loadOptions();
    }

    wrap.classList.add('active');
    dropdown.classList.add('open');
    wrap.closest('.form-field-group')?.classList.add('active-dropdown');
    if (trigger) trigger.setAttribute('aria-expanded', 'true');

    if (searchInput) {
      setTimeout(() => searchInput.focus(), 60);
    }
  }

  async function toggleAssigneeDropdown(force) {
    const wrap = document.getElementById('task-assignee-select-wrap');
    const trigger = document.getElementById('task-assignee-trigger');
    const dropdown = document.getElementById('task-assignee-dropdown');
    if (!dropdown || !wrap) return;

    const currentlyOpen = wrap.classList.contains('active');
    const willOpen = typeof force === 'boolean' ? force : !currentlyOpen;

    if (!willOpen) {
      closeAssigneeDropdown();
      return;
    }

    // Close other dropdown directly without recursion
    closeProjectDropdown();

    if (!_taskOptions) {
      await loadOptions();
    }

    wrap.classList.add('active');
    dropdown.classList.add('open');
    wrap.closest('.form-field-group')?.classList.add('active-dropdown');
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
  }

  function _closeAllDropdowns() {
    closeProjectDropdown();
    closeAssigneeDropdown();
  }

  function openDatePicker() {
    const dateInput = document.getElementById('task-due-date-raw');
    if (!dateInput) return;
    try {
      if (typeof dateInput.showPicker === 'function') {
        dateInput.showPicker();
      } else {
        dateInput.focus();
      }
    } catch (err) {
      dateInput.focus();
    }
  }

  // ── Bind DOM Events ───────────────────────────────────────────────────
  function _bindDomEvents() {
    const backdrop = document.getElementById('universal-create-backdrop');
    const modal = document.getElementById('universal-create-modal');
    const closeBtn = document.getElementById('btn-close-create-modal');

    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          close();
        }
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => close());
    }

    // ESC key closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && _isOpen) {
        close();
      }
    });

    // Left Column Type Cards
    const typeCards = document.querySelectorAll('.create-type-card');
    typeCards.forEach(card => {
      card.addEventListener('click', () => {
        const type = card.dataset.type;
        switchType(type);
      });
    });

    // Project Dropdown Trigger
    const projTrigger = document.getElementById('task-project-trigger');
    const projSearch = document.getElementById('task-project-search');

    if (projTrigger) {
      projTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleProjectDropdown();
      });
    }

    if (projSearch) {
      projSearch.addEventListener('input', (e) => {
        _populateProjectDropdown(e.target.value);
      });
      projSearch.addEventListener('click', (e) => e.stopPropagation());
    }

    // Assignee Dropdown Trigger
    const assigneeTrigger = document.getElementById('task-assignee-trigger');
    if (assigneeTrigger) {
      assigneeTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleAssigneeDropdown();
      });
    }

    // Date Picker Trigger
    const dateTrigger = document.getElementById('task-due-trigger');
    const dateWrap = document.getElementById('task-date-select-wrap');
    const dateInput = document.getElementById('task-due-date-raw');

    if (dateTrigger) {
      dateTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openDatePicker();
      });
    }

    if (dateWrap) {
      dateWrap.addEventListener('click', (e) => {
        if (e.target !== dateTrigger && !dateTrigger?.contains(e.target)) {
          openDatePicker();
        }
      });
    }

    if (dateInput) {
      dateInput.addEventListener('change', (e) => {
        setDueDate(e.target.value);
      });
      dateInput.addEventListener('input', (e) => {
        setDueDate(e.target.value);
      });
    }

    // Close dropdowns on document click (only when modal is active)
    document.addEventListener('click', (e) => {
      const backdrop = document.getElementById('universal-create-backdrop');
      if (!backdrop || !backdrop.classList.contains('open')) return;

      if (!e.target.closest('#task-project-select-wrap')) {
        closeProjectDropdown();
      }
      if (!e.target.closest('#task-assignee-select-wrap')) {
        closeAssigneeDropdown();
      }
    });

    // Remove Linked Source
    const removeLinkedBtn = document.getElementById('btn-remove-linked-source');
    if (removeLinkedBtn) {
      removeLinkedBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        removeLinkedSource();
      });
    }

    // Task More Details Toggle
    const moreDetailsBtn = document.getElementById('btn-toggle-more-details');
    if (moreDetailsBtn) {
      moreDetailsBtn.addEventListener('click', () => {
        toggleMoreDetails();
      });
    }

    // Project More Details Toggle
    const projectMoreDetailsBtn = document.getElementById('btn-toggle-project-more-details');
    if (projectMoreDetailsBtn) {
      projectMoreDetailsBtn.addEventListener('click', () => {
        toggleProjectMoreDetails();
      });
    }

    // Project Team Change Listener
    const projectTeamSelect = document.getElementById('project-team-select');
    if (projectTeamSelect) {
      projectTeamSelect.addEventListener('change', (e) => {
        _onProjectTeamChanged(e.target.value);
      });
    }

    // Project Team Lead Change Listener
    const projectTeamLeadSelect = document.getElementById('project-team-lead-select');
    if (projectTeamLeadSelect) {
      projectTeamLeadSelect.addEventListener('change', (e) => {
        const teamSelect = document.getElementById('project-team-select');
        const team = _projectOptions?.teams?.find(t => String(t.id) === String(teamSelect?.value));
        if (team && team.members) {
          _updateProjectMembersChecklist(team.members, e.target.value);
        }
      });
    }

    // Create & Add Another
    const addAnotherBtn = document.getElementById('btn-create-add-another');
    if (addAnotherBtn) {
      addAnotherBtn.addEventListener('click', () => {
        submitTask(true);
      });
    }

    // Form Submit Listeners
    const formTask = document.getElementById('form-panel-task');
    if (formTask) {
      formTask.addEventListener('submit', (e) => {
        e.preventDefault();
        submitTask();
      });
    }

    const formProject = document.getElementById('form-panel-project');
    if (formProject) {
      formProject.addEventListener('submit', (e) => {
        e.preventDefault();
        submitProject();
      });
    }

    const formDoc = document.getElementById('form-panel-document');
    if (formDoc) {
      formDoc.addEventListener('submit', (e) => {
        e.preventDefault();
        submitDocument();
      });
    }

    const formMeeting = document.getElementById('form-panel-meeting');
    if (formMeeting) {
      formMeeting.addEventListener('submit', (e) => {
        e.preventDefault();
        submitMeeting();
      });
    }

    // Refresh project team options when a new team is created from any page
    document.addEventListener('teamden:teamCreated', () => {
      loadOptions(true);
    });
  }

  // ── Submit Handlers ───────────────────────────────────────────────────

  // 1. Submit Task
  async function submitTask(keepOpen = false) {
    const errorEl = document.getElementById('task-create-error');
    if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = ''; }

    const titleInput = document.getElementById('task-name-input');
    const title = titleInput ? titleInput.value.trim() : '';

    if (!title) {
      if (errorEl) {
        errorEl.textContent = 'Please enter a task name.';
        errorEl.style.display = 'block';
      }
      if (titleInput) titleInput.focus();
      return;
    }

    const descInput = document.getElementById('task-desc-textarea');
    let description = descInput ? descInput.value.trim() : '';

    if (_linkedSource && _linkedSource.title) {
      const sourceNote = `[Linked from: ${_linkedSource.title}${_linkedSource.project ? ` (${_linkedSource.project})` : ''}]`;
      if (!description.includes(sourceNote)) {
        description = description ? `${description}\n\n${sourceNote}` : sourceNote;
      }
    }

    const colSelect = document.getElementById('task-column-select');
    const column = colSelect ? colSelect.value : 'NOW';

    const prioSelect = document.getElementById('task-priority-select');
    const priority = prioSelect ? prioSelect.value : 'MEDIUM';

    const statusSelect = document.getElementById('task-status-select');
    const status = statusSelect ? statusSelect.value : 'TODO';

    const tagInput = document.getElementById('task-tag-input');
    const projectTag = tagInput && tagInput.value.trim() ? tagInput.value.trim() : (_selectedProject ? _selectedProject.name : null);

    const payload = {
      title,
      description: description || null,
      column,
      priority,
      status,
      projectId: _selectedProject ? _selectedProject.id : null,
      projectTag,
      assigneeId: _selectedAssignee ? _selectedAssignee.id : null,
      dueDate: _selectedDueDate || getTodayIso()
    };

    const submitBtn = document.getElementById('btn-submit-task');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add('loading');
    }

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Server responded with ${res.status}`);
      }

      const created = await res.json();

      // Show toast
      if (typeof window.showToast === 'function') {
        window.showToast(`Task "${created.title || title}" created`);
      }

      // Notify other views
      _dispatchCreationEvent('task', created);

      if (keepOpen) {
        // Reset only title, description and linked source
        if (titleInput) {
          titleInput.value = '';
          titleInput.focus();
        }
        if (descInput) descInput.value = '';
        removeLinkedSource();
        _drafts.TASK = {};
      } else {
        close();
        if (titleInput) titleInput.value = '';
        if (descInput) descInput.value = '';
        removeLinkedSource();
        _drafts.TASK = {};
      }
    } catch (err) {
      console.error('[UniversalCreate] Task submission failed:', err);
      if (errorEl) {
        errorEl.textContent = err.message || 'Failed to create task. Please try again.';
        errorEl.style.display = 'block';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
      }
    }
  }

  // 2. Submit Project
  async function submitProject() {
    const errorEl = document.getElementById('project-create-error');
    if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = ''; }

    // Mandatory: Project Name
    const nameInput = document.getElementById('project-name-input');
    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) {
      _showProjectError('Please enter a project name.', nameInput);
      return;
    }

    // Mandatory: Description & Goals
    const descInput = document.getElementById('project-desc-textarea');
    const desc = descInput ? descInput.value.trim() : '';
    if (!desc) {
      _showProjectError('Please explain the project objectives, expected deliverables, and success criteria.', descInput);
      return;
    }

    // Mandatory: Team Name
    const teamSelect = document.getElementById('project-team-select');
    const teamId = teamSelect ? teamSelect.value : '';
    if (!teamId) {
      _showProjectError('Please select a team for this project.', teamSelect);
      return;
    }
    const teamName = teamSelect.options[teamSelect.selectedIndex]?.text.split('(')[0].trim();

    // Mandatory: Team Lead
    const leadSelect = document.getElementById('project-team-lead-select');
    const teamLeadId = leadSelect ? leadSelect.value : '';
    if (!teamLeadId) {
      _showProjectError('Please select an active team lead for this project.', leadSelect);
      return;
    }

    // Mandatory: Category
    const categorySelect = document.getElementById('project-category-select');
    const category = categorySelect ? categorySelect.value : 'Design';

    // Mandatory: Priority
    const prioSelect = document.getElementById('project-priority-select');
    const priority = prioSelect ? prioSelect.value : 'Medium';

    // Mandatory: Target Due Date
    const dueInput = document.getElementById('project-due-input');
    const dueDate = dueInput ? dueInput.value : '';
    if (!dueDate) {
      _showProjectError('Please select a target due date.', dueInput);
      return;
    }

    // Optional Fields from More Details
    const clientInput = document.getElementById('project-client-input');
    const clientName = clientInput && clientInput.value.trim() ? clientInput.value.trim() : null;

    const coverImageInput = document.getElementById('project-cover-image-input');
    const coverImageUrl = coverImageInput && coverImageInput.value.trim() ? coverImageInput.value.trim() : null;

    const startDateInput = document.getElementById('project-start-date-input');
    const startDate = startDateInput && startDateInput.value ? startDateInput.value : getTodayIso();

    const deliverablesTextarea = document.getElementById('project-deliverables-textarea');
    const deliverables = deliverablesTextarea && deliverablesTextarea.value.trim() ? deliverablesTextarea.value.trim() : null;

    const tagsInput = document.getElementById('project-tags-input');
    const tags = tagsInput && tagsInput.value.trim() ? tagsInput.value.trim() : null;

    const memberCheckboxes = document.querySelectorAll('#project-members-checklist input[type="checkbox"]:checked');
    const memberIds = Array.from(memberCheckboxes).map(cb => cb.value);

    const payload = {
      name,
      description: desc,
      goals: desc,
      teamId,
      teamName,
      teamLeadId,
      category,
      projectType: category,
      priority,
      status: 'PLANNING', // Initialized as Planned (Default) per user specification
      health: 'ON_TRACK',
      dueDate,
      startDate,
      clientName,
      coverImageUrl,
      deliverables,
      tags,
      memberIds: memberIds.length > 0 ? memberIds : null
    };

    const submitBtn = document.getElementById('btn-submit-project');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add('loading');
    }

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error ${res.status}`);
      }

      const created = await res.json();

      if (typeof window.showToast === 'function') {
        window.showToast(`Project "${created.name || name}" created successfully.`, 'success');
      }

      _dispatchCreationEvent('project', created);
      _drafts.PROJECT = {};

      // Reset form fields
      if (nameInput) nameInput.value = '';
      if (descInput) descInput.value = '';
      if (teamSelect) teamSelect.selectedIndex = 0;
      if (leadSelect) {
        leadSelect.innerHTML = '<option value="" disabled selected>Select team first</option>';
        leadSelect.disabled = true;
      }
      if (categorySelect) categorySelect.value = 'Design';
      if (prioSelect) prioSelect.value = 'Medium';
      if (clientInput) clientInput.value = '';
      if (coverImageInput) coverImageInput.value = '';
      if (deliverablesTextarea) deliverablesTextarea.value = '';
      if (tagsInput) tagsInput.value = '';
      const membersChecklist = document.getElementById('project-members-checklist');
      if (membersChecklist) {
        membersChecklist.innerHTML = '<span class="placeholder-text text-sm">Select a team above to view eligible members.</span>';
      }

      // Reload options so the new project shows up in task and doc project dropdowns
      loadOptions(true);

      close();
    } catch (err) {
      console.error('[UniversalCreate] Project creation failed:', err);
      if (errorEl) {
        errorEl.textContent = err.message || 'Failed to create project.';
        errorEl.style.display = 'block';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
      }
    }
  }

  function _showProjectError(msg, focusEl) {
    const errorEl = document.getElementById('project-create-error');
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
    }
    if (focusEl) {
      focusEl.focus();
    }
  }

  // 3. Submit Document
  async function submitDocument() {
    const errorEl = document.getElementById('doc-create-error');
    if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = ''; }

    const titleInput = document.getElementById('doc-title-input');
    const title = titleInput ? titleInput.value.trim() : '';

    if (!title) {
      if (errorEl) {
        errorEl.textContent = 'Please enter a document title.';
        errorEl.style.display = 'block';
      }
      if (titleInput) titleInput.focus();
      return;
    }

    const catSelect = document.getElementById('doc-category-select');
    const category = catSelect ? catSelect.value : 'Meeting Notes';

    const projSelect = document.getElementById('doc-project-select');
    const projectId = projSelect && projSelect.value ? projSelect.value : null;

    const contentInput = document.getElementById('doc-content-textarea');
    const content = contentInput ? contentInput.value.trim() : '';

    const payload = {
      title,
      category,
      content,
      projectId: projectId || null,
      fileType: 'doc'
    };

    const submitBtn = document.getElementById('btn-submit-document');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add('loading');
    }

    try {
      const res = await fetch('/api/projects/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error ${res.status}`);
      }

      const created = await res.json();

      if (typeof window.showToast === 'function') {
        window.showToast(`Document "${created.title || title}" created`);
      }

      _dispatchCreationEvent('document', created);
      _drafts.DOCUMENT = {};
      if (titleInput) titleInput.value = '';
      if (contentInput) contentInput.value = '';

      close();
    } catch (err) {
      console.error('[UniversalCreate] Document creation failed:', err);
      if (errorEl) {
        errorEl.textContent = err.message || 'Failed to create document.';
        errorEl.style.display = 'block';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
      }
    }
  }

  // 4. Submit Meeting
  async function submitMeeting() {
    const errorEl = document.getElementById('meeting-create-error');
    if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = ''; }

    const titleInput = document.getElementById('meeting-title-input');
    const title = titleInput ? titleInput.value.trim() : '';

    if (!title) {
      if (errorEl) {
        errorEl.textContent = 'Please enter a meeting title.';
        errorEl.style.display = 'block';
      }
      if (titleInput) titleInput.focus();
      return;
    }

    const dateInput = document.getElementById('meeting-date-input');
    const date = dateInput && dateInput.value ? dateInput.value : getTodayIso();

    const startTimeInput = document.getElementById('meeting-start-time');
    const startTime = startTimeInput && startTimeInput.value ? startTimeInput.value : '10:00';

    const endTimeInput = document.getElementById('meeting-end-time');
    const endTime = endTimeInput && endTimeInput.value ? endTimeInput.value : '11:00';

    const projSelect = document.getElementById('meeting-project-select');
    let project = 'General';
    if (projSelect && projSelect.selectedIndex >= 0) {
      project = projSelect.options[projSelect.selectedIndex].text || 'General';
    }

    const descInput = document.getElementById('meeting-desc-textarea');
    const desc = descInput ? descInput.value.trim() : '';

    const payload = {
      title,
      date,
      startTime,
      endTime,
      project,
      sub: `${startTime} - ${endTime}`,
      category: 'MEETING',
      colorTheme: 'green',
      calendar: 'WORK',
      icon: 'calendar',
      location: 'Virtual / Google Meet',
      attendees: ['You'],
      desc
    };

    const submitBtn = document.getElementById('btn-submit-meeting');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add('loading');
    }

    try {
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error ${res.status}`);
      }

      const created = await res.json();

      if (typeof window.showToast === 'function') {
        window.showToast(`Meeting "${created.title || title}" scheduled`);
      }

      _dispatchCreationEvent('meeting', created);
      _drafts.MEETING = {};
      if (titleInput) titleInput.value = '';
      if (descInput) descInput.value = '';

      close();
    } catch (err) {
      console.error('[UniversalCreate] Meeting creation failed:', err);
      if (errorEl) {
        errorEl.textContent = err.message || 'Failed to schedule meeting.';
        errorEl.style.display = 'block';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
      }
    }
  }

  // ── Dispatch Events & Refresh Views ──────────────────────────────────
  function _dispatchCreationEvent(type, entity) {
    // Standard CustomEvent
    window.dispatchEvent(new CustomEvent('teamden:created', {
      detail: { type, entity }
    }));

    // Specific triggers
    if (type === 'task') {
      window.dispatchEvent(new CustomEvent('teamden:taskCreated', { detail: entity }));
      if (typeof window.refreshDashboardData === 'function') window.refreshDashboardData();
      if (typeof window.loadTasks === 'function') window.loadTasks();
      if (window.TasksPage && typeof window.TasksPage.loadTasks === 'function') window.TasksPage.loadTasks();
    } else if (type === 'project') {
      window.dispatchEvent(new CustomEvent('teamden:projectCreated', { detail: entity }));
      if (typeof window.refreshDashboardData === 'function') window.refreshDashboardData();
      if (typeof window.loadProjects === 'function') window.loadProjects();
    } else if (type === 'meeting') {
      window.dispatchEvent(new CustomEvent('teamden:eventCreated', { detail: entity }));
      if (typeof window.refreshDashboardData === 'function') window.refreshDashboardData();
      if (typeof window.loadCalendarData === 'function') window.loadCalendarData();
    }
  }

  // ── Escape HTML Utility ───────────────────────────────────────────────
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ── Public API ────────────────────────────────────────────────────────
  window.UniversalCreate = {
    open,
    close,
    switchType,
    selectProject,
    selectAssignee,
    setDueDate,
    setLinkedSource,
    removeLinkedSource,
    toggleMoreDetails,
    submitTask,
    submitProject,
    submitDocument,
    submitMeeting,
    ensureLoaded,
    loadOptions
  };

  // Eager pre-load when script is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ensureLoaded();
    });
  } else {
    ensureLoaded();
  }

})();
