export class Club {
  constructor(id) {
    this.id = id;
    this.members = new Set();
    this.traitCounts = new Map();
    this.x = 0;
    this.y = 0;
  }

  addMember(person) {
    if (!this.members.has(person)) {
      this.members.add(person);
      this.updateTraitCount(person.trait, 1);
    }
  }

  removeMember(person) {
    if (this.members.delete(person)) {
      this.updateTraitCount(person.trait, -1);
    }
  }

  updateTraitCount(trait, delta) {
    const currentCount = this.traitCounts.get(trait) || 0;
    const newCount = currentCount + delta;
    if (newCount > 0) {
      this.traitCounts.set(trait, newCount);
    } else {
      this.traitCounts.delete(trait);
    }
  }

  getMemberCount() {
    return this.members.size;
  }

  getTraitCount(trait) {
    return this.traitCounts.get(trait) || 0;
  }

  draw(ctx) {
    // Draw club circle with larger radius
    ctx.beginPath();
    ctx.arc(this.x, this.y, 80, 0, Math.PI * 2);
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.stroke();

    // Draw label below circle
    ctx.fillStyle = 'black';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Club ${this.id}`, this.x, this.y + 100);

    // Draw member count above circle
    ctx.font = '12px Arial';
    ctx.fillText(`Members: ${this.getMemberCount()}`, this.x, this.y - 90);
  }
}