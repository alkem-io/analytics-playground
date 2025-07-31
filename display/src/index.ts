import { select } from 'd3-selection';
import { GraphDataProvider } from './graph/GraphDataProvider';
import { GraphVizualization } from './graph/GraphVizualization';
import { GraphVizualizationControls } from './graph/GraphVizualizationControls';
import { MapDataProvider } from './graph/MapDataProvider';
import { Graph3DVisualization } from './graph/Graph3DVisualization';
import { NodeType } from '../../lib/src/common/node.type';

// --- GLOBAL/SHARED VARIABLE DECLARATIONS (top of file, after imports) ---
let graph3DVis: Graph3DVisualization | null = null;
const graph3DContainer = document.getElementById('graph-3d-container') as HTMLElement | null;
const graphContainer = document.querySelector('.graph-container') as HTMLElement | null;
const graph3DToggle = document.getElementById('graph-3d-toggle') as HTMLInputElement;
const graph3DToggleFs = document.getElementById('graph-3d-toggle-fs') as HTMLInputElement;

// Make the DOM locations available
const graphSvg = select('#graph-svg');
const graphSpaceSelectionControl = select('#graph-space-selector');
const graphShowContributors = select('#graph-checkbox-show-contributors');
const graphZoomFit = select('#graph-zoom-fit');
const graphZoomPlus = select('#graph-zoom-plus');
const graphZoomMin = select('#graph-zoom-min');

// Graph map related controls
const graphDisplayMap = select('#graph-display-map');
const graphFixContributorsToLocation = select('#graph-contributors-to-location');
const graphFixSpacesToLocation = select('#graph-spaces-to-location');

const graphMapSelector = select('#graph-map-selector');
const graphLayoutSelector = select('#graph-layout-selector');

// Search box
const graphSearchBox = select('#graph-search');

// Load
const graphDataFileLocation = 'data/transformed-graph-data.json';
const spaceID = ''; //"c4111e11-edad-48f6-916f-20e11f468848";
graphShowContributors.attr('checked', 'checked');
const graphDataProvider = new GraphDataProvider(true, spaceID);
await graphDataProvider.loadData(graphDataFileLocation);


const mapDataProvider = new MapDataProvider();

const mapsToLoad = [
  "maps/europe_geo.json",
  "maps/netherlands-with-regions_geo.json",
  "maps/ireland-with-counties_geo.json",
  "maps/world.geo.json"
];
for (let i = 0; i < mapsToLoad.length; i++) {
  await mapDataProvider.loadMap(mapsToLoad[i]);
}
mapDataProvider.setSelectedMap(graphMapSelector.property('value'));

graphMapSelector.on('change', function () {
  const selectedMap = graphMapSelector.property('value');
  console.log(`Selecting new map: ${selectedMap}`);
  mapDataProvider.setSelectedMap(selectedMap);

  forceGraph.refreshDisplayedGraph();
});

const graphControls = new GraphVizualizationControls(graphDataProvider);
graphControls.addSpaceSelectorOptions(graphSpaceSelectionControl);
const forceGraph = new GraphVizualization(
  graphSvg,
  graphDataProvider,
  mapDataProvider,
  2000, // width (increased)
  1000, // height (increased)
);

// Make the graph visualization globally accessible for the control panel
(window as any).graphVisualization = forceGraph;
(window as any).graphViz = forceGraph;

graphSpaceSelectionControl.on('change', function () {
  const selectedSpaceOption = select(this);
  let selectedSpaceID = selectedSpaceOption.property('value');
  // Defensive: check if selectedSpaceID is valid
  const allSpaces = [
    ...graphDataProvider.getRawSpaceNodes(),
    ...(graphDataProvider.data?.nodes.spacesL1 || []),
    ...(graphDataProvider.data?.nodes.spacesL2 || [])
  ];
  const validSpaceIDs = new Set(allSpaces.map((s: any) => s.id));
  if (!validSpaceIDs.has(selectedSpaceID)) {
    // Reset to first valid space if invalid
    selectedSpaceID = allSpaces.length > 0 ? allSpaces[0].id : '';
    graphSpaceSelectionControl.property('value', selectedSpaceID);
  }
  graphDataProvider.showSpecificSpace(selectedSpaceID);
  forceGraph.refreshDisplayedGraph();
});

