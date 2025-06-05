/**
 * @fileoverview GraphInitializer class for creating Random Intersection Graphs.
 * Based on "Schelling and Voter Model on Random Intersection Graph" paper.
 */

import { Person } from "../models/Person.js";
import { Group } from "../models/Club.js";

/**
 * Creates and initializes Random Intersection Graph structures.
 * Implements the auxiliary bipartite graph model from the research paper.
 */
export class GraphInitializer {
  /**
   * Creates a new GraphInitializer instance.
   * @param {Object} config - Configuration object with simulation parameters
   */
  constructor(config) {
    this.config = config;
    console.log("GraphInitializer created with config:", config);
  }

  /**
   * Creates a complete random intersection graph.
   * @returns {Object} Object containing {people: Person[], groups: Group[]}
   */
  createGraph() {
    console.log("Creating random intersection graph...");
    
    try {
      // Create basic people and groups first
      const people = this.createPeople();
      const groups = this.createGroups();
      
      console.log(`Created ${people.length} people and ${groups.length} groups`);
      
      // Connect people to groups using Poisson process
      this.connectPeopleToGroups(people, groups);
      
      // Validate the graph
      this.validateGraph(people, groups);
      
      console.log("Graph creation completed successfully");
      return { people, groups };
      
    } catch (error) {
      console.error("Error in graph creation:", error);
      throw error;
    }
  }

  /**
   * Creates an array of Person objects with random opinions.
   * @returns {Person[]} Array of initialized Person objects
   */
  createPeople() {
    console.log(`Creating ${this.config.n} people...`);
    
    const people = [];
    
    for (let i = 0; i < this.config.n; i++) {
      // Assign opinion based on initial split ratio
      const opinion = Math.random() < this.config.initialOpinionSplit ? 1 : -1;
      const person = new Person(i, opinion);
      people.push(person);
    }
    
    const positiveCount = people.filter(p => p.getOpinion() === 1).length;
    console.log(`Created people: ${positiveCount} positive, ${people.length - positiveCount} negative opinions`);
    
    return people;
  }

  /**
   * Creates an array of Group objects with appropriate weights.
   * @returns {Group[]} Array of initialized Group objects
   */
  createGroups() {
    console.log(`Creating ${this.config.m} groups...`);
    
    const groups = [];
    
    for (let i = 0; i < this.config.m; i++) {
      const weight = this.generateGroupWeight();
      const group = new Group(i, weight);
      groups.push(group);
    }
    
    console.log("Groups created with weights:", groups.map(g => g.weight));
    return groups;
  }

  /**
   * Generates a weight for a group based on the configuration.
   * @returns {number} Weight value for the group
   */
  generateGroupWeight() {
    switch (this.config.initialGroupWeights) {
      case 'exponential':
        // Exponential distribution: more groups with smaller weights
        return Math.random() * 2 + 0.5; // Random between 0.5 and 2.5
      
      case 'uniform':
      default:
        return 1.0; // All groups have equal weight
    }
  }

  /**
   * Connects people to groups using the Poisson process from the paper.
   * Each person connects to each group independently with probability λ * weight / m.
   * @param {Person[]} people - Array of Person objects
   * @param {Group[]} groups - Array of Group objects
   */
  connectPeopleToGroups(people, groups) {
    console.log("Connecting people to groups using Poisson process...");
    
    let totalConnections = 0;
    
    people.forEach(person => {
      groups.forEach(group => {
        // Connection probability: λ * weight_j / m
        const connectionProb = (this.config.lambda * group.weight) / this.config.m;
        
        if (Math.random() < connectionProb) {
          person.addToGroup(group);
          group.addPerson(person);
          totalConnections++;
        }
      });
    });
    
    console.log(`Created ${totalConnections} person-group connections`);
    
    // Log connection statistics
    const avgGroupsPerPerson = totalConnections / people.length;
    const avgPeoplePerGroup = totalConnections / groups.length;
    
    console.log(`Average groups per person: ${avgGroupsPerPerson.toFixed(2)}`);
    console.log(`Average people per group: ${avgPeoplePerGroup.toFixed(2)}`);
  }

  /**
   * Validates the created graph structure.
   * @param {Person[]} people - Array of Person objects
   * @param {Group[]} groups - Array of Group objects
   */
  validateGraph(people, groups) {
    console.log("Validating graph structure...");
    
    const errors = [];
    
    // Check basic counts
    if (people.length !== this.config.n) {
      errors.push(`Expected ${this.config.n} people, got ${people.length}`);
    }
    
    if (groups.length !== this.config.m) {
      errors.push(`Expected ${this.config.m} groups, got ${groups.length}`);
    }
    
    // Check if all people have valid opinions
    people.forEach(person => {
      const opinion = person.getOpinion();
      if (opinion !== 1 && opinion !== -1) {
        errors.push(`Person ${person.id} has invalid opinion: ${opinion}`);
      }
    });
    
    // Check if connections are bidirectional
    people.forEach(person => {
      person.getGroups().forEach(group => {
        if (!group.isMember(person)) {
          errors.push(`Person ${person.id} thinks they're in group ${group.id}, but group disagrees`);
        }
      });
    });
    
    groups.forEach(group => {
      group.getMembers().forEach(person => {
        if (!person.getGroups().has(group)) {
          errors.push(`Group ${group.id} thinks person ${person.id} is a member, but person disagrees`);
        }
      });
    });
    
    // Check for isolated people (no group memberships)
    const isolatedPeople = people.filter(person => person.getGroups().size === 0);
    if (isolatedPeople.length > 0) {
      console.warn(`Warning: ${isolatedPeople.length} people have no group memberships`);
    }
    
    // Check for empty groups
    const emptyGroups = groups.filter(group => group.getMemberCount() === 0);
    if (emptyGroups.length > 0) {
      console.warn(`Warning: ${emptyGroups.length} groups have no members`);
    }
    
    if (errors.length > 0) {
      console.error("Graph validation errors:", errors);
      throw new Error(`Graph validation failed: ${errors.join(', ')}`);
    }
    
    console.log("Graph validation passed successfully");
  }

  /**
   * Creates a small test graph for debugging.
   * @returns {Object} Object containing {people: Person[], groups: Group[]}
   */
  createTestGraph() {
    console.log("Creating small test graph...");
    
    // Create a very simple graph for testing
    const people = [
      new Person(0, 1),   // Person 0, opinion +1
      new Person(1, -1),  // Person 1, opinion -1
      new Person(2, 1),   // Person 2, opinion +1
      new Person(3, -1)   // Person 3, opinion -1
    ];
    
    const groups = [
      new Group(0, 1.0),  // Group 0
      new Group(1, 1.0)   // Group 1
    ];
    
    // Add people to groups
    people[0].addToGroup(groups[0]);
    groups[0].addPerson(people[0]);
    
    people[1].addToGroup(groups[0]);
    groups[0].addPerson(people[1]);
    
    people[2].addToGroup(groups[1]);
    groups[1].addPerson(people[2]);
    
    people[3].addToGroup(groups[1]);
    groups[1].addPerson(people[3]);
    
    console.log("Test graph created:", {
      people: people.length,
      groups: groups.length,
      connections: people.reduce((sum, p) => sum + p.getGroups().length, 0)
    });
    
    return { people, groups };
  }
} 