import React from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

const SearchBar = ({ value, onChange, onSearch, loading, className = '' }) => {
  const submit = (e) => {
    e.preventDefault();
    onSearch();
  };

  return (
  <form onSubmit={submit} className={`flex items-center gap-2 ${className}`}>
  <div className="relative flex-1 min-w-0">
    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500 pointer-events-none z-10" />

    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search educational videos..."
      autoComplete="off"
      className="input-modern w-full !pl-12 pr-4 py-2.5 rounded-full"
    />
  </div>

  <motion.button
    type="submit"
    disabled={loading}
    whileHover={{ scale: 1.04, y: -1 }}
    whileTap={{ scale: 0.96 }}
    className="shrink-0 flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient rounded-full text-sm font-semibold text-white shadow-glow-sm btn-glow disabled:opacity-60 disabled:cursor-not-allowed ripple"
  >
    <Search className="w-4 h-4" />
    <span className="hidden sm:inline">Search</span>
  </motion.button>
</form>
  );
};

export default SearchBar;
