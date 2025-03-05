import { Visualizer } from "./Visualizer.js";

export class GraphVisualizer extends Visualizer {
  constructor(canvas, ctx, width, height) {
    super(canvas, ctx, width, height);
    this.cy = null;
    this.container = canvas.parentElement;
    this.graphContainer = document.createElement("div");
    this.graphContainer.id = "cy";
    this.graphContainer.style.width = `${width}px`;
    this.graphContainer.style.height = `${height}px`;
    this.container.appendChild(this.graphContainer);

    this.layoutConfig = {
      name: "cose",
      animate: false,
      randomize: true,
      componentSpacing: 40,
      nodeRepulsion: function() {
        return 20000;
      },
      edgeElasticity: 800,
      gravity: 200,
      nodeOverlap: 4,
      idealEdgeLength: 30,
      refresh: 20,
      fit: true,
      padding: 30,
    };
  }

  initialize(clubs, people) {
    this.clubs = clubs;
    this.people = people;

    // Hide canvas and show graph container
    this.canvas.style.display = "none";
    this.graphContainer.style.display = "block";

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

  createElements(clubs, people) {
    const elements = [];

    // Add nodes for each person
    people.forEach((person) => {
      elements.push({
        group: "nodes",
        data: {
          id: `p${person.id}`,
          label: `P${person.id}`,
          color: person.trait === "R" ? "#e91e63" : "#2196f3",
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

  updateDimensions(width, height) {
    super.updateDimensions(width, height);
    if (this.graphContainer) {
      this.graphContainer.style.width = `${width}px`;
      this.graphContainer.style.height = `${height}px`;
      if (this.cy) {
        this.cy.resize();
        this.cy.fit();
      }
    }
  }

  cleanup() {
    try {
      if (this.cy) {
        this.cy.destroy();
        this.cy = null;
      }
      if (this.graphContainer && this.graphContainer.parentNode) {
        this.graphContainer.parentNode.removeChild(this.graphContainer);
      }
      this.canvas.style.display = "block";
    } catch (error) {
      console.error("Error cleaning up GraphVisualizer:", error);
    }
  }
}
