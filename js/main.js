/**
 * @fileoverview Main entry point for the Random Intersection Graph Simulation.
 * Initializes and starts the dashboard when the DOM is fully loaded.
 */

import { Dashboard } from "./visualization/Dashboard.js";

/**
 * Initialize the application
 */
function initializeApp() {
  try {
    console.log("Initializing Random Intersection Graph Simulation...");
    
    // Check if required DOM elements exist
    const canvas = document.getElementById("visualization");
    const modelSelection = document.getElementById("modelSelection");
    
    if (!canvas) {
      throw new Error("Canvas element not found");
    }
    
    if (!modelSelection) {
      throw new Error("Model selection element not found");
    }
    
    console.log("DOM elements found, creating dashboard...");
    
    // Create the main dashboard controller
    const dashboard = new Dashboard();
    
    // Store dashboard reference globally for debugging
    window.dashboard = dashboard;
    
    console.log("Dashboard created successfully");
    
  } catch (error) {
    console.error("Failed to initialize application:", error);
    
    // Show error to user
    const errorOverlay = document.createElement('div');
    errorOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: Arial, sans-serif;
    `;
    
    errorOverlay.innerHTML = `
      <div style="background: #fff; color: #333; padding: 2rem; border-radius: 8px; max-width: 500px;">
        <h2 style="color: #e53e3e; margin-bottom: 1rem;">Initialization Error</h2>
        <p><strong>Error:</strong> ${error.message}</p>
        <p>Please check the browser console for more details.</p>
        <button onclick="location.reload()" style="
          padding: 0.5rem 1rem;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 1rem;
        ">Reload Page</button>
      </div>
    `;
    
    document.body.appendChild(errorOverlay);
  }
}

/**
 * Event listener for the DOMContentLoaded event.
 * Ensures that the script runs only after the entire HTML document has been loaded and parsed.
 */
document.addEventListener("DOMContentLoaded", initializeApp);

// Add error handling for uncaught errors
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
