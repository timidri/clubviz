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

    // Show chart container
    this.chartContainer.style.display = "block";

    // Initialize data structure for each club
    this.clubs.forEach((club) => {
      if (!this.clubData.has(club.id)) {
        this.clubData.set(club.id, {
          labels: [0], // Turn numbers
          ratios: [0], // Trait ratios
        });
      }
    });

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
              text: "Trait Ratio",
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
    this.clubs.forEach((club) => {
      const rCount = club.getTraitCount("R");
      const bCount = club.getTraitCount("B");
      const total = club.getMemberCount();

      let ratio = 0;
      if (total > 0) {
        // Calculate ratio (smaller trait count / larger trait count)
        ratio = rCount > bCount ? bCount / rCount : rCount / bCount;
      }

      const clubData = this.clubData.get(club.id);
      clubData.labels.push(turn);
      clubData.ratios.push(ratio);
    });

    this.draw();
  }

  draw() {
    if (!this.chart) return;

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
  }

  updateDimensions(width, height) {
    super.updateDimensions(width, height);
    this.chartContainer.style.width = `${width}px`;
    this.chartContainer.style.height = `${height}px`;
    if (this.chart) {
      this.chart.resize();
    }
  }

  cleanup() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    this.chartContainer.style.display = "none";
  }
}
