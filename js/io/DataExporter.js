/**
 * @fileoverview Handles exporting of simulation data, graphs, and configurations.
 */
export class DataExporter {
  constructor(dashboard) {
    this.dashboard = dashboard;
  }

  exportData() {
    const { simulator } = this.dashboard;
    if (!simulator) return this.dashboard.uiManager.showError("No simulation data to export");
    
    const stats = simulator.getStatistics();
    if (!stats.history.turns.length) return this.dashboard.uiManager.showError("No turn data available.");

    const headers = "turn,totalEdges,opinionPositive,opinionNegative,segregationIndex,convergenceMetric,giniCoefficient\n";
    const rows = stats.history.turns.map(turn => [
      turn.turn,
      turn.totalEdges,
      turn.totalOpinions[1] || 0,
      turn.totalOpinions[-1] || 0,
      turn.segregationIndex.toFixed(6),
      turn.convergenceMetric.toFixed(6),
      turn.networkMeasures.gini.toFixed(6)
    ].join(',')).join('\n');

    this.downloadFile(headers + rows, 'simulation_data.csv', 'text/csv');
    this.dashboard.uiManager.showMessage("Simulation data exported successfully!");
  }

  exportGraph() {
    const { people, groups, stateController } = this.dashboard;
    if (!people.length || !groups.length) return this.dashboard.uiManager.showError("No graph data to export");

    const graphData = {
      metadata: {
        exportDate: new Date().toISOString(),
        simulationTurn: stateController.currentTurn,
        modelType: this.dashboard.config.modelType,
      },
      nodes: people.map(p => p.toJSON()),
      groups: groups.map(g => g.toJSON()),
      edges: this.generateRIGEdges(),
    };

    this.downloadFile(JSON.stringify(graphData, null, 2), 'graph_state.json', 'application/json');
    this.dashboard.uiManager.showMessage("Graph state exported successfully!");
  }

  generateRIGEdges() {
    const edges = new Set();
    this.dashboard.people.forEach(person => {
      person.getNeighbors().forEach(neighbor => {
        const edgeId = [person.id, neighbor.id].sort().join('-');
        edges.add(edgeId);
      });
    });
    return Array.from(edges).map(edgeId => {
      const [source, target] = edgeId.split('-');
      return { source, target };
    });
  }

  exportConfiguration() {
    const configData = {
      metadata: { exportDate: new Date().toISOString(), version: "1.0" },
      configuration: this.dashboard.config,
    };
    this.downloadFile(JSON.stringify(configData, null, 2), 'simulation_config.json', 'application/json');
    this.dashboard.uiManager.showMessage("Configuration exported successfully!");
  }

  loadConfiguration() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      try {
        const content = await file.text();
        const configData = JSON.parse(content);
        if (configData.configuration) {
          this.dashboard.config = { ...this.dashboard.config, ...configData.configuration };
          this.dashboard.uiManager.updateUIFromConfig();
          this.dashboard.uiManager.updateParameterVisibility();
          this.dashboard.uiManager.showMessage("Configuration loaded successfully!");
        } else {
          this.dashboard.uiManager.showError("Invalid configuration file format.");
        }
      } catch (error) {
        this.dashboard.uiManager.showError("Error loading configuration: " + error.message);
      }
    };
    fileInput.click();
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }
} 