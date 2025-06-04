import { ChartVisualizer } from "./ChartVisualizer.js";
import { getCurrentConfig } from "../config.js";

/**
 * @fileoverview Defines the TheoryChartVisualizer class.
 * Extends ChartVisualizer to overlay theoretical equilibrium points on the trait proportion chart.
 */

/**
 * Visualizes actual trait proportions alongside calculated theoretical equilibrium points.
 * This helps in comparing the simulation's emergent behavior with theoretical predictions.
 * Extends the ChartVisualizer class.
 */
export class TheoryChartVisualizer extends ChartVisualizer {
  /**
   * Constructs a TheoryChartVisualizer instance.
   * @param {HTMLCanvasElement} canvas - The main canvas element.
   * @param {CanvasRenderingContext2D} ctx - The 2D rendering context.
   * @param {number} width - Initial width of the chart container.
   * @param {number} height - Initial height of the chart container.
   */
  constructor(canvas, ctx, width, height) {
    super(canvas, ctx, width, height);
    this.config = getCurrentConfig(); // Store current config for theoretical calculations
    this.equilibriumLines = []; // To store dataset objects for equilibrium lines
  }

  /**
   * Calculates theoretical equilibrium points for the proportion of trait B in a club.
   * Based on a model where join rates and leave rates for each trait balance out.
   * Considers different leave probabilities (p_high, p_low) based on whether trait B
   * is underrepresented (proportion < threshold t) or well-represented (proportion > threshold t).
   * 
   * @param {object} config - The simulation configuration object containing parameters like
   *                          joinProbability (k), totalClubs (C), leaveHighProb (p_high),
   *                          leaveLowProb (p_low), leaveProbabilityThreshold (t).
   * @returns {object[]} An array of objects, each representing an equilibrium or reference point.
   *                     Each object has `value` (the proportion) and `type` (e.g., 'lower', 'upper', 'threshold').
   */
  calculateEquilibriumPoints(config) {
    const k = config.joinProbability;
    const C = config.totalClubs;
    const p_high = config.leaveHighProb;
    const p_low = config.leaveLowProb;
    const t = config.leaveProbabilityThreshold;
    
    const traitRatioSlider = document.getElementById("traitRatio");
    // r_pop is the proportion of Trait R in the overall population
    const r_pop = traitRatioSlider ? parseFloat(traitRatioSlider.value) || 0.5 : 0.5; 
    const b_pop = 1 - r_pop; // b_pop is the proportion of Trait B in the overall population

    console.log("TheoryChart: Population proportions for equilibrium calc:", { R_proportion: r_pop, B_proportion: b_pop });
    console.log("TheoryChart: Config for equilibrium calc:", { k, C, p_high, p_low, t });

    let equilibriumPoints = [];

    // Model: At equilibrium, for each trait, (Join Rate) = (Leave Rate)
    // Join Rate for a trait = (k/C) * (population_proportion_of_trait) * (1 - proportion_of_trait_members_in_club_already)
    // More simply, assuming a large pool of non-members:
    // Effective Inflow Rate for B = (k/C) * b_pop 
    // Effective Inflow Rate for R = (k/C) * r_pop
    // Let m_B = proportion of B-people who are members of this club (club's B-membership saturation for B-people)
    // Let m_R = proportion of R-people who are members of this club
    // At equilibrium for B-people: (k/C) * b_pop * (1 - m_B) = m_B * actual_leave_prob_B
    // => m_B = ( (k/C) * b_pop ) / ( (k/C) * b_pop + actual_leave_prob_B )
    // Simplified further if we consider join probability for an individual B person to a club: (k/C)
    // Then at equilibrium for the B population in the club:
    // Number of B joining = (Total B people NOT in club) * (k/C)
    // Number of B leaving = (Total B people IN club) * actual_leave_prob_B
    // Let N_B_pop = total B people in sim.
    // Let N_B_club = number of B in club.
    // (N_B_pop - N_B_club) * (k/C) = N_B_club * actual_leave_prob_B
    // Let p = N_B_club / (N_B_club + N_R_club) be the proportion of B in the club.

    // The derivation used in the code: 
    // membership_rate_B = (k/C) / ((k/C) + actual_leave_prob_B_for_a_B_person)
    // membership_rate_R = (k/C) / ((k/C) + actual_leave_prob_R_for_an_R_person)
    // Then, p (proportion of B in club) = (m_B * b_pop) / (m_B * b_pop + m_R * r_pop)

    // Case 1: p < t (B is underrepresented in the club)
    //   - B people leave with p_high.
    //   - R people leave with p_low (as R is overrepresented if B is under).
    const mb_lower_case = (k/C) / ((k/C) + p_high); // membership rate for B people when B is underrepresented
    const mr_lower_case = (k/C) / ((k/C) + p_low);  // membership rate for R people when B is underrepresented (so R is over)
    const p_lower = (mb_lower_case * b_pop) / 
                    (mb_lower_case * b_pop + mr_lower_case * r_pop);
    if (isFinite(p_lower)) {
        equilibriumPoints.push({ value: p_lower, type: 'lower', stable: this.isStable(p_lower, 'lower', k, C, b_pop, p_high, p_low, t) });
    }
    
    // Case 2: p > t (B is well-represented in the club)
    //   - B people leave with p_low.
    //   - R people leave with p_high (as R is underrepresented if B is over).
    const mb_upper_case = (k/C) / ((k/C) + p_low);  // membership rate for B people when B is well-represented
    const mr_upper_case = (k/C) / ((k/C) + p_high); // membership rate for R people when B is well-represented (so R is under)
    const p_upper = (mb_upper_case * b_pop) / 
                    (mb_upper_case * b_pop + mr_upper_case * r_pop);
    if (isFinite(p_upper)) {
        equilibriumPoints.push({ value: p_upper, type: 'upper', stable: this.isStable(p_upper, 'upper', k, C, b_pop, p_high, p_low, t) });
    }
        
    // Add threshold 't' as a reference line
    equilibriumPoints.push({ value: t, type: 'threshold', stable: false }); // Threshold itself isn't an equilibrium
    
    // Add population proportion of B (b_pop) as a reference line
    // This is where p would be if club membership was random and traits didn't affect leaving.
    equilibriumPoints.push({ value: b_pop, type: 'population', stable: false });

    // Filter out NaN/undefined values and sort points
    equilibriumPoints = equilibriumPoints.filter(pt => isFinite(pt.value) && pt.value >= 0 && pt.value <= 1);
    equilibriumPoints.sort((a, b) => a.value - b.value);
    
    // Remove duplicate points (can happen if, e.g., p_lower = t)
    equilibriumPoints = equilibriumPoints.filter((pt, index, self) => 
        index === self.findIndex(p => p.value === pt.value && p.type === pt.type) || 
        index === self.findIndex(p => p.value === pt.value) // Keep first instance of a value if types differ but values are same
    );
    // A simpler unique filter if type doesn't strictly matter for unique value lines:
    // equilibriumPoints = [...new Map(equilibriumPoints.map(item => [item.value, item])).values()];


    console.log("TheoryChart: Calculated equilibrium points:", equilibriumPoints);

    // Perform stability analysis (console logs for now)
    this.analyzeStability(k, C, b_pop, r_pop, p_high, p_low, t, p_lower, p_upper);

    return equilibriumPoints;
  }

