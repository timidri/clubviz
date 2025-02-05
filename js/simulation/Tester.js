export class Tester {
  constructor() {
    this.debugMode = false;
    this.stats = {
      join: {
        attempts: 0,
        successes: 0,
        actualRate: 0,
      },
      leave: {
        byClub: [],
      },
    };
  }

  logDecision(type, details) {
    if (!this.debugMode) return;

    const timestamp = new Date().toLocaleTimeString();
    const color = type === "join" ? "#2E7D32" : "#C62828";
    const icon = type === "join" ? "✨" : "🚪";
    const title = type === "join" ? "JOIN" : "LEAVE";

    console.log(
      "\n%c" + icon + " " + title + " %s",
      `color: ${color}; font-weight: bold`,
      timestamp
    );
    console.log(
      `%c👤 Person ${details.person.id} (${details.person.trait}) → Club ${details.club.id}`,
      `color: ${color}`
    );
    console.log(
      `%c📊 Club Composition: ${details.club.getMemberCount()} total (${details.club.getTraitCount(
        "M"
      )} M, ${details.club.getTraitCount("F")} F)`,
      `color: ${color}`
    );

    if (type === "join") {
      console.log(
        `%c🎲 Probability: ${(details.probability * 100).toFixed(2)}% → ${
          details.success ? "✅ JOINED" : "❌ REJECTED"
        }`,
        `color: ${color}`
      );
    } else {
      console.log(
        `%c🎲 Probability: ${(details.expectedProb * 100).toFixed(2)}% → ${
          details.left ? "✅ LEFT" : "❌ STAYED"
        }`,
        `color: ${color}`
      );
    }
    console.log("\n" + "─".repeat(40));
  }

  testJoin(person, club, probability, success) {
    this.stats.join.attempts++;
    if (success) this.stats.join.successes++;
    this.stats.join.actualRate =
      this.stats.join.successes / this.stats.join.attempts;

    this.logDecision("join", {
      person,
      club,
      probability,
      success,
    });
  }

  testLeave(person, club, probability, success) {
    // Ensure we have stats initialized for this club
    while (this.stats.leave.byClub.length <= club.id) {
      this.stats.leave.byClub.push({
        M: { attempts: 0, leaves: 0, expectedProb: 0, actualRate: 0 },
        F: { attempts: 0, leaves: 0, expectedProb: 0, actualRate: 0 },
      });
    }

    const traitStats = this.stats.leave.byClub[club.id][person.trait];
    traitStats.attempts++;
    if (success) traitStats.leaves++;

    // Update expected probability and actual rate
    traitStats.expectedProb = probability;
    traitStats.actualRate = traitStats.leaves / traitStats.attempts;

    this.logDecision("leave", {
      person,
      club,
      expectedProb: probability,
      left: success,
    });
  }

  setDebugMode(enabled) {
    this.debugMode = enabled;
  }
}
