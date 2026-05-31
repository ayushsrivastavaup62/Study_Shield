const express = require('express');
const StudySession = require('../models/StudySession');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, async (req, res) => {
  try {
    const { duration, videosWatched, focusScore } = req.body;
    const session = await StudySession.create({
      userId: req.user._id,
      duration,
      videosWatched: videosWatched || [],
      focusScore
    });
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/user/:userId', protect, async (req, res) => {
  try {
    const sessions = await StudySession.find({ userId: req.user._id })
      .sort({ date: -1 })
      .limit(30);
    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
