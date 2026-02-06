/**
 * Power-Up Configuration
 * Defines all available power-ups, their effects, costs, and upgrade paths
 */

export const POWER_UPS = {
  speedBoost: {
    id: 'speedBoost',
    name: 'Speed Boost',
    description: 'Increase movement speed by 15%',
    icon: '⚡',
    maxLevel: 5,
    baseCost: 50,
    costMultiplier: 1.8,
    effect: (level) => ({ speed: 1 + (level * 0.15) })
  },
  shield: {
    id: 'shield',
    name: 'Energy Shield',
    description: 'Gain temporary invincibility after taking damage',
    icon: '🛡️',
    maxLevel: 3,
    baseCost: 75,
    costMultiplier: 2.0,
    effect: (level) => ({ shieldDuration: level * 2 })
  },
  magnet: {
    id: 'magnet',
    name: 'Star Magnet',
    description: 'Auto-collect stars from increased distance',
    icon: '🧲',
    maxLevel: 5,
    baseCost: 60,
    costMultiplier: 1.7,
    effect: (level) => ({ magnetRange: 1.5 + (level * 0.8) })
  },
  scoreMultiplier: {
    id: 'scoreMultiplier',
    name: 'Score Multiplier',
    description: 'Increase score gained from stars',
    icon: '✨',
    maxLevel: 5,
    baseCost: 80,
    costMultiplier: 1.9,
    effect: (level) => ({ multiplier: 1 + (level * 0.25) })
  },
  extraLife: {
    id: 'extraLife',
    name: 'Extra Life',
    description: 'Start each level with +1 life',
    icon: '❤️',
    maxLevel: 3,
    baseCost: 100,
    costMultiplier: 2.5,
    effect: (level) => ({ extraLives: level })
  },
  enemySlow: {
    id: 'enemySlow',
    name: 'Time Dilation',
    description: 'Enemies move 10% slower per level',
    icon: '⏰',
    maxLevel: 4,
    baseCost: 90,
    costMultiplier: 2.0,
    effect: (level) => ({ enemySpeed: 1 - (level * 0.1) })
  },
  starVision: {
    id: 'starVision',
    name: 'Star Vision',
    description: 'See stars through obstacles',
    icon: '👁️',
    maxLevel: 1,
    baseCost: 150,
    costMultiplier: 1.0,
    effect: (level) => ({ vision: true })
  },
  coinMagnet: {
    id: 'coinMagnet',
    name: 'Coin Magnet',
    description: 'Earn 10% more coins per level',
    icon: '💰',
    maxLevel: 3,
    baseCost: 70,
    costMultiplier: 2.2,
    effect: (level) => ({ coinBonus: level * 0.1 })
  }
};

/**
 * Calculate power-up cost based on current level
 * @param {string} powerUpId - Power-up identifier
 * @param {number} currentLevel - Current power-up level
 * @returns {number} Cost to upgrade
 */
export function getPowerUpCost(powerUpId, currentLevel) {
  const powerUp = POWER_UPS[powerUpId];
  if (!powerUp) return 0;
  return Math.floor(powerUp.baseCost * Math.pow(powerUp.costMultiplier, currentLevel));
}

/**
 * Get power-up effect values
 * @param {string} powerUpId - Power-up identifier
 * @param {number} level - Power-up level
 * @returns {Object} Effect object with modifier values
 */
export function getPowerUpEffect(powerUpId, level) {
  const powerUp = POWER_UPS[powerUpId];
  if (!powerUp || level <= 0) return {};
  return powerUp.effect(level);
}
