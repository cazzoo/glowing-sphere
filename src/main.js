/**
 * Glowing Sphere - Main Entry Point
 * Production-grade modular 3D star collector game
 */

import { Game } from './core/Game.js';
import { UIManager } from './ui/UIManager.js';
import { MainMenu } from './ui/MainMenu.js';
import { GAME_MODES } from './utils/Constants.js';
import { SeedHistory } from './utils/SeedHistory.js';

// Import styles
import './styles/main.css';

class Application {
  constructor() {
    this.game = null;
    this.ui = null;
    this.menu = null;
    this.canvasContainer = null;
    this.menuContainer = null;
    this.currentGameConfig = null;
    
    // Gamepad state for pause menu
    this.gamepadIndex = null;
    this.gamepadPollingInterval = null;
    this.lastStartPressed = false;
  }

  /**
   * Initialize application
   */
  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this._setup());
    } else {
      this._setup();
    }
  }

  /**
   * Setup game and UI
   * @private
   */
  _setup() {
    // Create menu container
    this._createMenuContainer();
    
    // Get canvas container
    this.canvasContainer = document.getElementById('canvas-container');
    if (!this.canvasContainer) {
      console.error('Canvas container not found');
      return;
    }

    // Create game instance (but don't start yet)
    this.game = new Game(this.canvasContainer);
    
    // Create UI manager
    this.ui = new UIManager(this.game);
    
    // Setup game callbacks
    this._setupGameCallbacks();
    
    // Setup shop handlers
    this.ui.setupShopHandlers();
    
    // Initialize touch controls if needed
    this.ui.initTouchControls();
    
    // Create and show main menu
    this.menu = new MainMenu(this.menuContainer);
    this.menu.onGameStart = (config) => this._startGame(config);
    
    // Setup escape key for pause menu
    this._setupInputHandlers();
    this._setupGamepadHandlers();
    
    console.log('Glowing Sphere initialized successfully!');
  }

  /**
   * Create menu container
   * @private
   */
  _createMenuContainer() {
    this.menuContainer = document.createElement('div');
    this.menuContainer.id = 'menu-container';
    this.menuContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1000;
      display: flex;
    `;
    document.body.appendChild(this.menuContainer);
  }

  /**
   * Setup input handlers
   * @private
   */
  _setupInputHandlers() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this._togglePauseMenu();
      }
    });
  }

  /**
   * Setup gamepad handlers
   * @private
   */
  _setupGamepadHandlers() {
    // Listen for gamepad connection
    window.addEventListener('gamepadconnected', (e) => {
      console.log('Gamepad connected:', e.gamepad.id);
      this.gamepadIndex = e.gamepad.index;
      this._startGamepadPolling();
    });
    
    // Listen for gamepad disconnection
    window.addEventListener('gamepaddisconnected', (e) => {
      console.log('Gamepad disconnected');
      if (this.gamepadIndex === e.gamepad.index) {
        this.gamepadIndex = null;
        this._stopGamepadPolling();
        
        // Try to find another connected gamepad
        const gamepads = navigator.getGamepads();
        for (let i = 0; i < gamepads.length; i++) {
          if (gamepads[i]) {
            this.gamepadIndex = i;
            this._startGamepadPolling();
            break;
          }
        }
      }
    });
    
    // Check for already connected gamepads
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i]) {
        this.gamepadIndex = i;
        this._startGamepadPolling();
        break;
      }
    }
  }

  /**
   * Start polling for gamepad Start button
   * @private
   */
  _startGamepadPolling() {
    if (this.gamepadPollingInterval) return;
    
    this.gamepadPollingInterval = setInterval(() => {
      this._checkGamepadStartButton();
    }, 100); // Poll 10 times per second
  }

  /**
   * Stop polling for gamepad Start button
   * @private
   */
  _stopGamepadPolling() {
    if (this.gamepadPollingInterval) {
      clearInterval(this.gamepadPollingInterval);
      this.gamepadPollingInterval = null;
    }
  }

  /**
   * Check if Start button is pressed to toggle pause menu
   * @private
   */
  _checkGamepadStartButton() {
    if (this.gamepadIndex === null) return;
    
    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[this.gamepadIndex];
    if (!gamepad) return;
    
    // Check Start button (button 9 or 8 depending on controller)
    const buttonPressed = (index) => gamepad.buttons[index] && gamepad.buttons[index].pressed;
    const startPressed = buttonPressed(9) || buttonPressed(8);
    
    // Toggle pause menu on Start button press (rising edge)
    if (startPressed && !this.lastStartPressed) {
      this._togglePauseMenu();
    }
    
    this.lastStartPressed = startPressed;
  }

  /**
   * Toggle pause menu
   * @private
   */
  _togglePauseMenu() {
    // Only show pause if game is running and not in main menu
    if (!this.game || !this.game.isRunning) return;
    if (this.menuContainer.querySelector('.main-menu-container h1')) return; // Main menu is showing
    
    const isPaused = this.game.state.isGameOver || this.game.state.isLevelComplete;
    if (isPaused) return;
    
    // Pause the game
    this.game.pause();
    
    this.menu.showInGameMenu(
      () => this._resumeGame(),
      () => this._quitToMenu()
    );
  }

  /**
   * Resume game
   * @private
   */
  _resumeGame() {
    this.menu.hide();
    this.game.resume();
  }

  /**
   * Quit to main menu
   * @private
   */
  _quitToMenu() {
    // Unload current stage and clean up resources
    if (this.game) {
      this.game.unloadStage();
    }
    
    // Hide all UI screens
    this.ui.hideGameOver();
    this.ui.hideLevelComplete();
    this.ui.hideShop();
    
    // Show main menu
    this.menu.showMainMenu();
  }

  /**
   * Start game with configuration
   * @private
   */
  _startGame(config) {
    this.currentGameConfig = config;
    
    // Hide menu
    this.menu.hide();
    
    // Generate level with config
    // If replaySeed is provided, use it; otherwise use null for random seed
    const seed = config.replaySeed || null;
    this.game.generateLevel(config.level || 1, seed, config);
    
    // Start game
    this.game.start();
    
    // Update UI
    this.ui.updateHUD(this.game.getState());
    this.ui.updatePowerUpsDisplay();
    
    // Show game mode indicator
    this._showGameModeIndicator(config.mode);
  }

  /**
   * Save seed history to localStorage
   * @private
   */
  _saveSeedHistory(success) {
    if (!this.game || !this.currentGameConfig) return;
    
    const state = this.game.getState();
    
    // Don't save campaign games
    if (this.currentGameConfig.mode === GAME_MODES.CAMPAIGN) {
      return;
    }
    
    SeedHistory.addEntry({
      seed: state.seed,
      date: Date.now(),
      score: state.score,
      success: success,
      level: state.level,
      mode: this.currentGameConfig.mode
    });
  }

  /**
   * Show game mode indicator
   * @private
   */
  _showGameModeIndicator(mode) {
    const modeNames = {
      [GAME_MODES.CAMPAIGN]: 'CAMPAIGN',
      [GAME_MODES.RANDOM_MATCH]: 'RANDOM MATCH',
      [GAME_MODES.SANDBOX]: 'SANDBOX'
    };
    
    // Add mode display to UI
    const modeDisplay = document.createElement('div');
    modeDisplay.id = 'mode-display';
    modeDisplay.style.cssText = `
      position: absolute;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.6);
      color: #4ecdc4;
      padding: 8px 20px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 14px;
      border: 2px solid rgba(78, 205, 196, 0.5);
      z-index: 100;
    `;
    modeDisplay.textContent = modeNames[mode] || 'GAME';
    document.body.appendChild(modeDisplay);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      modeDisplay.style.transition = 'opacity 0.5s';
      modeDisplay.style.opacity = '0';
      setTimeout(() => modeDisplay.remove(), 500);
    }, 3000);
  }

  /**
   * Setup game event callbacks
   * @private
   */
  _setupGameCallbacks() {
    // Score change callback
    this.game.onScoreChange = (score) => {
      this.ui.updateHUD(this.game.getState());
    };
    
    // Lives change callback
    this.game.onLivesChange = (lives) => {
      this.ui.updateHUD(this.game.getState());
    };
    
    // Star collected callback
    this.game.onStarCollected = (collected, total) => {
      this.ui.updateHUD(this.game.getState());
    };
    
    // Level complete callback
    this.game.onLevelComplete = (data) => {
      // Save seed history (successful game)
      this._saveSeedHistory(true);
      
      // Advance campaign if in campaign mode
      if (this.currentGameConfig?.mode === GAME_MODES.CAMPAIGN) {
        this.menu.advanceCampaign();
      }
      this.ui.showLevelComplete(data);
      this.ui.updateHUD(this.game.getState());
    };
    
    // Game over callback
    this.game.onGameOver = (data) => {
      // Save seed history (failed game)
      this._saveSeedHistory(false);
      
      this.ui.showGameOver(data);
    };
    
    // Shield status callback
    this.game.onShieldStatusChange = (active, time) => {
      this.ui.updateShieldIndicator(active, time);
    };
    
    // Dash status callback
    this.game.onDashStatusChange = (dashActive, cooldown, breakActive, breakCooldown) => {
      this.ui.updateDashIndicator(dashActive, cooldown, breakActive, breakCooldown);
    };
  }

  /**
   * Cleanup resources
   */
  dispose() {
    // Stop gamepad polling
    this._stopGamepadPolling();
    
    if (this.game) {
      this.game.dispose();
      this.game = null;
    }
    
    if (this.ui) {
      this.ui.dispose();
      this.ui = null;
    }
    
    if (this.menu) {
      this.menu.dispose();
      this.menu = null;
    }
    
    if (this.menuContainer && this.menuContainer.parentNode) {
      this.menuContainer.parentNode.removeChild(this.menuContainer);
    }
  }
}

// Create and initialize application
const app = new Application();
app.init();

// Export for potential external use
export { app, Application };
