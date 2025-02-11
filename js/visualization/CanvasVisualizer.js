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

    // Calculate grid dimensions with optimized padding
    const padding = 100; // Reduced padding for better space utilization
    const clubRadius = 80;
    const minSpacing = clubRadius * 3; // Reduced minimum spacing between clubs
    const usableWidth = this.width - padding * 2;
    const usableHeight = this.height - padding * 2;

    // Calculate optimal number of columns based on available width and number of clubs
    const maxColumns = Math.floor(usableWidth / minSpacing);
    const numColumns = Math.min(maxColumns, Math.ceil(Math.sqrt(clubs.length)));
    const numRows = Math.ceil(clubs.length / numColumns);

    // Calculate actual spacing with dynamic adjustment based on available space
    const horizontalSpacing = usableWidth / Math.max(numColumns - 1, 1);
    const verticalSpacing = usableHeight / Math.max(numRows - 1, 1);

    // Position clubs in grid with adjusted spacing
    clubs.forEach((club, i) => {
      const row = Math.floor(i / numColumns);
      const col = i % numColumns;
      club.x = padding + col * horizontalSpacing;
      club.y = padding + row * verticalSpacing + 50; // Added vertical offset
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

    // Bar chart positioning - moved higher above the circle
    const barWidth = 60;
    const barHeight = 20;
    const barX = club.x - barWidth / 2;
    const barY = club.y - 140; // Increased distance from circle center

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
    const padding = 6;
    const countHeight = 18;
    this.ctx.font = "14px Arial";

    // Draw trait counts on the sides of the bar with background
    // Left side count (R) in red
    const rCountText = rCount.toString();
    const rCountMetrics = this.ctx.measureText(rCountText);
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    this.ctx.fillRect(
      barX - padding - rCountMetrics.width - padding,
      barY + barHeight/2 - countHeight/2,
      rCountMetrics.width + padding * 2,
      countHeight
    );
    this.ctx.textAlign = "right";
    this.ctx.fillStyle = "#e91e63";
    this.ctx.fillText(rCount, barX - padding, barY + barHeight/2 + 5);

    // Right side count (B) in blue
    const bCountText = bCount.toString();
    const bCountMetrics = this.ctx.measureText(bCountText);
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    this.ctx.fillRect(
      barX + barWidth + padding,
      barY + barHeight/2 - countHeight/2,
      bCountMetrics.width + padding * 2,
      countHeight
    );
    this.ctx.textAlign = "left";
    this.ctx.fillStyle = "#2196f3";
    this.ctx.fillText(bCount, barX + barWidth + padding, barY + barHeight/2 + 5);

    // Draw ratio and total with enhanced backgrounds - moved higher
    this.ctx.textAlign = "center";
    const ratio = total > 0 ? (rCount / bCount).toFixed(2) : "N/A";
    const ratioText = `R/B: ${ratio}`;
    const totalText = `Members: ${total}`;

    // Ratio text with enhanced visibility
    const ratioMetrics = this.ctx.measureText(ratioText);
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    this.ctx.fillRect(
      club.x - ratioMetrics.width / 2 - padding,
      barY - 62, // Increased distance
      ratioMetrics.width + padding * 2,
      countHeight
    );
    this.ctx.fillStyle = "black";
    this.ctx.fillText(ratioText, club.x, barY - 50); // Increased distance

    // Total members text with enhanced visibility
    const totalMetrics = this.ctx.measureText(totalText);
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    this.ctx.fillRect(
      club.x - totalMetrics.width / 2 - padding,
      barY - 42, // Increased distance
      totalMetrics.width + padding * 2,
      countHeight
    );
    this.ctx.fillStyle = "black";
    this.ctx.fillText(totalText, club.x, barY - 30); // Increased distance

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
