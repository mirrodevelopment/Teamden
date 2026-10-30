/**
 * Teamden — Team Libraries / Design Library Controller
 * Path: pages/workspace/team-libraries/team-libraries.js
 *
 * Responsibilities:
 * 1. Mount sidebar + navbar fragments
 * 2. Render team avatars & access row
 * 3. Render Start Here featured document card
 * 4. Render four collection cards (Brand System, Components, Research, Delivery)
 * 5. Render document list with filter pills, search input, and sort dropdown
 * 6. Render right context panel (Managed by, Access, Needs Review, Connected Projects)
 * 7. Interactive Modals & Drawers: Document Preview, Team Access, Review Document
 */

(function () {
  'use strict';

  let currentUser = null;
  let activeFilter = 'all';
  let activeCollection = null;
  let searchQuery = '';
  let activeSort = 'latest';

  /* ── Team Members ──────────────────────────────────────────────────────── */
  const TEAM_MEMBERS = [
    { id: 'm1', name: 'Priya Kapoor', role: 'Design Lead', initials: 'PK', bgClass: 'tl-avatar--pk', email: 'priya@teamden.io' },
    { id: 'm2', name: 'Alex Rivera', role: 'Senior Product Designer', initials: 'AR', bgClass: 'tl-avatar--ar', email: 'alex@teamden.io' },
    { id: 'm3', name: 'Samir Khan', role: 'Brand & Systems Designer', initials: 'SK', bgClass: 'tl-avatar--sk', email: 'samir@teamden.io' },
    { id: 'm4', name: 'Maya Jones', role: 'UI/UX Designer', initials: 'MJ', bgClass: 'tl-avatar--mj', email: 'maya@teamden.io' }
  ];

  /* ── Collections ───────────────────────────────────────────────────────── */
  const COLLECTIONS = [
    {
      id: 'coll-brand',
      num: '01',
      title: 'Brand System.',
      desc: 'Foundations, logo guidelines, colors & typography.',
      themeClass: 'tl-collection-card--beige',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>`
    },
    {
      id: 'coll-components',
      num: '02',
      title: 'Design System Components.',
      desc: 'UI components, tokens, Figma assets & spec sheets.',
      themeClass: 'tl-collection-card--lav',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`
    },
    {
      id: 'coll-research',
      num: '03',
      title: 'Research & Decisions.',
      desc: 'User testing, architecture decisions & specs.',
      themeClass: 'tl-collection-card--green',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>`
    },
    {
      id: 'coll-delivery',
      num: '04',
      title: 'Delivery & Handoff.',
      desc: 'Developer handoffs, release notes & assets.',
      themeClass: 'tl-collection-card--blue',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16.5 9.4 7.55 4.24"></polyline><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.29 7 12 12.01 20.71 7"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`
    }
  ];

  /* ── Documents ─────────────────────────────────────────────────────────── */
  const DOCUMENTS = [
    {
      id: 'doc-1',
      title: 'Brand Guidelines v2.2',
      collectionId: 'coll-brand',
      collectionName: 'Brand System',
      author: 'Priya K.',
      updated: 'Updated 2d ago',
      updatedTs: Date.now() - 2 * 86400000,
      status: 'APPROVED',
      statusBadge: 'tl-badge--approved',
      starred: true,
      desc: 'Full specification for brand foundations, iconography, typography hierarchy and color standards.'
    },
    {
      id: 'doc-2',
      title: 'Color Palette & Accessibility Matrix',
      collectionId: 'coll-brand',
      collectionName: 'Brand System',
      author: 'Alex R.',
      updated: 'Updated 3d ago',
      updatedTs: Date.now() - 3 * 86400000,
      status: 'VERSION 1.4',
      statusBadge: 'tl-badge--version',
      starred: true,
      desc: 'WCAG AAA contrast tables, functional status colors, dark mode tokens and surface definitions.'
    },
    {
      id: 'doc-3',
      title: 'Typography Scale & Font Tokens',
      collectionId: 'coll-brand',
      collectionName: 'Brand System',
      author: 'Samir K.',
      updated: 'Updated 4d ago',
      updatedTs: Date.now() - 4 * 86400000,
      status: 'APPROVED',
      statusBadge: 'tl-badge--approved',
      starred: false,
      desc: 'Desktop and mobile modular type scale, font pairings (Montserrat & Inter Tight), and line-heights.'
    },
    {
      id: 'doc-4',
      title: 'Button & Input Component Specs',
      collectionId: 'coll-components',
      collectionName: 'Design System Components',
      author: 'Alex R.',
      updated: 'Updated 5d ago',
      updatedTs: Date.now() - 5 * 86400000,
      status: 'SHARED',
      statusBadge: 'tl-badge--shared',
      starred: true,
      desc: 'Specs for interactive states (default, hover, focus, disabled, loading) and form error indicators.'
    },
    {
      id: 'doc-5',
      title: 'Modal & Dialog Interaction Rules',
      collectionId: 'coll-components',
      collectionName: 'Design System Components',
      author: 'Priya K.',
      updated: 'Updated 1w ago',
      updatedTs: Date.now() - 7 * 86400000,
      status: 'APPROVED',
      statusBadge: 'tl-badge--approved',
      starred: false,
      desc: 'Focus trap conventions, backdrop click behavior, accessibility aria-roles and escape handling.'
    },
    {
      id: 'doc-6',
      title: 'Q4 Usability Test Report — Workspace',
      collectionId: 'coll-research',
      collectionName: 'Research & Decisions',
      author: 'Maya J.',
      updated: 'Updated 1w ago',
      updatedTs: Date.now() - 8 * 86400000,
      status: 'DRAFT',
      statusBadge: 'tl-badge--draft',
      starred: false,
      desc: 'Synthesis of 12 moderated user tests on multi-project navigation and knowledge library discovery.'
    },
    {
      id: 'doc-7',
      title: 'Mobile Navigation Decision Record',
      collectionId: 'coll-research',
      collectionName: 'Research & Decisions',
      author: 'Samir K.',
      updated: 'Updated 2w ago',
      updatedTs: Date.now() - 14 * 86400000,
      status: 'APPROVED',
      statusBadge: 'tl-badge--approved',
      starred: true,
      desc: 'Evaluation matrix between bottom bar navigation vs collapsible side drawer on narrow viewports.'
    },
    {
      id: 'doc-8',
      title: 'Handoff Checklist for Web V2',
      collectionId: 'coll-delivery',
      collectionName: 'Delivery & Handoff',
      author: 'Maya J.',
      updated: 'Updated 3w ago',
      updatedTs: Date.now() - 21 * 86400000,
      status: 'TASKS (4)',
      statusBadge: 'tl-badge--tasks',
      starred: false,
      desc: 'Design QA review checklist, token exports, asset compression guidelines and CSS custom properties.'
    },
    {
      id: 'doc-9',
      title: 'Iconography Library & SVGs',
      collectionId: 'coll-brand',
      collectionName: 'Brand System',
      author: 'Alex R.',
      updated: 'Updated 3w ago',
      updatedTs: Date.now() - 22 * 86400000,
      status: 'SHARED',
      statusBadge: 'tl-badge--shared',
      starred: false,
      desc: '24px stroked icon grid, export rules and optical alignment recommendations.'
    },
    {
      id: 'doc-10',
      title: 'Animation & Motion Guidelines',
      collectionId: 'coll-components',
      collectionName: 'Design System Components',
      author: 'Priya K.',
      updated: 'Updated 1mo ago',
      updatedTs: Date.now() - 30 * 86400000,
      status: 'DRAFT',
      statusBadge: 'tl-badge--draft',
      starred: false,
      desc: 'Easing curves (cubic-bezier), micro-interaction timings and reduced-motion fallbacks.'
    }
  ];

  /* ── Connected Projects ────────────────────────────────────────────────── */
  const CONNECTED_PROJECTS = [
    { id: 'p1', name: 'Website Redesign 2026', url: '/pages/projects/project-detail/project-detail.html' },
    { id: 'p2', name: 'Mobile App v3.0', url: '/pages/projects/project-detail/project-detail.html' },
    { id: 'p3', name: 'Design System UI Kit', url: '/pages/projects/project-detail/project-detail.html' },
    { id: 'p4', name: 'Brand Refresh Q4', url: '/pages/projects/project-detail/project-detail.html' }
  ];

  /* ── Helpers ───────────────────────────────────────────────────────────── */
  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

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

  /* ── Toast Notifications ───────────────────────────────────────────────── */
  function showToast(message, type = 'info') {
    let toast = document.getElementById('tl-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'tl-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: #111111;
        color: #FFFFFF;
        padding: 0.65rem 1.1rem;
        border-radius: 8px;
        font-size: 0.75rem;
        font-weight: 600;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: opacity 200ms ease, transform 200ms ease;
        opacity: 0;
        transform: translateY(10px);
        pointer-events: none;
      `;
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span style="color:#C9F34A;">●</span> ${esc(message)}`;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
    }, 2800);
  }

  /* ── Modal Utility ─────────────────────────────────────────────────────── */
  function openModal(title, contentHtml, footerHtml = '') {
    let backdrop = document.getElementById('tl-modal-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'tl-modal-backdrop';
      backdrop.style.cssText = `
        position: fixed; inset: 0;
        background: rgba(17, 17, 17, 0.45);
        backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity 150ms ease;
        padding: 1.5rem;
      `;
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeModal();
      });
      document.body.appendChild(backdrop);
    }

    backdrop.innerHTML = `
      <div class="tl-modal-card" style="
        background: var(--dash-bg-card, #FAF7F1);
        border: 1px solid var(--dash-border, #E5E1D9);
        border-radius: 12px;
        width: 100%;
        max-width: 540px;
        box-shadow: 0 12px 32px rgba(0,0,0,0.18);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: tlPopIn 150ms ease-out;
      ">
        <div style="display:flex; align-items:center; justify-content:space-between; padding: 1rem 1.25rem; border-bottom: 1px solid var(--dash-border, #E5E1D9);">
          <h3 style="margin:0; font-size:0.95rem; font-weight:700; color:var(--dash-text-primary, #111);">${esc(title)}</h3>
          <button id="tl-modal-close-btn" style="background:none; border:none; font-size:1.25rem; cursor:pointer; color:var(--dash-text-muted); padding:0.2rem 0.4rem; line-height:1;">&times;</button>
        </div>
        <div style="padding: 1.25rem; font-size:0.8125rem; color:var(--dash-text-body, #2B2B2B); max-height:70vh; overflow-y:auto; line-height:1.5;">
          ${contentHtml}
        </div>
        ${footerHtml ? `<div style="padding: 0.75rem 1.25rem; border-top: 1px solid var(--dash-border, #E5E1D9); background: var(--dash-bg-search, #F3EFE7); display:flex; justify-content:flex-end; gap:0.5rem;">${footerHtml}</div>` : ''}
      </div>
    `;

    document.getElementById('tl-modal-close-btn').onclick = closeModal;
    backdrop.style.opacity = '1';
  }

  function closeModal() {
    const backdrop = document.getElementById('tl-modal-backdrop');
    if (backdrop) {
      backdrop.style.opacity = '0';
      setTimeout(() => {
        if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      }, 150);
    }
  }

  /* ── Render Avatars ────────────────────────────────────────────────────── */
  function renderAvatars() {
    const el = document.getElementById('tl-avatars-group');
    if (!el) return;
    el.innerHTML = TEAM_MEMBERS.map(m => `
      <div class="tl-avatar ${m.bgClass}" title="${esc(m.name)} — ${esc(m.role)}">
        ${esc(m.initials)}
      </div>
    `).join('');
  }

  /* ── Render Collections ────────────────────────────────────────────────── */
  function renderCollections() {
    const el = document.getElementById('tl-collections-list');
    if (!el) return;

    el.innerHTML = COLLECTIONS.map(c => `
      <div class="tl-collection-card ${c.themeClass} ${activeCollection === c.id ? 'tl-collection-card--selected' : ''}" data-collection-id="${c.id}" role="button" tabindex="0">
        <span class="tl-coll-num">${c.num}</span>
        <div class="tl-coll-icon">
          ${c.icon}
        </div>
        <div class="tl-coll-copy">
          <h3 class="tl-coll-title">${esc(c.title)}</h3>
          <p class="tl-coll-desc">${esc(c.desc)}</p>
        </div>
        <span class="tl-coll-arrow">&#8594;</span>
      </div>
    `).join('');

    // Attach click events
    el.querySelectorAll('.tl-collection-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-collection-id');
        if (activeCollection === id) {
          activeCollection = null; // Toggle off
          showToast('Showing all collections');
        } else {
          activeCollection = id;
          const coll = COLLECTIONS.find(c => c.id === id);
          showToast(`Filtered by ${coll ? coll.title : 'collection'}`);
        }
        renderCollections();
        renderDocuments();
      });
    });
  }

  /* ── Render Documents ──────────────────────────────────────────────────── */
  function renderDocuments() {
    const listEl = document.getElementById('tl-doc-list');
    const emptyEl = document.getElementById('tl-empty-state');
    const emptyMsgEl = document.getElementById('tl-empty-msg');
    if (!listEl) return;

    let filtered = [...DOCUMENTS];

    // Filter by collection
    if (activeCollection) {
      filtered = filtered.filter(d => d.collectionId === activeCollection);
    }

    // Filter by active pill
    if (activeFilter === 'recent') {
      const sevenDaysAgo = Date.now() - 7 * 86400000;
      filtered = filtered.filter(d => d.updatedTs >= sevenDaysAgo);
    } else if (activeFilter === 'starred') {
      filtered = filtered.filter(d => d.starred);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.collectionName.toLowerCase().includes(q) ||
        d.desc.toLowerCase().includes(q) ||
        d.author.toLowerCase().includes(q)
      );
    }

    // Sort
    if (activeSort === 'latest') {
      filtered.sort((a, b) => b.updatedTs - a.updatedTs);
    } else if (activeSort === 'oldest') {
      filtered.sort((a, b) => a.updatedTs - b.updatedTs);
    } else if (activeSort === 'title') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    if (filtered.length === 0) {
      listEl.innerHTML = '';
      if (emptyEl) {
        emptyEl.style.display = 'block';
        if (emptyMsgEl) {
          emptyMsgEl.textContent = searchQuery.trim()
            ? `No documents match "${searchQuery}".`
            : 'No documents in this view.';
        }
      }
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';

    listEl.innerHTML = filtered.map(doc => `
      <div class="tl-doc-row" data-doc-id="${doc.id}" role="button" tabindex="0">
        <div class="tl-doc-file-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
        </div>
        <div class="tl-doc-info">
          <span class="tl-doc-title">${esc(doc.title)}</span>
          <span class="tl-doc-meta">${esc(doc.collectionName)} <span class="tl-doc-meta-sep">•</span> ${esc(doc.author)}</span>
        </div>
        <span class="tl-doc-updated">${esc(doc.updated)}</span>
        <div class="tl-doc-status">
          <span class="tl-badge ${doc.statusBadge}">${esc(doc.status)}</span>
        </div>
        <button class="tl-doc-menu-btn" data-doc-id="${doc.id}" title="Options" aria-label="Document options">&#8230;</button>
      </div>
    `).join('');

    // Attach click listeners to rows
    listEl.querySelectorAll('.tl-doc-row').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('.tl-doc-menu-btn')) return;
        const docId = row.getAttribute('data-doc-id');
        const doc = DOCUMENTS.find(d => d.id === docId);
        if (doc) openDocumentPreview(doc);
      });
    });

    // Attach menu button actions
    listEl.querySelectorAll('.tl-doc-menu-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const docId = btn.getAttribute('data-doc-id');
        const doc = DOCUMENTS.find(d => d.id === docId);
        if (doc) openDocumentMenu(doc, btn);
      });
    });
  }

  /* ── Document Preview Modal ────────────────────────────────────────────── */
  function openDocumentPreview(doc) {
    const content = `
      <div style="display:flex; flex-direction:column; gap:0.75rem;">
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <span class="tl-badge ${doc.statusBadge}">${esc(doc.status)}</span>
          <span style="color:var(--dash-text-muted); font-size:0.72rem;">${esc(doc.collectionName)}</span>
          <span style="color:var(--dash-text-light); font-size:0.72rem;">•</span>
          <span style="color:var(--dash-text-muted); font-size:0.72rem;">${esc(doc.updated)}</span>
        </div>
        <p style="margin:0; font-size:0.875rem; color:var(--dash-text-body); line-height:1.6;">
          ${esc(doc.desc)}
        </p>
        <div style="margin-top:0.5rem; padding:0.75rem; background:var(--dash-bg-search, #F3EFE7); border-radius:6px; font-size:0.75rem; color:var(--dash-text-muted);">
          <strong>Author:</strong> ${esc(doc.author)}<br>
          <strong>Library:</strong> Design Library (Workspace / 02)<br>
          <strong>Permissions:</strong> View &amp; Comment (Design Team)
        </div>
      </div>
    `;

    const footer = `
      <button onclick="document.getElementById('tl-modal-close-btn').click();" style="padding:0.4rem 0.8rem; background:none; border:1px solid var(--dash-border); border-radius:6px; font-size:0.75rem; cursor:pointer; color:var(--dash-text-muted);">Close</button>
      <button id="tl-modal-copy-btn" style="padding:0.4rem 0.85rem; background:#111; color:#fff; border:none; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">Copy Link</button>
    `;

    openModal(doc.title, content, footer);

    const copyBtn = document.getElementById('tl-modal-copy-btn');
    if (copyBtn) {
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(window.location.origin + window.location.pathname + '#' + doc.id);
        showToast('Link copied to clipboard');
        closeModal();
      };
    }
  }

  /* ── Document Menu Actions ─────────────────────────────────────────────── */
  function openDocumentMenu(doc, anchorEl) {
    const isStarred = doc.starred;
    const content = `
      <div style="display:flex; flex-direction:column; gap:0.5rem;">
        <button id="menu-view" style="display:flex; align-items:center; gap:0.5rem; padding:0.6rem 0.8rem; background:none; border:none; text-align:left; font-size:0.8125rem; font-weight:600; cursor:pointer; border-radius:6px; color:var(--dash-text-primary);">
          <span>Open document</span>
        </button>
        <button id="menu-star" style="display:flex; align-items:center; gap:0.5rem; padding:0.6rem 0.8rem; background:none; border:none; text-align:left; font-size:0.8125rem; font-weight:600; cursor:pointer; border-radius:6px; color:var(--dash-text-primary);">
          <span>${isStarred ? '★ Remove from Starred' : '☆ Add to Starred'}</span>
        </button>
        <button id="menu-copy" style="display:flex; align-items:center; gap:0.5rem; padding:0.6rem 0.8rem; background:none; border:none; text-align:left; font-size:0.8125rem; font-weight:600; cursor:pointer; border-radius:6px; color:var(--dash-text-primary);">
          <span>Copy document link</span>
        </button>
      </div>
    `;

    openModal(`Document Options: ${doc.title}`, content);

    document.getElementById('menu-view').onclick = () => {
      closeModal();
      openDocumentPreview(doc);
    };

    document.getElementById('menu-star').onclick = () => {
      doc.starred = !doc.starred;
      closeModal();
      renderDocuments();
      showToast(doc.starred ? 'Added to Starred' : 'Removed from Starred');
    };

    document.getElementById('menu-copy').onclick = () => {
      navigator.clipboard.writeText(window.location.origin + window.location.pathname + '#' + doc.id);
      closeModal();
      showToast('Document link copied to clipboard');
    };
  }

  /* ── Render Connected Projects ─────────────────────────────────────────── */
  function renderProjects() {
    const el = document.getElementById('tl-projects-list');
    const emptyEl = document.getElementById('tl-projects-empty');
    if (!el) return;

    if (CONNECTED_PROJECTS.length === 0) {
      el.innerHTML = '';
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';

    el.innerHTML = CONNECTED_PROJECTS.map(p => `
      <a href="${esc(p.url)}" class="tl-project-row">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="18" cy="18" r="3"></circle>
          <circle cx="6" cy="6" r="3"></circle>
          <path d="M13 6h3a2 2 0 0 1 2 2v7"></path>
          <line x1="6" y1="9" x2="6" y2="21"></line>
        </svg>
        <span>${esc(p.name)}</span>
        <span class="tl-ctx-arrow">&#8594;</span>
      </a>
    `).join('');
  }

  /* ── Team Access & Permissions Modals ──────────────────────────────────── */
  function openTeamAccessModal() {
    const content = `
      <div style="display:flex; flex-direction:column; gap:1rem;">
        <p style="margin:0; font-size:0.78rem; color:var(--dash-text-muted);">
          Members with access to the <strong>Design Library</strong> workspace collection.
        </p>
        <div style="display:flex; flex-direction:column; gap:0.5rem;">
          ${TEAM_MEMBERS.map(m => `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:0.5rem 0.75rem; background:var(--dash-bg-search, #F3EFE7); border-radius:8px;">
              <div style="display:flex; align-items:center; gap:0.65rem;">
                <div class="tl-avatar ${m.bgClass}" style="width:28px; height:28px; font-size:0.55rem; margin:0;">${esc(m.initials)}</div>
                <div>
                  <div style="font-weight:700; font-size:0.78rem; color:var(--dash-text-primary);">${esc(m.name)}</div>
                  <div style="font-size:0.68rem; color:var(--dash-text-muted);">${esc(m.email)}</div>
                </div>
              </div>
              <span class="tl-badge tl-badge--neutral">${esc(m.role)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const footer = `
      <button onclick="document.getElementById('tl-modal-close-btn').click();" style="padding:0.4rem 0.8rem; background:none; border:1px solid var(--dash-border); border-radius:6px; font-size:0.75rem; cursor:pointer; color:var(--dash-text-muted);">Close</button>
      <button id="tl-invite-btn" style="padding:0.4rem 0.85rem; background:#111; color:#fff; border:none; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">+ Invite Member</button>
    `;

    openModal('Team Access — Design Library', content, footer);

    const inviteBtn = document.getElementById('tl-invite-btn');
    if (inviteBtn) {
      inviteBtn.onclick = () => {
        closeModal();
        showToast('Invite sent to new team member');
      };
    }
  }

  function openPermissionsModal() {
    const content = `
      <div style="display:flex; flex-direction:column; gap:0.75rem;">
        <p style="margin:0; font-size:0.78rem; color:var(--dash-text-muted);">
          Configure library visibility and editing privileges for team members.
        </p>
        <div style="display:flex; flex-direction:column; gap:0.6rem;">
          <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.78rem; cursor:pointer;">
            <input type="checkbox" checked disabled>
            <span>Allow all Design Team members to edit documents</span>
          </label>
          <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.78rem; cursor:pointer;">
            <input type="checkbox" checked>
            <span>Require approval for Brand System guideline changes</span>
          </label>
          <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.78rem; cursor:pointer;">
            <input type="checkbox" checked>
            <span>Allow read-only guest access across organization</span>
          </label>
        </div>
      </div>
    `;

    const footer = `
      <button onclick="document.getElementById('tl-modal-close-btn').click();" style="padding:0.4rem 0.8rem; background:none; border:1px solid var(--dash-border); border-radius:6px; font-size:0.75rem; cursor:pointer; color:var(--dash-text-muted);">Cancel</button>
      <button id="tl-save-perms-btn" style="padding:0.4rem 0.85rem; background:#111; color:#fff; border:none; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">Save Changes</button>
    `;

    openModal('Manage Permissions', content, footer);

    const saveBtn = document.getElementById('tl-save-perms-btn');
    if (saveBtn) {
      saveBtn.onclick = () => {
        closeModal();
        showToast('Permissions updated successfully');
      };
    }
  }

  function openSettingsModal() {
    const content = `
      <div style="display:flex; flex-direction:column; gap:0.75rem;">
        <div>
          <label style="font-size:0.72rem; font-weight:700; color:var(--dash-text-muted); display:block; margin-bottom:0.25rem;">LIBRARY NAME</label>
          <input type="text" value="Design Library" style="width:100%; padding:0.45rem 0.65rem; border:1px solid var(--dash-border); border-radius:6px; background:#fff; font-size:0.8rem;">
        </div>
        <div>
          <label style="font-size:0.72rem; font-weight:700; color:var(--dash-text-muted); display:block; margin-bottom:0.25rem;">DESCRIPTION</label>
          <textarea style="width:100%; padding:0.45rem 0.65rem; border:1px solid var(--dash-border); border-radius:6px; background:#fff; font-size:0.8rem; height:60px;">The shared knowledge of the Design Team.</textarea>
        </div>
        <div>
          <label style="font-size:0.72rem; font-weight:700; color:var(--dash-text-muted); display:block; margin-bottom:0.25rem;">PRIMARY CONTACT</label>
          <input type="text" value="Priya Kapoor (priya@teamden.io)" style="width:100%; padding:0.45rem 0.65rem; border:1px solid var(--dash-border); border-radius:6px; background:#fff; font-size:0.8rem;">
        </div>
      </div>
    `;

    const footer = `
      <button onclick="document.getElementById('tl-modal-close-btn').click();" style="padding:0.4rem 0.8rem; background:none; border:1px solid var(--dash-border); border-radius:6px; font-size:0.75rem; cursor:pointer; color:var(--dash-text-muted);">Cancel</button>
      <button id="tl-save-settings-btn" style="padding:0.4rem 0.85rem; background:#111; color:#fff; border:none; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">Save</button>
    `;

    openModal('Library Settings', content, footer);

    const saveBtn = document.getElementById('tl-save-settings-btn');
    if (saveBtn) {
      saveBtn.onclick = () => {
        closeModal();
        showToast('Library settings saved');
      };
    }
  }

  /* ── Needs Review Modal ────────────────────────────────────────────────── */
  function openReviewModal() {
    const content = `
      <div style="display:flex; flex-direction:column; gap:0.85rem;">
        <div style="display:flex; align-items:center; gap:0.6rem;">
          <span class="tl-badge tl-badge--neutral">AWAITING APPROVAL</span>
          <span style="font-size:0.75rem; color:var(--dash-text-muted);">Submitted by Priya K. • 2d ago</span>
        </div>
        <p style="margin:0; font-size:0.8125rem; line-height:1.5; color:var(--dash-text-body);">
          <strong>Summary of changes in v2.2:</strong><br>
          • Updated dark mode token hierarchy to comply with WCAG 2.1 AAA contrast.<br>
          • Added secondary button hover states and focus ring specs.<br>
          • Harmonized typography scale across desktop and mobile breakpoints.
        </p>
        <div style="background:var(--dash-bg-search, #F3EFE7); padding:0.75rem; border-radius:6px; font-size:0.75rem; color:var(--dash-text-muted);">
          Pending approvals: <strong>1 of 2 required</strong> (Priya Kapoor approved, waiting on Lead Review).
        </div>
      </div>
    `;

    const footer = `
      <button onclick="document.getElementById('tl-modal-close-btn').click();" style="padding:0.4rem 0.8rem; background:none; border:1px solid var(--dash-border); border-radius:6px; font-size:0.75rem; cursor:pointer; color:var(--dash-text-muted);">Close</button>
      <button id="tl-request-changes-btn" style="padding:0.4rem 0.8rem; background:none; border:1px solid #EADCCC; border-radius:6px; font-size:0.75rem; cursor:pointer; color:#7A5520; font-weight:600;">Request Changes</button>
      <button id="tl-approve-btn" style="padding:0.4rem 0.85rem; background:#3A6B2E; color:#fff; border:none; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">✓ Approve v2.2</button>
    `;

    openModal('Review Document — Brand Guidelines v2.2', content, footer);

    const approveBtn = document.getElementById('tl-approve-btn');
    if (approveBtn) {
      approveBtn.onclick = () => {
        closeModal();
        const reviewRow = document.getElementById('tl-review-doc-row');
        const reviewAction = document.getElementById('tl-review-action-btn');
        const reviewEmpty = document.getElementById('tl-review-empty');
        if (reviewRow) reviewRow.style.display = 'none';
        if (reviewAction) reviewAction.style.display = 'none';
        if (reviewEmpty) reviewEmpty.style.display = 'block';
        showToast('Document approved successfully');
      };
    }

    const reqBtn = document.getElementById('tl-request-changes-btn');
    if (reqBtn) {
      reqBtn.onclick = () => {
        closeModal();
        showToast('Feedback submitted to author');
      };
    }
  }

  /* ── Event Listeners & Wiring ──────────────────────────────────────────── */
  function wireEvents() {
    // Start Here card button
    const startOpenBtn = document.getElementById('tl-start-open-btn');
    if (startOpenBtn) {
      startOpenBtn.addEventListener('click', () => {
        const doc = DOCUMENTS[0];
        if (doc) openDocumentPreview(doc);
      });
    }

    // Team access buttons
    const teamAccessBtn = document.getElementById('tl-team-access-btn');
    if (teamAccessBtn) teamAccessBtn.addEventListener('click', openTeamAccessModal);

    const ctxTeamAccess = document.getElementById('tl-ctx-team-access');
    if (ctxTeamAccess) ctxTeamAccess.addEventListener('click', openTeamAccessModal);

    const ctxPerms = document.getElementById('tl-ctx-manage-perms');
    if (ctxPerms) ctxPerms.addEventListener('click', openPermissionsModal);

    const ctxSettings = document.getElementById('tl-ctx-lib-settings');
    if (ctxSettings) ctxSettings.addEventListener('click', openSettingsModal);

    // Review action button
    const reviewActionBtn = document.getElementById('tl-review-action-btn');
    if (reviewActionBtn) reviewActionBtn.addEventListener('click', openReviewModal);

    // Filter pills
    const filterPills = document.querySelectorAll('.tl-filter-pill');
    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.forEach(p => p.classList.remove('tl-filter-pill--active'));
        pill.classList.add('tl-filter-pill--active');
        activeFilter = pill.getAttribute('data-filter') || 'all';
        renderDocuments();
      });
    });

    // Search input
    const searchInput = document.getElementById('tl-doc-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderDocuments();
      });
    }

    // Sort dropdown
    const sortBtn = document.getElementById('tl-sort-btn');
    const sortMenu = document.getElementById('tl-sort-menu');
    const sortLabel = document.getElementById('tl-sort-label');

    if (sortBtn && sortMenu) {
      sortBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = sortMenu.classList.contains('tl-sort-menu--open');
        sortMenu.classList.toggle('tl-sort-menu--open', !isOpen);
        sortBtn.setAttribute('aria-expanded', !isOpen);
      });

      document.addEventListener('click', (e) => {
        if (!sortBtn.contains(e.target) && !sortMenu.contains(e.target)) {
          sortMenu.classList.remove('tl-sort-menu--open');
          sortBtn.setAttribute('aria-expanded', 'false');
        }
      });

      sortMenu.querySelectorAll('.tl-sort-option').forEach(option => {
        option.addEventListener('click', () => {
          activeSort = option.getAttribute('data-sort') || 'latest';
          if (sortLabel) sortLabel.textContent = option.textContent;
          sortMenu.classList.remove('tl-sort-menu--open');
          sortBtn.setAttribute('aria-expanded', 'false');
          renderDocuments();
        });
      });
    }
  }

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
      loadFragment('/fragments/navbar/navbar.html', 'navbar-mount')
    ]);

    // 3. Init fragment behaviors
    if (window.Sidebar && typeof Sidebar.init === 'function') Sidebar.init(currentUser);
    if (window.Navbar && typeof Navbar.init === 'function') Navbar.init(currentUser);

    // 4. Mark Workspace as active nav item in sidebar
    const navWorkspace = document.getElementById('nav-workspace');
    if (navWorkspace) {
      document.querySelectorAll('.nav-item.active').forEach(el => el.classList.remove('active'));
      navWorkspace.classList.add('active');
      navWorkspace.href = '/pages/workspace/workspace.html';
    }

    // 5. Render sections
    renderAvatars();
    renderCollections();
    renderDocuments();
    renderProjects();

    // 6. Wire interaction events
    wireEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
