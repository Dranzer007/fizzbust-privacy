import { Difficulty, GameMode } from '../types';

export interface GameStats {
  totalPops: number;
  totalMissed: number;
  gamesPlayed: number;
  highScores: {
    [GameMode.ENDLESS]: Record<Difficulty, number>;
  };
  maxCombos: {
    [GameMode.ENDLESS]: Record<Difficulty, number>;
  };
}

const STORAGE_KEY = 'fizz_bust_stats';
const LEADERBOARD_KEY_PREFIX = 'fizz_bust_leaderboard_';
const PLAYER_NAME_KEY = 'fizz_bust_player_name';

const createDefaultDifficultyStats = (): Record<Difficulty, number> => ({
  [Difficulty.EASY]: 0,
  [Difficulty.MEDIUM]: 0,
  [Difficulty.HARD]: 0,
});

const createDefaultStats = (): GameStats => ({
  totalPops: 0,
  totalMissed: 0,
  gamesPlayed: 0,
  highScores: {
    [GameMode.ENDLESS]: createDefaultDifficultyStats(),
  },
  maxCombos: {
    [GameMode.ENDLESS]: createDefaultDifficultyStats(),
  },
});

const isValidMetric = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;

const normalizeDifficultyStats = (value: unknown): Record<Difficulty, number> => {
  const source = value && typeof value === 'object' ? value as Partial<Record<Difficulty, number>> : {};
  const defaults = createDefaultDifficultyStats();

  return {
    [Difficulty.EASY]: isValidMetric(source[Difficulty.EASY]) ? source[Difficulty.EASY] : defaults[Difficulty.EASY],
    [Difficulty.MEDIUM]: isValidMetric(source[Difficulty.MEDIUM]) ? source[Difficulty.MEDIUM] : defaults[Difficulty.MEDIUM],
    [Difficulty.HARD]: isValidMetric(source[Difficulty.HARD]) ? source[Difficulty.HARD] : defaults[Difficulty.HARD],
  };
};

const normalizeStats = (value: unknown): GameStats => {
  const source = value && typeof value === 'object' ? value as Partial<GameStats> : {};
  const highScores = source.highScores && typeof source.highScores === 'object' ? source.highScores : {};
  const maxCombos = source.maxCombos && typeof source.maxCombos === 'object' ? source.maxCombos : {};

  return {
    totalPops: isValidMetric(source.totalPops) ? source.totalPops : 0,
    totalMissed: isValidMetric(source.totalMissed) ? source.totalMissed : 0,
    gamesPlayed: isValidMetric(source.gamesPlayed) ? source.gamesPlayed : 0,
    highScores: {
      [GameMode.ENDLESS]: normalizeDifficultyStats(highScores[GameMode.ENDLESS]),
    },
    maxCombos: {
      [GameMode.ENDLESS]: normalizeDifficultyStats(maxCombos[GameMode.ENDLESS]),
    },
  };
};

export interface LeaderboardEntry {
  name: string;
  score: number;
  difficulty: Difficulty;
  date: string;
  isPlayer?: boolean;
}

type StoredLeaderboardEntry = Omit<LeaderboardEntry, 'isPlayer'>;

const getPlayerName = (): string => {
  try {
    const stored = localStorage.getItem(PLAYER_NAME_KEY);
    const trimmed = stored?.trim();
    return trimmed ? trimmed : 'YOU';
  } catch (e) {
    return 'YOU';
  }
};

const getLeaderboardKey = (difficulty: Difficulty) => `${LEADERBOARD_KEY_PREFIX}${difficulty}`;

const normalizeLeaderboard = (entries: StoredLeaderboardEntry[]): StoredLeaderboardEntry[] => {
  const valid = entries.filter((entry) => (
    entry &&
    typeof entry.name === 'string' &&
    typeof entry.score === 'number' &&
    entry.score >= 0 &&
    typeof entry.difficulty === 'string' &&
    typeof entry.date === 'string'
  ));

  return valid
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aDate = Date.parse(a.date) || 0;
      const bDate = Date.parse(b.date) || 0;
      return bDate - aDate;
    })
    .slice(0, 10);
};

const readLeaderboard = (difficulty: Difficulty): StoredLeaderboardEntry[] => {
  try {
    const raw = localStorage.getItem(getLeaderboardKey(difficulty));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return normalizeLeaderboard(parsed as StoredLeaderboardEntry[]);
  } catch (e) {
    console.warn('Failed to load leaderboard from localStorage:', e);
    return [];
  }
};

const writeLeaderboard = (difficulty: Difficulty, entries: StoredLeaderboardEntry[]) => {
  try {
    localStorage.setItem(getLeaderboardKey(difficulty), JSON.stringify(entries));
  } catch (e) {
    console.warn('Failed to save leaderboard to localStorage:', e);
  }
};

export const statsService = {
  getStats(): GameStats {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return createDefaultStats();
      return normalizeStats(JSON.parse(stored));
    } catch (e) {
      console.warn('Failed to load stats from localStorage:', e);
      return createDefaultStats();
    }
  },

  async getLeaderboard(difficulty: Difficulty): Promise<LeaderboardEntry[]> {
    const playerName = getPlayerName();
    let entries = readLeaderboard(difficulty);

    const stats = this.getStats();
    const playerScore = stats.highScores[GameMode.ENDLESS][difficulty];
    const isInTop = entries.some((e) => e.name === playerName && e.score === playerScore);

    if (playerScore > 0 && !isInTop) {
      entries = normalizeLeaderboard([
        ...entries,
        {
          name: playerName,
          score: playerScore,
          difficulty,
          date: new Date().toISOString(),
        }
      ]);
      writeLeaderboard(difficulty, entries);
    }

    return entries.map((entry) => ({
      ...entry,
      isPlayer: entry.name === playerName,
    }));
  },

  async saveGame(score: number, missed: number, mode: GameMode, difficulty: Difficulty, maxCombo: number): Promise<boolean> {
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
    }

    if (!stats.maxCombos[mode]) {
      stats.maxCombos[mode] = {
        [Difficulty.EASY]: 0,
        [Difficulty.MEDIUM]: 0,
        [Difficulty.HARD]: 0,
      };
    }
    const currentBestCombo = stats.maxCombos[mode]?.[difficulty] || 0;
    if (maxCombo > currentBestCombo) {
      stats.maxCombos[mode][difficulty] = maxCombo;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch (e) {
      console.error('CRITICAL: Failed to save stats to localStorage:', e);
    }

    if (score > 0) {
      const entry: StoredLeaderboardEntry = {
        name: getPlayerName(),
        score,
        difficulty,
        date: new Date().toISOString(),
      };
      const nextEntries = normalizeLeaderboard([
        ...readLeaderboard(difficulty),
        entry,
      ]);
      writeLeaderboard(difficulty, nextEntries);
    }

    return isNewHigh;
  },

  resetStats() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(createDefaultStats()));
    } catch (e) {
      console.warn('Failed to reset stats in localStorage:', e);
    }
  }
};
