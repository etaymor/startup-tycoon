/**
 * Startup Tycoon - Company Class
 * Represents the player's company with all its properties and methods
 */

class Company {
  /**
   * Create a new company
   * @param {Object} options - Company options
   */
  constructor(options = {}) {
    this.name = options.name || "Untitled Startup";
    this.industry = options.industry || "saas";
    this.game = options.game || null;

    // Financial metrics
    this.cash = CONFIG.STARTING_CASH;
    this.revenue = 0;
    this.costs = 0;
    this.burnRate = 0;
    this.valuation = CONFIG.STARTING_VALUATION;
    this.runway = 0; // Months until out of cash

    // Equity and investment
    this.equity = {
      player: 1.0, // Player owns 100% initially
      investors: {},
    };
    this.fundingRound = "pre-seed";
    this.fundingHistory = [];

    // Team
    this.team = {
      morale: 1.0, // 0-1 scale
      employees: [],
    };

    // Product
    this.product = {
      quality: 0.5, // 0-1 scale
      features: [],
      development: 0.0, // Overall development progress
    };

    // Marketing
    this.marketing = {
      brand: 0.1, // 0-1 scale
      channels: {},
      budget: 0,
    };

    // Users and growth
    this.users = 0;
    this.growthRate = 0;
    this.churnRate = 0.08; // Increased from 0.05 - 8% monthly churn

    // Initialize marketing channels with zero budget
    CONFIG.MARKETING_CHANNELS.forEach((channel) => {
      this.marketing.channels[channel.id] = {
        budget: 0,
        efficiency: channel.efficiency,
        acquisitions: 0,
      };
    });

    // Add initial team members
    this._initializeTeam();
  }

  /**
   * Update company state for the current turn
   */
  update() {
    // Store initial cash for logging
    const initialCash = this.cash;

    // Store current marketing budgets to reapply them after the update
    const currentMarketingBudgets = {};
    Object.keys(this.marketing.channels).forEach((channelId) => {
      currentMarketingBudgets[channelId] =
        this.marketing.channels[channelId].budget;
    });

    // Calculate basic financial metrics
    this._calculateFinancials();

    // Update product
    this._updateProduct();

    // Update team stats
    this._updateTeam();

    // Update user metrics
    this._updateUsers();

    // Update market position
    this._updateMarketPosition();

    // Add revenue to cash
    this.cash += this.revenue;

    // Subtract recurring costs (not including one-time marketing expenses which are deducted when allocated)
    // NOTE: Marketing expenses are already deducted when allocated in allocateMarketingBudget()
    // so we exclude them here to avoid double-counting
    const recurringCosts = this.costs - this.marketing.budget;
    this.cash -= recurringCosts;

    // Log cash changes for debugging
    console.log(`Cash update - Turn ${this.game.state.currentTurn}:`);
    console.log(`  Initial cash: $${initialCash.toLocaleString()}`);
    console.log(`  Revenue: +$${this.revenue.toLocaleString()}`);
    console.log(`  Recurring costs: -$${recurringCosts.toLocaleString()}`);
    console.log(`  Final cash: $${this.cash.toLocaleString()}`);
    console.log(`  Burn rate: $${this.burnRate.toLocaleString()}/month`);

    // Check for bankruptcy
    this._checkBankruptcy();

    // Check for other end game conditions
    this._checkEndGameConditions();

    // Reapply marketing budgets for the next turn
    Object.keys(currentMarketingBudgets).forEach((channelId) => {
      const previousBudget = currentMarketingBudgets[channelId];
      if (previousBudget > 0) {
        // Only allocate if we have enough cash
        const budgetToAllocate = Math.min(previousBudget, this.cash);
        if (budgetToAllocate > 0) {
          this.allocateMarketingBudget(channelId, budgetToAllocate);
        }
      }
    });

    return this;
  }

