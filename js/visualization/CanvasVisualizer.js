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
   * Calculates optimal positions for groups in a grid layout.
   */
  calculateGroupPositions() {
    const numGroups = this.groups.length;
    
    // Calculate grid layout
    const aspectRatio = this.width / this.height;
    let numColumns = Math.ceil(Math.sqrt(numGroups * aspectRatio));
    let numRows = Math.ceil(numGroups / numColumns);

    // Adjust for better aesthetics
    if (numRows > numColumns * 1.5 && numColumns < numGroups) {
      numColumns++;
      numRows = Math.ceil(numGroups / numColumns);
    }

    const padding = Math.min(this.width, this.height) * 0.05;
    const cellWidth = (this.width - padding * 2) / numColumns;
    const cellHeight = (this.height - padding * 2) / numRows;

    // Calculate group radius
    this.groupRadius = Math.min(cellWidth, cellHeight) * 0.35;

    // Position groups
    this.groups.forEach((group, i) => {
      const row = Math.floor(i / numColumns);
      const col = i % numColumns;
      
      const x = padding + cellWidth * col + cellWidth / 2;
      const y = padding + cellHeight * row + cellHeight / 2;
      
      this.groupPositions.set(group.id, { x, y });
      
      // Update group's position for other visualizers
      if (group.setPosition) {
        group.setPosition(x, y);
      }
    });

    console.log(`Positioned ${numGroups} groups in ${numRows}x${numColumns} grid`);
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
    const dpr = window.devicePixelRatio || 1;
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);

    this.width = rect.width;
    this.height = rect.height;
    this.minDimension = Math.min(this.width, this.height);
  }

  /**
   * Main drawing method.
   */
  draw() {
    if (!this.ctx) {
      console.error("Canvas context not available");
      return;
    }

    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    if (!this.groups || !this.people) {
      return;
    }

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

    // Draw group circle
    this.ctx.beginPath();
    this.ctx.arc(0, 0, this.groupRadius, 0, Math.PI * 2);
    this.ctx.strokeStyle = "#ccc";
    this.ctx.lineWidth = Math.max(1, this.minDimension * 0.002);
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    this.ctx.fill();
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
   * Draws statistics bar for a group showing opinion distribution.
   * @param {Group} group - The group to draw stats for.
   */
  drawGroupStats(group) {
    const positiveCount = group.getOpinionCount(1);
    const negativeCount = group.getOpinionCount(-1);
    const total = positiveCount + negativeCount;

    if (total === 0) return;

    const barWidth = this.groupRadius * 1.4;
    const barHeight = this.groupRadius * 0.15;
    const statsY = -this.groupRadius - barHeight * 2;

    // Background
    this.ctx.fillStyle = "#f0f0f0";
    this.ctx.fillRect(-barWidth/2, statsY, barWidth, barHeight);

    // Positive opinion segment
    if (positiveCount > 0) {
      const positiveWidth = (positiveCount / total) * barWidth;
      this.ctx.fillStyle = this.colors[1];
      this.ctx.fillRect(-barWidth/2, statsY, positiveWidth, barHeight);
    }

    // Negative opinion segment
    if (negativeCount > 0) {
      const negativeWidth = (negativeCount / total) * barWidth;
      const negativeStart = -barWidth/2 + (positiveCount / total) * barWidth;
      this.ctx.fillStyle = this.colors[-1];
      this.ctx.fillRect(negativeStart, statsY, negativeWidth, barHeight);
    }

    // Border
    this.ctx.strokeStyle = "#ccc";
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(-barWidth/2, statsY, barWidth, barHeight);

    // Count labels
    const fontSize = Math.max(8, this.minDimension * 0.012);
    this.ctx.font = `${fontSize}px Arial`;
    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "#333";
    
    const labelY = statsY - fontSize * 0.3;
    this.ctx.fillText(`+1: ${positiveCount} | -1: ${negativeCount}`, 0, labelY);
  }

  /**
   * Draws the group label.
   * @param {Group} group - The group to draw label for.
   */
  drawGroupLabel(group) {
    const fontSize = Math.max(10, this.minDimension * 0.015);
    this.ctx.font = `bold ${fontSize}px Arial`;
    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "#333";
    
    const labelY = this.groupRadius + fontSize * 1.5;
    this.ctx.fillText(`Group ${group.id}`, 0, labelY);
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

    // Draw person dot
    this.ctx.beginPath();
    this.ctx.arc(x, y, Math.max(2, this.minDimension * 0.008), 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.fill();
    
    // Add white border for visibility
    this.ctx.strokeStyle = "#fff";
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
