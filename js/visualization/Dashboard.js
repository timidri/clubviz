/**
 * @fileoverview Dashboard class for controlling the Random Intersection Graph simulation.
 * Provides UI controls for model selection and parameter adjustment.
 * Based on "Schelling and Voter Model on Random Intersection Graph" paper.
 */

import { getCurrentConfig, validateConfig, MODEL_TYPES, MODEL_DESCRIPTIONS } from "../config.js";
import { GraphInitializer } from "../simulation/GraphInitializer.js";
import { Simulator } from "../simulation/Simulator.js";
import { Tester } from "../simulation/Tester.js";
import { CanvasVisualizer } from "./CanvasVisualizer.js";

/**
 * Main dashboard controller for the Random Intersection Graph simulation.
 * Manages UI, simulation, visualization, and user interactions.
 */
export class Dashboard {
  /**
   * Creates a new Dashboard instance.
   */
  constructor() {
    console.log("Dashboard initializing...");
    
    // Core components
    this.config = getCurrentConfig();
    this.graphInitializer = null;
    this.simulator = null;
    this.tester = null;
    
    // Data
    this.people = [];
    this.groups = [];
    
    // Visualizer
    this.canvas = document.getElementById("visualization");
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
    this.visualizer = null;
    
    // UI state
    this.isRunning = false;
    this.runInterval = null;
    this.currentTurn = 0;
    
    // Performance tracking
    this.performanceMetrics = {
      renderTimes: [],
      simulationTimes: []
    };
  }

  /**
   * Initializes the dashboard asynchronously.
   * This is called after construction to set up the UI and initial state.
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      console.log("🔧 Setting up Dashboard UI...");
      
      // Initialize UI components step by step
      await this.initializeUI();
      
      console.log("📊 Applying initial parameters...");
      
      // Create initial graph and visualization
      await this.applyParameters();
      
      console.log("✅ Dashboard initialized successfully");
      
    } catch (error) {
      console.error("❌ Dashboard initialization failed:", error);
      this.showError("Failed to initialize dashboard: " + error.message);
      throw error; // Re-throw to be caught by main.js
    }
  }

  /**
   * Initializes the user interface elements and event handlers.
   * @returns {Promise<void>}
   */
  async initializeUI() {
    console.log("Setting up UI controls...");
    
    try {
      // Setup model selection
      await this.setupModelSelection();
      
      // Setup simulation controls
      await this.setupSimulationControls();
      
      // Setup parameter change listeners
      await this.setupParameterListeners();
      
      // Initial parameter display update
      this.updateParameterDisplay();
      
      console.log("UI controls set up successfully");
      
    } catch (error) {
      console.error("Error setting up UI:", error);
      throw error;
    }
  }

  /**
   * Sets up model selection controls.
   */
  setupModelSelection() {
    const modelContainer = document.getElementById('modelSelection');
    if (!modelContainer) {
      console.warn("Model selection container not found");
      return;
    }
    
    // Clear existing content
    modelContainer.innerHTML = '';
    
    // Create radio buttons for model selection
    Object.entries(MODEL_TYPES).forEach(([key, value]) => {
      const label = document.createElement('label');
      label.className = 'model-option';
      
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'modelType';
      radio.value = value;
      radio.id = `model-${value}`;
      radio.checked = value === this.config.modelType;
      radio.addEventListener('change', () => this.onModelTypeChange(value));
      
      const text = document.createElement('span');
      text.textContent = this.formatModelName(key);
      
      label.appendChild(radio);
      label.appendChild(text);
      modelContainer.appendChild(label);
    });
    
    console.log("Model selection setup complete");
  }

