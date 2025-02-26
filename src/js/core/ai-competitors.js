/**
 * Startup Tycoon - AI Competitor
 * Simulates rival startups that compete with the player
 */

class AICompetitor {
  constructor(options = {}) {
    this.name = options.name || "Unnamed Competitor";
    this.type = options.type || "balanced"; // aggressive, balanced, product, conservative
    this.industry = options.industry || "saas";
    this.game = options.game || null;

    // Get competitor type configuration
    this.typeConfig =
      CONFIG.COMPETITOR_TYPES.find((t) => t.id === this.type) ||
      CONFIG.COMPETITOR_TYPES[1]; // Default to balanced

    // Financial metrics
    this.cash = this._generateInitialCash();
    this.revenue = 0;
    this.valuation = this._generateInitialValuation();
    this.fundingRound = "pre-seed";

    // Company state
    this.aggressiveness = this.typeConfig.riskTolerance; // 0-1 scale of how aggressively they compete
    this.productFocus = this.typeConfig.productFocus; // 0-1 product vs marketing focus
    this.isActive = true; // Whether this competitor is still active in the market

    // Product
    this.product = {
      quality: 0.3 + Math.random() * 0.4, // 0.3 - 0.7 initial quality
      development: 0.0,
      features: [],
    };

    // Marketing
    this.marketing = {
      brand: 0.1 + Math.random() * 0.2, // 0.1 - 0.3 initial brand
      budget: 0,
    };

    // Users and growth
    this.users = this._generateInitialUsers();
    this.growthRate = 0;
    this.churnRate = 0.05 + Math.random() * 0.05; // 5-10% monthly churn

    // Decision making
    this.strategy = "growth"; // growth, consolidation, pivot
    this.strategyTimer = 0; // Turns until strategy change
    this.lastDecisions = []; // Track recent decisions

    // Initialize with a starting strategy
    this._setInitialStrategy();
  }

  /**
   * Make decisions for the current turn
   */
  makeTurnDecisions() {
    if (!this.isActive) return;

    console.log(`AI Competitor ${this.name} making decisions...`);

    // Check if it's time to change strategy
    this._evaluateStrategy();

    // Allocate resources based on current strategy
    this._allocateResources();

    // Consider raising funding
    this._considerFunding();

    // Record decisions for this turn
    this._recordDecisions();

    return this;
  }

  /**
   * Update competitor state for the current turn
   */
  update() {
    if (!this.isActive) return;

    // Update product quality
    this._updateProduct();

    // Update user metrics
    this._updateUsers();

    // Update financial metrics
    this._updateFinancials();

    // Check for bankruptcy
    this._checkBankruptcy();

    return this;
  }

  /**
   * Serialize competitor data for saving
   */
  serialize() {
    // Create a clone without circular references
    const serialized = {
      name: this.name,
      type: this.type,
      industry: this.industry,
      cash: this.cash,
      revenue: this.revenue,
      valuation: this.valuation,
      fundingRound: this.fundingRound,
      aggressiveness: this.aggressiveness,
      productFocus: this.productFocus,
      isActive: this.isActive,
      product: this.product,
      marketing: this.marketing,
      users: this.users,
      growthRate: this.growthRate,
      churnRate: this.churnRate,
      strategy: this.strategy,
      strategyTimer: this.strategyTimer,
      lastDecisions: this.lastDecisions,
    };

    return serialized;
  }

  /**
   * Deserialize and restore competitor data
   * @param {Object} data - Serialized competitor data
   */
  deserialize(data) {
    // Restore simple properties
    this.name = data.name;
    this.type = data.type;
    this.industry = data.industry;
    this.cash = data.cash;
    this.revenue = data.revenue;
    this.valuation = data.valuation;
    this.fundingRound = data.fundingRound;
    this.aggressiveness = data.aggressiveness;
    this.productFocus = data.productFocus;
    this.isActive = data.isActive;
    this.product = data.product;
    this.marketing = data.marketing;
    this.users = data.users;
    this.growthRate = data.growthRate;
    this.churnRate = data.churnRate;
    this.strategy = data.strategy;
    this.strategyTimer = data.strategyTimer;
    this.lastDecisions = data.lastDecisions;

    // Re-load typeConfig based on type
    this.typeConfig =
      CONFIG.COMPETITOR_TYPES.find((t) => t.id === this.type) ||
      CONFIG.COMPETITOR_TYPES[1];

    return this;
  }

