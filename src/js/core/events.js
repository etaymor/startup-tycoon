/**
 * Startup Tycoon - Event System
 * Manages random events that affect gameplay and require player decisions
 */

class EventSystem {
  constructor(game) {
    this.game = game;
    this.eventPool = {}; // Events by category
    this.eventFrequency = 1.0; // Base frequency multiplier for events
    this.lastEventTurn = 0; // Track when the last event occurred
    this.minTurnsBetweenEvents = 2; // Min turns between events for pacing

    // Track events that have occurred and player choices
    this.eventHistory = [];

    // Track pending chain events to be triggered in future turns
    this.pendingChainEvents = [];

    // Initialize event pool
    this._initializeEventPool();
  }

  /**
   * Generate events for the current turn
   * @returns {Array} Generated events for this turn
   */
  generateEvents() {
    const currentTurn = this.game.state.currentTurn;
    const generatedEvents = [];

    // First check for chain events that are due to trigger this turn
    this._checkPendingChainEvents(currentTurn, generatedEvents);

    // If we already have a chain event, don't generate random events
    if (generatedEvents.length > 0) {
      return generatedEvents;
    }

    // Check if we should generate an event this turn
    if (currentTurn - this.lastEventTurn < this.minTurnsBetweenEvents) {
      console.log("Skipping event generation due to minimum turn spacing");
      return generatedEvents;
    }

    // Chance to generate events based on frequency
    const baseChance = 0.3 * this.eventFrequency; // 30% base chance adjusted by frequency

    if (Math.random() < baseChance) {
      const event = this._selectRandomEvent();

      if (event) {
        // Set the turn the event occurred
        event.turn = currentTurn;

        // Add to generated events
        generatedEvents.push(event);

        // Update last event turn
        this.lastEventTurn = currentTurn;

        console.log("Generated event:", event);
      }
    }

    return generatedEvents;
  }

  /**
   * Handle player's choice for an event
   * @param {Object} event - The event to handle
   * @param {number} choiceIndex - The index of the chosen option
   */
  handleEventChoice(event, choiceIndex) {
    if (!event || !event.choices || choiceIndex >= event.choices.length) {
      console.error("Invalid event or choice index");
      return false;
    }

    const choice = event.choices[choiceIndex];

    console.log(`Player chose "${choice.text}" for event "${event.title}"`);

    // Apply effects of the choice
    if (choice.effects) {
      this._applyEventEffects(choice.effects);
    }

    // Add a notification about the choice
    this.game.addNotification(`You chose: ${choice.text}`, "event");

    // Update the event in game state to track the choice made
    const stateEvent = this.game.state.events.find((e) => e.id === event.id);
    if (stateEvent) {
      stateEvent.choiceMade = choiceIndex;
    }

    // Record this event and choice in history
    this.eventHistory.push({
      eventId: event.id,
      turn: this.game.state.currentTurn,
      choiceIndex: choiceIndex,
    });

    // Check if this choice triggers a chain event
    this._checkForChainEvent(event, choiceIndex);

    return true;
  }

