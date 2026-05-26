const express = require('express');
const youtubeService = require('../services/youtubeService');
const aiService = require('../services/aiService');
const WatchedVideo = require('../models/WatchedVideo');
const BlockedVideo = require('../models/BlockedVideo');

const router = express.Router();

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

router.post('/classify', async (req, res) => {
  try {
    const { videoData, userId } = req.body;
    
    const isEducational = await aiService.classifyContent(videoData);

    try {
      if (isEducational) {
        await WatchedVideo.create({
          userId,
          videoId: videoData.videoId,
          title: videoData.title,
          category: videoData.categoryId,
        });
      } else {
        await BlockedVideo.create({
          userId,
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
