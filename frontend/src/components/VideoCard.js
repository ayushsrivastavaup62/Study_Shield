import React from 'react';
import { motion } from 'framer-motion';
import { Play, GraduationCap } from 'lucide-react';

const VideoCard = ({ video, isSelected, onClick, index = 0 }) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`group cursor-pointer rounded-2xl overflow-hidden glass border transition-all duration-300 ${
        isSelected
          ? 'border-primary-500/60 shadow-glow ring-1 ring-primary-500/30'
          : 'border-primary-900/10 hover:border-primary-500/30 hover:shadow-glow-sm'
      }`}
    >
      <motion.div className="relative aspect-video overflow-hidden">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/75 via-transparent to-transparent opacity-50 group-hover:opacity-70 transition-opacity" />
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-white/90 text-primary-800 flex items-center gap-1 shadow-sm">
          <GraduationCap className="w-3 h-3" />
          Study
        </span>
        <motion.div
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          initial={false}
        >
          <motion.div className="w-12 h-12 rounded-full bg-white/85 backdrop-blur-md flex items-center justify-center border border-white shadow-sm">
            <Play className="w-5 h-5 text-primary-800 fill-primary-800 ml-0.5" />
          </motion.div>
        </motion.div>
      </motion.div>
      <motion.div className="p-3">
        <h3 className="font-semibold text-primary-900 text-sm line-clamp-2 group-hover:text-primary-600 transition-colors">
          {video.title}
        </h3>
        <p className="text-xs text-slate-500 mt-1 truncate">{video.channelTitle}</p>
      </motion.div>
    </motion.article>
  );
};

export const VideoCardSkeleton = () => (
  <motion.div className="rounded-2xl overflow-hidden glass border border-primary-900/10 animate-pulse">
    <div className="aspect-video skeleton-shimmer" />
    <motion.div className="p-3 space-y-2">
      <motion.div className="h-3 skeleton-shimmer rounded w-full" />
      <motion.div className="h-3 skeleton-shimmer rounded w-2/3" />
    </motion.div>
  </motion.div>
);

export default VideoCard;
