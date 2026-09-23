const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema({
  task: { type: String, required: true },
  completed: { type: Boolean, default: false }
}, { _id: false });

const roomSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  type: { type: String, default: 'Deluxe King Room' },
  floor: { type: Number, default: 1 },
  status: {
    type: String,
    enum: ['dirty', 'assigned', 'cleaning', 'ready', 'inspected'],
    default: 'dirty'
  },
  priority: {
    type: String,
    enum: ['normal', 'high', 'vip'],
    default: 'normal'
  },
  assignedTo: { type: String, default: null },
  cleaningStartedAt: { type: Date, default: null },
  cleaningCompletedAt: { type: Date, default: null },
  checklist: [checklistItemSchema],
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
