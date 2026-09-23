/**
 * CNYKRA HOTEL HOUSEKEEPING OS - HOUSEKEEPER PORTAL CONTROLLER (FULL SCREEN)
 * Manages full-screen room turnover taskboard, cleaning timer, interactive sanitization checklist,
 * and mark-ready status updates.
 */

(function () {
  'use strict';

  let currentHkFilter = 'all'; // 'all' | 'pending' | 'cleaning' | 'ready'

  // DOM Elements
  const housekeeperSelect = document.getElementById('housekeeperSelect');
  const hkCurrentAvatar = document.getElementById('hkCurrentAvatar');
  const hkCurrentName = document.getElementById('hkCurrentName');
  const hkCurrentRole = document.getElementById('hkCurrentRole');
  const hkCurrentShift = document.getElementById('hkCurrentShift');
  const hkAssignedCount = document.getElementById('hkAssignedCount');
  const hkInProgressCount = document.getElementById('hkInProgressCount');
  const hkDoneCount = document.getElementById('hkDoneCount');

  const hkCountAll = document.getElementById('hkCountAll');
  const hkCountPending = document.getElementById('hkCountPending');
  const hkCountCleaning = document.getElementById('hkCountCleaning');
  const hkCountReady = document.getElementById('hkCountReady');
  const hkFilterTabs = document.querySelectorAll('[data-hk-filter]');

  const hkRoomList = document.getElementById('hkRoomList');
  const hkEmptyTasks = document.getElementById('hkEmptyTasks');

  // Format stopwatch helper
  function formatElapsedTime(ms) {
    if (!ms || ms < 0) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  // Populate Housekeeper dropdown
  function populateHousekeeperDropdown() {
    if (!housekeeperSelect) return;
    const staffList = window.cnykraStore.getHousekeepers();
    const activeStaff = window.cnykraStore.getActiveHousekeeper();

    housekeeperSelect.innerHTML = staffList.map(hk => `
      <option value="${hk.id}" ${hk.id === activeStaff.id ? 'selected' : ''}>
        ${hk.name} (${hk.role})
      </option>
    `).join('');

    updateStaffHeader(activeStaff);
  }

  function updateStaffHeader(activeStaff) {
    if (!activeStaff) return;
    if (hkCurrentAvatar) {
      hkCurrentAvatar.textContent = activeStaff.initials || 'HK';
      hkCurrentAvatar.style.backgroundColor = activeStaff.color || '#4f46e5';
    }
    if (hkCurrentName) hkCurrentName.textContent = activeStaff.name;
    if (hkCurrentRole) hkCurrentRole.textContent = activeStaff.role;
    if (hkCurrentShift) hkCurrentShift.textContent = activeStaff.shift;
  }

  // Render Housekeeper Task Queue
  function renderHousekeeperView() {
    const activeStaff = window.cnykraStore.getActiveHousekeeper();
    if (!activeStaff) return;

    updateStaffHeader(activeStaff);

    const allRooms = window.cnykraStore.getRooms();
    const staffRooms = allRooms.filter(r => r.assignedTo === activeStaff.id);

    // Calculate staff shift stats
    const pendingTasks = staffRooms.filter(r => r.status === 'assigned' || r.status === 'dirty');
    const inProgressTasks = staffRooms.filter(r => r.status === 'cleaning');
    const readyTasks = staffRooms.filter(r => r.status === 'ready' || r.status === 'inspected');

    if (hkAssignedCount) hkAssignedCount.textContent = staffRooms.length;
    if (hkInProgressCount) hkInProgressCount.textContent = inProgressTasks.length;
    if (hkDoneCount) hkDoneCount.textContent = readyTasks.length;

    // Filter counts
    if (hkCountAll) hkCountAll.textContent = staffRooms.length;
    if (hkCountPending) hkCountPending.textContent = pendingTasks.length;
    if (hkCountCleaning) hkCountCleaning.textContent = inProgressTasks.length;
    if (hkCountReady) hkCountReady.textContent = readyTasks.length;

    // Apply Filter
    let filteredRooms = staffRooms;
    if (currentHkFilter === 'pending') {
      filteredRooms = pendingTasks;
    } else if (currentHkFilter === 'cleaning') {
      filteredRooms = inProgressTasks;
    } else if (currentHkFilter === 'ready') {
      filteredRooms = readyTasks;
    }

    if (filteredRooms.length === 0) {
      hkRoomList.innerHTML = '';
      hkEmptyTasks.classList.remove('hidden');
      return;
    }

    hkEmptyTasks.classList.add('hidden');

    // Sort: In Progress first, then VIP, then High, then Normal, then completed
    const priorityWeight = { 'vip': 3, 'high': 2, 'normal': 1 };
    const statusWeight = { 'cleaning': 10, 'assigned': 5, 'dirty': 5, 'ready': 2, 'inspected': 1 };

    const sortedRooms = [...filteredRooms].sort((a, b) => {
      const swA = statusWeight[a.status] || 0;
      const swB = statusWeight[b.status] || 0;
      if (swA !== swB) return swB - swA;

      const pwA = priorityWeight[a.priority] || 1;
      const pwB = priorityWeight[b.priority] || 1;
      return pwB - pwA;
    });

    hkRoomList.innerHTML = sortedRooms.map(room => {
      const isCleaning = room.status === 'cleaning';
      const isReady = room.status === 'ready';
      const isInspected = room.status === 'inspected';
      const isAssigned = room.status === 'assigned' || room.status === 'dirty';

      // Status pill label
      let statusLabel = 'Assigned';
      let statusPillClass = 'assigned';
      if (isCleaning) {
        statusLabel = 'Cleaning in Progress';
        statusPillClass = 'cleaning';
      } else if (isReady) {
        statusLabel = 'Ready for Inspection';
        statusPillClass = 'ready';
      } else if (isInspected) {
        statusLabel = 'Approved by Manager';
        statusPillClass = 'inspected';
      }

      // Priority Tag
      let priorityTag = '';
      if (room.priority === 'vip') {
        priorityTag = '<span class="vip-badge">⭐ VIP Arrival</span>';
      } else if (room.priority === 'high') {
        priorityTag = '<span class="high-priority-badge">⚡ Priority</span>';
      }

      // Live Timer HTML if cleaning
      let timerBanner = '';
      if (isCleaning && room.cleaningStartedAt) {
        const elapsed = Date.now() - room.cleaningStartedAt;
        timerBanner = `
          <div class="cleaning-timer-box" data-hk-timer="${room.id}" data-timer-start="${room.cleaningStartedAt}">
            <div style="display:flex; align-items:center; gap:6px; font-weight:600;">
              <span>⏱️ Turnaround Stopwatch:</span>
            </div>
            <div class="timer-val">${formatElapsedTime(elapsed)}</div>
          </div>
        `;
      } else if ((isReady || isInspected) && room.cleaningStartedAt && room.cleaningCompletedAt) {
        const diffMins = Math.max(1, Math.round((room.cleaningCompletedAt - room.cleaningStartedAt) / (1000 * 60)));
        timerBanner = `
          <div class="ready-timestamp-box">
            <span>✨ Turnaround Finished</span>
            <span>Duration: <strong>${diffMins} mins</strong></span>
          </div>
        `;
      }

      // Checklist HTML
      let checklistHtml = '';
      if (isCleaning || isReady || isInspected) {
        checklistHtml = `
          <div class="hk-checklist">
            <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:4px;">
              Sanitization Protocol
            </div>
            ${(room.checklist || []).map((item, idx) => `
              <label class="hk-check-item ${item.completed ? 'done' : ''}">
                <input type="checkbox" data-room-id="${room.id}" data-check-index="${idx}" ${item.completed ? 'checked' : ''} ${!isCleaning ? 'disabled' : ''}>
                <span>${escapeHtml(item.task)}</span>
              </label>
            `).join('')}
          </div>
        `;
      }

      // Action Buttons
      let actionHtml = '';
      if (isAssigned) {
        actionHtml = `
          <button class="btn-hk-start" data-hk-action="start" data-room-id="${room.id}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            <span>Start Cleaning</span>
          </button>
        `;
      } else if (isCleaning) {
        actionHtml = `
          <button class="btn-hk-ready" data-hk-action="ready" data-room-id="${room.id}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>Mark Ready for Inspection</span>
          </button>
        `;
      } else if (isReady) {
        actionHtml = `
          <div class="btn-hk-completed">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>Marked Ready • Awaiting Manager Approval</span>
          </div>
        `;
      } else if (isInspected) {
        actionHtml = `
          <div class="btn-hk-completed" style="color:var(--status-inspected); border-color: var(--status-inspected-border); background: var(--status-inspected-bg);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            <span>Approved by Manager</span>
          </div>
        `;
      }

      return `
        <article class="room-card status-${room.status}" data-room-id="${room.id}">
          <div class="rc-header">
            <div>
              <div class="rc-room-num-wrap">
                <span class="rc-room-num">Room ${room.number}</span>
                <span class="rc-floor-tag">Floor ${room.floor}</span>
                ${priorityTag}
              </div>
              <div class="rc-type-title">${room.type}</div>
            </div>
            <span class="status-pill ${statusPillClass}">
              ${statusLabel}
            </span>
          </div>

          <div class="rc-body">
            ${room.notes ? `<div class="rc-notes"><strong>Front Desk Notes:</strong> ${escapeHtml(room.notes)}</div>` : ''}
            ${timerBanner}
            ${checklistHtml}
          </div>

          <div class="rc-footer" style="padding-top:10px;">
            ${actionHtml}
          </div>
        </article>
      `;
    }).join('');
  }

  // Update real-time cleaning timer on housekeeper screen
  function tickHkTimers() {
    const timerElements = document.querySelectorAll('[data-hk-timer]');
    timerElements.forEach(el => {
      const startMs = parseInt(el.getAttribute('data-timer-start'), 10);
      if (startMs) {
        const elapsed = Date.now() - startMs;
        const valEl = el.querySelector('.timer-val');
        if (valEl) {
          valEl.textContent = formatElapsedTime(elapsed);
        }
      }
    });
  }

  // HTML sanitization helper
  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Event Listeners
  function initEventListeners() {
    // Switch active housekeeper profile
    if (housekeeperSelect) {
      housekeeperSelect.addEventListener('change', (e) => {
        const staffId = e.target.value;
        window.cnykraStore.setActiveHousekeeper(staffId);
        renderHousekeeperView();
      });
    }

    // Filter tabs
    hkFilterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        hkFilterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentHkFilter = tab.getAttribute('data-hk-filter');
        renderHousekeeperView();
      });
    });

    // Delegated click handling on task cards
    hkRoomList.addEventListener('click', (e) => {
      // 1. "Start Cleaning" Button Clicked
      const startBtn = e.target.closest('[data-hk-action="start"]');
      if (startBtn) {
        const roomId = startBtn.getAttribute('data-room-id');
        const room = window.cnykraStore.startCleaning(roomId);
        if (room) {
          window.cnykraApp.playChime('start');
          window.cnykraApp.showToast(`Started cleaning Room ${room.number}. Stopwatch active.`, 'warning');
        }
        return;
      }

      // 2. "Mark Ready" Button Clicked
      const readyBtn = e.target.closest('[data-hk-action="ready"]');
      if (readyBtn) {
        const roomId = readyBtn.getAttribute('data-room-id');
        const room = window.cnykraStore.markReady(roomId);
        if (room) {
          window.cnykraApp.playChime('ready');
          window.cnykraApp.showToast(`Room ${room.number} marked Ready! Manager dashboard updated.`, 'success');
        }
        return;
      }
    });

    // Checkbox changes for sanitization items
    hkRoomList.addEventListener('change', (e) => {
      if (e.target.matches('input[type="checkbox"][data-room-id]')) {
        const roomId = e.target.getAttribute('data-room-id');
        const index = parseInt(e.target.getAttribute('data-check-index'), 10);
        window.cnykraStore.toggleChecklist(roomId, index);
        window.cnykraApp.playChime('tick');
      }
    });
  }

  // Initialize Housekeeper Controller
  function init() {
    populateHousekeeperDropdown();
    initEventListeners();
    renderHousekeeperView();

    // Subscribe to store updates
    window.cnykraStore.subscribe(() => {
      populateHousekeeperDropdown();
      renderHousekeeperView();
    });

    // Timer interval
    setInterval(tickHkTimers, 1000);
  }

  window.cnykraHousekeeper = {
    init,
    renderHousekeeperView
  };

})();
