import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Sparkles } from 'lucide-react';

const motivationalQuotes = [
  'Stay focused. Your goals matter.',
  'Every minute counts toward your future.',
  "You're building discipline — keep going.",
  'Success is built one focused session at a time.',
  'Choose learning over distraction.',
];

const BlockedOverlay = ({ onDismiss }) => {
  const quote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex items-center justify-center bg-primary-900/55 backdrop-blur-2xl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        className="glass-dark rounded-3xl p-8 sm:p-10 max-w-md mx-4 text-center border border-accent-500/25 shadow-glow-red relative overflow-hidden"
      >
        <div className="absolute top-5 right-6 h-16 w-24 dot-field opacity-50" />
        <motion.div
          animate={{ scale: [1, 1.08, 1], rotate: [0, -5, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          className="relative w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-accent-300 to-accent-100 flex items-center justify-center border border-accent-500/25 cartoon-blob"
        >
          <ShieldAlert className="w-10 h-10 text-accent-700" />
        </motion.div>

        <h3 className="relative text-2xl sm:text-3xl font-bold mb-3 text-primary-900">
          This content is blocked during Study Time.
        </h3>

        <p className="relative text-slate-600 mb-4 text-sm leading-relaxed">
          StudyShield detected non-educational content. Stay on track with material that supports your goals.
        </p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="relative flex items-start gap-2 justify-center mb-8 p-4 rounded-2xl bg-white/65 border border-primary-500/15"
        >
          <Sparkles className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
          <p className="text-primary-700 text-sm font-medium italic">&ldquo;{quote}&rdquo;</p>
        </motion.div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={onDismiss}
          className="w-full sm:w-auto px-8 py-3.5 bg-gradient rounded-full font-semibold ripple"
        >
          Find Educational Content
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default BlockedOverlay;
