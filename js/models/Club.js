/**
 * @fileoverview Defines the Club class, representing a club in the simulation.
 */

/**
 * Represents a club in the simulation with a unique ID, a set of members, and trait counts.
 */
export class Club {
  /**
   * Creates a new Club instance.
   * @param {number} id - The unique identifier for the club.
   */
  constructor(id) {
    this.id = id;
    this.members = new Set(); // Set of Person objects who are members of this club
    this.traitCounts = new Map(); // Stores counts of members by trait (e.g., { "R": 10, "B": 5 })
  }

  /**
   * Checks if a given person is a member of this club.
   * @param {Person} person - The person to check.
   * @returns {boolean} True if the person is a member, false otherwise.
   */
  isMember(person) {
    return this.members.has(person);
  }

  /**
   * Adds a person to the club if they are not already a member.
   * This method primarily updates the club's internal state (member set and trait counts).
   * It assumes Person.joinClub() is the initiator of the join action.
   * @param {Person} person - The person to add.
   */
  addMember(person) {
    if (!this.isMember(person)) {
      this.members.add(person);
      this.updateTraitCount(person.trait, 1); // Increment trait count
    }
  }

  /**
   * Removes a person from the club.
   * This method primarily updates the club's internal state (member set and trait counts).
   * It assumes Person.leaveClub() is the initiator of the leave action.
   * @param {Person} person - The person to remove.
   */
  removeMember(person) {
    if (this.members.delete(person)) {
      this.updateTraitCount(person.trait, -1); // Decrement trait count
    }
  }

  /**
   * Updates the count for a specific trait within the club.
   * @param {string} trait - The trait to update (e.g., "R" or "B").
   * @param {number} delta - The change in count (e.g., 1 for adding, -1 for removing).
   */
  updateTraitCount(trait, delta) {
    const currentCount = this.traitCounts.get(trait) || 0;
    const newCount = currentCount + delta;
    if (newCount > 0) {
      this.traitCounts.set(trait, newCount);
    } else {
      this.traitCounts.delete(trait); // Remove trait from map if count is zero or less
    }
  }

  /**
   * Gets the total number of members in the club.
   * @returns {number} The total member count.
   */
  getMemberCount() {
    return this.members.size;
  }

  /**
   * Gets the number of members with a specific trait in the club.
   * @param {string} trait - The trait to count (e.g., "R" or "B").
   * @returns {number} The count of members with the specified trait.
   */
  getTraitCount(trait) {
    return this.traitCounts.get(trait) || 0;
  }
}
