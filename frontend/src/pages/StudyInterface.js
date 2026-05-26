import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import YouTube from 'react-youtube';
import { Search, Target, Home, BarChart3, Settings, Play, Loader2 } from 'lucide-react';
import axios from 'axios';
import StudyTimer from '../components/StudyTimer';
import SearchBar from '../components/SearchBar';
import QuotaExceededBanner from '../components/QuotaExceededBanner';
import VideoCard, { VideoCardSkeleton } from '../components/VideoCard';
import BlockedOverlay from '../components/BlockedOverlay';
import {
  getCachedSearch,
  setCachedSearch,
  hasFreshSearchCache,
  isQuotaExceededError,
} from '../utils/videoSearchCache';
import {
  getCachedDetails,
  setCachedDetails,
  getCachedClassification,
  setCachedClassification,
} from '../utils/videoDetailsCache';
import { shouldAllowSearch } from '../utils/searchThrottle';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL;

const StudyInterface = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isBlurred, setIsBlurred] = useState(false);
  const [showBlockPopup, setShowBlockPopup] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [fromMock, setFromMock] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [showQuotaBanner, setShowQuotaBanner] = useState(false);

  const feedRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/', { state: { openAuth: true } });
    }
  }, [user, authLoading, navigate]);
  const loadMoreRef = useRef(null);
  const activeQueryRef = useRef(activeQuery);
  const lastSearchAtRef = useRef(0);
  const inflightSearchesRef = useRef(new Map());
  const searchDebounceRef = useRef(null);

  useEffect(() => {
    activeQueryRef.current = activeQuery;
  }, [activeQuery]);

  useEffect(() => {
    console.log(`[FRONTEND] Videos state updated. Current video count in list: ${videos.length}`);
  }, [videos]);

  const applySearchResult = useCallback((query, data, append) => {
    const newVideos = data.videos || [];
    console.log(`[FRONTEND] applySearchResult - Updating videos state. Query: "${query}", Append: ${append}, Videos count to apply: ${newVideos.length}`);
    setVideos((prev) => (append ? [...prev, ...newVideos] : newVideos));
    setNextPageToken(data.nextPageToken || null);
    setQuotaExceeded(Boolean(data.quotaExceeded));
    setFromMock(Boolean(data.fromMock));
    setFromCache(Boolean(data.fromCache));
    setShowQuotaBanner(Boolean(data.quotaExceeded));
    setHasSearched(true);
    setSearchError(null);

    if (!append) {
      setCachedSearch(
        query,
        {
          videos: newVideos,
          nextPageToken: data.nextPageToken || null,
          quotaExceeded: Boolean(data.quotaExceeded),
          fromMock: Boolean(data.fromMock),
          fromCache: Boolean(data.fromCache),
        },
        null
      );
    }
  }, []);

  const fetchVideos = useCallback(async (query, pageToken = null, append = false) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const requestKey = `${trimmed}|${pageToken || ''}`;

    if (hasFreshSearchCache(trimmed, pageToken)) {
      const local = getCachedSearch(trimmed, pageToken);
      console.log(`[FRONTEND] Found fresh search cache for query: "${trimmed}". Bypassing API request.`);
      applySearchResult(trimmed, { ...local, fromCache: true }, append);
      return;
    }

    if (inflightSearchesRef.current.has(requestKey)) {
      console.log(`[FRONTEND] In-flight search request detected for key: "${requestKey}". Reusing promise.`);
      return inflightSearchesRef.current.get(requestKey);
    }

    if (append) setLoadingMore(true);
    else setLoading(true);

    setSearchError(null);

    const requestPromise = (async () => {
      try {
        const params = new URLSearchParams({ q: trimmed });
        if (pageToken) params.append('pageToken', pageToken);

        console.log(`[FRONTEND] Fetching videos for query: "${trimmed}", pageToken: "${pageToken || 'none'}"`);
        const response = await axios.get(`${API}/api/videos/search?${params.toString()}`);
        console.log('[FRONTEND] Received YouTube search API response:', response.data);

        const payload = {
          videos: response.data.videos || [],
          nextPageToken: response.data.nextPageToken || null,
          quotaExceeded: response.data.quotaExceeded,
          fromMock: response.data.fromMock,
          fromCache: response.data.fromCache,
        };

        applySearchResult(trimmed, payload, append);
        setCachedSearch(trimmed, payload, pageToken);
      } catch (error) {
        console.error('[FRONTEND] YouTube search API error:', error);

        if (isQuotaExceededError(error)) {
          setQuotaExceeded(true);
          setShowQuotaBanner(true);

          const local = getCachedSearch(trimmed, pageToken);
          if (local?.videos?.length) {
            applySearchResult(trimmed, { ...local, quotaExceeded: true, fromCache: true }, append);
          } else if (!append) {
            setVideos([]);
            setSearchError('YouTube daily quota exceeded. Please try again later.');
          }
        } else {
          setSearchError(error.response?.data?.message || 'Search failed. Please try again.');
          if (!append) setVideos([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        inflightSearchesRef.current.delete(requestKey);
      }
    })();

    inflightSearchesRef.current.set(requestKey, requestPromise);
    return requestPromise;
  }, [applySearchResult]);

  const executeSearch = useCallback(() => {
    const trimmed = searchInput.trim();
    if (!trimmed) return;

    if (trimmed === activeQueryRef.current && hasFreshSearchCache(trimmed, null)) {
      const local = getCachedSearch(trimmed, null);
      console.log(`[FRONTEND] executeSearch: Using cached search for query: "${trimmed}"`);
      applySearchResult(trimmed, { ...local, fromCache: true }, false);
      return;
    }

    console.log(`[FRONTEND] executeSearch: Executing search for query: "${trimmed}"`);
    setActiveQuery(trimmed);
    setNextPageToken(null);
    fetchVideos(trimmed);
  }, [searchInput, fetchVideos, applySearchResult]);

  const runSearch = useCallback(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }

    console.log('[FRONTEND] runSearch: Triggered. Checking throttle...');
    if (shouldAllowSearch(lastSearchAtRef)) {
      console.log('[FRONTEND] runSearch: Throttle passed. Executing search immediately.');
      executeSearch();
      return;
    }

    console.log('[FRONTEND] runSearch: Throttled. Scheduling search debounce for 700ms.');
    searchDebounceRef.current = setTimeout(() => {
      searchDebounceRef.current = null;
      if (shouldAllowSearch(lastSearchAtRef)) {
        console.log('[FRONTEND] runSearch (debounced): Throttle passed. Executing search.');
        executeSearch();
      } else {
        console.log('[FRONTEND] runSearch (debounced): Throttled again. Skipping.');
      }
    }, 700);
  }, [executeSearch]);

  useEffect(
    () => () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    },
    []
  );

  const loadMore = useCallback(() => {
    if (loadingMore || !nextPageToken || loading || quotaExceeded) return;
    fetchVideos(activeQueryRef.current, nextPageToken, true);
  }, [loadingMore, nextPageToken, loading, quotaExceeded, fetchVideos]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    const root = feedRef.current;
    if (!sentinel || !root || !hasSearched) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { root, rootMargin: '120px', threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, videos.length, nextPageToken, hasSearched]);

  const handleVideoSelect = async (video) => {
    const { videoId } = video;

    const cachedClassification = getCachedClassification(videoId);
    if (cachedClassification !== undefined) {
      setSelectedVideo(video);
      setIsBlurred(!cachedClassification);
      setShowBlockPopup(!cachedClassification);
      setClassifying(false);
      return;
    }

    setSelectedVideo(video);
    setIsBlurred(true);
    setShowBlockPopup(false);
    setClassifying(true);

    try {
      let details = getCachedDetails(videoId);

      if (!details) {
        try {
          console.log(`[FRONTEND] Fetching details for video: "${videoId}"`);
          const detailsResponse = await axios.get(`${API}/api/videos/details/${videoId}`);
          details = detailsResponse.data.details;
          setCachedDetails(videoId, details);
          console.log('[FRONTEND] Received video details from API:', details);
        } catch (detailsError) {
          console.warn('[FRONTEND] Failed to fetch video details from API. Reusing already-fetched search video data to save API quota:', detailsError.message);
          // Reuse already-fetched search video data instead of failing!
          details = {
            videoId: video.videoId,
            title: video.title,
            description: video.description,
            channelTitle: video.channelTitle,
            thumbnail: video.thumbnail,
            tags: [],
            categoryId: '27', // Default to Education category
            duration: 'PT15M00S',
            viewCount: '100000',
            likeCount: '5000'
          };
        }
      }

      console.log('[FRONTEND] Submitting content for AI classification:', details.title);
      const classifyResponse = await axios.post(`${API}/api/videos/classify`, {
        videoData: details,
        userId: user?.id || user?._id || 'demo-user',
      });

      if (!classifyResponse.data?.success) {
        throw new Error(classifyResponse.data?.message || 'Classification failed');
      }

      const isEducational = classifyResponse.data.isEducational === true;
      setCachedClassification(videoId, isEducational);

      if (isEducational) {
        setIsBlurred(false);
        setShowBlockPopup(false);
      } else {
        setIsBlurred(true);
        setShowBlockPopup(true);
      }
    } catch (error) {
      console.error('Classification error:', error);
      setIsBlurred(true);
      setShowBlockPopup(true);
    }

    setClassifying(false);
  };

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      modestbranding: 1,
      rel: 0,
    },
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-12 h-12 text-primary-400 animate-spin" />
          <p className="text-sm text-gray-400">Restoring session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-hero flex flex-col"
    >
      <header className="glass-dark border-b border-white/10 px-4 sm:px-6 py-3 sticky top-0 z-40 backdrop-blur-xl">
        <motion.div className="max-w-[1920px] mx-auto flex items-center justify-between gap-4">
          <motion.div className="flex items-center gap-3 shrink-0" whileHover={{ x: -2 }}>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="p-2.5 hover:bg-white/10 rounded-xl transition-colors border border-white/5"
              aria-label="Home"
            >
              <Home className="w-5 h-5" />
            </button>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight hidden sm:block">
              <span className="text-gradient">Study</span>
              <span className="text-white">Shield</span>
            </h1>
          </motion.div>

          <SearchBar
            className="flex-1 max-w-xl hidden md:flex"
            value={searchInput}
            onChange={setSearchInput}
            onSearch={runSearch}
            loading={loading}
          />

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <StudyTimer />
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => setFocusMode(!focusMode)}
              className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                focusMode
                  ? 'bg-gradient border-transparent text-white shadow-glow-sm'
                  : 'glass border-white/10 hover:border-primary-500/30'
              }`}
            >
              <Target className="w-4 h-4" />
              Focus
            </motion.button>
            
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 glass rounded-full border border-white/10">
                <div className="w-5 h-5 rounded-full bg-gradient flex items-center justify-center text-[10px] font-bold text-white uppercase">
                  {user.name.charAt(0)}
                </div>
                <span className="text-xs font-medium text-white max-w-[80px] truncate">{user.name}</span>
              </div>
            )}
            
            {user && (
              <button
                type="button"
                onClick={logout}
                className="hidden sm:block px-3 py-1.5 border border-rose-500/30 hover:border-rose-500/80 bg-rose-500/10 text-rose-300 rounded-full text-xs font-semibold transition-colors"
              >
                Logout
              </button>
            )}
          </div>
        </motion.div>

        <SearchBar
          className="md:hidden mt-3"
          value={searchInput}
          onChange={setSearchInput}
          onSearch={runSearch}
          loading={loading}
        />
      </header>

      <AnimatePresence>
        {showQuotaBanner && quotaExceeded && (
          <QuotaExceededBanner
            fromMock={fromMock}
            fromCache={fromCache}
            onDismiss={() => setShowQuotaBanner(false)}
          />
        )}
      </AnimatePresence>

      {searchError && !loading && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-amber-300/90 text-sm px-4 py-2"
        >
          {searchError}
        </motion.p>
      )}

      <motion.div className="flex flex-1 flex-col lg:flex-row min-h-0 overflow-hidden">
        <aside
          className={`${focusMode ? 'hidden' : 'flex'} flex-col w-full lg:w-[380px] xl:w-[420px] glass-dark border-r border-white/10 shrink-0`}
        >
          <div className="px-4 py-3 border-b border-white/10">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Study Feed</h2>
          </div>
          <div ref={feedRef} className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[40vh] lg:max-h-none">
            {loading && videos.length === 0 ? (
              <div className="grid gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <VideoCardSkeleton key={i} />
                ))}
              </div>
            ) : videos.length > 0 ? (
              <>
                {videos.map((video, index) => (
                  <VideoCard
                    key={`${video.videoId}-${index}`}
                    video={video}
                    index={index}
                    isSelected={selectedVideo?.videoId === video.videoId}
                    onClick={() => handleVideoSelect(video)}
                  />
                ))}
                <motion.div ref={loadMoreRef} className="py-4 flex justify-center">
                  {loadingMore && <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />}
                  {!loadingMore && !nextPageToken && hasSearched && (
                    <p className="text-xs text-gray-600">You&apos;re all caught up</p>
                  )}
                </motion.div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-40" />
                <p className="font-medium text-gray-400 mb-1">Search to load videos</p>
                <p className="text-sm text-gray-600">
                  Enter a topic and press Search or Enter — no automatic requests while typing.
                </p>
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-6 flex flex-col items-center justify-start overflow-y-auto min-h-[50vh] lg:min-h-0">
          {selectedVideo ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-5xl"
            >
              <div className="relative rounded-2xl overflow-hidden glass aspect-video border border-white/10 shadow-glow">
                {(isBlurred || classifying) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 backdrop-blur-2xl bg-black/60 z-10"
                  />
                )}

                {classifying && (
                  <motion.div className="absolute inset-0 z-[15] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-10 h-10 text-primary-400 animate-spin" />
                      <p className="text-sm text-gray-400">Analyzing content...</p>
                    </div>
                  </motion.div>
                )}

                <YouTube videoId={selectedVideo.videoId} opts={opts} className="w-full h-full aspect-video" />

                <AnimatePresence>
                  {showBlockPopup && (
                    <BlockedOverlay
                      onDismiss={() => {
                        setShowBlockPopup(false);
                        setSelectedVideo(null);
                        setIsBlurred(false);
                      }}
                    />
                  )}
                </AnimatePresence>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-4 glass rounded-2xl p-5 border border-white/10"
              >
                <h2 className="text-lg sm:text-xl font-semibold mb-1">{selectedVideo.title}</h2>
                <p className="text-gray-500 text-sm">{selectedVideo.channelTitle}</p>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="w-28 h-28 bg-gradient rounded-full flex items-center justify-center mx-auto mb-8 shadow-glow btn-glow"
              >
                <Play className="w-14 h-14 text-white fill-white ml-1" />
              </motion.div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Ready to Study?</h2>
              <p className="text-gray-500 max-w-sm mx-auto">
                Search for a topic, then pick a video — AI will keep only educational content playing.
              </p>
            </motion.div>
          )}
        </main>
      </motion.div>
    </motion.div>
  );
};

export default StudyInterface;
