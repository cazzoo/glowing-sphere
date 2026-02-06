/**
 * Game Constants
 * Centralized configuration values for the game
 */

export const ARENA = {
  WIDTH: 30,
  HEIGHT: 20,
  SHAPES: {
    RECTANGLE: 'rectangle',
    CIRCLE: 'circle',
    OVAL: 'oval',
    DIAMOND: 'diamond',
    OCTAGON: 'octagon',
    CROSS: 'cross',
    ROUNDED_RECT: 'rounded_rect',
    HEXAGON: 'hexagon'
  },
  // Get arena shape based on level
  getShapeForLevel(level) {
    const shapes = [
      this.SHAPES.RECTANGLE,
      this.SHAPES.OVAL,
      this.SHAPES.DIAMOND,
      this.SHAPES.HEXAGON,
      this.SHAPES.CIRCLE,
      this.SHAPES.OCTAGON,
      this.SHAPES.CROSS,
      this.SHAPES.ROUNDED_RECT
    ];
    // Every 5 levels is a special octagon level
    if (level % 5 === 0) return this.SHAPES.OCTAGON;
    // Otherwise cycle through shapes based on level
    return shapes[(level - 1) % shapes.length];
  }
};

export const PLAYER = {
  RADIUS: 0.8,
  ACCELERATION: 0.18,
  FRICTION: 0.985,
  MAX_SPEED: 0.25,
  DASH_SPEED_BOOST: 2.0,
  DASH_DURATION: 0.3,
  DASH_COOLDOWN: 1.5,
  HANDBRAKE_FRICTION: 0.92,
  HANDBRAKE_DURATION: 0.6
};

export const ENEMY = {
  BASE_RADIUS: 1.1,
  ADDITIONAL_RADIUS: 0.9,
  BASE_SPEED: 0.08,
  BASE_ACCELERATION: 0.04,
  BASE_PUSH_FORCE: 0.9
};

export const STAR = {
  RADIUS: 0.5,
  BASE_SCORE: 100,
  COLLECT_RANGE: 1.3
};

export const COLLISION = {
  INVINCIBILITY_DURATION: 2.0,
  PUSH_FORCE: 0.5
};

export const CAMERA = {
  DEFAULT_HEIGHT: 25,
  MIN_HEIGHT: 15,
  MAX_HEIGHT: 35,
  ZOOM_SPEED: 0.15,
  FOLLOW_SMOOTH: 0.05
};

export const GAMEPAD = {
  DEADZONE: 0.15,
  DPAD_COOLDOWN: 200,
  BUTTONS: {
    A: 0,
    B: 1,
    X: 2,
    Y: 3,
    L1: 4,
    R1: 5,
    L2: 6,
    R2: 7,
    SELECT: 8,
    START: 9,
    UP: 12,
    DOWN: 13,
    LEFT: 14,
    RIGHT: 15
  }
};

export const INPUT_DEVICE = {
  KEYBOARD: 'keyboard',
  GAMEPAD: 'gamepad',
  TOUCH: 'touch',
  SWITCH_COOLDOWN: 1000
};

export const STORAGE = {
  PROGRESS_KEY: 'glowingSphereProgress',
  VERSION: '1.0'
};

export const REWARDS = {
  BASE_COINS: 10,
  COINS_PER_LEVEL: 5,
  TIME_BONUS_MULTIPLIER: 2,
  LIVES_BONUS: 10,
  MIN_COINS: 5,
  TARGET_TIME_BASE: 60,
  TARGET_TIME_PER_LEVEL: 10
};
