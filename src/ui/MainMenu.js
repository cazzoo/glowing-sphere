/**
 * MainMenu - Main Menu System
 * Provides UI for game mode selection and configuration
 */

import { GAME_MODES, DIFFICULTY_TIERS, CAMPAIGN_CONFIG, SANDBOX_DEFAULTS, ARENA } from '../utils/Constants.js';

export class MainMenu {
  constructor(container) {
    this.container = container;
    this.currentMode = null;
    this.selectedDifficulty = null;
    this.sandboxConfig = { ...SANDBOX_DEFAULTS };
    this.onGameStart = null;
    this.onBackToMenu = null;
    
    this._init();
  }

  /**
   * Initialize menu
   * @private
   */
  _init() {
    this._createStyles();
    this.showMainMenu();
  }

  /**
   * Create CSS styles for the menu
   * @private
   */
  _createStyles() {
    const styleId = 'main-menu-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .main-menu-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, rgba(10, 10, 30, 0.95) 0%, rgba(20, 10, 40, 0.95) 100%);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        z-index: 1000;
      }

      .menu-title {
        font-size: 4rem;
        font-weight: bold;
        background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-shadow: 0 0 30px rgba(255, 107, 107, 0.5);
        margin-bottom: 3rem;
        animation: glow 2s ease-in-out infinite alternate;
      }

      @keyframes glow {
        from { filter: drop-shadow(0 0 20px rgba(255, 107, 107, 0.5)); }
        to { filter: drop-shadow(0 0 40px rgba(78, 205, 196, 0.8)); }
      }

      .menu-buttons {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        align-items: center;
      }

      .menu-button {
        padding: 1.2rem 3rem;
        font-size: 1.3rem;
        font-weight: bold;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        cursor: pointer;
        transition: all 0.3s ease;
        min-width: 280px;
        text-transform: uppercase;
        letter-spacing: 2px;
      }

