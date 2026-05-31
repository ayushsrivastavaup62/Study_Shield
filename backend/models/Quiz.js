const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: { type: [String], required: true },
    correctAnswer: { type: String, required: true },
    explanation: { type: String, default: '' },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    videoId: { type: String, required: true },
    videoTitle: { type: String, default: 'Untitled video' },
    channelTitle: { type: String, default: '' },
    questions: { type: [quizQuestionSchema], default: [] },
    userAnswers: { type: [String], default: [] },
    score: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    attemptedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

quizSchema.index({ userId: 1, attemptedAt: -1 });

module.exports = mongoose.model('Quiz', quizSchema);
