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
      <div className="bg-white border-4 border-ink/10 rounded-[2rem] p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-grape/15 border-2 border-grape/30 rounded-2xl flex items-center justify-center text-grape-dark">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-extrabold text-ink">Google Cloud & Gemini Master Study Guide</h2>
            <p className="text-ink-soft text-xs mt-0.5 font-semibold">Key Takeaways, Case Study Highlights & Interactive Flashcards</p>
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
              className={`btn-pop px-4 py-2 rounded-2xl text-xs font-bold border-2 border-b-4 transition-all ${
                activeSession === s.session
                  ? 'bg-sky border-sky-dark text-white shadow-md'
                  : 'bg-cream border-ink/10 text-ink-soft hover:text-ink'
              }`}
            >
              Session {s.session}
            </button>
          ))}
        </div>
      </div>

      {/* Key Notes Card */}
      {currentNotes && (
        <div className="bg-white border-4 border-ink/10 rounded-[2rem] p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-sunny-dark font-bold text-sm">
            <Lightbulb className="w-5 h-5" />
            <span>{currentNotes.title} — Key Session Summary</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {currentNotes.bullets.map((b, idx) => (
              <div key={idx} className="p-3 bg-cream border-2 border-ink/10 rounded-2xl flex items-start gap-2 text-xs text-ink font-medium">
                <CheckCircle2 className="w-4 h-4 text-grass-dark shrink-0 mt-0.5" />
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Flashcards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-display font-bold text-ink uppercase tracking-wider flex items-center gap-2">
            <RotateCw className="w-4 h-4 text-sky-dark" />
            <span>Interactive Flashcards ({sessionQuestions.length} Cards)</span>
          </h3>
          <span className="text-xs text-ink-soft font-semibold">Click any card to flip and reveal the correct answer!</span>
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
                className="cursor-pointer group hover:scale-[1.01] transition-transform"
              >
                <div
                  className={`p-6 rounded-[1.75rem] border-4 transition-all duration-300 min-h-[220px] flex flex-col justify-between shadow-md ${
                    isFlipped
                      ? 'bg-grass/10 border-grass'
                      : 'bg-white border-ink/10 hover:border-sky/30'
                  }`}
                >
                  {!isFlipped ? (
                    /* Front of card */
                    <>
                      <div>
                        <div className="flex items-center justify-between text-xs text-ink-soft font-bold mb-2">
                          <span>Question {q.id}</span>
                          <span className="text-sky-dark font-bold group-hover:underline">Click to Flip 🔄</span>
                        </div>
                        <h4 className="text-sm font-display font-bold text-ink leading-relaxed">
                          {q.question}
                        </h4>
                      </div>
                      <div className="pt-4 border-t-2 border-ink/10 flex items-center justify-between text-xs text-ink-soft font-semibold">
                        <span>4 Options</span>
                        <ChevronRight className="w-4 h-4 text-ink-soft/60" />
                      </div>
                    </>
                  ) : (
                    /* Back of card */
                    <>
                      <div>
                        <div className="flex items-center justify-between text-xs text-grass-dark font-bold mb-2">
                          <span>✅ Correct Answer</span>
                          <span className="text-ink-soft font-normal">Click to flip back</span>
                        </div>
                        <p className="text-sm font-extrabold text-grass-dark mb-3">
                          {q.correctAnswerText}
                        </p>
                        <p className="text-xs text-ink leading-relaxed bg-white p-3 rounded-2xl border-2 border-grass/20 font-medium">
                          💡 {q.explanation}
                        </p>
                      </div>
                      <div className="pt-2 text-right text-[10px] text-grass-dark font-bold">
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
