import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Menu, X } from 'lucide-react';
import StudyTimer from './StudyTimer';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ onGetStarted, onLoginClick, showTimer = true }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24);

      const sections = ['features', 'about'];
      let current = '';
      sections.forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120 && rect.bottom >= 120) current = id;
        }
      });
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileOpen(false);
  };

  const handleLoginClick = () => {
    if (onLoginClick) {
      onLoginClick();
    } else if (onGetStarted) {
      onGetStarted();
    } else {
      navigate('/study');
    }
    setMobileOpen(false);
  };

  const navLinkClass = (section) =>
    `relative px-3 py-2 text-sm font-medium transition-colors ${
      activeSection === section ? 'text-primary-900' : 'text-slate-600 hover:text-primary-900'
    }`;

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'glass-dark shadow-lg border-b border-primary-900/10 backdrop-blur-xl'
          : 'bg-[#e9e5fb]/70 border-b border-primary-900/5 backdrop-blur-md'
      }`}
    >
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: scrolled ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        style={{
          background: 'linear-gradient(180deg, rgba(232,226,250,0.92) 0%, rgba(232,226,250,0) 100%)',
        }}
      />

      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-600/35 to-transparent"
        animate={{ opacity: scrolled ? 1 : 0 }}
      />

      <motion.div
        className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between relative"
        animate={{ paddingTop: scrolled ? '0.65rem' : undefined, paddingBottom: scrolled ? '0.65rem' : undefined }}
        transition={{ duration: 0.3 }}
      >
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2.5 group"
        >
          <motion.div
            className="relative p-2 rounded-xl bg-gradient shadow-glow-sm"
            whileHover={{ scale: 1.05, rotate: 3 }}
            whileTap={{ scale: 0.95 }}
          >
            <BookOpen className="w-5 h-5 text-white" />
            <div className="absolute inset-0 rounded-xl bg-accent-300/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
          <span className="text-xl sm:text-2xl font-bold tracking-tight">
            <span className="text-gradient">Study</span>
            <span className="text-primary-900">Shield</span>
          </span>
        </button>

        <motion.div
          className="hidden lg:flex items-center gap-2"
          animate={{ gap: scrolled ? '0.75rem' : '1.5rem' }}
          transition={{ duration: 0.3 }}
        >
          <button type="button" onClick={() => scrollTo('features')} className={navLinkClass('features')}>
            Features
            {activeSection === 'features' && (
              <motion.span layoutId="nav-indicator" className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient rounded-full" />
            )}
          </button>
          <button type="button" onClick={() => scrollTo('about')} className={navLinkClass('about')}>
            About
            {activeSection === 'about' && (
              <motion.span layoutId="nav-indicator" className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient rounded-full" />
            )}
          </button>
          {showTimer && <StudyTimer compact />}
          
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-full border border-primary-900/10">
                <div className="w-6 h-6 rounded-full bg-gradient flex items-center justify-center text-xs font-bold text-white uppercase">
                  {user.name.charAt(0)}
                </div>
                <span className="text-sm font-medium text-primary-900 max-w-[100px] truncate">{user.name}</span>
              </div>
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                }}
                className="px-4 py-2 border border-accent-500/25 hover:border-accent-600/70 bg-accent-100/70 text-accent-700 rounded-full text-sm font-medium transition-colors"
              >
                Logout
              </motion.button>
            </div>
          ) : (
            <motion.button
              type="button"
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleLoginClick}
              className="px-5 py-2.5 bg-gradient text-white rounded-full text-sm font-semibold shadow-glow-sm ripple"
            >
              Login
            </motion.button>
          )}
        </motion.div>

        <button
          type="button"
          className="lg:hidden p-2 rounded-lg text-primary-900 hover:bg-white/60"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </motion.div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="lg:hidden glass-dark border-t border-primary-900/10 px-4 py-4 space-y-3"
        >
          <button type="button" onClick={() => scrollTo('features')} className="block w-full text-left py-2 text-slate-700">
            Features
          </button>
          <button type="button" onClick={() => scrollTo('about')} className="block w-full text-left py-2 text-slate-700">
            About
          </button>
          {showTimer && <StudyTimer compact />}
          {user ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 px-4 py-3 glass rounded-2xl border border-primary-900/10">
                <div className="w-8 h-8 rounded-full bg-gradient flex items-center justify-center font-bold text-white uppercase">
                  {user.name.charAt(0)}
                </div>
                <span className="font-semibold text-primary-900 truncate">{user.name}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                }}
                className="w-full py-3 bg-accent-100 text-accent-700 border border-accent-500/25 rounded-full font-semibold hover:bg-accent-200 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <button type="button" onClick={handleLoginClick} className="w-full py-3 bg-gradient rounded-full font-semibold">
              Login
            </button>
          )}
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
