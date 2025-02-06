import { Visualizer } from "./Visualizer.js";

export class CanvasVisualizer extends Visualizer {
  constructor(canvas, ctx, width, height) {
    super(canvas, ctx, width, height);
    this.clubs = [];
    this.people = [];
  }

  initialize(clubs, people) {
    this.clubs = clubs;
    this.people = people;

    // Position clubs with proper spacing
    const padding = 100;
    const usableWidth = this.width - padding * 2;
    const spacing = usableWidth / (clubs.length - 1 || 1);

    clubs.forEach((club, i) => {
      club.x = padding + spacing * i;
      club.y = this.height / 2;
    });

    this.draw();
  }

  draw() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw clubs
    this.clubs.forEach((club) => this.drawClub(club));

    // Draw people
    this.people.forEach((person) => this.drawPerson(person));

    // Update legend
    const traitCounts = {
      M: this.people.filter((person) => person.trait === "M").length,
      F: this.people.filter((person) => person.trait === "F").length,
    };
    this.updateLegend(traitCounts);
  }

  drawClub(club) {
    // Draw club circle
    this.ctx.beginPath();
    this.ctx.arc(club.x, club.y, 80, 0, Math.PI * 2);
    this.ctx.strokeStyle = "#ccc";
    this.ctx.lineWidth = 2;
    this.ctx.fillStyle = "white";
    this.ctx.fill();
    this.ctx.stroke();

    const mCount = club.getTraitCount("M");
    const fCount = club.getTraitCount("F");
    const total = club.getMemberCount();

    // Bar chart positioning
    const barWidth = 60;
    const barHeight = 20;
    const barX = club.x - barWidth / 2;
    const barY = club.y - 120;

    // Draw background bar
    this.ctx.fillStyle = "#f0f0f0";
    this.ctx.fillRect(barX, barY, barWidth, barHeight);

    // Draw trait bars
    if (total > 0) {
      this.ctx.fillStyle = "#2196f3";
      const mWidth = (mCount / total) * barWidth;
      this.ctx.fillRect(barX, barY, mWidth, barHeight);

      this.ctx.fillStyle = "#e91e63";
      const fWidth = (fCount / total) * barWidth;
      this.ctx.fillRect(barX + mWidth, barY, fWidth, barHeight);
    }

    // Text settings
    const padding = 4;
    const countHeight = 14;
    this.ctx.font = "12px Arial";

    // Draw trait counts with background
    const mText = `M: ${mCount}`;
    const fText = `F: ${fCount}`;

    // Left side (M count)
    this.ctx.textAlign = "left";
    const mMetrics = this.ctx.measureText(mText);
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    this.ctx.fillRect(
      barX - padding,
      barY - countHeight - padding,
      mMetrics.width + padding * 2,
      countHeight
    );
    this.ctx.fillStyle = "#2196f3";
    this.ctx.fillText(mText, barX, barY - padding);

    // Right side (F count)
    this.ctx.textAlign = "left";
    const fMetrics = this.ctx.measureText(fText);
    const fBoxX = barX + barWidth - fMetrics.width - padding * 2;
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    this.ctx.fillRect(
      fBoxX,
      barY - countHeight - padding,
      fMetrics.width + padding * 2,
      countHeight
    );
    this.ctx.fillStyle = "#e91e63";
    this.ctx.fillText(fText, fBoxX + padding, barY - padding);

    // Draw ratio and total with backgrounds
    this.ctx.textAlign = "center";
    const ratio = total > 0 ? (mCount / fCount).toFixed(2) : "N/A";
    const ratioText = `M/F: ${ratio}`;
    const totalText = `Members: ${total}`;

    // Ratio text
    const ratioMetrics = this.ctx.measureText(ratioText);
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    this.ctx.fillRect(
      club.x - ratioMetrics.width / 2 - padding,
      barY - 50,
      ratioMetrics.width + padding * 2,
      countHeight
    );
    this.ctx.fillStyle = "black";
    this.ctx.fillText(ratioText, club.x, barY - 40);

    // Total members text
    const totalMetrics = this.ctx.measureText(totalText);
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    this.ctx.fillRect(
      club.x - totalMetrics.width / 2 - padding,
      barY - 35,
      totalMetrics.width + padding * 2,
      countHeight
    );
    this.ctx.fillStyle = "black";
    this.ctx.fillText(totalText, club.x, barY - 25);

    // Draw club label below circle
    this.ctx.font = "14px Arial";
    this.ctx.fillStyle = "black";
    this.ctx.textAlign = "center";
    this.ctx.fillText(`Club ${club.id}`, club.x, club.y + 100);
  }

  drawPerson(person) {
    person.positions.forEach((pos, clubId) => {
      const club = this.clubs.find((c) => c.id === clubId);
      if (!club) return;

      const x = club.x + Math.cos(pos.angle) * pos.radius;
      const y = club.y + Math.sin(pos.angle) * pos.radius;

      // Draw person
      this.ctx.beginPath();
      this.ctx.arc(x, y, 5, 0, Math.PI * 2);
      this.ctx.fillStyle = person.trait === "M" ? "#2196f3" : "#e91e63";
      this.ctx.fill();
    });
  }
}
