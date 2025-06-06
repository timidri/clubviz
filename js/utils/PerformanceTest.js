/**
 * @fileoverview Performance testing utilities for ClubViz simulation
 * Provides benchmarking and profiling tools for optimization
 */

export class PerformanceTest {
  constructor() {
    this.results = [];
    this.isRunning = false;
  }

  /**
   * Runs a comprehensive performance benchmark
   * @param {Dashboard} dashboard - Dashboard instance to test
   * @param {object} options - Test configuration options
   * @returns {Promise<object>} Test results
   */
  async runBenchmark(dashboard, options = {}) {
    const config = {
      warmupTurns: 10,
      testTurns: 100,
      iterations: 3,
      ...options
    };

    console.log('🚀 Starting performance benchmark...');
    this.isRunning = true;
    this.results = [];

    try {
      for (let iteration = 0; iteration < config.iterations; iteration++) {
        console.log(`📊 Running iteration ${iteration + 1}/${config.iterations}`);
        
        // Reset simulation for clean test
        await dashboard.applyParameters();
        
        // Warmup phase
        console.log('🔥 Warmup phase...');
        const warmupStart = performance.now();
        for (let i = 0; i < config.warmupTurns; i++) {
          dashboard.takeSingleTurn();
        }
        const warmupTime = performance.now() - warmupStart;

        // Test phase
        console.log('⚡ Test phase...');
        const testStart = performance.now();
        const memoryBefore = this.getMemoryUsage();
        
        for (let i = 0; i < config.testTurns; i++) {
          dashboard.takeSingleTurn();
        }
        
        const testTime = performance.now() - testStart;
        const memoryAfter = this.getMemoryUsage();

        // Record results
        const result = {
          iteration: iteration + 1,
          warmupTime,
          testTime,
          totalTurns: config.testTurns,
          avgTimePerTurn: testTime / config.testTurns,
          turnsPerSecond: (config.testTurns / testTime) * 1000,
          memoryBefore,
          memoryAfter,
          memoryDelta: memoryAfter - memoryBefore,
          timestamp: Date.now()
        };

        this.results.push(result);
        console.log(`✅ Iteration ${iteration + 1} complete: ${result.avgTimePerTurn.toFixed(2)}ms/turn`);
      }

      const summary = this.calculateSummary();
      console.log('🎯 Benchmark complete!', summary);
      
      return {
        summary,
        results: this.results,
        config
      };

    } catch (error) {
      console.error('❌ Benchmark failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Profiles a specific function or operation
   * @param {string} name - Profile name
   * @param {Function} fn - Function to profile
   * @returns {Promise<object>} Profile results
   */
  async profile(name, fn) {
    const memoryBefore = this.getMemoryUsage();
    const start = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - start;
      const memoryAfter = this.getMemoryUsage();

      const profile = {
        name,
        duration,
        memoryBefore,
        memoryAfter,
        memoryDelta: memoryAfter - memoryBefore,
        success: true,
        result,
        timestamp: Date.now()
      };

      console.log(`⏱️ Profile [${name}]: ${duration.toFixed(2)}ms`);
      return profile;

    } catch (error) {
      const duration = performance.now() - start;
      const memoryAfter = this.getMemoryUsage();

      const profile = {
        name,
        duration,
        memoryBefore,
        memoryAfter,
        memoryDelta: memoryAfter - memoryBefore,
        success: false,
        error: error.message,
        timestamp: Date.now()
      };

      console.error(`❌ Profile [${name}] failed: ${error.message}`);
      return profile;
    }
  }

  /**
   * Gets current memory usage (if available)
   * @returns {number} Memory usage in MB
   */
  getMemoryUsage() {
    if (performance.memory) {
      return Math.round(performance.memory.usedJSHeapSize / 1024 / 1024 * 100) / 100;
    }
    return 0;
  }

  /**
   * Calculates summary statistics from benchmark results
   * @returns {object} Summary statistics
   */
  calculateSummary() {
    if (this.results.length === 0) return null;

    const times = this.results.map(r => r.avgTimePerTurn);
    const throughputs = this.results.map(r => r.turnsPerSecond);
    const memories = this.results.map(r => r.memoryDelta);

    return {
      iterations: this.results.length,
      avgTimePerTurn: {
        mean: this.mean(times),
        min: Math.min(...times),
        max: Math.max(...times),
        std: this.standardDeviation(times)
      },
      throughput: {
        mean: this.mean(throughputs),
        min: Math.min(...throughputs),
        max: Math.max(...throughputs),
        std: this.standardDeviation(throughputs)
      },
      memoryUsage: {
        mean: this.mean(memories),
        min: Math.min(...memories),
        max: Math.max(...memories),
        std: this.standardDeviation(memories)
      }
    };
  }

  /**
   * Calculates mean of an array
   * @param {number[]} values - Array of numbers
   * @returns {number} Mean value
   */
  mean(values) {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculates standard deviation of an array
   * @param {number[]} values - Array of numbers
   * @returns {number} Standard deviation
   */
  standardDeviation(values) {
    const avg = this.mean(values);
    const squareDiffs = values.map(val => Math.pow(val - avg, 2));
    return Math.sqrt(this.mean(squareDiffs));
  }

  /**
   * Exports benchmark results to JSON
   * @returns {string} JSON string of results
   */
  exportResults() {
    return JSON.stringify({
      metadata: {
        exportDate: new Date().toISOString(),
        type: 'performance_benchmark',
        userAgent: navigator.userAgent,
        platform: navigator.platform
      },
      summary: this.calculateSummary(),
      results: this.results
    }, null, 2);
  }

  /**
   * Clears all stored results
   */
  clear() {
    this.results = [];
  }
}

// Make available globally for console debugging
if (typeof window !== 'undefined') {
  window.PerformanceTest = PerformanceTest;
} 