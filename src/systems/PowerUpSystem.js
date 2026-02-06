/**
 * Power-Up System
 * Manages power-ups, upgrades, and effects
 */

import { POWER_UPS, getPowerUpCost, getPowerUpEffect } from '../config/PowerUpConfig.js';
import { Storage } from '../utils/Storage.js';

export class PowerUpSystem {
  constructor() {
    this.progress = Storage.loadProgress();
    this.activeEffects = {};
  }

  /**
   * Get current player progress
   * @returns {Object} Player progress data
   */
  getProgress() {
    return { ...this.progress };
  }

  /**
   * Save current progress
   */
  saveProgress() {
    Storage.saveProgress(this.progress);
  }

  /**
   * Reset all progress
   */
  resetProgress() {
    Storage.resetProgress();
    this.progress = Storage.loadProgress();
  }

  /**
   * Get power-up level
   * @param {string} powerUpId - Power-up identifier
   * @returns {number} Current level
   */
  getPowerUpLevel(powerUpId) {
    return this.progress.powerUps[powerUpId] || 0;
  }

  /**
   * Check if power-up can be purchased
   * @param {string} powerUpId - Power-up identifier
   * @returns {boolean} True if purchasable
   */
  canPurchasePowerUp(powerUpId) {
    const powerUp = POWER_UPS[powerUpId];
    if (!powerUp) return false;
    
    const currentLevel = this.getPowerUpLevel(powerUpId);
    if (currentLevel >= powerUp.maxLevel) return false;
    
    const cost = getPowerUpCost(powerUpId, currentLevel);
    return this.progress.coins >= cost;
  }

  /**
   * Purchase power-up upgrade
   * @param {string} powerUpId - Power-up identifier
   * @returns {boolean} True if purchase successful
   */
  purchasePowerUp(powerUpId) {
    if (!this.canPurchasePowerUp(powerUpId)) return false;
    
    const currentLevel = this.getPowerUpLevel(powerUpId);
    const cost = getPowerUpCost(powerUpId, currentLevel);
    
    this.progress.coins -= cost;
    this.progress.powerUps[powerUpId] = currentLevel + 1;
    
    this.saveProgress();
    return true;
  }

  /**
   * Check if power-up is owned
   * @param {string} powerUpId - Power-up identifier
   * @returns {boolean} True if owned
   */
  isPowerUpOwned(powerUpId) {
    return this.getPowerUpLevel(powerUpId) > 0;
  }

  /**
   * Check if power-up is equipped
   * @param {string} powerUpId - Power-up identifier
   * @returns {boolean} True if equipped
   */
  isPowerUpEquipped(powerUpId) {
    return this.progress.activePowerUps.includes(powerUpId);
  }

  /**
   * Check if power-up can be equipped
   * @param {string} powerUpId - Power-up identifier
   * @returns {boolean} True if can be equipped
   */
  canEquipPowerUp(powerUpId) {
    if (!this.isPowerUpOwned(powerUpId)) return false;
    if (this.isPowerUpEquipped(powerUpId)) return false;
    if (this.progress.activePowerUps.length >= this.progress.maxPowerUpSlots) return false;
    return true;
  }

  /**
   * Equip power-up
   * @param {string} powerUpId - Power-up identifier
   * @returns {boolean} True if equipped successfully
   */
  equipPowerUp(powerUpId) {
    if (!this.canEquipPowerUp(powerUpId)) return false;
    
    this.progress.activePowerUps.push(powerUpId);
    this.saveProgress();
    return true;
  }

  /**
   * Unequip power-up
   * @param {string} powerUpId - Power-up identifier
   * @returns {boolean} True if unequipped successfully
   */
  unequipPowerUp(powerUpId) {
    const index = this.progress.activePowerUps.indexOf(powerUpId);
    if (index > -1) {
      this.progress.activePowerUps.splice(index, 1);
      this.saveProgress();
      return true;
    }
    return false;
  }

  /**
   * Apply all equipped power-up effects
   */
  applyPowerUpEffects() {
    this.activeEffects = {};
    
    this.progress.activePowerUps.forEach(powerUpId => {
      const level = this.getPowerUpLevel(powerUpId);
      if (level > 0) {
        const effect = getPowerUpEffect(powerUpId, level);
        Object.assign(this.activeEffects, effect);
      }
    });
  }

  /**
   * Get active power-up effects
   * @returns {Object} Active effects
   */
  getActiveEffects() {
    return { ...this.activeEffects };
  }

  /**
   * Get all power-ups configuration
   * @returns {Object} Power-ups configuration
   */
  getPowerUpsConfig() {
    return POWER_UPS;
  }

  /**
   * Get power-up data for UI display
   * @param {string} powerUpId - Power-up identifier
   * @returns {Object|null} Power-up data or null
   */
  getPowerUpData(powerUpId) {
    const powerUp = POWER_UPS[powerUpId];
    if (!powerUp) return null;
    
    const level = this.getPowerUpLevel(powerUpId);
    const isOwned = level > 0;
    const isEquipped = this.isPowerUpEquipped(powerUpId);
    const cost = getPowerUpCost(powerUpId, level);
    
    return {
      ...powerUp,
      level,
      isOwned,
      isEquipped,
      cost,
      canPurchase: this.canPurchasePowerUp(powerUpId),
      canEquip: this.canEquipPowerUp(powerUpId),
      isMaxLevel: level >= powerUp.maxLevel
    };
  }

  /**
   * Get all power-ups data for UI
   * @returns {Array} Array of power-up data
   */
  getAllPowerUpsData() {
    return Object.keys(POWER_UPS).map(id => this.getPowerUpData(id));
  }

  /**
   * Get coin count
   * @returns {number} Current coins
   */
  getCoins() {
    return this.progress.coins;
  }

  /**
   * Add coins
   * @param {number} amount - Amount to add
   */
  addCoins(amount) {
    this.progress.coins += amount;
  }

  /**
   * Spend coins
   * @param {number} amount - Amount to spend
   * @returns {boolean} True if successful
   */
  spendCoins(amount) {
    if (this.progress.coins < amount) return false;
    this.progress.coins -= amount;
    return true;
  }

  /**
   * Get active power-ups count
   * @returns {number} Number of active power-ups
   */
  getActivePowerUpsCount() {
    return this.progress.activePowerUps.length;
  }

  /**
   * Get max power-up slots
   * @returns {number} Max slots
   */
  getMaxPowerUpSlots() {
    return this.progress.maxPowerUpSlots;
  }

  /**
   * Get high score for level
   * @param {number} level - Level number
   * @returns {number} High score
   */
  getHighScore(level) {
    const levelKey = `level_${level}`;
    return this.progress.highScores[levelKey] || 0;
  }

  /**
   * Set high score for level
   * @param {number} level - Level number
   * @param {number} score - Score
   */
  setHighScore(level, score) {
    const levelKey = `level_${level}`;
    if (!this.progress.highScores[levelKey] || score > this.progress.highScores[levelKey]) {
      this.progress.highScores[levelKey] = score;
    }
  }

  /**
   * Get total levels completed
   * @returns {number} Total completed levels
   */
  getTotalLevelsCompleted() {
    return this.progress.totalLevelsCompleted;
  }

  /**
   * Increment levels completed
   */
  incrementLevelsCompleted() {
    this.progress.totalLevelsCompleted++;
  }

  /**
   * Get starting lives based on power-ups
   * @returns {number} Starting lives
   */
  getStartingLives() {
    return 3 + (this.activeEffects.extraLives || 0);
  }
}
