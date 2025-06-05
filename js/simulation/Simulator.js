/**
 * @fileoverview Simulator class for Random Intersection Graph with Schelling and Voter models.
 * Implements the mathematical models from "Schelling and Voter Model on Random Intersection Graph" paper.
 */

import { MODEL_TYPES, getGFunction } from '../config.js';

/**
 * Manages the simulation of Schelling and/or Voter models on random intersection graphs.
 * Handles edge formation/deletion (Schelling) and opinion dynamics (Voter).
 */
export class Simulator {
  /**
   * Creates a new Simulator instance.
   * @param {Person[]} people - Array of Person objects (individual vertices)
   * @param {Group[]} groups - Array of Group objects (group vertices)
   * @param {object} config - Simulation configuration object
   */
  constructor(people, groups, config) {
    this.people = people;
    this.groups = groups;
    this.config = config;
    
    // Simulation state
    this.turnCounter = 0;
    this.isRunning = false;
    this.convergenceReached = false;
    
    // Model-specific functions
    this.gFunction = getGFunction(config);
    
    // Statistics tracking
    this.statistics = {
      turns: [],
      convergenceHistory: [],
      opinionChanges: [],
      edgeChanges: []
    };
    
    // Optional tester for detailed logging
    this.tester = null;
    
    console.log(`Simulator initialized with ${people.length} people, ${groups.length} groups`);
    console.log(`Model type: ${config.modelType}`);
  }

  /**
   * Sets a tester instance for detailed logging and debugging.
   * @param {Tester|null} tester - The tester instance or null to disable
   */
  setTester(tester) {
    this.tester = tester;
  }

  /**
   * Executes a single simulation turn based on the selected model type.
   * @returns {object} Turn results with statistics and changes
   */
  takeTurn() {
    this.turnCounter++;
    const turnResults = {
      turn: this.turnCounter,
      schelling: { edgeChanges: [], createdEdges: 0, deletedEdges: 0 },
      voter: { opinionChanges: [], changedOpinions: 0 },
      statistics: {}
    };

    // Prepare all entities for the new turn
    this.people.forEach(person => person.startTurn(this.turnCounter));
    
    // Execute model-specific dynamics
    switch (this.config.modelType) {
      case MODEL_TYPES.SCHELLING_ONLY:
        this.executeSchellingDynamics(turnResults);
        break;
      case MODEL_TYPES.VOTER_ONLY:
        this.executeVoterDynamics(turnResults);
        break;
      case MODEL_TYPES.COMBINED:
        this.executeSchellingDynamics(turnResults);
        this.executeVoterDynamics(turnResults);
        break;
    }

    // Record turn state and statistics
    this.recordTurnStatistics(turnResults);
    
    // Check for convergence
    this.checkConvergence(turnResults);
    
    // Log progress periodically
    if (this.turnCounter % this.config.statisticsInterval === 0) {
      this.logProgress(turnResults);
    }

    // Add easy access properties for compatibility
    turnResults.edgeChanges = turnResults.schelling.edgeChanges.length;
    turnResults.opinionChanges = turnResults.voter.opinionChanges.length;
    
    return turnResults;
  }

  /**
   * Executes Schelling model dynamics: edge creation and deletion.
   * Based on paper's formulation with rate c/m for creation and β function for deletion.
   * @param {object} turnResults - Turn results object to update
   */
  executeSchellingDynamics(turnResults) {
    const creationRate = this.config.c / this.groups.length; // c/m
    
    this.people.forEach(person => {
      this.groups.forEach(group => {
        const isConnected = person.isConnectedToGroup(group);
        
        if (!isConnected) {
          // Edge creation: probability c/m per person-group pair
          if (Math.random() < creationRate) {
            person.connectToGroup(group, this.turnCounter);
            turnResults.schelling.edgeChanges.push({
              type: 'create',
              personId: person.id,
              groupId: group.id,
              personOpinion: person.getOpinion()
            });
            turnResults.schelling.createdEdges++;
            
            if (this.tester) {
              this.tester.logEdgeCreation(person, group, creationRate);
            }
          }
        } else {
          // Edge deletion: probability β(aᵢ, k⁺ⱼ(t), k⁻ⱼ(t))
          const deletionProb = group.calculateEdgeDeletionRate(person, this.gFunction);
          
          if (Math.random() < deletionProb) {
            person.disconnectFromGroup(group, this.turnCounter);
            turnResults.schelling.edgeChanges.push({
              type: 'delete',
              personId: person.id,
              groupId: group.id,
              personOpinion: person.getOpinion(),
              deletionProb
            });
            turnResults.schelling.deletedEdges++;
            
            if (this.tester) {
              this.tester.logEdgeDeletion(person, group, deletionProb);
            }
          }
        }
      });
    });
  }

