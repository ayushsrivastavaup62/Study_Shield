const express = require('express');
const mongoose = require('mongoose');
const StudySession = require('../models/StudySession');
const WatchedVideo = require('../models/WatchedVideo');
const BlockedVideo = require('../models/BlockedVideo');
const Quiz = require('../models/Quiz');
const Note = require('../models/Note');
const { protect } = require('../middleware/auth');

const router = express.Router();

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

const getActiveStudyDays = async (userId) => {
  const watchedDays = await WatchedVideo.distinct('timestamp', { userId });
  const sessionDays = await StudySession.distinct('date', { userId, duration: { $gt: 0 } });

  return new Set(
    [...watchedDays, ...sessionDays]
      .filter(Boolean)
      .map((date) => startOfDay(date).toISOString().slice(0, 10))
  );
};

const calculateStreaks = (activeDays) => {
  if (!activeDays.size) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const sorted = [...activeDays].sort();
  let longestStreak = 0;
  let run = 0;
  let previous = null;

  sorted.forEach((day) => {
    const current = startOfDay(day);
    if (previous && current - previous === DAY_MS) {
      run += 1;
    } else {
      run = 1;
    }
    longestStreak = Math.max(longestStreak, run);
    previous = current;
  });

  const today = startOfDay(new Date());
  const yesterday = new Date(today.getTime() - DAY_MS);
  let cursor = activeDays.has(today.toISOString().slice(0, 10)) ? today : yesterday;
  let currentStreak = 0;

  while (activeDays.has(cursor.toISOString().slice(0, 10))) {
    currentStreak += 1;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }

  return { currentStreak, longestStreak };
};

const calculateFocusScore = ({
  totalStudyTime,
  totalWatchedVideos,
  totalBlockedVideos,
  currentStreak,
  activeDaysLast7,
}) => {
  const studyTimeScore = Math.min(25, Math.floor(totalStudyTime / 30) * 5);
  const educationScore = Math.min(25, totalWatchedVideos * 3);
  const blockingScore = Math.min(20, totalBlockedVideos * 4);
  const consistencyScore = Math.min(20, activeDaysLast7 * 3);
  const streakScore = Math.min(10, currentStreak * 2);

  return Math.min(100, studyTimeScore + educationScore + blockingScore + consistencyScore + streakScore);
};

const mergeActivityCount = (byDate, rows, field, valueKey = 'count') => {
  rows.forEach((item) => {
    if (!byDate.has(item._id)) return;
    byDate.get(item._id)[field] = item[valueKey] || 0;
  });
};

