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
      R: this.people.filter((person) => person.trait === "R").length,
      B: this.people.filter((person) => person.trait === "B").length,
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

    const rCount = club.getTraitCount("R");
    const bCount = club.getTraitCount("B");
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
      this.ctx.fillStyle = "#e91e63";
      const rWidth = (rCount / total) * barWidth;
      this.ctx.fillRect(barX, barY, rWidth, barHeight);

      this.ctx.fillStyle = "#2196f3";
      const bWidth = (bCount / total) * barWidth;
      this.ctx.fillRect(barX + rWidth, barY, bWidth, barHeight);
    }

    // Text settings
    const padding = 4;
    const countHeight = 14;
    this.ctx.font = "12px Arial";

    // Draw trait counts with background
    const rText = `R: ${rCount}`;
    const bText = `B: ${bCount}`;

    // Left side (M count)
    this.ctx.textAlign = "left";
    const rMetrics = this.ctx.measureText(rText);
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    this.ctx.fillRect(
      barX - padding,
      barY - countHeight - padding,
      rMetrics.width + padding * 2,
      countHeight
    );
    this.ctx.fillStyle = "#e91e63";
    this.ctx.fillText(rText, barX, barY - padding);

    // Right side (F count)
    this.ctx.textAlign = "left";
    const bMetrics = this.ctx.measureText(bText);
    const bBoxX = barX + barWidth - bMetrics.width - padding * 2;
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    this.ctx.fillRect(
      bBoxX,
      barY - countHeight - padding,
      bMetrics.width + padding * 2,
      countHeight
    );
    this.ctx.fillStyle = "#2196f3";
    this.ctx.fillText(bText, bBoxX + padding, barY - padding);

    // Draw ratio and total with backgrounds
    this.ctx.textAlign = "center";
    const ratio = total > 0 ? (rCount / bCount).toFixed(2) : "N/A";
    const ratioText = `R/B: ${ratio}`;
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
      this.ctx.fillStyle = person.trait === "R" ? "#e91e63" : "#2196f3";
      this.ctx.fill();
    });
  }
}
