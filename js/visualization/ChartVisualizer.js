import { Visualizer } from "./Visualizer.js";

/**
 * @fileoverview Defines the ChartVisualizer class for rendering simulation data as a time-series chart using Chart.js.
 */

/**
 * Visualizes the proportion of a specific trait (e.g., "B") in each club over simulation turns.
 * Uses the Chart.js library to render a line chart.
 * Creates its own canvas for Chart.js within a dedicated container div, hiding the main simulation canvas.
 * Extends the base Visualizer class.
 */
export class ChartVisualizer extends Visualizer {
  /**
   * Constructs a ChartVisualizer instance.
   * Sets up a dedicated container and canvas for Chart.js.
   * @param {HTMLCanvasElement} canvas - The main simulation canvas (will be hidden).
   * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the main canvas (not directly used by Chart.js).
   * @param {number} width - Initial width for the chart container.
   * @param {number} height - Initial height for the chart container.
   */
  constructor(canvas, ctx, width, height) {
    super(canvas, ctx, width, height);
    
    // Create a container div for the chart to manage its own layout
    this.chartContainer = document.createElement("div");
    this.chartContainer.style.width = `${width}px`;
    this.chartContainer.style.height = `${height}px`;
    this.chartContainer.style.position = "relative"; // Needed for Chart.js responsiveness
    this.chartContainer.style.display = "none"; // Initially hidden
    this.canvas.parentElement.appendChild(this.chartContainer);

    // Create a new canvas element specifically for Chart.js to draw on
    this.chartCanvas = document.createElement("canvas");
    // Chart.js will handle the sizing of this canvas within the container
    this.chartContainer.appendChild(this.chartCanvas);

    this.chart = null; // Holds the Chart.js instance
    this.clubs = [];   // To store club objects passed during initialization
    this.people = [];  // To store people objects, used for legend updates
    this.clubData = new Map(); // Stores historical data per club: Map<club.id, {labels: number[], ratios: number[]}>
    this.maxTurnsInChart = 100; // Max number of data points (turns) to show on the chart before sliding
    this.traitToTrack = "B"; // The specific trait whose proportion will be charted
  }

  /**
   * Initializes the ChartVisualizer with club and people data.
   * Hides the main canvas, shows the chart container, and prepares data structures.
   * Calls initializeCharts to create/update the Chart.js instance.
   * @param {Club[]} clubs - An array of Club objects.
   * @param {Person[]} people - An array of Person objects.
   */
  initialize(clubs, people) {
    this.clubs = clubs;
    this.people = people; 

    // Hide main simulation canvas and show the chart's container
    this.canvas.style.display = "none";
    this.chartContainer.style.display = "block";
    this.updateDimensions(this.width, this.height); // Ensure chart container has correct initial size

    // Clear any existing historical data
    this.clubData.clear();

    // Initialize data storage for each club
    // Starts with a single point at turn 0 with 0% proportion
    this.clubs.forEach((club) => {
      this.clubData.set(club.id, {
        labels: [0], // Turn numbers (x-axis)
        ratios: [0], // Trait proportions (y-axis)
      });
    });

    // Update the main legend (managed by base Visualizer class)
    const traitCounts = {
      R: this.people.filter(person => person.trait === "R").length,
      B: this.people.filter(person => person.trait === "B").length
    };
    this.updateLegend(traitCounts); // Update legend with overall R/B counts

    this.initializeCharts(); // Create or update the Chart.js chart instance
  }

