/**
 * Startup Tycoon - UI Manager
 * Handles all UI interactions and updates the display based on game state
 */

class UIManager {
  constructor(game) {
    this.game = game;
    this.activeScreen = "dashboard";
    this.modalOpen = false;
    this.sidebarOpen = false;

    // DOM element references
    this.elements = {
      // Main containers
      gameContainer: document.querySelector(".game-container"),
      notifications: document.getElementById("notification-area"),

      // About modal elements
      aboutLink: document.getElementById("about-link"),
      aboutModal: document.getElementById("about-modal"),
      closeAboutButton: document.getElementById("close-about-button"),

      // Stats
      turnCounter: document.getElementById("current-turn"),
      cashDisplay: document.getElementById("current-cash"),
      usersDisplay: document.getElementById("current-users"),
      valuationDisplay: document.getElementById("current-valuation"),
      // difficultyDisplay: document.getElementById("current-difficulty"),

      // Company info
      companyNameDisplay: document.getElementById("company-name-value"),
      companyIndustryDisplay: document.getElementById("company-industry-value"),

      // Screens
      screens: document.querySelectorAll(".screen"),

      // Menu buttons
      menuButtons: document.querySelectorAll(".menu-button"),

      // Mobile menu
      mobileMenuToggle: document.getElementById("mobile-menu-toggle"),
      sidebar: document.getElementById("sidebar"),
      mainPanel: document.querySelector(".main-panel"),

      // Action buttons
      endTurnButton: document.getElementById("end-turn-button"),
      saveGameButton: document.getElementById("save-game-button"),

      // Start game modal
      startGameModal: document.getElementById("start-game-modal"),
      companyNameInput: document.getElementById("company-name-input"),
      industrySelect: document.getElementById("industry-select"),
      difficultySelect: document.getElementById("difficulty-select"),
      startGameButton: document.getElementById("start-game-button"),

      // Event modal
      eventModal: document.getElementById("event-modal"),
      eventTitle: document.getElementById("event-title"),
      eventDescription: document.getElementById("event-description"),
      eventChoices: document.getElementById("event-choices"),
      eventAcknowledgeButton: document.getElementById(
        "event-acknowledge-button"
      ),
    };

    this._initializeUI();
  }

  /**
   * Initialize UI elements and event listeners
   * @private
   */
  _initializeUI() {
    // Initialize menu navigation
    this._initializeNavigation();

    // Initialize About modal
    this._initializeAboutModal();

    // Set up action button listeners
    this._initializeActionButtons();

    // Set up start game modal
    this._initializeStartGameModal();

    // Set up event handling
    this._initializeEventHandling();

    // Set up mobile menu toggle
    this._initializeMobileMenu();

    // Apply CRT effect if enabled
    this._applyCRTEffect();
  }

  /**
   * Initialize About modal functionality
   * @private
   */
  _initializeAboutModal() {
    if (
      !this.elements.aboutLink ||
      !this.elements.aboutModal ||
      !this.elements.closeAboutButton
    )
      return;

    this.elements.aboutLink.addEventListener("click", (e) => {
      e.preventDefault();
      this.elements.aboutModal.style.display = "flex";
      this.modalOpen = true;
    });

    this.elements.closeAboutButton.addEventListener("click", () => {
      this.elements.aboutModal.style.display = "none";
      this.modalOpen = false;
    });
  }

  /**
   * Show the start game modal
   */
  showStartGameModal() {
    this.elements.startGameModal.style.display = "flex";
    this.modalOpen = true;
  }

  /**
   * Hide the start game modal
   */
  hideStartGameModal() {
    this.elements.startGameModal.style.display = "none";
    this.modalOpen = false;
  }

  /**
   * Update all UI elements to reflect current game state
   */
  updateUI() {
    // Only update if game is initialized
    if (!this.game || !this.game.isInitialized) {
      console.log("Game not initialized, skipping UI update");
      return;
    }

    try {
      // Update stats display
      this._updateStatsDisplay();

      // Update company info
      this._updateCompanyInfo();

      // Update active screen
      this._updateActiveScreen();

      console.log("UI updated");
    } catch (error) {
      console.error("Error updating UI:", error);
    }
  }

  /**
   * Display a notification
   * @param {Object} notification - Notification data object
   */
  showNotification(notification) {
    // Create notification element
    const notificationElement = document.createElement("div");
    notificationElement.className = `notification notification-${notification.type}`;
    notificationElement.textContent = notification.message;

    // Add to notifications area
    this.elements.notifications.appendChild(notificationElement);

    // Auto-remove after duration
    setTimeout(() => {
      if (notificationElement.parentNode) {
        notificationElement.classList.add("fade-out");
        setTimeout(() => {
          if (notificationElement.parentNode) {
            notificationElement.parentNode.removeChild(notificationElement);
          }
        }, 500);
      }
    }, CONFIG.NOTIFICATION_DURATION);
  }

  /**
   * Show an event modal
   * @param {Object} event - Event data
   */
  showEventModal(event) {
    // Set event details
    this.elements.eventTitle.textContent = event.title;
    this.elements.eventDescription.textContent = event.description;

    // Clear existing choices
    this.elements.eventChoices.innerHTML = "";

    // Add choices if available
    if (event.choices && event.choices.length > 0) {
      event.choices.forEach((choice, index) => {
        const choiceButton = document.createElement("div");
        choiceButton.className = "event-choice";
        choiceButton.innerHTML = `
                    <div class="event-choice-title">${choice.text}</div>
                    <div class="event-choice-description">${this._getChoiceDescription(
                      choice
                    )}</div>
                `;

        // Add click handler
        choiceButton.addEventListener("click", () => {
          this.game.eventSystem.handleEventChoice(event, index);
          this.hideEventModal();
        });

        this.elements.eventChoices.appendChild(choiceButton);
      });

      // Hide acknowledge button
      this.elements.eventAcknowledgeButton.style.display = "none";
    } else {
      // No choices, just show acknowledge button
      this.elements.eventAcknowledgeButton.style.display = "block";
      this.elements.eventAcknowledgeButton.onclick = () => {
        this.hideEventModal();
      };
    }

    // Show the modal
    this.elements.eventModal.style.display = "flex";
    this.modalOpen = true;
  }

  /**
   * Hide the event modal
   */
  hideEventModal() {
    this.elements.eventModal.style.display = "none";
    this.modalOpen = false;
  }

