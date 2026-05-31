const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    videoId: { type: String, required: true },
    videoTitle: { type: String, default: 'Untitled video' },
    videoUrl: String,
    thumbnail: String,
    channelTitle: String,
    summary: { type: String, default: '' },
    keyPoints: { type: [String], default: [] },
    importantConcepts: { type: [String], default: [] },
    revisionNotes: { type: String, default: '' },
    quickRecap: { type: String, default: '' },
    suggestedFollowUpTopics: { type: [String], default: [] },
    transcriptSource: { type: String, default: 'metadata' },
    rawNotesText: { type: String, default: '' },
  },
  { timestamps: true }
);

noteSchema.index({ userId: 1, videoId: 1 });

module.exports = mongoose.model('Note', noteSchema);
