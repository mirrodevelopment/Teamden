/**
 * Teamden — Team Overview Tab Component Controller (team-overview.js)
 * Path: pages/team/team-overview/team-overview.js
 *
 * Exposes window.TeamOverview with init(teamId, teamData).
 * Handles:
 * 1. Data rendering for Team Focus, Work in Motion, Active Projects, Team Library, and Team Updates
 * 2. Right Rail: Next Delivery milestone, Awaiting Review, Team Members, Upcoming Handoff, Recent Decisions
 * 3. Interactive Modals for Milestones, Work Reviews, Documents, Handoffs, and Settings
 * 4. Tab switching triggers to parent TeamDetailController (Work, Knowledge, People)
 */

(function (window) {
  'use strict';

  let currentTeam = null;

  /* ── Default Seed Data for Overview ────────────────────────────────────── */
  const SEED_DATA = {
    focus: {
      title: 'Website Redesign',
      desc: 'Finalise the interface system and prepare approved designs for development.',
      nextDelivery: 'Design handoff · 30 Oct',
      workUrl: '/pages/projects/project-detail/project-detail.html?id=featured-01&tab=tasks'
    },
    workInMotion: {
      inProgress: { count: '04', title: 'Interface system', desc: 'Being developed across components and layouts.', owner: 'OWNER / MJ' },
      inReview: { count: '02', title: 'Mobile navigation', desc: 'Awaiting feedback from stakeholders.', reviewer: 'REVIEWER / AR' },
      readyHandoff: { count: '01', title: 'Design tokens', desc: 'Ready for Engineering implementation.', handoff: 'HANDOFF / ENGINEERING' }
    },
    activeProjects: [
      { id: 'website-redesign', num: '01', title: 'Website Redesign', meta: 'Design review / Next delivery 30 Oct', icon: 'purple', url: '/pages/projects/project-detail/project-detail.html?id=featured-01' },
      { id: 'client-application', num: '02', title: 'Client Application', meta: 'Interface refinement / In progress', icon: 'blue', url: '/pages/projects/project-detail/project-detail.html?id=featured-01' },
      { id: 'brand-development', num: '03', title: 'Brand Development', meta: 'Identity system / Awaiting approval', icon: 'green', url: '/pages/projects/project-detail/project-detail.html?id=featured-01' }
    ],
    teamLibrary: [
      { id: 'design-guidelines', title: 'Design Guidelines', meta: 'Approved reference', icon: 'purple', url: '/pages/workspace/team-libraries/team-libraries.html' },
      { id: 'review-notes', title: 'Design Review Notes', meta: '3 linked tasks', icon: 'blue', url: '/pages/workspace/team-libraries/team-libraries.html' },
      { id: 'component-standards', title: 'Component Standards', meta: 'Latest version / Shared', icon: 'green', url: '/pages/workspace/team-libraries/team-libraries.html' }
    ],
    updates: [
      { id: 'u1', author: 'Alex R.', initials: 'AR', avatarBg: 'avatar--ar', title: 'Design guidelines ready for review', desc: 'The updated guidelines are ready for feedback.', meta: 'Alex R. · 2 hrs ago · Linked to Design Guidelines' },
      { id: 'u2', author: 'Maria J.', initials: 'MJ', avatarBg: 'avatar--mj', title: 'Staging environment is ready', desc: 'The latest build is available for internal testing.', meta: 'Maria J. · 4 hrs ago · Linked to Client Application' }
    ],
    coordination: {
      title: 'Next delivery.',
      sub: 'Website Redesign · Design handoff',
      due: 'Due 30 Oct 2026',
      milestoneTitle: 'Design System & Component Handoff',
      milestoneDesc: 'Delivery of all Figma tokens, SVG icons, and responsive page templates to Engineering.'
    },
    awaitingReview: {
      title: 'Mobile navigation',
      desc: 'Feedback required from Design Lead.',
      project: 'Website Redesign',
      author: 'Samir Khan'
    },
    upcomingHandoff: {
      title: 'Design tokens',
      sub: 'Ready for Engineering',
      meta: 'Handoff to Engineering Team · 3 days',
      details: 'JSON tokens exported for colors, spacing, typography, and shadow elevations.'
    },
    recentDecision: {
      title: 'Homepage design approved',
      desc: 'Client design approved for development.',
      meta: 'Website Redesign · 1 day ago'
    }
  };

  /* ── Helper: Escape HTML ───────────────────────────────────────────────── */
  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ── Helper: Modal Launcher ────────────────────────────────────────────── */
  function openModal(title, bodyHtml, footerHtml = '') {
    let backdrop = document.getElementById('tov-modal-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'tov-modal-backdrop';
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
      <div style="
        background: var(--dash-bg-card, #FAF7F1);
        border: 1px solid var(--dash-border, #E5E1D9);
        border-radius: 12px;
        width: 100%;
        max-width: 520px;
        box-shadow: 0 12px 36px rgba(0,0,0,0.2);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      ">
        <div style="display:flex; align-items:center; justify-content:space-between; padding: 1rem 1.25rem; border-bottom: 1px solid var(--dash-border, #E5E1D9);">
          <h3 style="margin:0; font-size:0.95rem; font-weight:700; color:var(--dash-text-primary, #111);">${esc(title)}</h3>
          <button id="tov-modal-close-btn" style="background:none; border:none; font-size:1.35rem; cursor:pointer; color:var(--dash-text-muted, #77736C); padding:0.2rem 0.4rem; line-height:1;">&times;</button>
        </div>
        <div style="padding: 1.25rem; font-size:0.8125rem; color:var(--dash-text-body, #2B2B2B); max-height:70vh; overflow-y:auto; line-height:1.55;">
          ${bodyHtml}
        </div>
        ${footerHtml ? `<div style="padding: 0.75rem 1.25rem; border-top: 1px solid var(--dash-border, #E5E1D9); background: var(--dash-bg-search, #F3EFE7); display:flex; justify-content:flex-end; gap:0.5rem;">${footerHtml}</div>` : ''}
      </div>
    `;

    document.getElementById('tov-modal-close-btn').onclick = closeModal;
    backdrop.style.opacity = '1';
  }

  function closeModal() {
    const backdrop = document.getElementById('tov-modal-backdrop');
    if (backdrop) {
      backdrop.style.opacity = '0';
      setTimeout(() => {
        if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      }, 150);
    }
  }

  function toast(msg) {
    if (typeof window.teamShowToast === 'function') {
      window.teamShowToast(msg);
    } else {
      console.log('Toast:', msg);
    }
  }

  /* ── Interaction Handlers ──────────────────────────────────────────────── */
  function wireInteractions(data) {
    // 1. Team Focus: Open work
    const focusBtn = document.getElementById('tov-focus-open-btn');
    if (focusBtn) {
      focusBtn.addEventListener('click', () => {
        if (typeof window.TeamDetailController !== 'undefined' && window.TeamDetailController.switchTab) {
          window.TeamDetailController.switchTab('work');
        } else {
          window.location.href = data.focus.workUrl || '/pages/projects/project-detail/project-detail.html?id=featured-01&tab=tasks';
        }
      });
    }

    // 2. View all work
    const viewAllWorkBtn = document.getElementById('tov-view-all-work');
    if (viewAllWorkBtn) {
      viewAllWorkBtn.addEventListener('click', () => {
        if (typeof window.TeamDetailController !== 'undefined' && window.TeamDetailController.switchTab) {
          window.TeamDetailController.switchTab('work');
        } else {
          toast('Switched to Work view');
        }
      });
    }

    // 3. Work in Motion cards
    const cardProgress = document.getElementById('motion-card-progress');
    if (cardProgress) {
      cardProgress.addEventListener('click', () => {
        openModal(
          'Work in Progress — Interface System',
          `
            <div style="display:flex; flex-direction:column; gap:0.75rem;">
              <span style="font-size:0.65rem; font-weight:700; letter-spacing:0.1em; color:#365369; text-transform:uppercase; background:#E5EDF7; padding:0.2rem 0.5rem; border-radius:999px; width:fit-content;">4 ACTIVE TASKS</span>
              <p>Components and layout templates currently being coded in sprint branch <code>feat/v2-components</code>.</p>
              <div style="background:var(--dash-bg-search, #F3EFE7); padding:0.75rem; border-radius:6px; font-size:0.75rem;">
                <strong>Assigned to:</strong> Maya Jones (Lead Frontend)<br>
                <strong>Target completion:</strong> 02 Nov 2026
              </div>
            </div>
          `,
          `<button onclick="document.getElementById('tov-modal-close-btn').click();" style="padding:0.4rem 0.85rem; background:#111; color:#fff; border:none; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">Close</button>`
        );
      });
    }

    const cardReview = document.getElementById('motion-card-review');
    if (cardReview) {
      cardReview.addEventListener('click', () => {
        openReviewModal(data.awaitingReview);
      });
    }

    const cardHandoff = document.getElementById('motion-card-handoff');
    if (cardHandoff) {
      cardHandoff.addEventListener('click', () => {
        openHandoffModal(data.upcomingHandoff);
      });
    }

    // 4. Active Projects click
    document.querySelectorAll('#tov-projects-list .tov-list-row').forEach(row => {
      row.addEventListener('click', () => {
        const pId = row.getAttribute('data-project-id');
        window.location.href = `/pages/projects/project-detail/project-detail.html?id=featured-01`;
      });
    });

    // 5. Open library action & documents click
    const openLibBtn = document.getElementById('tov-open-library-btn');
    if (openLibBtn) {
      openLibBtn.addEventListener('click', () => {
        if (typeof window.TeamDetailController !== 'undefined' && window.TeamDetailController.switchTab) {
          window.TeamDetailController.switchTab('knowledge');
        } else {
          window.location.href = '/pages/workspace/team-libraries/team-libraries.html';
        }
      });
    }

    document.querySelectorAll('#tov-library-list .tov-list-row').forEach(row => {
      row.addEventListener('click', () => {
        window.location.href = '/pages/workspace/team-libraries/team-libraries.html';
      });
    });

    // 6. View all updates
    const viewAllUpdatesBtn = document.getElementById('tov-view-all-updates');
    if (viewAllUpdatesBtn) {
      viewAllUpdatesBtn.addEventListener('click', () => {
        toast('Loaded all team updates feed');
      });
    }

    // 7. Right Rail: View milestone
    const viewMilestoneBtn = document.getElementById('tov-view-milestone-btn');
    if (viewMilestoneBtn) {
      viewMilestoneBtn.addEventListener('click', () => {
        openModal(
          'Milestone: Design Handoff',
          `
            <div style="display:flex; flex-direction:column; gap:0.75rem;">
              <span style="font-size:0.65rem; font-weight:700; letter-spacing:0.1em; color:#111; text-transform:uppercase; background:#FAF7F1; border:1px solid var(--dash-border); padding:0.2rem 0.5rem; border-radius:999px; width:fit-content;">MILESTONE DUE 30 OCT</span>
              <h4 style="margin:0; font-size:1.05rem;">${esc(data.coordination.milestoneTitle)}</h4>
              <p style="margin:0; color:var(--dash-text-body);">${esc(data.coordination.milestoneDesc)}</p>
              <div style="background:var(--dash-bg-search, #F3EFE7); padding:0.75rem; border-radius:6px; font-size:0.75rem;">
                <strong>Key Deliverables:</strong><br>
                • Master Figma tokens synchronized with Git repository<br>
                • 24 mobile &amp; desktop page templates<br>
                • Accessibility test sign-off
              </div>
            </div>
          `,
          `<button onclick="document.getElementById('tov-modal-close-btn').click();" style="padding:0.4rem 0.85rem; background:#111; color:#fff; border:none; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">Dismiss</button>`
        );
      });
    }

    // 8. Right Rail: Review work
    const reviewWorkBtn = document.getElementById('tov-review-work-btn');
    if (reviewWorkBtn) {
      reviewWorkBtn.addEventListener('click', () => {
        openReviewModal(data.awaitingReview);
      });
    }

    // 9. Right Rail: Team members view all & settings
    const membersViewAll = document.getElementById('tov-members-view-all');
    if (membersViewAll) {
      membersViewAll.addEventListener('click', () => {
        if (typeof window.TeamDetailController !== 'undefined' && window.TeamDetailController.switchTab) {
          window.TeamDetailController.switchTab('people');
        } else {
          toast('Switched to Team Members directory');
        }
      });
    }

    const manageSettingsBtn = document.getElementById('tov-manage-settings-btn');
    if (manageSettingsBtn) {
      manageSettingsBtn.addEventListener('click', () => {
        openModal(
          'Team Settings — Design Team',
          `
            <div style="display:flex; flex-direction:column; gap:0.75rem;">
              <div>
                <label style="font-size:0.7rem; font-weight:700; color:var(--dash-text-muted); display:block; margin-bottom:0.25rem;">TEAM NAME</label>
                <input type="text" value="Design Team" style="width:100%; padding:0.45rem 0.65rem; border:1px solid var(--dash-border); border-radius:6px; background:#fff; font-size:0.8rem;">
              </div>
              <div>
                <label style="font-size:0.7rem; font-weight:700; color:var(--dash-text-muted); display:block; margin-bottom:0.25rem;">DESCRIPTION</label>
                <textarea style="width:100%; padding:0.45rem 0.65rem; border:1px solid var(--dash-border); border-radius:6px; background:#fff; font-size:0.8rem; height:60px;">Creating thoughtful digital experiences, together.</textarea>
              </div>
              <div>
                <label style="font-size:0.7rem; font-weight:700; color:var(--dash-text-muted); display:block; margin-bottom:0.25rem;">LEAD</label>
                <input type="text" value="Priya Kapoor (priya@acme.co)" style="width:100%; padding:0.45rem 0.65rem; border:1px solid var(--dash-border); border-radius:6px; background:#fff; font-size:0.8rem;">
              </div>
            </div>
          `,
          `
            <button onclick="document.getElementById('tov-modal-close-btn').click();" style="padding:0.4rem 0.8rem; background:none; border:1px solid var(--dash-border); border-radius:6px; font-size:0.75rem; cursor:pointer; color:var(--dash-text-muted);">Cancel</button>
            <button onclick="document.getElementById('tov-modal-close-btn').click(); window.teamShowToast('Team settings updated');" style="padding:0.4rem 0.85rem; background:#111; color:#fff; border:none; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">Save</button>
          `
        );
      });
    }

    // 10. Right Rail: View handoff
    const viewHandoffBtn = document.getElementById('tov-view-handoff-btn');
    if (viewHandoffBtn) {
      viewHandoffBtn.addEventListener('click', () => {
        openHandoffModal(data.upcomingHandoff);
      });
    }

    // 11. Right Rail: Recent decisions
    const decRow = document.getElementById('tov-decision-row');
    const decViewAll = document.getElementById('tov-decisions-view-all');
    const openDecModal = () => {
      openModal(
        'Recent Decision: Homepage Design Approved',
        `
          <div style="display:flex; flex-direction:column; gap:0.75rem;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="padding:0.2rem 0.55rem; background:#EFF1E2; border:1px solid #DEE1CC; color:#3E5224; border-radius:999px; font-size:0.65rem; font-weight:700;">APPROVED</span>
              <span style="font-size:0.72rem; color:var(--dash-text-muted);">Website Redesign · 1 day ago</span>
            </div>
            <p style="margin:0; font-size:0.8125rem;">Stakeholders and Product Leads approved the final responsive navigation and color palette. Ready for frontend engineering sprint planning.</p>
          </div>
        `,
        `<button onclick="document.getElementById('tov-modal-close-btn').click();" style="padding:0.4rem 0.85rem; background:#111; color:#fff; border:none; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">Close</button>`
      );
    };
    if (decRow) decRow.addEventListener('click', openDecModal);
    if (decViewAll) decViewAll.addEventListener('click', openDecModal);
  }

  /* ── Modals for Reviews and Handoffs ───────────────────────────────────── */
  function openReviewModal(rev) {
    openModal(
      `Review: ${rev.title}`,
      `
        <div style="display:flex; flex-direction:column; gap:0.75rem;">
          <span style="font-size:0.65rem; font-weight:700; letter-spacing:0.1em; color:#7A5520; text-transform:uppercase; background:#FBF3E8; border:1px solid #EADCCC; padding:0.2rem 0.5rem; border-radius:999px; width:fit-content;">REVIEW REQUIRED</span>
          <h4 style="margin:0; font-size:1.05rem;">${esc(rev.title)}</h4>
          <p style="margin:0; color:var(--dash-text-body);">${esc(rev.desc)}</p>
          <div style="background:var(--dash-bg-search, #F3EFE7); padding:0.75rem; border-radius:6px; font-size:0.75rem;">
            <strong>Project:</strong> ${esc(rev.project)}<br>
            <strong>Author:</strong> ${esc(rev.author || 'Samir Khan')}
          </div>
        </div>
      `,
      `
        <button onclick="document.getElementById('tov-modal-close-btn').click();" style="padding:0.4rem 0.8rem; background:none; border:1px solid var(--dash-border); border-radius:6px; font-size:0.75rem; cursor:pointer; color:var(--dash-text-muted);">Cancel</button>
        <button onclick="document.getElementById('tov-modal-close-btn').click(); window.teamShowToast('Feedback submitted');" style="padding:0.4rem 0.8rem; background:none; border:1px solid #EADCCC; border-radius:6px; font-size:0.75rem; font-weight:600; color:#7A5520; cursor:pointer;">Request Changes</button>
        <button onclick="document.getElementById('tov-modal-close-btn').click(); window.teamShowToast('Design reviewed and approved');" style="padding:0.4rem 0.85rem; background:#3A6B2E; color:#fff; border:none; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">✓ Approve</button>
      `
    );
  }

  function openHandoffModal(handoff) {
    openModal(
      `Upcoming Handoff: ${handoff.title}`,
      `
        <div style="display:flex; flex-direction:column; gap:0.75rem;">
          <span style="font-size:0.65rem; font-weight:700; letter-spacing:0.1em; color:#3E5224; text-transform:uppercase; background:#EFF1E2; border:1px solid #DEE1CC; padding:0.2rem 0.5rem; border-radius:999px; width:fit-content;">HANDOFF IN 3 DAYS</span>
          <h4 style="margin:0; font-size:1.05rem;">${esc(handoff.title)}</h4>
          <p style="margin:0; color:var(--dash-text-body);">${esc(handoff.details || handoff.sub)}</p>
          <div style="background:var(--dash-bg-search, #F3EFE7); padding:0.75rem; border-radius:6px; font-size:0.75rem;">
            <strong>Recipient:</strong> Engineering Team<br>
            <strong>Tokens:</strong> CSS Custom Properties &amp; Style Dictionary JSON
          </div>
        </div>
      `,
      `<button onclick="document.getElementById('tov-modal-close-btn').click();" style="padding:0.4rem 0.85rem; background:#111; color:#fff; border:none; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">Done</button>`
    );
  }

  /* ── Public API ────────────────────────────────────────────────────────── */
  const TeamOverview = {
    init(teamId, customData) {
      const data = customData || SEED_DATA;
      currentTeam = teamId || 'team-design';
      wireInteractions(data);
    }
  };

  window.TeamOverview = TeamOverview;

  // Auto-init if mounted in DOM
  if (document.getElementById('team-overview-root')) {
    TeamOverview.init();
  }
})(window);
