import React, { useState } from 'react';
import { QUESTIONS } from '../data/questions';
import { soundEffects } from '../lib/audio';
import { BookOpen, Layers, Sparkles, CheckCircle2, ChevronRight, RotateCw, Lightbulb } from 'lucide-react';

export const StudyGuideView: React.FC = () => {
  const [activeSession, setActiveSession] = useState<number>(1);
  const [flippedCardId, setFlippedCardId] = useState<number | null>(null);

  const sessionQuestions = QUESTIONS.filter((q) => q.session === activeSession);

  const sessionNotes = [
    {
      session: 1,
      title: "Session 1: GE Capabilities",
      bullets: [
        "Core Shift: Move employees from repetitive 'busy work' to high-value strategy and innovation.",
        "Work Smarter: Condenses hours of complex multi-document research into seconds.",
        "KKCL Case Study: Matches fashion trends with fabric inventory for rapid apparel design.",
        "Emami Case Study: Generates brand-specific avatar video content adhering to strict style guides.",
        "SRS Combined Cargo: Deployed a Logistics Intelligence Agent for shipment history & SOP lookup.",
        "AESG Case Study: Deployed a Sustainability & Compliance Agent for automated ESG auditing."
      ]
    },
    {
      session: 2,
      title: "Session 2: Google Cloud Fundamentals and Services",
      bullets: [
        "Evolution of Cloud: 3 waves — Collocation → Virtualized Data Centers → Container-Based Architecture.",
        "PaaS vs SaaS: PaaS manages hardware/platform for developer code; SaaS is turnkey managed software (e.g. Gemini Enterprise).",
        "Migration Pitch Strategy: Build CIO confidence by citing proven large-scale cross-cloud migration cases and certified support.",
        "Looker vs PowerBI: Looker offers a centralized governance semantic layer (LookML) and direct BigQuery/AI integration.",
        "IaaS Model: Provides raw compute (RAM, CPU, storage, networking) where customer manages OS & app.",
        "Replatforming Strategy: Lift-and-reshape by substituting managed services (e.g., Cloud SQL) without rewriting core app code."
      ]
    },
    {
      session: 3,
      title: "Session 3: Security, Fortinet, Commercial & Objections",
      bullets: [
        "Fortinet Positioning: Strategic, natively integrated partner on Google Cloud for hybrid multi-cloud protection.",
        "Defense in Depth: 6 native security layers (Hardware, Storage, Deployment, Internet Comm, Identity, Operational).",
        "Security Command Center (SCC): Unifies posture across compute, data, and identity into a single pane of glass.",
        "Marketplace Private Offers: Flow through standard customer POs without requiring new vendor security reviews.",
        "Security Posture (Category B): Developer visibility, application compliance, and regulatory audits.",
        "SecOps (Category C): Real-time threat detection, incident response, and global threat intelligence.",
        "IAM (Category C): Least privilege enforcement, user credentials management, and zero-trust access.",
        "Secure Infrastructure (Category A): Hardware roots of trust, memory encryption, and hardened compute nodes."
      ]
    }
  ];

  const currentNotes = sessionNotes.find((s) => s.session === activeSession);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center text-indigo-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-white">Google Cloud & Gemini Master Study Guide</h2>
            <p className="text-slate-400 text-xs mt-0.5">Key Takeaways, Case Study Highlights & Interactive Flashcards</p>
          </div>
        </div>

        {/* Session Tabs */}
        <div className="flex flex-wrap gap-2 mt-6">
          {sessionNotes.map((s) => (
            <button
              key={s.session}
              onClick={() => {
                soundEffects.playClick();
                setActiveSession(s.session);
                setFlippedCardId(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSession === s.session
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Session {s.session}
            </button>
          ))}
        </div>
      </div>

      {/* Key Notes Card */}
      {currentNotes && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Lightbulb className="w-5 h-5" />
            <span>{currentNotes.title} — Key Session Summary</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {currentNotes.bullets.map((b, idx) => (
              <div key={idx} className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl flex items-start gap-2 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Flashcards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <RotateCw className="w-4 h-4 text-blue-400" />
            <span>Interactive Flashcards ({sessionQuestions.length} Cards)</span>
          </h3>
          <span className="text-xs text-slate-500">Click any card to flip and reveal the correct answer!</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessionQuestions.map((q) => {
            const isFlipped = flippedCardId === q.id;

            return (
              <div
                key={q.id}
                onClick={() => {
                  soundEffects.playClick();
                  setFlippedCardId(isFlipped ? null : q.id);
                }}
                className="cursor-pointer group perspective hover:scale-[1.01] transition-transform"
              >
                <div
                  className={`p-6 rounded-2xl border transition-all duration-300 min-h-[220px] flex flex-col justify-between ${
                    isFlipped
                      ? 'bg-emerald-950/80 border-emerald-500/60 shadow-xl shadow-emerald-500/10'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-xl'
                  }`}
                >
                  {!isFlipped ? (
                    /* Front of card */
                    <>
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
                          <span>Question {q.id}</span>
                          <span className="text-blue-400 font-semibold group-hover:underline">Click to Flip 🔄</span>
                        </div>
                        <h4 className="text-sm font-bold text-white leading-relaxed">
                          {q.question}
                        </h4>
                      </div>
                      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                        <span>4 Options</span>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    </>
                  ) : (
                    /* Back of card */
                    <>
                      <div>
                        <div className="flex items-center justify-between text-xs text-emerald-400 font-bold mb-2">
                          <span>✅ Correct Answer</span>
                          <span className="text-slate-400 font-normal">Click to flip back</span>
                        </div>
                        <p className="text-sm font-extrabold text-emerald-100 mb-3">
                          {q.correctAnswerText}
                        </p>
                        <p className="text-xs text-emerald-200/90 leading-relaxed bg-emerald-900/30 p-3 rounded-xl border border-emerald-500/20">
                          💡 {q.explanation}
                        </p>
                      </div>
                      <div className="pt-2 text-right text-[10px] text-emerald-400 font-semibold">
                        Tap again to hide
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
