/**
 * @fileoverview Distribution Chart for displaying theoretical vs empirical distributions.
 * Creates interactive charts showing convergence patterns and distribution comparisons.
 */

/**
 * Creates and manages distribution comparison charts.
 */
export class DistributionChart {
  /**
   * Creates a new DistributionChart instance.
   * @param {HTMLElement} container - Container element for the chart
   */
  constructor(container) {
    this.container = container;
    this.chart = null;
    this.analysisData = null;
    
    this.setupHTML();
    this.setupEventListeners();
  }

  /**
   * Sets up the HTML structure for the distribution chart.
   */
  setupHTML() {
    this.container.innerHTML = `
      <div class="distribution-analysis">
        <div class="analysis-header">
          <h4>📊 Distribution Analysis</h4>
          <div class="analysis-controls">
            <button id="refreshAnalysis" class="btn btn-sm btn-secondary">Refresh</button>
            <button id="exportAnalysis" class="btn btn-sm btn-info">Export</button>
          </div>
        </div>
        
        <div class="analysis-content">
          <div class="distribution-comparison">
            <div class="comparison-charts">
              <div class="chart-section">
                <h5>Current Distribution</h5>
                <canvas id="currentDistChart" width="300" height="200"></canvas>
              </div>
              <div class="chart-section">
                <h5>Theoretical vs Empirical</h5>
                <canvas id="comparisonChart" width="300" height="200"></canvas>
              </div>
            </div>
            
            <div class="convergence-timeline">
              <h5>Convergence Timeline</h5>
              <canvas id="timelineChart" width="600" height="150"></canvas>
            </div>
          </div>
          
          <div class="analysis-summary">
            <div class="summary-section">
              <h5>Theoretical Prediction</h5>
              <div id="theoreticalInfo" class="info-content">
                <p class="description">No analysis available</p>
                <p class="pattern">Run simulation to see predictions</p>
              </div>
            </div>
            
            <div class="summary-section">
              <h5>Convergence Status</h5>
              <div id="convergenceInfo" class="info-content">
                <div class="status-indicator" id="convergenceStatus">
                  <span class="status-icon">⏳</span>
                  <span class="status-text">Not started</span>
                </div>
                <p id="convergenceDetails">No convergence data available</p>
              </div>
            </div>
            
            <div class="summary-section">
              <h5>Recommendations</h5>
              <div id="recommendationsInfo" class="info-content">
                <ul id="recommendationsList">
                  <li>Start simulation to get recommendations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Sets up event listeners for chart interactions.
   */
  setupEventListeners() {
    const refreshBtn = this.container.querySelector('#refreshAnalysis');
    const exportBtn = this.container.querySelector('#exportAnalysis');
    
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshAnalysis());
    }
    
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportAnalysis());
    }
  }

  /**
   * Updates the chart with new analysis data.
   * @param {object} analysisData - Analysis data from DistributionAnalyzer
   */
  updateAnalysis(analysisData) {
    this.analysisData = analysisData;
    
    this.updateTheoreticalInfo(analysisData.theoretical);
    this.updateConvergenceInfo(analysisData.comparison, analysisData.empirical.convergence);
    this.updateRecommendations(analysisData.recommendations);
    
    this.drawCurrentDistribution(analysisData.empirical.current);
    this.drawComparison(analysisData.theoretical.theoretical, analysisData.empirical.current);
    this.drawTimeline(analysisData.empirical.history);
  }

  /**
   * Updates theoretical information display.
   * @param {object} theoretical - Theoretical distribution info
   */
  updateTheoreticalInfo(theoretical) {
    const infoElement = this.container.querySelector('#theoreticalInfo');
    if (!infoElement) return;

    infoElement.innerHTML = `
      <p class="description"><strong>${theoretical.description}</strong></p>
      <p class="pattern">${theoretical.expectedPattern}</p>
      <p class="convergence-type">Expected: ${theoretical.convergenceType}</p>
      <div class="theoretical-proportions">
        ${Object.entries(theoretical.theoretical).map(([opinion, prop]) => 
          `<span class="proportion-item">Opinion ${opinion}: ${(prop * 100).toFixed(1)}%</span>`
        ).join('')}
      </div>
    `;
  }

  /**
   * Updates convergence status information.
   * @param {object} comparison - Comparison data
   * @param {object} convergenceData - Convergence detection data
   */
  updateConvergenceInfo(comparison, convergenceData) {
    const statusElement = this.container.querySelector('#convergenceStatus');
    const detailsElement = this.container.querySelector('#convergenceDetails');
    
    if (!statusElement || !detailsElement) return;

    let statusIcon, statusText, statusClass;
    
    if (comparison.converged) {
      statusIcon = '✅';
      statusText = 'Converged';
      statusClass = 'converged';
    } else if (comparison.stability.level === 'stable') {
      statusIcon = '📊';
      statusText = 'Stable';
      statusClass = 'stable';
    } else {
      statusIcon = '⏳';
      statusText = 'Evolving';
      statusClass = 'evolving';
    }

    statusElement.innerHTML = `
      <span class="status-icon">${statusIcon}</span>
      <span class="status-text">${statusText}</span>
    `;
    statusElement.className = `status-indicator ${statusClass}`;

    let details = '';
    if (convergenceData.detectedAt) {
      details += `Converged at turn ${convergenceData.detectedAt}. `;
    }
    details += `Stability: ${comparison.stability.level} (score: ${comparison.stability.score.toFixed(2)}). `;
    details += `KL divergence: ${comparison.divergence.toFixed(4)}`;

    detailsElement.textContent = details;
  }

  /**
   * Updates recommendations display.
   * @param {Array} recommendations - Array of recommendation strings
   */
  updateRecommendations(recommendations) {
    const listElement = this.container.querySelector('#recommendationsList');
    if (!listElement) return;

    if (recommendations.length === 0) {
      listElement.innerHTML = '<li class="no-recommendations">No specific recommendations at this time</li>';
      return;
    }

    listElement.innerHTML = recommendations
      .map(rec => `<li>${rec}</li>`)
      .join('');
  }

  /**
   * Draws current distribution pie chart.
   * @param {object} distribution - Current empirical distribution
   */
  drawCurrentDistribution(distribution) {
    const canvas = this.container.querySelector('#currentDistChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (Object.keys(distribution).length === 0) {
      ctx.fillStyle = '#666';
      ctx.font = '14px Inter, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No data', centerX, centerY);
      return;
    }

    // Draw pie chart
    const colors = { '1': '#E91E63', '-1': '#2196F3' };
    let currentAngle = -Math.PI / 2;
    const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);

    Object.entries(distribution).forEach(([opinion, proportion]) => {
      const sliceAngle = (proportion * 2 * Math.PI);
      
      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[opinion] || '#999';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw label
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
      const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Inter, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${opinion}`, labelX, labelY - 5);
      ctx.fillText(`${(proportion * 100).toFixed(1)}%`, labelX, labelY + 10);