  /**
   * Analyzes the stability of the calculated equilibrium points (p_lower, p_upper) 
   * and the barrier between them. This is more of a qualitative analysis.
   * Outputs to console.
   * @param {number} k - Join probability factor.
   * @param {number} C - Total number of clubs.
   * @param {number} b_pop - Proportion of trait B in the population.
   * @param {number} r_pop - Proportion of trait R in the population.
   * @param {number} p_high - High leave probability.
   * @param {number} p_low - Low leave probability.
   * @param {number} t - Leave probability threshold.
   * @param {number} p_lower - The lower equilibrium point for B proportion.
   * @param {number} p_upper - The upper equilibrium point for B proportion.
   */
  analyzeStability(k, C, b_pop, r_pop, p_high, p_low, t, p_lower, p_upper) {
    const lower_dist_from_t = Math.abs(t - p_lower);
    const upper_dist_from_t = Math.abs(p_upper - t);
    const feedback_strength = p_high - p_low; // Difference in leave probabilities
    
    // A simple proxy for fluctuation potential around an equilibrium.
    // Higher k/C means more joining events, higher average leave prob means more leaving.
    const typical_event_rate_factor = (k/C) + (p_high + p_low) / 2;

    // A conceptual measure of the 'energy barrier' to cross from one state to another via the threshold t.
    // Smaller distance to threshold or weaker feedback makes the barrier smaller.
    let barrier_lower_to_t = lower_dist_from_t * feedback_strength;
    let barrier_upper_to_t = upper_dist_from_t * feedback_strength;
    
    console.log("TheoryChart: Stability Analysis Metrics", {
      p_lower: p_lower,
      p_upper: p_upper,
      threshold_t: t,
      lower_dist_from_t,
      upper_dist_from_t,
      feedback_strength, // Larger is more separating
      typical_event_rate_factor, // Proxy for 'noise' or 'temperature'
      barrier_lower_to_t, // Conceptual barrier height from p_lower to t
      barrier_upper_to_t  // Conceptual barrier height from p_upper to t
    });
    // Note: This analysis is qualitative and for informational purposes.
    // Real stability depends on stochastic effects not fully captured here.
    return { /* Can return these values if needed elsewhere */ };
  }

