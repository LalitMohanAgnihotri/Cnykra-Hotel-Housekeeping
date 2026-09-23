/**
 * CNYKRA HOTEL HOUSEKEEPING OS - CENTRALIZED STATE STORE
 * Manages rooms, housekeeper staff, activity logs, persistence, and cross-tab reactive sync.
 */

const STORAGE_KEY = 'cnykra_housekeeping_v1';

// Working Demo Accounts for self-testing
const DEMO_ACCOUNTS = [
  {
    id: 'user-manager',
    email: 'manager@cnykra.com',
    password: 'manager123',
    name: 'Arjun Sharma',
    role: 'manager',
    title: 'Front Desk Operations Lead',
    initials: 'AS',
    color: '#0f172a'
  },
  {
    id: 'hk-1',
    email: 'pooja@cnykra.com',
    password: 'clean123',
    name: 'Pooja Sharma',
    role: 'housekeeper',
    title: 'Senior Floor Attendant',
    initials: 'PS',
    color: '#4f46e5'
  },
  {
    id: 'hk-2',
    email: 'rohan@cnykra.com',
    password: 'clean123',
    name: 'Rohan Verma',
    role: 'housekeeper',
    title: 'Executive Suite Specialist',
    initials: 'RV',
    color: '#0891b2'
  }
];

// Initial realistic hotel dataset
const DEFAULT_HOUSEKEEPERS = [
  {
    id: 'hk-1',
    name: 'Pooja Sharma',
    initials: 'PS',
    role: 'Senior Floor Attendant',
    shift: '07:00 - 15:30',
    color: '#4f46e5', // Royal Indigo
    phone: '+91 98201 23456'
  },
  {
    id: 'hk-2',
    name: 'Rohan Verma',
    initials: 'RV',
    role: 'Executive Suite Attendant',
    shift: '07:00 - 15:30',
    color: '#0891b2', // Teal
    phone: '+91 98202 34567'
  },
  {
    id: 'hk-3',
    name: 'Sunita Patel',
    initials: 'SP',
    role: 'Luxury Turnover Specialist',
    shift: '08:00 - 16:30',
    color: '#059669', // Emerald
    phone: '+91 98203 45678'
  },
  {
    id: 'hk-4',
    name: 'Vikram Yadav',
    initials: 'VY',
    role: 'VIP Concierge Attendant',
    shift: '08:00 - 16:30',
    color: '#e11d48', // Crimson Rose
    phone: '+91 98204 56789'
  }
];

const DEFAULT_CHECKLIST_ITEMS = [
  'Strip & replace luxury Egyptian cotton bedsheets and duvet',
  'Sanitize bathroom, marble vanities, rain shower & deep-clean tub',
  'Replenish plush towels, organic bathrobes & Bulgari toiletries',
  'Vacuum high-pile carpet, polish glass doors & hardwood surfaces',
  'Restock gourmet minibar, Nespresso pods & fresh bottled spring water'
];

function createStandardChecklist(completedAll = false) {
  return DEFAULT_CHECKLIST_ITEMS.map(task => ({
    task,
    completed: completedAll
  }));
}

