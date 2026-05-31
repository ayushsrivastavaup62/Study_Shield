import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Loader2, Save, X, XCircle } from 'lucide-react';

const optionLabel = (index) => String.fromCharCode(65 + index);

const QuizModal = ({
  isOpen,
  loading = false,
  questions = [],
  result = null,
  userAnswers = [],
  saving = false,
  saved = false,
  onAnswer,
  onSubmit,
  onSave,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentQuestion = questions[currentIndex];
  const answeredCount = useMemo(() => userAnswers.filter(Boolean).length, [userAnswers]);
  const progress = questions.length ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const currentAnswered = Boolean(userAnswers[currentIndex]);

  React.useEffect(() => {
    if (isOpen) setCurrentIndex(0);
  }, [isOpen, questions.length]);

  React.useEffect(() => {
    if (!isOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  React.useEffect(() => {
    if (questions.length && currentIndex > questions.length - 1) {
      setCurrentIndex(questions.length - 1);
    }
  }, [currentIndex, questions.length]);

  if (!isOpen) return null;

  const canSubmit = questions.length > 0 && answeredCount === questions.length;
  const review = result?.review || [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose?.();
        }}
        className="fixed inset-0 z-[75] bg-primary-900/50 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-hidden"
      >
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          onMouseDown={(event) => event.stopPropagation()}
          className="glass-dark rounded-2xl sm:rounded-[1.35rem] border border-primary-900/10 shadow-[0_30px_90px_rgba(24,31,74,0.28)] max-w-3xl w-full h-[min(90vh,760px)] max-h-[90vh] overflow-hidden flex flex-col"
        >
          <div className="shrink-0 sticky top-0 z-10 flex items-center justify-between gap-4 px-5 sm:px-6 py-4 border-b border-primary-900/10 bg-white/55 backdrop-blur-xl">
            <div>
              <h2 className="text-xl font-bold text-primary-900">{result ? 'Quiz Result' : 'AI Quiz'}</h2>
              {!loading && questions.length > 0 && (
                <p className="text-xs text-slate-500">
                  {result ? `${result.score}/${result.totalQuestions} correct` : `${answeredCount}/${questions.length} answered`}
                </p>
              )}
            </div>
            <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-white/70 transition-colors" aria-label="Close quiz">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            {loading ? (
            <div className="min-h-full p-10 sm:p-14 text-center flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 mx-auto text-primary-600 animate-spin mb-4" />
              <h3 className="text-2xl font-bold text-primary-900 mb-2">Generating Quiz...</h3>
              <p className="text-sm text-slate-600">Building topic-specific questions from the video context.</p>
            </div>
          ) : result ? (
            <div className="p-5 sm:p-6 space-y-5">
              <div className="rounded-2xl bg-white/70 border border-primary-900/10 p-5">
                <p className="text-sm font-medium text-slate-500 mb-1">Score</p>
                <p className="text-3xl font-extrabold text-primary-900">
                  {result.score}/{result.totalQuestions}
                </p>
                <p className="text-sm text-slate-600 mt-1">Percentage: {result.percentage}%</p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold text-primary-900">Questions Review</h3>
                {review.map((item, index) => (
                  <article key={`${item.question}-${index}`} className="rounded-2xl bg-white/65 border border-primary-900/10 p-4">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${item.isCorrect ? 'text-emerald-600' : 'text-accent-600'}`}>
                        {item.isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="text-xs font-semibold text-slate-500">Question {index + 1}</p>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 font-semibold">
                            {item.difficulty}
                          </span>
                        </div>
                        <h4 className="font-semibold text-primary-900">{item.question}</h4>
                        <p className="text-sm text-slate-600 mt-2">Your answer: {item.userAnswer || 'Not answered'}</p>
                        <p className="text-sm text-emerald-700 mt-1">Correct answer: {item.correctAnswer}</p>
                        {item.explanation && <p className="text-sm text-slate-600 mt-2">{item.explanation}</p>}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-5 sm:p-6 pb-8">
              <div className="h-2 rounded-full bg-white/70 overflow-hidden mb-6 shadow-inner">
                <div className="h-full bg-gradient transition-all" style={{ width: `${progress}%` }} />
              </div>

              {currentQuestion && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <p className="text-sm font-semibold text-slate-500">
                      Question {currentIndex + 1} of {questions.length}
                    </p>
                    <span className="text-xs px-3 py-1 rounded-full bg-primary-100 text-primary-700 font-semibold">
                      {currentQuestion.difficulty}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold leading-snug text-primary-900">{currentQuestion.question}</h3>

                  <div className="space-y-3.5">
                    {currentQuestion.options.map((option, index) => {
                      const selected = userAnswers[currentIndex] === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => onAnswer(currentIndex, option)}
                          className={`w-full text-left rounded-2xl border px-4 py-3.5 sm:p-4 transition-all shadow-sm ${
                            selected
                              ? 'border-primary-500/60 bg-primary-100/85 text-primary-900 shadow-glow-sm'
                              : 'border-primary-900/10 bg-white/70 hover:border-primary-500/30 hover:bg-white/85 text-slate-700'
                          }`}
                        >
                          <span className="inline-flex items-start gap-3">
                            <span className="font-bold text-primary-800 shrink-0">{optionLabel(index)}.</span>
                            <span>{option}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          </div>

          {!loading && (
            <div className="shrink-0 sticky bottom-0 z-10 px-5 sm:px-6 py-4 border-t border-primary-900/10 bg-white/60 backdrop-blur-xl">
              {result ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-xs text-slate-500 text-center sm:text-left">Review explanations before saving your attempt.</p>
              <button
                type="button"
                onClick={onSave}
                disabled={saving || saved || !onSave}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient text-white rounded-full font-bold shadow-glow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saved ? 'Saved' : saving ? 'Saving...' : 'Save Result'}
              </button>
              </div>
              ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
                  disabled={currentIndex === 0}
                  className="w-full sm:w-auto px-5 py-3 glass rounded-full font-semibold border border-primary-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <p className="text-xs text-slate-500 text-center sm:text-right self-center">
                    {answeredCount}/{questions.length} answered
                  </p>
                  {currentIndex < questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))}
                      disabled={!currentAnswered}
                      className="w-full sm:w-auto px-6 py-3 bg-gradient text-white rounded-full font-bold shadow-glow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onSubmit}
                      disabled={!canSubmit}
                      className="w-full sm:w-auto px-6 py-3 bg-gradient text-white rounded-full font-bold shadow-glow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit Quiz
                    </button>
                  )}
                </div>
              </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuizModal;
