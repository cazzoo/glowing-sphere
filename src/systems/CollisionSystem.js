/**
 * Collision System
 * Handles collision detection and response for all entities
 */

import * as THREE from 'three';
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
   * Handle enemy-obstacle collision
   * @param {Object} enemy - Enemy entity
   * @param {Object} obstacle - Obstacle entity
   * @returns {boolean} True if collision occurred
   */
  handleEnemyObstacleCollision(enemy, obstacle) {
    // Check if enemy is colliding with obstacle
    const enemyRadius = enemy.radius || 1.0;
    const obstacleWidth = obstacle.width || 2;
    const obstacleDepth = obstacle.depth || 2;
    
    const halfW = obstacleWidth / 2 + enemyRadius;
    const halfD = obstacleDepth / 2 + enemyRadius;
    
    const collision = Math.abs(enemy.position.x - obstacle.position.x) < halfW &&
                     Math.abs(enemy.position.z - obstacle.position.z) < halfD;
    
    if (collision) {
      // Push enemy away from obstacle
      const dx = enemy.position.x - obstacle.position.x;
      const dz = enemy.position.z - obstacle.position.z;
      
      // Determine which side of the obstacle the enemy is on
      const overlapX = halfW - Math.abs(dx);
      const overlapZ = halfD - Math.abs(dz);
      
      let pushDir = new THREE.Vector3();
      
      if (overlapX < overlapZ) {
        // Push on X axis
        pushDir.set(dx > 0 ? 1 : -1, 0, 0);
        enemy.position.x = obstacle.position.x + (dx > 0 ? halfW : -halfW);
      } else {
        // Push on Z axis
        pushDir.set(0, 0, dz > 0 ? 1 : -1);
        enemy.position.z = obstacle.position.z + (dz > 0 ? halfD : -halfD);
      }
      
      // Also reduce enemy velocity when colliding
      enemy.velocity.multiplyScalar(0.3);
      
      // Update enemy mesh position
      if (enemy.mesh) {
        enemy.mesh.position.copy(enemy.position);
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * Handle enemy-enemy collision
   * @param {Object} enemy1 - First enemy entity
   * @param {Object} enemy2 - Second enemy entity
   * @returns {boolean} True if collision occurred
   */
  handleEnemyEnemyCollision(enemy1, enemy2) {
    const radius1 = enemy1.radius || 1.0;
    const radius2 = enemy2.radius || 1.0;
    
    const dx = enemy1.position.x - enemy2.position.x;
    const dz = enemy1.position.z - enemy2.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const minDist = radius1 + radius2;
    
    if (dist < minDist && dist > 0) {
      // Push enemies apart
      const overlap = minDist - dist;
      const pushX = (dx / dist) * overlap * 0.5;
      const pushZ = (dz / dist) * overlap * 0.5;
      
      enemy1.position.x += pushX;
      enemy1.position.z += pushZ;
      enemy2.position.x -= pushX;
      enemy2.position.z -= pushZ;
      
      // Update mesh positions
      if (enemy1.mesh) {
        enemy1.mesh.position.copy(enemy1.position);
      }
      if (enemy2.mesh) {
        enemy2.mesh.position.copy(enemy2.position);
      }
      
      return true;
    }
    
    return false;
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
