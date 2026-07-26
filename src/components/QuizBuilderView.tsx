import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Question, ViewMode } from '../types';
import { PRESET_QUIZZES } from '../data/presetQuizzes';
import { soundEffects } from '../lib/audio';
import { type User, getDisplayName } from '../lib/supabase';
import { generateQuizFromText } from '../lib/aiQuizGen';
import {
  StoredQuiz,
  Collaborator,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  listMyQuizzes,
  listCollaborators,
  shareQuizWithEmail,
  removeCollaborator,
  seedPresetQuizzes
} from '../lib/quizzes';
import { createRoom, generateRoomCode, saveActiveHostRoomCode } from '../lib/rooms';
import { AuthModal } from './AuthModal';
import {
  Plus, Trash2, Edit3, CheckCircle, Sparkles, Tv, Copy, Upload,
  Layers, ArrowRight, ShieldCheck, Database, LogIn, Users2, Cloud,
  RefreshCw, Mail, X, Wand2, FileText, FileUp, Loader2, PartyPopper
} from 'lucide-react';
import byteeitLogo from '../assets/images/byteeit_logo_1784809227570.jpg';

interface QuizBuilderViewProps {
  setMode: (mode: ViewMode) => void;
  currentUser: User | null;
}

export const QuizBuilderView: React.FC<QuizBuilderViewProps> = ({ setMode, currentUser }) => {
  const [myQuizzes, setMyQuizzes] = useState<{ owned: StoredQuiz[]; shared: StoredQuiz[] }>({
    owned: [],
    shared: []
  });
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Quiz Editor State
  const [loadedQuizId, setLoadedQuizId] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESET_QUIZZES[0].id);
  const [quizTitle, setQuizTitle] = useState<string>(PRESET_QUIZZES[0].title);
  const [quizCategory, setQuizCategory] = useState<string>(PRESET_QUIZZES[0].category);
  const [hostName, setHostName] = useState<string>('');
  const [customRoomPin, setCustomRoomPin] = useState<string>(generateRoomCode());

  const [questions, setQuestions] = useState<Question[]>(PRESET_QUIZZES[0].questions);
  const [editingQuestionIdx, setEditingQuestionIdx] = useState<number | null>(null);

  // Form state for creating/editing a question
  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState<string[]>(['', '', '', '']);
  const [qCorrect, setQCorrect] = useState<number>(0);
  const [qTimeLimit, setQTimeLimit] = useState<number>(30);
  const [qExplanation, setQExplanation] = useState('');

  const [jsonInput, setJsonInput] = useState('');
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  // AI Quiz Generator (paste text or upload a PDF, Gemini fills in the questions)
  const [sourceText, setSourceText] = useState('');
  const [pdfFileName, setPdfFileName] = useState('');
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [aiNumQuestions, setAiNumQuestions] = useState(10);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [generationSuccess, setGenerationSuccess] = useState('');
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const questionsListRef = useRef<HTMLDivElement>(null);

  // Sharing
  const [showShareModal, setShowShareModal] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [shareEmail, setShareEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState('');

  useEffect(() => {
    if (currentUser) {
      setHostName((prev) => prev || getDisplayName(currentUser));
      loadCloudQuizzes();
    } else {
      setMyQuizzes({ owned: [], shared: [] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const loadCloudQuizzes = async () => {
    if (!currentUser) return;
    setIsLoadingCloud(true);
    try {
      const result = await listMyQuizzes(currentUser);
      setMyQuizzes(result);
    } catch (err) {
      console.error('Failed to load cloud quizzes:', err);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  // Select a built-in preset
  const handleSelectPreset = (presetId: string) => {
    soundEffects.playClick();
    const found = PRESET_QUIZZES.find((p) => p.id === presetId);
    if (!found) return;
    setSelectedPresetId(presetId);
    setLoadedQuizId(null);
    setQuizTitle(found.title);
    setQuizCategory(found.category);
    setQuestions([...found.questions]);
  };

  // Select a quiz saved in the cloud (owned or shared-with-me)
  const handleSelectCloudQuiz = (quiz: StoredQuiz) => {
    soundEffects.playClick();
    setSelectedPresetId('');
    setLoadedQuizId(quiz.id);
    setQuizTitle(quiz.title);
    setQuizCategory(quiz.category);
    setQuestions([...quiz.questions]);
    setShowShareModal(false);
  };

  // Save Quiz to Supabase (create new, or update the loaded one)
  const handleSaveToCloud = async () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    if (questions.length === 0) {
      alert('Add at least 1 question before saving!');
      return;
    }

    setIsSavingCloud(true);
    try {
      if (loadedQuizId) {
        await updateQuiz(loadedQuizId, { title: quizTitle, category: quizCategory, questions });
      } else {
        const created = await createQuiz(currentUser, quizTitle, '', quizCategory, questions);
        setLoadedQuizId(created.id);
      }
      soundEffects.playClick();
      await loadCloudQuizzes();
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
    } finally {
      setIsSavingCloud(false);
    }
  };

  const handleDeleteCloudQuiz = async (quizId: string) => {
    if (!confirm('Delete this quiz permanently? This cannot be undone.')) return;
    try {
      await deleteQuiz(quizId);
      if (loadedQuizId === quizId) setLoadedQuizId(null);
      soundEffects.playClick();
      await loadCloudQuizzes();
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const handleSeedPresetsToCloud = async () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    setIsSavingCloud(true);
    try {
      const count = await seedPresetQuizzes(currentUser, PRESET_QUIZZES);
      soundEffects.playClick();
      alert(`Saved ${count} preset quizzes to your account!`);
      await loadCloudQuizzes();
    } catch (err: any) {
      alert(`Failed to save presets: ${err.message}`);
    } finally {
      setIsSavingCloud(false);
    }
  };

  // Sharing (full co-editor access by email)
  const openShareModal = async () => {
    if (!loadedQuizId) {
      alert('Save this quiz to the cloud first -- then you can share it.');
      return;
    }
    setShareError('');
    setShareEmail('');
    setShowShareModal(true);
    try {
      setCollaborators(await listCollaborators(loadedQuizId));
    } catch (err: any) {
      setShareError(err.message || 'Failed to load collaborators');
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loadedQuizId || !currentUser) return;
    setIsSharing(true);
    setShareError('');
    try {
      await shareQuizWithEmail(loadedQuizId, shareEmail, currentUser.id);
      setShareEmail('');
      setCollaborators(await listCollaborators(loadedQuizId));
      soundEffects.playClick();
    } catch (err: any) {
      setShareError(err.message || 'Failed to share quiz');
    } finally {
      setIsSharing(false);
    }
  };

  const handleRemoveCollaborator = async (id: string) => {
    try {
      await removeCollaborator(id);
      setCollaborators((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(`Failed to remove access: ${err.message}`);
    }
  };

  // Generate random room code
  const handleGeneratePin = () => {
    soundEffects.playClick();
    setCustomRoomPin(generateRoomCode());
  };

  // Add or Save Question
  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim() || qOptions.some((opt) => !opt.trim())) {
      alert('Please fill out the question text and all 4 options!');
      return;
    }

    soundEffects.playClick();

    const formattedQuestion: Question = {
      id: editingQuestionIdx !== null ? questions[editingQuestionIdx].id : Date.now(),
      question: qText.trim(),
      options: qOptions.map((opt, i) => {
        const prefixes = ['A) ', 'B) ', 'C) ', 'D) '];
        const prefix = prefixes[i];
        const clean = opt.replace(/^[A-D]\)\s*/i, '');
        return `${prefix}${clean}`;
      }),
      correctAnswer: qCorrect,
      correctAnswerText: `${['A', 'B', 'C', 'D'][qCorrect]}) ${qOptions[qCorrect].replace(/^[A-D]\)\s*/i, '')}`,
      explanation: qExplanation.trim() || 'No explanation provided.',
      timeLimit: qTimeLimit
    };

    if (editingQuestionIdx !== null) {
      const updated = [...questions];
      updated[editingQuestionIdx] = formattedQuestion;
      setQuestions(updated);
      setEditingQuestionIdx(null);
    } else {
      setQuestions([...questions, formattedQuestion]);
    }

    setQText('');
    setQOptions(['', '', '', '']);
    setQCorrect(0);
    setQExplanation('');
  };

  const handleEditClick = (idx: number) => {
    soundEffects.playClick();
    const q = questions[idx];
    setEditingQuestionIdx(idx);
    setQText(q.question);
    setQOptions(q.options.map((opt) => opt.replace(/^[A-D]\)\s*/i, '')));
    setQCorrect(q.correctAnswer);
    setQTimeLimit(q.timeLimit || 30);
    setQExplanation(q.explanation || '');
  };

  const handleDeleteClick = (idx: number) => {
    soundEffects.playClick();
    if (questions.length <= 1) {
      alert('A quiz must have at least 1 question!');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  // Launch Host Mode with the current quiz
  const handleLaunchQuiz = async () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    if (questions.length === 0) {
      alert('Please add at least 1 question before launching!');
      return;
    }

    soundEffects.playClick();
    setIsLaunching(true);
    try {
      const room = await createRoom({
        user: currentUser,
        hostName: hostName || getDisplayName(currentUser),
        quizTitle: quizTitle || 'Custom Quiz Room',
        questions,
        quizId: loadedQuizId || undefined,
        roomCode: customRoomPin
      });
      saveActiveHostRoomCode(room.roomCode);
      setMode('host');
    } catch (err: any) {
      alert(`Failed to launch room: ${err.message}`);
    } finally {
      setIsLaunching(false);
    }
  };

  // Handle a PDF upload: extract its text into the source textarea for review/editing
  const handlePdfUpload = async (file: File) => {
    setGenerationError('');
    setGenerationSuccess('');
    setPdfFileName(file.name);
    setIsExtractingPdf(true);
    try {
      const { extractPdfText } = await import('../lib/pdfUtils');
      const extracted = await extractPdfText(file);
      if (!extracted || extracted.length < 20) {
        setGenerationError('Could not find readable text in that PDF. Try a different file or paste the content instead.');
        return;
      }
      setSourceText(extracted);
      soundEffects.playClick();
    } catch (err: any) {
      setGenerationError(err.message || 'Failed to read that PDF file.');
    } finally {
      setIsExtractingPdf(false);
    }
  };

  // Ask Gemini to turn the pasted / extracted source text into a ready-to-review quiz
  const handleGenerateQuiz = async () => {
    if (sourceText.trim().length < 40) {
      setGenerationError('Paste a bit more content (a few sentences) so the AI has enough to work with.');
      return;
    }

    soundEffects.playClick();
    setGenerationError('');
    setGenerationSuccess('');
    setIsGeneratingQuiz(true);
    try {
      const result = await generateQuizFromText(sourceText, aiNumQuestions);
      setQuestions(result.questions);
      setQuizTitle(result.suggestedTitle || quizTitle);
      setQuizCategory(result.suggestedCategory || quizCategory);
      setLoadedQuizId(null);
      setSelectedPresetId('');
      setEditingQuestionIdx(null);
      soundEffects.playFanfare();
      setGenerationSuccess(`Generated ${result.questions.length} questions! Review them below, edit anything that needs a tweak, then Save or Launch.`);
      questionsListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err: any) {
      setGenerationError(err.message || 'Quiz generation failed. Please try again.');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // Import JSON Questions
  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setQuestions(parsed);
        setLoadedQuizId(null);
        setShowJsonModal(false);
        soundEffects.playClick();
        alert(`Successfully imported ${parsed.length} custom questions!`);
      } else {
        alert('Invalid JSON format. Expected an array of question objects.');
      }
    } catch (err) {
      alert('Failed to parse JSON. Please check formatting.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-pop-in">
      {/* Header Banner */}
      <div className="bg-white border-4 border-ink/10 rounded-[2rem] p-6 sm:p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-grape/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4">
          <img
            src={byteeitLogo}
            alt="ByteeIT Logo"
            referrerPolicy="no-referrer"
            className="h-11 sm:h-14 w-auto max-w-full rounded-2xl object-contain border-4 border-sky/30 shadow-md shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-grape/15 border-2 border-grape/30 text-grape-dark text-[11px] font-bold rounded-full uppercase tracking-wider">
                Universal Quiz Studio
              </span>
              <span className="text-xs text-grass-dark font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> ByteeIT Platform
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-ink mt-1">
              Create & Host Any Quiz 🛠️
            </h2>
            <p className="text-ink-soft text-xs sm:text-sm mt-1 font-medium">
              Design custom questions, save them to your account, share with teammates by email, and host live games.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {!currentUser && (
            <button
              onClick={() => setShowAuthModal(true)}
              className="btn-pop w-full sm:w-auto shrink-0 px-4 py-2.5 bg-sky border-2 border-b-4 border-sky-dark hover:brightness-105 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 whitespace-nowrap shadow-md"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Sign Up</span>
            </button>
          )}

          <button
            onClick={handleLaunchQuiz}
            disabled={isLaunching}
            className="btn-pop w-full sm:w-auto px-6 py-3 bg-grass border-2 border-b-4 border-grass-dark hover:brightness-105 disabled:opacity-50 text-white font-display font-extrabold rounded-2xl shadow-md flex items-center justify-center gap-2 text-sm shrink-0"
          >
            <Tv className="w-5 h-5" />
            <span>{isLaunching ? 'Launching…' : 'Launch & Host Live Room'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* AI Quiz Generator: paste text or upload a PDF, Gemini writes the quiz for you */}
      <div className="bg-white border-4 border-grape/30 rounded-[2rem] p-6 sm:p-8 shadow-xl space-y-5 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-grape/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-grape/15 border-2 border-grape/30 rounded-2xl flex items-center justify-center text-grape-dark shrink-0">
            <Wand2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-display font-extrabold text-ink">✨ Instant Quiz Builder</h3>
            <p className="text-ink-soft text-xs sm:text-sm font-medium">
              Paste your notes or upload a PDF -- AI writes the questions, you just review and go!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold text-ink-soft uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Paste content, or upload a PDF below
              </label>
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePdfUpload(file);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => pdfInputRef.current?.click()}
                disabled={isExtractingPdf}
                className="btn-pop px-3 py-1.5 bg-white hover:bg-cream text-grape-dark border-2 border-b-4 border-grape/30 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
              >
                {isExtractingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileUp className="w-3.5 h-3.5" />}
                <span>{isExtractingPdf ? 'Reading PDF…' : pdfFileName ? `📄 ${pdfFileName}` : 'Upload PDF'}</span>
              </button>
            </div>
            <textarea
              rows={6}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Paste your notes, article, slide text, or training material here... (or upload a PDF and we'll drop the text in for you)"
              className="w-full px-4 py-3 bg-cream border-2 border-ink/10 rounded-2xl text-ink text-sm focus:outline-none focus:border-grape font-medium resize-y"
            />
          </div>

          <div className="flex flex-col gap-2 lg:w-48">
            <label className="text-xs font-bold text-ink-soft uppercase tracking-wider"># of Questions</label>
            <select
              value={aiNumQuestions}
              onChange={(e) => setAiNumQuestions(Number(e.target.value))}
              className="px-3 py-2.5 bg-cream border-2 border-ink/10 rounded-2xl text-sm text-ink font-bold focus:outline-none"
            >
              {[5, 10, 15, 20].map((n) => (
                <option key={n} value={n}>{n} Questions</option>
              ))}
            </select>

            <button
              onClick={handleGenerateQuiz}
              disabled={isGeneratingQuiz || isExtractingPdf}
              className="btn-pop mt-auto px-4 py-3.5 bg-grape border-2 border-b-4 border-grape-dark hover:brightness-105 disabled:opacity-50 text-white font-display font-extrabold rounded-2xl shadow-md flex items-center justify-center gap-2 text-sm"
            >
              {isGeneratingQuiz ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Thinking…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Quiz</span>
                </>
              )}
            </button>
          </div>
        </div>

        {generationError && (
          <div className="p-3 bg-coral/10 border-2 border-coral/40 text-coral-dark rounded-2xl text-xs font-bold">
            {generationError}
          </div>
        )}
        {generationSuccess && (
          <div className="p-3 bg-grass/10 border-2 border-grass/40 text-grass-dark rounded-2xl text-xs font-bold flex items-center gap-2">
            <PartyPopper className="w-4 h-4 shrink-0" />
            <span>{generationSuccess}</span>
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Room & Host Config + Presets */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border-4 border-ink/10 rounded-[2rem] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b-2 border-ink/10 pb-3">
              <h3 className="text-sm font-display font-bold text-ink uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sunny-dark" />
                1. Host & Room Configuration
              </h3>
              <div className="flex items-center gap-1.5">
                {loadedQuizId && currentUser && (
                  <button
                    onClick={openShareModal}
                    className="btn-pop px-3 py-1 bg-white hover:bg-cream text-ink-soft border-2 border-b-4 border-ink/15 text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm"
                  >
                    <Users2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>
                )}
                <button
                  onClick={handleSaveToCloud}
                  disabled={isSavingCloud}
                  className="btn-pop px-3 py-1 bg-sky border-2 border-b-4 border-sky-dark hover:brightness-105 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm disabled:opacity-50"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>{isSavingCloud ? 'Saving...' : loadedQuizId ? 'Update Quiz' : 'Save Quiz'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-ink-soft block mb-1">Quiz Title</label>
                <input
                  type="text"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="e.g. ByteeIT Tech Sprint Trivia 2026"
                  className="w-full px-3.5 py-2.5 bg-cream border-2 border-ink/10 rounded-2xl text-ink font-bold text-sm focus:outline-none focus:border-sky"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-ink-soft block mb-1">Host Name / Brand</label>
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  placeholder="e.g. Nawab Khan"
                  className="w-full px-3.5 py-2.5 bg-cream border-2 border-ink/10 rounded-2xl text-sky-dark font-bold text-sm focus:outline-none focus:border-sky"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-ink-soft block mb-1">Custom Game PIN / Room Code</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customRoomPin}
                    onChange={(e) => setCustomRoomPin(e.target.value.toUpperCase())}
                    maxLength={10}
                    className="w-full px-3.5 py-2.5 bg-cream border-2 border-ink/10 rounded-2xl text-sunny-dark font-display font-extrabold text-center text-base tracking-widest focus:outline-none focus:border-sunny"
                  />
                  <button
                    onClick={handleGeneratePin}
                    className="btn-pop px-3 py-2.5 bg-white hover:bg-cream text-ink-soft text-xs font-bold rounded-2xl border-2 border-b-4 border-ink/15 shrink-0"
                  >
                    Random PIN
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Preset Quiz Selector & Cloud Quizzes */}
          <div className="bg-white border-4 border-ink/10 rounded-[2rem] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b-2 border-ink/10 pb-3">
              <h3 className="text-sm font-display font-bold text-ink uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-dark" />
                2. Choose a Quiz
              </h3>
              <button
                onClick={() => setShowJsonModal(true)}
                className="text-xs text-sky-dark font-bold hover:underline flex items-center gap-1"
              >
                <Upload className="w-3.5 h-3.5" /> Import
              </button>
            </div>

            {currentUser && (
              <div className="space-y-2 border-b-2 border-ink/10 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-grass-dark flex items-center gap-1">
                    <Cloud className="w-3.5 h-3.5" /> My Quizzes ({myQuizzes.owned.length})
                  </span>
                  <button
                    onClick={loadCloudQuizzes}
                    className="text-[11px] text-ink-soft hover:text-ink flex items-center gap-1 font-semibold"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingCloud ? 'animate-spin' : ''}`} /> Refresh
                  </button>
                </div>

                {myQuizzes.owned.length === 0 ? (
                  <p className="text-xs text-ink-soft/70 italic">No saved quizzes yet. Click "Save Quiz" above to store one!</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {myQuizzes.owned.map((cq) => (
                      <div
                        key={cq.id}
                        className={`p-3 rounded-2xl border-2 flex items-center justify-between gap-2 transition-all ${
                          loadedQuizId === cq.id
                            ? 'bg-grass/10 border-grass text-ink'
                            : 'bg-cream border-ink/10 text-ink-soft'
                        }`}
                      >
                        <button onClick={() => handleSelectCloudQuiz(cq)} className="text-left min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-[10px] text-grass-dark font-bold">
                            <span>{cq.category}</span>
                            <span>•</span>
                            <span>{cq.questions.length} Qs</span>
                          </div>
                          <h4 className="font-bold text-xs text-ink truncate">{cq.title}</h4>
                        </button>
                        <button
                          onClick={() => handleDeleteCloudQuiz(cq.id)}
                          className="p-1 hover:bg-coral/10 rounded text-ink-soft hover:text-coral-dark"
                          title="Delete Quiz"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {myQuizzes.shared.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-sky-dark flex items-center gap-1">
                      <Users2 className="w-3.5 h-3.5" /> Shared With Me ({myQuizzes.shared.length})
                    </span>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {myQuizzes.shared.map((cq) => (
                        <button
                          key={cq.id}
                          onClick={() => handleSelectCloudQuiz(cq)}
                          className={`w-full p-3 rounded-2xl border-2 text-left transition-all ${
                            loadedQuizId === cq.id
                              ? 'bg-sky/10 border-sky text-ink'
                              : 'bg-cream border-ink/10 text-ink-soft'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 text-[10px] text-sky-dark font-bold">
                            <span>{cq.category}</span>
                            <span>•</span>
                            <span>{cq.questions.length} Qs</span>
                            <span>• Editor access</span>
                          </div>
                          <h4 className="font-bold text-xs text-ink truncate">{cq.title}</h4>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Built-in Presets */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink-soft block uppercase tracking-wider">Built-In Presets</span>
                {currentUser && (
                  <button
                    onClick={handleSeedPresetsToCloud}
                    disabled={isSavingCloud}
                    className="px-2.5 py-1 bg-sunny/15 hover:bg-sunny/25 text-sunny-dark border-2 border-sunny/30 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm disabled:opacity-50"
                    title="Save all preset quizzes into your account"
                  >
                    <Cloud className="w-3 h-3" />
                    <span>Save All to My Account</span>
                  </button>
                )}
              </div>
              {PRESET_QUIZZES.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`w-full p-3 rounded-2xl border-2 text-left transition-all ${
                      isSelected
                        ? 'bg-sky/10 border-sky text-ink shadow-sm'
                        : 'bg-cream border-ink/10 text-ink-soft hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-sky-dark uppercase tracking-wider">{preset.category}</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-white text-ink-soft border border-ink/10">
                        {preset.questions.length} Questions
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-ink mt-1">{preset.title}</h4>
                    <p className="text-xs text-ink-soft line-clamp-1 mt-0.5">{preset.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Question Editor & List */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border-4 border-ink/10 rounded-[2rem] p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b-2 border-ink/10 pb-3">
              <h3 className="text-sm font-display font-bold text-ink uppercase tracking-wider flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-grass-dark" />
                {editingQuestionIdx !== null ? `Edit Question #${editingQuestionIdx + 1}` : 'Add New Question'}
              </h3>
              {editingQuestionIdx !== null && (
                <button
                  onClick={() => {
                    setEditingQuestionIdx(null);
                    setQText('');
                    setQOptions(['', '', '', '']);
                  }}
                  className="text-xs text-ink-soft hover:text-ink font-semibold"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-ink-soft block mb-1">Question Text</label>
                <textarea
                  rows={2}
                  required
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="Enter your question text here..."
                  className="w-full px-3.5 py-2.5 bg-cream border-2 border-ink/10 rounded-2xl text-ink text-sm focus:outline-none focus:border-grass font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {['A', 'B', 'C', 'D'].map((letter, idx) => {
                  const colors = [
                    'border-coral/40 text-coral-dark',
                    'border-sky/40 text-sky-dark',
                    'border-sunny/40 text-sunny-dark',
                    'border-grass/40 text-grass-dark'
                  ];
                  return (
                    <div key={letter} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className={`text-xs font-bold ${colors[idx]}`}>Option {letter}</label>
                        <button
                          type="button"
                          onClick={() => setQCorrect(idx)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border-2 transition-colors ${
                            qCorrect === idx
                              ? 'bg-grass border-grass-dark text-white'
                              : 'bg-white border-ink/10 text-ink-soft hover:text-ink'
                          }`}
                        >
                          {qCorrect === idx ? '✓ Correct Answer' : 'Mark Correct'}
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={qOptions[idx]}
                        onChange={(e) => {
                          const updated = [...qOptions];
                          updated[idx] = e.target.value;
                          setQOptions(updated);
                        }}
                        placeholder={`Option ${letter} answer text`}
                        className={`w-full px-3 py-2 bg-cream border-2 rounded-xl text-xs text-ink focus:outline-none font-medium ${
                          qCorrect === idx ? 'border-grass ring-1 ring-grass/40' : 'border-ink/10'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-ink-soft block mb-1">Time Limit (Seconds)</label>
                  <select
                    value={qTimeLimit}
                    onChange={(e) => setQTimeLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-cream border-2 border-ink/10 rounded-xl text-xs text-ink font-bold focus:outline-none"
                  >
                    <option value={10}>10 Seconds (Fast)</option>
                    <option value={20}>20 Seconds</option>
                    <option value={30}>30 Seconds (Default)</option>
                    <option value={45}>45 Seconds</option>
                    <option value={60}>60 Seconds (Complex)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-ink-soft block mb-1">Explanation (Shown after answer)</label>
                  <input
                    type="text"
                    value={qExplanation}
                    onChange={(e) => setQExplanation(e.target.value)}
                    placeholder="Brief explanation for correct choice..."
                    className="w-full px-3 py-2 bg-cream border-2 border-ink/10 rounded-xl text-xs text-ink-soft focus:outline-none font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-pop w-full py-2.5 bg-grass border-2 border-b-4 border-grass-dark hover:brightness-105 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{editingQuestionIdx !== null ? 'Update Question' : 'Add Question to Quiz'}</span>
              </button>
            </form>
          </div>

          <div ref={questionsListRef} className="bg-white border-4 border-ink/10 rounded-[2rem] p-6 shadow-xl space-y-4 scroll-mt-4">
            <div className="flex items-center justify-between border-b-2 border-ink/10 pb-3">
              <h3 className="text-sm font-display font-bold text-ink uppercase tracking-wider flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-sky-dark" />
                Quiz Questions List ({questions.length})
              </h3>
              <span className="text-xs text-ink-soft font-bold">
                Total Time: ~{questions.reduce((acc, q) => acc + (q.timeLimit || 30), 0)}s
              </span>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {questions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="bg-cream border-2 border-ink/10 rounded-2xl p-3.5 flex items-start justify-between gap-3 hover:border-sky/30 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="px-2 py-0.5 rounded-lg bg-sky/15 text-sky-dark border border-sky/30 font-bold">
                        Q{idx + 1}
                      </span>
                      <span className="text-ink-soft font-semibold">{q.timeLimit || 30}s</span>
                    </div>
                    <p className="text-xs font-bold text-ink leading-snug">{q.question}</p>
                    <p className="text-[11px] text-grass-dark font-semibold">
                      Correct Answer: {q.correctAnswerText || q.options[q.correctAnswer]}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEditClick(idx)}
                      className="p-1.5 hover:bg-white rounded-lg text-ink-soft hover:text-ink"
                      title="Edit Question"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(idx)}
                      className="p-1.5 hover:bg-coral/10 rounded-lg text-ink-soft hover:text-coral-dark"
                      title="Delete Question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* Share Quiz Modal */}
      {showShareModal && createPortal(
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm overflow-y-auto p-4">
          <div className="min-h-full flex items-center justify-center">
          <div className="bg-paper border-4 border-ink/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-display font-bold text-ink flex items-center gap-2">
                <Users2 className="w-4 h-4 text-sky-dark" />
                Share "{quizTitle}"
              </h3>
              <button onClick={() => setShowShareModal(false)} className="text-ink-soft hover:text-coral-dark p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-ink-soft font-medium">
              Anyone you invite by email gets full editor access -- they can view, edit, and host this quiz once they sign in with that email.
            </p>

            {shareError && (
              <div className="p-2.5 bg-coral/10 border-2 border-coral/30 text-coral-dark rounded-xl text-xs font-bold">
                {shareError}
              </div>
            )}

            <form onSubmit={handleShare} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-ink-soft/60 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="teammate@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-cream border-2 border-ink/10 rounded-2xl text-ink text-xs focus:outline-none focus:border-sky font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={isSharing}
                className="btn-pop px-4 py-2 bg-sky border-2 border-b-4 border-sky-dark hover:brightness-105 text-white text-xs font-bold rounded-2xl disabled:opacity-50 shrink-0"
              >
                {isSharing ? 'Sharing…' : 'Invite'}
              </button>
            </form>

            <div className="space-y-2">
              <span className="text-xs font-bold text-ink-soft uppercase tracking-wider">
                People with access ({collaborators.length})
              </span>
              {collaborators.length === 0 ? (
                <p className="text-xs text-ink-soft/70 italic">Not shared with anyone yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {collaborators.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between bg-cream border-2 border-ink/10 rounded-xl px-3 py-2"
                    >
                      <span className="text-xs text-ink truncate font-medium">{c.invitedEmail}</span>
                      <button
                        onClick={() => handleRemoveCollaborator(c.id)}
                        className="text-[11px] text-coral-dark hover:text-coral font-bold shrink-0 ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowShareModal(false)}
                className="btn-pop px-4 py-2 bg-cream-deep border-2 border-b-4 border-ink/15 hover:bg-cream text-ink text-xs font-bold rounded-2xl"
              >
                Done
              </button>
            </div>
          </div>
          </div>
        </div>,
        document.body
      )}

      {/* JSON Import Modal */}
      {showJsonModal && createPortal(
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm overflow-y-auto p-4">
          <div className="min-h-full flex items-center justify-center">
          <div className="bg-paper border-4 border-ink/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <h3 className="text-base font-display font-bold text-ink">Import Custom Questions via JSON</h3>
            <p className="text-xs text-ink-soft font-medium">
              Paste an array of question objects containing `question`, `options`, `correctAnswer`, `timeLimit`, and `explanation`.
            </p>
            <textarea
              rows={8}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={`[\n  {\n    "question": "What is GCP Cloud Run?",\n    "options": ["A) Serverless containers", "B) Physical server", "C) SQL DB", "D) DNS"],\n    "correctAnswer": 0,\n    "timeLimit": 30\n  }\n]`}
              className="w-full p-3 bg-cream border-2 border-ink/10 rounded-2xl text-xs text-grass-dark font-mono focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowJsonModal(false)}
                className="btn-pop px-4 py-2 bg-cream-deep border-2 border-b-4 border-ink/15 text-ink text-xs font-bold rounded-2xl"
              >
                Cancel
              </button>
              <button
                onClick={handleImportJson}
                className="btn-pop px-4 py-2 bg-sky border-2 border-b-4 border-sky-dark hover:brightness-105 text-white text-xs font-bold rounded-2xl"
              >
                Import Questions
              </button>
            </div>
          </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