  /**
   * Creates or reconfigures the Chart.js line chart instance.
   * Sets up datasets for each club to display their trait proportions.
   */
  initializeCharts() {
    const datasets = this.clubs.map((club, index) => ({
      label: `Club ${club.id} (${this.traitToTrack}%)`, // Legend label for this club's line
      data: this.clubData.get(club.id).ratios, // Initial data (should be [0])
      borderColor: this.getClubColor(index, this.clubs.length), // Unique color for the line
      fill: false, // Do not fill area under the line
      tension: 0.1, // Slight curve for the lines
      borderWidth: 1.5, // Line thickness
      pointRadius: 1, // Size of data points on the line
      pointHoverRadius: 3, // Size of data points on hover
    }));

    if (this.chart) {
      this.chart.destroy(); // Destroy existing chart if any, before creating a new one
    }

    this.chart = new Chart(this.chartCanvas.getContext("2d"), {
      type: "line",
      data: {
        labels: this.clubData.get(this.clubs[0].id)?.labels || [0], // Initial labels (should be [0])
        datasets: datasets,
      },
      options: {
        responsive: true, // Chart will resize with its container
        maintainAspectRatio: false, // Allow chart to fill container height/width independently
        animation: false, // Disable animation for performance during live updates
        scales: {
          x: {
            title: {
              display: true,
              text: "Turn Number",
            },
            ticks: {
              maxTicksLimit: 20, // Limit x-axis ticks for readability
            }
          },
          y: {
            title: {
              display: true,
              text: `Proportion of Trait ${this.traitToTrack} (%)`,
            },
            min: 0,
            max: 100, // Y-axis fixed from 0% to 100%
            ticks: {
                stepSize: 10, // Y-axis ticks every 10%
                callback: function(value) { return value + '%'; } // Add '%' to y-axis labels
            }
          },
        },
        plugins: {
          legend: {
            display: true,
            position: "top", // Position of the chart's own legend
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
                label: function(context) { // Custom tooltip label format
                    let label = context.dataset.label || '';
                    if (label) {
                        label += ': ';
                    }
                    if (context.parsed.y !== null) {
                        label += context.parsed.y.toFixed(2) + '%';
                    }
                    return label;
                }
            }
          }
        }
      },
    });
  }

  /**
   * Generates a distinct color for a club's line on the chart using HSL color space.
   * @param {number} index - The index of the club.
   * @param {number} totalClubs - The total number of clubs.
   * @returns {string} An HSL color string (e.g., "hsl(120, 70%, 50%)").
   */
  getClubColor(index, totalClubs) {
    const hue = (index * (360 / Math.max(1, totalClubs))) % 360; // Distribute hues evenly
    return `hsl(${hue}, 70%, 50%)`; // Consistent saturation and lightness
  }

  /**
   * Updates the chart's data with trait proportions for the current simulation turn.
   * This method is called by the Dashboard after simulation turns.
   * @param {number} currentTurn - The current simulation turn number.
   */
  updateData(currentTurn) {
    if (!this.chart || !this.clubs || this.clubs.length === 0) return; // Ensure chart and clubs are initialized

    // Update data for each club
    this.clubs.forEach((club) => {
      const clubHistory = this.clubData.get(club.id);
      if (!clubHistory) return; // Should not happen if initialized correctly

      const totalMembers = club.getMemberCount();
      const traitCount = club.getTraitCount(this.traitToTrack);
      const proportion = totalMembers > 0 ? (traitCount / totalMembers) * 100 : 0;

      // Add new data point for the current turn
      // If the currentTurn is the same as the last label, update the last point (e.g. multiple calls for same turn)
      if (clubHistory.labels.length > 0 && clubHistory.labels[clubHistory.labels.length - 1] === currentTurn) {
        clubHistory.ratios[clubHistory.ratios.length - 1] = proportion;
      } else {
        clubHistory.labels.push(currentTurn);
        clubHistory.ratios.push(proportion);
      }

      // Implement a sliding window for the data if maxTurnsInChart is exceeded
      if (clubHistory.labels.length > this.maxTurnsInChart) {
        clubHistory.labels.shift(); // Remove the oldest turn label
        clubHistory.ratios.shift(); // Remove the oldest data point
      }
    });

    // Update the main legend with overall R/B counts (could be done less frequently)
    const traitCounts = {
      R: this.people.filter(person => person.trait === "R").length,
      B: this.people.filter(person => person.trait === "B").length
    };
    this.updateLegend(traitCounts);

    this.draw(); // Trigger a chart redraw
  }

  /**
   * Redraws the chart by updating its data and calling Chart.js's update method.
   */
  draw() {
    if (!this.chart || !this.clubs || this.clubs.length === 0) return;

    try {
      // Use labels from the first club as the common x-axis for all datasets
      // This assumes all clubs are updated for the same set of turns.
      const commonLabels = this.clubData.get(this.clubs[0].id)?.labels || [];
      this.chart.data.labels = commonLabels;
      
      // Update data for each dataset (club line)
      this.chart.data.datasets.forEach((dataset, index) => {
        if (this.clubs[index]) {
          const clubHistory = this.clubData.get(this.clubs[index].id);
          if (clubHistory) {
            dataset.data = clubHistory.ratios;
          }
        }
      });
      
      this.chart.update(); // Tell Chart.js to re-render
    } catch (error) {
      console.error("Error updating ChartVisualizer:", error);
    }
  }

  /**
   * Updates the dimensions of the chart container.
   * Chart.js should responsively resize the canvas within the container.
   * @param {number} width - The new width for the chart container.
   * @param {number} height - The new height for the chart container.
   */
  updateDimensions(width, height) {
    super.updateDimensions(width, height); // Update base class dimensions (if needed for other logic)
    if (this.chartContainer) {
      this.chartContainer.style.width = `${width}px`;
      this.chartContainer.style.height = `${height}px`;
      if (this.chart) {
        this.chart.resize(); // Instruct Chart.js to resize its canvas
      }
    }
  }

  /**
   * Cleans up resources used by the ChartVisualizer.
   * Destroys the Chart.js instance and removes the chart container from the DOM.
   * Makes the main simulation canvas visible again.
   */
  cleanup() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    // Remove the chart container div from the DOM
    if (this.chartContainer && this.chartContainer.parentElement) {
      this.chartContainer.parentElement.removeChild(this.chartContainer);
      // No need to nullify this.chartContainer as the instance of ChartVisualizer is being discarded
    }
    this.canvas.style.display = "block"; // Show the main simulation canvas again
    this.clubData.clear(); // Clear stored historical data
    console.log("ChartVisualizer cleaned up.");
  }
}
