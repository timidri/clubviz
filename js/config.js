export const defaultConfig = {
    totalPeople: 100,
    totalClubs: 3,
    traits: ['M', 'F'],
    colors: {
        M: '#2196F3',
        F: '#E91E63'
    },
    simulationSpeed: 500 // milliseconds between turns during auto-run
};

export function getCurrentConfig() {
    return {
        totalPeople: parseInt(document.getElementById('totalPeople').value) || defaultConfig.totalPeople,
        totalClubs: parseInt(document.getElementById('totalClubs').value) || defaultConfig.totalClubs,
        traits: defaultConfig.traits,
        colors: defaultConfig.colors,
        simulationSpeed: defaultConfig.simulationSpeed
    };
}