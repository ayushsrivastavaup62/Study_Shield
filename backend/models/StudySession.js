const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  duration: Number,
  videosWatched: [{ type: mongoose.Schema.Types.ObjectId }],
  focusScore: Number,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StudySession', studySessionSchema);