  /**
   * Initialize the pool of available events
   * @private
   */
  _initializeEventPool() {
    // Initialize empty categories based on config
    CONFIG.EVENT_CATEGORIES.forEach((category) => {
      this.eventPool[category.id] = [];
    });

    // Add risk_reward category if not already defined in CONFIG
    if (!this.eventPool.risk_reward) {
      this.eventPool.risk_reward = [];
    }

    // Market events
    this.eventPool.market = [
      {
        id: "market_boom",
        title: "Market Boom",
        description:
          "The market is experiencing a sudden boom. Investors are throwing money at startups!",
        type: "positive",
        choices: [
          {
            text: "Capitalize on it by raising more funding",
            effects: {
              market: { valuationMultiplier: 0.2, fundingAvailability: 0.3 },
            },
          },
          {
            text: "Stay cautious and focus on sustainable growth",
            effects: {
              company: { teamMorale: 0.1 },
            },
          },
        ],
      },
      {
        id: "market_crash",
        title: "Market Downturn",
        description:
          "The market is experiencing a sudden downturn. Investors are becoming more cautious.",
        type: "negative",
        choices: [
          {
            text: "Cut costs to extend runway",
            effects: {
              company: { teamMorale: -0.2, cash: -10000 },
            },
            chainEvent: {
              eventId: "team_morale_crisis",
              delay: 2,
              probability: 0.7,
            },
          },
          {
            text: "Maintain course and weather the storm",
            effects: {
              company: { cash: -30000 },
            },
          },
        ],
      },
      {
        id: "market_expansion_opportunity",
        title: "Market Expansion Opportunity",
        description:
          "A new international market is opening up for your product. Expanding would require significant investment but could greatly increase your user base.",
        type: "opportunity",
        minValuation: 10000000, // Only for companies valued at $10M+
        minUsers: 10000, // Only for companies with 10K+ users
        choices: [
          {
            text: "Invest heavily in international expansion",
            effects: {
              company: {
                cash: -500000,
                users: 5000,
                valuation: 2000000,
              },
            },
          },
          {
            text: "Test the market with a smaller investment",
            effects: {
              company: {
                cash: -200000,
                users: 2000,
              },
            },
          },
          {
            text: "Focus on domestic growth for now",
            effects: {
              company: {
                teamMorale: 0.05,
              },
            },
          },
        ],
      },
      {
        id: "major_platform_change",
        title: "Major Platform Change",
        description:
          "A platform your product heavily relies on has announced significant API changes that will affect your service. Adapting will require substantial development resources.",
        type: "negative",
        minValuation: 5000000, // Only for companies valued at $5M+
        choices: [
          {
            text: "Allocate significant resources to adapt quickly",
            effects: {
              company: {
                cash: -300000,
                productQuality: 0.1,
              },
            },
          },
          {
            text: "Gradually adapt while maintaining current features",
            effects: {
              company: {
                cash: -150000,
                users: -1000,
                productQuality: 0.05,
              },
            },
          },
          {
            text: "Minimize changes and focus on alternative platforms",
            effects: {
              company: {
                users: -3000,
                churnRate: 0.02,
              },
            },
          },
        ],
      },
    ];

    // Competitor events
    this.eventPool.competitor = [
      {
        id: "new_competitor",
        title: "New Competitor",
        description:
          "A new competitor has entered the market with a similar product.",
        type: "negative",
        choices: [
          {
            text: "Accelerate product development",
            effects: {
              company: { cash: -20000, productQuality: 0.1 },
            },
          },
          {
            text: "Increase marketing to maintain market position",
            effects: {
              company: { cash: -15000, brand: 0.1 },
            },
          },
          {
            text: "Ignore them and focus on your own strategy",
            effects: {
              company: { teamMorale: 0.05 },
            },
          },
        ],
      },

      // Events for larger companies
      {
        id: "major_competitor_merger",
        title: "Major Competitor Merger",
        description:
          "Two of your significant competitors have announced a merger, creating a formidable rival in the market.",
        type: "negative",
        minValuation: 20000000, // Only for companies valued at $20M+
        minUsers: 50000, // Only for companies with 50K+ users
        choices: [
          {
            text: "Accelerate product development to stay competitive",
            effects: {
              company: {
                cash: -1000000,
                productQuality: 0.15,
                teamMorale: -0.1,
              },
            },
          },
          {
            text: "Launch aggressive marketing campaign to retain users",
            effects: {
              company: {
                cash: -800000,
                brand: 0.2,
                churnRate: -0.02,
              },
            },
          },
          {
            text: "Explore potential acquisition targets to counter the merger",
            effects: {
              company: {
                cash: -500000,
                valuation: -1000000,
              },
              special: "acquisition_opportunity",
            },
          },
        ],
      },
      {
        id: "talent_poaching",
        title: "Talent Poaching",
        description:
          "A well-funded competitor is actively recruiting your key team members with lucrative offers.",
        type: "negative",
        minValuation: 10000000, // Only for companies valued at $10M+
        choices: [
          {
            text: "Increase salaries and benefits to retain talent",
            effects: {
              company: {
                cash: -500000,
                teamMorale: 0.15,
              },
            },
          },
          {
            text: "Offer equity incentives instead of cash",
            effects: {
              company: {
                equity: { player: -0.05 },
                teamMorale: 0.1,
              },
            },
          },
          {
            text: "Let some talent go and focus on recruiting replacements",
            effects: {
              company: {
                teamMorale: -0.2,
                productQuality: -0.1,
              },
            },
          },
        ],
      },
    ];

    // Internal events
    this.eventPool.internal = [
      {
        id: "team_conflict",
        title: "Team Conflict",
        description:
          "There's growing tension between team members that's affecting productivity.",
        type: "negative",
        choices: [
          {
            text: "Mediate and resolve the conflict",
            effects: {
              company: { teamMorale: 0.1, productQuality: 0.05 },
            },
          },
          {
            text: "Restructure teams to separate conflicting members",
            effects: {
              company: { teamMorale: -0.05, productQuality: 0.02 },
            },
          },
          {
            text: "Ignore it and hope it resolves itself",
            effects: {
              company: { teamMorale: -0.2, productQuality: -0.1 },
            },
          },
        ],
      },

      // Events for larger companies
      {
        id: "scaling_infrastructure_challenges",
        title: "Scaling Infrastructure Challenges",
        description:
          "Your platform is experiencing stability issues due to rapid user growth. The current infrastructure needs significant upgrades.",
        type: "negative",
        minUsers: 100000, // Only for companies with 100K+ users
        choices: [
          {
            text: "Complete infrastructure overhaul",
            effects: {
              company: {
                cash: -2000000,
                productQuality: 0.2,
                churnRate: -0.05,
              },
            },
          },
          {
            text: "Implement targeted improvements to critical systems",
            effects: {
              company: {
                cash: -800000,
                productQuality: 0.1,
                churnRate: -0.02,
              },
            },
          },
          {
            text: "Minimal patches while planning long-term solutions",
            effects: {
              company: {
                cash: -200000,
                users: -5000,
                churnRate: 0.03,
              },
            },
          },
        ],
      },
      {
        id: "corporate_restructuring",
        title: "Corporate Restructuring Needed",
        description:
          "Your company has grown rapidly but organizational inefficiencies are becoming apparent. A restructuring could improve operations but carries risks.",
        type: "neutral",
        minValuation: 50000000, // Only for companies valued at $50M+
        minUsers: 200000, // Only for companies with 200K+ users
        choices: [
          {
            text: "Implement comprehensive restructuring with consultants",
            effects: {
              company: {
                cash: -3000000,
                teamMorale: -0.1,
                productQuality: 0.15,
                valuation: 5000000,
              },
            },
          },
          {
            text: "Gradual departmental reorganization",
            effects: {
              company: {
                cash: -1000000,
                teamMorale: 0.05,
                productQuality: 0.05,
              },
            },
          },
          {
            text: "Maintain current structure but improve processes",
            effects: {
              company: {
                cash: -500000,
                teamMorale: 0.1,
              },
            },
          },
        ],
      },
    ];

    // Opportunity events
    this.eventPool.opportunity = [
      {
        id: "partnership_offer",
        title: "Partnership Opportunity",
        description:
          "A complementary business has approached you about a strategic partnership.",
        type: "positive",
        choices: [
          {
            text: "Accept the partnership",
            effects: {
              company: { users: 500, valuation: 50000 },
            },
          },
          {
            text: "Negotiate better terms",
            effects: {
              company: { users: 200, valuation: 20000 },
            },
          },
          {
            text: "Decline and focus on your core business",
            effects: {
              company: { teamMorale: 0.05 },
            },
          },
        ],
      },

      // Events for larger companies
      {
        id: "acquisition_target",
        title: "Acquisition Target Identified",
        description:
          "Your team has identified a promising smaller competitor that could be acquired to expand your market share and technology capabilities.",
        type: "opportunity",
        minValuation: 100000000, // Only for companies valued at $100M+
        minUsers: 500000, // Only for companies with 500K+ users
        choices: [
          {
            text: "Pursue aggressive acquisition",
            effects: {
              company: {
                cash: -20000000,
                users: 100000,
                productQuality: 0.1,
                valuation: 30000000,
              },
            },
          },
          {
            text: "Negotiate strategic partnership instead",
            effects: {
              company: {
                cash: -5000000,
                users: 20000,
                brand: 0.1,
              },
            },
          },
          {
            text: "Decline and focus on organic growth",
            effects: {
              company: {
                cash: 0,
              },
            },
          },
        ],
      },
      {
        id: "major_enterprise_client",
        title: "Major Enterprise Client Opportunity",
        description:
          "A Fortune 500 company is interested in implementing your solution across their organization, but requires custom features and dedicated support.",
        type: "opportunity",
        minValuation: 50000000, // Only for companies valued at $50M+
        minRevenue: 500000, // Only for companies with $500K+ monthly revenue
        choices: [
          {
            text: "Dedicate resources to win and service this client",
            effects: {
              company: {
                cash: -2000000,
                revenue: 500000,
                valuation: 10000000,
                teamMorale: -0.05,
              },
            },
          },
          {
            text: "Offer limited customization within your product roadmap",
            effects: {
              company: {
                cash: -500000,
                revenue: 200000,
                valuation: 3000000,
              },
            },
          },
          {
            text: "Decline to maintain focus on core market",
            effects: {
              company: {
                teamMorale: 0.05,
              },
            },
          },
        ],
      },
    ];

    // Global events
    this.eventPool.global = [
      {
        id: "economic_recession",
        title: "Economic Recession",
        description:
          "A global economic downturn is affecting markets worldwide.",
        type: "negative",
        choices: [
          {
            text: "Cut costs aggressively",
            effects: {
              company: { cash: -5000, teamMorale: -0.2 },
              market: { fundingAvailability: -0.3 },
            },
          },
          {
            text: "Maintain operations but delay expansion",
            effects: {
              company: { cash: -20000 },
              market: { fundingAvailability: -0.2 },
            },
          },
          {
            text: "Invest counter-cyclically to gain market share",
            effects: {
              company: { cash: -50000, valuation: -100000 },
              market: { fundingAvailability: -0.1 },
            },
          },
        ],
      },

      // Events for larger companies
      {
        id: "regulatory_scrutiny",
        title: "Regulatory Scrutiny",
        description:
          "As your company has grown, it's attracted attention from regulators concerned about data privacy and market competition practices.",
        type: "negative",
        minValuation: 500000000, // Only for companies valued at $500M+
        minUsers: 1000000, // Only for companies with 1M+ users
        choices: [
          {
            text: "Proactively implement comprehensive compliance measures",
            effects: {
              company: {
                cash: -10000000,
                valuation: -20000000,
                teamMorale: -0.1,
                productQuality: -0.05,
              },
            },
          },
          {
            text: "Engage with regulators while making minimal changes",
            effects: {
              company: {
                cash: -5000000,
                valuation: -50000000,
                churnRate: 0.02,
              },
            },
          },
          {
            text: "Fight regulations through legal challenges",
            effects: {
              company: {
                cash: -20000000,
                valuation: -100000000,
                brand: -0.2,
              },
              special: "regulatory_battle",
            },
          },
        ],
      },
      {
        id: "international_expansion_challenges",
        title: "International Expansion Challenges",
        description:
          "Your global expansion is facing unexpected challenges with local regulations, cultural differences, and established competitors.",
        type: "negative",
        minValuation: 200000000, // Only for companies valued at $200M+
        minUsers: 500000, // Only for companies with 500K+ users
        choices: [
          {
            text: "Invest heavily in localization and compliance",
            effects: {
              company: {
                cash: -15000000,
                users: 200000,
                valuation: 30000000,
              },
            },
          },
          {
            text: "Scale back to focus on most promising markets",
            effects: {
              company: {
                cash: -5000000,
                users: 50000,
                valuation: 10000000,
              },
            },
          },
          {
            text: "Partner with local companies in key markets",
            effects: {
              company: {
                cash: -8000000,
                users: 100000,
                equity: { player: -0.05 },
              },
            },
          },
        ],
      },
    ];

    // Risk/reward events
    this.eventPool.risk_reward = [
      {
        id: "risky_feature",
        title: "Risky Feature Development",
        description:
          "Your team has proposed a high-risk, high-reward feature that could differentiate your product but might delay other priorities.",
        type: "risk_reward",
        choices: [
          {
            text: "Go all-in on the risky feature",
            effects: {
              company: { cash: -30000, productQuality: 0.2, teamMorale: -0.1 },
            },
          },
          {
            text: "Develop a scaled-down version",
            effects: {
              company: { cash: -15000, productQuality: 0.1 },
            },
          },
          {
            text: "Stick to the original roadmap",
            effects: {
              company: { teamMorale: 0.05 },
            },
          },
        ],
      },

      // Events for larger companies
      {
        id: "major_pivot_opportunity",
        title: "Major Pivot Opportunity",
        description:
          "Market analysis suggests a significant opportunity to pivot your business model to capture a much larger market, but it would require substantial changes.",
        type: "risk_reward",
        minValuation: 100000000, // Only for companies valued at $100M+
        choices: [
          {
            text: "Commit to the pivot with full resources",
            effects: {
              company: {
                cash: -30000000,
                users: -100000,
                churnRate: 0.1,
                valuation: -50000000,
              },
              special: "major_pivot_outcome",
            },
          },
          {
            text: "Test the new model with a separate division",
            effects: {
              company: {
                cash: -10000000,
                teamMorale: -0.1,
              },
            },
          },
          {
            text: "Maintain current course with minor adjustments",
            effects: {
              company: {
                teamMorale: 0.05,
              },
            },
          },
        ],
      },
      {
        id: "ipo_consideration",
        title: "IPO Consideration",
        description:
          "Your board and investors are pushing for an IPO to provide liquidity. The market conditions seem favorable, but going public would bring new pressures and scrutiny.",
        type: "risk_reward",
        minValuation: 500000000, // Only for companies valued at $500M+
        minRevenue: 5000000, // Only for companies with $5M+ monthly revenue
        choices: [
          {
            text: "Begin IPO preparations",
            effects: {
              company: {
                cash: -5000000,
                valuation: 100000000,
                teamMorale: -0.1,
              },
              special: "ipo_preparation",
            },
          },
          {
            text: "Raise one more private funding round instead",
            effects: {
              company: {
                valuation: 50000000,
                equity: { player: -0.1 },
              },
            },
          },
          {
            text: "Delay IPO decision for another year",
            effects: {
              company: {
                teamMorale: -0.05,
                valuation: -20000000,
              },
            },
          },
        ],
      },
    ];

    // Add chain events
    this._addChainEvents();
  }