const DEFAULT_ROOMS = [
  {
    id: 'room-101',
    number: '101',
    type: 'Deluxe King Room',
    floor: 1,
    status: 'dirty',
    priority: 'normal',
    assignedTo: null,
    cleaningStartedAt: null,
    cleaningCompletedAt: null,
    checklist: createStandardChecklist(false),
    notes: 'Guest checked out at 10:45 AM. Standard turnaround needed.'
  },
  {
    id: 'room-104',
    number: '104',
    type: 'Junior Garden Suite',
    floor: 1,
    status: 'assigned',
    priority: 'high',
    assignedTo: 'hk-1',
    cleaningStartedAt: null,
    cleaningCompletedAt: null,
    checklist: createStandardChecklist(false),
    notes: 'Early check-in scheduled for 1:30 PM. Needs priority attention.'
  },
  {
    id: 'room-202',
    number: '202',
    type: 'Executive Twin Suite',
    floor: 2,
    status: 'cleaning',
    priority: 'normal',
    assignedTo: 'hk-2',
    // Started 12 minutes ago
    cleaningStartedAt: Date.now() - (12 * 60 * 1000 + 45 * 1000),
    cleaningCompletedAt: null,
    checklist: [
      { task: DEFAULT_CHECKLIST_ITEMS[0], completed: true },
      { task: DEFAULT_CHECKLIST_ITEMS[1], completed: true },
      { task: DEFAULT_CHECKLIST_ITEMS[2], completed: false },
      { task: DEFAULT_CHECKLIST_ITEMS[3], completed: false },
      { task: DEFAULT_CHECKLIST_ITEMS[4], completed: false }
    ],
    notes: 'Linens stripped, currently sanitizing ensuite bathroom.'
  },
  {
    id: 'room-208',
    number: '208',
    type: 'Deluxe King Room',
    floor: 2,
    status: 'dirty',
    priority: 'normal',
    assignedTo: null,
    cleaningStartedAt: null,
    cleaningCompletedAt: null,
    checklist: createStandardChecklist(false),
    notes: 'Stayover refresh requested between 12:00 PM and 2:00 PM.'
  },
  {
    id: 'room-301',
    number: '301',
    type: 'Oceanview Suite',
    floor: 3,
    status: 'ready',
    priority: 'vip',
    assignedTo: 'hk-1',
    cleaningStartedAt: Date.now() - (45 * 60 * 1000),
    cleaningCompletedAt: Date.now() - (5 * 60 * 1000),
    checklist: createStandardChecklist(true),
    notes: '⭐ VIP Arrival: Ambassador Singhania. Welcome Champagne chilled in ice bucket.'
  },
  {
    id: 'room-305',
    number: '305',
    type: 'Oceanview Suite',
    floor: 3,
    status: 'assigned',
    priority: 'normal',
    assignedTo: 'hk-3',
    cleaningStartedAt: null,
    cleaningCompletedAt: null,
    checklist: createStandardChecklist(false),
    notes: 'Provide extra memory foam pillows as noted in guest profile.'
  },
  {
    id: 'room-401',
    number: '401',
    type: 'Presidential Penthouse',
    floor: 4,
    status: 'cleaning',
    priority: 'vip',
    assignedTo: 'hk-3',
    // Started 18 minutes ago
    cleaningStartedAt: Date.now() - (18 * 60 * 1000 + 20 * 1000),
    cleaningCompletedAt: null,
    checklist: [
      { task: DEFAULT_CHECKLIST_ITEMS[0], completed: true },
      { task: DEFAULT_CHECKLIST_ITEMS[1], completed: true },
      { task: DEFAULT_CHECKLIST_ITEMS[2], completed: true },
      { task: DEFAULT_CHECKLIST_ITEMS[3], completed: false },
      { task: DEFAULT_CHECKLIST_ITEMS[4], completed: false }
    ],
    notes: '⭐ VIP arrival: Royalty delegation. White gloves inspection required.'
  },
  {
    id: 'room-402',
    number: '402',
    type: 'Presidential Penthouse',
    floor: 4,
    status: 'inspected',
    priority: 'normal',
    assignedTo: 'hk-2',
    cleaningStartedAt: Date.now() - (80 * 60 * 1000),
    cleaningCompletedAt: Date.now() - (25 * 60 * 1000),
    checklist: createStandardChecklist(true),
    notes: 'Inspected by Duty Manager. Keycards printed and ready at Reception.'
  }
];

const DEFAULT_ACTIVITY = [
  {
    id: 'act-1',
    type: 'act-ready',
    text: 'Pooja marked Oceanview Suite 301 Ready for Inspection',
    time: '5 mins ago'
  },
  {
    id: 'act-2',
    type: 'act-start',
    text: 'Sunita started cleaning Presidential Penthouse 401',
    time: '18 mins ago'
  },
  {
    id: 'act-3',
    type: 'act-inspect',
    text: 'Front Desk approved Room 402 for guest check-in',
    time: '25 mins ago'
  },
  {
    id: 'act-4',
    type: 'act-assign',
    text: 'Manager assigned Junior Garden Suite 104 to Pooja Sharma',
    time: '34 mins ago'
  }
];

