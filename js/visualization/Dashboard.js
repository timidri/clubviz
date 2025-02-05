import { Tester } from "../simulation/Tester.js";
import { Simulator } from "../simulation/Simulator.js";

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
  }

  runTurns(count) {
    if (!this.simulator) {
      console.error("Simulator not initialized. Please initialize first.");
      return;
    }

    for (let i = 0; i < count; i++) {
      this.simulator.takeTurn();
      this.currentTurn++;
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
    this.simulator = new Simulator(people, clubs);
    if (this.testingEnabled && this.tester) {
      this.simulator.setTester(this.tester);
    }
    this.currentTurn = 0;
    this.updateStats(); // This will update the turn counter in stats panel

    // Position clubs with proper spacing
    const padding = 100;
    const usableWidth = this.width - padding * 2;
    const spacing = usableWidth / (clubs.length - 1 || 1);

    clubs.forEach((club, i) => {
      club.x = padding + spacing * i;
      club.y = this.height / 2;
    });

    this.draw();
  }

  draw() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw clubs
    this.clubs.forEach((club) => club.draw(this.ctx));

    // Draw people
    this.people.forEach((person) => person.draw(this.ctx));
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
