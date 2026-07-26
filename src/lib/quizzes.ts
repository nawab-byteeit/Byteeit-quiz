import { supabase, type User } from './supabase';
import { Question } from '../types';

export interface StoredQuiz {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  category: string;
  questions: Question[];
  isPublic: boolean;
  isOwner: boolean;
  createdAt: string;
  updatedAt: string;
}

interface QuizRow {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  category: string | null;
  questions: Question[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

function mapQuiz(row: QuizRow, currentUserId?: string): StoredQuiz {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description || '',
    category: row.category || 'Custom Quiz',
    questions: row.questions || [],
    isPublic: row.is_public,
    isOwner: row.owner_id === currentUserId,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export const createQuiz = async (
  user: User,
  title: string,
  description: string,
  category: string,
  questions: Question[],
  isPublic = false
): Promise<StoredQuiz> => {
  const { data, error } = await supabase
    .from('quizzes')
    .insert({
      owner_id: user.id,
      title: title.trim() || 'Untitled Quiz',
      description: description.trim(),
      category: category.trim() || 'Custom Quiz',
      questions,
      is_public: isPublic
    })
    .select()
    .single();
  if (error) throw error;
  return mapQuiz(data as QuizRow, user.id);
};

export const updateQuiz = async (
  quizId: string,
  updates: Partial<Pick<StoredQuiz, 'title' | 'description' | 'category' | 'questions' | 'isPublic'>>
): Promise<void> => {
  const payload: Record<string, unknown> = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.questions !== undefined) payload.questions = updates.questions;
  if (updates.isPublic !== undefined) payload.is_public = updates.isPublic;

  const { error } = await supabase.from('quizzes').update(payload).eq('id', quizId);
  if (error) throw error;
};

export const deleteQuiz = async (quizId: string): Promise<void> => {
  const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
  if (error) throw error;
};

export const listMyQuizzes = async (
  user: User
): Promise<{ owned: StoredQuiz[]; shared: StoredQuiz[] }> => {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  const all = ((data || []) as QuizRow[]).map((row) => mapQuiz(row, user.id));
  return {
    owned: all.filter((q) => q.isOwner),
    shared: all.filter((q) => !q.isOwner)
  };
};

export const listPublicQuizzes = async (): Promise<StoredQuiz[]> => {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data || []) as QuizRow[]).map((row) => mapQuiz(row));
};

export interface Collaborator {
  id: string;
  invitedEmail: string;
  createdAt: string;
}

export const listCollaborators = async (quizId: string): Promise<Collaborator[]> => {
  const { data, error } = await supabase
    .from('quiz_collaborators')
    .select('id, invited_email, created_at')
    .eq('quiz_id', quizId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id as string,
    invitedEmail: row.invited_email as string,
    createdAt: row.created_at as string
  }));
};

export const shareQuizWithEmail = async (
  quizId: string,
  email: string,
  invitedBy: string
): Promise<void> => {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) {
    throw new Error('Enter a valid email address.');
  }
  const { error } = await supabase.from('quiz_collaborators').insert({
    quiz_id: quizId,
    invited_email: normalized,
    invited_by: invitedBy
  });
  if (error) {
    if (error.code === '23505') {
      throw new Error('This email already has access to the quiz.');
    }
    throw error;
  }
};

export const removeCollaborator = async (collaboratorId: string): Promise<void> => {
  const { error } = await supabase.from('quiz_collaborators').delete().eq('id', collaboratorId);
  if (error) throw error;
};