  /**
   * Checks the local stability of a given equilibrium point `p`.
   * An equilibrium is stable if, after a small perturbation, the system tends to return to `p`.
   * This is approximated by checking the sign of the derivative of the net flow of B-trait members.
   * If d(NetFlow_B)/dp < 0, it's stable for B. 
   * For overall stability, R-trait flow must also be considered, effectively d(NetFlow_R)/dr < 0, which is -d(NetFlow_R)/dp < 0 or d(NetFlow_R)/dp > 0.
   *
   * @param {number} p_eq - The equilibrium proportion of B-trait members being checked (e.g., p_lower or p_upper).
   * @param {string} type - Type of equilibrium ('lower' or 'upper') to determine which leave probabilities apply around p_eq.
   * @param {number} k - Join probability factor.
   * @param {number} C - Total number of clubs.
   * @param {number} b_pop - Proportion of trait B in the population.
   * @param {number} p_high - High leave probability.
   * @param {number} p_low - Low leave probability.
   * @param {number} t - Leave probability threshold.
   * @returns {boolean} True if the point is considered locally stable, false otherwise.
   */
  isStable(p_eq, type, k, C, b_pop, p_high, p_low, t) {
    // Simplified net flow: F(p) = Inflow_B(p) - Outflow_B(p)
    // Inflow_B is roughly constant from b_pop: (k/C) * b_pop * (1 - m_B(p)) where m_B is B-membership saturation
    // Outflow_B depends on p: m_B(p) * leave_prob_B(p)
    // The model used in calculateEquilibriumPoints is based on m_B and m_R.
    // For local stability, we check if a small increase in p (proportion of B in club)
    // leads to a net outflow of B, and a small decrease leads to a net inflow.
    // This means d(NetFlow_B)/dp should be negative at p_eq.
    // And for R, d(NetFlow_R)/dr should be negative (where r=1-p), so -d(NetFlow_R)/dp < 0 => d(NetFlow_R)/dp > 0

    let d_NetFlow_B_dp; // Derivative of net flow of B with respect to p
    let d_NetFlow_R_dp; // Derivative of net flow of R with respect to p

    // Effective join probability for an individual of a trait to a club (simplified)
    const common_join_term = k / C;

    if (type === 'lower') {
      // Around p_lower, we assume p < t.
      // B members leave with p_high. R members leave with p_low.
      // NetFlow_B = b_pop * common_join_term * (1-p) - p * p_high * p (if p is fraction of B people in club, complex)
      // Using the formulation from calculateEquilibriumPoints implicitly:
      // At p_lower, B is underrepresented. A slight increase in p (still < t) means B still leaves at p_high.
      // d(Outflow_B)/dp associated with p_high. d(Inflow_B)/dp is complex, but if m_B increases, inflow decreases.
      // A simpler view: if p increases, does B get pushed out more or pulled in less?
      // If p is proportion of B in club: d(p * LeaveProb_B)/dp. If LeaveProb_B is const (p_high), then it's p_high.
      // So, d_NetFlow_B_dp tends to be negative (dominated by increased outflow or decreased inflow).
      d_NetFlow_B_dp = -p_high; // Approximation: dominant term from outflow change.
      d_NetFlow_R_dp = p_low;  // Approximation: dominant term from outflow change for R (opposite sign due to dp for B).
    } else if (type === 'upper') {
      // Around p_upper, we assume p > t.
      // B members leave with p_low. R members leave with p_high.
      d_NetFlow_B_dp = -p_low;
      d_NetFlow_R_dp = p_high;
    } else {
      return false; // Threshold or population points are not stable equilibria themselves.
    }
    
    // Condition for stability: B flow pushes p down if p increases (d_NetFlow_B_dp < 0)
    // AND R flow also pushes p down if p increases (meaning R members decrease, d_NetFlow_R_dp > 0, pushing r down)
    const stable = d_NetFlow_B_dp < 0 && d_NetFlow_R_dp > 0;
    // console.log(`TheoryChart: Stability for type '${type}' at p_eq=${p_eq.toFixed(3)}: dNetB/dp=${d_NetFlow_B_dp.toFixed(3)}, dNetR/dp=${d_NetFlow_R_dp.toFixed(3)} => stable=${stable}`);
    return stable;
  }

