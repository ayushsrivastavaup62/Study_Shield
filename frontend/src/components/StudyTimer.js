import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Play, Pause, RotateCcw, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const DURATION_KEY = 'studyshield-timer-duration';
const DEFAULT_DURATION = 25 * 60;
const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const PRESETS = [
  { label: '25 min', seconds: 25 * 60 },
  { label: '45 min', seconds: 45 * 60 },
  { label: '1 hour', seconds: 60 * 60 },
];

const formatTime = (seconds) => {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const readDuration = () => {
  const saved = localStorage.getItem(DURATION_KEY);
  const n = saved ? parseInt(saved, 10) : DEFAULT_DURATION;
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_DURATION;
};

const StudyTimer = ({ compact = false, onPresetChange }) => {
  const { user } = useAuth();
  const [duration, setDuration] = useState(readDuration);
  const [remaining, setRemaining] = useState(readDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const dropdownRef = useRef(null);
  const intervalRef = useRef(null);
  const completionLoggedRef = useRef(false);

  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const applyDuration = useCallback(
    (seconds) => {
      clearTimerInterval();
      completionLoggedRef.current = false;
      setIsRunning(false);
      setDuration(seconds);
      setRemaining(seconds);
      localStorage.setItem(DURATION_KEY, String(seconds));
      setResetKey((k) => k + 1);
      if (onPresetChange) onPresetChange(seconds);
    },
    [clearTimerInterval, onPresetChange]
  );

  const handleReset = useCallback(() => {
    clearTimerInterval();
    completionLoggedRef.current = false;
    setIsRunning(false);
    setRemaining(duration);
    setResetKey((k) => k + 1);
  }, [clearTimerInterval, duration]);

  const recordCompletedSession = useCallback(async () => {
    if (!user || completionLoggedRef.current) return;

    completionLoggedRef.current = true;
    const minutes = Math.max(1, Math.round(duration / 60));
    const focusScore = Math.min(100, 55 + Math.min(35, Math.floor(minutes / 5) * 5));

    try {
      await axios.post(`${API}/api/sessions`, {
        duration: minutes,
        videosWatched: [],
        focusScore,
      });
    } catch (error) {
      console.warn('[TIMER] Completed session analytics log skipped:', error.message);
    }
  }, [duration, user]);

  useEffect(() => {
    clearTimerInterval();

    if (!isRunning) return undefined;

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearTimerInterval();
          setIsRunning(false);
          recordCompletedSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimerInterval;
  }, [isRunning, clearTimerInterval, recordCompletedSession]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setShowCustom(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => () => clearTimerInterval(), [clearTimerInterval]);

  const applyPreset = (seconds) => {
    applyDuration(seconds);
    setDropdownOpen(false);
    setShowCustom(false);
  };

  const applyCustom = () => {
    const mins = parseInt(customMinutes, 10);
    if (mins > 0 && mins <= 180) {
      applyPreset(mins * 60);
      setCustomMinutes('');
    }
  };

  const progress = duration > 0 ? remaining / duration : 0;
  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference * (1 - progress);

  const ringSize = compact ? 40 : 44;

  return (
    <motion.div
      ref={dropdownRef}
      className={`relative flex items-center gap-2 glass rounded-full border border-primary-900/10 text-primary-900 ${compact ? 'px-3 py-1.5' : 'px-4 py-2'}`}
      whileHover={{ y: -1, boxShadow: '0 14px 32px rgba(42, 35, 92, 0.14)' }}
    >
      <motion.div
        key={resetKey}
        className="relative shrink-0"
        style={{ width: ringSize, height: ringSize }}
        initial={{ scale: 0.92, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        <svg
          className="absolute inset-0 -rotate-90"
          width={ringSize}
          height={ringSize}
          viewBox="0 0 44 44"
          aria-hidden
        >
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke="rgba(17,25,54,0.12)"
            strokeWidth="3"
          />
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke="url(#timerGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-[stroke-dashoffset] duration-300 ease-linear"
          />
          <defs>
            <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#f06b55" />
            </linearGradient>
          </defs>
        </svg>
        <Clock
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-600 ${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`}
        />
      </motion.div>

      <span className={`font-mono font-semibold tracking-wide tabular-nums ${compact ? 'text-sm' : 'text-lg'}`}>
        {formatTime(remaining)}
      </span>

      <button
        type="button"
        onClick={() => {
          if (remaining <= 0) {
            handleReset();
            completionLoggedRef.current = false;
          }
          setIsRunning((r) => !r);
        }}
        className="p-1.5 rounded-full hover:bg-primary-100 transition-colors ripple"
        aria-label={isRunning ? 'Pause timer' : 'Start timer'}
      >
        {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      </button>

      <button
        type="button"
        onClick={handleReset}
        className="p-1.5 rounded-full hover:bg-primary-100 transition-colors"
        aria-label="Reset timer"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-0.5 p-1.5 rounded-full hover:bg-primary-100 transition-colors border-l border-primary-900/10 pl-2 ml-0.5"
        aria-label="Timer presets"
      >
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-48 glass-dark rounded-2xl border border-primary-900/10 shadow-glow overflow-hidden z-50"
          >
            <motion.div className="p-2">
              <p className="text-xs text-slate-500 uppercase tracking-wider px-2 py-1">Presets</p>
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset.seconds)}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-white/70 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowCustom(!showCustom)}
                className="w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-white/70 transition-colors text-primary-700"
              >
                Custom timer
              </button>
              {showCustom && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="px-2 pb-2 flex gap-2"
                >
                  <input
                    type="number"
                    min="1"
                    max="180"
                    placeholder="Min"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    className="flex-1 bg-white/80 border border-primary-900/10 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-primary-500"
                  />
                  <button
                    type="button"
                    onClick={applyCustom}
                    className="px-3 py-1.5 bg-gradient rounded-lg text-xs font-semibold"
                  >
                    Set
                  </button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StudyTimer;
export { formatTime };
