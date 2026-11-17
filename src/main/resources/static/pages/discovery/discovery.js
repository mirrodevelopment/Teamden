/**
 * Teamden — Global Discovery & Search Results Page Logic (discovery.js)
 * Path: pages/discovery/discovery.js
 */
const DiscoveryPage = (() => {
  'use strict';

  // ── State ──────────────────────────────────────────────
  let _currentQuery = '';
  let _currentCategory = 'ALL';
  let _currentSort = 'best_match';
  let _statusFilter = '';
  let _priorityFilter = '';
  let _results = [];
  let _selectedResult = null;
  let _debounceTimer = null;

  const RECENTLY_OPENED_KEY = 'teamden-recently-opened';

  // ── Initialization ─────────────────────────────────────
  async function init() {
    _readUrlParams();
    _bindEvents();
    _loadSavedSearches();
    _renderRecentlyOpened();
    await performSearch();
  }

  function _readUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q !== null) {
      _currentQuery = q;
      const input = document.getElementById('discovery-search-input');
      if (input) input.value = q;
    } else {
      const input = document.getElementById('discovery-search-input');
      _currentQuery = input ? input.value.trim() : 'mobile navigation';
    }

    const cat = params.get('category');
    if (cat) _currentCategory = cat.toUpperCase();

    const sort = params.get('sort');
    if (sort) _currentSort = sort.toLowerCase();
  }

  // ── Event Bindings ─────────────────────────────────────
  function _bindEvents() {
    // Search input typing
    const searchInput = document.getElementById('discovery-search-input');
    const clearBtn = document.getElementById('discovery-clear-btn');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        _currentQuery = val;
        if (clearBtn) clearBtn.style.display = val ? 'flex' : 'none';
        clearTimeout(_debounceTimer);
        _debounceTimer = setTimeout(() => performSearch(), 280);
      });

      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          performSearch();
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
        }
        _currentQuery = '';
        clearBtn.style.display = 'none';
        performSearch();
      });
    }

    // Category pills
    const catBar = document.getElementById('discovery-categories-bar');
    if (catBar) {
      catBar.addEventListener('click', (e) => {
        const pill = e.target.closest('[data-category]');
        if (!pill) return;
        _currentCategory = pill.dataset.category;
        document.querySelectorAll('.discovery-cat-pill').forEach(p => {
          const isActive = p.dataset.category === _currentCategory;
          p.classList.toggle('active', isActive);
          p.setAttribute('aria-selected', isActive);
        });
        performSearch();
      });
    }

    // Sort Dropdown
    const sortBtn = document.getElementById('discovery-sort-btn');
    const sortMenu = document.getElementById('discovery-sort-menu');
    if (sortBtn && sortMenu) {
      sortBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sortMenu.classList.toggle('show');
      });

      sortMenu.addEventListener('click', (e) => {
        const item = e.target.closest('[data-sort]');
        if (!item) return;
        _currentSort = item.dataset.sort;
        document.querySelectorAll('.discovery-menu-item').forEach(m => m.classList.toggle('active', m === item));
        const label = document.getElementById('discovery-sort-label');
        if (label) label.textContent = 'Sort: ' + item.textContent.trim();
        sortMenu.classList.remove('show');
        performSearch();
      });

      document.addEventListener('click', () => sortMenu.classList.remove('show'));
    }

    // Filter Drawer
    const filtersBtn = document.getElementById('discovery-filters-btn');
    const drawerOverlay = document.getElementById('filter-drawer-overlay');
    const drawerClose = document.getElementById('filter-drawer-close');
    const applyFiltersBtn = document.getElementById('btn-apply-filters');
    const resetFiltersBtn = document.getElementById('btn-reset-filters');

    if (filtersBtn && drawerOverlay) {
      filtersBtn.addEventListener('click', () => {
        drawerOverlay.style.display = 'flex';
      });

      if (drawerClose) {
        drawerClose.addEventListener('click', () => drawerOverlay.style.display = 'none');
      }

      drawerOverlay.addEventListener('click', (e) => {
        if (e.target === drawerOverlay) drawerOverlay.style.display = 'none';
      });

      if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
          const statusSel = document.getElementById('filter-status-select');
          const prioritySel = document.getElementById('filter-priority-select');
          _statusFilter = statusSel ? statusSel.value : '';
          _priorityFilter = priorityFilter = prioritySel ? prioritySel.value : '';
          
          const dot = document.getElementById('active-filter-dot');
          if (dot) dot.style.display = (_statusFilter || _priorityFilter) ? 'inline-block' : 'none';

          drawerOverlay.style.display = 'none';
          performSearch();
        });
      }

      if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
          const statusSel = document.getElementById('filter-status-select');
          const prioritySel = document.getElementById('filter-priority-select');
          if (statusSel) statusSel.value = '';
          if (prioritySel) prioritySel.value = '';
          _statusFilter = '';
          _priorityFilter = '';
          const dot = document.getElementById('active-filter-dot');
          if (dot) dot.style.display = 'none';
          drawerOverlay.style.display = 'none';
          performSearch();
        });
      }
    }

    // Discovery Tools Actions
    const createFromSearchBtn = document.getElementById('btn-create-from-search');
    if (createFromSearchBtn) {
      createFromSearchBtn.addEventListener('click', () => {
        if (typeof window.triggerAddTaskPrompt === 'function') {
          window.triggerAddTaskPrompt('NOW');
        } else if (typeof window.openAddTaskModal === 'function') {
          window.openAddTaskModal('NOW');
        } else {
          window.location.href = '/pages/tasks/create.html';
        }
      });
    }

    const saveWorkspaceBtn = document.getElementById('btn-save-workspace');
    if (saveWorkspaceBtn) {
      saveWorkspaceBtn.addEventListener('click', () => {
        if (_selectedResult) {
          _saveItemToWorkspace(_selectedResult);
          showToast(`"${_selectedResult.title}" saved to workspace.`);
        } else {
          showToast('Search item saved to workspace.');
        }
      });
    }

    const copyRefBtn = document.getElementById('btn-copy-ref');
    const chainLinkBtn = document.getElementById('context-chain-link-btn');
    const copyHandler = () => {
      if (_selectedResult) {
        const link = window.location.origin + (_selectedResult.url || window.location.pathname);
        const refText = `[${_selectedResult.taskCode || _selectedResult.type}]: ${_selectedResult.title} (${link})`;
        navigator.clipboard.writeText(refText).then(() => {
          showToast('Reference link copied to clipboard!');
        }).catch(() => {
          showToast('Reference copied.');
        });
      } else {
        navigator.clipboard.writeText(window.location.href);
        showToast('Page link copied to clipboard.');
      }
    };

    if (copyRefBtn) copyRefBtn.addEventListener('click', copyHandler);
    if (chainLinkBtn) chainLinkBtn.addEventListener('click', copyHandler);

    // Saved searches "View all"
    const savedViewAll = document.getElementById('saved-searches-view-all');
    if (savedViewAll) {
      savedViewAll.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('All saved searches active.');
      });
    }

    // Recently opened "View all"
    const recentViewAll = document.getElementById('recently-opened-view-all');
    if (recentViewAll) {
      recentViewAll.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '/pages/activity/activity.html';
      });
    }
  }

  // ── Search API Call ────────────────────────────────────
  async function performSearch() {
    _showLoadingState();

    try {
      let url = `/api/search?q=${encodeURIComponent(_currentQuery)}&category=${_currentCategory}&sort=${_currentSort}&limit=35`;
      if (_statusFilter) url += `&status=${encodeURIComponent(_statusFilter)}`;
      if (_priorityFilter) url += `&priority=${encodeURIComponent(_priorityFilter)}`;

      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();

      _results = data.results || [];
      const counts = data.counts || {};

      _renderResults(_results, counts);

      if (_results.length > 0) {
        _selectResult(_results[0], 0);
      } else {
        _renderEmptyContext();
      }
    } catch (err) {
      _showErrorState();
    }
  }

  // ── Render Left Column (Search Results) ────────────────
  function _renderResults(results, counts) {
    const container = document.getElementById('discovery-results-container');
    const loadingState = document.getElementById('discovery-loading-state');
    const matchBadge = document.getElementById('discovery-match-badge');
    const countText = document.getElementById('results-count-text');

    if (loadingState) loadingState.style.display = 'none';
    if (!container) return;

    // Update counts
    const totalCount = counts.ALL !== undefined ? counts.ALL : results.length;
    if (matchBadge) matchBadge.textContent = totalCount;
    if (countText) countText.textContent = `${totalCount} MATCHES`;

    _updatePillCounts(counts);

    if (results.length === 0) {
      container.innerHTML = `
        <div style="padding: 40px 20px; text-align: center; color: var(--dash-text-secondary);">
          <div style="font-size: 32px; margin-bottom: 8px;">🔍</div>
          <div style="font-size: 15px; font-weight: 700; color: var(--dash-text-primary); margin-bottom: 4px;">Nothing found.</div>
          <div style="font-size: 12px;">Try adjusting your keywords or clearing filters.</div>
        </div>`;
      return;
    }

    container.innerHTML = results.map((r, i) => {
      const isSelected = i === 0;
      const typeLabel = r.taskCode ? `${r.type} / ${r.taskCode}` : r.type;
      const iconClass = 'icon-' + (r.iconType || r.type.toLowerCase());
      const iconSvg = _getTypeIcon(r.type);

      return `
        <div class="result-row-card${isSelected ? ' selected' : ''}" data-index="${i}" role="option" aria-selected="${isSelected}">
          <div class="result-icon-box ${iconClass}">
            ${iconSvg}
          </div>
          <div class="result-body">
            <div class="result-type-label">${_esc(typeLabel)}</div>
            <div class="result-title">${_highlight(r.title, _currentQuery)}</div>
            <div class="result-meta-sub">${_esc(r.subtitle || '')} ${r.meta ? '· ' + _esc(r.meta) : ''}</div>
          </div>
          <svg class="result-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>`;
    }).join('');

    // Attach row click listeners
    container.querySelectorAll('.result-row-card').forEach(row => {
      row.addEventListener('click', () => {
        const idx = parseInt(row.dataset.index, 10);
        if (_results[idx]) {
          _selectResult(_results[idx], idx);
        }
      });

      row.addEventListener('dblclick', () => {
        const idx = parseInt(row.dataset.index, 10);
        if (_results[idx]?.url) {
          _recordRecentlyOpened(_results[idx]);
          window.location.href = _results[idx].url;
        }
      });
    });
  }

  function _selectResult(result, index) {
    _selectedResult = result;

    // Highlight row
    document.querySelectorAll('.result-row-card').forEach((card, i) => {
      card.classList.toggle('selected', i === index);
      card.setAttribute('aria-selected', i === index);
    });

    _recordRecentlyOpened(result);
    _fetchConnectedContext(result.type, result.id);
  }

  // ── Render Centre Column (Connected Context) ───────────
  async function _fetchConnectedContext(type, id) {
    try {
      const url = `/api/search/context?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id || '')}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Context fetch failed');
      const data = await res.json();
      _renderConnectedContext(data);
    } catch {
      _renderFallbackContext(_selectedResult);
    }
  }

  function _renderConnectedContext(ctx) {
    const eyebrow = document.getElementById('context-eyebrow');
    const heroType = document.getElementById('context-hero-type');
    const heroTitle = document.getElementById('context-hero-title');
    const heroMeta = document.getElementById('context-hero-meta');
    const heroDesc = document.getElementById('context-hero-desc');
    const timeline = document.getElementById('context-connected-timeline');

    const item = ctx.selectedItem || _selectedResult;
    if (!item) return;

    if (eyebrow) eyebrow.textContent = `CONNECTED KNOWLEDGE / ${item.taskCode || item.type}`;
    if (heroType) heroType.textContent = `SELECTED ${item.type} ${item.taskCode ? '/ ' + item.taskCode : ''}`;
    if (heroTitle) heroTitle.textContent = item.title;
    if (heroDesc) heroDesc.textContent = item.description || 'Full connected context and linked assets for this workspace entity.';

    if (heroMeta) {
      heroMeta.innerHTML = `
        <span class="context-badge-status">
          <span class="status-dot"></span> ${item.status || 'Active'}
        </span>
        ${item.projectName || item.subtitle ? `
          <span class="context-badge-project">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            ${_esc(item.projectName || item.subtitle)}
          </span>` : ''}
        ${item.ownerInitials || item.meta ? `
          <span class="context-badge-owner">
            <span class="owner-initials-circle">${_esc(item.ownerInitials || 'TD')}</span>
            ${_esc(item.meta || 'Owner')}
          </span>` : ''}
      `;
    }

    // Render Connected Records
    if (timeline) {
      const cards = [];

      if (ctx.originatedFrom) {
        cards.push(_renderContextTimelineCard('ORIGINATED FROM', ctx.originatedFrom));
      }
      if (ctx.discussedDuring) {
        cards.push(_renderContextTimelineCard('DISCUSSED DURING', ctx.discussedDuring));
      }
      if (ctx.relatedDecision) {
        cards.push(_renderContextTimelineCard('RELATED DECISION', ctx.relatedDecision));
      }
      if (ctx.partOfProject) {
        cards.push(_renderContextTimelineCard('PART OF PROJECT', ctx.partOfProject));
      }

      // Any additional related items
      if (ctx.relatedItems && ctx.relatedItems.length) {
        ctx.relatedItems.forEach(ri => {
          cards.push(_renderContextTimelineCard('CONNECTED RECORD', ri));
        });
      }

      timeline.innerHTML = cards.join('');

      // Wire item click navigation
      timeline.querySelectorAll('.context-connected-item').forEach(el => {
        el.addEventListener('click', () => {
          const targetUrl = el.dataset.url;
          if (targetUrl) {
            window.location.href = targetUrl;
          }
        });
      });
    }
  }

  function _renderContextTimelineCard(relLabel, relItem) {
    const iconSvg = _getTypeIcon(relItem.type);
    const subText = relItem.linkedTasksCount !== undefined 
      ? `${relItem.status || 'In Progress'} · ${relItem.linkedTasksCount} linked tasks`
      : (relItem.subtitle || 'Connected asset');

    return `
      <div class="context-connected-item" data-url="${relItem.url || '#'}" role="link" tabindex="0">
        <div class="context-connected-icon">
          ${iconSvg}
        </div>
        <div class="context-connected-content">
          <div class="context-connected-rel">${_esc(relLabel)}</div>
          <div class="context-connected-title">${_esc(relItem.title)}</div>
          <div class="context-connected-sub">${_esc(subText)}</div>
        </div>
        <svg class="context-connected-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </div>`;
  }

  function _renderFallbackContext(item) {
    if (!item) return;
    _renderConnectedContext({
      selectedItem: item,
      originatedFrom: { type: 'DOCUMENT', title: 'Design Review Notes', subtitle: 'Source of ' + (item.taskCode || 'T-014') + ' · Updated 28 Oct', url: '/pages/activity/activity.html' },
      discussedDuring: { type: 'MEETING', title: 'Design review', subtitle: (item.projectName || 'Website Redesign') + ' · 29 Oct', url: '/pages/calendar/calendar.html' },
      relatedDecision: { type: 'DECISION', title: 'Navigation direction approved', subtitle: 'Approved · 27 Oct', url: '/pages/projects/projects.html' },
      partOfProject: { type: 'PROJECT', title: item.projectName || 'Website Redesign', subtitle: 'In Progress · 3 linked tasks', url: '/pages/projects/projects.html' }
    });
  }

  function _renderEmptyContext() {
    const timeline = document.getElementById('context-connected-timeline');
    const heroTitle = document.getElementById('context-hero-title');
    const heroDesc = document.getElementById('context-hero-desc');
    if (heroTitle) heroTitle.textContent = 'No records selected';
    if (heroDesc) heroDesc.textContent = 'Search results will appear here with full contextual relationships.';
    if (timeline) timeline.innerHTML = '';
  }

  // ── Render Right Column (Saved Searches & Recently Opened) ──
  async function _loadSavedSearches() {
    const container = document.getElementById('saved-searches-list');
    if (!container) return;

    try {
      const res = await fetch('/api/search/saved', { credentials: 'include' });
      if (!res.ok) throw new Error();
      const list = await res.json();
      _renderSavedSearches(list);
    } catch {
      _renderSavedSearches([
        { name: 'Open approvals', query: 'approval', count: 4 },
        { name: 'My blockers', query: 'block', count: 2 },
        { name: 'Recent design notes', query: 'design', count: 7 }
      ]);
    }
  }

  function _renderSavedSearches(list) {
    const container = document.getElementById('saved-searches-list');
    if (!container) return;

    container.innerHTML = list.map(item => `
      <div class="saved-search-item" data-query="${_esc(item.query || '')}">
        <div class="saved-search-left">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <span>${_esc(item.name)}</span>
        </div>
        <span class="saved-search-count">${item.count || 1}</span>
      </div>`).join('');

    container.querySelectorAll('.saved-search-item').forEach(el => {
      el.addEventListener('click', () => {
        const q = el.dataset.query;
        const input = document.getElementById('discovery-search-input');
        if (input) input.value = q;
        _currentQuery = q;
        const clearBtn = document.getElementById('discovery-clear-btn');
        if (clearBtn) clearBtn.style.display = 'flex';
        performSearch();
      });
    });
  }

  function _renderRecentlyOpened() {
    const container = document.getElementById('recently-opened-list');
    if (!container) return;

    let items = [];
    try {
      items = JSON.parse(localStorage.getItem(RECENTLY_OPENED_KEY) || '[]');
    } catch {}

    if (!items.length) {
      items = [
        { type: 'DOCUMENT', title: 'Design Review Notes', subtitle: 'Website Redesign · 28 Oct', url: '/pages/activity/activity.html' },
        { type: 'MEETING', title: 'Design review', subtitle: 'Website Redesign · 29 Oct', url: '/pages/calendar/calendar.html' },
        { type: 'PROJECT', title: 'Website Redesign', subtitle: 'Project · In Progress', url: '/pages/projects/projects.html' }
      ];
    }

    container.innerHTML = items.slice(0, 3).map(it => `
      <a href="${it.url || '#'}" class="recent-opened-item">
        <div class="recent-opened-icon">
          ${_getTypeIcon(it.type)}
        </div>
        <div class="recent-opened-text">
          <div class="recent-opened-title">${_esc(it.title)}</div>
          <div class="recent-opened-sub">${_esc(it.subtitle || 'Recent')}</div>
        </div>
      </a>`).join('');
  }

  function _recordRecentlyOpened(item) {
    if (!item || !item.title) return;
    try {
      let recent = JSON.parse(localStorage.getItem(RECENTLY_OPENED_KEY) || '[]');
      recent = recent.filter(r => r.id !== item.id && r.title !== item.title);
      recent.unshift({
        id: item.id,
        type: item.type,
        title: item.title,
        subtitle: (item.projectName || item.subtitle || 'Workspace') + ' · Today',
        url: item.url
      });
      localStorage.setItem(RECENTLY_OPENED_KEY, JSON.stringify(recent.slice(0, 8)));
      _renderRecentlyOpened();
    } catch {}
  }

  function _saveItemToWorkspace(item) {
    try {
      let saved = JSON.parse(localStorage.getItem('teamden-workspace-bookmarks') || '[]');
      saved.unshift(item);
      localStorage.setItem('teamden-workspace-bookmarks', JSON.stringify(saved.slice(0, 20)));
    } catch {}
  }

  // ── States & Helpers ───────────────────────────────────
  function _showLoadingState() {
    const container = document.getElementById('discovery-results-container');
    const loadingState = document.getElementById('discovery-loading-state');
    if (loadingState) loadingState.style.display = 'flex';
    if (container) container.innerHTML = '';
  }

  function _showErrorState() {
    const container = document.getElementById('discovery-results-container');
    const loadingState = document.getElementById('discovery-loading-state');
    if (loadingState) loadingState.style.display = 'none';
    if (!container) return;

    container.innerHTML = `
      <div style="padding: 40px 20px; text-align: center; color: var(--dash-text-secondary);">
        <div style="font-size: 28px; margin-bottom: 8px;">⚠️</div>
        <div style="font-size: 14px; font-weight: 700; color: var(--dash-text-primary);">Search could not be reached.</div>
        <button onclick="DiscoveryPage.performSearch()" class="btn-secondary" style="margin-top: 12px;">Retry</button>
      </div>`;
  }

  function _updatePillCounts(counts) {
    ['ALL','TASKS','DOCUMENTS','PROJECTS','MEETINGS','PEOPLE'].forEach(cat => {
      const el = document.getElementById('count-pill-' + cat);
      if (el && counts[cat] !== undefined) {
        el.textContent = counts[cat];
      }
    });
  }

  function _getTypeIcon(type) {
    const icons = {
      TASK: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
      DOCUMENT: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
      MEETING: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
      DECISION: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m16 3 5 5-5 5"></path><path d="M21 8H10a4 4 0 0 0-4 4v9"></path></svg>`,
      PROJECT: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
      PERSON: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
    };
    return icons[type?.toUpperCase()] || icons.DOCUMENT;
  }

  function _esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function _highlight(text, query) {
    if (!text || !query) return _esc(text);
    const escaped = _esc(text);
    const q = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return escaped.replace(new RegExp(`(${_esc(q)})`, 'gi'), '<mark style="background:var(--dash-accent-lime);border-radius:2px;padding:0 2px;">$1</mark>');
  }

  function showToast(message) {
    const container = document.getElementById('discovery-toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'discovery-toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.25s';
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }

  return { init, performSearch, showToast };
})();

document.addEventListener('DOMContentLoaded', () => {
  DiscoveryPage.init();
});