  /**
   * Initializes or reconfigures the Chart.js instance for this visualizer.
   * This method is typically called after the base ChartVisualizer's initialize and initializeCharts,
   * or whenever the theoretical lines need to be redrawn based on new parameters.
   * It calculates equilibrium points and adds them as distinct, styled datasets to the chart.
   */
  initializeCharts() {
    // It's assumed that super.initializeCharts() or a similar setup for basic chart 
    // has already been done if this method is called in a context of overriding/extending.
    // If this visualizer fully owns chart creation, super.initializeCharts() might not be needed here
    // or this method replaces it.
    // For this class, `super.initialize` calls `super.initializeCharts`, then this one adds to it.

    if (!this.chart || !this.clubs || this.clubs.length === 0) {
      console.warn("TheoryChartVisualizer: Chart or club data not ready for initializing theory lines.");
      // Attempt to call the base class chart initialization if chart doesn't exist
      // This ensures that the basic chart structure is in place.
      if (!this.chart && typeof super.initializeCharts === 'function') {
          super.initializeCharts(); 
          if (!this.chart) { // If still no chart, cannot proceed
            console.error("TheoryChartVisualizer: Base chart initialization failed.");
            return;
          }
      } else if (!this.chart) {
          return; // Cannot proceed without a chart instance
      }
    }

    this.config = getCurrentConfig(); // Ensure config is up-to-date for calculations
    const equilibriumPoints = this.calculateEquilibriumPoints(this.config);

    // Prepare new datasets: start with existing club data lines
    // Filter out any old theory lines before adding new ones to prevent duplication.
    const existingClubDatasets = this.chart.data.datasets.filter(
        dataset => !(dataset.isTheoryLine)
    );
    let newDatasets = [...existingClubDatasets];

    // Add new datasets for each equilibrium point/reference line
    equilibriumPoints.forEach(point => {
      let label, color, borderDash, borderWidth, pointStyle = 'line';
      const formattedValue = (point.value * 100).toFixed(1); // Value as percentage

      switch(point.type) {
        case 'upper':
          label = `Upper Eq. (${formattedValue}% B${point.stable ? '*':''})`; // Mark stable points
          color = 'rgba(255, 0, 0, 0.7)'; // Red
          borderDash = [8, 4]; // Dashed line
          borderWidth = 2.5;
          break;
        case 'lower':
          label = `Lower Eq. (${formattedValue}% B${point.stable ? '*':''})`; // Mark stable points
          color = 'rgba(0, 0, 255, 0.7)'; // Blue
          borderDash = [8, 4]; // Dashed line
          borderWidth = 2.5;
          break;
        case 'threshold':
          label = `Threshold (${formattedValue}% B)`;
          color = 'rgba(0, 128, 0, 0.7)'; // Green
          borderDash = [10, 5];
          borderWidth = 1.5;
          break;
        case 'population':
          label = `Pop. Ratio (${formattedValue}% B)`;
          color = 'rgba(128, 0, 128, 0.7)'; // Purple
          borderDash = [2, 2];
          borderWidth = 1.5;
          break;
        default:
          label = `${point.type.charAt(0).toUpperCase() + point.type.slice(1)} (${formattedValue}%)`;
          color = 'rgba(100, 100, 100, 0.6)'; // Grey
          borderDash = [5, 5];
          borderWidth = 1;
      }

      // Create an array of the same equilibrium value, matching the length of current x-axis labels
      const numDataPoints = this.chart.data.labels?.length || 1;
      const dataPoints = Array(numDataPoints).fill(point.value * 100); // Convert to percentage for y-axis

      newDatasets.push({
        label: label,
        data: dataPoints,
        borderColor: color,
        backgroundColor: color, // For legend box
        borderWidth: borderWidth,
        borderDash: borderDash,
        pointRadius: 0, // No points on theory lines
        fill: false,
        tension: 0,
        order: -1, // Attempt to draw theory lines underneath actual data lines
        isTheoryLine: true // Custom property to identify these lines later
      });
    });

    this.chart.data.datasets = newDatasets;
    this.chart.update(); // Update the chart with new/modified datasets
    console.log("TheoryChartVisualizer: Chart updated with equilibrium lines.");
  }