  /**
   * Generate initial funding based on competitor type
   * @private
   */
  _generateInitialCash() {
    // Base amount for all competitors
    const baseCash = 500000;

    // Adjust based on competitor type
    const multiplier =
      {
        aggressive: 1.5, // Aggressive competitors start with more cash
        balanced: 1.0, // Balanced get the base amount
        product: 1.2, // Product-focused get a bit more
        conservative: 0.8, // Conservative start with less
      }[this.type] || 1.0;

    // Add some randomness (±20%)
    const randomFactor = 0.8 + Math.random() * 0.4;

    return Math.round(baseCash * multiplier * randomFactor);
  }

  /**
   * Generate initial valuation
   * @private
   */
  _generateInitialValuation() {
    // Base valuation
    const baseValuation = 1000000;

    // Add some randomness (±30%)
    const randomFactor = 0.7 + Math.random() * 0.6;

    return Math.round(baseValuation * randomFactor);
  }

  /**
   * Generate initial users
   * @private
   */
  _generateInitialUsers() {
    // Base users
    const baseUsers = 100;

    // Adjust based on competitor type
    const multiplier =
      {
        aggressive: 2.0, // Aggressive competitors start with more users
        balanced: 1.0, // Balanced get the base amount
        product: 0.5, // Product-focused start with fewer users
        conservative: 0.7, // Conservative start with moderate users
      }[this.type] || 1.0;

    // Add some randomness (±40%)
    const randomFactor = 0.6 + Math.random() * 0.8;

    return Math.round(baseUsers * multiplier * randomFactor);
  }

  /**
   * Set the initial strategy for the competitor
   * @private
   */
  _setInitialStrategy() {
    // Choose strategy based on competitor type
    switch (this.type) {
      case "aggressive":
        this.strategy = "growth";
        break;
      case "product":
        this.strategy = "product";
        break;
      case "conservative":
        this.strategy = "consolidation";
        break;
      case "balanced":
      default:
        // Randomly choose between growth and product for balanced competitors
        this.strategy = Math.random() < 0.5 ? "growth" : "product";
        break;
    }

    // Set a duration for this strategy (3-6 turns)
    this.strategyTimer = 3 + Math.floor(Math.random() * 4);

    console.log(
      `Competitor ${this.name} set initial strategy: ${this.strategy} for ${this.strategyTimer} turns`
    );
  }

  /**
   * Evaluate and potentially change strategy
   * @private
   */
  _evaluateStrategy() {
    // Decrease strategy timer
    this.strategyTimer--;

    // Check if it's time to change strategy
    if (this.strategyTimer <= 0) {
      // Analyze current state to determine next strategy
      this._chooseNextStrategy();

      // Set a new duration for this strategy (3-6 turns)
      this.strategyTimer = 3 + Math.floor(Math.random() * 4);

      console.log(
        `Competitor ${this.name} changed strategy to: ${this.strategy} for ${this.strategyTimer} turns`
      );
    }
  }

