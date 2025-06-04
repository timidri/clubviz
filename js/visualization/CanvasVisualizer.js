import { Visualizer } from "./Visualizer.js";

/**
 * @fileoverview Defines the CanvasVisualizer class for rendering the simulation on an HTML5 canvas.
 */

/**
 * Visualizes the simulation using HTML5 Canvas to draw clubs and people.
 * Extends the base Visualizer class.
 */
export class CanvasVisualizer extends Visualizer {
  /**
   * Constructs a CanvasVisualizer instance.
   * @param {HTMLCanvasElement} canvas - The canvas element to draw on.
   * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
   * @param {number} width - The initial width of the canvas.
   * @param {number} height - The initial height of the canvas.
   */
  constructor(canvas, ctx, width, height) {
    super(canvas, ctx, width, height);
    this.clubs = [];
    this.people = [];
    this.clubPositions = new Map(); // Stores calculated screen coordinates {x, y} for each club by club.id
    this.personPositions = new Map(); // Stores individual person's visual data {angle, radius} within each club
                                    // Map<person.id, Map<club.id, {angle, radius}>>
    this.clubRadius = 50; // Default club radius, will be recalculated based on canvas size and club count
  }

  /**
   * Initializes the CanvasVisualizer with clubs and people data.
   * Calculates positions for clubs in a grid layout and initial random positions for people within clubs.
   * @param {Club[]} clubs - An array of Club objects.
   * @param {Person[]} people - An array of Person objects.
   */
  initialize(clubs, people) {
    this.clubs = clubs;
    this.people = people;
    this.clubPositions.clear();
    this.personPositions.clear();

    this.updateCanvasSize(); // Ensure canvas dimensions and DPI scaling are up-to-date

    if (clubs.length === 0) {
        this.draw(); // Draw an empty state if no clubs
        return;
    }

    // --- Calculate optimal grid layout for clubs ---
    const aspectRatio = this.width / this.height;
    const totalClubs = clubs.length;
    let numColumns = Math.ceil(Math.sqrt(totalClubs * aspectRatio));
    let numRows = Math.ceil(totalClubs / numColumns);

    // Adjust columns/rows for better aesthetics (e.g., avoid very tall/wide grids)
    if (numRows > numColumns * 1.5 && numColumns < totalClubs) { // Check numColumns < totalClubs to avoid infinite loop if totalClubs is 1
      numColumns++;
      numRows = Math.ceil(totalClubs / numColumns);
    }

    const minPaddingOverall = Math.min(this.width, this.height) * 0.05; // Minimum 5% padding on smaller dimension
    // Calculate cell dimensions for each club
    const cellWidth = (this.width - minPaddingOverall * 2) / numColumns;
    const cellHeight = (this.height - minPaddingOverall * 2) / numRows;

    // Determine club radius based on the smaller of cell width/height, reserving space for labels/stats
    this.clubRadius = Math.min(cellWidth, cellHeight) * 0.35; // Use 35% of the smaller cell dimension for radius

    // Calculate actual horizontal and vertical padding to center the grid of clubs
    const contentWidth = cellWidth * numColumns;
    const contentHeight = cellHeight * numRows;
    const horizontalPadding = (this.width - contentWidth) / 2 + minPaddingOverall;
    const verticalPadding = (this.height - contentHeight) / 2 + minPaddingOverall;

    // Position each club within its grid cell
    clubs.forEach((club, i) => {
      const row = Math.floor(i / numColumns);
      const col = i % numColumns;
      this.clubPositions.set(club.id, {
        x: horizontalPadding + cellWidth * col + cellWidth / 2,
        y: verticalPadding + cellHeight * row + cellHeight / 2,
      });
    });

    // Initialize visual positions for all people (even if not in a club yet, for consistency)
    // This map helps in quickly finding a person's specific {angle, radius} for a club they are in.
    people.forEach((person) => {
      const personClubVisuals = new Map();
      clubs.forEach((club) => {
        // Store the pre-calculated angle from Person model if available, or generate one
        const existingPosition = person.positions.get(club.id);
        const angle = existingPosition ? existingPosition.angle : Math.random() * Math.PI * 2;
        // Generate a random radius within the club for visual placement
        const minPersonRadius = this.clubRadius * 0.1; // Person dots start near the center
        const maxPersonRadius = this.clubRadius * 0.85; // Keep dots within the club circle boundary
        const radius = minPersonRadius + Math.random() * (maxPersonRadius - minPersonRadius);
        personClubVisuals.set(club.id, { angle, radius });
      });
      this.personPositions.set(person.id, personClubVisuals);
    });

    this.canvas.style.display = "block"; // Ensure canvas is visible
    this.draw(); // Perform an initial draw
  }

