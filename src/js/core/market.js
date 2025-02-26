/**
 * Startup Tycoon - Market Class
 * Simulates the market conditions, economy, and industry-specific factors
 */

class Market {
  constructor(game) {
    this.game = game;

    // Market-wide metrics
    this.growthRate = 0.05; // Overall market growth rate (5% per turn)
    this.valuationMultiplier = 1.0; // Multiplier for company valuations
    this.fundingAvailability = 1.0; // How easy it is to get funding (1.0 = normal)
    this.sentimentIndex = 0.5; // Market sentiment (0-1 scale)

    // Industry-specific metrics
    this.industries = {};

    // Initialize industry data
    this._initializeIndustries();

    // Market cycle tracking
    this.currentCycle = "neutral"; // boom, bust, neutral
    this.cycleProgress = 0; // 0-1 progress through current cycle
    this.cycleLength = this._randomCycleLength();

    // Market trends
    this.trends = [];

    // Initialize with a random trend
    this._generateTrend();
  }

  /**
   * Update market conditions for the current turn
   */
  update() {
    // Update market cycle
    this._updateMarketCycle();

    // Update industry-specific metrics
    this._updateIndustries();

    // Update market trends
    this._updateTrends();

    // Apply random market fluctuations
    this._applyRandomFluctuations();

    return this;
  }

  /**
   * Get industry configuration by ID
   * @param {string} industryId - The industry ID to look up
   */
  getIndustry(industryId) {
    return (
      this.industries[industryId] ||
      CONFIG.INDUSTRIES.find((ind) => ind.id === industryId) ||
      CONFIG.INDUSTRIES[0]
    );
  }

  /**
   * Get the current market sentiment as a descriptive string
   */
  getSentimentDescription() {
    if (this.sentimentIndex > 0.8) return "Euphoric";
    if (this.sentimentIndex > 0.6) return "Optimistic";
    if (this.sentimentIndex > 0.4) return "Neutral";
    if (this.sentimentIndex > 0.2) return "Pessimistic";
    return "Fearful";
  }

  /**
   * Get the current funding environment description
   */
  getFundingDescription() {
    if (this.fundingAvailability > 1.5) return "Extremely Available";
    if (this.fundingAvailability > 1.2) return "Abundant";
    if (this.fundingAvailability > 0.8) return "Normal";
    if (this.fundingAvailability > 0.5) return "Constrained";
    return "Dry";
  }

  /**
   * Serialize market data for saving
   */
  serialize() {
    // Create a clone with only the necessary data (no circular references)
    const serialized = {
      growthRate: this.growthRate,
      valuationMultiplier: this.valuationMultiplier,
      fundingAvailability: this.fundingAvailability,
      sentimentIndex: this.sentimentIndex,
      industries: this.industries,
      currentCycle: this.currentCycle,
      cycleProgress: this.cycleProgress,
      cycleLength: this.cycleLength,
      trends: this.trends,
    };

    return serialized;
  }

  /**
   * Deserialize and restore market data
   * @param {Object} data - Serialized market data
   */
  deserialize(data) {
    // Restore simple properties
    this.growthRate = data.growthRate;
    this.valuationMultiplier = data.valuationMultiplier;
    this.fundingAvailability = data.fundingAvailability;
    this.sentimentIndex = data.sentimentIndex;
    this.industries = data.industries;
    this.currentCycle = data.currentCycle;
    this.cycleProgress = data.cycleProgress;
    this.cycleLength = data.cycleLength;
    this.trends = data.trends;

    return this;
  }

  /**
   * Initialize industry data from config
   * @private
   */
  _initializeIndustries() {
    CONFIG.INDUSTRIES.forEach((industry) => {
      this.industries[industry.id] = {
        name: industry.name,
        growthRate: industry.growthRate,
        volatility: industry.volatility,
        revenueMultiple: this._getRevenueMultiple(industry.id),
        userValueRange: industry.userValueRange,
        competitiveness: 0.5, // Initial neutral value
      };
    });
  }

  /**
   * Determine the appropriate revenue multiple for an industry
   * @param {string} industryId - The industry ID
   * @returns {number} The revenue multiple
   * @private
   */
  _getRevenueMultiple(industryId) {
    // Different industries have different revenue multiples based on growth potential
    const multiples = {
      saas: 8, // SaaS typically gets higher multiples
      ecommerce: 3, // E-commerce often gets lower multiples
      fintech: 6, // FinTech is somewhere in the middle
      social: 10, // Social media can get very high multiples on user metrics
    };

    return multiples[industryId] || 5; // Default to 5x if not specified
  }

