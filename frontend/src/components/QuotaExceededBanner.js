import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

const QuotaExceededBanner = ({ fromMock, fromCache, onDismiss }) => (
  <motion.div
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    className="mx-4 mt-3 mb-1 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-md flex gap-3 items-start"
    role="alert"
  >
    <div className="p-2 rounded-xl bg-amber-500/20 shrink-0">
      <AlertTriangle className="w-5 h-5 text-amber-400" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-amber-200 text-sm sm:text-base">
        YouTube daily quota exceeded. Please try again later.
      </p>
      <p className="text-amber-200/70 text-xs sm:text-sm mt-1">
        {fromMock && 'Showing curated study videos while the API limit resets.'}
        {fromCache && !fromMock && 'Showing your last cached results to save quota.'}
        {!fromMock && !fromCache && 'New searches are paused until quota resets.'}
      </p>
    </div>
    {onDismiss && (
      <button
        type="button"
        onClick={onDismiss}
        className="text-amber-300/80 hover:text-white text-xs shrink-0"
      >
        Dismiss
      </button>
    )}
  </motion.div>
);

export default QuotaExceededBanner;
