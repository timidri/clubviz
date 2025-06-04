import { Tester } from "../simulation/Tester.js";
import { Simulator } from "../simulation/Simulator.js";
import { getCurrentConfig } from "../config.js";
import { Club } from "../models/Club.js";
import { Person } from "../models/Person.js";
import { CanvasVisualizer } from "./CanvasVisualizer.js";
import { GraphVisualizer } from "./GraphVisualizer.js";
import { ChartVisualizer } from "./ChartVisualizer.js";
import { TheoryChartVisualizer } from "./TheoryChartVisualizer.js";

/**
 * @fileoverview Defines the Dashboard class, the main controller for the UI and simulation.
 */

/**
 * Manages the overall application, including UI elements, parameter handling,
 * simulation control, and switching between different visualizers.
 */
export class Dashboard {
  /**
   * Initializes the Dashboard, sets up UI elements, binds controls, and starts the visualizer.
   */
  constructor() {
    // Core canvas and rendering context
    this.canvas = document.getElementById("visualization");
    this.ctx = this.canvas.getContext("2d");
    
    // UI Panels
    this.statsPanel = document.getElementById("stats");
    
    this.currentTurn = 0; // Tracks the current turn number of the simulation

    // Initial canvas dimensions from its parent wrapper
    const wrapper = this.canvas.parentElement;
    if (!wrapper) {
      console.error("Canvas wrapper not found!");
      this.width = 600; // Default width
      this.height = 400; // Default height
    } else {
      const rect = wrapper.getBoundingClientRect();
      this.width = rect.width;
      this.height = rect.height;
    }

    // Simulation and data storage
    this.clubs = [];
    this.people = [];
    this.simulator = null;
    
    // Testing and debugging
    this.testingEnabled = false;
    this.tester = null;

    // Initialize with the default visualizer (CanvasVisualizer)
    this.visualizer = new CanvasVisualizer(
      this.canvas,
      this.ctx,
      this.width,
      this.height
    );
    
    this.bindControls(); // Attach event listeners to UI controls
    this.applyParameters(); // Apply initial parameters and set up the simulation
  }

  /**
   * Updates the main canvas dimensions and the visualizer's dimensions.
   * Called on initialization and when toggling testing (which might affect layout).
   */
  updateCanvasSize() {
    const wrapper = this.canvas.parentElement;
    if (!wrapper) return; // Should not happen if constructor check passed
    
    const rect = wrapper.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    if (this.visualizer) {
      this.visualizer.updateDimensions(this.width, this.height);
      // If data exists, reinitialize the visualizer with new dimensions
      if (this.clubs.length > 0 && this.people.length > 0) {
        this.visualizer.initialize(this.clubs, this.people);
      }
    }
  }

  /**
   * Toggles the testing/debugging mode.
   * Creates or removes a Tester instance, associates it with the simulator,
   * and updates UI elements like the stats panel and testing button.
   */
  toggleTesting() {
    this.testingEnabled = !this.testingEnabled;
    const button = document.getElementById("toggleTesting");
    const statsPanel = document.getElementById("stats"); // Re-fetch in case it was removed/re-added

    if (button) {
      button.textContent = `Testing: ${this.testingEnabled ? "On" : "Off"}`;
    }

    if (this.testingEnabled) {
      this.tester = new Tester();
      if (this.simulator) {
        this.simulator.setTester(this.tester);
      }
      if (statsPanel) statsPanel.classList.add("visible");
    } else {
      this.tester = null;
      if (this.simulator) {
        this.simulator.setTester(null);
      }
      if (statsPanel) statsPanel.classList.remove("visible");
    }

    // Update canvas size as toggling testing might change panel visibility and thus layout
    this.updateCanvasSize(); 
    // Re-initialize simulation if it exists to ensure tester is correctly (un)set and visualizer is updated
    if (this.simulator) {
      this.initialize(this.clubs, this.people); 
    }
  }

