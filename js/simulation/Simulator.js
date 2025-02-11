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
          }
        }
        // Handle leaving logic if already a member and didn't just join
        else if (!person.isJustJoined(club)) {
          const leaveProbability = this.calculateLeaveProbability(person, club);
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

    return results;
  }

  joinClub(person, club) {
    person.joinClub(club);

    // Set position for visualization
    const angle = Math.random() * Math.PI * 2;
    const minDimension = Math.min(window.innerWidth, window.innerHeight);
    const clubRadius = minDimension * 0.08;
    const minRadius = clubRadius * 0.2;
    const maxRadius = clubRadius * 0.7;
    const radius = minRadius + Math.random() * (maxRadius - minRadius);
    person.positions.set(club.id, { angle, radius });
  }

  leaveClub(person, club) {
    person.leaveClub(club);
    person.positions.delete(club.id);
  }

  calculateLeaveProbability(person, club) {
    if (!club) return 0;
    const traitCount = club.getTraitCount(person.trait);
    const totalCount = club.getMemberCount();
    const traitProportion = traitCount / (1.0 * totalCount);
    
    // Ensure we have valid probability values, default to 1 and 0 if not set
    const highProb = this.config.leaveHighProb !== undefined ? this.config.leaveHighProb : 1.0;
    const lowProb = this.config.leaveLowProb !== undefined ? this.config.leaveLowProb : 0.0;
    
    const prob = traitProportion < this.config.leaveProbabilityThreshold 
      ? highProb 
      : lowProb;
    
    // Debug logging
    console.log(`Leave probability for ${person.id} in club ${club.id}:`, {
      trait: person.trait,
      traitCount,
      totalCount,
      proportion: traitProportion,
      threshold: this.config.leaveProbabilityThreshold,
      highProb,
      lowProb,
      probability: prob
    });
    
    return prob;
  }
} // end of class