  /**
   * Choose the next strategy based on current state
   * @private
   */
  _chooseNextStrategy() {
    // Get market state
    const market = this.game.market;
    const playerCompany = this.game.company;

    // Cash position factor
    const lowCash = this.cash < this.revenue * 6; // Less than 6 months runway
    const highCash = this.cash > this.revenue * 24; // More than 2 years runway

    // Growth factor
    const growthIsSlow = this.growthRate < 0.05;
    const growthIsFast = this.growthRate > 0.2;

    // Market condition factor
    const marketIsGood =
      market.fundingAvailability > 1.0 && market.sentimentIndex > 0.6;
    const marketIsBad =
      market.fundingAvailability < 0.8 || market.sentimentIndex < 0.4;

    // Product quality relative to player
    const productQualityLow =
      this.product.quality < playerCompany.product.quality - 0.2;
    const productQualityHigh =
      this.product.quality > playerCompany.product.quality + 0.1;

    // User count relative to player
    const usersLow = this.users < playerCompany.users * 0.5;
    const usersHigh = this.users > playerCompany.users * 1.5;

    // Strategy selection logic - combines factors with competitor personality
    let strategies = [];

    // Add strategies with weights based on conditions
    strategies.push({
      name: "growth",
      weight:
        (marketIsGood ? 3 : 0) +
        (highCash ? 2 : 0) +
        (usersLow ? 2 : 0) +
        (growthIsSlow ? 1 : 0) +
        (this.type === "aggressive" ? 3 : 0),
    });

    strategies.push({
      name: "product",
      weight:
        (productQualityLow ? 3 : 0) +
        (growthIsSlow && !lowCash ? 2 : 0) +
        (this.type === "product" ? 3 : 0),
    });

    strategies.push({
      name: "consolidation",
      weight:
        (lowCash ? 3 : 0) +
        (marketIsBad ? 2 : 0) +
        (growthIsFast ? 1 : 0) +
        (this.type === "conservative" ? 2 : 0),
    });

    strategies.push({
      name: "pivot",
      weight:
        (growthIsSlow && productQualityLow ? 3 : 0) +
        (usersLow && !productQualityHigh ? 2 : 0) +
        (this.aggressiveness > 0.7 ? 1 : 0),
    });

    // Sort by weight and ensure minimum weights
    strategies = strategies.map((s) => ({
      ...s,
      weight: Math.max(1, s.weight),
    }));
    strategies.sort((a, b) => b.weight - a.weight);

    // Add up total weight
    const totalWeight = strategies.reduce((sum, s) => sum + s.weight, 0);

    // Choose strategy based on weighted probability
    let random = Math.random() * totalWeight;
    let selectedStrategy = strategies[0].name; // Default to highest weighted

    for (const strategy of strategies) {
      random -= strategy.weight;
      if (random <= 0) {
        selectedStrategy = strategy.name;
        break;
      }
    }

    // Set the new strategy
    this.strategy = selectedStrategy;
  }

  /**
   * Allocate resources based on current strategy
   * @private
   */
  _allocateResources() {
    // Reset allocations
    this.marketing.budget = 0;

    // Calculate available cash for this turn
    const availableCash = this.cash * 0.2; // Use up to 20% of cash per turn

    // Allocate based on strategy
    switch (this.strategy) {
      case "growth":
        // Focus on marketing and user acquisition
        this.marketing.budget = availableCash * 0.8;
        break;

      case "product":
        // Focus on product development
        this.marketing.budget = availableCash * 0.3;
        // Product improvements happen automatically in update
        break;

      case "consolidation":
        // Conservative spending to extend runway
        this.marketing.budget = availableCash * 0.4;
        break;

      case "pivot":
        // Major product shift
        this.marketing.budget = availableCash * 0.2;

        // Big product quality improvement
        this.product.quality += 0.15;
        this.product.quality = Math.min(1, this.product.quality);

        // But temporary loss of users
        this.users *= 0.8;
        break;
    }

    // Adjust based on personality
    if (this.type === "aggressive") {
      this.marketing.budget *= 1.2;
    } else if (this.type === "conservative") {
      this.marketing.budget *= 0.8;
    }

    // Ensure we don't spend more than available
    this.marketing.budget = Math.min(this.marketing.budget, this.cash);
    this.cash -= this.marketing.budget;
  }

