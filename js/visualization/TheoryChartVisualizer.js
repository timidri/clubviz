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
    
    // Get trait ratio from the slider - this is r_pop (proportion of R in population)
    const traitRatioSlider = document.getElementById("traitRatio");
    const r_pop = parseFloat(traitRatioSlider.value) || 0.5; // R proportion
    const b_pop = 1 - r_pop; // B proportion

    // Debug log to verify the calculation
    console.log("Population proportions:", {
      R_proportion: r_pop,
      B_proportion: b_pop
    });
    
    console.log("Configuration values:", {
      joinProbability: k,
      totalClubs: C,
      leaveHighProb: p_high,
      leaveLowProb: p_low,
      leaveProbabilityThreshold: t
    });

    let equilibriumPoints = [];

    // Calculate the equilibrium points based on the theoretical model
    // The correct formulas based on the simulation logic in Simulator.js:
    // For p < t (B is underrepresented):
    //   - B members leave with p_high probability
    //   - R members leave with p_low probability
    // For p > t (B is well-represented):
    //   - B members leave with p_low probability
    //   - R members leave with p_high probability
    
    // Lower equilibrium (when p < t):
    // At equilibrium: join_rate_B = leave_rate_B and join_rate_R = leave_rate_R
    // join_rate_B = (k/C) * b_pop
    // leave_rate_B = p * p_high
    // join_rate_R = (k/C) * r_pop
    // leave_rate_R = (1-p) * p_low
    // Solving for p: p = (k/C) * b_pop / p_high
    const join_rate_B = (k/C) * b_pop;
    const join_rate_R = (k/C) * r_pop;
    
    // Lower equilibrium calculation
    // p = join_rate_B / p_high
    const p_lower = join_rate_B / p_high;
    
    // Upper equilibrium calculation
    // p = 1 - (join_rate_R / p_high)
    const p_upper = 1 - (join_rate_R / p_high);
    
    // Debug log to verify the equilibrium calculations
    console.log("Equilibrium calculations:", {
      b_pop,
      r_pop,
      p_high,
      p_low,
      t,
      join_rate_B,
      join_rate_R,
      p_lower,
      p_upper,
      p_lower_formula: `(${k}/${C}) * ${b_pop} / ${p_high}`,
      p_upper_formula: `1 - ((${k}/${C}) * ${r_pop} / ${p_high})`
    });
    
    // Calculate the values step by step for debugging
    console.log("Step-by-step calculation for lower equilibrium:", {
      k,
      C,
      b_pop,
      p_high,
      join_rate_B,
      result: join_rate_B / p_high
    });
    
    console.log("Step-by-step calculation for upper equilibrium:", {
      k,
      C,
      r_pop,
      p_high,
      join_rate_R,
      result: 1 - (join_rate_R / p_high)
    });
    
    // ALWAYS add both equilibrium points regardless of validity or stability
    equilibriumPoints.push({
      value: p_lower,
      type: 'lower'
    });
    
    equilibriumPoints.push({
      value: p_upper,
      type: 'upper'
    });
    
    // Always add threshold point as a reference line
    equilibriumPoints.push({
      value: t,
      type: 'threshold'
    });
    
    // Add population proportion as a reference line
    equilibriumPoints.push({
      value: b_pop,
      type: 'population'
    });

    // Sort points in ascending order
    equilibriumPoints.sort((a, b) => a.value - b.value);
    
    console.log("Final equilibrium points:", equilibriumPoints);

    return equilibriumPoints;
  }

  isStable(p, type, k, C, p_pop, p_high, p_low, t) {
    // For stability, we need to check if the system returns to equilibrium after small perturbations
    // This means checking the derivative of the net flow at the equilibrium point
    
    // Net flow for B members = join_rate_B - leave_rate_B
    // Net flow for R members = join_rate_R - leave_rate_R
    
    const join_rate_B = (k/C) * p_pop;
    const join_rate_R = (k/C) * (1-p_pop);
    
    if (type === 'lower') {
      // For p < t
      // leave_rate_B = p * p_high
      // leave_rate_R = (1-p) * p_low
      
      // Derivative of net flow for B at equilibrium:
      // d(join_rate_B - leave_rate_B)/dp = 0 - p_high
      const d_net_flow_B = -p_high;
      
      // Derivative of net flow for R at equilibrium:
      // d(join_rate_R - leave_rate_R)/dp = 0 - (-p_low)
      const d_net_flow_R = p_low;
      
      // For stability, both derivatives should be negative
      // But for R members, we need to consider d(net_flow_R)/d(1-p) = -d(net_flow_R)/dp
      return d_net_flow_B < 0 && d_net_flow_R > 0;
    } else if (type === 'upper') {
      // For p > t
      // leave_rate_B = p * p_low
      // leave_rate_R = (1-p) * p_high
      
      // Derivative of net flow for B at equilibrium:
      // d(join_rate_B - leave_rate_B)/dp = 0 - p_low
      const d_net_flow_B = -p_low;
      
      // Derivative of net flow for R at equilibrium:
      // d(join_rate_R - leave_rate_R)/dp = 0 - (-p_high)
      const d_net_flow_R = p_high;
      
      // For stability, both derivatives should be negative
      // But for R members, we need to consider d(net_flow_R)/d(1-p) = -d(net_flow_R)/dp
      return d_net_flow_B < 0 && d_net_flow_R > 0;
    } else if (type === 'threshold') {
      // At the threshold, we need to check stability from both sides
      
      // From below (p < t):
      // Net flow for B: join_rate_B - p * p_high
      // Net flow for R: join_rate_R - (1-p) * p_low
      
      // From above (p > t):
      // Net flow for B: join_rate_B - p * p_low
      // Net flow for R: join_rate_R - (1-p) * p_high
      
      // For stability at threshold, the net flow from below should be positive
      // and the net flow from above should be negative
      
      // Net flow for B from below:
      const net_flow_B_below = join_rate_B - t * p_high;
      
      // Net flow for B from above:
      const net_flow_B_above = join_rate_B - t * p_low;
      
      // Debug log for threshold stability
      console.log("Threshold stability check:", {
        t,
        join_rate_B,
        net_flow_B_below,
        net_flow_B_above,
        isStable: net_flow_B_below > 0 && net_flow_B_above < 0
      });
      
      // For stability at threshold:
      // net_flow_B_below > 0 (pushing up towards threshold)
      // net_flow_B_above < 0 (pushing down towards threshold)
      
      return net_flow_B_below > 0 && net_flow_B_above < 0;
    }
    
    return false;
  }

  initializeCharts() {
    // Get current config
    this.config = getCurrentConfig();
    const equilibriumPoints = this.calculateEquilibriumPoints(this.config);
    
    console.log("Initializing chart with equilibrium points:", equilibriumPoints);

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
      let label, color, borderDash, borderWidth;
      
      const formattedValue = (point.value * 100).toFixed(1);
      
      switch(point.type) {
        case 'upper':
          label = `Upper Equilibrium (${formattedValue}% B)`;
          color = 'rgba(255, 0, 0, 0.8)';
          borderDash = [5, 5];
          borderWidth = 3;
          break;
        case 'lower':
          label = `Lower Equilibrium (${formattedValue}% B)`;
          color = 'rgba(0, 0, 255, 0.8)';
          borderDash = [5, 5];
          borderWidth = 3;
          break;
        case 'threshold':
          label = `Threshold (${formattedValue}% B)`;
          color = 'rgba(0, 255, 0, 0.8)';
          borderDash = [10, 5];
          borderWidth = 2;
          break;
        case 'population':
          label = `Population Ratio (${formattedValue}% B)`;
          color = 'rgba(128, 0, 128, 0.8)';
          borderDash = [2, 2];
          borderWidth = 2;
          break;
        default:
          label = `${point.type.charAt(0).toUpperCase() + point.type.slice(1)} (${formattedValue}% B)`;
          color = 'rgba(100, 100, 100, 0.7)';
          borderDash = [5, 5];
          borderWidth = 2;
      }

      // Create an array with the equilibrium value for each turn
      const dataPoints = Array(this.clubData.get(this.clubs[0].id).labels.length).fill(point.value);

      datasets.push({
        label: label,
        data: dataPoints,
        borderColor: color,
        borderWidth: borderWidth,
        borderDash: borderDash,
        pointRadius: 0,
        fill: false,
        // Make sure equilibrium lines are drawn on top
        order: 0
      });
    });

    if (this.chart) {
      this.chart.destroy();
    }

    // Create a new chart with the datasets
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
    
    console.log("Chart initialized with datasets:", datasets);
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
      
      console.log("Drawing equilibrium points:", equilibriumPoints);
      
      // Update chart data including equilibrium lines
      const labels = this.clubData.get(this.clubs[0].id).labels;
      this.chart.data.labels = labels;
      
      // Update club data
      const clubDatasets = this.clubs.map((club) => ({
        label: `Club ${club.id}`,
        data: this.clubData.get(club.id).ratios,
        borderColor: `hsl(${(club.id * 137.5) % 360}, 70%, 50%)`,
        borderWidth: 1,
        pointRadius: 1,
        fill: false,
      }));

      // Update equilibrium lines - ensure they span across all turns
      const equilibriumDatasets = equilibriumPoints.map(point => {
        let label, color, borderDash, borderWidth;
        
        const formattedValue = (point.value * 100).toFixed(1);
        
        switch(point.type) {
          case 'upper':
            label = `Upper Equilibrium (${formattedValue}% B)`;
            color = 'rgba(255, 0, 0, 0.8)';
            borderDash = [5, 5];
            borderWidth = 3;
            break;
          case 'lower':
            label = `Lower Equilibrium (${formattedValue}% B)`;
            color = 'rgba(0, 0, 255, 0.8)';
            borderDash = [5, 5];
            borderWidth = 3;
            break;
          case 'threshold':
            label = `Threshold (${formattedValue}% B)`;
            color = 'rgba(0, 255, 0, 0.8)';
            borderDash = [10, 5];
            borderWidth = 2;
            break;
          case 'population':
            label = `Population Ratio (${formattedValue}% B)`;
            color = 'rgba(128, 0, 128, 0.8)';
            borderDash = [2, 2];
            borderWidth = 2;
            break;
          default:
            label = `${point.type.charAt(0).toUpperCase() + point.type.slice(1)} (${formattedValue}% B)`;
            color = 'rgba(100, 100, 100, 0.7)';
            borderDash = [5, 5];
            borderWidth = 2;
        }

        // Create an array of the same value for each turn
        const dataPoints = Array(labels.length).fill(point.value);

        return {
          label: label,
          data: dataPoints,
          borderColor: color,
          borderWidth: borderWidth,
          borderDash: borderDash,
          pointRadius: 0,
          fill: false,
          // Make sure equilibrium lines are drawn on top
          order: 0
        };
      });

      // Combine datasets and update chart
      const allDatasets = [...clubDatasets, ...equilibriumDatasets];
      console.log("Chart datasets:", allDatasets);
      
      this.chart.data.datasets = allDatasets;
      this.chart.update();
    } catch (error) {
      console.error("Error updating theory chart:", error);
    }
  }
} 