  /**
   * Allocate budget to a specific marketing channel
   * @param {string} channelId - The marketing channel ID
   * @param {number} amount - The amount to allocate
   */
  allocateMarketingBudget(channelId, amount) {
    if (!this.marketing.channels[channelId]) {
      console.error(`Invalid marketing channel: ${channelId}`);
      return false;
    }

    // Ensure we don't spend more than we have
    if (amount > this.cash) {
      amount = this.cash;
    }

    this.marketing.channels[channelId].budget = amount;
    this.marketing.budget = Object.values(this.marketing.channels).reduce(
      (total, channel) => total + channel.budget,
      0
    );

    // Update cash immediately to reflect the allocation
    // NOTE: Marketing expenses are one-time costs deducted immediately
    // They are included in this.costs for display purposes but excluded from recurring costs
    // when calculating monthly expenses in the update() method
    this.cash -= amount;

    return true;
  }

  /**
   * Hire a new employee
   * @param {string} role - Employee role (developer, designer, etc.)
   */
  hireEmployee(role) {
    const baseSalary = CONFIG.EMPLOYEE_BASE_SALARY[role] || 5000;

    // Add a bit of randomness to performance
    const [min, max] = CONFIG.EMPLOYEE_PERFORMANCE_RANGE;
    const performance = min + Math.random() * (max - min);

    const employee = {
      id: Date.now(), // Simple unique ID
      name: this._generateEmployeeName(),
      role: role,
      salary: baseSalary,
      performance: performance,
      hiredAt: this.game.state.currentTurn,
    };

    // Add to team
    this.team.employees.push(employee);

    // Update costs
    this._calculateFinancials();

    return employee;
  }

  /**
   * Fire an employee
   * @param {number} employeeId - The employee ID to fire
   */
  fireEmployee(employeeId) {
    const employeeIndex = this.team.employees.findIndex(
      (emp) => emp.id === employeeId
    );

    if (employeeIndex === -1) {
      console.error(`Employee not found: ${employeeId}`);
      return false;
    }

    // Remove from team
    const employee = this.team.employees.splice(employeeIndex, 1)[0];

    // Firing employees affects morale
    this.team.morale = Math.max(0.3, this.team.morale - 0.1);

    // Update costs
    this._calculateFinancials();

    return employee;
  }

  /**
   * Generate a random feature name based on industry and complexity
   * @param {string} complexity - Feature complexity (simple, medium, complex)
   * @param {number} [recursionDepth=0] - Track recursion depth to prevent infinite loops
   * @returns {string} Random feature name
   * @private
   */
  _generateFeatureName(complexity, recursionDepth = 0) {
    // Prevent infinite recursion by limiting depth
    if (recursionDepth > 5) {
      // If we've gone too deep, just return any feature without checking dependencies
      const industryFeatures =
        CONFIG.FEATURE_NAMES[this.industry] || CONFIG.FEATURE_NAMES.saas;
      const complexityFeatures =
        industryFeatures[complexity] || industryFeatures.medium;

      return complexityFeatures[
        Math.floor(Math.random() * complexityFeatures.length)
      ];
    }

    // Get feature names for this industry and complexity
    const industryFeatures =
      CONFIG.FEATURE_NAMES[this.industry] || CONFIG.FEATURE_NAMES.saas;
    const complexityFeatures =
      industryFeatures[complexity] || industryFeatures.medium;

    // Get completed feature names
    const completedFeatureNames = this.product.features
      .filter((f) => f.completed)
      .map((f) => f.name);

    // Get available features (those with dependencies met)
    const availableFeatures = complexityFeatures.filter((featureName) => {
      // Get metadata for this feature
      const metadata = CONFIG.FEATURE_METADATA[this.industry]?.[featureName];
      if (!metadata) return true; // If no metadata, assume no dependencies

      // Check if all dependencies are completed
      return metadata.dependencies.every((dep) =>
        completedFeatureNames.includes(dep)
      );
    });

    // If no available features, fall back to any feature from this complexity
    if (availableFeatures.length === 0) {
      return complexityFeatures[
        Math.floor(Math.random() * complexityFeatures.length)
      ];
    }

    // Select a random feature from available ones
    return availableFeatures[
      Math.floor(Math.random() * availableFeatures.length)
    ];
  }

