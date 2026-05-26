const axios = require('axios');
const searchCache = require('./searchCache');
const detailsCache = require('./detailsCache');
const {
  getMockSearchResults,
  getMockVideoDetails,
  isQuotaError,
} = require('./mockStudyVideos');

class YouTubeService {
  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY;
    this.baseUrl = 'https://www.googleapis.com/youtube/v3';
  }

  async searchVideos(query, maxResults = 10, pageToken = null) {
    const cached = searchCache.get(query, pageToken);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    if (process.env.USE_MOCK_YOUTUBE === 'true') {
      console.log(`[YOUTUBE SERVICE] Force Mock Mode Enabled (USE_MOCK_YOUTUBE=true). Bypassing YouTube API. Returning mock search results for query: "${query}"`);
      const mockVideos = getMockSearchResults(query, maxResults);
      const mockResult = {
        videos: mockVideos,
        nextPageToken: null,
        quotaExceeded: false,
        fromMock: true,
        fromCache: false,
      };
      searchCache.set(query, pageToken, mockResult);
      return mockResult;
    }

    try {
      const params = {
        key: this.apiKey,
        q: query,
        part: 'snippet',
        maxResults: maxResults,
        type: 'video',
        order: 'relevance',
      };

      if (pageToken) {
        params.pageToken = pageToken;
      }

      const response = await axios.get(`${this.baseUrl}/search`, { params });

      const videos = response.data.items.map((item) => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
        channelId: item.snippet.channelId,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
      }));

      const result = {
        videos,
        nextPageToken: response.data.nextPageToken || null,
        quotaExceeded: false,
        fromMock: false,
        fromCache: false,
      };

      searchCache.set(query, pageToken, result);
      return result;
    } catch (error) {
      console.error('[YOUTUBE SERVICE] Search Error:', error.response?.data || error.message);
      console.warn(`[YOUTUBE SERVICE] Falling back to mock search results for query: "${query}" due to API error.`);

      const stale = searchCache.findLatestForQuery(query);
      if (stale) {
        return { ...stale, fromCache: true, quotaExceeded: true };
      }

      if (!pageToken) {
        const mockVideos = getMockSearchResults(query, maxResults);
        const mockResult = {
          videos: mockVideos,
          nextPageToken: null,
          quotaExceeded: true,
          fromMock: true,
          fromCache: false,
        };
        searchCache.set(query, pageToken, mockResult);
        return mockResult;
      }

      return {
        videos: [],
        nextPageToken: null,
        quotaExceeded: true,
        fromMock: true,
        fromCache: false,
      };
    }
  }

  async getVideoDetails(videoId) {
    const cached = detailsCache.get(videoId);
    if (cached) {
      return cached;
    }

    if (process.env.USE_MOCK_YOUTUBE === 'true') {
      console.log(`[YOUTUBE SERVICE] Force Mock Mode Enabled (USE_MOCK_YOUTUBE=true). Bypassing YouTube API. Returning mock details for video ID: "${videoId}"`);
      const mock = getMockVideoDetails(videoId);
      detailsCache.set(videoId, mock);
      return mock;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/videos`, {
        params: {
          key: this.apiKey,
          id: videoId,
          part: 'snippet,statistics,contentDetails',
        },
      });

      const video = response.data.items[0];
      if (!video) throw new Error('Video not found');

      const details = {
        videoId: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        tags: video.snippet.tags || [],
        categoryId: video.snippet.categoryId,
        channelTitle: video.snippet.channelTitle,
        thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
        duration: video.contentDetails.duration,
        viewCount: video.statistics.viewCount,
        likeCount: video.statistics.likeCount,
      };

      detailsCache.set(videoId, details);
      return details;
    } catch (error) {
      console.error('[YOUTUBE SERVICE] Video Details Error:', error.response?.data || error.message);
      console.warn(`[YOUTUBE SERVICE] Falling back to mock details for video ID: "${videoId}" due to API error.`);

      const mock = getMockVideoDetails(videoId);
      detailsCache.set(videoId, mock);
      return mock;
    }
  }

  extractVideoId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  }
}

module.exports = new YouTubeService();
