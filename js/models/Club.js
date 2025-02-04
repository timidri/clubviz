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
    // Draw club circle
    ctx.beginPath();
    ctx.arc(this.x, this.y, 80, 0, Math.PI * 2);
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.stroke();

    const mCount = this.getTraitCount('M');
    const fCount = this.getTraitCount('F');
    const total = this.getMemberCount();
    
    // Bar chart positioning
    const barWidth = 60;
    const barHeight = 20;
    const barX = this.x - barWidth/2;
    const barY = this.y - 120; // Moved up, above the circle
    
    // Draw background bar
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Draw trait bars
    if (total > 0) {
      ctx.fillStyle = '#2196f3';
      const mWidth = (mCount / total) * barWidth;
      ctx.fillRect(barX, barY, mWidth, barHeight);
      
      ctx.fillStyle = '#e91e63';
      const fWidth = (fCount / total) * barWidth;
      ctx.fillRect(barX + mWidth, barY, fWidth, barHeight);
    }

    // Draw counts above bar
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#2196f3';
    ctx.fillText(`M: ${mCount}`, barX, barY - 5);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#e91e63';
    ctx.fillText(`F: ${fCount}`, barX + barWidth, barY - 5);

    // Draw total centered above counts
    ctx.textAlign = 'center';
    ctx.fillStyle = 'black';
    ctx.fillText(`Members: ${total}`, this.x, barY - 20);

    // Draw club label below circle
    ctx.font = '14px Arial';
    ctx.fillText(`Club ${this.id}`, this.x, this.y + 100);
  }
}