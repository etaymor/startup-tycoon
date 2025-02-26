/**
 * Startup Tycoon - Game Core
 * Central game controller that manages game state and orchestrates other systems
 */

class Game {
  constructor() {
    this.isInitialized = false;
    this.isRunning = false;
    this.company = null;
    this.market = null;
    this.turnManager = null;
    this.eventSystem = null;
    this.competitors = [];
    this.uiManager = null;
    this.settings = {
      difficulty: "normal",
      crtEffect: true,
    };

    // Game state
    this.state = {
      currentTurn: 1,
      gameOver: false,
      gameOverReason: null,
      events: [],
      notifications: [],
    };
  }

  /**
   * Initialize a new game
   * @param {Object} options - Game configuration options
   */
  init(options = {}) {
    console.log("Initializing game with options:", options);

    try {
      // Apply settings
      if (options.difficulty) {
        this.settings.difficulty = options.difficulty;
      }

      // Initialize systems in the correct order
      console.log("Initializing game systems");
      this.market = new Market(this);
      this.turnManager = new TurnManager(this);
      this.eventSystem = new EventSystem(this);
      console.log("Game systems initialized");

      // Initialize the player's company
      console.log("Creating player company");
      this.company = new Company({
        name: options.companyName || "My Startup",
        industry: options.industry || "saas",
        game: this,
      });
      console.log("Player company created");

      // Generate AI competitors
      console.log("Generating competitors");
      this._generateCompetitors();
      console.log("Competitors generated");

      this.isInitialized = true;
      this.isRunning = true;

      // Apply difficulty settings
      this._applyDifficultySettings();

      console.log("Game initialized:", this);

      // If we already have a UI Manager, just update it
      // Otherwise, create a new one
      if (this.uiManager) {
        console.log("Updating existing UI");
        this.uiManager.updateUI();
      } else {
        console.log("Creating new UIManager");
        this.uiManager = new UIManager(this);
        console.log("UIManager created");
      }

      console.log("UI updated");

      // Return the initialized game instance
      return this;
    } catch (error) {
      console.error("Error in game.init():", error);
      throw error;
    }
  }

  /**
   * Start a new game with the given options
   * @param {Object} options - Game configuration options
   */
  newGame(options) {
    console.log("Starting new game with options:", options);

    try {
      if (this.isRunning) {
        console.log("Game is already running, resetting...");
        this.reset();
      }

      console.log("Calling init()");
      return this.init(options);
    } catch (error) {
      console.error("Error in game.newGame():", error);
      throw error;
    }
  }

  /**
   * Reset the game state completely
   */
  reset() {
    this.isInitialized = false;
    this.isRunning = false;
    this.company = null;
    this.market = null;
    this.turnManager = null;
    this.eventSystem = null;
    this.competitors = [];

    // Reset game state
    this.state = {
      currentTurn: 1,
      gameOver: false,
      gameOverReason: null,
      events: [],
      notifications: [],
    };

    console.log("Game reset.");

    return this;
  }

