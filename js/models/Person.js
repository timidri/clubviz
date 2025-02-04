export class Person {
  constructor(id, trait) {
    this.id = id;
    this.trait = trait;
    this.clubs = new Set();
    this.x = Math.random() * 100;
    this.y = Math.random() * 100;
  }

  canJoinClub(club) {
    return !this.clubs.has(club);
  }

  joinClub(club) {
    if (this.canJoinClub(club)) {
      club.addMember(this);
      this.clubs.add(club);
      return true;
    }
    return false;
  }

  leaveClub(club) {
    if (this.clubs.has(club)) {
      club.removeMember(this);
      this.clubs.delete(club);
      return true;
    }
    return false;
  }

  takeTurn(allClubs) {
    const canLeave = this.clubs.size > 0;
    const willAttemptJoining = !canLeave || Math.random() < 0.5;
    let didAction = false;

    if (willAttemptJoining && this.clubs.size < allClubs.length) {
      const availableClubs = allClubs.filter(club => this.canJoinClub(club));
      availableClubs.forEach(club => {
        if (Math.random() < (1 / allClubs.length)) {
          didAction = this.joinClub(club) || didAction;
        }
      });
    } else if (canLeave) {
      Array.from(this.clubs).forEach(club => {
        if (this.shouldLeaveClub(club)) {
          didAction = this.leaveClub(club) || didAction;
        }
      });
    }

    const finalClubs = Array.from(this.clubs);

    return {
      action: willAttemptJoining ?
        (didAction ? 'joined' : 'attempted join') :
        (didAction ? 'left' : 'attempted leave'),
      memberOf: finalClubs.map(c => c.id),
      clubDetails: finalClubs.map(club => ({
        id: club.id,
        size: club.getMemberCount(),
        trait: {
          [this.trait]: club.getTraitCount(this.trait),
          total: club.getMemberCount()
        }
      }))
    };
  }

  shouldLeaveClub(club) {
    if (!club) return false;
    const traitCount = club.getTraitCount(this.trait);
    const totalCount = club.getMemberCount();
    if (totalCount === 0) return true;
    const probability = 1 - (traitCount / totalCount);
    return Math.random() < probability;
  }
}