  /**
   * Select a random event based on weights and eligibility
   * @private
   */
  _selectRandomEvent() {
    const currentTurn = this.game.state.currentTurn;
    const companyIndustry = this.game.company.industry;
    const companyValuation = this.game.company.valuation;
    const companyUsers = this.game.company.users;
    const companyRevenue = this.game.company.revenue;

    // Get eligible categories
    const availableCategories = CONFIG.EVENT_CATEGORIES.filter(
      (cat) => currentTurn >= cat.minTurn
    );

    // Add risk_reward category (if not in CONFIG)
    if (
      !availableCategories.find((cat) => cat.id === "risk_reward") &&
      currentTurn >= 5
    ) {
      availableCategories.push({ id: "risk_reward", weight: 10, minTurn: 5 });
    }

    // Calculate total weight
    const totalWeight = availableCategories.reduce(
      (sum, cat) => sum + cat.weight,
      0
    );

    // Select a category
    let randomWeight = Math.random() * totalWeight;
    let selectedCategory = null;

    for (const category of availableCategories) {
      randomWeight -= category.weight;
      if (randomWeight <= 0) {
        selectedCategory = category.id;
        break;
      }
    }

    if (!selectedCategory || !this.eventPool[selectedCategory]) {
      console.log("No category selected or category has no events");
      return null;
    }

    // Filter events in this category based on eligibility
    const eligibleEvents = this.eventPool[selectedCategory].filter((event) => {
      // Skip chain events, they're only triggered through chains
      if (event.isChainEvent) return false;

      // Check if industry-specific and matches current industry
      if (
        event.requiredIndustry &&
        event.requiredIndustry !== companyIndustry
      ) {
        return false;
      }

      // Check minimum valuation requirement
      if (event.minValuation && companyValuation < event.minValuation) {
        return false;
      }

      // Check maximum valuation requirement (if specified)
      if (event.maxValuation && companyValuation > event.maxValuation) {
        return false;
      }

      // Check minimum users requirement (if specified)
      if (event.minUsers && companyUsers < event.minUsers) {
        return false;
      }

      // Check maximum users requirement (if specified)
      if (event.maxUsers && companyUsers > event.maxUsers) {
        return false;
      }

      // Check minimum revenue requirement (if specified)
      if (event.minRevenue && companyRevenue < event.minRevenue) {
        return false;
      }

      // Check maximum revenue requirement (if specified)
      if (event.maxRevenue && companyRevenue > event.maxRevenue) {
        return false;
      }

      // Check minimum turn requirement
      if (event.minTurn && currentTurn < event.minTurn) {
        return false;
      }

      // Check if we've seen this event before (avoid repeats)
      const hasOccurredBefore = this.game.state.events.some(
        (e) => e.id === event.id
      );
      if (hasOccurredBefore) {
        return false;
      }

      return true;
    });

    if (eligibleEvents.length === 0) {
      console.log(`No eligible events in category ${selectedCategory}`);
      return null;
    }

    // Select a random event from eligible events
    const randomIndex = Math.floor(Math.random() * eligibleEvents.length);
    const selectedEvent = JSON.parse(
      JSON.stringify(eligibleEvents[randomIndex])
    ); // Deep clone to avoid modifying the original

    // Scale the event based on company size
    this._scaleEventForCompanySize(selectedEvent);

    return selectedEvent;
  }

