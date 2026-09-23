const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  type: { type: String, default: 'act-info' },
  text: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
