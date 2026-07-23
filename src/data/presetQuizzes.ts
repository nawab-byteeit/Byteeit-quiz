import { QuizPreset } from '../types';
import { QUESTIONS } from './questions';

export const PRESET_QUIZZES: QuizPreset[] = [
  {
    id: 'gcp_cloud_master',
    title: 'Google AI & Cloud Master Quiz',
    description: 'Official 15-question quiz covering GE Capabilities, Cloud Architecture, and Security.',
    category: 'Google Cloud & AI',
    questions: QUESTIONS
  },
  {
    id: 'genai_llm_mastery',
    title: 'Generative AI & LLM Engineering',
    description: '10 essential questions on Gemini models, RAG architecture, Context Caching, and Fine-Tuning.',
    category: 'Artificial Intelligence',
    questions: [
      {
        id: 101,
        question: 'What is the key advantage of Gemini 1.5 Pro\'s long-context window (up to 2 Million tokens)?',
        options: [
          'A) It only works on single sentence inputs.',
          'B) It allows processing entire codebases, hours of video, or vast PDF document libraries at once.',
          'C) It requires converting all documents manually into basic text format.',
          'D) It reduces the model output size to under 100 characters.'
        ],
        correctAnswer: 1,
        correctAnswerText: 'B) It allows processing entire codebases, hours of video, or vast PDF document libraries at once.',
        explanation: 'Gemini 1.5 Pro\'s massive context window enables native in-context learning over multimodal sources without complex pre-chunking.',
        timeLimit: 30
      },
      {
        id: 102,
        question: 'What does RAG stand for in modern generative AI application design?',
        options: [
          'A) Rapid Application Generation',
          'B) Retrieval-Augmented Generation',
          'C) Recurrent Agent Framework',
          'D) Real-time API Gateway'
        ],
        correctAnswer: 1,
        correctAnswerText: 'B) Retrieval-Augmented Generation',
        explanation: 'RAG fetches external, authoritative domain knowledge to ground model outputs and reduce hallucinations.',
        timeLimit: 25
      },
      {
        id: 103,
        question: 'In AI Studio, what feature allows developers to reduce API costs when frequently reusing static prompt context?',
        options: [
          'A) Context Caching',
          'B) Temperature Spike',
          'C) Binary Serialization',
          'D) Token Compression'
        ],
        correctAnswer: 0,
        correctAnswerText: 'A) Context Caching',
        explanation: 'Context Caching stores heavy prompt prefixes (like large PDFs or video files) on Google infrastructure so you only pay for the token lookup once.',
        timeLimit: 30
      },
      {
        id: 104,
        question: 'What parameter controls the randomness or creativity of generative model completions?',
        options: [
          'A) Top-K',
          'B) Temperature',
          'C) Token Weight',
          'D) Presence Penalty'
        ],
        correctAnswer: 1,
        correctAnswerText: 'B) Temperature',
        explanation: 'Lower temperature values (e.g., 0.1) produce deterministic, factual outputs, while higher values (e.g., 0.9) increase output variability.',
        timeLimit: 20
      },
      {
        id: 105,
        question: 'What is Structured Outputs (JSON Schema) used for when prompting Gemini models?',
        options: [
          'A) Forcing the model to respond strictly adhering to a defined JSON schema for reliable programmatic parsing.',
          'B) Styling the AI text output with HTML and CSS colors.',
          'C) Encrypting the prompt payload in transport.',
          'D) Running SQL queries directly inside the prompt window.'
        ],
        correctAnswer: 0,
        correctAnswerText: 'A) Forcing the model to respond strictly adhering to a defined JSON schema for reliable programmatic parsing.',
        explanation: 'Structured Outputs guarantee that model responses conform exactly to TypeScript types or OpenAPI schemas.',
        timeLimit: 30
      }
    ]
  },
  {
    id: 'web_dev_fullstack',
    title: 'Full-Stack Web & Real-Time Systems',
    description: 'Test your knowledge on React, TypeScript, Server-Sent Events (SSE), and Cloud Containers.',
    category: 'Software Engineering',
    questions: [
      {
        id: 201,
        question: 'Why are Server-Sent Events (SSE) well-suited for live quiz presentation rooms over traditional polling?',
        options: [
          'A) SSE requires double the server CPU bandwidth.',
          'B) SSE provides a persistent, low-latency, single HTTP connection push mechanism from server to all clients.',
          'C) SSE only works on desktop Chrome browsers.',
          'D) SSE replaces the need for React component state.'
        ],
        correctAnswer: 1,
        correctAnswerText: 'B) SSE provides a persistent, low-latency, single HTTP connection push mechanism from server to all clients.',
        explanation: 'Server-Sent Events allow the backend server to broadcast real-time state changes (timers, answers, leaderboards) instantly without client polling overhead.',
        timeLimit: 25
      },
      {
        id: 202,
        question: 'What is the primary benefit of containerizing a Node.js Express server on Google Cloud Run?',
        options: [
          'A) Cloud Run auto-scales instances from zero to thousands of concurrent connections based on traffic demand.',
          'B) Cloud Run requires writing custom C++ assembly code.',
          'C) Cloud Run disables HTTPS encryption automatically.',
          'D) Cloud Run restricts apps to single-threaded execution.'
        ],
        correctAnswer: 0,
        correctAnswerText: 'A) Cloud Run auto-scales instances from zero to thousands of concurrent connections based on traffic demand.',
        explanation: 'Google Cloud Run handles serverless container orchestration, managing TLS termination, zero-scale idle savings, and instant traffic scaling.',
        timeLimit: 30
      },
      {
        id: 203,
        question: 'In TypeScript, what is the main purpose of Strict Type Checking?',
        options: [
          'A) To slow down the build time.',
          'B) To catch null references, undefined property accesses, and type mismatch bugs at compile time before production runtime.',
          'C) To compile JavaScript directly into Python.',
          'D) To encrypt client-side source code.'
        ],
        correctAnswer: 1,
        correctAnswerText: 'B) To catch null references, undefined property accesses, and type mismatch bugs at compile time before production runtime.',
        explanation: 'Strict TypeScript verification ensures type safety, preventing common runtime exceptions like "Cannot read property of undefined".',
        timeLimit: 25
      }
    ]
  }
];
