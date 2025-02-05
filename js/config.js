export const defaultConfig = {
  totalPeople: 100,
  totalClubs: 3,
  traits: ["M", "F"],
  colors: {
    M: "#2196F3",
    F: "#E91E63",
  },
  joinProbability: 1, // Base probability of joining any club (0-1)
  leaveProbabilityThreshold: 0.5, // Trait proportion threshold for leaving (0-1)
  simulationSpeed: 500, // milliseconds between turns during auto-run
};

export function getCurrentConfig() {
  return {
    totalPeople:
      parseInt(document.getElementById("totalPeople").value) ||
      defaultConfig.totalPeople,
    totalClubs:
      parseInt(document.getElementById("totalClubs").value) ||
      defaultConfig.totalClubs,
    joinProbability:
      parseFloat(document.getElementById("joinProbability").value) ||
      defaultConfig.joinProbability,
    leaveProbabilityThreshold:
      parseFloat(document.getElementById("leaveProbabilityThreshold").value) ||
      defaultConfig.leaveProbabilityThreshold,
    traits: defaultConfig.traits,
    colors: defaultConfig.colors,
    simulationSpeed: defaultConfig.simulationSpeed,
  };
}
