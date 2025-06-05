/**
 * @fileoverview Configuration file for the Schelling and Voter Model simulation.
 * Defines default parameters and provides functions to get current parameters from the UI.
 * Based on "Schelling and Voter Model on Random Intersection Graph" paper.
 */

/**
 * Enumeration of available simulation models
 */
export const MODEL_TYPES = {
  SCHELLING_ONLY: 'schelling',
  VOTER_ONLY: 'voter', 
  COMBINED: 'combined'
};

/**
 * Default configuration values for the simulation.
 * These parameters are based on the mathematical foundation from the research paper.
 */
export const defaultConfig = {
  // === Graph Structure Parameters ===
  n: 100,              // Number of individual vertices (people)
  m: 10,               // Number of group vertices (groups/clubs)
  lambda: 1.0,         // Connectivity parameter for intersection graph
  
  // === Model Selection ===
  modelType: MODEL_TYPES.SCHELLING_ONLY, // Which model(s) to run
  
  // === Schelling Model Parameters ===
  c: 1.0,              // Edge creation rate (c/m per individual-group pair)
  gFunction: 'linear',  // Type of g function ('linear', 'sigmoid', 'threshold')
  gSteepness: 2.0,     // Steepness parameter for g function
  
  // === Voter Model Parameters ===
  gamma: 0.1,          // Opinion change rate
  voterType: 'group',  // 'individual' or 'group' based voter dynamics
  
  // === Initial Conditions ===
  initialOpinionSplit: 0.5, // Fraction of individuals with opinion +1
  initialGroupWeights: 'uniform', // 'uniform' or 'exponential' weight distribution
  
  // === Visualization ===
  traits: [1, -1],     // Opinion values (+1, -1)
  colors: {
    1: "#E91E63",      // Color for Opinion +1 (Pink/Red)
    [-1]: "#2196F3",   // Color for Opinion -1 (Blue)
  },
  
  // === Simulation Control ===
  simulationSpeed: 500,        // Speed for continuous simulation (ms per turn)
  maxTurns: 1000,             // Maximum number of turns before auto-stop
  convergenceThreshold: 0.01,  // Threshold for detecting steady state
  
  // === Statistics ===
  enableStatistics: true,      // Whether to collect detailed statistics
  statisticsInterval: 10,      // How often to log statistics (every N turns)
};

/**
 * Available g-function types for the Schelling model.
 * The g function determines how edge deletion probability depends on opinion agreement.
 */
export const G_FUNCTIONS = {
  linear: (x, steepness = 1) => Math.max(0, Math.min(1, 0.5 + steepness * x)),
  sigmoid: (x, steepness = 2) => 1 / (1 + Math.exp(-steepness * x)),
  threshold: (x, steepness = 0.5) => x > steepness ? 1 : 0
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

  return {
    // Graph structure
    n: getIntValue("n", defaultConfig.n, 10, 1000),
    m: getIntValue("m", defaultConfig.m, 1, 100),
    lambda: getFloatValue("lambda", defaultConfig.lambda, 0.1, 10),
    
    // Model selection
    modelType: getSelectValue("modelType", defaultConfig.modelType, Object.values(MODEL_TYPES)),
    
    // Schelling parameters
    c: getFloatValue("c", defaultConfig.c, 0.1, 10),
    gFunction: getSelectValue("gFunction", defaultConfig.gFunction, Object.keys(G_FUNCTIONS)),
    gSteepness: getFloatValue("gSteepness", defaultConfig.gSteepness, 0.1, 10),
    
    // Voter parameters
    gamma: getFloatValue("gamma", defaultConfig.gamma, 0, 1),
    voterType: getSelectValue("voterType", defaultConfig.voterType, ['individual', 'group']),
    
    // Initial conditions
    initialOpinionSplit: getFloatValue("initialOpinionSplit", defaultConfig.initialOpinionSplit, 0, 1),
    initialGroupWeights: getSelectValue("initialGroupWeights", defaultConfig.initialGroupWeights, ['uniform', 'exponential']),
    
    // Fixed values from defaults
    traits: defaultConfig.traits,
    colors: defaultConfig.colors,
    simulationSpeed: defaultConfig.simulationSpeed,
    maxTurns: defaultConfig.maxTurns,
    convergenceThreshold: defaultConfig.convergenceThreshold,
    enableStatistics: defaultConfig.enableStatistics,
    statisticsInterval: defaultConfig.statisticsInterval,
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
  if (config.m < 1) errors.push("Number of groups (m) must be at least 1");
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
