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
import { Download, Copy, Check, FileSpreadsheet, Presentation, BookOpen, HelpCircle } from 'lucide-react';

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

  const tabs = [
    { id: 'kahoot' as const, label: 'Kahoot Import Draft', icon: FileSpreadsheet, active: 'bg-grape border-grape-dark' },
    { id: 'mentimeter' as const, label: 'Mentimeter Slide Format', icon: Presentation, active: 'bg-sky border-sky-dark' },
    { id: 'markdown' as const, label: 'Markdown Study Guide', icon: BookOpen, active: 'bg-grass border-grass-dark' }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-white border-4 border-ink/10 rounded-[2rem] p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-sunny/20 border-2 border-sunny/40 text-sunny-dark rounded-full text-xs font-bold">
                Export & Draft Generator
              </span>
              <span className="text-xs text-ink-soft font-semibold">All 20 Questions Included</span>
            </div>
            <h2 className="text-2xl font-display font-extrabold text-ink mt-2">
              Draft for Kahoot, Mentimeter & Study Guides
            </h2>
            <p className="text-ink-soft text-xs mt-1 font-medium">
              Export pre-formatted spreadsheets and slide templates ready for instant bulk import into Kahoot or Mentimeter.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundEffects.playClick();
                downloadFile(kahootCsv, 'Kahoot_Google_Cloud_Quiz.csv', 'text/csv');
              }}
              className="btn-pop px-4 py-2.5 bg-grape border-2 border-b-4 border-grape-dark hover:brightness-105 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Kahoot CSV</span>
            </button>

            <button
              onClick={() => {
                soundEffects.playClick();
                downloadFile(mentiCsv, 'Mentimeter_Google_Cloud_Quiz.csv', 'text/csv');
              }}
              className="btn-pop px-4 py-2.5 bg-sky border-2 border-b-4 border-sky-dark hover:brightness-105 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Mentimeter CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                soundEffects.playClick();
                setActiveTab(tab.id);
              }}
              className={`btn-pop flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-2xl border-2 border-b-4 transition-all ${
                isActive
                  ? `${tab.active} text-white shadow-md`
                  : 'bg-white border-ink/10 text-ink-soft hover:text-ink'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Panes */}

      {/* 1. KAHOOT TAB */}
      {activeTab === 'kahoot' && (
        <div className="space-y-6">
          {/* Instructions Box */}
          <div className="bg-grape/10 border-2 border-grape/30 rounded-2xl p-5 space-y-2 text-xs text-ink">
            <div className="flex items-center gap-2 font-bold text-grape-dark">
              <HelpCircle className="w-4 h-4" />
              <span>How to import into Kahoot:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 leading-relaxed font-medium">
              <li>Click <strong className="text-ink">Download Kahoot CSV</strong> below to save the file.</li>
              <li>Log into your <a href="https://kahoot.com" target="_blank" rel="noreferrer" className="underline font-bold text-grape-dark">Kahoot Account</a> and click <strong>Create Kahoot</strong>.</li>
              <li>In the left panel, click <strong>Add Question</strong> → select <strong>Import Spreadsheet</strong>.</li>
              <li>Upload the downloaded <code className="bg-white px-1 py-0.5 rounded text-ink border border-grape/20">Kahoot_Google_Cloud_Quiz.csv</code> file. All 20 questions, choices, timer limits & correct answers will be populated automatically!</li>
            </ol>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-soft uppercase tracking-wider">
              Kahoot Bulk CSV Preview (20 Rows)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(kahootCsv, 'kahoot')}
                className="btn-pop px-3 py-1.5 bg-white hover:bg-cream text-ink-soft rounded-xl text-xs font-bold flex items-center gap-1.5 border-2 border-b-4 border-ink/15"
              >
                {copiedTab === 'kahoot' ? <Check className="w-3.5 h-3.5 text-grass-dark" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTab === 'kahoot' ? 'Copied CSV!' : 'Copy Raw CSV'}</span>
              </button>

              <button
                onClick={() => downloadFile(kahootCsv, 'Kahoot_Google_Cloud_Quiz.csv', 'text/csv')}
                className="btn-pop px-3 py-1.5 bg-grape border-2 border-b-4 border-grape-dark hover:brightness-105 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .CSV</span>
              </button>
            </div>
          </div>

          {/* Formatted Spreadsheet Table Preview */}
          <div className="bg-white border-4 border-ink/10 rounded-2xl overflow-x-auto shadow-md">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream text-ink-soft font-bold uppercase border-b-2 border-ink/10">
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
              <tbody className="divide-y divide-ink/10 text-ink-soft">
                {QUESTIONS.map((q, idx) => (
                  <tr key={q.id} className="hover:bg-cream/60">
                    <td className="p-3 font-bold text-ink-soft/60">{idx + 1}</td>
                    <td className="p-3 font-semibold text-ink">{q.question}</td>
                    <td className="p-3">{q.options[0]}</td>
                    <td className="p-3">{q.options[1]}</td>
                    <td className="p-3">{q.options[2]}</td>
                    <td className="p-3">{q.options[3]}</td>
                    <td className="p-3 text-center font-bold">{q.timeLimit || 30}</td>
                    <td className="p-3 text-center font-bold text-sunny-dark">
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
          <div className="bg-sky/10 border-2 border-sky/30 rounded-2xl p-5 space-y-2 text-xs text-ink">
            <div className="flex items-center gap-2 font-bold text-sky-dark">
              <HelpCircle className="w-4 h-4" />
              <span>How to import into Mentimeter:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 leading-relaxed font-medium">
              <li>Log into your <a href="https://mentimeter.com" target="_blank" rel="noreferrer" className="underline font-bold text-sky-dark">Mentimeter Account</a>.</li>
              <li>Create a new presentation → click <strong>Import</strong> or add <strong>Multiple Choice</strong> slides.</li>
              <li>Use the downloaded CSV file or copy the raw text outline below to generate slides in seconds!</li>
            </ol>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-soft uppercase tracking-wider">
              Mentimeter Slide Text Outline
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(mentiText, 'mentiText')}
                className="btn-pop px-3 py-1.5 bg-white hover:bg-cream text-ink-soft rounded-xl text-xs font-bold flex items-center gap-1.5 border-2 border-b-4 border-ink/15"
              >
                {copiedTab === 'mentiText' ? <Check className="w-3.5 h-3.5 text-grass-dark" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTab === 'mentiText' ? 'Copied Outline!' : 'Copy Slide Text'}</span>
              </button>

              <button
                onClick={() => downloadFile(mentiCsv, 'Mentimeter_Google_Cloud_Quiz.csv', 'text/csv')}
                className="btn-pop px-3 py-1.5 bg-sky border-2 border-b-4 border-sky-dark hover:brightness-105 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Mentimeter CSV</span>
              </button>
            </div>
          </div>

          <pre className="p-5 bg-white border-4 border-ink/10 rounded-2xl text-xs text-ink font-mono overflow-x-auto max-h-96 leading-relaxed">
            {mentiText}
          </pre>
        </div>
      )}

      {/* 3. MARKDOWN STUDY GUIDE TAB */}
      {activeTab === 'markdown' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-soft uppercase tracking-wider">
              Markdown & Printable Study Guide
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(markdownGuide, 'markdown')}
                className="btn-pop px-3 py-1.5 bg-white hover:bg-cream text-ink-soft rounded-xl text-xs font-bold flex items-center gap-1.5 border-2 border-b-4 border-ink/15"
              >
                {copiedTab === 'markdown' ? <Check className="w-3.5 h-3.5 text-grass-dark" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTab === 'markdown' ? 'Copied Markdown!' : 'Copy Markdown'}</span>
              </button>

              <button
                onClick={() => downloadFile(markdownGuide, 'Google_Cloud_Master_Study_Guide.md', 'text/markdown')}
                className="btn-pop px-3 py-1.5 bg-grass border-2 border-b-4 border-grass-dark hover:brightness-105 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .MD File</span>
              </button>
            </div>
          </div>

          <pre className="p-5 bg-white border-4 border-ink/10 rounded-2xl text-xs text-ink font-mono overflow-x-auto max-h-96 leading-relaxed">
            {markdownGuide}
          </pre>
        </div>
      )}
    </div>
  );
};
