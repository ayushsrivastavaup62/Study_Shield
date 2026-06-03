import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Activity,
  Ban,
  BarChart3,
  CalendarDays,
  Clock,
  Flame,
  GraduationCap,
  HelpCircle,
  Loader2,
  Medal,
  PlayCircle,
  ShieldCheck,
  Trophy,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const CATEGORY_LABELS = {
  27: 'Education',
  28: 'Science & Technology',
  26: 'How-to & Style',
  25: 'News & Politics',
  24: 'General Study',
};

const CHART_COLORS = ['#3340a6', '#f06b55', '#38bdf8', '#22c55e', '#f59e0b', '#8b5cf6'];

const formatMinutes = (minutes = 0) => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
};

const shortDate = (value) =>
  new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

const fullDate = (value) =>
  new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const categoryName = (category) => CATEGORY_LABELS[category] || category || 'General Study';

const todayKey = () => new Date().toISOString().slice(0, 10);

const activityTone = (score = 0) => {
  if (score >= 6) return 'bg-emerald-700 border-emerald-800 shadow-emerald-700/20';
  if (score >= 3) return 'bg-emerald-400 border-emerald-500 shadow-emerald-400/20';
  if (score >= 1) return 'bg-emerald-200 border-emerald-300 shadow-emerald-200/30';
  return 'bg-white/70 border-primary-900/10';
};

const SkeletonCard = () => (
  <div className="glass rounded-2xl p-5 border border-primary-900/10 animate-pulse">
    <div className="h-10 w-10 rounded-xl skeleton-shimmer mb-5" />
    <div className="h-4 w-24 rounded skeleton-shimmer mb-3" />
    <div className="h-7 w-20 rounded skeleton-shimmer" />
  </div>
);

