import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, BookOpen, BookOpenText, ChevronDown, HelpCircle, Home, LogOut, Menu, X } from 'lucide-react';
import StudyTimer from './StudyTimer';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ onGetStarted, onLoginClick, showTimer = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const accountRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);

      const sections = ['features', 'about', 'footer-contact'];
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollTo = (id) => {
    if (location.pathname !== '/') {
      navigate('/');
      setMobileOpen(false);
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
      return;
    }

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

  const goDashboard = () => {
    navigate('/dashboard');
    setMobileOpen(false);
    setAccountOpen(false);
  };

  const goHome = () => {
    navigate('/');
    setMobileOpen(false);
    setAccountOpen(false);
  };

  const goNotes = () => {
    navigate('/notes');
    setMobileOpen(false);
    setAccountOpen(false);
  };

  const goQuizzes = () => {
    navigate('/quizzes');
    setMobileOpen(false);
    setAccountOpen(false);
  };

  const navLinkClass = (section) =>
    `relative px-3 py-2 text-sm font-medium transition-colors ${
      activeSection === section ? 'text-primary-900' : 'text-slate-600 hover:text-primary-900'
    }`;

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 border-b transition-[background-color,box-shadow,backdrop-filter,border-color] duration-500 ease-out"
      style={{
        backgroundColor: scrolled ? 'rgba(232, 226, 250, 0.9)' : 'rgba(233, 229, 251, 0.72)',
        borderColor: scrolled ? 'rgba(17, 25, 54, 0.1)' : 'rgba(17, 25, 54, 0.05)',
        backdropFilter: scrolled ? 'blur(22px)' : 'blur(12px)',
        WebkitBackdropFilter: scrolled ? 'blur(22px)' : 'blur(12px)',
        boxShadow: scrolled ? '0 14px 36px rgba(42, 35, 92, 0.11)' : '0 0 0 rgba(42, 35, 92, 0)',
      }}
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
        animate={{ paddingTop: scrolled ? '0.8rem' : '1rem', paddingBottom: scrolled ? '0.8rem' : '1rem' }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
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

        <motion.div className="hidden lg:flex items-center gap-5">
          {user ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={goHome}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-primary-900 transition-colors"
              >
                <Home className="w-4 h-4" />
                Home
              </button>
              <button
                type="button"
                onClick={goDashboard}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-primary-900 transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </button>
              <button
                type="button"
                onClick={goNotes}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-primary-900 transition-colors"
              >
                <BookOpenText className="w-4 h-4" />
                My Notes
              </button>
              <button
                type="button"
                onClick={goQuizzes}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-primary-900 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                My Quizzes
              </button>
              <div ref={accountRef} className="relative">
                <motion.button
                  type="button"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setAccountOpen((open) => !open)}
                  className="flex items-center gap-2 px-3 py-1.5 glass rounded-full border border-primary-900/10 hover:border-primary-500/30 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient flex items-center justify-center text-xs font-bold text-white uppercase">
                    {user.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-primary-900 max-w-[110px] truncate">Profile</span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${accountOpen ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {accountOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 top-full mt-3 w-44 glass-dark rounded-2xl border border-primary-900/10 p-2 shadow-glow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setMobileOpen(false);
                          setAccountOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-accent-700 hover:bg-accent-100/80 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <>
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
              <button type="button" onClick={() => scrollTo('footer-contact')} className={navLinkClass('footer-contact')}>
                Contact Us
                {activeSection === 'footer-contact' && (
                  <motion.span layoutId="nav-indicator" className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient rounded-full" />
                )}
              </button>
              {showTimer && <StudyTimer compact />}
              <motion.button
                type="button"
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleLoginClick}
                className="px-5 py-2.5 bg-gradient text-white rounded-full text-sm font-semibold shadow-glow-sm ripple"
              >
                Login
              </motion.button>
            </>
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
          {user ? (
            <div className="space-y-2">
              <button type="button" onClick={goHome} className="flex w-full items-center gap-2 py-2 text-slate-700">
                <Home className="w-4 h-4" />
                Home
              </button>
              <button type="button" onClick={goDashboard} className="flex w-full items-center gap-2 py-2 text-slate-700">
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </button>
              <button type="button" onClick={goNotes} className="flex w-full items-center gap-2 py-2 text-slate-700">
                <BookOpenText className="w-4 h-4" />
                My Notes
              </button>
              <button type="button" onClick={goQuizzes} className="flex w-full items-center gap-2 py-2 text-slate-700">
                <HelpCircle className="w-4 h-4" />
                My Quizzes
              </button>
              <button
                type="button"
                onClick={() => setAccountOpen((open) => !open)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 glass rounded-2xl border border-primary-900/10"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span className="w-8 h-8 rounded-full bg-gradient flex items-center justify-center font-bold text-white uppercase shrink-0">
                    {user.name.charAt(0)}
                  </span>
                  <span className="font-semibold text-primary-900 truncate">Profile</span>
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${accountOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {accountOpen && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                      setAccountOpen(false);
                    }}
                    className="flex w-full items-center justify-center gap-2 py-3 bg-accent-100 text-accent-700 border border-accent-500/25 rounded-full font-semibold hover:bg-accent-200 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <button type="button" onClick={() => scrollTo('features')} className="block w-full text-left py-2 text-slate-700">
                Features
              </button>
              <button type="button" onClick={() => scrollTo('about')} className="block w-full text-left py-2 text-slate-700">
                About
              </button>
              <button type="button" onClick={() => scrollTo('footer-contact')} className="block w-full text-left py-2 text-slate-700">
                Contact Us
              </button>
              {showTimer && <StudyTimer compact />}
              <button type="button" onClick={handleLoginClick} className="w-full py-3 bg-gradient rounded-full font-semibold">
                Login
              </button>
            </>
          )}
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
