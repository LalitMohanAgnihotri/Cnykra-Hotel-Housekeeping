/**
 * CNYKRA HOTEL HOUSEKEEPING OS - MANAGER DASHBOARD CONTROLLER
 * Handles room grid rendering, KPI updates, Add Room modal, assignment modal, and inspection flow.
 */

(function () {
  'use strict';

  let currentStatusFilter = 'all';
  let currentFloorFilter = 'all';
  let searchQuery = '';
  let activeLayout = 'grid'; // 'grid' | 'list'
  let targetAssignRoomId = null;
  let targetInspectRoomId = null;

  // DOM Elements
  const kpiTotal = document.getElementById('kpiTotal');
  const kpiDirty = document.getElementById('kpiDirty');
  const kpiUnassigned = document.getElementById('kpiUnassigned');
  const kpiCleaning = document.getElementById('kpiCleaning');
  const kpiReady = document.getElementById('kpiReady');
  const kpiInspected = document.getElementById('kpiInspected');

  const countFilterAll = document.getElementById('countFilterAll');
  const countFilterDirty = document.getElementById('countFilterDirty');
  const countFilterCleaning = document.getElementById('countFilterCleaning');
  const countFilterReady = document.getElementById('countFilterReady');
  const countFilterInspected = document.getElementById('countFilterInspected');

  const roomsContainer = document.getElementById('managerRoomsContainer');
  const emptyState = document.getElementById('emptyRoomsState');
  const floorFilter = document.getElementById('floorFilter');
  const searchInput = document.getElementById('roomSearchInput');
  const filterTabs = document.querySelectorAll('.filter-tab');
  const btnLayoutGrid = document.getElementById('btnLayoutGrid');
  const btnLayoutList = document.getElementById('btnLayoutList');
  const activityFeed = document.getElementById('activityFeed');

  // Modals
  const modalAddRoom = document.getElementById('modalAddRoom');
  const formAddRoom = document.getElementById('formAddRoom');
  const btnOpenAddRoom = document.getElementById('btnOpenAddRoom');
  const btnEmptyAddRoom = document.getElementById('btnEmptyAddRoom');
  const inputAssignee = document.getElementById('inputAssignee');

  const modalAssign = document.getElementById('modalAssign');
  const assignModalSubtitle = document.getElementById('assignModalSubtitle');
  const assignStaffList = document.getElementById('assignStaffList');

  const modalInspect = document.getElementById('modalInspect');
  const inspectModalSubtitle = document.getElementById('inspectModalSubtitle');
  const inspectModalContent = document.getElementById('inspectModalContent');
  const btnInspectApprove = document.getElementById('btnInspectApprove');
  const btnInspectReject = document.getElementById('btnInspectReject');

  // Format stopwatch helper
  function formatElapsedTime(ms) {
    if (!ms || ms < 0) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function formatTimeDifference(startMs, endMs) {
    if (!startMs || !endMs) return '25 mins';
    const diffMins = Math.max(1, Math.round((endMs - startMs) / (1000 * 60)));
    return `${diffMins} mins`;
  }

  // Render KPI Numbers & Filter Counts
  function renderKPIs(rooms) {
    const total = rooms.length;
    const dirtyRooms = rooms.filter(r => r.status === 'dirty' || r.status === 'assigned');
    const unassigned = rooms.filter(r => (r.status === 'dirty' || r.status === 'assigned') && !r.assignedTo);
    const cleaning = rooms.filter(r => r.status === 'cleaning');
    const ready = rooms.filter(r => r.status === 'ready');
    const inspected = rooms.filter(r => r.status === 'inspected');

    if (kpiTotal) kpiTotal.textContent = total;
    if (kpiDirty) kpiDirty.textContent = dirtyRooms.length;
    if (kpiUnassigned) kpiUnassigned.textContent = unassigned.length;
    if (kpiCleaning) kpiCleaning.textContent = cleaning.length;
    if (kpiReady) kpiReady.textContent = ready.length;
    if (kpiInspected) kpiInspected.textContent = inspected.length;

    if (countFilterAll) countFilterAll.textContent = total;
    if (countFilterDirty) countFilterDirty.textContent = dirtyRooms.length;
    if (countFilterCleaning) countFilterCleaning.textContent = cleaning.length;
    if (countFilterReady) countFilterReady.textContent = ready.length;
    if (countFilterInspected) countFilterInspected.textContent = inspected.length;
  }

  // Filter Rooms based on current selection
  function getFilteredRooms(rooms) {
    return rooms.filter(room => {
      // Status filter
      if (currentStatusFilter === 'dirty' && !(room.status === 'dirty' || room.status === 'assigned')) {
        return false;
      }
      if (currentStatusFilter !== 'all' && currentStatusFilter !== 'dirty' && room.status !== currentStatusFilter) {
        return false;
      }

      // Floor filter
      if (currentFloorFilter !== 'all' && String(room.floor) !== String(currentFloorFilter)) {
        return false;
      }

      // Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const staff = window.cnykraStore.getHousekeeper(room.assignedTo);
        const staffName = staff ? staff.name.toLowerCase() : '';
        const matchNumber = room.number.toLowerCase().includes(q);
        const matchType = room.type.toLowerCase().includes(q);
        const matchNotes = (room.notes || '').toLowerCase().includes(q);
        const matchStaff = staffName.includes(q);

        if (!matchNumber && !matchType && !matchNotes && !matchStaff) {
          return false;
        }
      }

      return true;
    });
  }

  // Render Room Cards in Manager Dashboard
  function renderRooms() {
    const allRooms = window.cnykraStore.getRooms();
    renderKPIs(allRooms);

    const filteredRooms = getFilteredRooms(allRooms);

    if (filteredRooms.length === 0) {
      roomsContainer.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');

    const html = filteredRooms.map(room => {
      const staff = window.cnykraStore.getHousekeeper(room.assignedTo);
      const isCleaning = room.status === 'cleaning';
      const isReady = room.status === 'ready';
      const isInspected = room.status === 'inspected';
      const isAssigned = room.status === 'assigned' || (room.status === 'dirty' && room.assignedTo);
      const isDirty = room.status === 'dirty' && !room.assignedTo;

      // Status pill label & styling
      let statusLabel = 'Needs Cleaning';
      let statusPillClass = 'dirty';
      let pulseHtml = '';

      if (isCleaning) {
        statusLabel = 'Cleaning in Progress';
        statusPillClass = 'cleaning';
        pulseHtml = '<span class="pulse-indicator"></span>';
      } else if (isReady) {
        statusLabel = 'Ready for Inspection';
        statusPillClass = 'ready';
        pulseHtml = '<span class="pulse-indicator"></span>';
      } else if (isInspected) {
        statusLabel = 'Inspected & Clean';
        statusPillClass = 'inspected';
      } else if (isAssigned) {
        statusLabel = 'Assigned to Staff';
        statusPillClass = 'assigned';
      }

      // Priority badge
      let priorityBadge = '';
      if (room.priority === 'vip') {
        priorityBadge = '<span class="vip-badge">⭐ VIP Arrival</span>';
      } else if (room.priority === 'high') {
        priorityBadge = '<span class="high-priority-badge">⚡ High Priority</span>';
      }

      // Time indicators
      let timeIndicatorHtml = '';
      if (isCleaning && room.cleaningStartedAt) {
        const elapsed = Date.now() - room.cleaningStartedAt;
        timeIndicatorHtml = `
          <div class="cleaning-timer-box" data-timer-room="${room.id}" data-timer-start="${room.cleaningStartedAt}">
            <span>⏱️ Cleaning Time:</span>
            <span class="timer-val">${formatElapsedTime(elapsed)}</span>
          </div>
        `;
      } else if ((isReady || isInspected) && room.cleaningStartedAt && room.cleaningCompletedAt) {
        const durationStr = formatTimeDifference(room.cleaningStartedAt, room.cleaningCompletedAt);
        timeIndicatorHtml = `
          <div class="ready-timestamp-box">
            <span>✨ Turnaround Finished</span>
            <span>Duration: <strong>${durationStr}</strong></span>
          </div>
        `;
      }

      // Assignee Section
      let assigneeHtml = '';
      if (staff) {
        assigneeHtml = `
          <div class="rc-assignee" title="Assigned to ${staff.name}">
            <div class="staff-avatar-badge" style="background: ${staff.color || '#4f46e5'}">${staff.initials || 'HK'}</div>
            <div class="rc-assignee-info">
              <span class="rc-assignee-name">${staff.name}</span>
              <span class="rc-assignee-role">${staff.role}</span>
            </div>
          </div>
          <button class="btn-assign-quick" data-action="open-assign" data-room-id="${room.id}" title="Reassign staff">
            Reassign
          </button>
        `;
      } else {
        assigneeHtml = `
          <div class="rc-assignee">
            <div class="staff-avatar-badge unassigned">?</div>
            <div class="rc-assignee-info">
              <span class="rc-assignee-name" style="color: var(--text-muted);">Unassigned</span>
              <span class="rc-assignee-role">Waiting for staff</span>
            </div>
          </div>
          <button class="btn-assign-quick" data-action="open-assign" data-room-id="${room.id}">
            + Assign Staff
          </button>
        `;
      }

      // Quick Action Button (Inspect if Ready)
      let actionBtnHtml = '';
      if (isReady) {
        actionBtnHtml = `
          <button class="btn-action-inspect" data-action="open-inspect" data-room-id="${room.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>Inspect & Approve</span>
          </button>
        `;
      }

      return `
        <article class="room-card status-${room.status}" data-room-id="${room.id}">
          <div class="rc-header">
            <div>
              <div class="rc-room-num-wrap">
                <span class="rc-room-num">${room.number}</span>
                <span class="rc-floor-tag">Floor ${room.floor}</span>
                ${priorityBadge}
              </div>
              <div class="rc-type-title">${room.type}</div>
            </div>
            <span class="status-pill ${statusPillClass}">
              ${pulseHtml}
              ${statusLabel}
            </span>
          </div>

          <div class="rc-body">
            ${room.notes ? `<div class="rc-notes">${escapeHtml(room.notes)}</div>` : ''}
            ${timeIndicatorHtml}
          </div>

          <div class="rc-footer">
            ${actionBtnHtml ? actionBtnHtml : assigneeHtml}
            ${actionBtnHtml ? `<button class="btn-assign-quick" data-action="open-assign" data-room-id="${room.id}" title="Reassign">Reassign</button>` : ''}
          </div>
        </article>
      `;
    }).join('');

    roomsContainer.innerHTML = html;
  }

  // Update real-time cleaning stopwatches on manager dashboard
  function tickTimers() {
    const timerElements = document.querySelectorAll('[data-timer-room]');
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

  // Render Activity Log Stream
  function renderActivityFeed() {
    if (!activityFeed) return;
    const logs = window.cnykraStore.getActivityLogs();

    activityFeed.innerHTML = logs.map(log => `
      <div class="activity-item ${log.type}">
        <span class="activity-text">${escapeHtml(log.text)}</span>
        <span class="activity-time">${log.time}</span>
      </div>
    `).join('');
  }

  // Populate Assignee Select in Add Room Modal
  function populateAddRoomAssignees() {
    if (!inputAssignee) return;
    const housekeepers = window.cnykraStore.getHousekeepers();
    const rooms = window.cnykraStore.getRooms();

    const options = housekeepers.map(hk => {
      const activeCount = rooms.filter(r => r.assignedTo === hk.id && r.status !== 'inspected').length;
      return `<option value="${hk.id}">${hk.name} (${activeCount} active tasks)</option>`;
    }).join('');

    inputAssignee.innerHTML = `<option value="">-- Leave Unassigned for now --</option>` + options;
  }

  // Open Housekeeper Assignment Modal for a specific room
  function openAssignModal(roomId) {
    const room = window.cnykraStore.getRooms().find(r => r.id === roomId);
    if (!room) return;

    targetAssignRoomId = roomId;
    assignModalSubtitle.textContent = `Room ${room.number} • ${room.type} (Floor ${room.floor})`;

    const housekeepers = window.cnykraStore.getHousekeepers();
    const rooms = window.cnykraStore.getRooms();

    assignStaffList.innerHTML = housekeepers.map(hk => {
      const isCurrent = room.assignedTo === hk.id;
      const activeCount = rooms.filter(r => r.assignedTo === hk.id && (r.status === 'assigned' || r.status === 'cleaning')).length;
      const completedCount = rooms.filter(r => r.assignedTo === hk.id && (r.status === 'ready' || r.status === 'inspected')).length;

      return `
        <div class="staff-assign-card ${isCurrent ? 'is-selected' : ''}" data-staff-id="${hk.id}">
          <div class="staff-info-block">
            <div class="staff-avatar-badge lg" style="background: ${hk.color || '#4f46e5'}">${hk.initials || 'HK'}</div>
            <div>
              <div class="staff-text-name">${hk.name} ${isCurrent ? '<span style="color:var(--gold); font-size:0.75rem;">(Assigned)</span>' : ''}</div>
              <div class="staff-text-shift">${hk.role} • Shift: ${hk.shift}</div>
            </div>
          </div>
          <div class="staff-workload-badge">
            ${activeCount} Active / ${completedCount} Done
          </div>
        </div>
      `;
    }).join('');

    modalAssign.classList.remove('hidden');
  }

  // Open Room Inspection Modal
  function openInspectModal(roomId) {
    const room = window.cnykraStore.getRooms().find(r => r.id === roomId);
    if (!room) return;

    targetInspectRoomId = roomId;
    inspectModalSubtitle.textContent = `Room ${room.number} • ${room.type} (Floor ${room.floor})`;

    const staff = window.cnykraStore.getHousekeeper(room.assignedTo);
    const durationStr = formatTimeDifference(room.cleaningStartedAt, room.cleaningCompletedAt);

    const checklistHtml = (room.checklist || []).map(item => `
      <div style="display:flex; align-items:center; gap:8px; font-size:0.8rem; color:#94a3b8; padding: 4px 0;">
        <span style="color:var(--status-ready);">✓</span>
        <span>${escapeHtml(item.task)}</span>
      </div>
    `).join('');

    inspectModalContent.innerHTML = `
      <div class="inspect-summary-grid">
        <div class="inspect-info-box">
          <div class="inspect-info-lbl">Cleaned By</div>
          <div class="inspect-info-val">${staff ? staff.name : 'Housekeeper'}</div>
        </div>
        <div class="inspect-info-box">
          <div class="inspect-info-lbl">Cleaning Duration</div>
          <div class="inspect-info-val">${durationStr}</div>
        </div>
        <div class="inspect-info-box">
          <div class="inspect-info-lbl">Guest Priority</div>
          <div class="inspect-info-val" style="text-transform: capitalize;">${room.priority}</div>
        </div>
        <div class="inspect-info-box">
          <div class="inspect-info-lbl">Current Status</div>
          <div class="inspect-info-val" style="color: var(--status-ready);">Ready for Guest</div>
        </div>
      </div>

      <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px;">
        <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom: 8px;">
          Sanitization & Quality Checklist Verified by Attendant
        </div>
        <div style="display:flex; flex-direction:column; gap:4px;">
          ${checklistHtml}
        </div>
      </div>

      ${room.notes ? `
        <div style="font-size:0.8rem; color:var(--text-secondary); background: rgba(255,255,255,0.02); border:1px dashed var(--border-color); padding:10px; border-radius:var(--radius-sm);">
          <strong>Attendant / Front Desk Notes:</strong> ${escapeHtml(room.notes)}
        </div>
      ` : ''}
    `;

    modalInspect.classList.remove('hidden');
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

  // Event Listeners Initialization
  function initEventListeners() {
    // Status Filter Tabs
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentStatusFilter = tab.getAttribute('data-status');
        renderRooms();
      });
    });

    // KPI Cards click to filter
    document.querySelectorAll('.kpi-card[data-filter]').forEach(card => {
      card.addEventListener('click', () => {
        const filterVal = card.getAttribute('data-filter');
        currentStatusFilter = filterVal;
        filterTabs.forEach(tab => {
          if (tab.getAttribute('data-status') === filterVal) {
            tab.classList.add('active');
          } else {
            tab.classList.remove('active');
          }
        });
        renderRooms();
      });
    });

    // Floor Filter
    if (floorFilter) {
      floorFilter.addEventListener('change', (e) => {
        currentFloorFilter = e.target.value;
        renderRooms();
      });
    }

    // Search Input
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderRooms();
      });
    }

    // Layout Toggle (Grid / List)
    if (btnLayoutGrid && btnLayoutList) {
      btnLayoutGrid.addEventListener('click', () => {
        activeLayout = 'grid';
        btnLayoutGrid.classList.add('active');
        btnLayoutList.classList.remove('active');
        roomsContainer.classList.remove('layout-list');
      });

      btnLayoutList.addEventListener('click', () => {
        activeLayout = 'list';
        btnLayoutList.classList.add('active');
        btnLayoutGrid.classList.remove('active');
        roomsContainer.classList.add('layout-list');
      });
    }

    // Open Add Room Modal
    if (btnOpenAddRoom) {
      btnOpenAddRoom.addEventListener('click', () => {
        populateAddRoomAssignees();
        modalAddRoom.classList.remove('hidden');
      });
    }

    if (btnEmptyAddRoom) {
      btnEmptyAddRoom.addEventListener('click', () => {
        populateAddRoomAssignees();
        modalAddRoom.classList.remove('hidden');
      });
    }

    // Add Room Form Submit
    if (formAddRoom) {
      formAddRoom.addEventListener('submit', (e) => {
        e.preventDefault();
        const number = document.getElementById('inputRoomNumber').value;
        const floor = document.getElementById('inputRoomFloor').value;
        const type = document.getElementById('inputRoomType').value;
        const priority = document.getElementById('inputPriority').value;
        const assignedTo = inputAssignee.value || null;
        const notes = document.getElementById('inputNotes').value;

        try {
          const newRoom = window.cnykraStore.addRoom({
            number,
            floor,
            type,
            priority,
            assignedTo,
            notes
          });

          formAddRoom.reset();
          modalAddRoom.classList.add('hidden');
          window.cnykraApp.playChime('assign');
          window.cnykraApp.showToast(`Room ${newRoom.number} added successfully!`, 'success');
        } catch (err) {
          alert(err.message);
        }
      });
    }

    // Delegated actions on Rooms Container (Assign, Inspect)
    roomsContainer.addEventListener('click', (e) => {
      const assignBtn = e.target.closest('[data-action="open-assign"]');
      if (assignBtn) {
        const roomId = assignBtn.getAttribute('data-room-id');
        openAssignModal(roomId);
        return;
      }

      const inspectBtn = e.target.closest('[data-action="open-inspect"]');
      if (inspectBtn) {
        const roomId = inspectBtn.getAttribute('data-room-id');
        openInspectModal(roomId);
        return;
      }
    });

    // Select Staff in Assign Modal
    assignStaffList.addEventListener('click', (e) => {
      const staffCard = e.target.closest('.staff-assign-card');
      if (!staffCard || !targetAssignRoomId) return;

      const staffId = staffCard.getAttribute('data-staff-id');
      window.cnykraStore.assignRoom(targetAssignRoomId, staffId);

      const staff = window.cnykraStore.getHousekeeper(staffId);
      window.cnykraApp.playChime('assign');
      window.cnykraApp.showToast(`Room assigned to ${staff ? staff.name : 'Staff'}!`, 'info');

      modalAssign.classList.add('hidden');
      targetAssignRoomId = null;
    });

    // Approve Inspection
    if (btnInspectApprove) {
      btnInspectApprove.addEventListener('click', () => {
        if (!targetInspectRoomId) return;
        window.cnykraStore.inspectRoom(targetInspectRoomId, true);
        window.cnykraApp.playChime('ready');
        window.cnykraApp.showToast('Room approved and marked clean for guest check-in!', 'success');
        modalInspect.classList.add('hidden');
        targetInspectRoomId = null;
      });
    }

    // Reject / Reopen Inspection
    if (btnInspectReject) {
      btnInspectReject.addEventListener('click', () => {
        if (!targetInspectRoomId) return;
        const reason = prompt('Please specify touch-up details for the attendant:', 'Ensure mirror is polished & fresh water bottles placed');
        if (reason !== null) {
          window.cnykraStore.inspectRoom(targetInspectRoomId, false, reason);
          window.cnykraApp.showToast('Room flagged for touch-up and returned to queue.', 'warning');
          modalInspect.classList.add('hidden');
          targetInspectRoomId = null;
        }
      });
    }

    // Generic Modal Close Buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close-modal');
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('hidden');
      });
    });

    // Close on backdrop click
    [modalAddRoom, modalAssign, modalInspect].forEach(modal => {
      if (!modal) return;
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.add('hidden');
        }
      });
    });
  }

  // Initialize Manager Controller
  function init() {
    initEventListeners();
    renderRooms();
    renderActivityFeed();

    // Subscribe to state updates
    window.cnykraStore.subscribe(() => {
      renderRooms();
      renderActivityFeed();
    });

    // Update timers every second
    setInterval(tickTimers, 1000);
  }

  window.cnykraManager = {
    init,
    renderRooms,
    openAssignModal,
    openInspectModal
  };

})();
