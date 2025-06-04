/**
 * @fileoverview Defines the Simulator class, which manages the simulation turns and logic.
 */

/**
 * Manages the simulation logic, including processing turns, handling person actions (joining/leaving clubs),
 * and calculating probabilities based on the provided configuration.
 */
export class Simulator {
  /**
   * Creates a new Simulator instance.
   * @param {Person[]} people - An array of Person objects.
   * @param {Club[]} clubs - An array of Club objects.
   * @param {object} config - The simulation configuration object.
   */
  constructor(people, clubs, config) {
    this.people = people;
    this.clubs = clubs;
    this.config = config;
    this.tester = null; // Optional Tester instance for debugging and stats collection
    this.turnCounter = 0; // Tracks the number of turns taken
  }

  /**
   * Sets a Tester instance for the simulator to use for logging and statistics.
   * @param {Tester|null} tester - The Tester instance or null to disable testing.
   */
  setTester(tester) {
    this.tester = tester;
  }

  /**
   * Executes a single simulation turn.
   * Iterates through each person and then through each club to process join/leave actions.
   * Collects statistics and logs them periodically.
   * @returns {object[]} An array of results, each describing an action taken by a person.
   */
  takeTurn() {
    const results = []; // Stores actions taken in this turn
    
    // Statistics for the current turn
    const stats = {
      totalPeople: this.people.length,
      joins: 0,
      leaves: 0,
      joinAttempts: 0,
      leaveAttempts: 0,
      byTrait: {
        R: { joins: 0, leaves: 0, count: 0 },
        B: { joins: 0, leaves: 0, count: 0 }
      }
    };
    
    // Pre-calculate total count of people by trait for this turn's stats
    this.people.forEach(person => {
      stats.byTrait[person.trait].count++;
    });

    // Iterate over each person in the simulation
    this.people.forEach((person) => {
      person.startTurn(); // Prepare person for the new turn (e.g., clear justJoined state)
      let didJoinThisTurn = false; // Track if person joined any club this turn
      let didLeaveThisTurn = false; // Track if person left any club this turn

      // Iterate over each club for potential actions (join or leave)
      this.clubs.forEach((club) => {
        const isMember = club.isMember(person);

        // --- Join Logic ---
        if (!isMember) {
          // Base probability of joining any specific club: k/C
          // k = config.joinProbability, C = total number of clubs
          const baseJoinProbability =
            this.config.joinProbability / this.clubs.length;
          stats.joinAttempts++;
          
          const passedJoinCheck = Math.random() < baseJoinProbability;
          if (this.tester) {
            this.tester.testJoin(
              person,
              club,
              baseJoinProbability,
              passedJoinCheck
            );
          }
          if (passedJoinCheck) {
            this.joinClub(person, club);
            didJoinThisTurn = true;
            stats.joins++;
            stats.byTrait[person.trait].joins++;
          }
        }
        // --- Leave Logic ---
        // A person can only leave if they are a member AND did not just join in this turn
        else if (!person.isJustJoined(club)) {
          const leaveProbability = this.calculateLeaveProbability(person, club);
          stats.leaveAttempts++;
          
          const passedLeaveCheck = Math.random() < leaveProbability;
          if (this.tester) {
            this.tester.testLeave(
              person,
              club,
              leaveProbability,
              passedLeaveCheck
            );
          }
          if (passedLeaveCheck) {
            this.leaveClub(person, club);
            didLeaveThisTurn = true;
            stats.leaves++;
            stats.byTrait[person.trait].leaves++;
          }
        }
      });

      // Record the overall action for this person in this turn
      results.push({
        personId: person.id,
        action:
          didJoinThisTurn && didLeaveThisTurn
            ? "joined and left"
            : didJoinThisTurn
            ? "joined"
            : didLeaveThisTurn
            ? "left"
            : "no action",
        memberOf: Array.from(person.clubs).map((c) => c.id), // List of club IDs person is member of
      });
    });
    
    this.turnCounter++;
    
    // Log detailed statistics every 10 turns
    if (this.turnCounter % 10 === 0) {
      console.log(`Turn ${this.turnCounter} statistics:`, stats);
      
      // Log current composition of each club
      const clubStats = this.clubs.map(c => {
        const total = c.getMemberCount();
        const bCount = c.getTraitCount("B");
        const rCount = c.getTraitCount("R");
        return {
          clubId: c.id,
          total,
          bCount,
          rCount,
          bRatio: total > 0 ? bCount / total : 0,
          rRatio: total > 0 ? rCount / total : 0
        };
      });
      console.log("Club compositions at end of turn:", clubStats);
    }

    return results;
  }

  /**
   * Helper method to handle a person joining a club.
   * @param {Person} person - The person joining.
   * @param {Club} club - The club being joined.
   */
  joinClub(person, club) {
    person.joinClub(club); // Delegate to Person.joinClub()
  }

  /**
   * Helper method to handle a person leaving a club.
   * @param {Person} person - The person leaving.
   * @param {Club} club - The club being left.
   */
  leaveClub(person, club) {
    person.leaveClub(club); // Delegate to Person.leaveClub()
  }

  /**
   * Calculates the probability of a person leaving a specific club.
   * The probability depends on whether the person's trait is underrepresented in the club.
   * @param {Person} person - The person considering leaving.
   * @param {Club} club - The club the person is a member of.
   * @returns {number} The probability (0.0 to 1.0) of the person leaving the club.
   */
  calculateLeaveProbability(person, club) {
    if (!club) return 0; // Should not happen if logic is correct
    
    const totalCount = club.getMemberCount();
    if (totalCount === 0) return 0; // Cannot leave an empty club (or if not a member)
    
    // Proportions of each trait in the club
    const bCount = club.getTraitCount("B");
    const rCount = club.getTraitCount("R");
    const bProportion = bCount / totalCount;
    const rProportion = rCount / totalCount;
    
    // Configuration parameters for leaving logic
    const threshold = this.config.leaveProbabilityThreshold; // t
    const highProb = this.config.leaveHighProb;             // p_high
    const lowProb = this.config.leaveLowProb;              // p_low
    
    // Determine if the person's trait is underrepresented in the club.
    // A trait is underrepresented if its proportion in the club is less than the threshold 't'.
    const personTraitProportion = (person.trait === "B" ? bProportion : rProportion);
    const isUnderrepresented = personTraitProportion < threshold;
    
    // Assign leave probability: high if underrepresented, low otherwise.
    const prob = isUnderrepresented ? highProb : lowProb;

    // Conditional debug logging (1% chance per calculation) to avoid console spam
    if (this.tester && Math.random() < 0.01) { // Only log if tester is active
      console.log(`Leave probability for ${person.id} (${person.trait}) in club ${club.id}:`, {
        trait: person.trait,
        bCount,
        rCount,
        totalCount,
        bProportion,
        rProportion,
        threshold,
        isUnderrepresented,
        highProb,
        lowProb,
        calculatedProbability: prob,
        explanation: isUnderrepresented 
          ? `${person.trait} underrepresented (${personTraitProportion.toFixed(2)} < ${threshold}), leaves at HIGH prob (${highProb})` 
          : `${person.trait} well-represented (${personTraitProportion.toFixed(2)} >= ${threshold}), leaves at LOW prob (${lowProb})`
      });
    }

    return prob;
  }
} // end of class Simulator
