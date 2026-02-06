/**
 * Seeded Random Number Generator
 * Provides deterministic random numbers based on a seed for reproducible level generation
 */

export class SeededRandom {
  /**
   * @param {string|number} seed - The seed value for random generation
   */
  constructor(seed) {
    this.seed = this.hashString(seed.toString());
    this.originalSeed = this.seed;
  }

  /**
   * Hash a string to a numeric value
   * @param {string} str - String to hash
   * @returns {number} Hashed numeric value
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash) || 1;
  }

  /**
   * Get next random value between 0 and 1
   * @returns {number} Random value between 0 and 1
   */
  next() {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  /**
   * Get next random float in range
   * @param {number} min - Minimum value (inclusive)
   * @param {number} max - Maximum value (exclusive)
   * @returns {number} Random float in range
   */
  nextFloat(min, max) {
    return min + this.next() * (max - min);
  }

  /**
   * Get next random integer in range
   * @param {number} min - Minimum value (inclusive)
   * @param {number} max - Maximum value (inclusive)
   * @returns {number} Random integer in range
   */
  nextInt(min, max) {
    return Math.floor(this.nextFloat(min, max + 1));
  }

  /**
   * Reset the RNG to its original seed
   */
  reset() {
    this.seed = this.originalSeed;
  }

  /**
   * Create a new RNG with the same seed
   * @returns {SeededRandom} New RNG instance with same seed
   */
  clone() {
    const rng = new SeededRandom(this.originalSeed);
    rng.seed = this.seed;
    return rng;
  }
}
