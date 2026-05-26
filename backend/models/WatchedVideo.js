const mongoose = require('mongoose');

const watchedVideoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  videoId: String,
  title: String,
  category: String,
  watchDuration: Number,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WatchedVideo', watchedVideoSchema);
