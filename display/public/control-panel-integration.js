// Control Panel Integration Script
// This script connects the control panel functionality to the main GraphVizualization

document.addEventListener('DOMContentLoaded', function() {
  // Wait for the graph visualization to be initialized
  setTimeout(initializeControlPanelFunctionality, 1000);
});

function initializeControlPanelFunctionality() {
  // Get the main graph visualization instance
  const graphViz = window.graphVisualization || window.graphVis;
  if (!graphViz) {
    console.warn('GraphVizualization instance not found, retrying...');
    setTimeout(initializeControlPanelFunctionality, 1000);
    return;
  }

  // Make it globally accessible
  window.graphViz = graphViz;

  // Set up control panel event listeners
  setupControlPanelEvents(graphViz);
  setupQuickFilters(graphViz);
  setupVisualControls(graphViz);
  setupAnalysisTools(graphViz);
}

function setupControlPanelEvents(graphViz) {
  // Node type filters
  const nodeTypeOptions = document.querySelectorAll('.multi-select-option');
  nodeTypeOptions.forEach(option => {
    option.addEventListener('click', function() {
      const checkbox = this.querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.checked = !checkbox.checked;
        this.classList.toggle('selected', checkbox.checked);
        updateNodeTypeFilters(graphViz);
      }
    });
  });

  // Degree filter
  const degreeFilter = document.getElementById('degree-filter');
  const degreeValue = document.getElementById('degree-value');
  if (degreeFilter && degreeValue) {
    degreeFilter.addEventListener('input', function() {
      degreeValue.textContent = `${this.value}+`;
      updateDegreeFilter(graphViz, parseInt(this.value));
    });
  }

  // Hide isolated nodes
  const hideIsolated = document.getElementById('hide-isolated');
  if (hideIsolated) {
    hideIsolated.addEventListener('change', function() {
      updateIsolatedNodesFilter(graphViz, this.checked);
    });
  }
}

function setupQuickFilters(graphViz) {
  // Insight buttons
  window.highlightBridgeNodes = () => highlightPattern(graphViz, 'bridge_connectors');
  window.highlightInfluencers = () => highlightPattern(graphViz, 'super_connectors');
  window.showGeographicClusters = () => highlightPattern(graphViz, 'geographic_clusters');
  window.detectCommunities = () => highlightPattern(graphViz, 'communities');
}

function setupVisualControls(graphViz) {
  // Node size metric
  const nodeSizeMetric = document.getElementById('node-size-metric');
  if (nodeSizeMetric) {
    nodeSizeMetric.addEventListener('change', function() {
      updateNodeSizing(graphViz, this.value);
    });
  }

  // Node color metric
  const nodeColorMetric = document.getElementById('node-color-metric');
  if (nodeColorMetric) {
    nodeColorMetric.addEventListener('change', function() {
      updateNodeColoring(graphViz, this.value);
    });
  }

  // Link width metric
  const linkWidthMetric = document.getElementById('link-width-metric');
  if (linkWidthMetric) {
    linkWidthMetric.addEventListener('change', function() {
      updateLinkWidth(graphViz, this.value);
    });
  }

  // Layout algorithm
  const layoutAlgorithm = document.getElementById('layout-algorithm');
  if (layoutAlgorithm) {
    layoutAlgorithm.addEventListener('change', function() {
      updateLayoutAlgorithm(graphViz, this.value);
    });
  }

  // Clustering toggle
  const enableClustering = document.getElementById('enable-clustering');
  if (enableClustering) {
    enableClustering.addEventListener('change', function() {
      updateClustering(graphViz, this.checked);
    });
  }
}

function setupAnalysisTools(graphViz) {
  window.optimizeLayout = () => optimizeLayout(graphViz);
  window.findShortestPath = () => findShortestPath(graphViz);
  window.analyzeInfluence = () => analyzeInfluence(graphViz);
  window.communityDetection = () => communityDetection(graphViz);
  window.exportNetwork = () => exportNetwork(graphViz);
  
  window.saveCurrentView = () => saveCurrentView(graphViz);
  window.loadView = (viewName) => loadView(graphViz, viewName);
}

// Filter update functions
function updateNodeTypeFilters(graphViz) {
  const selectedTypes = Array.from(document.querySelectorAll('.multi-select-option.selected'))
    .map(option => option.dataset.type);
  
  console.log('Filtering node types:', selectedTypes);
  // This would integrate with your existing filter system
  // graphViz.filterNodeTypes(selectedTypes);
}

function updateDegreeFilter(graphViz, minDegree) {
  console.log('Setting minimum degree filter:', minDegree);
  // This would filter nodes based on their connection count
}

function updateIsolatedNodesFilter(graphViz, hide) {
  console.log('Hide isolated nodes:', hide);
  // This would hide/show nodes with 0-1 connections
}

