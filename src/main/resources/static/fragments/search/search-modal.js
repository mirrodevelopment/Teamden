/**
 * Teamden — Global Search Modal
 * Path: fragments/search/search-modal.js
 */
(function () {
  'use strict';

  // ── State ──────────────────────────────────────────────
  let _overlayEl = null;
  let _debounceTimer = null;
  let _currentQuery = '';
  let _currentCategory = 'ALL';
  let _results = [];
  let _selectedIndex = -1;
  let _counts = {};
  let _isOpen = false;

  const RECENT_KEY = 'teamden-recent-searches';
  const MAX_RECENT = 5;

  // ── Open / Close ───────────────────────────────────────
  function open() {
    if (_isOpen) {
      const inp = document.getElementById('search-modal-input');
      if (inp) { inp.focus(); inp.select(); }
      return;
    }
    _isOpen = true;
    _injectModal();
    document.body.style.overflow = 'hidden';
    const inp = document.getElementById('search-modal-input');
    if (inp) { setTimeout(() => { inp.focus(); }, 50); }
    _showInitialState();
  }

  function close() {
    if (!_isOpen) return;
    _isOpen = false;
    if (_overlayEl) {
      _overlayEl.remove();
      _overlayEl = null;
    }
    document.body.style.overflow = '';
    _results = [];
    _selectedIndex = -1;
    _currentQuery = '';
    _currentCategory = 'ALL';
  }

  // ── Inject Modal DOM ───────────────────────────────────
  function _injectModal() {
    _overlayEl = document.createElement('div');
    _overlayEl.className = 'search-overlay';
    _overlayEl.setAttribute('role', 'dialog');
    _overlayEl.setAttribute('aria-label', 'Global Search');
    _overlayEl.setAttribute('aria-modal', 'true');

    _overlayEl.innerHTML = `
      <div class="search-modal" id="search-modal-shell">
        <!-- Header -->
        <div class="search-header">
          <div class="search-eyebrow">TEAMDEN / GLOBAL SEARCH &amp; DISCOVERY</div>
          <div class="search-input-row">
            <svg class="search-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input id="search-modal-input" type="text" autocomplete="off" spellcheck="false"
              placeholder="Search for projects, tasks, people or anything..." aria-label="Search"/>
            <button class="search-clear-btn" id="search-clear-btn" aria-label="Clear">✕</button>
            <span class="search-esc-hint">ESC</span>
            <button class="search-close-btn" id="search-close-btn" aria-label="Close search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Category Tabs -->
        <div class="search-tabs" id="search-tabs" role="tablist">
          ${['ALL','TASKS','DOCUMENTS','PROJECTS','PEOPLE','MEETINGS','DECISIONS','TEAMS'].map((cat, i) => `
            <button class="search-tab${i===0?' active':''}" role="tab"
              data-cat="${cat}" aria-selected="${i===0}">
              ${_catLabel(cat)}
              <span class="search-tab-count" id="count-${cat}">0</span>
            </button>`).join('')}
        </div>

        <!-- Body -->
        <div class="search-body" id="search-body">
          <!-- Left -->
          <div class="search-results-col" id="search-results-col" role="listbox" aria-label="Search results">
            <div class="search-section-label">TOP RESULTS</div>
            <div id="search-results-list"></div>
          </div>
          <!-- Right -->
          <div class="search-context-col" id="search-context-col" aria-label="Connected context">
            <div id="search-context-content">
              <div class="search-state-box">
                <div class="state-icon">🔗</div>
                <div class="state-title">Connected Context</div>
                <div class="state-sub">Select a result to see its connections</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="search-footer">
          <span class="search-footer-label">Quick Actions</span>
          <button class="search-quick-action" id="sq-task">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>Create task
          </button>
          <button class="search-quick-action" id="sq-doc">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>New document
          </button>
          <button class="search-quick-action" id="sq-meeting">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>Schedule meeting
          </button>
          <a href="/pages/activity/activity.html" class="search-quick-action" id="sq-all">
            View all results →
          </a>
          <div class="search-footer-kbd">
            <span><kbd>↑↓</kbd> Navigate</span>
            <span><kbd>↵</kbd> Open</span>
            <span><kbd>Esc</kbd> Close</span>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(_overlayEl);
    _bindEvents();
  }

  function _catLabel(cat) {
    const labels = { ALL:'All', TASKS:'Tasks', DOCUMENTS:'Documents', PROJECTS:'Projects',
      PEOPLE:'People', MEETINGS:'Meetings', DECISIONS:'Decisions', TEAMS:'Teams' };
    return labels[cat] || cat;
  }

  // ── Event Bindings ─────────────────────────────────────
  function _bindEvents() {
    // Close on overlay click
    _overlayEl.addEventListener('click', (e) => {
      if (e.target === _overlayEl) close();
    });

    // Close button
    document.getElementById('search-close-btn').addEventListener('click', close);

    // Clear button
    const clearBtn = document.getElementById('search-clear-btn');
    clearBtn.addEventListener('click', () => {
      const inp = document.getElementById('search-modal-input');
      inp.value = '';
      inp.focus();
      clearBtn.style.display = 'none';
      _currentQuery = '';
      _showInitialState();
    });

    // Input
    const inp = document.getElementById('search-modal-input');
    inp.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      clearBtn.style.display = q ? 'block' : 'none';
      _currentQuery = q;
      _debouncedSearch(q);
    });

    // Keyboard nav
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); _moveSelection(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); _moveSelection(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); _openSelected(); }
    });

    // Category tabs
    document.getElementById('search-tabs').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-cat]');
      if (!btn) return;
      _currentCategory = btn.dataset.cat;
      document.querySelectorAll('.search-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.cat === _currentCategory);
        t.setAttribute('aria-selected', t.dataset.cat === _currentCategory);
      });
      _debouncedSearch(_currentQuery);
    });

    // Quick actions
    document.getElementById('sq-task').addEventListener('click', () => {
      close();
      if (window.UniversalCreate) window.UniversalCreate.open('TASK');
      else if (typeof window.triggerAddTaskPrompt === 'function') window.triggerAddTaskPrompt('NOW');
      else if (typeof window.openAddTaskModal === 'function') window.openAddTaskModal('NOW');
      else window.location.href = '/pages/tasks/create.html';
    });
    document.getElementById('sq-doc').addEventListener('click', () => {
      close();
      if (window.UniversalCreate) window.UniversalCreate.open('DOCUMENT');
      else window.location.href = '/pages/projects/projects.html';
    });
    document.getElementById('sq-meeting').addEventListener('click', () => {
      close();
      if (window.UniversalCreate) window.UniversalCreate.open('MEETING');
      else window.location.href = '/pages/calendar/calendar.html';
    });
    const sqAll = document.getElementById('sq-all');
    if (sqAll) {
      sqAll.addEventListener('click', (e) => {
        e.preventDefault();
        const q = _currentQuery || '';
        close();
        window.location.href = `/pages/discovery/discovery.html?q=${encodeURIComponent(q)}&category=${encodeURIComponent(_currentCategory)}`;
      });
    }
  }

  // ── Debounced search ───────────────────────────────────
  function _debouncedSearch(query) {
    clearTimeout(_debounceTimer);
    if (!query) { _showInitialState(); return; }
    _showLoadingState();
    _debounceTimer = setTimeout(() => _performSearch(query), 280);
  }

  async function _performSearch(query) {
    try {
      const url = `/api/search?q=${encodeURIComponent(query)}&category=${_currentCategory}&limit=25`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      _results = data.results || [];
      _counts = data.counts || {};
      _selectedIndex = _results.length > 0 ? 0 : -1;
      _updateCounts();
      _renderResults(query);
      if (_results.length > 0) _renderContext(_results[0]);
    } catch (err) {
      _showErrorState();
    }
  }

  // ── State renderers ────────────────────────────────────
  function _showInitialState() {
    const list = document.getElementById('search-results-list');
    const ctx = document.getElementById('search-context-content');
    if (!list || !ctx) return;

    const recent = _getRecentSearches();
    list.innerHTML = `
      <div class="search-initial-section">
        ${recent.length ? `
          <div class="search-section-label" style="margin-bottom:6px">RECENT SEARCHES</div>
          ${recent.map(r => `
            <div class="search-recent-item" data-recent="${_esc(r)}">
              <svg class="search-recent-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.86"/>
              </svg>
              ${_esc(r)}
            </div>`).join('')}
          <div style="height:14px"></div>` : ''}
        <div class="search-section-label" style="margin-bottom:6px">TRY SEARCHING FOR</div>
        <div class="search-recent-item" data-inject="tasks">
          <svg class="search-recent-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          Your open tasks
        </div>
        <div class="search-recent-item" data-inject="project">
          <svg class="search-recent-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          Active projects
        </div>
      </div>
    `;

    // Keyboard shortcut hints in context panel
    ctx.innerHTML = `
      <div class="search-context-eyebrow">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
        KEYBOARD SHORTCUTS
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;padding-top:4px">
        ${[['Ctrl + K','Open search'],['↑ ↓','Navigate results'],['↵ Enter','Open selected'],['Esc','Close modal'],['Tab','Switch focus']].map(([k,v])=>`
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;padding:6px 8px;border-radius:7px;background:var(--dash-bg-hover,#f0ebe3)">
            <span style="color:var(--dash-text-secondary,#8a8070)">${v}</span>
            <kbd style="font-size:11px;background:var(--dash-bg-card,#faf8f5);border:1px solid var(--dash-border-subtle,#ddd8cf);border-radius:4px;padding:1px 7px;font-family:inherit">${k}</kbd>
          </div>`).join('')}
      </div>
    `;

    // Recent click handlers
    list.querySelectorAll('[data-recent]').forEach(el => {
      el.addEventListener('click', () => {
        const inp = document.getElementById('search-modal-input');
        const q = el.dataset.recent;
        inp.value = q;
        _currentQuery = q;
        document.getElementById('search-clear-btn').style.display = 'block';
        _debouncedSearch(q);
      });
    });

    list.querySelectorAll('[data-inject]').forEach(el => {
      el.addEventListener('click', () => {
        const inp = document.getElementById('search-modal-input');
        const q = el.dataset.inject;
        inp.value = q;
        _currentQuery = q;
        document.getElementById('search-clear-btn').style.display = 'block';
        _debouncedSearch(q);
      });
    });
  }

  function _showLoadingState() {
    const list = document.getElementById('search-results-list');
    if (!list) return;
    const skeletons = Array(5).fill(0).map(() => `
      <div class="search-skeleton-row">
        <div class="skel skel-icon"></div>
        <div style="flex:1;min-width:0">
          <div class="skel skel-line skel-title"></div>
          <div class="skel skel-line skel-sub"></div>
        </div>
      </div>`).join('');
    list.innerHTML = skeletons;
  }

  function _showErrorState() {
    const list = document.getElementById('search-results-list');
    if (!list) return;
    list.innerHTML = `
      <div class="search-state-box">
        <div class="state-icon">⚠️</div>
        <div class="state-title">Search unavailable</div>
        <div class="state-sub">Could not reach search. <a href="#" id="search-retry" style="color:inherit;font-weight:600">Retry</a></div>
      </div>`;
    const retry = document.getElementById('search-retry');
    if (retry) retry.addEventListener('click', (e) => { e.preventDefault(); _performSearch(_currentQuery); });
  }

  // ── Render results ─────────────────────────────────────
  function _renderResults(query) {
    const list = document.getElementById('search-results-list');
    if (!list) return;

    if (!_results.length) {
      list.innerHTML = `
        <div class="search-state-box">
          <div class="state-icon">🔍</div>
          <div class="state-title">No results for "${_esc(query)}"</div>
          <div class="state-sub">Try a different keyword or category</div>
        </div>`;
      return;
    }

    list.innerHTML = _results.map((r, i) => `
      <div class="search-result-row${i === _selectedIndex ? ' selected' : ''}"
           data-index="${i}" role="option" aria-selected="${i === _selectedIndex}"
           tabindex="-1">
        <div class="search-result-icon icon-${r.iconType || r.type.toLowerCase()}">
          ${_typeIcon(r.type)}
        </div>
        <div class="search-result-body">
          <div class="search-result-type">${_catLabel(r.type)} ${r.taskCode ? '/ ' + _esc(r.taskCode) : ''}</div>
          <div class="search-result-title">${_highlight(r.title, query)}</div>
          <div class="search-result-subtitle">${_esc(r.subtitle || '')} ${r.meta ? '· ' + _esc(r.meta) : ''}</div>
        </div>
        <svg class="search-result-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>`).join('');

    // Click handlers
    list.querySelectorAll('.search-result-row').forEach(row => {
      row.addEventListener('click', () => {
        const idx = parseInt(row.dataset.index, 10);
        _selectedIndex = idx;
        _updateSelectedRow();
        _renderContext(_results[idx]);
      });
      row.addEventListener('dblclick', () => {
        const idx = parseInt(row.dataset.index, 10);
        if (_results[idx]?.url) { _saveSearch(_currentQuery); window.location.href = _results[idx].url; }
      });
    });
  }

  // ── Context panel ──────────────────────────────────────
  function _renderContext(result) {
    const ctx = document.getElementById('search-context-content');
    if (!ctx) return;
    const statusClass = result.status ? 'status-' + result.status.toLowerCase().replace('_','') : '';
    ctx.innerHTML = `
      <div class="search-context-eyebrow">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
        CONNECTED CONTEXT ${result.taskCode ? '/ ' + _esc(result.taskCode) : ''}
      </div>
      <div class="search-context-selected-title">${_esc(result.title)}</div>
      <div class="search-context-selected-meta">
        <span class="search-context-status ${statusClass}">${result.status || 'ACTIVE'}</span>
        <span>${_catLabel(result.type)}</span>
        ${result.meta ? `<span>· ${_esc(result.meta)}</span>` : ''}
      </div>
      <button class="search-context-open-btn" onclick="window.location.href='${result.url}'">
        Open
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
      ${result.subtitle ? `
        <div class="search-context-section-label">${result.type === 'TASK' ? 'PROJECT' : 'RELATED'}</div>
        <div class="search-context-item">
          <div class="search-context-item-icon">${_typeIcon(result.type === 'TASK' ? 'PROJECT' : 'DOCUMENT')}</div>
          <div class="search-context-item-text">
            <div class="search-context-item-name">${_esc(result.subtitle)}</div>
            <div class="search-context-item-sub">${result.meta ? _esc(result.meta) : ''}</div>
          </div>
        </div>` : ''}
    `;
  }

  // ── Keyboard navigation ────────────────────────────────
  function _moveSelection(dir) {
    if (!_results.length) return;
    _selectedIndex = Math.max(0, Math.min(_results.length - 1, _selectedIndex + dir));
    _updateSelectedRow();
    _renderContext(_results[_selectedIndex]);
    // Scroll into view
    const rows = document.querySelectorAll('.search-result-row');
    if (rows[_selectedIndex]) rows[_selectedIndex].scrollIntoView({ block: 'nearest' });
  }

  function _updateSelectedRow() {
    document.querySelectorAll('.search-result-row').forEach((row, i) => {
      row.classList.toggle('selected', i === _selectedIndex);
      row.setAttribute('aria-selected', i === _selectedIndex);
    });
  }

  function _openSelected() {
    if (_selectedIndex >= 0 && _results[_selectedIndex]) {
      _saveSearch(_currentQuery);
      window.location.href = _results[_selectedIndex].url;
    }
  }

  // ── Counts ─────────────────────────────────────────────
  function _updateCounts() {
    Object.entries(_counts).forEach(([cat, count]) => {
      const el = document.getElementById('count-' + cat);
      if (el) el.textContent = count;
    });
  }

  // ── Recent searches (localStorage) ────────────────────
  function _getRecentSearches() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
  }

  function _saveSearch(q) {
    if (!q) return;
    try {
      let recent = _getRecentSearches().filter(r => r !== q);
      recent.unshift(q);
      recent = recent.slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
    } catch {}
  }

  // ── Utilities ──────────────────────────────────────────
  function _esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function _highlight(text, query) {
    if (!text || !query) return _esc(text);
    const escaped = _esc(text);
    const q = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return escaped.replace(new RegExp(`(${_esc(q)})`, 'gi'), '<mark class="search-highlight">$1</mark>');
  }

  function _typeIcon(type) {
    const icons = {
      TASK: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
      PROJECT: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
      DOCUMENT: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
      PERSON: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
      MEETING: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
      DECISION: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
    };
    return icons[type?.toUpperCase()] || icons.DOCUMENT;
  }

  // ── Global keyboard handler ────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (!_isOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
  });

  // ── Expose public API ──────────────────────────────────
  window.SearchModal = { open, close, search: _performSearch };

})();
