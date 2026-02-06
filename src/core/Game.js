/**
 * Game - Main Game Class
 * Orchestrates all game systems and manages game state
 */

import * as THREE from 'three';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Star } from '../entities/Star.js';
import { Obstacle, MovingWall } from '../entities/Obstacle.js';
import { InputSystem } from '../systems/InputSystem.js';
import { PowerUpSystem } from '../systems/PowerUpSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { SeededRandom } from '../utils/SeededRandom.js';
import { STORAGE, REWARDS, ARENA } from '../utils/Constants.js';

export class Game {
  constructor(canvas) {
    // Core three.js objects
    this.canvas = canvas;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    
    // Game state
    this.state = {
      score: 0,
      lives: 3,
      level: 1,
      starsCollected: 0,
      totalStars: 0,
      isGameOver: false,
      isLevelComplete: false,
      seed: null,
      rng: null,
      levelStartTime: 0,
      levelCompletionTime: 0,
      coinsEarned: 0,
      activePowerUpEffects: {}
    };
    
    // Entities
    this.player = null;
    this.enemies = [];
    this.stars = [];
    this.obstacles = [];
    this.movingWalls = [];
    this.walls = [];
    this.floor = null;
    
    // Systems
    this.inputSystem = new InputSystem();
    this.powerUpSystem = new PowerUpSystem();
    this.collisionSystem = new CollisionSystem();
    
    // Animation
    this.isRunning = false;
    this.animationId = null;
    
    // Callbacks
    this.onScoreChange = null;
    this.onLivesChange = null;
    this.onLevelComplete = null;
    this.onGameOver = null;
    this.onStarCollected = null;
    this.onShieldStatusChange = null;
    this.onDashStatusChange = null;
    
    this._init();
  }

  /**
   * Initialize game
   * @private
   */
  _init() {
    this._setupRenderer();
    this._setupScene();
    this._setupCamera();
    this._setupFloor();
    this._setupEventListeners();
    
    // Load progress and apply power-up effects
    this.powerUpSystem.applyPowerUpEffects();
    this.state.activePowerUpEffects = this.powerUpSystem.getActiveEffects();
    
    // Set starting lives
    this.state.lives = this.powerUpSystem.getStartingLives();
  }

