# ClubViz API Documentation

This document provides comprehensive API documentation for the ClubViz social network simulation platform.

## Table of Contents

- [Core Classes](#core-classes)
- [Configuration System](#configuration-system)
- [Simulation Engine](#simulation-engine)
- [Visualization System](#visualization-system)
- [Data Models](#data-models)
- [Utility Functions](#utility-functions)

## Core Classes

### Dashboard

The main controller class that manages the entire application.

```javascript
class Dashboard {
  constructor()
  async initialize(): Promise<void>
  async applyParameters(): Promise<boolean>
  takeSingleTurn(): void
  startContinuousRun(): void
  stopContinuousRun(): void
  exportData(format?: string): void
  exportGraph(): void
  resetSimulation(): void
}
```

#### Methods

**`constructor()`**
- Creates a new Dashboard instance
- Initializes UI state and component references
- Does not perform async initialization

**`initialize(): Promise<void>`**
- Asynchronously initializes the dashboard
- Sets up UI components and creates initial graph
- Throws error if initialization fails

**`applyParameters(): Promise<boolean>`**
- Applies current UI parameters to simulation
- Validates configuration and reinitializes graph
- Returns true if successful, false otherwise

**`takeSingleTurn(): void`**
- Executes one simulation step
- Updates visualization and statistics
- Checks for convergence

**`exportData(format?: string): void`**
- Exports simulation data in specified format
- Supported formats: 'csv', 'json' (default: 'csv')
- Downloads file automatically

### Simulator

Core simulation engine that executes model dynamics.

```javascript
class Simulator {
  constructor(people: Person[], groups: Group[], config: Config)
  takeTurn(): SimulationResult
  getStatistics(): Statistics
  setTester(tester: Tester): void
  get convergenceReached(): boolean
}
```

#### Properties

**`convergenceReached: boolean`**
- Read-only property indicating if simulation has converged
- Based on stability and homophily criteria

#### Methods

**`takeTurn(): SimulationResult`**
- Executes one simulation turn
- Returns object with turn number and statistics
- Updates internal state

**`getStatistics(): Statistics`**
- Returns current simulation statistics
- Includes network metrics and opinion distribution

## Configuration System

### getCurrentConfig()

Retrieves current configuration from UI elements.

```javascript
function getCurrentConfig(): Config
```

**Returns:** Complete configuration object with validated values

### validateConfig(config)

Validates configuration parameters.

```javascript
function validateConfig(config: Config): string[]
```

**Parameters:**
- `config`: Configuration object to validate

**Returns:** Array of error messages (empty if valid)

### Configuration Object

```typescript
interface Config {
  // Graph Structure
  n: number;              // Number of individuals
  m: number;              // Number of clubs
  lambda: number;         // Connectivity parameter
  
  // Model Selection
  modelType: string;      // Model type identifier
  
  // Schelling Parameters
  c: number;              // Edge creation rate
  gFunction: string;      // G-function type
  gSteepness: number;     // G-function steepness
  
  // Voter Parameters
  gamma: number;          // Opinion change rate
  lambdaVoter: number;    // Pairwise update rate
  
  // SIR Parameters
  betaSIR: number;        // Infection rate
  gammaSIR: number;       // Recovery rate
  
  // Initial Conditions
  initialOpinionSplit: number;  // Opinion distribution
  
  // Visualization & Control
  traits: number[];       // Opinion values
  colors: object;         // Color mapping
  simulationSpeed: number;      // Animation speed
  maxTurns: number;            // Maximum turns
  convergenceThreshold: number; // Convergence threshold
}
```

## Simulation Engine

### GraphInitializer

Creates Random Intersection Graphs based on configuration.

```javascript
class GraphInitializer {
  constructor(config: Config)
  createGraph(): {people: Person[], groups: Group[]}
  validateGraph(people: Person[], groups: Group[]): void
}
```

#### Methods

**`createGraph(): {people: Person[], groups: Group[]}`**
- Creates complete RIG with specified parameters
- Returns arrays of Person and Group objects
- Validates graph structure

### Tester

Collects simulation statistics and provides debugging information.

```javascript
class Tester {
  constructor()
  logDecision(person: Person, decision: string, details: object): void
  getStatistics(): Statistics
  setDebugMode(enabled: boolean): void
}
```

## Visualization System

### CanvasVisualizer

Renders simulation state on HTML5 Canvas.

```javascript
class CanvasVisualizer extends Visualizer {
  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, width: number, height: number)
  initialize(groups: Group[], people: Person[]): void
  render(): void
  updateData(groups: Group[], people: Person[]): void
}
```

#### Methods

**`initialize(groups, people): void`**
- Sets up initial visualization state
- Calculates layout positions
- Prepares rendering context

**`render(): void`**
- Draws current simulation state
- Updates canvas with club circles and statistics
- Handles responsive layout

### Visualizer (Base Class)

Abstract base class for all visualizers.

```javascript
abstract class Visualizer {
  constructor(width: number, height: number)
  abstract initialize(groups: Group[], people: Person[]): void
  abstract render(): void
  updateLegend(): void
}
```

## Data Models

### Person

Represents an individual in the social network.

```javascript
class Person {
  constructor(id: number, weight: number = 1)
  
  // Opinion management
  getOpinion(): number
  setOpinion(opinion: number): void
  changeOpinion(): boolean
  
  // Group membership
  joinGroup(group: Group): boolean
  leaveGroup(group: Group): void
  getGroups(): Set<Group>
  
  // Network properties
  getNeighbors(): Set<Person>
  getIntersectionDegree(): number
  
  // Utility
  toJSON(): object
}
```

#### Properties

- `id: number` - Unique identifier
- `weight: number` - Individual weight for graph generation
- `opinion: number` - Current opinion (-1 or +1)

### Group

Represents a club/group in the social network.

```javascript
class Group {
  constructor(id: number, weight: number = 1)
  
  // Membership management
  addMember(person: Person): boolean
  removeMember(person: Person): void
  isMember(person: Person): boolean
  
  // Statistics
  getMemberCount(): number
  getOpinionCount(opinion: number): number
  getMajorityOpinion(): number
  getHomogeneityRatio(): number
  
  // Utility
  toJSON(): object
}
```

#### Properties

- `id: number` - Unique identifier  
- `weight: number` - Group weight for graph generation
- `members: Set<Person>` - Set of member persons

## Utility Functions

### Mathematical Functions

**G-Functions** (for Schelling model):

```javascript
const G_FUNCTIONS = {
  linear: (x: number, steepness: number) => number,
  sigmoid: (x: number, steepness: number) => number,
  threshold: (x: number, steepness: number) => number
}
```

**getGFunction(config): Function**
- Returns configured g-function
- Handles custom function parsing

### Performance Monitoring

**PerformanceMonitor** (in main.js):

```javascript
class PerformanceMonitor {
  recordLoadTime(): void
  recordRenderTime(component: string, duration: number): void
  recordMemoryUsage(): void
  getMetrics(): object
}
```

### Browser Console Utilities

Available in browser console when debug mode is enabled:

```javascript
window.debug = {
  getDashboard(): Dashboard,
  getPerformanceMetrics(): object,
  exportData(): void,
  resetSimulation(): void,
  runBenchmark(turns: number): object
}
```

## Events and Lifecycle

### Initialization Sequence

1. `main.js` loads and creates Dashboard
2. `Dashboard.constructor()` sets up basic state
3. `Dashboard.initialize()` sets up UI asynchronously
4. `Dashboard.applyParameters()` creates initial graph
5. Simulation ready for interaction

### Simulation Lifecycle

1. **Parameter Change** → Validation → Graph Recreation
2. **Simulation Turn** → Model Execution → Statistics Update → Visualization Render
3. **Convergence Check** → Stop Condition → Export/Analysis

### Error Handling

- All async methods use try-catch blocks
- Errors are logged to console with context
- User-friendly error messages displayed in UI
- Performance monitoring tracks errors

## Type Definitions

```typescript
interface SimulationResult {
  turn: number;
  statistics: Statistics;
  convergenceReached: boolean;
}

interface Statistics {
  turn: number;
  totalEdges: number;
  totalOpinions: {[opinion: number]: number};
  segregationIndex: number;
  convergenceMetric: number;
  homophilousClubs: number;
  networkDensity: number;
}

interface NetworkMetrics {
  nodes: number;
  edges: number;
  density: number;
  averageDegree: number;
  clusteringCoefficient: number;
}
```

## Best Practices

### Performance
- Use `requestAnimationFrame` for smooth animations
- Batch DOM updates to avoid layout thrashing
- Monitor memory usage in long-running simulations

### Error Handling
- Always validate configuration before simulation
- Provide meaningful error messages to users
- Log detailed errors for debugging

### Extensibility
- Extend base classes for new model types
- Use configuration system for new parameters
- Follow existing naming conventions

---

For more examples and usage patterns, see the [README.md](../README.md) and browse the source code. 