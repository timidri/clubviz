import { Tester } from "../simulation/Tester.js";
import { Simulator } from "../simulation/Simulator.js";
import { getCurrentConfig } from "../config.js";
import { Club } from "../models/Club.js";
import { Person } from "../models/Person.js";
import { CanvasVisualizer } from "./CanvasVisualizer.js";
import { GraphVisualizer } from "./GraphVisualizer.js";

export class Dashboard {
  constructor() {
    this.canvas = document.getElementById("visualization");
    this.ctx = this.canvas.getContext("2d");
    this.statsPanel = document.getElementById("stats");
    this.currentTurn = 0;

    // Get container dimensions
    const container = this.canvas.parentElement;
    this.containerWidth = container.clientWidth;
    this.containerHeight = container.clientHeight || this.containerWidth * 0.5;

    this.updateCanvasSize();
    this.clubs = [];
    this.people = [];
    this.simulator = null;
    this.testingEnabled = false;
    this.tester = null;

    // Initialize visualizer
    this.visualizer = new CanvasVisualizer(
      this.canvas,
      this.ctx,
      this.width,
      this.height
    );
    this.bindControls();
  }

  updateCanvasSize() {
    // Get the wrapper dimensions
    const wrapper = this.canvas.parentElement;
    const rect = wrapper.getBoundingClientRect();

    // Set canvas size with proper DPI scaling
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    // Set display size
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;

    // Scale context
    this.ctx.scale(dpr, dpr);

    // Update internal dimensions
    this.width = rect.width;
    this.height = rect.height;

    // Update visualizer dimensions
    if (this.visualizer) {
      this.visualizer.updateDimensions(this.width, this.height);
    }
  }

  toggleTesting() {
    this.testingEnabled = !this.testingEnabled;
    const button = document.getElementById("toggleTesting");
    const statsPanel = document.getElementById("stats");
    button.textContent = `Testing: ${this.testingEnabled ? "On" : "Off"}`;

    if (this.testingEnabled) {
      this.tester = new Tester();
      if (this.simulator) {
        this.simulator.setTester(this.tester);
      }
      statsPanel.classList.add("visible");
    } else {
      this.tester = null;
      if (this.simulator) {
        this.simulator.setTester(null);
      }
      statsPanel.classList.remove("visible");
    }

    // Update canvas size and redraw
    this.updateCanvasSize();
    if (this.simulator) {
      this.initialize(this.clubs, this.people);
    }
  }

  bindControls() {
    document.getElementById("step1").addEventListener("click", () => {
      if (this.tester) this.tester.setDebugMode(true);
      this.runTurns(1);
      if (this.tester) this.tester.setDebugMode(false);
    });
    document
      .getElementById("step10")
      .addEventListener("click", () => this.runTurns(10));
    document
      .getElementById("step100")
      .addEventListener("click", () => this.runTurns(100));
    document
      .getElementById("startRun")
      .addEventListener("click", () => this.startContinuousRun());
    document
      .getElementById("stopRun")
      .addEventListener("click", () => this.stopContinuousRun());
    document
      .getElementById("toggleTesting")
      .addEventListener("click", () => this.toggleTesting());
    document
      .getElementById("applyParams")
      .addEventListener("click", () => this.applyParameters());
    document
      .getElementById("visualizerSelect")
      .addEventListener("change", (e) => this.switchVisualizer(e.target.value));
  }

  applyParameters() {
    const config = getCurrentConfig();
    
    // Add debug logging to verify config values
    console.log("Current configuration:", config);

    // Create clubs
    const clubs = Array(config.totalClubs)
      .fill()
      .map((_, i) => new Club(i));

    // Create people with random traits but no initial club memberships
    const people = Array(config.totalPeople)
      .fill()
      .map((_, i) => {
        const trait = Math.random() < 0.5 ? "M" : "F";
        return new Person(i, trait);
      });

    // Initialize dashboard with clubs and people
    this.initialize(clubs, people);
  }

  runTurns(count) {
    if (!this.simulator) {
      console.error("Simulator not initialized. Please initialize first.");
      return;
    }

    for (let i = 0; i < count; i++) {
      this.simulator.takeTurn();
      this.currentTurn++;
      document.getElementById("turnCounter").textContent = this.currentTurn;
    }
    this.draw();

    if (this.tester) {
      this.updateStats();
    }
  }

  startContinuousRun() {
    if (!this.runInterval) {
      this.runInterval = setInterval(() => {
        this.runTurns(1);
      }, 50); // Much faster update (20 fps)
    }
  }

  stopContinuousRun() {
    if (this.runInterval) {
      clearInterval(this.runInterval);
      this.runInterval = null;
    }
  }

  initialize(clubs, people) {
    this.clubs = clubs;
    this.people = people;
    const config = getCurrentConfig();
    
    // Debug logging to verify config values before creating simulator
    console.log("Initializing simulator with config:", {
      leaveHighProb: config.leaveHighProb,
      leaveLowProb: config.leaveLowProb,
      threshold: config.leaveProbabilityThreshold
    });
    
    this.simulator = new Simulator(people, clubs, config);
    if (this.testingEnabled && this.tester) {
      this.simulator.setTester(this.tester);
    }
    this.currentTurn = 0;
    document.getElementById("turnCounter").textContent = this.currentTurn;
    this.updateStats(); // This will update the turn counter in stats panel

    // Initialize visualizer with data
    this.visualizer.initialize(clubs, people);
  }

  switchVisualizer(type) {
    let newVisualizer;
    if (type === "canvas") {
      newVisualizer = new CanvasVisualizer(
        this.canvas,
        this.ctx,
        this.width,
        this.height
      );
    } else if (type === "graph") {
      newVisualizer = new GraphVisualizer(
        this.canvas,
        this.ctx,
        this.width,
        this.height
      );
    }

    if (newVisualizer) {
      if (this.visualizer) {
        this.visualizer.cleanup();
      }
      this.visualizer = newVisualizer;
      this.visualizer.updateDimensions(this.width, this.height);
      if (this.clubs.length > 0 && this.people.length > 0) {
        this.visualizer.initialize(this.clubs, this.people);
      }
    }
  }

  draw() {
    if (this.visualizer) {
      this.visualizer.draw();
    }
  }

  updateStats() {
    if (!this.statsPanel) return;

    let html = `<span>Turn: ${this.currentTurn}</span>`;

    if (this.tester) {
      const stats = this.tester.stats;
      // Join statistics
      html += `<div class="stat-section">
        <h4>Join Statistics</h4>
        <p>Expected Rate: ${(100 / this.clubs.length).toFixed(2)}%</p>
        <p>Actual Rate: ${(stats.join.actualRate * 100).toFixed(2)}%</p>
      </div>`;

      // Leave statistics
      html += '<div class="stat-section"><h4>Leave Statistics by Club</h4>';
      stats.leave.byClub.forEach((clubStats, clubId) => {
        html += `<div class="club-stat">
          <h5>Club ${clubId}</h5>`;
        Object.entries(clubStats).forEach(([trait, traitStats]) => {
          html += `<p>${trait} - Expected: ${(
            traitStats.expectedProb * 100
          ).toFixed(2)}%, Actual: ${(traitStats.actualRate * 100).toFixed(
            2
          )}%</p>`;
        });
        html += "</div>";
      });
      html += "</div>";
    }

    this.statsPanel.innerHTML = html;
  }
}
