export const defaultConfig = {
  totalPeople: 100,
  totalClubs: 3,
  traits: ["R", "B"],
  colors: {
    M: "#2196F3",
    F: "#E91E63",
  },
  joinProbability: 1,
  leaveProbabilityThreshold: 0.5,
  leaveHighProb: 1.0,
  leaveLowProb: 0.0,
  simulationSpeed: 500,
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
    leaveHighProb:
      parseFloat(document.getElementById("leaveHighProb").value) ||
      defaultConfig.leaveHighProb,
    leaveLowProb:
      parseFloat(document.getElementById("leaveLowProb").value) ||
      defaultConfig.leaveLowProb,
    traits: defaultConfig.traits,
    colors: defaultConfig.colors,
    simulationSpeed: defaultConfig.simulationSpeed,
  };
}
