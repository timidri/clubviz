/**
 * @fileoverview Manages the simulation state (running, stopped, turn count).
 */
export class StateController {
  constructor(dashboard) {
    this.dashboard = dashboard;
    this.isRunning = false;
    this.runInterval = null;
    this.currentTurn = 0;
  }

  /**
   * Starts a continuous simulation run.
   */
  startContinuousRun() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.dashboard.uiManager.updateControlsState(true);
    
    this.runInterval = setInterval(() => {
      if (this.dashboard.simulator?.convergenceReached || this.currentTurn >= this.dashboard.config.maxTurns) {
        this.stopContinuousRun();
        return;
      }
      this.dashboard.takeSingleTurn();
    }, this.dashboard.config.simulationSpeed);
  }

  /**
   * Stops the continuous simulation run.
   */
  stopContinuousRun() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    this.dashboard.uiManager.updateControlsState(false);
    
    if (this.runInterval) {
      clearInterval(this.runInterval);
      this.runInterval = null;
    }
  }

  /**
   * Resets the simulation to its initial state.
   */
  resetSimulation() {
    this.stopContinuousRun();
    this.currentTurn = 0;
    this.dashboard.uiManager.updateTurnDisplay(0);
    this.dashboard.applyParameters();
  }

  /**
   * Increments the turn counter.
   */
  incrementTurn() {
    this.currentTurn++;
    this.dashboard.uiManager.updateTurnDisplay(this.currentTurn);
  }
} 