const getSummaryForUser = async (userId) => {
  const [studyTimeResult, totalWatchedVideos, totalBlockedVideos, quizStatsResult, latestQuiz, activeDays] = await Promise.all([
    StudySession.aggregate([
      { $match: { userId: toObjectId(userId) } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$duration', 0] } } } },
    ]),
    WatchedVideo.countDocuments({ userId }),
    BlockedVideo.countDocuments({ userId }),
    Quiz.aggregate([
      { $match: { userId: toObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalQuizzesAttempted: { $sum: 1 },
          averageScore: { $avg: '$percentage' },
          bestScore: { $max: '$percentage' },
        },
      },
    ]),
    Quiz.findOne({ userId }).sort({ attemptedAt: -1 }).lean(),
    getActiveStudyDays(userId),
  ]);

  const totalStudyTime = studyTimeResult[0]?.total || 0;
  const { currentStreak, longestStreak } = calculateStreaks(activeDays);
  const sevenDaysAgo = startOfDay(new Date(Date.now() - 6 * DAY_MS));
  const activeDaysLast7 = [...activeDays].filter((day) => startOfDay(day) >= sevenDaysAgo).length;
  const focusScore = calculateFocusScore({
    totalStudyTime,
    totalWatchedVideos,
    totalBlockedVideos,
    currentStreak,
    activeDaysLast7,
  });

  return {
    totalStudyTime,
    totalWatchedVideos,
    totalBlockedVideos,
    totalQuizzesAttempted: quizStatsResult[0]?.totalQuizzesAttempted || 0,
    averageQuizScore: Math.round(quizStatsResult[0]?.averageScore || 0),
    bestQuizScore: Math.round(quizStatsResult[0]?.bestScore || 0),
    latestQuizResult: latestQuiz
      ? {
          id: latestQuiz._id,
          videoTitle: latestQuiz.videoTitle,
          score: latestQuiz.score,
          totalQuestions: latestQuiz.totalQuestions,
          percentage: latestQuiz.percentage,
          attemptedAt: latestQuiz.attemptedAt,
        }
      : null,
    focusScore,
    currentStreak,
    longestStreak,
  };
};

router.use((req, res, next) => {
  console.log(`[ROUTE HIT] /api/analytics${req.path}`);
  next();
});

router.use(protect);

router.get('/summary', async (req, res) => {
  try {
    const summary = await getSummaryForUser(req.user._id);
    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/weekly', async (req, res) => {
  try {
    const userId = req.user._id;
    const start = startOfDay(new Date(Date.now() - 6 * DAY_MS));
    const end = endOfDay(new Date());

    const [sessions, watched, blocked] = await Promise.all([
      StudySession.aggregate([
        { $match: { userId: toObjectId(userId), date: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            studyMinutes: { $sum: { $ifNull: ['$duration', 0] } },
          },
        },
      ]),
      WatchedVideo.aggregate([
        { $match: { userId: toObjectId(userId), timestamp: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            watchedVideos: { $sum: 1 },
          },
        },
      ]),
      BlockedVideo.aggregate([
        { $match: { userId: toObjectId(userId), timestamp: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            blockedVideos: { $sum: 1 },
          },
        },
      ]),
    ]);

    const byDate = new Map();
    for (let i = 0; i < 7; i += 1) {
      const date = new Date(start.getTime() + i * DAY_MS).toISOString().slice(0, 10);
      byDate.set(date, { date, studyMinutes: 0, watchedVideos: 0, blockedVideos: 0 });
    }

    sessions.forEach((item) => {
      if (byDate.has(item._id)) byDate.get(item._id).studyMinutes = item.studyMinutes;
    });
    watched.forEach((item) => {
      if (byDate.has(item._id)) byDate.get(item._id).watchedVideos = item.watchedVideos;
    });
    blocked.forEach((item) => {
      if (byDate.has(item._id)) byDate.get(item._id).blockedVideos = item.blockedVideos;
    });

    res.json({ success: true, weekly: [...byDate.values()] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const categories = await WatchedVideo.aggregate([
      { $match: { userId: toObjectId(req.user._id) } },
      {
        $group: {
          _id: { $ifNull: ['$category', 'General Study'] },
          watchCount: { $sum: 1 },
          totalTime: { $sum: { $ifNull: ['$watchDuration', 0] } },
        },
      },
      { $sort: { watchCount: -1, totalTime: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          category: '$_id',
          watchCount: 1,
          totalTime: 1,
        },
      },
    ]);

    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/activity-calendar', async (req, res) => {
  try {
    const userId = req.user._id;
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 84, 7), 180);
    const start = startOfDay(new Date(Date.now() - (days - 1) * DAY_MS));
    const end = endOfDay(new Date());
    const userObjectId = toObjectId(userId);

    const [sessions, watched, blocked, notes, quizzes] = await Promise.all([
      StudySession.aggregate([
        { $match: { userId: userObjectId, date: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            studyMinutes: { $sum: { $ifNull: ['$duration', 0] } },
            completedStudySessions: { $sum: 1 },
          },
        },
      ]),
      WatchedVideo.aggregate([
        { $match: { userId: userObjectId, timestamp: { $gte: start, $lte: end } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, count: { $sum: 1 } } },
      ]),
      BlockedVideo.aggregate([
        { $match: { userId: userObjectId, timestamp: { $gte: start, $lte: end } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, count: { $sum: 1 } } },
      ]),
      Note.aggregate([
        { $match: { userId: userObjectId, createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      ]),
      Quiz.aggregate([
        { $match: { userId: userObjectId, attemptedAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$attemptedAt' } },
            quizzesAttempted: { $sum: 1 },
            averageQuizScore: { $avg: '$percentage' },
          },
        },
      ]),
    ]);

    const byDate = new Map();
    for (let i = 0; i < days; i += 1) {
      const date = new Date(start.getTime() + i * DAY_MS).toISOString().slice(0, 10);
      byDate.set(date, {
        date,
        studyMinutes: 0,
        watchedVideos: 0,
        blockedVideos: 0,
        notesGenerated: 0,
        quizzesAttempted: 0,
        completedStudySessions: 0,
        averageQuizScore: null,
        activityScore: 0,
      });
    }

    sessions.forEach((item) => {
      if (!byDate.has(item._id)) return;
      byDate.get(item._id).studyMinutes = item.studyMinutes || 0;
      byDate.get(item._id).completedStudySessions = item.completedStudySessions || 0;
    });
    mergeActivityCount(byDate, watched, 'watchedVideos');
    mergeActivityCount(byDate, blocked, 'blockedVideos');
    mergeActivityCount(byDate, notes, 'notesGenerated');
    quizzes.forEach((item) => {
      if (!byDate.has(item._id)) return;
      byDate.get(item._id).quizzesAttempted = item.quizzesAttempted || 0;
      byDate.get(item._id).averageQuizScore = Number.isFinite(item.averageQuizScore)
        ? Math.round(item.averageQuizScore)
        : null;
    });

    const activity = [...byDate.values()].map((day) => ({
      ...day,
      activityScore:
        day.watchedVideos +
        day.blockedVideos +
        day.notesGenerated +
        day.quizzesAttempted +
        day.completedStudySessions,
    }));

    res.json({ success: true, activity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/recent', async (req, res) => {
  try {
    const userId = req.user._id;
    const [watchedVideos, blockedVideos, studySessions] = await Promise.all([
      WatchedVideo.find({ userId }).sort({ timestamp: -1 }).limit(6).lean(),
      BlockedVideo.find({ userId }).sort({ timestamp: -1 }).limit(6).lean(),
      StudySession.find({ userId }).sort({ date: -1 }).limit(6).lean(),
    ]);

    const recent = [
      ...watchedVideos.map((item) => ({
        id: item._id,
        type: 'watched',
        title: item.title || 'Educational video watched',
        category: item.category || 'General Study',
        timestamp: item.timestamp,
      })),
      ...blockedVideos.map((item) => ({
        id: item._id,
        type: 'blocked',
        title: item.title || 'Distraction blocked',
        reason: item.reason || 'Non-educational content',
        timestamp: item.timestamp,
      })),
      ...studySessions.map((item) => ({
        id: item._id,
        type: 'session',
        title: 'Study session completed',
        duration: item.duration || 0,
        focusScore: item.focusScore || 0,
        timestamp: item.date,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 12);

    res.json({ success: true, recent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const summary = await getSummaryForUser(req.user._id);
    res.json({
      success: true,
      analytics: {
        totalSessions: await StudySession.countDocuments({ userId: req.user._id }),
        totalStudyTime: summary.totalStudyTime,
        videosWatched: summary.totalWatchedVideos,
        videosBlocked: summary.totalBlockedVideos,
        avgFocusScore: summary.focusScore,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
