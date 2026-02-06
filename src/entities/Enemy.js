/**
 * Enemy Entity
 * Manages enemy mesh, AI behavior, and collision handling
 */

import * as THREE from 'three';
import { ENEMY, ARENA } from '../utils/Constants.js';

export class Enemy {
  /**
   * @param {THREE.Scene} scene - Three.js scene
   * @param {number} x - Initial X position
   * @param {number} z - Initial Z position
   * @param {number} level - Current game level
   * @param {boolean} isPrimary - Whether this is the primary enemy
   * @param {number} index - Enemy index (for additional enemies)
   */
  constructor(scene, x, z, level, isPrimary = true, index = 0) {
    this.scene = scene;
    this.level = level;
    this.isPrimary = isPrimary;
    this.index = index;
    
    // Physics state
    this.position = new THREE.Vector3(x, 0, z);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.radius = isPrimary ? ENEMY.BASE_RADIUS : ENEMY.ADDITIONAL_RADIUS;
    
    // AI settings based on level
    this.baseSpeed = ENEMY.BASE_SPEED;
    this.baseAcceleration = ENEMY.BASE_ACCELERATION;
    this.pushForce = ENEMY.BASE_PUSH_FORCE;
    
    // Apply power-up effects to enemy
    this.speedMultiplier = 1.0;
    
    // AI behavior flags
    this.smartBehavior = level >= 2 && isPrimary;
    this.predictPlayer = level >= 4 && isPrimary;
    this.wallHuntMode = level >= 3 && isPrimary;
    
    // For additional enemies
    if (!isPrimary) {
      this.smartBehavior = level >= 5;
      this.predictPlayer = level >= 7;
      this.wallHuntMode = level >= 6;
    }
    
    this.mesh = null;
    this._createMesh();
  }

