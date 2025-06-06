import { Visualizer } from "./Visualizer.js";

/**
 * @fileoverview Defines the GraphVisualizer class for rendering the simulation as a network graph using Cytoscape.js.
 */

/**
 * Visualizes the simulation as a graph where people are nodes and shared club memberships can be represented as edges or groups.
 * Uses the Cytoscape.js library for graph rendering and layout.
 * Extends the base Visualizer class.
 */
export class GraphVisualizer extends Visualizer {
  /**
   * Constructs a GraphVisualizer instance.
   * Sets up the DOM container for Cytoscape and initializes layout configuration.
   * @param {HTMLCanvasElement} canvas - The main canvas element (will be hidden, Cytoscape uses its own div).
   * @param {CanvasRenderingContext2D} ctx - The 2D rendering context (not directly used by this visualizer).
   * @param {number} width - The initial width of the graph container.
   * @param {number} height - The initial height of the graph container.
   */
  constructor(canvas, ctx, width, height) {
    super(canvas, ctx, width, height);
    this.cy = null; // Cytoscape instance
    this.container = canvas.parentElement;
    this.graphContainer = document.createElement("div"); // DOM element to host the Cytoscape graph
    this.graphContainer.id = "cy";
    this.graphContainer.style.width = `${width}px`;
    this.graphContainer.style.height = `${height}px`;
    this.graphContainer.style.display = "none"; // Initially hidden
    this.container.appendChild(this.graphContainer); // Append to canvas's parent

    // Configuration for the Cytoscape layout algorithm (e.g., Cose - Compound Spring Embedder)
    this.layoutConfig = {
      name: "cose",
      animate: false,       // Disable animations during layout for performance
      randomize: true,     // Randomize node positions before layout
      componentSpacing: 40, // Increased spacing between connected components
      nodeRepulsion: function() {
        return 20000;
      }, // Stronger repulsion between nodes
      edgeElasticity: 800,   // Elasticity of edges
      gravity: 200,          // Attracts nodes to the center
      nodeOverlap: 4,        // How much to fit subgraph within parent
      idealEdgeLength: 30,   // Preferred edge length
      refresh: 20,
      fit: true,            // Whether to fit the viewport to the graph
      padding: 30,          // Padding around the graph
    };
  }

  /**
   * Initializes the GraphVisualizer with clubs and people data.
   * Creates Cytoscape nodes for people and edges representing shared club memberships.
   * @param {Club[]} clubs - An array of Club objects.
   * @param {Person[]} people - An array of Person objects.
   */
  initialize(clubs, people) {
    this.clubs = clubs;
    this.people = people;

    // Hide the original canvas and show the Cytoscape graph container
    this.canvas.style.display = "none";
    this.graphContainer.style.display = "block";
    this.updateDimensions(this.width, this.height); // Ensure graph container has correct size

    try {
      // Initialize Cytoscape instance
      if (this.cy) {
        this.cy.destroy();
      }

      // Create elements for Cytoscape
      const elements = this.createElements(clubs, people);
      console.log("Cytoscape elements:", elements);
      
      this.cy = cytoscape({
        container: this.graphContainer,
        elements: elements,
        style: [
          {
            selector: "node",
            style: {
              "background-color": "data(color)",
              label: "data(label)",
              width: 20,
              height: 20,
              "text-valign": "center",
              "text-halign": "center",
              "font-size": "10px",
              "text-outline-width": 2,
              "text-outline-color": "#fff",
              "color": "#000",
            },
          },
          {
            selector: "edge",
            style: {
              width: 1,
              "line-color": "#333",
              "line-opacity": 0.3,
              "curve-style": "bezier",
            },
          },
        ],
        layout: this.layoutConfig,
      });

      // Run layout
      const layout = this.cy.layout(this.layoutConfig);
      layout.run();

      console.log("Cytoscape initialized with:", {
        clubs: clubs.length,
        people: people.length,
        nodes: this.cy.nodes().length,
        edges: this.cy.edges().length
      });
    } catch (error) {
      console.error("Error initializing cytoscape:", error);
    }
  }

  /**
   * Creates an array of elements (nodes and edges) for Cytoscape based on people and clubs.
   * Nodes represent people, and edges represent two people being in the same club.
   * @param {Club[]} clubs - An array of Club objects.
   * @param {Person[]} people - An array of Person objects.
   * @returns {object[]} Array of Cytoscape element definitions.
   */
  createElements(clubs, people) {
    const elements = [];

    // Add nodes for each person
    people.forEach((person) => {
      elements.push({
        group: "nodes",
        data: {
          id: `p${person.id}`,
          label: `P${person.id}`,
          color: person.getOpinion() === 1 ? "#E91E63" : "#2196F3",
          type: "person",
        },
      });
    });

    // Add edges between people in the same club
    clubs.forEach((club) => {
      const members = Array.from(club.members);
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          elements.push({
            group: "edges",
            data: {
              id: `c${club.id}:${members[i].id}-${members[j].id}`,
              source: `p${members[i].id}`,
              target: `p${members[j].id}`,
              clubId: club.id,
            },
          });
        }
      }
    });

    return elements;
  }

  /**
   * Redraws the graph. For Cytoscape, this involves updating elements and re-running the layout.
   */
  draw() {
    if (this.cy) {
      try {
        // Update elements with current state
        const elements = this.createElements(this.clubs, this.people);
        this.cy.elements().remove();
        this.cy.add(elements);
        
        // Refresh layout
        const layout = this.cy.layout(this.layoutConfig);
        layout.run();
      } catch (error) {
        console.error("Error updating cytoscape graph:", error);
      }
    }
  }

  /**
   * Updates the dimensions of the Cytoscape container when the window or parent resizes.
   * @param {number} width - The new width.
   * @param {number} height - The new height.
   */
  updateDimensions(width, height) {
    super.updateDimensions(width, height); // Update base class dimensions
    if (this.graphContainer) {
      this.graphContainer.style.width = `${width}px`;
      this.graphContainer.style.height = `${height}px`;
      if (this.cy) {
        this.cy.resize(); // Notify Cytoscape of size change
        this.cy.fit();
      }
    }
  }

  /**
   * Cleans up resources used by the GraphVisualizer.
   * Destroys the Cytoscape instance and removes its container from the DOM.
   * Makes the original canvas visible again.
   */
  cleanup() {
    try {
      if (this.cy) {
        this.cy.destroy();
        this.cy = null;
      }
      if (this.graphContainer && this.graphContainer.parentNode) {
        this.graphContainer.parentNode.removeChild(this.graphContainer);
      }
      this.canvas.style.display = "block"; // Show the original canvas (though it might be empty)
    } catch (error) {
      console.error("Error cleaning up GraphVisualizer:", error);
    }
  }
}
