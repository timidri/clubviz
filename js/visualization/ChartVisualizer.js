import { Visualizer } from "./Visualizer.js";

export class ChartVisualizer extends Visualizer {
  constructor(canvas, ctx, width, height) {
    super(canvas, ctx, width, height);
    this.chartContainer = document.createElement("div");
    this.chartContainer.style.width = `${width}px`;
    this.chartContainer.style.height = `${height}px`;
    this.chartContainer.style.display = "none";
    this.canvas.parentElement.appendChild(this.chartContainer);

    // Create a canvas element for Chart.js
    this.chartCanvas = document.createElement("canvas");
    this.chartCanvas.style.width = "100%";
    this.chartCanvas.style.height = "100%";
    this.chartContainer.appendChild(this.chartCanvas);

    this.chart = null;
    this.clubData = new Map(); // Store historical data for each club
  }

  initialize(clubs, people) {
    this.clubs = clubs;
    this.people = people;

    // Hide main canvas and show chart container
    this.canvas.style.display = "none";
    this.chartContainer.style.display = "block";

    // Clear existing data
    this.clubData.clear();

    // Initialize data structure for each club
    this.clubs.forEach((club) => {
      this.clubData.set(club.id, {
        labels: [0], // Turn numbers
        ratios: [0], // Trait ratios
      });
    });

    // Destroy existing chart if any
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    // Update legend with initial trait counts
    const traitCounts = {
      R: this.people.filter(person => person.trait === "R").length,
      B: this.people.filter(person => person.trait === "B").length
    };
    this.updateLegend(traitCounts);

    this.initializeCharts();
  }

  initializeCharts() {
    const datasets = this.clubs.map((club) => ({
      label: `Club ${club.id}`,
      data: this.clubData.get(club.id).ratios,
      borderColor: `hsl(${(club.id * 137.5) % 360}, 70%, 50%)`,
      borderWidth: 1,
      pointRadius: 2,
      fill: false,
    }));

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(this.chartCanvas.getContext("2d"), {
      type: "line",
      data: {
        labels: [0],
        datasets: datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          x: {
            title: {
              display: true,
              text: "Turn",
            },
          },
          y: {
            title: {
              display: true,
              text: "Proportion of B",
            },
            min: 0,
            max: 1,
          },
        },
        plugins: {
          legend: {
            display: true,
            position: "top",
          },
        },
      },
    });
  }

  updateData(turn) {
    if (!this.chart || !this.clubs) return;

    this.clubs.forEach((club) => {
      const bCount = club.getTraitCount("B");
      const total = club.getMemberCount();

      let ratio = 0;
      if (total > 0) {
        // Calculate proportion of B in the club
        ratio = bCount / total;
      }

      const clubData = this.clubData.get(club.id);
      clubData.labels.push(turn);
      clubData.ratios.push(ratio);
    });

    // Update legend with current trait counts
    const traitCounts = {
      R: this.people.filter(person => person.trait === "R").length,
      B: this.people.filter(person => person.trait === "B").length
    };
    this.updateLegend(traitCounts);

    this.draw();
  }

  draw() {
    if (!this.chart) return;

    try {
      // Update chart data
      this.chart.data.labels = this.clubData.get(this.clubs[0].id).labels;
      this.chart.data.datasets = this.clubs.map((club) => ({
        label: `Club ${club.id}`,
        data: this.clubData.get(club.id).ratios,
        borderColor: `hsl(${(club.id * 137.5) % 360}, 70%, 50%)`,
        borderWidth: 1,
        pointRadius: 1,
        fill: false,
      }));

      this.chart.update();
    } catch (error) {
      console.error("Error updating chart:", error);
    }
  }

  updateDimensions(width, height) {
    super.updateDimensions(width, height);
    if (this.chartContainer) {
      this.chartContainer.style.width = `${width}px`;
      this.chartContainer.style.height = `${height}px`;
      if (this.chart) {
        this.chart.resize();
      }
    }
  }

  cleanup() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    if (this.chartContainer) {
      this.chartContainer.style.display = "none";
    }
    this.canvas.style.display = "block";
    this.clubData.clear();
  }
}