const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass rounded-2xl p-8 sm:p-10 border border-primary-900/10 text-center"
  >
    <div className="w-16 h-16 mx-auto rounded-2xl bg-white/80 border border-primary-900/10 flex items-center justify-center mb-4 shadow-glow-sm">
      <BarChart3 className="w-8 h-8 text-primary-700" />
    </div>
    <h2 className="text-xl font-bold text-primary-900 mb-2">Start studying to build your analytics.</h2>
    <p className="text-sm text-slate-600 max-w-md mx-auto">
      Watch educational videos, block distractions, or complete a timer session to see your dashboard come alive.
    </p>
  </motion.div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [summary, setSummary] = useState(null);
  const [weekly, setWeekly] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recent, setRecent] = useState([]);
  const [activityDays, setActivityDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/', { state: { openAuth: true } });
    }
  }, [authLoading, navigate, user]);

  useEffect(() => {
    if (!user) return;

    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const [summaryRes, weeklyRes, categoriesRes, recentRes] = await Promise.all([
          axios.get(`${API}/api/analytics/summary`),
          axios.get(`${API}/api/analytics/weekly`),
          axios.get(`${API}/api/analytics/categories`),
          axios.get(`${API}/api/analytics/recent`),
        ]);

        setSummary(summaryRes.data.summary || {});
        setWeekly(weeklyRes.data.weekly || []);
        setCategories(categoriesRes.data.categories || []);
        setRecent(recentRes.data.recent || []);

        try {
          const activityRes = await axios.get(`${API}/api/analytics/activity-calendar?days=84`);
          const nextActivityDays = activityRes.data.activity || [];
          setActivityDays(nextActivityDays);
        } catch (activityErr) {
          setActivityDays([]);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Analytics could not be loaded right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user]);

  const chartData = useMemo(
    () =>
      weekly.map((day) => ({
        ...day,
        label: shortDate(day.date),
      })),
    [weekly]
  );

  const categoryData = useMemo(
    () =>
      categories.map((item) => ({
        ...item,
        category: categoryName(item.category),
      })),
    [categories]
  );

  const selectedActivity = useMemo(
    () => activityDays.find((day) => day.date === selectedDate) || null,
    [activityDays, selectedDate]
  );

  const selectedHasActivity = selectedActivity && selectedActivity.activityScore > 0;

  const hasData =
    summary &&
    (summary.totalStudyTime > 0 ||
      summary.totalWatchedVideos > 0 ||
      summary.totalBlockedVideos > 0 ||
      summary.totalQuizzesAttempted > 0 ||
      summary.currentStreak > 0 ||
      recent.length > 0);

  const stats = summary
    ? [
        {
          label: 'Study Time',
          value: formatMinutes(summary.totalStudyTime),
          icon: Clock,
          tone: 'text-primary-700 bg-primary-100/80',
        },
        {
          label: 'Videos Watched',
          value: summary.totalWatchedVideos,
          icon: GraduationCap,
          tone: 'text-sky-700 bg-sky-100/80',
        },
        {
          label: 'Blocked Attempts',
          value: summary.totalBlockedVideos,
          icon: Ban,
          tone: 'text-accent-700 bg-accent-100/80',
        },
        {
          label: 'Focus Score',
          value: `${summary.focusScore}/100`,
          icon: ShieldCheck,
          tone: 'text-emerald-700 bg-emerald-100/80',
        },
        {
          label: 'Current Streak',
          value: `${summary.currentStreak}d`,
          icon: Flame,
          tone: 'text-orange-700 bg-orange-100/80',
        },
        {
          label: 'Longest Streak',
          value: `${summary.longestStreak}d`,
          icon: Trophy,
          tone: 'text-amber-700 bg-amber-100/80',
        },
        {
          label: 'Quizzes Attempted',
          value: summary.totalQuizzesAttempted || 0,
          icon: HelpCircle,
          tone: 'text-violet-700 bg-violet-100/80',
        },
        {
          label: 'Average Quiz Score',
          value: `${summary.averageQuizScore || 0}%`,
          icon: BarChart3,
          tone: 'text-cyan-700 bg-cyan-100/80',
        },
        {
          label: 'Best Quiz Score',
          value: `${summary.bestQuizScore || 0}%`,
          icon: Medal,
          tone: 'text-rose-700 bg-rose-100/80',
        },
        {
          label: 'Latest Quiz Result',
          value: summary.latestQuizResult
            ? `${summary.latestQuizResult.score}/${summary.latestQuizResult.totalQuestions}`
            : 'None',
          icon: Trophy,
          tone: 'text-lime-700 bg-lime-100/80',
        },
      ]
    : [];

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center text-primary-900">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-hero text-primary-900"
    >
      <Navbar showTimer={false} />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-32 sm:pt-36 pb-16">
        <motion.header
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 sm:mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full mb-5 border border-primary-500/20">
            <Activity className="w-4 h-4 text-accent-500" />
            <span className="text-sm font-semibold text-primary-800">Personal study insights</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-3">
            <span className="text-gradient">Your Study Analytics</span>
          </h1>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl">
            {user?.name ? `${user.name}, ` : ''}
            every focused session adds up. Keep showing up and let your dashboard track the momentum.
          </p>
        </motion.header>

        {error && (
          <div className="mb-6 rounded-2xl border border-accent-500/20 bg-accent-100/70 px-4 py-3 text-sm text-accent-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <SkeletonCard key={item} />
            ))}
          </div>
        ) : !hasData ? (
          <EmptyState />
        ) : (
          <div className="space-y-6 sm:space-y-8">
            <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {stats.map((stat, index) => (
                <motion.article
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="glass rounded-2xl p-5 border border-primary-900/10"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${stat.tone}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-primary-900">{stat.value}</p>
                </motion.article>
              ))}
            </section>

            <section className="glass rounded-2xl p-5 sm:p-6 border border-primary-900/10">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <div>
                      <h2 className="text-xl font-bold text-primary-900">Activity Calendar</h2>
                      <p className="text-sm text-slate-500">Daily study activity over the last 12 weeks</p>
                    </div>
                    <CalendarDays className="w-5 h-5 text-primary-600 shrink-0" />
                  </div>

                  <div className="overflow-x-auto pb-2">
                    <div className="grid grid-flow-col grid-rows-7 auto-cols-[0.9rem] sm:auto-cols-[1rem] gap-1.5 min-w-max">
                      {activityDays.map((day) => {
                        const tooltip = `${fullDate(day.date)}\nActivity: ${day.activityScore}\nWatched videos: ${day.watchedVideos}\nNotes generated: ${day.notesGenerated}\nQuizzes attempted: ${day.quizzesAttempted}`;
                        const isSelected = day.date === selectedDate;

                        return (
                          <button
                            key={day.date}
                            type="button"
                            title={tooltip}
                            aria-label={`${fullDate(day.date)} activity score ${day.activityScore}`}
                            onClick={() => setSelectedDate(day.date)}
                            className={`h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-[4px] border transition-all duration-200 hover:scale-125 hover:ring-2 hover:ring-primary-300/70 hover:z-10 shadow-sm ${activityTone(day.activityScore)} ${
                              isSelected ? 'ring-2 ring-primary-700 ring-offset-2 ring-offset-white/70' : ''
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>Less</span>
                    {[0, 1, 3, 6].map((score) => (
                      <span key={score} className={`h-3.5 w-3.5 rounded-[4px] border ${activityTone(score)}`} />
                    ))}
                    <span>More</span>
                  </div>
                </div>

                <aside className="w-full lg:w-80 rounded-2xl bg-white/60 border border-primary-900/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                    Selected Date
                  </p>
                  <h3 className="text-lg font-bold text-primary-900 mb-4">
                    {selectedActivity ? fullDate(selectedActivity.date) : fullDate(selectedDate)}
                  </h3>

                  {selectedHasActivity ? (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate-500">Study time</p>
                        <p className="font-bold text-primary-900">{formatMinutes(selectedActivity.studyMinutes || 0)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Videos watched</p>
                        <p className="font-bold text-primary-900">{selectedActivity.watchedVideos || 0}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Blocked attempts</p>
                        <p className="font-bold text-primary-900">{selectedActivity.blockedVideos || 0}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Notes generated</p>
                        <p className="font-bold text-primary-900">{selectedActivity.notesGenerated || 0}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Quizzes attempted</p>
                        <p className="font-bold text-primary-900">{selectedActivity.quizzesAttempted || 0}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Average quiz score</p>
                        <p className="font-bold text-primary-900">
                          {selectedActivity.averageQuizScore === null ? 'N/A' : `${selectedActivity.averageQuizScore}%`}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No activity found for this date.</p>
                  )}
                </aside>
              </div>
            </section>

            <section className="grid lg:grid-cols-[1.45fr_0.9fr] gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-5 sm:p-6 border border-primary-900/10"
              >
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-primary-900">Weekly Activity</h2>
                    <p className="text-sm text-slate-500">Last 7 days of study momentum</p>
                  </div>
                  <CalendarDays className="w-5 h-5 text-primary-600" />
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(17,25,54,0.1)" />
                      <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '14px',
                          border: '1px solid rgba(17,25,54,0.12)',
                          boxShadow: '0 18px 45px rgba(51,42,110,0.12)',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="studyMinutes" name="Study min" fill="#3340a6" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="watchedVideos" name="Watched" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="blockedVideos" name="Blocked" fill="#f06b55" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-5 sm:p-6 border border-primary-900/10"
              >
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-primary-900">Category Breakdown</h2>
                    <p className="text-sm text-slate-500">Subjects you studied most</p>
                  </div>
                  <BarChart3 className="w-5 h-5 text-primary-600" />
                </div>
                {categoryData.length ? (
                  <>
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={categoryData} dataKey="watchCount" nameKey="category" innerRadius={48} outerRadius={78}>
                            {categoryData.map((entry, index) => (
                              <Cell key={entry.category} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-3">
                      {categoryData.slice(0, 5).map((item, index) => (
                        <div key={item.category} className="flex items-center justify-between gap-3 text-sm">
                          <span className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                            />
                            <span className="truncate text-primary-900 font-medium">{item.category}</span>
                          </span>
                          <span className="text-slate-500 shrink-0">{item.watchCount} watched</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">No subject data yet.</p>
                )}
              </motion.div>
            </section>

            <section className="glass rounded-2xl p-5 sm:p-6 border border-primary-900/10">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-xl font-bold text-primary-900">Recent Activity</h2>
                  <p className="text-sm text-slate-500">Latest watched videos, blocked attempts, and sessions</p>
                </div>
                <Activity className="w-5 h-5 text-primary-600" />
              </div>

              {recent.length ? (
                <div className="grid md:grid-cols-2 gap-3">
                  {recent.map((item) => {
                    const Icon = item.type === 'blocked' ? Ban : item.type === 'session' ? Clock : PlayCircle;
                    return (
                      <article key={`${item.type}-${item.id}`} className="flex items-start gap-3 rounded-xl bg-white/60 border border-primary-900/10 p-4">
                        <div className="w-10 h-10 rounded-xl bg-primary-100/80 text-primary-700 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-primary-900 line-clamp-1">{item.title}</h3>
                          <p className="text-xs text-slate-500 mt-1">
                            {item.type === 'session' && `${formatMinutes(item.duration)} session`}
                            {item.type === 'blocked' && (item.reason || 'Blocked distraction')}
                            {item.type === 'watched' && categoryName(item.category)}
                            {' - '}
                            {shortDate(item.timestamp)}
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No recent activity yet.</p>
              )}
            </section>
          </div>
        )}
      </main>

      <Footer />
    </motion.div>
  );
};

export default Dashboard;