  /**
   * Scale event description and effects based on company size
   * @param {Object} event - The event to scale
   * @private
   */
  _scaleEventForCompanySize(event) {
    const company = this.game.company;

    // Define scaling tiers based on company metrics
    const sizeTier = this._getCompanySizeTier();

    // Scale numeric values in the description
    if (event.description) {
      event.description = this._scaleTextValues(event.description, sizeTier);
    }

    // Scale choice text
    if (event.choices && event.choices.length > 0) {
      event.choices.forEach((choice) => {
        if (choice.text) {
          choice.text = this._scaleTextValues(choice.text, sizeTier);
        }

        // Scale effects
        if (choice.effects) {
          this._scaleEffects(choice.effects, sizeTier);
        }
      });
    }

    return event;
  }

  /**
   * Get the company size tier based on metrics
   * @returns {Object} Size tier with scaling factors
   * @private
   */
  _getCompanySizeTier() {
    const company = this.game.company;

    // Define tiers based on company valuation
    let valuationTier = 1;
    if (company.valuation >= 1000000000) valuationTier = 6; // $1B+
    else if (company.valuation >= 500000000) valuationTier = 5; // $500M+
    else if (company.valuation >= 100000000) valuationTier = 4; // $100M+
    else if (company.valuation >= 50000000) valuationTier = 3; // $50M+
    else if (company.valuation >= 10000000) valuationTier = 2; // $10M+

    // Define tiers based on users
    let usersTier = 1;
    if (company.users >= 10000000) usersTier = 6; // 10M+ users
    else if (company.users >= 1000000) usersTier = 5; // 1M+ users
    else if (company.users >= 100000) usersTier = 4; // 100K+ users
    else if (company.users >= 10000) usersTier = 3; // 10K+ users
    else if (company.users >= 1000) usersTier = 2; // 1K+ users

    // Define tiers based on revenue
    let revenueTier = 1;
    if (company.revenue * 12 >= 100000000)
      revenueTier = 6; // $100M+ annual revenue
    else if (company.revenue * 12 >= 50000000)
      revenueTier = 5; // $50M+ annual revenue
    else if (company.revenue * 12 >= 10000000)
      revenueTier = 4; // $10M+ annual revenue
    else if (company.revenue * 12 >= 1000000)
      revenueTier = 3; // $1M+ annual revenue
    else if (company.revenue * 12 >= 100000) revenueTier = 2; // $100K+ annual revenue

    // Use the highest tier from all metrics
    const tier = Math.max(valuationTier, usersTier, revenueTier);

    // Define scaling factors for each tier
    const scalingFactors = {
      1: {
        // Early startup
        userScale: 1,
        cashScale: 1,
        valuationScale: 1,
        textReplacements: {
          "100 users": "100 users",
          "1,000 users": "1,000 users",
          "small team": "small team",
          "$10,000": "$10,000",
          "$50,000": "$50,000",
          "$100,000": "$100,000",
        },
      },
      2: {
        // Growing startup
        userScale: 10,
        cashScale: 5,
        valuationScale: 3,
        textReplacements: {
          "100 users": "1,000 users",
          "1,000 users": "10,000 users",
          "small team": "growing team",
          "$10,000": "$50,000",
          "$50,000": "$150,000",
          "$100,000": "$300,000",
        },
      },
      3: {
        // Established startup
        userScale: 50,
        cashScale: 10,
        valuationScale: 5,
        textReplacements: {
          "100 users": "5,000 users",
          "1,000 users": "50,000 users",
          "small team": "established team",
          "$10,000": "$100,000",
          "$50,000": "$500,000",
          "$100,000": "$1,000,000",
        },
      },
      4: {
        // Growth company
        userScale: 200,
        cashScale: 20,
        valuationScale: 10,
        textReplacements: {
          "100 users": "20,000 users",
          "1,000 users": "200,000 users",
          "small team": "large organization",
          "$10,000": "$200,000",
          "$50,000": "$1,000,000",
          "$100,000": "$2,000,000",
        },
      },
      5: {
        // Major player
        userScale: 1000,
        cashScale: 50,
        valuationScale: 20,
        textReplacements: {
          "100 users": "100,000 users",
          "1,000 users": "1,000,000 users",
          "small team": "major organization",
          "$10,000": "$500,000",
          "$50,000": "$2,500,000",
          "$100,000": "$5,000,000",
        },
      },
      6: {
        // Industry leader
        userScale: 5000,
        cashScale: 100,
        valuationScale: 50,
        textReplacements: {
          "100 users": "500,000 users",
          "1,000 users": "5,000,000 users",
          "small team": "industry-leading organization",
          "$10,000": "$1,000,000",
          "$50,000": "$5,000,000",
          "$100,000": "$10,000,000",
        },
      },
    };

    return {
      tier,
      ...scalingFactors[tier],
    };
  }

