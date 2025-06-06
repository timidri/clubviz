/**
 * @fileoverview Configuration file for the Schelling and Voter Model simulation.
 * Defines default parameters and provides functions to get current parameters from the UI.
 * Based on "Schelling and Voter Model on Random Intersection Graph" paper.
 */

/**
 * Enumeration of available simulation models based on technical requirements
 */
export const MODEL_TYPES = {
  SCHELLING_ONLY: 'schelling',
  CLASSICAL_SCHELLING: 'classical_schelling',
  VOTER_PAIRWISE: 'voter_pairwise',
  VOTER_GROUP: 'voter_group', 
  COMBINED: 'combined',
  SIR_EPIDEMIC: 'sir_epidemic'
};

/**
 * Model descriptions for the UI
 */
export const MODEL_DESCRIPTIONS = {
  [MODEL_TYPES.SCHELLING_ONLY]: "Network dynamics with edge creation/deletion based on homophily",
  [MODEL_TYPES.CLASSICAL_SCHELLING]: "Original Schelling segregation model adapted to random intersection graphs",
  [MODEL_TYPES.VOTER_PAIRWISE]: "Pairwise opinion change between connected individuals",
  [MODEL_TYPES.VOTER_GROUP]: "Group-influenced opinion change based on club membership",
  [MODEL_TYPES.COMBINED]: "Combined Schelling network dynamics with group-based voter model",
  [MODEL_TYPES.SIR_EPIDEMIC]: "SIR epidemic model with opinion-dependent transmission rates"
};

/**
 * Default configuration values for the simulation.
 * Enhanced to match technical requirements document.
 */
export const defaultConfig = {
  // === Graph Structure Parameters ===
  n: 100,              // Number of individual vertices (people)
  m: 4,                // Number of club vertices (clubs)
  lambda: 1.0,         // Connectivity parameter for intersection graph
  
  // === Model Selection ===
  modelType: MODEL_TYPES.COMBINED, // Which model(s) to run
  
  // === Graph Generation ===
  isHomogeneous: true,  // Homogeneous vs non-homogeneous generation
  individualWeightDist: 'constant', // 'constant', 'uniform', 'poisson'
  groupWeightDist: 'constant',      // 'constant', 'uniform', 'poisson'
  
  // === Schelling Model Parameters ===
  c: 2.0,              // Edge creation rate (c/m per individual-club pair)
  gFunction: 'linear',  // Type of g function ('linear', 'sigmoid', 'threshold', 'custom')
  gSteepness: 3.0,     // Steepness parameter for g function (higher = stronger homophily)
  customGFunction: '',  // Custom JavaScript function for g
  
  // === Voter Model Parameters ===
  // Pairwise Voter Model
  lambdaVoter: 0.5,    // Update rate for pairwise voter model
  updateRule: 'random', // 'first' or 'random' for pairwise updates
  
  // Group-influenced Voter Model  
  gamma: 0.3,          // Opinion change rate for group-based voter
  voterType: 'group',  // 'individual' or 'group' based voter dynamics
  etaFunction: 'linear', // Opinion change probability function
  customEtaFunction: '', // Custom JavaScript function for eta
  
  // === SIR Epidemic Model Parameters ===
  betaSIR: 0.1,        // Infection rate
  gammaSIR: 0.05,      // Recovery rate  
  opinionTransmissionModifier: 1.5, // Opinion-based transmission modifier
  initialInfectedCount: 5, // Initial number of infected individuals
  
  // === Initial Conditions ===
  initialOpinionSplit: 0.5, // Fraction of individuals with opinion +1
  initialGroupWeights: 'uniform', // 'uniform' or 'exponential' weight distribution for clubs
  
  // === Visualization ===
  traits: [1, -1],     // Opinion values (+1, -1)
  colors: {
    1: "#E91E63",      // Color for Opinion +1 (Pink/Red)
    [-1]: "#2196F3",   // Color for Opinion -1 (Blue)
  },
  
  // SIR Status Colors
  sirColors: {
    'S': "#4CAF50",    // Susceptible (Green)
    'I': "#F44336",    // Infected (Red)
    'R': "#9E9E9E"     // Recovered (Gray)
  },
  
  // === Simulation Control ===
  simulationSpeed: 500,        // Speed for continuous simulation (ms per turn)
  maxTurns: 1000,             // Maximum number of turns before auto-stop
  convergenceThreshold: 0.001,  // Threshold for detecting steady state (tighter)
  
  // === Statistics ===
  enableStatistics: true,      // Whether to collect detailed statistics
  statisticsInterval: 10,      // How often to log statistics (every N turns)
  
  // === Export Options ===
  exportFormat: 'json',        // 'json', 'csv', 'gexf'
  includeTurnHistory: true,    // Include full turn-by-turn history in exports
};

/**
 * Available g-function types for the Schelling model.
 * The g function determines how edge deletion probability depends on opinion agreement.
 * Positive input = high deletion rate, Negative input = low deletion rate
 */
export const G_FUNCTIONS = {
  linear: (x, steepness = 1) => Math.max(0, Math.min(1, 0.5 + steepness * x * 0.5)),
  sigmoid: (x, steepness = 2) => 1 / (1 + Math.exp(-steepness * x)),
  threshold: (x, steepness = 0.5) => x > steepness ? 1 : (x < -steepness ? 0 : 0.5)
};

/**
 * Retrieves the current configuration settings from the UI input fields.
 * Falls back to defaultConfig values if UI elements are not found or have invalid values.
 * @returns {object} The current configuration object with proper types and validation.
 */
