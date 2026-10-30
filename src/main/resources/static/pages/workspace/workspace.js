/**
 * Teamden by shed — Workspace Knowledge Hub Logic (workspace.js)
 * Path: pages/workspace/workspace.js
 *
 * Responsibilities:
 * 1. Mounts sidebar and navbar fragments
 * 2. Fetches live workspace data from /api/workspace/data (falls back to seed)
 * 3. Renders: Continue Working card, Knowledge Index counts + file previews,
 *    Recently in Motion timeline, Your Desk stats, Knowledge Shortcuts, Workspace Stats
 * 4. Updates live date label in the "Recently in Motion" subtitle
 */

(function () {
  'use strict';

  let currentUser = null;

  /* ── Fragment Loader ───────────────────────────────────────────────────── */
  async function loadFragment(url, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    try {
      const res = await fetch(url + (url.includes('?') ? '&' : '?') + 't=' + Date.now());
      if (!res.ok) throw new Error('HTTP ' + res.status);
      container.innerHTML = await res.text();
    } catch (err) {
      console.error('Fragment load failed:', url, err);
    }
  }

  /* ── Escape HTML ───────────────────────────────────────────────────────── */
  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ── Live Date Label ───────────────────────────────────────────────────── */
  function updateDateLabel() {
    const days   = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const now    = new Date();
    const label  = days[now.getDay()] + ', ' + String(now.getDate()).padStart(2,'0') + ' ' + months[now.getMonth()] + ' ' + now.getFullYear();
    const el = document.getElementById('ws-recent-date-label');
    if (el) el.textContent = 'LATEST EDITS / ' + label;
  }

  /* ── Render: Continue Working Card ────────────────────────────────────── */
  function renderContinueCard(doc) {
    if (!doc) return;
    const titleEl   = document.getElementById('ws-continue-title');
    const sectionEl = document.getElementById('ws-continue-section');
    const timeEl    = document.getElementById('ws-continue-time');
    const descEl    = document.getElementById('ws-continue-desc');
    const pctEl     = document.getElementById('ws-continue-pct');
    const barEl     = document.getElementById('ws-continue-bar');

    if (titleEl)   titleEl.textContent   = doc.title   || 'Brand Guidelines — Visual Identity';
    if (sectionEl) sectionEl.textContent = doc.section  || 'Design Library';
    if (timeEl)    timeEl.textContent    = doc.lastEdited || 'Last edited 2h ago';
    if (descEl)    descEl.textContent    = doc.description || '';
    if (pctEl)     pctEl.textContent     = (doc.completion || 68) + '%';
    if (barEl)     barEl.style.width     = (doc.completion || 68) + '%';
  }

  /* ── Render: Knowledge Index Counts ───────────────────────────────────── */
  function renderKICards(ki) {
    if (!ki) return;
    const setCount = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(val).padStart(2, '0');
    };
    setCount('ki-count-personal', ki.personalCount  || 12);
    setCount('ki-count-team',     ki.teamCount       || 34);
    setCount('ki-count-projects', ki.projectsCount   || 58);
    setCount('ki-count-company',  ki.companyCount    || 21);

    renderKIFiles('ki-files-personal', ki.personalFiles  || []);
    renderKIFiles('ki-files-team',     ki.teamFiles       || []);
    renderKIFiles('ki-files-projects', ki.projectFiles    || []);
    renderKIFiles('ki-files-company',  ki.companyFiles    || []);
  }

  function renderKIFiles(containerId, files) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = files.slice(0, 2).map(f => `
      <div class="ws-ki-file-row">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
        <span>${esc(f)}</span>
      </div>
    `).join('');
  }

  /* ── Render: Recently in Motion Timeline ──────────────────────────────── */
  function renderRecentList(items) {
    const el = document.getElementById('ws-recent-list');
    if (!el) return;
    el.innerHTML = (items || []).map(item => {
      const badgeClass = 'badge-' + (item.type || 'edited').toLowerCase();
      const dotColor = item.dotColor || 'purple';
      return `
        <div class="ws-recent-item" id="ws-recent-${esc(item.id)}">
          <div class="ws-recent-time-block">
            <span class="ws-recent-time">${esc(item.time)}</span>
            <span class="ws-recent-day">${esc(item.dayLabel || 'TODAY')}</span>
          </div>
          <span class="ws-recent-node-dot" style="background: var(--dash-dot-${dotColor});"></span>
          <div class="ws-recent-content">
            <div class="ws-recent-main-line">
              <span class="ws-recent-type-badge ${badgeClass}">${esc(item.type)}</span>
              <span class="ws-recent-sentence">
                <strong>${esc(item.author)}</strong> ${esc(item.action)} <strong>${esc(item.docTitle)}</strong>
              </span>
            </div>
            ${item.subMeta ? `<div class="ws-recent-submeta">${esc(item.subMeta)}</div>` : ''}
          </div>
          <div class="ws-recent-actions">
            <button class="ws-recent-action-btn" title="Open document" aria-label="Open document">&#8599;</button>
            <button class="ws-recent-action-btn" title="Options" aria-label="Options">&#8230;</button>
          </div>
        </div>
      `;
    }).join('');
  }

  /* ── Render: Your Desk Counts ─────────────────────────────────────────── */
  function renderDeskCounts(desk) {
    if (!desk) return;
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setVal('ws-desk-drafts-count',  desk.drafts  !== undefined ? desk.drafts  + ' unsaved'  : '4 unsaved');
    setVal('ws-desk-review-count',  desk.review  !== undefined ? desk.review  + ' awaiting' : '2 awaiting');
    setVal('ws-desk-recent-count',  desk.recent  !== undefined ? desk.recent  + ' documents': '7 documents');
    setVal('ws-desk-starred-count', desk.starred !== undefined ? desk.starred + ' items'    : '6 items');
  }

  /* ── Render: Knowledge Shortcuts ─────────────────────────────────────── */
  function renderShortcuts(shortcuts) {
    const el = document.getElementById('ws-shortcuts-list');
    if (!el) return;
    el.innerHTML = (shortcuts || []).map(s => `
      <a href="${esc(s.url || '#')}" class="ws-shortcut-item" id="ws-shortcut-${esc(s.id)}">
        <div class="ws-shortcut-icon">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
        </div>
        <span class="ws-shortcut-label">${esc(s.label)}</span>
        <span class="ws-shortcut-type">${esc(s.type || 'doc')}</span>
      </a>
    `).join('');
  }

  /* ── Render: Workspace Stats ──────────────────────────────────────────── */
  function renderStats(stats) {
    if (!stats) return;
    const setNum = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = String(val).padStart(2, '0'); };
    setNum('ws-stat-docs',     stats.totalDocs     || 125);
    setNum('ws-stat-members',  stats.totalMembers  || 8);
    setNum('ws-stat-updates',  stats.updatesToday  || 24);
    setNum('ws-stat-projects', stats.activeProjects|| 6);
  }

  /* ── Seed Data (shown if API unavailable) ─────────────────────────────── */
  const SEED = {
    continueWorking: {
      title: 'Brand Guidelines — Visual Identity',
      section: 'Design Library',
      lastEdited: 'Last edited 2h ago',
      description: 'Typography system, colour palette, logo usage rules and component library documentation.',
      completion: 68
    },
    knowledgeIndex: {
      personalCount: 12, teamCount: 34, projectsCount: 58, companyCount: 21,
      personalFiles:  ['Q4 Planning Notes', 'Interview Prep'],
      teamFiles:      ['Design Playbook', 'Onboarding Guide'],
      projectFiles:   ['Website Redesign Brief', 'App Spec v3'],
      companyFiles:   ['Brand Guidelines', 'Employee Handbook']
    },
    recentItems: [
      { id: 'r01', time: '09:41', dayLabel: 'TODAY',    dotColor: 'blue',   type: 'Edited',   author: 'You',         action: 'edited',   docTitle: 'Brand Guidelines — Visual Identity', subMeta: 'Design Library' },
      { id: 'r02', time: '08:17', dayLabel: 'TODAY',    dotColor: 'purple', type: 'Comment',  author: 'Priya K.',    action: 'commented on', docTitle: 'Website Redesign Brief',         subMeta: 'Website Redesign' },
      { id: 'r03', time: '07:55', dayLabel: 'TODAY',    dotColor: 'green',  type: 'Created',  author: 'James H.',    action: 'created',  docTitle: 'Sprint 12 Retrospective',          subMeta: 'Team Library' },
      { id: 'r04', time: '18:30', dayLabel: 'YESTERDAY',dotColor: 'orange', type: 'Shared',   author: 'Anika S.',    action: 'shared',   docTitle: 'Client Onboarding Checklist',      subMeta: 'Company Resources' },
      { id: 'r05', time: '14:12', dayLabel: 'YESTERDAY',dotColor: 'purple', type: 'Approved', author: 'Daniel M.',   action: 'approved', docTitle: 'Marketing Strategy — Q4 2026',     subMeta: 'Team Library' },
      { id: 'r06', time: '11:03', dayLabel: 'YESTERDAY',dotColor: 'blue',   type: 'Edited',   author: 'You',         action: 'edited',   docTitle: 'Product Roadmap 2027',              subMeta: 'Company Resources' }
    ],
    desk: { drafts: 4, review: 2, recent: 7, starred: 6 },
    shortcuts: [
      { id: 's01', label: 'Brand Guidelines', type: 'Design', url: '#' },
      { id: 's02', label: 'Product Roadmap 2027', type: 'Planning', url: '#' },
      { id: 's03', label: 'Client Onboarding Checklist', type: 'Process', url: '#' },
      { id: 's04', label: 'Design System Components', type: 'Design', url: '#' },
      { id: 's05', label: 'Q4 Marketing Strategy', type: 'Marketing', url: '#' }
    ],
    stats: { totalDocs: 125, totalMembers: 8, updatesToday: 24, activeProjects: 6 }
  };

  /* ── Main Init ────────────────────────────────────────────────────────── */
  async function init() {
    // 1. Session check
    try {
      if (window.Auth && typeof Auth.checkSession === 'function') {
        currentUser = await Auth.checkSession();
      }
    } catch (e) { /* dev mode */ }

    // 2. Load fragments
    await Promise.all([
      loadFragment('/fragments/sidebar/sidebar.html', 'sidebar-mount'),
      loadFragment('/fragments/navbar/navbar.html',   'navbar-mount')
    ]);

    // 3. Init fragment behaviors
    if (window.Sidebar && typeof Sidebar.init === 'function') Sidebar.init(currentUser);
    if (window.Navbar  && typeof Navbar.init  === 'function') Navbar.init(currentUser);

    // 4. Mark Workspace as active nav item
    const navWorkspace = document.getElementById('nav-workspace');
    if (navWorkspace) {
      document.querySelectorAll('.nav-item.active').forEach(el => el.classList.remove('active'));
      navWorkspace.classList.add('active');
      navWorkspace.href = '/pages/workspace/workspace.html';
    }

    // 5. Fetch workspace data
    let data = SEED;
    try {
      const res = await fetch('/api/workspace/data');
      if (res.ok) data = await res.json();
    } catch (err) {
      console.info('Using seed workspace data (API offline)');
    }

    // 6. Render all sections
    renderContinueCard(data.continueWorking);
    renderKICards(data.knowledgeIndex);
    renderRecentList(data.recentItems);
    renderDeskCounts(data.desk);
    renderShortcuts(data.shortcuts);
    renderStats(data.stats);

    // 7. Live date label
    updateDateLabel();
    setInterval(updateDateLabel, 60000);

    // 8. Continue button nav
    const continueBtn = document.getElementById('ws-continue-btn');
    if (continueBtn && data.continueWorking && data.continueWorking.url) {
      continueBtn.addEventListener('click', () => {
        window.location.href = data.continueWorking.url;
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
