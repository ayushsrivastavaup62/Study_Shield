const express = require('express');
const StudySession = require('../models/StudySession');
const WatchedVideo = require('../models/WatchedVideo');
const BlockedVideo = require('../models/BlockedVideo');

const router = express.Router();

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const totalSessions = await StudySession.countDocuments({ userId });
    const totalStudyTime = await StudySession.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: '$duration' } } }
    ]);
    
    const videosWatched = await WatchedVideo.countDocuments({ userId });
    const videosBlocked = await BlockedVideo.countDocuments({ userId });
    
    const avgFocusScore = await StudySession.aggregate([
      { $match: { userId } },
      { $group: { _id: null, avg: { $avg: '$focusScore' } } }
    ]);
    
    res.json({
      success: true,
      analytics: {
        totalSessions,
        totalStudyTime: totalStudyTime[0]?.total || 0,
        videosWatched,
        videosBlocked,
        avgFocusScore: avgFocusScore[0]?.avg || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
