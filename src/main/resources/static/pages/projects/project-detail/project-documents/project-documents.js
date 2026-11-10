/**
 * Teamden / Brick — Project Documents Tab Controller (project-documents.js)
 * Path: pages/project/project-documents/project-documents.js
 *
 * Responsibilities:
 * 1. Mounts and renders the 3-region Documents workspace (Library, Viewer, Linked Task).
 * 2. Fetches live data from /api/projects/{id}/documents with resilient fallback.
 * 3. Document selection, real-time search filtering, and category pill filtering.
 * 4. Rich text inline toolbar formatting simulations and text highlights.
 * 5. Create Linked Task panel: editable description, assignee, due date, submission, and linking.
 * 6. Decision register cards with linked task badges navigating to Tasks tab.
 * 7. Next Steps checklist interactive completion toggles.
 */

(function (window) {
  'use strict';

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Baseline empty state data
  const emptyDocumentsData = {
    id: '',
    breadcrumb: 'PROJECTS',
    title: 'Project Documents',
    owner: 'Team',
    dueDate: '',
    status: 'Active',
    library: {
      title: 'PROJECT LIBRARY',
      categories: ['All', 'Notes', 'Plans', 'Design', 'Other'],
      activeCategory: 'All',
      documents: []
    },
    activeDocument: null,
    collaborators: [],
    linkedTasks: [],
    recordedDecisions: [],
    nextSteps: []
  };

  const State = {
    projectId: '',
    data: emptyDocumentsData,
    selectedDocId: null,
    activeCategory: 'All',
    searchQuery: '',
    isLibraryCollapsed: false,
    recordAsDecision: false
  };

  /**
   * Main ProjectDocuments Controller Object
   */
  const ProjectDocuments = {
    container: null,
    projectId: '',

    /**
     * Mounts the Project Documents component into target DOM container
     */
    async mount(container, projectId, options = {}) {
      if (!container) return;
      this.container = container;
      this.projectId = projectId || '';
      State.projectId = this.projectId;

      // 1. Load HTML fragment if not already injected
      if (!container.querySelector('#documents-workspace-split')) {
        try {
          const res = await fetch(`project-documents/project-documents.html?v=${Date.now()}`);
          if (res.ok) {
            container.innerHTML = await res.text();
          } else {
            console.warn('Failed loading project-documents.html fragment, check network path.');
          }
        } catch (err) {
          console.warn('Error loading project-documents.html fragment:', err);
        }
      }

      // 2. Fetch live data from /api/projects/{id}/documents or fallback
      let data = emptyDocumentsData;
      if (this.projectId) {
        try {
          const res = await fetch(`/api/projects/${encodeURIComponent(this.projectId)}/documents`);
          if (res.ok) {
            const apiData = await res.json();
            if (apiData) {
              data = apiData;
            }
          }
        } catch (netErr) {
          console.warn(`Could not fetch /api/projects/${this.projectId}/documents:`, netErr);
        }
      }

      State.data = data;
      if (options.selectedDocId) {
        State.selectedDocId = options.selectedDocId;
      }

      // 3. Bind UI interactions and events
      this.bindLibraryEvents();
      this.bindToolbarEvents();
      this.bindLinkedTaskEvents();
      this.bindDecisionsEvents();
      this.bindNextStepsEvents();

      // 4. Initial Render
      this.renderLibrary();
      this.renderActiveDocument();
    },

    /**
     * Renders or filters document items in the library list
     */
    renderLibrary() {
      const listEl = document.getElementById('docs-library-list');
      if (!listEl) return;

      const docs = State.data.library?.documents || [];
      const q = State.searchQuery.toLowerCase().trim();
      const cat = State.activeCategory;

      const filtered = docs.filter(doc => {
        const matchesCat = (cat === 'All') || (doc.categoryKey === cat) || (doc.category === cat);
        const matchesQuery = !q ||
          doc.title.toLowerCase().includes(q) ||
          doc.category.toLowerCase().includes(q) ||
          doc.updatedAt.toLowerCase().includes(q);
        return matchesCat && matchesQuery;
      });

      if (filtered.length === 0) {
        listEl.innerHTML = `
          <div style="padding: 1.5rem 0.5rem; text-align: center; color: var(--dash-text-muted); font-size: 0.78125rem;">
            ${State.searchQuery ? `No documents found matching "${escapeHtml(State.searchQuery)}"` : 'No documents in this project library'}
          </div>
        `;
        return;
      }

      listEl.innerHTML = filtered.map(doc => {
        const isSel = doc.id === State.selectedDocId;
        return `
          <div class="doc-library-item ${isSel ? 'selected' : ''}" data-id="${escapeHtml(doc.id)}" data-cat="${escapeHtml(doc.categoryKey || 'Notes')}" role="listitem" tabindex="0">
            <div class="doc-item-icon-wrap">
              <svg class="doc-item-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
            </div>
            <div class="doc-item-body">
              <span class="doc-item-name">${escapeHtml(doc.title)}</span>
              <span class="doc-item-details">${escapeHtml(doc.category)} <span class="meta-dot">·</span> ${escapeHtml(doc.updatedAt)}</span>
            </div>
            <button class="doc-item-more-btn" title="Options" aria-label="Options for ${escapeHtml(doc.title)}" onclick="event.stopPropagation();">•••</button>
          </div>
        `;
      }).join('');

      // Bind selection clicks
      listEl.querySelectorAll('.doc-library-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          const docId = item.getAttribute('data-id');
          if (docId) {
            this.selectDocument(docId);
          }
        });
      });
    },

    /**
     * Selects a document and renders it into the viewer
     */
    selectDocument(docId) {
      State.selectedDocId = docId;

      // Update selected state in library DOM
      const listEl = document.getElementById('docs-library-list');
      if (listEl) {
        listEl.querySelectorAll('.doc-library-item').forEach(el => {
          el.classList.toggle('selected', el.getAttribute('data-id') === docId);
        });
      }

      // Find doc data
      const docs = State.data.library?.documents || [];
      const targetDoc = docs.find(d => d.id === docId);

      if (targetDoc) {
        this.renderActiveDocument(targetDoc);
      }
    },

    /**
     * Renders the active document inside the Document Viewer card
     */
    renderActiveDocument(doc) {
      const activeDoc = doc || State.data.activeDocument;

      const numEl = document.getElementById('doc-viewer-number');
      const titleEl = document.getElementById('doc-viewer-title');
      const metaCatEl = document.getElementById('doc-meta-category');
      const metaDateEl = document.getElementById('doc-meta-date');
      const metaTeamEl = document.getElementById('doc-meta-team');
      const savedTextEl = document.getElementById('doc-saved-text');
      const p1El = document.getElementById('doc-p1');
      const highlightEl = document.getElementById('doc-selected-highlight');
      const taskDescEl = document.getElementById('linked-task-description');

      if (!activeDoc) {
        if (numEl) numEl.textContent = 'DOCUMENT / —';
        if (titleEl) titleEl.textContent = 'No document selected';
        if (metaCatEl) metaCatEl.textContent = 'Library';
        if (metaDateEl) metaDateEl.textContent = '—';
        if (metaTeamEl) metaTeamEl.textContent = '—';
        if (savedTextEl) savedTextEl.textContent = '';
        if (p1El) p1El.textContent = 'Select or create a document from the project library to view its contents, decisions, and linked tasks.';
        if (highlightEl) highlightEl.textContent = '';
        if (taskDescEl) taskDescEl.value = '';
        return;
      }

      if (numEl) numEl.textContent = activeDoc.docNumber || 'DOCUMENT / 001';
      if (titleEl) titleEl.textContent = activeDoc.title || 'Untitled Document';
      if (metaCatEl) metaCatEl.textContent = activeDoc.category || 'General';
      if (metaDateEl) metaDateEl.textContent = activeDoc.date || '';
      if (metaTeamEl) metaTeamEl.textContent = activeDoc.team || 'Team';
      if (savedTextEl) savedTextEl.textContent = activeDoc.savedStatus || '';

      if (p1El && activeDoc.p1) p1El.textContent = activeDoc.p1;
      if (highlightEl && activeDoc.highlighted) {
        highlightEl.textContent = activeDoc.highlighted;
      }

      // Prefill task description textarea if currently matching or user hasn't heavily customized it
      if (taskDescEl && activeDoc.highlighted) {
        taskDescEl.value = activeDoc.highlighted;
      }
    },

    /**
     * Binds Library Search, Collapse, Categories, and Quick Add
     */
    bindLibraryEvents() {
      // 1. Search Input Filter
      const searchInput = document.getElementById('docs-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          State.searchQuery = e.target.value;
          this.renderLibrary();
        });
      }

      // 2. Quick Add & Bottom New Document Button
      const quickAddBtn = document.getElementById('btn-add-doc-quick');
      const bottomNewDocBtn = document.getElementById('btn-new-document-bottom');

      const handleNewDoc = () => {
        const title = prompt('Enter document title:', 'Sprint Retro Notes');
        if (title && title.trim()) {
          const newDoc = {
            id: `doc-${Date.now()}`,
            title: title.trim(),
            category: 'Meeting Notes',
            categoryKey: 'Notes',
            updatedAt: 'Updated just now',
            docNumber: `DOCUMENT / 00${(State.data.library?.documents?.length || 7) + 1}`,
            isSelected: false,
            date: '29 Oct 2026',
            team: 'Design Team',
            savedStatus: 'Saved just now',
            p1: `Meeting notes and documentation for ${title.trim()}.`,
            highlighted: 'Key alignment takeaways and action items will be outlined here.',
            p2Remainder: ' Review will conclude in next sync.'
          };
          if (!State.data.library) State.data.library = { documents: [] };
          State.data.library.documents.unshift(newDoc);
          this.renderLibrary();
          this.selectDocument(newDoc.id);
        }
      };

      if (quickAddBtn) quickAddBtn.onclick = handleNewDoc;
      if (bottomNewDocBtn) bottomNewDocBtn.onclick = handleNewDoc;

      // 3. Category Filter Pills
      const catPills = document.querySelectorAll('.doc-cat-pill');
      catPills.forEach(pill => {
        pill.addEventListener('click', () => {
          catPills.forEach(p => {
            p.classList.remove('active');
            p.setAttribute('aria-selected', 'false');
          });
          pill.classList.add('active');
          pill.setAttribute('aria-selected', 'true');
          State.activeCategory = pill.getAttribute('data-category') || 'All';
          this.renderLibrary();
        });
      });

      // 4. Collapse Library Panel
      const collapseBtn = document.getElementById('btn-library-collapse');
      const splitWorkspace = document.getElementById('documents-workspace-split');
      if (collapseBtn && splitWorkspace) {
        collapseBtn.addEventListener('click', () => {
          State.isLibraryCollapsed = !State.isLibraryCollapsed;
          splitWorkspace.classList.toggle('library-collapsed', State.isLibraryCollapsed);
          collapseBtn.textContent = State.isLibraryCollapsed ? '»' : '«';
          collapseBtn.title = State.isLibraryCollapsed ? 'Expand Library' : 'Collapse Library';
        });
      }

      // 5. Share Button & Version History
      const shareBtn = document.getElementById('btn-share-doc');
      if (shareBtn) {
        shareBtn.addEventListener('click', () => {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href);
            this.showToast('Document link copied to clipboard!');
          } else {
            this.showToast('Share link: ' + window.location.href);
          }
        });
      }

      const versionHistoryBtn = document.getElementById('btn-version-history');
      if (versionHistoryBtn) {
        versionHistoryBtn.addEventListener('click', () => {
          this.showToast('Version History: 3 saved revisions available. Viewing latest draft.');
        });
      }

      const moreMenuBtn = document.getElementById('btn-doc-more-menu');
      if (moreMenuBtn) {
        moreMenuBtn.addEventListener('click', () => {
          this.showToast('Document Options: Export as PDF, Duplicate Document, or Archive.');
        });
      }

      const addCollabBtn = document.getElementById('btn-add-collaborator');
      if (addCollabBtn) {
        addCollabBtn.addEventListener('click', () => {
          const name = prompt('Invite team member by name or email:', 'sara.k@company.com');
          if (name && name.trim()) {
            this.showToast(`Invitation sent to ${name.trim()}!`);
          }
        });
      }
    },

    /**
     * Binds Inline Formatting Toolbar Actions - Only visible when text is selected
     */
    bindToolbarEvents() {
      const toolbar = document.getElementById('doc-inline-toolbar');
      const textCol = document.querySelector('.doc-discussion-text-col');
      const highlightSpan = document.getElementById('doc-selected-highlight');
      const taskDescEl = document.getElementById('linked-task-description');

      if (!toolbar) return;

      // Prevent mousedown on toolbar from losing text selection
      toolbar.addEventListener('mousedown', (e) => {
        e.preventDefault();
      });

      // Function to check and update toolbar positioning based on active text selection
      const updateSelectionToolbar = () => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || !selection.rangeCount) {
          toolbar.classList.remove('visible');
          if (highlightSpan) highlightSpan.classList.remove('is-selected');
          return;
        }

        const selectedText = selection.toString().trim();
        if (!selectedText) {
          toolbar.classList.remove('visible');
          if (highlightSpan) highlightSpan.classList.remove('is-selected');
          return;
        }

        const range = selection.getRangeAt(0);
        if (!textCol || (!textCol.contains(range.commonAncestorContainer) && !textCol.contains(range.startContainer))) {
          toolbar.classList.remove('visible');
          if (highlightSpan) highlightSpan.classList.remove('is-selected');
          return;
        }

        const rangeRect = range.getBoundingClientRect();
        const colRect = textCol.getBoundingClientRect();

        // Calculate position relative to .doc-discussion-text-col
        const topOffset = rangeRect.bottom - colRect.top + 8;
        const toolbarWidth = toolbar.offsetWidth || 230;
        const centerPos = (rangeRect.left + rangeRect.right) / 2 - colRect.left - (toolbarWidth / 2);
        const leftOffset = Math.max(8, Math.min(colRect.width - toolbarWidth - 8, centerPos));

        toolbar.style.top = `${topOffset}px`;
        toolbar.style.left = `${leftOffset}px`;
        toolbar.classList.add('visible');

        // Add soft glow highlight to the sentence when selected
        if (highlightSpan && (highlightSpan.contains(range.commonAncestorContainer) || highlightSpan.contains(range.startContainer) || (range.intersectsNode && range.intersectsNode(highlightSpan)))) {
          highlightSpan.classList.add('is-selected');
        } else if (highlightSpan) {
          highlightSpan.classList.remove('is-selected');
        }

        // Prefill task description textarea with the selected text
        if (taskDescEl) {
          taskDescEl.value = selectedText;
        }
      };

      // Listen for selection changes inside textCol and document
      document.addEventListener('selectionchange', () => {
        requestAnimationFrame(updateSelectionToolbar);
      });

      if (textCol) {
        textCol.addEventListener('mouseup', updateSelectionToolbar);
        textCol.addEventListener('keyup', updateSelectionToolbar);
      }

      // Clicking on the sentence selects it and displays the glowing highlight & toolbar
      if (highlightSpan) {
        highlightSpan.addEventListener('click', (e) => {
          e.stopPropagation();
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(highlightSpan);
          selection.removeAllRanges();
          selection.addRange(range);
          highlightSpan.classList.add('is-selected');
          updateSelectionToolbar();
        });
      }

      // Hide toolbar and remove glow when clicking outside
      document.addEventListener('mousedown', (e) => {
        if (!toolbar.contains(e.target) && (!textCol || !textCol.contains(e.target))) {
          toolbar.classList.remove('visible');
          if (highlightSpan) highlightSpan.classList.remove('is-selected');
        }
      });

      // Toolbar Buttons Actions
      const boldBtn = document.getElementById('toolbar-bold');
      if (boldBtn) {
        boldBtn.addEventListener('click', () => {
          document.execCommand('bold', false, null);
          const isBold = document.queryCommandState('bold');
          boldBtn.style.backgroundColor = isBold ? '#EEE2CF' : 'transparent';
        });
      }

      const italicBtn = document.getElementById('toolbar-italic');
      if (italicBtn) {
        italicBtn.addEventListener('click', () => {
          document.execCommand('italic', false, null);
          const isItalic = document.queryCommandState('italic');
          italicBtn.style.backgroundColor = isItalic ? '#EEE2CF' : 'transparent';
        });
      }

      const linkBtn = document.getElementById('toolbar-link');
      if (linkBtn) {
        linkBtn.addEventListener('click', () => {
          const url = prompt('Enter link URL (e.g. https://teamden.com):', 'https://teamden.com');
          if (url) {
            document.execCommand('createLink', false, url);
            this.showToast(`Hyperlink attached: ${url}`);
          }
        });
      }

      const commentBtn = document.getElementById('toolbar-comment');
      if (commentBtn) {
        commentBtn.addEventListener('click', () => {
          const comment = prompt('Add comment on selection:', 'Let us simplify the mobile menu in Figma first.');
          if (comment) {
            this.showToast(`Comment added: "${comment}"`);
          }
        });
      }

      const bulletBtn = document.getElementById('toolbar-bullet-list');
      if (bulletBtn) {
        bulletBtn.addEventListener('click', () => {
          document.execCommand('insertUnorderedList', false, null);
          this.showToast('Converted selection to bulleted list.');
        });
      }

      const numBtn = document.getElementById('toolbar-number-list');
      if (numBtn) {
        numBtn.addEventListener('click', () => {
          document.execCommand('insertOrderedList', false, null);
          this.showToast('Converted selection to numbered list.');
        });
      }
    },

    /**
     * Binds Create Linked Task Panel and submission
     */
    bindLinkedTaskEvents() {
      // 1. Assignee Selector
      const assigneeBtn = document.getElementById('linked-assignee-select');
      const assigneeName = document.getElementById('linked-assignee-name');
      const assignees = [
        { name: 'Peter K.', initials: 'PK', color: 'avatar-pk' },
        { name: 'Alex R.', initials: 'AR', color: 'avatar-ar' },
        { name: 'Maria J.', initials: 'MJ', color: 'avatar-mj' },
        { name: 'Sarah K.', initials: 'SK', color: 'avatar-sk' }
      ];
      let currentAssigneeIdx = 0;

      if (assigneeBtn) {
        assigneeBtn.addEventListener('click', () => {
          currentAssigneeIdx = (currentAssigneeIdx + 1) % assignees.length;
          const a = assignees[currentAssigneeIdx];
          if (assigneeName) assigneeName.textContent = a.name;
          const avatarPill = assigneeBtn.querySelector('.linked-avatar-pill');
          if (avatarPill) {
            avatarPill.textContent = a.initials;
            avatarPill.className = `linked-avatar-pill ${a.color}`;
          }
        });
      }

      // 2. Due Date Selector
      const dueDateBtn = document.getElementById('linked-duedate-select');
      const dueDateStr = document.getElementById('linked-due-date-str');
      const dates = ['28 Oct 2026', '30 Oct 2026', '05 Nov 2026', '15 Nov 2026'];
      let currentDateIdx = 0;

      if (dueDateBtn) {
        dueDateBtn.addEventListener('click', () => {
          currentDateIdx = (currentDateIdx + 1) % dates.length;
          if (dueDateStr) dueDateStr.textContent = dates[currentDateIdx];
        });
      }

      // 3. Create Task Primary Button
      const submitBtn = document.getElementById('btn-submit-create-task');
      const descInput = document.getElementById('linked-task-description');

      if (submitBtn) {
        submitBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          const desc = descInput ? descInput.value.trim() : '';
          if (!desc) {
            alert('Please enter a task description.');
            return;
          }

          submitBtn.disabled = true;
          const originalText = submitBtn.innerHTML;
          submitBtn.innerHTML = '<span>Creating task...</span>';

          // Simulate fast reliable task creation or API call
          setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;

            const newTaskId = `T-0${Math.floor(20 + Math.random() * 80)}`;
            const assignee = assigneeName ? assigneeName.textContent : 'Peter K.';
            const dueDate = dueDateStr ? dueDateStr.textContent : '28 Oct 2026';

            this.showToast(`Task ${newTaskId} created and linked to this document!`);

            // If "Also record as decision" was enabled, add to decision stack
            if (State.recordAsDecision) {
              this.addDecision({
                id: `DEC-0${Math.floor(10 + Math.random() * 90)}`,
                title: desc,
                status: 'AWAITING_REVIEW',
                metadata: `Awaiting review · Owner: ${assignee.split(' ')[0]} · Due ${dueDate}`,
                linkedTaskId: newTaskId
              });
            }
          }, 400);
        });
      }

      // 4. Secondary Action: Also record as decision
      const recordDecisionBtn = document.getElementById('btn-action-record-decision');
      if (recordDecisionBtn) {
        recordDecisionBtn.addEventListener('click', () => {
          State.recordAsDecision = !State.recordAsDecision;
          recordDecisionBtn.style.color = State.recordAsDecision ? '#111111' : '#666666';
          recordDecisionBtn.style.fontWeight = State.recordAsDecision ? '700' : '600';
          this.showToast(State.recordAsDecision ? 'Will also record this as a decision.' : 'Decision recording unlinked.');
        });
      }

      // 5. Secondary Action: Link to existing task
      const linkExistingBtn = document.getElementById('btn-action-link-existing');
      if (linkExistingBtn) {
        linkExistingBtn.addEventListener('click', () => {
          const taskId = prompt('Enter existing Task ID to link (e.g. T-014):', 'T-014');
          if (taskId && taskId.trim()) {
            this.showToast(`Linked to existing task: ${taskId.trim().toUpperCase()}`);
          }
        });
      }
    },

    /**
     * Binds Decisions items, clicks, and navigation to Tasks tab
     */
    bindDecisionsEvents() {
      // 1. Linked Task Badge navigation -> Switches to Tasks tab directly!
      const linkedPill = document.querySelector('.decision-linked-task-pill');
      if (linkedPill) {
        linkedPill.style.cursor = 'pointer';
        linkedPill.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.ProjectTabController && typeof window.ProjectTabController.switchTab === 'function') {
            window.ProjectTabController.switchTab('tasks', { selectedTaskId: 'T-014', showDrawer: true });
          } else {
            this.showToast('Navigating to linked task T-021 in Tasks tab.');
          }
        });
      }

      // 2. Decision Record button
      const recordBtn = document.getElementById('btn-record-decision-link');
      if (recordBtn) {
        recordBtn.addEventListener('click', () => {
          const decTitle = prompt('Enter decision summary:', 'Adopt mobile-first bottom sheet interaction.');
          if (decTitle && decTitle.trim()) {
            this.addDecision({
              id: `DEC-0${Math.floor(10 + Math.random() * 90)}`,
              title: decTitle.trim(),
              status: 'APPROVED',
              metadata: `Approved by team · 29 Oct 2026`,
              linkedTaskId: `T-0${Math.floor(20 + Math.random() * 80)}`
            });
            this.showToast('Decision recorded successfully!');
          }
        });
      }
    },

    /**
     * Adds a decision card to the decisions stack dynamically
     */
    addDecision(dec) {
      const stack = document.getElementById('doc-decisions-stack');
      if (!stack) return;

      const isApproved = dec.status === 'APPROVED';
      const card = document.createElement('div');
      card.className = `doc-decision-card ${isApproved ? 'card-approved' : 'card-amber'}`;
      card.setAttribute('data-decision-id', dec.id);

      card.innerHTML = `
        <div class="decision-icon-circle ${isApproved ? 'green' : 'amber'}">
          ${isApproved ?
            `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>` :
            `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`
          }
        </div>
        <div class="decision-content-main">
          <h4 class="decision-item-heading">${escapeHtml(dec.title)}</h4>
          <span class="decision-item-submeta">${escapeHtml(dec.metadata)}</span>
        </div>
        <div class="decision-actions-right">
          ${dec.linkedTaskId ? `
            <span class="decision-linked-task-pill" style="cursor: pointer;" title="Linked Task: ${escapeHtml(dec.linkedTaskId)}">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              <span>${escapeHtml(dec.linkedTaskId)}</span>
            </span>
          ` : ''}
          <button class="decision-nav-arrow-btn" title="View decision" aria-label="View decision">
            <span>→</span>
          </button>
          <button class="decision-more-btn" title="Options" aria-label="Options">•••</button>
        </div>
      `;

      stack.appendChild(card);
    },

    /**
     * Binds Next Steps checkbox toggles
     */
    bindNextStepsEvents() {
      const checkboxes = document.querySelectorAll('.next-step-input');
      checkboxes.forEach(chk => {
        chk.addEventListener('change', () => {
          const label = chk.closest('.next-step-item-label');
          const stepText = label ? label.querySelector('.next-step-item-text')?.textContent : '';
          if (chk.checked) {
            this.showToast(`Completed next step: "${stepText}"`);
          }
        });
      });
    },

    /**
     * Lightweight Toast Notification Helper
     */
    showToast(message) {
      let toast = document.getElementById('project-documents-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'project-documents-toast';
        toast.style.position = 'fixed';
        toast.style.bottom = '24px';
        toast.style.right = '24px';
        toast.style.backgroundColor = '#111111';
        toast.style.color = '#FFFFFF';
        toast.style.padding = '0.65rem 1.15rem';
        toast.style.borderRadius = '8px';
        toast.style.fontSize = '0.8125rem';
        toast.style.fontWeight = '600';
        toast.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
        toast.style.zIndex = '99999';
        toast.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(12px)';
        toast.style.pointerEvents = 'none';
        document.body.appendChild(toast);
      }

      toast.textContent = message;
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';

      if (this.toastTimeout) clearTimeout(this.toastTimeout);
      this.toastTimeout = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(12px)';
      }, 2600);
    }
  };

  // Expose to window for tab controller
  window.ProjectDocuments = ProjectDocuments;

})(window);
