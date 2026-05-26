/** Curated educational entries used when YouTube API quota is exceeded */
const MOCK_STUDY_VIDEOS = [
  {
    videoId: 'aircAruvnKk',
    title: 'But what is a neural network? | Deep learning',
    description: 'Educational introduction to neural networks and deep learning.',
    thumbnail: 'https://img.youtube.com/vi/aircAruvnKk/hqdefault.jpg',
    channelId: 'mock-1',
    channelTitle: '3Blue1Brown',
    publishedAt: '2017-10-05T00:00:00Z',
    categoryId: '27',
    tags: ['education', 'mathematics', 'neural networks'],
  },
  {
    videoId: 'WUvTyaaCaJo',
    title: 'Introduction to Physics - Classical Mechanics',
    description: 'Fundamental physics concepts for university students.',
    thumbnail: 'https://img.youtube.com/vi/WUvTyaaCaJo/hqdefault.jpg',
    channelId: 'mock-2',
    channelTitle: 'Physics Lectures',
    publishedAt: '2020-01-15T00:00:00Z',
    categoryId: '27',
    tags: ['physics', 'education', 'mechanics'],
  },
  {
    videoId: 'NybHckSEQBI',
    title: 'Organic Chemistry - Reaction Mechanisms',
    description: 'Study session on organic chemistry reaction mechanisms.',
    thumbnail: 'https://img.youtube.com/vi/NybHckSEQBI/hqdefault.jpg',
    channelId: 'mock-3',
    channelTitle: 'Chem Study Hub',
    publishedAt: '2021-03-22T00:00:00Z',
    categoryId: '27',
    tags: ['chemistry', 'organic', 'education'],
  },
  {
    videoId: 'TtQUwa77ey8',
    title: 'Pendulum Lab - Simple Harmonic Motion',
    description: 'Physics lab demonstration of pendulum motion.',
    thumbnail: 'https://img.youtube.com/vi/TtQUwa77ey8/hqdefault.jpg',
    channelId: 'mock-4',
    channelTitle: 'Science Classroom',
    publishedAt: '2018-11-05T00:00:00Z',
    categoryId: '27',
    tags: ['physics', 'pendulum', 'education'],
  },
  {
    videoId: 'kQ2tbbGgA1M',
    title: 'Python for Beginners - Full Course',
    description: 'Complete Python programming tutorial for students.',
    thumbnail: 'https://img.youtube.com/vi/kQ2tbbGgA1M/hqdefault.jpg',
    channelId: 'mock-5',
    channelTitle: 'Code Study',
    publishedAt: '2022-02-18T00:00:00Z',
    categoryId: '27',
    tags: ['python', 'programming', 'tutorial'],
  },
  {
    videoId: 'ZSt9tm3WQfA',
    title: 'Biology: Cell Structure and Function',
    description: 'Comprehensive biology lesson on cell organelles.',
    thumbnail: 'https://img.youtube.com/vi/ZSt9tm3WQfA/hqdefault.jpg',
    channelId: 'mock-6',
    channelTitle: 'Bio Academy',
    publishedAt: '2020-09-30T00:00:00Z',
    categoryId: '27',
    tags: ['biology', 'cells', 'science'],
  },
];

function getMockSearchResults(query, maxResults = 15) {
  const q = (query || '').trim().toLowerCase();
  const filtered =
    q.length < 2
      ? MOCK_STUDY_VIDEOS
      : MOCK_STUDY_VIDEOS.filter(
          (v) =>
            v.title.toLowerCase().includes(q) ||
            v.description.toLowerCase().includes(q) ||
            v.tags.some((t) => t.includes(q))
        );

  const list = filtered.length > 0 ? filtered : MOCK_STUDY_VIDEOS;
  return list.slice(0, maxResults).map((v) => ({
    videoId: v.videoId,
    title: v.title,
    description: v.description,
    thumbnail: v.thumbnail,
    channelId: v.channelId,
    channelTitle: v.channelTitle,
    publishedAt: v.publishedAt,
  }));
}

function getMockVideoDetails(videoId) {
  const base = MOCK_STUDY_VIDEOS.find((v) => v.videoId === videoId) || MOCK_STUDY_VIDEOS[0];
  return {
    videoId: base.videoId,
    title: base.title,
    description: base.description,
    tags: base.tags || ['education', 'study'],
    categoryId: base.categoryId || '27',
    channelTitle: base.channelTitle,
    thumbnail: base.thumbnail,
    duration: 'PT15M00S',
    viewCount: '100000',
    likeCount: '5000',
  };
}

function isQuotaError(error) {
  const status = error?.response?.status;
  const reasons = error?.response?.data?.error?.errors || [];
  if (status === 403) {
    return (
      reasons.some(
        (e) =>
          e.reason === 'quotaExceeded' ||
          e.reason === 'dailyLimitExceeded' ||
          (e.message && e.message.toLowerCase().includes('quota'))
      ) || true
    );
  }
  const msg = (error?.message || '').toLowerCase();
  return msg.includes('quota') || msg.includes('403');
}

module.exports = {
  MOCK_STUDY_VIDEOS,
  getMockSearchResults,
  getMockVideoDetails,
  isQuotaError,
};
