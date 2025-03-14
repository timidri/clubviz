import { ChartVisualizer } from "./ChartVisualizer.js";
import { getCurrentConfig } from "../config.js";

export class TheoryChartVisualizer extends ChartVisualizer {
  constructor(canvas, ctx, width, height) {
    super(canvas, ctx, width, height);
    this.config = getCurrentConfig();
  }

  calculateEquilibriumPoints(config) {
    const k = config.joinProbability;
    const C = config.totalClubs;
    const p_high = config.leaveHighProb;
    const p_low = config.leaveLowProb;

    // Calculate equilibrium points using corrected formulas
    // When B is majority (upper equilibrium), R leaves with p_high
    const upperEquilibrium = C / (C + 1);
    
    // When B is minority (lower equilibrium), B leaves with p_high
    const lowerEquilibrium = 1 / (C + 1);

    return {
      upper: upperEquilibrium,
      lower: lowerEquilibrium
    };
  }

  initializeCharts() {
    // Get current config
    this.config = getCurrentConfig();
    const equilibrium = this.calculateEquilibriumPoints(this.config);

    const datasets = this.clubs.map((club) => ({
      label: `Club ${club.id}`,
      data: this.clubData.get(club.id).ratios,
      borderColor: `hsl(${(club.id * 137.5) % 360}, 70%, 50%)`,
      borderWidth: 1,
      pointRadius: 2,
      fill: false,
    }));

    // Add theoretical equilibrium lines
    datasets.push({
      label: `Upper Equilibrium (${equilibrium.upper.toFixed(3)})`,
      data: [equilibrium.upper],
      borderColor: 'rgba(255, 0, 0, 0.7)',
      borderWidth: 2,
      borderDash: [5, 5],
      pointRadius: 0,
      fill: false,
    });

    datasets.push({
      label: `Lower Equilibrium (${equilibrium.lower.toFixed(3)})`,
      data: [equilibrium.lower],
      borderColor: 'rgba(0, 0, 255, 0.7)',
      borderWidth: 2,
      borderDash: [5, 5],
      pointRadius: 0,
      fill: false,
    });

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
            grid: {
              display: true,
              drawBorder: true,
            }
          },
          y: {
            title: {
              display: true,
              text: "Proportion of B",
            },
            min: 0,
            max: 1,
            grid: {
              display: true,
              drawBorder: true,
            },
            ticks: {
              stepSize: 0.1
            }
          },
        },
        plugins: {
          legend: {
            display: true,
            position: "top",
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                if (context.dataset.label.includes('Equilibrium')) {
                  return context.dataset.label;
                }
                return `${context.dataset.label}: ${context.raw.toFixed(3)}`;
              }
            }
          }
        },
      },
    });
  }

  initialize(clubs, people) {
    this.clubs = clubs;
    this.people = people;
    this.config = getCurrentConfig();
    super.initialize(clubs, people);
  }

  draw() {
    if (!this.chart || !this.clubs) return;

    try {
      // Get current config and calculate equilibrium points
      this.config = getCurrentConfig();
      const equilibrium = this.calculateEquilibriumPoints(this.config);
      
      // Update chart data including equilibrium lines
      this.chart.data.labels = this.clubData.get(this.clubs[0].id).labels;
      
      // Update club data
      const clubDatasets = this.clubs.map((club) => ({
        label: `Club ${club.id}`,
        data: this.clubData.get(club.id).ratios,
        borderColor: `hsl(${(club.id * 137.5) % 360}, 70%, 50%)`,
        borderWidth: 1,
        pointRadius: 1,
        fill: false,
      }));

      // Update equilibrium lines with current values
      const upperEquilibriumData = Array(this.clubData.get(this.clubs[0].id).labels.length).fill(equilibrium.upper);
      const lowerEquilibriumData = Array(this.clubData.get(this.clubs[0].id).labels.length).fill(equilibrium.lower);

      this.chart.data.datasets = [
        ...clubDatasets,
        {
          label: `Upper Equilibrium (${equilibrium.upper.toFixed(3)})`,
          data: upperEquilibriumData,
          borderColor: 'rgba(255, 0, 0, 0.7)',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
        },
        {
          label: `Lower Equilibrium (${equilibrium.lower.toFixed(3)})`,
          data: lowerEquilibriumData,
          borderColor: 'rgba(0, 0, 255, 0.7)',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
        }
      ];

      this.chart.update();
    } catch (error) {
      console.error("Error updating theory chart:", error);
    }
  }
} 