import { Visualizer } from "./Visualizer.js";

/**
 * @fileoverview CanvasVisualizer for Random Intersection Graph simulation.
 * Renders groups and people with their opinions on HTML5 canvas.
 */

/**
 * Visualizes the Random Intersection Graph simulation using HTML5 Canvas.
 * Shows groups as circles with people as colored dots based on their opinions.
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
    this.groups = [];
    this.people = [];
    this.groupPositions = new Map(); // Screen coordinates for each group
    this.personPositions = new Map(); // Visual positions within groups
    this.groupRadius = 50; // Will be recalculated based on canvas size
    
    // Colors for opinions
    this.colors = {
      1: "#E91E63",   // Opinion +1 (Pink/Red)
      [-1]: "#2196F3" // Opinion -1 (Blue)
    };
  }

  /**
   * Initializes the visualizer with groups and people data.
   * @param {Group[]} groups - Array of Group objects.
   * @param {Person[]} people - Array of Person objects.
   */
  initialize(groups, people) {
    console.log(`Initializing CanvasVisualizer with ${groups.length} groups, ${people.length} people`);
    
    this.groups = groups;
    this.people = people;
    this.groupPositions.clear();
    this.personPositions.clear();

    this.updateCanvasSize();

    if (groups.length === 0) {
      this.draw();
      return;
    }

    this.calculateGroupPositions();
    this.calculatePersonPositions();
    
    this.canvas.style.display = "block";
    this.draw();
  }

  /**
   * Updates data without full reinitialization.
   * @param {Group[]} groups - Updated groups array.
   * @param {Person[]} people - Updated people array.
   */
  updateData(groups, people) {
    this.groups = groups;
    this.people = people;
    this.calculatePersonPositions(); // Recalculate person positions for updated memberships
  }

  /**
   * Calculates optimal positions for clubs using a space-efficient packing algorithm.
   * This method creates a non-overlapping grid layout.
   */
  calculateGroupPositions() {
    const numGroups = this.groups.length;
    if (numGroups === 0) return;

    // Determine grid dimensions that best fit the canvas aspect ratio
    const aspectRatio = this.width / this.height;
    let bestNumColumns = Math.ceil(Math.sqrt(numGroups * aspectRatio));
    let bestNumRows = Math.ceil(numGroups / bestNumColumns);
    
    // Check if swapping columns and rows gives a better fit (fewer total cells)
    let altNumColumns = Math.ceil(Math.sqrt(numGroups / aspectRatio));
    if (altNumColumns === 0) altNumColumns = 1; // Prevent division by zero
    let altNumRows = Math.ceil(numGroups / altNumColumns);

    if (bestNumColumns * bestNumRows > altNumColumns * altNumRows) {
        bestNumColumns = altNumColumns;
        bestNumRows = altNumRows;
    }
    
    const numColumns = bestNumColumns;
    const numRows = bestNumRows;

    // Add padding to prevent clubs from touching the edges
    const padding = Math.min(this.width, this.height) * 0.05; // 5% padding
    const availableWidth = this.width - padding * 2;
    const availableHeight = this.height - padding * 2;

    const cellWidth = availableWidth / numColumns;
    const cellHeight = availableHeight / numRows;

    // Reserve 30% of the vertical cell space for labels below the circle
    const labelHeight = cellHeight * 0.3;
    const circleAreaHeight = cellHeight - labelHeight;

    // Calculate radius to fit within the available space
    const margin = Math.min(cellWidth, circleAreaHeight) * 0.1; // 10% margin
    const maxRadiusFromWidth = cellWidth / 2 - margin;
    const maxRadiusFromHeight = circleAreaHeight / 2 - margin;
    this.groupRadius = Math.max(20, Math.min(maxRadiusFromWidth, maxRadiusFromHeight));

    console.log(`Smart Grid: ${numRows}x${numColumns}, Radius: ${this.groupRadius.toFixed(0)}`);

    // Position groups, centering the circle in the top part of the cell
    this.groups.forEach((group, i) => {
        const row = Math.floor(i / numColumns);
        const col = i % numColumns;
        
        // Center the circle in the allocated top 70% of the cell
        const x = padding + (col + 0.5) * cellWidth;
        const y = padding + (row * cellHeight) + (circleAreaHeight / 2);
        
        this.groupPositions.set(group.id, { x, y });
    });
  }

  /**
   * Calculates visual positions for people within their groups.
   */
  calculatePersonPositions() {
    this.people.forEach(person => {
      const personGroupVisuals = new Map();
      
      // For each group the person belongs to
      person.getGroups().forEach(group => {
        // Generate random position within the group circle
        const angle = Math.random() * Math.PI * 2;
        const minRadius = this.groupRadius * 0.1;
        const maxRadius = this.groupRadius * 0.8;
        const radius = minRadius + Math.random() * (maxRadius - minRadius);
        
        personGroupVisuals.set(group.id, { angle, radius });
      });
      
      this.personPositions.set(person.id, personGroupVisuals);
    });
  }

  /**
   * Updates canvas size and handles DPI scaling - MAXIMIZE available space.
   */
  updateCanvasSize() {
    const wrapper = this.canvas.parentElement;
    if (!wrapper) {
      console.warn("Canvas wrapper not found");
      return;
    }

    const rect = wrapper.getBoundingClientRect();
    console.log(`Canvas wrapper size: ${rect.width}x${rect.height}`);
    
    // COMPACT sizing - fit on screen while still being visible
    const width = Math.max(480, rect.width);  // Reduced minimum for better screen fit
    const height = Math.max(360, rect.height); // Reduced minimum for better screen fit
    
    const dpr = window.devicePixelRatio || 1;
    
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);

    this.width = width;
    this.height = height;
    this.minDimension = Math.min(this.width, this.height);
    
    console.log(`Canvas MAXIMIZED: ${this.width}x${this.height}, DPR: ${dpr}`);
  }

  /**
   * Main drawing method.
   */
  draw() {
    if (!this.ctx) {
      console.error("Canvas context not available");
      return;
    }

    // Clear canvas with light background
    this.ctx.fillStyle = "#f9fafb";
    this.ctx.fillRect(0, 0, this.width, this.height);

    if (!this.groups || !this.people) {
      // Draw debug info when no data
      this.ctx.fillStyle = "#666";
      this.ctx.font = "16px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText("No simulation data", this.width / 2, this.height / 2);
      return;
    }

    console.log(`Drawing ${this.groups.length} groups on ${this.width}x${this.height} canvas`);

    // Draw each group
    this.groups.forEach(group => {
      try {
        this.drawGroup(group);
      } catch (error) {
        console.error(`Error drawing group ${group.id}:`, error);
      }
    });

    // Update legend
    this.updateLegend();
  }

  /**
   * Draws a single group with its members.
   * @param {Group} group - The group to draw.
   */
  drawGroup(group) {
    const pos = this.groupPositions.get(group.id);
    if (!pos) return;

    const { positive, negative } = group.getOpinionCounts();
    const total = positive + negative;
    const positiveRatio = total > 0 ? positive / total : 0;

    // Draw the main circle with a modern gradient
    const gradient = this.ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, this.groupRadius);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.3)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    this.ctx.beginPath();
    this.ctx.arc(pos.x, pos.y, this.groupRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.fill();
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    // Draw the opinion ratio arc
    if (total > 0) {
      this.ctx.beginPath();
      this.ctx.moveTo(pos.x, pos.y);
      this.ctx.arc(pos.x, pos.y, this.groupRadius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * positiveRatio), false);
      this.ctx.closePath();
      this.ctx.fillStyle = this.colors[1] + '40'; // Semi-transparent fill
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.moveTo(pos.x, pos.y);
      this.ctx.arc(pos.x, pos.y, this.groupRadius, -Math.PI / 2 + (Math.PI * 2 * positiveRatio), -Math.PI / 2 + Math.PI * 2, false);
      this.ctx.closePath();
      this.ctx.fillStyle = this.colors[-1] + '40';
      this.ctx.fill();
    }
    
    // Draw a clean border
    this.ctx.beginPath();
    this.ctx.arc(pos.x, pos.y, this.groupRadius, 0, Math.PI * 2);
    this.ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Draw people in the group
    group.getMembers().forEach(person => {
      this.drawPerson(group, person);
    });
    
    this.drawGroupLabel(group);
    this.drawGroupStats(group);
  }

  /**
   * Draws dynamic, readable statistics inside the group circle.
   */
  drawGroupStats(group) {
    const pos = this.groupPositions.get(group.id);
    if (!pos) return;

    const stats = group.getStatistics();
    
    // Dynamic font size based on radius, but with a minimum for readability
    const statsFontSize = Math.max(10, Math.min(13, this.groupRadius * 0.2));
    this.ctx.font = `${statsFontSize}px Inter, sans-serif`;
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "top";

    // Position text below the circle, accounting for the label
    const labelFontSize = Math.max(14, Math.min(22, this.groupRadius * 0.3));
    const textY = pos.y + this.groupRadius + (labelFontSize * 1.2);
    const lineHeight = statsFontSize * 1.4;

    this.ctx.fillText(`Members: ${stats.memberCount}`, pos.x, textY);
    this.ctx.fillText(`+1: ${stats.opinionCounts.positive} | -1: ${stats.opinionCounts.negative}`, pos.x, textY + lineHeight);
  }

  /**
   * Draws a dynamic, readable label for the group below the circle.
   */
  drawGroupLabel(group) {
    const pos = this.groupPositions.get(group.id);
    if (!pos) return;

    // Dynamic font size, ensuring it's large enough to be read
    const labelFontSize = Math.max(14, Math.min(22, this.groupRadius * 0.3));
    this.ctx.font = `bold ${labelFontSize}px Inter, sans-serif`;
    this.ctx.fillStyle = "#374151";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "top";

    // Position text just below the circle
    const textY = pos.y + this.groupRadius + (labelFontSize * 0.2);
    
    this.ctx.fillText(`Club ${group.id}`, pos.x, textY);
  }

  /**
   * Draws a person as a LARGE, highly visible colored dot within a group.
   * @param {Group} group - The group containing the person.
   * @param {Person} person - The person to draw.
   */
  drawPerson(group, person) {
    const groupPos = this.groupPositions.get(group.id);
    const personVisuals = this.personPositions.get(person.id);
    if (!groupPos || !personVisuals) return;

    const visualInfo = personVisuals.get(group.id);
    if (!visualInfo) return;

    const x = groupPos.x + Math.cos(visualInfo.angle) * visualInfo.radius;
    const y = groupPos.y + Math.sin(visualInfo.angle) * visualInfo.radius;

    // Dynamic dot radius
    const personDotRadius = Math.max(4, this.groupRadius * 0.06);

    // Draw shadow for depth
    this.ctx.beginPath();
    this.ctx.arc(x, y + 1, personDotRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    this.ctx.fill();

    // Draw main dot
    this.ctx.beginPath();
    this.ctx.arc(x, y, personDotRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = this.colors[person.getOpinion()];
    this.ctx.fill();

    // Add a white border for better contrast
    this.ctx.strokeStyle = "#FFF";
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();
  }

  /**
   * Updates the legend with current opinion counts.
   */
  updateLegend() {
    const opinionCounts = {
      1: this.people.filter(person => person.getOpinion() === 1).length,
      [-1]: this.people.filter(person => person.getOpinion() === -1).length
    };

    // Update legend elements if they exist
    const positiveDot = document.querySelector('.opinion-positive');
    const negativeDot = document.querySelector('.opinion-negative');
    
    if (positiveDot) {
      const span = positiveDot.nextElementSibling;
      if (span) span.textContent = `Opinion +1 (${opinionCounts[1]})`;
    }
    
    if (negativeDot) {
      const span = negativeDot.nextElementSibling;
      if (span) span.textContent = `Opinion -1 (${opinionCounts[-1]})`;
    }
  }

  /**
   * Renders the visualization.
   */
  render() {
    this.draw();
  }

  /**
   * Updates dimensions when canvas is resized.
   * @param {number} width - New width.
   * @param {number} height - New height.
   */
  updateDimensions(width, height) {
    this.width = width;
    this.height = height;
    this.minDimension = Math.min(width, height);
    this.updateCanvasSize();
    if (this.groups.length > 0) {
      this.calculateGroupPositions();
      this.calculatePersonPositions();
      this.draw();
    }
  }
}

