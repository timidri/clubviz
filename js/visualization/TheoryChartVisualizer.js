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
    const t = config.leaveProbabilityThreshold;
    
    // Get trait ratio from the slider - this is p_pop (proportion of B in population)
    const traitRatioSlider = document.getElementById("traitRatio");
    const p_pop = 1 - (parseFloat(traitRatioSlider.value) || 0.5); // 1 - R proportion = B proportion

    let equilibriumPoints = [];

    // For a club with proportion p of B members:
    // When p < t:
    //   B members leave with p_high, R members with p_low
    // When p > t:
    //   B members leave with p_low, R members with p_high
    
    // Lower equilibrium (p < t):
    // Change in B = k*p_pop/C - p*p_high = 0
    // Change in R = k*(1-p_pop)/C - (1-p)*p_low = 0
    const p1 = 0.25;
    if (p1 < t) {
      equilibriumPoints.push({
        value: p1,
        type: 'lower'
      });
    }
    
    // Upper equilibrium (p > t):
    // Change in B = k*p_pop/C - p*p_low = 0
    // Change in R = k*(1-p_pop)/C - (1-p)*p_high = 0
    const p2 = 0.75;
    if (p2 > t) {
      equilibriumPoints.push({
        value: p2,
        type: 'upper'
      });
    }
    
    // Threshold point from config
    equilibriumPoints.push({
      value: t,
      type: 'threshold'
    });

    // Sort points in ascending order
    equilibriumPoints.sort((a, b) => a.value - b.value);

    return equilibriumPoints;
  }

  initializeCharts() {
    // Get current config
    this.config = getCurrentConfig();
    const equilibriumPoints = this.calculateEquilibriumPoints(this.config);

    const datasets = this.clubs.map((club) => ({
      label: `Club ${club.id}`,
      data: this.clubData.get(club.id).ratios,
      borderColor: `hsl(${(club.id * 137.5) % 360}, 70%, 50%)`,
      borderWidth: 1,
      pointRadius: 2,
      fill: false,
    }));

    // Add equilibrium lines
    equilibriumPoints.forEach(point => {
      const label = `${point.type.charAt(0).toUpperCase() + point.type.slice(1)} Equilibrium (${point.value.toFixed(3)})`;
      const color = point.type === 'upper' ? 'rgba(255, 0, 0, 0.7)' :
                   point.type === 'threshold' ? 'rgba(0, 255, 0, 0.7)' :
                   'rgba(0, 0, 255, 0.7)';
      const borderDash = [5, 5];

      datasets.push({
        label: label,
        data: [point.value],
        borderColor: color,
        borderWidth: 2,
        borderDash: borderDash,
        pointRadius: 0,
        fill: false,
      });
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
      const equilibriumPoints = this.calculateEquilibriumPoints(this.config);
      
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

      // Update equilibrium lines
      const equilibriumDatasets = equilibriumPoints.map(point => {
        const label = `${point.type.charAt(0).toUpperCase() + point.type.slice(1)} Equilibrium (${point.value.toFixed(3)})`;
        const color = point.type === 'upper' ? 'rgba(255, 0, 0, 0.7)' :
                     point.type === 'threshold' ? 'rgba(0, 255, 0, 0.7)' :
                     'rgba(0, 0, 255, 0.7)';

        return {
          label: label,
          data: Array(this.clubData.get(this.clubs[0].id).labels.length).fill(point.value),
          borderColor: color,
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
        };
      });

      this.chart.data.datasets = [...clubDatasets, ...equilibriumDatasets];
      this.chart.update();
    } catch (error) {
      console.error("Error updating theory chart:", error);
    }
  }
} 