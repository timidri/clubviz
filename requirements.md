# Requirements: Random Intersection Graph Simulation

## Based on Research Paper
**"Schelling and Voter Model on Random Intersection Graph"**  
*Authors: Maddalena Donà, Slavik Koval, Pieter Trapman*

## 1. Mathematical Foundation

### 1.1 Random Intersection Graph Structure
- **Individual Vertices (n)**: People with opinions aᵢ ∈ {-1, +1}
- **Group Vertices (m)**: Groups with weights wⱼ for connection probabilities
- **Auxiliary Bipartite Graph**: Connects individuals to groups via Poisson process
- **Intersection Graph**: Individuals connected if they share at least one group

### 1.2 Connection Dynamics
- **Initial Connections**: Each person connects to each group with probability λ·wⱼ/m
- **Poisson Parameter**: λ controls average connectivity
- **Weight Distribution**: Groups can have uniform or exponential weight distributions

## 2. Schelling Model Requirements

### 2.1 Edge Creation Dynamics
- **Creation Rate**: c/m per person-group pair per time step
- **Formula**: P(create edge) = c/m
- **Implementation**: Random process for unconnected person-group pairs

### 2.2 Edge Deletion Dynamics  
- **Deletion Function**: β(aᵢ, k⁺ⱼ(t), k⁻ⱼ(t))
- **Input Parameters**:
  - aᵢ: Individual's opinion (+1 or -1)
  - k⁺ⱼ(t): Number of +1 opinion members in group j at time t
  - k⁻ⱼ(t): Number of -1 opinion members in group j at time t
- **G-Function Library**:
  - **Linear**: G(x) = αx + β
  - **Sigmoid**: G(x) = 1/(1 + e^(-αx))  
  - **Threshold**: G(x) = 1 if x > threshold, 0 otherwise

### 2.3 Opinion Homophily
- Higher deletion probability when individual's opinion differs from group majority
- Promotes opinion segregation within groups
- Configurable sensitivity via G-function parameters

## 3. Voter Model Requirements

### 3.1 Opinion Change Dynamics
- **Change Rate**: γ (gamma) - base probability of opinion change
- **Influence Calculation**: Based on group composition or neighbor opinions
- **Formula**: P(change) = γ × influence_opposite_to_current_opinion

### 3.2 Influence Types
- **Group-based**: Influence from all group members (weighted by group size)
- **Individual-based**: Influence from direct neighbors in intersection graph
- **Influence Range**: [-1, +1] where negative values oppose current opinion

### 3.3 Opinion Flip Mechanism
- Only change opinion when influenced toward opposite opinion
- Probability proportional to strength of opposite influence
- Instantaneous opinion flip: +1 ↔ -1

## 4. Combined Model Requirements

### 4.1 Model Selection
- **Schelling Only**: Edge dynamics without opinion changes
- **Voter Only**: Opinion dynamics without edge changes  
- **Combined Model**: Both edge and opinion dynamics simultaneously

### 4.2 Execution Order
1. Execute Schelling dynamics (edge creation/deletion)
2. Execute Voter dynamics (opinion changes)
3. Update intersection graph
4. Record statistics

## 5. Simulation Parameters

### 5.1 Graph Structure Parameters
- **n**: Number of individuals (10-1000)
- **m**: Number of groups (1-100)
- **λ**: Connectivity parameter (0.1-10.0)

### 5.2 Schelling Parameters
- **c**: Edge creation rate (0.1-10.0)
- **G-function type**: Linear, Sigmoid, or Threshold
- **G-function steepness**: Controls sensitivity (0.1-10.0)

### 5.3 Voter Parameters
- **γ**: Opinion change rate (0.0-1.0)
- **Voter type**: Group-based or Individual-based

### 5.4 Initial Conditions
- **Opinion split**: Ratio of +1 to -1 opinions (0.0-1.0)
- **Group weights**: Uniform or Exponential distribution

## 6. Visualization Requirements

### 6.1 Real-time Display
- **People**: Colored dots (Red/Pink for +1, Blue for -1)
- **Groups**: Circles containing member dots
- **Statistics bars**: Opinion distribution within each group
- **Group labels**: Numerical identifiers

### 6.2 Legend and Statistics
- **Opinion legend**: Color coding explanation
- **Live statistics**: 
  - Total edges (person-group connections)
  - Opinion counts (+1/-1)
  - Segregation index (homophily measure)
  - Convergence metric

### 6.3 Interactive Controls
- **Parameter adjustment**: Real-time parameter modification
- **Simulation control**: Start/stop/step/reset functionality
- **Model selection**: Switch between Schelling/Voter/Combined
- **Speed control**: Adjustable simulation speed

## 7. Mathematical Accuracy Requirements

### 7.1 Formula Implementation
- **Exact replication** of paper formulas
- **Proper probability distributions** (Poisson for connections)
- **Accurate G-function implementations**
- **Correct influence calculations**

### 7.2 Statistical Measures
- **Segregation Index**: Measure of opinion clustering
- **Convergence Detection**: Based on stability metrics
- **Network Measures**: Degree distributions, density
- **Opinion Dynamics**: Track opinion change rates

## 8. Performance Requirements

### 8.1 Simulation Speed
- Handle up to 1000 individuals and 100 groups
- Real-time visualization updates
- Smooth animation at reasonable frame rates

### 8.2 Memory Efficiency
- Efficient graph representations
- Optimized connection storage
- Minimal memory overhead for statistics

## 9. Code Quality Requirements

### 9.1 Architecture
- **Modular design** with separate classes for Person, Group, Simulator
- **Clear separation** between models, simulation, and visualization
- **Configurable parameters** via centralized configuration system

### 9.2 Documentation
- **Mathematical formulas** documented in code comments
- **Paper references** for all implementations
- **API documentation** for all public methods
- **Usage examples** and parameter guides

### 9.3 Testing
- **Unit tests** for core mathematical functions
- **Integration tests** for simulation workflows
- **Automated test suite** for regression prevention
- **Visual validation** tools for debugging

## 10. User Interface Requirements

### 10.1 Professional Design
- **Modern UI** with clean, scientific aesthetic
- **Responsive layout** for different screen sizes
- **Accessible design** with proper contrast and labels
- **Glass morphism effects** for visual appeal

### 10.2 Usability
- **Intuitive controls** with clear labeling
- **Real-time validation** of parameter inputs
- **Error handling** with helpful error messages
- **Parameter presets** for common scenarios

### 10.3 Educational Value
- **Clear explanation** of model dynamics
- **Parameter guidance** with tooltips and help text
- **Visual feedback** showing model effects
- **Example scenarios** demonstrating key concepts

---

## Implementation Status: ✅ COMPLETE

All requirements have been successfully implemented in the current codebase, providing a mathematically accurate and visually appealing simulation of the Random Intersection Graph with Schelling and Voter model dynamics as described in the research paper. 