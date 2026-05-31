const express = require('express');
const Quiz = require('../models/Quiz');
const aiService = require('../services/aiService');
const { protect } = require('../middleware/auth');

const router = express.Router();

const buildVideoUrl = (videoId, existingUrl) => {
  if (existingUrl) return existingUrl;
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : '';
};

const sanitizeQuestions = (questions = []) =>
  (Array.isArray(questions) ? questions : [])
    .map((item) => ({
      question: String(item.question || '').trim(),
      options: Array.isArray(item.options)
        ? item.options.map((option) => String(option || '').trim()).filter(Boolean).slice(0, 4)
        : [],
      correctAnswer: String(item.correctAnswer || '').trim(),
      explanation: String(item.explanation || '').trim(),
      difficulty: ['Easy', 'Medium', 'Hard'].includes(item.difficulty) ? item.difficulty : 'Medium',
    }))
    .filter((item) => item.question && item.options.length === 4 && item.correctAnswer);

const evaluateQuiz = (questions, userAnswers) => {
  const answers = Array.isArray(userAnswers) ? userAnswers : [];
  const review = questions.map((question, index) => {
    const userAnswer = String(answers[index] || '').trim();
    const correctAnswer = String(question.correctAnswer || '').trim();
    const isCorrect = userAnswer === correctAnswer;

    return {
      question: question.question,
      options: question.options,
      difficulty: question.difficulty,
      userAnswer,
      correctAnswer,
      isCorrect,
      explanation: question.explanation || '',
    };
  });
  const score = review.filter((item) => item.isCorrect).length;
  const totalQuestions = questions.length;
  const percentage = totalQuestions ? Math.round((score / totalQuestions) * 100) : 0;

  return {
    score,
    totalQuestions,
    percentage,
    correctAnswers: review.filter((item) => item.isCorrect),
    incorrectAnswers: review.filter((item) => !item.isCorrect),
    review,
  };
};

router.use((req, res, next) => {
  console.log(`[ROUTE HIT] /api/quizzes${req.path}`);
  next();
});

router.use(protect);

router.post('/generate', async (req, res) => {
  try {
    const { videoData, notes, isEducational } = req.body;

    if (isEducational !== true) {
      return res.status(403).json({
        success: false,
        message: 'Quizzes can only be generated for educational videos.',
      });
    }

    if (!videoData?.videoId && !videoData?.title) {
      return res.status(400).json({ success: false, message: 'Video metadata is required.' });
    }

    const questions = await aiService.generateQuiz(videoData, notes || null);
    res.json({ success: true, questions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/submit', async (req, res) => {
  try {
    const questions = sanitizeQuestions(req.body.questions);
    const userAnswers = Array.isArray(req.body.userAnswers) ? req.body.userAnswers : [];

    if (!questions.length) {
      return res.status(400).json({ success: false, message: 'Quiz questions are required.' });
    }

    const result = evaluateQuiz(questions, userAnswers);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/save', async (req, res) => {
  try {
    const videoData = req.body.videoData || {};
    const questions = sanitizeQuestions(req.body.questions);
    const userAnswers = Array.isArray(req.body.userAnswers) ? req.body.userAnswers : [];
    const result = req.body.result || evaluateQuiz(questions, userAnswers);
    const videoId = videoData.videoId || req.body.videoId;

    if (!videoId) {
      return res.status(400).json({ success: false, message: 'Video ID is required to save a quiz.' });
    }

    if (!questions.length) {
      return res.status(400).json({ success: false, message: 'Quiz questions are required.' });
    }

    const quiz = await Quiz.create({
      userId: req.user._id,
      videoId,
      videoTitle: videoData.title || req.body.videoTitle || 'Untitled video',
      videoUrl: buildVideoUrl(videoId, videoData.videoUrl || req.body.videoUrl),
      channelTitle: videoData.channelTitle || req.body.channelTitle || '',
      questions,
      userAnswers,
      score: Number(result.score || 0),
      totalQuestions: Number(result.totalQuestions || questions.length),
      percentage: Number(result.percentage || 0),
      attemptedAt: new Date(),
    });

    res.status(201).json({ success: true, quiz });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const quizzes = await Quiz.find({ userId: req.user._id }).sort({ attemptedAt: -1 }).lean();
    res.json({ success: true, quizzes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.user._id }).lean();
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz attempt not found.' });
    }
    res.json({ success: true, quiz });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz attempt not found.' });
    }
    res.json({ success: true, message: 'Quiz attempt deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
