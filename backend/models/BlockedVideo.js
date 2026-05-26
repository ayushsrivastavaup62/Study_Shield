const mongoose = require('mongoose');

const blockedVideoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  videoId: String,
  title: String,
  reason: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BlockedVideo', blockedVideoSchema);
