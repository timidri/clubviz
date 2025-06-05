#!/usr/bin/env node

/**
 * Automated test script for Random Intersection Graph simulation
 * Tests core functionality without browser dependencies
 */

// Mock DOM/Browser APIs for Node.js testing
global.window = { devicePixelRatio: 1 };
global.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: () => ({ style: {} }),
  addEventListener: () => {}
};

// Simple console-based Canvas mock
const mockCanvas = {
  getContext: () => ({
    clearRect: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    scale: () => {},
    setTransform: () => {},
    beginPath: () => {},
    arc: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    fillText: () => {},
    stroke: () => {},
    fill: () => {},
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: '',
    textBaseline: ''
  }),
  width: 800,
  height: 600,
  style: {}
};

// Import modules (using dynamic import for ES modules)
async function runTests() {
  try {
    console.log("🧪 Starting Random Intersection Graph Simulation Tests");
    console.log("=" .repeat(60));

    // Test 1: Configuration
    console.log("\n📋 Test 1: Configuration System");
    const { getCurrentConfig, validateConfig, MODEL_TYPES } = await import('./js/config.js');
    
    const config = getCurrentConfig();
    console.log("✅ Configuration loaded:", config);
    
    const errors = validateConfig(config);
    if (errors.length === 0) {
      console.log("✅ Configuration validation passed");
    } else {
      console.log("❌ Configuration validation failed:", errors);
    }

    // Test 2: Model Creation
    console.log("\n🏗️  Test 2: Model Creation");
    const { Person } = await import('./js/models/Person.js');
    const { Group } = await import('./js/models/Club.js');
    
    // Create test people
    const person1 = new Person(0, 1);
    const person2 = new Person(1, -1);
    console.log("✅ Created people:", {
      person1: { id: person1.id, opinion: person1.getOpinion() },
      person2: { id: person2.id, opinion: person2.getOpinion() }
    });
    
    // Create test groups
    const group1 = new Group(0, 1.0);
    const group2 = new Group(1, 1.0);
    console.log("✅ Created groups:", {
      group1: { id: group1.id, weight: group1.weight },
      group2: { id: group2.id, weight: group2.weight }
    });
    
    // Test connections
    person1.addToGroup(group1);
    group1.addPerson(person1);
    person2.addToGroup(group1);
    group1.addPerson(person2);
    
    console.log("✅ Connected people to groups");
    console.log("   Group 1 members:", group1.getMemberCount());
    console.log("   Person 1 groups:", person1.getGroups().size);

    // Test 3: Graph Initialization
    console.log("\n🔗 Test 3: Graph Initialization");
    const { GraphInitializer } = await import('./js/simulation/GraphInitializer.js');
    
    // Create smaller test config
    const testConfig = {
      ...config,
      n: 10,  // Smaller for testing
      m: 3
    };
    
    const initializer = new GraphInitializer(testConfig);
    const { people, groups } = initializer.createGraph();
    
    console.log("✅ Graph initialized successfully");
    console.log(`   Created ${people.length} people, ${groups.length} groups`);
    
    // Validate connections
    let totalConnections = 0;
    people.forEach(person => {
      totalConnections += person.getGroups().size;
    });
    console.log(`   Total connections: ${totalConnections}`);

    // Test 4: Simulator
    console.log("\n⚙️  Test 4: Simulator");
    const { Simulator } = await import('./js/simulation/Simulator.js');
    
    try {
      const simulator = new Simulator(people, groups, testConfig);
      console.log("✅ Simulator created successfully");
      
      // Test a single turn
      const initialStats = simulator.getStatistics();
      console.log("   Initial statistics:", {
        turn: initialStats.currentTurn,
        totalEdges: initialStats.totalEdges,
        opinions: initialStats.opinionDistribution
      });
      
      // Try taking one turn
      const turnResult = simulator.takeTurn();
      console.log("✅ Simulation turn completed");
      console.log("   Turn result:", {
        turn: turnResult.turn,
        edgeChanges: turnResult.edgeChanges,
        opinionChanges: turnResult.opinionChanges
      });
      
    } catch (simError) {
      console.log("❌ Simulator error:", simError.message);
      console.log("   This needs to be fixed for the simulation to work");
    }

    // Test 5: Visualizer (basic initialization)
    console.log("\n🎨 Test 5: Visualizer");
    try {
      const { CanvasVisualizer } = await import('./js/visualization/CanvasVisualizer.js');
      const visualizer = new CanvasVisualizer(mockCanvas, mockCanvas.getContext(), 800, 600);
      visualizer.initialize(groups, people);
      console.log("✅ Visualizer initialized successfully");
    } catch (vizError) {
      console.log("❌ Visualizer error:", vizError.message);
    }

    console.log("\n" + "=" .repeat(60));
    console.log("🎉 Test suite completed!");
    console.log("✨ Check above for any ❌ errors that need fixing");

  } catch (error) {
    console.error("💥 Test suite failed:", error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the tests
runTests(); 