  /**
   * Scale text values in a string based on company size
   * @param {string} text - The text to scale
   * @param {Object} sizeTier - The company size tier with scaling factors
   * @returns {string} Scaled text
   * @private
   */
  _scaleTextValues(text, sizeTier) {
    let scaledText = text;

    // Replace common phrases with scaled versions
    Object.entries(sizeTier.textReplacements).forEach(
      ([original, replacement]) => {
        scaledText = scaledText.replace(new RegExp(original, "g"), replacement);
      }
    );

    return scaledText;
  }

  /**
   * Scale effects based on company size
   * @param {Object} effects - The effects to scale
   * @param {Object} sizeTier - The company size tier with scaling factors
   * @private
   */
  _scaleEffects(effects, sizeTier) {
    // Scale cash effects
    if (effects.company && typeof effects.company.cash === "number") {
      const scaledCash = effects.company.cash * sizeTier.cashScale;
      effects.company.cash = scaledCash;

      console.log(
        `Applied scaled cash effect: ${scaledCash} (original: ${effects.company.cash}, scale: ${sizeTier.cashScale})`
      );
    }

    // Scale user effects
    if (effects.company && typeof effects.company.users === "number") {
      const scaledUsers = effects.company.users * sizeTier.userScale;
      effects.company.users = scaledUsers;

      console.log(
        `Applied scaled users effect: ${scaledUsers} (original: ${effects.company.users}, scale: ${sizeTier.userScale})`
      );
    }

    // Scale valuation effects
    if (effects.company && typeof effects.company.valuation === "number") {
      const scaledValuation =
        effects.company.valuation * sizeTier.valuationScale;
      effects.company.valuation = scaledValuation;

      console.log(
        `Applied scaled valuation effect: ${scaledValuation} (original: ${effects.company.valuation}, scale: ${sizeTier.valuationScale})`
      );
    }

    // Scale team morale effects
    if (effects.company && typeof effects.company.teamMorale === "number") {
      effects.company.teamMorale = Math.max(
        0,
        Math.min(1, effects.company.teamMorale + effects.company.teamMorale)
      );
    }

    // Scale product quality effects
    if (effects.company && typeof effects.company.productQuality === "number") {
      effects.company.productQuality = Math.max(
        0,
        Math.min(
          1,
          effects.company.productQuality + effects.company.productQuality
        )
      );
    }

    // Scale brand effects
    if (effects.company && typeof effects.company.brand === "number") {
      effects.company.marketing.brand = Math.max(
        0,
        Math.min(1, company.marketing.brand + effects.company.brand)
      );
    }

    // Scale churn rate effects
    if (effects.company && typeof effects.company.churnRate === "number") {
      effects.company.churnRate = Math.max(
        0.01,
        Math.min(0.5, company.churnRate + effects.company.churnRate)
      );
    }

    return effects;
  }

