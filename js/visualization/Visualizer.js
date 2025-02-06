export class Visualizer {
  constructor(canvas, ctx, width, height) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  // Initialize the visualizer with data
  initialize(clubs, people) {
    throw new Error("initialize() must be implemented by subclass");
  }

  // Update the visualization
  draw() {
    throw new Error("draw() must be implemented by subclass");
  }

  // Clean up any resources when switching visualizers
  cleanup() {
    // Default implementation - can be overridden by subclasses if needed
  }

  // Update dimensions when canvas size changes
  updateDimensions(width, height) {
    this.width = width;
    this.height = height;
  }

  // Update legend with current data
  updateLegend(traitCounts) {
    document.querySelectorAll(".legend-item").forEach((item) => {
      const label = item.querySelector(".legend-label");
      const trait = label.textContent.trim().split(" ")[1]; // Get M or F from "Trait M" or "Trait F"
      const count = traitCounts[trait];

      // Remove existing count if any
      const existingCount = label.querySelector(".trait-count");
      if (existingCount) {
        existingCount.remove();
      }

      const countSpan = document.createElement("span");
      countSpan.className = "trait-count";
      countSpan.textContent = count;
      label.appendChild(countSpan);
    });
  }
}
