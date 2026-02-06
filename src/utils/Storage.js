/**
 * Storage Manager
 * Handles localStorage operations for player progress persistence
 */

import { STORAGE } from './Constants.js';

/**
 * Default player progress structure
 */
const DEFAULT_PROGRESS = {
  coins: 0,
  powerUps: {},
  activePowerUps: [],
  maxPowerUpSlots: 3,
  highScores: {},
  totalLevelsCompleted: 0
};

export class Storage {
  /**
   * Save player progress to localStorage
   * @param {Object} progress - Player progress data
   */
  static saveProgress(progress) {
    try {
      const saveData = {
        coins: progress.coins,
        powerUps: progress.powerUps,
        activePowerUps: progress.activePowerUps,
        highScores: progress.highScores,
        totalLevelsCompleted: progress.totalLevelsCompleted,
        version: STORAGE.VERSION
      };
      localStorage.setItem(STORAGE.PROGRESS_KEY, JSON.stringify(saveData));
      return true;
    } catch (error) {
      console.error('Failed to save progress:', error);
      return false;
    }
  }

  /**
   * Load player progress from localStorage
   * @returns {Object} Player progress data
   */
  static loadProgress() {
    try {
      const saved = localStorage.getItem(STORAGE.PROGRESS_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        return {
          ...DEFAULT_PROGRESS,
          ...data
        };
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
    return { ...DEFAULT_PROGRESS };
  }

  /**
   * Clear all saved progress
   */
  static resetProgress() {
    try {
      localStorage.removeItem(STORAGE.PROGRESS_KEY);
      return true;
    } catch (error) {
      console.error('Failed to reset progress:', error);
      return false;
    }
  }

  /**
   * Check if saved progress exists
   * @returns {boolean} True if save data exists
   */
  static hasSavedProgress() {
    return localStorage.getItem(STORAGE.PROGRESS_KEY) !== null;
  }

  /**
   * Export save data as JSON string
   * @returns {string|null} JSON string of save data or null
   */
  static exportSave() {
    try {
      const saved = localStorage.getItem(STORAGE.PROGRESS_KEY);
      return saved;
    } catch (error) {
      console.error('Failed to export save:', error);
      return null;
    }
  }

  /**
   * Import save data from JSON string
   * @param {string} jsonData - JSON string of save data
   * @returns {boolean} True if import was successful
   */
  static importSave(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      if (data.version === STORAGE.VERSION) {
        localStorage.setItem(STORAGE.PROGRESS_KEY, jsonData);
        return true;
      }
      console.warn('Save version mismatch');
      return false;
    } catch (error) {
      console.error('Failed to import save:', error);
      return false;
    }
  }
}