  /**
   * Consider raising funding based on current state
   * @private
   */
  _considerFunding() {
    // Only consider funding in certain situations
    const shouldRaiseFunding =
      // When cash is running low
      this.cash < this.revenue * 6 ||
      // When in growth strategy with sufficient valuation
      (this.strategy === "growth" && this.valuation > 2000000) ||
      // When pivoting
      (this.strategy === "pivot" && this.cash < this.revenue * 12);

    if (!shouldRaiseFunding) {
      return;
    }

    // Determine appropriate funding round based on current valuation
    let targetRound = "seed";
    if (this.valuation >= 50000000) {
      targetRound = "series-c";
    } else if (this.valuation >= 20000000) {
      targetRound = "series-b";
    } else if (this.valuation >= 5000000) {
      targetRound = "series-a";
    }

    // Skip if we already had this round or higher
    if (
      (targetRound === "seed" && this.fundingRound !== "pre-seed") ||
      (targetRound === "series-a" &&
        ["series-a", "series-b", "series-c"].includes(this.fundingRound)) ||
      (targetRound === "series-b" &&
        ["series-b", "series-c"].includes(this.fundingRound)) ||
      (targetRound === "series-c" && this.fundingRound === "series-c")
    ) {
      return;
    }

    // Get round configuration
    const roundConfig = CONFIG.FUNDING_ROUNDS.find(
      (r) => r.name.toLowerCase() === targetRound
    );

    if (!roundConfig || this.valuation < roundConfig.minValuation) {
      return;
    }

    // Calculate funding success probability based on market conditions
    const marketFactor = this.game.market.fundingAvailability;
    const companyFactor = Math.min(
      1,
      this.product.quality + this.marketing.brand
    );
    const baseProbability = 0.7 - roundConfig.difficulty;
    const successProbability = Math.min(
      0.95,
      Math.max(0.1, baseProbability * marketFactor * companyFactor)
    );

    // Roll for success
    if (Math.random() <= successProbability) {
      // Calculate funding amount and equity
      const [minEquity, maxEquity] = roundConfig.equityRange;
      const equityPercent = minEquity + Math.random() * (maxEquity - minEquity);

      // Calculate round valuation (with some randomness)
      const valuationMultiple = 1 + (Math.random() * 0.4 - 0.2); // +/- 20%
      const roundValuation = this.valuation * valuationMultiple;

      // Calculate funding amount
      const fundingAmount = Math.round(roundValuation * equityPercent);

      // Apply the funding
      this.cash += fundingAmount;
      this.valuation = roundValuation;
      this.fundingRound = targetRound;

      console.log(
        `Competitor ${
          this.name
        } raised ${targetRound} funding: $${fundingAmount.toLocaleString()} at $${roundValuation.toLocaleString()} valuation`
      );

      // Notify the player if it's a significant competitor
      if (
        this.users > this.game.company.users * 0.5 ||
        this.valuation > this.game.company.valuation * 0.5
      ) {
        this.game.addNotification(
          `Competitor ${
            this.name
          } just raised ${targetRound} funding at a $${Math.round(
            roundValuation / 1000000
          )}M valuation.`,
          "competitor"
        );
      }
    }
  }

  /**
   * Record decisions made this turn for future reference
   * @private
   */
  _recordDecisions() {
    const decisions = {
      turn: this.game.state.currentTurn,
      strategy: this.strategy,
      marketingBudget: this.marketing.budget,
      cash: this.cash,
      users: this.users,
      productQuality: this.product.quality,
    };

    // Keep only the last 5 turns
    this.lastDecisions.unshift(decisions);
    if (this.lastDecisions.length > 5) {
      this.lastDecisions.pop();
    }
  }