  /**
   * Get feature metadata including category and dependencies
   * @param {string} featureName - The name of the feature
   * @returns {Object} Feature metadata
   * @private
   */
  _getFeatureMetadata(featureName) {
    const metadata = CONFIG.FEATURE_METADATA[this.industry]?.[featureName];
    if (!metadata) {
      // Default metadata if not found
      return {
        category: "core",
        dependencies: [],
      };
    }
    return metadata;
  }

  /**
   * Check if all dependencies for a feature are met
   * @param {string} featureName - The name of the feature to check
   * @returns {Object} Result with status and missing dependencies
   * @private
   */
  _checkFeatureDependencies(featureName) {
    const metadata = this._getFeatureMetadata(featureName);
    const completedFeatureNames = this.product.features
      .filter((f) => f.completed)
      .map((f) => f.name);

    const missingDependencies = metadata.dependencies.filter(
      (dep) => !completedFeatureNames.includes(dep)
    );

    return {
      met: missingDependencies.length === 0,
      missing: missingDependencies,
    };
  }

  /**
   * Get the category information for a feature
   * @param {string} featureName - The name of the feature
   * @returns {Object} Category information
   * @private
   */
  _getFeatureCategory(featureName) {
    const metadata = this._getFeatureMetadata(featureName);
    const categoryId = metadata.category;

    // Find the category in the industry's categories
    const categories = CONFIG.FEATURE_CATEGORIES[this.industry] || [];
    const category = categories.find((c) => c.id === categoryId) || {
      id: categoryId,
      name: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
      description: "Features in this category",
    };

    return category;
  }

  /**
   * Start developing a new product feature
   * @param {Object} featureData - Feature details
   * @param {number} [recursionDepth=0] - Track recursion depth to prevent infinite loops
   */
  developFeature(featureData, recursionDepth = 0) {
    // Prevent infinite recursion
    if (recursionDepth > 5) {
      // If we've gone too deep, force a feature without dependency checks
      const complexity = featureData.complexity || "medium";
      const industryFeatures =
        CONFIG.FEATURE_NAMES[this.industry] || CONFIG.FEATURE_NAMES.saas;
      const complexityFeatures =
        industryFeatures[complexity] || industryFeatures.medium;
      const name =
        complexityFeatures[
          Math.floor(Math.random() * complexityFeatures.length)
        ];
      const description = this._generateFeatureDescription(name, complexity);

      // Get feature metadata
      const metadata = this._getFeatureMetadata(name);
      const category = this._getFeatureCategory(name);

      const feature = {
        id: Date.now(),
        name: name,
        description: description,
        complexity: complexity,
        category: category.id,
        categoryName: category.name,
        dependencies: metadata.dependencies,
        cost: CONFIG.FEATURE_COMPLEXITY_LEVELS[complexity].cost,
        timeRequired: CONFIG.FEATURE_COMPLEXITY_LEVELS[complexity].time,
        progress: 0,
        completed: false,
        impact: CONFIG.FEATURE_COMPLEXITY_LEVELS[complexity].impact,
        startedAt: this.game.state.currentTurn,
      };

      // Add to features list
      this.product.features.push(feature);

      // Deduct immediate cost
      this.cash -= feature.cost;

      return feature;
    }

    const complexity = featureData.complexity || "medium";
    const name =
      featureData.name || this._generateFeatureName(complexity, recursionDepth);
    const description =
      featureData.description ||
      this._generateFeatureDescription(name, complexity);

    // Get feature metadata
    const metadata = this._getFeatureMetadata(name);
    const category = this._getFeatureCategory(name);

    // Check dependencies
    const dependencyCheck = this._checkFeatureDependencies(name);
    if (!dependencyCheck.met && !featureData.name) {
      // If auto-generating a name and dependencies aren't met, try again with increased recursion depth
      return this.developFeature(featureData, recursionDepth + 1);
    }

    const feature = {
      id: Date.now(),
      name: name,
      description: description,
      complexity: complexity,
      category: category.id,
      categoryName: category.name,
      dependencies: metadata.dependencies,
      cost: CONFIG.FEATURE_COMPLEXITY_LEVELS[complexity].cost,
      timeRequired: CONFIG.FEATURE_COMPLEXITY_LEVELS[complexity].time,
      progress: 0,
      completed: false,
      impact: CONFIG.FEATURE_COMPLEXITY_LEVELS[complexity].impact,
      startedAt: this.game.state.currentTurn,
    };

    // Add to features list
    this.product.features.push(feature);

    // Deduct immediate cost
    this.cash -= feature.cost;

    return feature;
  }