  /**
   * Sets up simulation control buttons.
   */
  setupSimulationControls() {
    // Turn controls
    this.setupButton("takeTurn", () => this.takeSingleTurn());
    this.setupButton("take10Turns", () => this.takeMultipleTurns(10));
    this.setupButton("take100Turns", () => this.takeMultipleTurns(100));
    
    // Run controls
    this.setupButton("startRun", () => this.startContinuousRun());
    this.setupButton("stopRun", () => this.stopContinuousRun());
    
    // Other controls
    this.setupButton("resetSim", () => this.resetSimulation());
    this.setupButton("applyParams", () => this.applyParameters());
    
    // Export controls
    this.setupButton("exportData", () => this.exportData());
    this.setupButton("exportGraph", () => this.exportGraph());
    this.setupButton("exportConfig", () => this.exportConfiguration());
    this.setupButton("loadConfig", () => this.loadConfiguration());
    
    console.log("Simulation controls setup complete");
  }

  /**
   * Sets up parameter change listeners.
   */
  setupParameterListeners() {
    const parameterInputs = document.querySelectorAll('.parameter-input');
    parameterInputs.forEach(input => {
      input.addEventListener('change', () => this.onParameterChange());
      input.addEventListener('input', () => this.onParameterChange());
    });
    
    // Special handler for homogeneous toggle
    const homogeneousToggle = document.getElementById('isHomogeneous');
    if (homogeneousToggle) {
      homogeneousToggle.addEventListener('change', () => this.onHomogeneousToggle());
    }
    
    console.log(`Set up listeners for ${parameterInputs.length} parameter inputs`);
  }

  /**
   * Handles homogeneous/non-homogeneous toggle.
   */
  onHomogeneousToggle() {
    const isHomogeneous = document.getElementById('isHomogeneous').checked;
    const homogeneousParams = document.getElementById('homogeneousParams');
    const nonHomogeneousParams = document.getElementById('nonHomogeneousParams');
    
    if (homogeneousParams && nonHomogeneousParams) {
      homogeneousParams.style.display = isHomogeneous ? 'block' : 'none';
      nonHomogeneousParams.style.display = isHomogeneous ? 'none' : 'block';
    }
    
    this.onParameterChange();
  }

  /**
   * Creates a new random intersection graph based on current configuration.
   * @returns {Promise<boolean>} True if successful, false otherwise
   */
  async initializeGraph() {
    const startTime = performance.now();
    
    try {
      console.log("Initializing graph with config:", this.config);
      
      // Validate configuration
      const errors = validateConfig(this.config);
      if (errors.length > 0) {
        console.error("Configuration errors:", errors);
        this.showErrors(errors);
        return false;
      }

      // Create graph initializer and generate graph
      this.graphInitializer = new GraphInitializer(this.config);
      const { people, groups } = this.graphInitializer.createGraph();
      
      this.people = people;
      this.groups = groups;
      
      console.log(`Graph created: ${people.length} people, ${groups.length} groups`);
      
      // Create simulator
      this.simulator = new Simulator(this.people, this.groups, this.config);
      
      // Initialize tester if debugging is enabled
      if (this.config.enableStatistics) {
        this.tester = new Tester();
        this.simulator.setTester(this.tester);
      }
      
      // Initialize visualizer
      await this.initializeVisualizer();
      
      // Reset turn counter
      this.currentTurn = 0;
      this.updateTurnDisplay();
      this.updateStatistics();
      
      const duration = performance.now() - startTime;
      console.log(`Graph initialization complete in ${duration.toFixed(2)}ms`);
      
      // Track performance
      if (window.performanceMonitor) {
        window.performanceMonitor.recordRenderTime('GraphInitialization', duration);
      }
      
      return true;
      
    } catch (error) {
      console.error("Error initializing graph:", error);
      this.showError("Failed to initialize graph: " + error.message);
      return false;
    }
  }

