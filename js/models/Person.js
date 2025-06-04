/**
 * @fileoverview Defines the Person class, representing an individual in the simulation.
 */

/**
 * Represents a person in the simulation with a unique ID, a trait, and club memberships.
 */
export class Person {
  /**
   * Creates a new Person instance.
   * @param {number} id - The unique identifier for the person.
   * @param {string} trait - The trait of the person (e.g., "R" or "B").
   */
  constructor(id, trait) {
    this.id = id;
    this.trait = trait;
    this.clubs = new Set(); // Set of Club objects this person is a member of
    this.positions = new Map(); // Stores visual position data (angle) for each club this person is in
    this.justJoined = new Set(); // Tracks club IDs joined in the current turn to prevent immediate leaving
  }

  /**
   * Prepares the person for a new simulation turn by clearing the set of clubs joined this turn.
   */
  startTurn() {
    this.justJoined.clear();
  }

  /**
   * Checks if the person has just joined a specific club in the current turn.
   * @param {Club} club - The club to check.
   * @returns {boolean} True if the person just joined the club, false otherwise.
   */
  isJustJoined(club) {
    return this.justJoined.has(club.id);
  }

  /**
   * Determines if the person can join a specific club (i.e., is not already a member).
   * @param {Club} club - The club to check.
   * @returns {boolean} True if the person can join the club, false otherwise.
   */
  canJoinClub(club) {
    return !this.clubs.has(club);
  }

  /**
   * Allows the person to join a club if they are not already a member.
   * Updates the person's club set, marks the club as just joined, calculates a visual position,
   * and then instructs the club to add this person as a member.
   * @param {Club} club - The club to join.
   * @returns {boolean} True if the person successfully joined, false otherwise.
   */
  joinClub(club) {
    if (this.canJoinClub(club)) {
      this.clubs.add(club); // Person now lists this club
      this.justJoined.add(club.id); // Mark as joined in this turn
      
      // Assign a random angle for visualization within the club circle
      const angle = Math.random() * Math.PI * 2;
      this.positions.set(club.id, { angle });
      
      club.addMember(this); // Tell the club to add this person
      return true;
    }
    return false;
  }

  /**
   * Allows the person to leave a club they are a member of.
   * Updates the person's club set, removes visual position data,
   * and then instructs the club to remove this person as a member.
   * @param {Club} club - The club to leave.
   * @returns {boolean} True if the person successfully left, false otherwise.
   */
  leaveClub(club) {
    if (this.clubs.has(club)) {
      this.clubs.delete(club); // Person no longer lists this club
      this.positions.delete(club.id); // Remove visual position data
      
      club.removeMember(this); // Tell the club to remove this person
      return true;
    }
    return false;
  }
}
