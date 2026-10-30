/**
 * Teamden — Individual Team Details Controller (team-detail.js)
 * Path: pages/team/team-detail/team-detail.js
 *
 * Responsibilities:
 * 1. Mounts sidebar and navbar fragments & marks "04 Team" active
 * 2. Reads query parameters: ?id=... and ?tab=... (defaults to id=team-design, tab=overview)
 * 3. Mounts the Team Overview component into #overview-component-mount
 * 4. Manages Tab Navigation (Overview, Work, Knowledge, People)
 * 5. Provides global TeamDetailController.switchTab() API for sub-components
 */

(function (window) {
  'use strict';

  let currentTeamId = 'team-design';
  let currentActiveTab = 'overview';
  let currentUser = null;

  /* ── Team Registry ─────────────────────────────────────────────────────── */
  const TEAMS_REGISTRY = {
    'team-design': {
      id: 'team-design',
      num: '01',
      name: 'DESIGN TEAM',
      title: 'design team.',
      subtitle: 'Creating thoughtful digital experiences, together.',
      count: '4 members',
      members: [
        { id: 'u1', name: 'Priya Kapoor', initials: 'PK', role: 'Design Lead', bgClass: 'avatar--pk', email: 'priya@acme.co' },
        { id: 'u2', name: 'Alex Rivera', initials: 'AR', role: 'Senior Product Designer', bgClass: 'avatar--ar', email: 'alex@acme.co' },
        { id: 'u3', name: 'Samir Khan', initials: 'SK', role: 'Systems & Brand Designer', bgClass: 'avatar--sk', email: 'samir@acme.co' },
        { id: 'u4', name: 'Maya Jones', initials: 'MJ', role: 'Staff Frontend Engineer', bgClass: 'avatar--mj', email: 'maya@acme.co' }
      ]
    },
    'team-engineering': {
      id: 'team-engineering',
      num: '02',
      name: 'ENGINEERING TEAM',
      title: 'engineering team.',
      subtitle: 'Development, systems and scalable delivery.',
      count: '6 members',
      members: [
        { id: 'u4', name: 'Maya Jones', initials: 'MJ', role: 'Staff Frontend Engineer', bgClass: 'avatar--mj', email: 'maya@acme.co' },
        { id: 'u6', name: 'Rohan Kumar', initials: 'RK', role: 'Senior Backend Engineer', bgClass: 'avatar--rk', email: 'rohan@acme.co' },
        { id: 'u8', name: 'Ananya Verma', initials: 'AV', role: 'Cloud Platform Architect', bgClass: 'avatar--av', email: 'ananya@acme.co' },
        { id: 'u7', name: 'Sarah Miller', initials: 'SM', role: 'Director of Operations', bgClass: 'avatar--sm', email: 'sarah@acme.co' }
      ]
    },
    'team-content': {
      id: 'team-content',
      num: '03',
      name: 'CONTENT TEAM',
      title: 'content team.',
      subtitle: 'Communication, writing and shared organizational knowledge.',
      count: '5 members',
      members: [
        { id: 'u5', name: 'Nisha Varma', initials: 'NV', role: 'Content Strategy Lead', bgClass: 'avatar--nv', email: 'nisha@acme.co' },
        { id: 'u3', name: 'Samir Khan', initials: 'SK', role: 'Systems & Brand Designer', bgClass: 'avatar--sk', email: 'samir@acme.co' },
        { id: 'u2', name: 'Alex Rivera', initials: 'AR', role: 'Senior Product Designer', bgClass: 'avatar--ar', email: 'alex@acme.co' },
        { id: 'u1', name: 'Priya Kapoor', initials: 'PK', role: 'Design Lead', bgClass: 'avatar--pk', email: 'priya@acme.co' }
      ]
    },
    'team-operations': {
      id: 'team-operations',
      num: '04',
      name: 'OPERATIONS TEAM',
      title: 'operations team.',
      subtitle: 'Coordination, agile sprint planning and handoffs.',
      count: '4 members',
      members: [
        { id: 'u7', name: 'Sarah Miller', initials: 'SM', role: 'Director of Operations', bgClass: 'avatar--sm', email: 'sarah@acme.co' },
        { id: 'u1', name: 'Priya Kapoor', initials: 'PK', role: 'Design Lead', bgClass: 'avatar--pk', email: 'priya@acme.co' },
        { id: 'u6', name: 'Rohan Kumar', initials: 'RK', role: 'Senior Backend Engineer', bgClass: 'avatar--rk', email: 'rohan@acme.co' },
        { id: 'u8', name: 'Ananya Verma', initials: 'AV', role: 'Cloud Platform Architect', bgClass: 'avatar--av', email: 'ananya@acme.co' }
      ]
    }
  };

  /* ── Fragment Fetcher ──────────────────────────────────────────────────── */
  async function loadFragment(url, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    try {
      const cacheBustUrl = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
      const res = await fetch(cacheBustUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
      container.innerHTML = await res.text();
      return true;
    } catch (err) {
      console.warn(`Failed loading fragment from ${url}:`, err);
      throw err;
    }
  }

  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  /* ── Tab Switcher ──────────────────────────────────────────────────────── */
  const TABS = ['overview', 'work', 'knowledge', 'people'];

  function switchTab(tabName, updateUrl = true) {
    if (!TABS.includes(tabName)) tabName = 'overview';
    currentActiveTab = tabName;

    // Update Tab Buttons
    document.querySelectorAll('.tdet-tab-btn').forEach(btn => {
      const match = btn.getAttribute('data-tab') === tabName;
      btn.classList.toggle('active', match);
      btn.setAttribute('aria-selected', match ? 'true' : 'false');
    });

    // Update Panes
    document.querySelectorAll('.tdet-tab-pane').forEach(pane => {
      pane.classList.remove('active');
    });

    const activePane = document.getElementById(`pane-${tabName}`);
    if (activePane) activePane.classList.add('active');

    // Update Right Rail Panes
    const railOverview = document.getElementById('tdet-rail-overview');
    const railWork = document.getElementById('tdet-rail-work');
    const railKnowledge = document.getElementById('tdet-rail-knowledge');
    const railPeople = document.getElementById('tdet-rail-people');
    if (tabName === 'work') {
      if (railOverview) railOverview.style.display = 'none';
      if (railWork) railWork.style.display = 'flex';
      if (railKnowledge) railKnowledge.style.display = 'none';
      if (railPeople) railPeople.style.display = 'none';
    } else if (tabName === 'knowledge') {
      if (railOverview) railOverview.style.display = 'none';
      if (railWork) railWork.style.display = 'none';
      if (railKnowledge) railKnowledge.style.display = 'flex';
      if (railPeople) railPeople.style.display = 'none';
    } else if (tabName === 'people') {
      if (railOverview) railOverview.style.display = 'none';
      if (railWork) railWork.style.display = 'none';
      if (railKnowledge) railKnowledge.style.display = 'none';
      if (railPeople) railPeople.style.display = 'flex';
    } else {
      if (railOverview) railOverview.style.display = 'flex';
      if (railWork) railWork.style.display = 'none';
      if (railKnowledge) railKnowledge.style.display = 'none';
      if (railPeople) railPeople.style.display = 'none';
    }

    // Update Breadcrumb
    const bcNum = document.getElementById('tdet-bc-num');
    if (bcNum) {
      if (tabName === 'work') {
        bcNum.textContent = 'WORK';
      } else if (tabName === 'knowledge') {
        bcNum.textContent = 'KNOWLEDGE';
      } else if (tabName === 'people') {
        bcNum.textContent = 'PEOPLE';
      } else {
        const team = TEAMS_REGISTRY[currentTeamId] || TEAMS_REGISTRY['team-design'];
        bcNum.textContent = team.num || '01';
      }
    }

    if (updateUrl && window.history.pushState) {
      const newUrl = `${window.location.pathname}?id=${currentTeamId}&tab=${tabName}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
  }

  /* ── Render Header Meta ────────────────────────────────────────────────── */
  function renderHeader(team) {
    const bcName = document.getElementById('tdet-bc-name');
    const bcNum = document.getElementById('tdet-bc-num');
    const titleDisplay = document.getElementById('tdet-title-display');
    const subtitleDisplay = document.getElementById('tdet-subtitle-display');
    const countDisplay = document.getElementById('tdet-header-count');
    const avatarsDisplay = document.getElementById('tdet-header-avatars');

    if (bcName) bcName.textContent = team.name;
    if (bcNum) bcNum.textContent = team.num;
    if (titleDisplay) titleDisplay.innerHTML = `${team.title}`;
    if (subtitleDisplay) subtitleDisplay.textContent = team.subtitle;
    if (countDisplay) countDisplay.textContent = team.count;
    const teamTag = document.getElementById('tdet-header-team-tag');
    if (teamTag) {
      teamTag.textContent = team.id === 'team-design' ? 'Design Team' : team.name;
    }

    if (avatarsDisplay && team.members) {
      avatarsDisplay.innerHTML = team.members.map(m => `
        <div class="tdet-avatar-bubble ${m.bgClass}" title="${m.name} (${m.role})">${m.initials}</div>
      `).join('');
    }
  }

  /* ── Render People Tab Grid ────────────────────────────────────────────── */
  function renderPeopleTabGrid() {
    const grid = document.getElementById('people-tab-grid');
    const team = TEAMS_REGISTRY[currentTeamId] || TEAMS_REGISTRY['team-design'];
    if (!grid || !team || !team.members) return;

    grid.innerHTML = team.members.map(m => `
      <div style="background:#FAF7F1; border:1px solid var(--dash-border); border-radius:8px; padding:1rem; display:flex; align-items:center; gap:0.75rem;">
        <div class="tdet-avatar-bubble ${m.bgClass}" style="width:36px; height:36px; font-size:0.75rem; margin:0;">${m.initials}</div>
        <div style="flex:1; min-width:0;">
          <strong style="font-size:0.8125rem; display:block; color:#111;">${m.name}</strong>
          <span style="font-size:0.7rem; color:var(--dash-text-muted); display:block;">${m.role}</span>
          <span style="font-size:0.68rem; color:var(--dash-text-light);">${m.email}</span>
        </div>
      </div>
    `).join('');
  }

  /* ── Main Init ────────────────────────────────────────────────────────── */
  async function init() {
    // 1. Session check
    try {
      if (window.Auth && typeof Auth.checkSession === 'function') {
        currentUser = await Auth.checkSession();
      }
    } catch (e) { /* dev mode */ }

    // 2. Load sidebar and navbar fragments
    await Promise.all([
      loadFragment('/fragments/sidebar/sidebar.html', 'sidebar-mount'),
      loadFragment('/fragments/navbar/navbar.html', 'navbar-mount')
    ]);

    // 3. Initialize fragments
    if (window.Sidebar && typeof Sidebar.init === 'function') Sidebar.init(currentUser);
    if (window.Navbar && typeof Navbar.init === 'function') Navbar.init(currentUser);

    // 4. Set active navigation item in sidebar
    const navTeam = document.getElementById('nav-team');
    if (navTeam) {
      document.querySelectorAll('.nav-item.active').forEach(el => el.classList.remove('active'));
      navTeam.classList.add('active');
      navTeam.href = '/pages/team/team.html';
    }

    // 5. Read team ID from query string
    const teamParam = getQueryParam('id');
    if (teamParam && TEAMS_REGISTRY[teamParam]) {
      currentTeamId = teamParam;
    }
    const team = TEAMS_REGISTRY[currentTeamId];
    renderHeader(team);

    // 6. Mount Team Overview Component
    try {
      await loadFragment('team-overview/team-overview.html', 'overview-component-mount');
    } catch (e1) {
      try {
        await loadFragment('/pages/team/team-detail/team-overview/team-overview.html', 'overview-component-mount');
      } catch (e2) {
        await loadFragment('/pages/team/team-overview/team-overview.html', 'overview-component-mount');
      }
    }
    const tovRail = document.querySelector('#overview-component-mount .tov-right-rail');
    const mountRailOverview = document.getElementById('tdet-rail-overview');
    if (tovRail && mountRailOverview) {
      mountRailOverview.appendChild(tovRail);
    }
    // 7. Initialize Team Overview logic
    if (window.TeamOverview && typeof TeamOverview.init === 'function') {
      TeamOverview.init(currentTeamId);
    }

    // 8. Mount Team Work Component
    try {
      await loadFragment('team-work/team-work.html', 'work-component-mount');
    } catch (e1) {
      try {
        await loadFragment('/pages/team/team-detail/team-work/team-work.html', 'work-component-mount');
      } catch (e2) {
        await loadFragment('/pages/team/team-work/team-work.html', 'work-component-mount');
      }
    }
    const twRail = document.querySelector('#work-component-mount .tw-right-rail');
    const mountRailWork = document.getElementById('tdet-rail-work');
    if (twRail && mountRailWork) {
      mountRailWork.appendChild(twRail);
    }
    // 9. Initialize Team Work logic
    if (window.TeamWork && typeof TeamWork.init === 'function') {
      TeamWork.init(currentTeamId);
    }

    // 10. Mount Team Knowledge Component
    try {
      await loadFragment('team-knowledge/team-knowledge.html', 'knowledge-component-mount');
    } catch (e1) {
      try {
        await loadFragment('/pages/team/team-detail/team-knowledge/team-knowledge.html', 'knowledge-component-mount');
      } catch (e2) {
        await loadFragment('/pages/team/team-knowledge/team-knowledge.html', 'knowledge-component-mount');
      }
    }
    const tkRail = document.querySelector('#knowledge-component-mount .tk-right-rail');
    const mountRailKnowledge = document.getElementById('tdet-rail-knowledge');
    if (tkRail && mountRailKnowledge) {
      mountRailKnowledge.appendChild(tkRail);
    }
    // 11. Initialize Team Knowledge logic
    if (window.TeamKnowledge && typeof TeamKnowledge.init === 'function') {
      TeamKnowledge.init(currentTeamId);
    }

    // 12. Mount Team People Component
    try {
      await loadFragment('team-people/team-people.html', 'people-component-mount');
    } catch (e1) {
      try {
        await loadFragment('/pages/team/team-detail/team-people/team-people.html', 'people-component-mount');
      } catch (e2) {
        await loadFragment('/pages/team/team-people/team-people.html', 'people-component-mount');
      }
    }
    const tpRail = document.querySelector('#people-component-mount .tp-right-rail');
    const mountRailPeople = document.getElementById('tdet-rail-people');
    if (tpRail && mountRailPeople) {
      mountRailPeople.appendChild(tpRail);
    }
    // 13. Initialize Team People logic
    if (window.TeamPeople && typeof TeamPeople.init === 'function') {
      TeamPeople.init(currentTeamId);
    }

    // 8. Bind tab navigation clicks
    document.querySelectorAll('.tdet-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = btn.getAttribute('data-tab');
        if (tab) switchTab(tab);
      });
    });

    // 9. Initial tab from query param
    const tabParam = getQueryParam('tab');
    switchTab(tabParam || 'overview', false);

    // 10. Team Workspace button link
    const wsBtn = document.getElementById('tdet-workspace-btn');
    if (wsBtn) {
      wsBtn.addEventListener('click', () => {
        window.location.href = '/pages/workspace/team-libraries/team-libraries.html';
      });
    }
  }

  /* ── Expose Controller API ─────────────────────────────────────────────── */
  window.TeamDetailController = {
    switchTab: switchTab,
    getCurrentTeam: () => TEAMS_REGISTRY[currentTeamId] || TEAMS_REGISTRY['team-design']
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