  /**
   * Handles canvas resizing, including DPI scaling for crisp rendering.
   * Updates internal width/height and scales the rendering context.
   */
  updateCanvasSize() {
    const wrapper = this.canvas.parentElement;
    if (!wrapper) {
        console.warn("CanvasVisualizer: Parent wrapper not found for sizing.");
        return;
    }
    const rect = wrapper.getBoundingClientRect();

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = rect.width;
    const displayHeight = rect.height;

    this.canvas.width = displayWidth * dpr;
    this.canvas.height = displayHeight * dpr;
    this.canvas.style.width = `${displayWidth}px`;
    this.canvas.style.height = `${displayHeight}px`;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform before scaling
    this.ctx.scale(dpr, dpr);

    // Update internal dimensions used for drawing logic
    this.width = displayWidth;
    this.height = displayHeight;
    this.minDimension = Math.min(this.width, this.height);
  }

  /**
   * Main drawing method. Clears the canvas and redraws all clubs and their members.
   * Also updates the legend.
   */
  draw() {
    if (!this.ctx) {
      console.error("CanvasVisualizer: Canvas context is not available for drawing.");
      return;
    }
    // Clear the entire canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    if (!this.clubs || !this.people) {
      // console.warn("CanvasVisualizer: Clubs or people data not available for drawing.");
      return; // Don't draw if data isn't ready
    }

    // Draw each club
    this.clubs.forEach((club) => {
      try {
        this.drawClub(club);
      } catch (error) {
        console.error(`Error drawing club ${club.id}:`, error);
      }
    });

