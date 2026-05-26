import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Shield,
  Brain,
  Clock,
  BarChart3,
  Target,
  Ban,
  Zap,
  Sparkles,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AuthModal from '../components/AuthModal';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login');

  useEffect(() => {
    if (location.state?.openAuth) {
      setAuthModalTab('login');
      setIsAuthModalOpen(true);
      // Clean up the location state so it doesn't pop up again unnecessarily
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleStudyClick = () => {
    if (user) {
      navigate('/study');
    } else {
      setAuthModalTab('register');
      setIsAuthModalOpen(true);
    }
  };

  const features = [
    {
      icon: Brain,
      title: 'AI Educational Filter',
      desc: 'Real-time AI classification keeps only educational content in your feed.',
      gradient: 'from-cyan-500/20 to-blue-500/10',
    },
    {
      icon: Target,
      title: 'Focus Mode',
      desc: 'Strip away distractions with a minimal, study-first interface.',
      gradient: 'from-violet-500/20 to-purple-500/10',
    },
    {
      icon: Ban,
      title: 'Smart Blocking',
      desc: 'Non-educational videos are instantly blurred and blocked during study time.',
      gradient: 'from-rose-500/20 to-red-500/10',
    },
    {
      icon: BarChart3,
      title: 'Study Analytics',
      desc: 'Track sessions, videos watched, and blocked content over time.',
      gradient: 'from-emerald-500/20 to-teal-500/10',
    },
    {
      icon: Clock,
      title: 'Productivity Timer',
      desc: 'Pomodoro-style presets — 25 min, 45 min, 1 hour, or custom.',
      gradient: 'from-amber-500/20 to-orange-500/10',
    },
  ];

  const stats = [
    { value: '10K+', label: 'Active Students' },
    { value: '500K+', label: 'Videos Filtered' },
    { value: '95%', label: 'Focus Boost' },
    { value: '4.9/5', label: 'User Rating' },
  ];

  const floatingOrbs = [
    { className: 'top-1/4 left-[10%] w-72 h-72 bg-primary-500/25', delay: 0 },
    { className: 'bottom-1/3 right-[8%] w-96 h-96 bg-accent-500/20', delay: 2 },
    { className: 'top-1/2 right-1/4 w-48 h-48 bg-pink-500/15', delay: 1 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-gradient-hero overflow-hidden"
    >
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {floatingOrbs.map((orb, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full blur-3xl animate-float ${orb.className}`}
            style={{ animationDelay: `${orb.delay}s` }}
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 6, repeat: Infinity, delay: orb.delay }}
          />
        ))}
        <motion.div className="absolute inset-0 opacity-50 pointer-events-none bg-white/[0.02]" />
      </div>

      <Navbar
        onGetStarted={handleStudyClick}
        onLoginClick={() => {
          setAuthModalTab('login');
          setIsAuthModalOpen(true);
        }}
      />

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-32 sm:pt-40 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full mb-8 border border-primary-500/20"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-gray-300">AI-Powered Study Sanctuary</span>
            <Sparkles className="w-3.5 h-3.5 text-primary-400" />
          </motion.div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
            <motion.span
              className="text-gradient block"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Master Your Focus.
            </motion.span>
            <motion.span
              className="text-white block mt-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Transform YouTube Into Study Mode.
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Block distractions. Filter with AI. Study with purpose. Your future self will thank you for every focused minute.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleStudyClick}
              className="group relative px-10 sm:px-14 py-4 sm:py-5 bg-gradient text-white rounded-full text-lg sm:text-xl font-bold btn-glow animate-pulse-glow ripple overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Time To Study
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </motion.button>
          </motion.div>

          {/* Floating decorative elements */}
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="hidden lg:block absolute top-40 left-8 glass rounded-2xl p-4 border border-white/10"
          >
            <BookOpen className="w-8 h-8 text-primary-400" />
          </motion.div>
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 6, repeat: Infinity, delay: 1 }}
            className="hidden lg:block absolute top-52 right-12 glass rounded-2xl p-4 border border-white/10"
          >
            <Shield className="w-8 h-8 text-accent-400" />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-20 sm:mt-28"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="glass rounded-2xl p-5 sm:p-6 border border-white/10 hover:border-primary-500/30 transition-all duration-300"
            >
              <motion.div className="text-2xl sm:text-3xl font-bold text-gradient mb-1">{stat.value}</motion.div>
              <div className="text-gray-500 text-xs sm:text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28 scroll-mt-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">Powerful Features</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Everything engineered for deep, distraction-free study sessions
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="gradient-border group relative rounded-2xl p-6 sm:p-8 hover:shadow-glow transition-all duration-500 cursor-default overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`} />
              <div className="relative">
                <motion.div
                  whileHover={{ rotate: 8, scale: 1.1 }}
                  className="w-14 h-14 rounded-2xl glass flex items-center justify-center mb-5 border border-white/10"
                >
                  <feature.icon className="w-7 h-7 text-primary-400" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20 scroll-mt-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass-dark rounded-3xl p-8 sm:p-14 text-center border border-white/10 shadow-glow relative overflow-hidden"
        >
          <motion.div
            className="absolute -top-24 -right-24 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <div className="relative">
            <Shield className="w-16 sm:w-20 h-16 sm:h-20 text-accent-400 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="text-gradient">About StudyShield</span>
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
              StudyShield is built for students who want YouTube without the rabbit holes. Our AI analyzes content in real time,
              blocking entertainment and keeping you locked on educational material that moves you toward your goals.
            </p>
            <motion.div
              className="flex flex-wrap justify-center gap-3"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              {['Gemini AI', 'OpenAI GPT', 'Real-time Analysis', 'Smart Filtering'].map((tag) => (
                <span
                  key={tag}
                  className="px-4 py-2 glass rounded-full text-sm border border-white/10 hover:border-primary-500/40 transition-colors"
                >
                  {tag}
                </span>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl sm:text-3xl font-bold mb-4">Ready to enter focus mode?</h3>
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleStudyClick}
            className="px-10 py-4 bg-gradient rounded-full font-bold btn-glow ripple"
          >
            Time To Study
          </motion.button>
        </motion.div>
      </section>

      <Footer />

      {/* Auth Modal Overlay */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authModalTab}
      />
    </motion.div>
  );
};

export default LandingPage;