class StateStore {
  constructor() {
    this.subscribers = [];
    this.state = this.loadState();
    
    // Listen for changes from other tabs for real-time synchronization
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) {
        this.state = this.loadState();
        this.notify(false); // don't write back to storage during external event
      }
    });
  }

  loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.rooms && parsed.rooms.length > 0) {
          // Ensure housekeepers use clean initials and no external face avatars
          parsed.housekeepers = DEFAULT_HOUSEKEEPERS;
          if (!parsed.currentUserId) parsed.currentUserId = 'user-manager';
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Failed to parse state from localStorage, falling back to defaults', err);
    }

    return {
      rooms: DEFAULT_ROOMS,
      housekeepers: DEFAULT_HOUSEKEEPERS,
      activeHousekeeperId: 'hk-1',
      currentUserId: 'user-manager',
      activityLog: DEFAULT_ACTIVITY
    };
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (err) {
      console.error('Error saving state to localStorage', err);
    }
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notify(shouldSave = true) {
    if (shouldSave) {
      this.saveState();
    }
    this.subscribers.forEach(cb => {
      try {
        cb(this.state);
      } catch (err) {
        console.error('Subscriber callback error:', err);
      }
    });
  }

  // Activity Log helper
  addLog(text, type = 'act-info') {
    const newLog = {
      id: 'act-' + Date.now(),
      type,
      text,
      time: 'Just now'
    };
    this.state.activityLog = [newLog, ...(this.state.activityLog || []).slice(0, 19)];
  }

  // ================= ACTION METHODS =================

  // 1. Add Room
  addRoom({ number, type, floor, priority, notes, assignedTo }) {
    const existing = this.state.rooms.find(r => r.number.toString().trim() === number.toString().trim());
    if (existing) {
      throw new Error(`Room ${number} is already in today's schedule.`);
    }

    const newRoom = {
      id: 'room-' + Date.now(),
      number: number.trim(),
      type: type || 'Deluxe King Room',
      floor: parseInt(floor, 10) || 1,
      status: assignedTo ? 'assigned' : 'dirty',
      priority: priority || 'normal',
      assignedTo: assignedTo || null,
      cleaningStartedAt: null,
      cleaningCompletedAt: null,
      checklist: createStandardChecklist(false),
      notes: notes ? notes.trim() : ''
    };

    this.state.rooms.unshift(newRoom);

    let logText = `Manager added Room ${newRoom.number} (${newRoom.type}) to schedule`;
    if (assignedTo) {
      const staff = this.getHousekeeper(assignedTo);
      logText += ` and assigned to ${staff ? staff.name : 'staff'}`;
    }
    this.addLog(logText, 'act-add');

    this.notify();
    return newRoom;
  }

  // 2. Assign Cleaning to a Housekeeper
  assignRoom(roomId, housekeeperId) {
    const room = this.state.rooms.find(r => r.id === roomId);
    if (!room) return null;

    room.assignedTo = housekeeperId;
    if (room.status === 'dirty') {
      room.status = 'assigned';
    }

    const staff = this.getHousekeeper(housekeeperId);
    const staffName = staff ? staff.name : 'housekeeper';
    this.addLog(`Manager assigned Room ${room.number} to ${staffName}`, 'act-assign');

    this.notify();
    return room;
  }

  // 3. Housekeeper Starts Cleaning
  startCleaning(roomId) {
    const room = this.state.rooms.find(r => r.id === roomId);
    if (!room) return null;

    room.status = 'cleaning';
    room.cleaningStartedAt = Date.now();
    room.cleaningCompletedAt = null;

    const staff = this.getHousekeeper(room.assignedTo);
    const staffName = staff ? staff.name : 'Staff';
    this.addLog(`${staffName} started cleaning Room ${room.number}`, 'act-start');

    this.notify();
    return room;
  }

  // 4. Toggle a checklist item
  toggleChecklist(roomId, index) {
    const room = this.state.rooms.find(r => r.id === roomId);
    if (!room || !room.checklist || !room.checklist[index]) return null;

    room.checklist[index].completed = !room.checklist[index].completed;
    this.notify();
    return room;
  }

  // 5. Housekeeper Marks Room Ready
  markReady(roomId) {
    const room = this.state.rooms.find(r => r.id === roomId);
    if (!room) return null;

    room.status = 'ready';
    room.cleaningCompletedAt = Date.now();
    // Mark remaining checklist items complete if not already
    if (room.checklist) {
      room.checklist.forEach(item => item.completed = true);
    }

    const staff = this.getHousekeeper(room.assignedTo);
    const staffName = staff ? staff.name : 'Staff';
    this.addLog(`${staffName} marked Room ${room.number} Ready for Inspection!`, 'act-ready');

    this.notify();
    return room;
  }

  // 6. Manager Inspects & Approves Room
  inspectRoom(roomId, approved, feedbackNotes = '') {
    const room = this.state.rooms.find(r => r.id === roomId);
    if (!room) return null;

    if (approved) {
      room.status = 'inspected';
      this.addLog(`Manager inspected & approved Room ${room.number} for guest check-in`, 'act-inspect');
    } else {
      room.status = 'dirty';
      room.cleaningStartedAt = null;
      room.cleaningCompletedAt = null;
      if (feedbackNotes) {
        room.notes = `Touch-up required: ${feedbackNotes}. ${room.notes}`;
      }
      this.addLog(`Manager reopened Room ${room.number} for touch-up`, 'act-info');
    }

    this.notify();
    return room;
  }

  // Housekeeper switcher
  setActiveHousekeeper(housekeeperId) {
    this.state.activeHousekeeperId = housekeeperId;
    this.notify();
  }

  // Delete Room
  deleteRoom(roomId) {
    const room = this.state.rooms.find(r => r.id === roomId);
    if (!room) return;
    this.state.rooms = this.state.rooms.filter(r => r.id !== roomId);
    this.addLog(`Manager removed Room ${room.number} from schedule`, 'act-info');
    this.notify();
  }

  // Reset to initial demo data
  resetDemoData() {
    this.state = {
      rooms: JSON.parse(JSON.stringify(DEFAULT_ROOMS)),
      housekeepers: JSON.parse(JSON.stringify(DEFAULT_HOUSEKEEPERS)),
      activeHousekeeperId: 'hk-1',
      activityLog: JSON.parse(JSON.stringify(DEFAULT_ACTIVITY))
    };
    this.notify();
  }

  // Query Helpers
  getRooms() {
    return this.state.rooms || [];
  }

  getHousekeepers() {
    return this.state.housekeepers || [];
  }

  getHousekeeper(id) {
    return (this.state.housekeepers || []).find(hk => hk.id === id) || null;
  }

  getActiveHousekeeper() {
    const currentId = this.state.activeHousekeeperId || 'hk-1';
    return this.getHousekeeper(currentId) || this.state.housekeepers[0];
  }

  // Authentication & Demo Access Helpers
  getDemoAccounts() {
    return DEMO_ACCOUNTS;
  }

  getCurrentUser() {
    const id = this.state.currentUserId || 'user-manager';
    return DEMO_ACCOUNTS.find(u => u.id === id) || DEMO_ACCOUNTS[0];
  }

  login(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const user = DEMO_ACCOUNTS.find(u => u.email.toLowerCase() === cleanEmail && u.password === password);
    if (!user) {
      throw new Error('Invalid credentials. Please click a Demo Profile button below or use provided credentials.');
    }
    this.state.currentUserId = user.id;
    if (user.role === 'housekeeper') {
      this.state.activeHousekeeperId = user.id;
    }
    this.addLog(`${user.name} logged in as ${user.title}`, 'act-info');
    this.notify();
    return user;
  }

  loginAsDemo(userId) {
    const user = DEMO_ACCOUNTS.find(u => u.id === userId);
    if (!user) return null;
    this.state.currentUserId = user.id;
    if (user.role === 'housekeeper') {
      this.state.activeHousekeeperId = user.id;
    }
    this.addLog(`${user.name} switched session to ${user.title}`, 'act-info');
    this.notify();
    return user;
  }

  logout() {
    this.state.currentUserId = 'user-manager';
    this.notify();
  }

  getActivityLogs() {
    return this.state.activityLog || [];
  }
}

// Global Store Instance
window.cnykraStore = new StateStore();