    // Update trait counts for the legend
    const traitCounts = {
      R: this.people.filter((person) => person.trait === "R").length,
      B: this.people.filter((person) => person.trait === "B").length,
    };
    this.updateLegend(traitCounts);
  }

  /**
   * Draws a single club, including its circle, statistics bar, label, and members.
   * @param {Club} club - The club to draw.
   */
  drawClub(club) {
    const pos = this.clubPositions.get(club.id);
    if (!pos) return; // Club position not calculated, cannot draw

    this.ctx.save();
    this.ctx.translate(pos.x, pos.y); // Move origin to club's center for easier drawing

    // Draw club circle
    this.ctx.beginPath();
    this.ctx.arc(0, 0, this.clubRadius, 0, Math.PI * 2);
    this.ctx.strokeStyle = "#ccc"; // Light grey border for the club circle
    this.ctx.lineWidth = Math.max(1, this.minDimension * 0.002); // Responsive line width
    this.ctx.fillStyle = "white";
    this.ctx.fill();
    this.ctx.stroke();

    // Draw club statistics bar (R/B ratio) and member counts above the circle
    const barWidth = this.clubRadius * 1.5; // Make bar wider than club for text
    const barHeight = this.clubRadius * 0.2; 
    const statsYOffset = -this.clubRadius - (barHeight * 1.5); // Position above the circle

    this.drawClubStats(
      0, // Centered horizontally relative to club center
      statsYOffset,
      barWidth,
      barHeight,
      club.getTraitCount("R"),
      club.getTraitCount("B"),
      club.getMemberCount(),
      barHeight * 0.5 // Spacing factor for labels within stats area
    );

    // Draw club ID label below the circle
    const fontSize = Math.max(10, Math.floor(this.minDimension * 0.015)); // Responsive font size
    this.ctx.font = `bold ${fontSize}px Arial`;
    this.ctx.fillStyle = "black";
    this.ctx.textAlign = "center";
    this.ctx.fillText(`Club ${club.id}`, 0, this.clubRadius + fontSize * 1.5); // Positioned below the circle

    // Draw members of this club
    club.members.forEach((person) => {
      this.drawMember(club, person);
    });

    this.ctx.restore(); // Restore original canvas state
  }

  /**
   * Draws a single member (person) within a club as a colored dot.
   * @param {Club} club - The club the member belongs to.
   * @param {Person} person - The person (member) to draw.
   */
  drawMember(club, person) {
    const personClubVisuals = this.personPositions.get(person.id);
    if (!personClubVisuals) return; 

    const visualInfo = personClubVisuals.get(club.id);
    if (!visualInfo) return;

    // Calculate x, y relative to club center using stored angle and radius
    const x = Math.cos(visualInfo.angle) * visualInfo.radius;
    const y = Math.sin(visualInfo.angle) * visualInfo.radius;
    const dotRadius = Math.max(2, this.minDimension * 0.008); // Responsive dot size

    this.ctx.beginPath();
    this.ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = person.trait === "R" ? "#E91E63" : "#2196F3"; // R: Pink/Red, B: Blue
    this.ctx.fill();
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.7)"; // Semi-transparent white outline for better visibility
    this.ctx.lineWidth = Math.max(0.5, this.minDimension * 0.001);
    this.ctx.stroke();
  }

  /**
   * Draws the statistics bar for a club, showing trait proportions and counts.
   * @param {number} x - Center X position for the stats display (relative to club center).
   * @param {number} y - Top Y position for the stats display (relative to club center).
   * @param {number} barWidth - The total width of the stats bar.
   * @param {number} barHeight - The height of the stats bar.
   * @param {number} rCount - Count of trait R members.
   * @param {number} bCount - Count of trait B members.
   * @param {number} total - Total members in the club.
   * @param {number} labelSpacing - Spacing factor for positioning labels around the bar.
   */
  drawClubStats(x, y, barWidth, barHeight, rCount, bCount, total, labelSpacing) {
    const barX = x - barWidth / 2; // Left edge of the bar
    const fontSize = Math.max(8, Math.floor(this.minDimension * 0.012));
    this.ctx.font = `${fontSize}px Arial`;

    // Draw R/B ratio and total member count labels above the bar
    const rToBRatio = (bCount > 0) ? (rCount / bCount).toFixed(2) : (rCount > 0 ? "∞" : "N/A");
    this.drawInfoLabel(`R/B: ${rToBRatio}`, x, y - labelSpacing * 2.5, fontSize);
    this.drawInfoLabel(`Members: ${total}`, x, y - labelSpacing * 1, fontSize);

    // Draw background for the bar
    this.ctx.fillStyle = "#f0f0f0";
    this.ctx.fillRect(barX, y, barWidth, barHeight);
    this.ctx.strokeStyle = "#ccc";
    this.ctx.lineWidth = 0.5;
    this.ctx.strokeRect(barX, y, barWidth, barHeight);

    // Draw trait proportion bars (R and B)
    if (total > 0) {
      const rWidth = (rCount / total) * barWidth;
      this.ctx.fillStyle = "#E91E63"; // R: Pink/Red
      this.ctx.fillRect(barX, y, rWidth, barHeight);

      const bWidth = (bCount / total) * barWidth;
      this.ctx.fillStyle = "#2196F3"; // B: Blue
      this.ctx.fillRect(barX + rWidth, y, bWidth, barHeight);
    }

    // Draw R and B counts on sides of the bar
    const textPadding = fontSize * 0.5;
    this.drawCountLabel(
      rCount.toString(),
      barX - textPadding,
      y + barHeight / 2,
      fontSize,
      "#E91E63", // R: Pink/Red
      "right"
    );
    this.drawCountLabel(
      bCount.toString(),
      barX + barWidth + textPadding,
      y + barHeight / 2,
      fontSize,
      "#2196F3", // B: Blue
      "left"
    );
  }

  /**
   * Helper to draw a text label for counts (e.g., R or B count next to stats bar).
   * @param {string} text - The text to draw (count).
   * @param {number} x - X position for the text.
   * @param {number} y - Y position for the text (baseline).
   * @param {number} fontSize - The font size.
   * @param {string} color - Text color.
   * @param {string} align - Text alignment ("left", "right", "center").
   */
  drawCountLabel(text, x, y, fontSize, color, align) {
    this.ctx.font = `bold ${fontSize}px Arial`;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(text, x, y);
  }

  /**
   * Helper to draw an informational text label (e.g., "R/B Ratio", "Members").
   * @param {string} text - The text to draw.
   * @param {number} x - Center X position for the text.
   * @param {number} y - Y position for the text (baseline).
   * @param {number} fontSize - The font size.
   */
  drawInfoLabel(text, x, y, fontSize) {
    this.ctx.font = `${fontSize}px Arial`;
    this.ctx.fillStyle = "black";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(text, x, y);
  }
}