  /**
   * Executes Voter model dynamics: opinion changes based on social influence.
   * @param {object} turnResults - Turn results object to update
   */
  executeVoterDynamics(turnResults) {
    const gamma = this.config.gamma;
    const voterType = this.config.voterType;
    
    // Calculate opinion change probabilities for all people
    const opinionChangeData = this.people.map(person => ({
      person,
      changeProb: person.getOpinionChangeProb(gamma, voterType),
      currentOpinion: person.getOpinion()
    }));
    
    // Apply opinion changes
    opinionChangeData.forEach(({ person, changeProb, currentOpinion }) => {
      if (changeProb > 0 && Math.random() < changeProb) {
        const newOpinion = -currentOpinion; // Flip opinion
        const oldOpinion = currentOpinion;
        
        person.changeOpinion(newOpinion, this.turnCounter);
        
        // Update group opinion counts
        person.getGroups().forEach(group => {
          group.updateOpinionCounts(person, oldOpinion, newOpinion);
        });
        
        turnResults.voter.opinionChanges.push({
          personId: person.id,
          oldOpinion,
          newOpinion,
          changeProb,
          voterInfluence: person.turnState.voterInfluence
        });
        turnResults.voter.changedOpinions++;
        
        if (this.tester) {
          this.tester.logOpinionChange(person, oldOpinion, newOpinion, changeProb);
        }
      }
    });
    
    // Update intersection graph after all opinion changes
    this.people.forEach(person => person.updateIntersectionGraph());
  }

  /**
   * Records comprehensive statistics for the current turn.
   * @param {object} turnResults - Turn results object to update
   */
  recordTurnStatistics(turnResults) {
    // Group statistics
    this.groups.forEach(group => group.recordTurnState(this.turnCounter));
    
    // Overall statistics
    const stats = {
      turn: this.turnCounter,
      totalEdges: this.getTotalEdges(),
      totalOpinions: this.getOpinionDistribution(),
      groupStats: this.groups.map(g => g.getStatistics()),
      networkMeasures: this.calculateNetworkMeasures(),
      segregationIndex: this.calculateSegregationIndex(),
      convergenceMetric: this.calculateConvergenceMetric()
    };
    
    turnResults.statistics = stats;
    this.statistics.turns.push(stats);
  }

  /**
   * Checks if the simulation has reached convergence.
   * @param {object} turnResults - Turn results object to update
   */
  checkConvergence(turnResults) {
    const convergenceMetric = turnResults.statistics.convergenceMetric;
    this.statistics.convergenceHistory.push(convergenceMetric);
    
    // Check if last N turns have low variance (indicating convergence)
    const historyLength = 20;
    if (this.statistics.convergenceHistory.length >= historyLength) {
      const recentHistory = this.statistics.convergenceHistory.slice(-historyLength);
      const variance = this.calculateVariance(recentHistory);
      
      if (variance < this.config.convergenceThreshold) {
        this.convergenceReached = true;
        console.log(`Convergence reached at turn ${this.turnCounter} (variance: ${variance.toFixed(6)})`);
      }
    }
    
    // Stop simulation if max turns reached
    if (this.turnCounter >= this.config.maxTurns) {
      this.isRunning = false;
      console.log(`Simulation stopped: Maximum turns (${this.config.maxTurns}) reached`);
    }
  }

  /**
   * Logs detailed progress information.
   * @param {object} turnResults - Turn results from current turn
   */
  logProgress(turnResults) {
    const stats = turnResults.statistics;
    
    console.log(`\n=== Turn ${this.turnCounter} Progress ===`);
    console.log(`Model: ${this.config.modelType}`);
    
    if (this.config.modelType !== MODEL_TYPES.VOTER_ONLY) {
      console.log(`Schelling: +${turnResults.schelling.createdEdges} edges, -${turnResults.schelling.deletedEdges} edges`);
      console.log(`Total edges: ${stats.totalEdges}`);
    }
    
    if (this.config.modelType !== MODEL_TYPES.SCHELLING_ONLY) {
      console.log(`Voter: ${turnResults.voter.changedOpinions} opinion changes`);
    }
    
    console.log(`Opinions: +1: ${stats.totalOpinions[1] || 0}, -1: ${stats.totalOpinions[-1] || 0}`);
    console.log(`Segregation index: ${stats.segregationIndex.toFixed(3)}`);
    console.log(`Convergence metric: ${stats.convergenceMetric.toFixed(6)}`);
    
    // Group composition summary
    const groupSummary = stats.groupStats.map(g => 
      `G${g.id}(${g.memberCount}): ${g.opinionProportions.positive.toFixed(2)}+/${g.opinionProportions.negative.toFixed(2)}-`
    ).join(', ');
    console.log(`Groups: ${groupSummary}`);
  }

