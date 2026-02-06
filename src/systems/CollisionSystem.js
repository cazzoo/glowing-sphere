/**
 * Collision System
 * Handles collision detection and response for all entities
 */

import { COLLISION } from '../utils/Constants.js';

export class CollisionSystem {
  constructor() {
    this.invincibilityTime = 0;
    this.shieldActive = false;
    this.shieldTimeRemaining = 0;
  }

  /**
   * Update collision timers
   * @param {number} deltaTime - Time delta in seconds
   */
  update(deltaTime) {
    this.invincibilityTime = Math.max(0, this.invincibilityTime - deltaTime);
    this.shieldTimeRemaining = Math.max(0, this.shieldTimeRemaining - deltaTime);
    this.shieldActive = this.shieldTimeRemaining > 0;
  }

  /**
   * Check circle collision
   * @param {THREE.Vector3} pos1 - First position
   * @param {number} radius1 - First radius
   * @param {THREE.Vector3} pos2 - Second position
   * @param {number} radius2 - Second radius
   * @returns {boolean} True if collision
   */
  checkCircleCollision(pos1, radius1, pos2, radius2) {
    const dx = pos1.x - pos2.x;
    const dz = pos1.z - pos2.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    return dist < radius1 + radius2;
  }

  /**
   * Check box collision
   * @param {THREE.Vector3} pos1 - Circle position
   * @param {number} radius1 - Circle radius
   * @param {THREE.Vector3} pos2 - Box position
   * @param {number} width - Box width
   * @param {number} depth - Box depth
   * @returns {boolean} True if collision
   */
  checkBoxCollision(pos1, radius1, pos2, width, depth) {
    const halfW = width / 2 + radius1;
    const halfD = depth / 2 + radius1;
    
    return Math.abs(pos1.x - pos2.x) < halfW &&
           Math.abs(pos1.z - pos2.z) < halfD;
  }

  /**
   * Handle player-obstacle collision
   * @param {Object} player - Player entity
   * @param {Object} obstacle - Obstacle entity
   * @param {Function} onDamage - Callback when player takes damage
   * @returns {boolean} True if collision occurred
   */
  handlePlayerObstacleCollision(player, obstacle, onDamage) {
    if (this.invincibilityTime > 0 || this.shieldActive) return false;
    
    if (obstacle.checkCollision(player.position, player.radius)) {
      // Check if shield should activate
      if (this.shieldTimeRemaining <= 0 && !this.shieldActive) {
        onDamage(false); // Normal damage
      } else {
        onDamage(true); // Shield damage
      }
      
      this.invincibilityTime = COLLISION.INVINCIBILITY_DURATION;
      
      // Push player back
      const dx = player.position.x - obstacle.position.x;
      const dz = player.position.z - obstacle.position.z;
      const len = Math.sqrt(dx * dx + dz * dz) || 1;
      player.push(new THREE.Vector3(dx / len, 0, dz / len), COLLISION.PUSH_FORCE);
      
      return true;
    }
    return false;
  }

  /**
   * Handle player-enemy collision
   * @param {Object} player - Player entity
   * @param {Object} enemy - Enemy entity
   * @param {Function} onDamage - Callback when player takes damage
   * @returns {boolean} True if collision occurred
   */
  handlePlayerEnemyCollision(player, enemy, onDamage) {
    if (this.invincibilityTime > 0 || this.shieldActive) return false;
    
    if (this.checkCircleCollision(player.position, player.radius, enemy.position, enemy.radius)) {
      // Check if shield should activate
      if (this.shieldTimeRemaining <= 0 && !this.shieldActive) {
        onDamage(false);
      } else {
        onDamage(true);
      }
      
      this.invincibilityTime = COLLISION.INVINCIBILITY_DURATION;
      
      // Push player in enemy's movement direction
      const pushDir = enemy.getVelocityDirection();
      if (pushDir.length() > 0.01) {
        player.push(pushDir, enemy.getPushForce());
      } else {
        // If enemy isn't moving, push away from enemy
        const awayFromEnemy = new THREE.Vector3(
          player.position.x - enemy.position.x,
          0,
          player.position.z - enemy.position.z
        ).normalize();
        player.push(awayFromEnemy, enemy.getPushForce() * 0.8);
      }
      
      return true;
    }
    return false;
  }

  /**
   * Handle player-star collection
   * @param {Object} player - Player entity
   * @param {Object} star - Star entity
   * @param {number} magnetRange - Additional magnet range
   * @returns {boolean} True if star collected
   */
  handlePlayerStarCollection(player, star, magnetRange = 0) {
    if (star.checkCollection(player.position, player.radius, magnetRange)) {
      star.collect();
      return true;
    }
    return false;
  }

  /**
   * Activate shield
   * @param {number} duration - Shield duration in seconds
   */
  activateShield(duration) {
    this.shieldTimeRemaining = duration;
    this.shieldActive = true;
  }

  /**
   * Check if player is invincible
   * @returns {boolean} True if invincible
   */
  isInvincible() {
    return this.invincibilityTime > 0 || this.shieldActive;
  }

  /**
   * Get remaining invincibility time
   * @returns {number} Remaining time in seconds
   */
  getInvincibilityTime() {
    return this.invincibilityTime;
  }

  /**
   * Get remaining shield time
   * @returns {number} Remaining shield time in seconds
   */
  getShieldTime() {
    return this.shieldTimeRemaining;
  }

  /**
   * Check if shield is active
   * @returns {boolean} True if shield active
   */
  isShieldActive() {
    return this.shieldActive;
  }

  /**
   * Reset collision state
   */
  reset() {
    this.invincibilityTime = 0;
    this.shieldActive = false;
    this.shieldTimeRemaining = 0;
  }
}
