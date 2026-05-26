const express = require('express');
const StudySession = require('../models/StudySession');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { userId, duration, videosWatched, focusScore } = req.body;
    const session = await StudySession.create({
      userId,
      duration,
      videosWatched,
      focusScore
    });
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const sessions = await StudySession.find({ userId: req.params.userId })
      .sort({ date: -1 })
      .limit(30);
    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