  /**
   * Binds event listeners to all UI control elements.
   * This includes buttons for stepping through turns, starting/stopping runs,
   * applying parameters, toggling testing, and selecting visualizers.
   * Also handles the trait ratio slider input.
   */
  bindControls() {
    // Turn stepping controls
    document.getElementById("step1")?.addEventListener("click", () => {
      if (this.tester) this.tester.setDebugMode(true); // Enable verbose logging for single step
      this.runTurns(1);
      if (this.tester) this.tester.setDebugMode(false); // Disable verbose logging after single step
    });
    document.getElementById("step10")?.addEventListener("click", () => this.runTurns(10));
    document.getElementById("step100")?.addEventListener("click", () => this.runTurns(100));
    
    // Continuous run controls
    document.getElementById("startRun")?.addEventListener("click", () => this.startContinuousRun());
    document.getElementById("stopRun")?.addEventListener("click", () => this.stopContinuousRun());
    
    // Testing and parameter controls
    document.getElementById("toggleTesting")?.addEventListener("click", () => this.toggleTesting());
    document.getElementById("applyParams")?.addEventListener("click", () => this.applyParameters());
    
    // Visualizer selection
    document.getElementById("visualizerSelect")?.addEventListener("change", (e) => {
      if (e.target) this.switchVisualizer(e.target.value);
    });

    // Trait Ratio Slider
    const traitRatioSlider = document.getElementById("traitRatio");
    const traitRatioValue = document.getElementById("traitRatioValue");
    if (traitRatioSlider && traitRatioValue) {
      traitRatioSlider.addEventListener("input", () => {
        const value = (parseFloat(traitRatioSlider.value) * 100).toFixed(0);
        traitRatioValue.textContent = `${value}%`;
      });
    }
  }

  /**
   * Applies the current parameters from the UI to the simulation.
   * This involves re-creating clubs and people based on the new settings,
   * resetting the turn counter, and re-initializing the simulation and visualizer.
   */
  applyParameters() {
    const config = getCurrentConfig(); // Get latest config from UI and defaults

    // Get initial trait ratio for R from the slider
    const traitRatioSlider = document.getElementById("traitRatio");
    // Default to 0.5 (50% R) if slider not found or value is invalid
    const rProportion = traitRatioSlider ? parseFloat(traitRatioSlider.value) || 0.5 : 0.5;

    // Create Club instances
    const clubs = Array(config.totalClubs)
      .fill(null)
      .map((_, i) => new Club(i));

    // Calculate exact number of people for each trait based on rProportion
    const totalPeople = config.totalPeople;
    const rCount = Math.round(totalPeople * rProportion);
    const bCount = totalPeople - rCount;

    // Create Person instances with the calculated trait distribution
    const people = [];
    for (let i = 0; i < rCount; i++) {
      people.push(new Person(i, "R")); // IDs 0 to rCount-1 are Trait R
    }
    for (let i = 0; i < bCount; i++) {
      people.push(new Person(rCount + i, "B")); // IDs rCount to totalPeople-1 are Trait B
    }

    // Reset turn counter and update display
    this.currentTurn = 0;
    const turnCounterElement = document.getElementById("turnCounter");
    if (turnCounterElement) turnCounterElement.textContent = this.currentTurn.toString();

    // Initialize the dashboard (simulation & visualizer) with new clubs and people
    this.initialize(clubs, people);

    // Update the legend with the new initial trait counts
    if (this.visualizer) {
      this.visualizer.updateLegend({ R: rCount, B: bCount });
    }
  }

  /**
   * Runs the simulation for a specified number of turns.
   * Updates the turn counter display and visualizer after the turns.
   * @param {number} count - The number of turns to run.
   */
  runTurns(count) {
    if (!this.simulator) {
      console.error("Simulator not initialized. Please apply parameters first.");
      return;
    }

    for (let i = 0; i < count; i++) {
      this.simulator.takeTurn();
      this.currentTurn++;
      // Update chart data directly if the ChartVisualizer is active
      // This allows live updates for charts as turns progress.
      if (this.visualizer instanceof ChartVisualizer || this.visualizer instanceof TheoryChartVisualizer) {
        this.visualizer.updateData(this.currentTurn);
      }
    }
    
    // Update turn counter in UI
    const turnCounterElement = document.getElementById("turnCounter");
    if (turnCounterElement) turnCounterElement.textContent = this.currentTurn.toString();
    
    this.draw(); // Redraw the current visualizer to reflect changes

    if (this.tester) {
      this.updateStats(); // Update stats panel if tester is active
    }
  }