  /**
   * Check for pending chain events that should trigger this turn
   * @param {number} currentTurn - The current game turn
   * @param {Array} generatedEvents - Array to add events to
   * @private
   */
  _checkPendingChainEvents(currentTurn, generatedEvents) {
    // Filter for chain events scheduled for this turn
    const readyChainEvents = this.pendingChainEvents.filter(
      (chain) => chain.triggerTurn === currentTurn
    );

    // Remove them from the pending list
    this.pendingChainEvents = this.pendingChainEvents.filter(
      (chain) => chain.triggerTurn !== currentTurn
    );

    // Process each ready chain event
    for (const chainData of readyChainEvents) {
      // Find the event template
      const chainEvent = this._getChainEventById(chainData.eventId);

      if (chainEvent) {
        // Set the turn and add to generated events
        const eventInstance = JSON.parse(JSON.stringify(chainEvent)); // Deep clone
        eventInstance.turn = currentTurn;
        generatedEvents.push(eventInstance);

        console.log("Chain event triggered:", eventInstance);
      }
    }

    return generatedEvents;
  }

  /**
   * Check if a choice should trigger a chain event
   * @param {Object} event - The current event
   * @param {number} choiceIndex - The index of the chosen option
   * @private
   */
  _checkForChainEvent(event, choiceIndex) {
    const choice = event.choices[choiceIndex];

    if (choice.chainEvent) {
      const chainData = choice.chainEvent;
      const roll = Math.random();

      // Check if the chain event should trigger based on probability
      if (roll <= chainData.probability) {
        const triggerTurn = this.game.state.currentTurn + chainData.delay;

        // Schedule the chain event
        this.pendingChainEvents.push({
          eventId: chainData.eventId,
          triggerTurn: triggerTurn,
          parentEventId: event.id,
          parentChoiceIndex: choiceIndex,
        });

        console.log(
          `Chain event ${chainData.eventId} scheduled for turn ${triggerTurn}`
        );
      }
    }
  }

  /**
   * Get a chain event by ID
   * @param {string} eventId - The ID of the chain event
   * @returns {Object} The chain event object
   * @private
   */
  _getChainEventById(eventId) {
    return this.eventPool.chain.find((event) => event.id === eventId);
  }

