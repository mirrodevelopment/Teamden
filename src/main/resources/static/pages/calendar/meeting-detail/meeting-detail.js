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
      loadFragment('/fragments/sidebar/sidebar.html', 'sidebar-mount'),
      loadFragment('/fragments/navbar/navbar.html', 'navbar-mount'),
    ];
    await Promise.allSettled(loads);
  }

  async function loadFragment(url, mountId) {
    const el = document.getElementById(mountId);
    if (!el) return;
    try {
      const r = await fetch(url + '?t=' + Date.now());
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agenda: text })
      });
    } catch (_) {}
  }

  async function saveDecision(title, status) {
    try {
      await fetch(`/api/calendar/events/${eventId}/decision`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, status })
      });
    } catch (_) {}
  }

  async function saveFollowups() {
    try {
      await fetch(`/api/calendar/events/${eventId}/followups`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followups: JSON.stringify(followups) })
      });
    } catch (_) {}
  }

  async function updateEvent(payload) {
    try {
      const r = await fetch(`/api/calendar/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
    document.title = `${d.title} — Teamden`;

    // Breadcrumb
    const projectLabel = d.project ? d.project.toUpperCase() : 'WORKSPACE';
    setText('md-breadcrumb', `CALENDAR / ${projectLabel} / MEETING`);

    // Title & subtitle (lowercase editorial style)
    setText('md-title', d.title.toLowerCase() + '.');
    setText('md-subtitle', d.desc || '');

    // Meta bar
    setText('md-meta-date', formatDate(d.date), 'span');
    setText('md-meta-time', `${d.startTime}–${d.endTime} · IST`, 'span');
    const attendeeCount = (d.attendeesList && d.attendeesList.length) || (d.attendees && d.attendees.length) || 0;
    setText('md-meta-participants', `${attendeeCount} participant${attendeeCount !== 1 ? 's' : ''}`, 'span');

    // Avatars
    renderAvatars(d.attendeesList || []);

    // Agenda
    agendaItems = (d.agenda || []).map((title, i) => ({ id: `ag-${i}`, title, completed: false }));
    renderAgendaItems();

    // Notes
    const editor = document.getElementById('md-notes-editor');
    if (editor && d.notes) {
      // Render notes — if it looks like HTML, use it; otherwise wrap in p tags
      if (d.notes.trim().startsWith('<')) {
        editor.innerHTML = d.notes;
      } else {
        // Auto-create sections from text
        editor.innerHTML = buildNotesHtml(d.notes, d.title, d.agenda);
      }
    }

    // Decisions
    if (d.decision && d.decision.title) {
      decisions = [{ id: 'd-0', title: d.decision.title, status: d.decision.status || 'Approved internally' }];
    } else {
      decisions = [];
    }
    renderDecisions();

    // Follow-ups
    followups = (d.followups || []).map((f, i) => ({
      id: f.id || `fu-${i}`,
      title: f.title || '',
      assignee: f.assignee || '',
      due: f.due || '',
      completed: f.completed || false
    }));
    renderFollowups();

    setSaveStatus(d.notesTimestamp || 'Saved');

    // Pre-fill edit drawer
    prefillDrawer(d);
  }

  function buildNotesHtml(notes, title, agenda) {
    const sections = [];
    sections.push(`<span class="md-notes-section-label">03 / HOMEPAGE DESIGN</span>`);
    sections.push(`<h2>Simplifying the experience.</h2>`);
    sections.push(`<p>${escHtml(notes)}</p>`);
    if (agenda && agenda.length > 1) {
      sections.push(`<span class="md-notes-section-label">04 / ${(agenda[1] || 'DISCUSSION').toUpperCase()}</span>`);
      sections.push(`<p>Notes for this agenda item will appear here.</p>`);
    }
    return sections.join('\n');
  }

  function renderAvatars(list) {
    const container = document.getElementById('md-avatars');
    if (!container) return;
    const themes = ['pk', 'ar', 'sk', 'mj'];
    const display = list.slice(0, 4);
    if (display.length === 0) {
      // default avatars
      [{ initials: 'PK', theme: 'pk' }, { initials: 'AR', theme: 'ar' }].forEach(a => {
        container.insertAdjacentHTML('beforeend',
          `<div class="md-avatar md-avatar-${a.theme}" title="${a.initials}">${a.initials}</div>`);
      });
    } else {
      display.forEach((a, i) => {
        const initials = a.initials || (a.name ? a.name.split(' ').map(n => n[0]).join('').substring(0, 2) : '?');
        const theme = themes[i] || 'default';
        container.insertAdjacentHTML('beforeend',
          `<div class="md-avatar md-avatar-${theme}" title="${escHtml(a.name || initials)}">${escHtml(initials)}</div>`);
      });
    }
  }

  function renderAgendaItems() {
    const container = document.getElementById('md-agenda-items');
    if (!container) return;
    container.innerHTML = '';
    agendaItems.forEach(item => {
      const chip = document.createElement('div');
      chip.className = `md-agenda-chip${item.completed ? ' completed' : ''}`;
      chip.dataset.id = item.id;
      chip.innerHTML = `
        <svg class="md-agenda-chip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
        <span>${escHtml(item.title)}</span>
        <button class="md-agenda-chip-check" data-id="${item.id}" title="${item.completed ? 'Mark open' : 'Mark done'}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </button>
      `;
      container.appendChild(chip);
    });
    // Wire check buttons
    container.querySelectorAll('.md-agenda-chip-check').forEach(btn => {
      btn.addEventListener('click', () => toggleAgendaItem(btn.dataset.id));
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
        <div class="md-decision-item" data-id="${d.id}">
          <div class="md-decision-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div class="md-decision-body">
            <p class="md-decision-title">${escHtml(d.title)}</p>
            <p class="md-decision-status">${escHtml(d.status)}</p>
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
      const initials = f.assignee ? f.assignee.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?';
      container.insertAdjacentHTML('beforeend', `
        <div class="md-followup-item" data-id="${f.id}">
          <div class="md-followup-check${f.completed ? ' done' : ''}" data-id="${f.id}">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <span class="md-followup-text${f.completed ? ' done-text' : ''}">${escHtml(f.title)}</span>
          <div class="md-followup-assignee" title="${escHtml(f.assignee)}">${escHtml(initials)}</div>
          ${f.due ? `<span class="md-followup-due">${escHtml(f.due)}</span>` : ''}
        </div>
      `);
    });
    // Wire checkboxes
    container.querySelectorAll('.md-followup-check').forEach(el => {
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
      if (addEl) { addEl.style.display = 'block'; document.getElementById('md-agenda-input')?.focus(); }
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
        toast('Agenda item added');
      }
    });
    document.getElementById('md-agenda-input')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('md-agenda-save-btn')?.click();
      if (e.key === 'Escape') document.getElementById('md-agenda-cancel-btn')?.click();
    });

    // Decision add
    document.getElementById('md-add-decision-btn')?.addEventListener('click', () => {
      const addEl = document.getElementById('md-decision-add');
      if (addEl) { addEl.style.display = 'block'; document.getElementById('md-decision-input')?.focus(); }
    });
    document.getElementById('md-decision-cancel-btn')?.addEventListener('click', () => {
      document.getElementById('md-decision-add').style.display = 'none';
      document.getElementById('md-decision-input').value = '';
    });
    document.getElementById('md-decision-save-btn')?.addEventListener('click', () => {
      const val = document.getElementById('md-decision-input')?.value.trim();
      const status = document.getElementById('md-decision-status-select')?.value || 'Approved internally';
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
      if (addEl) { addEl.style.display = 'block'; document.getElementById('md-followup-input')?.focus(); }
    });
    document.getElementById('md-followup-cancel-btn')?.addEventListener('click', () => {
      document.getElementById('md-followup-add').style.display = 'none';
    });
    document.getElementById('md-followup-save-btn')?.addEventListener('click', () => {
      const title = document.getElementById('md-followup-input')?.value.trim();
      const assignee = document.getElementById('md-followup-assignee')?.value.trim();
      const due = document.getElementById('md-followup-due')?.value;
      if (title) {
        const dueLabel = due ? formatDue(due) : '';
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
    document.querySelectorAll('.md-toolbar-btn[data-cmd]').forEach(btn => {
      btn.addEventListener('mousedown', e => {
        e.preventDefault();
        const cmd = btn.dataset.cmd;
        if (cmd === 'createLink') {
          const url = prompt('Enter URL:');
          if (url) document.execCommand('createLink', false, url);
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
      const selectedText = sel ? sel.toString() : '';
      hideFloatingToolbar();
      openUniversalCreate(selectedText);
    });
    document.getElementById('md-float-decision')?.addEventListener('click', () => {
      const sel = window.getSelection();
      const text = sel ? sel.toString().trim() : '';
      hideFloatingToolbar();
      if (text) {
        decisions.push({ id: `d-${Date.now()}`, title: text, status: 'Approved internally' });
        renderDecisions();
        saveDecision(text, 'Approved internally');
        toast('Decision recorded from selection');
      }
    });
    document.getElementById('md-float-link')?.addEventListener('click', () => {
      hideFloatingToolbar();
      toast('Link record feature coming soon');
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
    document.addEventListener('click', () => { if (moreDropdown) moreDropdown.style.display = 'none'; });

    // More actions
    document.getElementById('md-action-duplicate')?.addEventListener('click', () => {
      toast('Duplicate feature coming soon');
      moreDropdown.style.display = 'none';
    });
    document.getElementById('md-action-copy-link')?.addEventListener('click', () => {
      navigator.clipboard?.writeText(window.location.href).then(() => toast('Link copied'));
      moreDropdown.style.display = 'none';
    });
    document.getElementById('md-action-export')?.addEventListener('click', () => {
      toast('Export notes feature coming soon');
      moreDropdown.style.display = 'none';
    });
    document.getElementById('md-action-delete')?.addEventListener('click', () => {
      moreDropdown.style.display = 'none';
      if (confirm(`Delete "${eventData?.title}"? This cannot be undone.`)) {
        deleteEvent();
      }
    });

    // Recap button
    document.getElementById('md-recap-btn')?.addEventListener('click', () => {
      const recap = buildRecap();
      toast('Recap prepared — copied to clipboard');
      navigator.clipboard?.writeText(recap);
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
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const editorRect = editor.getBoundingClientRect();
    toolbar.style.top = `${rect.top - editorRect.top - 46}px`;
    toolbar.style.left = `${rect.left - editorRect.left}px`;
    toolbar.classList.add('visible');
  }

  function hideFloatingToolbar() {
    document.getElementById('md-floating-toolbar')?.classList.remove('visible');
  }

  // ── Edit Drawer ────────────────────────────────────────────────
  function openDrawer() {
    document.getElementById('md-edit-drawer')?.classList.add('open');
    document.getElementById('md-drawer-overlay')?.classList.add('open');
  }

  function closeDrawer() {
    document.getElementById('md-edit-drawer')?.classList.remove('open');
    document.getElementById('md-drawer-overlay')?.classList.remove('open');
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
      toast('Meeting saved');
    } catch (_) {}
  }

  // ── Recap builder ──────────────────────────────────────────────
  function buildRecap() {
    const title = eventData?.title || 'Meeting';
    const date = eventData?.date ? formatDate(eventData.date) : '';
    const lines = [`Meeting Recap: ${title}`, `Date: ${date}`, ``];
    if (agendaItems.length) {
      lines.push('AGENDA:');
      agendaItems.forEach(a => lines.push(`  • ${a.title}${a.completed ? ' ✓' : ''}`));
      lines.push('');
    }
    if (decisions.length) {
      lines.push('DECISIONS:');
      decisions.forEach(d => lines.push(`  • ${d.title} [${d.status}]`));
      lines.push('');
    }
    if (followups.length) {
      lines.push('FOLLOW-UP TASKS:');
      followups.forEach(f => lines.push(`  • ${f.title} — ${f.assignee || 'Unassigned'}${f.due ? ' (' + f.due + ')' : ''}`));
    }
    return lines.join('\n');
  }

  // ── Universal Create wiring ────────────────────────────────────
  function openUniversalCreate(prefillText) {
    // Try the global universal-create modal if available
    if (typeof window.openUniversalCreate === 'function') {
      window.openUniversalCreate({ type: 'task', title: prefillText });
      return;
    }
    // Fallback: navigate to create page with pre-fill
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
    el.className = 'md-toast';
    el.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--dash-accent)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      <span>${escHtml(msg)}</span>`;
    container.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity 0.25s';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 300);
    }, 2800);
  }

  function showError(html) {
    const page = document.getElementById('md-page');
    if (page) page.innerHTML = `<div style="padding:3rem;font-size:1rem;color:var(--dash-text-muted);">${html}</div>`;
  }

})();
