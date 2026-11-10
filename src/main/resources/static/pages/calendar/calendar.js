/**
 * Teamden by shed — Calendar Page Logic (calendar.js)
 * Path: pages/calendar/calendar.js
 *
 * Implements full interactivity for the Brick-inspired neo-editorial calendar:
 * 1. Mounting Sidebar & Navbar fragments
 * 2. Multi-view calendar (Week, Day, Month, Agenda)
 * 3. Dynamic date navigation (Previous, Next, Today, dynamic period formatting)
 * 4. Realistic event positioning according to start time & duration (08:00 - 18:00)
 * 5. Event creation, editing, deletion with localStorage persistence
 * 6. Calendar sources toggle (Brick, Google Calendar, Microsoft 365)
 * 7. Live search event filter
 * 8. Next commitment, needs scheduling, and team availability matrix modals
 */

(function () {
  'use strict';

  // Constants & State
  const STORAGE_KEY = 'teamden-calendar-events-v2';
  let currentUser = null;
  let currentView = 'week'; // 'week', 'day', 'month', 'agenda'
  let currentBaseDate = new Date(2026, 9, 26); // Default: Monday 26 Oct 2026 (matching screenshot)
  let activeCalendars = new Set(['brick', 'google', 'microsoft']);
  let searchQuery = '';
  let events = [];
  let selectedEvent = null;

  // Icon SVG Templates
  const ICONS = {
    team: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    document: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
    search: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    box: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
    calendar: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    monitor: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    flag: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
    check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`
  };

  // Seed Data: 17 Events Matching Reference Screenshot Exactly
  const SEED_EVENTS = [
    // --- MONDAY (2026-10-26) ---
    {
      id: 'evt-mon-1',
      title: 'Design standup',
      date: '2026-10-26',
      dayOfWeek: 0,
      startTime: '09:30',
      endTime: '10:00',
      startMinutes: 570,
      endMinutes: 600,
      project: 'Client Application',
      sub: '',
      category: 'meeting',
      colorTheme: 'lavender',
      calendar: 'brick',
      icon: 'team',
      location: 'meet.google.com/bric-des-sync',
      attendees: ['Priya Kapoor', 'Alex Rivera', 'Marcus Jones'],
      desc: 'Quick daily design standup to align on client application tickets and current deliverables.'
    },
    {
      id: 'evt-mon-2',
      title: 'Homepage work',
      date: '2026-10-26',
      dayOfWeek: 0,
      startTime: '11:00',
      endTime: '12:30',
      startMinutes: 660,
      endMinutes: 750,
      project: 'Website Redesign',
      sub: 'Focus session',
      category: 'focus',
      colorTheme: 'blue',
      calendar: 'google',
      icon: 'document',
      location: 'Studio Desk 4',
      attendees: ['Alex Rivera'],
      desc: 'Dedicated deep work session to build out responsive homepage layouts and hero typography.'
    },
    {
      id: 'evt-mon-3',
      title: 'Client review',
      date: '2026-10-26',
      dayOfWeek: 0,
      startTime: '14:00',
      endTime: '15:00',
      startMinutes: 840,
      endMinutes: 900,
      project: 'Website Redesign',
      sub: 'Website Redesign',
      category: 'review',
      colorTheme: 'peach',
      calendar: 'brick',
      icon: 'team',
      location: 'Room 2A & Zoom',
      attendees: ['Sara Kim', 'Priya Kapoor', 'Client Stakeholders'],
      desc: 'Present sprint milestone prototypes and collect sign-off on design system tokens.'
    },
    {
      id: 'evt-mon-4',
      title: 'Marketing sync',
      date: '2026-10-26',
      dayOfWeek: 0,
      startTime: '16:00',
      endTime: '17:00',
      startMinutes: 960,
      endMinutes: 1020,
      project: 'Marketing',
      sub: 'Campaign planning',
      category: 'meeting',
      colorTheme: 'lavender',
      calendar: 'microsoft',
      icon: 'monitor',
      location: 'meet.google.com/mkt-q4-plan',
      attendees: ['Alex Rivera', 'Elena Rostova'],
      desc: 'Campaign planning and creative asset schedule for the upcoming November launch.'
    },

    // --- TUESDAY (2026-10-27) ---
    {
      id: 'evt-tue-1',
      title: 'User research',
      date: '2026-10-27',
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '10:30',
      startMinutes: 540,
      endMinutes: 630,
      project: 'Client Application',
      sub: 'Client Application',
      category: 'focus',
      colorTheme: 'lime',
      calendar: 'brick',
      icon: 'search',
      location: 'Research Lab 1',
      attendees: ['Priya Kapoor', 'User Test Group'],
      desc: 'Usability testing sessions evaluating onboarding flow friction and feedback collection.'
    },
    {
      id: 'evt-tue-2',
      title: 'Design critique',
      date: '2026-10-27',
      dayOfWeek: 1,
      startTime: '13:00',
      endTime: '14:00',
      startMinutes: 780,
      endMinutes: 840,
      project: 'Design Team',
      sub: 'Internal review',
      category: 'review',
      colorTheme: 'lavender',
      calendar: 'brick',
      icon: 'team',
      location: 'Main Lounge',
      attendees: ['Priya Kapoor', 'Marcus Jones', 'Alex Rivera'],
      desc: 'Constructive review of card corner radii, hover animations, and iconography consistency.'
    },
    {
      id: 'evt-tue-3',
      title: 'Component work',
      date: '2026-10-27',
      dayOfWeek: 1,
      startTime: '15:30',
      endTime: '17:00',
      startMinutes: 930,
      endMinutes: 1020,
      project: 'Design Guidelines',
      sub: 'Focus session',
      category: 'focus',
      colorTheme: 'blue',
      calendar: 'google',
      icon: 'box',
      location: 'Workstation',
      attendees: ['Alex Rivera'],
      desc: 'Implement and test modular segmented view controls, badges, and calendar cards.'
    },

    // --- WEDNESDAY (2026-10-28) ---
    {
      id: 'evt-wed-1',
      title: 'Product sync',
      date: '2026-10-28',
      dayOfWeek: 2,
      startTime: '10:00',
      endTime: '11:00',
      startMinutes: 600,
      endMinutes: 660,
      project: 'Client Application',
      sub: 'Client Application',
      category: 'meeting',
      colorTheme: 'lavender',
      calendar: 'brick',
      icon: 'team',
      location: 'Conference Room C',
      attendees: ['Sara Kim', 'Alex Rivera', 'Priya Kapoor'],
      desc: 'Sprint mid-point status review and blocker resolution for client deliverables.'
    },
    {
      id: 'evt-wed-2',
      title: 'Homepage development',
      date: '2026-10-28',
      dayOfWeek: 2,
      startTime: '11:30',
      endTime: '13:00',
      startMinutes: 690,
      endMinutes: 780,
      project: 'Website Redesign',
      sub: 'Focus session',
      category: 'task',
      colorTheme: 'blue',
      calendar: 'brick',
      icon: 'document',
      location: 'Desk',
      attendees: ['Alex Rivera'],
      desc: 'Complete responsive CSS grid and micro-interactions for the new homepage header.'
    },
    {
      id: 'evt-wed-3',
      title: 'Content review',
      date: '2026-10-28',
      dayOfWeek: 2,
      startTime: '14:30',
      endTime: '15:30',
      startMinutes: 870,
      endMinutes: 930,
      project: 'Design Guidelines',
      sub: 'Design Guidelines',
      category: 'review',
      colorTheme: 'cream',
      calendar: 'microsoft',
      icon: 'document',
      location: 'Room 1B',
      attendees: ['Elena Rostova', 'Marcus Jones'],
      desc: 'Review brand copy, microcopy, and help tooltip guidelines.'
    },

    // --- THURSDAY (2026-10-29) ---
    {
      id: 'evt-thu-1',
      title: 'Team planning',
      date: '2026-10-29',
      dayOfWeek: 3,
      startTime: '09:00',
      endTime: '10:00',
      startMinutes: 540,
      endMinutes: 600,
      project: 'Product Roadmap',
      sub: 'Q4 priorities',
      category: 'meeting',
      colorTheme: 'blue',
      calendar: 'microsoft',
      icon: 'calendar',
      location: 'meet.google.com/q4-plan',
      attendees: ['Sara Kim', 'Priya Kapoor', 'Alex Rivera'],
      desc: 'Quarterly backlog grooming and roadmap prioritization.'
    },
    {
      id: 'evt-thu-2',
      title: 'Design review',
      breadcrumb: 'WEBSITE REDESIGN / EVENT 008',
      date: '2026-10-29',
      dayOfWeek: 3,
      startTime: '11:00',
      endTime: '12:00',
      startMinutes: 660,
      endMinutes: 720,
      project: 'Website Redesign',
      sub: 'Website Redesign',
      category: 'meeting',
      colorTheme: 'lavender',
      calendar: 'brick',
      icon: 'team',
      location: 'https://meet.acme.co/design-review',
      meetingUrl: 'https://meet.acme.co/design-review',
      organizer: { name: 'Alex R.', role: 'Lead Designer' },
      rsvp: 'Accepted',
      attendeesList: [
        { initials: 'PK', name: 'Priya K.', theme: 'avatar-pk', status: 'Accepted' },
        { initials: 'AR', name: 'Alex R.', theme: 'avatar-ar', status: 'Accepted' },
        { initials: 'SK', name: 'Sara K.', theme: 'avatar-sk', status: 'Accepted' },
        { initials: 'MJ', name: 'Marcus J.', theme: 'avatar-mj', status: 'Accepted' }
      ],
      agenda: [
        'Review homepage direction',
        'Finalise mobile navigation',
        'Confirm development handoff'
      ],
      notes: 'The team reviewed the updated homepage structure and agreed that the simplified navigation provides a clearer user journey.',
      notesTimestamp: 'Saved 5 min ago',
      decision: {
        title: 'Proceed with the revised homepage layout.',
        status: 'Approved internally · Client confirmation pending'
      },
      followups: [
        { id: 'fu-1', title: 'Refine mobile navigation', assignee: 'Peter K.', due: 'Due 30 Oct', completed: false },
        { id: 'fu-2', title: 'Prepare design handoff', assignee: 'Maria J.', due: 'Due 30 Oct', completed: false }
      ],
      desc: 'Weekly sync with the design and engineering leads to review website redesign prototypes.'
    },
    {
      id: 'evt-thu-3',
      title: 'Prototype work',
      date: '2026-10-29',
      dayOfWeek: 3,
      startTime: '14:00',
      endTime: '15:30',
      startMinutes: 840,
      endMinutes: 930,
      project: 'Website Redesign',
      sub: 'Focus session',
      category: 'focus',
      colorTheme: 'blue',
      calendar: 'google',
      icon: 'box',
      location: 'Figma Lab',
      attendees: ['Alex Rivera'],
      desc: 'Assemble interactive prototype flows for Friday design handoff.'
    },
    {
      id: 'evt-thu-4',
      title: 'Engineering sync',
      date: '2026-10-29',
      dayOfWeek: 3,
      startTime: '16:00',
      endTime: '17:00',
      startMinutes: 960,
      endMinutes: 1020,
      project: 'Client Application',
      sub: 'Handoff discussion',
      category: 'meeting',
      colorTheme: 'lavender',
      calendar: 'brick',
      icon: 'team',
      location: 'War Room A',
      attendees: ['Engineering Team'],
      desc: 'Technical implementation handoff and API contract verification.'
    },

    // --- FRIDAY (2026-10-30) ---
    {
      id: 'evt-fri-1',
      title: 'Design handoff',
      date: '2026-10-30',
      dayOfWeek: 4,
      startTime: '10:00',
      endTime: '11:30',
      startMinutes: 600,
      endMinutes: 690,
      project: 'Website Redesign',
      sub: 'Website Redesign',
      category: 'milestone',
      colorTheme: 'lime',
      calendar: 'brick',
      icon: 'box',
      location: 'Main Auditorium',
      attendees: ['Design & Dev Teams'],
      desc: 'Final milestone handoff meeting: asset exports, design specs, and component tokens.'
    },
    {
      id: 'evt-fri-2',
      title: 'Client update',
      date: '2026-10-30',
      dayOfWeek: 4,
      startTime: '13:00',
      endTime: '14:00',
      startMinutes: 780,
      endMinutes: 840,
      project: 'Client Application',
      sub: 'Client Application',
      category: 'meeting',
      colorTheme: 'lavender',
      calendar: 'brick',
      icon: 'team',
      location: 'meet.google.com/cli-update',
      attendees: ['Sara Kim', 'Priya Kapoor'],
      desc: 'Weekly progress summary call with the client leadership team.'
    },
    {
      id: 'evt-fri-3',
      title: 'Documentation',
      date: '2026-10-30',
      dayOfWeek: 4,
      startTime: '15:00',
      endTime: '16:00',
      startMinutes: 900,
      endMinutes: 960,
      project: 'General Work',
      sub: 'Focus session',
      category: 'focus',
      colorTheme: 'blue',
      calendar: 'google',
      icon: 'document',
      location: 'Desk',
      attendees: ['Alex Rivera'],
      desc: 'Update project knowledge base, wiki notes, and week retrospective log.'
    }
  ];

  // Upcoming Commitments (4 cards)
  const UPCOMING_COMMITMENTS = [
    {
      id: 'commit-1',
      dayText: 'MON 26 OCT',
      title: 'Project kickoff',
      sub: 'Client Application',
      theme: 'lime',
      icon: 'flag',
      targetEventId: 'evt-mon-1'
    },
    {
      id: 'commit-2',
      dayText: 'WED 28 OCT',
      title: 'Homepage development',
      sub: 'Task deadline',
      theme: 'blue',
      icon: 'check',
      targetEventId: 'evt-wed-2'
    },
    {
      id: 'commit-3',
      dayText: 'THU 29 OCT',
      title: 'Design review',
      sub: 'Website Redesign',
      theme: 'lavender',
      icon: 'team',
      targetEventId: 'evt-thu-2'
    },
    {
      id: 'commit-4',
      dayText: 'FRI 30 OCT',
      title: 'Design handoff',
      sub: 'Milestone',
      theme: 'peach',
      icon: 'box',
      targetEventId: 'evt-fri-1'
    }
  ];

  /**
   * Helper: Load dynamic HTML fragment into mount
   */
  async function loadFragment(url, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    try {
      const res = await fetch(url + (url.includes('?') ? '&' : '?') + 't=' + Date.now());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      container.innerHTML = await res.text();
    } catch (err) {
      console.error('Fragment load failed:', url, err);
    }
  }

  /**
   * Helper: Show toast notification
   */
  function showToast(message) {
    const container = document.getElementById('cal-toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'cal-toast';
    toast.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CBF931" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      <span>${escapeHtml(message)}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }

  /**
   * Helper: Escape HTML string
   */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Helper: Normalize event data to ensure all drawer fields are present
   */
  function normalizeEvent(evt) {
    if (!evt) return evt;
    const project = evt.project || 'Website Redesign';
    const idNum = (evt.id || '001').replace(/\D/g, '') || '008';

    if (!evt.breadcrumb) {
      evt.breadcrumb = `${project.toUpperCase()} / EVENT ${idNum.padStart(3, '0')}`;
    }
    if (!evt.organizer) {
      evt.organizer = { name: 'Alex R.', role: 'Lead Designer' };
    }
    if (!evt.rsvp) {
      evt.rsvp = 'Accepted';
    }
    if (!evt.meetingUrl) {
      evt.meetingUrl = (evt.location && evt.location.startsWith('http'))
        ? evt.location
        : 'https://meet.acme.co/' + (evt.title || 'event').toLowerCase().replace(/[^a-z0-9]/g, '-');
    }
    if (!evt.attendeesList || evt.attendeesList.length === 0) {
      evt.attendeesList = [
        { initials: 'PK', name: 'Priya K.', theme: 'avatar-pk', status: 'Accepted' },
        { initials: 'AR', name: 'Alex R.', theme: 'avatar-ar', status: 'Accepted' },
        { initials: 'SK', name: 'Sara K.', theme: 'avatar-sk', status: 'Accepted' },
        { initials: 'MJ', name: 'Marcus J.', theme: 'avatar-mj', status: 'Accepted' }
      ];
    }
    if (!evt.agenda || evt.agenda.length === 0) {
      if (evt.id === 'evt-thu-2' || (evt.title && evt.title.toLowerCase().includes('design review'))) {
        evt.agenda = [
          'Review homepage direction',
          'Finalise mobile navigation',
          'Confirm development handoff'
        ];
      } else {
        evt.agenda = [
          `Review ${evt.title.toLowerCase()} objectives`,
          `Align dependencies with ${evt.project || 'team'}`,
          'Confirm timeline and action items'
        ];
      }
    }
    if (!evt.notes) {
      if (evt.id === 'evt-thu-2' || (evt.title && evt.title.toLowerCase().includes('design review'))) {
        evt.notes = 'The team reviewed the updated homepage structure and agreed that the simplified navigation provides a clearer user journey.';
        evt.notesTimestamp = 'Saved 5 min ago';
      } else {
        evt.notes = evt.desc || `Discussion notes for ${evt.title}. Key agreements reached and documented for the sprint.`;
        evt.notesTimestamp = 'Saved 10 min ago';
      }
    }
    if (!evt.decision) {
      if (evt.id === 'evt-thu-2' || (evt.title && evt.title.toLowerCase().includes('design review'))) {
        evt.decision = {
          title: 'Proceed with the revised homepage layout.',
          status: 'Approved internally · Client confirmation pending'
        };
      } else {
        evt.decision = {
          title: `Approved milestone direction for ${evt.title}.`,
          status: 'Approved by project leads · Execution in progress'
        };
      }
    }
    if (!evt.followups || evt.followups.length === 0) {
      if (evt.id === 'evt-thu-2' || (evt.title && evt.title.toLowerCase().includes('design review'))) {
        evt.followups = [
          { id: 'fu-1', title: 'Refine mobile navigation', assignee: 'Peter K.', due: 'Due 30 Oct', completed: false },
          { id: 'fu-2', title: 'Prepare design handoff', assignee: 'Maria J.', due: 'Due 30 Oct', completed: false }
        ];
      } else {
        evt.followups = [
          { id: 'fu-' + (evt.id || 'x') + '-1', title: `Finalize ${evt.title.toLowerCase()} specs`, assignee: 'Alex R.', due: 'Due 30 Oct', completed: false },
          { id: 'fu-' + (evt.id || 'x') + '-2', title: 'Share summary with client stakeholders', assignee: 'Sara K.', due: 'Due 30 Oct', completed: false }
        ];
      }
    }
    return evt;
  }

  /**
   * Load stored events from backend API or initialize seed
   */
  async function loadEvents() {
    try {
      const resp = await fetch('/api/calendar/events');
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
          events = data.map(normalizeEvent);
          saveEvents();
          renderUpcomingCommitments();
          switchView(currentView);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend /api/calendar/events unreachable, falling back to cache', err);
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        events = JSON.parse(raw).map(normalizeEvent);
      } else {
        events = SEED_EVENTS.map(normalizeEvent);
        saveEvents();
      }
    } catch (e) {
      console.warn('Failed to parse stored events, resetting to seed', e);
      events = SEED_EVENTS.map(normalizeEvent);
    }
    renderUpcomingCommitments();
    switchView(currentView);
  }

  function saveEvents() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch (e) {
      console.error('Failed to save events to localStorage', e);
    }
  }

  async function persistEventToBackend(evt, isUpdate) {
    try {
      const payload = {
        title: evt.title,
        date: evt.date,
        startTime: evt.startTime,
        endTime: evt.endTime,
        project: evt.project,
        sub: evt.sub,
        category: evt.category,
        colorTheme: evt.colorTheme,
        calendar: evt.calendar,
        icon: evt.icon,
        location: evt.location,
        attendees: evt.attendees,
        desc: evt.desc
      };
      const url = isUpdate ? `/api/calendar/events/${evt.id}` : '/api/calendar/events';
      const method = isUpdate ? 'PUT' : 'POST';
      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
        const saved = await resp.json();
        if (saved && saved.id) {
          evt.id = saved.id;
          saveEvents();
        }
      }
    } catch (err) {
      console.warn('Backend sync failed, saved locally', err);
    }
  }

  async function deleteEventFromBackend(id) {
    try {
      await fetch(`/api/calendar/events/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Backend delete failed', err);
    }
  }

  /**
   * Format helper: get Monday of the given date's week
   */
  function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  }

  /**
   * Format date as 'YYYY-MM-DD'
   */
  function formatDateKey(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Helper: Time formatting
   */
  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DAY_NAMES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  /**
   * Update header date range and column day numbers
   */
  function updatePeriodDisplay() {
    const headingEl = document.getElementById('calendar-period-heading');
    if (!headingEl) return;

    if (currentView === 'week') {
      const mon = getMonday(currentBaseDate);
      const fri = new Date(mon);
      fri.setDate(mon.getDate() + 4);

      const monDay = mon.getDate();
      const friDay = fri.getDate();
      const monMonth = MONTH_NAMES[mon.getMonth()];
      const friMonth = MONTH_NAMES[fri.getMonth()];
      const monYear = mon.getFullYear();
      const friYear = fri.getFullYear();

      if (monMonth === friMonth && monYear === friYear) {
        headingEl.textContent = `${monDay} – ${friDay} ${monMonth} ${monYear}`;
      } else if (monYear === friYear) {
        headingEl.textContent = `${monDay} ${monMonth} – ${friDay} ${friMonth} ${monYear}`;
      } else {
        headingEl.textContent = `${monDay} ${monMonth} ${monYear} – ${friDay} ${friMonth} ${friYear}`;
      }

      // Update Column Headers
      const headersContainer = document.getElementById('cal-week-headers');
      if (headersContainer) {
        let html = '<div class="cal-time-header-cell"></div>';
        const todayKey = formatDateKey(new Date());

        for (let i = 0; i < 5; i++) {
          const colDate = new Date(mon);
          colDate.setDate(mon.getDate() + i);
          const colDateKey = formatDateKey(colDate);
          const isToday = (colDateKey === '2026-10-26'); // Matches demo screenshot reference

          html += `
            <div class="cal-day-header-cell ${isToday ? 'is-today' : ''}" data-day-index="${i}" data-date="${colDateKey}" style="cursor: pointer;" title="View ${DAY_NAMES[i]} details">
              <span class="cal-day-name">${DAY_NAMES[i]}</span>
              <span class="cal-day-num">${colDate.getDate()}</span>
              <div class="cal-current-indicator-bar"></div>
            </div>
          `;
        }
        headersContainer.innerHTML = html;

        // Clicking date header selects date and opens primary event in drawer
        headersContainer.querySelectorAll('.cal-day-header-cell').forEach(headerCell => {
          headerCell.addEventListener('click', () => {
            const dateKey = headerCell.getAttribute('data-date');
            const dayEvts = events.filter(e => e.date === dateKey);
            if (dayEvts.length > 0) {
              openEventDetails(dayEvts[0]);
            } else {
              showToast(`Selected date: ${dateKey}`);
            }
          });
        });
      }
    } else if (currentView === 'day') {
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentBaseDate.getDay()];
      headingEl.textContent = `${dayName}, ${currentBaseDate.getDate()} ${MONTH_NAMES[currentBaseDate.getMonth()]} ${currentBaseDate.getFullYear()}`;
    } else if (currentView === 'month') {
      headingEl.textContent = `${MONTH_NAMES[currentBaseDate.getMonth()]} ${currentBaseDate.getFullYear()}`;
    } else if (currentView === 'agenda') {
      headingEl.textContent = `Upcoming Agenda — ${MONTH_NAMES[currentBaseDate.getMonth()]} ${currentBaseDate.getFullYear()}`;
    } else if (currentView === 'table') {
      headingEl.textContent = `Schedule Register — ${MONTH_NAMES[currentBaseDate.getMonth()]} ${currentBaseDate.getFullYear()}`;
    }
  }

  /**
   * Render Upcoming Commitments (4 cards above calendar)
   */
  function renderUpcomingCommitments() {
    const grid = document.getElementById('upcoming-commitments-grid');
    if (!grid) return;

    grid.innerHTML = UPCOMING_COMMITMENTS.map(item => {
      const iconSvg = ICONS[item.icon] || ICONS.flag;
      return `
        <div class="commitment-card theme-${item.theme}" data-target-id="${item.targetEventId}">
          <div class="commitment-card-icon">${iconSvg}</div>
          <div class="commitment-card-content">
            <span class="commitment-date-eyebrow">${escapeHtml(item.dayText)}</span>
            <h4 class="commitment-title">${escapeHtml(item.title)}</h4>
            <span class="commitment-sub">${escapeHtml(item.sub)}</span>
          </div>
        </div>
      `;
    }).join('');

    // Attach click handlers
    grid.querySelectorAll('.commitment-card').forEach(card => {
      card.addEventListener('click', () => {
        const targetId = card.getAttribute('data-target-id');
        const targetEvt = events.find(e => e.id === targetId);
        if (targetEvt) {
          openEventDetails(targetEvt);
        } else {
          showToast(`Commitment: ${card.querySelector('.commitment-title').textContent}`);
        }
      });
    });
  }

  /**
   * Render Time Gutter (08:00 - 17:00 / 18:00)
   */
  function renderTimeGutter(containerId = 'cal-time-gutter') {
    const gutter = document.getElementById(containerId);
    if (!gutter) return;

    let html = '';
    for (let h = 8; h <= 17; h++) {
      const hourStr = String(h).padStart(2, '0') + ':00';
      html += `<div class="cal-time-slot-label">${hourStr}</div>`;
    }
    gutter.innerHTML = html;
  }

  /**
   * Filter events by active calendars and search query
   */
  function getFilteredEvents() {
    return events.filter(evt => {
      // 1. Calendar filter
      if (evt.calendar && !activeCalendars.has(evt.calendar.toLowerCase())) {
        return false;
      }
      // 2. Search query filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = evt.title && evt.title.toLowerCase().includes(q);
        const matchesProject = evt.project && evt.project.toLowerCase().includes(q);
        const matchesSub = evt.sub && evt.sub.toLowerCase().includes(q);
        const matchesDesc = evt.desc && evt.desc.toLowerCase().includes(q);
        return matchesTitle || matchesProject || matchesSub || matchesDesc;
      }
      return true;
    });
  }

  /**
   * Render Main Week Grid View
   */
  function renderWeekView() {
    const daysContainer = document.getElementById('cal-days-container');
    if (!daysContainer) return;

    const mon = getMonday(currentBaseDate);
    const filtered = getFilteredEvents();

    let html = '';
    for (let i = 0; i < 5; i++) {
      const colDate = new Date(mon);
      colDate.setDate(mon.getDate() + i);
      const colDateKey = formatDateKey(colDate);
      const isToday = (colDateKey === '2026-10-26');

      // Gridlines for 10 hours (08:00 - 18:00)
      let gridlinesHtml = '';
      for (let h = 0; h < 10; h++) {
        const topPx = h * 64;
        const slotHour = String(8 + h).padStart(2, '0') + ':00';
        gridlinesHtml += `
          <div class="cal-hour-gridline" style="top: ${topPx}px;" data-day="${colDateKey}" data-time="${slotHour}" title="Click to add event at ${slotHour}"></div>
        `;
      }

      // Filter events occurring on this date
      const dayEvents = filtered.filter(evt => evt.date === colDateKey);

      // Event Cards inside this day column
      let eventsHtml = '';
      dayEvents.forEach(evt => {
        // Grid span calculation (08:00 = 480 mins, 18:00 = 1080 mins)
        const startMins = evt.startMinutes || (parseInt(evt.startTime.split(':')[0]) * 60 + parseInt(evt.startTime.split(':')[1]));
        const endMins = evt.endMinutes || (parseInt(evt.endTime.split(':')[0]) * 60 + parseInt(evt.endTime.split(':')[1]));

        const topPx = ((startMins - 480) / 60) * 64;
        const heightPx = Math.max(30, ((endMins - startMins) / 60) * 64 - 4);

        const iconSvg = ICONS[evt.icon] || ICONS.team;

        eventsHtml += `
          <div class="cal-event-card theme-${evt.colorTheme || 'blue'}" 
               style="top: ${topPx}px; height: ${heightPx}px;"
               data-event-id="${evt.id}"
               tabindex="0"
               role="button"
               aria-label="${escapeHtml(evt.title)}, ${evt.startTime} to ${evt.endTime}">
            <div class="event-top-row">
              <span class="event-icon-badge">${iconSvg}</span>
              <span class="event-time-range">${evt.startTime} – ${evt.endTime}</span>
            </div>
            <span class="event-card-title">${escapeHtml(evt.title)}</span>
            ${evt.sub ? `<span class="event-card-sub">${escapeHtml(evt.sub)}</span>` : (evt.project ? `<span class="event-card-sub">${escapeHtml(evt.project)}</span>` : '')}
          </div>
        `;
      });

      html += `
        <div class="cal-day-column ${isToday ? 'is-today' : ''}" data-day-index="${i}" data-date="${colDateKey}">
          ${gridlinesHtml}
          ${eventsHtml}
        </div>
      `;
    }

    daysContainer.innerHTML = html;

    // Position Current Time Indicator (Monday 11:00 AM in screenshot)
    const timeIndicator = document.getElementById('cal-current-time-indicator');
    if (timeIndicator) {
      // 11:00 AM = 660 mins from midnight -> 180 mins from 08:00 -> 3 hours * 64px = 192px
      const currentIndicatorTop = ((11 * 60 - 480) / 60) * 64;
      timeIndicator.style.top = `${currentIndicatorTop}px`;
      timeIndicator.style.display = 'flex';
    }

    // Attach Event Card Click Listeners
    daysContainer.querySelectorAll('.cal-event-card').forEach(card => {
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        const eventId = card.getAttribute('data-event-id');
        const evt = events.find(item => item.id === eventId);
        if (evt) openEventDetails(evt);
      });
    });

    // Attach Empty Slot Click Listeners (Quick Add)
    daysContainer.querySelectorAll('.cal-hour-gridline').forEach(slot => {
      slot.addEventListener('click', (e) => {
        const date = slot.getAttribute('data-day');
        const time = slot.getAttribute('data-time');
        openCreateModal({ date, startTime: time });
      });
    });
  }

  /**
   * Render Day View Pane
   */
  function renderDayView() {
    renderTimeGutter('cal-day-time-gutter');
    const dayCol = document.getElementById('cal-single-day-col');
    const eyebrow = document.getElementById('day-view-eyebrow');
    const title = document.getElementById('day-view-date-title');
    if (!dayCol || !eyebrow || !title) return;

    const dayName = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][currentBaseDate.getDay()];
    eyebrow.textContent = dayName;
    title.textContent = `${currentBaseDate.getDate()} ${MONTH_NAMES[currentBaseDate.getMonth()]} ${currentBaseDate.getFullYear()}`;

    const dateKey = formatDateKey(currentBaseDate);
    const filtered = getFilteredEvents().filter(e => e.date === dateKey);

    let gridlinesHtml = '';
    for (let h = 0; h < 10; h++) {
      const topPx = h * 64;
      const slotHour = String(8 + h).padStart(2, '0') + ':00';
      gridlinesHtml += `
        <div class="cal-hour-gridline" style="top: ${topPx}px;" data-day="${dateKey}" data-time="${slotHour}"></div>
      `;
    }

    let eventsHtml = '';
    filtered.forEach(evt => {
      const startMins = evt.startMinutes || (parseInt(evt.startTime.split(':')[0]) * 60 + parseInt(evt.startTime.split(':')[1]));
      const endMins = evt.endMinutes || (parseInt(evt.endTime.split(':')[0]) * 60 + parseInt(evt.endTime.split(':')[1]));
      const topPx = ((startMins - 480) / 60) * 64;
      const heightPx = Math.max(34, ((endMins - startMins) / 60) * 64 - 4);
      const iconSvg = ICONS[evt.icon] || ICONS.team;

      eventsHtml += `
        <div class="cal-event-card theme-${evt.colorTheme || 'blue'}" 
             style="top: ${topPx}px; height: ${heightPx}px; left: 12px; right: 12px;"
             data-event-id="${evt.id}">
          <div class="event-top-row">
            <span class="event-icon-badge">${iconSvg}</span>
            <span class="event-time-range">${evt.startTime} – ${evt.endTime}</span>
          </div>
          <span class="event-card-title">${escapeHtml(evt.title)}</span>
          ${evt.sub ? `<span class="event-card-sub">${escapeHtml(evt.sub)}</span>` : `<span class="event-card-sub">${escapeHtml(evt.project || '')}</span>`}
        </div>
      `;
    });

    dayCol.innerHTML = gridlinesHtml + eventsHtml;

    dayCol.querySelectorAll('.cal-event-card').forEach(card => {
      card.addEventListener('click', () => {
        const evt = events.find(item => item.id === card.getAttribute('data-event-id'));
        if (evt) openEventDetails(evt);
      });
    });

    dayCol.querySelectorAll('.cal-hour-gridline').forEach(slot => {
      slot.addEventListener('click', () => {
        openCreateModal({ date: dateKey, startTime: slot.getAttribute('data-time') });
      });
    });
  }

  /**
   * Render Month View Pane
   */
  function renderMonthView() {
    const grid = document.getElementById('cal-month-body-grid');
    if (!grid) return;

    const year = currentBaseDate.getFullYear();
    const month = currentBaseDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDayOffset = (firstDay.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const filtered = getFilteredEvents();
    let html = '';

    // Prev month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startDayOffset - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      html += `
        <div class="month-cell is-other-month">
          <div class="month-cell-header"><span class="month-date-num">${dayNum}</span></div>
        </div>
      `;
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(year, month, d);
      const dateKey = formatDateKey(cellDate);
      const isToday = (dateKey === '2026-10-26');
      const dayEvts = filtered.filter(e => e.date === dateKey);

      let pillsHtml = '';
      dayEvts.forEach(evt => {
        pillsHtml += `
          <div class="month-event-pill theme-${evt.colorTheme || 'blue'}" data-event-id="${evt.id}" title="${escapeHtml(evt.title)} (${evt.startTime})">
            ${evt.startTime} ${escapeHtml(evt.title)}
          </div>
        `;
      });

      html += `
        <div class="month-cell ${isToday ? 'is-today' : ''}" data-date="${dateKey}">
          <div class="month-cell-header">
            <span class="month-date-num">${d}</span>
          </div>
          <div class="month-events-list">
            ${pillsHtml}
          </div>
        </div>
      `;
    }

    grid.innerHTML = html;

    grid.querySelectorAll('.month-event-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        const evt = events.find(item => item.id === pill.getAttribute('data-event-id'));
        if (evt) openEventDetails(evt);
      });
    });

    grid.querySelectorAll('.month-cell:not(.is-other-month)').forEach(cell => {
      cell.addEventListener('click', () => {
        openCreateModal({ date: cell.getAttribute('data-date'), startTime: '10:00' });
      });
    });
  }

  /**
   * Render Agenda View Pane
   */
  function renderAgendaView() {
    const listContainer = document.getElementById('cal-agenda-list');
    if (!listContainer) return;

    const filtered = getFilteredEvents();
    if (filtered.length === 0) {
      listContainer.innerHTML = `<div style="text-align: center; padding: 3rem; color: #777;">No events scheduled for this period.</div>`;
      return;
    }

    // Sort by date then startTime
    const sorted = [...filtered].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });

    // Group by date
    const groups = {};
    sorted.forEach(evt => {
      if (!groups[evt.date]) groups[evt.date] = [];
      groups[evt.date].push(evt);
    });

    let html = '';
    Object.keys(groups).forEach(dateKey => {
      const d = new Date(dateKey + 'T00:00:00');
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
      const headerText = `${dayName}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;

      let eventsListHtml = '';
      groups[dateKey].forEach(evt => {
        eventsListHtml += `
          <div class="agenda-event-row theme-${evt.colorTheme || 'blue'}" data-event-id="${evt.id}">
            <div class="agenda-left">
              <span class="agenda-time">${evt.startTime} – ${evt.endTime}</span>
              <div>
                <strong class="agenda-title">${escapeHtml(evt.title)}</strong>
                <span class="agenda-sub"> · ${escapeHtml(evt.project || evt.sub || 'General')}</span>
              </div>
            </div>
            <span class="agenda-badge">${escapeHtml(evt.category || 'Meeting')}</span>
          </div>
        `;
      });

      html += `
        <div class="agenda-day-group">
          <div class="agenda-day-header">${headerText}</div>
          <div class="agenda-events-container">${eventsListHtml}</div>
        </div>
      `;
    });

    listContainer.innerHTML = html;

    listContainer.querySelectorAll('.agenda-event-row').forEach(row => {
      row.addEventListener('click', () => {
        const evt = events.find(item => item.id === row.getAttribute('data-event-id'));
        if (evt) openEventDetails(evt);
      });
    });
  }

  /**
   * 5. TABLE VIEW (Schedule Register)
   */
  function renderTableView() {
    const tbody = document.getElementById('cal-table-body');
    const emptyState = document.getElementById('cal-table-empty');
    const totalCountEl = document.getElementById('cal-table-total-count');
    if (!tbody) return;

    // Filter controls
    const catSelect = document.getElementById('cal-table-category-select');
    const srcSelect = document.getElementById('cal-table-source-select');
    const searchInput = document.getElementById('cal-table-search-input');

    const selectedCategory = catSelect ? catSelect.value : 'all';
    const selectedSource = srcSelect ? srcSelect.value : 'all';
    const tableSearch = searchInput ? searchInput.value.trim().toLowerCase() : '';

    // Filter events
    let filtered = events.filter(e => {
      // Calendar visibility from rail toggle
      if (!activeCalendars.has(e.calendar)) return false;

      // Table category filter
      if (selectedCategory !== 'all' && (e.category || '').toLowerCase() !== selectedCategory) {
        return false;
      }

      // Table source filter
      if (selectedSource !== 'all' && (e.calendar || '').toLowerCase() !== selectedSource) {
        return false;
      }

      // Table search filter
      if (tableSearch) {
        const titleMatch = (e.title || '').toLowerCase().includes(tableSearch);
        const projMatch = (e.project || '').toLowerCase().includes(tableSearch);
        const descMatch = (e.desc || '').toLowerCase().includes(tableSearch);
        const attendeesMatch = Array.isArray(e.attendees) && e.attendees.some(a => a.toLowerCase().includes(tableSearch));
        if (!titleMatch && !projMatch && !descMatch && !attendeesMatch) return false;
      }

      // Global navbar search filter if active
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const m1 = (e.title || '').toLowerCase().includes(q);
        const m2 = (e.project || '').toLowerCase().includes(q);
        if (!m1 && !m2) return false;
      }

      return true;
    });

    // Sort by date, then startTime
    filtered.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.startMinutes || 0) - (b.startMinutes || 0);
    });

    if (totalCountEl) {
      totalCountEl.textContent = filtered.length;
    }

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.classList.remove('d-none');
      return;
    }

    if (emptyState) emptyState.classList.add('d-none');

    const rowsHtml = filtered.map(evt => {
      // Date formatting
      const dateParts = evt.date.split('-');
      const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
      const dayName = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][dateObj.getDay()];
      const monthName = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][dateObj.getMonth()];
      const dayNum = dateObj.getDate();
      const formattedDate = `${dayName}, ${dayNum} ${monthName}`;

      // Project pill
      const projectHtml = evt.project ? `<span class="cal-table-project-pill">${escapeHtml(evt.project)}</span>` : '<span class="text-muted">—</span>';

      // Category pill
      const catClass = `cat-${(evt.category || 'meeting').toLowerCase()}`;
      const categoryHtml = `<span class="cal-table-cat-pill ${catClass}">${escapeHtml((evt.category || 'meeting').toUpperCase())}</span>`;

      // Source badge
      const srcName = evt.calendar === 'brick' ? 'Brick' : evt.calendar === 'google' ? 'Google' : 'Microsoft 365';
      const srcClass = `source-${(evt.calendar || 'brick').toLowerCase()}`;
      const sourceHtml = `<span class="cal-table-source-badge ${srcClass}"><span class="cal-table-source-dot"></span>${srcName}</span>`;

      // Attendees initials avatars
      let avatarsHtml = '';
      if (Array.isArray(evt.attendees) && evt.attendees.length > 0) {
        avatarsHtml = '<div class="cal-table-avatar-stack">';
        evt.attendees.slice(0, 3).forEach(name => {
          const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
          avatarsHtml += `<span class="cal-table-avatar" title="${escapeHtml(name)}">${initials}</span>`;
        });
        if (evt.attendees.length > 3) {
          avatarsHtml += `<span class="cal-table-avatar" title="More">+${evt.attendees.length - 3}</span>`;
        }
        avatarsHtml += '</div>';
      } else {
        avatarsHtml = '<span class="text-muted">—</span>';
      }

      // Icon template
      const iconKey = evt.icon && ICONS[evt.icon] ? evt.icon : 'calendar';
      const iconSvg = ICONS[iconKey] || ICONS.calendar;

      return `
        <tr class="cal-table-row" data-event-id="${escapeHtml(evt.id)}">
          <td>
            <div class="cal-table-datetime-cell">
              <span class="cal-table-date-text">${formattedDate}</span>
              <span class="cal-table-time-text">${escapeHtml(evt.startTime)} – ${escapeHtml(evt.endTime)}</span>
            </div>
          </td>
          <td>
            <div class="cal-table-event-cell">
              <div class="cal-table-event-title-wrap">
                <span class="cal-table-event-icon">${iconSvg}</span>
                <span class="cal-table-event-title">${escapeHtml(evt.title)}</span>
              </div>
              ${evt.desc ? `<span class="cal-table-event-desc">${escapeHtml(evt.desc)}</span>` : ''}
            </div>
          </td>
          <td>${projectHtml}</td>
          <td>${categoryHtml}</td>
          <td>${avatarsHtml}</td>
          <td>${sourceHtml}</td>
          <td>
            <div class="cal-table-actions-cell" onclick="event.stopPropagation()">
              <button class="cal-table-action-btn btn-edit" data-action="edit" data-event-id="${escapeHtml(evt.id)}" title="Edit event">Edit</button>
              <button class="cal-table-action-btn btn-delete" data-action="delete" data-event-id="${escapeHtml(evt.id)}" title="Delete event">✕</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.innerHTML = rowsHtml;

    // Row click listeners
    tbody.querySelectorAll('.cal-table-row').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('.cal-table-actions-cell')) return;
        const evtId = row.getAttribute('data-event-id');
        const targetEvt = events.find(item => item.id === evtId);
        if (targetEvt) openEventDetails(targetEvt);
      });
    });

    // Action button listeners
    tbody.querySelectorAll('.cal-table-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.getAttribute('data-action');
        const evtId = btn.getAttribute('data-event-id');
        const targetEvt = events.find(item => item.id === evtId);
        if (!targetEvt) return;

        if (action === 'edit') {
          selectedEvent = targetEvt;
          openCreateModal({ isEdit: true });
        } else if (action === 'delete') {
          selectedEvent = targetEvt;
          deleteSelectedEvent();
        }
      });
    });
  }

  /**
   * Switch between Day, Week, Month, Agenda, Table
   */
  function switchView(viewName) {
    currentView = viewName;

    // Update buttons
    document.querySelectorAll('.segmented-view-group .view-btn').forEach(btn => {
      const isTarget = btn.getAttribute('data-view') === viewName;
      btn.classList.toggle('active', isTarget);
      btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
    });

    // Update panes
    document.querySelectorAll('.calendar-view-pane').forEach(pane => {
      pane.classList.remove('active');
    });
    const targetPane = document.getElementById(`pane-${viewName}`);
    if (targetPane) targetPane.classList.add('active');

    updatePeriodDisplay();

    // Render corresponding pane
    if (viewName === 'week') renderWeekView();
    else if (viewName === 'day') renderDayView();
    else if (viewName === 'month') renderMonthView();
    else if (viewName === 'agenda') renderAgendaView();
    else if (viewName === 'table') renderTableView();
  }

  /**
   * Navigation: Prev, Next, Today
   */
  function navigatePeriod(direction) {
    if (currentView === 'week') {
      currentBaseDate.setDate(currentBaseDate.getDate() + (direction * 7));
    } else if (currentView === 'day') {
      currentBaseDate.setDate(currentBaseDate.getDate() + direction);
    } else if (currentView === 'month' || currentView === 'agenda' || currentView === 'table') {
      currentBaseDate.setMonth(currentBaseDate.getMonth() + direction);
    }
    updatePeriodDisplay();
    switchView(currentView);
  }

  function goToday() {
    currentBaseDate = new Date(2026, 9, 26); // Default reference demo week
    updatePeriodDisplay();
    switchView(currentView);
  }

  /**
   * Helper functions for Event Details Side Drawer
   */
  function updateRsvpUi(status) {
    const rsvpLabel = document.getElementById('drawer-rsvp-label');
    const rsvpBtn = document.getElementById('drawer-rsvp-btn');
    if (!rsvpLabel || !rsvpBtn) return;

    rsvpLabel.textContent = status;
    rsvpBtn.className = 'rsvp-pill-btn';
    if (status === 'Tentative') {
      rsvpBtn.classList.add('tentative');
    } else if (status === 'Declined') {
      rsvpBtn.classList.add('declined');
    }
  }

  function renderAgendaItems(items = []) {
    const list = document.getElementById('drawer-agenda-list');
    if (!list) return;
    list.innerHTML = items.map((item, idx) => `
      <div class="agenda-item-row">
        <span class="agenda-num">${String(idx + 1).padStart(2, '0')}</span>
        <span class="agenda-text">${escapeHtml(item)}</span>
      </div>
    `).join('');
  }

  function renderFollowupItems(tasks = []) {
    const list = document.getElementById('drawer-followups-list');
    if (!list) return;
    list.innerHTML = tasks.map(t => `
      <div class="followup-task-row ${t.completed ? 'is-completed' : ''}" data-task-id="${t.id || ''}">
        <div class="followup-left">
          <span class="followup-dot-icon"></span>
          <span class="followup-title">${escapeHtml(t.title)}</span>
        </div>
        <div class="followup-right">
          <span class="followup-meta">${escapeHtml(t.assignee || 'Assigned')} · ${escapeHtml(t.due || 'Soon')}</span>
          <span class="followup-arrow">→</span>
        </div>
      </div>
    `).join('');

    // Attach task toggle listeners
    list.querySelectorAll('.followup-task-row').forEach(row => {
      row.addEventListener('click', () => {
        const taskId = row.getAttribute('data-task-id');
        if (selectedEvent && selectedEvent.followups) {
          const task = selectedEvent.followups.find(item => item.id === taskId);
          if (task) {
            task.completed = !task.completed;
            row.classList.toggle('is-completed', task.completed);
            saveEvents();
            showToast(task.completed ? `Completed: "${task.title}"` : `Reopened: "${task.title}"`);
          }
        }
      });
    });
  }

  /**
   * Event Details Side Drawer (Matching Brick reference screenshot)
   */
  function openEventDetails(evt) {
    if (!evt) return;
    evt = normalizeEvent(evt);
    selectedEvent = evt;

    const drawer = document.getElementById('event-details-drawer');
    const backdrop = document.getElementById('event-drawer-backdrop');
    if (!drawer) return;

    // A. Header
    const breadcrumbEl = document.getElementById('drawer-breadcrumb');
    if (breadcrumbEl) breadcrumbEl.textContent = evt.breadcrumb;

    const titleEl = document.getElementById('drawer-event-title');
    if (titleEl) {
      let t = evt.title || 'Event';
      if (!t.endsWith('.')) t += '.';
      titleEl.textContent = t;
    }

    const catBadge = document.getElementById('drawer-badge-category');
    if (catBadge) {
      catBadge.textContent = (evt.category || 'MEETING').toUpperCase();
      catBadge.className = 'drawer-badge-pill theme-' + (evt.colorTheme || 'lavender');
    }

    const projEl = document.getElementById('drawer-project-name');
    if (projEl) projEl.textContent = evt.project || 'Website Redesign';

    // B. Date & Time Split Card
    const d = new Date(evt.date + 'T00:00:00');
    const dayNumEl = document.getElementById('drawer-day-num');
    if (dayNumEl) dayNumEl.textContent = d.getDate();

    const daySubEl = document.getElementById('drawer-day-sub');
    if (daySubEl) {
      const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      daySubEl.textContent = `${dayNames[d.getDay()]} / ${monthNames[d.getMonth()]}`;
    }

    const timeRangeEl = document.getElementById('drawer-time-range');
    if (timeRangeEl) timeRangeEl.textContent = `${evt.startTime} — ${evt.endTime}`;

    const fullDateEl = document.getElementById('drawer-full-date');
    if (fullDateEl) {
      fullDateEl.textContent = `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()} · IST`;
    }

    // C. Organiser & RSVP
    const orgNameEl = document.getElementById('drawer-organizer-name');
    if (orgNameEl) orgNameEl.textContent = evt.organizer ? (evt.organizer.name || evt.organizer) : 'Alex R.';

    updateRsvpUi(evt.rsvp || 'Accepted');

    // D. Attendees Card
    const countEl = document.getElementById('drawer-attendees-count');
    const count = evt.attendeesList ? evt.attendeesList.length : (evt.attendees ? evt.attendees.length : 4);
    if (countEl) countEl.textContent = `${String(count).padStart(2, '0')} INVITED`;

    const avatarsContainer = document.getElementById('drawer-attendees-avatars');
    if (avatarsContainer && evt.attendeesList) {
      avatarsContainer.innerHTML = evt.attendeesList.map(a => `
        <div class="attendee-avatar ${a.theme || 'avatar-pk'}" title="${escapeHtml(a.name)} (${escapeHtml(a.status || 'Accepted')})">${escapeHtml(a.initials)}</div>
      `).join('');
    }

    const meetingLinkEl = document.getElementById('drawer-meeting-link');
    if (meetingLinkEl) {
      const url = evt.meetingUrl || 'https://meet.acme.co/design-review';
      meetingLinkEl.textContent = url;
      meetingLinkEl.href = url;
    }

    // E. Agenda Card (Lavender)
    renderAgendaItems(evt.agenda);

    // F. Notes Card (Neutral)
    const notesTsEl = document.getElementById('drawer-notes-timestamp');
    if (notesTsEl) notesTsEl.textContent = evt.notesTimestamp || 'Saved 5 min ago';

    const notesTextEl = document.getElementById('drawer-notes-text');
    if (notesTextEl) notesTextEl.textContent = evt.notes;

    // G. Decisions Card (Sage)
    const decTitleEl = document.getElementById('drawer-decision-title');
    if (decTitleEl) decTitleEl.textContent = evt.decision ? evt.decision.title : 'Proceed with the revised homepage layout.';

    const decSubEl = document.getElementById('drawer-decision-sub');
    if (decSubEl) decSubEl.textContent = evt.decision ? evt.decision.status : 'Approved internally · Client confirmation pending';

    // H. Follow-up Work Card (Blue)
    renderFollowupItems(evt.followups);

    // Open Drawer & Backdrop
    drawer.classList.add('is-open');
    if (backdrop) backdrop.classList.add('show');
  }

  function closeEventDetails() {
    closeEventDrawer();
  }

  function closeEventDrawer() {
    const drawer = document.getElementById('event-details-drawer');
    const backdrop = document.getElementById('event-drawer-backdrop');
    if (drawer) drawer.classList.remove('is-open');
    if (backdrop) backdrop.classList.remove('show');
    const rsvpMenu = document.getElementById('drawer-rsvp-menu');
    if (rsvpMenu) rsvpMenu.classList.remove('show');
  }

  /**
   * Modals: Create / Edit Event
   */
  function openCreateModal(defaults = {}) {
    const modal = document.getElementById('event-create-modal');
    if (!modal) return;

    const idInput = document.getElementById('form-event-id');
    const titleInput = document.getElementById('form-event-title');
    const dateInput = document.getElementById('form-event-date');
    const startInput = document.getElementById('form-start-time');
    const endInput = document.getElementById('form-end-time');
    const projectSelect = document.getElementById('form-event-project');
    const categorySelect = document.getElementById('form-event-category');
    const calendarSelect = document.getElementById('form-event-calendar');
    const descInput = document.getElementById('form-event-desc');
    const modalTitle = document.getElementById('create-modal-title');

    if (defaults.isEdit && selectedEvent) {
      modalTitle.textContent = 'Edit Event';
      idInput.value = selectedEvent.id;
      titleInput.value = selectedEvent.title;
      dateInput.value = selectedEvent.date;
      startInput.value = selectedEvent.startTime;
      endInput.value = selectedEvent.endTime;
      projectSelect.value = selectedEvent.project || 'Website Redesign';
      categorySelect.value = selectedEvent.category || 'meeting';
      calendarSelect.value = selectedEvent.calendar || 'brick';
      descInput.value = selectedEvent.desc || '';
    } else {
      modalTitle.textContent = 'Create New Event';
      idInput.value = '';
      titleInput.value = '';
      dateInput.value = defaults.date || formatDateKey(currentBaseDate);
      startInput.value = defaults.startTime || '10:00';
      endInput.value = defaults.endTime || '11:00';
      projectSelect.value = 'Website Redesign';
      categorySelect.value = 'meeting';
      calendarSelect.value = 'brick';
      descInput.value = '';
    }

    modal.classList.add('show');
    titleInput.focus();
  }

  function closeCreateModal() {
    const modal = document.getElementById('event-create-modal');
    if (modal) modal.classList.remove('show');
  }

  function saveEventForm(e) {
    e.preventDefault();
    const id = document.getElementById('form-event-id').value;
    const title = document.getElementById('form-event-title').value.trim();
    const date = document.getElementById('form-event-date').value;
    const startTime = document.getElementById('form-start-time').value;
    const endTime = document.getElementById('form-end-time').value;
    const project = document.getElementById('form-event-project').value;
    const category = document.getElementById('form-event-category').value;
    const calendar = document.getElementById('form-event-calendar').value;
    const desc = document.getElementById('form-event-desc').value.trim();

    if (!title || !date || !startTime || !endTime) {
      alert('Please fill in title, date, start time, and end time.');
      return;
    }

    // Minutes calculation
    const startMins = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
    const endMins = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);

    // Theme & Icon matching
    const categoryThemes = {
      meeting: { theme: 'lavender', icon: 'team' },
      focus: { theme: 'blue', icon: 'document' },
      task: { theme: 'cream', icon: 'check' },
      review: { theme: 'peach', icon: 'team' },
      milestone: { theme: 'lime', icon: 'box' }
    };
    const { theme, icon } = categoryThemes[category] || { theme: 'blue', icon: 'team' };

    const eventDate = new Date(date + 'T00:00:00');
    const dayOfWeek = (eventDate.getDay() + 6) % 7; // Monday = 0

    if (id) {
      // Edit existing
      const idx = events.findIndex(item => item.id === id);
      if (idx !== -1) {
        events[idx] = {
          ...events[idx],
          title,
          date,
          dayOfWeek,
          startTime,
          endTime,
          startMinutes: startMins,
          endMinutes: endMins,
          project,
          category,
          colorTheme: theme,
          calendar,
          icon,
          desc
        };
        persistEventToBackend(events[idx], true);
        showToast(`Event "${title}" updated`);
      }
    } else {
      // Create new
      const newEvt = {
        id: 'evt-custom-' + Date.now(),
        title,
        date,
        dayOfWeek,
        startTime,
        endTime,
        startMinutes: startMins,
        endMinutes: endMins,
        project,
        sub: project,
        category,
        colorTheme: theme,
        calendar,
        icon,
        location: 'meet.google.com/teamden-' + Math.floor(Math.random() * 900 + 100),
        attendees: ['Alex Rivera', 'Priya Kapoor'],
        desc
      };
      events.push(newEvt);
      persistEventToBackend(newEvt, false);
      showToast(`Event "${title}" scheduled!`);
    }

    saveEvents();
    closeCreateModal();
    closeEventDetails();
    switchView(currentView);
  }

  function deleteSelectedEvent() {
    if (!selectedEvent) return;
    if (confirm(`Are you sure you want to delete "${selectedEvent.title}"?`)) {
      const targetId = selectedEvent.id;
      events = events.filter(e => e.id !== targetId);
      deleteEventFromBackend(targetId);
      saveEvents();
      showToast(`Deleted "${selectedEvent.title}"`);
      closeEventDetails();
      switchView(currentView);
    }
  }

  /**
   * Modals: Team Availability Matrix
   */
  function openTeamAvailabilityModal() {
    const modal = document.getElementById('team-avail-modal');
    if (!modal) return;

    renderTeamMatrix();
    modal.classList.add('show');
  }

  function closeTeamAvailabilityModal() {
    const modal = document.getElementById('team-avail-modal');
    if (modal) modal.classList.remove('show');
  }

  function renderTeamMatrix() {
    const matrix = document.getElementById('team-schedule-matrix');
    const label = document.getElementById('avail-current-day-label');
    if (!matrix || !label) return;

    const d = new Date(currentBaseDate);
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
    label.textContent = `${dayName}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;

    // Sample availability slots
    const slots = [
      { time: '09:00 - 10:00', pk: 'busy', ar: 'free', sk: 'free', mj: 'busy' },
      { time: '10:00 - 11:00', pk: 'free', ar: 'free', sk: 'free', mj: 'free', allFree: true },
      { time: '11:00 - 12:00', pk: 'busy', ar: 'busy', sk: 'free', mj: 'busy' },
      { time: '13:00 - 14:00', pk: 'free', ar: 'busy', sk: 'free', mj: 'free' },
      { time: '14:00 - 15:00', pk: 'free', ar: 'free', sk: 'free', mj: 'free', allFree: true },
      { time: '15:00 - 16:00', pk: 'free', ar: 'free', sk: 'free', mj: 'free', allFree: true },
      { time: '16:00 - 17:00', pk: 'busy', ar: 'free', sk: 'busy', mj: 'free' }
    ];

    matrix.innerHTML = `
      <div style="display: grid; grid-template-columns: 80px repeat(4, 1fr); padding: 0.2rem 0.6rem; font-size: 0.6875rem; font-weight: 800; color: #888;">
        <div>TIME</div>
        <div style="text-align: center;">PK</div>
        <div style="text-align: center;">AR</div>
        <div style="text-align: center;">SK</div>
        <div style="text-align: center;">MJ</div>
      </div>
      ${slots.map((s, idx) => `
        <div class="matrix-time-slot ${s.allFree ? 'all-free' : ''} ${idx === 1 ? 'selected' : ''}" data-slot-time="${s.time.split(' - ')[0]}">
          <span class="slot-time-text">${s.time}</span>
          <span class="slot-member-status ${s.pk}">${s.pk === 'free' ? 'Free' : 'Busy'}</span>
          <span class="slot-member-status ${s.ar}">${s.ar === 'free' ? 'Free' : 'Busy'}</span>
          <span class="slot-member-status ${s.sk}">${s.sk === 'free' ? 'Free' : 'Busy'}</span>
          <span class="slot-member-status ${s.mj}">${s.mj === 'free' ? 'Free' : 'Busy'}</span>
        </div>
      `).join('')}
    `;

    matrix.querySelectorAll('.matrix-time-slot').forEach(row => {
      row.addEventListener('click', () => {
        matrix.querySelectorAll('.matrix-time-slot').forEach(r => r.classList.remove('selected'));
        row.classList.add('selected');
      });
    });
  }

  /**
   * Modals: Manage Calendars
   */
  function openManageCalendarsModal() {
    const modal = document.getElementById('manage-calendars-modal');
    if (modal) modal.classList.add('show');
  }

  function closeManageCalendarsModal() {
    const modal = document.getElementById('manage-calendars-modal');
    if (modal) modal.classList.remove('show');
  }

  /**
   * Wire up event listeners
   */
  function bindEvents() {
    // 1. View Switcher Tabs
    document.querySelectorAll('.segmented-view-group .view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const view = btn.getAttribute('data-view');
        switchView(view);
      });
    });

    // 2. Navigation Actions
    const prevBtn = document.getElementById('cal-prev-btn');
    if (prevBtn) prevBtn.addEventListener('click', () => navigatePeriod(-1));

    const nextBtn = document.getElementById('cal-next-btn');
    if (nextBtn) nextBtn.addEventListener('click', () => navigatePeriod(1));

    const todayBtn = document.getElementById('cal-today-btn');
    if (todayBtn) todayBtn.addEventListener('click', goToday);

    // 3. Calendar Checkboxes in Right Rail
    document.querySelectorAll('.cal-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        const cal = cb.getAttribute('data-calendar');
        if (cb.checked) {
          activeCalendars.add(cal);
        } else {
          activeCalendars.delete(cal);
        }
        switchView(currentView);
        showToast(`Updated calendar visibility`);
      });
    });

    // 4. Next Commitment Card Action
    const openMeetBtn = document.getElementById('btn-open-meeting');
    if (openMeetBtn) {
      openMeetBtn.addEventListener('click', () => {
        const nextEvt = events.find(e => e.id === 'evt-thu-2') || events[0];
        if (nextEvt) openEventDetails(nextEvt);
      });
    }

    // 5. Needs Scheduling Card Action
    const findTimeBtn = document.getElementById('btn-needs-scheduling-action');
    if (findTimeBtn) {
      findTimeBtn.addEventListener('click', () => {
        openCreateModal({
          date: '2026-10-27',
          startTime: '14:00',
          endTime: '15:00',
          title: 'Homepage approval review'
        });
      });
    }

    // 6. Team Availability Card Action
    const teamAvailBtn = document.getElementById('btn-team-avail-action');
    if (teamAvailBtn) teamAvailBtn.addEventListener('click', openTeamAvailabilityModal);

    const btnScheduleSlot = document.getElementById('btn-schedule-slot');
    if (btnScheduleSlot) {
      btnScheduleSlot.addEventListener('click', () => {
        closeTeamAvailabilityModal();
        const selectedSlot = document.querySelector('.matrix-time-slot.selected');
        const time = selectedSlot ? selectedSlot.getAttribute('data-slot-time') : '10:00';
        openCreateModal({
          date: formatDateKey(currentBaseDate),
          startTime: time,
          title: 'Team sync (Shared availability)'
        });
      });
    }

    // 7. Manage Calendars Buttons
    const manageCalBtn = document.getElementById('btn-manage-calendars');
    if (manageCalBtn) manageCalBtn.addEventListener('click', openManageCalendarsModal);

    const addCalBtn = document.getElementById('btn-add-calendar');
    if (addCalBtn) addCalBtn.addEventListener('click', openManageCalendarsModal);

    // 8. Event Details Side Drawer Actions
    const drawerCloseBtn = document.getElementById('drawer-btn-close');
    if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeEventDrawer);

    const drawerBackdrop = document.getElementById('event-drawer-backdrop');
    if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeEventDrawer);

    // RSVP dropdown toggle & selection
    const drawerRsvpBtn = document.getElementById('drawer-rsvp-btn');
    const drawerRsvpMenu = document.getElementById('drawer-rsvp-menu');
    if (drawerRsvpBtn && drawerRsvpMenu) {
      drawerRsvpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        drawerRsvpMenu.classList.toggle('show');
      });

      drawerRsvpMenu.querySelectorAll('.rsvp-option').forEach(opt => {
        opt.addEventListener('click', (e) => {
          e.stopPropagation();
          const status = opt.getAttribute('data-status');
          if (selectedEvent) {
            selectedEvent.rsvp = status;
            updateRsvpUi(status);
            saveEvents();
            showToast(`Response updated to: ${status}`);
          }
          drawerRsvpMenu.classList.remove('show');
        });
      });

      document.addEventListener('click', (e) => {
        if (!e.target.closest('.rsvp-dropdown-wrapper')) {
          drawerRsvpMenu.classList.remove('show');
        }
      });
    }

    // Drawer button: Open Meeting Workspace
    const drawerWorkspaceBtn = document.getElementById('drawer-btn-workspace');
    if (drawerWorkspaceBtn) {
      drawerWorkspaceBtn.addEventListener('click', () => {
        showToast(`Opening meeting workspace for ${selectedEvent ? selectedEvent.title : 'event'}`);
      });
    }

    // Drawer button: Join Meeting
    const drawerJoinBtn = document.getElementById('drawer-btn-join');
    if (drawerJoinBtn) {
      drawerJoinBtn.addEventListener('click', () => {
        const url = (selectedEvent && selectedEvent.meetingUrl) ? selectedEvent.meetingUrl : 'https://meet.acme.co/design-review';
        window.open(url, '_blank');
        showToast(`Joining meeting: ${url}`);
      });
    }

    // Drawer button: Copy Meeting Link
    const drawerCopyBtn = document.getElementById('drawer-btn-copy-link');
    if (drawerCopyBtn) {
      drawerCopyBtn.addEventListener('click', () => {
        const link = document.getElementById('drawer-meeting-link');
        const text = link ? (link.href || link.textContent) : 'https://meet.acme.co/design-review';
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text).then(() => {
            showToast('Meeting link copied to clipboard!');
          }).catch(() => {
            showToast('Meeting link copied!');
          });
        } else {
          showToast('Meeting link copied!');
        }
      });
    }

    // Drawer button: View Responses
    const drawerResponsesBtn = document.getElementById('drawer-btn-view-responses');
    if (drawerResponsesBtn) {
      drawerResponsesBtn.addEventListener('click', () => {
        showToast('All 4 invited team members have Accepted.');
      });
    }

    // Drawer button: Edit Agenda
    const drawerEditAgendaBtn = document.getElementById('drawer-btn-edit-agenda');
    if (drawerEditAgendaBtn) {
      drawerEditAgendaBtn.addEventListener('click', () => {
        if (!selectedEvent) return;
        const newItem = prompt('Add agenda topic:', 'Discuss QA feedback & launch readiness');
        if (newItem && newItem.trim()) {
          if (!selectedEvent.agenda) selectedEvent.agenda = [];
          selectedEvent.agenda.push(newItem.trim());
          renderAgendaItems(selectedEvent.agenda);
          saveEvents();
          showToast('Agenda updated');
        }
      });
    }

    // Drawer button: Continue Notes
    const drawerContinueNotesBtn = document.getElementById('drawer-btn-continue-notes');
    if (drawerContinueNotesBtn) {
      drawerContinueNotesBtn.addEventListener('click', () => {
        if (!selectedEvent) return;
        const addNotes = prompt('Add meeting notes:', 'Followed up with team on launch readiness.');
        if (addNotes && addNotes.trim()) {
          selectedEvent.notes = (selectedEvent.notes ? selectedEvent.notes + ' ' : '') + addNotes.trim();
          selectedEvent.notesTimestamp = 'Saved just now';
          const notesTextEl = document.getElementById('drawer-notes-text');
          const notesTsEl = document.getElementById('drawer-notes-timestamp');
          if (notesTextEl) notesTextEl.textContent = selectedEvent.notes;
          if (notesTsEl) notesTsEl.textContent = selectedEvent.notesTimestamp;
          saveEvents();
          showToast('Notes saved');
        }
      });
    }

    // Drawer button: Open Decision Record
    const drawerDecisionBtn = document.getElementById('drawer-btn-open-decision');
    if (drawerDecisionBtn) {
      drawerDecisionBtn.addEventListener('click', () => {
        showToast(`Decision record: ${selectedEvent ? selectedEvent.decision.title : 'Proceed with revised layout'}`);
      });
    }

    // Drawer button: Add Follow-up Task
    const drawerAddFollowupBtn = document.getElementById('drawer-btn-add-followup');
    if (drawerAddFollowupBtn) {
      drawerAddFollowupBtn.addEventListener('click', () => {
        if (!selectedEvent) return;
        const title = prompt('Enter follow-up task title:', 'Update style documentation');
        if (title && title.trim()) {
          if (!selectedEvent.followups) selectedEvent.followups = [];
          selectedEvent.followups.push({
            id: 'fu-' + Date.now(),
            title: title.trim(),
            assignee: 'Alex R.',
            due: 'Due 31 Oct',
            completed: false
          });
          renderFollowupItems(selectedEvent.followups);
          saveEvents();
          showToast(`Added task "${title.trim()}"`);
        }
      });
    }

    // Drawer button: View All Follow-ups
    const drawerAllFollowupsBtn = document.getElementById('drawer-btn-view-all-followups');
    if (drawerAllFollowupsBtn) {
      drawerAllFollowupsBtn.addEventListener('click', () => {
        showToast('Viewing all follow-up tasks in Task Manager');
      });
    }

    // Drawer button: Edit Details Button (Bottom)
    const drawerEditBtn = document.getElementById('drawer-btn-edit');
    if (drawerEditBtn) {
      drawerEditBtn.addEventListener('click', () => {
        if (selectedEvent) {
          closeEventDrawer();
          openCreateModal({ isEdit: true });
        }
      });
    }

    // Drawer button: Delete Event Button (Bottom)
    const drawerDeleteBtn = document.getElementById('drawer-btn-delete');
    if (drawerDeleteBtn) {
      drawerDeleteBtn.addEventListener('click', () => {
        deleteSelectedEvent();
      });
    }

    // Drawer button: Popout Button (Header)
    const drawerPopoutBtn = document.getElementById('drawer-btn-popout');
    if (drawerPopoutBtn) {
      drawerPopoutBtn.addEventListener('click', () => {
        showToast('Opened event in focused workspace');
      });
    }

    // Drawer button: More Options (Header)
    const drawerMoreBtn = document.getElementById('drawer-btn-more');
    if (drawerMoreBtn) {
      drawerMoreBtn.addEventListener('click', () => {
        showToast('Options: Duplicate event, Export .ics, Share event link');
      });
    }

    // 9. Modal Close Buttons
    const closeCreateBtn = document.getElementById('btn-close-create');
    if (closeCreateBtn) closeCreateBtn.addEventListener('click', closeCreateModal);

    const cancelCreateBtn = document.getElementById('btn-cancel-create');
    if (cancelCreateBtn) cancelCreateBtn.addEventListener('click', closeCreateModal);

    const closeTeamAvailBtn = document.getElementById('btn-close-team-avail');
    if (closeTeamAvailBtn) closeTeamAvailBtn.addEventListener('click', closeTeamAvailabilityModal);

    const closeAvailFooterBtn = document.getElementById('btn-close-avail-footer');
    if (closeAvailFooterBtn) closeAvailFooterBtn.addEventListener('click', closeTeamAvailabilityModal);

    const closeManageCalBtn = document.getElementById('btn-close-manage-cal');
    if (closeManageCalBtn) closeManageCalBtn.addEventListener('click', closeManageCalendarsModal);

    const closeManageFooterBtn = document.getElementById('btn-close-manage-footer');
    if (closeManageFooterBtn) closeManageFooterBtn.addEventListener('click', closeManageCalendarsModal);

    // 10. Modal Overlay Background Click to close
    document.querySelectorAll('.cal-modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('show');
        }
      });
    });

    // 11. Event Form Submission & Deletion
    const createForm = document.getElementById('create-event-form');
    if (createForm) createForm.addEventListener('submit', saveEventForm);

    const editBtn = document.getElementById('btn-edit-event');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        if (selectedEvent) {
          closeEventDetails();
          openCreateModal({ isEdit: true });
        }
      });
    }

    const deleteBtn = document.getElementById('btn-delete-event');
    if (deleteBtn) deleteBtn.addEventListener('click', deleteSelectedEvent);

    // 12. Subscribe Feed Button
    const subscribeBtn = document.getElementById('btn-subscribe-feed');
    if (subscribeBtn) {
      subscribeBtn.addEventListener('click', () => {
        const input = document.getElementById('ics-feed-input');
        if (input && input.value) {
          showToast('Subscribed to calendar feed');
          input.value = '';
          closeManageCalendarsModal();
        }
      });
    }

    // 13. Connect to Topbar Search Input
    const globalSearch = document.getElementById('global-search-input');
    if (globalSearch) {
      globalSearch.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        switchView(currentView);
      });
    }

    // 13.5 Connect to Table View Filters & Search
    const tableSearch = document.getElementById('cal-table-search-input');
    if (tableSearch) {
      tableSearch.addEventListener('input', () => {
        if (currentView === 'table') renderTableView();
      });
    }

    const tableCatSelect = document.getElementById('cal-table-category-select');
    if (tableCatSelect) {
      tableCatSelect.addEventListener('change', () => {
        if (currentView === 'table') renderTableView();
      });
    }

    const tableSrcSelect = document.getElementById('cal-table-source-select');
    if (tableSrcSelect) {
      tableSrcSelect.addEventListener('change', () => {
        if (currentView === 'table') renderTableView();
      });
    }

    const tableNewBtn = document.getElementById('btn-table-new-event');
    if (tableNewBtn) {
      tableNewBtn.addEventListener('click', () => {
        openCreateModal();
      });
    }

    // 14. Connect to Topbar "+ Create" Button
    // We delegate on document in case navbar is loaded dynamically
    document.addEventListener('click', (e) => {
      const createBtn = e.target.closest('#topbar-create-btn, .topbar-btn-create');
      if (createBtn) {
        e.preventDefault();
        openCreateModal();
      }
    });

    // 15. Keyboard ESC to close drawer and modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeEventDrawer();
        document.querySelectorAll('.cal-modal-overlay.show').forEach(m => m.classList.remove('show'));
      }
    });
  }

  /**
   * Main Initialization
   */
  async function init() {
    // 1. Mount Modular Fragments
    await Promise.all([
      loadFragment('/fragments/sidebar/sidebar.html', 'sidebar-mount'),
      loadFragment('/fragments/navbar/navbar.html', 'navbar-mount')
    ]);

    // 2. Hydrate Fragment Controllers
    if (window.Sidebar && typeof window.Sidebar.init === 'function') {
      window.Sidebar.init(currentUser);
    }
    if (window.Navbar && typeof window.Navbar.init === 'function') {
      window.Navbar.init(currentUser);
    }

    // 3. Load & Render Events
    await loadEvents();
    renderUpcomingCommitments();
    renderTimeGutter('cal-time-gutter');
    updatePeriodDisplay();
    switchView('week');

    // 4. Bind DOM Actions
    bindEvents();
  }

  // Boot on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
