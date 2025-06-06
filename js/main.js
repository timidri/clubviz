/**
 * @fileoverview Main application entry point for the Social Network Simulation.
 * Handles application initialization, error handling, and global setup.
 * 
 * This application simulates social dynamics using various models including:
 * - Schelling Model (homophily-based network dynamics)
 * - Voter Model (opinion change dynamics)
 * - Combined models
 * - SIR Epidemic Model
 * 
 * @version 1.0.0
 * @author ClubViz Development Team
 */

import { Dashboard } from './visualization/Dashboard.js';

/**
 * Global application state
 */
let dashboard = null;
let performanceMonitor = null;

/**
 * Performance monitoring class for debugging and optimization
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      startTime: performance.now(),
      loadTime: null,
      renderTimes: [],
      memoryUsage: []
    };
    
    this.isEnabled = window.location.search.includes('debug=true');
  }

  /**
   * Records application load time
   */
  recordLoadTime() {
    this.metrics.loadTime = performance.now() - this.metrics.startTime;
    if (this.isEnabled) {
      console.log(`Application loaded in ${this.metrics.loadTime.toFixed(2)}ms`);
    }
  }

  /**
   * Records render performance
   * @param {string} component - Name of the component being rendered
   * @param {number} duration - Duration in milliseconds
   */
  recordRenderTime(component, duration) {
    this.metrics.renderTimes.push({ component, duration, timestamp: Date.now() });
    if (this.isEnabled) {
      console.log(`${component} rendered in ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Records memory usage if available
   */
  recordMemoryUsage() {
    if (performance.memory) {
      const memory = {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576), // MB
        timestamp: Date.now()
      };
      
      this.metrics.memoryUsage.push(memory);
      
      if (this.isEnabled) {
        console.log(`Memory usage: ${memory.used}MB / ${memory.total}MB (limit: ${memory.limit}MB)`);
      }
    }
  }

  /**
   * Gets performance summary
   * @returns {Object} Performance metrics summary
   */
  getMetrics() {
    return { ...this.metrics };
  }
}

/**
 * Main application initialization function.
 * Sets up the dashboard, performance monitoring, and error handling.
 */
async function initializeApp() {
  const startTime = performance.now();
  
  try {
    console.log('🚀 Initializing Social Network Simulation...');
    
    // Initialize performance monitoring
    performanceMonitor = new PerformanceMonitor();
    
         // Check for required DOM elements
     const requiredElements = ['visualization', 'modelSelection', 'takeTurn'];
     const missingElements = requiredElements.filter(id => !document.getElementById(id));
     
     if (missingElements.length > 0) {
       throw new Error(`Missing required DOM elements: ${missingElements.join(', ')}`);
     }
    
    // Initialize the main dashboard
    console.log('📊 Initializing dashboard...');
    dashboard = new Dashboard();
    
    // Wait for dashboard to be fully initialized
    await dashboard.initialize();
    
    // Store dashboard reference globally for debugging and console access
    window.dashboard = dashboard;
    window.performanceMonitor = performanceMonitor;
    
    // Record performance metrics
    performanceMonitor.recordLoadTime();
    performanceMonitor.recordMemoryUsage();
    
    console.log(`✅ Application initialized successfully in ${(performance.now() - startTime).toFixed(2)}ms`);
    
    // Set up periodic memory monitoring in debug mode
    if (performanceMonitor.isEnabled) {
      setInterval(() => performanceMonitor.recordMemoryUsage(), 30000); // Every 30 seconds
    }
    
  } catch (error) {
    console.error("❌ Failed to initialize application:", error);
    
    // Show user-friendly error message
    showErrorOverlay(error);
    
    // Track error for debugging
    if (performanceMonitor) {
      performanceMonitor.error = {
        message: error.message,
        stack: error.stack,
        timestamp: Date.now()
      };
    }
  }
}

/**
 * Displays a user-friendly error overlay when the application fails to initialize.
 * @param {Error} error - The error that occurred during initialization
 */
function showErrorOverlay(error) {
  const errorOverlay = document.createElement('div');
  errorOverlay.id = 'error-overlay';
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
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    backdrop-filter: blur(5px);
  `;
  
  errorOverlay.innerHTML = `
    <div style="
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      border-radius: 12px;
      max-width: 500px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      text-align: center;
    ">
      <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
      <h2 style="color: white; margin-bottom: 1rem; font-weight: 300;">Initialization Error</h2>
      <p style="margin-bottom: 1rem; opacity: 0.9;"><strong>Error:</strong> ${error.message}</p>
      <p style="margin-bottom: 2rem; opacity: 0.8; font-size: 0.9rem;">
        Please check the browser console for more details or contact support if the problem persists.
      </p>
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button onclick="location.reload()" style="
          padding: 0.75rem 1.5rem;
          background: rgba(255,255,255,0.2);
          color: white;
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        " onmouseover="this.style.background='rgba(255,255,255,0.3)'"
           onmouseout="this.style.background='rgba(255,255,255,0.2)'">
          🔄 Reload Page
        </button>
        <button onclick="window.open('mailto:support@example.com')" style="
          padding: 0.75rem 1.5rem;
          background: rgba(255,255,255,0.2);
          color: white;
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        " onmouseover="this.style.background='rgba(255,255,255,0.3)'"
           onmouseout="this.style.background='rgba(255,255,255,0.2)'">
          📧 Report Issue
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(errorOverlay);
}

/**
 * Global error handlers for uncaught errors and unhandled promise rejections.
 * These help catch and log errors that might otherwise go unnoticed.
 */
window.addEventListener('error', (event) => {
  console.error('🔥 Uncaught error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
  
  // Track error in performance monitor if available
  if (performanceMonitor) {
    performanceMonitor.runtimeError = {
      type: 'uncaught',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      timestamp: Date.now()
    };
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🔥 Unhandled promise rejection:', event.reason);
  
  // Track error in performance monitor if available
  if (performanceMonitor) {
    performanceMonitor.runtimeError = {
      type: 'unhandled_promise',
      reason: event.reason,
      timestamp: Date.now()
    };
  }
});

/**
 * Console utilities for debugging (available in browser console)
 */
window.debug = {
  getDashboard: () => dashboard,
  getPerformanceMetrics: () => performanceMonitor?.getMetrics(),
  exportData: () => dashboard?.exportData('json'),
  resetSimulation: () => dashboard?.applyParameters(),
  runBenchmark: (turns = 100) => {
    const start = performance.now();
    for (let i = 0; i < turns; i++) {
      dashboard?.takeSingleTurn();
    }
    const duration = performance.now() - start;
    console.log(`Benchmark: ${turns} turns in ${duration.toFixed(2)}ms (${(duration/turns).toFixed(2)}ms per turn)`);
    return { turns, duration, avgPerTurn: duration/turns };
  }
};

// Initialize the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM is already ready
  initializeApp();
}