  /**
   * Apply effects from an event
   * @param {Object} effects - Event effects to apply
   * @private
   */
  _applyEventEffects(effects) {
    // Get company size tier for scaling
    const sizeTier = this._getCompanySizeTier();

    // Apply effects to company
    if (effects.company) {
      const company = this.game.company;

      // Cash effects
      if (typeof effects.company.cash === "number") {
        // Scale cash effects based on company size
        const scaledCash = effects.company.cash * sizeTier.cashScale;
        company.cash += scaledCash;

        // Log the scaled effect
        console.log(
          `Applied scaled cash effect: ${scaledCash} (original: ${effects.company.cash}, scale: ${sizeTier.cashScale})`
        );
      }

      // User effects
      if (typeof effects.company.users === "number") {
        // Scale user effects based on company size
        const scaledUsers = effects.company.users * sizeTier.userScale;
        company.users += scaledUsers;

        // Log the scaled effect
        console.log(
          `Applied scaled users effect: ${scaledUsers} (original: ${effects.company.users}, scale: ${sizeTier.userScale})`
        );
      }

      // Valuation effects
      if (typeof effects.company.valuation === "number") {
        // Scale valuation effects based on company size
        const scaledValuation =
          effects.company.valuation * sizeTier.valuationScale;
        company.valuation += scaledValuation;

        // Log the scaled effect
        console.log(
          `Applied scaled valuation effect: ${scaledValuation} (original: ${effects.company.valuation}, scale: ${sizeTier.valuationScale})`
        );
      }

      // Revenue effects
      if (typeof effects.company.revenue === "number") {
        // Scale revenue effects based on company size
        const scaledRevenue = effects.company.revenue * sizeTier.cashScale;
        company.revenue += scaledRevenue;
      }

      // Apply multiplier effects
      if (effects.company.cashMultiplier) {
        company.cash *= effects.company.cashMultiplier;
      }

      if (effects.company.valuationMultiplier) {
        company.valuation *= effects.company.valuationMultiplier;
      }

      if (effects.company.usersMultiplier) {
        company.users *= effects.company.usersMultiplier;
      }

      if (effects.company.revenueMultiplier) {
        company.revenue *= effects.company.revenueMultiplier;
      }

      // Team morale effects
      if (typeof effects.company.teamMorale === "number") {
        company.team.morale = Math.max(
          0,
          Math.min(1, company.team.morale + effects.company.teamMorale)
        );
      }

      // Product quality effects
      if (typeof effects.company.productQuality === "number") {
        company.product.quality = Math.max(
          0,
          Math.min(1, company.product.quality + effects.company.productQuality)
        );
      }

      // Brand effects
      if (typeof effects.company.brand === "number") {
        company.marketing.brand = Math.max(
          0,
          Math.min(1, company.marketing.brand + effects.company.brand)
        );
      }

      // Churn rate effects
      if (typeof effects.company.churnRate === "number") {
        company.churnRate = Math.max(
          0.01,
          Math.min(0.5, company.churnRate + effects.company.churnRate)
        );
      }

      // Handle equity adjustments
      if (effects.company.equity) {
        if (effects.company.equity.player) {
          company.equity.player += effects.company.equity.player;
        }
      }
    }

    // Apply effects to market
    if (effects.market) {
      const market = this.game.market;

      if (effects.market.fundingAvailability) {
        market.fundingAvailability += effects.market.fundingAvailability;
        market.fundingAvailability = Math.max(
          0.1,
          Math.min(2, market.fundingAvailability)
        );
      }

      if (effects.market.growthRate) {
        market.growthRate += effects.market.growthRate;
        market.growthRate = Math.max(-0.1, Math.min(0.5, market.growthRate));
      }

      if (effects.market.competitorActivity) {
        market.competitorActivity += effects.market.competitorActivity;
        market.competitorActivity = Math.max(
          0.5,
          Math.min(2, market.competitorActivity)
        );
      }
    }

    // Apply special effects
    if (effects.special) {
      // Handle feature unlock
      if (effects.special === "unlock_feature") {
        const featureId = effects.featureId || "premium_feature";
        this.game.company.product.features.push({
          id: featureId,
          name: effects.featureName || "Premium Feature",
          development: 1.0, // Fully developed
          quality: 0.8,
        });

        this.game.addNotification(
          `New feature unlocked: ${effects.featureName || "Premium Feature"}`,
          "success"
        );
      }

      // Handle competitor acquisition
      else if (effects.special === "competitor_acquisition") {
        const competitorIndex = this.game.market.competitors.findIndex(
          (c) => c.id === effects.competitorId
        );

        if (competitorIndex >= 0) {
          const competitor = this.game.market.competitors[competitorIndex];
          this.game.market.competitors.splice(competitorIndex, 1);

          // Transfer some users from the acquired competitor
          const transferredUsers = Math.floor(competitor.users * 0.4);
          this.game.company.users += transferredUsers;

          this.game.addNotification(
            `Competitor ${competitor.name} was acquired by ${
              effects.acquirerName || "a major player"
            }. You gained ${transferredUsers.toLocaleString()} users.`,
            "success"
          );
        }
      }

      // Handle emergency funding
      else if (effects.special === "emergency_funding") {
        // Scale emergency funding based on company size
        const baseInvestmentAmount = this.game.company.valuation * 0.2;
        const scaledInvestmentAmount =
          baseInvestmentAmount * sizeTier.cashScale;
        const equityGiven =
          0.25 * Math.max(0.5, 1 - (sizeTier.tier - 1) * 0.05); // Reduce equity as company grows

        this.game.company.cash += scaledInvestmentAmount;
        this.game.company.equity.player -= equityGiven;
        this.game.company.equity.investors["Rescue Capital"] = equityGiven;

        this.game.addNotification(
          `Emergency funding secured: $${Math.round(
            scaledInvestmentAmount
          ).toLocaleString()} for ${(equityGiven * 100).toFixed(1)}% equity`,
          "neutral"
        );
      }

      // Handle regulatory appeal
      else if (effects.special === "regulatory_appeal") {
        // Scale legal fees and fines based on company size
        const baseLegalFees = 50000;
        const baseFinePenalty = 800000;
        const baseValuationHit = 1500000;

        const scaledLegalFees = baseLegalFees * sizeTier.cashScale;
        const scaledFinePenalty = baseFinePenalty * sizeTier.cashScale;
        const scaledValuationHit = baseValuationHit * sizeTier.valuationScale;

        // Only 20% chance of winning appeal
        if (Math.random() < 0.2) {
          this.game.company.cash -= scaledLegalFees; // Legal fees

          this.game.addNotification(
            `You won the regulatory appeal! Case dismissed with minimal fines of $${Math.round(
              scaledLegalFees
            ).toLocaleString()}.`,
            "success"
          );
        } else {
          this.game.company.cash -= scaledFinePenalty; // Massive fine
          this.game.company.valuation -= scaledValuationHit; // Major valuation hit

          this.game.addNotification(
            `Appeal failed. Court imposed maximum penalties of $${Math.round(
              scaledFinePenalty
            ).toLocaleString()} and restrictions, reducing your valuation by $${Math.round(
              scaledValuationHit
            ).toLocaleString()}.`,
            "negative"
          );
        }
      }

      // Add more special effects as needed
    }
  }