  /**
   * Starts a continuous run of the simulation, taking one turn at a set interval.
   */
  startContinuousRun() {
    if (!this.runInterval) { // Prevent multiple intervals
      // Read simulation speed from config, default to 50ms if not defined
      const speed = (this.simulator && this.simulator.config && this.simulator.config.simulationSpeed) ? this.simulator.config.simulationSpeed : 50;
      this.runInterval = setInterval(() => {
        this.runTurns(1);
      }, speed);
      console.log(`Continuous run started with interval: ${speed}ms`);
    }
  }

  /**
   * Stops an ongoing continuous simulation run.
   */
  stopContinuousRun() {
    if (this.runInterval) {
      clearInterval(this.runInterval);
      this.runInterval = null;
      console.log("Continuous run stopped.");
    }
  }

  /**
   * Initializes or re-initializes the dashboard with new sets of clubs and people.
   * Creates a new Simulator instance with the provided data and current configuration.
   * Sets up the tester if enabled, resets the turn counter, and initializes the visualizer.
   * @param {Club[]} clubs - An array of Club objects.
   * @param {Person[]} people - An array of Person objects.
   */
  initialize(clubs, people) {
    this.clubs = clubs;
    this.people = people;
    const config = getCurrentConfig(); // Get the latest configuration

    // Create a new Simulator instance
    this.simulator = new Simulator(people, clubs, config);
    if (this.testingEnabled && this.tester) {
      this.simulator.setTester(this.tester); // Attach tester if active
    }
    
    this.currentTurn = 0; // Reset turn counter
    const turnCounterElement = document.getElementById("turnCounter");
    if (turnCounterElement) turnCounterElement.textContent = this.currentTurn.toString();

    // Initialize the current visualizer with the new data
    if (this.visualizer) {
      try {
        this.visualizer.initialize(this.clubs, this.people);
        this.visualizer.draw(); // Perform an initial draw
        console.log("Visualizer initialized with:", {
          clubs: this.clubs.length,
          people: this.people.length,
          visualizerType: this.visualizer.constructor.name
        });
      } catch (error) {
        console.error("Error initializing visualizer:", error);
      }
    }

    this.updateStats(); // Update the statistics panel
  }

  /**
   * Switches the active visualizer based on the selected type.
   * Cleans up the existing visualizer, creates a new instance of the selected type,
   * and initializes it with the current simulation data.
   * @param {string} type - The type of visualizer to switch to (e.g., "canvas", "graph", "chart").
   */
  switchVisualizer(type) {
    console.log(`Switching visualizer to: ${type}`);
    // Cleanup resources used by the current visualizer
    if (this.visualizer) {
      this.visualizer.cleanup();
    }

    // Create and store the new visualizer instance
    switch (type) {
      case "canvas":
        this.visualizer = new CanvasVisualizer(
          this.canvas,
          this.ctx,
          this.width,
          this.height
        );
        break;
      case "graph":
        this.visualizer = new GraphVisualizer(
          this.canvas, // Note: GraphVisualizer manages its own container, canvas might be hidden
          this.ctx,    // Ctx might not be directly used by GraphVisualizer
          this.width,
          this.height
        );
        break;
      case "chart":
        this.visualizer = new ChartVisualizer(
          this.canvas, // ChartVisualizer manages its own canvas for Chart.js
          this.ctx,
          this.width,
          this.height
        );
        break;
      case "theory":
        this.visualizer = new TheoryChartVisualizer(
          this.canvas, // TheoryChartVisualizer also manages its own canvas
          this.ctx,
          this.width,
          this.height
        );
        break;
      default:
        console.error("Unknown visualizer type selected:", type);
        // Optionally, revert to a default or do nothing
        // For now, we just return to avoid breaking if current visualizer was cleaned up.
        if (!this.visualizer) { // If cleanup happened and new one failed
            this.visualizer = new CanvasVisualizer(this.canvas, this.ctx, this.width, this.height); // Fallback
        }
        this.visualizer.initialize(this.clubs, this.people); // Initialize fallback or existing
        return;
    }

    // Initialize the new visualizer with current simulation state (clubs and people)
    // This is crucial if visualizer is switched mid-simulation.
    if (this.clubs.length > 0 || this.people.length > 0) {
        this.visualizer.initialize(this.clubs, this.people);
    } else {
        // If no data yet (e.g. visualizer switched before first applyParameters), 
        // applyParameters will handle the initialization.
        // However, it's good practice to ensure the visualizer is ready.
        this.visualizer.initialize([], []); // Initialize with empty data to set up its structure
    }
    this.visualizer.draw(); // Draw the newly activated visualizer
  }