  /**
   * Update the market cycle progression
   * @private
   */
  _updateMarketCycle() {
    // Progress through the current cycle
    this.cycleProgress += 1 / this.cycleLength;

    // Check if we've completed the current cycle
    if (this.cycleProgress >= 1) {
      // Reset progress and determine the next cycle
      this.cycleProgress = 0;
      this.cycleLength = this._randomCycleLength();

      // Choose the next cycle
      const nextCycleOptions = this._getNextCycleOptions();
      const nextCycle =
        nextCycleOptions[Math.floor(Math.random() * nextCycleOptions.length)];

      // Log the cycle change
      console.log(
        `Market cycle changing from ${this.currentCycle} to ${nextCycle}`
      );

      // If this is a major change, add a notification
      if (this.currentCycle !== nextCycle) {
        let message = "";
        switch (nextCycle) {
          case "boom":
            message =
              "Economic boom! Markets are thriving and funding is abundant.";
            break;
          case "bust":
            message =
              "Economic downturn. Investors are cautious and valuations are dropping.";
            break;
          case "neutral":
            message =
              "Markets have stabilized. Normal economic conditions have returned.";
            break;
        }

        this.game.addNotification(message, "market");
      }

      // Apply the new cycle
      this.currentCycle = nextCycle;
      this._applyCycleEffects();
    }

    // Gradual effect based on cycle progress
    this._applyCycleProgressEffects();
  }

  /**
   * Get possible next market cycles based on the current cycle
   * @returns {Array} Array of possible next cycles
   * @private
   */
  _getNextCycleOptions() {
    switch (this.currentCycle) {
      case "boom":
        // Booms can continue or turn neutral, rarely straight to bust
        return ["boom", "boom", "neutral", "neutral", "bust"];
      case "bust":
        // Busts can continue or turn neutral, rarely straight to boom
        return ["bust", "bust", "neutral", "neutral", "boom"];
      case "neutral":
        // Neutral can go either way
        return ["neutral", "neutral", "boom", "bust"];
      default:
        return ["neutral"];
    }
  }

  /**
   * Apply the effects of the current market cycle
   * @private
   */
  _applyCycleEffects() {
    // Reset to baseline first
    this.valuationMultiplier = 1.0;
    this.fundingAvailability = 1.0;
    this.sentimentIndex = 0.5;

    // Apply cycle-specific effects
    switch (this.currentCycle) {
      case "boom":
        this.valuationMultiplier = 1.5;
        this.fundingAvailability = 1.5;
        this.sentimentIndex = 0.8;
        this.growthRate = 0.1;
        break;
      case "bust":
        this.valuationMultiplier = 0.6;
        this.fundingAvailability = 0.6;
        this.sentimentIndex = 0.2;
        this.growthRate = -0.05;
        break;
      case "neutral":
        // Already reset to baseline above
        break;
    }
  }

  /**
   * Apply gradual effects based on cycle progress
   * @private
   */
  _applyCycleProgressEffects() {
    // As we progress through a cycle, gradually move toward the next cycle
    const nextCycleOptions = this._getNextCycleOptions();

    // Find most likely next cycle (most frequent in the options array)
    const counts = {};
    let mostLikelyNext = nextCycleOptions[0];
    let maxCount = 0;

    nextCycleOptions.forEach((cycle) => {
      counts[cycle] = (counts[cycle] || 0) + 1;
      if (counts[cycle] > maxCount) {
        maxCount = counts[cycle];
        mostLikelyNext = cycle;
      }
    });

    // Only apply gradual changes if the most likely next is different
    if (mostLikelyNext !== this.currentCycle) {
      const transitionProgress = this.cycleProgress * 0.3; // Only partial effect

      // Calculate target values based on most likely next cycle
      let targetValuationMultiplier = 1.0;
      let targetFundingAvailability = 1.0;
      let targetSentimentIndex = 0.5;
      let targetGrowthRate = 0.05;

      switch (mostLikelyNext) {
        case "boom":
          targetValuationMultiplier = 1.5;
          targetFundingAvailability = 1.5;
          targetSentimentIndex = 0.8;
          targetGrowthRate = 0.1;
          break;
        case "bust":
          targetValuationMultiplier = 0.6;
          targetFundingAvailability = 0.6;
          targetSentimentIndex = 0.2;
          targetGrowthRate = -0.05;
          break;
      }

      // Gradually move toward target values
      this.valuationMultiplier +=
        (targetValuationMultiplier - this.valuationMultiplier) *
        transitionProgress;
      this.fundingAvailability +=
        (targetFundingAvailability - this.fundingAvailability) *
        transitionProgress;
      this.sentimentIndex +=
        (targetSentimentIndex - this.sentimentIndex) * transitionProgress;
      this.growthRate +=
        (targetGrowthRate - this.growthRate) * transitionProgress;
    }
  }