  /**
   * Calculates total number of person-group edges in the system.
   * @returns {number} Total edge count
   */
  getTotalEdges() {
    return this.people.reduce((total, person) => total + person.getGroupDegree(), 0);
  }

  /**
   * Gets the distribution of opinions across all people.
   * @returns {object} Object mapping opinion values to counts
   */
  getOpinionDistribution() {
    const distribution = {};
    this.people.forEach(person => {
      const opinion = person.getOpinion();
      distribution[opinion] = (distribution[opinion] || 0) + 1;
    });
    return distribution;
  }

  /**
   * Calculates network measures for the intersection graph.
   * @returns {object} Network statistics
   */
  calculateNetworkMeasures() {
    const totalDegree = this.people.reduce((sum, person) => sum + person.getIntersectionDegree(), 0);
    const averageDegree = this.people.length > 0 ? totalDegree / this.people.length : 0;
    
    return {
      averageDegree,
      totalDegree,
      density: this.people.length > 1 ? totalDegree / (this.people.length * (this.people.length - 1)) : 0
    };
  }

  /**
   * Calculates a segregation index measuring opinion clustering.
   * @returns {number} Segregation index (0 = mixed, 1 = perfectly segregated)
   */
  calculateSegregationIndex() {
    let totalHomophily = 0;
    let totalConnections = 0;
    
    this.people.forEach(person => {
      const neighbors = person.getNeighbors();
      if (neighbors.size > 0) {
        const sameOpinionNeighbors = Array.from(neighbors)
          .filter(neighbor => neighbor.getOpinion() === person.getOpinion()).length;
        totalHomophily += sameOpinionNeighbors / neighbors.size;
        totalConnections++;
      }
    });
    
    return totalConnections > 0 ? totalHomophily / totalConnections : 0;
  }

  /**
   * Calculates a metric for detecting convergence.
   * Based on rate of change in opinion distribution and edge structure.
   * @returns {number} Convergence metric (lower = more stable)
   */
  calculateConvergenceMetric() {
    if (this.statistics.turns.length < 2) return 1.0;
    
    const current = this.statistics.turns[this.statistics.turns.length - 1];
    const previous = this.statistics.turns[this.statistics.turns.length - 2];
    
    // Change in opinion distribution
    const opinionChange = Math.abs(
      (current.totalOpinions[1] || 0) - (previous.totalOpinions[1] || 0)
    ) / this.people.length;
    
    // Change in edge count
    const edgeChange = Math.abs(current.totalEdges - previous.totalEdges) / 
      Math.max(current.totalEdges, previous.totalEdges, 1);
    
    // Change in segregation
    const segregationChange = Math.abs(current.segregationIndex - previous.segregationIndex);
    
    return opinionChange + edgeChange + segregationChange;
  }

  /**
   * Calculates variance of an array of numbers.
   * @param {number[]} values - Array of numbers
   * @returns {number} Variance
   */
  calculateVariance(values) {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }

  /**
   * Gets comprehensive simulation statistics.
   * @returns {object} Complete statistics object
   */
  getStatistics() {
    const currentTurnStats = this.statistics.turns.length > 0 ? 
      this.statistics.turns[this.statistics.turns.length - 1] : null;
      
    return {
      // Easy access properties for compatibility
      currentTurn: this.turnCounter,
      totalEdges: currentTurnStats ? currentTurnStats.totalEdges : this.getTotalEdges(),
      opinionDistribution: currentTurnStats ? currentTurnStats.totalOpinions : this.getOpinionDistribution(),
      segregationIndex: currentTurnStats ? currentTurnStats.segregationIndex : this.calculateSegregationIndex(),
      convergenceMetric: currentTurnStats ? currentTurnStats.convergenceMetric : this.calculateConvergenceMetric(),
      
      // Full data structure
      turnCounter: this.turnCounter,
      convergenceReached: this.convergenceReached,
      config: this.config,
      finalState: {
        people: this.people.map(p => p.getStatistics()),
        groups: this.groups.map(g => g.getStatistics())
      },
      history: this.statistics
    };
  }

  /**
   * Resets the simulation to initial state.
   */
  reset() {
    this.turnCounter = 0;
    this.isRunning = false;
    this.convergenceReached = false;
    this.statistics = {
      turns: [],
      convergenceHistory: [],
      opinionChanges: [],
      edgeChanges: []
    };
    
    // Reset all entities
    this.people.forEach(person => {
      person.groups.clear();
      person.neighbors.clear();
      person.opinionHistory = [person.getOpinion()];
      person.connectionHistory = [];
    });
    
    this.groups.forEach(group => {
      group.members.clear();
      group.opinionCounts.set(1, 0);
      group.opinionCounts.set(-1, 0);
      group.membershipHistory = [];
      group.opinionHistory = [];
    });
    
    console.log("Simulation reset to initial state");
  }
}