  /**
   * Generate a feature description based on its name and complexity
   * @param {string} name - Feature name
   * @param {string} complexity - Feature complexity
   * @returns {string} Feature description
   * @private
   */
  _generateFeatureDescription(name, complexity) {
    const complexityDescriptions = {
      simple: ["Basic", "Simple", "Fundamental", "Essential"],
      medium: ["Enhanced", "Advanced", "Comprehensive", "Robust"],
      complex: [
        "Premium",
        "Enterprise-grade",
        "Cutting-edge",
        "State-of-the-art",
      ],
    };

    const adjective =
      complexityDescriptions[complexity][
        Math.floor(Math.random() * complexityDescriptions[complexity].length)
      ];

    return `${adjective} ${name.toLowerCase()} feature for your ${this._getIndustryName()} product.`;
  }

  /**
   * Get a human-readable name for the company's industry
   * @returns {string} Industry name
   * @private
   */
  _getIndustryName() {
    const industry = CONFIG.INDUSTRIES.find((ind) => ind.id === this.industry);
    return industry ? industry.name : this.industry;
  }

  /**
   * Attempt to raise funding
   * @param {string} round - Funding round (seed, series-a, etc.)
   * @param {number} targetAmount - Amount attempting to raise
   */
  raiseFunding(round, targetAmount) {
    // Find the round configuration
    const roundConfig = CONFIG.FUNDING_ROUNDS.find(
      (r) => r.name.toLowerCase() === round.toLowerCase()
    );

    if (!roundConfig) {
      console.error(`Invalid funding round: ${round}`);
      return { success: false, reason: "Invalid funding round" };
    }

    // Check if company valuation is high enough
    if (this.valuation < roundConfig.minValuation) {
      return {
        success: false,
        reason: `Valuation too low for ${round} round. Need at least $${roundConfig.minValuation.toLocaleString()}`,
      };
    }

    // Calculate difficulty based on market conditions, company metrics
    const marketFactor = this.game.market.fundingAvailability;
    const companyFactor = Math.min(
      1,
      this.product.quality + this.marketing.brand
    );
    const difficultyFactor =
      roundConfig.difficulty / (marketFactor * companyFactor);

    // Determine success chance (0-1)
    const successChance = Math.min(0.95, Math.max(0.05, 1 - difficultyFactor));

    // Roll for success
    const roll = Math.random();
    const success = roll <= successChance;

    if (!success) {
      return {
        success: false,
        reason: "Investors passed on this opportunity",
        details: {
          successChance: successChance,
          roll: roll,
        },
      };
    }

    // Get company size tier for scaling
    const sizeTier = this._getCompanySizeTier();

    // Calculate valuation for this round (with some randomness)
    const valuationMultiple = 1 + (Math.random() * 0.4 - 0.2); // +/- 20%
    const roundValuation = this.valuation * valuationMultiple;

    // Calculate equity given for the investment
    // For larger companies, reduce equity percentage
    const [minEquity, maxEquity] = roundConfig.equityRange;
    const equityScaleFactor = Math.max(0.5, 1 - (sizeTier.tier - 1) * 0.1); // Reduce equity as company grows
    const scaledMinEquity = minEquity * equityScaleFactor;
    const scaledMaxEquity = maxEquity * equityScaleFactor;

    const equityPercentage =
      scaledMinEquity + Math.random() * (scaledMaxEquity - scaledMinEquity);
    const equityAmount = equityPercentage;

    // Calculate actual investment amount
    const investmentAmount = Math.round(roundValuation * equityAmount);

    // Apply the funding
    this.cash += investmentAmount;

    // Update equity
    this.equity.player -= equityAmount;
    const investorName = this._generateInvestorName(round);
    this.equity.investors[investorName] = equityAmount;

    // Update funding history
    this.fundingHistory.push({
      round: round,
      amount: investmentAmount,
      valuation: roundValuation,
      equity: equityAmount,
      investor: investorName,
      turn: this.game.state.currentTurn,
    });

    // Update funding round
    this.fundingRound = round;

    // Return the funding results
    return {
      success: true,
      investmentAmount: investmentAmount,
      valuation: roundValuation,
      equityPercentage: equityAmount * 100,
      investor: investorName,
    };
  }

