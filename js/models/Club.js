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
    ctx.strokeStyle = "#ccc";
    ctx.lineWidth = 2;
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.stroke();

    const mCount = this.getTraitCount("M");
    const fCount = this.getTraitCount("F");
    const total = this.getMemberCount();

    // Bar chart positioning
    const barWidth = 60;
    const barHeight = 20;
    const barX = this.x - barWidth / 2;
    const barY = this.y - 120;

    // Draw background bar
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Draw trait bars
    if (total > 0) {
      ctx.fillStyle = "#2196f3";
      const mWidth = (mCount / total) * barWidth;
      ctx.fillRect(barX, barY, mWidth, barHeight);

      ctx.fillStyle = "#e91e63";
      const fWidth = (fCount / total) * barWidth;
      ctx.fillRect(barX + mWidth, barY, fWidth, barHeight);
    }

    // Text settings
    const padding = 4;
    const countHeight = 14;
    ctx.font = "12px Arial";

    // Draw trait counts with background
    const mText = `M: ${mCount}`;
    const fText = `F: ${fCount}`;

    // Left side (M count)
    ctx.textAlign = "left";
    const mMetrics = ctx.measureText(mText);
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillRect(
      barX - padding,
      barY - countHeight - padding,
      mMetrics.width + padding * 2,
      countHeight
    );
    ctx.fillStyle = "#2196f3";
    ctx.fillText(mText, barX, barY - padding);

    // Right side (F count) - fixed positioning
    ctx.textAlign = "left";
    const fMetrics = ctx.measureText(fText);
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillRect(
      barX + mMetrics.width + padding * 3, // Position after M text
      barY - countHeight - padding,
      fMetrics.width + padding * 2,
      countHeight
    );
    ctx.fillStyle = "#e91e63";
    ctx.fillText(fText, barX + mMetrics.width + padding * 4, barY - padding);

    // Draw ratio and total with backgrounds
    ctx.textAlign = "center";
    const ratio = total > 0 ? (mCount / fCount).toFixed(2) : "N/A";
    const ratioText = `M/F: ${ratio}`;
    const totalText = `Members: ${total}`;

    // Ratio text
    const ratioMetrics = ctx.measureText(ratioText);
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillRect(
      this.x - ratioMetrics.width / 2 - padding,
      barY - 50,
      ratioMetrics.width + padding * 2,
      countHeight
    );
    ctx.fillStyle = "black";
    ctx.fillText(ratioText, this.x, barY - 40);

    // Total members text
    const totalMetrics = ctx.measureText(totalText);
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillRect(
      this.x - totalMetrics.width / 2 - padding,
      barY - 35,
      totalMetrics.width + padding * 2,
      countHeight
    );
    ctx.fillStyle = "black";
    ctx.fillText(totalText, this.x, barY - 25);

    // Draw club label below circle
    ctx.font = "14px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.fillText(`Club ${this.id}`, this.x, this.y + 100);
  }
}