  /**
   * Update product quality
   * @private
   */
  _updateProduct() {
    // Base decay
    const baseDecay = CONFIG.PRODUCT_QUALITY_DECAY / 2; // Half the player's decay rate

    // Product development based on strategy
    let developmentBoost = 0;

    switch (this.strategy) {
      case "product":
        developmentBoost = 0.1;
        break;
      case "growth":
        developmentBoost = 0.03;
        break;
      case "consolidation":
        developmentBoost = 0.02;
        break;
      case "pivot":
        developmentBoost = 0.15;
        break;
    }

    // Adjust for competitor type
    if (this.type === "product") {
      developmentBoost *= 1.5;
    }

    // Apply product quality changes
    this.product.quality = Math.max(
      0.1,
      Math.min(1, this.product.quality * (1 - baseDecay) + developmentBoost)
    );

    // Simulate feature development
    this.product.development += 0.05 + Math.random() * 0.05;
    this.product.development = Math.min(1, this.product.development);
  }

  /**
   * Update user metrics
   * @private
   */
  _updateUsers() {
    // Base acquisition from marketing
    const marketingEfficiency = 0.8; // How efficiently they convert marketing to users
    const acquisitionFromMarketing = Math.floor(
      (this.marketing.budget / 10) * marketingEfficiency
    );

    // Acquisition from product quality
    const acquisitionFromProduct = Math.floor(
      this.users * this.product.quality * 0.1
    );

    // Total new users
    const newUsers = acquisitionFromMarketing + acquisitionFromProduct;

    // Calculate churn
    const churnModifier = 1 - this.product.quality * 0.5; // Quality reduces churn
    const churnedUsers = Math.floor(
      this.users * this.churnRate * churnModifier
    );

    // Update total users
    this.users = Math.max(0, this.users + newUsers - churnedUsers);

    // Calculate growth rate
    const prevUsers = this.users - newUsers + churnedUsers;
    this.growthRate = prevUsers > 0 ? this.users / prevUsers - 1 : 0;

    // Update brand awareness based on marketing and users
    this.marketing.brand += 0.01 * (this.marketing.budget > 0 ? 1 : 0);
    this.marketing.brand += 0.001 * Math.sqrt(this.users);
    this.marketing.brand = Math.min(1, this.marketing.brand);
  }

  /**
   * Update financial metrics
   * @private
   */
  _updateFinancials() {
    // Calculate revenue based on users and industry
    const industry = this.game.market.getIndustry(this.industry);
    const [minValue, maxValue] = industry.userValueRange;
    const avgUserValue = (minValue + maxValue) / 2;

    // Monthly revenue (annual value divided by 12)
    this.revenue = Math.floor(
      this.users * (avgUserValue / 12) * this.product.quality
    );

    // Add revenue to cash
    this.cash += this.revenue;

    // Calculate expenses (simplified)
    const expenses = Math.floor(this.revenue * 0.8); // 80% of revenue goes to expenses
    this.cash -= expenses;

    // Update valuation
    this._updateValuation();
  }

  /**
   * Update company valuation
   * @private
   */
  _updateValuation() {
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
    const productQualityBonus = this.product.quality * 500000; // Up to $500k bonus
    valuation += productQualityBonus;

    // Apply market conditions
    valuation *= this.game.market.valuationMultiplier;

    // Ensure minimum valuation
    valuation = Math.max(valuation, 300000);

    // Add some randomness (±10%)
    const randomFactor = 0.9 + Math.random() * 0.2;
    valuation *= randomFactor;

    // Set the new valuation
    this.valuation = Math.round(valuation);
  }

  /**
   * Check for bankruptcy
   * @private
   */
  _checkBankruptcy() {
    if (this.cash <= 0) {
      this.isActive = false;

      console.log(`Competitor ${this.name} went bankrupt!`);

      // Notify the player
      this.game.addNotification(
        `Your competitor ${this.name} has gone bankrupt!`,
        "competitor"
      );

      // Market opportunity from competitor bankruptcy
      const opportunitySize = Math.floor(this.users * 0.3); // 30% of their users up for grabs
      this.game.company.users += Math.floor(
        opportunitySize * this.game.company.product.quality
      );
    }
  }
}
