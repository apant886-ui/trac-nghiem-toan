export enum QuestionType {
  MCQ = 'MCQ',
  TRUE_FALSE = 'TRUE_FALSE',
  SHORT_ANSWER = 'SHORT_ANSWER',
  ESSAY = 'ESSAY',
}

export enum Difficulty {
  RECOGNITION = 'NB', // Nhan biet
  UNDERSTANDING = 'TH', // Thong hieu
  APPLICATION = 'VD', // Van dung
  MIXED = 'MIXED'
}

// Removed MathTopic Enum as we now use dynamic strings from AI

export interface Option {
  id: string;
  content: string; // May contain <math> tags (LaTeX)
}

export interface Question {
  id: string;
  type: QuestionType;
  content: string; // Contains <math> tags (LaTeX)
  options?: Option[];
  correctOptionId?: string; // For MCQ/TF
  shortAnswer?: string; // For Short Answer
  explanation: string; // Detailed solution
}

export interface AppConfig {
  grade: string; // "10", "11", "12"
  lesson: string; // Specific lesson name
  topics: string[]; // Dynamic topics selected by user
  difficulty: Difficulty;
  questionTypes: QuestionType[];
  quantity: number;
  model: string; // 'gemini-3-flash-preview' | 'gemini-3-pro-preview'
}

export interface ExamExportConfig {
  numberOfVariants: number; // 1-10 codes
  examTitle: string;
  schoolName: string;
}

export interface Curriculum {
  [grade: string]: string[]; // Grade -> List of Lessons
}