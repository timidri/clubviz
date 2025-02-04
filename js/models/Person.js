export class Person {
  constructor(id, trait) {
    this.id = id;
    this.trait = trait;
    this.clubs = new Set();
    this.positions = new Map(); // Store positions for each club
  }

  canJoinClub(club) {
    return !this.clubs.has(club);
  }

  joinClub(club) {
    if (this.canJoinClub(club)) {
      club.addMember(this);
      this.clubs.add(club);
      // Use larger radius for dot placement
      const angle = Math.random() * Math.PI * 2;
      const radius = 20 + Math.random() * 50; // Min 20px from center, max 70px
      this.positions.set(club.id, { angle, radius });
      return true;
    }
    return false;
  }

  leaveClub(club) {
    if (this.clubs.has(club)) {
      club.removeMember(this);
      this.clubs.delete(club);
      this.positions.delete(club.id);
      return true;
    }
    return false;
  }

  takeTurn(allClubs, tester = null) {
    const canLeave = this.clubs.size > 0;
    const willAttemptJoining = !canLeave || Math.random() < 0.5;
    let didAction = false;
    let actionClub = null;

    if (willAttemptJoining && this.clubs.size < allClubs.length) {
      const joinProbability = 1 / allClubs.length;
      const availableClubs = allClubs.filter(club => this.canJoinClub(club));
      
      availableClubs.forEach(club => {
        const passedCheck = Math.random() < joinProbability;
        if (tester) {
          tester.recordAttempt('join', passedCheck, this, club, joinProbability);
        }
        if (passedCheck) {
          this.joinClub(club);
          didAction = true;
          actionClub = club;
        }
      });
    } else if (canLeave) {
      Array.from(this.clubs).forEach(club => {
        const leaveProbability = this.getLeaveProbability(club);
        const passedCheck = Math.random() < leaveProbability;
        if (tester) {
          tester.recordAttempt('leave', passedCheck, this, club, leaveProbability);
        }
        if (passedCheck) {
          this.leaveClub(club);
          didAction = true;
          actionClub = club;
        }
      });
    }

    return {
      action: willAttemptJoining ?
        (didAction ? 'joined' : 'attempted join') :
        (didAction ? 'left' : 'attempted leave'),
      memberOf: Array.from(this.clubs).map(c => c.id)
    };
  }

  getLeaveProbability(club) {
    if (!club) return 0;
    const traitCount = club.getTraitCount(this.trait);
    const totalCount = club.getMemberCount();
    return totalCount === 0 ? 1 : 1 - (traitCount / totalCount);
  }

  shouldLeaveClub(club) {
    return Math.random() < this.getLeaveProbability(club);
  }

  draw(ctx) {
    this.clubs.forEach(club => {
      const pos = this.positions.get(club.id);
      if (!pos) return;

      const x = club.x + pos.radius * Math.cos(pos.angle);
      const y = club.y + pos.radius * Math.sin(pos.angle);

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2); // Smaller dots (5px -> 3px)
      ctx.fillStyle = this.trait === 'M' ? '#2196f3' : '#e91e63';
      ctx.fill();
    });
  }
}