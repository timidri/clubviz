/**
 * @fileoverview Defines the Tester class for debugging and collecting simulation statistics.
 */

/**
 * Provides methods for logging detailed decision-making processes (joins/leaves)
 * and collecting statistics about the simulation's behavior.
 * Can be enabled or disabled and attached to a Simulator instance.
 */
export class Tester {
  /**
   * Creates a new Tester instance, initializing statistics structures.
   */
  constructor() {
    this.debugMode = false; // Controls verbose logging of decisions
    this.stats = {
      join: {
        attempts: 0,    // Total join attempts made
        successes: 0,   // Total successful joins
        actualRate: 0,  // Calculated actual join rate (successes / attempts)
      },
      leave: {
        byClub: [],     // Array to store leave statistics per club, indexed by club.id
                        // Each element: { R: { attempts, leaves, expectedProb, actualRate }, B: { ... } }
      },
    };
  }

  /**
   * Logs a detailed decision (join or leave) to the console if debugMode is enabled.
   * Uses console.groupCollapsed for better organization of log messages.
   * @param {string} type - The type of decision ("join" or "leave").
   * @param {object} details - An object containing details about the decision, 
   *                           including person, club, probability, and outcome.
   */
  logDecision(type, details) {
    if (!this.debugMode) return;

    const timestamp = new Date().toLocaleTimeString();
    const color = type === "join" ? "#2E7D32" : "#C62828"; // Green for join, Red for leave
    const icon = type === "join" ? "✨" : "🚪";
    const title = type === "join" ? "JOIN ATTEMPT" : "LEAVE ATTEMPT";

    // Using console.groupCollapsed to make the logs initially collapsed and tidier
    console.groupCollapsed(
      `%c ${icon} ${title} %c(Person ${details.person.id} [${details.person.trait}] → Club ${details.club.id}) %c@ ${timestamp}`,
      `color: ${color}; font-weight: bold; font-size: 1.1em;`,
      `color: ${color}; font-weight: normal;`,
      `color: grey; font-weight: lighter; font-style: italic;`
    );
    console.log(
      `%cPerson Details: %cID ${details.person.id}, Trait ${details.person.trait}`,
      `font-weight: bold`, ''
    );
    console.log(
      `%cClub Details (ID ${details.club.id}): %cMembers: ${details.club.getMemberCount()}, R: ${details.club.getTraitCount("R")}, B: ${details.club.getTraitCount("B")}`,
      `font-weight: bold`, ''
    );
    
    if (type === "join") {
      console.log(
        `%cJoin Probability: %c${(details.probability * 100).toFixed(2)}%`,
        `font-weight: bold`, ''
      );
      console.log(
        `%cOutcome: %c${details.success ? "✅ JOINED" : "❌ REJECTED"}`,
        `font-weight: bold`, `color: ${details.success ? 'green' : 'darkorange'}; font-weight: bold;`
      );
    } else { // type === "leave"
      console.log(
        `%cLeave Probability (Calculated): %c${(details.expectedProb * 100).toFixed(2)}%`,
        `font-weight: bold`, ''
      );
      console.log(
        `%cOutcome: %c${details.left ? "✅ LEFT" : "❌ STAYED"}`,
        `font-weight: bold`, `color: ${details.left ? 'red' : 'green'}; font-weight: bold;`
      );
    }
    console.groupEnd();
  }

  /**
   * Records and logs a join attempt.
   * Updates global join statistics (attempts, successes, actual rate).
   * @param {Person} person - The person attempting to join.
   * @param {Club} club - The club being joined.
   * @param {number} probability - The calculated probability of joining.
   * @param {boolean} success - Whether the join attempt was successful.
   */
  testJoin(person, club, probability, success) {
    this.stats.join.attempts++;
    if (success) this.stats.join.successes++;
    // Calculate actual join rate, avoiding division by zero
    this.stats.join.actualRate =
      this.stats.join.attempts > 0 ? this.stats.join.successes / this.stats.join.attempts : 0;

    this.logDecision("join", {
      person,
      club,
      probability,
      success,
    });
  }

  /**
   * Records and logs a leave attempt.
   * Updates leave statistics for the specific club and trait involved.
   * @param {Person} person - The person attempting to leave.
   * @param {Club} club - The club being left.
   * @param {number} probability - The calculated (expected) probability of leaving.
   * @param {boolean} success - Whether the leave attempt was successful (i.e., the person left).
   */
  testLeave(person, club, probability, success) {
    // Ensure the stats array is large enough for the club.id
    while (this.stats.leave.byClub.length <= club.id) {
      this.stats.leave.byClub.push(null); // Use null for potentially gapped club IDs
    }
    // Initialize stats for this specific club if it doesn't exist yet
    if (!this.stats.leave.byClub[club.id]) {
      this.stats.leave.byClub[club.id] = {
        R: { attempts: 0, leaves: 0, expectedProb: 0, actualRate: 0 },
        B: { attempts: 0, leaves: 0, expectedProb: 0, actualRate: 0 },
      };
    }

    // Get stats for the specific trait within the club
    const traitStats = this.stats.leave.byClub[club.id][person.trait];
    // This check is important if person.trait could be something other than R or B
    if (!traitStats) { 
        console.error(`Tester.testLeave: No stats object for club ${club.id}, trait ${person.trait}. This should not happen.`);
        return; // Abort if data structure is not as expected
    }
    traitStats.attempts++;
    if (success) traitStats.leaves++; // 'success' here means the person did leave

    // Update the expected probability (this can vary per turn/person based on club composition)
    traitStats.expectedProb = probability;
    // Calculate actual leave rate for this trait in this club, avoiding division by zero
    traitStats.actualRate = traitStats.attempts > 0 ? traitStats.leaves / traitStats.attempts : 0;

    this.logDecision("leave", {
      person,
      club,
      expectedProb: probability,
      left: success, // Pass 'success' as 'left' for clarity in logDecision
    });
  }

  /**
   * Enables or disables verbose debug logging for decisions.
   * @param {boolean} enabled - True to enable debug mode, false to disable.
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }
}