graphShowContributors.on('click', (e: any) => {
  const checked = e.target.checked;
  graphDataProvider.showContributors(checked);
  forceGraph.refreshDisplayedGraph();
});

//graphDisplayMap.attr('checked', 'checked');
graphDisplayMap.on('click', (e: any) => {
  const checked = e.target.checked;
  if (checked) {
    forceGraph.showMap();
  } else {
    forceGraph.hideMap();
  }
});

graphZoomFit.on('click', (e: any) => {
  forceGraph.zoomFit();
});


graphZoomPlus.on('click', (e: any) => {
  forceGraph.zoomPlus();
});

graphZoomMin.on('click', (e: any) => {
  forceGraph.zoomMin();
});
graphFixContributorsToLocation.on('change', (e: any) => {
  const checked = e.target.checked;
  if (checked) {
    forceGraph.fixLocationToMap(NodeType.USER);
    forceGraph.fixLocationToMap(NodeType.ORGANIZATION);
  } else {
    forceGraph.unfixLocationFromMap(NodeType.USER);
    forceGraph.unfixLocationFromMap(NodeType.ORGANIZATION);
    // Randomize positions to break out of map clusters
    forceGraph.node.each(function(d: any) {
      if (d.type === NodeType.USER || d.type === NodeType.ORGANIZATION) {
        d.x = Math.random() * forceGraph.width;
        d.y = Math.random() * forceGraph.height;
        d.vx = 0;
        d.vy = 0;
      }
    });
    forceGraph.resetFanOut();
    if (forceGraph.simulation) {
      forceGraph.simulation.alpha(1).restart();
    }
    // Force a full redraw to reset clusters and badges
    forceGraph.refreshDisplayedGraph();
  }
});
graphFixSpacesToLocation.on('change', (e: any) => {
  const checked = e.target.checked;
  if (checked) {
    forceGraph.fixLocationToMap(NodeType.SPACE_L0);
    forceGraph.fixLocationToMap(NodeType.SPACE_L1);
    forceGraph.fixLocationToMap(NodeType.SPACE_L2);
  } else {
    forceGraph.unfixLocationFromMap(NodeType.SPACE_L0);
    forceGraph.unfixLocationFromMap(NodeType.SPACE_L1);
    forceGraph.unfixLocationFromMap(NodeType.SPACE_L2);
  }
});

// --- SEARCH BAR LOGIC: support both normal and fullscreen search bars ---
const graphSearchInput = document.getElementById('graph-search-input') as HTMLInputElement | null;
const graphSearchInputFS = document.querySelector('#graph-search-bar-fs input[type="text"]') as HTMLInputElement | null;

