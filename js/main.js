/**
 * @fileoverview Main entry point for the Club Dynamics Simulation application.
 * Initializes and starts the dashboard when the DOM is fully loaded.
 */

import { Dashboard } from "./visualization/Dashboard.js";

/**
 * Event listener for the DOMContentLoaded event.
 * Ensures that the script runs only after the entire HTML document has been loaded and parsed.
 * Creates a new instance of the Dashboard class, which sets up the UI, simulation, and visualizers.
 */
document.addEventListener("DOMContentLoaded", () => {
  // Create the main dashboard controller for the application.
  // The Dashboard constructor handles all further setup and interactions.
  const dashboard = new Dashboard();

  // Initial parameter application
  dashboard.applyParameters();
});