      currentAngle += sliceAngle;
    });
  }

  /**
   * Draws theoretical vs empirical comparison bar chart.
   * @param {object} theoretical - Theoretical distribution
   * @param {object} empirical - Empirical distribution
   */
  drawComparison(theoretical, empirical) {
    const canvas = this.container.querySelector('#comparisonChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const margin = 40;
    const chartWidth = width - 2 * margin;
    const chartHeight = height - 2 * margin;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const opinions = Object.keys(theoretical);
    if (opinions.length === 0) return;

    const barWidth = chartWidth / (opinions.length * 2 + 1);
    const maxValue = 1; // Proportions are 0-1

    // Draw axes
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, height - margin);
    ctx.lineTo(width - margin, height - margin);
    ctx.stroke();

    // Draw bars
    opinions.forEach((opinion, index) => {
      const x = margin + (index * 2 + 1) * barWidth;
      const theoreticalHeight = (theoretical[opinion] || 0) * chartHeight;
      const empiricalHeight = (empirical[opinion] || 0) * chartHeight;

      // Theoretical bar
      ctx.fillStyle = '#4f46e5';
      ctx.fillRect(x, height - margin - theoreticalHeight, barWidth * 0.8, theoreticalHeight);

      // Empirical bar
      ctx.fillStyle = '#10b981';
      ctx.fillRect(x + barWidth, height - margin - empiricalHeight, barWidth * 0.8, empiricalHeight);

      // Labels
      ctx.fillStyle = '#374151';
      ctx.font = '12px Inter, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Opinion ${opinion}`, x + barWidth, height - margin + 15);
    });

    // Legend
    ctx.fillStyle = '#4f46e5';
    ctx.fillRect(width - margin - 100, margin, 15, 10);
    ctx.fillStyle = '#374151';
    ctx.font = '10px Inter, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Theoretical', width - margin - 80, margin + 8);

    ctx.fillStyle = '#10b981';
    ctx.fillRect(width - margin - 100, margin + 15, 15, 10);
    ctx.fillText('Empirical', width - margin - 80, margin + 23);
  }

  /**
   * Draws convergence timeline chart.
   * @param {Array} history - History of empirical distributions
   */
  drawTimeline(history) {
    const canvas = this.container.querySelector('#timelineChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const margin = 30;
    const chartWidth = width - 2 * margin;
    const chartHeight = height - 2 * margin;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (history.length < 2) {
      ctx.fillStyle = '#666';
      ctx.font = '14px Inter, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Insufficient data for timeline', width / 2, height / 2);
      return;
    }

    // Draw axes
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, height - margin);
    ctx.lineTo(width - margin, height - margin);
    ctx.stroke();

    // Prepare data
    const maxTurn = Math.max(...history.map(h => h.turn));
    const opinions = Object.keys(history[0].proportions);
    const colors = { '1': '#E91E63', '-1': '#2196F3' };

    // Draw lines for each opinion
    opinions.forEach(opinion => {
      ctx.strokeStyle = colors[opinion] || '#999';
      ctx.lineWidth = 2;
      ctx.beginPath();

      history.forEach((point, index) => {
        const x = margin + (point.turn / maxTurn) * chartWidth;
        const y = height - margin - (point.proportions[opinion] || 0) * chartHeight;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    });

    // Draw labels
    ctx.fillStyle = '#374151';
    ctx.font = '10px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Turn', width / 2, height - 5);
    
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Proportion', 0, 0);
    ctx.restore();
  }

  /**
   * Refreshes the analysis display.
   */
  refreshAnalysis() {
    if (this.analysisData) {
      this.updateAnalysis(this.analysisData);
    }
  }

  /**
   * Exports the analysis data.
   */
  exportAnalysis() {
    if (!this.analysisData) {
      console.log('No analysis data to export');
      return;
    }

    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        type: 'distribution_analysis'
      },
      analysis: this.analysisData
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'distribution_analysis.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Clears the analysis display.
   */
  clear() {
    this.analysisData = null;
    this.setupHTML();
    this.setupEventListeners();
  }
} 