function highlightGraphSearch(searchTerm: string) {
  // 2D SVG highlight
  const svg = select('#graph-svg');
  const allNodes = graphDataProvider.getFilteredNodes();
  const filteredNodes = allNodes.filter((node: any) => {
    return (
      (node.profile?.displayName && node.profile.displayName.toLowerCase().includes(searchTerm)) ||
      (node.nameID && node.nameID.toLowerCase().includes(searchTerm))
    );
  });
  svg.selectAll('circle')
    .style('stroke', (d: any) => filteredNodes.some((n: any) => n.id === d.id) ? '#FFD600' : '#0A6E8A')
    .style('stroke-width', (d: any) => filteredNodes.some((n: any) => n.id === d.id) ? 5 : 1.2)
    .style('opacity', (d: any) => filteredNodes.length === 0 || filteredNodes.some((n: any) => n.id === d.id) ? 1 : 0.15);
  svg.selectAll('line')
    .style('stroke', (d: any) => {
      if (!filteredNodes.length) return '#bfc9d1';
      // Highlight links if either end is a match
      return (filteredNodes.some((n: any) => n.id === d.source.id) || filteredNodes.some((n: any) => n.id === d.target.id)) ? '#FFD600' : '#bfc9d1';
    })
    .style('stroke-width', (d: any) => {
      if (!filteredNodes.length) return 2;
      return (filteredNodes.some((n: any) => n.id === d.source.id) || filteredNodes.some((n: any) => n.id === d.target.id)) ? 3 : 1.2;
    })
    .style('opacity', (d: any) => {
      if (!filteredNodes.length) return 0.85;
      return (filteredNodes.some((n: any) => n.id === d.source.id) || filteredNodes.some((n: any) => n.id === d.target.id)) ? 1 : 0.08;
    });

  // 3D highlight
  if (graph3DVis && graph3DContainer && graph3DContainer.style.display !== 'none') {
    if (!searchTerm) {
      // Reset 3D colors
      graph3DVis.render();
      return;
    }
    // Find all matches and their neighbors
    const matchIds = new Set(filteredNodes.map((n: any) => n.id));
    const neighbors1 = new Set<string>();
    const neighbors2 = new Set<string>();
    matchIds.forEach(id => {
      graphDataProvider.getNeighbors(id, 1).forEach(n1 => neighbors1.add(n1));
      graphDataProvider.getNeighbors(id, 2).forEach(n2 => neighbors2.add(n2));
    });
    // Highlight in 3D
    graph3DVis.highlightSelection(Array.from(matchIds)[0] || '', neighbors1, neighbors2);
  }
}

if (graphSearchInput) {
  graphSearchInput.addEventListener('input', function (e: Event) {
    const target = e.target as HTMLInputElement;
    const value = target.value.trim().toLowerCase();
    highlightGraphSearch(value);
  });
}
if (graphSearchInputFS) {
  graphSearchInputFS.addEventListener('input', function (e: Event) {
    const target = e.target as HTMLInputElement;
    const value = target.value.trim().toLowerCase();
    highlightGraphSearch(value);
  });
}

/// Info Panels and Fullscreen Controls ///////////////////////

// Hide info panels on load
const nodeInfoPanel = document.getElementById('node-info-panel');
const clusterPanel = document.getElementById('cluster-panel');
if (nodeInfoPanel) nodeInfoPanel.classList.remove('visible');
if (clusterPanel) clusterPanel.classList.remove('visible');

// Close button logic for node info panel
const nodeInfoPanelClose = document.getElementById('node-info-panel-close');
if (nodeInfoPanelClose && nodeInfoPanel) {
  nodeInfoPanelClose.addEventListener('click', () => {
    nodeInfoPanel.classList.remove('visible');
  });
}
// Close button logic for cluster panel
const clusterPanelClose = document.getElementById('cluster-panel-close');
if (clusterPanelClose && clusterPanel) {
  clusterPanelClose.addEventListener('click', () => {
    clusterPanel.classList.remove('visible');
  });
}

const fullscreenBtn = document.getElementById('graph-fullscreen-toggle');
const svgElem = document.getElementById('graph-svg');

if (fullscreenBtn) {
  fullscreenBtn.addEventListener('click', () => {
    console.log('[Fullscreen] Button clicked');
    const is3DVisible = graph3DContainer && graph3DContainer.style.display !== 'none';
    if (is3DVisible) {
      // 3D mode: fullscreen the 3D container
      if (graph3DContainer.requestFullscreen) {
        graph3DContainer.requestFullscreen();
      } else if ((graph3DContainer as any).webkitRequestFullscreen) {
        (graph3DContainer as any).webkitRequestFullscreen();
      }
      console.log('[Fullscreen] Request sent for 3D');
    } else if (graphContainer && svgElem && svgElem.style.display !== 'none') {
      // 2D mode: fullscreen the main container
      if (graphContainer.requestFullscreen) {
        graphContainer.requestFullscreen();
      } else if ((graphContainer as any).webkitRequestFullscreen) {
        (graphContainer as any).webkitRequestFullscreen();
      }
      console.log('[Fullscreen] Request sent for 2D');
    } else {
      console.log('[Fullscreen] No eligible container found');
    }
  });
}

