/**
 * Startup Tycoon - Game Configuration
 * Central place for game constants and configuration
 */

const CONFIG = {
  // Game settings
  GAME_VERSION: "0.1.0",
  SAVE_KEY: "startup_tycoon_save",

  // Economic settings
  STARTING_CASH: 1000000, // $1M seed funding
  STARTING_VALUATION: 1000000, // $1M initial valuation
  BURN_RATE_MULTIPLIER: 1.2, // How quickly you burn cash

  // Turn settings
  TURN_DURATION: "month", // each turn represents a month
  MAX_TURNS: 120, // 10 years (120 months)

  // Team settings
  STARTING_TEAM_SIZE: 2, // founder + 1 employee
  EMPLOYEE_BASE_SALARY: {
    developer: 10000,
    designer: 8000,
    marketer: 7000,
    salesperson: 6000,
    operations: 5000,
  },
  EMPLOYEE_PERFORMANCE_RANGE: [0.7, 1.3], // Performance multiplier range

  // Product settings
  PRODUCT_QUALITY_DECAY: 0.05, // 5% quality decay per turn if not maintained
  FEATURE_COMPLEXITY_LEVELS: {
    simple: { time: 1, cost: 10000, impact: 0.1 },
    medium: { time: 3, cost: 50000, impact: 0.25 },
    complex: { time: 6, cost: 150000, impact: 0.5 },
  },

  // Marketing settings
  MARKETING_CHANNELS: [
    { id: "social", name: "Social Media", efficiency: 0.8, costPerUser: 5 },
    { id: "search", name: "Search Ads", efficiency: 1.0, costPerUser: 8 },
    {
      id: "content",
      name: "Content Marketing",
      efficiency: 0.6,
      costPerUser: 3,
    },
    {
      id: "traditional",
      name: "Traditional Ads",
      efficiency: 0.4,
      costPerUser: 12,
    },
  ],

  // Market settings
  INDUSTRIES: [
    {
      id: "saas",
      name: "SaaS",
      growthRate: 0.12,
      volatility: 0.2,
      competitors: 4,
      userValueRange: [100, 500], // Revenue per user per year
    },
    {
      id: "ecommerce",
      name: "E-Commerce",
      growthRate: 0.08,
      volatility: 0.15,
      competitors: 6,
      userValueRange: [50, 200],
    },
    {
      id: "fintech",
      name: "FinTech",
      growthRate: 0.15,
      volatility: 0.25,
      competitors: 3,
      userValueRange: [200, 800],
    },
    {
      id: "social",
      name: "Social Media",
      growthRate: 0.2,
      volatility: 0.3,
      competitors: 5,
      userValueRange: [10, 50],
    },
  ],

  // AI competitor settings
  COMPETITOR_TYPES: [
    {
      id: "aggressive",
      name: "Aggressive",
      riskTolerance: 0.8,
      marketingFocus: 0.7,
      productFocus: 0.3,
    },
    {
      id: "balanced",
      name: "Balanced",
      riskTolerance: 0.5,
      marketingFocus: 0.5,
      productFocus: 0.5,
    },
    {
      id: "product",
      name: "Product-Focused",
      riskTolerance: 0.4,
      marketingFocus: 0.2,
      productFocus: 0.8,
    },
    {
      id: "conservative",
      name: "Conservative",
      riskTolerance: 0.2,
      marketingFocus: 0.4,
      productFocus: 0.6,
    },
  ],

  // Funding rounds
  FUNDING_ROUNDS: [
    {
      name: "Seed",
      minValuation: 1000000,
      maxValuation: 5000000,
      equityRange: [0.1, 0.25],
      difficulty: 0.2,
    },
    {
      name: "Series A",
      minValuation: 5000000,
      maxValuation: 20000000,
      equityRange: [0.1, 0.2],
      difficulty: 0.4,
    },
    {
      name: "Series B",
      minValuation: 20000000,
      maxValuation: 50000000,
      equityRange: [0.05, 0.15],
      difficulty: 0.6,
    },
    {
      name: "Series C",
      minValuation: 50000000,
      maxValuation: 100000000,
      equityRange: [0.05, 0.1],
      difficulty: 0.7,
    },
  ],

  // Events
  EVENT_CATEGORIES: [
    { id: "market", weight: 30, minTurn: 0 },
    { id: "competitor", weight: 25, minTurn: 3 },
    { id: "internal", weight: 20, minTurn: 2 },
    { id: "opportunity", weight: 15, minTurn: 5 },
    { id: "global", weight: 10, minTurn: 8 },
    { id: "risk_reward", weight: 12, minTurn: 6 },
  ],

  // Game difficulty settings
  DIFFICULTY_SETTINGS: {
    easy: {
      startingCashMultiplier: 1.5,
      eventFrequency: 0.7,
      competitorAggressiveness: 0.7,
      marketGrowthBonus: 0.2,
      fundingAvailability: 1.3,
    },
    normal: {
      startingCashMultiplier: 1.0,
      eventFrequency: 1.0,
      competitorAggressiveness: 1.0,
      marketGrowthBonus: 0,
      fundingAvailability: 1.0,
    },
    hard: {
      startingCashMultiplier: 0.7,
      eventFrequency: 1.3,
      competitorAggressiveness: 1.3,
      marketGrowthBonus: -0.1,
      fundingAvailability: 0.7,
    },
  },

  // UI settings
  ANIMATION_SPEED: 300, // ms
  NOTIFICATION_DURATION: 5000, // 5 seconds

  // Endgame conditions
  BANKRUPTCY_THRESHOLD: 0, // Cash <= 0
  IPO_VALUATION_THRESHOLD: 100000000, // $100M to IPO
  ACQUISITION_VALUATION_THRESHOLD: 50000000, // $50M to be acquired
};

// Disable modifications to the config object
Object.freeze(CONFIG);
