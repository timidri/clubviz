export class Simulator {
  constructor(people, clubs, config) {
    this.people = people;
    this.clubs = clubs;
    this.config = config;
    this.tester = null;
  }

  setTester(tester) {
    this.tester = tester;
  }

  takeTurn() {
    const results = [];
    
    // Debug counters
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
    
    // Count people by trait
    this.people.forEach(person => {
      stats.byTrait[person.trait].count++;
    });

    // For each person in the population
    this.people.forEach((person) => {
      person.startTurn();
      let didJoin = false;
      let didLeave = false;

      // Process each club for both joining and leaving
      this.clubs.forEach((club) => {
        const isMember = club.isMember(person);

        // Handle joining logic if not a member
        if (!isMember) {
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
            didJoin = true;
            stats.joins++;
            stats.byTrait[person.trait].joins++;
          }
        }
        // Handle leaving logic if already a member and didn't just join
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
            didLeave = true;
            stats.leaves++;
            stats.byTrait[person.trait].leaves++;
          }
        }
      });

      // Record the actions taken this turn
      results.push({
        personId: person.id,
        action:
          didJoin && didLeave
            ? "joined and left"
            : didJoin
            ? "joined"
            : didLeave
            ? "left"
            : "no action",
        memberOf: Array.from(person.clubs).map((c) => c.id),
      });
    });
    
    // Log turn statistics every 10 turns
    if (this.turnCounter === undefined) {
      this.turnCounter = 0;
    }
    this.turnCounter++;
    
    if (this.turnCounter % 10 === 0) {
      console.log(`Turn ${this.turnCounter} statistics:`, stats);
      
      // Log club compositions
      const clubStats = this.clubs.map(club => {
        const total = club.getMemberCount();
        const bCount = club.getTraitCount("B");
        const rCount = club.getTraitCount("R");
        return {
          clubId: club.id,
          total,
          bCount,
          rCount,
          bRatio: total > 0 ? bCount / total : 0,
          rRatio: total > 0 ? rCount / total : 0
        };
      });
      console.log("Club compositions:", clubStats);
    }

    return results;
  }

  joinClub(person, club) {
    person.joinClub(club);
  }

  leaveClub(person, club) {
    person.leaveClub(club);
    person.positions.delete(club.id);
  }

  calculateLeaveProbability(person, club) {
    if (!club) return 0;
    
    const totalCount = club.getMemberCount();
    
    // Avoid division by zero
    if (totalCount === 0) return 0;
    
    // Calculate the proportion of each trait in the club
    const bCount = club.getTraitCount("B");
    const rCount = club.getTraitCount("R");
    const bProportion = bCount / totalCount;
    const rProportion = rCount / totalCount;
    
    // Get threshold and probabilities
    const threshold = this.config.leaveProbabilityThreshold;
    const highProb = this.config.leaveHighProb !== undefined ? this.config.leaveHighProb : 1.0;
    const lowProb = this.config.leaveLowProb !== undefined ? this.config.leaveLowProb : 0.0;
    
    // Determine if the person's trait is underrepresented
    // For B trait: check if bProportion < threshold
    // For R trait: check if rProportion < (1 - threshold)
    const isUnderrepresented = person.trait === "B" 
      ? bProportion < threshold 
      : rProportion < (1 - threshold);
    
    // Set leave probability based on representation
    const prob = isUnderrepresented ? highProb : lowProb;

    // Debug logging - log every 100th calculation to avoid console spam
    if (Math.random() < 0.01) {
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
        probability: prob,
        explanation: isUnderrepresented 
          ? `${person.trait} underrepresented (${person.trait === "B" ? bProportion : rProportion} < ${person.trait === "B" ? threshold : (1-threshold)}), leaves at HIGH prob` 
          : `${person.trait} well-represented (${person.trait === "B" ? bProportion : rProportion} >= ${person.trait === "B" ? threshold : (1-threshold)}), leaves at LOW prob`
      });
    }

    return prob;
  }
} // end of class
