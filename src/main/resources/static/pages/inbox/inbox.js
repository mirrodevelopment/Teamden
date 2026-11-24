/**
 * Teamden by shed — Brick Inbox & Notifications Logic (inbox.js)
 * Path: pages/inbox/inbox.js
 */

(function () {
  'use strict';

  const API_BASE = '/api/inbox';
  let currentTab = 'ALL';
  let currentFilter = 'ALL';
  let activeItemId = null;
  let currentData = null;

  // Initialize Shell & Page Data
  document.addEventListener('DOMContentLoaded', async () => {
    await initShellFragments();
    setupEventListeners();
    await loadNotifications();
  });

  async function initShellFragments() {
    try {
      let currentUser = null;
      try {
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          currentUser = await userRes.json();
        }
      } catch (e) {
        console.warn('Could not fetch authenticated user', e);
      }

      // 1. Mount Sidebar
      const sidebarMount = document.getElementById('sidebar-mount');
      if (sidebarMount) {
        const res = await fetch('/fragments/sidebar/sidebar.html?v=14');
        if (res.ok) {
          sidebarMount.innerHTML = await res.text();
          if (window.Sidebar && typeof window.Sidebar.init === 'function') {
            window.Sidebar.init(currentUser);
          }
        }
      }

      // 2. Mount Navbar
      const navbarMount = document.getElementById('navbar-mount');
      if (navbarMount) {
        const res = await fetch('/fragments/navbar/navbar.html?v=15');
        if (res.ok) {
          navbarMount.innerHTML = await res.text();
          if (window.Navbar && typeof window.Navbar.init === 'function') {
            window.Navbar.init(currentUser);
          }
        }
      }
    } catch (err) {
      console.error('Failed to initialize shell fragments:', err);
    }
  }

  function setupEventListeners() {
    // Tab switching
    const tabs = document.querySelectorAll('.inbox-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        currentTab = tab.dataset.tab;
        loadNotifications();
      });
    });

    // Secondary filter pills
    const pills = document.querySelectorAll('.filter-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentFilter = pill.dataset.filter;
        loadNotifications();
      });
    });

    // Mark all as read
    const markAllBtn = document.getElementById('btn-mark-all-read');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', async () => {
        try {
          const res = await fetch(`${API_BASE}/mark-all-read`, { method: 'POST' });
          if (res.ok) {
            await loadNotifications();
            showToast('All notifications marked as read');
          }
        } catch (e) {
          console.error(e);
        }
      });
    }

    // Action in Focus button
    const focusBtn = document.getElementById('btn-focus-action');
    if (focusBtn) {
      focusBtn.addEventListener('click', () => {
        if (currentData && currentData.activeItem) {
          openDetailDrawer(currentData.activeItem);
        }
      });
    }

    // Controls
    const snoozeBtn = document.getElementById('btn-control-snooze');
    if (snoozeBtn) {
      snoozeBtn.addEventListener('click', async () => {
        if (currentData && currentData.activeItem) {
          await toggleSnooze(currentData.activeItem.id);
        }
      });
    }

    const muteBtn = document.getElementById('btn-control-mute');
    if (muteBtn) {
      muteBtn.addEventListener('click', async () => {
        if (currentData && currentData.activeItem) {
          await toggleMute(currentData.activeItem.id);
        }
      });
    }

    const prefsBtn = document.getElementById('btn-control-preferences');
    if (prefsBtn) {
      prefsBtn.addEventListener('click', () => {
        showToast('Notification preferences opened');
      });
    }

    // Drawer close handlers
    const closeBtn = document.getElementById('btn-close-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    if (closeBtn) closeBtn.addEventListener('click', closeDetailDrawer);
    if (backdrop) backdrop.addEventListener('click', closeDetailDrawer);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDetailDrawer();
    });

    // Drawer action buttons
    const drawerPrimaryBtn = document.getElementById('btn-drawer-primary');
    if (drawerPrimaryBtn) {
      drawerPrimaryBtn.addEventListener('click', async () => {
        if (activeItemId) {
          await executeAction(activeItemId, 'APPROVE');
          closeDetailDrawer();
        }
      });
    }

    const drawerReadBtn = document.getElementById('btn-drawer-read');
    if (drawerReadBtn) {
      drawerReadBtn.addEventListener('click', async () => {
        if (activeItemId) {
          await markRead(activeItemId);
          closeDetailDrawer();
        }
      });
    }

    const drawerArchiveBtn = document.getElementById('btn-drawer-archive');
    if (drawerArchiveBtn) {
      drawerArchiveBtn.addEventListener('click', async () => {
        if (activeItemId) {
          await toggleArchive(activeItemId);
          closeDetailDrawer();
        }
      });
    }
  }

  async function loadNotifications(preserveActiveId) {
    try {
      let url = new URL(API_BASE, window.location.origin);
      url.searchParams.set('tab', currentTab);
      url.searchParams.set('filter', currentFilter);
      if (preserveActiveId || activeItemId) {
        url.searchParams.set('activeItemId', preserveActiveId || activeItemId);
      }

      let res = await fetch(url.toString());
      if (!res.ok) {
        // Fallback to legacy endpoint if needed
        url = new URL('/api/notifications', window.location.origin);
        url.searchParams.set('tab', currentTab);
        url.searchParams.set('filter', currentFilter);
        if (preserveActiveId || activeItemId) {
          url.searchParams.set('activeItemId', preserveActiveId || activeItemId);
        }
        res = await fetch(url.toString());
        if (!res.ok) return;
      }

      currentData = await res.json();
      renderCounts(currentData.counts);
      renderAttentionQueue(currentData.attentionQueue);
      renderRegister(currentData.updatesToday, currentData.updatesEarlier);
      if (currentData.activeItem) {
        activeItemId = currentData.activeItem.id;
        renderActionInFocus(currentData.activeItem);
      } else {
        activeItemId = null;
        renderActionInFocus(null);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }

  function renderCounts(counts) {
    if (!counts) return;

    // Header breadcrumb total
    const totalEl = document.getElementById('inbox-total-count');
    if (totalEl) {
      totalEl.textContent = counts.all != null ? counts.all : 0;
    }

    // Tab badges
    const bAll = document.getElementById('badge-all');
    if (bAll) bAll.textContent = counts.all != null ? counts.all : 0;
    const bAction = document.getElementById('badge-needs-action');
    if (bAction) bAction.textContent = counts.needsAction != null ? counts.needsAction : 0;
    const bUpdates = document.getElementById('badge-updates');
    if (bUpdates) bUpdates.textContent = counts.updates != null ? counts.updates : 0;
    const bArchived = document.getElementById('badge-archived');
    if (bArchived) bArchived.textContent = counts.archived != null ? counts.archived : 0;

    // Secondary filter pills
    const pAll = document.getElementById('pill-count-all');
    if (pAll) pAll.textContent = counts.all != null ? counts.all : 0;
    const pUnread = document.getElementById('pill-count-unread');
    if (pUnread) pUnread.textContent = counts.unread != null ? counts.unread : 0;
    const pMentions = document.getElementById('pill-count-mentions');
    if (pMentions) pMentions.textContent = counts.mentions != null ? counts.mentions : 0;
    const pFollowing = document.getElementById('pill-count-following');
    if (pFollowing) pFollowing.textContent = counts.following != null ? counts.following : 0;

    // Update Attention subtitle count
    const attentionSub = document.getElementById('attention-hero-subtitle');
    if (attentionSub) {
      const count = counts.needsAction != null ? counts.needsAction : 0;
      if (count === 0) {
        attentionSub.textContent = 'No requests waiting for a response.';
      } else if (count === 1) {
        attentionSub.textContent = 'One request is waiting for a response.';
      } else if (count === 2) {
        attentionSub.textContent = 'Two requests are waiting for a response.';
      } else if (count === 3) {
        attentionSub.textContent = 'Three requests are waiting for a response.';
      } else {
        attentionSub.textContent = `${count} requests are waiting for a response.`;
      }
    }

    // Update sidebar badge
    const sideBadge = document.getElementById('sidebar-inbox-count');
    if (sideBadge) {
      const unreadCount = counts.unread != null ? counts.unread : 0;
      sideBadge.textContent = unreadCount;
      sideBadge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
    }

    // Update navbar bell count badge
    const topbarBellCount = document.getElementById('topbar-bell-count');
    if (topbarBellCount) {
      const unreadCount = counts.unread != null ? Number(counts.unread) : 0;
      if (unreadCount > 0) {
        topbarBellCount.textContent = unreadCount > 99 ? '99+' : unreadCount;
        topbarBellCount.style.display = 'inline-flex';
      } else {
        topbarBellCount.textContent = '0';
        topbarBellCount.style.display = 'none';
      }
    }
  }

  function renderAttentionQueue(items) {
    const container = document.getElementById('attention-cards-container');
    const section = document.getElementById('attention-queue-section');
    if (!container || !section) return;

    if (!items || items.length === 0) {
      if (currentTab === 'NEEDS_ACTION' || currentTab === 'ALL') {
        container.innerHTML = '<div style="padding: 16px; font-size: 13px; color: var(--dash-text-muted);">No actionable requests at this moment.</div>';
      } else {
        section.style.display = 'none';
        return;
      }
    } else {
      section.style.display = 'flex';
    }

    container.innerHTML = items.map((item, index) => {
      const pastelClass = index === 0 ? 'attention-row-highlight-peach' : index === 1 ? 'attention-row-blue-icon' : 'attention-row-purple-icon';
      const isSelected = activeItemId === item.id ? 'active-selected' : '';

      let iconSvg = '';
      if (item.itemType === 'APPROVAL') {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <polyline points="9 11 12 14 15 10"></polyline>
        </svg>`;
      } else if (item.itemType === 'FEEDBACK') {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>`;
      } else {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="16 3 21 3 21 8"></polyline>
          <line x1="4" y1="20" x2="21" y2="3"></line>
          <polyline points="21 16 21 21 16 21"></polyline>
          <line x1="15" y1="15" x2="21" y2="21"></line>
          <line x1="4" y1="4" x2="9" y2="9"></line>
        </svg>`;
      }

      return `
        <div class="attention-item-card ${pastelClass} ${isSelected}" data-id="${item.id}" role="button" tabindex="0">
          <div class="attention-card-left">
            <div class="attention-icon-box">${iconSvg}</div>
            <div class="attention-card-text">
              <span class="attention-card-title">${escapeHtml(item.title)}</span>
              <span class="attention-card-subtitle">${escapeHtml(item.subtitle || '')}</span>
            </div>
          </div>
          <span class="attention-arrow">&rarr;</span>
        </div>
      `;
    }).join('');

    // Attach click handlers
    container.querySelectorAll('.attention-item-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        const item = items.find(i => i.id === id);
        if (item) {
          activeItemId = item.id;
          container.querySelectorAll('.attention-item-card').forEach(c => c.classList.remove('active-selected'));
          document.querySelectorAll('.register-item-row').forEach(r => r.classList.remove('active-selected'));
          card.classList.add('active-selected');
          renderActionInFocus(item);
        }
      });
      card.addEventListener('dblclick', () => {
        const id = card.dataset.id;
        const item = items.find(i => i.id === id);
        if (item) openDetailDrawer(item);
      });
    });
  }

  function renderRegister(todayItems, earlierItems) {
    const todayContainer = document.getElementById('timeline-items-today');
    const earlierContainer = document.getElementById('timeline-items-earlier');
    const groupToday = document.getElementById('group-today');
    const groupEarlier = document.getElementById('group-earlier');

    const hasToday = todayItems && todayItems.length > 0;
    const hasEarlier = earlierItems && earlierItems.length > 0;

    if (groupToday) {
      if (!hasToday) {
        groupToday.style.display = 'none';
        if (todayContainer) todayContainer.innerHTML = '';
      } else {
        groupToday.style.display = 'flex';
        todayContainer.innerHTML = todayItems.map(item => renderRegisterRow(item)).join('');
      }
    }

    if (groupEarlier) {
      if (!hasEarlier) {
        groupEarlier.style.display = 'none';
        if (earlierContainer) earlierContainer.innerHTML = '';
      } else {
        groupEarlier.style.display = 'flex';
        earlierContainer.innerHTML = earlierItems.map(item => renderRegisterRow(item)).join('');
      }
    }

    let emptyEl = document.getElementById('register-empty-msg');
    if (!hasToday && !hasEarlier) {
      if (!emptyEl) {
        emptyEl = document.createElement('div');
        emptyEl.id = 'register-empty-msg';
        emptyEl.style.cssText = 'padding: 24px 16px; font-size: 13px; color: var(--dash-text-muted); text-align: center;';
        emptyEl.textContent = 'No updates in this view.';
        const container = document.getElementById('register-timeline-container');
        if (container) container.appendChild(emptyEl);
      } else {
        emptyEl.style.display = 'block';
      }
    } else if (emptyEl) {
      emptyEl.style.display = 'none';
    }

    // Attach click handlers
    const allRows = document.querySelectorAll('.register-item-row');
    const allItems = [...(todayItems || []), ...(earlierItems || [])];

    allRows.forEach(row => {
      row.addEventListener('click', () => {
        const id = row.dataset.id;
        const item = allItems.find(i => i.id === id);
        if (item) {
          activeItemId = item.id;
          allRows.forEach(r => r.classList.remove('active-selected'));
          document.querySelectorAll('.attention-item-card').forEach(c => c.classList.remove('active-selected'));
          row.classList.add('active-selected');
          renderActionInFocus(item);
        }
      });
      row.addEventListener('dblclick', () => {
        const id = row.dataset.id;
        const item = allItems.find(i => i.id === id);
        if (item) openDetailDrawer(item);
      });
    });
  }

  function renderRegisterRow(item) {
    const isSelected = activeItemId === item.id ? 'active-selected' : '';
    const isUnread = !item.read ? 'unread' : '';

    let leftGraphic = '';
    if (item.requesterInitials && item.itemType === 'MENTION') {
      leftGraphic = `<div class="register-avatar">${escapeHtml(item.requesterInitials)}</div>`;
    } else if (item.itemType === 'ASSIGNMENT') {
      leftGraphic = `<div class="register-icon-box blue">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <line x1="3" y1="6" x2="3.01" y2="6"></line>
          <line x1="3" y1="12" x2="3.01" y2="12"></line>
          <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
      </div>`;
    } else if (item.itemType === 'DECISION') {
      leftGraphic = `<div class="register-icon-box green">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>`;
    } else {
      leftGraphic = `<div class="register-icon-box amber">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </div>`;
    }

    const quoteHtml = item.quote ? `<div class="register-row-quote">${escapeHtml(item.quote)}</div>` : '';
    const unreadDot = !item.read ? '<span class="unread-dot"></span>' : '';

    return `
      <div class="register-item-row ${isUnread} ${isSelected}" data-id="${item.id}" role="button" tabindex="0">
        <div class="register-row-left">
          ${leftGraphic}
          <div class="register-row-content">
            <span class="register-row-title">${escapeHtml(item.title)}</span>
            ${quoteHtml}
            <span class="register-row-meta">${escapeHtml(item.subtitle || '')}</span>
          </div>
        </div>
        <div class="register-row-right">
          ${unreadDot}
          <span class="register-arrow">&rarr;</span>
        </div>
      </div>
    `;
  }

  function renderActionInFocus(item) {
    const titleEl = document.getElementById('focus-item-title');
    const dueEl = document.getElementById('focus-item-due');
    const descEl = document.getElementById('focus-item-desc');
    const metaListEl = document.getElementById('focus-meta-list');
    const projectTitleEl = document.getElementById('focus-project-title');
    const avatarEl = document.getElementById('focus-requester-avatar');
    const nameEl = document.getElementById('focus-requester-name');
    const docTitleEl = document.getElementById('focus-doc-title');
    const actionBtn = document.getElementById('btn-focus-action');
    const btnLabelEl = document.getElementById('focus-btn-label');

    if (!item) {
      if (titleEl) titleEl.textContent = 'No item selected';
      if (dueEl) dueEl.style.display = 'none';
      if (descEl) descEl.textContent = 'When an update or request requires attention, it will appear here.';
      if (metaListEl) metaListEl.style.display = 'none';
      if (actionBtn) actionBtn.style.display = 'none';
      return;
    }

    if (titleEl) titleEl.textContent = item.title;
    if (dueEl) {
      dueEl.textContent = item.dueDateStr || '';
      dueEl.style.display = item.dueDateStr ? 'inline-block' : 'none';
    }
    if (descEl) descEl.textContent = item.description || item.subtitle || '';
    if (metaListEl) metaListEl.style.display = 'flex';
    if (projectTitleEl) projectTitleEl.textContent = item.projectTitle || 'Workspace Project';
    if (avatarEl) avatarEl.textContent = item.requesterInitials || 'TD';
    if (nameEl) nameEl.textContent = item.requesterName || 'Team Lead';
    if (docTitleEl) docTitleEl.textContent = item.supportingDocTitle || 'Reference Document';
    if (actionBtn) actionBtn.style.display = 'flex';
    if (btnLabelEl) btnLabelEl.textContent = item.actionLabel ? `${item.actionLabel} \u2192` : 'Review decision \u2192';
  }

  function openDetailDrawer(item) {
    activeItemId = item.id;
    const drawer = document.getElementById('inbox-detail-drawer');
    const backdrop = document.getElementById('drawer-backdrop');

    // Populate drawer elements
    const titleEl = document.getElementById('drawer-item-title');
    const badgeEl = document.getElementById('drawer-item-badge');
    const projectEl = document.getElementById('drawer-project-name');
    const requesterEl = document.getElementById('drawer-requester-name');
    const dueEl = document.getElementById('drawer-due-date');
    const statusEl = document.getElementById('drawer-status');
    const descEl = document.getElementById('drawer-description');
    const quoteSection = document.getElementById('drawer-quote-section');
    const quoteText = document.getElementById('drawer-quote-text');
    const docName = document.getElementById('drawer-doc-name');
    const primaryBtn = document.getElementById('btn-drawer-primary');

    if (titleEl) titleEl.textContent = item.title;
    if (badgeEl) badgeEl.textContent = item.itemType || 'UPDATE';
    if (projectEl) projectEl.textContent = item.projectTitle || 'General Workspace';
    if (requesterEl) requesterEl.textContent = item.requesterName || 'Colleague';
    if (dueEl) dueEl.textContent = item.dueDateStr || 'No due date';
    if (statusEl) statusEl.textContent = item.read ? 'Completed / Read' : 'Action Pending';
    if (descEl) descEl.textContent = item.description || item.subtitle || '';

    if (quoteSection && quoteText) {
      if (item.quote) {
        quoteText.textContent = item.quote;
        quoteSection.style.display = 'flex';
      } else {
        quoteSection.style.display = 'none';
      }
    }

    if (docName) docName.textContent = item.supportingDocTitle || 'Workspace Asset';
    if (primaryBtn) primaryBtn.textContent = `${item.actionLabel || 'Review decision'} \u2192`;

    if (drawer) drawer.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
  }

  function closeDetailDrawer() {
    const drawer = document.getElementById('inbox-detail-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    if (drawer) drawer.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
  }

  async function markRead(id) {
    try {
      const res = await fetch(`${API_BASE}/${id}/read`, { method: 'PUT' });
      if (res.ok) {
        await loadNotifications(id);
        showToast('Notification marked as read');
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function toggleArchive(id) {
    try {
      const res = await fetch(`${API_BASE}/${id}/archive`, { method: 'PUT' });
      if (res.ok) {
        await loadNotifications();
        showToast('Notification archive status updated');
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function toggleSnooze(id) {
    try {
      const res = await fetch(`${API_BASE}/${id}/snooze`, { method: 'PUT' });
      if (res.ok) {
        await loadNotifications(id);
        showToast('Notification snoozed for 2 hours');
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function toggleMute(id) {
    try {
      const res = await fetch(`${API_BASE}/${id}/mute`, { method: 'PUT' });
      if (res.ok) {
        await loadNotifications(id);
        showToast('Thread notifications muted');
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function executeAction(id, action) {
    try {
      const res = await fetch(`${API_BASE}/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: action })
      });
      if (res.ok) {
        await loadNotifications();
        showToast('Decision reviewed and recorded successfully');
      }
    } catch (e) {
      console.error(e);
    }
  }

  function showToast(msg) {
    let toast = document.getElementById('inbox-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'inbox-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: var(--dash-hero-bg);
        color: var(--dash-text-white);
        padding: 12px 20px;
        border-radius: var(--radius-md);
        font-size: 13px;
        font-weight: 700;
        z-index: 9999;
        box-shadow: var(--shadow-lg);
        transition: opacity var(--transition-normal);
        pointer-events: none;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => {
      toast.style.opacity = '0';
    }, 2800);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
