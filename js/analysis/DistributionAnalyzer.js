/**
 * @fileoverview Distribution Analyzer for theoretical vs empirical distribution comparison.
 * Analyzes stationary distributions and convergence patterns for different models.
 */

import { MODEL_TYPES } from '../config.js';

/**
 * Analyzes theoretical and empirical distributions for the simulation models.
 * Provides insights into stationary distributions and convergence behavior.
 */
export class DistributionAnalyzer {
  /**
   * Creates a new DistributionAnalyzer instance.
   * @param {object} config - Simulation configuration
   */
  constructor(config) {
    this.config = config;
    this.empiricalHistory = [];
    this.convergenceData = {
      detectedAt: null,
      finalDistribution: null,
      stabilityPeriod: 0
    };
  }

  /**
   * Records the current empirical distribution.
   * @param {object} opinionDistribution - Current opinion counts
   * @param {number} turn - Current turn number
   */
  recordEmpirical(opinionDistribution, turn) {
    const total = Object.values(opinionDistribution).reduce((sum, count) => sum + count, 0);
    const proportions = {};
    
    Object.entries(opinionDistribution).forEach(([opinion, count]) => {
      proportions[opinion] = total > 0 ? count / total : 0;
    });

    this.empiricalHistory.push({
      turn,
      proportions,
      total
    });

    // Check for convergence
    this.checkStationary(proportions, turn);
  }

  /**
   * Calculates theoretical stationary distribution based on model type.
   * @returns {object} Theoretical distribution proportions
   */
  calculateTheoreticalDistribution() {
    switch (this.config.modelType) {
      case MODEL_TYPES.CLASSICAL_SCHELLING:
        return this.calculateClassicalSchellingStationary();
      case MODEL_TYPES.SCHELLING_ONLY:
        return this.calculateSchellingStationary();
      case MODEL_TYPES.VOTER_PAIRWISE:
      case MODEL_TYPES.VOTER_GROUP:
        return this.calculateVoterStationary();
      case MODEL_TYPES.COMBINED:
        return this.calculateCombinedStationary();
      default:
        return this.calculateNeutralStationary();
    }
  }

  /**
   * Classical Schelling model tends toward perfect segregation.
   * @returns {object} Theoretical distribution
   */
  calculateClassicalSchellingStationary() {
    // Classical Schelling: agents segregate until homogeneous clubs
    // Theoretical: depends on initial distribution and club capacity
    const initialSplit = this.config.initialOpinionSplit;
    
    return {
      theoretical: {
        1: initialSplit,        // Proportion with +1 opinion
        [-1]: 1 - initialSplit, // Proportion with -1 opinion
      },
      description: "Classical Schelling: Perfect segregation preserving initial proportions",
      expectedPattern: "Clubs become homogeneous, but overall distribution preserved",
      convergenceType: "Segregated equilibrium"
    };
  }

  /**
   * Schelling model with dynamic networks.
   * @returns {object} Theoretical distribution
   */
  calculateSchellingStationary() {
    // Dynamic Schelling: edge formation/deletion based on homophily
    // Theoretical: similar to classical but with network effects
    const c = this.config.c;
    const steepness = this.config.gSteepness;
    
    // Higher steepness leads to stronger segregation
    const segregationStrength = Math.min(0.95, steepness / 10);
    
    return {
      theoretical: {
        1: this.config.initialOpinionSplit,
        [-1]: 1 - this.config.initialOpinionSplit
      },
      description: `Dynamic Schelling: Network-based segregation (strength: ${segregationStrength.toFixed(2)})`,
      expectedPattern: "Clustered networks with homophilous communities",
      convergenceType: "Network segregation equilibrium"
    };
  }

  /**
   * Voter model converges to consensus.
   * @returns {object} Theoretical distribution
   */
  calculateVoterStationary() {
    // Voter model: eventually all agents converge to same opinion
    // Which opinion wins depends on initial conditions and network structure
    const gamma = this.config.gamma;
    const initialSplit = this.config.initialOpinionSplit;
    
    // Simple approximation: majority opinion wins with probability based on initial split
    const prob1Wins = initialSplit > 0.5 ? 
      0.5 + (initialSplit - 0.5) * (1 + gamma) : 
      0.5 - (0.5 - initialSplit) * (1 + gamma);
    
    return {
      theoretical: {
        1: Math.max(0.01, Math.min(0.99, prob1Wins)),
        [-1]: Math.max(0.01, Math.min(0.99, 1 - prob1Wins))
      },
      description: "Voter Model: Consensus formation",
      expectedPattern: "Eventually all agents have same opinion",
      convergenceType: "Consensus equilibrium"
    };
  }

  /**
   * Combined model with both Schelling and Voter dynamics.
   * @returns {object} Theoretical distribution
   */
  calculateCombinedStationary() {
    // Combined: segregation competes with consensus formation
    const schellingEffect = this.config.c * this.config.gSteepness;
    const voterEffect = this.config.gamma;
    
    // Balance between segregation and consensus
    const segregationDominance = schellingEffect / (schellingEffect + voterEffect * 10);
    
    if (segregationDominance > 0.7) {
      // Segregation dominates
      return this.calculateSchellingStationary();
    } else if (segregationDominance < 0.3) {
      // Voter dominates
      return this.calculateVoterStationary();
    } else {
      // Mixed equilibrium
      const initialSplit = this.config.initialOpinionSplit;
      return {
        theoretical: {
          1: initialSplit,
          [-1]: 1 - initialSplit
        },
        description: "Combined Model: Mixed equilibrium",
        expectedPattern: "Partial segregation with some consensus formation",
        convergenceType: "Mixed equilibrium"
      };
    }
  }