  /**
   * Add chain events to the event pool
   * @private
   */
  _addChainEvents() {
    // Chain events are only triggered through other events
    this.eventPool.chain = [
      {
        id: "team_morale_crisis",
        title: "Team Morale Crisis",
        description:
          "Recent decisions have led to a significant drop in team morale. Several key employees are considering leaving.",
        type: "negative",
        isChainEvent: true,
        choices: [
          {
            text: "Hold team building retreat",
            effects: {
              company: { cash: -20000, teamMorale: 0.3 },
            },
          },
          {
            text: "One-on-one meetings with key team members",
            effects: {
              company: { teamMorale: 0.2 },
            },
          },
          {
            text: "Offer salary increases",
            effects: {
              company: { cash: -50000, teamMorale: 0.25 },
            },
          },
        ],
      },
      {
        id: "major_pivot_outcome",
        title: "Pivot Results",
        description:
          "Your major business pivot is showing initial results. The transition has been challenging but there are promising signs.",
        type: "neutral",
        isChainEvent: true,
        choices: [
          {
            text: "Double down on the new direction",
            effects: {
              company: {
                cash: -10000000,
                users: 200000,
                valuation: 100000000,
                productQuality: 0.2,
              },
            },
          },
          {
            text: "Make adjustments based on early feedback",
            effects: {
              company: {
                cash: -5000000,
                users: 100000,
                valuation: 50000000,
                productQuality: 0.1,
              },
            },
          },
          {
            text: "Revert to original business model",
            effects: {
              company: {
                users: 50000,
                valuation: -20000000,
                teamMorale: -0.2,
              },
            },
          },
        ],
      },
      {
        id: "ipo_preparation",
        title: "IPO Preparation",
        description:
          "Your board and investors are pushing for an IPO to provide liquidity. The market conditions seem favorable, but going public would bring new pressures and scrutiny.",
        type: "risk_reward",
        minValuation: 500000000, // Only for companies valued at $500M+
        minRevenue: 5000000, // Only for companies with $5M+ monthly revenue
        choices: [
          {
            text: "Begin IPO preparations",
            effects: {
              company: {
                cash: -5000000,
                valuation: 100000000,
                teamMorale: -0.1,
              },
              special: "ipo_preparation",
            },
          },
          {
            text: "Raise one more private funding round instead",
            effects: {
              company: {
                valuation: 50000000,
                equity: { player: -0.1 },
              },
            },
          },
          {
            text: "Delay IPO decision for another year",
            effects: {
              company: {
                teamMorale: -0.05,
                valuation: -20000000,
              },
            },
          },
        ],
      },
      {
        id: "regulatory_battle",
        title: "Regulatory Battle Outcome",
        description:
          "After months of legal challenges, the regulatory situation has reached a critical point. Your legal team has presented the likely outcomes.",
        type: "negative",
        isChainEvent: true,
        choices: [
          {
            text: "Settle and implement required changes",
            effects: {
              company: {
                cash: -50000000,
                valuation: -100000000,
                users: -200000,
              },
            },
          },
          {
            text: "Continue legal fight to the highest court",
            effects: {
              company: {
                cash: -100000000,
                valuation: -200000000,
                teamMorale: -0.2,
              },
              special: "regulatory_final_outcome",
            },
          },
          {
            text: "Restructure company to address concerns",
            effects: {
              company: {
                cash: -30000000,
                valuation: -50000000,
                productQuality: -0.1,
                users: -100000,
              },
            },
          },
        ],
      },
      {
        id: "acquisition_opportunity",
        title: "Acquisition Target Found",
        description:
          "Your team has identified a promising smaller competitor that would complement your business well. They seem open to acquisition talks.",
        type: "opportunity",
        isChainEvent: true,
        choices: [
          {
            text: "Make aggressive acquisition offer",
            effects: {
              company: {
                cash: -30000000,
                users: 100000,
                valuation: 50000000,
                productQuality: 0.1,
              },
            },
          },
          {
            text: "Propose merger of equals",
            effects: {
              company: {
                cash: -10000000,
                users: 50000,
                valuation: 20000000,
                equity: { player: -0.1 },
              },
            },
          },
          {
            text: "Decline and focus on organic growth",
            effects: {
              company: {
                valuation: -5000000,
              },
            },
          },
        ],
      },
    ];
  }
}