  /**
   * Calculate company valuation based on revenue, users, industry, etc.
   */
  calculateValuation() {
    const industry = this.game.market.getIndustry(this.industry);

    // Base valuation factors
    let valuation = 0;

    // Revenue multiple (different for each industry)
    const revenueMultiple = this.revenue * (industry.revenueMultiple || 5);
    valuation += revenueMultiple;

    // User value
    const userValueRange = industry.userValueRange || [10, 100];
    const avgUserValue = (userValueRange[0] + userValueRange[1]) / 2;
    const userValuation = this.users * avgUserValue;
    valuation += userValuation;

    // Product quality bonus
    const productQualityBonus = this.product.quality * 1000000; // Up to $1M bonus
    valuation += productQualityBonus;

    // Apply market conditions
    valuation *= this.game.market.valuationMultiplier;

    // Ensure minimum valuation
    valuation = Math.max(valuation, 500000);

    // Set the new valuation
    this.valuation = Math.round(valuation);

    return this.valuation;
  }

  /**
   * Serialize company data for saving
   */
  serialize() {
    // Create a clone without circular references
    const serialized = {
      name: this.name,
      industry: this.industry,
      cash: this.cash,
      revenue: this.revenue,
      costs: this.costs,
      burnRate: this.burnRate,
      valuation: this.valuation,
      runway: this.runway,
      equity: this.equity,
      fundingRound: this.fundingRound,
      fundingHistory: this.fundingHistory,
      team: this.team,
      product: this.product,
      marketing: this.marketing,
      users: this.users,
      growthRate: this.growthRate,
      churnRate: this.churnRate,
    };

    return serialized;
  }

  /**
   * Deserialize and restore company data
   * @param {Object} data - Serialized company data
   */
  deserialize(data) {
    // Restore simple properties
    this.name = data.name;
    this.industry = data.industry;
    this.cash = data.cash;
    this.revenue = data.revenue;
    this.costs = data.costs;
    this.burnRate = data.burnRate;
    this.valuation = data.valuation;
    this.runway = data.runway;
    this.equity = data.equity;
    this.fundingRound = data.fundingRound;
    this.fundingHistory = data.fundingHistory;
    this.team = data.team;
    this.product = data.product;
    this.marketing = data.marketing;
    this.users = data.users;
    this.growthRate = data.growthRate;
    this.churnRate = data.churnRate;

    return this;
  }

  /**
   * Initialize the starting team
   * @private
   */
  _initializeTeam() {
    // Add founder
    this.team.employees.push({
      id: 1,
      name: "You (Founder)",
      role: "founder",
      salary: 0, // Founders don't take salary initially
      performance: 1.2,
      hiredAt: 0,
    });

    // Add first employee
    this.hireEmployee("developer");
  }

  /**
   * Update financial calculations
   * @private
   */
  _calculateFinancials() {
    // Calculate employee costs
    const employeeCosts = this.team.employees.reduce((total, employee) => {
      return total + (employee.salary || 0);
    }, 0);

    // Calculate operational costs (base + per employee)
    const operationalCosts = 8000 + this.team.employees.length * 1500;

    // Sum up total costs
    this.costs = employeeCosts + operationalCosts + this.marketing.budget;

    // Calculate burn rate (monthly cash flow)
    // Only count recurring costs, not one-time marketing expenses which are deducted when allocated
    const recurringCosts = employeeCosts + operationalCosts;

    // Burn rate is revenue minus recurring costs
    // Positive when profitable, negative when losing money
    this.burnRate = this.revenue - recurringCosts;

    // Calculate runway (months until out of cash)
    this.runway =
      this.burnRate < 0
        ? Math.floor(this.cash / Math.abs(this.burnRate))
        : Infinity;

    return this;
  }

