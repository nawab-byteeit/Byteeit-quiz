import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { QuizPreset, Question } from '../types';
import { PRESET_QUIZZES } from '../data/presetQuizzes';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Auth & Firestore instances
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

const googleProvider = new GoogleAuthProvider();

// --- Auth Helper Functions ---

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Save/update user profile in Firestore
    if (user) {
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: user.displayName || 'Quiz Creator',
        photoURL: user.photoURL || '',
        createdAt: new Date().toISOString()
      }, { merge: true });
    }
    return user;
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const registerWithEmail = async (email: string, pass: string, name: string) => {
  try {
    const validPass = pass.length < 6 ? pass + "2026" : pass;
    const res = await createUserWithEmailAndPassword(auth, email, validPass);
    if (res.user) {
      const displayName = name || (email.includes('nawab') ? 'Nawab Khan (ByteeIT)' : email.split('@')[0]);
      await updateProfile(res.user, { displayName });
      await setDoc(doc(db, 'users', res.user.uid), {
        email: res.user.email,
        displayName,
        createdAt: new Date().toISOString()
      }, { merge: true });
    }
    return res.user;
  } catch (error: any) {
    console.error('Error registering:', error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, pass: string) => {
  const validPass = pass.length < 6 ? pass + "2026" : pass;
  try {
    const res = await signInWithEmailAndPassword(auth, email, validPass);
    return res.user;
  } catch (error: any) {
    // If user not found or invalid credential, try auto-registering
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-email') {
      try {
        const displayName = email.includes('nawab') ? 'Nawab Khan (ByteeIT)' : email.split('@')[0];
        return await registerWithEmail(email, pass, displayName);
      } catch (regError) {
        throw regError;
      }
    }
    console.error('Error signing in with email:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Error signing out:', error);
  }
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// --- Firestore Quiz Functions ---

export interface StoredQuiz {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  description: string;
  category: string;
  questions: Question[];
  createdAt: string;
}

export const saveQuizToFirestore = async (
  user: User, 
  title: string, 
  description: string, 
  category: string, 
  questions: Question[]
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'quizzes'), {
      creatorId: user.uid,
      creatorName: user.displayName || user.email || 'ByteeIT Creator',
      title,
      description: description || 'Custom quiz hosted on ByteeIT Platform',
      category: category || 'Custom Quiz',
      questions,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error: any) {
    console.error('Error saving quiz to Firestore:', error);
    throw error;
  }
};

export const fetchUserQuizzes = async (userId: string): Promise<QuizPreset[]> => {
  try {
    const q = query(
      collection(db, 'quizzes'), 
      where('creatorId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const results: QuizPreset[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      results.push({
        id: docSnap.id,
        title: data.title,
        description: data.description || 'Saved in Cloud Database',
        category: data.category || 'My Cloud Quizzes',
        questions: data.questions || []
      });
    });
    return results;
  } catch (error: any) {
    console.error('Error fetching user quizzes:', error);
    return [];
  }
};

export const fetchAllCloudQuizzes = async (): Promise<QuizPreset[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'quizzes'));
    const results: QuizPreset[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      results.push({
        id: docSnap.id,
        title: data.title,
        description: `${data.description || 'Cloud Quiz'} • By ${data.creatorName || 'Creator'}`,
        category: data.category || 'Cloud Community',
        questions: data.questions || []
      });
    });
    return results;
  } catch (error: any) {
    console.error('Error fetching all cloud quizzes:', error);
    return [];
  }
};

export const deleteQuizFromFirestore = async (quizId: string) => {
  try {
    await deleteDoc(doc(db, 'quizzes', quizId));
  } catch (error: any) {
    console.error('Error deleting quiz:', error);
    throw error;
  }
};

export const seedPresetsToFirestore = async (user: User): Promise<number> => {
  try {
    let savedCount = 0;
    for (const preset of PRESET_QUIZZES) {
      await addDoc(collection(db, 'quizzes'), {
        creatorId: user.uid,
        creatorName: user.displayName || user.email || 'Nawab Khan (ByteeIT)',
        title: preset.title,
        description: preset.description,
        category: preset.category,
        questions: preset.questions,
        createdAt: new Date().toISOString()
      });
      savedCount++;
    }
    return savedCount;
  } catch (error: any) {
    console.error('Error seeding presets to Firestore:', error);
    throw error;
  }
};