export function getCurrentConfig() {
  // Helper function to safely parse integer from UI or return default
  const getIntValue = (id, defaultValue, min = 1, max = 10000) => {
    const element = document.getElementById(id);
    if (!element) return defaultValue;
    const value = parseInt(element.value);
    return (isNaN(value) || value < min || value > max) ? defaultValue : value;
  };

  // Helper function to safely parse float from UI or return default
  const getFloatValue = (id, defaultValue, min = 0, max = 10) => {
    const element = document.getElementById(id);
    if (!element) return defaultValue;
    const value = parseFloat(element.value);
    return (isNaN(value) || value < min || value > max) ? defaultValue : value;
  };

  // Helper function to get select value or return default
  const getSelectValue = (id, defaultValue, validValues = []) => {
    const element = document.getElementById(id);
    if (!element) return defaultValue;
    const value = element.value;
    return validValues.length > 0 && !validValues.includes(value) ? defaultValue : value;
  };

  // Helper function to get checkbox value
  const getCheckboxValue = (id, defaultValue) => {
    const element = document.getElementById(id);
    return element ? element.checked : defaultValue;
  };

  return {
    // Graph structure
    n: getIntValue("n", defaultConfig.n, 10, 1000),
    m: getIntValue("m", defaultConfig.m, 1, 100),
    lambda: getFloatValue("lambda", defaultConfig.lambda, 0.1, 10),
    
    // Model selection
    modelType: getSelectValue("modelType", defaultConfig.modelType, Object.values(MODEL_TYPES)),
    
    // Graph generation
    isHomogeneous: getCheckboxValue("isHomogeneous", defaultConfig.isHomogeneous),
    individualWeightDist: getSelectValue("individualWeightDist", defaultConfig.individualWeightDist, ['constant', 'uniform', 'poisson']),
    groupWeightDist: getSelectValue("groupWeightDist", defaultConfig.groupWeightDist, ['constant', 'uniform', 'poisson']),
    
    // Schelling parameters
    c: getFloatValue("c", defaultConfig.c, 0.1, 10),
    gFunction: getSelectValue("gFunction", defaultConfig.gFunction, Object.keys(G_FUNCTIONS)),
    gSteepness: getFloatValue("gSteepness", defaultConfig.gSteepness, 0.1, 10),
    
    // Voter parameters - Pairwise
    lambdaVoter: getFloatValue("lambdaVoter", defaultConfig.lambdaVoter, 0, 2),
    updateRule: getSelectValue("updateRule", defaultConfig.updateRule, ['random', 'first']),
    
    // Voter parameters - Group-based
    gamma: getFloatValue("gamma", defaultConfig.gamma, 0, 1),
    voterType: getSelectValue("voterType", defaultConfig.voterType, ['individual', 'group']),
    etaFunction: getSelectValue("etaFunction", defaultConfig.etaFunction, ['linear', 'sigmoid', 'threshold', 'custom']),
    
    // SIR parameters
    betaSIR: getFloatValue("betaSIR", defaultConfig.betaSIR, 0, 1),
    gammaSIR: getFloatValue("gammaSIR", defaultConfig.gammaSIR, 0, 1),
    opinionTransmissionModifier: getFloatValue("opinionTransmissionModifier", defaultConfig.opinionTransmissionModifier, 0.1, 5),
    initialInfectedCount: getIntValue("initialInfectedCount", defaultConfig.initialInfectedCount, 1, 50),
    
    // Initial conditions
    initialOpinionSplit: getFloatValue("initialOpinionSplit", defaultConfig.initialOpinionSplit, 0, 1),
    initialGroupWeights: getSelectValue("initialGroupWeights", defaultConfig.initialGroupWeights, ['uniform', 'exponential']),
    
    // Fixed values from defaults
    traits: defaultConfig.traits,
    colors: defaultConfig.colors,
    sirColors: defaultConfig.sirColors,
    simulationSpeed: defaultConfig.simulationSpeed,
    maxTurns: defaultConfig.maxTurns,
    convergenceThreshold: defaultConfig.convergenceThreshold,
    enableStatistics: defaultConfig.enableStatistics,
    statisticsInterval: defaultConfig.statisticsInterval,
    exportFormat: defaultConfig.exportFormat,
    includeTurnHistory: defaultConfig.includeTurnHistory,
  };
}

/**
 * Validates a configuration object and returns error messages if invalid.
 * @param {object} config - Configuration object to validate
 * @returns {string[]} Array of error messages (empty if valid)
 */
export function validateConfig(config) {
  const errors = [];
  
  if (config.n < 1) errors.push("Number of individuals (n) must be at least 1");
  if (config.m < 1) errors.push("Number of clubs (m) must be at least 1");
  if (config.lambda <= 0) errors.push("Lambda parameter must be positive");
  
  if (!Object.values(MODEL_TYPES).includes(config.modelType)) {
    errors.push("Invalid model type selected");
  }
  
  if (config.c <= 0) errors.push("Edge creation rate (c) must be positive");
  if (config.gamma < 0 || config.gamma > 1) errors.push("Gamma must be between 0 and 1");
  
  if (config.initialOpinionSplit < 0 || config.initialOpinionSplit > 1) {
    errors.push("Initial opinion split must be between 0 and 1");
  }
  
  return errors;
}

/**
 * Gets the appropriate g-function based on configuration.
 * @param {object} config - Configuration object
 * @returns {function} The g-function to use for Schelling dynamics
 */
export function getGFunction(config) {
  const gFunc = G_FUNCTIONS[config.gFunction] || G_FUNCTIONS.linear;
  return (x) => gFunc(x, config.gSteepness);
}
