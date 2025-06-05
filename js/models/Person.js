/**
 * @fileoverview Person class for Random Intersection Graph simulation.
 * Represents individual vertices with opinions and group memberships.
 * Based on "Schelling and Voter Model on Random Intersection Graph" paper.
 */

/**
 * Represents an individual in the random intersection graph simulation.
 * Each person has an opinion (+1 or -1) and can be connected to multiple groups.
 */
export class Person {
  /**
   * Creates a new Person instance.
   * @param {number} id - Unique identifier for this person
   * @param {number} opinion - Initial opinion (+1 or -1)
   * @param {number} weight - Individual weight for connection probability (default: 1.0)
   */
  constructor(id, opinion = 1, weight = 1.0) {
    this.id = id;
    this.opinion = opinion;  // +1 or -1 (replaces the old "trait" concept)
    this.weight = weight;    // Weight for Poisson connection probability
    
    // Group connections - Set of Group objects this person is connected to
    this.groups = new Set();
    
    // Individual connections - Set of other Person objects (intersection graph)
    this.neighbors = new Set();
    
    // Statistics and state tracking
    this.opinionHistory = [opinion]; // Track opinion changes over time
    this.connectionHistory = [];     // Track connection events
    this.lastOpinionChange = 0;      // Turn when opinion last changed
    
    // Internal state for turn processing
    this.turnState = {
      newConnections: new Set(),     // Groups joined this turn
      lostConnections: new Set(),    // Groups left this turn
      opinionChanged: false,         // Whether opinion changed this turn
      voterInfluence: 0             // Accumulated influence for voter model
    };
  }

  /**
   * Gets the current opinion of this person.
   * @returns {number} Opinion value (+1 or -1)
   */
  getOpinion() {
    return this.opinion;
  }

  /**
   * Changes the person's opinion (used in voter model).
   * @param {number} newOpinion - New opinion value (+1 or -1)
   * @param {number} turn - Current turn number
   */
  changeOpinion(newOpinion, turn) {
    if (newOpinion !== this.opinion) {
      const oldOpinion = this.opinion;
      this.opinion = newOpinion;
      this.lastOpinionChange = turn;
      this.opinionHistory.push(newOpinion);
      this.turnState.opinionChanged = true;
      
      // Log opinion change for debugging
      console.log(`Person ${this.id}: Opinion changed from ${oldOpinion} to ${newOpinion} at turn ${turn}`);
    }
  }

  /**
   * Connects this person to a group (creates edge in auxiliary graph).
   * @param {Group} group - The group to connect to
   * @param {number} turn - Current turn number
   */
  connectToGroup(group, turn) {
    if (!this.groups.has(group)) {
      this.groups.add(group);
      group.addPerson(this);
      this.turnState.newConnections.add(group);
      
      // Update intersection graph - connect to all other members of this group
      this.updateIntersectionGraph();
      
      this.connectionHistory.push({
        turn,
        action: 'connect',
        groupId: group.id,
        groupSize: group.members.size
      });
    }
  }

  /**
   * Disconnects this person from a group (removes edge in auxiliary graph).
   * @param {Group} group - The group to disconnect from
   * @param {number} turn - Current turn number
   */
  disconnectFromGroup(group, turn) {
    if (this.groups.has(group)) {
      this.groups.delete(group);
      group.removePerson(this);
      this.turnState.lostConnections.add(group);
      
      // Update intersection graph - may lose connections to other individuals
      this.updateIntersectionGraph();
      
      this.connectionHistory.push({
        turn,
        action: 'disconnect',
        groupId: group.id,
        groupSize: group.members.size
      });
    }
  }

  /**
   * Updates the intersection graph connections based on current group memberships.
   * Two individuals are connected if they share at least one group.
   */
  updateIntersectionGraph() {
    // Clear current neighbor connections
    this.neighbors.clear();
    
    // For each group this person belongs to
    this.groups.forEach(group => {
      // Connect to all other members of that group
      group.members.forEach(otherPerson => {
        if (otherPerson !== this) {
          this.neighbors.add(otherPerson);
          otherPerson.neighbors.add(this); // Symmetric connection
        }
      });
    });
  }

