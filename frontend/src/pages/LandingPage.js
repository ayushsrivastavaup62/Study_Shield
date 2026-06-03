import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Shield,
  Brain,
  Clock,
  BarChart3,
  Target,
  FileText,
  HelpCircle,
  Zap,
  Sparkles,
  BookOpen,
  ArrowRight,
  Play,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AuthModal from '../components/AuthModal';
import { useAuth } from '../context/AuthContext';

const AnimatedStatCounter = ({ target, suffix = '', decimals = 0, format = true }) => {
  const ref = useRef(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node || hasStarted) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setHasStarted(true);
      },
      { threshold: 0.35 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return undefined;

    let frameId;
    const duration = 1600;
    const start = performance.now();

    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        setValue(target);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [hasStarted, target]);

  const roundedValue = decimals ? value.toFixed(decimals) : Math.round(value);
  const displayValue = format && !decimals ? Number(roundedValue).toLocaleString() : roundedValue;

  return <span ref={ref}>{displayValue}{suffix}</span>;
};

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
      gradient: 'from-primary-200/60 to-white/30',
    },
    {
      icon: Target,
      title: 'Focus Mode',
      desc: 'Strip away distractions with a minimal, study-first interface.',
      gradient: 'from-primary-100/70 to-white/30',
    },
    {
      icon: FileText,
      title: 'AI Notes Generator',
      desc: 'Generate structured study notes automatically from educational videos using AI-powered summarization and concept extraction.',
      gradient: 'from-accent-200/60 to-white/30',
    },
    {
      icon: HelpCircle,
      title: 'AI Quiz Generator',
      desc: 'Convert educational videos into interactive quizzes that test conceptual understanding, retention, and problem-solving ability.',
      gradient: 'from-[#e6f4ff]/80 to-white/30',
    },
    {
      icon: BarChart3,
      title: 'Study Analytics',
      desc: 'Track sessions, videos watched, and blocked content over time.',
      gradient: 'from-[#dff7ee]/70 to-white/30',
    },
    {
      icon: Clock,
      title: 'Productivity Timer',
      desc: 'Pomodoro-style presets — 25 min, 45 min, 1 hour, or custom.',
      gradient: 'from-[#fff0c8]/80 to-white/30',
    },
  ];

  const stats = [
    { target: 9476, suffix: '+', label: 'Active Students' },
    { target: 46156, suffix: '+', label: 'Videos Filtered' },
    { target: 95, suffix: '%', label: 'Focus Boost' },
    { target: 4.9, decimals: 1, format: false, label: 'User Rating' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-gradient-hero overflow-hidden text-primary-900"
    >
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-28 left-[7%] h-40 w-52 rotate-[-8deg] rounded-[2rem] bg-primary-200/35 blur-2xl" />
        <div className="absolute bottom-40 right-[8%] h-44 w-64 rotate-[10deg] rounded-[2rem] bg-accent-200/40 blur-2xl" />
        <div className="absolute right-[18%] top-48 h-40 w-40 dot-field opacity-45" />
      </div>

      <Navbar
        showTimer={false}
        onGetStarted={handleStudyClick}
        onLoginClick={() => {
          setAuthModalTab('login');
          setIsAuthModalOpen(true);
        }}
      />

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-32 sm:pt-40 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full mb-8 border border-primary-500/20"
          >
            <Zap className="w-4 h-4 text-accent-500" />
            <span className="text-sm font-semibold text-primary-800">AI-Powered Study Sanctuary</span>
            <Sparkles className="w-3.5 h-3.5 text-primary-500" />
          </motion.div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
            <motion.span
              className="text-primary-900 block"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Master Your Focus.
            </motion.span>
            <motion.span
              className="text-gradient block mt-1"
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
            className="text-lg sm:text-xl text-slate-600 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
          >
            Block distractions. Filter with AI. Study with purpose. Your future self will thank you for every focused minute.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
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

          </div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.8 }}
            className="relative min-h-[320px] sm:min-h-[410px]"
          >
            <div className="absolute inset-x-4 top-12 h-64 sm:h-80 dot-field opacity-60" />
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [-2, 2, -2] }}
              transition={{ duration: 5.8, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
              className="absolute right-[20%] top-[44%] z-10 w-36 sm:w-48 h-24 sm:h-32 rounded-[1.75rem] bg-white/80 backdrop-blur-xl border border-primary-900/10 shadow-glow-sm flex items-center justify-center rotate-[-3deg]"
              aria-hidden
            >
              <div className="absolute inset-3 rounded-[1.35rem] bg-accent-400/90 border border-accent-500/25" />
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/92 flex items-center justify-center shadow-glow-sm">
                <Play className="w-7 h-7 sm:w-8 sm:h-8 text-primary-900 fill-primary-900 ml-1" />
              </div>
            </motion.div>
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute left-[12%] top-[28%] w-28 sm:w-36 h-44 sm:h-56 bg-accent-400 rounded-[2rem] cartoon-blob rotate-[-12deg]"
            />
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
              className="absolute right-[12%] top-[18%] w-40 sm:w-56 h-52 sm:h-72 bg-white rounded-[2rem] cartoon-blob rotate-[8deg]"
            >
              <div className="absolute top-6 left-5 right-5 h-4 rounded-full bg-primary-100" />
              <div className="absolute top-14 left-5 right-10 h-3 rounded-full bg-primary-200" />
              <div className="absolute top-24 left-5 right-16 h-3 rounded-full bg-accent-200" />
              <div className="absolute bottom-7 left-6 right-6 h-16 rounded-2xl bg-primary-50 border border-primary-900/10" />
            </motion.div>
            <motion.div
              animate={{ y: [0, -8, 0], rotate: [-7, -3, -7] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute left-[22%] bottom-[16%] w-44 sm:w-56 rounded-[1.75rem] bg-primary-700 p-5 text-white cartoon-blob"
            >
              <BookOpen className="w-10 h-10 mb-5 text-accent-200" />
              <div className="h-3 w-28 rounded-full bg-white/80 mb-2" />
              <div className="h-3 w-20 rounded-full bg-white/45" />
            </motion.div>
            <motion.div
              animate={{ y: [0, 9, 0], rotate: [8, 12, 8] }}
              transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
              className="absolute right-[8%] bottom-[18%] w-24 sm:w-32 h-24 sm:h-32 rounded-[2rem] bg-[#ffd9cc] cartoon-blob flex items-center justify-center"
            >
              <Shield className="w-10 sm:w-12 h-10 sm:h-12 text-primary-800" />
            </motion.div>
          </motion.div>
          </div>

          {/* Floating decorative elements */}
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="hidden lg:block absolute top-40 left-8 glass rounded-2xl p-4 border border-primary-900/10"
          >
            <BookOpen className="w-8 h-8 text-primary-600" />
          </motion.div>
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 6, repeat: Infinity, delay: 1 }}
            className="hidden lg:block absolute top-52 right-12 glass rounded-2xl p-4 border border-primary-900/10"
          >
            <Shield className="w-8 h-8 text-accent-500" />
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
              className="glass rounded-2xl p-5 sm:p-6 border border-primary-900/10 hover:border-primary-500/30 transition-all duration-300"
            >
              <motion.div className="text-2xl sm:text-3xl font-bold text-gradient mb-1">
                <AnimatedStatCounter
                  target={stat.target}
                  suffix={stat.suffix}
                  decimals={stat.decimals}
                  format={stat.format}
                />
              </motion.div>
              <div className="text-slate-500 text-xs sm:text-sm">{stat.label}</div>
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
          <p className="text-slate-600 text-lg max-w-xl mx-auto">
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
                  className="w-14 h-14 rounded-2xl glass flex items-center justify-center mb-5 border border-primary-900/10"
                >
                  <feature.icon className="w-7 h-7 text-primary-600" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-2 text-primary-900">{feature.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{feature.desc}</p>
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
          className="glass-dark rounded-3xl p-8 sm:p-14 text-center border border-primary-900/10 shadow-glow relative overflow-hidden"
        >
          <motion.div
            className="absolute -top-20 -right-16 w-72 h-40 bg-accent-200/50 rounded-[3rem] blur-2xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <div className="relative">
            <Shield className="w-16 sm:w-20 h-16 sm:h-20 text-accent-500 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="text-gradient">About StudyShield</span>
            </h2>
            <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
              StudyShield is an AI-powered learning platform that helps students eliminate distractions by filtering
              non-educational content, generating study notes, creating quizzes, and tracking learning progress.
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
                  className="px-4 py-2 glass rounded-full text-sm text-primary-800 border border-primary-900/10 hover:border-primary-500/40 transition-colors"
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
          <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-primary-900">Ready to enter focus mode?</h3>
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleStudyClick}
            className="px-10 py-4 bg-gradient rounded-full font-bold text-white btn-glow ripple"
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
