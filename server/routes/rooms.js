const express = require('express');
const Room = require('../models/Room');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

const DEFAULT_CHECKLIST = [
  'Strip & replace luxury Egyptian cotton bedsheets and duvet',
  'Sanitize bathroom, marble vanities, rain shower & deep-clean tub',
  'Replenish plush towels, organic bathrobes & Bulgari toiletries',
  'Vacuum high-pile carpet, polish glass doors & hardwood surfaces',
  'Restock gourmet minibar, Nespresso pods & fresh bottled spring water'
];

async function addLog(text, type = 'act-info') {
  try {
    await ActivityLog.create({ type, text });
  } catch (err) {
    console.error('Activity log error:', err);
  }
}

// GET /api/rooms — list all rooms
router.get('/', auth, async (req, res) => {
  try {
    const rooms = await Room.find().sort({ createdAt: -1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/rooms — add a new room (Manager only)
router.post('/', auth, requireRole('manager'), async (req, res) => {
  try {
    const { number, type, floor, priority, notes, assignedTo } = req.body;

    if (!number) {
      return res.status(400).json({ message: 'Room number is required' });
    }

    const existing = await Room.findOne({ number: number.trim() });
    if (existing) {
      return res.status(400).json({ message: `Room ${number} is already in today's schedule.` });
    }

    const room = await Room.create({
      number: number.trim(),
      type: type || 'Deluxe King Room',
      floor: parseInt(floor, 10) || 1,
      status: assignedTo ? 'assigned' : 'dirty',
      priority: priority || 'normal',
      assignedTo: assignedTo || null,
      checklist: DEFAULT_CHECKLIST.map(task => ({ task, completed: false })),
      notes: notes ? notes.trim() : ''
    });

    let logText = `Manager added Room ${room.number} (${room.type}) to schedule`;
    if (assignedTo) {
      const staff = await User.findOne({ userId: assignedTo });
      logText += ` and assigned to ${staff ? staff.name : 'staff'}`;
    }
    await addLog(logText, 'act-add');

    res.status(201).json(room);
  } catch (err) {
    console.error('Add room error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/rooms/:id/assign — assign housekeeper (Manager only)
router.put('/:id/assign', auth, requireRole('manager'), async (req, res) => {
  try {
    const { housekeeperId } = req.body;
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    room.assignedTo = housekeeperId;
    if (room.status === 'dirty') {
      room.status = 'assigned';
    }
    await room.save();

    const staff = await User.findOne({ userId: housekeeperId });
    await addLog(`Manager assigned Room ${room.number} to ${staff ? staff.name : 'housekeeper'}`, 'act-assign');

    res.json(room);
  } catch (err) {
    console.error('Assign room error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/rooms/:id/start — start cleaning
router.put('/:id/start', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    room.status = 'cleaning';
    room.cleaningStartedAt = new Date();
    room.cleaningCompletedAt = null;
    await room.save();

    const staff = await User.findOne({ userId: room.assignedTo });
    await addLog(`${staff ? staff.name : 'Staff'} started cleaning Room ${room.number}`, 'act-start');

    res.json(room);
  } catch (err) {
    console.error('Start cleaning error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/rooms/:id/checklist/:idx — toggle checklist item
router.put('/:id/checklist/:idx', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const idx = parseInt(req.params.idx, 10);
    if (room.checklist && room.checklist[idx]) {
      room.checklist[idx].completed = !room.checklist[idx].completed;
      room.markModified('checklist');
      await room.save();
    }

    res.json(room);
  } catch (err) {
    console.error('Toggle checklist error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/rooms/:id/ready — mark room ready
router.put('/:id/ready', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    room.status = 'ready';
    room.cleaningCompletedAt = new Date();
    if (room.checklist) {
      room.checklist.forEach(item => { item.completed = true; });
      room.markModified('checklist');
    }
    await room.save();

    const staff = await User.findOne({ userId: room.assignedTo });
    await addLog(`${staff ? staff.name : 'Staff'} marked Room ${room.number} Ready for Inspection!`, 'act-ready');

    res.json(room);
  } catch (err) {
    console.error('Mark ready error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/rooms/:id/inspect — inspect and approve/reject (Manager only)
router.put('/:id/inspect', auth, requireRole('manager'), async (req, res) => {
  try {
    const { approved, feedbackNotes } = req.body;
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    if (approved) {
      room.status = 'inspected';
      await addLog(`Manager inspected & approved Room ${room.number} for guest check-in`, 'act-inspect');
    } else {
      room.status = 'dirty';
      room.cleaningStartedAt = null;
      room.cleaningCompletedAt = null;
      if (feedbackNotes) {
        room.notes = `Touch-up required: ${feedbackNotes}. ${room.notes}`;
      }
      await addLog(`Manager reopened Room ${room.number} for touch-up`, 'act-info');
    }
    await room.save();

    res.json(room);
  } catch (err) {
    console.error('Inspect room error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/rooms/:id — delete room (Manager only)
router.delete('/:id', auth, requireRole('manager'), async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    await Room.findByIdAndDelete(req.params.id);
    await addLog(`Manager removed Room ${room.number} from schedule`, 'act-info');

    res.json({ message: 'Room deleted' });
  } catch (err) {
    console.error('Delete room error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
