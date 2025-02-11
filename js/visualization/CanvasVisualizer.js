import { Visualizer } from "./Visualizer.js";

export class CanvasVisualizer extends Visualizer {
  constructor(canvas, ctx, width, height) {
    super(canvas, ctx, width, height);
    this.clubs = [];
    this.people = [];
    this.clubPositions = new Map(); // Store club coordinates
    this.personPositions = new Map(); // Store person positions for each club
  }

  initialize(clubs, people) {
    this.clubs = clubs;
    this.people = people;

    // Update canvas size first
    this.updateCanvasSize();

    // Calculate these values once and keep them fixed
    const baseMinDimension = Math.min(this.width, this.height);
    const fixedClubRadius = baseMinDimension * 0.1;
    this.clubRadius = fixedClubRadius;

    // Calculate base dimensions for visualization
    const padding = baseMinDimension * 0.15;
    const numColumns = Math.ceil(
      Math.sqrt(clubs.length * (this.width / this.height))
    );
    const numRows = Math.ceil(clubs.length / numColumns);

    // Calculate required height and resize canvas if needed
    const minRowHeight = fixedClubRadius * 4;
    const requiredHeight = padding * 2 + minRowHeight * numRows;

    if (requiredHeight > this.height) {
      const dpr = window.devicePixelRatio || 1;
      this.canvas.style.height = `${requiredHeight}px`;
      this.canvas.height = requiredHeight * dpr;
      this.height = requiredHeight;
      // Don't recalculate minDimension or clubRadius here

      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(dpr, dpr);
    }

    // Calculate spacing
    const horizontalSpacing =
      (this.width - padding * 2) / Math.max(numColumns, 1);
    const verticalSpacing = (this.height - padding * 2) / Math.max(numRows, 1);

    // Position clubs in grid
    clubs.forEach((club, i) => {
      const row = Math.floor(i / numColumns);
      const col = i % numColumns;

      this.clubPositions.set(club.id, {
        x: padding + horizontalSpacing * (0.5 + col),
        y: padding + verticalSpacing * (0.5 + row),
      });
    });

    // Initialize positions for all people for all clubs
    people.forEach((person) => {
      if (!this.personPositions.has(person.id)) {
        this.personPositions.set(person.id, new Map());
      }
      const personClubPositions = this.personPositions.get(person.id);

      clubs.forEach((club) => {
        if (!personClubPositions.has(club.id)) {
          const angle = Math.random() * Math.PI * 2;
          const minRadius = this.clubRadius * 0.2;
          const maxRadius = this.clubRadius * 0.9;
          const radius = minRadius + Math.random() * (maxRadius - minRadius);
          personClubPositions.set(club.id, { angle, radius });
        }
      });
    });

    this.draw();
  }

  updateCanvasSize() {
    // Get the wrapper dimensions
    const wrapper = this.canvas.parentElement;
    const rect = wrapper.getBoundingClientRect();

    // Set canvas size with proper DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = rect.width;
    const displayHeight = rect.height;

    // Set the canvas dimensions accounting for DPI
    this.canvas.width = displayWidth * dpr;
    this.canvas.height = displayHeight * dpr;

    // Set display size
    this.canvas.style.width = `${displayWidth}px`;
    this.canvas.style.height = `${displayHeight}px`;

    // Scale context and reset transform
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);

    // Update internal dimensions
    this.width = displayWidth;
    this.height = displayHeight;
    this.minDimension = Math.min(this.width, this.height);
    this.clubRadius = this.minDimension * 0.1;
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.clubs.forEach((club) => this.drawClub(club));