  /**
   * Update product development
   * @private
   */
  _updateProduct() {
    // Get developer count and capability
    const developers = this.team.employees.filter(
      (emp) => emp.role === "developer"
    );
    let developmentPower = developers.reduce((total, dev) => {
      return total + dev.performance;
    }, 0);

    // Adjust for team morale
    developmentPower *= this.team.morale;

    // Progress all features in development
    this.product.features.forEach((feature) => {
      if (feature.completed) return;

      // Progress is based on dev power and feature complexity
      const progressPerTurn =
        developmentPower / feature.timeRequired / developers.length;
      feature.progress += progressPerTurn;

      // Check if feature is completed
      if (feature.progress >= 1) {
        feature.progress = 1;
        feature.completed = true;
        feature.completedAt = this.game.state.currentTurn;

        // Improve product quality when feature is completed
        this.product.quality += feature.impact;
        this.product.quality = Math.min(1, this.product.quality);

        // Notify player
        this.game.addNotification(
          `Feature completed: ${feature.name}`,
          "success"
        );
      }
    });

    // Product quality decays if not maintained
    this.product.quality *= 1 - CONFIG.PRODUCT_QUALITY_DECAY;

    // Calculate overall development progress
    const completedFeatures = this.product.features.filter(
      (f) => f.completed
    ).length;
    const totalFeatures = this.product.features.length || 1;
    this.product.development =
      this.product.features.length > 0 ? completedFeatures / totalFeatures : 0;

    return this;
  }

  /**
   * Update team stats
   * @private
   */
  _updateTeam() {
    // Morale naturally increases slightly each turn if not at max
    if (this.team.morale < 1) {
      this.team.morale += 0.02;
      this.team.morale = Math.min(1, this.team.morale);
    }

    // Too many employees per manager decreases morale
    const managers = this.team.employees.filter(
      (emp) => emp.role === "manager" || emp.role === "founder"
    ).length;
    const managementCapacity = managers * 5; // Each manager can handle 5 employees

    if (this.team.employees.length > managementCapacity) {
      // Reduce morale if understaffed on management
      this.team.morale -= 0.05;
      this.team.morale = Math.max(0.3, this.team.morale); // Minimum morale
    }

    return this;
  }