document.addEventListener('fullscreenchange', () => {
  // Toggle fullscreen-ui class on body
  const isFullscreen = document.fullscreenElement === graphContainer || document.fullscreenElement === graph3DContainer;
  document.body.classList.toggle('fullscreen-ui', isFullscreen);

  // Always show the control panel and fullscreen search bar in fullscreen (2D or 3D)
  const controls = document.getElementById('floating-graph-controls');
  const searchBarFS = document.getElementById('graph-search-bar-fs');
  const clearSelectionBar = document.getElementById('graph-clear-selection-bar');

  // Always force display for these panels in fullscreen
  if (isFullscreen) {
    if (controls) {
      controls.style.display = 'flex';
      controls.style.position = 'fixed';
      controls.style.top = '32px';
      controls.style.left = '50%';
      controls.style.right = '';
      controls.style.transform = 'translateX(-50%)';
      controls.style.zIndex = '20001';
      controls.style.pointerEvents = 'auto';
      // Remove any style that could hide it
      controls.hidden = false;
      controls.classList.remove('hidden');
    }
    if (searchBarFS) {
      searchBarFS.style.display = 'flex';
      searchBarFS.hidden = false;
      searchBarFS.classList.remove('hidden');
    }
    if (clearSelectionBar) {
      clearSelectionBar.style.display = 'flex';
      clearSelectionBar.hidden = false;
      clearSelectionBar.classList.remove('hidden');
    }
  } else {
    if (controls) {
      controls.style.display = '';
      controls.style.position = '';
      controls.style.top = '';
      controls.style.left = '';
      controls.style.right = '';
      controls.style.transform = '';
      controls.style.zIndex = '';
      controls.style.pointerEvents = '';
    }
    if (searchBarFS) searchBarFS.style.display = '';
    if (clearSelectionBar) clearSelectionBar.style.display = '';
  }
});

// Show fullscreen toolbar only in fullscreen, hide all other toolbars. Wire up toolbar controls to graph logic. Exit button exits fullscreen. Sync state between normal and fullscreen controls.
function updateFullscreenToolbar() {
  const fsToolbar = document.getElementById('fullscreen-toolbar');
  const fs = document.fullscreenElement || (document as any).webkitFullscreenElement;
  if (fsToolbar) fsToolbar.style.display = fs ? 'flex' : 'none';
}
document.addEventListener('fullscreenchange', updateFullscreenToolbar);
document.addEventListener('webkitfullscreenchange', updateFullscreenToolbar);
window.addEventListener('DOMContentLoaded', updateFullscreenToolbar);

