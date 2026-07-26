import React, { useState } from 'react';
import { QUESTIONS } from '../data/questions';
import { soundEffects } from '../lib/audio';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Target, Sparkles, Award } from 'lucide-react';

export const SoloView: React.FC = () => {
  const [selectedSession, setSelectedSession] = useState<number | 'all'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<{ [qId: number]: { selected: number; isCorrect: boolean } }>({});
  const [isFinished, setIsFinished] = useState(false);

  const filteredQuestions = selectedSession === 'all'
    ? QUESTIONS
    : QUESTIONS.filter((q) => q.session === selectedSession);

  const currentQ = filteredQuestions[currentIndex] || filteredQuestions[0];

  const handleSelectOption = (idx: number) => {
    if (selectedOption !== null) return;

    const isCorrect = idx === currentQ.correctAnswer;
    setSelectedOption(idx);

    if (isCorrect) {
      soundEffects.playCorrect();
      setScore((prev) => prev + 1);
    } else {
      soundEffects.playIncorrect();
    }

    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: { selected: idx, isCorrect }
    }));
  };

  const handleNext = () => {
    soundEffects.playClick();
    if (currentIndex + 1 >= filteredQuestions.length) {
      setIsFinished(true);
      soundEffects.playFanfare();
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
    }
  };

  const handleReset = () => {
    soundEffects.playClick();
    setCurrentIndex(0);
    setSelectedOption(null);
    setScore(0);
    setAnswers({});
    setIsFinished(false);
  };

  // Render Finished Score Card
  if (isFinished) {
    const accuracy = Math.round((score / filteredQuestions.length) * 100);

    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white border-4 border-ink/10 rounded-[2rem] p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-sunny/20 border-2 border-sunny/40 rounded-2xl flex items-center justify-center mx-auto text-sunny-dark">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-3xl font-display font-extrabold text-ink">Practice Complete! 🎉</h2>
            <p className="text-ink-soft text-xs mt-1 font-semibold">Self-Paced Mastery Assessment Report</p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto bg-cream p-6 rounded-2xl border-2 border-ink/10">
            <div>
              <span className="text-ink-soft text-xs font-bold block">Score</span>
              <span className="text-2xl font-display font-extrabold text-sunny-dark">{score} / {filteredQuestions.length}</span>
            </div>
            <div>
              <span className="text-ink-soft text-xs font-bold block">Accuracy</span>
              <span className="text-2xl font-display font-extrabold text-grass-dark">{accuracy}%</span>
            </div>
          </div>

          {/* Session breakdown */}
          <div className="text-left space-y-2 bg-cream p-4 rounded-2xl border-2 border-ink/10">
            <h4 className="text-xs font-bold text-ink-soft uppercase tracking-wider mb-2">Detailed Results</h4>
            {filteredQuestions.map((q, idx) => {
              const ans = answers[q.id];
              return (
                <div key={q.id} className="flex items-center justify-between text-xs py-1.5 border-b border-ink/10 last:border-0">
                  <span className="text-ink font-semibold truncate max-w-xs">
                    Q{idx + 1}. {q.question}
                  </span>
                  {ans?.isCorrect ? (
                    <span className="text-grass-dark font-bold shrink-0">Correct ✅</span>
                  ) : (
                    <span className="text-coral-dark font-bold shrink-0">Incorrect ❌</span>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={handleReset}
            className="btn-pop px-6 py-3 bg-sky border-2 border-b-4 border-sky-dark hover:brightness-105 text-white font-bold rounded-2xl text-sm inline-flex items-center gap-2 shadow-md"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retake Practice</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Session Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border-4 border-ink/10 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-sky-dark" />
          <span className="font-display font-bold text-ink text-sm">Self-Paced Practice</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'all', label: 'All 20' },
            { id: 1, label: 'Session 1' },
            { id: 2, label: 'Session 2' },
            { id: 3, label: 'Session 3' }
          ].map((sess) => (
            <button
              key={sess.id}
              onClick={() => {
                soundEffects.playClick();
                setSelectedSession(sess.id as number | 'all');
                setCurrentIndex(0);
                setSelectedOption(null);
              }}
              className={`btn-pop px-3 py-1.5 rounded-xl text-xs font-bold border-2 border-b-4 transition-colors ${
                selectedSession === sess.id
                  ? 'bg-sky border-sky-dark text-white'
                  : 'bg-cream border-ink/10 text-ink-soft hover:text-ink'
              }`}
            >
              {sess.label}
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-ink-soft font-bold">
          <span>Question {currentIndex + 1} of {filteredQuestions.length}</span>
          <span>Score: {score}</span>
        </div>
        <div className="w-full bg-white border-2 border-ink/10 h-3 rounded-full overflow-hidden">
          <div
            className="bg-grass h-full transition-all duration-300 rounded-full"
            style={{ width: `${((currentIndex + 1) / filteredQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Question Box */}
      <div className="bg-white border-4 border-ink/10 rounded-[2rem] p-6 sm:p-8 shadow-xl space-y-6">
        <div>
          <span className="px-2.5 py-1 bg-sky/10 text-sky-dark border-2 border-sky/30 rounded-full text-xs font-bold">
            {currentQ.sessionTitle}
          </span>
          <h2 className="text-lg sm:text-xl font-display font-bold text-ink leading-relaxed mt-3">
            {currentQ.question}
          </h2>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQ.options.map((opt, idx) => {
            const isAnswered = selectedOption !== null;
            const isSelected = selectedOption === idx;
            const isCorrect = idx === currentQ.correctAnswer;

            let btnStyle = 'bg-cream border-ink/10 text-ink hover:border-sky/40';

            if (isAnswered) {
              if (isCorrect) {
                btnStyle = 'bg-grass/10 border-grass text-grass-dark font-bold';
              } else if (isSelected) {
                btnStyle = 'bg-coral/10 border-coral text-coral-dark font-bold';
              } else {
                btnStyle = 'bg-cream border-ink/10 text-ink-soft/50 opacity-60';
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleSelectOption(idx)}
                className={`w-full p-4 rounded-2xl border-2 text-left text-sm font-semibold transition-all flex items-start justify-between gap-3 ${btnStyle}`}
              >
                <span>{opt}</span>
                {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-grass-dark shrink-0" />}
                {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-coral-dark shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Explanation Card */}
        {selectedOption !== null && (
          <div className="p-5 bg-sky/10 border-2 border-sky/30 rounded-2xl space-y-2 animate-pop-in">
            <div className="flex items-center gap-2 text-sky-dark font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Explanation & Key Insight</span>
            </div>
            <p className="text-xs sm:text-sm text-ink leading-relaxed font-medium">
              {currentQ.explanation}
            </p>
          </div>
        )}

        {/* Next Button */}
        {selectedOption !== null && (
          <div className="flex justify-end">
            <button
              onClick={handleNext}
              className="btn-pop px-6 py-3 bg-sky border-2 border-b-4 border-sky-dark hover:brightness-105 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-md"
            >
              <span>{currentIndex + 1 >= filteredQuestions.length ? 'View Final Results' : 'Next Question'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
