# ClubViz: Social Network Simulation Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/clubviz/clubviz)

ClubViz is a professional research tool for simulating and visualizing social dynamics on Random Intersection Graphs (RIG). It implements multiple mathematical models to study opinion formation, network evolution, and social behaviors in group-based social networks.

## 🚀 Features

### Core Simulation Models
- **Schelling Model**: Network dynamics with edge creation/deletion based on homophily
- **Voter Model (Pairwise)**: Individual opinion change through pairwise interactions
- **Voter Model (Group-based)**: Opinion dynamics influenced by club membership
- **Combined Model**: Integrated Schelling network dynamics with voter model
- **SIR Epidemic Model**: Disease spread with opinion-dependent transmission rates

### Advanced Capabilities
- **Real-time Visualization**: Interactive canvas-based rendering of network dynamics
- **Comprehensive Statistics**: Network metrics, opinion analytics, convergence tracking
- **Data Export**: JSON, CSV, and GEXF formats for further analysis
- **Configuration Management**: Save/load parameter sets for reproducible research
- **Performance Monitoring**: Built-in performance tracking and optimization tools
- **Professional UI**: Organized parameter controls with dynamic visibility

## 📊 Mathematical Foundation

This simulation is based on the research paper "Schelling and Voter Model on Random Intersection Graph" and implements:

- **Random Intersection Graph (RIG)**: Bipartite graph structure with individuals and clubs
- **G-functions**: Configurable homophily functions (linear, sigmoid, threshold, custom)
- **Opinion Dynamics**: Binary opinion system with configurable change probabilities
- **Convergence Detection**: Multi-criteria convergence with stability and homophily requirements

## 🛠 Installation & Setup

### Prerequisites
- Modern web browser with ES6 module support
- Python 3.x (for local development server)
- Git (for version control)

### Quick Start
```bash
# Clone the repository
git clone https://github.com/clubviz/clubviz.git
cd clubviz

# Start local development server
python3 -m http.server 8000

# Open in browser
open http://localhost:8000
```

### Development Mode
Add `?debug=true` to the URL to enable:
- Performance monitoring
- Detailed console logging
- Memory usage tracking
- Browser console debugging utilities

```
http://localhost:8000?debug=true
```

## 🎮 Usage Guide

### Basic Simulation

1. **Select Model Type**: Choose from 5 available simulation models
2. **Configure Parameters**: Adjust graph structure, model parameters, and initial conditions
3. **Initialize Graph**: Click "Apply Parameters" to create the network
4. **Run Simulation**: Use single turn, multiple turns, or continuous simulation modes

### Parameter Categories

#### Graph Structure
- `n`: Number of individuals (10-1000)
- `m`: Number of clubs (1-100)  
- `λ`: Connectivity parameter (0.1-10.0)

#### Schelling Model
- `c`: Edge creation rate (0.1-10.0)
- `g-function`: Homophily function type
- `g-steepness`: Function steepness parameter

#### Voter Model
- `γ`: Opinion change rate (0.0-1.0)
- `λ_voter`: Pairwise update rate
- `η-function`: Opinion change probability function

#### SIR Epidemic
- `β`: Infection rate (0.0-1.0)
- `γ_SIR`: Recovery rate (0.0-1.0)
- `transmission modifier`: Opinion-based transmission scaling

### Advanced Features

#### Data Export
- **Simulation Data**: Time-series CSV with turn-by-turn statistics
- **Graph State**: Complete network state in JSON format
- **Configuration**: Parameter sets for reproducibility

#### Console Debugging
Access these utilities in the browser console:
```javascript
// Get dashboard instance
window.debug.getDashboard()

// Export current data
window.debug.exportData()

// Run performance benchmark
window.debug.runBenchmark(100) // 100 turns

// Get performance metrics
window.debug.getPerformanceMetrics()
```

## 📁 Project Structure

```
clubviz/
├── index.html              # Main application page
├── js/
│   ├── main.js            # Application entry point
│   ├── config.js          # Configuration management
│   ├── models/            # Data models
│   │   ├── Person.js      # Individual agent class
│   │   └── Club.js        # Club/group class
│   ├── simulation/        # Simulation engine
│   │   ├── Simulator.js   # Main simulation controller
│   │   ├── GraphInitializer.js # RIG generation
│   │   └── Tester.js      # Statistics collection
│   └── visualization/     # Rendering system
│       ├── Dashboard.js   # UI controller
│       ├── CanvasVisualizer.js # Canvas renderer
│       └── Visualizer.js  # Base visualizer
├── styles/
│   └── main.css          # Application styles
├── docs/                 # Documentation
├── config/              # Configuration files
└── README.md           # This file
```

## 🔬 Research Applications

ClubViz is designed for academic and research applications in:

- **Social Network Analysis**: Study group formation and dissolution
- **Opinion Dynamics**: Model belief propagation and polarization
- **Epidemiology**: Simulate disease spread in social networks
- **Computational Social Science**: Validate theoretical models
- **Network Science**: Analyze RIG properties and dynamics

## 📈 Performance & Scaling

### Recommended Limits
- **Small simulations**: n ≤ 100, m ≤ 10 (real-time visualization)
- **Medium simulations**: n ≤ 500, m ≤ 20 (periodic updates)
- **Large simulations**: n ≤ 1000, m ≤ 50 (export-focused)

### Optimization Features
- Asynchronous initialization
- Performance monitoring
- Memory usage tracking
- Efficient data structures
- Canvas-based rendering

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow ES6+ standards
- Add JSDoc comments for new functions
- Include unit tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📚 References

- "Schelling and Voter Model on Random Intersection Graph" - Original research paper
- Network Science literature on opinion dynamics
- Random Intersection Graph theory

## 🐛 Bug Reports & Support

- **Issues**: [GitHub Issues](https://github.com/clubviz/clubviz/issues)
- **Discussions**: [GitHub Discussions](https://github.com/clubviz/clubviz/discussions)
- **Email**: support@clubviz.org

## 🔮 Roadmap

- [ ] WebGL-based rendering for larger networks
- [ ] Additional model types (threshold models, etc.)
- [ ] Real-time collaborative simulation
- [ ] Integration with R/Python analysis tools
- [ ] Mobile-responsive interface

---

**Built with ❤️ for the research community**