  /**
   * Create enemy mesh
   * @private
   */
  _createMesh() {
    this.mesh = new THREE.Group();
    
    // Main body
    const bodyGeometry = new THREE.SphereGeometry(this.radius, 24, 24);
    const bodyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        level: { value: this.level }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float level;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vec3 viewDir = normalize(cameraPosition - vPosition);
          float fresnel = pow(1.0 - dot(vNormal, viewDir), 2.0);
          float pulse = sin(time * (5.0 + level * 0.3)) * 0.3 + 0.7;
          vec3 coreColor = mix(vec3(1.0, 0.1, 0.1), vec3(1.0, 0.15, 0.05), level / 10.0);
          vec3 glowColor = mix(vec3(1.0, 0.3, 0.1), vec3(1.0, 0.4, 0.15), level / 10.0);
          vec3 color = mix(coreColor, glowColor, fresnel);
          color *= pulse;
          gl_FragColor = vec4(color, 0.9);
        }
      `,
      transparent: true
    });
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.mesh.add(body);
    
    // Spikes
    const spikeCount = this.isPrimary ? 6 + Math.floor(this.level / 2) : 4;
    for (let i = 0; i < spikeCount; i++) {
      const spikeGeometry = new THREE.ConeGeometry(0.12, 0.6, 4);
      const spikeMaterial = new THREE.MeshBasicMaterial({
        color: this.isPrimary ? 0xff2222 : 0xff4422,
        transparent: true,
        opacity: 0.9
      });
      const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
      const angle = (i / spikeCount) * Math.PI * 2;
      spike.position.x = Math.cos(angle) * (this.radius * 1.05);
      spike.position.z = Math.sin(angle) * (this.radius * 1.05);
      spike.rotation.z = -Math.sin(angle) * Math.PI / 2;
      spike.rotation.x = Math.cos(angle) * Math.PI / 2;
      this.mesh.add(spike);
    }
    
    // Eyes
    for (let i = 0; i < 2; i++) {
      const eyeGeometry = new THREE.SphereGeometry(0.15, 8, 8);
      const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      eye.position.set(i === 0 ? -0.3 : 0.3, 0.2, 0.8);
      this.mesh.add(eye);
      
      // Pupil
      const pupilGeometry = new THREE.SphereGeometry(0.08, 8, 8);
      const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const pupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
      pupil.position.set(i === 0 ? -0.3 : 0.3, 0.2, 0.92);
      this.mesh.add(pupil);
    }
    
    // Outer glow
    const glowGeometry = new THREE.SphereGeometry(this.radius * 1.4, 16, 16);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec3 vNormal;
        void main() {
          float glow = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          float pulse = sin(time * 4.0) * 0.4 + 0.6;
          gl_FragColor = vec4(1.0, 0.2, 0.1, glow * 0.5 * pulse);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.mesh.add(glow);
    
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);
  }

  /**
   * Update enemy AI and position
   * @param {THREE.Vector3} playerPosition - Player position
   * @param {THREE.Vector3} playerVelocity - Player velocity
   * @param {Array} obstacles - Array of obstacle positions
   * @param {Array} otherEnemies - Array of other enemy positions for separation
   * @param {number} deltaTime - Time delta
   */
  update(playerPosition, playerVelocity, obstacles, otherEnemies, deltaTime) {
    const toPlayer = new THREE.Vector3(
      playerPosition.x - this.position.x,
      0,
      playerPosition.z - this.position.z
    );
    const distToPlayer = toPlayer.length();
    
    // Calculate steering toward player
    if (distToPlayer > 0.1) {
      toPlayer.normalize();
      
      // Predict player movement
      if (this.predictPlayer) {
        const playerSpeed = playerVelocity.length();
        if (playerSpeed > 0.03) {
          const prediction = playerVelocity.clone().multiplyScalar(distToPlayer * (this.isPrimary ? 12 : 10));
          toPlayer.add(prediction).normalize();
        }
      }
      
      // Wall hunt mode - push player toward walls
      if (this.wallHuntMode) {
        this._applyWallHuntMode(toPlayer, playerPosition);
      }
      
      // Obstacle hunting - try to push player toward obstacles
      if (this.smartBehavior && obstacles.length > 0) {
        this._applyObstacleHunting(toPlayer, playerPosition, obstacles);
      }
      
      // Separation from other enemies
      const separationForce = new THREE.Vector3();
      if (this.smartBehavior && otherEnemies.length > 0) {
        this._applySeparation(separationForce, otherEnemies);
      }
      
      // Wall avoidance
      const wallAvoidance = new THREE.Vector3();
      this._applyWallAvoidance(wallAvoidance);
      
      // Combine all forces
      const steering = toPlayer.clone();
      steering.add(separationForce);
      steering.add(wallAvoidance.multiplyScalar(0.2));
      steering.normalize();
      
      // Apply steering to velocity
      const acceleration = this.baseAcceleration * this.speedMultiplier;
      this.velocity.x += steering.x * acceleration;
      this.velocity.z += steering.z * acceleration;
      
      // Limit speed
      const speed = this.velocity.length();
      const maxSpeed = this.baseSpeed * this.speedMultiplier;
      if (speed > maxSpeed) {
        this.velocity.multiplyScalar(maxSpeed / speed);
      }
    }
    
    // Update position
    this.position.add(this.velocity);
    
    // Keep in bounds
    const margin = 1.5;
    const halfWidth = (ARENA?.WIDTH || 30) / 2 - margin;
    const halfHeight = (ARENA?.HEIGHT || 20) / 2 - margin;
    
    this.position.x = Math.max(-halfWidth, Math.min(halfWidth, this.position.x));
    this.position.z = Math.max(-halfHeight, Math.min(halfHeight, this.position.z));
    
    // Update mesh
    this.mesh.position.copy(this.position);
    
    // Rotate to face player
    const toPlayerX = playerPosition.x - this.position.x;
    const toPlayerZ = playerPosition.z - this.position.z;
    const angle = Math.atan2(toPlayerX, toPlayerZ);
    this.mesh.rotation.y = angle;
  }

  /**
   * Apply wall hunt mode behavior
   * @private
   */
  _applyWallHuntMode(steering, playerPosition) {
    const distToLeft = playerPosition.x - (-(ARENA?.WIDTH || 30) / 2);
    const distToRight = (ARENA?.WIDTH || 30) / 2 - playerPosition.x;
    const distToTop = (ARENA?.HEIGHT || 20) / 2 - playerPosition.z;
    const distToBottom = playerPosition.z - (-(ARENA?.HEIGHT || 20) / 2);
    
    const minWallDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
    const threshold = this.isPrimary ? 5 : 4;
    
    if (minWallDist < threshold) {
      if (minWallDist === distToLeft) {
        steering.x -= this.isPrimary ? 0.4 : 0.3;
      } else if (minWallDist === distToRight) {
        steering.x += this.isPrimary ? 0.4 : 0.3;
      } else if (minWallDist === distToTop) {
        steering.z += this.isPrimary ? 0.4 : 0.3;
      } else if (minWallDist === distToBottom) {
        steering.z -= this.isPrimary ? 0.4 : 0.3;
      }
      steering.normalize();
    }
  }

  /**
   * Apply obstacle hunting behavior
   * @private
   */
  _applyObstacleHunting(steering, playerPosition, obstacles) {
    const obstaclePushForce = new THREE.Vector3();
    
    obstacles.forEach(obs => {
      const toObstacle = new THREE.Vector3(
        obs.x - this.position.x,
        0,
        obs.z - this.position.z
      );
      const distToObstacle = toObstacle.length();
      
      if (distToObstacle < 6) {
        const toPlayerFromObstacle = new THREE.Vector3(
          playerPosition.x - obs.x,
          0,
          playerPosition.z - obs.z
        );
        
        const angleToObstacle = Math.atan2(toObstacle.x, toObstacle.z);
        const angleToPlayer = Math.atan2(steering.x, steering.z);
        const angleDiff = Math.abs(angleToObstacle - angleToPlayer);
        
        if (angleDiff < Math.PI / 3 && toPlayerFromObstacle.dot(toObstacle) > 0) {
          obstaclePushForce.add(toObstacle.normalize().multiplyScalar(0.5));
        }
      }
    });
    
    steering.add(obstaclePushForce);
  }

  /**
   * Apply separation behavior from other enemies
   * @private
   */
  _applySeparation(separationForce, otherEnemies) {
    otherEnemies.forEach(otherEnemy => {
      if (otherEnemy === this) return;
      
      const toOther = new THREE.Vector3(
        this.position.x - otherEnemy.position.x,
        0,
        this.position.z - otherEnemy.position.z
      );
      const dist = toOther.length();
      
      if (dist < 4 && dist > 0) {
        separationForce.add(toOther.normalize().multiplyScalar(0.3));
      }
    });
  }

  /**
   * Apply wall avoidance
   * @private
   */
  _applyWallAvoidance(wallAvoidance) {
    const margin = 1.5;
    const halfWidth = (ARENA?.WIDTH || 30) / 2;
    const halfHeight = (ARENA?.HEIGHT || 20) / 2;
    
    if (this.position.x < -halfWidth + margin) wallAvoidance.x += 0.3;
    if (this.position.x > halfWidth - margin) wallAvoidance.x -= 0.3;
    if (this.position.z < -halfHeight + margin) wallAvoidance.z += 0.3;
    if (this.position.z > halfHeight - margin) wallAvoidance.z -= 0.3;
  }

  /**
   * Update shader uniforms
   * @param {number} time - Current time
   */
  updateShaders(time) {
    this.mesh.children.forEach(child => {
      if (child.material.uniforms) {
        if (child.material.uniforms.time) {
          child.material.uniforms.time.value = time;
        }
        if (child.material.uniforms.level) {
          child.material.uniforms.level.value = this.level;
        }
      }
    });
  }

  /**
   * Set speed multiplier (from power-ups)
   * @param {number} multiplier - Speed multiplier
   */
  setSpeedMultiplier(multiplier) {
    this.speedMultiplier = multiplier;
  }

  /**
   * Get push force based on level
   * @returns {number} Push force magnitude
   */
  getPushForce() {
    return this.pushForce + this.level * 0.1;
  }

  /**
   * Get velocity direction
   * @returns {THREE.Vector3} Normalized velocity direction
   */
  getVelocityDirection() {
    const dir = this.velocity.clone();
    if (dir.length() > 0.01) {
      return dir.normalize();
    }
    return new THREE.Vector3(0, 0, 0);
  }

  /**
   * Cleanup resources
   */
  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.children.forEach(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }
}
