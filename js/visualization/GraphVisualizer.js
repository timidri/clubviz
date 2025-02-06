import { Visualizer } from "./Visualizer.js";

export class GraphVisualizer extends Visualizer {
  constructor(canvas, ctx, width, height) {
    super(canvas, ctx, width, height);
    this.cy = null;
    this.container = canvas.parentElement;
    this.graphContainer = document.createElement("div");
    this.graphContainer.style.width = `${width}px`;
    this.graphContainer.style.height = `${height}px`;
    this.graphContainer.style.display = "none";
    this.container.appendChild(this.graphContainer);

    this.layoutConfig = {
      name: "cose",
      animate: false,
      randomize: false,
      componentSpacing: 40,
      nodeRepulsion: function (node) {
        return 20000;
      },
      edgeElasticity: 800,
      gravity: 200,
      nodeOverlap: 4,
      idealEdgeLength: 30,
      edgeElasticity: function (edge) {
        return 128;
      },
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

    // Initialize Cytoscape instance
    this.cy = cytoscape({
      container: this.graphContainer,
      elements: this.createElements(clubs, people),
      style: [
        {
          selector: "node",
          style: {
            "background-color": "data(color)",
            label: "data(id)",
            width: 18,
            height: 18,
            "text-valign": "center",
            "text-halign": "center",
            "font-size": "8px",
            "text-outline-width": 0,
          },
        },
        {
          selector: "edge",
          style: {
            width: 1,
            "line-color": "#666",
            "line-opacity": 0.1,
            "curve-style": "bezier",
            opacity: 1,
            "target-arrow-shape": "none",
            "line-style": "solid",
          },
        },
      ],
      layout: this.layoutConfig,
    });
  }

  createElements(clubs, people) {
    // console.log(clubs);
    // console.log(people);
    const elements = [];

    // Add nodes for each person
    people.forEach((person) => {
      elements.push({
        data: {
          id: `${person.id}`,
          color: person.trait === "M" ? "#2196f3" : "#e91e63",
        },
      });
    });

    // Add edges between people in the same club
    clubs.forEach((club) => {
      const members = Array.from(club.members);
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          elements.push({
            data: {
              id: `e${members[i].id}-${members[j].id}`,
              source: `${members[i].id}`,
              target: `${members[j].id}`,
            },
          });
        }
      }
    });
    // console.log(elements);
    return elements;
  }

  draw() {
    if (this.cy) {
      // Update elements with current state
      this.cy.elements().remove();
      this.cy.add(this.createElements(this.clubs, this.people));

      // Refresh layout
      this.cy.layout(this.layoutConfig).run();
    }
  }

  updateDimensions(width, height) {
    super.updateDimensions(width, height);
    this.graphContainer.style.width = `${width}px`;
    this.graphContainer.style.height = `${height}px`;
    if (this.cy) {
      this.cy.resize();
    }
  }

  cleanup() {
    if (this.cy) {
      this.cy.destroy();
      this.cy = null;
    }
    this.graphContainer.style.display = "none";
    this.canvas.style.display = "block";
  }
}