// Wire up fullscreen toolbar controls to graph logic
window.addEventListener('DOMContentLoaded', function() {
  // Map selector
  const mapSel = document.getElementById('graph-map-selector') as HTMLSelectElement;
  const mapSelFs = document.getElementById('graph-map-selector-fs') as HTMLSelectElement;
  // --- Add direct event listeners to fullscreen controls to trigger graph logic ---
  // Map selector
  if (mapSel && mapSelFs) {
    mapSelFs.addEventListener('change', function (e) {
      mapSel.value = mapSelFs.value;
      mapSel.dispatchEvent(new Event('change'));
    });
  }
  // Display Map
  const displayMapFs = document.getElementById('graph-display-map-fs') as HTMLInputElement;
  const displayMap = document.getElementById('graph-display-map') as HTMLInputElement;
  if (displayMap && displayMapFs) {
    displayMapFs.addEventListener('click', function () {
      displayMap.checked = displayMapFs.checked;
      displayMap.dispatchEvent(new Event('click'));
    });
  }
  // Display Contributors
  const showContribFs = document.getElementById('graph-checkbox-show-contributors-fs') as HTMLInputElement;
  const showContrib = document.getElementById('graph-checkbox-show-contributors') as HTMLInputElement;
  if (showContrib && showContribFs) {
    showContribFs.addEventListener('click', function () {
      showContrib.checked = showContribFs.checked;
      showContrib.dispatchEvent(new Event('click'));
    });
  }
  // Move Contributors to Location
  const moveContribFs = document.getElementById('graph-contributors-to-location-fs') as HTMLInputElement;
  const moveContrib = document.getElementById('graph-contributors-to-location') as HTMLInputElement;
  if (moveContrib && moveContribFs) {
    moveContribFs.addEventListener('change', function () {
      moveContrib.checked = moveContribFs.checked;
      moveContrib.dispatchEvent(new Event('change'));
    });
  }
  // Move Spaces etc to location
  const moveSpacesFs = document.getElementById('graph-spaces-to-location-fs') as HTMLInputElement;
  const moveSpaces = document.getElementById('graph-spaces-to-location') as HTMLInputElement;
  if (moveSpaces && moveSpacesFs) {
    moveSpacesFs.addEventListener('change', function () {
      moveSpaces.checked = moveSpacesFs.checked;
      moveSpaces.dispatchEvent(new Event('change'));
    });
  }
  // 3D View toggle
  const graph3DToggleFs2 = document.getElementById('graph-3d-toggle-fs') as HTMLInputElement;
  if (graph3DToggle instanceof HTMLInputElement && graph3DToggleFs2) {
    graph3DToggleFs2.addEventListener('change', function () {
      graph3DToggle.checked = graph3DToggleFs2.checked;
      graph3DToggle.dispatchEvent(new Event('change'));
    });
  }
  // Exit fullscreen button
  const exitBtn = document.getElementById('fullscreen-exit-btn');
  if (exitBtn) exitBtn.onclick = () => {
    if (document.exitFullscreen) document.exitFullscreen();
    else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
  };
});

