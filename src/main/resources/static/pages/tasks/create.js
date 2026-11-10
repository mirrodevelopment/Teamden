/**
 * Teamden / Brick — Standalone Create Task Controller (create.js)
 * Path: pages/tasks/create.js
 */
(function (window) {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    initSharedFragments();
    initUrlParams();
    loadOptions();
  });

  /**
   * Load shared sidebar and navbar fragments
   */
  async function initSharedFragments() {
    try {
      const [sidebarRes, navbarRes] = await Promise.all([
        fetch('/fragments/sidebar/sidebar.html'),
        fetch('/fragments/navbar/navbar.html')
      ]);

      if (sidebarRes.ok) {
        const sidebarHtml = await sidebarRes.text();
        const sidebarMount = document.getElementById('sidebar-mount');
        if (sidebarMount) {
          sidebarMount.innerHTML = sidebarHtml;
          if (window.Sidebar && typeof window.Sidebar.init === 'function') {
            window.Sidebar.init();
          }
        }
      }

      if (navbarRes.ok) {
        const navbarHtml = await navbarRes.text();
        const navbarMount = document.getElementById('navbar-mount');
        if (navbarMount) {
          navbarMount.innerHTML = navbarHtml;
          if (window.Navbar && typeof window.Navbar.init === 'function') {
            window.Navbar.init();
          }
        }
      }
    } catch (e) {
      console.warn('Could not load shared fragments:', e);
    }
  }

  /**
   * Inspect URL params (?column=NOW|NEXT|LATER)
   */
  function initUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const colParam = (params.get('column') || 'NOW').toUpperCase();
    const colSelect = document.getElementById('task-col');
    const badgeEl = document.getElementById('target-col-badge');

    if (colSelect && ['NOW', 'NEXT', 'LATER'].includes(colParam)) {
      colSelect.value = colParam;
      if (badgeEl) badgeEl.textContent = `KANBAN / ${colParam}`;
    }

    if (colSelect) {
      colSelect.addEventListener('change', () => {
        if (badgeEl) badgeEl.textContent = `KANBAN / ${colSelect.value}`;
      });
    }
  }

  /**
   * Fetch project & assignee options from database
   */
  async function loadOptions() {
    try {
      const res = await fetch('/api/tasks/options');
      if (!res.ok) {
        console.warn('Could not load task options from database, status:', res.status);
        return;
      }
      const data = await res.json();

      const projectSelect = document.getElementById('task-project');
      if (projectSelect && data.projects) {
        projectSelect.innerHTML = '<option value="">General Workspace (No Project)</option>';
        data.projects.forEach(p => {
          const opt = document.createElement('option');
          opt.value = p.id;
          opt.textContent = p.name;
          projectSelect.appendChild(opt);
        });
      }

      const assigneeSelect = document.getElementById('task-assignee');
      if (assigneeSelect && data.assignees) {
        assigneeSelect.innerHTML = '<option value="">Assign to Me</option>';
        data.assignees.forEach(u => {
          const opt = document.createElement('option');
          opt.value = u.id;
          opt.textContent = `${u.fullName} (${u.email})`;
          assigneeSelect.appendChild(opt);
        });
      }
    } catch (err) {
      console.warn('Error fetching task options:', err);
    }
  }

  /**
   * Form submit handler
   */
  window.submitStandaloneTask = async function () {
    const errorBanner = document.getElementById('form-error-banner');
    if (errorBanner) {
      errorBanner.style.display = 'none';
      errorBanner.textContent = '';
    }

    const titleInput = document.getElementById('task-title');
    const descInput = document.getElementById('task-desc');
    const projectSelect = document.getElementById('task-project');
    const assigneeSelect = document.getElementById('task-assignee');
    const colSelect = document.getElementById('task-col');
    const prioritySelect = document.getElementById('task-priority');
    const dueInput = document.getElementById('task-due');
    const saveBtn = document.getElementById('btn-save-task');

    const title = titleInput ? titleInput.value.trim() : '';
    if (!title) {
      showError('Please provide a task title.');
      if (titleInput) titleInput.focus();
      return;
    }

    const payload = {
      title: title,
      description: descInput ? descInput.value.trim() : '',
      projectId: projectSelect && projectSelect.value ? projectSelect.value : null,
      assigneeId: assigneeSelect && assigneeSelect.value ? assigneeSelect.value : null,
      kanbanColumn: colSelect ? colSelect.value : 'NOW',
      priority: prioritySelect ? prioritySelect.value : 'HIGH',
      dueDate: dueInput && dueInput.value ? dueInput.value : null
    };

    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span>Saving Task...</span>';
    }

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Server returned error ${res.status}`);
      }

      // Success -> Redirect to dashboard
      window.location.href = '/pages/dashboard/dashboard.html?created=task';
    } catch (err) {
      showError(err.message || 'Failed to save task to database. Please try again.');
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<span>Create Task & Return</span><span class="btn-arrow">→</span>';
      }
    }
  };

  function showError(msg) {
    const errorBanner = document.getElementById('form-error-banner');
    if (errorBanner) {
      errorBanner.textContent = msg;
      errorBanner.style.display = 'block';
      errorBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      alert(msg);
    }
  }

})(window);
