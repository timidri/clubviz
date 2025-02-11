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
      this.justJoined.add(club.id);
      
      const angle = Math.random() * Math.PI * 2;
      const minDimension = Math.min(window.innerWidth, window.innerHeight);
      const clubRadius = minDimension * 0.08; // Match the radius used in CanvasVisualizer
      const minRadius = clubRadius * 0.2; // 20% of club radius
      const maxRadius = clubRadius * 0.6; // 60% of club radius for better padding
      const radius = minRadius + Math.random() * (maxRadius - minRadius);
      
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
