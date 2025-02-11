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

    // Calculate base dimensions for visualization
    const minDimension = Math.min(this.width, this.height);
    const clubRadius = minDimension * 0.08; // 8% of the smaller dimension
    const padding = minDimension * 0.15; // 15% of the smaller dimension
    const minClubSpacing = clubRadius * 4;

    // Calculate optimal grid layout
    const totalClubs = clubs.length;
    const aspectRatio = this.width / this.height;
    const numColumns = Math.ceil(Math.sqrt(totalClubs * aspectRatio));
    const numRows = Math.ceil(totalClubs / numColumns);

    // Calculate spacing to maintain aspect ratio
    const horizontalSpacing = (this.width - padding * 2) / Math.max(numColumns, 1);
    const verticalSpacing = (this.height - padding * 2) / Math.max(numRows, 1);

    // Position clubs in grid with proper spacing
    clubs.forEach((club, i) => {
      const row = Math.floor(i / numColumns);
      const col = i % numColumns;
      
      club.x = padding + horizontalSpacing * (0.5 + col);
      club.y = padding + verticalSpacing * (0.5 + row);
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
    // Use consistent radius based on smaller canvas dimension
    const minDimension = Math.min(this.width, this.height);
    const radius = minDimension * 0.08;
    const barWidth = radius * 0.75;
    const barHeight = radius * 0.25;
    const barY = club.y - radius * 1.75;

    // Draw club circle
    this.ctx.beginPath();
    this.ctx.arc(club.x, club.y, radius, 0, Math.PI * 2);
    this.ctx.strokeStyle = "#ccc";
    this.ctx.lineWidth = minDimension * 0.002; // Scale line width with canvas size
    this.ctx.fillStyle = "white";
    this.ctx.fill();
    this.ctx.stroke();

    const rCount = club.getTraitCount("R");
    const bCount = club.getTraitCount("B");
    const total = club.getMemberCount();

    // Bar chart positioning
    const barX = club.x - barWidth / 2;

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

    // Scale text and padding based on canvas size
    const padding = minDimension * 0.005;
    const countHeight = minDimension * 0.015;
    const fontSize = Math.max(12, Math.floor(minDimension * 0.012));
    this.ctx.font = `${fontSize}px Arial`;

    // Draw counts with consistent scaling
    this.drawCountLabel(rCount, barX - padding, barY, countHeight, "#e91e63", "right");
    this.drawCountLabel(bCount, barX + barWidth + padding, barY, countHeight, "#2196f3", "left");

    // Draw ratio and total
    const ratio = total > 0 ? (rCount / bCount).toFixed(2) : "N/A";
    this.drawInfoLabel(`R/B: ${ratio}`, club.x, barY - radius * 0.8, countHeight);
    this.drawInfoLabel(`Members: ${total}`, club.x, barY - radius * 0.5, countHeight);

    // Draw club label
    this.ctx.font = `${fontSize}px Arial`;
    this.ctx.fillStyle = "black";
    this.ctx.textAlign = "center";
    this.ctx.fillText(`Club ${club.id}`, club.x, club.y + radius * 1.25);
  }

  drawCountLabel(count, x, y, height, color, align) {
    const text = count.toString();
    const metrics = this.ctx.measureText(text);
    const padding = height * 0.3;

    // Draw background
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    const bgX = align === "right" ? x - metrics.width - padding * 2 : x;
    this.ctx.fillRect(bgX, y + height/2 - height/2, metrics.width + padding * 2, height);

    // Draw text
    this.ctx.textAlign = align;
    this.ctx.fillStyle = color;
    this.ctx.fillText(text, x, y + height/2 + height/3);
  }

  drawInfoLabel(text, x, y, height) {
    const metrics = this.ctx.measureText(text);
    const padding = height * 0.3;

    // Draw background
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    this.ctx.fillRect(x - metrics.width/2 - padding, y - height/2, metrics.width + padding * 2, height);

    // Draw text
    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "black";
    this.ctx.fillText(text, x, y + height/3);
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
