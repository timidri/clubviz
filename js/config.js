/**
 * @fileoverview Configuration file for the simulation.
 * Defines default parameters and provides a function to get current parameters from the UI.
 */

/**
 * Default configuration values for the simulation.
 * These are used if no values are provided or if UI elements are not found.
 */
export const defaultConfig = {
  totalPeople: 100, // Default number of people in the simulation
  totalClubs: 3,    // Default number of clubs
  traits: ["R", "B"], // Available traits for people
  colors: {
    R: "#E91E63", // Color for Trait R (Pink/Red)
    B: "#2196F3", // Color for Trait B (Blue)
  },
  joinProbability: 1,          // Base probability factor (k) for joining a club
  leaveProbabilityThreshold: 0.5, // Threshold (t) for determining if a trait is underrepresented
  leaveHighProb: 0.9,          // Probability (p_high) of leaving if trait is underrepresented
  leaveLowProb: 0.1,           // Probability (p_low) of leaving if trait is well-represented
  simulationSpeed: 500,        // Speed for continuous simulation run (in milliseconds per turn)
};

/**
 * Retrieves the current configuration settings from the UI input fields.
 * Falls back to defaultConfig values if UI elements are not found or have invalid values.
 * @returns {object} The current configuration object.
 */
export function getCurrentConfig() {
  // Helper function to safely parse integer from UI or return default
  const getIntValue = (id, defaultValue) => {
    const element = document.getElementById(id);
    return element ? parseInt(element.value) || defaultValue : defaultValue;
  };

  // Helper function to safely parse float from UI or return default
  const getFloatValue = (id, defaultValue) => {
    const element = document.getElementById(id);
    return element ? parseFloat(element.value) || defaultValue : defaultValue;
  };

  return {
    totalPeople:
      getIntValue("totalPeople", defaultConfig.totalPeople),
    totalClubs:
      getIntValue("totalClubs", defaultConfig.totalClubs),
    joinProbability:
      getFloatValue("joinProbability", defaultConfig.joinProbability),
    leaveProbabilityThreshold:
      getFloatValue("leaveProbabilityThreshold", defaultConfig.leaveProbabilityThreshold),
    leaveHighProb:
      getFloatValue("leaveHighProb", defaultConfig.leaveHighProb),
    leaveLowProb:
      getFloatValue("leaveLowProb", defaultConfig.leaveLowProb),
    traits: defaultConfig.traits, // Traits are fixed from default config
    colors: defaultConfig.colors, // Colors are fixed from default config
    simulationSpeed: defaultConfig.simulationSpeed, // Simulation speed is fixed from default config
  };
}