    const traitCounts = {
      R: this.people.filter((person) => person.trait === "R").length,
      B: this.people.filter((person) => person.trait === "B").length,
    };
    this.updateLegend(traitCounts);
  }

  drawClub(club) {
    const pos = this.clubPositions.get(club.id);
    if (!pos) return;

    this.ctx.save();
    // Transform to club's coordinate system
    this.ctx.translate(pos.x, pos.y);

    // Draw club circle (now centered at 0,0)
    this.ctx.beginPath();
    this.ctx.arc(0, 0, this.clubRadius, 0, Math.PI * 2);
    this.ctx.strokeStyle = "#ccc";
    this.ctx.lineWidth = this.minDimension * 0.002;
    this.ctx.fillStyle = "white";
    this.ctx.fill();
    this.ctx.stroke();

    // Draw stats bar and labels
    const barWidth = this.clubRadius * 0.75;
    const barHeight = this.clubRadius * 0.25;
    const barY = -this.clubRadius * 1.45;

    const rCount = club.getTraitCount("R");
    const bCount = club.getTraitCount("B");
    const total = club.getMemberCount();

    this.drawClubStats(
      0, // x is now relative to club center
      barY,
      barWidth,
      barHeight,
      rCount,
      bCount,
      total,
      this.clubRadius
    );

    // Draw club label
    const fontSize = Math.max(12, Math.floor(this.minDimension * 0.012));
    this.ctx.font = `${fontSize}px Arial`;
    this.ctx.fillStyle = "black";
    this.ctx.textAlign = "center";
    this.ctx.fillText(`Club ${club.id}`, 0, this.clubRadius * 1.25);

    // Draw club members
    club.members.forEach((person) => {
      this.drawMember(club, person);
    });

    this.ctx.restore();
  }

  drawMember(club, person) {
    const personPositions = this.personPositions.get(person.id);
    if (!personPositions) return;

    const personPos = personPositions.get(club.id);
    if (!personPos) return;

    const x = Math.cos(personPos.angle) * personPos.radius;
    const y = Math.sin(personPos.angle) * personPos.radius;

    // Draw person dot
    this.ctx.beginPath();
    this.ctx.arc(x, y, this.minDimension * 0.008, 0, Math.PI * 2);
    this.ctx.fillStyle = person.trait === "R" ? "#e91e63" : "#2196f3";
    this.ctx.fill();
    this.ctx.strokeStyle = "white";
    this.ctx.lineWidth = this.minDimension * 0.001;
    this.ctx.stroke();
  }

  drawClubStats(x, y, barWidth, barHeight, rCount, bCount, total, radius) {
    const barX = x - barWidth / 2;

    // Background bar
    this.ctx.fillStyle = "#f0f0f0";
    this.ctx.fillRect(barX, y, barWidth, barHeight);

    // Trait bars
    if (total > 0) {
      this.ctx.fillStyle = "#e91e63";
      const rWidth = (rCount / total) * barWidth;
      this.ctx.fillRect(barX, y, rWidth, barHeight);

      this.ctx.fillStyle = "#2196f3";
      const bWidth = (bCount / total) * barWidth;
      this.ctx.fillRect(barX + rWidth, y, bWidth, barHeight);
    }

    const padding = this.minDimension * 0.005;
    const countHeight = this.minDimension * 0.015;

    // Draw counts and labels
    this.drawCountLabel(
      rCount,
      barX - padding,
      y,
      countHeight,
      "#e91e63",
      "right"
    );
    this.drawCountLabel(
      bCount,
      barX + barWidth + padding,
      y,
      countHeight,
      "#2196f3",
      "left"
    );

    const ratio = total > 0 ? (rCount / bCount).toFixed(2) : "N/A";
    this.drawInfoLabel(`R/B: ${ratio}`, x, y - radius * 0.45, countHeight);
    this.drawInfoLabel(`Members: ${total}`, x, y - radius * 0.2, countHeight);
  }

  drawPerson(person) {
    console.log("Drawing person:", person);
    const personPositions = this.personPositions.get(person.id);
    console.log("Person positions:", personPositions);
    if (!personPositions) return;

    person.clubs.forEach((club) => {
      const clubPos = this.clubPositions.get(club.id);
      const personPos = personPositions.get(club.id);
      console.log(
        "Club position:",
        clubPos,
        "Person position in club:",
        personPos
      );
      if (!clubPos || !personPos) return;

      const x = clubPos.x + Math.cos(personPos.angle) * personPos.radius;
      const y = clubPos.y + Math.sin(personPos.angle) * personPos.radius;

      // Draw person dot with improved visibility
      this.ctx.beginPath();
      this.ctx.arc(x, y, this.minDimension * 0.008, 0, Math.PI * 2);
      this.ctx.fillStyle = person.trait === "R" ? "#e91e63" : "#2196f3";
      this.ctx.fill();
      this.ctx.strokeStyle = "white";
      this.ctx.lineWidth = this.minDimension * 0.001;
      this.ctx.stroke();
    });
  }

  drawCountLabel(count, x, y, height, color, align) {
    const text = count.toString();
    const metrics = this.ctx.measureText(text);
    const padding = height * 0.3;

    this.ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    const bgX = align === "right" ? x - metrics.width - padding * 2 : x;
    this.ctx.fillRect(
      bgX,
      y + height / 2 - height / 2,
      metrics.width + padding * 2,
      height
    );

    this.ctx.textAlign = align;
    this.ctx.fillStyle = color;
    this.ctx.fillText(text, x, y + height / 2 + height / 3);
  }

  drawInfoLabel(text, x, y, height) {
    const metrics = this.ctx.measureText(text);
    const padding = height * 0.3;

    this.ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    this.ctx.fillRect(
      x - metrics.width / 2 - padding,
      y - height / 2,
      metrics.width + padding * 2,
      height
    );

    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "black";
    this.ctx.fillText(text, x, y + height / 3);
  }
}
