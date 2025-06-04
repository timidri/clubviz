/**
 * @fileoverview Defines the base Visualizer class.
 */

/**
 * Abstract base class for all visualizers.
 * Defines a common interface for initialization, drawing, cleanup, and dimension updates.
 * Also provides a shared method for updating the legend in the UI.
 */
export class Visualizer {
  /**
   * Constructs a new Visualizer instance.
   * @param {HTMLCanvasElement} canvas - The main canvas element for drawing.
   * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the main canvas.
   * @param {number} width - The initial width of the visualization area.
   * @param {number} height - The initial height of the visualization area.
   */
  constructor(canvas, ctx, width, height) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.minDimension = Math.min(width, height); // Useful for responsive sizing
  }

  /**
   * Initializes the visualizer with simulation data (clubs and people).
   * This method must be implemented by subclasses.
   * @param {Club[]} clubs - An array of Club objects.
   * @param {Person[]} people - An array of Person objects.
   */
  initialize(clubs, people) {
    throw new Error("initialize() must be implemented by subclass");
  }

  /**
   * Draws the current state of the visualization.
   * This method must be implemented by subclasses.
   */
  draw() {
    throw new Error("draw() must be implemented by subclass");
  }

  /**
   * Cleans up any resources, event listeners, or DOM elements created by the visualizer.
   * Called when switching to a different visualizer or when the dashboard is reinitialized.
   * Subclasses should override this if they need specific cleanup logic.
   */
  cleanup() {
    // Default implementation does nothing. Subclasses can override.
    // For example, ChartVisualizer and GraphVisualizer remove their specific DOM elements.
  }

  /**
   * Updates the internal dimensions of the visualizer, typically when the canvas size changes.
   * @param {number} width - The new width.
   * @param {number} height - The new height.
   */
  updateDimensions(width, height) {
    this.width = width;
    this.height = height;
    this.minDimension = Math.min(width, height);
  }

  /**
   * Updates the legend in the UI with the current counts for each trait.
   * It assumes legend items in the HTML have a specific structure.
   * @param {object} traitCounts - An object mapping trait names to their counts (e.g., { R: 10, B: 5 }).
   */
  updateLegend(traitCounts) {
    document.querySelectorAll('.legend-item').forEach(item => {
      const labelElement = item.querySelector('.legend-label');
      if (!labelElement) return;

      // Extract trait from a structure like "Trait R" or "Trait B"
      // This is brittle if the label text changes format significantly.
      const labelText = labelElement.textContent.trim();
      const trait = labelText.includes('Trait R') ? 'R' : labelText.includes('Trait B') ? 'B' : null;

      if (trait && traitCounts.hasOwnProperty(trait)) {
        const count = traitCounts[trait] || 0;

        // Find or create the count span
        let countSpan = labelElement.querySelector('.trait-count');
        if (!countSpan) {
          countSpan = document.createElement('span');
          countSpan.className = 'trait-count';
          countSpan.style.marginLeft = '4px'; // Ensure spacing if newly created
          // Insert the count span after the main label text but before other potential children.
          // This assumes the main label text is the first child node of labelElement.
          if (labelElement.firstChild) {
            labelElement.insertBefore(countSpan, labelElement.firstChild.nextSibling);
          } else {
            labelElement.appendChild(countSpan);
          }
        }
        countSpan.textContent = ` (${count})`;

        // Ensure text color of the label and count matches the established trait colors
        // Based on defaultConfig where R is Pink/Red, B is Blue
        const color = trait === 'R' ? '#E91E63' : '#2196F3';
        labelElement.style.color = color;
        // Ensure the countSpan also gets the color. It might be nested differently.
        // A more robust way might be to set color on a parent and use CSS `currentColor`.
        Array.from(labelElement.childNodes).forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                // Wrap text node in a span to color it, if not already done.
                // This is a bit complex; simpler HTML structure for legend items is preferred.
            } else if (node.style) {
                 node.style.color = color; // Apply to child elements like the count span
            }
        });
        // Explicitly color the count span as a fallback
        countSpan.style.color = color;

      } else if (trait) {
        console.warn(`Trait "${trait}" found in legend HTML but not in traitCounts data.`);
      }
    });
  }
}
