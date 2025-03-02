/**
 * Startup Tycoon - Turn Manager
 * Controls turn progression and orchestrates updates to all game systems
 */

class TurnManager {
  constructor(game) {
    this.game = game;
    this.turnPhase = "player_decision"; // Current phase within a turn
    this.maxTurns = CONFIG.MAX_TURNS;
    this.phaseHandlers = {
      player_decision: this._handlePlayerDecisionPhase.bind(this),
      ai_decision: this._handleAIDecisionPhase.bind(this),
      market_events: this._handleMarketEventsPhase.bind(this),
      turn_resolution: this._handleTurnResolutionPhase.bind(this),
    };

    // Track previous turn data for calculating deltas
    this.previousTurnData = {
      cash: 0,
      revenue: 0,
      valuation: 0,
      users: 0,
    };
  }

  /**
   * Advance to the next turn
   */
  advanceTurn() {
    console.log("Advancing turn...");

    // Store data before processing turn to calculate accurate deltas
    const company = this.game.company;
    this.previousTurnData = {
      cash: company.cash,
      revenue: company.revenue,
      valuation: company.valuation,
      users: company.users,
    };

    // Reset turn phase to start a new turn sequence
    this.turnPhase = "player_decision";

    // Process all phases in sequence
    this._processPhases();

    return this;
  }

  /**
   * Get the current turn number
   */
  getCurrentTurn() {
    return this.game.state.currentTurn;
  }

  /**
   * Process all phases in sequence
   * @private
   */
  _processPhases() {
    // Start with player decisions phase which was already done by the player
    this._progressToNextPhase(); // Move to AI decision phase

    // Process AI decision phase
    this.phaseHandlers[this.turnPhase]();
    this._progressToNextPhase(); // Move to market events phase

    // Process market events phase
    this.phaseHandlers[this.turnPhase]();
    this._progressToNextPhase(); // Move to turn resolution phase

    // Process turn resolution phase
    this.phaseHandlers[this.turnPhase]();

    // Prepare turn summary for the CURRENT turn that just completed
    const turnSummary = this._prepareTurnSummary();

    // Store turn summary in game state
    this.game.state.lastTurnSummary = turnSummary;

    // Show turn summary in UI
    this.game.uiManager.showTurnSummary(turnSummary);

    // Increment turn counter AFTER all phases are complete AND summary is shown
    this.game.state.currentTurn++;

    // Update dynamic difficulty based on player performance
    this.game._updateDynamicDifficulty();

    // Check if we've reached the maximum number of turns
    if (this.game.state.currentTurn > this.maxTurns) {
      this.game.gameOver("max_turns_reached");
      return;
    }

    // Reset phase for the next turn
    this.turnPhase = "player_decision";

    // Update the UI to reflect the new turn
    this.game.uiManager.updateUI();
  }

  /**
   * Progress to the next phase in the turn sequence
   * @private
   */
  _progressToNextPhase() {
    const phases = [
      "player_decision",
      "ai_decision",
      "market_events",
      "turn_resolution",
    ];
    const currentIndex = phases.indexOf(this.turnPhase);

    if (currentIndex === -1) {
      console.error("Invalid turn phase:", this.turnPhase);
      this.turnPhase = "player_decision";
      return;
    }

    const nextIndex = (currentIndex + 1) % phases.length;
    this.turnPhase = phases[nextIndex];

    console.log("Turn phase changed to:", this.turnPhase);
  }

  /**
   * Handle the player decision phase
   * This phase is mostly handled by the UI/player, but we can do any necessary setup here
   * @private
   */
  _handlePlayerDecisionPhase() {
    console.log("Player decision phase...");
    // This is mostly handled by the UI, but we can do any necessary setup here

    // Nothing to do automatically here, as the player makes decisions through the UI

    return true;
  }

