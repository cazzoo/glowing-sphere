/**
 * UI Manager
 * Manages all UI elements, modals, and user interactions
 */

export class UIManager {
  constructor(game) {
    this.game = game;
    
    // Device-specific hints
    this.deviceHints = {
      keyboard: '<span class="controller-icon keyboard-icon"></span> WASD/Arrows to move • R-Ctrl: Dash • L-Ctrl: Break • R-Shift: Zoom In • L-Shift: Zoom Out • B for Shop',
      gamepad: '<span class="controller-icon xbox-icon"></span> Left Stick/D-pad to move • R1: Dash • L1: Break • R2: Zoom In • L2: Zoom Out • B/Start for Shop',
      touch: '<span class="controller-icon touch-icon"></span> Drag joystick to move • Tap 🛒 for Shop'
    };
    
    this.currentDevice = 'keyboard';
    this._setupEventListeners();
    this._updateDeviceHints();
  }

  /**
   * Setup event listeners
   * @private
   */
  _setupEventListeners() {
    // Listen for input device changes
    window.addEventListener('inputDeviceChanged', (e) => {
      this.currentDevice = e.detail.device;
      this._updateDeviceHints();
    });
    
    // Listen for controller status changes
    window.addEventListener('controllerStatusChanged', (e) => {
      this._handleControllerStatusChange(e.detail);
    });
    
    // Seed copy
    document.getElementById('seed-display')?.addEventListener('click', () => {
      this._copySeed();
    });
    
    // Button handlers
    this._setupButtonHandlers();
    
    // Keyboard navigation
    this._setupKeyboardNavigation();
  }

