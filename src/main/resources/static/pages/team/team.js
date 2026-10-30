/**
 * Teamden by shed — Team Collaboration Dashboard Controller (team.js)
 * Path: pages/team/team.js
 *
 * Responsibilities:
 * 1. Mounts sidebar and navbar fragments & marks "04 Team" as active
 * 2. Fetches live/seed team data (members, teams, collaborations, requests, mentions)
 * 3. Renders:
 *    - Featured "Your Team" card (Design Team)
 *    - Explore Your Teams (4 horizontal cards)
 *    - Across Teams (Cross-team collaboration & approvals with pagination)
 *    - From Your Teams (Recent team updates)
 *    - Right Panel: Needs Your Input, Awaiting Response, Mentions & Requests, People Directory
 * 4. Real-time Search & Department filtering
 * 5. Full interactive Modals: Team Space, Directory, Approvals, Mentions & Toasts
 */

(function () {
  'use strict';

  let currentUser = null;
  let activeDeptFilter = 'all';
  let searchQuery = '';
  let acrossTeamsPage = 0;

  /* ── Team Directory Members ────────────────────────────────────────────── */
  const ALL_PEOPLE = [
    { id: 'u1', name: 'Priya Kapoor', initials: 'PK', role: 'Design Lead', dept: 'design', email: 'priya@acme.co', bgClass: 'avatar--pk' },
    { id: 'u2', name: 'Alex Rivera', initials: 'AR', role: 'Senior Product Designer', dept: 'design', email: 'alex@acme.co', bgClass: 'avatar--ar' },
    { id: 'u3', name: 'Samir Khan', initials: 'SK', role: 'Systems & Brand Designer', dept: 'design', email: 'samir@acme.co', bgClass: 'avatar--sk' },
    { id: 'u4', name: 'Maya Jones', initials: 'MJ', role: 'Staff Frontend Engineer', dept: 'engineering', email: 'maya@acme.co', bgClass: 'avatar--mj' },
    { id: 'u5', name: 'Nisha Varma', initials: 'NV', role: 'Content Strategy Lead', dept: 'content', email: 'nisha@acme.co', bgClass: 'avatar--nv' },
    { id: 'u6', name: 'Rohan Kumar', initials: 'RK', role: 'Senior Backend Engineer', dept: 'engineering', email: 'rohan@acme.co', bgClass: 'avatar--rk' },
    { id: 'u7', name: 'Sarah Miller', initials: 'SM', role: 'Director of Operations', dept: 'operations', email: 'sarah@acme.co', bgClass: 'avatar--sm' },
    { id: 'u8', name: 'Ananya Verma', initials: 'AV', role: 'Cloud Platform Architect', dept: 'engineering', email: 'ananya@acme.co', bgClass: 'avatar--av' },
    { id: 'u9', name: 'Daniel Moore', initials: 'DM', role: 'Product Manager', dept: 'operations', email: 'daniel@acme.co', bgClass: 'avatar--pk' },
    { id: 'u10', name: 'Elena Rostova', initials: 'ER', role: 'UX Researcher', dept: 'design', email: 'elena@acme.co', bgClass: 'avatar--ar' },
    { id: 'u11', name: 'Tariq Al-Mansoor', initials: 'TM', role: 'DevOps Engineer', dept: 'engineering', email: 'tariq@acme.co', bgClass: 'avatar--sk' },
    { id: 'u12', name: 'Chloe Dubois', initials: 'CD', role: 'Technical Writer', dept: 'content', email: 'chloe@acme.co', bgClass: 'avatar--nv' },
    { id: 'u13', name: 'Marcus Vance', initials: 'MV', role: 'Release Coordinator', dept: 'operations', email: 'marcus@acme.co', bgClass: 'avatar--rk' },
    { id: 'u14', name: 'Hana Tanaka', initials: 'HT', role: 'Visual Designer', dept: 'design', email: 'hana@acme.co', bgClass: 'avatar--mj' },
    { id: 'u15', name: 'Lucas Scott', initials: 'LS', role: 'QA Lead', dept: 'engineering', email: 'lucas@acme.co', bgClass: 'avatar--sm' },
    { id: 'u16', name: 'Grace O\'Connor', initials: 'GO', role: 'Copy Editor', dept: 'content', email: 'grace@acme.co', bgClass: 'avatar--av' }
  ];

  /* ── Teams Data ────────────────────────────────────────────────────────── */
  const TEAMS = [
    {
      id: 'team-design',
      num: '01',
      name: 'Design',
      dept: 'design',
      fullName: 'Design Team',
      desc: 'Visual systems, research and experiences',
      fullDesc: 'Building consistent, intuitive digital experiences across projects. Responsible for brand identity, UI design tokens, prototyping, and end-user research.',
      themeClass: 'team-card--lavender',
      iconSvg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>`,
      membersCount: 4,
      projectsCount: 3,
      lead: 'Priya Kapoor',
      activeProjects: ['Website Redesign 2026', 'ORYGN App UI', 'Design System v2'],
      members: ['u1', 'u2', 'u3', 'u4']
    },
    {
      id: 'team-engineering',
      num: '02',
      name: 'Engineering',
      dept: 'engineering',
      fullName: 'Engineering Team',
      desc: 'Development, systems and delivery',
      fullDesc: 'Architecting high-scale frontend applications, distributed microservices, infrastructure automation, and automated testing pipelines.',
      themeClass: 'team-card--blue',
      iconSvg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`,
      membersCount: 6,
      projectsCount: 5,
      lead: 'Maya Jones',
      activeProjects: ['Core Services API', 'Web App Client', 'Cloud Infrastructure', 'Mobile SDK', 'Dev Portal'],
      members: ['u4', 'u6', 'u8', 'u7']
    },
    {
      id: 'team-content',
      num: '03',
      name: 'Content',
      dept: 'content',
      fullName: 'Content Team',
      desc: 'Communication, writing and knowledge',
      fullDesc: 'Crafting brand messaging, product copy, knowledge base articles, technical documentation, and strategic company communications.',
      themeClass: 'team-card--green',
      iconSvg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`,
      membersCount: 5,
      projectsCount: 2,
      lead: 'Nisha Varma',
      activeProjects: ['Company Knowledge Hub', 'Product Launch Copy'],
      members: ['u3', 'u5', 'u2', 'u1']
    },
    {
      id: 'team-operations',
      num: '04',
      name: 'Operations',
      dept: 'operations',
      fullName: 'Operations Team',
      desc: 'Coordination, planning and handoffs',
      fullDesc: 'Orchestrating cross-functional workflows, agile sprint cadences, project delivery milestones, and operational compliance.',
      themeClass: 'team-card--beige',
      iconSvg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="16.5" y1="9.4" x2="7.55" y2="4.24"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.29 7 12 12.01 20.71 7"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
      membersCount: 4,
      projectsCount: 4,
      lead: 'Sarah Miller',
      activeProjects: ['Q4 Roadmap Execution', 'SOC2 Readiness', 'Vendor Integration', 'Handoff Guidelines'],
      members: ['u1', 'u7', 'u6', 'u8']
    }
  ];

  /* ── Across Teams Collaborations ───────────────────────────────────────── */
  const ACROSS_TEAMS = [
    {
      id: 'collab-1',
      fromBadge: 'DESIGN',
      fromClass: 'team-pill-badge--design',
      toBadge: 'ENGINEERING',
      toClass: 'team-pill-badge--eng',
      title: 'Homepage design approved',
      desc: 'Development can proceed with the approved design.',
      project: 'Website Redesign',
      status: 'Ready for build',
      time: '2 hrs ago',
      details: 'All design sign-offs received from Lead Architect & Product. Tokens exported to repository branch `feature/homepage-redesign`. Staging deployment ready to receive markup.'
    },
    {
      id: 'collab-2',
      fromBadge: 'CONTENT',
      fromClass: 'team-pill-badge--content',
      toBadge: 'DESIGN',
      toClass: 'team-pill-badge--design',
      title: 'Homepage copy awaiting review',
      desc: 'The Content Team has submitted revised copy.',
      project: 'Website Redesign',
      status: 'Review pending',
      time: '5 hrs ago',
      details: 'New header hero copy variations A/B added to Figma copydeck. Please review line-wrapping on narrow mobile breakpoints before developer handoff.'
    },
    {
      id: 'collab-3',
      fromBadge: 'OPERATIONS',
      fromClass: 'team-pill-badge--content',
      toBadge: 'ENGINEERING',
      toClass: 'team-pill-badge--eng',
      title: 'Staging cluster migration scheduled',
      desc: 'Maintenance window confirmed for Sunday 02:00 UTC.',
      project: 'Infrastructure',
      status: 'Confirmed',
      time: '1 day ago',
      details: 'Failover tests passed in sandbox. Core services will transition gracefully with zero downtime expected.'
    },
    {
      id: 'collab-4',
      fromBadge: 'ENGINEERING',
      fromClass: 'team-pill-badge--eng',
      toBadge: 'DESIGN',
      toClass: 'team-pill-badge--design',
      title: 'CSS Token parity audit complete',
      desc: '14 component anomalies resolved against Figma spec.',
      project: 'Design System',
      status: 'Ready for QA',
      time: '1 day ago',
      details: 'Button border radii, focus rings, and dark mode palette variables now map 1-to-1 with the master token file.'
    }
  ];

  /* ── From Your Teams Updates ───────────────────────────────────────────── */
  const TEAM_UPDATES = [
    {
      id: 'up-1',
      teamName: 'Design Team',
      avatarInitials: 'AR',
      avatarBg: 'avatar--ar',
      text: 'Updated design guidelines are ready for review.',
      time: '2 hrs ago',
      author: 'Alex Rivera'
    },
    {
      id: 'up-2',
      teamName: 'Engineering Team',
      avatarInitials: 'MJ',
      avatarBg: 'avatar--mj',
      text: 'Staging environment is ready for testing.',
      time: '4 hrs ago',
      author: 'Maya Jones'
    },
    {
      id: 'up-3',
      teamName: 'Content Team',
      avatarInitials: 'SK',
      avatarBg: 'avatar--sk',
      text: 'New blog draft for feedback.',
      time: '1 day ago',
      author: 'Samir Khan'
    }
  ];

  /* ── Awaiting Your Response ────────────────────────────────────────────── */
  let AWAITING_REQUESTS = [
    {
      id: 'req-1',
      iconClass: 'team-awaiting-icon-wrap--beige',
      iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`,
      title: 'Homepage approval',
      requestedBy: 'Requested by Design Team',
      project: 'Website Redesign',
      time: '1 day ago',
      details: 'Priya Kapoor requested your executive sign-off on the final homepage hero responsive grid.'
    },
    {
      id: 'req-2',
      iconClass: 'team-awaiting-icon-wrap--green',
      iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`,
      title: 'Content review',
      requestedBy: 'Requested by Content Team',
      project: 'Blog Content',
      time: '2 days ago',
      details: 'Nisha Varma tagged you for feedback on the Q4 Customer Spotlight case study article.'
    },
    {
      id: 'req-3',
      iconClass: 'team-awaiting-icon-wrap--beige',
      iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`,
      title: 'Design system feedback',
      requestedBy: 'Requested by Engineering Team',
      project: 'ORYGN App',
      time: '3 days ago',
      details: 'Maya Jones requested review on the interactive states for the multi-select modal component.'
    }
  ];

  /* ── Mentions & Requests ───────────────────────────────────────────────── */
  let MENTIONS = [
    {
      id: 'men-1',
      name: 'Alex R. mentioned you',
      avatarInitials: 'AR',
      avatarBg: 'avatar--ar',
      msg: '"Can you review the updated component spacing?"',
      time: '2 hrs ago',
      thread: 'Design System / Button Component Specs (thread #204)'
    },
    {
      id: 'men-2',
      name: 'Nisha V. tagged you',
      avatarInitials: 'NV',
      avatarBg: 'avatar--nv',
      msg: '"Added you to the homepage content discussion."',
      time: '5 hrs ago',
      thread: 'Website Redesign / Homepage Copy Discussion'
    }
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
  function showToast(message) {
    let toast = document.getElementById('team-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'team-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: #111111;
        color: #FFFFFF;
        padding: 0.65rem 1.15rem;
        border-radius: 8px;
        font-size: 0.75rem;
        font-weight: 600;
        box-shadow: 0 4px 16px rgba(0,0,0,0.22);
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
    let backdrop = document.getElementById('team-modal-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'team-modal-backdrop';
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
      <div class="team-modal-box" style="
        background: var(--dash-bg-card, #FAF7F1);
        border: 1px solid var(--dash-border, #E5E1D9);
        border-radius: 12px;
        width: 100%;
        max-width: 560px;
        box-shadow: 0 12px 36px rgba(0,0,0,0.2);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: teamPopIn 150ms ease-out;
      ">
        <div style="display:flex; align-items:center; justify-content:space-between; padding: 1rem 1.25rem; border-bottom: 1px solid var(--dash-border, #E5E1D9);">
          <h3 style="margin:0; font-size:0.95rem; font-weight:700; color:var(--dash-text-primary, #111);">${esc(title)}</h3>
          <button id="team-modal-close-btn" style="background:none; border:none; font-size:1.35rem; cursor:pointer; color:var(--dash-text-muted, #77736C); padding:0.2rem 0.4rem; line-height:1;">&times;</button>
        </div>
        <div style="padding: 1.25rem; font-size:0.8125rem; color:var(--dash-text-body, #2B2B2B); max-height:70vh; overflow-y:auto; line-height:1.55;">
          ${contentHtml}
        </div>
        ${footerHtml ? `<div style="padding: 0.75rem 1.25rem; border-top: 1px solid var(--dash-border, #E5E1D9); background: var(--dash-bg-search, #F3EFE7); display:flex; justify-content:flex-end; gap:0.5rem;">${footerHtml}</div>` : ''}
      </div>
    `;

    document.getElementById('team-modal-close-btn').onclick = closeModal;
    backdrop.style.opacity = '1';
  }

  function closeModal() {
    const backdrop = document.getElementById('team-modal-backdrop');
    if (backdrop) {
      backdrop.style.opacity = '0';
      setTimeout(() => {
        if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      }, 150);
    }
  }

  /* ── 01. Render Featured Team (Your Team) ──────────────────────────────── */
  function renderFeaturedTeam(featuredTeam) {
    const team = featuredTeam || TEAMS[0];
    const titleEl = document.getElementById('team-featured-title');
    const descEl = document.getElementById('team-featured-desc');
    const memEl = document.getElementById('team-featured-members-count');
    const projEl = document.getElementById('team-featured-projects-count');
    const avatarsEl = document.getElementById('team-featured-avatars');

    if (titleEl) titleEl.innerHTML = `${esc(team.fullName)}<span class="team-featured-dot">.</span>`;
    if (descEl) descEl.textContent = team.fullDesc || team.desc;
    if (memEl) memEl.textContent = `${team.membersCount} members`;
    if (projEl) projEl.textContent = `${team.projectsCount} active projects`;

    if (avatarsEl) {
      avatarsEl.innerHTML = `
        <div class="team-avatar-bubble avatar--pk" title="Priya Kapoor (Design Lead)">PK</div>
        <div class="team-avatar-bubble avatar--ar" title="Alex Rivera (Senior UI Designer)">AR</div>
        <div class="team-avatar-bubble avatar--sk" title="Samir Khan (Brand Designer)">SK</div>
        <div class="team-avatar-bubble avatar--mj" title="Maya Jones (UX Designer)">MJ</div>
        <div class="team-avatar-bubble avatar--more" title="2 additional members">+2</div>
      `;
    }
  }

  /* ── 02. Render Explore Your Teams ─────────────────────────────────────── */
  function renderExploreTeams() {
    const el = document.getElementById('team-explore-list');
    if (!el) return;

    let filtered = [...TEAMS];

    if (activeDeptFilter !== 'all') {
      filtered = filtered.filter(t => t.dept === activeDeptFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.desc.toLowerCase().includes(q) ||
        t.lead.toLowerCase().includes(q) ||
        t.activeProjects.some(p => p.toLowerCase().includes(q))
      );
    }

    if (filtered.length === 0) {
      el.innerHTML = `
        <div class="team-empty-state">
          <p>No teams match your search.</p>
        </div>
      `;
      return;
    }

    el.innerHTML = filtered.map(t => {
      // Pick representative member initials
      let avatarHtml = '';
      if (t.id === 'team-design') {
        avatarHtml = `
          <div class="team-avatar-bubble avatar--pk">PK</div>
          <div class="team-avatar-bubble avatar--ar">AR</div>
          <div class="team-avatar-bubble avatar--sk">SK</div>
          <div class="team-avatar-bubble avatar--more">+2</div>
        `;
      } else if (t.id === 'team-engineering') {
        avatarHtml = `
          <div class="team-avatar-bubble avatar--mj">MJ</div>
          <div class="team-avatar-bubble avatar--rk">RK</div>
          <div class="team-avatar-bubble avatar--av">AV</div>
          <div class="team-avatar-bubble avatar--more">+4</div>
        `;
      } else if (t.id === 'team-content') {
        avatarHtml = `
          <div class="team-avatar-bubble avatar--sk">SK</div>
          <div class="team-avatar-bubble avatar--nv">NV</div>
          <div class="team-avatar-bubble avatar--ar">AR</div>
          <div class="team-avatar-bubble avatar--more">+3</div>
        `;
      } else {
        avatarHtml = `
          <div class="team-avatar-bubble avatar--pk">PK</div>
          <div class="team-avatar-bubble avatar--sm">SM</div>
          <div class="team-avatar-bubble avatar--rk">RK</div>
          <div class="team-avatar-bubble avatar--more">+2</div>
        `;
      }

      return `
        <div class="team-card-row ${t.themeClass}" data-team-id="${t.id}" role="button" tabindex="0">
          <span class="team-card-num">${t.num}</span>
          <div class="team-card-icon-wrap">
            ${t.iconSvg}
          </div>
          <div class="team-card-info">
            <h3 class="team-card-name">${esc(t.name)}</h3>
            <p class="team-card-desc">${esc(t.desc)}</p>
          </div>
          <div class="team-card-avatars">
            ${avatarHtml}
          </div>
          <span class="team-card-arrow">&#8594;</span>
        </div>
      `;
    }).join('');

    // Attach click listeners to team rows
    el.querySelectorAll('.team-card-row').forEach(row => {
      row.addEventListener('click', () => {
        const id = row.getAttribute('data-team-id');
        const team = TEAMS.find(t => t.id === id);
        if (team) {
          window.location.href = `/pages/team/team-detail/team-detail.html?id=${encodeURIComponent(team.id)}&tab=overview`;
        }
      });
    });
  }

  /* ── 03. Render Across Teams ───────────────────────────────────────────── */
  function renderAcrossTeams() {
    const el = document.getElementById('team-across-grid');
    if (!el) return;

    // Show 2 items based on current page
    const start = (acrossTeamsPage % 2) * 2;
    const items = ACROSS_TEAMS.slice(start, start + 2);

    el.innerHTML = items.map(c => `
      <div class="team-collab-card" data-collab-id="${c.id}" role="button" tabindex="0">
        <div class="team-collab-top-row">
          <div class="team-badges-flow">
            <span class="team-pill-badge ${c.fromClass}">${esc(c.fromBadge)}</span>
            <span class="team-flow-arrow">&#8594;</span>
            <span class="team-pill-badge ${c.toClass}">${esc(c.toBadge)}</span>
          </div>
          <span class="team-collab-arrow">&#8594;</span>
        </div>
        <h3 class="team-collab-title">${esc(c.title)}</h3>
        <p class="team-collab-desc">${esc(c.desc)}</p>
        <span class="team-collab-submeta">${esc(c.project)} / ${esc(c.status)} · ${esc(c.time)}</span>
      </div>
    `).join('');

    // Attach click to collaboration cards
    el.querySelectorAll('.team-collab-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-collab-id');
        const collab = ACROSS_TEAMS.find(c => c.id === id);
        if (collab) openCollabModal(collab);
      });
    });

    // Update pagination dots
    const dots = document.querySelectorAll('.team-page-dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === (acrossTeamsPage % 2));
    });
  }

  /* ── 04. Render From Your Teams (Updates) ──────────────────────────────── */
  function renderTeamUpdates() {
    const el = document.getElementById('team-updates-grid');
    if (!el) return;

    el.innerHTML = TEAM_UPDATES.map(u => `
      <div class="team-update-card" data-update-id="${u.id}" role="button" tabindex="0">
        <div class="team-update-avatar ${u.avatarBg}">${esc(u.avatarInitials)}</div>
        <div class="team-update-info">
          <span class="team-update-team-name">${esc(u.teamName)}</span>
          <span class="team-update-text">${esc(u.text)}</span>
          <span class="team-update-time">${esc(u.time)}</span>
        </div>
        <span class="team-update-arrow">&#8594;</span>
      </div>
    `).join('');

    el.querySelectorAll('.team-update-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-update-id');
        const update = TEAM_UPDATES.find(u => u.id === id);
        if (update) {
          openModal(
            `${update.teamName} — Update`,
            `
              <p><strong>${esc(update.author)}</strong> posted:</p>
              <blockquote style="margin:0.5rem 0; padding:0.5rem 0.85rem; border-left:3px solid #C9F34A; background:var(--dash-bg-search, #F3EFE7); font-style:italic;">
                ${esc(update.text)}
              </blockquote>
              <p style="font-size:0.75rem; color:var(--dash-text-muted); margin-top:0.5rem;">Timestamp: ${esc(update.time)}</p>
            `,
            `<button onclick="document.getElementById('team-modal-close-btn').click();" style="padding:0.4rem 0.85rem; background:#111; color:#fff; border:none; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">Dismiss</button>`
          );
        }
      });
    });
  }

  /* ── 05. Render Awaiting Your Response ─────────────────────────────────── */
  function renderAwaitingList() {
    const el = document.getElementById('team-awaiting-list');
    const emptyEl = document.getElementById('team-awaiting-empty');
    if (!el) return;

    if (AWAITING_REQUESTS.length === 0) {
      el.innerHTML = '';
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';

    el.innerHTML = AWAITING_REQUESTS.map(r => `
      <div class="team-awaiting-row" data-req-id="${r.id}" role="button" tabindex="0">
        <div class="team-awaiting-icon-wrap ${r.iconClass}">
          ${r.iconSvg}
        </div>
        <div class="team-awaiting-content">
          <span class="team-awaiting-title">${esc(r.title)}</span>
          <span class="team-awaiting-sub">${esc(r.requestedBy)}</span>
          <span class="team-awaiting-meta">${esc(r.project)} · ${esc(r.time)}</span>
        </div>
        <span class="team-awaiting-arrow">&#8594;</span>
      </div>
    `).join('');

    el.querySelectorAll('.team-awaiting-row').forEach(row => {
      row.addEventListener('click', () => {
        const id = row.getAttribute('data-req-id');
        const req = AWAITING_REQUESTS.find(r => r.id === id);
        if (req) openRequestModal(req);
      });
    });
  }

  /* ── 06. Render Mentions & Requests ────────────────────────────────────── */
  function renderMentionsList() {
    const el = document.getElementById('team-mentions-list');
    const emptyEl = document.getElementById('team-mentions-empty');
    if (!el) return;

    if (MENTIONS.length === 0) {
      el.innerHTML = '';
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';

    el.innerHTML = MENTIONS.map(m => `
      <div class="team-mention-row" data-mention-id="${m.id}" role="button" tabindex="0">
        <div class="team-mention-avatar ${m.avatarBg}">${esc(m.avatarInitials)}</div>
        <div class="team-mention-content">
          <span class="team-mention-name">${esc(m.name)}</span>
          <span class="team-mention-msg">${esc(m.msg)}</span>
          <span class="team-mention-time">${esc(m.time)}</span>
        </div>
        <span class="team-mention-arrow">&#8594;</span>
      </div>
    `).join('');

    el.querySelectorAll('.team-mention-row').forEach(row => {
      row.addEventListener('click', () => {
        const id = row.getAttribute('data-mention-id');
        const mention = MENTIONS.find(m => m.id === id);
        if (mention) openMentionModal(mention);
      });
    });
  }

  /* ── 07. Render People Directory Wrap ──────────────────────────────────── */
  function renderPeopleAvatars() {
    const el = document.getElementById('team-people-avatars');
    if (!el) return;

    const visiblePeople = ALL_PEOPLE.slice(0, 8);
    const extraCount = ALL_PEOPLE.length - 8;

    el.innerHTML = visiblePeople.map(p => `
      <div class="team-people-avatar-circle ${p.bgClass}" title="${esc(p.name)} (${esc(p.role)})" data-user-id="${p.id}">
        ${esc(p.initials)}
      </div>
    `).join('') + (extraCount > 0 ? `
      <div class="team-people-avatar-circle avatar--more" title="${extraCount} more members in directory" id="team-people-more-btn">
        +${extraCount}
      </div>
    ` : '');

    el.querySelectorAll('.team-people-avatar-circle[data-user-id]').forEach(avatar => {
      avatar.addEventListener('click', () => {
        const userId = avatar.getAttribute('data-user-id');
        const person = ALL_PEOPLE.find(p => p.id === userId);
        if (person) openPersonProfileModal(person);
      });
    });

    const moreBtn = document.getElementById('team-people-more-btn');
    if (moreBtn) moreBtn.addEventListener('click', openDirectoryModal);
  }

  /* ── Modal: Team Detail / Space ────────────────────────────────────────── */
  function openTeamModal(team) {
    const teamMembers = ALL_PEOPLE.filter(p => p.dept === team.dept);

    const content = `
      <div style="display:flex; flex-direction:column; gap:0.95rem;">
        <div style="display:flex; align-items:center; gap:0.65rem;">
          <div class="team-card-icon-wrap" style="width:42px; height:42px; font-size:1.1rem;">
            ${team.iconSvg}
          </div>
          <div>
            <h4 style="margin:0; font-size:1.1rem; font-weight:800; color:#111;">${esc(team.fullName)}</h4>
            <span style="font-size:0.75rem; color:var(--dash-text-muted);">${esc(team.desc)}</span>
          </div>
        </div>

        <p style="margin:0; font-size:0.8125rem; line-height:1.55; color:var(--dash-text-body);">
          ${esc(team.fullDesc)}
        </p>

        <div style="background:var(--dash-bg-search, #F3EFE7); padding:0.85rem; border-radius:8px;">
          <span style="font-size:0.65rem; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--dash-text-muted); display:block; margin-bottom:0.4rem;">ACTIVE PROJECTS (${team.projectsCount})</span>
          <div style="display:flex; flex-wrap:wrap; gap:0.4rem;">
            ${team.activeProjects.map(p => `
              <span style="padding:0.25rem 0.55rem; background:#FAF7F1; border:1px solid var(--dash-border); border-radius:4px; font-size:0.72rem; font-weight:600;">
                ${esc(p)}
              </span>
            `).join('')}
          </div>
        </div>

        <div>
          <span style="font-size:0.65rem; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--dash-text-muted); display:block; margin-bottom:0.5rem;">TEAM MEMBERS (${teamMembers.length})</span>
          <div style="display:flex; flex-direction:column; gap:0.45rem;">
            ${teamMembers.map(m => `
              <div style="display:flex; align-items:center; justify-content:space-between; padding:0.45rem 0.65rem; background:#FAF7F1; border:1px solid var(--dash-border); border-radius:6px;">
                <div style="display:flex; align-items:center; gap:0.55rem;">
                  <div class="team-avatar-bubble ${m.bgClass}" style="width:26px; height:26px; font-size:0.58rem; margin:0;">${esc(m.initials)}</div>
                  <div>
                    <strong style="font-size:0.78rem;">${esc(m.name)}</strong>
                    <span style="font-size:0.68rem; color:var(--dash-text-muted); display:block;">${esc(m.role)}</span>
                  </div>
                </div>
                <button onclick="navigator.clipboard.writeText('${m.email}'); window.teamShowToast('Email copied');" style="background:none; border:none; color:var(--dash-text-muted); font-size:0.72rem; cursor:pointer;" title="Copy email">
                  ${esc(m.email)}
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    const footer = `
      <button onclick="document.getElementById('team-modal-close-btn').click();" style="padding:0.45rem 0.85rem; background:none; border:1px solid var(--dash-border); border-radius:6px; font-size:0.75rem; cursor:pointer; color:var(--dash-text-muted);">Close</button>
      <button id="team-space-link-btn" style="padding:0.45rem 0.95rem; background:#111; color:#fff; border:none; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">Open Team Space &#8594;</button>
    `;

    openModal(`${team.fullName} Overview`, content, footer);

    const spaceBtn = document.getElementById('team-space-link-btn');
    if (spaceBtn) {
      spaceBtn.onclick = () => {
        closeModal();
        window.location.href = `/pages/team/team-detail/team-detail.html?id=${encodeURIComponent(team.id)}&tab=overview`;
      };
    }
  }

  /* ── Modal: Cross-Team Collaboration ───────────────────────────────────── */
  function openCollabModal(collab) {
    const content = `
      <div style="display:flex; flex-direction:column; gap:0.85rem;">
        <div style="display:flex; align-items:center; gap:0.4rem;">
          <span class="team-pill-badge ${collab.fromClass}">${esc(collab.fromBadge)}</span>
          <span style="color:var(--dash-text-light);">&#8594;</span>
          <span class="team-pill-badge ${collab.toClass}">${esc(collab.toBadge)}</span>
          <span style="font-size:0.72rem; color:var(--dash-text-muted); margin-left:auto;">${esc(collab.time)}</span>
        </div>

        <h4 style="margin:0; font-size:1rem; font-weight:700; color:#111;">${esc(collab.title)}</h4>
        <p style="margin:0; font-size:0.8125rem; color:var(--dash-text-body); line-height:1.55;">
          ${esc(collab.desc)}
        </p>

        <div style="background:var(--dash-bg-search, #F3EFE7); padding:0.85rem; border-radius:8px; font-size:0.78rem; color:var(--dash-text-body);">
          <strong>Record Details:</strong><br>
          ${esc(collab.details)}
        </div>

        <div style="font-size:0.72rem; color:var(--dash-text-muted);">
          Project: <strong>${esc(collab.project)}</strong> &bull; Status: <strong>${esc(collab.status)}</strong>
        </div>
      </div>
    `;

    const footer = `
      <button onclick="document.getElementById('team-modal-close-btn').click();" style="padding:0.45rem 0.85rem; background:none; border:1px solid var(--dash-border); border-radius:6px; font-size:0.75rem; cursor:pointer; color:var(--dash-text-muted);">Close</button>
      <button id="team-collab-action-btn" style="padding:0.45rem 0.95rem; background:#111; color:#fff; border:none; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">Open Project Discussion &#8594;</button>
    `;

    openModal('Cross-Team Collaboration Record', content, footer);

    const actionBtn = document.getElementById('team-collab-action-btn');
    if (actionBtn) {
      actionBtn.onclick = () => {
        closeModal();
        window.location.href = '/pages/projects/project-detail/project-detail.html?id=featured-01';
      };
    }
  }

  /* ── Modal: Request Response Flow ──────────────────────────────────────── */
  function openRequestModal(req) {
    const content = `
      <div style="display:flex; flex-direction:column; gap:0.85rem;">
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <span style="padding:0.2rem 0.55rem; background:#FAF7F1; border:1px solid var(--dash-border); border-radius:999px; font-size:0.65rem; font-weight:700; letter-spacing:0.08em; text-transform:uppercase;">
            ACTION REQUIRED
          </span>
          <span style="font-size:0.72rem; color:var(--dash-text-muted);">${esc(req.requestedBy)} &bull; ${esc(req.time)}</span>
        </div>

        <h4 style="margin:0; font-size:1.05rem; font-weight:700; color:#111;">${esc(req.title)}</h4>
        <p style="margin:0; font-size:0.8125rem; color:var(--dash-text-body); line-height:1.5;">
          ${esc(req.details)}
        </p>

        <div style="background:var(--dash-bg-search, #F3EFE7); padding:0.75rem; border-radius:8px; font-size:0.75rem; color:var(--dash-text-muted);">
          Associated with Project: <strong>${esc(req.project)}</strong>
        </div>
      </div>
    `;

    const footer = `
      <button onclick="document.getElementById('team-modal-close-btn').click();" style="padding:0.45rem 0.8rem; background:none; border:1px solid var(--dash-border); border-radius:6px; font-size:0.75rem; cursor:pointer; color:var(--dash-text-muted);">Close</button>
      <button id="req-change-btn" style="padding:0.45rem 0.8rem; background:none; border:1px solid #E6DCCF; border-radius:6px; font-size:0.75rem; font-weight:600; color:#7A5520; cursor:pointer;">Request Changes</button>
      <button id="req-approve-btn" style="padding:0.45rem 0.95rem; background:#3A6B2E; color:#fff; border:none; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">&#10003; Approve Request</button>
    `;

    openModal(`Request: ${req.title}`, content, footer);

    const approveBtn = document.getElementById('req-approve-btn');
    if (approveBtn) {
      approveBtn.onclick = () => {
        AWAITING_REQUESTS = AWAITING_REQUESTS.filter(r => r.id !== req.id);
        renderAwaitingList();
        closeModal();
        showToast(`Approved "${req.title}"`);
      };
    }

    const changeBtn = document.getElementById('req-change-btn');
    if (changeBtn) {
      changeBtn.onclick = () => {
        closeModal();
        showToast(`Feedback sent to ${req.requestedBy}`);
      };
    }
  }

  /* ── Modal: Mention Discussion ─────────────────────────────────────────── */
  function openMentionModal(mention) {
    const content = `
      <div style="display:flex; flex-direction:column; gap:0.85rem;">
        <div style="display:flex; align-items:center; gap:0.55rem;">
          <div class="team-mention-avatar ${mention.avatarBg}" style="width:30px; height:30px; font-size:0.65rem;">${esc(mention.avatarInitials)}</div>
          <div>
            <strong style="font-size:0.8125rem;">${esc(mention.name)}</strong>
            <span style="font-size:0.6875rem; color:var(--dash-text-muted); display:block;">${esc(mention.thread)} &bull; ${esc(mention.time)}</span>
          </div>
        </div>

        <blockquote style="margin:0; padding:0.75rem 1rem; border-left:3px solid #C9F34A; background:var(--dash-bg-search, #F3EFE7); font-style:italic; font-size:0.8125rem; color:var(--dash-text-body);">
          ${esc(mention.msg)}
        </blockquote>

        <div>
          <label style="font-size:0.7rem; font-weight:700; color:var(--dash-text-muted); display:block; margin-bottom:0.35rem;">QUICK REPLY</label>
          <input type="text" id="mention-reply-input" placeholder="Type a response..." style="width:100%; padding:0.5rem 0.75rem; border:1px solid var(--dash-border); border-radius:6px; font-size:0.8rem; outline:none; background:#fff;">
        </div>
      </div>
    `;

    const footer = `
      <button onclick="document.getElementById('team-modal-close-btn').click();" style="padding:0.45rem 0.8rem; background:none; border:1px solid var(--dash-border); border-radius:6px; font-size:0.75rem; cursor:pointer; color:var(--dash-text-muted);">Close</button>
      <button id="mention-read-btn" style="padding:0.45rem 0.85rem; background:none; border:1px solid var(--dash-border); border-radius:6px; font-size:0.75rem; font-weight:600; cursor:pointer;">Mark as Read</button>
      <button id="mention-send-btn" style="padding:0.45rem 0.95rem; background:#111; color:#fff; border:none; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">Reply &#8594;</button>
    `;

    openModal('Mention Notification', content, footer);

    const readBtn = document.getElementById('mention-read-btn');
    if (readBtn) {
      readBtn.onclick = () => {
        MENTIONS = MENTIONS.filter(m => m.id !== mention.id);
        renderMentionsList();
        closeModal();
        showToast('Notification marked as read');
      };
    }

    const sendBtn = document.getElementById('mention-send-btn');
    if (sendBtn) {
      sendBtn.onclick = () => {
        const input = document.getElementById('mention-reply-input');
        if (input && input.value.trim()) {
          MENTIONS = MENTIONS.filter(m => m.id !== mention.id);
          renderMentionsList();
          closeModal();
          showToast('Reply sent successfully');
        } else {
          showToast('Please type a reply first');
        }
      };
    }
  }

  /* ── Modal: Person Profile ─────────────────────────────────────────────── */
  function openPersonProfileModal(person) {
    const content = `
      <div style="display:flex; flex-direction:column; gap:0.95rem; align-items:center; text-align:center;">
        <div class="team-people-avatar-circle ${person.bgClass}" style="width:56px; height:56px; font-size:1.15rem; font-weight:800;">
          ${esc(person.initials)}
        </div>
        <div>
          <h4 style="margin:0 0 0.15rem; font-size:1.1rem; font-weight:800; color:#111;">${esc(person.name)}</h4>
          <span style="font-size:0.78rem; color:var(--dash-text-muted);">${esc(person.role)} &bull; ${esc(person.dept.toUpperCase())}</span>
        </div>
        <div style="width:100%; background:var(--dash-bg-search, #F3EFE7); padding:0.85rem; border-radius:8px; font-size:0.78rem; color:var(--dash-text-body); text-align:left;">
          <strong>Email:</strong> ${esc(person.email)}<br>
          <strong>Status:</strong> Active Now &bull; Working on Q4 Deliverables<br>
          <strong>Location:</strong> Acme Co. HQ &bull; Remote
        </div>
      </div>
    `;

    const footer = `
      <button onclick="document.getElementById('team-modal-close-btn').click();" style="padding:0.45rem 0.8rem; background:none; border:1px solid var(--dash-border); border-radius:6px; font-size:0.75rem; cursor:pointer; color:var(--dash-text-muted);">Close</button>
      <button onclick="navigator.clipboard.writeText('${person.email}'); window.teamShowToast('Email copied');" style="padding:0.45rem 0.85rem; background:#111; color:#fff; border:none; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">Copy Email</button>
    `;

    openModal(`Profile: ${person.name}`, content, footer);
  }

  /* ── Modal: Team Directory ─────────────────────────────────────────────── */
  function openDirectoryModal() {
    const content = `
      <div style="display:flex; flex-direction:column; gap:0.85rem;">
        <p style="margin:0; font-size:0.75rem; color:var(--dash-text-muted);">
          Explore all team members and departments across Acme Co.
        </p>

        <div style="max-height:360px; overflow-y:auto; display:flex; flex-direction:column; gap:0.4rem;">
          ${ALL_PEOPLE.map(p => `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:0.5rem 0.75rem; background:#FAF7F1; border:1px solid var(--dash-border); border-radius:8px;">
              <div style="display:flex; align-items:center; gap:0.6rem;">
                <div class="team-people-avatar-circle ${p.bgClass}" style="width:30px; height:30px; font-size:0.65rem;">${esc(p.initials)}</div>
                <div>
                  <strong style="font-size:0.78rem;">${esc(p.name)}</strong>
                  <span style="font-size:0.68rem; color:var(--dash-text-muted); display:block;">${esc(p.role)}</span>
                </div>
              </div>
              <span style="font-size:0.6rem; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; padding:0.2rem 0.45rem; background:#EDEBE4; border-radius:4px;">
                ${esc(p.dept)}
              </span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const footer = `
      <button onclick="document.getElementById('team-modal-close-btn').click();" style="padding:0.45rem 0.95rem; background:#111; color:#fff; border:none; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">Done</button>
    `;

    openModal('Acme Co. Team Directory', content, footer);
  }

  /* ── Modal: Your Collaborations Requests ────────────────────────────────── */
  function openCollabsModal() {
    const content = `
      <div style="display:flex; flex-direction:column; gap:0.85rem;">
        <p style="margin:0; font-size:0.78rem; color:var(--dash-text-muted);">
          Open decisions, feedback threads, and review requests awaiting your input.
        </p>

        <div style="display:flex; flex-direction:column; gap:0.6rem;">
          ${AWAITING_REQUESTS.map(r => `
            <div style="padding:0.75rem; background:#FAF7F1; border:1px solid var(--dash-border); border-radius:8px; display:flex; align-items:center; justify-content:space-between;">
              <div>
                <strong style="font-size:0.8125rem;">${esc(r.title)}</strong>
                <span style="font-size:0.7rem; color:var(--dash-text-muted); display:block;">${esc(r.requestedBy)} &bull; ${esc(r.project)}</span>
              </div>
              <button onclick="window.teamOpenReq('${r.id}');" style="padding:0.35rem 0.75rem; background:#111; color:#fff; border:none; border-radius:4px; font-size:0.72rem; font-weight:600; cursor:pointer;">Review</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const footer = `
      <button onclick="document.getElementById('team-modal-close-btn').click();" style="padding:0.45rem 0.85rem; background:none; border:1px solid var(--dash-border); border-radius:6px; font-size:0.75rem; cursor:pointer; color:var(--dash-text-muted);">Close</button>
    `;

    openModal('Needs Your Input — Collaboration Requests', content, footer);
  }

  // Global helper hooks for modal inline onclicks
  window.teamShowToast = showToast;
  window.teamOpenReq = (id) => {
    closeModal();
    const req = AWAITING_REQUESTS.find(r => r.id === id);
    if (req) openRequestModal(req);
  };

  /* ── Wire Events ───────────────────────────────────────────────────────── */
  function wireEvents() {
    // Search input
    const searchInput = document.getElementById('team-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderExploreTeams();
      });
    }

    // Directory filter dropdown
    const dirBtn = document.getElementById('team-directory-btn');
    const dirDropdown = document.getElementById('team-dir-dropdown');
    if (dirBtn && dirDropdown) {
      dirBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dirDropdown.classList.contains('open');
        dirDropdown.classList.toggle('open', !isOpen);
        dirBtn.setAttribute('aria-expanded', !isOpen);
      });

      document.addEventListener('click', (e) => {
        if (!dirBtn.contains(e.target) && !dirDropdown.contains(e.target)) {
          dirDropdown.classList.remove('open');
          dirBtn.setAttribute('aria-expanded', 'false');
        }
      });

      dirDropdown.querySelectorAll('.team-dir-opt').forEach(opt => {
        opt.addEventListener('click', () => {
          activeDeptFilter = opt.getAttribute('data-dept') || 'all';
          dirDropdown.classList.remove('open');
          dirBtn.setAttribute('aria-expanded', 'false');
          renderExploreTeams();
          showToast(`Filtered by ${opt.textContent}`);
        });
      });
    }

    // Featured team buttons
    const featuredOpenBtn = document.getElementById('team-featured-open-btn');
    const featuredPopout = document.getElementById('team-featured-popout');
    if (featuredOpenBtn) {
      featuredOpenBtn.addEventListener('click', () => {
        window.location.href = '/pages/team/team-detail/team-detail.html?id=team-design&tab=overview';
      });
    }
    if (featuredPopout) {
      featuredPopout.addEventListener('click', () => {
        window.location.href = '/pages/team/team-detail/team-detail.html?id=team-design&tab=overview';
      });
    }

    // View directory buttons
    const viewDirBtn = document.getElementById('team-view-dir-btn');
    if (viewDirBtn) viewDirBtn.addEventListener('click', openDirectoryModal);

    const peopleViewDir = document.getElementById('team-people-view-dir');
    if (peopleViewDir) peopleViewDir.addEventListener('click', openDirectoryModal);

    const browseDirBtn = document.getElementById('team-people-browse-btn');
    if (browseDirBtn) browseDirBtn.addEventListener('click', openDirectoryModal);

    // Across teams buttons & pagination
    const viewAcrossBtn = document.getElementById('team-view-across-btn');
    if (viewAcrossBtn) {
      viewAcrossBtn.addEventListener('click', () => {
        acrossTeamsPage++;
        renderAcrossTeams();
      });
    }

    const prevBtn = document.getElementById('team-page-prev');
    const nextBtn = document.getElementById('team-page-next');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        acrossTeamsPage = (acrossTeamsPage - 1 + 2) % 2;
        renderAcrossTeams();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        acrossTeamsPage = (acrossTeamsPage + 1) % 2;
        renderAcrossTeams();
      });
    }

    // From your teams view all
    const viewUpdatesBtn = document.getElementById('team-view-updates-btn');
    if (viewUpdatesBtn) {
      viewUpdatesBtn.addEventListener('click', () => {
        showToast('Loaded latest team updates feed');
      });
    }

    // Right panel buttons
    const collabsBtn = document.getElementById('team-view-collabs-btn');
    if (collabsBtn) collabsBtn.addEventListener('click', openCollabsModal);

    const awaitingViewAll = document.getElementById('team-awaiting-view-all');
    if (awaitingViewAll) awaitingViewAll.addEventListener('click', openCollabsModal);

    const mentionsViewAll = document.getElementById('team-mentions-view-all');
    if (mentionsViewAll) {
      mentionsViewAll.addEventListener('click', () => {
        showToast('Viewing all mentions & tags');
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
    } catch (e) { /* dev mode fallback */ }

    // 2. Load fragments
    await Promise.all([
      loadFragment('/fragments/sidebar/sidebar.html', 'sidebar-mount'),
      loadFragment('/fragments/navbar/navbar.html', 'navbar-mount')
    ]);

    // 3. Init fragments
    if (window.Sidebar && typeof Sidebar.init === 'function') Sidebar.init(currentUser);
    if (window.Navbar && typeof Navbar.init === 'function') Navbar.init(currentUser);

    // 4. Mark "04 Team" as active in sidebar
    const navTeam = document.getElementById('nav-team');
    if (navTeam) {
      document.querySelectorAll('.nav-item.active').forEach(el => el.classList.remove('active'));
      navTeam.classList.add('active');
      navTeam.href = '/pages/team/team.html';
    }

    // Also update org name if available
    const orgEl = document.getElementById('team-org-name');
    if (orgEl && currentUser && currentUser.activeOrganizationName) {
      orgEl.textContent = currentUser.activeOrganizationName.toUpperCase() + '.';
    }

    // 5. Render all sections
    renderFeaturedTeam(TEAMS[0]);
    renderExploreTeams();
    renderAcrossTeams();
    renderTeamUpdates();
    renderAwaitingList();
    renderMentionsList();
    renderPeopleAvatars();

    // 6. Wire interaction handlers
    wireEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
