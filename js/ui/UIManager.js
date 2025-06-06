/**
 * @fileoverview Manages all UI interactions and DOM manipulation for the dashboard.
 */
import { MODEL_TYPES, MODEL_DESCRIPTIONS } from '../config.js';

export class UIManager {
  constructor(dashboard) {
    this.dashboard = dashboard;
  }

  /**
   * Initializes all UI components.
   */
  initialize() {
    this.setupModelSelection();
    this.setupSimulationControls();
    this.setupParameterListeners();
    this.updateParameterDisplay();
  }

  // --- Component Setup ---

  setupModelSelection() {
    const modelContainer = document.getElementById('modelSelection');
    if (!modelContainer) return;
    
    modelContainer.innerHTML = '';
    Object.entries(MODEL_TYPES).forEach(([key, value]) => {
      const label = this.createDOMElement('label', 'model-option');
      const radio = this.createDOMElement('input', '', { type: 'radio', name: 'modelType', value, id: `model-${value}` });
      radio.checked = value === this.dashboard.config.modelType;
      radio.addEventListener('change', () => this.dashboard.onModelTypeChange(value));
      
      const text = this.createDOMElement('span', '', {}, this.formatModelName(key));
      
      label.append(radio, text);
      modelContainer.appendChild(label);
    });
  }

  setupSimulationControls() {
    this.setupButton("takeTurn", () => this.dashboard.takeSingleTurn());
    this.setupButton("take10Turns", () => this.dashboard.takeMultipleTurns(10));
    this.setupButton("take100Turns", () => this.dashboard.takeMultipleTurns(100));
    this.setupButton("startRun", () => this.dashboard.stateController.startContinuousRun());
    this.setupButton("stopRun", () => this.dashboard.stateController.stopContinuousRun());
    this.setupButton("resetSim", () => this.dashboard.stateController.resetSimulation());
    this.setupButton("applyParams", () => this.dashboard.applyParameters());
    this.setupButton("exportData", () => this.dashboard.dataExporter.exportData());
    this.setupButton("exportGraph", () => this.dashboard.dataExporter.exportGraph());
    this.setupButton("exportConfig", () => this.dashboard.dataExporter.exportConfiguration());
    this.setupButton("loadConfig", () => this.dashboard.dataExporter.loadConfiguration());
  }
  
  setupParameterListeners() {
    document.querySelectorAll('.parameter-input').forEach(input => {
      input.addEventListener('change', () => this.dashboard.onParameterChange());
      input.addEventListener('input', () => this.dashboard.onParameterChange());
    });
    
    document.getElementById('isHomogeneous')?.addEventListener('change', () => this.onHomogeneousToggle());
  }
  
  // --- UI Updates ---

  updateParameterVisibility() {
    const { modelType } = this.dashboard.config;
    this.toggleElementVisibility('.schelling-params', modelType === MODEL_TYPES.SCHELLING_ONLY || modelType === MODEL_TYPES.COMBINED);
    this.toggleElementVisibility('.voter-params', modelType === MODEL_TYPES.VOTER_PAIRWISE || modelType === MODEL_TYPES.VOTER_GROUP || modelType === MODEL_TYPES.COMBINED);
    this.toggleElementVisibility('.sir-params', modelType === MODEL_TYPES.SIR_EPIDEMIC);
    this.toggleElementVisibility('.voter-pairwise-params', modelType === MODEL_TYPES.VOTER_PAIRWISE);
    this.toggleElementVisibility('.voter-group-params', modelType === MODEL_TYPES.VOTER_GROUP || modelType === MODEL_TYPES.COMBINED);
    
    const modelDescription = document.getElementById('modelDescription');
    if (modelDescription) {
      modelDescription.textContent = MODEL_DESCRIPTIONS[modelType] || '';
    }
  }

