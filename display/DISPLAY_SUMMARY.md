# Alkemio Visualizations: Display Module Summary

## Overview

The `display` folder implements the interactive web-based visualization components for the Alkemio Analytics Playground. It enables users to explore, analyze, and interact with data through force-directed graphs, map overlays, and lifecycle/state machine visualizations. The visualizations are built using [D3.js](https://d3js.org/) and related libraries, and are designed to be highly interactive and configurable.

## Key Features

- **Force-Directed Graph Visualization**:
  - Visualizes relationships between entities (e.g., Spaces, Challenges, Opportunities, Contributors) as a dynamic network graph.
  - Supports zooming, panning, and node dragging.
  - Nodes and edges are styled and sized based on their properties (e.g., type, weight).
  - Hovercards and labels provide contextual information on nodes.
  - Users can filter by space, show/hide contributors, and adjust the view.

- **Map Overlay Integration**:
  - Allows overlaying the graph on geographic maps (e.g., Europe, Netherlands, Ireland) using GeoJSON data.
  - Nodes can be fixed to real-world locations for spatial analysis.
  - Users can toggle map display and select different maps.

- **Lifecycle Visualization**:
  - Visualizes state machines (lifecycles) using data modeled with XState.
  - States are shown as nodes, with transitions as links.
  - Highlights current and initial states, and supports multiple lifecycle models.

## Main Components

- `src/index.ts`: Entry point that wires up the UI, loads data, and initializes visualizations.
- `graph/GraphVizualization.ts`: Core class for rendering and managing the force-directed graph.
- `graph/GraphDataProvider.ts`: Loads and filters graph data (nodes/edges) from JSON.
- `graph/MapDataProvider.ts`: Loads and manages GeoJSON map data.
- `graph/components/`: Contains reusable D3 components (labels, images, hovercards).
- `graph/handlers/`: Handles user interactions (dragging, zooming, map location fixing).
- `lifecycle/`: Implements lifecycle (state machine) visualization using XState and D3.
- `public/`: Contains static assets (HTML, CSS, images, data, maps).

## User Interface

- Accessible via a web browser (typically at http://localhost:8080/ after running `npm start`).
- UI controls allow users to:
  - Select a space or map
  - Show/hide contributors
  - Zoom and fit the graph
  - Move nodes to map locations
  - Switch between different lifecycle models

## Technologies Used

- [D3.js](https://d3js.org/) for data-driven visualizations
- [XState](https://xstate.js.org/) for lifecycle/state machine modeling
- [TypeScript](https://www.typescriptlang.org/) for type safety
- [Webpack](https://webpack.js.org/) for bundling

## Typical Workflow

1. Data is loaded from JSON files (graph structure, maps, lifecycle definitions).
2. The user interacts with the UI to filter, explore, and manipulate the visualizations.
3. The application updates the SVG-based visualizations in real time based on user input.

---

This summary provides a high-level understanding of the `display` module's purpose and structure. For more details, see the code and documentation in each subfolder.
