/**
 * Teamden / Brick — Standalone Create Project Controller (create-project.js)
 * Path: pages/projects/create-project/create-project.js
 * Eradicates raw-coded mock data; all options & persistence sourced via PostgreSQL APIs.
 */
(function (window) {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    initSharedFragments();
    loadProjectOptions();
    initDates();
  });

  /**
   * Set default start date to today
   */
  function initDates() {
    const startInput = document.getElementById('project-start');
    if (startInput && !startInput.value) {
      startInput.value = new Date().toISOString().split('T')[0];
    }
  }

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
   * Fetch project options (leads, statuses, etc.) from database
   */
  async function loadProjectOptions() {
    try {
      const res = await fetch('/api/projects/options');
      if (!res.ok) {
        console.warn('Could not load project options from database, status:', res.status);
        return;
      }
      const data = await res.json();

      const ownerSelect = document.getElementById('project-owner');
      if (ownerSelect && data.owners) {
        ownerSelect.innerHTML = '';
        if (data.owners.length === 0) {
          const opt = document.createElement('option');
          opt.value = '';
          opt.textContent = 'Current User (Default)';
          ownerSelect.appendChild(opt);
        } else {
          data.owners.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.id;
            opt.textContent = `${u.name} (${u.role || 'Member'})`;
            ownerSelect.appendChild(opt);
          });
        }
      }
    } catch (err) {
      console.warn('Error fetching project options:', err);
    }
  }

  /**
   * Form submit handler
   */
  window.submitStandaloneProject = async function () {
    const errorBanner = document.getElementById('form-error-banner');
    if (errorBanner) {
      errorBanner.style.display = 'none';
      errorBanner.textContent = '';
    }

    const nameInput = document.getElementById('project-name');
    const descInput = document.getElementById('project-desc');
    const ownerSelect = document.getElementById('project-owner');
    const typeSelect = document.getElementById('project-type');
    const statusSelect = document.getElementById('project-status');
    const prioritySelect = document.getElementById('project-priority');
    const healthSelect = document.getElementById('project-health');
    const startInput = document.getElementById('project-start');
    const dueInput = document.getElementById('project-due');
    const saveBtn = document.getElementById('btn-save-project');

    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) {
      showError('Please provide a project name.');
      if (nameInput) nameInput.focus();
      return;
    }

    const payload = {
      name: name,
      description: descInput ? descInput.value.trim() : '',
      ownerId: ownerSelect && ownerSelect.value ? ownerSelect.value : null,
      projectType: typeSelect ? typeSelect.value : 'General',
      status: statusSelect ? statusSelect.value : 'ACTIVE',
      priority: prioritySelect ? prioritySelect.value : 'MEDIUM',
      health: healthSelect ? healthSelect.value : 'ON_TRACK',
      startDate: startInput && startInput.value ? startInput.value : null,
      dueDate: dueInput && dueInput.value ? dueInput.value : null
    };

    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span>Saving Project...</span>';
    }

    try {
      const res = await fetch('/api/projects', {
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

      // Success -> Redirect to projects list
      window.location.href = '/pages/projects/projects.html?created=project';
    } catch (err) {
      showError(err.message || 'Failed to save project to database. Please try again.');
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<span>Create Project & Return</span><span class="btn-arrow">→</span>';
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
