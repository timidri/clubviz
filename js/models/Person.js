export class Person {
  constructor(id, trait) {
    this.id = id;
    this.trait = trait;
    this.clubs = new Set();
    this.positions = new Map(); // Store positions for each club
    this.justJoined = new Set(); // Track clubs joined this turn
  }

  startTurn() {
    this.justJoined.clear(); // Reset clubs joined this turn
  }

  isJustJoined(club) {
    return this.justJoined.has(club.id);
  }

  canJoinClub(club) {
    return !this.clubs.has(club);
  }

  joinClub(club) {
    if (this.canJoinClub(club)) {
      club.addMember(this);
      this.clubs.add(club);
      this.justJoined.add(club.id); // Track that we just joined this club
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
}
