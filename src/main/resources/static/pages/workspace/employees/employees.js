/**
 * Teamden by shed — Brick Employees / People & Roles Logic (employees.js)
 * Path: pages/workspace/employees/employees.js
 */

(function () {
  'use strict';

  let currentTab = 'PEOPLE';
  let activeEmployeeId = null;
  let directoryData = null;
  let searchDebounceTimer = null;

  document.addEventListener('DOMContentLoaded', async () => {
    await initShellFragments();
    setupEventListeners();
    await loadDirectory();
  });

  async function initShellFragments() {
    try {
      // 1. Mount Sidebar
      const sidebarMount = document.getElementById('sidebar-mount');
      if (sidebarMount) {
        const res = await fetch('/fragments/sidebar/sidebar.html?v=14');
        if (res.ok) {
          sidebarMount.innerHTML = await res.text();
          if (window.Sidebar && typeof window.Sidebar.init === 'function') {
            window.Sidebar.init({ activeOrganizationName: 'Acme Co.' });
          }
        }
      }

      // 2. Mount Navbar
      const navbarMount = document.getElementById('navbar-mount');
      if (navbarMount) {
        const res = await fetch('/fragments/navbar/navbar.html?v=14');
        if (res.ok) {
          navbarMount.innerHTML = await res.text();
          if (window.Navbar && typeof window.Navbar.init === 'function') {
            window.Navbar.init({
              fullName: 'Peter B.',
              initials: 'PB',
              activeOrganizationName: 'Acme Co.'
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to initialize shell fragments:', err);
    }
  }

  function setupEventListeners() {
    // 1. Main Tab Switching (People / Roles / Structure)
    const tabs = document.querySelectorAll('.emp-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        currentTab = tab.dataset.tab;
        switchView(currentTab);
      });
    });

    // 2. Search input in People tab
    const searchInput = document.getElementById('emp-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
          loadDirectory(e.target.value.trim(), activeEmployeeId);
        }, 250);
      });
    }

    // 3. Add Member Modal Triggers
    const openAddBtn = document.getElementById('btn-open-add-member');
    const inviteSubnav = document.getElementById('ws-tab-invitations');
    const modal = document.getElementById('add-employee-modal');
    const closeAddBtn = document.getElementById('btn-close-add-modal');
    const cancelAddBtn = document.getElementById('btn-cancel-add-modal');
    const draftAddBtn = document.getElementById('btn-draft-add-modal');
    const addForm = document.getElementById('add-employee-form');

    function openModal() {
      if (modal) {
        modal.style.display = 'flex';
        document.getElementById('emp-input-fullname')?.focus();
      }
    }

    function closeModal() {
      if (modal) {
        modal.style.display = 'none';
        addForm?.reset();
      }
    }

    if (openAddBtn) openAddBtn.addEventListener('click', openModal);
    if (inviteSubnav) inviteSubnav.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
    if (closeAddBtn) closeAddBtn.addEventListener('click', closeModal);
    if (cancelAddBtn) cancelAddBtn.addEventListener('click', closeModal);
    if (draftAddBtn) draftAddBtn.addEventListener('click', () => {
      showToast('Draft saved in workspace session');
      closeModal();
    });

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    // 4. Submit Add Employee Form
    if (addForm) {
      addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('emp-input-fullname')?.value.trim();
        const email = document.getElementById('emp-input-email')?.value.trim();
        const phone = document.getElementById('emp-input-phone')?.value.trim();
        const employeeIdNumber = document.getElementById('emp-input-idnum')?.value.trim();
        const jobTitle = document.getElementById('emp-input-jobtitle')?.value.trim();
        const departmentName = document.getElementById('emp-select-dept')?.value;
        const employmentType = document.getElementById('emp-select-type')?.value;
        const workLocation = document.getElementById('emp-input-location')?.value.trim();
        const roleTitle = document.getElementById('emp-select-role')?.value;
        const reportingManagerName = document.getElementById('emp-input-manager')?.value.trim();
        const respsRaw = document.getElementById('emp-input-resps')?.value.trim();
        const shortBio = document.getElementById('emp-input-bio')?.value.trim();

        if (!fullName || !email || !jobTitle) {
          showToast('Please fill in required fields (Name, Email, Job Title)');
          return;
        }

        const responsibilities = respsRaw
          ? respsRaw.split(',').map(s => s.trim()).filter(Boolean)
          : [];

        const payload = {
          fullName,
          email,
          phone,
          employeeIdNumber,
          jobTitle,
          departmentName,
          employmentType,
          workLocation,
          roleTitle,
          reportingManagerName,
          responsibilities,
          shortBio
        };

        try {
          const res = await fetch('/api/employees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            const created = await res.json();
            showToast(`Invitation sent to ${created.fullName}`);
            closeModal();
            await loadDirectory('', created.id);
          } else {
            const err = await res.json();
            showToast(err.message || 'Failed to add employee');
          }
        } catch (error) {
          console.error(error);
          showToast('Network error adding employee');
        }
      });
    }

    // 5. Drawer More Options Dropdown
    const optBtn = document.getElementById('btn-drawer-options');
    const menuDropdown = document.getElementById('drawer-menu-dropdown');
    if (optBtn && menuDropdown) {
      optBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menuDropdown.classList.toggle('show');
      });
      document.addEventListener('click', () => menuDropdown.classList.remove('show'));
    }

    // Menu item actions
    document.getElementById('menu-opt-edit')?.addEventListener('click', () => {
      showToast('Edit profile workflow opened');
    });
    document.getElementById('menu-opt-role')?.addEventListener('click', () => {
      showToast('Select role in Roles tab');
      document.getElementById('tab-roles')?.click();
    });
    document.getElementById('menu-opt-dept')?.addEventListener('click', () => {
      showToast('Department configuration updated');
    });
    document.getElementById('menu-opt-deactivate')?.addEventListener('click', async () => {
      if (activeEmployeeId && confirm('Are you sure you want to deactivate this employee?')) {
        await fetch(`/api/employees/${activeEmployeeId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'DEACTIVATED' })
        });
        showToast('Employee deactivated');
        await loadDirectory('', activeEmployeeId);
      }
    });

    // 6. Close Drawer on Mobile
    const closeDrawerBtn = document.getElementById('btn-close-profile-drawer');
    if (closeDrawerBtn) {
      closeDrawerBtn.addEventListener('click', () => {
        document.getElementById('employee-profile-drawer')?.classList.remove('mobile-open');
      });
    }

    // 7. Inline Add Responsibility Button
    const addRespBtn = document.getElementById('btn-add-responsibility-inline');
    if (addRespBtn) {
      addRespBtn.addEventListener('click', async () => {
        if (!activeEmployeeId) return;
        const title = prompt('Enter new responsibility title:');
        if (title && title.trim()) {
          try {
            const res = await fetch(`/api/employees/${activeEmployeeId}/responsibilities`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: title.trim(), primary: false })
            });
            if (res.ok) {
              showToast('Responsibility added');
              await refreshActiveEmployee();
            }
          } catch (e) {
            console.error(e);
          }
        }
      });
    }

    // 8. Create Role Button in Roles tab
    const createRoleBtn = document.getElementById('btn-create-role');
    if (createRoleBtn) {
      createRoleBtn.addEventListener('click', async () => {
        const name = prompt('Enter role name:');
        if (name && name.trim()) {
          const desc = prompt('Enter role description:');
          const res = await fetch('/api/employees/roles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name.trim(), description: desc || 'Custom role', permissionsSummary: 'Standard privileges' })
          });
          if (res.ok) {
            showToast(`Role "${name}" created`);
            await loadDirectory();
          }
        }
      });
    }

    // 9. Subnav tabs wiring
    document.getElementById('ws-tab-departments')?.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('tab-structure')?.click();
    });
    document.getElementById('ws-tab-roles-nav')?.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('tab-roles')?.click();
    });
    document.getElementById('ws-tab-structure-nav')?.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('tab-structure')?.click();
    });
  }

  function switchView(tabKey) {
    const viewPeople = document.getElementById('view-people');
    const viewRoles = document.getElementById('view-roles');
    const viewStructure = document.getElementById('view-structure');
    const searchWrap = document.getElementById('emp-search-filter-wrap');

    if (viewPeople) viewPeople.style.display = tabKey === 'PEOPLE' ? 'block' : 'none';
    if (viewRoles) viewRoles.style.display = tabKey === 'ROLES' ? 'block' : 'none';
    if (viewStructure) viewStructure.style.display = tabKey === 'STRUCTURE' ? 'block' : 'none';
    if (searchWrap) searchWrap.style.display = tabKey === 'PEOPLE' ? 'flex' : 'none';
  }

  async function loadDirectory(searchQuery, preferredActiveId) {
    try {
      const url = new URL('/api/employees', window.location.origin);
      if (searchQuery) url.searchParams.set('search', searchQuery);
      if (preferredActiveId || activeEmployeeId) {
        url.searchParams.set('activeId', preferredActiveId || activeEmployeeId);
      }

      const res = await fetch(url.toString());
      if (!res.ok) return;

      directoryData = await res.json();
      renderCounts(directoryData);
      renderEmployeeCards(directoryData.employees);
      renderRoles(directoryData.roles);
      renderStructure(directoryData.teamStructure);

      if (directoryData.activeEmployee) {
        activeEmployeeId = directoryData.activeEmployee.profile.id;
        renderActiveEmployeeDetail(directoryData.activeEmployee);
      }
    } catch (err) {
      console.error('Failed to load employee directory:', err);
    }
  }

  async function refreshActiveEmployee() {
    if (!activeEmployeeId) return;
    try {
      const res = await fetch(`/api/employees/${activeEmployeeId}`);
      if (res.ok) {
        const detail = await res.json();
        renderActiveEmployeeDetail(detail);
      }
    } catch (e) {
      console.error(e);
    }
  }

  function renderCounts(data) {
    const pCountEl = document.getElementById('people-tab-count');
    const rCountEl = document.getElementById('roles-tab-count');
    const deptMemberCount = document.getElementById('dept-member-count');

    if (pCountEl) pCountEl.textContent = data.peopleCount;
    if (rCountEl) rCountEl.textContent = data.rolesCount;
    if (deptMemberCount) deptMemberCount.textContent = data.employees ? data.employees.length : 4;
  }

  function renderEmployeeCards(employees) {
    const container = document.getElementById('employee-cards-container');
    if (!container) return;

    if (!employees || employees.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 3rem; text-align: center; color: var(--emp-text-muted);">
          <p style="font-size: 1.1rem; font-weight: 700; color: var(--emp-text-primary);">No employees found</p>
          <p style="font-size: 0.85rem;">Try adjusting your search criteria or add a new team member.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = employees.map(emp => {
      const themeClass = `employee-card--${emp.cardTheme || 'lavender'}`;
      const isSelected = activeEmployeeId === emp.id ? 'is-active' : '';
      const rCount = emp.responsibilitiesCount || 2;
      const iconSvg = emp.fullName === 'James L.'
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>`;

      return `
        <div class="employee-card ${themeClass} ${isSelected}" data-emp-id="${emp.id}">
          <div class="employee-card-top">
            <div class="card-avatar">${escapeHtml(emp.initials)}</div>
            <div class="card-header-info">
              <h3 class="card-full-name">${escapeHtml(emp.fullName)}</h3>
              <p class="card-job-title">${escapeHtml(emp.jobTitle)}</p>
            </div>
          </div>
          <p class="card-description">${escapeHtml(emp.shortBio || '')}</p>
          <div class="card-bottom-row">
            <div class="card-responsibilities-count">
              ${iconSvg}
              <span>${rCount} responsibilities</span>
            </div>
            <span class="card-arrow">&rarr;</span>
          </div>
        </div>
      `;
    }).join('');

    // Attach click events
    container.querySelectorAll('.employee-card').forEach(card => {
      card.addEventListener('click', async () => {
        container.querySelectorAll('.employee-card').forEach(c => c.classList.remove('is-active'));
        card.classList.add('is-active');
        activeEmployeeId = card.dataset.empId;
        await refreshActiveEmployee();

        // On mobile, slide open drawer
        if (window.innerWidth <= 1080) {
          document.getElementById('employee-profile-drawer')?.classList.add('mobile-open');
        }
      });
    });
  }

  function renderActiveEmployeeDetail(detail) {
    if (!detail || !detail.profile) return;
    const p = detail.profile;

    // Header
    const crumbEl = document.getElementById('drawer-member-crumb');
    const avatarEl = document.getElementById('drawer-avatar');
    const nameEl = document.getElementById('drawer-name');
    const titleEl = document.getElementById('drawer-job-title');
    const deptCompanyEl = document.getElementById('drawer-dept-company');
    const bioEl = document.getElementById('drawer-bio');
    const mentionLabel = document.getElementById('btn-mention-label');
    const ownsTitle = document.getElementById('drawer-owns-title');

    const firstName = p.fullName.split(' ')[0];

    if (crumbEl) crumbEl.textContent = `${p.departmentName.toUpperCase()} / ${p.employeeIdNumber || 'MEMBER 02'}`;
    if (avatarEl) {
      avatarEl.textContent = p.initials;
      avatarEl.className = 'profile-large-avatar';
      if (p.cardTheme === 'peach') avatarEl.style.backgroundColor = 'var(--emp-peach-bg)';
      else if (p.cardTheme === 'blue') avatarEl.style.backgroundColor = 'var(--emp-blue-bg)';
      else if (p.cardTheme === 'green') avatarEl.style.backgroundColor = 'var(--emp-green-bg)';
      else avatarEl.style.backgroundColor = 'var(--emp-lavender-bg)';
    }
    if (nameEl) nameEl.textContent = p.fullName;
    if (titleEl) titleEl.textContent = p.jobTitle;
    if (deptCompanyEl) deptCompanyEl.textContent = `${p.departmentName} · ${p.companyName || 'Acme Co.'}`;
    if (bioEl) bioEl.textContent = p.detailedBio || p.shortBio || 'Dedicated workspace contributor.';
    if (mentionLabel) mentionLabel.textContent = `Mention ${firstName}`;
    if (ownsTitle) ownsTitle.textContent = `What ${firstName} owns.`;

    // 1. Responsibilities
    const respContainer = document.getElementById('drawer-responsibilities-list');
    if (respContainer) {
      if (!detail.responsibilities || detail.responsibilities.length === 0) {
        respContainer.innerHTML = `<div style="font-size: 0.75rem; color: var(--emp-text-muted);">No responsibilities assigned.</div>`;
      } else {
        respContainer.innerHTML = detail.responsibilities.map((r, idx) => {
          const isHighlight = idx === 0 ? 'is-highlight' : '';
          return `
            <div class="resp-row ${isHighlight}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
              </svg>
              <span class="resp-title">${escapeHtml(r.title)}</span>
              <button class="resp-delete-btn" data-resp-id="${r.id}" title="Remove responsibility">&times;</button>
            </div>
          `;
        }).join('');

        respContainer.querySelectorAll('.resp-delete-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm('Remove this responsibility?')) {
              await fetch(`/api/employees/${activeEmployeeId}/responsibilities/${btn.dataset.respId}`, { method: 'DELETE' });
              showToast('Responsibility removed');
              await refreshActiveEmployee();
            }
          });
        });
      }
    }

    // 2. Work in motion
    const workContainer = document.getElementById('drawer-work-motion-list');
    if (workContainer) {
      if (!detail.workInMotion || detail.workInMotion.length === 0) {
        workContainer.innerHTML = `<div style="font-size: 0.75rem; color: var(--emp-text-muted);">No active tasks in progress.</div>`;
      } else {
        workContainer.innerHTML = detail.workInMotion.map(t => {
          const pillClass = t.statusTheme === 'blue'
            ? 'work-motion-status-pill--blue'
            : t.statusTheme === 'green'
            ? 'work-motion-status-pill--green'
            : 'work-motion-status-pill--peach';

          const iconSvg = t.completed
            ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
            : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg>`;

          return `
            <div class="work-motion-card">
              <div class="work-motion-left">
                ${iconSvg}
                <span class="work-motion-title">${escapeHtml(t.title)}</span>
              </div>
              <span class="work-motion-status-pill ${pillClass}">${escapeHtml(t.statusLabel)}</span>
            </div>
          `;
        }).join('');
      }
    }

    // 3. Working together
    const collabContainer = document.getElementById('drawer-working-together-list');
    if (collabContainer) {
      if (!detail.workingTogether || detail.workingTogether.length === 0) {
        collabContainer.innerHTML = `<div style="font-size: 0.75rem; color: var(--emp-text-muted);">No recent team collaborations.</div>`;
      } else {
        collabContainer.innerHTML = detail.workingTogether.map(c => `
          <div class="working-together-card">
            <div class="partner-avatar">${escapeHtml(c.partnerInitials)}</div>
            <div class="collab-info">
              <div class="collab-project-title">${escapeHtml(c.projectTitle)}</div>
              <p class="collab-status-text">With ${escapeHtml(c.partnerName)} · ${escapeHtml(c.statusLabel)}</p>
            </div>
          </div>
        `).join('');
      }
    }

    // 4. Shared knowledge
    const docsContainer = document.getElementById('drawer-shared-knowledge-list');
    if (docsContainer) {
      if (!detail.sharedKnowledge || detail.sharedKnowledge.length === 0) {
        docsContainer.innerHTML = `<div style="font-size: 0.75rem; color: var(--emp-text-muted);">No shared documents linked.</div>`;
      } else {
        docsContainer.innerHTML = detail.sharedKnowledge.map(d => `
          <a href="${escapeHtml(d.documentUrl)}" class="shared-doc-card">
            <div class="doc-icon-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
            </div>
            <div class="doc-details-info">
              <div class="doc-name">${escapeHtml(d.documentTitle)}</div>
              <p class="doc-meta">${escapeHtml(d.maintainedByLabel)}</p>
            </div>
          </a>
        `).join('');
      }
    }

    // Mention button toast
    document.getElementById('btn-mention-emp')?.addEventListener('click', () => {
      showToast(`@${p.fullName.replace(/\s+/g, '')} copied to clipboard`);
    });
  }

  function renderRoles(roles) {
    const container = document.getElementById('roles-cards-container');
    if (!container || !roles) return;

    container.innerHTML = roles.map(r => `
      <div class="role-card">
        <div>
          <div class="role-card-header">
            <h3 class="role-card-title">${escapeHtml(r.name)}</h3>
            <span class="role-emp-count-badge">${r.employeeCount} assigned</span>
          </div>
          <p class="role-card-desc">${escapeHtml(r.description || '')}</p>
        </div>
        <div>
          <div class="role-permissions-summary">${escapeHtml(r.permissionsSummary || 'Standard permissions')}</div>
          <div class="role-card-actions">
            <button class="role-action-link" onclick="window.EmployeesApp.showToast('Role permissions manager opened')">Manage permissions</button>
            <button class="role-action-link" onclick="window.EmployeesApp.showToast('Role duplicate created')">Duplicate</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  function renderStructure(tree) {
    const container = document.getElementById('structure-tree-container');
    if (!container || !tree) return;

    const deptsHtml = (tree.children || []).map(dept => {
      const leaves = (dept.children || []).map(emp => `
        <div class="dept-member-leaf">
          <div class="leaf-avatar">${escapeHtml(emp.initials)}</div>
          <div>
            <span class="leaf-name">${escapeHtml(emp.name)}</span>
            <span class="leaf-title"> · ${escapeHtml(emp.title)}</span>
          </div>
        </div>
      `).join('');

      return `
        <div class="dept-node-box">
          <div class="dept-node-header">
            <h4 class="dept-node-title">${escapeHtml(dept.name)}</h4>
            <span class="role-emp-count-badge">${dept.count} members</span>
          </div>
          <div class="dept-node-members">
            ${leaves || '<div style="font-size:0.75rem; color:var(--emp-text-muted);">No members assigned</div>'}
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="org-root-node">
        <div>
          <div class="org-root-name">${escapeHtml(tree.name)}</div>
          <p class="org-root-sub">${escapeHtml(tree.title)} · Total Workforce: ${tree.count} active employees</p>
        </div>
        <span class="emp-tab active" style="font-size:0.75rem;">Executive Board</span>
      </div>
      <div class="dept-nodes-grid">
        ${deptsHtml}
      </div>
    `;
  }

  function showToast(msg) {
    const toast = document.getElementById('emp-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
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

  window.EmployeesApp = {
    showToast,
    loadDirectory
  };

})();
