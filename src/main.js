/**
 * Glowing Sphere - Main Entry Point
 * Production-grade modular 3D star collector game
 */

import { Game } from './core/Game.js';
import { UIManager } from './ui/UIManager.js';
import { MainMenu } from './ui/MainMenu.js';
import { GAME_MODES } from './utils/Constants.js';

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
    // Stop game
    if (this.game) {
      this.game.stop();
    }
    
    // Reset UI
    this.ui.hideAllScreens();
    
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
    this.game.generateLevel(config.level || 1, null, config);
    
    // Start game
    this.game.start();
    
    // Update UI
    this.ui.updateHUD(this.game.getState());
    this.ui.updatePowerUpsDisplay();
    
    // Show game mode indicator
    this._showGameModeIndicator(config.mode);
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
      // Advance campaign if in campaign mode
      if (this.currentGameConfig?.mode === GAME_MODES.CAMPAIGN) {
        this.menu.advanceCampaign();
      }
      this.ui.showLevelComplete(data);
      this.ui.updateHUD(this.game.getState());
    };
    
    // Game over callback
    this.game.onGameOver = (data) => {
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
