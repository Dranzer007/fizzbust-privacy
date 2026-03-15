export enum GameState {
  LOADING = 'LOADING',
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  LEVEL_SELECT = 'LEVEL_SELECT',
  STATS = 'STATS',
  LEADERBOARD = 'LEADERBOARD',
  PAUSED = 'PAUSED',
  SETTINGS = 'SETTINGS'
}

export enum GameMode {
  ENDLESS = 'ENDLESS'
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export enum BottleType {
  LEMON = 'LEMON',
  ORANGE = 'ORANGE',
  CHERRY = 'CHERRY',
  GRAPE = 'GRAPE',
  LIME = 'LIME',
  BLUE_RASPBERRY = 'BLUE_RASPBERRY',
  STRAWBERRY = 'STRAWBERRY',
  COLA = 'COLA',
  GOLDEN = 'GOLDEN',
  PUZZLE = 'PUZZLE',
  TROPICAL = 'TROPICAL',
  FROSTY = 'FROSTY',
  THUNDER = 'THUNDER'
}

export enum MovementType {
  RIGHT_TO_LEFT = 'RIGHT_TO_LEFT',
  LEFT_TO_RIGHT = 'LEFT_TO_RIGHT',
  RANDOM_THROW = 'RANDOM_THROW',
  FALLING = 'FALLING'
}

export interface BottleData {
  id: string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  type: BottleType;
  movementType: MovementType;
  color: string;
  isOpened: boolean;
  isBursting?: boolean;
  missed?: boolean;
  size: number;
  rotation?: number;
  angularVelocity?: number;
  bobOffset?: number;
}

export interface GameConfig {
  speed: number;
  spawnRate: number;
  targetScore: number;
  movementTypes: MovementType[];
  bottleTypeProbabilities: Record<BottleType, number>;
  laneCount: number;
  verticalLaneCount: number;
  bottleLimit: number;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, GameConfig> = {
  [Difficulty.EASY]: {
    speed: 1.6,
    spawnRate: 1550,
    targetScore: 10,
    movementTypes: [MovementType.RIGHT_TO_LEFT],
    bottleTypeProbabilities: {
      [BottleType.LEMON]: 0.3,
      [BottleType.ORANGE]: 0.3,
      [BottleType.CHERRY]: 0.2,
      [BottleType.COLA]: 0.2,
      [BottleType.LIME]: 0,
      [BottleType.GRAPE]: 0,
      [BottleType.BLUE_RASPBERRY]: 0,
      [BottleType.STRAWBERRY]: 0,
      [BottleType.GOLDEN]: 0,
      [BottleType.PUZZLE]: 0,
      [BottleType.TROPICAL]: 0,
      [BottleType.FROSTY]: 0,
      [BottleType.THUNDER]: 0,
    },
    laneCount: 3,
    verticalLaneCount: 0,
    bottleLimit: 7,
  },
  [Difficulty.MEDIUM]: {
    speed: 2.6,
    spawnRate: 1250,
    targetScore: 20,
    movementTypes: [MovementType.RIGHT_TO_LEFT, MovementType.LEFT_TO_RIGHT],
    bottleTypeProbabilities: {
      [BottleType.LEMON]: 0.16,
      [BottleType.ORANGE]: 0.16,
      [BottleType.CHERRY]: 0.11,
      [BottleType.LIME]: 0.11,
      [BottleType.GRAPE]: 0.11,
      [BottleType.BLUE_RASPBERRY]: 0.11,
      [BottleType.STRAWBERRY]: 0.11,
      [BottleType.COLA]: 0.11,
      [BottleType.GOLDEN]: 0.02,
      [BottleType.PUZZLE]: 0,
      [BottleType.TROPICAL]: 0,
      [BottleType.FROSTY]: 0,
      [BottleType.THUNDER]: 0,
    },
    laneCount: 6,
    verticalLaneCount: 0,
    bottleLimit: 10,
  },
  [Difficulty.HARD]: {
    speed: 3.2,
    spawnRate: 1100,
    targetScore: 30,
    movementTypes: [MovementType.RIGHT_TO_LEFT, MovementType.LEFT_TO_RIGHT, MovementType.RANDOM_THROW, MovementType.FALLING],
    bottleTypeProbabilities: {
      [BottleType.LEMON]: 0.08,
      [BottleType.ORANGE]: 0.08,
      [BottleType.CHERRY]: 0.08,
      [BottleType.LIME]: 0.08,
      [BottleType.GRAPE]: 0.08,
      [BottleType.BLUE_RASPBERRY]: 0.08,
      [BottleType.STRAWBERRY]: 0.08,
      [BottleType.COLA]: 0.08,
      [BottleType.GOLDEN]: 0.04,
      [BottleType.PUZZLE]: 0,
      [BottleType.TROPICAL]: 0.08,
      [BottleType.FROSTY]: 0.08,
      [BottleType.THUNDER]: 0.08,
    },
    laneCount: 6,
    verticalLaneCount: 5,
    bottleLimit: 12,
  },
};
