import { Difficulty, GameMode } from '../types';
import { db, auth } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  serverTimestamp,
  doc,
  setDoc
} from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface GameStats {
  totalPops: number;
  totalMissed: number;
  gamesPlayed: number;
  highScores: {
    [GameMode.ENDLESS]: Record<Difficulty, number>;
  };
}

const STORAGE_KEY = 'fizz_bust_stats';

const defaultStats: GameStats = {
  totalPops: 0,
  totalMissed: 0,
  gamesPlayed: 0,
  highScores: {
    [GameMode.ENDLESS]: {
      [Difficulty.EASY]: 0,
      [Difficulty.MEDIUM]: 0,
      [Difficulty.HARD]: 0,
    },
  },
};

export interface LeaderboardEntry {
  name: string;
  score: number;
  difficulty: Difficulty;
  isPlayer?: boolean;
}

export const statsService = {
  getStats(): GameStats {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return defaultStats;
      return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load stats from localStorage:', e);
      return defaultStats;
    }
  },

  async getLeaderboard(difficulty: Difficulty): Promise<LeaderboardEntry[]> {
    const path = 'leaderboards';
    try {
      const q = query(
        collection(db, path),
        where('difficulty', '==', difficulty),
        orderBy('score', 'desc'),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const data: LeaderboardEntry[] = [];
      
      querySnapshot.forEach((doc) => {
        const entry = doc.data();
        data.push({
          name: entry.userName,
          score: entry.score,
          difficulty: entry.difficulty as Difficulty,
          isPlayer: entry.uid === auth.currentUser?.uid
        });
      });

      // Add local player score if not in top 10 and not logged in
      const stats = this.getStats();
      const playerScore = stats.highScores[GameMode.ENDLESS][difficulty];
      const isInTop = data.some((e) => e.isPlayer || (e.name === 'YOU' && e.score === playerScore));
      
      if (playerScore > 0 && !isInTop) {
        data.push({ name: 'YOU', score: playerScore, difficulty, isPlayer: true });
      }
      
      return data.sort((a, b) => b.score - a.score);
    } catch (e) {
      if (e instanceof Error && e.message.includes('permission-denied')) {
        handleFirestoreError(e, OperationType.GET, path);
      }
      console.warn('Failed to fetch global leaderboard:', e);
      return [];
    }
  },

  async saveGame(score: number, missed: number, mode: GameMode, difficulty: Difficulty): Promise<boolean> {
    const stats = this.getStats();
    
    stats.totalPops += score;
    stats.totalMissed += missed;
    stats.gamesPlayed += 1;
    
    const currentBest = stats.highScores[mode]?.[difficulty] || 0;
    const isNewHigh = score > currentBest;
    
    if (isNewHigh) {
      if (!stats.highScores[mode]) {
        stats.highScores[mode] = {
          [Difficulty.EASY]: 0,
          [Difficulty.MEDIUM]: 0,
          [Difficulty.HARD]: 0,
        };
      }
      stats.highScores[mode][difficulty] = score;
      
      // Submit to Firestore if logged in
      if (auth.currentUser) {
        const scoreId = `${auth.currentUser.uid}_${mode}_${difficulty}`;
        const path = `leaderboards/${scoreId}`;
        try {
          const scoreRef = doc(db, 'leaderboards', scoreId);
          
          await setDoc(scoreRef, {
            uid: auth.currentUser.uid,
            userName: auth.currentUser.displayName || 'Anonymous',
            score: score,
            mode: mode,
            difficulty: difficulty,
            timestamp: serverTimestamp()
          }, { merge: true });
          
          console.log('Global score synced successfully');
        } catch (e) {
          if (e instanceof Error && e.message.includes('permission-denied')) {
            handleFirestoreError(e, OperationType.WRITE, path);
          }
          console.warn('Failed to sync score to global leaderboard:', e);
        }
      }
    }
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch (e) {
      console.error('CRITICAL: Failed to save stats to localStorage:', e);
    }

    return isNewHigh;
  },

  resetStats() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultStats));
    } catch (e) {
      console.warn('Failed to reset stats in localStorage:', e);
    }
  }
};