  /**
   * Save the current game state
   */
  saveGame() {
    if (!this.isInitialized) {
      console.error("Cannot save game: Game not initialized");
      return false;
    }

    const saveData = {
      version: CONFIG.GAME_VERSION,
      timestamp: Date.now(),
      settings: this.settings,
      state: this.state,
      company: this.company.serialize(),
      market: this.market.serialize(),
      competitors: this.competitors.map((competitor) => competitor.serialize()),
    };

    try {
      localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(saveData));
      console.log("Game saved:", saveData);
      this.addNotification("Game saved successfully!");
      return true;
    } catch (error) {
      console.error("Error saving game:", error);
      this.addNotification("Failed to save game!", "error");
      return false;
    }
  }

  /**
   * Load a saved game
   */
  loadGame() {
    try {
      const savedData = localStorage.getItem(CONFIG.SAVE_KEY);

      if (!savedData) {
        console.error("No saved game found");
        return false;
      }

      const saveData = JSON.parse(savedData);

      // Version check
      if (saveData.version !== CONFIG.GAME_VERSION) {
        console.warn(
          "Save version mismatch. Expected:",
          CONFIG.GAME_VERSION,
          "Found:",
          saveData.version
        );
        this.addNotification(
          "Warning: Save version mismatch - some features may not work correctly.",
          "warning"
        );
      }

      // Reset current game
      this.reset();

      // Restore settings
      this.settings = saveData.settings;

      // Restore game state
      this.state = saveData.state;

      // Initialize systems
      // If we already have a UI Manager, just update it
      // Otherwise, create a new one
      if (this.uiManager) {
        console.log("Updating existing UI Manager for loaded game");
      } else {
        console.log("Creating new UI Manager for loaded game");
        this.uiManager = new UIManager(this);
      }

      this.market = new Market(this).deserialize(saveData.market);
      this.turnManager = new TurnManager(this);
      this.eventSystem = new EventSystem(this);

      // Restore player company
      this.company = new Company({
        game: this,
      }).deserialize(saveData.company);

      // Restore competitors
      this.competitors = saveData.competitors.map((competitorData) => {
        return new AICompetitor({
          game: this,
        }).deserialize(competitorData);
      });

      this.isInitialized = true;
      this.isRunning = true;

      console.log("Game loaded:", this);
      this.addNotification("Game loaded successfully!");

      // Hide the start game modal
      this.uiManager.hideStartGameModal();

      // Update UI
      this.uiManager.updateUI();

      return true;
    } catch (error) {
      console.error("Error loading game:", error);
      this.addNotification("Failed to load game!", "error");
      return false;
    }
  }

  /**
   * End the current turn and advance to the next
   */
  endTurn() {
    if (!this.isRunning || this.state.gameOver) {
      console.error("Cannot end turn: Game not running or already game over");
      return false;
    }

    this.turnManager.advanceTurn();
    return true;
  }

  /**
   * End the game with the given reason
   * @param {string} reason - The reason for game over
   */
  gameOver(reason) {
    this.state.gameOver = true;
    this.state.gameOverReason = reason;
    this.isRunning = false;

    console.log("Game over:", reason);

    // Display game over screen
    this.uiManager.showGameOver(reason);

    return this;
  }

  /**
   * Add a notification message
   * @param {string} message - The notification message
   * @param {string} type - Notification type (info, success, warning, error)
   */
  addNotification(message, type = "info") {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date(),
    };

    // Add to notification history
    if (!this.state.notifications) {
      this.state.notifications = [];
    }

    this.state.notifications.push(notification);

    // Keep only the last 50 notifications in history
    if (this.state.notifications.length > 50) {
      this.state.notifications.shift();
    }

    // Display the notification in UI if UIManager is available
    if (this.uiManager) {
      this.uiManager.showNotification(notification);
    } else {
      console.log(`Notification: ${message} (${type})`);
    }

    return notification;
  }

  /**
   * Generate AI competitors for the game
   * @private
   */
  _generateCompetitors() {
    const industry = this._getIndustryConfig(this.company.industry);
    const competitorCount = industry.competitors;

    console.log(
      `Generating ${competitorCount} competitors for ${industry.name} industry`
    );

    // Clear existing competitors
    this.competitors = [];

    // Generate competitors based on industry config
    for (let i = 0; i < competitorCount; i++) {
      const competitorType = this._getRandomCompetitorType();

      const competitor = new AICompetitor({
        name: this._generateCompanyName(),
        type: competitorType.id,
        industry: this.company.industry,
        game: this,
      });

      this.competitors.push(competitor);
    }

    console.log("Competitors generated:", this.competitors);
  }

  /**
   * Apply difficulty settings to the game
   * @private
   */
  _applyDifficultySettings() {
    const difficultyConfig =
      CONFIG.DIFFICULTY_SETTINGS[this.settings.difficulty];

    if (!difficultyConfig) {
      console.error("Invalid difficulty setting:", this.settings.difficulty);
      return;
    }

    console.log("Applying difficulty settings:", difficultyConfig);

    // Apply to player's company
    this.company.cash = Math.round(
      this.company.cash * difficultyConfig.startingCashMultiplier
    );

    // Apply to market
    this.market.growthMultiplier = 1 + difficultyConfig.marketGrowthBonus;

    // Apply to competitors
    this.competitors.forEach((competitor) => {
      competitor.aggressiveness *= difficultyConfig.competitorAggressiveness;
    });

    // Apply to event system
    this.eventSystem.eventFrequency *= difficultyConfig.eventFrequency;
  }

  /**
   * Helper to get industry configuration
   * @private
   */
  _getIndustryConfig(industryId) {
    return (
      CONFIG.INDUSTRIES.find((industry) => industry.id === industryId) ||
      CONFIG.INDUSTRIES[0]
    );
  }

  /**
   * Helper to get a random competitor type
   * @private
   */
  _getRandomCompetitorType() {
    const index = Math.floor(Math.random() * CONFIG.COMPETITOR_TYPES.length);
    return CONFIG.COMPETITOR_TYPES[index];
  }

  /**
   * Generate a random company name for competitors
   * @private
   */
  _generateCompanyName() {
    const prefixes = [
      "Tech",
      "Pixel",
      "Cyber",
      "Digital",
      "Future",
      "Net",
      "Data",
      "Cloud",
      "Meta",
      "Block",
    ];
    const suffixes = [
      "Corp",
      "Hub",
      "ify",
      "App",
      "ware",
      "Labs",
      "Works",
      "Byte",
      "Flux",
      "Wave",
    ];

    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

    return `${prefix}${suffix}`;
  }
}