      .menu-button:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(78, 205, 196, 0.8);
        transform: translateY(-3px);
        box-shadow: 0 10px 30px rgba(78, 205, 196, 0.3);
      }

      .menu-button:active {
        transform: translateY(0);
      }

      .menu-button.secondary {
        background: rgba(255, 107, 107, 0.2);
        border-color: rgba(255, 107, 107, 0.5);
        min-width: auto;
        padding: 0.8rem 2rem;
        font-size: 1rem;
      }

      .menu-button.secondary:hover {
        background: rgba(255, 107, 107, 0.3);
        border-color: rgba(255, 107, 107, 0.8);
      }

      /* Difficulty Selection */
      .difficulty-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
      }

      .difficulty-title {
        font-size: 2.5rem;
        color: white;
        margin-bottom: 1rem;
      }

      .difficulty-buttons {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
      }

      .difficulty-button {
        padding: 1.5rem 2rem;
        font-size: 1.2rem;
        font-weight: bold;
        border: 2px solid;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.3s ease;
        min-width: 180px;
        text-transform: uppercase;
      }

      .difficulty-button.simple {
        background: linear-gradient(135deg, #27ae60, #2ecc71);
        border-color: #27ae60;
        color: white;
      }

      .difficulty-button.medium {
        background: linear-gradient(135deg, #f39c12, #e67e22);
        border-color: #f39c12;
        color: white;
      }

      .difficulty-button.hard {
        background: linear-gradient(135deg, #e74c3c, #c0392b);
        border-color: #e74c3c;
        color: white;
      }

      .difficulty-button.hell {
        background: linear-gradient(135deg, #8b0000, #4a0000);
        border-color: #8b0000;
        color: white;
        animation: pulse-hell 1s ease-in-out infinite;
      }

      @keyframes pulse-hell {
        0%, 100% { box-shadow: 0 0 20px rgba(139, 0, 0, 0.5); }
        50% { box-shadow: 0 0 40px rgba(139, 0, 0, 0.8); }
      }

      .difficulty-button:hover {
        transform: scale(1.05);
        filter: brightness(1.2);
      }

      /* Sandbox Configuration */
      .sandbox-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        padding: 2rem;
      }

      .sandbox-title {
        font-size: 2rem;
        color: white;
        margin-bottom: 1rem;
      }

      .config-section {
        width: 100%;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        padding: 1.5rem;
        margin-bottom: 1rem;
      }

      .config-section h3 {
        color: #4ecdc4;
        margin-bottom: 1rem;
        font-size: 1.2rem;
      }

      .config-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.8rem;
      }

      .config-label {
        color: rgba(255, 255, 255, 0.8);
        font-size: 1rem;
      }

      .config-input,
      .config-select {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 5px;
        padding: 0.5rem 1rem;
        color: white;
        font-size: 1rem;
        min-width: 150px;
      }

      .config-input:focus,
      .config-select:focus {
        outline: none;
        border-color: #4ecdc4;
      }

      .config-select option {
        background: #1a1a2e;
        color: white;
      }

      .config-slider {
        width: 150px;
        accent-color: #4ecdc4;
      }

      .config-value {
        color: #4ecdc4;
        font-weight: bold;
        min-width: 40px;
        text-align: right;
      }

      /* Campaign Mode */
      .campaign-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
      }

      .campaign-title {
        font-size: 2.5rem;
        color: white;
        margin-bottom: 1rem;
      }

      .campaign-info {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        padding: 1.5rem;
        text-align: center;
        max-width: 500px;
      }

      .campaign-info p {
        color: rgba(255, 255, 255, 0.9);
        margin-bottom: 0.5rem;
        font-size: 1rem;
      }

      .campaign-info strong {
        color: #4ecdc4;
      }

      /* Scrollbar styling */
      .sandbox-container::-webkit-scrollbar {
        width: 8px;
      }

      .sandbox-container::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
      }

      .sandbox-container::-webkit-scrollbar-thumb {
        background: rgba(78, 205, 196, 0.5);
        border-radius: 4px;
      }

      .sandbox-container::-webkit-scrollbar-thumb:hover {
        background: rgba(78, 205, 196, 0.8);
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Clear menu container
   * @private
   */
  _clearContainer() {
    this.container.innerHTML = '';
  }

  /**
   * Show main menu
   */
  showMainMenu() {
    this._clearContainer();
    this.currentMode = null;

    const menuHTML = `
      <div class="main-menu-container">
        <h1 class="menu-title">GLOWING SPHERE</h1>
        <div class="menu-buttons">
          <button class="menu-button" data-mode="campaign">
            🎯 Single Player Campaign
          </button>
          <button class="menu-button" data-mode="random">
            🎲 Random Match
          </button>
          <button class="menu-button" data-mode="sandbox">
            🔧 Custom Sandbox
          </button>
        </div>
      </div>
    `;

    this.container.innerHTML = menuHTML;

    // Add event listeners
    this.container.querySelectorAll('.menu-button').forEach(button => {
      button.addEventListener('click', () => {
        const mode = button.dataset.mode;
        this._handleModeSelection(mode);
      });
    });
  }

  /**
   * Handle mode selection
   * @private
   */
  _handleModeSelection(mode) {
    switch (mode) {
      case 'campaign':
        this.showCampaignMenu();
        break;
      case 'random':
        this.showDifficultySelection();
        break;
      case 'sandbox':
        this.showSandboxConfiguration();
        break;
    }
  }

  /**
   * Show campaign mode menu
   */
  showCampaignMenu() {
    this.currentMode = GAME_MODES.CAMPAIGN;
    this._clearContainer();

    // Get or initialize campaign progress
    const campaignProgress = this._loadCampaignProgress();
    const currentStage = campaignProgress.currentStage || 1;
    const stageConfig = CAMPAIGN_CONFIG.getStageConfig(currentStage);
    const shapeName = this._getShapeDisplayName(stageConfig.shape);

    const menuHTML = `
      <div class="main-menu-container">
        <h2 class="campaign-title">CAMPAIGN MODE</h2>
        <div class="campaign-info">
          <p><strong>Current Stage:</strong> ${currentStage}</p>
          <p><strong>Arena Shape:</strong> ${shapeName}</p>
          <p><strong>Enemies:</strong> ${stageConfig.enemyCount}</p>
          <p><strong>Difficulty:</strong> ${this._getDifficultyLabel(currentStage)}</p>
          <p><strong>Lives:</strong> ${stageConfig.lives}</p>
        </div>
        <div class="menu-buttons">
          <button class="menu-button" id="start-campaign">
            ▶️ Start Stage ${currentStage}
          </button>
          <button class="menu-button" id="reset-campaign">
            🔄 Reset Progress
          </button>
          <button class="menu-button secondary" id="back-to-main">
            ← Back to Menu
          </button>
        </div>
      </div>
    `;

    this.container.innerHTML = menuHTML;

    // Add event listeners
    document.getElementById('start-campaign').addEventListener('click', () => {
      this._startCampaignGame(currentStage);
    });

    document.getElementById('reset-campaign').addEventListener('click', () => {
      this._resetCampaignProgress();
      this.showCampaignMenu();
    });

    document.getElementById('back-to-main').addEventListener('click', () => {
      this.showMainMenu();
    });
  }

  /**
   * Show difficulty selection menu
   */
  showDifficultySelection() {
    this.currentMode = GAME_MODES.RANDOM_MATCH;
    this._clearContainer();

    const menuHTML = `
      <div class="main-menu-container">
        <h2 class="difficulty-title">SELECT DIFFICULTY</h2>
        <div class="difficulty-buttons">
          <button class="difficulty-button simple" data-difficulty="simple">
            😊 Simple
          </button>
          <button class="difficulty-button medium" data-difficulty="medium">
            🎯 Medium
          </button>
          <button class="difficulty-button hard" data-difficulty="hard">
            😈 Hard
          </button>
          <button class="difficulty-button hell" data-difficulty="hell">
            💀 HELL
          </button>
        </div>
        <div class="menu-buttons" style="margin-top: 2rem;">
          <button class="menu-button secondary" id="back-to-main">
            ← Back to Menu
          </button>
        </div>
      </div>
    `;

    this.container.innerHTML = menuHTML;

    // Add event listeners
    this.container.querySelectorAll('.difficulty-button').forEach(button => {
      button.addEventListener('click', () => {
        const difficulty = button.dataset.difficulty;
        this._startRandomMatch(difficulty);
      });
    });

    document.getElementById('back-to-main').addEventListener('click', () => {
      this.showMainMenu();
    });
  }

  /**
   * Show sandbox configuration menu
   */
  showSandboxConfiguration() {
    this.currentMode = GAME_MODES.SANDBOX;
    this._clearContainer();

    const menuHTML = `
      <div class="main-menu-container">
        <h2 class="sandbox-title">SANDBOX CONFIGURATION</h2>
        <div class="sandbox-container">
          <div class="config-section">
            <h3>🏟️ Arena Settings</h3>
            ${this._createSelectConfig('Arena Shape', 'arenaShape', Object.values(ARENA.SHAPES), this.sandboxConfig.arenaShape)}
            ${this._createSliderConfig('Arena Width', 'arenaWidth', 20, 50, this.sandboxConfig.arenaWidth)}
            ${this._createSliderConfig('Arena Height', 'arenaHeight', 15, 40, this.sandboxConfig.arenaHeight)}
          </div>
          <div class="config-section">
            <h3>👾 Enemies</h3>
            ${this._createSliderConfig('Enemy Count', 'enemyCount', 0, 5, this.sandboxConfig.enemyCount)}
            ${this._createSliderConfig('Enemy Speed', 'enemySpeedMultiplier', 0.5, 2.0, this.sandboxConfig.enemySpeedMultiplier, 0.1)}
          </div>
          <div class="config-section">
            <h3>🧱 Obstacles</h3>
            ${this._createSliderConfig('Obstacle Count', 'obstacleCount', 0, 20, this.sandboxConfig.obstacleCount)}
            ${this._createSliderConfig('Moving Obstacles', 'movingObstacleCount', 0, 10, this.sandboxConfig.movingObstacleCount)}
          </div>
          <div class="config-section">
            <h3>⭐ Collectibles</h3>
            ${this._createSliderConfig('Star Count', 'starCount', 1, 20, this.sandboxConfig.starCount)}
          </div>
          <div class="config-section">
            <h3>❤️ Game Settings</h3>
            ${this._createSliderConfig('Starting Lives', 'lives', 1, 10, this.sandboxConfig.lives)}
            ${this._createSliderConfig('Spawn Safety Zone', 'spawnSafetyZone', 2, 10, this.sandboxConfig.spawnSafetyZone)}
          </div>
          <div class="menu-buttons">
            <button class="menu-button" id="start-sandbox">
              ▶️ Start Sandbox
            </button>
            <button class="menu-button secondary" id="reset-sandbox">
              🔄 Reset to Defaults
            </button>
            <button class="menu-button secondary" id="back-to-main">
              ← Back to Menu
            </button>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = menuHTML;

    // Add event listeners for sliders and selects
    this._bindConfigInputs();

    // Add button event listeners
    document.getElementById('start-sandbox').addEventListener('click', () => {
      this._startSandboxGame();
    });

    document.getElementById('reset-sandbox').addEventListener('click', () => {
      this.sandboxConfig = { ...SANDBOX_DEFAULTS };
      this.showSandboxConfiguration();
    });

    document.getElementById('back-to-main').addEventListener('click', () => {
      this.showMainMenu();
    });
  }

  /**
   * Create select configuration element
   * @private
   */
  _createSelectConfig(label, configKey, options, currentValue) {
    const optionsHTML = options.map(opt => 
      `<option value="${opt}" ${opt === currentValue ? 'selected' : ''}>${this._getShapeDisplayName(opt)}</option>`
    ).join('');

    return `
      <div class="config-row">
        <span class="config-label">${label}</span>
        <select class="config-select" data-config="${configKey}">
          ${optionsHTML}
        </select>
      </div>
    `;
  }

  /**
   * Create slider configuration element
   * @private
   */
  _createSliderConfig(label, configKey, min, max, currentValue, step = 1) {
    const displayStep = step < 1 ? step : 1;
    const displayValue = Number(currentValue).toFixed(step < 1 ? 1 : 0);

    return `
      <div class="config-row">
        <span class="config-label">${label}</span>
        <div style="display: flex; align-items: center; gap: 10px;">
          <input type="range" 
                 class="config-slider" 
                 data-config="${configKey}"
                 min="${min}" 
                 max="${max}" 
                 step="${step}"
                 value="${currentValue}">
          <span class="config-value" id="value-${configKey}">${displayValue}</span>
        </div>
      </div>
    `;
  }

  /**
   * Bind configuration input events
   * @private
   */
  _bindConfigInputs() {
    // Slider inputs
    this.container.querySelectorAll('.config-slider').forEach(slider => {
      const configKey = slider.dataset.config;
      const valueDisplay = document.getElementById(`value-${configKey}`);
      
      slider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        this.sandboxConfig[configKey] = value;
        valueDisplay.textContent = value.toFixed(configKey === 'enemySpeedMultiplier' ? 1 : 0);
      });
    });

    // Select inputs
    this.container.querySelectorAll('.config-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const configKey = e.target.dataset.config;
        this.sandboxConfig[configKey] = e.target.value;
      });
    });
  }

  /**
   * Get display name for shape
   * @private
   */
  _getShapeDisplayName(shape) {
    const names = {
      'rectangle': 'Rectangle',
      'oval': 'Oval',
      'diamond': 'Diamond',
      'hexagon': 'Hexagon',
      'circle': 'Circle',
      'octagon': 'Octagon',
      'cross': 'Cross',
      'rounded_rect': 'Rounded Rectangle'
    };
    return names[shape] || shape;
  }

  /**
   * Get difficulty label for stage
   * @private
   */
  _getDifficultyLabel(stage) {
    if (stage <= 3) return 'Easy';
    if (stage <= 7) return 'Medium';
    if (stage <= 12) return 'Hard';
    return 'Extreme';
  }

  /**
   * Start campaign game
   * @private
   */
  _startCampaignGame(stage) {
    const config = CAMPAIGN_CONFIG.getStageConfig(stage);
    
    const gameConfig = {
      mode: GAME_MODES.CAMPAIGN,
      level: stage,
      arenaShape: config.shape,
      enemyCount: config.enemyCount,
      obstacleMultiplier: config.obstacleMultiplier,
      movingObstacleProbability: config.movingObstacleProbability,
      spawnSafetyZone: config.spawnSafetyZone,
      lives: config.lives,
      starCount: 5 + Math.floor(stage * 1.5)
    };

    this._startGame(gameConfig);
  }

  /**
   * Start random match game
   * @private
   */
  _startRandomMatch(difficulty) {
    this.selectedDifficulty = difficulty;
    const tier = DIFFICULTY_TIERS[difficulty.toUpperCase()];
    
    // Random level between 1 and 10
    const randomLevel = Math.floor(Math.random() * 10) + 1;
    // Random shape from allowed shapes
    const randomShape = tier.allowedShapes[Math.floor(Math.random() * tier.allowedShapes.length)];

    const gameConfig = {
      mode: GAME_MODES.RANDOM_MATCH,
      level: randomLevel,
      arenaShape: randomShape,
      difficulty: difficulty,
      enemySpeedMultiplier: tier.enemySpeedMultiplier,
      enemyCountMultiplier: tier.enemyCountMultiplier,
      obstacleCountMultiplier: tier.obstacleCountMultiplier,
      movingObstacleProbability: tier.movingObstacleProbability,
      spawnSafetyZone: tier.spawnSafetyZone,
      lives: tier.lives,
      starCount: Math.floor((5 + randomLevel * 1.5) * tier.starCountMultiplier)
    };

    this._startGame(gameConfig);
  }

  /**
   * Start sandbox game
   * @private
   */
  _startSandboxGame() {
    const gameConfig = {
      mode: GAME_MODES.SANDBOX,
      level: 1,
      arenaShape: this.sandboxConfig.arenaShape,
      arenaWidth: this.sandboxConfig.arenaWidth,
      arenaHeight: this.sandboxConfig.arenaHeight,
      enemyCount: this.sandboxConfig.enemyCount,
      obstacleCount: this.sandboxConfig.obstacleCount,
      movingObstacleCount: this.sandboxConfig.movingObstacleCount,
      starCount: this.sandboxConfig.starCount,
      enemySpeedMultiplier: this.sandboxConfig.enemySpeedMultiplier,
      lives: this.sandboxConfig.lives,
      spawnSafetyZone: this.sandboxConfig.spawnSafetyZone
    };

    this._startGame(gameConfig);
  }

  /**
   * Start game with configuration
   * @private
   */
  _startGame(config) {
    this._clearContainer();
    
    if (this.onGameStart) {
      this.onGameStart(config);
    }
  }

  /**
   * Load campaign progress
   * @private
   */
  _loadCampaignProgress() {
    const saved = localStorage.getItem('glowingSphereCampaign');
    if (saved) {
      return JSON.parse(saved);
    }
    return { currentStage: 1, completedStages: [] };
  }

  /**
   * Save campaign progress
   * @private
   */
  _saveCampaignProgress(progress) {
    localStorage.setItem('glowingSphereCampaign', JSON.stringify(progress));
  }

  /**
   * Reset campaign progress
   * @private
   */
  _resetCampaignProgress() {
    localStorage.removeItem('glowingSphereCampaign');
  }

  /**
   * Advance campaign progress
   */
  advanceCampaign() {
    if (this.currentMode === GAME_MODES.CAMPAIGN) {
      const progress = this._loadCampaignProgress();
      progress.currentStage++;
      if (!progress.completedStages.includes(progress.currentStage - 1)) {
        progress.completedStages.push(progress.currentStage - 1);
      }
      this._saveCampaignProgress(progress);
    }
  }

  /**
   * Show back to menu button during gameplay
   */
  showInGameMenu(onResume, onQuit) {
    const menuHTML = `
      <div class="main-menu-container" style="background: rgba(0, 0, 0, 0.85);">
        <h2 class="campaign-title">PAUSED</h2>
        <div class="menu-buttons">
          <button class="menu-button" id="resume-game">
            ▶️ Resume
          </button>
          <button class="menu-button secondary" id="quit-game">
            🚪 Quit to Menu
          </button>
        </div>
      </div>
    `;

    this.container.innerHTML = menuHTML;
    this.container.style.display = 'flex';

    document.getElementById('resume-game').addEventListener('click', () => {
      this.container.style.display = 'none';
      if (onResume) onResume();
    });

    document.getElementById('quit-game').addEventListener('click', () => {
      this.container.innerHTML = '';
      if (onQuit) onQuit();
      this.showMainMenu();
    });
  }

  /**
   * Hide menu
   */
  hide() {
    this.container.style.display = 'none';
  }

  /**
   * Show menu
   */
  show() {
    this.container.style.display = 'flex';
  }

  /**
   * Cleanup
   */
  dispose() {
    this._clearContainer();
    const style = document.getElementById('main-menu-styles');
    if (style) {
      style.remove();
    }
  }
}