  /**
   * Setup button handlers
   * @private
   */
  _setupButtonHandlers() {
    document.getElementById('restart-btn')?.addEventListener('click', () => {
      this.game.restartGame(null);
      this.hideGameOver();
    });
    
    document.getElementById('restart-stage-btn')?.addEventListener('click', () => {
      this.game.restartStage();
      this.hideGameOver();
    });
    
    document.getElementById('next-level-btn')?.addEventListener('click', () => {
      this.game.nextLevel();
      this.hideLevelComplete();
    });
    
    document.getElementById('play-seed-btn')?.addEventListener('click', () => {
      const seedInput = document.getElementById('seed-input');
      const seed = seedInput?.value.trim();
      if (seed) {
        this.game.restartGame(seed);
        this.hideGameOver();
      }
    });
    
    document.getElementById('seed-input')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const seed = e.target.value.trim();
        if (seed) {
          this.game.restartGame(seed);
          this.hideGameOver();
        }
      }
    });
  }

  /**
   * Setup keyboard navigation for menus
   * @private
   */
  _setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // Check if any menu is open
      const shopOpen = this.isShopOpen();
      const gameOverOpen = this.isGameOverOpen();
      const levelCompleteOpen = this.isLevelCompleteOpen();
      const menuOpen = shopOpen || gameOverOpen || levelCompleteOpen;
      
      if (!menuOpen) return;
      
      // Arrow key navigation
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        this._handleArrowNavigation(e.key);
      }
      
      // Tab navigation
      if (e.key === 'Tab') {
        e.preventDefault();
        this._handleTabNavigation(e.shiftKey);
      }
      
      // Enter to activate
      if (e.key === 'Enter') {
        const focused = document.activeElement;
        if (focused && focused.classList.contains('focusable')) {
          focused.click();
          e.preventDefault();
        }
      }
      
      // Escape to close
      if (e.key === 'Escape') {
        if (shopOpen) {
          this.hideShop();
        }
      }
      
      // B to open/close shop
      if (e.key.toLowerCase() === 'b') {
        if (!this.game.getState().isGameOver) {
          if (shopOpen) {
            this.hideShop();
          } else {
            this.showShop();
          }
        }
      }
    });
  }

  /**
   * Handle arrow key navigation
   * @private
   */
  _handleArrowNavigation(key) {
    const focusable = this._getFocusableElements();
    if (focusable.length === 0) return;
    
    const currentIndex = focusable.indexOf(document.activeElement);
    
    let direction = 0;
    switch(key) {
      case 'ArrowUp': direction = -1; break;
      case 'ArrowDown': direction = 1; break;
      case 'ArrowLeft': direction = -1; break;
      case 'ArrowRight': direction = 1; break;
    }
    
    if (currentIndex === -1) {
      focusable[0]?.focus();
    } else {
      const nextIndex = (currentIndex + direction + focusable.length) % focusable.length;
      focusable[nextIndex]?.focus();
    }
  }

  /**
   * Handle tab navigation
   * @private
   */
  _handleTabNavigation(reverse) {
    const focusable = this._getFocusableElements();
    if (focusable.length === 0) return;
    
    const currentIndex = focusable.indexOf(document.activeElement);
    const direction = reverse ? -1 : 1;
    const nextIndex = (currentIndex + direction + focusable.length) % focusable.length;
    focusable[nextIndex]?.focus();
  }

  /**
   * Get focusable elements in current modal
   * @private
   */
  _getFocusableElements() {
    let container = null;
    
    if (this.isShopOpen()) {
      container = document.getElementById('shop-menu');
    } else if (this.isGameOverOpen()) {
      container = document.getElementById('game-over');
    } else if (this.isLevelCompleteOpen()) {
      container = document.getElementById('level-complete');
    }
    
    if (!container) return [];
    
    return Array.from(container.querySelectorAll('.focusable'));
  }

  /**
   * Handle controller status change
   * @private
   */
  _handleControllerStatusChange(detail) {
    const statusEl = document.getElementById('controller-status');
    if (!statusEl) return;
    
    if (detail.type === 'connected') {
      const gameId = detail.gameId.substring(0, 30);
      statusEl.textContent = `🎮 ${gameId} Connected`;
      statusEl.classList.remove('disconnected');
      statusEl.style.display = 'block';
      
      // Hide after 3 seconds
      setTimeout(() => {
        if (!statusEl.classList.contains('disconnected')) {
          statusEl.style.display = 'none';
        }
      }, 3000);
    } else if (detail.type === 'disconnected') {
      const gameId = detail.gameId.substring(0, 30);
      statusEl.textContent = `🎮 ${gameId} Disconnected`;
      statusEl.classList.add('disconnected');
      statusEl.style.display = 'block';
      
      setTimeout(() => {
        statusEl.style.display = 'none';
        statusEl.classList.remove('disconnected');
      }, 3000);
    }
  }

  /**
   * Update device hints
   * @private
   */
  _updateDeviceHints() {
    const instructions = document.getElementById('instructions');
    if (instructions && this.deviceHints[this.currentDevice]) {
      instructions.innerHTML = this.deviceHints[this.currentDevice];
    }
  }

  /**
   * Copy seed to clipboard
   * @private
   */
  _copySeed() {
    const seed = this.game.getState().seed;
    if (!seed) return;
    
    navigator.clipboard.writeText(seed).then(() => {
      const toast = document.getElementById('seed-toast');
      if (toast) {
        toast.style.display = 'block';
        setTimeout(() => {
          toast.style.display = 'none';
        }, 2000);
      }
    }).catch(err => {
      console.error('Failed to copy seed:', err);
    });
  }

  /**
   * Update HUD elements
   * @param {Object} state - Current game state
   */
  updateHUD(state) {
    this._updateScore(state.score);
    this._updateStars(state.starsCollected, state.totalStars);
    this._updateLives(state.lives);
    this._updateLevel(state.level);
    this._updateSeed(state.seed);
    this._updateCoins();
  }

  /**
   * Update score display
   * @private
   */
  _updateScore(score) {
    const el = document.getElementById('score-value');
    if (el) el.textContent = score;
  }

  /**
   * Update stars display
   * @private
   */
  _updateStars(collected, total) {
    const el = document.getElementById('stars-value');
    if (el) el.textContent = `${collected}/${total}`;
  }

  /**
   * Update lives display
   * @private
   */
  _updateLives(lives) {
    const el = document.getElementById('lives-value');
    if (el) el.textContent = lives;
  }

  /**
   * Update level display
   * @private
   */
  _updateLevel(level) {
    const el = document.getElementById('level-value');
    if (el) el.textContent = level;
  }

  /**
   * Update seed display
   * @private
   */
  _updateSeed(seed) {
    const el = document.getElementById('seed-value');
    if (el) el.textContent = seed || 'Random';
  }

  /**
   * Update coins display
   * @private
   */
  _updateCoins() {
    const coins = this.game.getPowerUpSystem().getCoins();
    const el = document.getElementById('coins-value');
    if (el) el.textContent = coins;
  }

  /**
   * Update power-ups display
   */
  updatePowerUpsDisplay() {
    const powerUpSystem = this.game.getPowerUpSystem();
    const activePowerUps = powerUpSystem.getProgress().activePowerUps;
    const container = document.getElementById('power-ups-display');
    
    if (!container) return;
    
    if (activePowerUps.length > 0) {
      const powerUpsConfig = powerUpSystem.getPowerUpsConfig();
      container.innerHTML = 'Active: ' + activePowerUps.map(id => {
        const powerUp = powerUpsConfig[id];
        const level = powerUpSystem.getPowerUpLevel(id);
        return `<span class="power-up-slot" title="${powerUp.description}">${powerUp.icon} Lv.${level}</span>`;
      }).join('');
    } else {
      container.innerHTML = '';
    }
  }

  /**
   * Update dash indicator
   * @param {boolean} dashActive - Dash is active
   * @param {number} cooldownRemaining - Cooldown remaining
   * @param {boolean} breakActive - Handbrake is active
   * @param {number} breakCooldown - Handbrake cooldown remaining
   */
  updateDashIndicator(dashActive, cooldownRemaining, breakActive, breakCooldown) {
    const dashStatus = document.getElementById('dash-status');
    if (!dashStatus) return;
    
    if (dashActive) {
      dashStatus.textContent = 'ACTIVE!';
      dashStatus.style.color = 'rgba(255, 255, 100, 1)';
    } else if (cooldownRemaining > 0) {
      dashStatus.textContent = cooldownRemaining.toFixed(1) + 's';
      dashStatus.style.color = 'rgba(255, 100, 100, 0.9)';
    } else {
      dashStatus.textContent = 'READY';
      dashStatus.style.color = 'rgba(100, 255, 100, 0.9)';
    }
    
    const breakStatus = document.getElementById('break-status');
    if (!breakStatus) return;
    
    if (breakActive) {
      breakStatus.textContent = 'ACTIVE!';
      breakStatus.style.color = 'rgba(255, 150, 50, 1)';
    } else if (breakCooldown > 0) {
      breakStatus.textContent = breakCooldown.toFixed(1) + 's';
      breakStatus.style.color = 'rgba(255, 100, 100, 0.9)';
    } else {
      breakStatus.textContent = 'READY';
      breakStatus.style.color = 'rgba(100, 255, 100, 0.9)';
    }
  }

  /**
   * Update shield indicator
   * @param {boolean} shieldActive - Shield is active
   * @param {number} timeRemaining - Time remaining
   */
  updateShieldIndicator(shieldActive, timeRemaining) {
    const indicator = document.getElementById('shield-indicator');
    if (!indicator) return;
    
    if (shieldActive) {
      indicator.style.display = 'block';
      const timeEl = document.getElementById('shield-time');
      if (timeEl) timeEl.textContent = timeRemaining.toFixed(1);
    } else {
      indicator.style.display = 'none';
    }
  }

  /**
   * Show game over screen
   * @param {Object} data - Game over data
   */
  showGameOver(data) {
    document.getElementById('final-score').textContent = data.score;
    document.getElementById('final-level').textContent = data.level;
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('game-over-nav-hint').style.display = 'block';
    document.getElementById('level-complete').style.display = 'none';
    document.getElementById('level-complete-nav-hint').style.display = 'none';
    document.getElementById('shop-menu').style.display = 'none';
    document.getElementById('shop-nav-hint').style.display = 'none';
  }

  /**
   * Hide game over screen
   */
  hideGameOver() {
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('game-over-nav-hint').style.display = 'none';
  }

  /**
   * Show level complete screen
   * @param {Object} data - Level complete data
   */
  showLevelComplete(data) {
    document.getElementById('level-score').textContent = data.score;
    document.getElementById('level-time').textContent = data.time.toFixed(1);
    document.getElementById('level-coins').textContent = data.coins;
    document.getElementById('level-complete').style.display = 'block';
    document.getElementById('level-complete-nav-hint').style.display = 'block';
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('game-over-nav-hint').style.display = 'none';
    document.getElementById('shop-menu').style.display = 'none';
    document.getElementById('shop-nav-hint').style.display = 'none';
  }

  /**
   * Hide level complete screen
   */
  hideLevelComplete() {
    document.getElementById('level-complete').style.display = 'none';
    document.getElementById('level-complete-nav-hint').style.display = 'none';
  }

  /**
   * Show shop
   */
  showShop() {
    this._updateShopUI();
    document.getElementById('shop-menu').style.display = 'block';
    document.getElementById('shop-nav-hint').style.display = 'block';
    document.getElementById('pause-indicator').style.display = 'block';
    
    // Hide other modals
    document.getElementById('level-complete').style.display = 'none';
    document.getElementById('level-complete-nav-hint').style.display = 'none';
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('game-over-nav-hint').style.display = 'none';
  }

  /**
   * Hide shop
   */
  hideShop() {
    document.getElementById('shop-menu').style.display = 'none';
    document.getElementById('shop-nav-hint').style.display = 'none';
    document.getElementById('pause-indicator').style.display = 'none';
    
    // Show level complete again if needed
    if (this.game.getState().isLevelComplete) {
      this.showLevelComplete({
        score: this.game.getState().score,
        time: this.game.getState().levelCompletionTime,
        coins: this.game.getState().coinsEarned
      });
    }
  }

  /**
   * Update shop UI
   * @private
   */
  _updateShopUI() {
    const powerUpSystem = this.game.getPowerUpSystem();
    
    // Update currency
    document.getElementById('shop-coins-value').textContent = powerUpSystem.getCoins();
    document.getElementById('active-slots-count').textContent = powerUpSystem.getActivePowerUpsCount();
    document.getElementById('max-slots-count').textContent = powerUpSystem.getMaxPowerUpSlots();
    
    const availableContainer = document.getElementById('available-power-ups');
    const ownedContainer = document.getElementById('owned-power-ups');
    
    if (!availableContainer || !ownedContainer) return;
    
    availableContainer.innerHTML = '';
    ownedContainer.innerHTML = '';
    
    const allPowerUps = powerUpSystem.getAllPowerUpsData();
    
    allPowerUps.forEach(powerUp => {
      const item = this._createPowerUpItem(powerUp, powerUpSystem);
      
      if (powerUp.isOwned) {
        ownedContainer.appendChild(item);
      } else {
        availableContainer.appendChild(item);
      }
    });
  }

  /**
   * Create power-up item element
   * @private
   */
  _createPowerUpItem(powerUp, powerUpSystem) {
    const item = document.createElement('div');
    item.className = 'power-up-item focusable';
    if (powerUp.isOwned) item.classList.add('owned');
    if (powerUp.isEquipped) item.classList.add('equipped');
    
    let actionButtons = '';
    let levelInfo = '';
    
    if (powerUp.isOwned) {
      levelInfo = `<div class="power-up-level">Level: ${powerUp.level} / ${powerUp.maxLevel}</div>`;
      
      if (powerUp.isEquipped) {
        actionButtons = `<button class="shop-btn unequip focusable" data-action="unequip" data-id="${powerUp.id}">Unequip</button>`;
      } else {
        actionButtons = `<button class="shop-btn equip focusable" data-action="equip" data-id="${powerUp.id}" ${!powerUp.canEquip ? 'disabled' : ''}>Equip</button>`;
      }
      
      if (powerUp.level < powerUp.maxLevel) {
        actionButtons += `<button class="shop-btn focusable" data-action="upgrade" data-id="${powerUp.id}" ${!powerUp.canPurchase ? 'disabled' : ''}>Upgrade (${powerUp.cost} 💰)</button>`;
      } else {
        actionButtons += `<span style="color: #88ddff; font-size: 14px;">MAX LEVEL</span>`;
      }
    } else {
      actionButtons = `<button class="shop-btn focusable" data-action="buy" data-id="${powerUp.id}" ${!powerUp.canPurchase ? 'disabled' : ''}>Buy (${powerUp.cost} 💰)</button>`;
    }
    
    item.innerHTML = `
      <div class="power-up-header">
        <span class="power-up-name">${powerUp.icon} ${powerUp.name}</span>
      </div>
      <div class="power-up-description">${powerUp.description}</div>
      ${levelInfo}
      <div class="power-up-actions">
        ${actionButtons}
      </div>
    `;
    
    // Add event listeners
    item.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        const id = e.target.dataset.id;
        this._handlePowerUpAction(action, id);
      });
    });
    
    return item;
  }

  /**
   * Handle power-up action
   * @private
   */
  _handlePowerUpAction(action, powerUpId) {
    const powerUpSystem = this.game.getPowerUpSystem();
    let success = false;
    
    switch(action) {
      case 'buy':
      case 'upgrade':
        success = powerUpSystem.purchasePowerUp(powerUpId);
        if (success) {
          this._updateShopUI();
          this.updatePowerUpsDisplay();
          this.updateHUD(this.game.getState());
        }
        break;
      case 'equip':
        success = powerUpSystem.equipPowerUp(powerUpId);
        if (success) {
          this._updateShopUI();
          this.updatePowerUpsDisplay();
        }
        break;
      case 'unequip':
        success = powerUpSystem.unequipPowerUp(powerUpId);
        if (success) {
          this._updateShopUI();
          this.updatePowerUpsDisplay();
        }
        break;
    }
  }

  /**
   * Check if shop is open
   * @returns {boolean}
   */
  isShopOpen() {
    return document.getElementById('shop-menu').style.display === 'block';
  }

  /**
   * Check if game over is open
   * @returns {boolean}
   */
  isGameOverOpen() {
    return document.getElementById('game-over').style.display === 'block';
  }

  /**
   * Check if level complete is open
   * @returns {boolean}
   */
  isLevelCompleteOpen() {
    return document.getElementById('level-complete').style.display === 'block';
  }

  /**
   * Setup shop button handlers
   */
  setupShopHandlers() {
    document.getElementById('close-shop-btn')?.addEventListener('click', () => {
      this.hideShop();
    });
    
    document.getElementById('shop-btn-complete')?.addEventListener('click', () => {
      this.hideLevelComplete();
      this.showShop();
    });
    
    document.getElementById('reset-progress-btn')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all progress? This cannot be undone!')) {
        this.game.getPowerUpSystem().resetProgress();
        this._updateShopUI();
        this.updatePowerUpsDisplay();
        this.updateHUD(this.game.getState());
      }
    });
  }

  /**
   * Initialize touch controls
   */
  initTouchControls() {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (isTouch) {
      document.getElementById('touch-controls').style.display = 'block';
      document.getElementById('touch-buttons').style.display = 'block';
    }
  }

  /**
   * Cleanup
   */
  dispose() {
    // Remove event listeners
    window.removeEventListener('inputDeviceChanged', this._updateDeviceHints);
    window.removeEventListener('controllerStatusChanged', this._handleControllerStatusChange);
  }
}