  /**
   * Triggers a draw operation on the currently active visualizer.
   */
  draw() {
    if (this.visualizer) {
      try {
        this.visualizer.draw();
      } catch (error) {
        console.error("Error during visualizer.draw():", error, {
          visualizerType: this.visualizer.constructor.name
        });
      }
    }
  }

  /**
   * Updates the statistics panel in the UI with the latest data from the Tester instance.
   * Shows turn count, join rates, and leave rates per club/trait.
   */
  updateStats() {
    if (!this.statsPanel) {
        // Attempt to re-fetch if it was null initially, might have been added dynamically by some visualizers
        this.statsPanel = document.getElementById("stats");
        if (!this.statsPanel) return; // Still not found, exit
    }

    let html = `<span>Turn: ${this.currentTurn}</span>`;

    if (this.tester && this.simulator && this.simulator.config && this.clubs && this.clubs.length > 0) {
      const stats = this.tester.stats;
      // Calculate expected join probability per club (k/C)
      const expectedJoinProbPerClub = (this.simulator.config.joinProbability * 100 / this.clubs.length);
      
      // Join Statistics Section
      html += `<div class="stat-section">
        <h4>Join Statistics (Overall)</h4>
        <p>Expected Rate (per club): ${expectedJoinProbPerClub.toFixed(2)}%</p>
        <p>Actual Rate (overall): ${(stats.join.actualRate * 100).toFixed(2)}% (Attempts: ${stats.join.attempts}, Successes: ${stats.join.successes})</p>
      </div>`;

      // Leave Statistics Section
      if (stats.leave && stats.leave.byClub) {
        html += '<div class="stat-section"><h4>Leave Statistics (by Club & Trait)</h4>';
        stats.leave.byClub.forEach((clubStats, clubId) => {
          if (!clubStats) return; // Skip if club data is null (e.g., gapped club IDs)
          html += `<div class="club-stat">
            <h5>Club ${clubId}</h5>`;
          // Iterate over traits R and B, or whatever is defined in config
          (this.simulator.config.traits || ["R", "B"]).forEach(trait => {
            const traitData = clubStats[trait];
            if (traitData) {
              html += `<p>
                <strong>Trait ${trait}:</strong> 
                Expected Leave: ${(traitData.expectedProb * 100).toFixed(2)}%, 
                Actual Leave: ${(traitData.actualRate * 100).toFixed(2)}% 
                (Attempts: ${traitData.attempts}, Leaves: ${traitData.leaves})
              </p>`;
            } else {
              html += `<p><strong>Trait ${trait}:</strong> No data</p>`;
            }
          });
          html += "</div>";
        });
        html += "</div>";
      }
    } else if (this.tester) {
        html += '<p><em>Simulation data or configuration not fully available for detailed stats.</em></p>';
    }

    this.statsPanel.innerHTML = html;
  }
}
