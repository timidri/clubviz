/**
 * @fileoverview Group class for Random Intersection Graph simulation.
 * Represents group vertices in the auxiliary bipartite graph.
 * Based on "Schelling and Voter Model on Random Intersection Graph" paper.
 */

/**
 * Represents a group vertex in the random intersection graph simulation.
 * Groups connect to individuals and facilitate the formation of the intersection graph.
 */
export class Group {
  /**
   * Creates a new Group instance.
   * @param {number} id - Unique identifier for this group
   * @param {number} weight - Group weight for connection probability (default: 1.0)
   */
  constructor(id, weight = 1.0) {
    this.id = id;
    this.weight = weight;    // Weight for Poisson connection probability
    
    // Members - Set of Person objects connected to this group
    this.members = new Set();
    
    // Opinion tracking for Schelling model
    this.opinionCounts = new Map(); // Maps opinion values to counts
    this.opinionCounts.set(1, 0);   // Count of members with opinion +1
    this.opinionCounts.set(-1, 0);  // Count of members with opinion -1
    
    // Statistics and history
    this.membershipHistory = [];    // Track membership changes over time
    this.opinionHistory = [];      // Track opinion composition over time
    
    // Visual properties for rendering
    this.position = { x: 0, y: 0 }; // Position in visualization
    this.color = "#CCCCCC";         // Default group color
  }

  /**
   * Adds a person to this group.
   * Updates opinion counts and membership tracking.
   * @param {Person} person - The person to add
   */
  addPerson(person) {
    if (!this.members.has(person)) {
      this.members.add(person);
      
      // Update opinion counts
      const opinion = person.getOpinion();
      this.opinionCounts.set(opinion, (this.opinionCounts.get(opinion) || 0) + 1);
      
      // Record membership change
      this.membershipHistory.push({
        turn: Date.now(), // Will be updated by simulator with proper turn number
        action: 'add',
        personId: person.id,
        opinion: opinion,
        newSize: this.members.size
      });
    }
  }

  /**
   * Removes a person from this group.
   * Updates opinion counts and membership tracking.
   * @param {Person} person - The person to remove
   */
  removePerson(person) {
    if (this.members.has(person)) {
      this.members.delete(person);
      
      // Update opinion counts
      const opinion = person.getOpinion();
      const currentCount = this.opinionCounts.get(opinion) || 0;
      this.opinionCounts.set(opinion, Math.max(0, currentCount - 1));
      
      // Record membership change
      this.membershipHistory.push({
        turn: Date.now(), // Will be updated by simulator with proper turn number
        action: 'remove',
        personId: person.id,
        opinion: opinion,
        newSize: this.members.size
      });
    }
  }

  /**
   * Updates opinion counts when a member changes their opinion.
   * Called by the simulator when opinion changes occur.
   * @param {Person} person - The person whose opinion changed
   * @param {number} oldOpinion - Previous opinion value
   * @param {number} newOpinion - New opinion value
   */
  updateOpinionCounts(person, oldOpinion, newOpinion) {
    if (this.members.has(person)) {
      // Decrease count for old opinion
      const oldCount = this.opinionCounts.get(oldOpinion) || 0;
      this.opinionCounts.set(oldOpinion, Math.max(0, oldCount - 1));
      
      // Increase count for new opinion
      const newCount = this.opinionCounts.get(newOpinion) || 0;
      this.opinionCounts.set(newOpinion, newCount + 1);
    }
  }

  /**
   * Gets the total number of members in this group.
   * @returns {number} Total member count
   */
  getMemberCount() {
    return this.members.size;
  }

  /**
   * Gets the count of members with a specific opinion.
   * @param {number} opinion - Opinion value (+1 or -1)
   * @returns {number} Count of members with that opinion
   */
  getOpinionCount(opinion) {
    return this.opinionCounts.get(opinion) || 0;
  }

  /**
   * Gets the proportion of members with a specific opinion.
   * @param {number} opinion - Opinion value (+1 or -1)
   * @returns {number} Proportion (0 to 1) of members with that opinion
   */
  getOpinionProportion(opinion) {
    const total = this.getMemberCount();
    return total > 0 ? this.getOpinionCount(opinion) / total : 0;
  }

