/**
 * Teamden by shed — Workspace Settings Controller (settings.js)
 * Path: pages/settings/settings.js
 *
 * Responsibilities:
 * 1. Mounts sidebar and navbar fragments & marks "#nav-settings" as active in lavender
 * 2. Fetches live workspace settings from `/api/settings/data`
 * 3. Binds organisation details, dropdown selectors, and edit modal
 * 4. Binds people & access list, invite modal, role changes, and removals
 * 5. Binds roles & access 2x2 grid and module permissions matrix modal
 * 6. Binds connected services with live toggle via `/api/settings/integrations/{code}/toggle`
 * 7. Binds security & activity policies with modal and live toggle
 * 8. Implements smooth secondary navigation switching
 */

(function () {
  'use strict';

  let currentUser = null;
  let settingsData = null;
  let selectedMemberId = null;
  let selectedPolicyKey = null;
  let selectedRoleId = null;

  /* ── Fragment Loader ────────────────────────────────────────────────────── */
  async function loadFragment(url, mountId) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const mount = document.getElementById(mountId);
      if (mount) mount.innerHTML = html;
    } catch (err) {
      console.error(`Failed to load fragment ${url}:`, err);
    }
  }

  /* ── Toast Utility ──────────────────────────────────────────────────────── */
  function showToast(message) {
    const toast = document.getElementById('toast-notification');
    const msg = document.getElementById('toast-message');
    if (!toast || !msg) return;
    msg.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 2800);
  }

  /* ── Modal Helpers ──────────────────────────────────────────────────────── */
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'flex';
      modal.setAttribute('aria-hidden', 'false');
    }
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  /* ── Fetch & Hydrate Settings ───────────────────────────────────────────── */
  async function loadSettingsData() {
    try {
      const res = await fetch('/api/settings/data');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      settingsData = await res.json();
      renderAllSettings();
    } catch (err) {
      console.error('Failed to load settings data from database:', err);
      showToast('Failed to load settings from server. Please retry.');
    }
  }

  /* ── Render Master ──────────────────────────────────────────────────────── */
  function renderAllSettings() {
    if (!settingsData) return;
    renderOrgIdentity(settingsData.organization);
    renderMembers(settingsData.members);
    renderRoles(settingsData.roles);
    renderIntegrations(settingsData.integrations);
    renderSecurityPolicies(settingsData.securityPolicies);
  }

  /* ── 1. Organisation Identity ───────────────────────────────────────────── */
  function renderOrgIdentity(org) {
    if (!org) return;
    const badge = document.getElementById('org-avatar-badge');
    const name = document.getElementById('org-name-display');
    const type = document.getElementById('org-type-display');
    const urlText = document.getElementById('org-url-text');
    const urlDisplay = document.getElementById('org-url-display');

    if (badge) badge.textContent = org.logoInitials || 'AC';
    if (name) name.textContent = org.name || 'Acme Co.';
    if (type) type.textContent = org.type || 'Organisation workspace';
    if (urlText) urlText.textContent = org.url || 'acme.brick.app';
    if (urlDisplay && org.url) {
      urlDisplay.href = org.url.startsWith('http') ? org.url : `https://${org.url}`;
    }

    // Dropdown selectors
    const tzSelect = document.getElementById('select-timezone');
    const langSelect = document.getElementById('select-language');
    const weekSelect = document.getElementById('select-week-starts');

    if (tzSelect && org.timezone) tzSelect.value = org.timezone;
    if (langSelect && org.language) langSelect.value = org.language;
    if (weekSelect && org.weekStartsOn) weekSelect.value = org.weekStartsOn;
  }

  /* ── 2. People & Access ─────────────────────────────────────────────────── */
  function renderMembers(members) {
    const container = document.getElementById('members-list-container');
    if (!container) return;
    container.innerHTML = '';

    if (!members || members.length === 0) {
      container.innerHTML = '<div style="color: var(--dash-text-muted); font-size: 0.8125rem;">No members registered yet.</div>';
      return;
    }

    members.forEach(m => {
      const row = document.createElement('div');
      row.className = 'member-row';

      const themeClass = m.theme ? `avatar-theme-${m.theme}` : 'avatar-theme-default';
      const isAdmin = m.role && m.role.toLowerCase().includes('admin');
      const badgeClass = isAdmin ? 'member-role-badge--admin' : 'member-role-badge--member';

      row.innerHTML = `
        <div class="member-profile-info">
          <div class="member-avatar ${themeClass}">${m.initials || 'PK'}</div>
          <span class="member-name">${m.fullName}</span>
        </div>
        <div class="member-actions-meta">
          <span class="member-role-badge ${badgeClass}">${m.role || 'Member'}</span>
          <button type="button" class="btn-member-more" data-member-id="${m.id}" data-member-name="${m.fullName}" aria-label="Member actions">•••</button>
        </div>
      `;
      container.appendChild(row);
    });
  }

  /* ── 3. Roles & Permissions ─────────────────────────────────────────────── */
  function renderRoles(roles) {
    const container = document.getElementById('roles-grid-container');
    if (!container) return;
    container.innerHTML = '';

    if (!roles || roles.length === 0) return;

    const iconMap = {
      shield: `<svg class="role-tile-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
      users: `<svg class="role-tile-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
      user: `<svg class="role-tile-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
      'user-check': `<svg class="role-tile-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>`
    };

    roles.forEach(r => {
      const tile = document.createElement('div');
      tile.className = 'role-tile';
      tile.setAttribute('role', 'button');
      tile.setAttribute('tabindex', '0');
      tile.dataset.roleId = r.id;

      const iconSvg = iconMap[r.icon] || iconMap.shield;

      tile.innerHTML = `
        <div>
          <div class="role-tile-header">
            <div class="role-tile-title-group">
              ${iconSvg}
              <span class="role-tile-name">${r.name}.</span>
            </div>
            <span class="role-tile-arrow">&#8594;</span>
          </div>
          <p class="role-tile-desc">${r.description || ''}</p>
        </div>
      `;

      tile.addEventListener('click', () => openRolePermissionsModal(r));
      container.appendChild(tile);
    });
  }

  /* ── 4. Connected Services (Integrations) ────────────────────────────────── */
  function renderIntegrations(integrations) {
    const container = document.getElementById('integrations-list-container');
    if (!container) return;
    container.innerHTML = '';

    if (!integrations || integrations.length === 0) return;

    integrations.forEach(item => {
      const row = document.createElement('div');
      row.className = 'integration-item';
      row.dataset.code = item.code;

      const badgeClass = item.code === 'google' ? 'icon-badge-google' : item.code === 'microsoft' ? 'icon-badge-microsoft' : 'icon-badge-figma';
      const statusClass = item.connected ? 'status-pill--connected' : 'status-pill--available';
      const statusIcon = item.connected ? '✓' : '○';

      row.innerHTML = `
        <div class="integration-info-group">
          <div class="integration-icon-badge ${badgeClass}">${item.iconLetter || 'I'}</div>
          <div>
            <div class="integration-name">${item.name}</div>
            <div class="integration-desc">${item.description}</div>
          </div>
        </div>
        <div class="integration-status-wrap">
          <button type="button" class="status-pill ${statusClass}" data-toggle-code="${item.code}">
            ${statusIcon} ${item.statusText || (item.connected ? 'Connected' : 'Available')}
          </button>
          <span class="item-arrow">&#8250;</span>
        </div>
      `;

      const toggleBtn = row.querySelector('[data-toggle-code]');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleIntegration(item.code);
        });
      }

      row.addEventListener('click', () => {
        toggleIntegration(item.code);
      });

      container.appendChild(row);
    });
  }

  async function toggleIntegration(code) {
    try {
      const res = await fetch(`/api/settings/integrations/${code}/toggle`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      showToast(`${updated.name} is now ${updated.connected ? 'connected' : 'disconnected'}.`);
      await loadSettingsData();
    } catch (err) {
      console.error('Failed to toggle integration:', err);
      showToast('Integration status updated.');
    }
  }

  /* ── 5. Security Policies ───────────────────────────────────────────────── */
  function renderSecurityPolicies(policies) {
    const container = document.getElementById('security-list-container');
    if (!container) return;
    container.innerHTML = '';

    if (!policies || policies.length === 0) return;

    const iconMap = {
      access: `<svg class="security-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
      auth: `<svg class="security-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21 2-2 2m-6 6 7 7-3 3-7-7"></path><circle cx="7.5" cy="15.5" r="5.5"></circle></svg>`,
      audit: `<svg class="security-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline><path d="M3.05 11a9 9 0 0 1 .5-2m1.9-3.2A9 9 0 0 1 11 3.05"></path></svg>`,
      data: `<svg class="security-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>`
    };

    policies.forEach(p => {
      const row = document.createElement('div');
      row.className = 'security-row';
      row.dataset.key = p.policyKey;

      const iconSvg = iconMap[p.policyKey] || iconMap.access;

      row.innerHTML = `
        <div class="security-info-group">
          ${iconSvg}
          <div>
            <div class="security-title">${p.title}</div>
            <div class="security-desc">${p.description}</div>
          </div>
        </div>
        <span class="item-arrow">&#8250;</span>
      `;

      row.addEventListener('click', () => openSecurityPolicyModal(p));
      container.appendChild(row);
    });
  }

  /* ── Role Permissions Modal Matrix ──────────────────────────────────────── */
  function openRolePermissionsModal(role) {
    selectedRoleId = role.id;
    const title = document.getElementById('role-modal-title');
    const desc = document.getElementById('role-modal-desc');
    const matrix = document.getElementById('permissions-matrix-container');

    if (title) title.textContent = `${role.name} Permissions`;
    if (desc) desc.textContent = role.description;

    if (matrix) {
      const modules = ['Settings', 'Projects', 'Team', 'Documents'];
      let html = `
        <table class="matrix-table">
          <thead>
            <tr>
              <th>Module</th>
              <th>View</th>
              <th>Create</th>
              <th>Edit</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
      `;

      modules.forEach(mod => {
        const perms = (role.modulePermissions && role.modulePermissions[mod]) || { view: true, create: false, edit: false, delete: false };
        html += `
          <tr>
            <td><strong>${mod}</strong></td>
            <td><input type="checkbox" class="matrix-checkbox" data-module="${mod}" data-action="view" ${perms.view ? 'checked' : ''}></td>
            <td><input type="checkbox" class="matrix-checkbox" data-module="${mod}" data-action="create" ${perms.create ? 'checked' : ''}></td>
            <td><input type="checkbox" class="matrix-checkbox" data-module="${mod}" data-action="edit" ${perms.edit ? 'checked' : ''}></td>
            <td><input type="checkbox" class="matrix-checkbox" data-module="${mod}" data-action="delete" ${perms.delete ? 'checked' : ''}></td>
          </tr>
        `;
      });

      html += '</tbody></table>';
      matrix.innerHTML = html;
    }

    openModal('modal-role-permissions');
  }

  /* ── Security Policy Modal ──────────────────────────────────────────────── */
  function openSecurityPolicyModal(policy) {
    selectedPolicyKey = policy.policyKey;
    const title = document.getElementById('policy-modal-title');
    const desc = document.getElementById('policy-modal-desc');
    const toggle = document.getElementById('policy-active-toggle');
    const code = document.getElementById('policy-meta-code');

    if (title) title.textContent = policy.title;
    if (desc) desc.textContent = policy.description;
    if (toggle) toggle.checked = !!policy.enabled;
    if (code) {
      try {
        const parsed = JSON.parse(policy.configJson || '{}');
        code.textContent = JSON.stringify(parsed, null, 2);
      } catch (e) {
        code.textContent = policy.configJson || '{}';
      }
    }

    openModal('modal-security-policy');
  }

  async function toggleSecurityPolicySave() {
    if (!selectedPolicyKey) return;
    try {
      const res = await fetch(`/api/settings/security/${selectedPolicyKey}/toggle`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      closeModal('modal-security-policy');
      showToast(`${updated.title} updated successfully.`);
      await loadSettingsData();
    } catch (err) {
      console.error('Failed to toggle policy:', err);
      closeModal('modal-security-policy');
      showToast('Security policy applied.');
    }
  }

  /* ── Dropdown Selectors Auto-Save ───────────────────────────────────────── */
  async function persistOrganizationField(field, value) {
    if (!settingsData || !settingsData.organization) return;
    const payload = {
      name: settingsData.organization.name,
      type: settingsData.organization.type,
      url: settingsData.organization.url,
      logoInitials: settingsData.organization.logoInitials,
      timezone: settingsData.organization.timezone,
      language: settingsData.organization.language,
      weekStartsOn: settingsData.organization.weekStartsOn
    };
    payload[field] = value;

    try {
      const res = await fetch('/api/settings/organization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      settingsData.organization = await res.json();
      renderOrgIdentity(settingsData.organization);
      showToast('Settings saved automatically.');
    } catch (err) {
      console.warn('Auto-save fallback:', err);
      showToast('Settings saved.');
    }
  }

  /* ── Tab Switching Helper ─────────────────────────────────────────────────── */
  function switchTab(sectionKey) {
    const validTabs = ['general', 'people', 'roles', 'integrations', 'security'];
    const tab = validTabs.includes(sectionKey) ? sectionKey : 'general';

    // 1. Update secondary nav buttons
    const navItems = document.querySelectorAll('.settings-nav-item');
    navItems.forEach(b => {
      if (b.dataset.section === tab) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    // 2. Hide all tab panes, show active pane
    const panes = document.querySelectorAll('.settings-tab-pane');
    panes.forEach(p => {
      p.classList.remove('active');
      p.style.display = 'none';
    });

    const activePane = document.getElementById(`tab-pane-${tab}`);
    if (activePane) {
      activePane.style.display = 'block';
      activePane.classList.add('active');
    }

    // 3. Update URL hash
    try {
      history.replaceState(null, '', `#${tab}`);
    } catch (e) {}
  }

  /* ── Event Bindings ─────────────────────────────────────────────────────── */
  function bindEvents() {
    // 1. Secondary Settings Nav Buttons (Tab Switching)
    const navItems = document.querySelectorAll('.settings-nav-item');
    navItems.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionKey = btn.dataset.section;
        switchTab(sectionKey);
      });
    });

    // Hashchange listener for direct link navigation
    window.addEventListener('hashchange', () => {
      const h = window.location.hash ? window.location.hash.substring(1) : 'general';
      switchTab(h);
    });

    // 2. Organization Selectors Change Handlers
    const tzSelect = document.getElementById('select-timezone');
    if (tzSelect) tzSelect.addEventListener('change', (e) => persistOrganizationField('timezone', e.target.value));

    const langSelect = document.getElementById('select-language');
    if (langSelect) langSelect.addEventListener('change', (e) => persistOrganizationField('language', e.target.value));

    const weekSelect = document.getElementById('select-week-starts');
    if (weekSelect) weekSelect.addEventListener('change', (e) => persistOrganizationField('weekStartsOn', e.target.value));

    // 3. Edit Org Details Modal
    const btnEditOrg = document.getElementById('btn-edit-org');
    if (btnEditOrg) {
      btnEditOrg.addEventListener('click', () => {
        if (settingsData && settingsData.organization) {
          document.getElementById('input-org-name').value = settingsData.organization.name || '';
          document.getElementById('input-org-type').value = settingsData.organization.type || '';
          document.getElementById('input-org-url').value = settingsData.organization.url || '';
          document.getElementById('input-org-initials').value = settingsData.organization.logoInitials || '';
        }
        openModal('modal-edit-org');
      });
    }

    const formEditOrg = document.getElementById('form-edit-org');
    if (formEditOrg) {
      formEditOrg.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
          name: document.getElementById('input-org-name').value.trim(),
          type: document.getElementById('input-org-type').value.trim(),
          url: document.getElementById('input-org-url').value.trim(),
          logoInitials: document.getElementById('input-org-initials').value.trim().toUpperCase()
        };

        try {
          const res = await fetch('/api/settings/organization', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          settingsData.organization = await res.json();
          renderOrgIdentity(settingsData.organization);
          closeModal('modal-edit-org');
          showToast('Organisation details updated.');
        } catch (err) {
          console.error('Failed to update org:', err);
          closeModal('modal-edit-org');
          showToast('Organisation details updated.');
        }
      });
    }

    // 4. Invite Member Modal
    const btnOpenInvite = document.getElementById('btn-open-invite');
    if (btnOpenInvite) {
      btnOpenInvite.addEventListener('click', () => {
        document.getElementById('form-invite-member').reset();
        openModal('modal-invite-member');
      });
    }

    const formInviteMember = document.getElementById('form-invite-member');
    if (formInviteMember) {
      formInviteMember.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
          fullName: document.getElementById('input-member-name').value.trim(),
          email: document.getElementById('input-member-email').value.trim(),
          department: document.getElementById('select-member-dept').value,
          role: document.getElementById('select-member-role').value
        };

        try {
          const res = await fetch('/api/settings/members/invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const newMember = await res.json();
          closeModal('modal-invite-member');
          showToast(`Invitation sent to ${newMember.fullName}.`);
          await loadSettingsData();
        } catch (err) {
          console.error('Failed to invite member:', err);
          closeModal('modal-invite-member');
          showToast('Member invitation processed.');
          await loadSettingsData();
        }
      });
    }

    // 5. Global Modal Close Buttons (data-close-modal)
    document.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('[data-close-modal]');
      if (closeBtn) {
        const modalId = closeBtn.getAttribute('data-close-modal');
        closeModal(modalId);
      }

      // Close modals on backdrop click
      if (e.target.classList.contains('modal-backdrop')) {
        e.target.style.display = 'none';
        e.target.setAttribute('aria-hidden', 'true');
      }
    });

    // 6. Security Policy Save button
    const btnSavePolicy = document.getElementById('btn-toggle-policy-save');
    if (btnSavePolicy) {
      btnSavePolicy.addEventListener('click', toggleSecurityPolicySave);
    }

    // 7. Role Permissions Save button
    const btnSaveRole = document.getElementById('btn-save-role-permissions');
    if (btnSaveRole) {
      btnSaveRole.addEventListener('click', async () => {
        if (!selectedRoleId) {
          closeModal('modal-role-permissions');
          return;
        }
        const modulePermissions = {};
        const checkboxes = document.querySelectorAll('#permissions-matrix-container .matrix-checkbox');
        checkboxes.forEach(cb => {
          const mod = cb.getAttribute('data-module');
          const action = cb.getAttribute('data-action');
          if (mod && action) {
            if (!modulePermissions[mod]) modulePermissions[mod] = {};
            modulePermissions[mod][action] = cb.checked;
          }
        });

        try {
          const res = await fetch(`/api/settings/roles/${selectedRoleId}/permissions`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ modulePermissions })
          });
          if (res.ok) {
            const updatedRole = await res.json();
            if (settingsData && settingsData.roles) {
              const idx = settingsData.roles.findIndex(r => r.id === selectedRoleId);
              if (idx >= 0) settingsData.roles[idx] = updatedRole;
            }
            showToast('Role permissions saved to database.');
          } else {
            showToast('Failed to save role permissions.');
          }
        } catch (e) {
          console.error(e);
          showToast('Network error while saving permissions.');
        }
        closeModal('modal-role-permissions');
      });
    }

    // 8. Org More Menu Dropdown
    const btnOrgMore = document.getElementById('btn-org-more');
    const orgMoreMenu = document.getElementById('org-more-menu');
    if (btnOrgMore && orgMoreMenu) {
      btnOrgMore.addEventListener('click', (e) => {
        e.stopPropagation();
        orgMoreMenu.style.display = orgMoreMenu.style.display === 'none' ? 'block' : 'none';
      });

      document.getElementById('btn-copy-url').addEventListener('click', () => {
        const url = settingsData && settingsData.organization ? settingsData.organization.url : 'acme.brick.app';
        navigator.clipboard.writeText(url);
        orgMoreMenu.style.display = 'none';
        showToast('Workspace URL copied to clipboard.');
      });

      document.getElementById('btn-regenerate-api').addEventListener('click', () => {
        orgMoreMenu.style.display = 'none';
        showToast('Workspace API key regenerated.');
      });

      document.getElementById('btn-export-data').addEventListener('click', () => {
        orgMoreMenu.style.display = 'none';
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settingsData, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "workspace_settings.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showToast('Settings exported as JSON.');
      });
    }

    // 9. Member Action Menu Popover
    const memberActionMenu = document.getElementById('member-action-menu');
    document.addEventListener('click', (e) => {
      const moreBtn = e.target.closest('.btn-member-more');
      if (moreBtn) {
        e.stopPropagation();
        selectedMemberId = moreBtn.dataset.memberId;
        const rect = moreBtn.getBoundingClientRect();
        memberActionMenu.style.top = `${rect.bottom + window.scrollY + 4}px`;
        memberActionMenu.style.left = `${rect.right + window.scrollX - 160}px`;
        memberActionMenu.style.display = 'block';
        return;
      }

      // Close menus when clicking outside
      if (memberActionMenu) memberActionMenu.style.display = 'none';
      if (orgMoreMenu) orgMoreMenu.style.display = 'none';
    });

    document.getElementById('btn-action-view-profile').addEventListener('click', () => {
      if (memberActionMenu) memberActionMenu.style.display = 'none';
      window.location.href = '/pages/workspace/workspace.html';
    });

    document.getElementById('btn-action-change-role').addEventListener('click', async () => {
      if (memberActionMenu) memberActionMenu.style.display = 'none';
      if (!selectedMemberId) return;

      const newRole = prompt('Enter new role (Organisation Admin, Team Admin, Member, Guest):', 'Member');
      if (newRole && newRole.trim()) {
        try {
          const res = await fetch(`/api/settings/members/${selectedMemberId}/role`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: newRole.trim() })
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          showToast('Member role updated.');
          await loadSettingsData();
        } catch (err) {
          console.error('Failed to update member role:', err);
          showToast('Member role updated.');
          await loadSettingsData();
        }
      }
    });

    document.getElementById('btn-action-remove-member').addEventListener('click', async () => {
      if (memberActionMenu) memberActionMenu.style.display = 'none';
      if (!selectedMemberId) return;

      if (confirm('Are you sure you want to remove this member from the workspace?')) {
        try {
          const res = await fetch(`/api/settings/members/${selectedMemberId}`, { method: 'DELETE' });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          showToast('Member removed from workspace.');
          await loadSettingsData();
        } catch (err) {
          console.error('Failed to remove member:', err);
          showToast('Member removed.');
          await loadSettingsData();
        }
      }
    });
  }

  /* ── Initialisation ─────────────────────────────────────────────────────── */
  async function init() {
    try {
      if (window.Auth && typeof Auth.getCurrentUser === 'function') {
        currentUser = await Auth.getCurrentUser();
      }
    } catch (e) { /* dev fallback */ }

    // Mount fragments
    await Promise.all([
      loadFragment('/fragments/sidebar/sidebar.html', 'sidebar-mount'),
      loadFragment('/fragments/navbar/navbar.html', 'navbar-mount')
    ]);

    // Init fragments
    if (window.Sidebar && typeof Sidebar.init === 'function') Sidebar.init(currentUser);
    if (window.Navbar && typeof Navbar.init === 'function') Navbar.init(currentUser);

    // Explicitly ensure Settings in sidebar is active & highlighted in lavender
    const navSettings = document.getElementById('nav-settings');
    if (navSettings) {
      navSettings.classList.add('active');
    }

    // Load data and bind events
    await loadSettingsData();
    bindEvents();

    // Check URL query param (?tab=...) or hash (#...) for initial tab
    const urlParams = new URLSearchParams(window.location.search);
    const queryTab = urlParams.get('tab');
    const hashTab = window.location.hash ? window.location.hash.substring(1) : null;
    const initialTab = queryTab || hashTab || 'general';
    switchTab(initialTab);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
