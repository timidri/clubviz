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

    // MARKOV CHAIN MODEL: Each club is an independent Markov chain
    // A person's membership in one club doesn't affect their behavior in other clubs
    
    // For each club, we need to model:
    // 1. The flow of B-trait people in and out
    // 2. The flow of R-trait people in and out
    // At equilibrium, these flows balance
    
    // For B-trait people:
    // - Join rate: (k/C) * b_pop * (1 - membership_rate_B)
    // - Leave rate: membership_rate_B * leave_prob_B
    // Where membership_rate_B is the proportion of B-trait people who are members
    
    // For R-trait people:
    // - Join rate: (k/C) * r_pop * (1 - membership_rate_R)
    // - Leave rate: membership_rate_R * leave_prob_R
    // Where membership_rate_R is the proportion of R-trait people who are members
    
    // At equilibrium, join rate = leave rate for each trait
    // This gives us:
    // membership_rate_B = (k/C) / ((k/C) + leave_prob_B)
    // membership_rate_R = (k/C) / ((k/C) + leave_prob_R)
    
    // The proportion of B in the club is:
    // p = (membership_rate_B * b_pop) / (membership_rate_B * b_pop + membership_rate_R * r_pop)
    
    // We have two cases to consider:
    // 1. p < t: B leaves with p_high, R leaves with p_high
    // 2. p > t: B leaves with p_low, R leaves with p_low
    // (Symmetric threshold for both traits)
    
    // Case 1: p < t (both traits use high leave probability if underrepresented)
    const membership_rate_B_lower = (k/C) / ((k/C) + p_high);
    const membership_rate_R_lower = (k/C) / ((k/C) + p_high);
    const p_lower = (membership_rate_B_lower * b_pop) /
                   (membership_rate_B_lower * b_pop + membership_rate_R_lower * r_pop);
    
    // Case 2: p > t (both traits use low leave probability if well-represented)
    const membership_rate_B_upper = (k/C) / ((k/C) + p_low);
    const membership_rate_R_upper = (k/C) / ((k/C) + p_low);
    const p_upper = (membership_rate_B_upper * b_pop) /
                   (membership_rate_B_upper * b_pop + membership_rate_R_upper * r_pop);
    
    // Verify symmetry: if we swap B and R, we should get complementary values
    const r_lower = 1 - p_lower;
    const r_upper = 1 - p_upper;
    
    console.log("Markov chain equilibrium calculations:", {
      b_pop,
      r_pop,
      p_high,
      p_low,
      t,
      membership_rate_B_lower,
      membership_rate_R_lower,
      p_lower,
      r_lower,
      membership_rate_B_upper,
      membership_rate_R_upper,
      p_upper,
      r_upper
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

    // Calculate stability metrics to determine likelihood of transitions
    const stability_analysis = this.analyzeStability(k, C, b_pop, r_pop, p_high, p_low, t, p_lower, p_upper);
    
    console.log("Stability analysis:", stability_analysis);

    return equilibriumPoints;
  }

  analyzeStability(k, C, b_pop, r_pop, p_high, p_low, t, p_lower, p_upper) {
    // Calculate the stability of each equilibrium point and the barrier between them
    
    // 1. Distance from threshold - smaller distance means less stability
    const lower_distance = t - p_lower;
    const upper_distance = p_upper - t;
    
    // 2. Strength of feedback - smaller difference between p_high and p_low means weaker feedback
    const feedback_strength = p_high - p_low;
    
    // 3. Stochastic fluctuation size - depends on population size and join/leave rates
    // Higher join/leave rates relative to population size create larger fluctuations
    const fluctuation_factor = (k/C) + ((p_high + p_low) / 2);
    
    // 4. Barrier height - smaller barrier means easier transitions
    const barrier_height = Math.min(lower_distance, upper_distance) * feedback_strength;
    
    // 5. Transition likelihood - higher value means more frequent transitions
    const transition_likelihood = fluctuation_factor / barrier_height;
    
    return {
      lower_distance,
      upper_distance,
      feedback_strength,
      fluctuation_factor,
      barrier_height,
      transition_likelihood,
      recommendations: {
        increase_transitions: [
          "Set threshold t closer to equilibrium points (currently " + t.toFixed(2) + ")",
          "Reduce the difference between p_high and p_low (currently " + feedback_strength.toFixed(2) + ")",
          "Increase join probability k (currently " + k.toFixed(2) + ")",
          "Decrease number of clubs C (currently " + C + ")",
          "Make trait distribution more balanced (currently B:" + b_pop.toFixed(2) + ", R:" + r_pop.toFixed(2) + ")"
        ],
        optimal_values: {
          t_optimal: ((p_lower + p_upper) / 2).toFixed(2),
          p_high_optimal: Math.min(0.9, p_high * 0.8).toFixed(2),
          p_low_optimal: Math.max(0.1, p_low * 1.2).toFixed(2),
          k_optimal: Math.min(1, k * 1.2).toFixed(2)
        }
      }
    };
  }

  isStable(p, type, k, C, p_pop, p_high, p_low, t) {
    // For stability, we need to check if the system returns to equilibrium after small perturbations
    // This means checking the derivative of the net flow at the equilibrium point
    
    // Net flow for B members = join_rate_B - leave_rate_B
    // Net flow for R members = join_rate_R - leave_rate_R
    
    const join_rate_B = (k/C) * p_pop;
    const join_rate_R = (k/C) * (1-p_pop);
    
    if (type === 'lower') {
      // For p < t (B underrepresented, R well-represented)
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
      // For p > t (B well-represented, R underrepresented)
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