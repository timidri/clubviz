/**
 * @fileoverview Dashboard class for controlling the Random Intersection Graph simulation.
 * Provides UI controls for model selection and parameter adjustment.
 * Based on "Schelling and Voter Model on Random Intersection Graph" paper.
 */

import { getCurrentConfig, validateConfig, MODEL_TYPES } from "../config.js";
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
   * Creates a new Dashboard instance and initializes the UI.
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
    
    // Initialize step by step
    try {
      this.initializeUI();
      this.applyParameters(); // This will create the initial graph and visualization
      console.log("Dashboard initialized successfully");
    } catch (error) {
      console.error("Dashboard initialization failed:", error);
      this.showError("Failed to initialize dashboard: " + error.message);
    }
  }

  /**
   * Initializes the user interface elements and event handlers.
   */
  initializeUI() {
    console.log("Setting up UI controls...");
    
    // Setup model selection
    this.setupModelSelection();
    
    // Setup simulation controls
    this.setupSimulationControls();
    
    // Setup parameter change listeners
    this.setupParameterListeners();
    
    // Initial parameter display update
    this.updateParameterDisplay();
    
    console.log("UI controls set up successfully");
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
    
    console.log(`Set up listeners for ${parameterInputs.length} parameter inputs`);
  }

  /**
   * Creates a new random intersection graph based on current configuration.
   */
  initializeGraph() {
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
      this.initializeVisualizer();
      
      // Reset turn counter
      this.currentTurn = 0;
      this.updateTurnDisplay();
      this.updateStatistics();
      
      console.log("Graph initialization complete");
      return true;
      
    } catch (error) {
      console.error("Error initializing graph:", error);
      this.showError("Failed to initialize graph: " + error.message);
      return false;
    }
  }

  /**
   * Initializes the canvas visualizer.
   */
  initializeVisualizer() {
    if (!this.canvas || !this.ctx) {
      console.error("Canvas not found");
      return;
    }

    try {
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
      this.visualizer.render();
      
      console.log("Visualizer initialized successfully");
      
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
    
    const showSchelling = this.config.modelType !== MODEL_TYPES.VOTER_ONLY;
    const showVoter = this.config.modelType !== MODEL_TYPES.SCHELLING_ONLY;
    
    schellingParams.forEach(elem => {
      elem.style.display = showSchelling ? 'block' : 'none';
    });
    
    voterParams.forEach(elem => {
      elem.style.display = showVoter ? 'block' : 'none';
    });
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
   */
  applyParameters() {
    console.log("Applying parameters...");
    this.config = getCurrentConfig();
    
    const errors = validateConfig(this.config);
    if (errors.length > 0) {
      this.showErrors(errors);
      return;
    }
    
    this.stopContinuousRun();
    
    if (this.initializeGraph()) {
      console.log("Parameters applied successfully");
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
      
      if (currentStats) {
        this.updateStatElement("totalEdges", currentStats.totalEdges);
        this.updateStatElement("opinionPositive", currentStats.totalOpinions[1] || 0);
        this.updateStatElement("opinionNegative", currentStats.totalOpinions[-1] || 0);
        this.updateStatElement("segregationIndex", currentStats.segregationIndex.toFixed(3));
        this.updateStatElement("convergenceMetric", currentStats.convergenceMetric.toFixed(6));
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
      [MODEL_TYPES.VOTER_ONLY]: "Voter Only", 
      [MODEL_TYPES.COMBINED]: "Combined Model"
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
}
