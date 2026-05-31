import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, HelpCircle, Loader2, RefreshCcw, Trash2, Trophy } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import QuizModal from '../components/QuizModal';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

const MyQuizzes = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/', { state: { openAuth: true } });
    }
  }, [authLoading, navigate, user]);

  const fetchQuizzes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API}/api/quizzes`);
      setQuizzes(response.data.quizzes || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load quizzes right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchQuizzes();
  }, [user]);

  const deleteQuiz = async (quizId) => {
    try {
      await axios.delete(`${API}/api/quizzes/${quizId}`);
      setQuizzes((prev) => prev.filter((quiz) => quiz._id !== quizId));
      if (selectedQuiz?._id === quizId) setSelectedQuiz(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete quiz attempt.');
    }
  };

  const openQuiz = async (quizId) => {
    try {
      const response = await axios.get(`${API}/api/quizzes/${quizId}`);
      setSelectedQuiz(response.data.quiz);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not open quiz result.');
    }
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center text-primary-900">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  const modalResult = selectedQuiz
    ? {
        score: selectedQuiz.score,
        totalQuestions: selectedQuiz.totalQuestions,
        percentage: selectedQuiz.percentage,
        review: (selectedQuiz.questions || []).map((question, index) => {
          const userAnswer = selectedQuiz.userAnswers?.[index] || '';
          return {
            ...question,
            userAnswer,
            isCorrect: userAnswer === question.correctAnswer,
          };
        }),
      }
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-hero text-primary-900"
    >
      <Navbar showTimer={false} />

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-32 sm:pt-36 pb-16">
        <motion.header initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full mb-5 border border-primary-500/20">
            <HelpCircle className="w-4 h-4 text-accent-500" />
            <span className="text-sm font-semibold text-primary-800">Saved quiz attempts</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-3">
            <span className="text-gradient">My Quizzes</span>
          </h1>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl">
            Review your scores, revisit explanations, and retake topics that need another pass.
          </p>
        </motion.header>

        {error && (
          <div className="mb-6 rounded-2xl border border-accent-500/20 bg-accent-100/70 px-4 py-3 text-sm text-accent-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="glass rounded-2xl p-8 border border-primary-900/10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : quizzes.length ? (
          <div className="grid gap-4">
            {quizzes.map((quiz) => (
              <article key={quiz._id} className="glass rounded-2xl p-5 border border-primary-900/10">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="w-4 h-4 text-primary-600" />
                      <span className="text-xs font-semibold text-slate-500">{formatDate(quiz.attemptedAt || quiz.createdAt)}</span>
                    </div>
                    <h2 className="text-lg font-bold text-primary-900 line-clamp-1">{quiz.videoTitle || 'Quiz Attempt'}</h2>
                    <p className="text-sm text-slate-500 line-clamp-1">{quiz.channelTitle || 'StudyShield Quiz'}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="px-4 py-2 rounded-2xl bg-white/70 border border-primary-900/10">
                      <p className="text-xs text-slate-500">Score</p>
                      <p className="font-bold text-primary-900">
                        {quiz.score}/{quiz.totalQuestions}
                      </p>
                    </div>
                    <div className="px-4 py-2 rounded-2xl bg-white/70 border border-primary-900/10">
                      <p className="text-xs text-slate-500">Percentage</p>
                      <p className="font-bold text-primary-900">{quiz.percentage}%</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openQuiz(quiz._id)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary-900/10 text-sm font-semibold hover:border-primary-500/30"
                    >
                      <Eye className="w-4 h-4" />
                      View Result
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/study')}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary-900/10 text-sm font-semibold hover:border-primary-500/30"
                    >
                      <RefreshCcw className="w-4 h-4" />
                      Retake Quiz
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteQuiz(quiz._id)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-100/70 border border-accent-500/25 text-sm font-semibold text-accent-700 hover:border-accent-600/70"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl p-8 sm:p-10 border border-primary-900/10 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-white/80 border border-primary-900/10 flex items-center justify-center mb-4 shadow-glow-sm">
              <HelpCircle className="w-8 h-8 text-primary-700" />
            </div>
            <h2 className="text-xl font-bold text-primary-900 mb-2">No quizzes saved yet.</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Generate a quiz from an educational video, submit it, and save the result here.
            </p>
          </div>
        )}
      </main>

      <QuizModal
        isOpen={Boolean(selectedQuiz)}
        questions={selectedQuiz?.questions || []}
        userAnswers={selectedQuiz?.userAnswers || []}
        result={modalResult}
        saved
        onClose={() => setSelectedQuiz(null)}
      />

      <Footer />
    </motion.div>
  );
};

export default MyQuizzes;
