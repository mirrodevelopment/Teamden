/**
 * Meeting Detail Page Logic — meeting-detail.js
 * Loads event data from /api/calendar/events/{id} and renders
 * the full Brick-inspired meeting detail view.
 */

(function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────────
  let eventId = null;
  let eventData = null;
  let notesSaveTimer = null;
  let agendaItems = [];
  let decisions = [];
  let followups = [];

  const CHIP_ICONS = [
    // Monitor
    `<svg class="md-agenda-chip-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    // Mobile phone
    `<svg class="md-agenda-chip-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
    // Box / Layers
    `<svg class="md-agenda-chip-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`
  ];

  // ── Bootstrap ──────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    loadFragments().then(() => {
      eventId = getEventIdFromUrl();
      if (!eventId) {
        showError('No event ID provided. <a href="/pages/calendar/calendar.html">Go back to Calendar</a>');
        return;
      }
      loadEvent();
      bindActions();
    });
  });

  // ── Fragment loader ────────────────────────────────────────────
  async function loadFragments() {
    const loads = [
      loadFragment('/fragments/sidebar/sidebar.html?v=14', 'sidebar-mount'),
      loadFragment('/fragments/navbar/navbar.html?v=14', 'navbar-mount'),
    ];
    await Promise.allSettled(loads);

    // Initialize Sidebar component
    if (window.Sidebar && typeof window.Sidebar.init === 'function') {
      window.Sidebar.init({ activeOrganizationName: 'Acme Co.' });
    }

    // Set 05 Calendar active in sidebar
    const calNav = document.getElementById('nav-calendar');
    if (calNav) {
      document.querySelectorAll('.nav-item.active').forEach(el => el.classList.remove('active'));
      calNav.classList.add('active');
    }

    // Initialize Navbar component
    if (window.Navbar && typeof window.Navbar.init === 'function') {
      window.Navbar.init({
        fullName: 'Alex R.',
        initials: 'AR',
        activeOrganizationName: 'Acme Co.'
      });
    }
  }

  async function loadFragment(url, mountId) {
    const el = document.getElementById(mountId);
    if (!el) return;
    try {
      const r = await fetch(url + (url.includes('?') ? '&' : '?') + 't=' + Date.now());
      if (r.ok) el.innerHTML = await r.text();
    } catch (_) {}
  }

  // ── URL param ──────────────────────────────────────────────────
  function getEventIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('eventId') || params.get('id') || null;
  }

  // ── API calls ──────────────────────────────────────────────────
  async function loadEvent() {
    try {
      const r = await fetch(`/api/calendar/events/${eventId}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      eventData = await r.json();
      renderEvent(eventData);
    } catch (err) {
      showError('Could not load meeting details. <a href="/pages/calendar/calendar.html">Return to Calendar</a>');
      console.error('Meeting detail load error:', err);
    }
  }

  async function saveNotes(html) {
    try {
      const r = await fetch(`/api/calendar/events/${eventId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ notes: html })
      });
      if (!r.ok) throw new Error();
      setSaveStatus('Saved just now');
    } catch (_) {
      setSaveStatus('Save failed');
    }
  }

  async function saveAgenda() {
    const text = agendaItems.map(a => a.title).join('\n');
    try {
      await fetch(`/api/calendar/events/${eventId}/agenda`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ agenda: text })
      });
    } catch (_) {}
  }

  async function saveDecision(title, status) {
    try {
      await fetch(`/api/calendar/events/${eventId}/decision`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ title, status })
      });
    } catch (_) {}
  }

  async function saveFollowups() {
    try {
      await fetch(`/api/calendar/events/${eventId}/followups`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ followups: JSON.stringify(followups) })
      });
    } catch (_) {}
  }

  async function updateEvent(payload) {
    try {
      const r = await fetch(`/api/calendar/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload)
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (err) {
      toast('Could not save changes');
      throw err;
    }
  }

  async function deleteEvent() {
    try {
      const r = await fetch(`/api/calendar/events/${eventId}`, { method: 'DELETE' });
      if (!r.ok) throw new Error();
      toast('Meeting deleted');
      setTimeout(() => { window.location.href = '/pages/calendar/calendar.html'; }, 800);
    } catch (_) {
      toast('Could not delete meeting');
    }
  }

  // ── Render ─────────────────────────────────────────────────────
  function renderEvent(d) {
    document.title = `brick — ${d.title.toLowerCase()}.`;

    // Breadcrumb
    const projectLabel = d.project ? d.project.toUpperCase() : 'WEBSITE REDESIGN';
    setText('md-breadcrumb', `CALENDAR / ${projectLabel} / MEETING`);

    // Title & subtitle (lowercase editorial style)
    let t = d.title ? d.title.toLowerCase() : 'design review';
    if (!t.endsWith('.')) t += '.';
    setText('md-title', t);
    setText('md-subtitle', d.desc || 'Review the updated homepage and prepare the next design handoff.');

    // Meta bar
    setText('md-meta-date', formatDate(d.date) || '29 Oct 2026', 'span');
    setText('md-meta-time', `${d.startTime || '11:00'}–${d.endTime || '12:00'} · IST`, 'span');
    const attendeeCount = (d.attendeesList && d.attendeesList.length) || (d.attendees && d.attendees.length) || 4;
    setText('md-meta-participants', `${attendeeCount} participant${attendeeCount !== 1 ? 's' : ''}`, 'span');

    // Avatars
    renderAvatars(d.attendeesList || []);

    // Agenda
    agendaItems = (d.agenda && d.agenda.length)
      ? d.agenda.map((title, i) => ({ id: `ag-${i}`, title, completed: false }))
      : [
          { id: 'ag-0', title: 'Homepage direction', completed: false },
          { id: 'ag-1', title: 'Mobile navigation', completed: false },
          { id: 'ag-2', title: 'Engineering handoff', completed: false }
        ];
    renderAgendaItems();

    // Notes
    const editor = document.getElementById('md-notes-editor');
    if (editor && d.notes) {
      if (d.notes.trim().startsWith('<')) {
        editor.innerHTML = d.notes;
      } else {
        editor.innerHTML = buildNotesHtml(d.notes, d.title, d.agenda);
      }
    }

    // Decisions
    if (d.decision && d.decision.title) {
      decisions = [{
        id: 'd-0',
        title: d.decision.title,
        status: d.decision.status || 'Approved internally · Client confirmation pending'
      }];
    } else {
      decisions = [{
        id: 'd-0',
        title: 'Proceed with the revised homepage layout.',
        status: 'Approved internally · Client confirmation pending'
      }];
    }
    renderDecisions();

    // Follow-ups
    if (d.followups && d.followups.length) {
      followups = d.followups.map((f, i) => ({
        id: f.id || `fu-${i}`,
        title: f.title || '',
        assignee: f.assignee || 'PK',
        due: f.due || 'Due 30 Oct',
        completed: f.completed || false
      }));
    } else {
      followups = [
        { id: 'fu-0', title: 'Refine mobile navigation', assignee: 'PK', due: 'Due 30 Oct', completed: false },
        { id: 'fu-1', title: 'Prepare design handoff', assignee: 'MJ', due: 'Due 30 Oct', completed: false }
      ];
    }
    renderFollowups();

    setSaveStatus(d.notesTimestamp || 'Saved 2 min ago');

    // Pre-fill edit drawer
    prefillDrawer(d);
  }

  function buildNotesHtml(notes, title, agenda) {
    const sections = [];
    sections.push(`<span class="md-canvas-section-tag">03 / HOMEPAGE DESIGN</span>`);
    sections.push(`<h3 class="md-canvas-section-title">Simplifying the experience.</h3>`);
    sections.push(`<p>We reviewed the updated homepage structure and discussed how it <mark class="md-notes-highlight">improves navigation clarity and helps users reach key actions faster.</mark> The overall direction feels more focused and consistent with the product narrative.</p>`);
    sections.push(`<span class="md-canvas-section-tag">04 / MOBILE NAVIGATION</span>`);
    sections.push(`<p>We discussed refinements to the mobile navigation prototype, including simplifying the menu, improving discoverability, and aligning interactions with the final design direction before the engineering handoff. <span class="md-cursor-blink">|</span></p>`);
    return sections.join('\n');
  }

  function renderAvatars(list) {
    const container = document.getElementById('md-avatars');
    if (!container) return;
    container.innerHTML = '';
    const themes = ['pk', 'ar', 'sk', 'mj'];
    const display = list.slice(0, 4);
    if (display.length === 0) {
      // Default avatars matching screenshot
      const defaultAvatars = [
        { initials: 'PK', theme: 'pk', name: 'Peter K.' },
        { initials: 'AR', theme: 'ar', name: 'Alex R.' },
        { initials: 'SK', theme: 'sk', name: 'Sarah K.' },
        { initials: 'MJ', theme: 'mj', name: 'Michael J.' }
      ];
      defaultAvatars.forEach(a => {
        container.insertAdjacentHTML('beforeend',
          `<div class="md-avatar-circle md-avatar-${a.theme}" title="${escHtml(a.name)}">${escHtml(a.initials)}</div>`);
      });
    } else {
      display.forEach((a, i) => {
        const initials = a.initials || (a.name ? a.name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'AR');
        const theme = themes[i] || 'pk';
        container.insertAdjacentHTML('beforeend',
          `<div class="md-avatar-circle md-avatar-${theme}" title="${escHtml(a.name || initials)}">${escHtml(initials)}</div>`);
      });
    }
  }

  function renderAgendaItems() {
    const container = document.getElementById('md-agenda-items');
    if (!container) return;
    container.innerHTML = '';
    agendaItems.forEach((item, index) => {
      const chip = document.createElement('div');
      chip.className = `md-agenda-chip${item.completed ? ' completed' : ''}`;
      chip.dataset.id = item.id;
      const iconSvg = CHIP_ICONS[index % CHIP_ICONS.length];
      chip.innerHTML = `
        ${iconSvg}
        <span>${escHtml(item.title)}</span>
        <button class="md-agenda-chip-toggle" data-id="${item.id}" title="${item.completed ? 'Mark open' : 'Mark done'}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </button>
      `;
      container.appendChild(chip);
    });
    // Wire check buttons
    container.querySelectorAll('.md-agenda-chip-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleAgendaItem(btn.dataset.id);
      });
    });
  }

  function toggleAgendaItem(id) {
    const item = agendaItems.find(a => a.id === id);
    if (item) {
      item.completed = !item.completed;
      renderAgendaItems();
      saveAgenda();
    }
  }

  function renderDecisions() {
    const container = document.getElementById('md-decisions-list');
    if (!container) return;
    container.innerHTML = '';
    decisions.forEach(d => {
      container.insertAdjacentHTML('beforeend', `
        <div class="md-decision-entry" data-id="${d.id}">
          <div class="md-decision-green-circle">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div class="md-decision-content-col">
            <p class="md-decision-primary-text">${escHtml(d.title)}</p>
            <p class="md-decision-secondary-text">${escHtml(d.status)}</p>
          </div>
        </div>
      `);
    });
  }

  function renderFollowups() {
    const container = document.getElementById('md-followup-list');
    if (!container) return;
    container.innerHTML = '';
    followups.forEach(f => {
      const initials = f.assignee ? f.assignee.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'PK';
      container.insertAdjacentHTML('beforeend', `
        <div class="md-followup-row" data-id="${f.id}">
          <div class="md-followup-checkbox${f.completed ? ' is-checked' : ''}" data-id="${f.id}">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <span class="md-followup-label-text${f.completed ? ' is-checked' : ''}">${escHtml(f.title)}</span>
          <div class="md-followup-user-tag ${initials === 'MJ' ? 'tag-mj' : ''}" title="${escHtml(f.assignee)}">${escHtml(initials)}</div>
          ${f.due ? `<span class="md-followup-due-date">${escHtml(f.due)}</span>` : ''}
        </div>
      `);
    });
    // Wire checkboxes
    container.querySelectorAll('.md-followup-checkbox').forEach(el => {
      el.addEventListener('click', () => toggleFollowup(el.dataset.id));
    });
  }

  function toggleFollowup(id) {
    const item = followups.find(f => f.id === id);
    if (item) {
      item.completed = !item.completed;
      renderFollowups();
      saveFollowups();
    }
  }

  // ── Bind interactive actions ───────────────────────────────────
  function bindActions() {
    // Agenda add
    document.getElementById('md-add-agenda-btn')?.addEventListener('click', () => {
      const addEl = document.getElementById('md-agenda-add');
      if (addEl) {
        addEl.style.display = 'block';
        document.getElementById('md-agenda-input')?.focus();
      }
    });
    document.getElementById('md-agenda-cancel-btn')?.addEventListener('click', () => {
      document.getElementById('md-agenda-add').style.display = 'none';
      document.getElementById('md-agenda-input').value = '';
    });
    document.getElementById('md-agenda-save-btn')?.addEventListener('click', () => {
      const val = document.getElementById('md-agenda-input')?.value.trim();
      if (val) {
        agendaItems.push({ id: `ag-${Date.now()}`, title: val, completed: false });
        renderAgendaItems();
        saveAgenda();
        document.getElementById('md-agenda-add').style.display = 'none';
        document.getElementById('md-agenda-input').value = '';
        toast('Discussion topic added');
      }
    });
    document.getElementById('md-agenda-input')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('md-agenda-save-btn')?.click();
      if (e.key === 'Escape') document.getElementById('md-agenda-cancel-btn')?.click();
    });

    // Decision add
    document.getElementById('md-add-decision-btn')?.addEventListener('click', () => {
      const addEl = document.getElementById('md-decision-add');
      if (addEl) {
        addEl.style.display = 'block';
        document.getElementById('md-decision-input')?.focus();
      }
    });
    document.getElementById('md-decision-cancel-btn')?.addEventListener('click', () => {
      document.getElementById('md-decision-add').style.display = 'none';
      document.getElementById('md-decision-input').value = '';
    });
    document.getElementById('md-decision-save-btn')?.addEventListener('click', () => {
      const val = document.getElementById('md-decision-input')?.value.trim();
      const status = document.getElementById('md-decision-status-select')?.value || 'Approved internally · Client confirmation pending';
      if (val) {
        decisions.push({ id: `d-${Date.now()}`, title: val, status });
        renderDecisions();
        saveDecision(val, status);
        document.getElementById('md-decision-add').style.display = 'none';
        document.getElementById('md-decision-input').value = '';
        toast('Decision recorded');
      }
    });
    document.getElementById('md-decision-input')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('md-decision-save-btn')?.click();
      if (e.key === 'Escape') document.getElementById('md-decision-cancel-btn')?.click();
    });

    // Follow-up add
    document.getElementById('md-add-followup-btn')?.addEventListener('click', () => {
      const addEl = document.getElementById('md-followup-add');
      if (addEl) {
        addEl.style.display = 'block';
        document.getElementById('md-followup-input')?.focus();
      }
    });
    document.getElementById('md-followup-cancel-btn')?.addEventListener('click', () => {
      document.getElementById('md-followup-add').style.display = 'none';
    });
    document.getElementById('md-followup-save-btn')?.addEventListener('click', () => {
      const title = document.getElementById('md-followup-input')?.value.trim();
      const assignee = document.getElementById('md-followup-assignee')?.value.trim() || 'PK';
      const due = document.getElementById('md-followup-due')?.value;
      if (title) {
        const dueLabel = due ? formatDue(due) : 'Due 30 Oct';
        followups.push({ id: `fu-${Date.now()}`, title, assignee, due: dueLabel, completed: false });
        renderFollowups();
        saveFollowups();
        document.getElementById('md-followup-add').style.display = 'none';
        document.getElementById('md-followup-input').value = '';
        document.getElementById('md-followup-assignee').value = '';
        document.getElementById('md-followup-due').value = '';
        toast('Follow-up task added');
      }
    });

    // Notes autosave
    const editor = document.getElementById('md-notes-editor');
    if (editor) {
      editor.addEventListener('input', () => {
        setSaveStatus('Saving…');
        clearTimeout(notesSaveTimer);
        notesSaveTimer = setTimeout(() => saveNotes(editor.innerHTML), 1500);
      });
      // Text selection → floating toolbar
      document.addEventListener('selectionchange', () => {
        const sel = window.getSelection();
        if (sel && sel.toString().trim().length > 0 && editor.contains(sel.anchorNode)) {
          showFloatingToolbar(sel);
        } else {
          hideFloatingToolbar();
        }
      });
    }

    // Formatting toolbar
    document.querySelectorAll('.md-tool-btn[data-cmd]').forEach(btn => {
      btn.addEventListener('mousedown', e => {
        e.preventDefault();
        const cmd = btn.dataset.cmd;
        if (cmd === 'createLink') {
          const url = prompt('Enter URL:');
          if (url) document.execCommand('createLink', false, url);
        } else if (cmd === 'more') {
          toast('Formatting options');
        } else {
          document.execCommand(cmd, false, null);
        }
        editor?.focus();
      });
    });

    // Format select
    document.getElementById('md-format-select')?.addEventListener('change', e => {
      document.execCommand('formatBlock', false, e.target.value);
      editor?.focus();
    });

    // Floating toolbar actions
    document.getElementById('md-float-task')?.addEventListener('click', () => {
      const sel = window.getSelection();
      const selectedText = sel ? sel.toString().trim() : '';
      hideFloatingToolbar();
      openUniversalCreate(selectedText);
    });
    document.getElementById('md-float-decision')?.addEventListener('click', () => {
      const sel = window.getSelection();
      const text = sel ? sel.toString().trim() : '';
      hideFloatingToolbar();
      if (text) {
        decisions.push({ id: `d-${Date.now()}`, title: text, status: 'Approved internally · Client confirmation pending' });
        renderDecisions();
        saveDecision(text, 'Approved internally · Client confirmation pending');
        toast('Decision recorded from selection');
      }
    });
    document.getElementById('md-float-link')?.addEventListener('click', () => {
      hideFloatingToolbar();
      toast('Record linked to notes');
    });

    // Edit button → open drawer
    document.getElementById('md-edit-btn')?.addEventListener('click', openDrawer);
    document.getElementById('md-drawer-close')?.addEventListener('click', closeDrawer);
    document.getElementById('md-drawer-cancel')?.addEventListener('click', closeDrawer);
    document.getElementById('md-drawer-overlay')?.addEventListener('click', closeDrawer);
    document.getElementById('md-drawer-save')?.addEventListener('click', handleDrawerSave);

    // More button → dropdown
    const moreBtn = document.getElementById('md-more-btn');
    const moreDropdown = document.getElementById('md-more-dropdown');
    moreBtn?.addEventListener('click', e => {
      e.stopPropagation();
      const rect = moreBtn.getBoundingClientRect();
      moreDropdown.style.top = `${rect.bottom + 6}px`;
      moreDropdown.style.left = `${rect.left}px`;
      moreDropdown.style.display = moreDropdown.style.display === 'none' ? 'block' : 'none';
    });
    document.addEventListener('click', () => {
      if (moreDropdown) moreDropdown.style.display = 'none';
    });

    // More actions
    document.getElementById('md-action-duplicate')?.addEventListener('click', () => {
      toast('Duplicate meeting created');
      moreDropdown.style.display = 'none';
    });
    document.getElementById('md-action-copy-link')?.addEventListener('click', () => {
      navigator.clipboard?.writeText(window.location.href).then(() => toast('Link copied to clipboard'));
      moreDropdown.style.display = 'none';
    });
    document.getElementById('md-action-export')?.addEventListener('click', () => {
      toast('Exporting notes as Markdown…');
      moreDropdown.style.display = 'none';
    });
    document.getElementById('md-action-delete')?.addEventListener('click', () => {
      moreDropdown.style.display = 'none';
      if (confirm(`Delete "${eventData?.title}"? This action cannot be undone.`)) {
        deleteEvent();
      }
    });

    // Recap button
    document.getElementById('md-recap-btn')?.addEventListener('click', () => {
      const recap = buildRecap();
      navigator.clipboard?.writeText(recap).then(() => {
        toast('Recap prepared & copied to clipboard');
      }).catch(() => {
        toast('Recap prepared');
      });
    });

    // Back button
    document.getElementById('md-back-btn')?.addEventListener('click', e => {
      e.preventDefault();
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '/pages/calendar/calendar.html';
      }
    });
  }

  // ── Floating toolbar ───────────────────────────────────────────
  function showFloatingToolbar(sel) {
    const toolbar = document.getElementById('md-floating-toolbar');
    const editor = document.getElementById('md-notes-editor');
    if (!toolbar || !editor) return;
    try {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const editorRect = editor.getBoundingClientRect();
      toolbar.style.top = `${rect.bottom - editorRect.top + 8}px`;
      toolbar.style.left = `${rect.left - editorRect.left}px`;
      toolbar.classList.add('is-visible');
    } catch (_) {}
  }

  function hideFloatingToolbar() {
    document.getElementById('md-floating-toolbar')?.classList.remove('is-visible');
  }

  // ── Edit Drawer ────────────────────────────────────────────────
  function openDrawer() {
    document.getElementById('md-edit-drawer')?.classList.add('is-open');
    document.getElementById('md-drawer-overlay')?.classList.add('is-open');
  }

  function closeDrawer() {
    document.getElementById('md-edit-drawer')?.classList.remove('is-open');
    document.getElementById('md-drawer-overlay')?.classList.remove('is-open');
  }

  function prefillDrawer(d) {
    setVal('edit-title', d.title || '');
    setVal('edit-desc', d.desc || '');
    setVal('edit-date', d.date || '');
    setVal('edit-project', d.project || '');
    setVal('edit-start-time', d.startTime || '');
    setVal('edit-end-time', d.endTime || '');
    setVal('edit-location', d.location || d.meetingUrl || '');
    setVal('edit-attendees', (d.attendees || []).join(', '));
    setVal('edit-color-theme', d.colorTheme || 'lavender');
  }

  async function handleDrawerSave() {
    const payload = {
      title: getVal('edit-title'),
      desc: getVal('edit-desc'),
      date: getVal('edit-date'),
      project: getVal('edit-project'),
      startTime: getVal('edit-start-time'),
      endTime: getVal('edit-end-time'),
      location: getVal('edit-location'),
      attendees: getVal('edit-attendees').split(',').map(s => s.trim()).filter(Boolean),
      colorTheme: getVal('edit-color-theme'),
    };
    setSaveStatus('Saving…');
    try {
      const updated = await updateEvent(payload);
      eventData = updated;
      closeDrawer();
      renderEvent(updated);
      toast('Meeting updated');
    } catch (_) {}
  }

  // ── Recap builder ──────────────────────────────────────────────
  function buildRecap() {
    const title = eventData?.title || 'Design review';
    const date = eventData?.date ? formatDate(eventData.date) : '29 Oct 2026';
    const lines = [`MEETING RECAP: ${title.toUpperCase()}`, `Date: ${date}`, ``];
    if (agendaItems.length) {
      lines.push('WHAT WE DISCUSSED (AGENDA):');
      agendaItems.forEach(a => lines.push(`  • ${a.title}${a.completed ? ' (Completed)' : ''}`));
      lines.push('');
    }
    if (decisions.length) {
      lines.push('WHAT WE DECIDED:');
      decisions.forEach(d => lines.push(`  • ${d.title} [${d.status}]`));
      lines.push('');
    }
    if (followups.length) {
      lines.push('WHAT HAPPENS NEXT (FOLLOW-UP WORK):');
      followups.forEach(f => lines.push(`  • [${f.completed ? 'X' : ' '}] ${f.title} — ${f.assignee || 'Unassigned'} (${f.due || 'No due date'})`));
    }
    return lines.join('\n');
  }

  // ── Universal Create wiring ────────────────────────────────────
  function openUniversalCreate(prefillText) {
    if (typeof window.openUniversalCreate === 'function') {
      window.openUniversalCreate({ type: 'task', title: prefillText });
      return;
    }
    const params = new URLSearchParams({ type: 'task', title: prefillText, source: 'meeting', meetingId: eventId });
    window.location.href = `/pages/tasks/tasks.html?${params}`;
  }

  // ── Utilities ──────────────────────────────────────────────────
  function setText(id, text, childTag) {
    const el = document.getElementById(id);
    if (!el) return;
    if (childTag) {
      const child = el.querySelector(childTag);
      if (child) child.textContent = text;
      else el.textContent = text;
    } else {
      el.textContent = text;
    }
  }

  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  }

  function getVal(id) {
    return document.getElementById(id)?.value || '';
  }

  function escHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (_) { return dateStr; }
  }

  function formatDue(dateStr) {
    try {
      const d = new Date(dateStr);
      return 'Due ' + d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    } catch (_) { return dateStr; }
  }

  function setSaveStatus(msg) {
    const label = document.getElementById('md-save-label');
    if (label) label.textContent = msg;
  }

  function toast(msg) {
    const container = document.getElementById('md-toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'md-toast-item';
    el.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--dash-accent-lime)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      <span>${escHtml(msg)}</span>`;
    container.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity 0.25s, transform 0.25s';
      el.style.opacity = '0';
      el.style.transform = 'translateY(6px)';
      setTimeout(() => el.remove(), 280);
    }, 2800);
  }

  function showError(html) {
    const page = document.getElementById('md-page');
    if (page) page.innerHTML = `<div style="padding:3rem;font-size:1rem;color:var(--dash-text-muted);">${html}</div>`;
  }

})();