  /**
   * Neutral stationary distribution (no dynamics).
   * @returns {object} Theoretical distribution
   */
  calculateNeutralStationary() {
    return {
      theoretical: {
        1: this.config.initialOpinionSplit,
        [-1]: 1 - this.config.initialOpinionSplit
      },
      description: "No dynamics: Initial distribution preserved",
      expectedPattern: "Distribution remains at initial state",
      convergenceType: "Static equilibrium"
    };
  }

  /**
   * Checks if the distribution has reached a stationary state.
   * @param {object} currentProportions - Current distribution proportions
   * @param {number} turn - Current turn number
   */
  checkStationary(currentProportions, turn) {
    const stabilityWindow = 50; // Number of turns to check for stability
    const tolerance = 0.01; // Acceptable variation in proportions

    if (this.empiricalHistory.length < stabilityWindow) return;

    // Check if distribution has been stable for the last window
    const recentHistory = this.empiricalHistory.slice(-stabilityWindow);
    const isStable = this.isDistributionStable(recentHistory, tolerance);

    if (isStable && !this.convergenceData.detectedAt) {
      this.convergenceData.detectedAt = turn;
      this.convergenceData.finalDistribution = { ...currentProportions };
      this.convergenceData.stabilityPeriod = stabilityWindow;
      
      console.log(`📊 Stationary distribution detected at turn ${turn}`);
      console.log(`Final proportions:`, currentProportions);
    }
  }

  /**
   * Checks if distribution has been stable over a period.
   * @param {Array} history - Recent history of distributions
   * @param {number} tolerance - Acceptable variation
   * @returns {boolean} True if stable
   */
  isDistributionStable(history, tolerance) {
    if (history.length < 2) return false;

    // Calculate variance of proportions over the period
    const opinions = Object.keys(history[0].proportions);
    
    for (const opinion of opinions) {
      const values = history.map(h => h.proportions[opinion] || 0);
      const variance = this.calculateVariance(values);
      
      if (variance > tolerance) return false;
    }

    return true;
  }

  /**
   * Calculates variance of an array of numbers.
   * @param {number[]} values - Array of numbers
   * @returns {number} Variance
   */
  calculateVariance(values) {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  /**
   * Gets comprehensive analysis of distributions.
   * @returns {object} Complete analysis results
   */
  getAnalysis() {
    const theoretical = this.calculateTheoreticalDistribution();
    const currentEmpirical = this.empiricalHistory.length > 0 ? 
      this.empiricalHistory[this.empiricalHistory.length - 1].proportions : {};

    // Calculate divergence between theoretical and empirical
    const divergence = this.calculateKLDivergence(theoretical.theoretical, currentEmpirical);

    return {
      theoretical,
      empirical: {
        current: currentEmpirical,
        history: this.empiricalHistory,
        convergence: this.convergenceData
      },
      comparison: {
        divergence,
        converged: !!this.convergenceData.detectedAt,
        convergenceTime: this.convergenceData.detectedAt,
        stability: this.assessStability()
      },
      recommendations: this.generateRecommendations(theoretical, currentEmpirical, divergence)
    };
  }

  /**
   * Calculates Kullback-Leibler divergence between distributions.
   * @param {object} p - First distribution
   * @param {object} q - Second distribution
   * @returns {number} KL divergence
   */
  calculateKLDivergence(p, q) {
    let divergence = 0;
    const opinions = new Set([...Object.keys(p), ...Object.keys(q)]);

    for (const opinion of opinions) {
      const pVal = p[opinion] || 0.001; // Avoid log(0)
      const qVal = q[opinion] || 0.001;
      
      if (pVal > 0) {
        divergence += pVal * Math.log(pVal / qVal);
      }
    }

    return divergence;
  }

  /**
   * Assesses the stability of the current distribution.
   * @returns {object} Stability assessment
   */
  assessStability() {
    if (this.empiricalHistory.length < 20) {
      return { level: 'insufficient_data', score: 0 };
    }

    const recent = this.empiricalHistory.slice(-20);
    const isStable = this.isDistributionStable(recent, 0.02);

    return {
      level: isStable ? 'stable' : 'changing',
      score: isStable ? 0.9 : 0.3,
      period: recent.length
    };
  }

  /**
   * Generates recommendations based on analysis.
   * @param {object} theoretical - Theoretical distribution info
   * @param {object} empirical - Current empirical distribution
   * @param {number} divergence - KL divergence
   * @returns {Array} Array of recommendation strings
   */
  generateRecommendations(theoretical, empirical, divergence) {
    const recommendations = [];

    if (divergence > 0.5) {
      recommendations.push("High divergence from theory - consider longer simulation or parameter adjustment");
    }

    if (!this.convergenceData.detectedAt && this.empiricalHistory.length > 500) {
      recommendations.push("No convergence detected - system may be in perpetual dynamics");
    }

    if (this.convergenceData.detectedAt && this.convergenceData.detectedAt < 100) {
      recommendations.push("Fast convergence detected - consider increasing parameters for richer dynamics");
    }

    if (theoretical.convergenceType === "Consensus equilibrium" && 
        Math.min(...Object.values(empirical)) > 0.1) {
      recommendations.push("Consensus model but no clear consensus - check voter model parameters");
    }

    return recommendations;
  }

  /**
   * Resets the analyzer for a new simulation.
   */
  reset() {
    this.empiricalHistory = [];
    this.convergenceData = {
      detectedAt: null,
      finalDistribution: null,
      stabilityPeriod: 0
    };
  }
} 