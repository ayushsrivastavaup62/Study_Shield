import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import YouTube from 'react-youtube';
import { BarChart3, BookOpenText, FileText, HelpCircle, Home, Loader2, LogOut, Menu, Play, Search, Target, X } from 'lucide-react';
import axios from 'axios';
import StudyTimer from '../components/StudyTimer';
import SearchBar from '../components/SearchBar';
import QuotaExceededBanner from '../components/QuotaExceededBanner';
import VideoCard, { VideoCardSkeleton } from '../components/VideoCard';
import BlockedOverlay from '../components/BlockedOverlay';
import NotesEditorModal from '../components/NotesEditorModal';
import QuizModal from '../components/QuizModal';
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
  const [selectedVideoDetails, setSelectedVideoDetails] = useState(null);
  const [isSelectedEducational, setIsSelectedEducational] = useState(false);
  const [generatingNotes, setGeneratingNotes] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState(null);
  const [showNotesSuccess, setShowNotesSuccess] = useState(false);
  const [notesPreviewOpen, setNotesPreviewOpen] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesStatus, setNotesStatus] = useState(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [quizResult, setQuizResult] = useState(null);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [quizSaved, setQuizSaved] = useState(false);
  const [quizStatus, setQuizStatus] = useState(null);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);

  const feedRef = useRef(null);
  const workspaceMenuRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(event.target)) {
        setWorkspaceMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadMore = useCallback(() => {
    if (loadingMore || !nextPageToken || loading || quotaExceeded) return;
    fetchVideos(activeQueryRef.current, nextPageToken, true);
  }, [loadingMore, nextPageToken, loading, quotaExceeded, fetchVideos]);

  const closeWorkspaceMenu = () => setWorkspaceMenuOpen(false);

  const goDashboard = () => {
    navigate('/dashboard');
    closeWorkspaceMenu();
  };

  const goNotes = () => {
    navigate('/notes');
    closeWorkspaceMenu();
  };

  const goQuizzes = () => {
    navigate('/quizzes');
    closeWorkspaceMenu();
  };

  const toggleFocusMode = () => {
    setFocusMode((current) => !current);
    closeWorkspaceMenu();
  };

  const handleLogout = () => {
    logout();
    closeWorkspaceMenu();
  };

  const menuItems = [
    { label: focusMode ? 'Exit Focus Mode' : 'Focus Mode', icon: Target, onClick: toggleFocusMode },
    { label: 'Dashboard', icon: BarChart3, onClick: goDashboard },
    { label: 'My Notes', icon: BookOpenText, onClick: goNotes },
    { label: 'My Quizzes', icon: HelpCircle, onClick: goQuizzes },
    { label: 'Logout', icon: LogOut, onClick: handleLogout, danger: true },
  ];

  const handleVideoSelect = async (video) => {
    const { videoId } = video;

    const cachedClassification = getCachedClassification(videoId);
    if (cachedClassification !== undefined) {
      setSelectedVideo(video);
      setIsBlurred(!cachedClassification);
      setShowBlockPopup(!cachedClassification);
      setClassifying(false);
      setIsSelectedEducational(Boolean(cachedClassification));
      setSelectedVideoDetails(getCachedDetails(videoId) || video);
      setGeneratedNotes(null);
      setShowNotesSuccess(false);
      setNotesPreviewOpen(false);
      setNotesStatus(null);
      setQuizOpen(false);
      setQuizQuestions([]);
      setQuizAnswers([]);
      setQuizResult(null);
      setQuizSaved(false);
      setQuizStatus(null);
      return;
    }

    setSelectedVideo(video);
    setSelectedVideoDetails(null);
    setIsSelectedEducational(false);
    setGeneratedNotes(null);
    setShowNotesSuccess(false);
    setNotesPreviewOpen(false);
    setNotesStatus(null);
    setQuizOpen(false);
    setQuizQuestions([]);
    setQuizAnswers([]);
    setQuizResult(null);
    setQuizSaved(false);
    setQuizStatus(null);
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
      });

      if (!classifyResponse.data?.success) {
        throw new Error(classifyResponse.data?.message || 'Classification failed');
      }

      const isEducational = classifyResponse.data.isEducational === true;
      setCachedClassification(videoId, isEducational);

      if (isEducational) {
        setIsBlurred(false);
        setShowBlockPopup(false);
        setIsSelectedEducational(true);
        setSelectedVideoDetails(details);
      } else {
        setIsBlurred(true);
        setShowBlockPopup(true);
        setIsSelectedEducational(false);
        setSelectedVideoDetails(details);
      }
    } catch (error) {
      console.error('Classification error:', error);
      setIsBlurred(true);
      setShowBlockPopup(true);
      setIsSelectedEducational(false);
    }

    setClassifying(false);
  };

  const handleGenerateNotes = async () => {
    if (!selectedVideo || !isSelectedEducational || isBlurred || classifying) return;

    setGeneratingNotes(true);
    setNotesStatus(null);
    setShowNotesSuccess(false);

    try {
      const videoData = selectedVideoDetails || selectedVideo;
      const response = await axios.post(`${API}/api/notes/generate`, {
        videoData: {
          ...videoData,
          videoId: videoData.videoId || selectedVideo.videoId,
          title: videoData.title || selectedVideo.title,
          channelTitle: videoData.channelTitle || selectedVideo.channelTitle,
          thumbnail: videoData.thumbnail || selectedVideo.thumbnail,
          videoUrl: `https://www.youtube.com/watch?v=${videoData.videoId || selectedVideo.videoId}`,
        },
        isEducational: true,
      });

      setGeneratedNotes(response.data.notes);
      setShowNotesSuccess(true);
    } catch (error) {
      setNotesStatus(error.response?.data?.message || 'Could not generate notes right now.');
    } finally {
      setGeneratingNotes(false);
    }
  };

  const handleSaveNotes = async (editedNotes) => {
    setSavingNotes(true);
    setNotesStatus(null);
    try {
      await axios.post(`${API}/api/notes/save`, {
        videoData: selectedVideoDetails || selectedVideo,
        notes: editedNotes,
      });
      setNotesStatus('Notes saved successfully.');
      setNotesPreviewOpen(false);
      setShowNotesSuccess(false);
    } catch (error) {
      setNotesStatus(error.response?.data?.message || 'Could not save notes.');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!selectedVideo || !isSelectedEducational || isBlurred || classifying) return;

    setGeneratingQuiz(true);
    setQuizOpen(true);
    setQuizStatus(null);
    setQuizQuestions([]);
    setQuizAnswers([]);
    setQuizResult(null);
    setQuizSaved(false);

    try {
      const videoData = selectedVideoDetails || selectedVideo;
      const response = await axios.post(`${API}/api/quizzes/generate`, {
        videoData: {
          ...videoData,
          videoId: videoData.videoId || selectedVideo.videoId,
          title: videoData.title || selectedVideo.title,
          channelTitle: videoData.channelTitle || selectedVideo.channelTitle,
          thumbnail: videoData.thumbnail || selectedVideo.thumbnail,
          videoUrl: `https://www.youtube.com/watch?v=${videoData.videoId || selectedVideo.videoId}`,
        },
        notes: generatedNotes,
        isEducational: true,
      });

      const questions = response.data.questions || [];
      setQuizQuestions(questions);
      setQuizAnswers(Array(questions.length).fill(''));
    } catch (error) {
      setQuizOpen(false);
      setQuizStatus(error.response?.data?.message || 'Could not generate quiz right now.');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleQuizAnswer = (questionIndex, answer) => {
    setQuizAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = answer;
      return next;
    });
  };

  const handleSubmitQuiz = async () => {
    try {
      const response = await axios.post(`${API}/api/quizzes/submit`, {
        questions: quizQuestions,
        userAnswers: quizAnswers,
      });
      setQuizResult(response.data);
      setQuizSaved(false);
    } catch (error) {
      setQuizStatus(error.response?.data?.message || 'Could not submit quiz right now.');
    }
  };

  const handleSaveQuiz = async () => {
    if (!quizResult || !quizQuestions.length) return;

    setSavingQuiz(true);
    setQuizStatus(null);
    try {
      const videoData = selectedVideoDetails || selectedVideo;
      await axios.post(`${API}/api/quizzes/save`, {
        videoData: {
          ...videoData,
          videoId: videoData.videoId || selectedVideo.videoId,
          title: videoData.title || selectedVideo.title,
          channelTitle: videoData.channelTitle || selectedVideo.channelTitle,
          videoUrl: `https://www.youtube.com/watch?v=${videoData.videoId || selectedVideo.videoId}`,
        },
        questions: quizQuestions,
        userAnswers: quizAnswers,
        result: quizResult,
      });
      setQuizSaved(true);
      setQuizStatus('Quiz result saved successfully.');
    } catch (error) {
      setQuizStatus(error.response?.data?.message || 'Could not save quiz result.');
    } finally {
      setSavingQuiz(false);
    }
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
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center text-primary-900">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
          <p className="text-sm text-slate-600">Restoring session...</p>
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
      className="min-h-screen bg-gradient-hero flex flex-col text-primary-900"
    >
      <header className="glass-dark border-b border-primary-900/10 px-4 sm:px-6 py-3 sticky top-0 z-40 backdrop-blur-xl">
        <motion.div className="max-w-[1920px] mx-auto grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-5">
          <motion.div className="flex items-center gap-2 sm:gap-2.5 min-w-0" whileHover={{ x: -1 }}>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="p-2.5 hover:bg-white/75 rounded-xl transition-all border border-primary-900/10 hover:border-primary-500/30 shadow-sm"
              aria-label="Home"
            >
              <Home className="w-5 h-5" />
            </button>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate">
              <span className="text-gradient">Study</span>
              <span className="text-primary-900">Shield</span>
            </h1>
          </motion.div>

          <div className="flex justify-center min-w-0">
            <StudyTimer />
          </div>

          <div ref={workspaceMenuRef} className="relative flex justify-end">
            <motion.button
              type="button"
              whileHover={{ y: -1, scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setWorkspaceMenuOpen((open) => !open)}
              className="p-2.5 rounded-2xl glass border border-primary-900/10 hover:border-primary-500/35 hover:bg-white/75 transition-all shadow-sm"
              aria-label="Open workspace menu"
              aria-expanded={workspaceMenuOpen}
            >
              {workspaceMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.button>

            <AnimatePresence>
              {workspaceMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.96 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="absolute right-0 top-full mt-3 w-[min(18rem,calc(100vw-2rem))] glass-dark rounded-2xl border border-primary-900/10 shadow-glow-sm p-3 overflow-hidden"
                >
                  <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-white/55 border border-primary-900/10 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-gradient flex items-center justify-center text-sm font-bold text-white uppercase shrink-0">
                      {user.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wider text-slate-500">Signed in as</p>
                      <p className="font-semibold text-primary-900 truncate">{user.name}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {menuItems.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={item.onClick}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          item.danger
                            ? 'text-accent-700 hover:bg-accent-100/75'
                            : 'text-primary-900 hover:bg-white/70 hover:translate-x-0.5'
                        }`}
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
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
          className="text-center text-accent-700 text-sm px-4 py-2"
        >
          {searchError}
        </motion.p>
      )}

      <motion.div className="flex flex-1 flex-col lg:flex-row min-h-0 overflow-hidden">
        <aside
          className={`${focusMode ? 'hidden' : 'flex'} flex-col w-full lg:w-[380px] xl:w-[420px] glass-dark border-r border-primary-900/10 shrink-0`}
        >
          <div className="px-4 py-4 border-b border-primary-900/10">
            <SearchBar
              className="w-full"
              value={searchInput}
              onChange={setSearchInput}
              onSearch={runSearch}
              loading={loading}
            />
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
                  {!loadingMore && nextPageToken && (
                    <button
                      type="button"
                      onClick={loadMore}
                      disabled={loading || quotaExceeded}
                      className="px-4 py-2 rounded-full glass border border-primary-900/10 text-xs font-semibold text-primary-900 hover:border-primary-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Load More
                    </button>
                  )}
                  {!loadingMore && !nextPageToken && hasSearched && (
                    <p className="text-xs text-slate-500">You&apos;re all caught up</p>
                  )}
                </motion.div>
              </>
            ) : (
              <div className="text-center text-slate-500 py-12 px-4">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-28 h-28 mx-auto mb-5 rounded-[2rem] bg-white/70 border border-primary-900/10 cartoon-blob flex items-center justify-center"
                >
                  <Search className="w-12 h-12 text-primary-600" />
                </motion.div>
                <p className="font-semibold text-primary-900 mb-1">Search to load videos</p>
                <p className="text-sm text-slate-500">
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
              <div className="relative rounded-2xl overflow-hidden glass aspect-video border border-primary-900/10 shadow-glow">
                {(isBlurred || classifying) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 backdrop-blur-2xl bg-primary-900/55 z-10"
                  />
                )}

                {classifying && (
                  <motion.div className="absolute inset-0 z-[15] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-10 h-10 text-white animate-spin" />
                      <p className="text-sm text-white/80">Analyzing content...</p>
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
                className="mt-4 glass rounded-2xl p-5 border border-primary-900/10"
              >
                <h2 className="text-lg sm:text-xl font-semibold mb-1 text-primary-900">{selectedVideo.title}</h2>
                <p className="text-slate-500 text-sm">{selectedVideo.channelTitle}</p>
                {isSelectedEducational && !isBlurred && !classifying && (
                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleGenerateNotes}
                      disabled={generatingNotes}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient text-white rounded-full text-sm font-bold shadow-glow-sm disabled:opacity-70"
                    >
                      {generatingNotes ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                      {generatingNotes ? 'Generating Notes...' : 'Generate Notes'}
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleGenerateQuiz}
                      disabled={generatingQuiz}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 glass rounded-full text-sm font-bold border border-primary-900/10 text-primary-900 hover:border-primary-500/30 transition-colors disabled:opacity-70"
                    >
                      {generatingQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : <HelpCircle className="w-4 h-4" />}
                      {generatingQuiz ? 'Generating Quiz...' : 'Generate Quiz'}
                    </motion.button>
                    {notesStatus && <p className="text-sm text-primary-700">{notesStatus}</p>}
                    {quizStatus && <p className="text-sm text-primary-700">{quizStatus}</p>}
                  </div>
                )}
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
                className="relative w-32 h-32 bg-white/75 rounded-[2.25rem] flex items-center justify-center mx-auto mb-8 shadow-glow btn-glow cartoon-blob"
              >
                <div className="absolute -right-5 -top-3 h-12 w-12 rounded-2xl bg-accent-200 border border-primary-900/10" />
                <Play className="relative w-14 h-14 text-primary-800 fill-primary-800 ml-1" />
              </motion.div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-primary-900">Ready to Study?</h2>
              <p className="text-slate-600 max-w-sm mx-auto">
                Search for a topic, then pick a video — AI will keep only educational content playing.
              </p>
            </motion.div>
          )}
        </main>
      </motion.div>

      <AnimatePresence>
        {showNotesSuccess && generatedNotes && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-primary-900/45 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              className="glass-dark rounded-2xl p-6 sm:p-8 border border-primary-900/10 shadow-glow max-w-md w-full text-center"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center mb-4">
                <FileText className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-primary-900 mb-2">Notes generated successfully</h2>
              <p className="text-sm text-slate-600 mb-6">Preview and edit them before saving to your account.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotesSuccess(false);
                    setNotesPreviewOpen(true);
                  }}
                  className="px-6 py-3 bg-gradient text-white rounded-full font-bold shadow-glow-sm"
                >
                  Preview Notes
                </button>
                <button
                  type="button"
                  onClick={() => setShowNotesSuccess(false)}
                  className="px-6 py-3 glass rounded-full font-semibold border border-primary-900/10"
                >
                  Later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <NotesEditorModal
        isOpen={notesPreviewOpen}
        note={generatedNotes}
        saving={savingNotes}
        onClose={() => setNotesPreviewOpen(false)}
        onSave={handleSaveNotes}
      />

      <QuizModal
        isOpen={quizOpen}
        loading={generatingQuiz}
        questions={quizQuestions}
        userAnswers={quizAnswers}
        result={quizResult}
        saving={savingQuiz}
        saved={quizSaved}
        onAnswer={handleQuizAnswer}
        onSubmit={handleSubmitQuiz}
        onSave={handleSaveQuiz}
        onClose={() => setQuizOpen(false)}
      />
    </motion.div>
  );
};

export default StudyInterface;
