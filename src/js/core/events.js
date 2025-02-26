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
            text: "Stay the course and weather the storm",
            effects: {
              company: { cashMultiplier: 0.9 },
            },
          },
        ],
      },
      {
        id: "interest_rate_hike",
        title: "Interest Rate Hike",
        description:
          "The central bank has increased interest rates significantly, affecting startup funding.",
        type: "negative",
        choices: [
          {
            text: "Focus on profitability to reduce reliance on funding",
            effects: {
              company: { users: -100, revenue: 5000 },
            },
          },
          {
            text: "Accelerate growth to secure funding before conditions worsen",
            effects: {
              company: { cash: -50000, users: 500 },
            },
            chainEvent: {
              eventId: "desperate_for_funding",
              delay: 3,
              probability: 0.8,
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
          "A new well-funded competitor has entered the market with a similar product.",
        type: "neutral",
        choices: [
          {
            text: "Increase marketing to maintain market share",
            effects: {
              company: { cash: -50000, users: 200 },
            },
          },
          {
            text: "Accelerate product development to stay ahead",
            effects: {
              company: { productQuality: 0.1 },
            },
          },
          {
            text: "Ignore them and stick to your strategy",
            effects: {
              company: { users: -50 },
            },
            chainEvent: {
              eventId: "competitor_stealing_users",
              delay: 2,
              probability: 0.6,
            },
          },
        ],
      },
      {
        id: "competitor_acquires",
        title: "Competitor Acquisition",
        description:
          "One of your competitors has been acquired by a major company, gaining significant resources.",
        type: "negative",
        choices: [
          {
            text: "Focus on differentiating your product",
            effects: {
              company: { productQuality: 0.15, cash: -20000 },
            },
          },
          {
            text: "Approach the acquirer about potential partnerships",
            effects: {
              company: { valuation: 100000 },
            },
            chainEvent: {
              eventId: "partnership_opportunity",
              delay: 2,
              probability: 0.5,
            },
          },
        ],
      },

      // Add industry-specific competitor event for fintech
      {
        id: "fintech_regulation_change",
        title: "New Fintech Regulations",
        description:
          "Regulatory bodies have announced stricter compliance requirements for fintech companies.",
        type: "negative",
        requiredIndustry: "fintech",
        choices: [
          {
            text: "Invest in compliance infrastructure",
            effects: {
              company: { cash: -100000, productQuality: 0.1 },
            },
          },
          {
            text: "Lobby against the regulations with other startups",
            effects: {
              company: { cash: -30000 },
            },
            chainEvent: {
              eventId: "lobby_outcome",
              delay: 3,
              probability: 0.7,
            },
          },
          {
            text: "Ignore and hope for lax enforcement",
            effects: {
              company: {}, // No immediate effect
            },
            chainEvent: {
              eventId: "regulatory_crackdown",
              delay: 4,
              probability: 0.8,
            },
          },
        ],
      },

      // Add industry-specific competitor event for saas
      {
        id: "saas_platform_change",
        title: "Major Platform API Changes",
        description:
          "A major platform your SaaS product integrates with has announced significant API changes.",
        type: "negative",
        requiredIndustry: "saas",
        choices: [
          {
            text: "Prioritize updating integrations immediately",
            effects: {
              company: { cash: -50000, productQuality: 0.05 },
            },
          },
          {
            text: "Delay updates and focus on other features",
            effects: {
              company: {}, // No immediate effect
            },
            chainEvent: {
              eventId: "integration_broken",
              delay: 2,
              probability: 0.7,
            },
          },
        ],
      },

      // Add industry-specific competitor event for ecommerce
      {
        id: "ecommerce_logistics_disruption",
        title: "Logistics Network Disruption",
        description:
          "A major shipping carrier your e-commerce business relies on is experiencing nationwide delays.",
        type: "negative",
        requiredIndustry: "ecommerce",
        choices: [
          {
            text: "Switch to alternative, more expensive shipping options",
            effects: {
              company: { cash: -40000, churnRate: -0.01 },
            },
          },
          {
            text: "Wait it out and notify customers of potential delays",
            effects: {
              company: { churnRate: 0.03 },
            },
            chainEvent: {
              eventId: "customer_complaints",
              delay: 1,
              probability: 0.8,
            },
          },
        ],
      },

      // Add industry-specific competitor event for social
      {
        id: "social_platform_algorithm_change",
        title: "Social Algorithm Update",
        description:
          "A major social platform has changed its algorithm, affecting how content from your app is distributed.",
        type: "negative",
        requiredIndustry: "social",
        choices: [
          {
            text: "Adapt content strategy to the new algorithm",
            effects: {
              company: { cash: -30000, users: -100 },
            },
            chainEvent: {
              eventId: "algorithm_mastery",
              delay: 3,
              probability: 0.6,
            },
          },
          {
            text: "Focus on direct user engagement to reduce platform dependency",
            effects: {
              company: { users: -300, churnRate: -0.02 },
            },
          },
        ],
      },
    ];

    // Chain events (only triggered as follow-ups to other events)
    this.eventPool.chain = [
      {
        id: "team_morale_crisis",
        title: "Team Morale Crisis",
        description:
          "After recent cost-cutting measures, team morale has hit a critical low point. Several employees are considering leaving.",
        type: "negative",
        isChainEvent: true,
        choices: [
          {
            text: "Hold team building activities and improve work environment",
            effects: {
              company: { cash: -20000, teamMorale: 0.3 },
            },
          },
          {
            text: "Offer small bonuses to key team members",
            effects: {
              company: { cash: -30000, teamMorale: 0.2 },
            },
          },
          {
            text: "Let them go and hire new talent",
            effects: {
              company: { cash: -50000, productQuality: -0.1, teamMorale: 0.1 },
            },
          },
        ],
      },
      {
        id: "desperate_for_funding",
        title: "Cash Crunch",
        description:
          "Your aggressive growth strategy has depleted cash reserves faster than expected. The company urgently needs funding.",
        type: "negative",
        isChainEvent: true,
        choices: [
          {
            text: "Take a high-interest emergency loan",
            effects: {
              company: { cash: 200000, burnRate: 5000 },
            },
          },
          {
            text: "Offer significant equity at a discount to investors",
            effects: {
              special: "emergency_funding",
            },
          },
          {
            text: "Dramatically cut costs and staff",
            effects: {
              company: { burnRate: -10000, productQuality: -0.2, users: -500 },
            },
          },
        ],
      },
      {
        id: "competitor_stealing_users",
        title: "Market Share Decline",
        description:
          "The competitor you ignored has been rapidly stealing your users with an aggressive marketing campaign.",
        type: "negative",
        isChainEvent: true,
        choices: [
          {
            text: "Launch a counter-marketing campaign",
            effects: {
              company: { cash: -100000, users: 200, churnRate: -0.02 },
            },
          },
          {
            text: "Add unique features to differentiate your product",
            effects: {
              company: { cash: -50000, productQuality: 0.2 },
            },
          },
          {
            text: "Reduce prices to retain users",
            effects: {
              company: { revenue: -3000, users: 100, churnRate: -0.01 },
            },
          },
        ],
      },
      {
        id: "partnership_opportunity",
        title: "Partnership Proposal",
        description:
          "The company that acquired your competitor has reached out with a partnership offer that could expand your reach.",
        type: "positive",
        isChainEvent: true,
        choices: [
          {
            text: "Accept the partnership on their terms",
            effects: {
              company: {
                users: 1000,
                valuation: 200000,
                equity: { player: -0.05 },
              },
            },
          },
          {
            text: "Negotiate for better terms",
            effects: {
              company: { users: 500 },
            },
            chainEvent: {
              eventId: "partnership_negotiation",
              delay: 2,
              probability: 1.0,
            },
          },
          {
            text: "Reject the offer to maintain independence",
            effects: {
              company: { teamMorale: 0.1 },
            },
          },
        ],
      },
      {
        id: "partnership_negotiation",
        title: "Partnership Negotiation Results",
        description:
          "After tough negotiations, the partner has come back with a revised offer.",
        type: "neutral",
        isChainEvent: true,
        choices: [
          {
            text: "Accept the improved offer",
            effects: {
              company: {
                users: 800,
                valuation: 300000,
                equity: { player: -0.03 },
              },
            },
          },
          {
            text: "Walk away from the deal",
            effects: {
              company: { teamMorale: 0.1, valuation: -100000 },
            },
          },
        ],
      },
      {
        id: "lobby_outcome",
        title: "Regulatory Lobbying Outcome",
        description:
          "Your lobbying efforts against the new fintech regulations have produced results.",
        type: "positive",
        requiredIndustry: "fintech",
        isChainEvent: true,
        choices: [
          {
            text: "Capitalize on the relaxed regulations",
            effects: {
              company: { users: 500, revenue: 10000 },
            },
          },
          {
            text: "Still implement some compliance measures as a precaution",
            effects: {
              company: { cash: -50000, productQuality: 0.05 },
            },
          },
        ],
      },
      {
        id: "regulatory_crackdown",
        title: "Regulatory Crackdown",
        description:
          "Regulators have noticed your non-compliance with the new fintech regulations and issued hefty fines.",
        type: "negative",
        requiredIndustry: "fintech",
        isChainEvent: true,
        choices: [
          {
            text: "Pay the fines and quickly implement compliance",
            effects: {
              company: { cash: -200000, productQuality: 0.05 },
            },
          },
          {
            text: "Fight the fines in court",
            effects: {
              company: { cash: -50000 },
            },
            chainEvent: {
              eventId: "court_outcome",
              delay: 3,
              probability: 1.0,
            },
          },
        ],
      },
      {
        id: "integration_broken",
        title: "Integration Breakdown",
        description:
          "Your delay in updating has resulted in broken integrations, causing major issues for customers.",
        type: "negative",
        requiredIndustry: "saas",
        isChainEvent: true,
        choices: [
          {
            text: "Rush emergency fix with all hands on deck",
            effects: {
              company: { cash: -80000, productQuality: -0.1, teamMorale: -0.2 },
            },
          },
          {
            text: "Apologize to customers and provide timeline for fix",
            effects: {
              company: { users: -300, churnRate: 0.05 },
            },
          },
        ],
      },
      {
        id: "customer_complaints",
        title: "Shipping Complaint Wave",
        description:
          "Your customers are flooding social media with complaints about shipping delays.",
        type: "negative",
        requiredIndustry: "ecommerce",
        isChainEvent: true,
        choices: [
          {
            text: "Offer refunds or discounts to affected customers",
            effects: {
              company: { cash: -60000, churnRate: -0.03 },
            },
          },
          {
            text: "Hire a PR team to manage the crisis",
            effects: {
              company: { cash: -40000, churnRate: -0.01 },
            },
          },
        ],
      },
      {
        id: "algorithm_mastery",
        title: "Algorithm Breakthrough",
        description:
          "Your team has cracked the new social platform algorithm, allowing for greater visibility.",
        type: "positive",
        requiredIndustry: "social",
        isChainEvent: true,
        choices: [
          {
            text: "Maximize user acquisition with the new insights",
            effects: {
              company: { users: 2000, marketing: { brand: 0.2 } },
            },
          },
          {
            text: "Share insights with select partners for mutual benefit",
            effects: {
              company: { users: 1000, valuation: 200000 },
            },
          },
        ],
      },
    ];

    // Risk/Reward events (high stakes decisions)
    this.eventPool.risk_reward = [
      {
        id: "venture_capital_gambit",
        title: "High-Stakes VC Meeting",
        description:
          "A prestigious VC firm is impressed by your startup and offers a meeting, but they're known for tough negotiations and high expectations.",
        type: "opportunity",
        minValuation: 2000000, // Only occurs if company valuation is at least $2M
        choices: [
          {
            text: "Prepare extensively and aim for a conservative valuation",
            effects: {
              company: { cash: -20000 }, // Cost of preparation
              special: "vc_meeting_conservative",
            },
          },
          {
            text: "Pitch an ambitious vision with higher valuation",
            effects: {
              special: "vc_meeting_ambitious",
            },
          },
        ],
      },
      {
        id: "acquisition_rumor",
        title: "Acquisition Rumor",
        description:
          "There's a rumor that a major player in your industry is looking to acquire a company like yours. You could reach out, but it might distract from operations.",
        type: "opportunity",
        minValuation: 5000000, // Only for more established startups
        choices: [
          {
            text: "Actively pursue the acquisition possibility",
            effects: {
              company: { productQuality: -0.1, teamMorale: -0.1 },
              special: "pursue_acquisition",
            },
          },
          {
            text: "Focus on growth to attract better offers later",
            effects: {
              company: { productQuality: 0.1, teamMorale: 0.1 },
            },
          },
        ],
      },
      {
        id: "moonshot_project",
        title: "Moonshot Project Opportunity",
        description:
          "Your team has an idea for a revolutionary feature that could transform your industry, but it would require significant resources.",
        type: "opportunity",
        minTurn: 10, // Only appear after turn 10
        choices: [
          {
            text: "Go all-in on the moonshot project",
            effects: {
              company: { cash: -200000, productQuality: -0.1 }, // Initially hurts product as resources are diverted
            },
            chainEvent: {
              eventId: "moonshot_outcome",
              delay: 4,
              probability: 1.0,
            },
          },
          {
            text: "Take a measured approach, developing it alongside existing products",
            effects: {
              company: { cash: -100000 },
            },
            chainEvent: {
              eventId: "moonshot_partial",
              delay: 6,
              probability: 1.0,
            },
          },
          {
            text: "Pass on the high-risk project",
            effects: {
              company: { teamMorale: -0.1 },
            },
          },
        ],
      },
      {
        id: "questionable_growth_tactic",
        title: "Growth at Any Cost?",
        description:
          "Your marketing team proposes a legally questionable but highly effective user acquisition tactic used by competitors.",
        type: "opportunity",
        choices: [
          {
            text: "Implement the aggressive tactics",
            effects: {
              company: { users: 3000, churnRate: 0.01 },
            },
            chainEvent: {
              eventId: "tactic_backlash",
              delay: 3,
              probability: 0.7,
            },
          },
          {
            text: "Find a legal alternative, even if less effective",
            effects: {
              company: { users: 1000, marketing: { brand: 0.1 } },
            },
          },
        ],
      },
    ];

    // Special chain events for risk/reward outcomes
    this.eventPool.chain.push(
      {
        id: "moonshot_outcome",
        title: "Moonshot Project Results",
        description:
          "Your team has completed the ambitious moonshot project after tremendous effort.",
        type: "positive",
        isChainEvent: true,
        choices: [
          {
            text: "Release it as a standalone premium product",
            effects: {
              company: {
                revenue: 50000,
                users: 1000,
                valuation: 1000000,
                productQuality: 0.3,
              },
            },
          },
          {
            text: "Integrate it into your core offering for all users",
            effects: {
              company: { users: 5000, valuation: 2000000, productQuality: 0.5 },
            },
          },
        ],
      },
      {
        id: "moonshot_partial",
        title: "Partial Innovation Results",
        description:
          "Your measured approach to the moonshot project has yielded solid but not revolutionary results.",
        type: "positive",
        isChainEvent: true,
        choices: [
          {
            text: "Release as a new feature to existing customers",
            effects: {
              company: {
                revenue: 20000,
                churnRate: -0.03,
                productQuality: 0.2,
              },
            },
          },
          {
            text: "Invest more to complete the full vision",
            effects: {
              company: { cash: -100000 },
            },
            chainEvent: {
              eventId: "moonshot_outcome",
              delay: 3,
              probability: 0.8,
            },
          },
        ],
      },
      {
        id: "tactic_backlash",
        title: "Marketing Tactics Backlash",
        description:
          "Your aggressive growth tactics have been exposed by a tech journalist, leading to public criticism.",
        type: "negative",
        isChainEvent: true,
        choices: [
          {
            text: "Apologize publicly and change practices",
            effects: {
              company: {
                users: -1000,
                churnRate: -0.02,
                marketing: { brand: -0.2 },
              },
            },
          },
          {
            text: "Deny wrongdoing and continue tactics",
            effects: {
              company: {
                users: -500,
                churnRate: 0.05,
                marketing: { brand: -0.3 },
              },
            },
            chainEvent: {
              eventId: "regulatory_investigation",
              delay: 2,
              probability: 0.8,
            },
          },
        ],
      },
      {
        id: "regulatory_investigation",
        title: "Regulatory Investigation",
        description:
          "Following public backlash, regulators have launched an investigation into your marketing practices.",
        type: "negative",
        isChainEvent: true,
        choices: [
          {
            text: "Cooperate fully and settle quickly",
            effects: {
              company: {
                cash: -500000,
                valuation: -1000000,
                marketing: { brand: 0.1 },
              },
            },
          },
          {
            text: "Fight the investigation",
            effects: {
              company: { cash: -200000 },
            },
            chainEvent: {
              eventId: "investigation_outcome",
              delay: 3,
              probability: 1.0,
            },
          },
        ],
      },
      {
        id: "investigation_outcome",
        title: "Investigation Outcome",
        description:
          "The regulatory investigation has concluded after your legal battle.",
        type: "negative",
        isChainEvent: true,
        choices: [
          {
            text: "Accept the ruling and pay the fine",
            effects: {
              company: { cash: -300000, valuation: -800000 },
            },
          },
          {
            text: "Appeal to higher court (high risk)",
            effects: {
              company: { cash: -100000 },
            },
            special: "regulatory_appeal",
          },
        ],
      }
    );

    // Initialize other event categories similarly
    // Add internal events, opportunities, etc.
  }

  /**
   * Select a random event based on weights and eligibility
   * @private
   */
  _selectRandomEvent() {
    const currentTurn = this.game.state.currentTurn;
    const companyIndustry = this.game.company.industry;
    const companyValuation = this.game.company.valuation;

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
    return JSON.parse(JSON.stringify(eligibleEvents[randomIndex])); // Deep clone to avoid modifying the original
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
    // Apply effects to company
    if (effects.company) {
      const company = this.game.company;

      // Apply numeric adjustments
      if (effects.company.cash) company.cash += effects.company.cash;
      if (effects.company.valuation)
        company.valuation += effects.company.valuation;
      if (effects.company.users) company.users += effects.company.users;
      if (effects.company.revenue) company.revenue += effects.company.revenue;
      if (effects.company.churnRate)
        company.churnRate += effects.company.churnRate;

      // Apply multiplier effects
      if (effects.company.cashMultiplier)
        company.cash *= effects.company.cashMultiplier;
      if (effects.company.valuationMultiplier)
        company.valuation *= effects.company.valuationMultiplier;
      if (effects.company.usersMultiplier)
        company.users *= effects.company.usersMultiplier;
      if (effects.company.revenueMultiplier)
        company.revenue *= effects.company.revenueMultiplier;

      // Apply complex effects
      if (effects.company.productQuality) {
        company.product.quality += effects.company.productQuality;
        company.product.quality = Math.max(
          0,
          Math.min(1, company.product.quality)
        );
      }

      if (effects.company.teamMorale) {
        company.team.morale += effects.company.teamMorale;
        company.team.morale = Math.max(0, Math.min(1, company.team.morale));
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

      if (effects.market.growthRate)
        market.growthRate += effects.market.growthRate;
      if (effects.market.valuationMultiplier)
        market.valuationMultiplier += effects.market.valuationMultiplier;
      if (effects.market.fundingAvailability)
        market.fundingAvailability += effects.market.fundingAvailability;

      // Ensure values stay in reasonable ranges
      market.growthRate = Math.max(-0.5, Math.min(1, market.growthRate));
      market.valuationMultiplier = Math.max(0.1, market.valuationMultiplier);
      market.fundingAvailability = Math.max(0.1, market.fundingAvailability);
    }

    // Handle special effects
    if (effects.special) {
      // Handle acquisition exit
      if (effects.special === "acquisition_exit") {
        const company = this.game.company;

        // Calculate acquisition value (typically a premium over current valuation)
        const acquisitionValue = company.valuation * 1.5;

        // Calculate player's share based on equity
        const playerPayout = acquisitionValue * company.equity.player;

        // End the game with acquisition
        this.game.gameOver("acquisition", {
          acquisitionValue: acquisitionValue,
          playerPayout: playerPayout,
        });
      }

      // Handle VC meeting outcomes
      else if (effects.special === "vc_meeting_conservative") {
        // 80% chance of success for conservative approach
        if (Math.random() < 0.8) {
          const investmentAmount = this.game.company.valuation * 0.3;
          const equityGiven = 0.15;

          this.game.company.cash += investmentAmount;
          this.game.company.equity.player -= equityGiven;
          this.game.company.equity.investors["Summit Ventures"] = equityGiven;

          this.game.addNotification(
            `VC investment secured: $${Math.round(
              investmentAmount
            ).toLocaleString()} for ${(equityGiven * 100).toFixed(1)}% equity`,
            "success"
          );
        } else {
          this.game.addNotification(
            "VC passed on investment opportunity despite conservative approach",
            "negative"
          );
        }
      } else if (effects.special === "vc_meeting_ambitious") {
        // 40% chance of success for ambitious approach, but bigger payoff
        if (Math.random() < 0.4) {
          const investmentAmount = this.game.company.valuation * 0.5;
          const equityGiven = 0.18;

          this.game.company.cash += investmentAmount;
          this.game.company.equity.player -= equityGiven;
          this.game.company.equity.investors["Quantum Capital"] = equityGiven;

          this.game.addNotification(
            `Major VC investment secured: $${Math.round(
              investmentAmount
            ).toLocaleString()} for ${(equityGiven * 100).toFixed(1)}% equity`,
            "success"
          );
        } else {
          // Penalty for failed ambitious pitch
          this.game.company.valuation *= 0.9;

          this.game.addNotification(
            "VC rejected ambitious valuation, damaging company reputation",
            "negative"
          );
        }
      }

      // Handle acquisition pursuit
      else if (effects.special === "pursue_acquisition") {
        // 30% chance of immediate interest
        if (Math.random() < 0.3) {
          const acquisitionEvent = {
            id: "acquisition_interest",
            title: "Acquisition Interest",
            type: "opportunity",
            description:
              "Your outreach succeeded! A major company is interested in acquiring your startup.",
            turn: this.game.state.currentTurn,
            choices: [
              {
                text: "Begin formal acquisition talks",
                effects: {
                  special: "acquisition_exit",
                },
              },
              {
                text: "Decline and continue building the company",
                effects: {
                  company: { valuation: this.game.company.valuation * 0.2 }, // Valuation boost from interest
                },
              },
            ],
          };

          // Add the event to game state
          this.game.state.events.push(acquisitionEvent);

          // Show the event to the player
          this.game.uiManager.showEventModal(acquisitionEvent);
        } else {
          this.game.addNotification(
            "Your acquisition outreach didn't generate immediate interest",
            "neutral"
          );
        }
      }

      // Handle emergency funding
      else if (effects.special === "emergency_funding") {
        const investmentAmount = this.game.company.valuation * 0.2;
        const equityGiven = 0.25; // 25% equity, very expensive funding

        this.game.company.cash += investmentAmount;
        this.game.company.equity.player -= equityGiven;
        this.game.company.equity.investors["Rescue Capital"] = equityGiven;

        this.game.addNotification(
          `Emergency funding secured: $${Math.round(
            investmentAmount
          ).toLocaleString()} for ${(equityGiven * 100).toFixed(1)}% equity`,
          "neutral"
        );
      }

      // Handle regulatory appeal
      else if (effects.special === "regulatory_appeal") {
        // Only 20% chance of winning appeal
        if (Math.random() < 0.2) {
          this.game.company.cash -= 50000; // Legal fees

          this.game.addNotification(
            "You won the regulatory appeal! Case dismissed with minimal fines.",
            "success"
          );
        } else {
          this.game.company.cash -= 800000; // Massive fine
          this.game.company.valuation -= 1500000; // Major valuation hit

          this.game.addNotification(
            "Appeal failed. Court imposed maximum penalties and restrictions.",
            "negative"
          );
        }
      }

      // Add more special effects as needed
    }
  }
}