  updateControlsState(isRunning) {
    this.setButtonDisabled("startRun", isRunning);
    this.setButtonDisabled("stopRun", !isRunning);
    ["takeTurn", "take10Turns", "take100Turns", "resetSim", "applyParams"].forEach(id => {
      this.setButtonDisabled(id, isRunning);
    });
  }
  
  updateTurnDisplay(turn) {
    this.updateElementContent("turnCounter", `Turn: ${turn}`);
  }

  updateParameterDisplay() {
    const { config } = this.dashboard;
    const content = `
      <div>Model: ${this.formatModelName(config.modelType)}</div>
      <div>People: ${config.n}, Groups: ${config.m}</div>
      <div>λ: ${config.lambda}, c: ${config.c}</div>
      ${config.modelType !== MODEL_TYPES.SCHELLING_ONLY ? `<div>γ: ${config.gamma}</div>` : ''}
    `;
    this.updateElementContent("parameterDisplay", content, true);
  }

  updateStatistics(stats) {
    if (!stats) return;
    this.updateStatElement("totalEdges", stats.totalEdges);
    this.updateStatElement("avgDegree", stats.networkMeasures.avgDegree.toFixed(2));
    this.updateStatElement("networkDensity", stats.networkMeasures.density.toFixed(3));
    this.updateStatElement("giniCoefficient", stats.networkMeasures.gini.toFixed(3));
    
    const positive = stats.totalOpinions[1] || 0;
    const negative = stats.totalOpinions[-1] || 0;
    this.updateStatElement("opinionPositive", positive);
    this.updateStatElement("opinionNegative", negative);
    this.updateStatElement("opinionRatio", negative > 0 ? (positive / negative).toFixed(2) : "∞");
    
    this.updateStatElement("segregationIndex", stats.segregationIndex.toFixed(3));
    this.updateStatElement("convergenceMetric", stats.convergenceMetric.toFixed(6));
    
    this.updateStatElement("homophilousClubs", `${stats.homophilousClubs}/${this.dashboard.groups.length}`);
  }

  // --- Modals and Errors ---

  showError(message) { this.showMessage(message, "⚠️ Error"); }

  showMessage(message, title = "ℹ️ Information") {
    // Implementation for showing modal dialog
  }

  showErrors(errors) {
    const container = document.getElementById("parameterErrors");
    if (container) {
      container.innerHTML = errors.map(e => `<div>${e}</div>`).join('');
      container.style.display = 'block';
    }
  }

  clearErrors() {
    const container = document.getElementById("parameterErrors");
    if (container) {
      container.innerHTML = '';
      container.style.display = 'none';
    }
  }
  
  // --- DOM Helpers ---

  setupButton(id, handler) {
    document.getElementById(id)?.addEventListener('click', handler);
  }

  setButtonDisabled(id, isDisabled) {
    const button = document.getElementById(id);
    if (button) button.disabled = isDisabled;
  }
  
  updateElementContent(id, content, isHTML = false) {
    const element = document.getElementById(id);
    if(element) {
        if(isHTML) element.innerHTML = content;
        else element.textContent = content;
    }
  }

  updateStatElement(id, value) { this.updateElementContent(id, value); }
  
  toggleElementVisibility(selector, shouldShow) {
    document.querySelectorAll(selector).forEach(elem => {
      elem.style.display = shouldShow ? 'block' : 'none';
    });
  }

  createDOMElement(tag, className, props = {}, textContent = '') {
    const el = document.createElement(tag);
    el.className = className;
    Object.assign(el, props);
    if(textContent) el.textContent = textContent;
    return el;
  }
  
  formatModelName(modelKey) {
    return modelKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  onHomogeneousToggle() {
    const isHomogeneous = document.getElementById('isHomogeneous').checked;
    this.toggleElementVisibility('#homogeneousParams', isHomogeneous);
    this.toggleElementVisibility('#nonHomogeneousParams', !isHomogeneous);
    this.dashboard.onParameterChange();
  }
} 