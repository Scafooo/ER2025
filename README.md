# Enriching Ontology-based Data Management with Multidimensional Modeling

**Supplementary Material**

This repository accompanies the paper *"Enriching Ontology-based Data Management with Multidimensional Modeling"*. It provides supplementary material, including implementation details and a detailed running example, which expands and clarifies the concepts introduced in the paper.

## Overview

This work extends the traditional Ontology-Based Data Management (OBDM) paradigm by introducing a formal framework for modeling and reasoning over multidimensional data. Our framework integrates cubes, hierarchies, and views as intentional, ontologically grounded objects, and supports reasoning services such as:

- Cube and hierarchy coherence
- Intentional aggregation
- Holistic query answering that spans both analytical and domain-level data

## Implementation (Backend)

The framework has been implemented as an extension of the [Mastro](https://obdasystems.com) OBDM system. Mastro supports OWL ontologies, SPARQL queries, and R2RML or XML-based mapping definitions.


## User Interface

We enhanced the **Monolith** interface (the user-facing component of Mastro) with support for multidimensional constructs:

- Graphical editors for views, hierarchies, and cubes
- Drop-down menus and SPARQL editors for defining cube logic
- Interactive filtering and data slicing
- Visual feedback on cube aggregation results

<p align="center">
  <img src="figures/Cube.png" alt="Monolith - Cube Management" width="700"/>
</p>

<p align="center">
  <img src="figures/Hierarchy.png" alt="Monolith - Hierarchy Management" width="700"/>
</p>

## Repository Contents

- `figures/`: UI screenshots
- `backend/`: Sample hierarchies used in the S4Y pilot
- `frontend/`: Definitions of base and derived data cubes
- `README.md`: This document

## Citation

If citing the software or reproducing the results, please refer to the paper:

