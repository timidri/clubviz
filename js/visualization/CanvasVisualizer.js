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
   * Calculates optimal positions for clubs in a much more compact, centered layout.
   */
  calculateGroupPositions() {
    const numGroups = this.groups.length;
    if (numGroups === 0) return;
    
    console.log(`Canvas size: ${this.width}x${this.height}`);
    
    // More compact grid arrangements with better aspect ratios
    let numColumns, numRows;
    if (numGroups === 1) { 
      numColumns = 1; numRows = 1; 
    } else if (numGroups === 2) { 
      numColumns = 2; numRows = 1; 
    } else if (numGroups === 3) { 
      numColumns = 3; numRows = 1; 
    } else if (numGroups === 4) { 
      numColumns = 2; numRows = 2; 
    } else if (numGroups <= 6) {
      numColumns = 3; numRows = 2;
    } else if (numGroups <= 9) {
      numColumns = 3; numRows = 3;
    } else {
      numColumns = Math.ceil(Math.sqrt(numGroups));
      numRows = Math.ceil(numGroups / numColumns);
    }

    // Much more generous sizing
    const padding = Math.min(40, this.width * 0.05);
    const availableWidth = this.width - padding * 2;
    const availableHeight = this.height - padding * 2;
    
    // Calculate cell dimensions with minimal spacing
    const cellWidth = availableWidth / numColumns;
    const cellHeight = availableHeight / numRows;
    
    // Much larger radius calculation - use most of available space
    const maxRadiusFromWidth = cellWidth * 0.35;  // Use 35% of cell width
    const maxRadiusFromHeight = cellHeight * 0.35; // Use 35% of cell height
    this.groupRadius = Math.max(60, Math.min(maxRadiusFromWidth, maxRadiusFromHeight, 120));

    console.log(`Grid: ${numRows}x${numColumns}, Cell: ${cellWidth.toFixed(0)}x${cellHeight.toFixed(0)}, Radius: ${this.groupRadius}`);

    // Center the entire grid layout in the canvas
    const totalGridWidth = numColumns * cellWidth;
    const totalGridHeight = numRows * cellHeight;
    const gridOffsetX = (this.width - totalGridWidth) / 2;
    const gridOffsetY = (this.height - totalGridHeight) / 2;

    // Position groups in a centered, compact grid
    this.groups.forEach((group, i) => {
      const row = Math.floor(i / numColumns);
      const col = i % numColumns;
      
      // Center each club within its cell, with grid centered on canvas
      const x = gridOffsetX + cellWidth * col + cellWidth * 0.5;
      const y = gridOffsetY + cellHeight * row + cellHeight * 0.5;
      
      this.groupPositions.set(group.id, { x, y });
      
      console.log(`Club ${group.id}: position (${x.toFixed(0)}, ${y.toFixed(0)})`);
    });

    console.log(`Positioned ${numGroups} clubs in centered ${numRows}x${numColumns} grid, radius=${this.groupRadius}px`);
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
   * Updates canvas size and handles DPI scaling.
   */
  updateCanvasSize() {
    const wrapper = this.canvas.parentElement;
    if (!wrapper) {
      console.warn("Canvas wrapper not found");
      return;
    }

    const rect = wrapper.getBoundingClientRect();
    console.log(`Canvas wrapper size: ${rect.width}x${rect.height}`);
    
    // Ensure minimum reasonable size
    const width = Math.max(400, rect.width);
    const height = Math.max(300, rect.height);
    
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
    
    console.log(`Canvas updated: ${this.width}x${this.height}, DPR: ${dpr}`);
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

    this.ctx.save();
    this.ctx.translate(pos.x, pos.y);

    // Draw group circle with gradient and shadow
    this.ctx.beginPath();
    this.ctx.arc(0, 0, this.groupRadius, 0, Math.PI * 2);
    
    // Create gradient fill
    const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, this.groupRadius);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    gradient.addColorStop(1, "rgba(248, 250, 252, 0.9)");
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
    
    // Enhanced border
    this.ctx.strokeStyle = "#e2e8f0";
    this.ctx.lineWidth = Math.max(2, this.groupRadius * 0.02);
    this.ctx.stroke();
    
    // Add subtle outer shadow
    this.ctx.beginPath();
    this.ctx.arc(0, 0, this.groupRadius + 2, 0, Math.PI * 2);
    this.ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // Draw group statistics
    this.drawGroupStats(group);

    // Draw group label
    this.drawGroupLabel(group);

    // Draw members
    group.getMembers().forEach(person => {
      this.drawPerson(group, person);
    });

    this.ctx.restore();
  }

  /**
   * Draws statistics bar for a club showing opinion distribution.
   * @param {Group} group - The club to draw stats for.
   */
  drawGroupStats(group) {
    const positiveCount = group.getOpinionCount(1);
    const negativeCount = group.getOpinionCount(-1);
    const total = positiveCount + negativeCount;

    if (total === 0) return;

    const barWidth = this.groupRadius * 1.4;
    const barHeight = Math.max(12, this.groupRadius * 0.15);
    const statsY = -this.groupRadius - barHeight * 2;

    // Background with gradient
    const bgGradient = this.ctx.createLinearGradient(-barWidth/2, statsY, -barWidth/2, statsY + barHeight);
    bgGradient.addColorStop(0, "#f8fafc");
    bgGradient.addColorStop(1, "#e2e8f0");
    this.ctx.fillStyle = bgGradient;
    this.ctx.fillRect(-barWidth/2, statsY, barWidth, barHeight);

    // Positive opinion segment with gradient
    if (positiveCount > 0) {
      const positiveWidth = (positiveCount / total) * barWidth;
      const posGradient = this.ctx.createLinearGradient(-barWidth/2, statsY, -barWidth/2, statsY + barHeight);
      posGradient.addColorStop(0, this.colors[1]);
      posGradient.addColorStop(1, "#c2185b");
      this.ctx.fillStyle = posGradient;
      this.ctx.fillRect(-barWidth/2, statsY, positiveWidth, barHeight);
    }

    // Negative opinion segment with gradient
    if (negativeCount > 0) {
      const negativeWidth = (negativeCount / total) * barWidth;
      const negativeStart = -barWidth/2 + (positiveCount / total) * barWidth;
      const negGradient = this.ctx.createLinearGradient(negativeStart, statsY, negativeStart, statsY + barHeight);
      negGradient.addColorStop(0, this.colors[-1]);
      negGradient.addColorStop(1, "#1976d2");
      this.ctx.fillStyle = negGradient;
      this.ctx.fillRect(negativeStart, statsY, negativeWidth, barHeight);
    }

    // Enhanced border
    this.ctx.strokeStyle = "#94a3b8";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(-barWidth/2, statsY, barWidth, barHeight);

    // Count labels - larger and more readable
    const fontSize = Math.max(10, Math.min(14, this.groupRadius * 0.14));
    this.ctx.font = `bold ${fontSize}px Arial`;
    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "#1e293b";
    
    const labelY = statsY - fontSize * 0.5;
    this.ctx.fillText(`+1: ${positiveCount} | -1: ${negativeCount}`, 0, labelY);
  }

  /**
   * Draws the club label.
   * @param {Group} group - The club to draw label for.
   */
  drawGroupLabel(group) {
    const fontSize = Math.max(12, Math.min(18, this.groupRadius * 0.18));
    this.ctx.font = `bold ${fontSize}px Inter, Arial, sans-serif`;
    this.ctx.textAlign = "center";
    
    const labelY = this.groupRadius + fontSize * 1.5;
    const text = `Club ${group.id}`;
    
    // Draw text shadow for better visibility
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    this.ctx.fillText(text, 1, labelY + 1);
    
    // Draw main text
    this.ctx.fillStyle = "#1e293b";
    this.ctx.fillText(text, 0, labelY);
  }

  /**
   * Draws a person as a colored dot within a group.
   * @param {Group} group - The group containing the person.
   * @param {Person} person - The person to draw.
   */
  drawPerson(group, person) {
    const personVisuals = this.personPositions.get(person.id);
    if (!personVisuals) return;

    const visual = personVisuals.get(group.id);
    if (!visual) return;

    const x = Math.cos(visual.angle) * visual.radius;
    const y = Math.sin(visual.angle) * visual.radius;

    const opinion = person.getOpinion();
    const color = this.colors[opinion] || "#888";

    // Much larger, more visible dots - scale with group size
    const dotRadius = Math.max(6, Math.min(12, this.groupRadius * 0.12));
    
    // Draw person dot with enhanced visibility
    this.ctx.beginPath();
    this.ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.fill();
    
    // Strong white border with subtle shadow effect
    this.ctx.strokeStyle = "#fff";
    this.ctx.lineWidth = Math.max(2, dotRadius * 0.25);
    this.ctx.stroke();
    
    // Add subtle inner shadow for depth
    this.ctx.beginPath();
    this.ctx.arc(x, y, dotRadius * 0.8, 0, Math.PI * 2);
    this.ctx.strokeStyle = "rgba(0,0,0,0.2)";
    this.ctx.lineWidth = 1;
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
