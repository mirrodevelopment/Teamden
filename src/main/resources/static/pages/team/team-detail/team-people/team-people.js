/**
 * Teamden — Team People Tab Controller (team-people.js)
 * Path: pages/team/team-detail/team-people/team-people.js
 *
 * Updated controller matching the latest Brick Team People design:
 * 1. The People (Meet the team.) with search & role filter (Area of Responsibility + Current Focus)
 * 2. Responsibility Map (Who does what.) with ownership reassignment
 * 3. Working Together (Collaboration.)
 * 4. Team Access (Permissions & invitations.)
 * 5. Right Rail (5 Cards):
 *    - Team Connections (Browse team members)
 *    - Needs an Owner (Assign reviewer)
 *    - Team Playbook (Open playbook)
 *    - Quick Links (Design guidelines, Component library, Project templates)
 *    - Team Standards (View standards)
 */

(function (window) {
  'use strict';

  let currentTeamId = 'team-design';

  /* ── Baseline People Model ─────────────────────────────────────────── */
  const DEFAULT_EMPTY_PEOPLE = {
    members: [],
    responsibilities: [],
    collaborations: [],
    unassignedWork: null,
    playbook: { title: 'Team Playbook', version: 'Version 1.0', status: 'Draft', principles: [] },
    standards: { title: 'Team Standards', summary: 'Standards pending definition.', items: [] }
  };

  /* ── Feedback Notification ─────────────────────────────────────────────── */
  function showToast(message) {
    const existing = document.querySelector('.tp-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'tp-toast';
    toast.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C9F34A" stroke-width="2.5">
        <path d="M20 6L9 17l-5-5"></path>
      </svg>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }

  /* ── Filter Engine ─────────────────────────────────────────────────────── */
  function filterMembers(data) {
    const searchInput = document.getElementById('tp-member-search');
    const roleSelect = document.getElementById('tp-role-filter');
    const clearBtn = document.getElementById('tp-search-clear');
    const noResultsMsg = document.getElementById('tp-no-members-msg');

    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const selectedRole = roleSelect ? roleSelect.value : 'all';

    if (clearBtn) {
      clearBtn.classList.toggle('tp-hidden', query.length === 0);
    }

    const cards = document.querySelectorAll('#tp-members-grid .tp-member-card');
    let visibleCount = 0;

    cards.forEach(card => {
      const memberId = card.getAttribute('data-member-id');
      const member = data.members.find(m => m.id === memberId);
      if (!member) return;

      const roleMatch = selectedRole === 'all' || member.role.toLowerCase() === selectedRole.toLowerCase();

      const searchMatch = !query ||
        member.name.toLowerCase().includes(query) ||
        member.fullName.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query) ||
        member.responsibility.toLowerCase().includes(query) ||
        member.focus.toLowerCase().includes(query);

      const isVisible = roleMatch && searchMatch;
      card.classList.toggle('tp-hidden', !isVisible);
      if (isVisible) {
        visibleCount++;
      }
    });

    if (noResultsMsg) {
      noResultsMsg.classList.toggle('tp-hidden', visibleCount > 0);
    }
  }

  /* ── Modal Manager ─────────────────────────────────────────────────────── */
  function createModal(title, bodyHtml, footerHtml = '') {
    const overlay = document.createElement('div');
    overlay.className = 'tp-modal-overlay';
    overlay.innerHTML = `
      <div class="tp-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="tp-modal-title">
        <div class="tp-modal-header">
          <h3 id="tp-modal-title">${title}</h3>
          <button class="tp-modal-close-btn" aria-label="Close dialog">&times;</button>
        </div>
        <div class="tp-modal-body">
          ${bodyHtml}
        </div>
        ${footerHtml ? `<div class="tp-modal-footer">${footerHtml}</div>` : ''}
      </div>
    `;

    document.body.appendChild(overlay);

    function close() {
      overlay.style.transition = 'opacity 0.15s ease';
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 160);
    }

    overlay.querySelector('.tp-modal-close-btn').addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    const closeBtn = overlay.querySelector('.tp-btn-close-modal');
    if (closeBtn) closeBtn.addEventListener('click', close);

    return { overlay, close };
  }

  /* ── 1. Member Profile Modal ───────────────────────────────────────────── */
  function openMemberProfile(member) {
    const bodyHtml = `
      <div style="display:flex; align-items:center; gap:1rem; padding-bottom:1rem; border-bottom:1px solid #E5E1D9;">
        <div class="tp-avatar-bubble ${member.avatarClass}" style="width:56px; height:56px; font-size:1.1rem;">${member.initials}</div>
        <div>
          <h4 style="margin:0; font-size:1.2rem; font-weight:800; color:#111;">${member.fullName}</h4>
          <span style="font-size:0.85rem; font-weight:700; color:#111; display:block;">${member.role}</span>
          <span style="font-size:0.75rem; color:#77736C;">${member.email}</span>
        </div>
      </div>

      <div style="font-size:0.8125rem; line-height:1.5; color:#333;">
        <strong style="display:block; margin-bottom:0.35rem; color:#111;">About</strong>
        <p style="margin:0; color:#555;">${member.bio}</p>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
        <div style="background:#FAF7F1; padding:0.85rem 1rem; border-radius:6px; border:1px solid #E5E1D9;">
          <span style="font-size:0.65rem; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:#77736C; display:block; margin-bottom:0.25rem;">AREA OF RESPONSIBILITY</span>
          <strong style="font-size:0.85rem; color:#111;">${member.responsibility}</strong>
        </div>
        <div style="background:#FAF7F1; padding:0.85rem 1rem; border-radius:6px; border:1px solid #E5E1D9;">
          <span style="font-size:0.65rem; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:#77736C; display:block; margin-bottom:0.25rem;">CURRENT FOCUS</span>
          <strong style="font-size:0.85rem; color:#111;">${member.focus}</strong>
        </div>
      </div>
    `;

    const footerHtml = `
      <button class="tp-btn-secondary tp-btn-close-modal">Close</button>
      <button class="tp-btn-primary" id="tp-filter-by-member-btn">Filter Tasks for ${member.name} &rarr;</button>
    `;

    const { overlay, close } = createModal(member.name, bodyHtml, footerHtml);

    const filterBtn = overlay.querySelector('#tp-filter-by-member-btn');
    if (filterBtn) {
      filterBtn.addEventListener('click', () => {
        close();
        if (window.TeamDetailController && typeof window.TeamDetailController.switchTab === 'function') {
          window.TeamDetailController.switchTab('work');
        } else {
          showToast(`Filtered tasks for ${member.name}`);
        }
      });
    }
  }

  /* ── 2. Responsibility Detail & Reassign Modal ──────────────────────────── */
  function openResponsibilityDetail(resp, data) {
    const bodyHtml = `
      <div style="padding-bottom:0.85rem; border-bottom:1px solid #E5E1D9;">
        <span style="font-size:0.6875rem; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:#77736C;">RESPONSIBILITY DOMAIN</span>
        <h4 style="margin:0.25rem 0 0; font-size:1.15rem; font-weight:800; color:#111;">${resp.title}</h4>
      </div>

      <div style="font-size:0.8125rem; line-height:1.5; color:#555;">
        <strong style="display:block; margin-bottom:0.35rem; color:#111;">Scope &amp; Authority</strong>
        <p style="margin:0;">${resp.scope}</p>
      </div>

      <div style="background:#FAF7F1; border:1px solid #E5E1D9; border-radius:8px; padding:1rem;">
        <label for="tp-reassign-select" style="font-size:0.6875rem; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:#77736C; display:block; margin-bottom:0.5rem;">
          ASSIGNED OWNER
        </label>
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <div class="tp-avatar-bubble ${resp.avatarClass} tp-avatar--mini" id="tp-modal-resp-avatar">${resp.initials}</div>
          <select id="tp-reassign-select" style="flex:1; height:34px; border:1px solid #E5E1D9; border-radius:6px; background:#fff; font-family:var(--font-family); font-size:0.8rem; font-weight:600; padding:0 0.5rem;">
            ${data.members.map(m => `
              <option value="${m.id}" ${m.name === resp.owner ? 'selected' : ''}>${m.fullName} (${m.role})</option>
            `).join('')}
          </select>
        </div>
      </div>
    `;

    const footerHtml = `
      <button class="tp-btn-secondary tp-btn-close-modal">Cancel</button>
      <button class="tp-btn-primary" id="tp-save-resp-owner-btn">Save Ownership</button>
    `;

    const { overlay, close } = createModal('Responsibility Ownership', bodyHtml, footerHtml);

    const saveBtn = overlay.querySelector('#tp-save-resp-owner-btn');
    const select = overlay.querySelector('#tp-reassign-select');

    if (saveBtn && select) {
      saveBtn.addEventListener('click', () => {
        const newMember = data.members.find(m => m.id === select.value);
        if (newMember) {
          resp.owner = newMember.name;
          resp.initials = newMember.initials;
          resp.avatarClass = newMember.avatarClass;

          // Update UI row in Responsibility Map
          const row = document.querySelector(`.tp-resp-row[data-resp-id="${resp.id}"]`);
          if (row) {
            const ownerNameEl = row.querySelector('.tp-resp-owner');
            const avatarEl = row.querySelector('.tp-avatar-bubble');
            if (ownerNameEl) ownerNameEl.textContent = newMember.name;
            if (avatarEl) {
              avatarEl.textContent = newMember.initials;
              avatarEl.className = `tp-avatar-bubble tp-avatar--mini ${newMember.avatarClass}`;
            }
          }

          showToast(`Ownership updated: ${newMember.name} now owns "${resp.title}"`);
        }
        close();
      });
    }
  }

  /* ── 3. Responsibility Matrix Modal ─────────────────────────────────────── */
  function openResponsibilityMatrix(data) {
    const bodyHtml = `
      <p style="margin:0 0 1rem; font-size:0.8125rem; color:#77736C;">
        Comprehensive breakdown of organizational domains and designated team owners.
      </p>

      <div style="display:flex; flex-direction:column; gap:0.65rem;">
        ${data.responsibilities.map(r => `
          <div style="background:#FAF7F1; border:1px solid #E5E1D9; border-radius:8px; padding:0.85rem 1rem; display:flex; align-items:center; justify-content:space-between; gap:1rem;">
            <div style="min-width:0;">
              <strong style="font-size:0.85rem; color:#111; display:block;">${r.title}</strong>
              <span style="font-size:0.72rem; color:#77736C; display:block;">${r.scope}</span>
            </div>
            <div style="display:flex; align-items:center; gap:0.5rem; flex-shrink:0;">
              <div class="tp-avatar-bubble ${r.avatarClass} tp-avatar--mini">${r.initials}</div>
              <span style="font-size:0.78rem; font-weight:700; color:#111;">${r.owner}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    const footerHtml = `
      <button class="tp-btn-secondary tp-btn-close-modal">Close</button>
      <button class="tp-btn-primary" id="tp-export-matrix-btn">Export Responsibility Map</button>
    `;

    const { overlay, close } = createModal('Team Responsibility Matrix', bodyHtml, footerHtml);

    const exportBtn = overlay.querySelector('#tp-export-matrix-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        showToast('Responsibility map exported to workspace knowledge base');
        close();
      });
    }
  }

  /* ── 4. Collaboration Activity Modal ────────────────────────────────────── */
  function openCollaborationModal(collab) {
    const bodyHtml = `
      <div style="display:flex; align-items:center; gap:1rem; padding-bottom:1rem; border-bottom:1px solid #E5E1D9;">
        <div class="tp-dual-avatars">
          <div class="tp-avatar-bubble ${collab.avatars[0]}" style="width:36px; height:36px; font-size:0.75rem;">${collab.initials[0]}</div>
          <div class="tp-avatar-bubble ${collab.avatars[1]} tp-avatar-overlap" style="width:36px; height:36px; font-size:0.75rem;">${collab.initials[1]}</div>
        </div>
        <div>
          <h4 style="margin:0; font-size:1.1rem; font-weight:800; color:#111;">${collab.title}</h4>
          <span style="font-size:0.78rem; color:#77736C;">${collab.meta}</span>
        </div>
      </div>

      <div style="font-size:0.8125rem; line-height:1.5; color:#555;">
        <strong style="display:block; margin-bottom:0.35rem; color:#111;">Activity Summary</strong>
        <p style="margin:0;">${collab.notes}</p>
      </div>

      <div style="background:#FAF7F1; padding:0.85rem 1rem; border-radius:6px; border:1px solid #E5E1D9; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <span style="font-size:0.65rem; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:#77736C; display:block;">STATUS</span>
          <strong style="font-size:0.85rem; color:#111;">${collab.status}</strong>
        </div>
        <span style="background:#FFFFFF; font-size:0.72rem; font-weight:700; padding:0.2rem 0.5rem; border-radius:4px; border:1px solid #E5E1D9;">Active Collaboration</span>
      </div>
    `;

    const footerHtml = `
      <button class="tp-btn-secondary tp-btn-close-modal">Close</button>
      <button class="tp-btn-primary" id="tp-open-related-task-btn">View Related Work &rarr;</button>
    `;

    const { overlay, close } = createModal('Collaboration Activity', bodyHtml, footerHtml);

    const taskBtn = overlay.querySelector('#tp-open-related-task-btn');
    if (taskBtn) {
      taskBtn.addEventListener('click', () => {
        close();
        if (window.TeamDetailController && typeof window.TeamDetailController.switchTab === 'function') {
          window.TeamDetailController.switchTab('work');
        } else {
          showToast(`Navigating to work registry for ${collab.title}`);
        }
      });
    }
  }

  /* ── 5. Assign Reviewer Modal (Needs an Owner) ──────────────────────────── */
  function openAssignReviewerModal(data) {
    const item = data.unassignedWork;
    const bodyHtml = `
      <div style="padding-bottom:0.85rem; border-bottom:1px solid #E5E1D9;">
        <span style="font-size:0.6875rem; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:#8D5B18;">NEEDS AN OWNER</span>
        <h4 style="margin:0.25rem 0 0; font-size:1.15rem; font-weight:800; color:#111;">${item.title}</h4>
        <span style="font-size:0.78rem; color:#77736C;">${item.project}</span>
      </div>

      <p style="margin:0; font-size:0.8125rem; color:#555; line-height:1.4;">
        ${item.desc}
      </p>

      <div style="background:#FAF7F1; border:1px solid #E5E1D9; border-radius:8px; padding:1rem;">
        <label for="tp-reviewer-select" style="font-size:0.6875rem; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:#77736C; display:block; margin-bottom:0.5rem;">
          SELECT REVIEWER
        </label>
        <select id="tp-reviewer-select" style="width:100%; height:36px; border:1px solid #E5E1D9; border-radius:6px; background:#fff; font-family:var(--font-family); font-size:0.8125rem; font-weight:600; padding:0 0.5rem;">
          ${data.members.map(m => `
            <option value="${m.id}">${m.fullName} — ${m.role}</option>
          `).join('')}
        </select>
      </div>
    `;

    const footerHtml = `
      <button class="tp-btn-secondary tp-btn-close-modal">Cancel</button>
      <button class="tp-btn-primary" id="tp-confirm-assign-btn">Assign Reviewer</button>
    `;

    const { overlay, close } = createModal('Assign Reviewer', bodyHtml, footerHtml);

    const assignBtn = overlay.querySelector('#tp-confirm-assign-btn');
    const select = overlay.querySelector('#tp-reviewer-select');

    if (assignBtn && select) {
      assignBtn.addEventListener('click', () => {
        const assignedMember = data.members.find(m => m.id === select.value) || data.members[0];

        // Update Needs an Owner Card UI
        const badge = document.getElementById('tp-needs-owner-count');
        const sub = document.getElementById('tp-unassigned-sub');
        const actionBtn = document.getElementById('tp-assign-reviewer-btn');

        if (badge) {
          badge.textContent = '00';
          badge.style.background = '#EFF1E2';
          badge.style.color = '#436928';
        }
        if (sub) {
          sub.textContent = `${item.project} · Assigned to ${assignedMember.name}`;
        }
        if (actionBtn) {
          actionBtn.innerHTML = `<span>Change reviewer</span><span class="tp-link-arrow">&rarr;</span>`;
        }

        showToast(`Reviewer assigned: ${assignedMember.name} will review "${item.title}"`);
        close();
      });
    }
  }

  /* ── 6. Team Playbook Modal ─────────────────────────────────────────────── */
  function openPlaybookModal(data) {
    const pb = data.playbook;
    const bodyHtml = `
      <div style="padding-bottom:0.85rem; border-bottom:1px solid #E5E1D9;">
        <span style="font-size:0.6875rem; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:#2B5797;">TEAM PLAYBOOK</span>
        <h4 style="margin:0.25rem 0 0; font-size:1.2rem; font-weight:800; color:#111;">${pb.title}.</h4>
        <span style="font-size:0.75rem; color:#77736C;">${pb.version} · ${pb.status}</span>
      </div>

      <p style="margin:0; font-size:0.8125rem; color:#555; line-height:1.4;">
        Our shared foundation for consistent, accessible and thoughtful digital experiences across all design sprints.
      </p>

      <div style="display:flex; flex-direction:column; gap:0.5rem;">
        ${pb.principles.map(p => `
          <div style="background:#FAF7F1; border:1px solid #E5E1D9; border-radius:6px; padding:0.75rem 0.85rem; font-size:0.78rem; font-weight:600; color:#111;">
            ${p}
          </div>
        `).join('')}
      </div>
    `;

    const footerHtml = `
      <button class="tp-btn-secondary tp-btn-close-modal">Close</button>
      <button class="tp-btn-primary" id="tp-open-full-playbook-btn">Open in Library &rarr;</button>
    `;

    const { overlay, close } = createModal('Team Playbook', bodyHtml, footerHtml);

    const fullBtn = overlay.querySelector('#tp-open-full-playbook-btn');
    if (fullBtn) {
      fullBtn.addEventListener('click', () => {
        close();
        window.location.href = '/pages/workspace/team-libraries/team-libraries.html';
      });
    }
  }

  /* ── 7. Team Standards Modal ────────────────────────────────────────────── */
  function openStandardsModal(data) {
    const st = data.standards;
    const bodyHtml = `
      <div style="padding-bottom:0.85rem; border-bottom:1px solid #E5E1D9;">
        <span style="font-size:0.6875rem; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:#436928;">TEAM STANDARDS</span>
        <h4 style="margin:0.25rem 0 0; font-size:1.15rem; font-weight:800; color:#111;">${st.title}</h4>
        <span style="font-size:0.75rem; color:#77736C;">${st.summary}</span>
      </div>

      <div style="display:flex; flex-direction:column; gap:0.5rem;">
        ${st.items.map(item => `
          <div style="background:#FAF7F1; border:1px solid #E5E1D9; border-radius:6px; padding:0.75rem 0.85rem; display:flex; align-items:center; gap:0.65rem; font-size:0.78rem; font-weight:600; color:#111;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#436928" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>${item}</span>
          </div>
        `).join('')}
      </div>
    `;

    const footerHtml = `
      <button class="tp-btn-secondary tp-btn-close-modal">Close</button>
      <button class="tp-btn-primary" id="tp-export-standards-btn">View Guidelines Collection &rarr;</button>
    `;

    const { overlay, close } = createModal('Team Standards', bodyHtml, footerHtml);

    const fullBtn = overlay.querySelector('#tp-export-standards-btn');
    if (fullBtn) {
      fullBtn.addEventListener('click', () => {
        close();
        window.location.href = '/pages/workspace/team-libraries/team-libraries.html';
      });
    }
  }

  /* ── 8. Team Access & Permissions Modal ─────────────────────────────────── */
  function openTeamAccessModal(data) {
    const bodyHtml = `
      <p style="margin:0 0 1rem; font-size:0.8125rem; color:#77736C;">
        Manage access to team resources, permission tiers, and invite new members.
      </p>

      <div style="display:flex; flex-direction:column; gap:0.65rem;">
        ${data.members.map(m => `
          <div style="background:#FAF7F1; border:1px solid #E5E1D9; border-radius:8px; padding:0.75rem 1rem; display:flex; align-items:center; justify-content:space-between;">
            <div style="display:flex; align-items:center; gap:0.75rem;">
              <div class="tp-avatar-bubble ${m.avatarClass} tp-avatar--mini">${m.initials}</div>
              <div>
                <strong style="font-size:0.85rem; color:#111; display:block;">${m.fullName}</strong>
                <span style="font-size:0.7rem; color:#77736C;">${m.email}</span>
              </div>
            </div>
            <select class="tp-access-role-tier" style="height:28px; border:1px solid #E5E1D9; border-radius:4px; font-size:0.72rem; font-weight:700; background:#FFFFFF;">
              <option ${m.role.includes('Lead') ? 'selected' : ''}>Admin</option>
              <option ${!m.role.includes('Lead') ? 'selected' : ''}>Editor</option>
              <option>Viewer</option>
            </select>
          </div>
        `).join('')}
      </div>

      <div style="margin-top:0.75rem; padding-top:0.85rem; border-top:1px dashed #E5E1D9;">
        <label style="font-size:0.6875rem; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:#77736C; display:block; margin-bottom:0.35rem;">
          INVITE NEW MEMBER
        </label>
        <div style="display:flex; gap:0.5rem;">
          <input type="email" id="tp-invite-email-input" placeholder="teammate@acme.co" style="flex:1; height:32px; border:1px solid #E5E1D9; border-radius:6px; padding:0 0.65rem; font-size:0.78rem;">
          <button class="tp-btn-primary" id="tp-send-invite-btn" style="padding:0.4rem 0.85rem; font-size:0.72rem;">Send Invite</button>
        </div>
      </div>
    `;

    const footerHtml = `
      <button class="tp-btn-secondary tp-btn-close-modal">Cancel</button>
      <button class="tp-btn-primary" id="tp-save-access-btn">Save Access Permissions</button>
    `;

    const { overlay, close } = createModal('Permissions & Invitations', bodyHtml, footerHtml);

    const saveBtn = overlay.querySelector('#tp-save-access-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        showToast('Team member permissions successfully updated');
        close();
      });
    }

    const inviteBtn = overlay.querySelector('#tp-send-invite-btn');
    const inviteInput = overlay.querySelector('#tp-invite-email-input');
    if (inviteBtn && inviteInput) {
      inviteBtn.addEventListener('click', () => {
        if (!inviteInput.value.trim() || !inviteInput.value.includes('@')) {
          showToast('Please enter a valid email address');
          return;
        }
        showToast(`Invitation sent to ${inviteInput.value.trim()}`);
        inviteInput.value = '';
      });
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderMembersGrid(data) {
    const grid = document.getElementById('tp-members-grid');
    if (!grid) return;
    if (!data.members || data.members.length === 0) {
      grid.innerHTML = `
        <div class="tp-empty-members">
          <p class="tp-empty-title">No team members found</p>
          <p class="tp-empty-sub">Add members to your workspace to view their roles, focus areas, and collaboration status.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = data.members.map(m => {
      const cardTheme = m.cardTheme || 'tp-card--beige';
      const avatarClass = m.avatarClass || 'tp-avatar--beige';
      const initials = m.initials || 'ME';
      const name = escapeHtml(m.name || m.fullName || 'Member');
      const role = escapeHtml(m.role || 'Member');
      const resp = escapeHtml(m.responsibility || 'Workspace Member');
      const focus = escapeHtml(m.focus || 'Active Delivery');

      return `
        <button type="button" class="tp-member-card ${cardTheme}" data-member-id="${m.id}" data-role="${role}">
          <div class="tp-card-top">
            <div class="tp-card-top-left">
              <div class="tp-avatar-bubble ${avatarClass}">${initials}</div>
              <div class="tp-member-id-meta">
                <span class="tp-member-name">${name}</span>
                <span class="tp-member-role">${role}</span>
              </div>
            </div>
            <span class="tp-card-arrow-btn" aria-label="View ${name} profile">&#8594;</span>
          </div>
          <div class="tp-card-divider"></div>
          <div class="tp-card-meta-grid">
            <div class="tp-meta-col">
              <span class="tp-meta-label">AREA OF RESPONSIBILITY</span>
              <span class="tp-meta-val">${resp}</span>
            </div>
            <div class="tp-meta-col">
              <span class="tp-meta-label">CURRENT FOCUS</span>
              <span class="tp-meta-val">${focus}</span>
            </div>
          </div>
        </button>
      `;
    }).join('');
  }

  function renderResponsibilities(data) {
    const container = document.getElementById('tp-resp-list');
    if (!container) return;

    if (!data.responsibilities || data.responsibilities.length === 0) {
      const members = data.members || [];
      const m0 = members[0] || { id: 'm-1', name: 'Peter K.', initials: 'PK', avatarClass: 'tp-avatar--beige' };
      const m1 = members[1] || members[0] || { id: 'm-2', name: 'Alex R.', initials: 'AR', avatarClass: 'tp-avatar--lavender' };
      const m2 = members[2] || members[0] || { id: 'm-3', name: 'Sarah K.', initials: 'SK', avatarClass: 'tp-avatar--green' };
      const m3 = members[3] || members[1] || members[0] || { id: 'm-4', name: 'Maria J.', initials: 'MJ', avatarClass: 'tp-avatar--blue' };

      data.responsibilities = [
        {
          id: 'resp-direction',
          title: 'Design direction',
          scope: 'Brand alignment, design system governance, executive design critiques, and high-fidelity project sign-offs.',
          owner: m0.name,
          initials: m0.initials,
          avatarClass: m0.avatarClass || 'tp-avatar--beige',
          iconWrapClass: 'tp-icon--beige',
          iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>'
        },
        {
          id: 'resp-interface',
          title: 'Interface reviews',
          scope: 'Component usability testing, design sprint feedback, micro-interaction validation, and prototyping fidelity checks.',
          owner: m1.name,
          initials: m1.initials,
          avatarClass: m1.avatarClass || 'tp-avatar--lavender',
          iconWrapClass: 'tp-icon--lavender',
          iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>'
        },
        {
          id: 'resp-research',
          title: 'Research & content',
          scope: 'User interviews, qualitative synthesis, content strategy, copy tone guidelines, and accessibility audits.',
          owner: m2.name,
          initials: m2.initials,
          avatarClass: m2.avatarClass || 'tp-avatar--green',
          iconWrapClass: 'tp-icon--green',
          iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>'
        },
        {
          id: 'resp-handoffs',
          title: 'Implementation handoffs',
          scope: 'Design token parity, component specs, responsive breakpoint QA, and developer collaboration during sprint delivery.',
          owner: m3.name,
          initials: m3.initials,
          avatarClass: m3.avatarClass || 'tp-avatar--blue',
          iconWrapClass: 'tp-icon--blue',
          iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>'
        }
      ];
    }

    container.innerHTML = data.responsibilities.map(r => `
      <button type="button" class="tp-resp-row" data-resp-id="${r.id}">
        <div class="tp-resp-left">
          <div class="tp-resp-icon-wrap ${r.iconWrapClass || 'tp-icon--beige'}">
            ${r.iconSvg || ''}
          </div>
          <span class="tp-resp-title">${escapeHtml(r.title)}</span>
        </div>
        <div class="tp-resp-right">
          <div class="tp-avatar-bubble tp-avatar--mini ${r.avatarClass}">${r.initials}</div>
          <span class="tp-resp-owner">${escapeHtml(r.owner)}</span>
          <span class="tp-row-chevron">&#8250;</span>
        </div>
      </button>
    `).join('');
  }

  function renderCollaborations(data) {
    const container = document.getElementById('tp-collab-list');
    if (!container) return;

    if (!data.collaborations || data.collaborations.length === 0) {
      const members = data.members || [];
      const m0 = members[0] || { name: 'Peter K.', initials: 'PK', avatarClass: 'tp-avatar--beige' };
      const m1 = members[1] || members[0] || { name: 'Alex R.', initials: 'AR', avatarClass: 'tp-avatar--lavender' };
      const m2 = members[2] || members[0] || { name: 'Sarah K.', initials: 'SK', avatarClass: 'tp-avatar--green' };
      const m3 = members[3] || members[1] || members[0] || { name: 'Maria J.', initials: 'MJ', avatarClass: 'tp-avatar--blue' };

      data.collaborations = [
        {
          id: 'collab-1',
          title: 'Website design review',
          meta: `${m0.name} & ${m1.name} · Approval pending`,
          status: 'Approval pending',
          initials: [m0.initials, m1.initials],
          avatars: [m0.avatarClass || 'tp-avatar--beige', m1.avatarClass || 'tp-avatar--lavender'],
          notes: 'Reviewing key layouts and component specifications prior to engineering kickoff.'
        },
        {
          id: 'collab-2',
          title: 'Content implementation',
          meta: `${m2.name} & ${m3.name} · In progress`,
          status: 'In progress',
          initials: [m2.initials, m3.initials],
          avatars: [m2.avatarClass || 'tp-avatar--green', m3.avatarClass || 'tp-avatar--blue'],
          notes: 'Aligning product messaging and microcopy with the design token system.'
        }
      ];
    }

    container.innerHTML = data.collaborations.map(c => `
      <button type="button" class="tp-collab-row" data-collab-id="${c.id}">
        <div class="tp-collab-left">
          <div class="tp-dual-avatars">
            <div class="tp-avatar-bubble tp-avatar--mini ${c.avatars[0]}">${c.initials[0]}</div>
            <div class="tp-avatar-bubble tp-avatar--mini ${c.avatars[1]} tp-avatar-overlap">${c.initials[1]}</div>
          </div>
          <div class="tp-collab-info">
            <span class="tp-collab-title">${escapeHtml(c.title)}</span>
            <span class="tp-collab-meta">${escapeHtml(c.meta)}</span>
          </div>
        </div>
        <span class="tp-row-arrow">&#8594;</span>
      </button>
    `).join('');
  }

  /* ── Wire Interactions ─────────────────────────────────────────────────── */
  function wireInteractions(data) {
    renderMembersGrid(data);
    renderResponsibilities(data);
    renderCollaborations(data);

    // 1. Search & Filter Input Listeners
    const searchInput = document.getElementById('tp-member-search');
    const clearBtn = document.getElementById('tp-search-clear');
    const roleSelect = document.getElementById('tp-role-filter');
    const searchToggle = document.getElementById('tp-search-toggle');

    if (searchToggle && searchInput) {
      searchToggle.addEventListener('click', () => {
        searchInput.focus();
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', () => filterMembers(data));
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          searchInput.value = '';
          filterMembers(data);
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
        }
        filterMembers(data);
      });
    }

    if (roleSelect) {
      roleSelect.addEventListener('change', () => filterMembers(data));
    }

    // 2. Member Cards & Arrows
    document.querySelectorAll('#tp-members-grid .tp-member-card').forEach(card => {
      card.addEventListener('click', () => {
        const memberId = card.getAttribute('data-member-id');
        const member = data.members.find(m => m.id === memberId) || data.members[0];
        openMemberProfile(member);
      });
    });

    // 3. Responsibility Map Rows
    document.querySelectorAll('.tp-resp-row').forEach(row => {
      row.addEventListener('click', () => {
        const respId = row.getAttribute('data-resp-id');
        const resp = data.responsibilities.find(r => r.id === respId) || data.responsibilities[0];
        openResponsibilityDetail(resp, data);
      });
    });

    const viewAllRespBtn = document.getElementById('tp-view-all-resp');
    if (viewAllRespBtn) {
      viewAllRespBtn.addEventListener('click', () => {
        openResponsibilityMatrix(data);
      });
    }

    // 4. Working Together Collaboration Rows
    document.querySelectorAll('.tp-collab-row').forEach(row => {
      row.addEventListener('click', () => {
        const collabId = row.getAttribute('data-collab-id');
        const collab = data.collaborations.find(c => c.id === collabId) || data.collaborations[0];
        openCollaborationModal(collab);
      });
    });

    const viewAllCollabBtn = document.getElementById('tp-view-all-collab');
    if (viewAllCollabBtn) {
      viewAllCollabBtn.addEventListener('click', () => {
        if (window.TeamDetailController && typeof window.TeamDetailController.switchTab === 'function') {
          window.TeamDetailController.switchTab('work');
        } else {
          showToast('Navigating to full team collaboration register');
        }
      });
    }

    // 5. Section 04: Team Access Banner
    const accessManageBtn = document.getElementById('tp-access-manage-btn');
    if (accessManageBtn) {
      accessManageBtn.addEventListener('click', () => {
        openTeamAccessModal(data);
      });
    }

    // 6. Right Rail: Card 1 (Team Connections)
    const browseMembersBtn = document.getElementById('tp-browse-members-btn');
    if (browseMembersBtn) {
      browseMembersBtn.addEventListener('click', () => {
        openResponsibilityMatrix(data);
      });
    }

    // 7. Right Rail: Card 2 (Needs an Owner)
    const assignReviewerBtn = document.getElementById('tp-assign-reviewer-btn');
    if (assignReviewerBtn) {
      assignReviewerBtn.addEventListener('click', () => {
        openAssignReviewerModal(data);
      });
    }

    const needsOwnerCard = document.getElementById('tp-needs-owner-card');
    if (needsOwnerCard) {
      needsOwnerCard.addEventListener('click', (e) => {
        if (e.target.closest('#tp-assign-reviewer-btn')) return;
        openAssignReviewerModal(data);
      });
    }

    // 8. Right Rail: Card 3 (Team Playbook)
    const openPlaybookBtn = document.getElementById('tp-open-playbook-btn');
    if (openPlaybookBtn) {
      openPlaybookBtn.addEventListener('click', () => {
        openPlaybookModal(data);
      });
    }

    const playbookRailCard = document.getElementById('tp-playbook-rail-card');
    if (playbookRailCard) {
      playbookRailCard.addEventListener('click', (e) => {
        if (e.target.closest('#tp-open-playbook-btn')) return;
        openPlaybookModal(data);
      });
    }

    // 9. Right Rail: Card 4 (Quick Links)
    document.querySelectorAll('.tp-quick-link-row').forEach(row => {
      row.addEventListener('click', () => {
        const title = row.querySelector('.tp-quick-link-title');
        const titleText = title ? title.textContent : 'resource';
        showToast(`Opening ${titleText} in Team Libraries...`);
        setTimeout(() => {
          window.location.href = '/pages/workspace/team-libraries/team-libraries.html';
        }, 300);
      });
    });

    // 10. Right Rail: Card 5 (Team Standards)
    const viewStandardsBtn = document.getElementById('tp-view-standards-btn');
    if (viewStandardsBtn) {
      viewStandardsBtn.addEventListener('click', () => {
        openStandardsModal(data);
      });
    }

    const standardsRailCard = document.getElementById('tp-standards-rail-card');
    if (standardsRailCard) {
      standardsRailCard.addEventListener('click', (e) => {
        if (e.target.closest('#tp-view-standards-btn')) return;
        openStandardsModal(data);
      });
    }
  }

  /* ── Public API ────────────────────────────────────────────────────────── */
  const TeamPeople = {
    init(teamId, customData) {
      currentTeamId = teamId || 'team-design';
      if (customData) {
        wireInteractions(customData);
        return;
      }
      fetch('/api/employees')
        .then(res => res.ok ? res.json() : null)
        .then(res => {
          const empList = (res && res.employees) ? res.employees : [];
          const members = empList.map(emp => ({
            id: emp.id,
            name: emp.fullName || 'Member',
            fullName: emp.fullName || 'Member',
            role: emp.jobTitle || emp.roleTitle || 'Member',
            email: emp.email || '',
            initials: emp.initials || (emp.fullName ? emp.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'ME'),
            avatarClass: emp.cardTheme ? `tp-avatar--${emp.cardTheme}` : 'tp-avatar--beige',
            cardTheme: emp.cardTheme ? `tp-card--${emp.cardTheme}` : 'tp-card--beige',
            responsibility: emp.shortBio || emp.departmentName || 'Workspace Member',
            focus: emp.detailedBio || 'Active Delivery'
          }));
          const data = {
            ...DEFAULT_EMPTY_PEOPLE,
            members
          };
          wireInteractions(data);
        })
        .catch(() => {
          wireInteractions(DEFAULT_EMPTY_PEOPLE);
        });
    }
  };

  window.TeamPeople = TeamPeople;

  // Auto-init if already mounted
  if (document.getElementById('team-people-root')) {
    TeamPeople.init();
  }

})(window);
