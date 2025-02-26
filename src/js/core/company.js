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
    this.churnRate = 0.05; // 5% monthly churn

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

    // Check for bankruptcy
    this._checkBankruptcy();

    // Check for other end game conditions
    this._checkEndGameConditions();

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
   * Start developing a new product feature
   * @param {Object} featureData - Feature details
   */
  developFeature(featureData) {
    const feature = {
      id: Date.now(),
      name: featureData.name,
      description: featureData.description,
      complexity: featureData.complexity || "medium",
      cost: CONFIG.FEATURE_COMPLEXITY_LEVELS[featureData.complexity || "medium"]
        .cost,
      timeRequired:
        CONFIG.FEATURE_COMPLEXITY_LEVELS[featureData.complexity || "medium"]
          .time,
      progress: 0,
      completed: false,
      impact:
        CONFIG.FEATURE_COMPLEXITY_LEVELS[featureData.complexity || "medium"]
          .impact,
      startedAt: this.game.state.currentTurn,
    };

    // Add to features list
    this.product.features.push(feature);

    // Deduct immediate cost
    this.cash -= feature.cost;

    return feature;
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

    // Calculate valuation for this round (with some randomness)
    const valuationMultiple = 1 + (Math.random() * 0.4 - 0.2); // +/- 20%
    const roundValuation = this.valuation * valuationMultiple;

    // Calculate equity given for the investment
    const [minEquity, maxEquity] = roundConfig.equityRange;
    const equityPercentage =
      minEquity + Math.random() * (maxEquity - minEquity);
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
    const operationalCosts = 5000 + this.team.employees.length * 1000;

    // Sum up total costs
    this.costs = employeeCosts + operationalCosts + this.marketing.budget;

    // Calculate burn rate (monthly cash flow)
    // Only count recurring costs, not one-time marketing expenses
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
        // Calculate user acquisition for this channel
        const efficiency =
          channel.efficiency * this.marketing.brand * this.product.quality;
        const acquisitions = Math.floor(
          (channel.budget / channelConfig.costPerUser) * efficiency
        );

        channel.acquisitions = acquisitions;
        newUsers += acquisitions;
      } else {
        channel.acquisitions = 0;
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
    if (this.cash <= CONFIG.BANKRUPTCY_THRESHOLD) {
      this.game.gameOver("bankruptcy");
    }

    return this;
  }

  /**
   * Check for end game conditions (bankruptcy, acquisition, IPO)
   * @private
   */
  _checkEndGameConditions() {
    // Check for bankruptcy
    if (this.cash <= 0 && this.burnRate < 0) {
      this.game.gameOver("bankruptcy");
      // This will be handled by the UI
    }

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
   * @private
   */
  _generateEmployeeName() {
    const firstNames = [
      "Alex",
      "Sam",
      "Jordan",
      "Taylor",
      "Casey",
      "Riley",
      "Quinn",
      "Avery",
      "Morgan",
      "Drew",
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
      "Lee",
      "Chen",
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
}