// --- D3 + FULLSCREEN CONTROL WIRING ---
// Map selector
const mapSel = document.getElementById('graph-map-selector') as HTMLSelectElement;
const mapSelFs = document.getElementById('graph-map-selector-fs') as HTMLSelectElement;
if (mapSel && mapSelFs) {
  mapSelFs.value = mapSel.value;
  mapSel.addEventListener('change', function () {
    mapSelFs.value = mapSel.value;
  });
  mapSelFs.addEventListener('change', function () {
    mapSel.value = mapSelFs.value;
    mapSel.dispatchEvent(new Event('change'));
  });
}
// Display Map
const displayMap = document.getElementById('graph-display-map') as HTMLInputElement;
const displayMapFs = document.getElementById('graph-display-map-fs') as HTMLInputElement;
if (displayMap && displayMapFs) {
  displayMapFs.checked = displayMap.checked;
  displayMap.addEventListener('click', function () {
    displayMapFs.checked = displayMap.checked;
  });
  displayMapFs.addEventListener('click', function () {
    displayMap.checked = displayMapFs.checked;
    displayMap.dispatchEvent(new Event('click'));
  });
}
// Display Contributors
const showContrib = document.getElementById('graph-checkbox-show-contributors') as HTMLInputElement;
const showContribFs = document.getElementById('graph-checkbox-show-contributors-fs') as HTMLInputElement;
if (showContrib && showContribFs) {
  showContribFs.checked = showContrib.checked;
  showContrib.addEventListener('click', function () {
    showContribFs.checked = showContrib.checked;
  });
  showContribFs.addEventListener('click', function () {
    showContrib.checked = showContribFs.checked;
    showContrib.dispatchEvent(new Event('click'));
  });
}
// Move Contributors to Location
const moveContrib = document.getElementById('graph-contributors-to-location') as HTMLInputElement;
const moveContribFs = document.getElementById('graph-contributors-to-location-fs') as HTMLInputElement;
if (moveContrib && moveContribFs) {
  moveContribFs.checked = moveContrib.checked;
  moveContrib.addEventListener('change', function () {
    moveContribFs.checked = moveContrib.checked;
  });
  moveContribFs.addEventListener('change', function () {
    moveContrib.checked = moveContribFs.checked;
    moveContrib.dispatchEvent(new Event('change'));
  });
}
// Move Spaces etc to location
const moveSpaces = document.getElementById('graph-spaces-to-location') as HTMLInputElement;
const moveSpacesFs = document.getElementById('graph-spaces-to-location-fs') as HTMLInputElement;
if (moveSpaces && moveSpacesFs) {
  moveSpacesFs.checked = moveSpaces.checked;
  moveSpaces.addEventListener('change', function () {
    moveSpacesFs.checked = moveSpaces.checked;
  });
  moveSpacesFs.addEventListener('change', function () {
    moveSpaces.checked = moveSpacesFs.checked;
    moveSpaces.dispatchEvent(new Event('change'));
  });
}
// 3D View toggle
// (No redeclaration, use the already declared graph3DToggle and graph3DToggleFs)
if (graph3DToggle && graph3DToggleFs) {
  graph3DToggleFs.checked = graph3DToggle.checked;
  graph3DToggle.addEventListener('change', function () {
    graph3DToggleFs.checked = graph3DToggle.checked;
    // 3D toggle logic
    // --- GUARD: Never trigger fullscreen from here ---
    // Remove any accidental call to requestFullscreen
    // Show 3D, hide 2D
    if (graph3DToggle.checked) {
      if (graph3DContainer) {
        graph3DContainer.style.display = '';
        graph3DContainer.style.border = '';
        graph3DContainer.style.background = '';
        setTimeout(() => {
          const canvas = graph3DContainer.querySelector('canvas');
          if (canvas) {
            canvas.style.width = '100%';
            canvas.style.height = '100%';
          }
          if (graph3DVis && graph3DContainer.offsetWidth && graph3DContainer.offsetHeight) {
            graph3DVis.resize(graph3DContainer.offsetWidth, graph3DContainer.offsetHeight);
          }
        }, 0);
      }
      const svgElem = document.getElementById('graph-svg');
      if (svgElem) svgElem.style.display = 'none';
      // Show control panel if not fullscreen
      const fsElem = document.fullscreenElement || (document as any).webkitFullscreenElement;
      const controls = document.getElementById('floating-graph-controls');
      if (!fsElem && controls) controls.style.display = '';
      if (!graph3DVis && graph3DContainer && graphDataProvider.data) {
        const rawData = graphDataProvider.data;
        const nodeGroups = rawData.nodes;
        const allNodes = Object.values(nodeGroups).reduce((acc, arr) => acc.concat(arr), []);
        const allLinks = rawData.edges || [];
        const graph3DData = { nodes: allNodes, links: allLinks };
        graph3DVis = new Graph3DVisualization(graph3DContainer, graph3DData);
        graph3DVis.render();
      }
    } else {
      if (graph3DContainer) graph3DContainer.style.display = 'none';
      const svgElem = document.getElementById('graph-svg');
      if (svgElem) svgElem.style.display = '';
      const fsElem = document.fullscreenElement || (document as any).webkitFullscreenElement;
      const controls = document.getElementById('floating-graph-controls');
      if (!fsElem && controls) controls.style.display = '';
      if (graph3DVis) {
        graph3DVis.destroy();
        graph3DVis = null;
      }
    }
  });
  graph3DToggleFs.addEventListener('change', function () {
    graph3DToggle.checked = graph3DToggleFs.checked;
    graph3DToggle.dispatchEvent(new Event('change'));
  });
}

// Make graphDataProvider available globally for 3D click handler
(window as any).graphDataProvider = graphDataProvider;
