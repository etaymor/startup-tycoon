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
  BURN_RATE_MULTIPLIER: 1.5, // Increased from 1.2 - How quickly you burn cash

  // Turn settings
  TURN_DURATION: "month", // each turn represents a month
  MAX_TURNS: 120, // 10 years (120 months)

  // Team settings
  STARTING_TEAM_SIZE: 2, // founder + 1 employee
  EMPLOYEE_BASE_SALARY: {
    developer: 12000, // Increased from 10000
    designer: 10000, // Increased from 8000
    marketer: 9000, // Increased from 7000
    salesperson: 8000, // Increased from 6000
    operations: 7000, // Increased from 5000
  },
  EMPLOYEE_PERFORMANCE_RANGE: [0.6, 1.2], // Reduced upper range from [0.7, 1.3]

  // Product settings
  PRODUCT_QUALITY_DECAY: 0.08, // Increased from 0.05 - 8% quality decay per turn if not maintained
  FEATURE_COMPLEXITY_LEVELS: {
    simple: { time: 1, cost: 10000, impact: 0.1 },
    medium: { time: 3, cost: 50000, impact: 0.25 },
    complex: { time: 6, cost: 150000, impact: 0.5 },
  },

  // Feature names by industry and complexity
  FEATURE_NAMES: {
    saas: {
      simple: [
        "User Authentication",
        "Email Notifications",
        "Basic Dashboard",
        "Data Export",
        "Simple Reports",
        "User Profiles",
        "Search Function",
        "Feedback Form",
        "Dark Mode",
        "Mobile Responsiveness",
      ],
      medium: [
        "Team Collaboration",
        "Advanced Analytics",
        "API Integration",
        "Custom Workflows",
        "Automated Reporting",
        "Role-Based Access",
        "Multi-factor Authentication",
        "Data Visualization",
        "Webhooks",
        "Custom Branding",
      ],
      complex: [
        "AI-Powered Recommendations",
        "Enterprise SSO",
        "Real-time Collaboration",
        "Advanced Permissions System",
        "White-label Solution",
        "Custom Integrations",
        "Predictive Analytics",
        "Compliance Management",
        "Multi-tenant Architecture",
        "Workflow Automation Engine",
      ],
    },
    ecommerce: {
      simple: [
        "Product Search",
        "Wish Lists",
        "Email Receipts",
        "Order Tracking",
        "Product Reviews",
        "Related Products",
        "Social Sharing",
        "Basic Checkout",
        "Discount Codes",
        "Mobile Cart",
      ],
      medium: [
        "Personalized Recommendations",
        "Inventory Management",
        "Customer Accounts",
        "Multiple Payment Methods",
        "Abandoned Cart Recovery",
        "Product Filtering",
        "Gift Cards",
        "Loyalty Program",
        "Multi-currency Support",
        "Advanced Product Search",
      ],
      complex: [
        "AI Product Recommendations",
        "Omnichannel Integration",
        "Dynamic Pricing",
        "Subscription Management",
        "Marketplace Features",
        "Advanced Analytics Dashboard",
        "Fraud Detection",
        "Personalized Shopping Experience",
        "International Shipping",
        "Vendor Management",
      ],
    },
    fintech: {
      simple: [
        "Transaction History",
        "Account Balance",
        "Basic Budgeting",
        "Bill Reminders",
        "Simple Transfers",
        "Spending Categories",
        "Notification Alerts",
        "PIN Management",
        "Currency Converter",
        "Statement Downloads",
      ],
      medium: [
        "Spending Analytics",
        "Recurring Payments",
        "Goal Tracking",
        "Investment Tracking",
        "Multi-account Management",
        "Expense Reports",
        "Budget Forecasting",
        "Tax Preparation",
        "Credit Score Monitoring",
        "Automated Savings",
      ],
      complex: [
        "Wealth Management",
        "Robo-Advisory",
        "Fraud Detection",
        "Investment Portfolio",
        "Automated Tax Optimization",
        "Risk Assessment",
        "Financial Planning Tools",
        "Open Banking Integration",
        "Blockchain Transactions",
        "AI-Powered Financial Insights",
      ],
    },
    social: {
      simple: [
        "User Profiles",
        "Friend Requests",
        "Basic Feed",
        "Photo Uploads",
        "Like Button",
        "Comment System",
        "Basic Notifications",
        "User Search",
        "Profile Customization",
        "Activity Log",
      ],
      medium: [
        "Content Discovery",
        "Group Creation",
        "Event Management",
        "Direct Messaging",
        "Content Moderation",
        "Trending Topics",
        "Advanced Notifications",
        "Content Sharing",
        "Polls and Surveys",
        "User Tagging",
      ],
      complex: [
        "Algorithm-based Feed",
        "Live Streaming",
        "Content Monetization",
        "Advanced Analytics",
        "Creator Tools",
        "Community Management",
        "Recommendation Engine",
        "Content Personalization",
        "Augmented Reality Filters",
        "Marketplace Integration",
      ],
    },
  },

  // Feature categories and dependencies
  FEATURE_CATEGORIES: {
    saas: [
      {
        id: "core",
        name: "Core Features",
        description: "Essential functionality for your SaaS product",
      },
      {
        id: "ux",
        name: "User Experience",
        description:
          "Features that improve how users interact with your product",
      },
      {
        id: "analytics",
        name: "Analytics & Reporting",
        description: "Data insights and reporting capabilities",
      },
      {
        id: "security",
        name: "Security & Compliance",
        description: "Features that protect data and ensure compliance",
      },
      {
        id: "integration",
        name: "Integrations",
        description: "Connect with other services and platforms",
      },
    ],
    ecommerce: [
      {
        id: "storefront",
        name: "Storefront",
        description: "Customer-facing shop features",
      },
      {
        id: "catalog",
        name: "Product Catalog",
        description: "How products are organized and presented",
      },
      {
        id: "checkout",
        name: "Checkout & Payments",
        description: "Payment processing and order completion",
      },
      {
        id: "fulfillment",
        name: "Order Fulfillment",
        description: "Order processing and delivery",
      },
      {
        id: "marketing",
        name: "Marketing Tools",
        description: "Features to promote products and engage customers",
      },
    ],
    fintech: [
      {
        id: "accounts",
        name: "Account Management",
        description: "Core banking and account features",
      },
      {
        id: "payments",
        name: "Payments & Transfers",
        description: "Money movement capabilities",
      },
      {
        id: "investing",
        name: "Investment Tools",
        description: "Features for managing investments",
      },
      {
        id: "security",
        name: "Security & Compliance",
        description: "Protection and regulatory features",
      },
      {
        id: "insights",
        name: "Financial Insights",
        description: "Analysis and recommendations",
      },
    ],
    social: [
      {
        id: "profiles",
        name: "User Profiles",
        description: "User identity and presence",
      },
      {
        id: "content",
        name: "Content Management",
        description: "Creating and managing content",
      },
      {
        id: "engagement",
        name: "Engagement",
        description: "Features that drive user interaction",
      },
      {
        id: "discovery",
        name: "Discovery",
        description: "Finding content and connections",
      },
      {
        id: "monetization",
        name: "Monetization",
        description: "Revenue generation features",
      },
    ],
  },

  // Feature category mapping and dependencies
  FEATURE_METADATA: {
    saas: {
      "User Authentication": { category: "security", dependencies: [] },
      "Email Notifications": { category: "core", dependencies: [] },
      "Basic Dashboard": { category: "ux", dependencies: [] },
      "Data Export": {
        category: "analytics",
        dependencies: ["Simple Reports"],
      },
      "Simple Reports": { category: "analytics", dependencies: [] },
      "User Profiles": {
        category: "core",
        dependencies: ["User Authentication"],
      },
      "Search Function": { category: "ux", dependencies: [] },
      "Feedback Form": { category: "ux", dependencies: [] },
      "Dark Mode": { category: "ux", dependencies: ["Basic Dashboard"] },
      "Mobile Responsiveness": { category: "ux", dependencies: [] },
      "Team Collaboration": {
        category: "core",
        dependencies: ["User Profiles"],
      },
      "Advanced Analytics": {
        category: "analytics",
        dependencies: ["Simple Reports"],
      },
      "API Integration": { category: "integration", dependencies: [] },
      "Custom Workflows": {
        category: "core",
        dependencies: ["Basic Dashboard"],
      },
      "Automated Reporting": {
        category: "analytics",
        dependencies: ["Simple Reports"],
      },
      "Role-Based Access": {
        category: "security",
        dependencies: ["User Authentication"],
      },
      "Multi-factor Authentication": {
        category: "security",
        dependencies: ["User Authentication"],
      },
      "Data Visualization": {
        category: "analytics",
        dependencies: ["Simple Reports"],
      },
      Webhooks: { category: "integration", dependencies: ["API Integration"] },
      "Custom Branding": { category: "ux", dependencies: ["Basic Dashboard"] },
      "AI-Powered Recommendations": {
        category: "analytics",
        dependencies: ["Advanced Analytics"],
      },
      "Enterprise SSO": {
        category: "security",
        dependencies: ["Multi-factor Authentication"],
      },
      "Real-time Collaboration": {
        category: "core",
        dependencies: ["Team Collaboration"],
      },
      "Advanced Permissions System": {
        category: "security",
        dependencies: ["Role-Based Access"],
      },
      "White-label Solution": {
        category: "ux",
        dependencies: ["Custom Branding"],
      },
      "Custom Integrations": {
        category: "integration",
        dependencies: ["API Integration"],
      },
      "Predictive Analytics": {
        category: "analytics",
        dependencies: ["Advanced Analytics"],
      },
      "Compliance Management": {
        category: "security",
        dependencies: ["Role-Based Access"],
      },
      "Multi-tenant Architecture": {
        category: "core",
        dependencies: ["Advanced Permissions System"],
      },
      "Workflow Automation Engine": {
        category: "core",
        dependencies: ["Custom Workflows"],
      },
    },
    ecommerce: {
      "Product Search": { category: "catalog", dependencies: [] },
      "Wish Lists": { category: "storefront", dependencies: [] },
      "Email Receipts": { category: "checkout", dependencies: [] },
      "Order Tracking": {
        category: "fulfillment",
        dependencies: ["Email Receipts"],
      },
      "Product Reviews": { category: "catalog", dependencies: [] },
      "Related Products": {
        category: "catalog",
        dependencies: ["Product Search"],
      },
      "Social Sharing": { category: "marketing", dependencies: [] },
      "Basic Checkout": { category: "checkout", dependencies: [] },
      "Discount Codes": {
        category: "marketing",
        dependencies: ["Basic Checkout"],
      },
      "Mobile Cart": {
        category: "storefront",
        dependencies: ["Basic Checkout"],
      },
      "Personalized Recommendations": {
        category: "marketing",
        dependencies: ["Related Products"],
      },
      "Inventory Management": { category: "fulfillment", dependencies: [] },
      "Customer Accounts": { category: "storefront", dependencies: [] },
      "Multiple Payment Methods": {
        category: "checkout",
        dependencies: ["Basic Checkout"],
      },
      "Abandoned Cart Recovery": {
        category: "marketing",
        dependencies: ["Customer Accounts", "Mobile Cart"],
      },
      "Product Filtering": {
        category: "catalog",
        dependencies: ["Product Search"],
      },
      "Gift Cards": {
        category: "checkout",
        dependencies: ["Multiple Payment Methods"],
      },
      "Loyalty Program": {
        category: "marketing",
        dependencies: ["Customer Accounts"],
      },
      "Multi-currency Support": {
        category: "checkout",
        dependencies: ["Multiple Payment Methods"],
      },
      "Advanced Product Search": {
        category: "catalog",
        dependencies: ["Product Search", "Product Filtering"],
      },
      "AI Product Recommendations": {
        category: "marketing",
        dependencies: ["Personalized Recommendations"],
      },
      "Omnichannel Integration": {
        category: "fulfillment",
        dependencies: ["Inventory Management"],
      },
      "Dynamic Pricing": {
        category: "catalog",
        dependencies: ["Inventory Management"],
      },
      "Subscription Management": {
        category: "checkout",
        dependencies: ["Customer Accounts", "Multiple Payment Methods"],
      },
      "Marketplace Features": {
        category: "storefront",
        dependencies: ["Vendor Management"],
      },
      "Advanced Analytics Dashboard": {
        category: "marketing",
        dependencies: ["Customer Accounts"],
      },
      "Fraud Detection": {
        category: "checkout",
        dependencies: ["Multiple Payment Methods"],
      },
      "Personalized Shopping Experience": {
        category: "storefront",
        dependencies: ["AI Product Recommendations"],
      },
      "International Shipping": {
        category: "fulfillment",
        dependencies: ["Multi-currency Support"],
      },
      "Vendor Management": {
        category: "fulfillment",
        dependencies: ["Inventory Management"],
      },
    },
    fintech: {
      "Transaction History": { category: "accounts", dependencies: [] },
      "Account Balance": { category: "accounts", dependencies: [] },
      "Basic Budgeting": {
        category: "insights",
        dependencies: ["Transaction History"],
      },
      "Bill Reminders": { category: "payments", dependencies: [] },
      "Simple Transfers": {
        category: "payments",
        dependencies: ["Account Balance"],
      },
      "Spending Categories": {
        category: "insights",
        dependencies: ["Transaction History"],
      },
      "Notification Alerts": { category: "accounts", dependencies: [] },
      "PIN Management": { category: "security", dependencies: [] },
      "Currency Converter": { category: "payments", dependencies: [] },
      "Statement Downloads": {
        category: "accounts",
        dependencies: ["Transaction History"],
      },
      "Spending Analytics": {
        category: "insights",
        dependencies: ["Spending Categories"],
      },
      "Recurring Payments": {
        category: "payments",
        dependencies: ["Simple Transfers"],
      },
      "Goal Tracking": {
        category: "insights",
        dependencies: ["Basic Budgeting"],
      },
      "Investment Tracking": { category: "investing", dependencies: [] },
      "Multi-account Management": {
        category: "accounts",
        dependencies: ["Account Balance"],
      },
      "Expense Reports": {
        category: "insights",
        dependencies: ["Spending Categories"],
      },
      "Budget Forecasting": {
        category: "insights",
        dependencies: ["Basic Budgeting", "Spending Analytics"],
      },
      "Tax Preparation": {
        category: "insights",
        dependencies: ["Expense Reports"],
      },
      "Credit Score Monitoring": { category: "security", dependencies: [] },
      "Automated Savings": {
        category: "accounts",
        dependencies: ["Goal Tracking"],
      },
      "Wealth Management": {
        category: "investing",
        dependencies: ["Investment Tracking"],
      },
      "Robo-Advisory": {
        category: "investing",
        dependencies: ["Investment Tracking"],
      },
      "Fraud Detection": {
        category: "security",
        dependencies: ["Transaction History"],
      },
      "Investment Portfolio": {
        category: "investing",
        dependencies: ["Investment Tracking"],
      },
      "Automated Tax Optimization": {
        category: "insights",
        dependencies: ["Tax Preparation"],
      },
      "Risk Assessment": {
        category: "investing",
        dependencies: ["Investment Portfolio"],
      },
      "Financial Planning Tools": {
        category: "insights",
        dependencies: ["Budget Forecasting"],
      },
      "Open Banking Integration": {
        category: "accounts",
        dependencies: ["Multi-account Management"],
      },
      "Blockchain Transactions": {
        category: "payments",
        dependencies: ["Fraud Detection"],
      },
      "AI-Powered Financial Insights": {
        category: "insights",
        dependencies: ["Spending Analytics", "Budget Forecasting"],
      },
    },
    social: {
      "User Profiles": { category: "profiles", dependencies: [] },
      "Friend Requests": {
        category: "engagement",
        dependencies: ["User Profiles"],
      },
      "Basic Feed": { category: "content", dependencies: [] },
      "Photo Uploads": { category: "content", dependencies: [] },
      "Like Button": { category: "engagement", dependencies: ["Basic Feed"] },
      "Comment System": {
        category: "engagement",
        dependencies: ["Basic Feed"],
      },
      "Basic Notifications": { category: "engagement", dependencies: [] },
      "User Search": { category: "discovery", dependencies: ["User Profiles"] },
      "Profile Customization": {
        category: "profiles",
        dependencies: ["User Profiles"],
      },
      "Activity Log": { category: "profiles", dependencies: ["User Profiles"] },
      "Content Discovery": {
        category: "discovery",
        dependencies: ["Basic Feed"],
      },
      "Group Creation": {
        category: "engagement",
        dependencies: ["User Profiles"],
      },
      "Event Management": {
        category: "content",
        dependencies: ["Group Creation"],
      },
      "Direct Messaging": {
        category: "engagement",
        dependencies: ["User Profiles"],
      },
      "Content Moderation": {
        category: "content",
        dependencies: ["Comment System"],
      },
      "Trending Topics": {
        category: "discovery",
        dependencies: ["Content Discovery"],
      },
      "Advanced Notifications": {
        category: "engagement",
        dependencies: ["Basic Notifications"],
      },
      "Content Sharing": { category: "content", dependencies: ["Basic Feed"] },
      "Polls and Surveys": {
        category: "engagement",
        dependencies: ["Group Creation"],
      },
      "User Tagging": {
        category: "engagement",
        dependencies: ["User Profiles", "Content Sharing"],
      },
      "Algorithm-based Feed": {
        category: "discovery",
        dependencies: ["Content Discovery"],
      },
      "Live Streaming": {
        category: "content",
        dependencies: ["Photo Uploads"],
      },
      "Content Monetization": {
        category: "monetization",
        dependencies: ["Content Sharing"],
      },
      "Advanced Analytics": {
        category: "monetization",
        dependencies: ["Content Discovery"],
      },
      "Creator Tools": {
        category: "content",
        dependencies: ["Content Sharing"],
      },
      "Community Management": {
        category: "engagement",
        dependencies: ["Group Creation", "Content Moderation"],
      },
      "Recommendation Engine": {
        category: "discovery",
        dependencies: ["Algorithm-based Feed"],
      },
      "Content Personalization": {
        category: "discovery",
        dependencies: ["Algorithm-based Feed"],
      },
      "Augmented Reality Filters": {
        category: "content",
        dependencies: ["Photo Uploads"],
      },
      "Marketplace Integration": {
        category: "monetization",
        dependencies: ["Content Monetization"],
      },
    },
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
      startingCashMultiplier: 1.3, // Reduced from 1.5
      eventFrequency: 0.8, // Increased from 0.7
      competitorAggressiveness: 0.8, // Increased from 0.7
      marketGrowthBonus: 0.15, // Reduced from 0.2
      fundingAvailability: 1.2, // Reduced from 1.3
    },
    normal: {
      startingCashMultiplier: 0.9, // Reduced from 1.0
      eventFrequency: 1.1, // Increased from 1.0
      competitorAggressiveness: 1.1, // Increased from 1.0
      marketGrowthBonus: -0.05, // Reduced from 0
      fundingAvailability: 0.9, // Reduced from 1.0
    },
    hard: {
      startingCashMultiplier: 0.6, // Reduced from 0.7
      eventFrequency: 1.4, // Increased from 1.3
      competitorAggressiveness: 1.5, // Increased from 1.3
      marketGrowthBonus: -0.15, // Reduced from -0.1
      fundingAvailability: 0.6, // Reduced from 0.7
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