  /**
   * Handle the AI decision phase
   * Process decisions for all AI competitors
   * @private
   */
  _handleAIDecisionPhase() {
    console.log("AI decision phase...");

    // Update all AI competitors
    if (this.game.competitors && this.game.competitors.length > 0) {
      for (const competitor of this.game.competitors) {
        competitor.makeTurnDecisions();
      }
    }

    return true;
  }

  /**
   * Handle the market events phase
   * Process random events, market shifts, etc.
   * @private
   */
  _handleMarketEventsPhase() {
    console.log("Market events phase...");

    // Update market conditions
    this.game.market.update();

    // Generate and process events
    const events = this.game.eventSystem.generateEvents();

    if (events && events.length > 0) {
      for (const event of events) {
        this._processEvent(event);
      }
    }

    return true;
  }

  /**
   * Handle the turn resolution phase
   * Update player company and game state
   * @private
   */
  _handleTurnResolutionPhase() {
    console.log("Turn resolution phase...");

    // Update player company
    this.game.company.update();

    // Update all AI competitors
    if (this.game.competitors && this.game.competitors.length > 0) {
      for (const competitor of this.game.competitors) {
        competitor.update();
      }
    }

    // No longer preparing turn summary here - moved to _processPhases
    return true;
  }

  /**
   * Process a game event
   * @param {Object} event - The event to process
   * @private
   */
  _processEvent(event) {
    console.log("Processing event:", event);

    // Add event to game state
    this.game.state.events.push(event);

    // Apply immediate effects
    if (event.effects) {
      this._applyEventEffects(event.effects);
    }

    // If event requires player choice, show it in UI
    if (event.choices && event.choices.length > 0) {
      this.game.uiManager.showEventModal(event);
    } else {
      // If no choices, just show a notification
      this.game.addNotification(event.description, "event");
    }
  }

  /**
   * Apply effects from an event
   * @param {Object} effects - Event effects to apply
   * @private
   */
  _applyEventEffects(effects) {
    // Apply effects to player company
    if (effects.company) {
      const company = this.game.company;

      // Apply numeric adjustments
      if (effects.company.cash) company.cash += effects.company.cash;
      if (effects.company.valuation)
        company.valuation += effects.company.valuation;
      if (effects.company.users) company.users += effects.company.users;
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
  }

  /**
   * Prepare a summary of the turn's changes
   * @returns {Object} Summary of the turn
   * @private
   */
  _prepareTurnSummary() {
    const company = this.game.company;
    const market = this.game.market;
    const currentTurn = this.game.state.currentTurn;

    // Use the stored previous turn data
    const previousRevenue = this.previousTurnData.revenue;
    const previousValuation = this.previousTurnData.valuation;
    const previousUsers = this.previousTurnData.users;
    const previousCash = this.previousTurnData.cash;

    // Get the events for this turn
    const turnEvents = this.game.state.events.filter(
      (e) => e.turn === currentTurn
    );

    // Calculate changes
    const revenueDelta = company.revenue - previousRevenue;
    const valuationDelta = company.valuation - previousValuation;
    const usersDelta = company.users - previousUsers;
    const cashDelta = company.cash - previousCash;

    // Prepare the summary object
    const summary = {
      turn: currentTurn,
      company: {
        cash: company.cash,
        cashDelta: cashDelta,
        revenue: company.revenue,
        revenueDelta: revenueDelta,
        valuation: company.valuation,
        valuationDelta: valuationDelta,
        users: company.users,
        usersDelta: usersDelta,
        runway: company.runway,
        burnRate: company.burnRate,
      },
      market: {
        growthRate: market.growthRate,
        fundingAvailability: market.fundingAvailability,
        valuationMultiplier: market.valuationMultiplier,
      },
      events: turnEvents,
      competitors: this.game.competitors.map((competitor) => ({
        name: competitor.name,
        valuation: competitor.valuation,
        users: competitor.users,
        productQuality: competitor.product.quality,
      })),
    };

    // Add features completed this turn
    summary.completedFeatures = company.product.features.filter(
      (feature) => feature.completedAt === currentTurn
    );

    return summary;
  }
}
