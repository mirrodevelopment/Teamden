/**
 * Teamden by shed — UI Helpers & Formatters (ui.js)
 * Utilities for formatting, safe rendering, toasts, and UI components.
 */

const UI = (() => {
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'No date';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return String(dateStr);
    }
  }

  function formatTime(instantStr) {
    if (!instantStr) return '';
    try {
      const d = new Date(instantStr);
      return d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '';
    }
  }

  function formatRelativeTime(instantStr) {
    if (!instantStr) return '';
    try {
      const then = new Date(instantStr).getTime();
      const now = Date.now();
      const diffSec = Math.floor((now - then) / 1000);

      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
      return formatDate(instantStr);
    } catch (e) {
      return '';
    }
  }

  function renderStatusBadge(status) {
    const s = String(status || '').toUpperCase();
    let badgeClass = 'badge-neutral';
    let label = s.replace(/_/g, ' ');

    switch (s) {
      case 'TODO':
        badgeClass = 'badge-todo';
        label = 'To Do';
        break;
      case 'IN_PROGRESS':
        badgeClass = 'badge-in-progress';
        label = 'In Progress';
        break;
      case 'IN_REVIEW':
        badgeClass = 'badge-in-progress';
        label = 'In Review';
        break;
      case 'BLOCKED':
        badgeClass = 'badge-blocked';
        label = 'Blocked';
        break;
      case 'COMPLETED':
        badgeClass = 'badge-completed';
        label = 'Completed';
        break;
      case 'CANCELLED':
        badgeClass = 'badge-cancelled';
        label = 'Cancelled';
        break;
      case 'ACTIVE':
        badgeClass = 'badge-active';
        label = 'Active';
        break;
      case 'PLANNING':
        badgeClass = 'badge-planning';
        label = 'Planning';
        break;
      case 'ON_HOLD':
        badgeClass = 'badge-on-hold';
        label = 'On Hold';
        break;
    }

    return `<span class="badge ${badgeClass}"><span class="badge-dot"></span>${escapeHtml(label)}</span>`;
  }

  function renderPriorityBadge(priority) {
    const p = String(priority || '').toUpperCase();
    let badgeClass = 'badge-neutral';

    switch (p) {
      case 'LOW':
        badgeClass = 'badge-low';
        break;
      case 'MEDIUM':
        badgeClass = 'badge-medium';
        break;
      case 'HIGH':
        badgeClass = 'badge-high';
        break;
      case 'URGENT':
        badgeClass = 'badge-urgent';
        break;
    }

    return `<span class="badge ${badgeClass}">${escapeHtml(p)}</span>`;
  }

  function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = `
        position: fixed;
        bottom: 1.5rem;
        right: 1.5rem;
        z-index: var(--z-toast);
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-width: 360px;
        width: 100%;
      `;
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `alert alert-${type === 'error' ? 'danger' : type}`;
    toast.style.cssText = `
      box-shadow: var(--shadow-lg);
      margin: 0;
      animation: fadeIn 0.2s ease;
    `;
    toast.innerHTML = `<span>${escapeHtml(message)}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  return {
    escapeHtml,
    formatDate,
    formatTime,
    formatRelativeTime,
    renderStatusBadge,
    renderPriorityBadge,
    showToast
  };
})();

window.UI = UI;