  /**
   * Initialize menu navigation
   * @private
   */
  _initializeNavigation() {
    this.elements.menuButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const screenId = button.getAttribute("data-screen");
        this.showScreen(screenId);
      });
    });
  }

  /**
   * Initialize action buttons
   * @private
   */
  _initializeActionButtons() {
    // Save Game button
    this.elements.saveGameButton.addEventListener("click", () => {
      this.game.saveGame();
      this.addNotification("Game saved successfully", "success");
    });
  }

  /**
   * Initialize start game modal
   * @private
   */
  _initializeStartGameModal() {
    // Show the start game modal by default
    this.showStartGameModal();

    // Remove any existing event listeners (to prevent duplicates)
    const startButton = this.elements.startGameButton;
    const newStartButton = startButton.cloneNode(true);
    startButton.parentNode.replaceChild(newStartButton, startButton);
    this.elements.startGameButton = newStartButton;

    // Start game button handler
    this.elements.startGameButton.addEventListener("click", () => {
      console.log("Start game button clicked in UIManager");

      const companyName = this.elements.companyNameInput.value.trim();
      const industry = this.elements.industrySelect.value;
      const difficulty = this.elements.difficultySelect.value;

      console.log("Form values:", { companyName, industry, difficulty });

      // Validate that company name is not empty
      if (!companyName || companyName === "") {
        alert("Please enter a company name");
        return;
      }

      try {
        console.log("About to call game.newGame()");
        // Initialize game with selected options
        this.game.newGame({
          companyName: companyName,
          industry: industry,
          difficulty: difficulty,
        });
        console.log("game.newGame() completed");

        // Hide the modal
        console.log("About to hide start game modal");
        this.hideStartGameModal();
        console.log("Modal hidden");

        // Apply CRT effect if enabled
        this._applyCRTEffect();

        console.log(
          `Starting new game: ${companyName} in ${industry} industry (${difficulty} difficulty)`
        );
      } catch (error) {
        console.error("Error starting game:", error);
      }
    });
  }

  /**
   * Initialize event handling
   * @private
   */
  _initializeEventHandling() {
    // Event modal acknowledge button
    this.elements.eventAcknowledgeButton.addEventListener("click", () => {
      this.hideEventModal();
    });
  }

  /**
   * Apply CRT effect if enabled
   * @private
   */
  _applyCRTEffect() {
    if (this.game.settings.crtEffect) {
      this.elements.gameContainer.classList.add("crt-effect");
    } else {
      this.elements.gameContainer.classList.remove("crt-effect");
    }
  }

  /**
   * Switch to a different screen
   * @param {string} screenId - ID of the screen to show
   * @private
   */
  _switchScreen(screenId) {
    // Update active screen
    this.activeScreen = screenId;

    // Hide all screens
    this.elements.screens.forEach((screen) => {
      screen.style.display = "none";
    });

    // Show the selected screen
    const targetScreen = document.getElementById(`${screenId}-screen`);
    if (targetScreen) {
      targetScreen.style.display = "block";
    }

    // Update menu button active state
    this.elements.menuButtons.forEach((button) => {
      if (button.getAttribute("data-screen") === screenId) {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }
    });

    // Populate the active screen with data
    this._populateScreenData(screenId);
  }

  /**
   * Populate screen with relevant data
   * @param {string} screenId - ID of the screen to populate
   * @private
   */
  _populateScreenData(screenId) {
    switch (screenId) {
      case "dashboard":
        this._populateDashboard();
        break;
      case "product":
        this._populateProductScreen();
        break;
      case "team":
        this._populateTeamScreen();
        break;
      case "marketing":
        this._populateMarketingScreen();
        break;
      case "funding":
        this._populateFundingScreen();
        break;
      case "market":
        this._populateMarketScreen();
        break;
    }
  }

  /**
   * Update stats display
   * @private
   */
  _updateStatsDisplay() {
    this.elements.turnCounter.textContent = `Turn: ${this.game.state.currentTurn}`;
    this.elements.cashDisplay.textContent = `Cash: $${this.game.company.cash.toLocaleString()}`;
    this.elements.usersDisplay.textContent = `Users: ${this.game.company.users.toLocaleString()}`;
    this.elements.valuationDisplay.textContent = `Valuation: $${this.game.company.valuation.toLocaleString()}`;

    // Update difficulty display if dynamic difficulty is enabled
    // if (this.game.dynamicDifficulty) {
    //   const difficultyMultiplier = this.game.dynamicDifficulty.difficultyMultiplier;
    //   let difficultyText = "Normal";
    //
    //   if (difficultyMultiplier <= 0.8) {
    //     difficultyText = "Easy";
    //   } else if (difficultyMultiplier <= 0.95) {
    //     difficultyText = "Moderate";
    //   } else if (difficultyMultiplier <= 1.05) {
    //     difficultyText = "Normal";
    //   } else if (difficultyMultiplier <= 1.2) {
    //     difficultyText = "Challenging";
    //   } else {
    //     difficultyText = "Hard";
    //   }
    //
    //   this.elements.difficultyDisplay.textContent = `Difficulty: ${difficultyText}`;
    // }
  }

  /**
   * Update company info
   * @private
   */
  _updateCompanyInfo() {
    this.elements.companyNameDisplay.textContent = this.game.company.name;
    this.elements.companyIndustryDisplay.textContent = this._getIndustryName(
      this.game.company.industry
    );
  }

  /**
   * Update active screen
   * @private
   */
  _updateActiveScreen() {
    this._populateScreenData(this.activeScreen);
  }

  /**
   * Populate dashboard screen
   * @private
   */
  _populateDashboard() {
    const dashboardDiv = document.querySelector(
      "#dashboard-screen .dashboard-metrics"
    );

    // Clear existing content
    dashboardDiv.innerHTML = "";

    // KPIs for the dashboard
    const kpis = [
      {
        title: "Monthly Revenue",
        value: `$${this.game.company.revenue.toLocaleString()}`,
        trend: this.game.company.revenue > 0 ? "up" : "neutral",
      },
      {
        title: "Total Users",
        value: this.game.company.users.toLocaleString(),
        trend: this.game.company.growthRate > 0 ? "up" : "down",
      },
      {
        title: "Growth Rate",
        value: `${(this.game.company.growthRate * 100).toFixed(1)}%`,
        trend: this.game.company.growthRate > 0.05 ? "up" : "down",
      },
      {
        title: "Burn Rate",
        value: `${this.game.company.burnRate >= 0 ? "+" : ""}$${Math.abs(
          this.game.company.burnRate
        ).toLocaleString()}/mo`,
        trend: this.game.company.burnRate >= 0 ? "up" : "down",
      },
      {
        title: "Runway",
        value:
          this.game.company.runway === Infinity
            ? "∞"
            : `${this.game.company.runway} months`,
        trend: this.game.company.runway > 12 ? "up" : "down",
      },
      {
        title: "Product Quality",
        value: `${Math.round(this.game.company.product.quality * 100)}%`,
        trend: this.game.company.product.quality > 0.5 ? "up" : "down",
      },
      {
        title: "Team Size",
        value: this.game.company.team.employees.length,
        trend: "neutral",
      },
      {
        title: "Team Morale",
        value: `${Math.round(this.game.company.team.morale * 100)}%`,
        trend: this.game.company.team.morale > 0.7 ? "up" : "down",
      },
      {
        title: "Market Sentiment",
        value: this.game.market.getSentimentDescription(),
        trend: this.game.market.sentimentIndex > 0.5 ? "up" : "down",
      },
      {
        title: "Funding Environment",
        value: this.game.market.getFundingDescription(),
        trend: this.game.market.fundingAvailability > 1.0 ? "up" : "down",
      },
      {
        title: "Your Equity",
        value: `${Math.round(this.game.company.equity.player * 100)}%`,
        trend: "neutral",
      },
    ];

    // Add KPI cards to dashboard
    kpis.forEach((kpi) => {
      const metricCard = document.createElement("div");
      metricCard.className = "metric-card";

      metricCard.innerHTML = `
                <h3>${kpi.title}</h3>
                <div class="metric-value">${kpi.value}</div>
                <div class="metric-trend ${
                  kpi.trend === "up"
                    ? "trend-up"
                    : kpi.trend === "down"
                    ? "trend-down"
                    : ""
                }">
                    ${
                      kpi.trend === "up"
                        ? "↑"
                        : kpi.trend === "down"
                        ? "↓"
                        : "–"
                    }
                </div>
            `;

      dashboardDiv.appendChild(metricCard);
    });

    // Add difficulty info to dashboard if dynamic difficulty is enabled
    // if (this.game.dynamicDifficulty) {
    //   this._addDifficultyInfoToDashboard(dashboardDiv);
    // }
  }

  /**
   * Add difficulty information to the dashboard
   * @param {HTMLElement} dashboardDiv - The dashboard container element
   * @private
   */
  _addDifficultyInfoToDashboard(dashboardDiv) {
    const difficultySection = document.createElement("div");
    difficultySection.className = "dashboard-section difficulty-info";

    // Create section header
    const sectionHeader = document.createElement("h3");
    sectionHeader.textContent = "Market Conditions";
    difficultySection.appendChild(sectionHeader);

    // Get difficulty info
    const difficultyMultiplier =
      this.game.dynamicDifficulty.difficultyMultiplier;
    let difficultyText = "Normal";
    let marketConditionText = "Stable";

    if (difficultyMultiplier <= 0.8) {
      difficultyText = "Easy";
      marketConditionText = "Favorable";
    } else if (difficultyMultiplier <= 0.95) {
      difficultyText = "Moderate";
      marketConditionText = "Mostly Favorable";
    } else if (difficultyMultiplier <= 1.05) {
      difficultyText = "Normal";
      marketConditionText = "Stable";
    } else if (difficultyMultiplier <= 1.2) {
      difficultyText = "Challenging";
      marketConditionText = "Competitive";
    } else {
      difficultyText = "Hard";
      marketConditionText = "Highly Competitive";
    }

    // Create difficulty info content
    const infoContent = document.createElement("div");
    infoContent.className = "difficulty-info-content";

    // Add market condition info
    const marketCondition = document.createElement("div");
    marketCondition.className = "difficulty-metric";
    marketCondition.innerHTML = `<span class="metric-label">Market Condition:</span> <span class="metric-value">${marketConditionText}</span>`;
    infoContent.appendChild(marketCondition);

    // Add competitor aggressiveness info
    const competitorAggressiveness = document.createElement("div");
    competitorAggressiveness.className = "difficulty-metric";
    const aggressivenessLevel =
      difficultyMultiplier > 1.1
        ? "High"
        : difficultyMultiplier > 0.9
        ? "Medium"
        : "Low";
    competitorAggressiveness.innerHTML = `<span class="metric-label">Competitor Aggressiveness:</span> <span class="metric-value">${aggressivenessLevel}</span>`;
    infoContent.appendChild(competitorAggressiveness);

    // Add operational costs info
    const operationalCosts = document.createElement("div");
    operationalCosts.className = "difficulty-metric";
    const costsLevel =
      difficultyMultiplier > 1.1
        ? "Rising"
        : difficultyMultiplier > 0.9
        ? "Stable"
        : "Decreasing";
    operationalCosts.innerHTML = `<span class="metric-label">Operational Costs:</span> <span class="metric-value">${costsLevel}</span>`;
    infoContent.appendChild(operationalCosts);

    // Add market growth info
    const marketGrowth = document.createElement("div");
    marketGrowth.className = "difficulty-metric";
    const growthLevel =
      difficultyMultiplier > 1.1
        ? "Slowing"
        : difficultyMultiplier > 0.9
        ? "Steady"
        : "Accelerating";
    marketGrowth.innerHTML = `<span class="metric-label">Market Growth:</span> <span class="metric-value">${growthLevel}</span>`;
    infoContent.appendChild(marketGrowth);

    // Add info content to section
    difficultySection.appendChild(infoContent);

    // Add section to dashboard
    dashboardDiv.appendChild(difficultySection);
  }

  /**
   * Populate the product screen with current product data
   * @private
   */
  _populateProductScreen() {
    const productDiv = document.getElementById("product-screen");
    productDiv.innerHTML = "";

    // Product quality indicator
    const qualityDiv = document.createElement("div");
    qualityDiv.className = "product-quality";
    qualityDiv.innerHTML = `
      <h3>Product Quality</h3>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${
          this.game.company.product.quality * 100
        }%"></div>
        <span>${Math.round(
          this.game.company.product.quality * 100
        )}% Quality</span>
      </div>
    `;
    productDiv.appendChild(qualityDiv);

    // Feature development section
    const featureDevDiv = document.createElement("div");
    featureDevDiv.className = "feature-development";
    featureDevDiv.innerHTML = `<h3>Develop New Feature</h3>`;

    // Create form for developing new features
    const featureForm = document.createElement("form");
    featureForm.className = "feature-form";
    featureForm.innerHTML = `
      <div class="form-group">
        <label for="feature-complexity">Feature Complexity:</label>
        <select id="feature-complexity" required>
          <option value="simple">Simple (${CONFIG.FEATURE_COMPLEXITY_LEVELS.simple.cost.toLocaleString()} cost, ${
      CONFIG.FEATURE_COMPLEXITY_LEVELS.simple.time
    } turns)</option>
          <option value="medium" selected>Medium (${CONFIG.FEATURE_COMPLEXITY_LEVELS.medium.cost.toLocaleString()} cost, ${
      CONFIG.FEATURE_COMPLEXITY_LEVELS.medium.time
    } turns)</option>
          <option value="complex">Complex (${CONFIG.FEATURE_COMPLEXITY_LEVELS.complex.cost.toLocaleString()} cost, ${
      CONFIG.FEATURE_COMPLEXITY_LEVELS.complex.time
    } turns)</option>
        </select>
      </div>
      <div class="feature-info">
        <p>Features will be automatically generated based on your product's industry and selected complexity level.</p>
        <p>Some features may require other features to be completed first.</p>
      </div>
      <button type="submit" class="btn" id="develop-feature-btn">Start Development</button>
    `;

    featureDevDiv.appendChild(featureForm);
    productDiv.appendChild(featureDevDiv);

    // Display feature categories
    const categories =
      CONFIG.FEATURE_CATEGORIES[this.game.company.industry] || [];
    if (categories.length > 0) {
      const categoriesDiv = document.createElement("div");
      categoriesDiv.className = "feature-categories";
      categoriesDiv.innerHTML = `<h3>Feature Categories</h3>`;

      const categoriesList = document.createElement("div");
      categoriesList.className = "categories-list";

      categories.forEach((category) => {
        const categoryItem = document.createElement("div");
        categoryItem.className = "category-item";
        categoryItem.innerHTML = `
          <h4>${category.name}</h4>
          <p>${category.description}</p>
        `;
        categoriesList.appendChild(categoryItem);
      });

      categoriesDiv.appendChild(categoriesList);
      productDiv.appendChild(categoriesDiv);
    }

    // Display existing features
    const featuresDiv = document.createElement("div");
    featuresDiv.className = "existing-features";
    featuresDiv.innerHTML = `<h3>Features</h3>`;

    // Group features by category
    const featuresByCategory = {};
    this.game.company.product.features.forEach((feature) => {
      if (!featuresByCategory[feature.categoryName]) {
        featuresByCategory[feature.categoryName] = [];
      }
      featuresByCategory[feature.categoryName].push(feature);
    });

    // Create a container for all features
    const featuresContainer = document.createElement("div");
    featuresContainer.className = "features-container";

    // Display features by category
    Object.keys(featuresByCategory).forEach((categoryName) => {
      const categoryDiv = document.createElement("div");
      categoryDiv.className = "feature-category-group";
      categoryDiv.innerHTML = `<h4>${categoryName}</h4>`;

      const categoryFeatures = document.createElement("div");
      categoryFeatures.className = "category-features";

      featuresByCategory[categoryName].forEach((feature) => {
        const featureItem = document.createElement("div");
        featureItem.className = `feature-item ${
          feature.completed ? "completed" : "in-progress"
        }`;

        // Get dependency names
        let dependencyText = "";
        if (feature.dependencies && feature.dependencies.length > 0) {
          const dependencyNames = feature.dependencies.join(", ");
          dependencyText = `<div class="feature-dependencies">Requires: ${dependencyNames}</div>`;
        }

        featureItem.innerHTML = `
          <div class="feature-header">
            <h4>${feature.name}</h4>
            <span class="feature-complexity ${feature.complexity}">${
          feature.complexity
        }</span>
          </div>
          <p>${feature.description}</p>
          ${dependencyText}
          <div class="feature-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${
                feature.progress * 100
              }%"></div>
              <span>${Math.round(feature.progress * 100)}%</span>
            </div>
          </div>
          <div class="feature-details">
            <span>Cost: $${feature.cost.toLocaleString()}</span>
            <span>Time: ${feature.timeRequired} turns</span>
            <span>Impact: +${Math.round(feature.impact * 100)}% quality</span>
          </div>
        `;

        categoryFeatures.appendChild(featureItem);
      });

      categoryDiv.appendChild(categoryFeatures);
      featuresContainer.appendChild(categoryDiv);
    });

    // If no features by category, show the original flat list
    if (Object.keys(featuresByCategory).length === 0) {
      const featuresList = document.createElement("div");
      featuresList.className = "features-list";

      this.game.company.product.features.forEach((feature) => {
        const featureItem = document.createElement("div");
        featureItem.className = `feature-item ${
          feature.completed ? "completed" : "in-progress"
        }`;
        featureItem.innerHTML = `
          <div class="feature-header">
            <h4>${feature.name}</h4>
            <span class="feature-complexity ${feature.complexity}">${
          feature.complexity
        }</span>
          </div>
          <p>${feature.description}</p>
          <div class="feature-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${
                feature.progress * 100
              }%"></div>
              <span>${Math.round(feature.progress * 100)}%</span>
            </div>
          </div>
          <div class="feature-details">
            <span>Cost: $${feature.cost.toLocaleString()}</span>
            <span>Time: ${feature.timeRequired} turns</span>
            <span>Impact: +${Math.round(feature.impact * 100)}% quality</span>
          </div>
        `;
        featuresList.appendChild(featureItem);
      });

      featuresContainer.appendChild(featuresList);
    }

    featuresDiv.appendChild(featuresContainer);
    productDiv.appendChild(featuresDiv);

    // Add event listener for feature development form
    featureForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const complexitySelect = document.getElementById("feature-complexity");
      const complexity = complexitySelect.value;

      // Check if company has enough cash
      const cost = CONFIG.FEATURE_COMPLEXITY_LEVELS[complexity].cost;
      if (this.game.company.cash < cost) {
        this.showNotification(
          `Not enough cash to develop a ${complexity} feature. Need $${cost.toLocaleString()}.`,
          "error"
        );
        return;
      }

      // Develop the feature
      const feature = this.game.company.developFeature({
        complexity: complexity,
      });

      // Show notification
      this.showNotification(
        `Started development of new feature: ${feature.name}`,
        "success"
      );

      // Refresh the product screen
      this._populateProductScreen();
    });
  }

  /**
   * Populate team screen
   * @private
   */
  _populateTeamScreen() {
    const teamDiv = document.querySelector("#team-screen .team-stats");

    // Clear existing content
    teamDiv.innerHTML = "";

    // Team morale section
    const moraleSection = document.createElement("div");
    moraleSection.className = "team-section";
    moraleSection.innerHTML = `
            <h3>Team Morale</h3>
            <div class="metric-value">${Math.round(
              this.game.company.team.morale * 100
            )}%</div>
            <div class="retro-progress">
                <div class="retro-progress-bar" style="width:${
                  this.game.company.team.morale * 100
                }%"></div>
                <div class="retro-progress-value">${Math.round(
                  this.game.company.team.morale * 100
                )}%</div>
            </div>
        `;
    teamDiv.appendChild(moraleSection);

    // Hiring section
    const hiringSection = document.createElement("div");
    hiringSection.className = "team-section";
    hiringSection.innerHTML = `
            <h3>Recruitment</h3>
            <div class="form-group">
                <label for="role-select">Hire New Employee:</label>
                <select id="role-select">
                    <option value="developer">Developer - $${CONFIG.EMPLOYEE_BASE_SALARY.developer.toLocaleString()}/mo</option>
                    <option value="designer">Designer - $${CONFIG.EMPLOYEE_BASE_SALARY.designer.toLocaleString()}/mo</option>
                    <option value="marketer">Marketer - $${CONFIG.EMPLOYEE_BASE_SALARY.marketer.toLocaleString()}/mo</option>
                    <option value="salesperson">Salesperson - $${CONFIG.EMPLOYEE_BASE_SALARY.salesperson.toLocaleString()}/mo</option>
                    <option value="manager">Manager - $${
                      CONFIG.EMPLOYEE_BASE_SALARY.manager || 12000
                    }/mo</option>
                </select>
            </div>
            <button id="hire-button" class="primary-button">Hire Employee</button>
        `;
    teamDiv.appendChild(hiringSection);

    // Add hire button handler
    const hireButton = hiringSection.querySelector("#hire-button");
    hireButton.addEventListener("click", () => {
      const roleSelect = hiringSection.querySelector("#role-select");
      const role = roleSelect.value;
      const salary = CONFIG.EMPLOYEE_BASE_SALARY[role];

      // Check if we can afford this
      if (this.game.company.cash < salary * 3) {
        this.game.addNotification(
          `Not enough cash to hire. Need at least 3 months of salary (${(
            salary * 3
          ).toLocaleString()}).`,
          "error"
        );
        return;
      }

      // Hire the employee
      const employee = this.game.company.hireEmployee(role);

      // Add notification
      this.game.addNotification(`Hired ${employee.name} as ${role}`, "success");

      // Refresh the team display
      this._populateTeamScreen();
    });

    // Employee list section
    const employeesSection = document.createElement("div");
    employeesSection.className = "team-section employee-section";
    employeesSection.innerHTML = `
            <h3>Current Team (${this.game.company.team.employees.length} employees)</h3>
            <div class="employee-list"></div>
        `;
    teamDiv.appendChild(employeesSection);

    // Populate employee list
    const employeeList = employeesSection.querySelector(".employee-list");

    this.game.company.team.employees.forEach((employee) => {
      const employeeItem = document.createElement("div");
      employeeItem.className = "employee-item";

      employeeItem.innerHTML = `
                <div>
                    <div class="employee-name">${employee.name}</div>
                    <div class="employee-role">${employee.role}</div>
                </div>
                <div class="employee-salary">${
                  employee.salary
                    ? "$" + employee.salary.toLocaleString() + "/mo"
                    : "No salary"
                }</div>
                ${
                  employee.role !== "founder"
                    ? `
                    <button class="fire-button" data-employee-id="${employee.id}">Fire</button>
                `
                    : ""
                }
            `;

      employeeList.appendChild(employeeItem);
    });

    // Add fire button handlers
    const fireButtons = employeeList.querySelectorAll(".fire-button");
    fireButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const employeeId = parseInt(
          button.getAttribute("data-employee-id"),
          10
        );

        // Confirm before firing
        if (confirm("Are you sure you want to fire this employee?")) {
          const employee = this.game.company.fireEmployee(employeeId);

          if (employee) {
            // Add notification
            this.game.addNotification(`Fired ${employee.name}`, "info");

            // Refresh the team display
            this._populateTeamScreen();
          }
        }
      });
    });

    // Team metrics section
    const metricsSection = document.createElement("div");
    metricsSection.className = "team-section";

    // Count employees by role
    const roleCounts = {};
    this.game.company.team.employees.forEach((employee) => {
      roleCounts[employee.role] = (roleCounts[employee.role] || 0) + 1;
    });

    // Calculate total salary
    const totalMonthlySalary = this.game.company.team.employees.reduce(
      (sum, emp) => sum + (emp.salary || 0),
      0
    );

    metricsSection.innerHTML = `
            <h3>Team Metrics</h3>
            <div class="team-metrics">
                <div>Developers: ${roleCounts.developer || 0}</div>
                <div>Designers: ${roleCounts.designer || 0}</div>
                <div>Marketers: ${roleCounts.marketer || 0}</div>
                <div>Salespeople: ${roleCounts.salesperson || 0}</div>
                <div>Managers: ${roleCounts.manager || 0}</div>
                <div>Total Monthly Salary: $${totalMonthlySalary.toLocaleString()}</div>
            </div>
        `;
    teamDiv.appendChild(metricsSection);
  }

  /**
   * Populate marketing screen
   * @private
   */
  _populateMarketingScreen() {
    const marketingDiv = document.querySelector(
      "#marketing-screen .marketing-options"
    );

    // Clear existing content
    marketingDiv.innerHTML = "";

    // Add info about persistent marketing budgets
    const infoDiv = document.createElement("div");
    infoDiv.className = "marketing-info";
    infoDiv.innerHTML = `
      <div class="info-box">
        <h3>Marketing Budget Info</h3>
        <p>Marketing budgets are persistent and will automatically be reapplied each month.</p>
        <p>Budgets will only be applied if you have sufficient cash available.</p>
      </div>
    `;
    marketingDiv.appendChild(infoDiv);

    // Add brand awareness
    const brandDiv = document.createElement("div");
    brandDiv.className = "marketing-channel";
    brandDiv.innerHTML = `
            <h3>Brand Awareness</h3>
            <div class="metric-value">${Math.round(
              this.game.company.marketing.brand * 100
            )}%</div>
            <div class="retro-progress">
                <div class="retro-progress-bar" style="width:${
                  this.game.company.marketing.brand * 100
                }%"></div>
                <div class="retro-progress-value">${Math.round(
                  this.game.company.marketing.brand * 100
                )}%</div>
            </div>
        `;
    marketingDiv.appendChild(brandDiv);

    // User acquisition stats
    const userStatsDiv = document.createElement("div");
    userStatsDiv.className = "marketing-channel";
    userStatsDiv.innerHTML = `
            <h3>User Metrics</h3>
            <div class="channel-stats">
                <div>Current Users: ${this.game.company.users.toLocaleString()}</div>
                <div>Monthly Growth: ${(
                  this.game.company.growthRate * 100
                ).toFixed(1)}%</div>
                <div>Churn Rate: ${(this.game.company.churnRate * 100).toFixed(
                  1
                )}%</div>
            </div>
        `;
    marketingDiv.appendChild(userStatsDiv);

    // Marketing channels
    CONFIG.MARKETING_CHANNELS.forEach((channel) => {
      const channelData = this.game.company.marketing.channels[channel.id] || {
        budget: 0,
        acquisitions: 0,
      };

      // Calculate saturation effects for display
      let saturationText = "";
      let saturationClass = "";

      if (channelData.usageHistory && channelData.usageHistory.length > 0) {
        const recentUsageSum = channelData.usageHistory.reduce(
          (sum, val) => sum + val,
          0
        );
        const channelSaturation = Math.max(0.6, 1 - recentUsageSum / 20);

        if (channelSaturation < 0.7) {
          saturationText = "Highly Saturated";
          saturationClass = "high-saturation";
        } else if (channelSaturation < 0.8) {
          saturationText = "Moderately Saturated";
          saturationClass = "medium-saturation";
        } else if (channelSaturation < 0.9) {
          saturationText = "Slightly Saturated";
          saturationClass = "low-saturation";
        } else {
          saturationText = "Fresh";
          saturationClass = "no-saturation";
        }
      } else {
        saturationText = "Fresh";
        saturationClass = "no-saturation";
      }

      // Calculate market saturation based on game progress
      const marketSaturation = Math.max(
        0.5,
        1 - (this.game.state.currentTurn / 100) * 0.5
      );
      let marketSaturationText = "";

      if (marketSaturation < 0.6) {
        marketSaturationText = "Market highly saturated with ads";
      } else if (marketSaturation < 0.75) {
        marketSaturationText = "Market becoming saturated with ads";
      } else {
        marketSaturationText = "Market still receptive to ads";
      }

      const channelDiv = document.createElement("div");
      channelDiv.className = "marketing-channel";
      channelDiv.innerHTML = `
                <h3>${channel.name}</h3>
                <div class="channel-stats">
                    <div>Cost Per User: $${channel.costPerUser}</div>
                    <div>Base Efficiency: ${Math.round(
                      channel.efficiency * 100
                    )}%</div>
                    <div>Channel Status: <span class="${saturationClass}">${saturationText}</span></div>
                    <div class="market-saturation-info">${marketSaturationText}</div>
                    <div>Last Month Acquisitions: ${channelData.acquisitions.toLocaleString()} users</div>
                    
                </div>
                <div class="slider-container">
                    <div class="slider-header">
                        <label for="${
                          channel.id
                        }-budget">Monthly Budget:</label>
                        <span class="slider-value">$<span id="${
                          channel.id
                        }-value">${channelData.budget.toLocaleString()}</span></span>
                    </div>
                    <input 
                        type="range" 
                        id="${channel.id}-budget" 
                        min="0" 
                        max="${Math.min(this.game.company.cash, 500000)}" 
                        step="1000" 
                        value="${channelData.budget}"
                        data-channel="${channel.id}"
                        class="channel-slider"
                    >
                </div>
                <button class="allocate-button" data-channel="${
                  channel.id
                }">Set Monthly Budget</button>
            `;
      marketingDiv.appendChild(channelDiv);

      // Add slider event listener
      const slider = channelDiv.querySelector(`#${channel.id}-budget`);
      const valueDisplay = channelDiv.querySelector(`#${channel.id}-value`);

      slider.addEventListener("input", function () {
        valueDisplay.textContent = parseInt(this.value).toLocaleString();
      });

      // Add allocate button handler
      const allocateButton = channelDiv.querySelector(".allocate-button");
      allocateButton.addEventListener("click", () => {
        const budget = parseInt(slider.value);

        // Allocate the budget
        this.game.company.allocateMarketingBudget(channel.id, budget);

        // Add notification
        this.game.addNotification(
          `Allocated $${budget.toLocaleString()} to ${channel.name}`,
          "success"
        );

        // Update stats
        this._updateStatsDisplay();
      });
    });
  }

  /**
   * Populate funding screen
   * @private
   */
  _populateFundingScreen() {
    const fundingDiv = document.querySelector(
      "#funding-screen .financial-info"
    );

    // Clear existing content
    fundingDiv.innerHTML = "";

    // Financial overview
    const overviewSection = document.createElement("div");
    overviewSection.className = "financial-section";
    overviewSection.innerHTML = `
            <h3>Financial Overview</h3>
            <table class="financial-table">
                <tr>
                    <th>Cash on Hand</th>
                    <td>$${this.game.company.cash.toLocaleString()}</td>
                </tr>
                <tr>
                    <th>Monthly Revenue</th>
                    <td class="positive-value">$${this.game.company.revenue.toLocaleString()}</td>
                </tr>
                <tr>
                    <th>Monthly Recurring Expenses</th>
                    <td class="negative-value">$${(
                      this.game.company.costs -
                      this.game.company.marketing.budget
                    ).toLocaleString()}</td>
                </tr>
                <tr>
                    <th>Marketing Expenses (already deducted)</th>
                    <td class="negative-value">$${this.game.company.marketing.budget.toLocaleString()}</td>
                </tr>
                <tr>
                    <th>Burn Rate</th>
                    <td class="${
                      this.game.company.burnRate >= 0
                        ? "positive-value"
                        : "negative-value"
                    }">
                        ${
                          this.game.company.burnRate >= 0 ? "+" : ""
                        }$${Math.abs(
      this.game.company.burnRate
    ).toLocaleString()}/mo
                    </td>
                </tr>
                <tr>
                    <th>Runway</th>
                    <td>${
                      this.game.company.runway === Infinity
                        ? "∞"
                        : `${this.game.company.runway} months`
                    }</td>
                </tr>
                <tr>
                    <th>Current Valuation</th>
                    <td>$${this.game.company.valuation.toLocaleString()}</td>
                </tr>
            </table>
        `;
    fundingDiv.appendChild(overviewSection);

    // Equity breakdown
    const equitySection = document.createElement("div");
    equitySection.className = "financial-section";

    // Build equity table rows
    let equityRows = `
            <tr>
                <th>You (Founder)</th>
                <td>${Math.round(this.game.company.equity.player * 100)}%</td>
            </tr>
        `;

    // Add investor rows
    for (const [investor, equity] of Object.entries(
      this.game.company.equity.investors || {}
    )) {
      equityRows += `
                <tr>
                    <th>${investor}</th>
                    <td>${Math.round(equity * 100)}%</td>
                </tr>
            `;
    }

    equitySection.innerHTML = `
            <h3>Equity Breakdown</h3>
            <table class="financial-table">
                ${equityRows}
            </table>
        `;
    fundingDiv.appendChild(equitySection);

    // Funding history
    const historySection = document.createElement("div");
    historySection.className = "financial-section";

    // Build funding history table
    let historyRows = "";

    if (
      this.game.company.fundingHistory &&
      this.game.company.fundingHistory.length > 0
    ) {
      this.game.company.fundingHistory.forEach((round) => {
        historyRows += `
                    <tr>
                        <td>${round.round}</td>
                        <td>$${round.amount.toLocaleString()}</td>
                        <td>$${round.valuation.toLocaleString()}</td>
                        <td>${Math.round(round.equity * 100)}%</td>
                        <td>${round.investor}</td>
                    </tr>
                `;
      });
    } else {
      historyRows = `
                <tr>
                    <td colspan="5" class="empty-state">No funding rounds yet</td>
                </tr>
            `;
    }

    historySection.innerHTML = `
            <h3>Funding History</h3>
            <table class="financial-table">
                <tr>
                    <th>Round</th>
                    <th>Amount</th>
                    <th>Valuation</th>
                    <th>Equity</th>
                    <th>Investor</th>
                </tr>
                ${historyRows}
            </table>
        `;
    fundingDiv.appendChild(historySection);

    // Raise funding section
    const raiseSection = document.createElement("div");
    raiseSection.className = "financial-section";

    // Determine next available funding round
    let nextRound = "seed";
    if (this.game.company.fundingRound === "series-c") {
      nextRound = "ipo";
    } else if (this.game.company.fundingRound === "series-b") {
      nextRound = "series-c";
    } else if (this.game.company.fundingRound === "series-a") {
      nextRound = "series-b";
    } else if (this.game.company.fundingRound === "seed") {
      nextRound = "series-a";
    }

    let roundConfig = CONFIG.FUNDING_ROUNDS.find(
      (r) => r.name.toLowerCase() === nextRound
    );
    let canRaise =
      roundConfig && this.game.company.valuation >= roundConfig.minValuation;

    // Add special case for IPO
    if (nextRound === "ipo") {
      canRaise = this.game.company.valuation >= CONFIG.IPO_VALUATION_THRESHOLD;
    }

    raiseSection.innerHTML = `
            <h3>Raise Funding</h3>
            <div class="funding-options">
                <p>Current Funding Round: ${this.game.company.fundingRound}</p>
                <p>Next Available Round: ${nextRound.toUpperCase()}</p>
                ${
                  !canRaise
                    ? `
                    <p class="warning">Your valuation is too low for the next funding round.</p>
                    ${
                      roundConfig
                        ? `<p>You need a valuation of at least $${roundConfig.minValuation.toLocaleString()}.</p>`
                        : ""
                    }
                `
                    : ""
                }
                
                <button id="raise-funding-button" class="primary-button" ${
                  !canRaise ? "disabled" : ""
                }>
                    Raise ${nextRound.toUpperCase()} Funding
                </button>
            </div>
        `;
    fundingDiv.appendChild(raiseSection);

    // Add raise funding button handler
    const raiseButton = raiseSection.querySelector("#raise-funding-button");
    if (canRaise) {
      raiseButton.addEventListener("click", () => {
        // Handle IPO separately
        if (nextRound === "ipo") {
          this._handleIPO();
          return;
        }

        // Regular funding round
        const result = this.game.company.raiseFunding(nextRound);

        if (result.success) {
          // Show success message
          const successModal = document.createElement("div");
          successModal.className = "modal";
          successModal.innerHTML = `
                        <div class="modal-content">
                            <h2>Funding Secured!</h2>
                            <p>You raised $${result.investmentAmount.toLocaleString()} from ${
            result.investor
          } at a valuation of $${result.valuation.toLocaleString()}.</p>
                            <p>You gave up ${result.equityPercentage.toFixed(
                              1
                            )}% equity in this round.</p>
                            <button id="close-funding-modal" class="primary-button">Continue</button>
                        </div>
                    `;
          document.body.appendChild(successModal);

          // Add close button handler
          const closeButton = successModal.querySelector(
            "#close-funding-modal"
          );
          closeButton.addEventListener("click", () => {
            document.body.removeChild(successModal);
            this.modalOpen = false;

            // Refresh the funding screen
            this._populateFundingScreen();
          });

          this.modalOpen = true;
        } else {
          // Show failure message
          this.game.addNotification(
            `Failed to raise funding: ${result.reason}`,
            "error"
          );
        }

        // Update stats
        this._updateStatsDisplay();
      });
    }
  }

  /**
   * Populate market screen
   * @private
   */
  _populateMarketScreen() {
    const marketDiv = document.querySelector("#market-screen .market-news");

    // Clear existing content
    marketDiv.innerHTML = "";

    // Market overview
    const overviewSection = document.createElement("div");
    overviewSection.className = "panel";
    overviewSection.innerHTML = `
            <h3>Market Overview</h3>
            <div class="market-stats">
                <div>Market Growth: ${(
                  this.game.market.growthRate * 100
                ).toFixed(1)}%</div>
                <div>Market Sentiment: ${this.game.market.getSentimentDescription()}</div>
                <div>Funding Availability: ${this.game.market.getFundingDescription()}</div>
                <div>Current Cycle: ${this._formatMarketCycle(
                  this.game.market.currentCycle
                )}</div>
            </div>
        `;
    marketDiv.appendChild(overviewSection);

    // Active trends
    const trendsSection = document.createElement("div");
    trendsSection.className = "panel";

    // Build trends list
    let trendsHtml = "";
    if (this.game.market.trends && this.game.market.trends.length > 0) {
      this.game.market.trends.forEach((trend) => {
        trendsHtml += `
                    <div class="trend-item">
                        <div class="trend-name">${trend.name}</div>
                        <div class="trend-industries">Affects: ${trend.affectedIndustries
                          .map((ind) => this._getIndustryName(ind))
                          .join(", ")}</div>
                        <div class="retro-progress">
                            <div class="retro-progress-bar" style="width:${
                              trend.progress * 100
                            }%"></div>
                            <div class="retro-progress-value">${Math.round(
                              trend.progress * 100
                            )}%</div>
                        </div>
                    </div>
                `;
      });
    } else {
      trendsHtml = '<div class="empty-state">No active market trends</div>';
    }

    trendsSection.innerHTML = `
            <h3>Market Trends</h3>
            <div class="trends-list">
                ${trendsHtml}
            </div>
        `;
    marketDiv.appendChild(trendsSection);

    // Events list
    const eventsSection = document.createElement("div");
    eventsSection.className = "panel";

    // Build events list
    let eventsHtml = "";
    if (this.game.state.events && this.game.state.events.length > 0) {
      // Get last 5 events
      const recentEvents = [...this.game.state.events].reverse().slice(0, 5);

      recentEvents.forEach((event) => {
        eventsHtml += `
                    <div class="news-item">
                        <div class="news-title">${event.title}</div>
                        <div class="news-date">Turn ${event.turn}</div>
                        <div class="news-content">${event.description}</div>
                    </div>
                `;
      });
    } else {
      eventsHtml = '<div class="empty-state">No recent events</div>';
    }

    eventsSection.innerHTML = `
            <h3>Recent Events</h3>
            <div class="events-list">
                ${eventsHtml}
            </div>
        `;
    marketDiv.appendChild(eventsSection);

    // Competitors list
    const competitorsSection = document.createElement("div");
    competitorsSection.className = "competitor-list";

    // Build competitors list
    let competitors = this.game.competitors.filter((c) => c.isActive);

    if (competitors.length > 0) {
      competitors.forEach((competitor) => {
        const competitorDiv = document.createElement("div");
        competitorDiv.className = "competitor-card";
        competitorDiv.innerHTML = `
                    <div class="competitor-header">
                        <span class="competitor-name">${competitor.name}</span>
                        <span class="competitor-valuation">$${competitor.valuation.toLocaleString()}</span>
                    </div>
                    <div class="competitor-details">
                        <div>Industry: ${this._getIndustryName(
                          competitor.industry
                        )}</div>
                        <div>Strategy: ${this._formatStrategy(
                          competitor.strategy
                        )}</div>
                        <div>Funding: ${competitor.fundingRound}</div>
                    </div>
                    <div class="competitor-stats">
                        <div class="competitor-stat">
                            <div class="competitor-stat-value">${competitor.users.toLocaleString()}</div>
                            <div class="competitor-stat-label">Users</div>
                        </div>
                        <div class="competitor-stat">
                            <div class="competitor-stat-value">${Math.round(
                              competitor.product.quality * 100
                            )}%</div>
                            <div class="competitor-stat-label">Product</div>
                        </div>
                        <div class="competitor-stat">
                            <div class="competitor-stat-value">${Math.round(
                              competitor.marketing.brand * 100
                            )}%</div>
                            <div class="competitor-stat-label">Brand</div>
                        </div>
                    </div>
                `;
        competitorsSection.appendChild(competitorDiv);
      });
    } else {
      const noCompetitorsDiv = document.createElement("div");
      noCompetitorsDiv.className = "empty-state";
      noCompetitorsDiv.textContent = "No active competitors";
      competitorsSection.appendChild(noCompetitorsDiv);
    }

    // Create a container for the competitors section
    const competitorsContainer = document.createElement("div");
    competitorsContainer.className = "panel";
    competitorsContainer.innerHTML = `<h3>Competitors</h3>`;
    competitorsContainer.appendChild(competitorsSection);

    marketDiv.appendChild(competitorsContainer);
  }

  /**
   * Handle IPO process
   * @private
   */
  _handleIPO() {
    const company = this.game.company;

    // Calculate IPO valuation (typically at a premium to current valuation)
    const ipoValuation = Math.round(company.valuation * 1.2);

    // Calculate how much the player can cash out (up to 20% of their equity)
    const maxCashoutPercent = 0.2;
    const maxCashoutEquity = company.equity.player * maxCashoutPercent;
    const cashoutValue = Math.round(ipoValuation * maxCashoutEquity);

    // Show IPO modal
    const ipoModal = document.createElement("div");
    ipoModal.className = "modal";
    ipoModal.innerHTML = `
            <div class="modal-content">
                <h2>Initial Public Offering</h2>
                <p>You're ready to take your company public!</p>
                <p>IPO Valuation: $${ipoValuation.toLocaleString()}</p>
                <p>Your current equity: ${Math.round(
                  company.equity.player * 100
                )}%</p>
                <p>You can sell up to ${Math.round(
                  maxCashoutPercent * 100
                )}% of your equity in the IPO.</p>
                <p>This would give you $${cashoutValue.toLocaleString()} in cash.</p>
                
                <div class="ipo-choices">
                    <button id="ipo-button" class="primary-button">Go Public (Cash out ${Math.round(
                      maxCashoutPercent * 100
                    )}%)</button>
                    <button id="cancel-ipo-button" class="secondary-button">Cancel IPO</button>
                </div>
            </div>
        `;
    document.body.appendChild(ipoModal);

    // Add button handlers
    const ipoButton = ipoModal.querySelector("#ipo-button");
    ipoButton.addEventListener("click", () => {
      // Process the IPO
      this.game.gameOver("ipo", {
        ipoValue: ipoValuation,
        playerPayout: cashoutValue,
      });

      // Remove the modal
      document.body.removeChild(ipoModal);
      this.modalOpen = false;
    });

    const cancelButton = ipoModal.querySelector("#cancel-ipo-button");
    cancelButton.addEventListener("click", () => {
      document.body.removeChild(ipoModal);
      this.modalOpen = false;
    });

    this.modalOpen = true;
  }

  /**
   * Format market cycle for display
   * @param {string} cycle - Market cycle
   * @returns {string} Formatted cycle name
   * @private
   */
  _formatMarketCycle(cycle) {
    switch (cycle) {
      case "boom":
        return "Economic Boom";
      case "bust":
        return "Economic Downturn";
      case "neutral":
        return "Neutral Market";
      default:
        return cycle;
    }
  }

  /**
   * Format competitor strategy for display
   * @param {string} strategy - Competitor strategy
   * @returns {string} Formatted strategy name
   * @private
   */
  _formatStrategy(strategy) {
    switch (strategy) {
      case "growth":
        return "Aggressive Growth";
      case "product":
        return "Product Development";
      case "consolidation":
        return "Consolidation";
      case "pivot":
        return "Pivoting";
      default:
        return strategy;
    }
  }

  /**
   * Format a delta value for display (+/-)
   * @param {number} delta - The delta value
   * @returns {string} Formatted delta string
   * @private
   */
  _formatDelta(delta) {
    if (delta > 0) {
      return `+${delta.toLocaleString()}`;
    } else if (delta < 0) {
      return delta.toLocaleString();
    } else {
      return "0";
    }
  }

  /**
   * Get a human-readable name for an industry ID
   * @param {string} industryId - Industry ID
   * @returns {string} Industry name
   * @private
   */
  _getIndustryName(industryId) {
    const industry = CONFIG.INDUSTRIES.find((ind) => ind.id === industryId);
    return industry ? industry.name : industryId;
  }

  /**
   * Get a description for an event choice
   * @param {Object} choice - Event choice data
   * @returns {string} Description of the choice's effects
   * @private
   */
  _getChoiceDescription(choice) {
    if (!choice.effects) {
      return "";
    }

    const effects = [];

    // Company effects
    if (choice.effects.company) {
      if (choice.effects.company.cash) {
        const cashChange = choice.effects.company.cash;
        effects.push(
          `${cashChange > 0 ? "+" : ""}$${cashChange.toLocaleString()} cash`
        );
      }

      if (choice.effects.company.users) {
        const userChange = choice.effects.company.users;
        effects.push(
          `${userChange > 0 ? "+" : ""}${userChange.toLocaleString()} users`
        );
      }

      if (choice.effects.company.productQuality) {
        const qualityChange = choice.effects.company.productQuality;
        effects.push(
          `${qualityChange > 0 ? "+" : ""}${(qualityChange * 100).toFixed(
            0
          )}% product quality`
        );
      }

      if (choice.effects.company.teamMorale) {
        const moraleChange = choice.effects.company.teamMorale;
        effects.push(
          `${moraleChange > 0 ? "+" : ""}${(moraleChange * 100).toFixed(
            0
          )}% team morale`
        );
      }
    }

    // Market effects
    if (choice.effects.market) {
      if (choice.effects.market.growthRate) {
        const growthChange = choice.effects.market.growthRate;
        effects.push(
          `${growthChange > 0 ? "+" : ""}${(growthChange * 100).toFixed(
            1
          )}% market growth`
        );
      }

      if (choice.effects.market.fundingAvailability) {
        const fundingChange = choice.effects.market.fundingAvailability;
        effects.push(
          `${
            fundingChange > 0 ? "Increased" : "Decreased"
          } funding availability`
        );
      }
    }

    // Special effects
    if (choice.effects.special) {
      if (choice.effects.special === "acquisition_exit") {
        effects.push("Exit via acquisition");
      }
    }

    return effects.join(", ");
  }

  /**
   * Show a specific screen
   * @param {string} screenId - ID of the screen to show
   */
  showScreen(screenId) {
    if (!this.game || !this.game.isInitialized) {
      console.error(
        `Cannot switch to ${screenId} screen: Game not initialized`
      );
      return;
    }

    try {
      this._switchScreen(screenId);
      console.log(`Switched to ${screenId} screen`);
    } catch (error) {
      console.error(`Error switching to ${screenId} screen:`, error);
    }
  }

  /**
   * Show turn summary
   * @param {Object} summary - Turn summary data
   */
  showTurnSummary(summary) {
    // Check if there's already a turn summary modal open
    const existingSummaryModal = document.querySelector(
      ".modal.turn-summary-modal"
    );
    if (existingSummaryModal) {
      console.log("Turn summary already displayed, removing existing one");
      document.body.removeChild(existingSummaryModal);
    }

    // Create a modal element for the turn summary
    const summaryModal = document.createElement("div");
    summaryModal.className = "modal turn-summary-modal";

    // Create summary content
    summaryModal.innerHTML = `
            <div class="modal-content">
                <h2>Turn ${summary.turn} Summary</h2>
                
                <div class="turn-summary">
                    <div class="summary-section">
                        <h3>Your Company</h3>
                        <ul class="summary-list">
                            <li>Cash: $${summary.company.cash.toLocaleString()} (${this._formatDelta(
      summary.company.cashDelta
    )})</li>
                            <li>Revenue: $${summary.company.revenue.toLocaleString()}/month (${this._formatDelta(
      summary.company.revenueDelta
    )})</li>
                            <li>Users: ${summary.company.users.toLocaleString()} (${this._formatDelta(
      summary.company.usersDelta
    )})</li>
                            <li>Valuation: $${summary.company.valuation.toLocaleString()} (${this._formatDelta(
      summary.company.valuationDelta
    )})</li>
                            <li>Burn Rate: ${
                              summary.company.burnRate >= 0 ? "+" : ""
                            }$${Math.abs(
      summary.company.burnRate
    ).toLocaleString()}/month</li>
                            <li>Runway: ${summary.company.runway} months</li>
                        </ul>
                    </div>
                    
                    ${
                      summary.completedFeatures &&
                      summary.completedFeatures.length > 0
                        ? `
                        <div class="summary-section">
                            <h3>Completed Features</h3>
                            <ul class="summary-list">
                                ${summary.completedFeatures
                                  .map(
                                    (feature) => `
                                    <li>${feature.name}</li>
                                `
                                  )
                                  .join("")}
                            </ul>
                        </div>
                    `
                        : ""
                    }
                    
                    ${
                      summary.events && summary.events.length > 0
                        ? `
                        <div class="summary-section">
                            <h3>Events</h3>
                            <ul class="summary-list">
                                ${summary.events
                                  .map(
                                    (event) => `
                                    <li>${event.title}</li>
                                `
                                  )
                                  .join("")}
                            </ul>
                        </div>
                    `
                        : ""
                    }
                    
                    <div class="summary-section">
                        <h3>Market</h3>
                        <ul class="summary-list">
                            <li>Growth Rate: ${(
                              summary.market.growthRate * 100
                            ).toFixed(1)}%</li>
                            <li>Funding Availability: ${this.game.market.getFundingDescription()}</li>
                            <li>Market Sentiment: ${this.game.market.getSentimentDescription()}</li>
                        </ul>
                    </div>
                    
                    <div class="summary-section">
                        <h3 class="toggle-header">
                            Competitors 
                            <span class="toggle-indicator">
                                <span class="toggle-text">Click to show</span>
                                <span class="toggle-icon">▼</span>
                            </span>
                        </h3>
                        <div class="competitors-content" style="display: none;">
                            <ul class="summary-list">
                                ${summary.competitors
                                  .map(
                                    (competitor) => `
                                    <li>${
                                      competitor.name
                                    }: $${competitor.valuation.toLocaleString()} valuation, ${competitor.users.toLocaleString()} users</li>
                                `
                                  )
                                  .join("")}
                            </ul>
                        </div>
                    </div>
                    
                    <div class="summary-footer">
                        <button id="close-summary-button" class="primary-button">Continue to Next Turn</button>
                    </div>
                </div>
            </div>
        `;

    // Add to document body
    document.body.appendChild(summaryModal);

    // Add toggle functionality for competitors section
    const toggleHeader = summaryModal.querySelector(".toggle-header");
    const toggleIcon = summaryModal.querySelector(".toggle-icon");
    const toggleText = summaryModal.querySelector(".toggle-text");
    const competitorsContent = summaryModal.querySelector(
      ".competitors-content"
    );

    toggleHeader.addEventListener("click", () => {
      const isHidden = competitorsContent.style.display === "none";
      competitorsContent.style.display = isHidden ? "block" : "none";
      toggleIcon.textContent = isHidden ? "▲" : "▼";
      toggleText.textContent = isHidden ? "Click to hide" : "Click to show";
    });

    // Add close button handler
    const closeButton = summaryModal.querySelector("#close-summary-button");
    closeButton.addEventListener("click", () => {
      document.body.removeChild(summaryModal);
      this.modalOpen = false;
    });

    this.modalOpen = true;
  }

  /**
   * Show game over screen
   * @param {string} reason - Reason for game over
   */
  showGameOver(reason, data = {}) {
    // Create a modal element for the game over screen
    const gameOverModal = document.createElement("div");
    gameOverModal.className = "modal";

    // Determine title and message based on reason
    let title = "Game Over";
    let message = "";

    switch (reason) {
      case "bankruptcy":
        title = "Bankruptcy!";
        message = "Your company has run out of cash and gone bankrupt.";
        break;
      case "acquisition":
        title = "Acquired!";
        message = `Your company was acquired for $${data.acquisitionValue.toLocaleString()}! Your share is $${data.playerPayout.toLocaleString()}.`;
        break;
      case "ipo":
        title = "IPO Success!";
        message = `Your company went public with a valuation of $${data.ipoValue.toLocaleString()}! Your share is $${data.playerPayout.toLocaleString()}.`;
        break;
      case "max_turns_reached":
        title = "Retirement!";
        message = `You've reached the end of your entrepreneurial journey after ${CONFIG.MAX_TURNS} months.`;
        break;
      default:
        message = "Your entrepreneurial journey has come to an end.";
        break;
    }

    // Prepare share text based on game stats
    const companyName = this.game.company.name;
    const valuation = this.game.company.valuation.toLocaleString();
    const users = this.game.company.users.toLocaleString();
    const revenue = this.game.company.revenue.toLocaleString();
    const months = this.game.state.currentTurn;

    let shareText = "";
    switch (reason) {
      case "bankruptcy":
        shareText = `My startup ${companyName} went bankrupt after ${months} months in Startup Tycoon! Final stats: $${valuation} valuation, ${users} users, $${revenue}/month revenue. Can you do better?`;
        break;
      case "acquisition":
        shareText = `My startup ${companyName} was acquired for $${data.acquisitionValue.toLocaleString()} in Startup Tycoon! Final stats: ${users} users, $${revenue}/month revenue after ${months} months. Can you beat that?`;
        break;
      case "ipo":
        shareText = `My startup ${companyName} went public with a $${data.ipoValue.toLocaleString()} valuation in Startup Tycoon! Final stats: ${users} users, $${revenue}/month revenue after ${months} months. Can you beat that?`;
        break;
      default:
        shareText = `My startup ${companyName} reached a $${valuation} valuation with ${users} users and $${revenue}/month revenue after ${months} months in Startup Tycoon! Can you do better?`;
        break;
    }

    // Create the content
    gameOverModal.innerHTML = `
            <div class="modal-content">
                <h2>${title}</h2>
                <p>${message}</p>
                
                <div class="game-over-stats">
                    <h3>Final Statistics</h3>
                    <ul>
                        <li>Final Valuation: $${this.game.company.valuation.toLocaleString()}</li>
                        <li>Users: ${this.game.company.users.toLocaleString()}</li>
                        <li>Revenue: $${this.game.company.revenue.toLocaleString()}/month</li>
                        <li>Months in Business: ${
                          this.game.state.currentTurn
                        }</li>
                        <li>Product Quality: ${Math.round(
                          this.game.company.product.quality * 100
                        )}%</li>
                        <li>Team Size: ${
                          this.game.company.team.employees.length
                        } employees</li>
                    </ul>
                </div>
                
                <div class="share-results">
                    <h3>Share Your Results</h3>
                    <div class="share-buttons">
                        <button id="game-over-share-x" class="share-button" title="Share on X">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                            <span>Share on X</span>
                        </button>
                        <button id="game-over-share-facebook" class="share-button" title="Share on Facebook">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" />
                            </svg>
                            <span>Share on Facebook</span>
                        </button>
                        <button id="game-over-share-linkedin" class="share-button" title="Share on LinkedIn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
                            </svg>
                            <span>Share on LinkedIn</span>
                        </button>
                    </div>
                </div>
                
                <div class="game-over-actions">
                    <button id="new-game-button" class="primary-button">Start New Game</button>
                </div>
            </div>
        `;

    // Add new game button handler
    const newGameButton = gameOverModal.querySelector("#new-game-button");
    newGameButton.addEventListener("click", () => {
      this.showStartGameModal();
      document.body.removeChild(gameOverModal);
    });

    // Add share button handlers
    const shareXButton = gameOverModal.querySelector("#game-over-share-x");
    shareXButton.addEventListener("click", () => {
      const url = window.location.href;
      const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        shareText
      )}&url=${encodeURIComponent(url)}`;
      window.open(shareUrl, "_blank", "width=550,height=420");
    });

    const shareFacebookButton = gameOverModal.querySelector(
      "#game-over-share-facebook"
    );
    shareFacebookButton.addEventListener("click", () => {
      const url = window.location.href;
      // Facebook doesn't support custom text in the share dialog, only the URL
      const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        url
      )}&quote=${encodeURIComponent(shareText)}`;
      window.open(shareUrl, "_blank", "width=550,height=420");
    });

    const shareLinkedInButton = gameOverModal.querySelector(
      "#game-over-share-linkedin"
    );
    shareLinkedInButton.addEventListener("click", () => {
      const url = window.location.href;
      const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        url
      )}`;
      window.open(shareUrl, "_blank", "width=550,height=420");
    });

    // Add to document body
    document.body.appendChild(gameOverModal);

    this.modalOpen = true;
  }

  /**
   * Initialize mobile menu toggle
   * @private
   */
  _initializeMobileMenu() {
    if (!this.elements.mobileMenuToggle) return;

    this.elements.mobileMenuToggle.addEventListener("click", () => {
      this.toggleMobileMenu();
    });

    // Close sidebar when a menu button is clicked on mobile
    this.elements.menuButtons.forEach((button) => {
      button.addEventListener("click", () => {
        if (window.innerWidth <= 768) {
          this.closeMobileMenu();
        }
      });
    });

    // Handle window resize
    window.addEventListener("resize", () => {
      if (window.innerWidth > 768) {
        // Reset sidebar on desktop
        this.elements.sidebar.classList.remove("active");
        this.elements.mobileMenuToggle.classList.remove("active");
        this.elements.mainPanel.classList.remove("sidebar-active");
        this.sidebarOpen = false;
      }
    });
  }

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu() {
    if (this.sidebarOpen) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  }

  /**
   * Open mobile menu
   */
  openMobileMenu() {
    this.elements.sidebar.classList.add("active");
    this.elements.mobileMenuToggle.classList.add("active");
    this.elements.mainPanel.classList.add("sidebar-active");
    this.sidebarOpen = true;
  }

  /**
   * Close mobile menu
   */
  closeMobileMenu() {
    this.elements.sidebar.classList.remove("active");
    this.elements.mobileMenuToggle.classList.remove("active");
    this.elements.mainPanel.classList.remove("sidebar-active");
    this.sidebarOpen = false;
  }
}
