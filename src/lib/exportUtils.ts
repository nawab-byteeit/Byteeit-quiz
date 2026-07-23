import { Question } from '../types';

/**
 * Clean string for CSV escaping
 */
function escapeCsvCell(text: string): string {
  if (!text) return '""';
  // If contains commas, quotes or newlines, wrap in double quotes
  let cleaned = text.replace(/"/g, '""');
  return `"${cleaned}"`;
}

/**
 * Generate Kahoot Bulk Spreadsheet CSV
 * Format expected by Kahoot Excel/CSV Importer:
 * Question, Answer 1, Answer 2, Answer 3, Answer 4, Time limit (sec), Correct answer(s)
 */
export function generateKahootCSV(questions: Question[]): string {
  const headers = [
    'Question',
    'Answer 1',
    'Answer 2',
    'Answer 3',
    'Answer 4',
    'Time limit (sec)',
    'Correct answer(s)'
  ];

  const rows = questions.map((q) => {
    // strip 'A) ', 'B) ' prefixes if needed, or keep clean option text
    const cleanOptions = q.options.map((opt) => opt.replace(/^[A-D]\)\s*/, ''));
    
    // Kahoot correct answers are 1-indexed (1, 2, 3, or 4)
    const correctAnswerIndexOneBased = q.correctAnswer + 1;

    return [
      escapeCsvCell(q.question),
      escapeCsvCell(cleanOptions[0] || ''),
      escapeCsvCell(cleanOptions[1] || ''),
      escapeCsvCell(cleanOptions[2] || ''),
      escapeCsvCell(cleanOptions[3] || ''),
      q.timeLimit || 30,
      correctAnswerIndexOneBased
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Generate Mentimeter Import Text/CSV Format
 * Mentimeter accepts standard slide breakdown or CSV
 */
export function generateMentimeterCSV(questions: Question[]): string {
  const headers = ['Question', 'Option 1', 'Option 2', 'Option 3', 'Option 4', 'Correct Option'];

  const rows = questions.map((q) => {
    const cleanOptions = q.options.map((opt) => opt.replace(/^[A-D]\)\s*/, ''));
    return [
      escapeCsvCell(q.question),
      escapeCsvCell(cleanOptions[0] || ''),
      escapeCsvCell(cleanOptions[1] || ''),
      escapeCsvCell(cleanOptions[2] || ''),
      escapeCsvCell(cleanOptions[3] || ''),
      q.correctAnswer + 1
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Generate Mentimeter Slide Outline Text (Copy-paste friendly)
 */
export function generateMentimeterTextOutline(questions: Question[]): string {
  return questions
    .map((q, idx) => {
      const cleanOptions = q.options.map((opt) => opt.replace(/^[A-D]\)\s*/, ''));
      return `Slide ${idx + 1}: Multiple Choice
Question: ${q.question}
Option 1: ${cleanOptions[0]}
Option 2: ${cleanOptions[1]}
Option 3: ${cleanOptions[2]}
Option 4: ${cleanOptions[3]}
Correct Answer: Option ${q.correctAnswer + 1} (${q.correctAnswerText})
Explanation: ${q.explanation}
----------------------------------------`;
    })
    .join('\n\n');
}

/**
 * Generate Printable Markdown Study Guide
 */
export function generateMarkdownStudyGuide(questions: Question[]): string {
  let md = `# Google Cloud & Gemini Enterprise Master Quiz & Study Guide\n\n`;
  md += `Total Questions: ${questions.length} | Sessions: 1, 2, and 3\n\n`;

  let currentSession = 0;

  questions.forEach((q, idx) => {
    if (q.session !== currentSession) {
      currentSession = q.session;
      md += `\n## ${q.sessionTitle}\n\n`;
    }

    md += `### Q${idx + 1}. ${q.question}\n\n`;
    q.options.forEach((opt) => {
      md += `- ${opt}\n`;
    });
    md += `\n**✅ Correct Answer:** ${q.correctAnswerText}\n`;
    md += `**💡 Explanation:** ${q.explanation}\n\n`;
    md += `---\n\n`;
  });

  return md;
}

/**
 * Helper to download content as a file
 */
export function downloadFile(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