  /**
   * Initializes the canvas visualizer.
   * @returns {Promise<void>}
   */
  async initializeVisualizer() {
    if (!this.canvas || !this.ctx) {
      console.error("Canvas not found");
      return;
    }

    try {
      const startTime = performance.now();
      
      // Set canvas size
      const rect = this.canvas.parentElement.getBoundingClientRect();
      this.canvas.width = rect.width - 32; // Account for padding
      this.canvas.height = rect.height - 32;
      
      console.log(`Canvas size: ${this.canvas.width}x${this.canvas.height}`);
      
      // Create visualizer
      this.visualizer = new CanvasVisualizer(
        this.canvas,
        this.ctx,
        this.canvas.width,
        this.canvas.height
      );
      
      // Initialize with data
      this.visualizer.initialize(this.groups, this.people);
      
      // Render asynchronously to avoid blocking
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          this.visualizer.render();
          resolve();
        });
      });
      
      const duration = performance.now() - startTime;
      console.log(`Visualizer initialized successfully in ${duration.toFixed(2)}ms`);
      
      // Track performance
      if (window.performanceMonitor) {
        window.performanceMonitor.recordRenderTime('VisualizerInitialization', duration);
      }
      
    } catch (error) {
      console.error("Error initializing visualizer:", error);
      this.showError("Failed to initialize visualizer: " + error.message);
    }
  }

  /**
   * Handles model type selection changes.
   */
  onModelTypeChange(newModelType) {
    console.log(`Model type changed to: ${newModelType}`);
    this.config.modelType = newModelType;
    
    // Update parameter visibility
    this.updateParameterVisibility();
    
    // Update simulator configuration
    if (this.simulator) {
      this.simulator.config.modelType = newModelType;
    }
    
    // Update display
    this.updateParameterDisplay();
    const modelDisplay = document.getElementById("currentModelDisplay");
    if (modelDisplay) {
      modelDisplay.textContent = this.formatModelName(newModelType);
    }
  }

  /**
   * Updates parameter control visibility based on selected model.
   */
  updateParameterVisibility() {
    const schellingParams = document.querySelectorAll('.schelling-params');
    const voterParams = document.querySelectorAll('.voter-params');
    const sirParams = document.querySelectorAll('.sir-params');
    const voterPairwiseParams = document.querySelectorAll('.voter-pairwise-params');
    const voterGroupParams = document.querySelectorAll('.voter-group-params');
    
    // Determine which parameter sections to show
    const showSchelling = this.config.modelType === MODEL_TYPES.SCHELLING_ONLY || 
                         this.config.modelType === MODEL_TYPES.COMBINED;
    const showVoter = this.config.modelType === MODEL_TYPES.VOTER_PAIRWISE || 
                     this.config.modelType === MODEL_TYPES.VOTER_GROUP ||
                     this.config.modelType === MODEL_TYPES.COMBINED;
    const showSIR = this.config.modelType === MODEL_TYPES.SIR_EPIDEMIC;
    const showVoterPairwise = this.config.modelType === MODEL_TYPES.VOTER_PAIRWISE;
    const showVoterGroup = this.config.modelType === MODEL_TYPES.VOTER_GROUP || 
                          this.config.modelType === MODEL_TYPES.COMBINED;
    
    // Update visibility
    schellingParams.forEach(elem => {
      elem.style.display = showSchelling ? 'block' : 'none';
    });
    
    voterParams.forEach(elem => {
      elem.style.display = showVoter ? 'block' : 'none';
    });
    
    sirParams.forEach(elem => {
      elem.style.display = showSIR ? 'block' : 'none';
    });
    
    voterPairwiseParams.forEach(elem => {
      elem.style.display = showVoterPairwise ? 'block' : 'none';
    });
    
    voterGroupParams.forEach(elem => {
      elem.style.display = showVoterGroup ? 'block' : 'none';
    });
    
    // Update model description
    const modelDescription = document.getElementById('modelDescription');
    if (modelDescription && MODEL_DESCRIPTIONS[this.config.modelType]) {
      modelDescription.textContent = MODEL_DESCRIPTIONS[this.config.modelType];
    }
  }

  /**
   * Handles parameter changes and validates input.
   */
  onParameterChange() {
    this.config = getCurrentConfig();
    
    const errors = validateConfig(this.config);
    if (errors.length > 0) {
      this.showErrors(errors);
    } else {
      this.clearErrors();
    }
    
    this.updateParameterDisplay();
  }

  /**
   * Takes a single simulation turn.
   */
  takeSingleTurn() {
    if (!this.simulator) {
      console.error("Simulator not initialized");
      return;
    }

    try {
      const results = this.simulator.takeTurn();
      this.currentTurn = results.turn;
      
      // Update visualization
      if (this.visualizer) {
        this.visualizer.updateData(this.groups, this.people);
        this.visualizer.render();
      }
      
      this.updateTurnDisplay();
      this.updateStatistics();
      
      // Check for convergence
      if (this.simulator.convergenceReached) {
        this.stopContinuousRun();
        this.showMessage("Simulation has converged!");
      }
      
      console.log(`Turn ${this.currentTurn} completed`);
      
    } catch (error) {
      console.error("Error taking turn:", error);
      this.showError("Error during simulation: " + error.message);
    }
  }

  /**
   * Takes multiple simulation turns.
   */
  takeMultipleTurns(numTurns) {
    console.log(`Taking ${numTurns} turns...`);
    for (let i = 0; i < numTurns && !this.simulator?.convergenceReached; i++) {
      this.takeSingleTurn();
    }
  }

  /**
   * Starts continuous simulation run.
   */
  startContinuousRun() {
    if (this.isRunning) return;
    
    console.log("Starting continuous run");
    this.isRunning = true;
    this.updateControlsState();
    
    this.runInterval = setInterval(() => {
      if (this.simulator?.convergenceReached || this.currentTurn >= this.config.maxTurns) {
        this.stopContinuousRun();
        return;
      }
      
      this.takeSingleTurn();
    }, this.config.simulationSpeed);
  }

  /**
   * Stops continuous simulation run.
   */
  stopContinuousRun() {
    if (!this.isRunning) return;
    
    console.log("Stopping continuous run");
    this.isRunning = false;
    this.updateControlsState();
    
    if (this.runInterval) {
      clearInterval(this.runInterval);
      this.runInterval = null;
    }
  }

  /**
   * Resets the simulation to initial state.
   */
  resetSimulation() {
    console.log("Resetting simulation");
    this.stopContinuousRun();
    this.applyParameters();
  }

  /**
   * Applies current parameter settings and reinitializes.
   * @returns {Promise<boolean>} True if successful, false otherwise
   */
  async applyParameters() {
    console.log("Applying parameters...");
    
    try {
      this.config = getCurrentConfig();
      
      const errors = validateConfig(this.config);
      if (errors.length > 0) {
        this.showErrors(errors);
        return false;
      }
      
      this.stopContinuousRun();
      
      const success = await this.initializeGraph();
      if (success) {
        console.log("Parameters applied successfully");
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error("Error applying parameters:", error);
      this.showError("Failed to apply parameters: " + error.message);
      return false;
    }
  }

  /**
   * Updates the control buttons' enabled/disabled state.
   */
  updateControlsState() {
    const runButton = document.getElementById("startRun");
    const stopButton = document.getElementById("stopRun");
    const turnButtons = ["takeTurn", "take10Turns", "take100Turns", "resetSim", "applyParams"];
    
    if (runButton) runButton.disabled = this.isRunning;
    if (stopButton) stopButton.disabled = !this.isRunning;
    
    turnButtons.forEach(id => {
      const button = document.getElementById(id);
      if (button) button.disabled = this.isRunning;
    });
  }

  /**
   * Updates the turn counter display.
   */
  updateTurnDisplay() {
    const turnDisplay = document.getElementById("turnCounter");
    if (turnDisplay) {
      turnDisplay.textContent = `Turn: ${this.currentTurn}`;
    }
  }

  /**
   * Updates the parameter display with current values.
   */
  updateParameterDisplay() {
    const paramDisplay = document.getElementById("parameterDisplay");
    if (paramDisplay) {
      paramDisplay.innerHTML = `
        <div>Model: ${this.formatModelName(this.config.modelType)}</div>
        <div>People: ${this.config.n}, Groups: ${this.config.m}</div>
        <div>λ: ${this.config.lambda}, c: ${this.config.c}</div>
        ${this.config.modelType !== MODEL_TYPES.SCHELLING_ONLY ? `<div>γ: ${this.config.gamma}</div>` : ''}
      `;
    }
  }

  /**
   * Updates the statistics display.
   */
  updateStatistics() {
    if (!this.simulator) return;
    
    try {
      const stats = this.simulator.getStatistics();
      const currentStats = stats.history.turns[stats.history.turns.length - 1];
      const networkMeasures = this.simulator.calculateNetworkMeasures();
      
      if (currentStats) {
        // Network statistics
        this.updateStatElement("totalEdges", currentStats.totalEdges);
        this.updateStatElement("averageDegree", networkMeasures.averageDegree.toFixed(2));
        this.updateStatElement("networkDensity", networkMeasures.density.toFixed(3));
        
        // Opinion statistics
        const positive = currentStats.totalOpinions[1] || 0;
        const negative = currentStats.totalOpinions[-1] || 0;
        const ratio = negative > 0 ? (positive / negative).toFixed(2) : "∞";
        
        this.updateStatElement("opinionPositive", positive);
        this.updateStatElement("opinionNegative", negative);
        this.updateStatElement("opinionRatio", ratio);
        
        // Dynamics statistics
        this.updateStatElement("segregationIndex", currentStats.segregationIndex.toFixed(3));
        this.updateStatElement("convergenceMetric", currentStats.convergenceMetric.toFixed(6));
        
        // Calculate homophilous clubs
        const homophilousClubs = this.groups.filter(group => {
          const gStats = group.getStatistics();
          if (gStats.memberCount === 0) return false;
          return Math.max(gStats.opinionProportions.positive, gStats.opinionProportions.negative) > 0.8;
        }).length;
        
        this.updateStatElement("homophilousClubs", `${homophilousClubs}/${this.groups.length}`);
      }
    } catch (error) {
      console.error("Error updating statistics:", error);
    }
  }

  /**
   * Updates a single statistic element.
   */
  updateStatElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }

  // Utility methods

  /**
   * Sets up a button with event handler.
   */
  setupButton(id, handler) {
    const button = document.getElementById(id);
    if (button) {
      button.addEventListener('click', handler);
    } else {
      console.warn(`Button ${id} not found`);
    }
  }

  /**
   * Formats model type name for display.
   */
  formatModelName(modelType) {
    const names = {
      [MODEL_TYPES.SCHELLING_ONLY]: "Schelling Only",
      [MODEL_TYPES.CLASSICAL_SCHELLING]: "Classical Schelling",
      [MODEL_TYPES.VOTER_PAIRWISE]: "Voter (Pairwise)", 
      [MODEL_TYPES.VOTER_GROUP]: "Voter (Group-based)",
      [MODEL_TYPES.COMBINED]: "Combined Model",
      [MODEL_TYPES.SIR_EPIDEMIC]: "SIR Epidemic Model"
    };
    return names[modelType] || modelType;
  }

  /**
   * Shows error messages to the user.
   */
  showErrors(errors) {
    console.error("Configuration errors:", errors);
    const errorContainer = document.getElementById("parameterErrors");
    if (errorContainer) {
      errorContainer.innerHTML = errors.map(error => `<div>${error}</div>`).join('');
      errorContainer.style.display = 'block';
    }
  }

  /**
   * Shows a single error message.
   */
  showError(message) {
    console.error(message);
    alert(message); // Simple fallback
  }

  /**
   * Shows an informational message.
   */
  showMessage(message) {
    console.log(message);
    alert(message); // Simple fallback
  }

  /**
   * Clears any displayed error messages.
   */
  clearErrors() {
    const errorContainer = document.getElementById("parameterErrors");
    if (errorContainer) {
      errorContainer.innerHTML = '';
      errorContainer.style.display = 'none';
    }
  }

  /**
   * Exports simulation data to CSV format.
   */
  exportData() {
    if (!this.simulator) {
      this.showError("No simulation data to export");
      return;
    }

    const stats = this.simulator.getStatistics();
    if (!stats.history.turns || stats.history.turns.length === 0) {
      this.showError("No turn data available to export");
      return;
    }

    // Create CSV content
    let csvContent = "turn,totalEdges,opinionPositive,opinionNegative,segregationIndex,convergenceMetric\n";
    
    stats.history.turns.forEach(turn => {
      const row = [
        turn.turn,
        turn.totalEdges,
        turn.totalOpinions[1] || 0,
        turn.totalOpinions[-1] || 0,
        turn.segregationIndex.toFixed(6),
        turn.convergenceMetric.toFixed(6)
      ].join(',');
      csvContent += row + '\n';
    });

    this.downloadFile(csvContent, 'simulation_data.csv', 'text/csv');
    this.showMessage("Simulation data exported successfully!");
  }

  /**
   * Exports current graph state to JSON format.
   */
  exportGraph() {
    if (!this.people || !this.groups) {
      this.showError("No graph data to export");
      return;
    }

    const graphData = {
      metadata: {
        exportDate: new Date().toISOString(),
        simulationTurn: this.currentTurn,
        modelType: this.config.modelType,
        parameters: this.config
      },
      nodes: this.people.map(person => ({
        id: person.id,
        type: "individual",
        opinion: person.getOpinion(),
        weight: person.weight,
        groupMemberships: Array.from(person.getGroups()).map(g => g.id),
        degree: person.getIntersectionDegree()
      })),
      groups: this.groups.map(group => ({
        id: group.id,
        type: "group", 
        weight: group.weight,
        memberCount: group.getMemberCount(),
        opinionCounts: {
          positive: group.getOpinionCount(1),
          negative: group.getOpinionCount(-1)
        },
        members: Array.from(group.getMembers()).map(p => p.id)
      })),
      edges: this.generateRIGEdges()
    };

    const jsonContent = JSON.stringify(graphData, null, 2);
    this.downloadFile(jsonContent, 'graph_state.json', 'application/json');
    this.showMessage("Graph state exported successfully!");
  }

  /**
   * Generates RIG edges for export.
   */
  generateRIGEdges() {
    const edges = [];
    const processed = new Set();

    this.people.forEach(person => {
      person.getNeighbors().forEach(neighbor => {
        const edgeId = [person.id, neighbor.id].sort().join('-');
        if (!processed.has(edgeId)) {
          processed.add(edgeId);
          
          // Find shared groups
          const sharedGroups = [];
          person.getGroups().forEach(group => {
            if (neighbor.getGroups().has(group)) {
              sharedGroups.push(group.id);
            }
          });

          edges.push({
            source: person.id,
            target: neighbor.id,
            sharedGroups: sharedGroups,
            strength: sharedGroups.length
          });
        }
      });
    });

    return edges;
  }

  /**
   * Exports current configuration to JSON.
   */
  exportConfiguration() {
    const configData = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: "1.0",
        description: "ClubViz simulation configuration"
      },
      configuration: this.config
    };

    const jsonContent = JSON.stringify(configData, null, 2);
    this.downloadFile(jsonContent, 'simulation_config.json', 'application/json');
    this.showMessage("Configuration exported successfully!");
  }

  /**
   * Loads configuration from file.
   */
  loadConfiguration() {
    const fileInput = document.getElementById('importConfig');
    fileInput.click();
    
    fileInput.onchange = (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const configData = JSON.parse(e.target.result);
          
          if (configData.configuration) {
            // Update configuration
            this.config = { ...this.config, ...configData.configuration };
            
            // Update UI elements
            this.updateUIFromConfig();
            this.updateParameterVisibility();
            
            this.showMessage("Configuration loaded successfully!");
          } else {
            this.showError("Invalid configuration file format");
          }
        } catch (error) {
          this.showError("Error loading configuration: " + error.message);
        }
      };
      
      reader.readAsText(file);
    };
  }

  /**
   * Updates UI elements from loaded configuration.
   */
  updateUIFromConfig() {
    // Update all parameter inputs
    Object.entries(this.config).forEach(([key, value]) => {
      const element = document.getElementById(key);
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = value;
        } else if (element.type === 'radio') {
          if (element.value === value) {
            element.checked = true;
          }
        } else {
          element.value = value;
        }
      }
    });

    // Update model selection
    const modelRadios = document.querySelectorAll('input[name="modelType"]');
    modelRadios.forEach(radio => {
      radio.checked = radio.value === this.config.modelType;
    });
  }

  /**
   * Downloads a file with given content.
   */
  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}
