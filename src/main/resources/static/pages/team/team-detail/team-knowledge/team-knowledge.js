/**
 * Teamden — Team Knowledge Tab Controller (team-knowledge.js)
 * Path: pages/team/team-detail/team-knowledge/team-knowledge.js
 *
 * Exposes window.TeamKnowledge with init(teamId, customData).
 * Responsibilities:
 * 1. Team Playbook rendering & interactive reader viewer
 * 2. Connected Knowledge documents with linked tasks, decisions, and author metadata
 * 3. Decisions & Learnings inspector modal
 * 4. Right Rail:
 *    - Team Knowledge Review queue
 *    - Awaiting Approval diff comparison & approval workflow (v2.1 vs v2.2)
 *    - Knowledge Requests resolution
 *    - Recently Contributed logs
 *    - Team Resources linking to Team Libraries
 */

(function (window) {
  'use strict';

  let currentTeamId = 'team-design';

  /* ── Baseline Seed Data Adhering to Screenshot & Prompt Specifications ─── */
  const SEED_DATA = {
    playbook: {
      id: 'pb-01',
      title: 'Design Principles & Standards',
      desc: 'Our shared foundation for consistent, accessible and thoughtful digital experiences.',
      version: 'Version 2.1',
      approvedDate: '15 Oct 2026',
      sections: [
        {
          heading: '1. Clarity Over Novelty',
          text: 'Every interface element must communicate purpose immediately. Favor recognizable affordances and clear typographic hierarchy over decorative visual flourish.'
        },
        {
          heading: '2. Accessibility by Default',
          text: 'Maintain minimum 4.5:1 text contrast for body text and 3:1 for large display headers. Touch targets must never fall below 44×44px across responsive viewports.'
        },
        {
          heading: '3. Restrained Color Architecture',
          text: 'Use neutral canvas tones (#F8F6F0, #FAF7F1, #111111) as structural grounding. Apply vibrant accent colors (lime #C9F34A) with deliberate intentionality.'
        },
        {
          heading: '4. Continuous Token Synchronization',
          text: 'Design tokens defined in Figma must remain in lockstep with CSS variables. Every spacing, color, and radius token maps directly to shared engineering contracts.'
        }
      ]
    },
    connectedDocs: [
      {
        id: 'doc-review-notes',
        title: 'Design Review Notes',
        sub: 'Website Redesign · Meeting notes',
        tasks: '3 linked tasks',
        decisions: '1 recorded decision',
        updated: 'Updated 2 days ago',
        author: 'Alex Rivera',
        initials: 'AR',
        bgClass: 'avatar--ar',
        colorClass: 'tk-doc-row--blue',
        content: 'Summary of stakeholder feedback on the new modular dashboard architecture. Approved components include header split-layout, unified breadcrumb navigation, and right-rail cards.'
      },
      {
        id: 'doc-comp-specs',
        title: 'Component Specifications',
        sub: 'Website Redesign · Development handoff',
        tasks: 'Linked to Review milestone',
        decisions: 'Engineering handoff',
        updated: 'Updated 5 days ago',
        author: 'Maya Jones',
        initials: 'MJ',
        bgClass: 'avatar--mj',
        colorClass: 'tk-doc-row--green',
        content: 'Detailed specifications for card elevations, border tokens, pill button active states, and avatar stack groupings. Includes CSS custom property mappings for light and dark themes.'
      },
      {
        id: 'doc-brand-guidelines',
        title: 'Brand Guidelines',
        sub: 'Shared reference across 2 projects',
        tasks: '5 linked tasks',
        decisions: 'Used in 2 projects',
        updated: 'Updated 12 days ago',
        author: 'Samir Khan',
        initials: 'SK',
        bgClass: 'avatar--sk',
        colorClass: 'tk-doc-row--white',
        content: 'Core brand identity system covering typography pairings (Inter, Inter Tight, Montserrat), primary and secondary color palettes, icon stroke weights (2px standard), and tone of voice guidelines.'
      }
    ],
    decisions: [
      {
        id: 'dec-unified-nav',
        type: 'APPROVED DECISION',
        badgeClass: 'tk-badge--approved',
        title: 'Unified navigation structure',
        meta: 'Approved for the Website Redesign project · 18 Oct 2026',
        details: 'The team approved moving to a persistent sidebar combined with topbar breadcrumbs across all team workspace and project views, eliminating nested tab redundancies.'
      },
      {
        id: 'learn-nav-layers',
        type: 'DOCUMENTED LEARNING',
        badgeClass: 'tk-badge--learning',
        title: 'Reduce unnecessary navigation layers',
        meta: 'Recorded during the interface review · 12 Oct 2026',
        details: 'Usability testing demonstrated that users found tab navigation within sub-views disorienting when nested more than 2 layers deep. Sub-tabs are now flattened into clean top-level tab pills.'
      }
    ],
    awaitingApproval: {
      id: 'appr-01',
      title: 'Design Guidelines v2.2',
      desc: 'A revised edition is ready for review. Version 2.1 remains approved.',
      currentVer: '2.1',
      pendingVer: '2.2',
      changes: [
        'Added high-contrast dark mode token definitions',
        'Updated mobile drawer swipe threshold from 80px to 60px',
        'Standardized 999px pill border radii for status and filter buttons'
      ],
      pending: true
    },
    knowledgeRequest: {
      id: 'req-01',
      title: 'Component usage clarification for mobile navigation',
      sub: 'Requested by Engineering',
      time: '3 days ago',
      details: 'Engineering requested clarity on whether mobile sidebar drawers should close on background backdrop click or require a dedicated close button tap.'
    },
    contributions: [
      {
        id: 'c1',
        title: 'Design Review Notes',
        sub: 'Updated by Alex R.',
        time: '2 days ago',
        author: 'Alex Rivera',
        initials: 'AR',
        bgClass: 'avatar--ar'
      },
      {
        id: 'c2',
        title: 'Typography guidelines',
        sub: 'Updated by Peter K.',
        time: '5 days ago',
        author: 'Peter Kapoor',
        initials: 'PK',
        bgClass: 'avatar--pk'
      }
    ],
    resources: [
      {
        id: 'res-standards',
        title: 'Design Standards',
        desc: 'Approved references and patterns',
        url: '/pages/workspace/team-libraries/team-libraries.html'
      },
      {
        id: 'res-templates',
        title: 'Project Templates',
        desc: 'Reusable briefs and handoff documents',
        url: '/pages/workspace/team-libraries/team-libraries.html'
      },
      {
        id: 'res-archive',
        title: 'Research Archive',
        desc: 'Previous findings and observations',
        url: '/pages/workspace/team-libraries/team-libraries.html'
      }
    ]
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

  /* ── Helper: Toast Notifications ───────────────────────────────────────── */
  function showToast(message) {
    if (typeof window.teamShowToast === 'function') {
      window.teamShowToast(message);
      return;
    }
    let toast = document.getElementById('tk-toast-notification');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'tk-toast-notification';
      toast.style.cssText = `
        position: fixed; bottom: 2rem; right: 2rem;
        background: #111111; color: #FFFFFF;
        padding: 0.75rem 1.25rem; border-radius: 8px;
        font-size: 0.8125rem; font-weight: 600;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
        z-index: 100000;
        opacity: 0; transform: translateY(12px);
        transition: opacity 200ms ease, transform 200ms ease;
        pointer-events: none;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
    }, 2800);
  }

  /* ── Helper: Interactive Modal Launcher ────────────────────────────────── */
  function openModal(title, bodyHtml, footerHtml = '') {
    let backdrop = document.getElementById('tk-modal-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'tk-modal-backdrop';
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
      <div class="tk-modal-dialog" style="
        background: #FAF7F1;
        border: 1px solid var(--dash-border, #E5E1D9);
        border-radius: 12px;
        width: 100%;
        max-width: 560px;
        box-shadow: 0 16px 40px rgba(0,0,0,0.12);
        display: flex; flex-direction: column;
        overflow: hidden;
        animation: tkModalPop 180ms cubic-bezier(0.16, 1, 0.3, 1);
      ">
        <div style="display:flex; align-items:center; justify-content:space-between; padding:1.25rem 1.5rem; border-bottom:1px solid var(--dash-border, #E5E1D9); background:#F8F6F0;">
          <h3 style="margin:0; font-family:'Inter Tight','Inter',sans-serif; font-size:1.15rem; font-weight:800; color:#111;">${esc(title)}</h3>
          <button id="tk-modal-close-btn" style="background:none; border:none; font-size:1.4rem; line-height:1; color:#77736C; cursor:pointer; padding:0.2rem 0.4rem;">&times;</button>
        </div>
        <div style="padding:1.5rem; overflow-y:auto; max-height:calc(85vh - 130px); font-size:0.875rem; color:#2B2B2B; line-height:1.5;">
          ${bodyHtml}
        </div>
        ${footerHtml ? `<div style="display:flex; align-items:center; justify-content:flex-end; gap:0.65rem; padding:1rem 1.5rem; border-top:1px solid var(--dash-border, #E5E1D9); background:#F8F6F0;">${footerHtml}</div>` : ''}
      </div>
    `;

    document.getElementById('tk-modal-close-btn').addEventListener('click', closeModal);
    backdrop.style.opacity = '1';

    const onKey = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', onKey);
      }
    };
    document.addEventListener('keydown', onKey);
  }

  function closeModal() {
    const backdrop = document.getElementById('tk-modal-backdrop');
    if (backdrop) {
      backdrop.style.opacity = '0';
      setTimeout(() => backdrop.remove(), 160);
    }
  }

  /* ── Modal 1: Playbook Reader ──────────────────────────────────────────── */
  function openPlaybookReader(playbook) {
    const sectionsHtml = playbook.sections.map(s => `
      <div style="margin-bottom:1.25rem;">
        <h4 style="margin:0 0 0.35rem; font-size:0.95rem; font-weight:700; color:#111;">${esc(s.heading)}</h4>
        <p style="margin:0; font-size:0.825rem; color:#444; line-height:1.45;">${esc(s.text)}</p>
      </div>
    `).join('');

    openModal(
      playbook.title,
      `
        <div style="display:flex; flex-direction:column; gap:1rem;">
          <div style="display:flex; align-items:center; justify-content:space-between; background:#ECE8F6; border:1px solid #DCD7EB; padding:0.65rem 1rem; border-radius:8px;">
            <span style="font-size:0.65rem; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#6C5FA0;">APPROVED PLAYBOOK</span>
            <span style="font-size:0.75rem; font-weight:800; color:#111;">${esc(playbook.version)} · ${esc(playbook.approvedDate)}</span>
          </div>
          <p style="font-size:0.875rem; color:#666; margin:0;">${esc(playbook.desc)}</p>
          <hr style="border:none; border-top:1px solid var(--dash-border, #E5E1D9); margin:0.25rem 0;">
          ${sectionsHtml}
        </div>
      `,
      `
        <button onclick="document.getElementById('tk-modal-close-btn').click();" style="padding:0.45rem 1rem; background:none; border:1px solid var(--dash-border); border-radius:6px; font-size:0.78rem; font-weight:600; cursor:pointer;">Close</button>
        <button onclick="document.getElementById('tk-modal-close-btn').click(); window.location.href='/pages/workspace/team-libraries/team-libraries.html';" style="padding:0.45rem 1.15rem; background:#111; color:#fff; border:none; border-radius:6px; font-size:0.78rem; font-weight:700; cursor:pointer;">Open in Library →</button>
      `
    );
  }

  /* ── Modal 2: Connected Document Reader ────────────────────────────────── */
  function openDocumentViewer(doc) {
    openModal(
      doc.title,
      `
        <div style="display:flex; flex-direction:column; gap:1rem;">
          <div style="display:flex; align-items:center; justify-content:space-between; background:#F8F6F0; padding:0.65rem 1rem; border-radius:8px; border:1px solid var(--dash-border);">
            <span style="font-size:0.75rem; color:#666;"><strong>Project:</strong> ${esc(doc.sub)}</span>
            <span style="font-size:0.72rem; color:#888;">${esc(doc.updated)}</span>
          </div>
          <p style="margin:0; font-size:0.875rem; color:#333; line-height:1.5;">${esc(doc.content)}</p>
          <div style="background:#FAF7F1; border:1px solid #E5E1D9; border-radius:8px; padding:0.85rem; font-size:0.75rem; display:flex; flex-direction:column; gap:0.4rem;">
            <div><strong>Linked Connections:</strong> ${esc(doc.tasks)} · ${esc(doc.decisions)}</div>
            <div><strong>Last Editor:</strong> ${esc(doc.author)} (${esc(doc.initials)})</div>
          </div>
        </div>
      `,
      `
        <button onclick="document.getElementById('tk-modal-close-btn').click();" style="padding:0.45rem 1rem; background:none; border:1px solid var(--dash-border); border-radius:6px; font-size:0.78rem; font-weight:600; cursor:pointer;">Close</button>
        <button onclick="document.getElementById('tk-modal-close-btn').click(); window.location.href='/pages/workspace/team-libraries/team-libraries.html';" style="padding:0.45rem 1.15rem; background:#111; color:#fff; border:none; border-radius:6px; font-size:0.78rem; font-weight:700; cursor:pointer;">Open in Editor →</button>
      `
    );
  }

  /* ── Modal 3: Decision & Learning Inspector ────────────────────────────── */
  function openDecisionDetail(dec) {
    const isApproved = dec.type.includes('APPROVED');
    openModal(
      dec.title,
      `
        <div style="display:flex; flex-direction:column; gap:1rem;">
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <span style="font-size:0.65rem; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; padding:0.25rem 0.65rem; border-radius:999px; ${isApproved ? 'background:#EFF1E2; color:#3E5224; border:1px solid #DEE1CC;' : 'background:#FBF3E8; color:#7A5520; border:1px solid #EADCCC;'}">${esc(dec.type)}</span>
            <span style="font-size:0.72rem; color:#77736C;">Recorded 18 Oct 2026</span>
          </div>
          <h4 style="margin:0; font-size:1.1rem; color:#111;">${esc(dec.title)}</h4>
          <p style="margin:0; font-size:0.875rem; color:#333; line-height:1.5;">${esc(dec.details)}</p>
          <div style="background:#F8F6F0; border:1px solid var(--dash-border); padding:0.75rem 1rem; border-radius:8px; font-size:0.75rem; color:#666;">
            <strong>Scope:</strong> ${esc(dec.meta)}
          </div>
        </div>
      `,
      `
        <button onclick="document.getElementById('tk-modal-close-btn').click();" style="padding:0.45rem 1rem; background:#111; color:#fff; border:none; border-radius:6px; font-size:0.78rem; font-weight:700; cursor:pointer;">Done</button>
      `
    );
  }

  /* ── Modal 4: Awaiting Approval (v2.1 vs v2.2) ──────────────────────────── */
  function openApprovalModal(appr) {
    const changesList = appr.changes.map(c => `<li style="margin-bottom:0.4rem;">${esc(c)}</li>`).join('');

    openModal(
      `Document Review: ${appr.title}`,
      `
        <div style="display:flex; flex-direction:column; gap:1rem;">
          <div style="display:flex; align-items:center; justify-content:space-between; background:#FBF3E8; border:1px solid #EADCCC; padding:0.65rem 1rem; border-radius:8px;">
            <span style="font-size:0.65rem; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#7A5520;">PENDING APPROVAL</span>
            <span style="font-size:0.75rem; font-weight:700; color:#111;">v${esc(appr.currentVer)} → v${esc(appr.pendingVer)}</span>
          </div>
          <p style="margin:0; font-size:0.875rem; color:#333;">${esc(appr.desc)}</p>
          <div style="background:#FAF7F1; border:1px solid var(--dash-border); border-radius:8px; padding:1rem;">
            <span style="font-size:0.6875rem; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#77736C; display:block; margin-bottom:0.5rem;">SUMMARY OF CHANGES (DIFF)</span>
            <ul style="margin:0; padding-left:1.25rem; font-size:0.8125rem; color:#222; line-height:1.45;">
              ${changesList}
            </ul>
          </div>
        </div>
      `,
      `
        <button id="tk-btn-request-changes" style="padding:0.45rem 0.85rem; background:none; border:1px solid #EADCCC; border-radius:6px; font-size:0.75rem; font-weight:600; color:#7A5520; cursor:pointer;">Request Changes</button>
        <button id="tk-btn-reject-changes" style="padding:0.45rem 0.85rem; background:none; border:1px solid var(--dash-border); border-radius:6px; font-size:0.75rem; color:#8E8A84; cursor:pointer;">Reject</button>
        <button id="tk-btn-approve-changes" style="padding:0.45rem 1.15rem; background:#3E5224; color:#FFFFFF; border:none; border-radius:6px; font-size:0.78rem; font-weight:700; cursor:pointer;">✓ Approve v2.2</button>
      `
    );

    document.getElementById('tk-btn-approve-changes').addEventListener('click', () => {
      document.getElementById('tk-modal-close-btn').click();
      const card = document.getElementById('tk-awaiting-card');
      if (card) {
        card.innerHTML = `
          <div class="tk-rail-card-head">
            <span class="tk-rail-card-label">AWAITING APPROVAL</span>
            <span class="tk-rail-count-badge" style="color:#3E5224;">00</span>
          </div>
          <div style="padding:0.75rem 0; font-size:0.75rem; color:var(--dash-text-muted);">
            ✓ All document revisions have been approved and published.
          </div>
        `;
      }
      showToast('Design Guidelines v2.2 approved and published!');
    });

    document.getElementById('tk-btn-request-changes').addEventListener('click', () => {
      document.getElementById('tk-modal-close-btn').click();
      showToast('Feedback submitted to document author.');
    });

    document.getElementById('tk-btn-reject-changes').addEventListener('click', () => {
      document.getElementById('tk-modal-close-btn').click();
      showToast('Revision rejected. Version 2.1 remains approved.');
    });
  }

  /* ── Modal 5: Review Queue ─────────────────────────────────────────────── */
  function openReviewQueueModal() {
    openModal(
      'Team Knowledge Review Queue',
      `
        <div style="display:flex; flex-direction:column; gap:0.85rem;">
          <p style="margin:0; font-size:0.8125rem; color:#666;">The following reference documents and playbook guidelines are scheduled for maintenance review:</p>
          <div style="display:flex; flex-direction:column; gap:0.5rem;">
            <div style="display:flex; align-items:center; justify-content:space-between; background:#FAF7F1; border:1px solid #E5E1D9; border-radius:8px; padding:0.75rem 1rem;">
              <div>
                <strong style="font-size:0.8125rem; display:block; color:#111;">Design Review Notes</strong>
                <span style="font-size:0.6875rem; color:#77736C;">Quarterly refresh due in 14 days</span>
              </div>
              <button onclick="window.teamShowToast ? window.teamShowToast('Review marked complete') : alert('Review marked complete');" style="padding:0.35rem 0.65rem; background:#111; color:#fff; border:none; border-radius:4px; font-size:0.7rem; font-weight:700; cursor:pointer;">Mark Reviewed</button>
            </div>
            <div style="display:flex; align-items:center; justify-content:space-between; background:#FAF7F1; border:1px solid #E5E1D9; border-radius:8px; padding:0.75rem 1rem;">
              <div>
                <strong style="font-size:0.8125rem; display:block; color:#111;">Component Standards</strong>
                <span style="font-size:0.6875rem; color:#77736C;">Annual accessibility audit verification</span>
              </div>
              <button onclick="window.teamShowToast ? window.teamShowToast('Audit verified') : alert('Audit verified');" style="padding:0.35rem 0.65rem; background:#111; color:#fff; border:none; border-radius:4px; font-size:0.7rem; font-weight:700; cursor:pointer;">Verify Audit</button>
            </div>
          </div>
        </div>
      `,
      `<button onclick="document.getElementById('tk-modal-close-btn').click();" style="padding:0.45rem 1rem; background:#111; color:#fff; border:none; border-radius:6px; font-size:0.78rem; font-weight:700; cursor:pointer;">Done</button>`
    );
  }

  /* ── Modal 6: Knowledge Request Details ─────────────────────────────────── */
  function openRequestModal(req) {
    openModal(
      'Knowledge Request',
      `
        <div style="display:flex; flex-direction:column; gap:0.85rem;">
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <span style="font-size:0.65rem; font-weight:700; letter-spacing:0.1em; color:#6C5FA0; background:#EDEAF5; padding:0.2rem 0.5rem; border-radius:999px;">OPEN REQUEST</span>
            <span style="font-size:0.7rem; color:#888;">${esc(req.time)}</span>
          </div>
          <h4 style="margin:0; font-size:1.05rem; color:#111;">${esc(req.title)}</h4>
          <p style="margin:0; font-size:0.825rem; color:#444; line-height:1.45;">${esc(req.details)}</p>
          <div style="display:flex; flex-direction:column; gap:0.35rem; margin-top:0.5rem;">
            <label style="font-size:0.75rem; font-weight:700; color:#111;">Response / Clarification:</label>
            <textarea id="tk-request-response-text" rows="3" style="width:100%; border:1px solid var(--dash-border); border-radius:6px; padding:0.5rem; font-family:inherit; font-size:0.8125rem; resize:vertical;" placeholder="Bottom sheets dismiss on backdrop tap, and close button is required for form sheets..."></textarea>
          </div>
        </div>
      `,
      `
        <button onclick="document.getElementById('tk-modal-close-btn').click();" style="padding:0.45rem 0.85rem; background:none; border:1px solid var(--dash-border); border-radius:6px; font-size:0.75rem; cursor:pointer;">Cancel</button>
        <button id="tk-btn-submit-clarification" style="padding:0.45rem 1.15rem; background:#111; color:#fff; border:none; border-radius:6px; font-size:0.78rem; font-weight:700; cursor:pointer;">Send Clarification →</button>
      `
    );

    document.getElementById('tk-btn-submit-clarification').addEventListener('click', () => {
      document.getElementById('tk-modal-close-btn').click();
      showToast('Clarification sent to Engineering Team.');
    });
  }

  /* ── Wire Interactions & Event Handlers ────────────────────────────────── */
  function wireInteractions(data) {
    // 1. Open Playbook
    const openPlaybookBtn = document.getElementById('tk-open-playbook-btn');
    if (openPlaybookBtn) {
      openPlaybookBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openPlaybookReader(data.playbook);
      });
    }

    const playbookCard = document.getElementById('tk-playbook-card');
    if (playbookCard) {
      playbookCard.addEventListener('click', () => {
        openPlaybookReader(data.playbook);
      });
    }

    // 2. Connected Documents Clicks
    document.querySelectorAll('.tk-doc-row').forEach(row => {
      row.addEventListener('click', () => {
        const docId = row.getAttribute('data-doc-id');
        const doc = data.connectedDocs.find(d => d.id === docId) || data.connectedDocs[0];
        openDocumentViewer(doc);
      });
    });

    const viewAllConnectedBtn = document.getElementById('tk-view-all-connected');
    if (viewAllConnectedBtn) {
      viewAllConnectedBtn.addEventListener('click', () => {
        window.location.href = '/pages/workspace/team-libraries/team-libraries.html';
      });
    }

    // 3. Decisions & Learnings Clicks
    document.querySelectorAll('.tk-decision-item').forEach(item => {
      item.addEventListener('click', () => {
        const decId = item.getAttribute('data-decision-id');
        const dec = data.decisions.find(d => d.id === decId) || data.decisions[0];
        openDecisionDetail(dec);
      });
    });

    const viewAllDecisionsBtn = document.getElementById('tk-view-all-decisions');
    if (viewAllDecisionsBtn) {
      viewAllDecisionsBtn.addEventListener('click', () => {
        if (window.TeamDetailController && typeof window.TeamDetailController.switchTab === 'function') {
          window.TeamDetailController.switchTab('overview');
        } else {
          showToast('Displaying team decisions register');
        }
      });
    }

    // 4. Right Rail: Review Queue
    const openReviewQueueBtn = document.getElementById('tk-open-review-queue-btn');
    if (openReviewQueueBtn) {
      openReviewQueueBtn.addEventListener('click', () => {
        openReviewQueueModal();
      });
    }

    // 5. Right Rail: Awaiting Approval
    const reviewChangesBtn = document.getElementById('tk-review-changes-btn');
    if (reviewChangesBtn) {
      reviewChangesBtn.addEventListener('click', () => {
        openApprovalModal(data.awaitingApproval);
      });
    }

    const awaitingCard = document.getElementById('tk-awaiting-card');
    if (awaitingCard) {
      awaitingCard.addEventListener('click', (e) => {
        if (e.target.closest('#tk-review-changes-btn')) return;
        openApprovalModal(data.awaitingApproval);
      });
    }

    // 6. Right Rail: Knowledge Requests
    const requestItem = document.getElementById('tk-request-item-01');
    if (requestItem) {
      requestItem.addEventListener('click', () => {
        openRequestModal(data.knowledgeRequest);
      });
    }

    const requestsViewAll = document.getElementById('tk-requests-view-all');
    if (requestsViewAll) {
      requestsViewAll.addEventListener('click', () => {
        openRequestModal(data.knowledgeRequest);
      });
    }

    // 7. Right Rail: Recently Contributed
    document.querySelectorAll('.tk-contributed-item').forEach(item => {
      item.addEventListener('click', () => {
        const contribId = item.getAttribute('data-contrib-id');
        const contrib = data.contributions.find(c => c.id === contribId);
        if (contrib) {
          const doc = data.connectedDocs.find(d => d.title.toLowerCase() === contrib.title.toLowerCase()) || data.connectedDocs[0];
          openDocumentViewer(doc);
        }
      });
    });

    const contributedViewAll = document.getElementById('tk-contributed-view-all');
    if (contributedViewAll) {
      contributedViewAll.addEventListener('click', () => {
        window.location.href = '/pages/workspace/team-libraries/team-libraries.html';
      });
    }

    // 8. Right Rail: Team Resources
    document.querySelectorAll('.tk-resource-row').forEach(row => {
      row.addEventListener('click', () => {
        window.location.href = '/pages/workspace/team-libraries/team-libraries.html';
      });
    });

    const resourcesOpenLib = document.getElementById('tk-resources-open-library');
    if (resourcesOpenLib) {
      resourcesOpenLib.addEventListener('click', () => {
        window.location.href = '/pages/workspace/team-libraries/team-libraries.html';
      });
    }
  }

  /* ── Public API ────────────────────────────────────────────────────────── */
  const TeamKnowledge = {
    init(teamId, customData) {
      const data = customData || SEED_DATA;
      currentTeamId = teamId || 'team-design';
      wireInteractions(data);
    }
  };

  window.TeamKnowledge = TeamKnowledge;

  // Auto-init if already mounted
  if (document.getElementById('team-knowledge-root')) {
    TeamKnowledge.init();
  }

})(window);