  /**
   * Setup renderer
   * @private
   */
  _setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x000000, 0);
    this.canvas.appendChild(this.renderer.domElement);
  }

  /**
   * Setup scene
   * @private
   */
  _setupScene() {
    this.scene = new THREE.Scene();
  }

  /**
   * Setup camera
   * @private
   */
  _setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 25, 15);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * Setup floor
   * @private
   */
  _setupFloor() {
    const geometry = new THREE.PlaneGeometry(ARENA.WIDTH, ARENA.HEIGHT, 30, 20);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        level: { value: 1 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float level;
        varying vec2 vUv;
        void main() {
          vec2 grid = abs(fract(vUv * vec2(30.0, 20.0) - 0.5) - 0.5) / fwidth(vUv * vec2(30.0, 20.0));
          float line = min(grid.x, grid.y);
          float glow = 1.0 - min(line, 1.0);
          float pulse = sin(time * 2.0) * 0.3 + 0.7;
          
          vec3 baseColor = mix(vec3(0.05, 0.05, 0.15), vec3(0.1, 0.05, 0.15), level / 10.0);
          vec3 gridColor = mix(vec3(0.2, 0.3, 0.5), vec3(0.4, 0.2, 0.5), level / 10.0);
          
          vec3 color = mix(baseColor, gridColor, glow * pulse * 0.3);
          gl_FragColor = vec4(color, 1.0);
        }
      `
    });
    
    this.floor = new THREE.Mesh(geometry, material);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = -2;
    this.scene.add(this.floor);
  }

  /**
   * Setup boundary walls
   * @private
   */
  _setupWalls(level) {
    // Clear existing walls
    this.walls.forEach(w => this.scene.remove(w));
    this.walls = [];
    
    const wallMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        level: { value: level }
      },
      vertexShader: `
        varying vec3 vPosition;
        void main() {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float level;
        varying vec3 vPosition;
        void main() {
          float pulse = sin(time * (3.0 + level * 0.5) + vPosition.x * 0.5) * 0.3 + 0.7;
          vec3 color = mix(vec3(1.0, 0.2, 0.3), vec3(1.0, 0.4, 0.2), level / 10.0) * pulse;
          float edge = smoothstep(0.8, 1.0, abs(vPosition.x / 0.5));
          color += vec3(1.0, 0.5, 0.5) * edge;
          gl_FragColor = vec4(color, 0.8);
        }
      `,
      transparent: true
    });
    
    // Create 4 walls
    const positions = [
      { x: 0, z: -ARENA.HEIGHT/2 - 1, w: ARENA.WIDTH + 2, d: 2 },
      { x: 0, z: ARENA.HEIGHT/2 + 1, w: ARENA.WIDTH + 2, d: 2 },
      { x: -ARENA.WIDTH/2 - 1, z: 0, w: 2, d: ARENA.HEIGHT + 2 },
      { x: ARENA.WIDTH/2 + 1, z: 0, w: 2, d: ARENA.HEIGHT + 2 }
    ];
    
    positions.forEach(pos => {
      const geometry = new THREE.BoxGeometry(pos.w, 2, pos.d);
      const wall = new THREE.Mesh(geometry, wallMaterial.clone());
      wall.position.set(pos.x, 0, pos.z);
      this.scene.add(wall);
      this.walls.push(wall);
    });
  }

  /**
   * Setup event listeners
   * @private
   */
  _setupEventListeners() {
    window.addEventListener('resize', () => this._handleResize());
  }

  /**
   * Handle window resize
   * @private
   */
  _handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Generate level
   * @param {number} level - Level number
   * @param {string|null} seed - Level seed (null for random)
   */
  generateLevel(level, seed = null) {
    // Clear existing entities
    this._clearLevel();
    
    // Update state
    this.state.level = level;
    this.state.levelStartTime = Date.now();
    this.state.starsCollected = 0;
    this.state.isLevelComplete = false;
    
    // Set seed
    if (seed) {
      this.state.seed = seed;
    } else if (!this.state.seed) {
      this.state.seed = Math.random().toString(36).substring(2, 10);
    }
    
    this.state.rng = new SeededRandom(this.state.seed + '_' + level);
    
    // Update floor
    this.floor.material.uniforms.level.value = level;
    this._setupWalls(level);
    
    // Create player
    this.player = new Player(this.scene);
    
    // Apply power-up effects to player
    if (this.state.activePowerUpEffects.speed) {
      this.player.setMaxSpeed(0.25 * this.state.activePowerUpEffects.speed);
    }
    
    // Generate stars
    this._generateStars(level);
    
    // Generate obstacles
    this._generateObstacles(level);
    
    // Generate enemies
    this._generateEnemies(level);
    
    // Generate moving walls (level 5+)
    if (level >= 5) {
      this._generateMovingWalls(level);
    }
    
    // Reset collision system
    this.collisionSystem.reset();
  }

  /**
   * Clear level entities
   * @private
   */
  _clearLevel() {
    if (this.player) {
      this.player.dispose();
      this.player = null;
    }
    
    this.enemies.forEach(e => e.dispose());
    this.enemies = [];
    
    this.stars.forEach(s => s.dispose());
    this.stars = [];
    
    this.obstacles.forEach(o => o.dispose());
    this.obstacles = [];
    
    this.movingWalls.forEach(w => w.dispose());
    this.movingWalls = [];
  }

  /**
   * Generate stars
   * @private
   */
  _generateStars(level) {
    const starCount = 5 + Math.floor(level * 1.5);
    this.state.totalStars = starCount;
    
    const starPositions = [];
    
    for (let i = 0; i < starCount; i++) {
      let x, z, valid;
      let attempts = 0;
      
      do {
        valid = true;
        x = this.state.rng.nextFloat(-ARENA.WIDTH/2 + 2, ARENA.WIDTH/2 - 2);
        z = this.state.rng.nextFloat(-ARENA.HEIGHT/2 + 2, ARENA.HEIGHT/2 - 2);
        
        // Check distance from player spawn
        if (Math.sqrt(x * x + z * z) < 4) valid = false;
        
        // Check distance from other stars
        for (const pos of starPositions) {
          const dx = pos.x - x;
          const dz = pos.z - z;
          if (Math.sqrt(dx * dx + dz * dz) < 2.5) valid = false;
        }
        
        attempts++;
      } while (!valid && attempts < 100);
      
      if (valid) {
        starPositions.push({ x, z });
        this.stars.push(new Star(this.scene, x, z));
      }
    }
  }

  /**
   * Generate obstacles
   * @private
   */
  _generateObstacles(level) {
    const obstacleCount = 2 + Math.floor(level * 1.8);
    const obstaclePositions = [];
    
    for (let i = 0; i < obstacleCount; i++) {
      let x, z, valid;
      let attempts = 0;
      
      do {
        valid = true;
        x = this.state.rng.nextFloat(-ARENA.WIDTH/2 + 3, ARENA.WIDTH/2 - 3);
        z = this.state.rng.nextFloat(-ARENA.HEIGHT/2 + 3, ARENA.HEIGHT/2 - 3);
        
        if (Math.sqrt(x * x + z * z) < 6) valid = false;
        
        for (const pos of this.stars) {
          const dx = pos.position.x - x;
          const dz = pos.position.z - z;
          if (Math.sqrt(dx * dx + dz * dz) < 3) valid = false;
        }
        
        for (const pos of obstaclePositions) {
          const dx = pos.x - x;
          const dz = pos.z - z;
          if (Math.sqrt(dx * dx + dz * dz) < 2.5) valid = false;
        }
        
        attempts++;
      } while (!valid && attempts < 100);
      
      if (valid) {
        obstaclePositions.push({ x, z });
        const width = this.state.rng.nextFloat(1, 3.5);
        const depth = this.state.rng.nextFloat(1, 3.5);
        const isMoving = this.state.rng.next() < (0.5 + level * 0.1);
        const moveSpeed = this.state.rng.nextFloat(1.2, 2.5 + level * 0.2);
        const moveRange = this.state.rng.nextFloat(2.5, 5 + level * 0.4);
        const moveAxis = this.state.rng.next() < 0.5 ? 'x' : 'z';
        
        this.obstacles.push(new Obstacle(
          this.scene, x, z, width, depth, 
          isMoving, moveSpeed, moveRange, moveAxis, level
        ));
      }
    }
  }

  /**
   * Generate enemies
   * @private
   */
  _generateEnemies(level) {
    // Primary enemy
    const angle = this.state.rng.nextFloat(0, Math.PI * 2);
    const distance = this.state.rng.nextFloat(10, 13);
    let enemyX = Math.cos(angle) * distance;
    let enemyZ = Math.sin(angle) * distance;
    
    enemyX = Math.max(-ARENA.WIDTH/2 + 2, Math.min(ARENA.WIDTH/2 - 2, enemyX));
    enemyZ = Math.max(-ARENA.HEIGHT/2 + 2, Math.min(ARENA.HEIGHT/2 - 2, enemyZ));
    
    const primaryEnemy = new Enemy(this.scene, enemyX, enemyZ, level, true, 0);
    
    // Apply power-up effects to enemy
    if (this.state.activePowerUpEffects.enemySpeed) {
      primaryEnemy.setSpeedMultiplier(this.state.activePowerUpEffects.enemySpeed);
    }
    
    this.enemies.push(primaryEnemy);
    
    // Additional enemies on higher levels
    const extraEnemyCount = level >= 10 ? 3 : (level >= 7 ? 2 : (level >= 4 ? 1 : 0));
    
    for (let i = 0; i < extraEnemyCount; i++) {
      const exAngle = this.state.rng.nextFloat(0, Math.PI * 2);
      const exDistance = this.state.rng.nextFloat(8, 12);
      let exX = Math.cos(exAngle) * exDistance;
      let exZ = Math.sin(exAngle) * exDistance;
      
      exX = Math.max(-ARENA.WIDTH/2 + 2, Math.min(ARENA.WIDTH/2 - 2, exX));
      exZ = Math.max(-ARENA.HEIGHT/2 + 2, Math.min(ARENA.HEIGHT/2 - 2, exZ));
      
      const enemy = new Enemy(this.scene, exX, exZ, level, false, i + 1);
      
      if (this.state.activePowerUpEffects.enemySpeed) {
        enemy.setSpeedMultiplier(this.state.activePowerUpEffects.enemySpeed);
      }
      
      this.enemies.push(enemy);
    }
  }

  /**
   * Generate moving walls
   * @private
   */
  _generateMovingWalls(level) {
    const movingWallCount = Math.min(2, Math.floor((level - 4) / 2));
    
    for (let i = 0; i < movingWallCount; i++) {
      const isHorizontal = this.state.rng.next() < 0.5;
      const wallLength = this.state.rng.nextFloat(3, 6);
      const wallThickness = 0.8;
      const moveSpeed = this.state.rng.nextFloat(0.8, 1.5 + level * 0.1);
      const moveRange = this.state.rng.nextFloat(3, 6);
      
      let wx, wz;
      if (isHorizontal) {
        wx = this.state.rng.nextFloat(-ARENA.WIDTH/2 + 5, ARENA.WIDTH/2 - 5);
        wz = this.state.rng.next() < 0.5 ? -ARENA.HEIGHT/2 + 3 : ARENA.HEIGHT/2 - 3;
      } else {
        wx = this.state.rng.next() < 0.5 ? -ARENA.WIDTH/2 + 3 : ARENA.WIDTH/2 - 3;
        wz = this.state.rng.nextFloat(-ARENA.HEIGHT/2 + 5, ARENA.HEIGHT/2 - 5);
      }
      
      this.movingWalls.push(new MovingWall(
        this.scene, wx, wz, wallLength, wallThickness,
        isHorizontal, moveSpeed, moveRange, level
      ));
    }
  }

  /**
   * Calculate coins reward
   * @param {number} level - Level number
   * @param {number} timeTaken - Time taken in seconds
   * @returns {number} Coins earned
   */
  calculateCoinsReward(level, timeTaken) {
    let baseCoins = REWARDS.BASE_COINS + (level * REWARDS.COINS_PER_LEVEL);
    
    const targetTime = REWARDS.TARGET_TIME_BASE + (level * REWARDS.TARGET_TIME_PER_LEVEL);
    const timeBonus = Math.max(0, Math.floor((targetTime - timeTaken) * REWARDS.TIME_BONUS_MULTIPLIER));
    
    const livesBonus = this.state.lives * REWARDS.LIVES_BONUS;
    
    let totalCoins = baseCoins + timeBonus + livesBonus;
    
    if (this.state.activePowerUpEffects.coinBonus) {
      totalCoins = Math.floor(totalCoins * (1 + this.state.activePowerUpEffects.coinBonus));
    }
    
    return Math.max(REWARDS.MIN_COINS, totalCoins);
  }

  /**
   * Start game loop
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this._animate();
  }

  /**
   * Stop game loop
   */
  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Main animation loop
   * @private
   */
  _animate() {
    if (!this.isRunning) return;
    
    this.animationId = requestAnimationFrame(() => this._animate());
    
    const deltaTime = 0.016;
    const time = performance.now() / 1000;
    
    // Skip if game over or level complete
    if (this.state.isGameOver || this.state.isLevelComplete) {
      this.renderer.render(this.scene, this.camera);
      return;
    }
    
    // Get input
    const input = this.inputSystem.getInput();
    
    // Update collision system
    this.collisionSystem.update(deltaTime);
    
    // Check if shield should activate on damage
    const checkShieldActivation = (wasShielded) => {
      if (!wasShielded && this.state.activePowerUpEffects.shieldDuration) {
        this.collisionSystem.activateShield(this.state.activePowerUpEffects.shieldDuration);
      }
    };
    
    // Handle damage
    const handleDamage = (wasShielded) => {
      checkShieldActivation(wasShielded);
      this.state.lives--;
      this._emitLivesChange();
      
      if (this.state.lives <= 0) {
        this._gameOver();
      }
    };
    
    // Update player
    if (this.player) {
      // Store previous button states
      const prevDashPressed = this.inputSystem.prevDashPressed;
      const prevBreakPressed = this.inputSystem.prevBreakPressed;
      
      this.player.update(deltaTime, input, this.state.activePowerUpEffects);
      
      // Update stored states
      this.inputSystem.prevDashPressed = input.dashPressed;
      this.inputSystem.prevBreakPressed = input.breakPressed;
      
      // Emit status updates
      this._emitDashStatus();
      this._emitShieldStatus();
    }
    
    // Update walls
    this.walls.forEach(wall => {
      wall.material.uniforms.time.value = time;
    });
    
    // Update floor
    this.floor.material.uniforms.time.value = time;
    
    // Update obstacles
    this.obstacles.forEach(obstacle => {
      obstacle.update(time);
      
      if (this.player) {
        this.collisionSystem.handlePlayerObstacleCollision(
          this.player, obstacle, handleDamage
        );
      }
    });
    
    // Update moving walls
    this.movingWalls.forEach(wall => {
      wall.update(time);
      
      if (this.player) {
        this.collisionSystem.handlePlayerObstacleCollision(
          this.player, wall, handleDamage
        );
      }
    });
    
    // Update stars
    this.stars.forEach(star => {
      star.update(time);
      
      if (this.player && !star.isCollected()) {
        const magnetRange = this.state.activePowerUpEffects.magnetRange || 0;
        if (this.collisionSystem.handlePlayerStarCollection(this.player, star, magnetRange)) {
          this.state.starsCollected++;
          
          // Calculate score
          let baseScore = 100 * this.state.level;
          if (this.state.activePowerUpEffects.multiplier) {
            baseScore = Math.floor(baseScore * this.state.activePowerUpEffects.multiplier);
          }
          this.state.score += baseScore;
          
          this._emitScoreChange();
          this._emitStarCollected();
          
          // Check level complete
          if (this.state.starsCollected >= this.state.totalStars) {
            this.state.score += this.state.lives * 300;
            setTimeout(() => this._levelComplete(), 500);
          }
        }
      }
    });
    
    // Update enemies
    const obstacleData = this.obstacles.map(o => o.getData());
    
    this.enemies.forEach(enemy => {
      if (this.player) {
        enemy.update(
          this.player.position,
          this.player.velocity,
          obstacleData,
          this.enemies,
          deltaTime
        );
        
        enemy.updateShaders(time);
        
        this.collisionSystem.handlePlayerEnemyCollision(
          this.player, enemy, handleDamage
        );
      }
    });
    
    // Update camera
    if (this.player) {
      const targetCamX = this.player.position.x * 0.3;
      const targetCamZ = this.player.position.z * 0.3 + 15;
      const targetCamY = this.player.getCameraHeight();
      
      this.camera.position.x += (targetCamX - this.camera.position.x) * 0.05;
      this.camera.position.y += (targetCamY - this.camera.position.y) * 0.05;
      this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.05;
      this.camera.lookAt(
        this.player.position.x * 0.5,
        0,
        this.player.position.z * 0.5
      );
    }
    
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Handle level complete
   * @private
   */
  _levelComplete() {
    this.state.levelCompletionTime = (Date.now() - this.state.levelStartTime) / 1000;
    this.state.coinsEarned = this.calculateCoinsReward(
      this.state.level,
      this.state.levelCompletionTime
    );
    
    this.powerUpSystem.addCoins(this.state.coinsEarned);
    this.powerUpSystem.incrementLevelsCompleted();
    this.powerUpSystem.setHighScore(this.state.level, this.state.score);
    this.powerUpSystem.saveProgress();
    
    this.state.isLevelComplete = true;
    
    if (this.onLevelComplete) {
      this.onLevelComplete({
        score: this.state.score,
        time: this.state.levelCompletionTime,
        coins: this.state.coinsEarned
      });
    }
  }

  /**
   * Handle game over
   * @private
   */
  _gameOver() {
    this.state.isGameOver = true;
    
    if (this.onGameOver) {
      this.onGameOver({
        score: this.state.score,
        level: this.state.level
      });
    }
  }

  /**
   * Emit score change event
   * @private
   */
  _emitScoreChange() {
    if (this.onScoreChange) {
      this.onScoreChange(this.state.score);
    }
  }

  /**
   * Emit lives change event
   * @private
   */
  _emitLivesChange() {
    if (this.onLivesChange) {
      this.onLivesChange(this.state.lives);
    }
  }

  /**
   * Emit star collected event
   * @private
   */
  _emitStarCollected() {
    if (this.onStarCollected) {
      this.onStarCollected(
        this.state.starsCollected,
        this.state.totalStars
      );
    }
  }

  /**
   * Emit shield status change
   * @private
   */
  _emitShieldStatus() {
    if (this.onShieldStatusChange) {
      this.onShieldStatusChange(
        this.collisionSystem.isShieldActive(),
        this.collisionSystem.getShieldTime()
      );
    }
  }

  /**
   * Emit dash status change
   * @private
   */
  _emitDashStatus() {
    if (this.onDashStatusChange && this.player) {
      this.onDashStatusChange(
        this.player.dashActive,
        this.player.dashCooldownRemaining,
        this.player.handbrakeActive,
        this.player.handbrakeCooldownRemaining
      );
    }
  }

  /**
   * Restart game with new seed
   * @param {string|null} seed - New seed or null for random
   */
  restartGame(seed = null) {
    this.powerUpSystem.applyPowerUpEffects();
    this.state.activePowerUpEffects = this.powerUpSystem.getActiveEffects();
    
    this.state.score = 0;
    this.state.lives = this.powerUpSystem.getStartingLives();
    this.state.level = 1;
    this.state.isGameOver = false;
    this.state.isLevelComplete = false;
    this.state.seed = seed;
    this.state.coinsEarned = 0;
    
    this.generateLevel(1, seed);
  }

  /**
   * Go to next level
   */
  nextLevel() {
    this.state.level++;
    this.state.isLevelComplete = false;
    this.state.coinsEarned = 0;
    this.state.lives = this.powerUpSystem.getStartingLives();
    
    this.powerUpSystem.applyPowerUpEffects();
    this.state.activePowerUpEffects = this.powerUpSystem.getActiveEffects();
    
    this.generateLevel(this.state.level, this.state.seed);
  }

  /**
   * Restart current stage
   */
  restartStage() {
    const currentLevel = this.state.level;
    const currentSeed = this.state.seed;
    
    this.state.score = 0;
    this.state.lives = this.powerUpSystem.getStartingLives();
    this.state.isGameOver = false;
    this.state.isLevelComplete = false;
    this.state.coinsEarned = 0;
    
    this.powerUpSystem.applyPowerUpEffects();
    this.state.activePowerUpEffects = this.powerUpSystem.getActiveEffects();
    
    this.generateLevel(currentLevel, currentSeed);
  }

  /**
   * Get current game state
   * @returns {Object} Current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Get power-up system
   * @returns {PowerUpSystem} Power-up system instance
   */
  getPowerUpSystem() {
    return this.powerUpSystem;
  }

  /**
   * Cleanup resources
   */
  dispose() {
    this.stop();
    this._clearLevel();
    
    this.walls.forEach(w => {
      this.scene.remove(w);
      w.geometry.dispose();
      w.material.dispose();
    });
    
    this.scene.remove(this.floor);
    this.floor.geometry.dispose();
    this.floor.material.dispose();
    
    this.renderer.dispose();
    this.inputSystem.dispose();
  }
}