  /**
   * Update user metrics
   * @private
   */
  _updateUsers() {
    // Calculate user acquisition from marketing
    let newUsers = 0;

    // Get acquisition from each marketing channel
    Object.keys(this.marketing.channels).forEach((channelId) => {
      const channel = this.marketing.channels[channelId];
      const channelConfig = CONFIG.MARKETING_CHANNELS.find(
        (c) => c.id === channelId
      );

      if (channel.budget > 0 && channelConfig) {
        // Add randomization factor to marketing efficiency (±20%)
        const randomFactor = 0.8 + Math.random() * 0.4;

        // Calculate saturation effect - efficiency decreases as market matures
        // The longer the game runs, the less effective marketing becomes
        const marketSaturation = Math.max(
          0.5,
          1 - (this.game.state.currentTurn / 100) * 0.5
        );

        // Calculate channel-specific saturation based on continuous use
        // If the channel has been used continuously, its effectiveness decreases
        if (!channel.usageHistory) {
          channel.usageHistory = [];
        }

        // Track usage of this channel (1 = used this turn)
        channel.usageHistory.push(1);

        // Keep only the last 10 turns of history
        if (channel.usageHistory.length > 10) {
          channel.usageHistory.shift();
        }

        // Calculate channel-specific saturation based on recent usage
        const recentUsageSum = channel.usageHistory.reduce(
          (sum, val) => sum + val,
          0
        );
        const channelSaturation = Math.max(0.6, 1 - recentUsageSum / 20);

        // Calculate user acquisition for this channel with all factors
        const efficiency =
          channel.efficiency *
          this.marketing.brand *
          this.product.quality *
          0.8 * // Base reduction factor
          randomFactor *
          marketSaturation *
          channelSaturation;

        const acquisitions = Math.floor(
          (channel.budget / channelConfig.costPerUser) * efficiency
        );

        channel.acquisitions = acquisitions;
        newUsers += acquisitions;

        // Log marketing effectiveness factors for debugging
        console.log(`Marketing channel ${channelId} effectiveness:`, {
          baseEfficiency: channel.efficiency,
          brandFactor: this.marketing.brand,
          productQuality: this.product.quality,
          randomFactor: randomFactor.toFixed(2),
          marketSaturation: marketSaturation.toFixed(2),
          channelSaturation: channelSaturation.toFixed(2),
          finalEfficiency: efficiency.toFixed(2),
          budget: channel.budget,
          acquisitions: acquisitions,
        });
      } else {
        channel.acquisitions = 0;

        // If channel wasn't used this turn, track it and allow recovery of effectiveness
        if (channel.usageHistory) {
          channel.usageHistory.push(0);
          if (channel.usageHistory.length > 10) {
            channel.usageHistory.shift();
          }
        }
      }
    });

    // Calculate churn
    const churnedUsers = Math.floor(this.users * this.churnRate);

    // Update total users
    this.users = Math.max(0, this.users + newUsers - churnedUsers);

    // Calculate growth rate
    const prevUsers = this.users - newUsers + churnedUsers;
    this.growthRate = prevUsers > 0 ? this.users / prevUsers - 1 : 0;

    // Update brand awareness based on marketing and users
    this.marketing.brand += 0.01 * (this.marketing.budget > 0 ? 1 : 0);
    this.marketing.brand += 0.001 * Math.sqrt(this.users);
    this.marketing.brand = Math.min(1, this.marketing.brand);

    // Calculate revenue based on users and industry
    const industry = this.game.market.getIndustry(this.industry);
    const [minValue, maxValue] = industry.userValueRange;
    const avgUserValue = (minValue + maxValue) / 2;

    // Monthly revenue (annual value divided by 12)
    this.revenue = Math.floor(
      this.users * (avgUserValue / 12) * this.product.quality
    );

    return this;
  }

  /**
   * Update market position
   * @private
   */
  _updateMarketPosition() {
    // Calculate valuation
    this.calculateValuation();

    return this;
  }

  /**
   * Check for bankruptcy
   * @private
   */
  _checkBankruptcy() {
    if (this.cash <= CONFIG.BANKRUPTCY_THRESHOLD && this.burnRate < 0) {
      this.game.gameOver("bankruptcy");
    }

    return this;
  }

  /**
   * Check for end game conditions (bankruptcy, acquisition, IPO)
   * @private
   */
  _checkEndGameConditions() {
    // Check for potential acquisition
    if (this.valuation >= CONFIG.ACQUISITION_VALUATION_THRESHOLD) {
      // Only make acquisition offers occasionally, so it doesn't happen every turn once threshold is reached
      const acquisitionChance = 0.15; // 15% chance per turn

      if (Math.random() < acquisitionChance) {
        // Find the acquisition offer event
        const acquisitionEvent = {
          id: "acquisition_offer",
          title: "Acquisition Offer",
          type: "opportunity",
          description:
            "You've received an acquisition offer from a larger company.",
          turn: this.game.state.currentTurn,
          choices: [
            {
              text: "Accept the offer and sell the company",
              effects: {
                special: "acquisition_exit",
              },
            },
            {
              text: "Reject the offer and continue building",
              effects: {
                company: {
                  valuation: Math.round(this.valuation * 0.1), // Small boost to valuation from interest
                },
              },
            },
          ],
        };

        // Add the event to game state
        this.game.state.events.push(acquisitionEvent);

        // Show the event to the player
        this.game.uiManager.showEventModal(acquisitionEvent);

        // Log the event
        console.log("Acquisition offer triggered:", acquisitionEvent);
      }
    }

    return this;
  }