  /**
   * Calculates the voter model influence on this person.
   * Influence depends on neighbors' opinions and connection strength.
   * @param {string} voterType - Type of voter model ('individual' or 'group')
   * @returns {number} Net influence towards opinion change (-1 to +1)
   */
  calculateVoterInfluence(voterType = 'group') {
    let influence = 0;
    let totalWeight = 0;

    if (voterType === 'individual') {
      // Individual-based: influence from direct neighbors in intersection graph
      this.neighbors.forEach(neighbor => {
        const weight = 1; // Equal weight for all neighbors
        influence += neighbor.opinion * weight;
        totalWeight += weight;
      });
    } else if (voterType === 'group') {
      // Group-based: influence from group composition
      this.groups.forEach(group => {
        const groupInfluence = group.calculateOpinionInfluence(this);
        const weight = group.members.size; // Larger groups have more influence
        influence += groupInfluence * weight;
        totalWeight += weight;
      });
    }

    // Normalize influence to [-1, 1] range
    const normalizedInfluence = totalWeight > 0 ? influence / totalWeight : 0;
    this.turnState.voterInfluence = normalizedInfluence;
    
    return normalizedInfluence;
  }

  /**
   * Calculates the probability of changing opinion in the voter model.
   * @param {number} gamma - Base opinion change rate
   * @param {string} voterType - Type of voter model
   * @returns {number} Probability of opinion change (0 to 1)
   */
  getOpinionChangeProb(gamma, voterType) {
    const influence = this.calculateVoterInfluence(voterType);
    
    // Opinion change probability is higher when influence opposes current opinion
    const oppositeInfluence = -this.opinion * influence;
    
    // Only change opinion if influence is in opposite direction
    if (oppositeInfluence <= 0) return 0;
    
    // Probability proportional to influence strength and base rate
    return Math.min(1, gamma * oppositeInfluence);
  }

  /**
   * Adds this person to a group (simple version for initialization).
   * @param {Group} group - The group to add this person to
   */
  addToGroup(group) {
    this.groups.add(group);
  }

  /**
   * Gets all groups this person belongs to.
   * @returns {Set<Group>} Set of Group objects
   */
  getGroups() {
    return new Set(this.groups); // Return copy to prevent external modification
  }

  /**
   * Gets all individual neighbors in the intersection graph.
   * @returns {Set<Person>} Set of Person objects this person is connected to
   */
  getNeighbors() {
    return new Set(this.neighbors); // Return copy to prevent external modification
  }

  /**
   * Checks if this person is connected to a specific group.
   * @param {Group} group - Group to check connection to
   * @returns {boolean} True if connected to the group
   */
  isConnectedToGroup(group) {
    return this.groups.has(group);
  }

  /**
   * Checks if this person is connected to another person in intersection graph.
   * @param {Person} otherPerson - Person to check connection to
   * @returns {boolean} True if connected to the other person
   */
  isConnectedToPerson(otherPerson) {
    return this.neighbors.has(otherPerson);
  }

  /**
   * Gets the degree (number of connections) in the intersection graph.
   * @returns {number} Number of individual connections
   */
  getIntersectionDegree() {
    return this.neighbors.size;
  }

  /**
   * Gets the number of group memberships.
   * @returns {number} Number of groups this person belongs to
   */
  getGroupDegree() {
    return this.groups.size;
  }

  /**
   * Prepares this person for a new simulation turn.
   * Clears turn-specific state and prepares for new actions.
   * @param {number} turn - Current turn number
   */
  startTurn(turn) {
    // Reset turn state
    this.turnState = {
      newConnections: new Set(),
      lostConnections: new Set(),
      opinionChanged: false,
      voterInfluence: 0
    };
  }

  /**
   * Gets statistics about this person for analysis.
   * @returns {object} Object containing various statistics
   */
  getStatistics() {
    return {
      id: this.id,
      opinion: this.opinion,
      weight: this.weight,
      groupDegree: this.getGroupDegree(),
      intersectionDegree: this.getIntersectionDegree(),
      opinionChanges: this.opinionHistory.length - 1,
      lastOpinionChange: this.lastOpinionChange,
      voterInfluence: this.turnState.voterInfluence,
      groupMemberships: Array.from(this.groups).map(g => g.id),
      neighborIds: Array.from(this.neighbors).map(p => p.id)
    };
  }

  /**
   * Creates a JSON-serializable representation of this person.
   * Useful for debugging and data export.
   * @returns {object} Serializable object representation
   */
  toJSON() {
    return {
      id: this.id,
      opinion: this.opinion,
      weight: this.weight,
      groupIds: Array.from(this.groups).map(g => g.id),
      neighborIds: Array.from(this.neighbors).map(p => p.id),
      opinionHistory: [...this.opinionHistory],
      connectionHistory: [...this.connectionHistory]
    };
  }
}
