/**
 * @fileoverview Main dashboard controller for the simulation.
 * Orchestrates all major components of the application.
 */
import { getCurrentConfig, validateConfig } from "../config.js";
import { GraphInitializer } from "../simulation/GraphInitializer.js";
import { Simulator } from "../simulation/Simulator.js";
import { CanvasVisualizer } from "./CanvasVisualizer.js";
import { DistributionAnalyzer } from "../analysis/DistributionAnalyzer.js";
import { DistributionChart } from "./DistributionChart.js";
import { UIManager } from '../ui/UIManager.js';
import { StateController } from '../state/StateController.js';
import { DataExporter } from '../io/DataExporter.js';

export class Dashboard {
  constructor() {
    this.config = getCurrentConfig();
    
    // Core components
    this.simulator = null;
    this.visualizer = null;
    this.distributionAnalyzer = new DistributionAnalyzer(this.config);
    
    // Helper modules
    this.uiManager = new UIManager(this);
    this.stateController = new StateController(this);
    this.dataExporter = new DataExporter(this);

    // Data
    this.people = [];
    this.groups = [];
    
    this.canvas = document.getElementById("visualization");
    this.ctx = this.canvas?.getContext("2d");
    this.distributionChart = new DistributionChart(document.getElementById('distributionAnalysisContainer'));
  }

  async initialize() {
    try {
      this.uiManager.initialize();
      await this.applyParameters();
      console.log("✅ Dashboard initialized successfully");
    } catch (error) {
      this.uiManager.showError(`Initialization failed: ${error.message}`);
      console.error("❌ Dashboard initialization failed:", error);
    }
  }

  async applyParameters() {
    this.config = getCurrentConfig();
    const errors = validateConfig(this.config);
    if (errors.length) {
      return this.uiManager.showErrors(errors);
    }
    this.uiManager.clearErrors();
    this.stateController.stopContinuousRun();
    
    try {
      await this.initializeGraph();
      this.uiManager.updateStatistics(this.simulator.getStatistics().history.turns.slice(-1)[0]);
    } catch(error) {
      this.uiManager.showError(`Failed to apply parameters: ${error.message}`);
    }
  }
  
  async initializeGraph() {
    const graphInitializer = new GraphInitializer(this.config);
    const { people, groups } = graphInitializer.createGraph();
    this.people = people;
    this.groups = groups;
    
    this.simulator = new Simulator(this.people, this.groups, this.config);
    this.distributionAnalyzer.reset(this.config);
    this.distributionChart.clear();
    
    await this.initializeVisualizer();
    this.stateController.currentTurn = 0;
    this.uiManager.updateTurnDisplay(0);
  }

  async initializeVisualizer() {
    if (!this.canvas || !this.ctx) return;
    
    this.visualizer = new CanvasVisualizer(this.canvas, this.ctx, this.canvas.width, this.canvas.height);
    this.visualizer.initialize(this.groups, this.people);
    this.visualizer.render();
  }

  takeSingleTurn() {
    if (!this.simulator) return;
    
    const results = this.simulator.takeTurn();
    this.stateController.incrementTurn();
    
    const opinionDistribution = this.simulator.getOpinionDistribution();
    this.distributionAnalyzer.recordEmpirical(opinionDistribution, this.stateController.currentTurn);
    
    const analysis = this.distributionAnalyzer.getAnalysis();
    this.distributionChart.updateAnalysis(analysis);
    
    this.visualizer.updateData(this.groups, this.people);
    this.visualizer.render();
    this.uiManager.updateStatistics(results.statistics);
    
    if (this.simulator.convergenceReached) {
      this.stateController.stopContinuousRun();
      this.uiManager.showMessage(`Convergence reached after ${this.stateController.currentTurn} turns.`, "🎯 Convergence Achieved!");
    }
  }
  
  takeMultipleTurns(numTurns) {
    for (let i = 0; i < numTurns && !this.simulator?.convergenceReached; i++) {
      this.takeSingleTurn();
    }
  }

  onModelTypeChange(newModelType) {
    this.config.modelType = newModelType;
    if (this.simulator) {
      this.simulator.config.modelType = newModelType;
    }
    this.uiManager.updateParameterVisibility();
    this.uiManager.updateParameterDisplay();
  }

  onParameterChange() {
    this.config = getCurrentConfig();
    const errors = validateConfig(this.config);
    if (errors.length > 0) {
      this.uiManager.showErrors(errors);
    } else {
      this.uiManager.clearErrors();
    }
    this.uiManager.updateParameterDisplay();
  }
}
