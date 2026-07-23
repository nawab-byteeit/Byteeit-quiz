import React, { useState } from 'react';
import { QUESTIONS } from '../data/questions';
import {
  generateKahootCSV,
  generateMentimeterCSV,
  generateMentimeterTextOutline,
  generateMarkdownStudyGuide,
  downloadFile
} from '../lib/exportUtils';
import { soundEffects } from '../lib/audio';
import { Download, Copy, Check, FileSpreadsheet, Presentation, BookOpen, ExternalLink, HelpCircle } from 'lucide-react';

export const ExportView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'kahoot' | 'mentimeter' | 'markdown'>('kahoot');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const kahootCsv = generateKahootCSV(QUESTIONS);
  const mentiCsv = generateMentimeterCSV(QUESTIONS);
  const mentiText = generateMentimeterTextOutline(QUESTIONS);
  const markdownGuide = generateMarkdownStudyGuide(QUESTIONS);

  const handleCopy = (content: string, tabKey: string) => {
    navigator.clipboard.writeText(content);
    soundEffects.playClick();
    setCopiedTab(tabKey);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-full text-xs font-bold">
                Export & Draft Generator
              </span>
              <span className="text-xs text-slate-400">All 20 Questions Included</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white mt-2">
              Draft for Kahoot, Mentimeter & Study Guides
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              Export pre-formatted spreadsheets and slide templates ready for instant bulk import into Kahoot or Mentimeter.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundEffects.playClick();
                downloadFile(kahootCsv, 'Kahoot_Google_Cloud_Quiz.csv', 'text/csv');
              }}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-purple-600/20"
            >
              <Download className="w-4 h-4" />
              <span>Kahoot CSV</span>
            </button>

            <button
              onClick={() => {
                soundEffects.playClick();
                downloadFile(mentiCsv, 'Mentimeter_Google_Cloud_Quiz.csv', 'text/csv');
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <Download className="w-4 h-4" />
              <span>Mentimeter CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => {
            soundEffects.playClick();
            setActiveTab('kahoot');
          }}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'kahoot'
              ? 'border-purple-500 text-purple-300 bg-purple-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Kahoot Import Draft</span>
        </button>

        <button
          onClick={() => {
            soundEffects.playClick();
            setActiveTab('mentimeter');
          }}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'mentimeter'
              ? 'border-blue-500 text-blue-300 bg-blue-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Presentation className="w-4 h-4" />
          <span>Mentimeter Slide Format</span>
        </button>

        <button
          onClick={() => {
            soundEffects.playClick();
            setActiveTab('markdown');
          }}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'markdown'
              ? 'border-emerald-500 text-emerald-300 bg-emerald-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Markdown Study Guide</span>
        </button>
      </div>

      {/* Content Panes */}

      {/* 1. KAHOOT TAB */}
      {activeTab === 'kahoot' && (
        <div className="space-y-6">
          {/* Instructions Box */}
          <div className="bg-purple-950/30 border border-purple-500/30 rounded-2xl p-5 space-y-2 text-xs text-purple-200">
            <div className="flex items-center gap-2 font-bold text-purple-300">
              <HelpCircle className="w-4 h-4" />
              <span>How to import into Kahoot:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-purple-100/80 leading-relaxed">
              <li>Click <strong className="text-white">Download Kahoot CSV</strong> below to save the file.</li>
              <li>Log into your <a href="https://kahoot.com" target="_blank" rel="noreferrer" className="underline font-bold text-white">Kahoot Account</a> and click <strong>Create Kahoot</strong>.</li>
              <li>In the left panel, click <strong>Add Question</strong> → select <strong>Import Spreadsheet</strong>.</li>
              <li>Upload the downloaded <code className="bg-purple-900/60 px-1 py-0.5 rounded text-white">Kahoot_Google_Cloud_Quiz.csv</code> file. All 20 questions, choices, timer limits & correct answers will be populated automatically!</li>
            </ol>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Kahoot Bulk CSV Preview (20 Rows)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(kahootCsv, 'kahoot')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
              >
                {copiedTab === 'kahoot' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTab === 'kahoot' ? 'Copied CSV!' : 'Copy Raw CSV'}</span>
              </button>

              <button
                onClick={() => downloadFile(kahootCsv, 'Kahoot_Google_Cloud_Quiz.csv', 'text/csv')}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .CSV</span>
              </button>
            </div>
          </div>

          {/* Formatted Spreadsheet Table Preview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3 min-w-[280px]">Question</th>
                  <th className="p-3 min-w-[140px]">Option 1</th>
                  <th className="p-3 min-w-[140px]">Option 2</th>
                  <th className="p-3 min-w-[140px]">Option 3</th>
                  <th className="p-3 min-w-[140px]">Option 4</th>
                  <th className="p-3 text-center">Time (s)</th>
                  <th className="p-3 text-center">Correct #</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {QUESTIONS.map((q, idx) => (
                  <tr key={q.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-slate-500">{idx + 1}</td>
                    <td className="p-3 font-medium text-white">{q.question}</td>
                    <td className="p-3">{q.options[0]}</td>
                    <td className="p-3">{q.options[1]}</td>
                    <td className="p-3">{q.options[2]}</td>
                    <td className="p-3">{q.options[3]}</td>
                    <td className="p-3 text-center font-mono">{q.timeLimit || 30}</td>
                    <td className="p-3 text-center font-mono font-bold text-amber-400">
                      {q.correctAnswer + 1}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. MENTIMETER TAB */}
      {activeTab === 'mentimeter' && (
        <div className="space-y-6">
          <div className="bg-blue-950/30 border border-blue-500/30 rounded-2xl p-5 space-y-2 text-xs text-blue-200">
            <div className="flex items-center gap-2 font-bold text-blue-300">
              <HelpCircle className="w-4 h-4" />
              <span>How to import into Mentimeter:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-blue-100/80 leading-relaxed">
              <li>Log into your <a href="https://mentimeter.com" target="_blank" rel="noreferrer" className="underline font-bold text-white">Mentimeter Account</a>.</li>
              <li>Create a new presentation → click <strong>Import</strong> or add <strong>Multiple Choice</strong> slides.</li>
              <li>Use the downloaded CSV file or copy the raw text outline below to generate slides in seconds!</li>
            </ol>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Mentimeter Slide Text Outline
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(mentiText, 'mentiText')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
              >
                {copiedTab === 'mentiText' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTab === 'mentiText' ? 'Copied Outline!' : 'Copy Slide Text'}</span>
              </button>

              <button
                onClick={() => downloadFile(mentiCsv, 'Mentimeter_Google_Cloud_Quiz.csv', 'text/csv')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Mentimeter CSV</span>
              </button>
            </div>
          </div>

          <pre className="p-5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-blue-200/90 font-mono overflow-x-auto max-h-96 leading-relaxed">
            {mentiText}
          </pre>
        </div>
      )}

      {/* 3. MARKDOWN STUDY GUIDE TAB */}
      {activeTab === 'markdown' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Markdown & Printable Study Guide
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(markdownGuide, 'markdown')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
              >
                {copiedTab === 'markdown' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTab === 'markdown' ? 'Copied Markdown!' : 'Copy Markdown'}</span>
              </button>

              <button
                onClick={() => downloadFile(markdownGuide, 'Google_Cloud_Master_Study_Guide.md', 'text/markdown')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .MD File</span>
              </button>
            </div>
          </div>

          <pre className="p-5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-emerald-200/90 font-mono overflow-x-auto max-h-96 leading-relaxed">
            {markdownGuide}
          </pre>
        </div>
      )}
    </div>
  );
};
