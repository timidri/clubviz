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
    
    // Calculate the proportion of trait B in the club
    const bCount = club.getTraitCount("B");
    const bProportion = bCount / totalCount;
    
    // Get threshold and probabilities
    const threshold = this.config.leaveProbabilityThreshold;
    const highProb = this.config.leaveHighProb !== undefined ? this.config.leaveHighProb : 1.0;
    const lowProb = this.config.leaveLowProb !== undefined ? this.config.leaveLowProb : 0.0;
    
    // Determine if B is underrepresented
    const isBUnderrepresented = bProportion < threshold;
    
    // Set leave probability based on trait and representation
    let prob;
    if (person.trait === "B") {
      // B members leave at high probability when B is underrepresented
      // B members leave at low probability when B is well-represented
      prob = isBUnderrepresented ? highProb : lowProb;
    } else { // person.trait === "R"
      // R members leave at low probability when B is underrepresented (R is well-represented)
      // R members leave at high probability when B is well-represented (R is underrepresented)
      prob = isBUnderrepresented ? lowProb : highProb;
    }

    // Debug logging - log every 100th calculation to avoid console spam
    if (Math.random() < 0.01) {
      console.log(`Leave probability for ${person.id} (${person.trait}) in club ${club.id}:`, {
        trait: person.trait,
        bCount,
        rCount: totalCount - bCount,
        totalCount,
        bProportion,
        rProportion: 1 - bProportion,
        threshold,
        isBUnderrepresented,
        highProb,
        lowProb,
        probability: prob,
        explanation: person.trait === "B" 
          ? (isBUnderrepresented ? "B underrepresented, B leaves at HIGH prob" : "B well-represented, B leaves at LOW prob")
          : (isBUnderrepresented ? "B underrepresented (R well-represented), R leaves at LOW prob" : "B well-represented (R underrepresented), R leaves at HIGH prob")
      });
    }

    return prob;
  }
} // end of class
