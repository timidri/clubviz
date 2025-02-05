export class Simulator {
  constructor(people, clubs) {
    this.people = people;
    this.clubs = clubs;
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
        // console.log(
        //   `person: ${person.id}, club: ${club.id}, isMember: ${isMember}`
        // );

        // Handle joining logic if not a member
        if (!isMember) {
          const joinProbability = 1 / this.clubs.length;
          const passedJoinCheck = Math.random() < joinProbability;
          if (this.tester) {
            this.tester.testJoin(
              person,
              club,
              joinProbability,
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
    const radius = 20 + Math.random() * 50; // Min 20px from center, max 70px
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
    const prob = traitProportion < 0.5 ? 1 : 0;
    // console.log(
    //   `traitCount: ${traitCount}, totalCount: ${totalCount}, proportion: ${traitProportion}, prob: ${prob}`
    // );
    return prob;
  }
}
