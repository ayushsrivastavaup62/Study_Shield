import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AuthModal = ({ isOpen, onClose, initialTab = 'login' }) => {
  const [tab, setTab] = useState(initialTab); // 'login' | 'register'
  const { login, register, error: authError, setError } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setLocalError('');
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    // Validations
    if (!trimmedEmail || !password) {
      setLocalError('Please fill in all required fields.');
      return;
    }

    if (tab === 'register' && !trimmedName) {
      setLocalError('Please enter your name.');
      return;
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setLocalError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      let res;
      if (tab === 'login') {
        res = await login(trimmedEmail, password);
      } else {
        res = await register(trimmedName, trimmedEmail, password);
      }

      if (res.success) {
        onClose();
        // Reset fields
        setName('');
        setEmail('');
        setPassword('');
      } else {
        setLocalError(res.message);
      }
    } catch (err) {
      setLocalError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-primary-900/35 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md glass-dark rounded-3xl p-6 sm:p-8 border border-primary-900/10 shadow-glow overflow-hidden"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-20 -left-20 w-52 h-32 bg-primary-200/45 rounded-[2.5rem] blur-2xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-16 w-56 h-36 bg-accent-200/55 rounded-[2.5rem] blur-2xl pointer-events-none" />

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-500 hover:text-primary-900 hover:bg-white/70 transition-colors z-10"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header / Logo */}
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-2xl bg-gradient shadow-glow-sm mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">
                <span className="text-gradient">Study</span>
                <span className="text-primary-900">Shield</span>
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {tab === 'login' ? 'Welcome back! Ready to focus?' : 'Create an account to start studying.'}
              </p>
            </div>

            {/* Swappable Tabs */}
            <div className="flex bg-white/55 border border-primary-900/10 p-1 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => handleTabChange('login')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  tab === 'login'
                    ? 'bg-gradient text-white shadow-glow-sm'
                    : 'text-slate-500 hover:text-primary-900'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('register')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  tab === 'register'
                    ? 'bg-gradient text-white shadow-glow-sm'
                    : 'text-slate-500 hover:text-primary-900'
                }`}
              >
                Register
              </button>
            </div>

            {/* Error alerts */}
            {(localError || authError) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3.5 rounded-xl border border-accent-500/25 bg-accent-50/90 text-accent-700 text-sm font-medium leading-relaxed"
              >
                {localError || authError}
              </motion.div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === 'register' && (
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">
                    Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 h-5 w-5 text-primary-500" />
                    <input
                      id="name"
                      type="text"
                      placeholder="Your Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white/80 border border-primary-900/10 rounded-xl pl-12 pr-4 py-3.5 text-sm text-primary-900 placeholder-slate-400 focus:outline-none focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10 transition-all duration-300"
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 h-5 w-5 text-primary-500" />
                  <input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/80 border border-primary-900/10 rounded-xl pl-12 pr-4 py-3.5 text-sm text-primary-900 placeholder-slate-400 focus:outline-none focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10 transition-all duration-300"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 h-5 w-5 text-primary-500" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/80 border border-primary-900/10 rounded-xl pl-12 pr-12 py-3.5 text-sm text-primary-900 placeholder-slate-400 focus:outline-none focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10 transition-all duration-300"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 p-0.5 rounded-lg text-slate-500 hover:text-primary-900 hover:bg-white/60 transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                className="w-full py-4 sm:py-4.5 bg-gradient text-white rounded-xl text-base font-semibold shadow-glow-sm ripple flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{tab === 'login' ? 'Login' : 'Create Account'}</span>
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
