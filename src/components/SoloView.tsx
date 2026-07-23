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
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto text-blue-400">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-3xl font-extrabold text-white">Solo Practice Complete!</h2>
            <p className="text-slate-400 text-xs mt-1">Self-Paced Mastery Assessment Report</p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto bg-slate-950 p-6 rounded-2xl border border-slate-800">
            <div>
              <span className="text-slate-400 text-xs font-semibold block">Score</span>
              <span className="text-2xl font-black text-amber-400 font-mono">{score} / {filteredQuestions.length}</span>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-semibold block">Accuracy</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">{accuracy}%</span>
            </div>
          </div>

          {/* Session breakdown */}
          <div className="text-left space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Detailed Results</h4>
            {filteredQuestions.map((q, idx) => {
              const ans = answers[q.id];
              return (
                <div key={q.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/50 last:border-0">
                  <span className="text-slate-300 font-medium truncate max-w-xs">
                    Q{idx + 1}. {q.question}
                  </span>
                  {ans?.isCorrect ? (
                    <span className="text-emerald-400 font-bold shrink-0">Correct ✅</span>
                  ) : (
                    <span className="text-red-400 font-bold shrink-0">Incorrect ❌</span>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={handleReset}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm inline-flex items-center gap-2 shadow-lg shadow-blue-600/20"
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
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-400" />
          <span className="font-bold text-white text-sm">Self-Paced Practice</span>
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedSession === sess.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {sess.label}
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
          <span>Question {currentIndex + 1} of {filteredQuestions.length}</span>
          <span>Score: {score}</span>
        </div>
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-blue-500 h-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / filteredQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Question Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <div>
          <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full text-xs font-bold">
            {currentQ.sessionTitle}
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed mt-3">
            {currentQ.question}
          </h2>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQ.options.map((opt, idx) => {
            const isAnswered = selectedOption !== null;
            const isSelected = selectedOption === idx;
            const isCorrect = idx === currentQ.correctAnswer;

            let btnStyle = 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700';

            if (isAnswered) {
              if (isCorrect) {
                btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-100 font-bold';
              } else if (isSelected) {
                btnStyle = 'bg-red-950/80 border-red-500 text-red-100 font-bold';
              } else {
                btnStyle = 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-50';
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleSelectOption(idx)}
                className={`w-full p-4 rounded-xl border text-left text-sm font-medium transition-all flex items-start justify-between gap-3 ${btnStyle}`}
              >
                <span>{opt}</span>
                {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Explanation Card */}
        {selectedOption !== null && (
          <div className="p-5 bg-blue-950/40 border border-blue-500/40 rounded-2xl space-y-2 animate-fade-in">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Explanation & Key Insight</span>
            </div>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              {currentQ.explanation}
            </p>
          </div>
        )}

        {/* Next Button */}
        {selectedOption !== null && (
          <div className="flex justify-end">
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30"
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