// Visual control functions
function updateNodeSizing(graphViz, metric) {
  console.log('Updating node sizing to:', metric);
  switch(metric) {
    case 'degree':
      graphViz.updateVisualMode('centrality');
      break;
    case 'betweenness':
      // Calculate betweenness centrality
      break;
    case 'weight':
      graphViz.updateVisualMode('default');
      break;
    case 'uniform':
      // Set all nodes to same size
      break;
  }
}

function updateNodeColoring(graphViz, metric) {
  console.log('Updating node coloring to:', metric);
  switch(metric) {
    case 'type':
      graphViz.updateVisualMode('default');
      break;
    case 'community':
      graphViz.updateVisualMode('community');
      break;
    case 'location':
      graphViz.updateVisualMode('geographic');
      break;
    case 'activity':
      // Color by activity level
      break;
  }
}

function updateLinkWidth(graphViz, metric) {
  console.log('Updating link width to:', metric);
  // This would update link styling based on the selected metric
}

function updateLayoutAlgorithm(graphViz, algorithm) {
  console.log('Changing layout algorithm to:', algorithm);
  switch(algorithm) {
    case 'force-directed':
      // Current default
      break;
    case 'circular':
      // Implement circular layout
      break;
    case 'hierarchical':
      // Implement hierarchical layout
      break;
    case 'geographic':
      // Enable map-based positioning
      graphViz.showMap();
      graphViz.fixLocationToMap('all');
      break;
  }
}

function updateClustering(graphViz, enabled) {
  console.log('Clustering enabled:', enabled);
  // This would enable/disable the clustering visualization
}

// Pattern highlighting functions
function highlightPattern(graphViz, patternType) {
  console.log('Highlighting pattern:', patternType);
  
  if (!graphViz.insightEngine) {
    console.warn('Insight engine not available');
    return;
  }
  
  const insights = graphViz.insightEngine.generateBasicInsights();
  const relevantInsights = insights.filter(insight => {
    switch(patternType) {
      case 'bridge_connectors':
        return insight.type === 'bridge_connector';
      case 'super_connectors':
        return insight.type === 'super_connector';
      case 'geographic_clusters':
        return insight.type === 'geographic_cluster';
      case 'communities':
        return insight.type.includes('community');
      default:
        return false;
    }
  });
  
  if (relevantInsights.length > 0) {
    const firstInsight = relevantInsights[0];
    graphViz.highlightInsight(firstInsight.type, firstInsight.nodes);
  }
}

// Analysis tool functions
function optimizeLayout(graphViz) {
  console.log('Optimizing layout...');
  // Restart the simulation with optimized parameters
  if (graphViz.simulation) {
    graphViz.simulation.alpha(0.5).restart();
    
    // Auto-fit after a delay
    setTimeout(() => {
      graphViz.zoomFit();
    }, 2000);
  }
}

function findShortestPath(graphViz) {
  console.log('Finding shortest path...');
  // This would implement path finding between selected nodes
  alert('Select two nodes to find the shortest path between them');
}

function analyzeInfluence(graphViz) {
  console.log('Analyzing influence...');
  if (graphViz.selectedNodeId && graphViz.insightEngine) {
    const centrality = graphViz.insightEngine.calculateNodeCentrality(graphViz.selectedNodeId);
    alert(`Node centrality: ${centrality.degree} connections (${(centrality.normalized * 100).toFixed(1)}% of maximum)`);
  } else {
    alert('Please select a node first');
  }
}

function communityDetection(graphViz) {
  console.log('Detecting communities...');
  graphViz.updateVisualMode('community');
}

function exportNetwork(graphViz) {
  console.log('Exporting network...');
  const data = {
    nodes: graphViz.graphDataProvider.getFilteredNodes(),
    edges: graphViz.graphDataProvider.getFilteredEdges(),
    metrics: graphViz.insightEngine ? graphViz.insightEngine.getNetworkMetrics() : null
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'network-export.json';
  a.click();
  URL.revokeObjectURL(url);
}

// View management functions
function saveCurrentView(graphViz) {
  const viewName = document.getElementById('view-name-input')?.value;
  if (!viewName) {
    alert('Please enter a view name');
    return;
  }
  
  console.log('Saving view:', viewName);
  // This would save the current view state
  alert(`View "${viewName}" saved!`);
}

function loadView(graphViz, viewName) {
  console.log('Loading view:', viewName);
  
  switch(viewName) {
    case 'overview':
      graphViz.clearSelection();
      graphViz.zoomFit();
      graphViz.updateVisualMode('default');
      break;
    case 'influencers':
      graphViz.updateVisualMode('centrality');
      highlightPattern(graphViz, 'super_connectors');
      break;
  }
}
