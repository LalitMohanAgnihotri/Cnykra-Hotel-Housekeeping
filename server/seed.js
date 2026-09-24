const bcrypt = require('bcryptjs');
const { connectDB, disconnectDB } = require('./config/db');
const User = require('./models/User');
const Room = require('./models/Room');
const ActivityLog = require('./models/ActivityLog');

const DEFAULT_CHECKLIST = [
  'Strip & replace luxury Egyptian cotton bedsheets and duvet',
  'Sanitize bathroom, marble vanities, rain shower & deep-clean tub',
  'Replenish plush towels, organic bathrobes & Bulgari toiletries',
  'Vacuum high-pile carpet, polish glass doors & hardwood surfaces',
  'Restock gourmet minibar, Nespresso pods & fresh bottled spring water'
];

function makeChecklist(completedAll = false) {
  return DEFAULT_CHECKLIST.map(task => ({ task, completed: completedAll }));
}

async function seed() {
  if (require('mongoose').connection.readyState === 0) {
    await connectDB();
  }

  // Clear existing data
  await User.deleteMany({});
  await Room.deleteMany({});
  await ActivityLog.deleteMany({});

  // Hash passwords
  const salt = await bcrypt.genSalt(10);
  const managerPass = await bcrypt.hash('manager123', salt);
  const cleanPass = await bcrypt.hash('clean123', salt);

  // Exactly 1 Manager and 3 Housekeepers
  await User.insertMany([
    {
      userId: 'user-manager',
      name: 'Arjun Sharma',
      email: 'manager@cnykra.com',
      password: managerPass,
      role: 'manager',
      title: 'Front Desk Operations Lead',
      initials: 'AS',
      color: '#0f172a'
    },
    {
      userId: 'hk-1',
      name: 'Pooja Sharma',
      email: 'pooja@cnykra.com',
      password: cleanPass,
      role: 'housekeeper',
      title: 'Senior Floor Attendant',
      initials: 'PS',
      color: '#4f46e5',
      shift: '07:00 - 15:30',
      phone: '+91 98201 23456'
    },
    {
      userId: 'hk-2',
      name: 'Rohan Verma',
      email: 'rohan@cnykra.com',
      password: cleanPass,
      role: 'housekeeper',
      title: 'Executive Suite Attendant',
      initials: 'RV',
      color: '#0891b2',
      shift: '07:00 - 15:30',
      phone: '+91 98202 34567'
    },
    {
      userId: 'hk-3',
      name: 'Sunita Patel',
      email: 'sunita@cnykra.com',
      password: cleanPass,
      role: 'housekeeper',
      title: 'Luxury Turnover Specialist',
      initials: 'SP',
      color: '#059669',
      shift: '07:00 - 15:30',
      phone: '+91 98203 45678'
    }
  ]);

  // Create rooms distributed among the 3 housekeepers
  const now = Date.now();
  await Room.insertMany([
    {
      number: '101',
      type: 'Deluxe King Room',
      floor: 1,
      status: 'dirty',
      priority: 'normal',
      assignedTo: null,
      checklist: makeChecklist(false),
      notes: 'Guest checked out at 10:45 AM. Standard turnaround needed.'
    },
    {
      number: '104',
      type: 'Junior Garden Suite',
      floor: 1,
      status: 'assigned',
      priority: 'high',
      assignedTo: 'hk-1',
      checklist: makeChecklist(false),
      notes: 'Early check-in scheduled for 1:30 PM. Needs priority attention.'
    },
    {
      number: '202',
      type: 'Executive Twin Suite',
      floor: 2,
      status: 'cleaning',
      priority: 'normal',
      assignedTo: 'hk-2',
      cleaningStartedAt: new Date(now - 12 * 60 * 1000),
      checklist: [
        { task: DEFAULT_CHECKLIST[0], completed: true },
        { task: DEFAULT_CHECKLIST[1], completed: true },
        { task: DEFAULT_CHECKLIST[2], completed: false },
        { task: DEFAULT_CHECKLIST[3], completed: false },
        { task: DEFAULT_CHECKLIST[4], completed: false }
      ],
      notes: 'Linens stripped, currently sanitizing ensuite bathroom.'
    },
    {
      number: '208',
      type: 'Deluxe King Room',
      floor: 2,
      status: 'dirty',
      priority: 'normal',
      assignedTo: null,
      checklist: makeChecklist(false),
      notes: 'Stayover refresh requested between 12:00 PM and 2:00 PM.'
    },
    {
      number: '301',
      type: 'Oceanview Suite',
      floor: 3,
      status: 'ready',
      priority: 'vip',
      assignedTo: 'hk-1',
      cleaningStartedAt: new Date(now - 45 * 60 * 1000),
      cleaningCompletedAt: new Date(now - 5 * 60 * 1000),
      checklist: makeChecklist(true),
      notes: 'VIP Arrival: Ambassador Singhania. Welcome Champagne chilled in ice bucket.'
    },
    {
      number: '305',
      type: 'Oceanview Suite',
      floor: 3,
      status: 'assigned',
      priority: 'normal',
      assignedTo: 'hk-3',
      checklist: makeChecklist(false),
      notes: 'Provide extra memory foam pillows as noted in guest profile.'
    },
    {
      number: '401',
      type: 'Presidential Penthouse',
      floor: 4,
      status: 'cleaning',
      priority: 'vip',
      assignedTo: 'hk-3',
      cleaningStartedAt: new Date(now - 18 * 60 * 1000),
      checklist: [
        { task: DEFAULT_CHECKLIST[0], completed: true },
        { task: DEFAULT_CHECKLIST[1], completed: true },
        { task: DEFAULT_CHECKLIST[2], completed: true },
        { task: DEFAULT_CHECKLIST[3], completed: false },
        { task: DEFAULT_CHECKLIST[4], completed: false }
      ],
      notes: 'VIP arrival: Royalty delegation. White gloves inspection required.'
    },
    {
      number: '402',
      type: 'Presidential Penthouse',
      floor: 4,
      status: 'inspected',
      priority: 'normal',
      assignedTo: 'hk-2',
      cleaningStartedAt: new Date(now - 80 * 60 * 1000),
      cleaningCompletedAt: new Date(now - 25 * 60 * 1000),
      checklist: makeChecklist(true),
      notes: 'Inspected by Duty Manager. Keycards printed and ready at Reception.'
    }
  ]);

  // Create activity logs
  await ActivityLog.insertMany([
    { type: 'act-ready', text: 'Pooja marked Oceanview Suite 301 Ready for Inspection' },
    { type: 'act-start', text: 'Sunita started cleaning Presidential Penthouse 401' },
    { type: 'act-inspect', text: 'Front Desk approved Room 402 for guest check-in' },
    { type: 'act-assign', text: 'Manager assigned Junior Garden Suite 104 to Pooja Sharma' }
  ]);

  console.log('Database seeded successfully!');
  console.log('Demo accounts (1 Manager + 3 Housekeepers):');
  console.log('  Manager:     manager@cnykra.com / manager123');
  console.log('  Housekeeper: pooja@cnykra.com / clean123');
  console.log('  Housekeeper: rohan@cnykra.com / clean123');
  console.log('  Housekeeper: sunita@cnykra.com / clean123');
}

if (require.main === module) {
  seed().then(async () => {
    await disconnectDB();
    process.exit(0);
  }).catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
  });
}


