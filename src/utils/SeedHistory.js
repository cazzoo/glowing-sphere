/**
 * Seed History Manager
 * Manages storage and retrieval of seed history for replay functionality
 */

const MAX_SEED_HISTORY = 10;
const STORAGE_KEY = 'glowingSphereSeedHistory';

export class SeedHistory {
  /**
   * Get all seed history entries
   * @returns {Array} Array of seed history objects
   */
  static getHistory() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse seed history:', e);
        return [];
      }
    }
    return [];
  }

  /**
   * Save seed history
   * @param {Array} history - Array of seed history objects
   */
  static saveHistory(history) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }

  /**
   * Add a new seed entry to history
   * @param {Object} entry - Seed entry object with properties:
   *   - seed: {string} The seed value
   *   - date: {number} Timestamp
   *   - score: {number} Final score
   *   - success: {boolean} Whether the game was completed successfully
   *   - level: {number} Level reached
   *   - mode: {string} Game mode (campaign, random, sandbox)
   */
  static addEntry(entry) {
    // Don't save campaign seeds (they shouldn't have seeds)
    if (entry.mode === 'campaign') {
      return;
    }

    const history = this.getHistory();
    
    // Add new entry at the beginning
    history.unshift({
      seed: entry.seed || 'Random',
      date: entry.date || Date.now(),
      score: entry.score || 0,
      success: entry.success || false,
      level: entry.level || 1,
      mode: entry.mode || 'random'
    });

    // Keep only the most recent entries
    if (history.length > MAX_SEED_HISTORY) {
      history.splice(MAX_SEED_HISTORY);
    }

    this.saveHistory(history);
  }

  /**
   * Get the last N seed entries
   * @param {number} count - Number of entries to retrieve (max 10)
   * @returns {Array} Array of seed history objects
   */
  static getRecentEntries(count = MAX_SEED_HISTORY) {
    const history = this.getHistory();
    return history.slice(0, Math.min(count, MAX_SEED_HISTORY));
  }

  /**
   * Format date for display
   * @param {number} timestamp - Unix timestamp
   * @returns {string} Formatted date string
   */
  static formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Clear all seed history
   */
  static clearHistory() {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Remove a specific entry from history
   * @param {string} seed - Seed to remove
   */
  static removeEntry(seed) {
    const history = this.getHistory();
    const filtered = history.filter(entry => entry.seed !== seed);
    this.saveHistory(filtered);
  }

  /**
   * Get a specific seed entry
   * @param {string} seed - Seed to find
   * @returns {Object|null} Seed entry object or null if not found
   */
  static getEntry(seed) {
    const history = this.getHistory();
    return history.find(entry => entry.seed === seed) || null;
  }
}
