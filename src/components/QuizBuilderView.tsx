import React, { useState, useEffect } from 'react';
import { Question, ViewMode, QuizPreset } from '../types';
import { PRESET_QUIZZES } from '../data/presetQuizzes';
import { syncEngine } from '../lib/syncEngine';
import { soundEffects } from '../lib/audio';
import { 
  onAuthChange, 
  loginWithGoogle, 
  loginWithEmail, 
  registerWithEmail, 
  logoutUser, 
  saveQuizToFirestore, 
  fetchUserQuizzes, 
  fetchAllCloudQuizzes,
  deleteQuizFromFirestore,
  seedPresetsToFirestore
} from '../lib/firebase';
import { User } from 'firebase/auth';
import { 
  Plus, Trash2, Edit3, CheckCircle, Sparkles, Tv, Copy, Download, Upload, 
  Layers, ArrowRight, ShieldCheck, Database, LogIn, LogOut, UserCheck, Cloud, 
  Save, Key, Mail, Lock, RefreshCw 
} from 'lucide-react';
import byteeitLogo from '../assets/images/byteeit_logo_1784809227570.jpg';

interface QuizBuilderViewProps {
  setMode: (mode: ViewMode) => void;
  currentRoomCode: string;
  currentUser?: User | null;
}

export const QuizBuilderView: React.FC<QuizBuilderViewProps> = ({ setMode, currentRoomCode, currentUser: propUser }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(propUser || null);
  const [userCloudQuizzes, setUserCloudQuizzes] = useState<QuizPreset[]>([]);
  const [allCloudQuizzes, setAllCloudQuizzes] = useState<QuizPreset[]>([]);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);

  // Auth Modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Quiz Editor State
  const [selectedPresetId, setSelectedPresetId] = useState<string>('gcp_cloud_master');
  const [quizTitle, setQuizTitle] = useState<string>('Google AI & Cloud Master Quiz');
  const [quizCategory, setQuizCategory] = useState<string>('Google Cloud & AI');
  const [hostName, setHostName] = useState<string>('Nawab Khan');
  const [customRoomPin, setCustomRoomPin] = useState<string>(currentRoomCode || 'BYTE2026');
  
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

  // Subscribe to Auth
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setCurrentUser(user);
      if (user) {
        setHostName(user.displayName || user.email?.split('@')[0] || 'Nawab Khan');
        loadCloudQuizzes(user.uid);
      } else {
        loadPublicCloudQuizzes();
      }
    });
    return () => unsubscribe();
  }, []);

  const loadCloudQuizzes = async (uid: string) => {
    setIsLoadingCloud(true);
    try {
      const userQuizzes = await fetchUserQuizzes(uid);
      setUserCloudQuizzes(userQuizzes);
      const publicQuizzes = await fetchAllCloudQuizzes();
      setAllCloudQuizzes(publicQuizzes);
    } catch (err) {
      console.error('Failed to load cloud quizzes:', err);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  const loadPublicCloudQuizzes = async () => {
    setIsLoadingCloud(true);
    try {
      const publicQuizzes = await fetchAllCloudQuizzes();
      setAllCloudQuizzes(publicQuizzes);
    } catch (err) {
      console.error('Failed to load public cloud quizzes:', err);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  // Auth Handlers
  const handleGoogleAuth = async () => {
    setAuthError('');
    setIsSubmittingAuth(true);
    try {
      await loginWithGoogle();
      setShowAuthModal(false);
      soundEffects.playClick();
    } catch (err: any) {
      setAuthError(err.message || 'Google sign-in failed');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmittingAuth(true);
    try {
      if (authMode === 'login') {
        await loginWithEmail(authEmail, authPass);
      } else {
        await registerWithEmail(authEmail, authPass, authName);
      }
      setShowAuthModal(false);
      soundEffects.playClick();
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleLogout = async () => {
    soundEffects.playClick();
    await logoutUser();
  };

  // Select Preset or Cloud Quiz
  const handleSelectPreset = (presetId: string, customQuestions?: Question[], customTitle?: string, customCategory?: string) => {
    soundEffects.playClick();
    setSelectedPresetId(presetId);
    if (customQuestions) {
      setQuizTitle(customTitle || 'Cloud Quiz');
      setQuizCategory(customCategory || 'Cloud DB');
      setQuestions([...customQuestions]);
      return;
    }
    const found = PRESET_QUIZZES.find((p) => p.id === presetId);
    if (found) {
      setQuizTitle(found.title);
      setQuizCategory(found.category);
      setQuestions([...found.questions]);
    }
  };

  // Save Quiz to Firestore Cloud Database
  const handleSaveToCloud = async () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    if (questions.length === 0) {
      alert('Add at least 1 question before saving to database!');
      return;
    }

    setIsSavingCloud(true);
    try {
      const docId = await saveQuizToFirestore(
        currentUser,
        quizTitle,
        'Custom Cloud Quiz hosted on ByteeIT Platform',
        quizCategory,
        questions
      );
      soundEffects.playClick();
      alert('🎉 Quiz successfully saved to Firebase Database!');
      loadCloudQuizzes(currentUser.uid);
    } catch (err: any) {
      alert(`Failed to save to database: ${err.message}`);
    } finally {
      setIsSavingCloud(false);
    }
  };

  const handleDeleteCloudQuiz = async (quizId: string) => {
    if (!currentUser) return;
    if (confirm('Are you sure you want to delete this cloud quiz?')) {
      try {
        await deleteQuizFromFirestore(quizId);
        soundEffects.playClick();
        loadCloudQuizzes(currentUser.uid);
      } catch (err: any) {
        alert(`Failed to delete: ${err.message}`);
      }
    }
  };

  const handleSeedPresetsToCloud = async () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    setIsSavingCloud(true);
    try {
      const count = await seedPresetsToFirestore(currentUser);
      soundEffects.playClick();
      alert(`🎉 Successfully saved ${count} preset quizzes (including all hardcoded questions) to your Firebase Firestore database!`);
      loadCloudQuizzes(currentUser.uid);
    } catch (err: any) {
      alert(`Failed to save presets to Firestore: ${err.message}`);
    } finally {
      setIsSavingCloud(false);
    }
  };

  // Generate random room code
  const handleGeneratePin = () => {
    soundEffects.playClick();
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCustomRoomPin(code);
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

    // Reset Form
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

  // Launch Host Mode with Custom Created Quiz
  const handleLaunchQuiz = () => {
    if (questions.length === 0) {
      alert('Please add at least 1 question before launching!');
      return;
    }

    soundEffects.playClick();

    // Create room with custom parameters
    syncEngine.createCustomRoom(
      customRoomPin,
      hostName || 'Nawab Khan',
      quizTitle || 'Custom Quiz Room',
      questions
    );

    // Switch view mode to host
    setMode('host');
  };

  // Import JSON Questions
  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setQuestions(parsed);
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
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-4">
          <img
            src={byteeitLogo}
            alt="ByteeIT Logo"
            referrerPolicy="no-referrer"
            className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500/50 shadow-xl shadow-blue-500/20"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[11px] font-bold rounded-full uppercase tracking-wider">
                Universal Quiz Studio
              </span>
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> ByteeIT Platform
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Create & Host Any Quiz
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Design custom questions, save to Firebase Database, set custom PINs, and host synchronized live games!
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-2xl">
              <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                {currentUser.displayName || currentUser.email}
              </span>
              <button
                onClick={handleLogout}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <LogIn className="w-4 h-4" />
              <span>Creator Login / Sign Up</span>
            </button>
          )}

          <button
            onClick={handleLaunchQuiz}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold rounded-2xl shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-2 text-sm transition-all shrink-0"
          >
            <Tv className="w-5 h-5" />
            <span>Launch & Host Live Room</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Settings & Presets on Left, Question Builder on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Room & Host Config + Presets */}
        <div className="lg:col-span-5 space-y-6">
          {/* Room Configuration Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                1. Host & Room Configuration
              </h3>
              <button
                onClick={handleSaveToCloud}
                disabled={isSavingCloud}
                className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm disabled:opacity-50"
              >
                <Database className="w-3.5 h-3.5" />
                <span>{isSavingCloud ? 'Saving...' : 'Save to Cloud DB'}</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Quiz Title
                </label>
                <input
                  type="text"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="e.g. ByteeIT Tech Sprint Trivia 2026"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Host Name / Brand
                </label>
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  placeholder="e.g. Nawab Khan"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-blue-300 font-semibold text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Custom Game PIN / Room Code
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customRoomPin}
                    onChange={(e) => setCustomRoomPin(e.target.value.toUpperCase())}
                    maxLength={10}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-amber-400 font-mono font-bold text-center text-base tracking-widest focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={handleGeneratePin}
                    className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 shrink-0"
                  >
                    Random PIN
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Preset Quiz Selector & Firestore Cloud Quizzes */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                2. Choose Quiz Template / Cloud DB
              </h3>
              <button
                onClick={() => setShowJsonModal(true)}
                className="text-xs text-blue-400 font-semibold hover:underline flex items-center gap-1"
              >
                <Upload className="w-3.5 h-3.5" /> Import
              </button>
            </div>

            {/* My Cloud Database Quizzes Section */}
            {currentUser && (
              <div className="space-y-2 border-b border-slate-800 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <Cloud className="w-3.5 h-3.5" /> My Cloud Database Quizzes ({userCloudQuizzes.length})
                  </span>
                  <button
                    onClick={() => loadCloudQuizzes(currentUser.uid)}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingCloud ? 'animate-spin' : ''}`} /> Refresh
                  </button>
                </div>

                {userCloudQuizzes.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No cloud quizzes saved yet. Click "Save to Cloud DB" above to store your quizzes!</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {userCloudQuizzes.map((cq) => (
                      <div
                        key={cq.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                          selectedPresetId === cq.id
                            ? 'bg-emerald-950/60 border-emerald-500 text-white'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300'
                        }`}
                      >
                        <button
                          onClick={() => handleSelectPreset(cq.id, cq.questions, cq.title, cq.category)}
                          className="text-left min-w-0 flex-1"
                        >
                          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono font-bold">
                            <span>{cq.category}</span>
                            <span>•</span>
                            <span>{cq.questions.length} Qs</span>
                          </div>
                          <h4 className="font-bold text-xs text-white truncate">{cq.title}</h4>
                        </button>
                        <button
                          onClick={() => handleDeleteCloudQuiz(cq.id)}
                          className="p-1 hover:bg-red-950 rounded text-slate-400 hover:text-red-400"
                          title="Delete from Firestore"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Built-in Presets */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
                  Built-In Presets
                </span>
                <button
                  onClick={handleSeedPresetsToCloud}
                  disabled={isSavingCloud}
                  className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm disabled:opacity-50"
                  title="Save all preset quizzes into Firestore database"
                >
                  <Cloud className="w-3 h-3 text-amber-400" />
                  <span>Save All to Firestore</span>
                </button>
              </div>
              {PRESET_QUIZZES.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-blue-950/80 border-blue-500 text-white shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                        {preset.category}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {preset.questions.length} Questions
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-white mt-1">{preset.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{preset.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Question Editor & List */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Question Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                {editingQuestionIdx !== null ? `Edit Question #${editingQuestionIdx + 1}` : 'Add New Question'}
              </h3>
              {editingQuestionIdx !== null && (
                <button
                  onClick={() => {
                    setEditingQuestionIdx(null);
                    setQText('');
                    setQOptions(['', '', '', '']);
                  }}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Question Text
                </label>
                <textarea
                  rows={2}
                  required
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="Enter your question text here..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* 4 Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {['A', 'B', 'C', 'D'].map((letter, idx) => {
                  const colors = [
                    'border-red-500/40 text-red-300',
                    'border-blue-500/40 text-blue-300',
                    'border-amber-500/40 text-amber-300',
                    'border-emerald-500/40 text-emerald-300'
                  ];
                  return (
                    <div key={letter} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className={`text-xs font-bold ${colors[idx]}`}>
                          Option {letter}
                        </label>
                        <button
                          type="button"
                          onClick={() => setQCorrect(idx)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${
                            qCorrect === idx
                              ? 'bg-emerald-600 border-emerald-400 text-white'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
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
                        className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-xs text-white focus:outline-none ${
                          qCorrect === idx ? 'border-emerald-500 ring-1 ring-emerald-500/50' : 'border-slate-800'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Time Limit (Seconds)
                  </label>
                  <select
                    value={qTimeLimit}
                    onChange={(e) => setQTimeLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none"
                  >
                    <option value={10}>10 Seconds (Fast)</option>
                    <option value={20}>20 Seconds</option>
                    <option value={30}>30 Seconds (Default)</option>
                    <option value={45}>45 Seconds</option>
                    <option value={60}>60 Seconds (Complex)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Explanation (Shown after answer)
                  </label>
                  <input
                    type="text"
                    value={qExplanation}
                    onChange={(e) => setQExplanation(e.target.value)}
                    placeholder="Brief explanation for correct choice..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>{editingQuestionIdx !== null ? 'Update Question' : 'Add Question to Quiz'}</span>
              </button>
            </form>
          </div>

          {/* Current Question List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-400" />
                Quiz Questions List ({questions.length})
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                Total Time: ~{questions.reduce((acc, q) => acc + (q.timeLimit || 30), 0)}s
              </span>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {questions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-start justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="px-2 py-0.5 rounded bg-blue-600/20 text-blue-300 border border-blue-500/30 font-mono">
                        Q{idx + 1}
                      </span>
                      <span className="text-slate-400 font-mono">{q.timeLimit || 30}s</span>
                    </div>
                    <p className="text-xs font-semibold text-white leading-snug">
                      {q.question}
                    </p>
                    <p className="text-[11px] text-emerald-400 font-medium">
                      Correct Answer: {q.correctAnswerText || q.options[q.correctAnswer]}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEditClick(idx)}
                      className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                      title="Edit Question"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(idx)}
                      className="p-1.5 hover:bg-red-950 rounded text-slate-400 hover:text-red-400"
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

      {/* Creator Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-blue-400 mb-1">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold text-white">
                {authMode === 'login' ? 'Creator Sign In' : 'Create Creator Account'}
              </h3>
              <p className="text-xs text-slate-400">
                Log in to save custom quizzes directly to ByteeIT's Firebase Database!
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 rounded-xl text-xs text-center font-medium">
                {authError}
              </div>
            )}

            {/* Google Fast Sign-In */}
            <button
              onClick={handleGoogleAuth}
              disabled={isSubmittingAuth}
              className="w-full py-3 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center gap-3 my-2">
              <div className="h-px bg-slate-800 flex-1" />
              <span className="text-[11px] text-slate-500 font-bold uppercase">or email</span>
              <div className="h-px bg-slate-800 flex-1" />
            </div>

            <form onSubmit={handleEmailAuthSubmit} className="space-y-3">
              {authMode === 'register' && (
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Display Name</label>
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="e.g. Nawab Khan"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="creator@byteeit.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={authPass}
                  onChange={(e) => setAuthPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingAuth}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md disabled:opacity-50"
              >
                {authMode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="hover:text-blue-400 font-semibold"
              >
                {authMode === 'login' ? 'Need an account? Register' : 'Already have an account? Sign In'}
              </button>
              <button
                onClick={() => setShowAuthModal(false)}
                className="hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JSON Import Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Import Custom Questions via JSON</h3>
            <p className="text-xs text-slate-400">
              Paste an array of question objects containing `question`, `options`, `correctAnswer`, `timeLimit`, and `explanation`.
            </p>
            <textarea
              rows={8}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={`[\n  {\n    "question": "What is GCP Cloud Run?",\n    "options": ["A) Serverless containers", "B) Physical server", "C) SQL DB", "D) DNS"],\n    "correctAnswer": 0,\n    "timeLimit": 30\n  }\n]`}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-emerald-300 font-mono focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowJsonModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleImportJson}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl"
              >
                Import Questions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