  /**
   * Update industry-specific metrics
   * @private
   */
  _updateIndustries() {
    // Apply baseline market growth to all industries
    Object.keys(this.industries).forEach((industryId) => {
      const industry = this.industries[industryId];

      // Apply market growth rate as a factor
      industry.growthRate = industry.growthRate * (1 + this.growthRate * 0.5);

      // Add some random volatility
      const volatilityEffect = (Math.random() * 2 - 1) * industry.volatility;
      industry.growthRate += volatilityEffect * 0.1;

      // Ensure growth rate stays within reasonable bounds
      industry.growthRate = Math.max(-0.2, Math.min(0.3, industry.growthRate));

      // Update competitiveness based on growth (faster growing industries attract more competitors)
      industry.competitiveness += industry.growthRate > 0 ? 0.05 : -0.03;
      industry.competitiveness = Math.max(
        0.1,
        Math.min(0.9, industry.competitiveness)
      );
    });
  }

  /**
   * Update market trends
   * @private
   */
  _updateTrends() {
    // Update existing trends
    this.trends = this.trends.filter((trend) => {
      // Progress the trend
      trend.progress += 1 / trend.duration;

      // Check if trend has completed
      if (trend.progress >= 1) {
        console.log("Trend ended:", trend.name);
        return false;
      }

      return true;
    });

    // Chance to generate a new trend
    if (Math.random() < 0.15 && this.trends.length < 3) {
      this._generateTrend();
    }
  }

  /**
   * Generate a new market trend
   * @private
   */
  _generateTrend() {
    const trendOptions = [
      {
        name: "AI Revolution",
        affectedIndustries: ["saas"],
        effect: { growthRate: 0.1, valuationMultiplier: 1.3 },
      },
      {
        name: "Sustainability Focus",
        affectedIndustries: ["ecommerce"],
        effect: { growthRate: 0.08, valuationMultiplier: 1.2 },
      },
      {
        name: "Privacy Concerns",
        affectedIndustries: ["social", "fintech"],
        effect: { growthRate: -0.05, valuationMultiplier: 0.8 },
      },
      {
        name: "Mobile-First Movement",
        affectedIndustries: ["saas", "ecommerce", "social"],
        effect: { growthRate: 0.07, valuationMultiplier: 1.15 },
      },
      {
        name: "Crypto Boom",
        affectedIndustries: ["fintech"],
        effect: { growthRate: 0.15, valuationMultiplier: 1.5 },
      },
      {
        name: "Remote Work Shift",
        affectedIndustries: ["saas"],
        effect: { growthRate: 0.12, valuationMultiplier: 1.25 },
      },
    ];

    // Select a random trend
    const selectedTrend =
      trendOptions[Math.floor(Math.random() * trendOptions.length)];

    // Set a random duration between 6-12 turns
    const trendDuration = 6 + Math.floor(Math.random() * 7);

    // Create the trend object
    const trend = {
      name: selectedTrend.name,
      affectedIndustries: selectedTrend.affectedIndustries,
      effect: selectedTrend.effect,
      duration: trendDuration,
      progress: 0,
    };

    console.log("New market trend:", trend);
    this.game.addNotification(`New market trend: ${trend.name}`, "market");

    // Add the trend
    this.trends.push(trend);

    // Apply initial effect of the trend
    this._applyTrendEffects(trend);

    return trend;
  }

  /**
   * Apply the effects of a market trend
   * @param {Object} trend - The trend to apply
   * @private
   */
  _applyTrendEffects(trend) {
    // Apply to affected industries
    trend.affectedIndustries.forEach((industryId) => {
      if (this.industries[industryId]) {
        const industry = this.industries[industryId];

        // Apply growth effect
        if (trend.effect.growthRate) {
          industry.growthRate += trend.effect.growthRate;
        }

        // Apply valuation effect to industry directly
        if (trend.effect.valuationMultiplier) {
          industry.revenueMultiple *= trend.effect.valuationMultiplier;
        }
      }
    });
  }

  /**
   * Apply random market fluctuations
   * @private
   */
  _applyRandomFluctuations() {
    // Small random fluctuations to market metrics
    this.valuationMultiplier *= 1 + (Math.random() * 0.1 - 0.05); // +/- 5%
    this.fundingAvailability *= 1 + (Math.random() * 0.08 - 0.04); // +/- 4%
    this.sentimentIndex += Math.random() * 0.1 - 0.05; // +/- 0.05

    // Ensure values stay in reasonable ranges
    this.valuationMultiplier = Math.max(
      0.5,
      Math.min(2.0, this.valuationMultiplier)
    );
    this.fundingAvailability = Math.max(
      0.3,
      Math.min(2.0, this.fundingAvailability)
    );
    this.sentimentIndex = Math.max(0.1, Math.min(0.9, this.sentimentIndex));
  }

  /**
   * Generate a random market cycle length
   * @returns {number} Cycle length in turns
   * @private
   */
  _randomCycleLength() {
    // Cycles last between 8-16 turns
    return 8 + Math.floor(Math.random() * 9);
  }
}
