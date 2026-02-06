/**
 * Glowing Sphere - Main Entry Point
 * Production-grade modular 3D star collector game
 */

import { Game } from './core/Game.js';
import { UIManager } from './ui/UIManager.js';

// Import styles
import './styles/main.css';

class Application {
  constructor() {
    this.game = null;
    this.ui = null;
    this.canvasContainer = null;
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
    // Get canvas container
    this.canvasContainer = document.getElementById('canvas-container');
    if (!this.canvasContainer) {
      console.error('Canvas container not found');
      return;
    }

    // Create game instance
    this.game = new Game(this.canvasContainer);
    
    // Create UI manager
    this.ui = new UIManager(this.game);
    
    // Setup game callbacks
    this._setupGameCallbacks();
    
    // Setup shop handlers
    this.ui.setupShopHandlers();
    
    // Initialize touch controls if needed
    this.ui.initTouchControls();
    
    // Generate and start first level
    this.game.generateLevel(1);
    this.game.start();
    
    // Initial UI update
    this.ui.updateHUD(this.game.getState());
    this.ui.updatePowerUpsDisplay();
    
    console.log('Glowing Sphere initialized successfully!');
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
  }
}

// Create and initialize application
const app = new Application();
app.init();

// Export for potential external use
export { app, Application };
