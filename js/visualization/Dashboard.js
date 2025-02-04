export class Dashboard {
  constructor() {
    this.canvas = document.getElementById('visualization');
    this.ctx = this.canvas.getContext('2d');
    
    // Get container dimensions
    const container = this.canvas.parentElement;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight || containerWidth * 0.5;
    
    // Set canvas size with proper DPI scaling
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = containerWidth * dpr;
    this.canvas.height = containerHeight * dpr;
    this.canvas.style.width = `${containerWidth}px`;
    this.canvas.style.height = `${containerHeight}px`;
    this.ctx.scale(dpr, dpr);
    
    this.width = containerWidth;
    this.height = containerHeight;
    this.clubs = [];
    this.people = [];
    this.turnCounter = document.getElementById('turnCounter');
    this.currentTurn = 0;

    // Bind control buttons
    this.bindControls();
  }

  bindControls() {
    document.getElementById('step1').addEventListener('click', () => this.runTurns(1));
    document.getElementById('step10').addEventListener('click', () => this.runTurns(10));
    document.getElementById('step100').addEventListener('click', () => this.runTurns(100));
    document.getElementById('startRun').addEventListener('click', () => this.startContinuousRun());
    document.getElementById('stopRun').addEventListener('click', () => this.stopContinuousRun());
  }

  initialize(clubs, people) {
    this.clubs = clubs;
    this.people = people;
    this.currentTurn = 0;
    this.turnCounter.textContent = '0';

    // Position clubs with proper spacing
    const padding = 100; // Fixed padding
    const usableWidth = this.width - (padding * 2);
    const spacing = usableWidth / (clubs.length - 1 || 1);
    
    clubs.forEach((club, i) => {
      club.x = padding + (spacing * i);
      club.y = this.height / 2;
    });

    this.draw();
  }

  draw() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw clubs
    this.clubs.forEach(club => club.draw(this.ctx));

    // Draw people
    this.people.forEach(person => person.draw(this.ctx));
  }

  runTurns(count) {
    for (let i = 0; i < count; i++) {
      this.people.forEach(person => person.takeTurn(this.clubs));
      this.currentTurn++;
      this.turnCounter.textContent = this.currentTurn;
    }
    this.draw();
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
}