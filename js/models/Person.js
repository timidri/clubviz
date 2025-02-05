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

  draw(ctx) {
    this.clubs.forEach((club) => {
      const pos = this.positions.get(club.id);
      if (!pos) return;

      const x = club.x + pos.radius * Math.cos(pos.angle);
      const y = club.y + pos.radius * Math.sin(pos.angle);

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2); // Smaller dots (5px -> 3px)
      ctx.fillStyle = this.trait === "M" ? "#2196f3" : "#e91e63";
      ctx.fill();
    });
  }
}
