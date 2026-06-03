const express = require('express');
const Note = require('../models/Note');
const aiService = require('../services/aiService');
const { protect } = require('../middleware/auth');

const router = express.Router();

const buildVideoUrl = (videoId, existingUrl) => {
  if (existingUrl) return existingUrl;
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : '';
};

const sanitizeArray = (value) => {
  const toText = (item) => {
    if (item === null || item === undefined) return '';
    if (Array.isArray(item)) return item.map(toText).filter(Boolean).join(' ');
    if (typeof item === 'object') return Object.values(item).map(toText).filter(Boolean).join(' ');
    return String(item).trim();
  };

  if (Array.isArray(value)) return value.map(toText).filter(Boolean);
  if (value && typeof value === 'object') return Object.values(value).map(toText).filter(Boolean);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        return sanitizeArray(JSON.parse(trimmed));
      } catch (error) {
        return trimmed.replace(/[{}"]/g, '').split(',').map((item) => item.trim()).filter(Boolean);
      }
    }

    return value
      .split(/\n|;/)
      .map((item) => item.replace(/^[-*\d.\s]+/, '').trim())
      .filter(Boolean);
  }
  return [];
};

const sanitizeText = (value) => {
  if (Array.isArray(value)) return sanitizeArray(value).join('\n');
  if (value && typeof value === 'object') return sanitizeArray(value).join('\n');
  return value || '';
};

const normalizeNoteInput = (body) => {
  const videoData = body.videoData || body;
  const generatedNotes = body.notes || body.generatedNotes || body;
  const videoId = videoData.videoId || body.videoId;

  return {
    videoId,
    videoTitle: videoData.title || body.videoTitle || 'Untitled video',
    videoUrl: buildVideoUrl(videoId, videoData.videoUrl || body.videoUrl),
    thumbnail: videoData.thumbnail || body.thumbnail || '',
    channelTitle: videoData.channelTitle || body.channelTitle || '',
    summary: generatedNotes.summary || '',
    keyPoints: sanitizeArray(generatedNotes.keyPoints || generatedNotes.keyConcepts),
    importantConcepts: sanitizeArray(generatedNotes.importantConcepts || generatedNotes.importantPoints),
    revisionNotes: sanitizeText(generatedNotes.revisionNotes),
    quickRecap: '',
    suggestedFollowUpTopics: [],
    transcriptSource: generatedNotes.transcriptSource || 'metadata',
    rawNotesText: '',
  };
};

router.use((req, res, next) => {
  console.log(`[ROUTE HIT] /api/notes${req.path}`);
  next();
});

router.use(protect);

router.post('/generate', async (req, res) => {
  try {
    const { videoData, isEducational } = req.body;

    if (isEducational === false) {
      return res.status(403).json({
        success: false,
        message: 'Notes can only be generated for educational videos.',
      });
    }

    if (!videoData?.videoId && !videoData?.title) {
      return res.status(400).json({ success: false, message: 'Video metadata is required.' });
    }

    const notes = await aiService.generateNotes(videoData);

    res.json({
      success: true,
      notes: {
        ...notes,
        videoId: videoData.videoId,
        videoTitle: videoData.title || 'Untitled video',
        videoUrl: buildVideoUrl(videoData.videoId, videoData.videoUrl),
        thumbnail: videoData.thumbnail || '',
        channelTitle: videoData.channelTitle || '',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/save', async (req, res) => {
  try {
    const noteData = normalizeNoteInput(req.body);

    if (!noteData.videoId) {
      return res.status(400).json({ success: false, message: 'Video ID is required to save notes.' });
    }

    const existing = await Note.findOne({ userId: req.user._id, videoId: noteData.videoId });
    const note = existing
      ? await Note.findOneAndUpdate({ _id: existing._id, userId: req.user._id }, noteData, {
          new: true,
          runValidators: true,
        })
      : await Note.create({ ...noteData, userId: req.user._id });

    res.status(existing ? 200 : 201).json({ success: true, note, updatedExisting: Boolean(existing) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user._id }).sort({ updatedAt: -1 }).lean();
    res.json({ success: true, notes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id }).lean();
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }
    res.json({ success: true, note });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const noteData = normalizeNoteInput(req.body);
    const note = await Note.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, noteData, {
      new: true,
      runValidators: true,
    });

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }

    res.json({ success: true, note });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }
    res.json({ success: true, message: 'Note deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
