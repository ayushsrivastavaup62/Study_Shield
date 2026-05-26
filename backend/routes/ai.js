const express = require('express');
const aiService = require('../services/aiService');

const router = express.Router();

router.post('/classify', async (req, res) => {
  try {
    const { videoData } = req.body;
    const isEducational = await aiService.classifyContent(videoData);
    res.json({ success: true, isEducational });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
