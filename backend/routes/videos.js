const express = require('express');
const youtubeService = require('../services/youtubeService');
const aiService = require('../services/aiService');
const WatchedVideo = require('../models/WatchedVideo');
const BlockedVideo = require('../models/BlockedVideo');
const { protect } = require('../middleware/auth');

const router = express.Router();

const parseDurationMinutes = (duration) => {
  if (!duration || typeof duration !== 'string') return 0;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  return Math.max(1, Math.round(hours * 60 + minutes + seconds / 60));
};

router.get('/search', async (req, res) => {
  try {
    const { q, pageToken } = req.query;
    console.log(`[BACKEND] GET /api/videos/search hit. Query: "${q || ''}", PageToken: "${pageToken || 'none'}"`);
    
    if (!q) {
      console.warn('[BACKEND] Search failed: Query parameter "q" is required but was missing.');
      return res.status(400).json({ success: false, message: 'Query required' });
    }
    
    const result = await youtubeService.searchVideos(q, 10, pageToken || null);
    
    console.log(`[BACKEND] YouTube Search API Response - Query: "${q}", Count: ${result.videos?.length || 0}, QuotaExceeded: ${result.quotaExceeded}, FromMock: ${result.fromMock}, FromCache: ${result.fromCache}`);
    
    res.json({
      success: true,
      videos: result.videos,
      nextPageToken: result.nextPageToken,
      quotaExceeded: Boolean(result.quotaExceeded),
      fromMock: Boolean(result.fromMock),
      fromCache: Boolean(result.fromCache),
    });
  } catch (error) {
    console.error(`[BACKEND] Search error for query "${req.query.q}":`, error.message);
    res.status(500).json({ success: false, message: error.message, quotaExceeded: false });
  }
});

router.get('/details/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const details = await youtubeService.getVideoDetails(videoId);
    res.json({ success: true, details });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/classify', protect, async (req, res) => {
  try {
    const { videoData } = req.body;
    
    const isEducational = await aiService.classifyContent(videoData);

    try {
      if (isEducational) {
        await WatchedVideo.create({
          userId: req.user._id,
          videoId: videoData.videoId,
          title: videoData.title,
          category: videoData.categoryId || videoData.category || 'General Study',
          watchDuration: parseDurationMinutes(videoData.duration),
        });
      } else {
        await BlockedVideo.create({
          userId: req.user._id,
          videoId: videoData.videoId,
          title: videoData.title,
          reason: 'Non-educational content',
        });
      }
    } catch (dbError) {
      console.warn('Classification DB log skipped:', dbError.message);
    }

    res.json({ success: true, isEducational: Boolean(isEducational) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
