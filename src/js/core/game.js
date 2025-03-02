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
   * @param {Object} data - Additional data for the game over screen
   */
  gameOver(reason, data = {}) {
    this.state.gameOver = true;
    this.state.gameOverReason = reason;
    this.isRunning = false;

    console.log("Game over:", reason);

    // Display game over screen
    this.uiManager.showGameOver(reason, data);

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

    // Initialize dynamic difficulty tracking
    this.dynamicDifficulty = {
      lastAdjustmentTurn: 1,
      adjustmentFrequency: 6, // Adjust every 6 turns
      performanceMetrics: [],
      difficultyMultiplier: 1.0,
    };
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

  /**
   * Update dynamic difficulty based on player performance
   * Called at the end of each turn
   * @private
   */
  _updateDynamicDifficulty() {
    // Only adjust difficulty periodically
    if (
      this.state.currentTurn % this.dynamicDifficulty.adjustmentFrequency !==
      0
    ) {
      return;
    }

    // Calculate performance metrics
    const company = this.company;
    const currentTurn = this.state.currentTurn;

    // Calculate expected progress based on turn number
    // These are rough benchmarks for a balanced game
    const expectedValuation = 1000000 * Math.pow(1.15, currentTurn / 12); // ~15% growth per year
    const expectedUsers = 100 * Math.pow(1.2, currentTurn / 12); // ~20% growth per year
    const expectedRevenue = 5000 * Math.pow(1.18, currentTurn / 12); // ~18% growth per year

    // Calculate how much player is exceeding expectations
    const valuationRatio = company.valuation / expectedValuation;
    const usersRatio = company.users / expectedUsers;
    const revenueRatio = company.revenue / expectedRevenue;

    // Overall performance score (higher means player is doing better than expected)
    const performanceScore = (valuationRatio + usersRatio + revenueRatio) / 3;

    // Store performance metrics for tracking
    this.dynamicDifficulty.performanceMetrics.push({
      turn: currentTurn,
      performanceScore,
      valuationRatio,
      usersRatio,
      revenueRatio,
    });

    // Keep only the last 5 performance metrics
    if (this.dynamicDifficulty.performanceMetrics.length > 5) {
      this.dynamicDifficulty.performanceMetrics.shift();
    }

    // Calculate average recent performance
    const recentPerformance =
      this.dynamicDifficulty.performanceMetrics.reduce(
        (sum, metric) => sum + metric.performanceScore,
        0
      ) / this.dynamicDifficulty.performanceMetrics.length;

    // Adjust difficulty based on performance
    let newDifficultyMultiplier = this.dynamicDifficulty.difficultyMultiplier;

    if (recentPerformance > 1.5) {
      // Player is doing much better than expected - increase difficulty significantly
      newDifficultyMultiplier += 0.15;
    } else if (recentPerformance > 1.2) {
      // Player is doing better than expected - increase difficulty moderately
      newDifficultyMultiplier += 0.08;
    } else if (recentPerformance < 0.6) {
      // Player is struggling - decrease difficulty
      newDifficultyMultiplier -= 0.1;
    } else if (recentPerformance < 0.8) {
      // Player is doing worse than expected - decrease difficulty slightly
      newDifficultyMultiplier -= 0.05;
    }

    // Clamp difficulty multiplier to reasonable range
    newDifficultyMultiplier = Math.max(
      0.7,
      Math.min(1.5, newDifficultyMultiplier)
    );

    // Only log if difficulty actually changed
    if (
      newDifficultyMultiplier !== this.dynamicDifficulty.difficultyMultiplier
    ) {
      console.log(`Dynamic difficulty adjustment at turn ${currentTurn}:`, {
        previousMultiplier: this.dynamicDifficulty.difficultyMultiplier,
        newMultiplier: newDifficultyMultiplier,
        performanceScore: recentPerformance,
        valuationRatio,
        usersRatio,
        revenueRatio,
      });

      // Store the old multiplier to check for significant increases
      const oldMultiplier = this.dynamicDifficulty.difficultyMultiplier;

      // Apply the new difficulty multiplier
      this.dynamicDifficulty.difficultyMultiplier = newDifficultyMultiplier;

      // Apply difficulty changes to game systems
      this._applyDynamicDifficultyEffects();

      // If difficulty increased significantly, consider triggering a difficulty event
      if (newDifficultyMultiplier > oldMultiplier + 0.1) {
        // 40% chance of triggering an event when difficulty increases significantly
        if (Math.random() < 0.4) {
          this._triggerDifficultyEvent();
        }
      }
    }

    this.dynamicDifficulty.lastAdjustmentTurn = currentTurn;
  }

  /**
   * Apply dynamic difficulty effects to various game systems
   * @private
   */
  _applyDynamicDifficultyEffects() {
    const multiplier = this.dynamicDifficulty.difficultyMultiplier;

    // Apply to market conditions
    this.market.valuationMultiplier *= 1 / multiplier;

    // Apply to competitors
    this.competitors.forEach((competitor) => {
      // Make competitors more aggressive as difficulty increases
      competitor.aggressiveness *= multiplier;

      // Boost competitor product quality
      if (multiplier > 1.0) {
        competitor.product.quality = Math.min(
          1.0,
          competitor.product.quality * (1 + (multiplier - 1) * 0.5)
        );
      }
    });

    // Apply to churn rate
    this.company.churnRate = Math.max(
      0.05,
      this.company.churnRate * multiplier
    );

    // Apply to product quality decay
    // Higher difficulty means faster quality decay
    const baseDecay = CONFIG.PRODUCT_QUALITY_DECAY;

    // Apply to operational costs
    // Higher difficulty means higher costs
    const operationalCostMultiplier = 1 + (multiplier - 1) * 0.5;

    // Add a random negative event if difficulty increased significantly
    if (multiplier > 1.2) {
      this._triggerDifficultyEvent();
    }
  }

  /**
   * Trigger a random negative event due to increased difficulty
   * @private
   */
  _triggerDifficultyEvent() {
    // Define possible negative events
    const negativeEvents = [
      {
        id: "employee_poaching",
        title: "Employee Poached",
        type: "internal",
        description:
          "A competitor has poached one of your employees with a better offer.",
        effects: {
          special: "employee_poached",
        },
      },
      {
        id: "market_downturn",
        title: "Market Downturn",
        type: "market",
        description:
          "Economic conditions have worsened, affecting your industry.",
        effects: {
          company: {
            valuationMultiplier: 0.85, // 15% valuation drop
          },
          market: {
            growthMultiplier: 0.8, // 20% slower growth
          },
        },
      },
      {
        id: "increased_competition",
        title: "Increased Competition",
        type: "competitor",
        description: "A new well-funded competitor has entered your market.",
        effects: {
          special: "new_competitor",
        },
      },
      {
        id: "cost_increase",
        title: "Rising Costs",
        type: "internal",
        description:
          "Operational costs have increased due to market conditions.",
        effects: {
          special: "cost_increase",
        },
      },
    ];

    // Select a random event
    const randomEvent =
      negativeEvents[Math.floor(Math.random() * negativeEvents.length)];

    // Process the special effects
    if (randomEvent.effects.special) {
      switch (randomEvent.effects.special) {
        case "employee_poached":
          this._handleEmployeePoaching();
          break;
        case "new_competitor":
          this._handleNewCompetitor();
          break;
        case "cost_increase":
          this._handleCostIncrease();
          break;
      }
    }

    // Add the event to game state
    this.state.events.push({
      ...randomEvent,
      turn: this.state.currentTurn,
    });

    // Show the event to the player
    this.uiManager.showEventModal(randomEvent);
  }

  /**
   * Handle employee poaching event
   * @private
   */
  _handleEmployeePoaching() {
    const company = this.company;

    // Only poach if company has more than 2 employees
    if (company.team.employees.length <= 2) {
      return;
    }

    // Find non-founder employees
    const poachableEmployees = company.team.employees.filter(
      (emp) => emp.role !== "founder"
    );

    if (poachableEmployees.length === 0) {
      return;
    }

    // Select a random employee to poach
    const employeeIndex = Math.floor(Math.random() * poachableEmployees.length);
    const employee = poachableEmployees[employeeIndex];

    // Remove the employee
    company.fireEmployee(employee.id);

    // Decrease team morale
    company.team.morale = Math.max(0.3, company.team.morale - 0.15);

    // Add notification
    this.addNotification(
      `${employee.name} (${employee.role}) has been poached by a competitor!`,
      "negative"
    );
  }

  /**
   * Handle new competitor event
   * @private
   */
  _handleNewCompetitor() {
    // Add a new aggressive competitor
    const newCompetitor = new AICompetitor({
      game: this,
      type: "aggressive",
      industry: this.company.industry,
      startingCash: this.company.cash * 1.2, // Well-funded competitor
      startingUsers: this.company.users * 0.5, // Half your user base
      productQuality: this.company.product.quality * 0.9, // Slightly lower quality
    });

    this.competitors.push(newCompetitor);

    // Add notification
    this.addNotification(
      `A new well-funded competitor "${newCompetitor.name}" has entered your market!`,
      "negative"
    );
  }

  /**
   * Handle cost increase event
   * @private
   */
  _handleCostIncrease() {
    // Increase operational costs by 15-30%
    const increasePercent = 15 + Math.floor(Math.random() * 15);

    // Add notification
    this.addNotification(
      `Operational costs have increased by ${increasePercent}% due to market conditions!`,
      "negative"
    );
  }
}
