export class Tester {
  constructor() {
    this.reset();
  }

  reset() {
    this.stats = {
      join: { 
        attempts: 0,
        passedProbCheck: 0,
        actualRate: 0
      },
      leave: { 
        byClub: new Map()
      }
    };
  }

  recordAttempt(action, passedProbCheck, person, club, probability) {
    const type = action.includes('join') ? 'join' : 'leave';
    
    if (type === 'join') {
      this.stats.join.attempts++;
      if (passedProbCheck) this.stats.join.passedProbCheck++;
      this.stats.join.actualRate = this.stats.join.passedProbCheck / this.stats.join.attempts;
    } else {
      if (!this.stats.leave.byClub.has(club.id)) {
        this.stats.leave.byClub.set(club.id, {
          M: { attempts: 0, passedProbCheck: 0, expectedProb: 0, actualRate: 0 },
          F: { attempts: 0, passedProbCheck: 0, expectedProb: 0, actualRate: 0 }
        });
      }
      const clubStats = this.stats.leave.byClub.get(club.id);
      const traitStats = clubStats[person.trait];
      
      traitStats.attempts++;
      if (passedProbCheck) traitStats.passedProbCheck++;
      traitStats.expectedProb = probability;
      traitStats.actualRate = traitStats.passedProbCheck / traitStats.attempts;
    }
  }

  logStats() {
    console.log('Detailed Simulation Statistics:');
    
    // Join stats
    const joinStats = this.stats.join;
    console.log('\nJoin Statistics:');
    console.log(`Expected Probability: ${(1/3 * 100).toFixed(2)}%`);
    console.log(`Actual Rate: ${(joinStats.actualRate * 100).toFixed(2)}%`);
    
    // Leave stats
    console.log('\nLeave Statistics by Club:');
    this.stats.leave.byClub.forEach((stats, clubId) => {
      console.log(`\nClub ${clubId}:`);
      ['M', 'F'].forEach(trait => {
        const traitStats = stats[trait];
        if (traitStats.attempts > 0) {
          console.log(`${trait} - Expected: ${(traitStats.expectedProb * 100).toFixed(2)}%, ` +
                     `Actual: ${(traitStats.actualRate * 100).toFixed(2)}%`);
        }
      });
    });
  }
}