  /**
   * Calculates the Schelling model edge deletion rate for a person.
   * Based on the paper's formula: β(aᵢ, k⁺ⱼ(t), k⁻ⱼ(t))
   * @param {Person} person - The person to calculate deletion rate for
   * @param {function} gFunction - The g function from configuration
   * @returns {number} Edge deletion probability (0 to 1)
   */
  calculateEdgeDeletionRate(person, gFunction) {
    const personOpinion = person.getOpinion(); // aᵢ
    const positiveCount = this.getOpinionCount(1);   // k⁺ⱼ
    const negativeCount = this.getOpinionCount(-1);  // k⁻ⱼ
    const totalCount = positiveCount + negativeCount;
    
    if (totalCount === 0) return 0; // No members, no deletion
    
    // Calculate the opinion fraction difference
    const opinionFraction = positiveCount / totalCount;
    const fractionDifference = opinionFraction - 0.5; // Deviation from balanced
    
    // Apply g function with person's opinion
    // Negative person opinion * positive fraction difference = higher deletion rate
    const gInput = -personOpinion * fractionDifference * 2; // Scale to [-1, 1]
    const deletionRate = gFunction(gInput);
    
    return Math.max(0, Math.min(1, deletionRate));
  }

  /**
   * Calculates voter model influence this group exerts on a person.
   * @param {Person} person - The person to calculate influence for
   * @returns {number} Influence value (-1 to +1)
   */
  calculateOpinionInfluence(person) {
    if (!this.members.has(person)) return 0;
    
    const totalMembers = this.getMemberCount();
    if (totalMembers <= 1) return 0; // No influence if alone in group
    
    // Calculate influence from other members (excluding the person themselves)
    const positiveCount = this.getOpinionCount(1);
    const negativeCount = this.getOpinionCount(-1);
    
    // Adjust counts to exclude the person
    const personOpinion = person.getOpinion();
    const adjustedPositive = positiveCount - (personOpinion === 1 ? 1 : 0);
    const adjustedNegative = negativeCount - (personOpinion === -1 ? 1 : 0);
    const otherMembers = adjustedPositive + adjustedNegative;
    
    if (otherMembers === 0) return 0;
    
    // Net influence is the weighted average of other members' opinions
    const netInfluence = (adjustedPositive - adjustedNegative) / otherMembers;
    return netInfluence;
  }

  /**
   * Checks if a person is a member of this group.
   * @param {Person} person - The person to check
   * @returns {boolean} True if the person is a member
   */
  isMember(person) {
    return this.members.has(person);
  }

  /**
   * Gets all members of this group.
   * @returns {Set<Person>} Set of Person objects (copy to prevent external modification)
   */
  getMembers() {
    return new Set(this.members);
  }

  /**
   * Gets members with a specific opinion.
   * @param {number} opinion - Opinion value (+1 or -1)
   * @returns {Person[]} Array of persons with that opinion
   */
  getMembersWithOpinion(opinion) {
    return Array.from(this.members).filter(person => person.getOpinion() === opinion);
  }

  /**
   * Sets the position for visualization.
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  setPosition(x, y) {
    this.position.x = x;
    this.position.y = y;
  }

  /**
   * Gets the position for visualization.
   * @returns {object} Object with x and y coordinates
   */
  getPosition() {
    return { ...this.position };
  }

  /**
   * Calculates statistics for this group.
   * @returns {object} Object containing various statistics
   */
  getStatistics() {
    const total = this.getMemberCount();
    const positive = this.getOpinionCount(1);
    const negative = this.getOpinionCount(-1);
    
    return {
      id: this.id,
      weight: this.weight,
      memberCount: total,
      opinionCounts: {
        positive,
        negative
      },
      opinionProportions: {
        positive: total > 0 ? positive / total : 0,
        negative: total > 0 ? negative / total : 0
      },
      diversity: total > 0 ? 1 - Math.pow(positive / total, 2) - Math.pow(negative / total, 2) : 0,
      memberIds: Array.from(this.members).map(p => p.id),
      position: this.getPosition()
    };
  }

  /**
   * Records current state for history tracking.
   * @param {number} turn - Current turn number
   */
  recordTurnState(turn) {
    this.opinionHistory.push({
      turn,
      positive: this.getOpinionCount(1),
      negative: this.getOpinionCount(-1),
      total: this.getMemberCount(),
      diversity: this.getStatistics().diversity
    });
    
    // Update turn numbers in recent membership history
    this.membershipHistory
      .filter(entry => entry.turn > turn - 1)
      .forEach(entry => entry.turn = turn);
  }

  /**
   * Creates a JSON-serializable representation of this group.
   * @returns {object} Serializable object representation
   */
  toJSON() {
    return {
      id: this.id,
      weight: this.weight,
      memberIds: Array.from(this.members).map(p => p.id),
      opinionCounts: Object.fromEntries(this.opinionCounts),
      position: this.getPosition(),
      membershipHistory: [...this.membershipHistory],
      opinionHistory: [...this.opinionHistory]
    };
  }
}

// Export as both Group and Club for backward compatibility
export { Group as Club };
