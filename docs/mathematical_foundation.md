# Mathematical Foundation: Schelling and Voter Model on Random Intersection Graph

## Paper Summary
**Title**: Schelling and Voter Model on Random Intersection Graph  
**Authors**: Maddalena Donà, Slavik Koval and Pieter Trapman

## 1. Random Intersection Graph Structure

### Key Concepts:
- **Individual vertices**: n people with independent weights w₁, w₂, ..., wₙ
- **Group vertices**: m groups with weights w'₁, w'₂, ..., w'ₘ  
- **Bipartite auxiliary graph**: Connects individuals to groups based on Poisson-distributed edges
- **Final intersection graph**: Two individuals share an edge if they have a common group vertex

### Mathematical Properties:
- Individual vertex degree ~ Poisson(w)
- Group vertex selection probability = w'/ℓ'ₘ where ℓ'ₘ = Σw'ᵢ
- Expected common groups: E[W] = mE[W']/n

## 2. Schelling Model Dynamics

### Core Mechanism:
- Vertices have opinions: +1 or -1
- Edge creation/deletion based on opinion agreement
- Rate function: β(aᵢ, k⁺ⱼ(t), k⁻ⱼ(t))

### Key Formula:
```
β(aᵢ, k⁺ⱼ(t), k⁻ⱼ(t)) = g(-aᵢ(k⁺ⱼ - k⁻ⱼ)/(k⁺ⱼ + k⁻ⱼ)) = g(-aᵢ(k⁺ⱼ/(k⁺ⱼ + k⁻ⱼ) - 1))
```

Where:
- aᵢ: opinion of vertex i (+1 or -1)
- k⁺ⱼ(t): number of edges of group vertex j with opinion +1 at time t
- k⁻ⱼ(t): number of edges of group vertex j with opinion -1 at time t
- g: increasing function (fraction of people in group that agrees)

### Dynamics:
- Edge between individual i and group j is created at rate c/m
- Edge is deleted with rate β(aᵢ, k⁺ⱼ(t), k⁻ⱼ(t))
- Higher deletion rate when individual's opinion disagrees with group majority

## 3. Voter Model Dynamics

### Two Types:
1. **Individual-based**: People change opinion based on direct neighbors
2. **Group-based**: People change opinion based on group membership influence

### Mechanism:
- Individuals can change their opinion (trait) based on neighbors
- Change rate depends on neighborhood composition
- Creates opinion clustering over time

## 4. Combined Model

### Hybrid Approach:
- Schelling dynamics: Edge formation/deletion based on homophily
- Voter dynamics: Opinion change based on social influence
- Both processes can run simultaneously or separately

### Parameters:
- **n**: Number of individuals
- **m**: Number of groups  
- **λ**: Graph connectivity parameter
- **c**: Edge creation rate
- **γ**: Opinion change rate (voter model)

## 5. Implementation Requirements

### Model Selection:
1. **Schelling Only**: Edge dynamics only, fixed opinions
2. **Voter Only**: Opinion dynamics only, fixed graph structure  
3. **Combined**: Both edge and opinion dynamics active

### Key Differences from Current Implementation:
1. **Graph Structure**: Random intersection graph vs. simple club membership
2. **Opinion Dynamics**: Explicit opinion change mechanism needed
3. **Mathematical Precision**: Proper Poisson processes and rate functions
4. **Homophily**: Opinion-based edge formation rather than trait-based leaving

## 6. Visualization Requirements

### Display Elements:
- Random intersection graph structure
- Opinion states (colors for +1/-1)
- Group membership connections
- Dynamic edge formation/deletion
- Opinion change animations
- Statistical measures (segregation, clustering)

### Controls:
- Model type selection (Schelling/Voter/Combined)
- Parameters: n, m, λ, c, γ
- Speed controls for different dynamics
- Reset and initialization options 