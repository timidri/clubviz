# Mathematical Model Documentation

This directory contains the mathematical documentation for the ClubViz simulation.

## Contents

- `mathematical_model.tex`: LaTeX source file containing the complete mathematical model documentation
- `README.md`: This file

## Building the Documentation

To build the PDF documentation, you need a LaTeX distribution installed on your system. Then:

1. Navigate to this directory:
   ```bash
   cd docs
   ```

2. Build the PDF:
   ```bash
   pdflatex mathematical_model.tex
   ```

This will generate `mathematical_model.pdf` in the same directory.

## Documentation Structure

The mathematical model documentation covers:

1. **Model Overview**: Basic description of the simulation model
2. **Core Parameters**: All mathematical parameters used in the model
3. **Markov Chain Model**: Detailed explanation of the Markov chain approach
4. **Equilibrium Analysis**: Mathematical derivation of equilibrium points
5. **Stability Analysis**: Analysis of system stability and transitions
6. **Key Properties**: Important mathematical properties of the model
7. **Parameter Effects**: How different parameters affect the system
8. **Simulation Behavior**: Expected behavior of the simulation

## Using the Documentation

The documentation is designed to be:
- A reference for understanding the mathematical foundations
- A guide for interpreting simulation results
- A resource for modifying or extending the model

## Dependencies

To build the documentation, you need:
- A LaTeX distribution (e.g., TeX Live, MiKTeX)
- The following LaTeX packages:
  - amsmath
  - amssymb
  - graphicx
  - hyperref

## Contributing

If you find any errors or have suggestions for improvements, please:
1. Create an issue in the main repository
2. Or submit a pull request with your changes 