  /**
   * Overrides the base class initialize method.
   * Sets the local configuration and then calls the superclass's initialize method,
   * which in turn will call this class's overridden initializeCharts if structured correctly,
   * or this class might need to call initializeCharts explicitly after super.initialize.
   * @param {Club[]} clubs - An array of Club objects.
   * @param {Person[]} people - An array of Person objects.
   */
  initialize(clubs, people) {
    console.log("TheoryChartVisualizer: Initializing...");
    this.config = getCurrentConfig(); // Get latest config before anything else
    // Call super.initialize, which sets up this.clubs, this.people, and basic chart structure via super.initializeCharts()
    super.initialize(clubs, people); 
    
    // After super.initialize (which calls super.initializeCharts), 
    // now call this class's initializeCharts to add theoretical lines.
    // This ensures the chart object (this.chart) is created by the parent first.
    this.initializeCharts(); 
    this.updateLegendTitle();
  }

   /**
   * Updates the legend title to indicate that it includes theoretical lines.
   */
  updateLegendTitle() {
    if (this.chart && this.chart.options && this.chart.options.plugins && this.chart.options.plugins.legend) {
      // This is a bit of a hack if Chart.js doesn't directly support a title *within* the legend box easily.
      // A common approach is to have an external title for the chart or legend area.
      // For now, we can modify the main chart title or log a message.
      if (this.chart.options.plugins.title) {
        this.chart.options.plugins.title.text = `Club Trait Proportions & Theoretical Equilibria`;
      } else {
        console.log("TheoryChartVisualizer: Legend includes theoretical lines.");
      }
    }
  }

  /**
   * Overrides the draw method to recalculate and redraw theoretical lines along with actual data.
   * This ensures that if configuration changes, the theoretical lines adapt.
   */
  draw() {
    if (!this.chart || !this.clubs || this.clubs.length === 0) {
      // console.warn("TheoryChartVisualizer: Chart or data not ready for draw.");
      return;
    }
    
    // Call the super.draw() method to draw the actual club data lines.
    // super.draw() calls this.chart.update(), so theory lines should be added *before* that, or chart updated again.
    // A better pattern: super.updateData() prepares data, then this.draw() adds theory lines, then one chart.update().
    // For now, let's ensure data is updated by parent first.
    super.draw(); // This will update and draw club actuals.

    // Now, re-calculate and add/update theoretical lines based on current config.
    // This might cause a second chart update if super.draw() already updated.
    // It's generally fine but less optimal than a single update.
    this.config = getCurrentConfig(); // Get latest config, as it might have changed
    
    // The actual addition of theory lines and final chart update is handled by initializeCharts here,
    // which is called by this.initialize, and also suitable for re-calculating lines. 
    // If initializeCharts is too heavy (e.g. full chart recreation), a lighter update method for theory lines would be better.
    this.initializeCharts(); // This recalculates equilibrium points and updates datasets

    // No need to call this.chart.update() again if initializeCharts does it.
  }
} 