  /**
   * Generate a random employee name
   * @returns {string} Random employee name
   * @private
   */
  _generateEmployeeName() {
    const firstNames = [
      "Alex",
      "Jordan",
      "Taylor",
      "Morgan",
      "Casey",
      "Riley",
      "Avery",
      "Quinn",
      "Skyler",
      "Reese",
      "Finley",
      "River",
      "Emerson",
      "Rowan",
      "Dakota",
      "Hayden",
      "Alexis",
      "Jamie",
      "Charlie",
      "Jessie",
      "Peyton",
    ];

    const lastNames = [
      "Smith",
      "Johnson",
      "Williams",
      "Jones",
      "Brown",
      "Davis",
      "Miller",
      "Wilson",
      "Moore",
      "Taylor",
      "Anderson",
      "Thomas",
      "Jackson",
      "White",
      "Harris",
      "Martin",
      "Thompson",
      "Garcia",
      "Martinez",
      "Robinson",
      "Clark",
    ];

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    return `${firstName} ${lastName}`;
  }

  /**
   * Generate a VC/investor name
   * @private
   */
  _generateInvestorName(round) {
    const prefixes = [
      "Alpha",
      "Beta",
      "Nova",
      "Summit",
      "Peak",
      "Horizon",
      "Quantum",
      "Vertex",
      "Spark",
      "Forge",
    ];
    const suffixes = [
      "Ventures",
      "Capital",
      "Partners",
      "Fund",
      "Investments",
      "Group",
      "Equity",
      "Accelerator",
    ];

    if (round === "seed") {
      // For seed round, use angel investor names
      const angelFirstNames = [
        "John",
        "Sarah",
        "Michael",
        "Emma",
        "David",
        "Lisa",
        "Robert",
        "Jennifer",
      ];
      const angelLastNames = [
        "Anderson",
        "Peterson",
        "Gates",
        "Musk",
        "Jones",
        "Wilson",
        "Zhang",
        "Patel",
      ];

      const firstName =
        angelFirstNames[Math.floor(Math.random() * angelFirstNames.length)];
      const lastName =
        angelLastNames[Math.floor(Math.random() * angelLastNames.length)];

      return `${firstName} ${lastName}`;
    } else {
      // For later rounds, use VC firm names
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

      return `${prefix} ${suffix}`;
    }
  }

  /**
   * Get the company size tier based on metrics
   * @returns {Object} Size tier with scaling factors
   * @private
   */
  _getCompanySizeTier() {
    // Define tiers based on company valuation
    let valuationTier = 1;
    if (this.valuation >= 1000000000) valuationTier = 6; // $1B+
    else if (this.valuation >= 500000000) valuationTier = 5; // $500M+
    else if (this.valuation >= 100000000) valuationTier = 4; // $100M+
    else if (this.valuation >= 50000000) valuationTier = 3; // $50M+
    else if (this.valuation >= 10000000) valuationTier = 2; // $10M+

    // Define tiers based on users
    let usersTier = 1;
    if (this.users >= 10000000) usersTier = 6; // 10M+ users
    else if (this.users >= 1000000) usersTier = 5; // 1M+ users
    else if (this.users >= 100000) usersTier = 4; // 100K+ users
    else if (this.users >= 10000) usersTier = 3; // 10K+ users
    else if (this.users >= 1000) usersTier = 2; // 1K+ users

    // Define tiers based on revenue
    let revenueTier = 1;
    if (this.revenue * 12 >= 100000000)
      revenueTier = 6; // $100M+ annual revenue
    else if (this.revenue * 12 >= 50000000)
      revenueTier = 5; // $50M+ annual revenue
    else if (this.revenue * 12 >= 10000000)
      revenueTier = 4; // $10M+ annual revenue
    else if (this.revenue * 12 >= 1000000)
      revenueTier = 3; // $1M+ annual revenue
    else if (this.revenue * 12 >= 100000) revenueTier = 2; // $100K+ annual revenue

    // Use the highest tier from all metrics
    const tier = Math.max(valuationTier, usersTier, revenueTier);

    return { tier };
  }
}
