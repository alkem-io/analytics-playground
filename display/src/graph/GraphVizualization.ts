import * as d3 from 'd3';
import { select, Selection } from 'd3-selection';
import { max } from 'd3-array';
import { scaleOrdinal, scaleLinear } from 'd3-scale';
import { schemeCategory10 } from 'd3-scale-chromatic';
import { forceSimulation, forceLink, forceManyBody, forceCollide, forceCenter } from 'd3-force';
import { line, curveCardinal } from 'd3-shape';
import { GraphDataProvider } from './GraphDataProvider';
import { addArrowHeadDef } from './util/VisualDefinitions';
import { NodeDragHandler } from './handlers/NodeDragHandler';
import { TransformationHandler } from './handlers/TransformationHandler';
import { MapDataProvider } from './MapDataProvider';
import { MapLocationHandler } from './handlers/MapLocationHandler';
import { HovercardHtml } from './components/HovercardHtml';
import { NetworkInsightEngine } from './NetworkInsightEngine';
import { SmartSearch } from './SmartSearch';
import { zoomIdentity } from 'd3';

// RESTORE POINT: Created before Kumu-style improvements on 2025-06-23
// If you need to restore, copy this file over GraphVizualization.ts

// --- BEGIN ORIGINAL FILE ---

export class GraphVizualization {
  defMarkerArrowName = 'markerArrow';
  maxNodeRadius = 30;
  graphDataProvider: GraphDataProvider;
  mapDataProvider: MapDataProvider;
  svg: Selection<any, any, any, any>;
  graphGroup: Selection<any, any, any, any>;
  nodesGroup: any;
  linksGroup: any;
  mapGroup: any;
  map: any;
  node: any;
  nodeScale: any;
  nodeColorScale: any;
  width: number;
  height: number;
  dragEnabled = true;
  link: any;
  linkWidthScale: any;
  simulation: any;
  lineGenerator = line().curve(curveCardinal);
  hovercard: HovercardHtml;
  transformationHandler: TransformationHandler;
  mapLocationHandler: MapLocationHandler;
  private clusterGroup: any = null;
  private fannedCluster: any = null;
  private fannedNodes: any[] = [];
  private selectedNodeId: string | null = null;
  private isSimulationRunning: boolean = false;

  // Kumu.io-inspired features
  private insightEngine!: NetworkInsightEngine;
  private smartSearch: SmartSearch | null = null;
  private currentVisualMode: 'default' | 'centrality' | 'community' | 'geographic' = 'default';
  private communityColors: Map<string, string> = new Map();
  private controlPanelOpen: boolean = false;

  constructor(
    svg: any,
    graphDataProvider: GraphDataProvider,
    mapDataProvider: MapDataProvider,
    width: number,
    height: number
  ) {
    this.svg = svg;
    this.graphDataProvider = graphDataProvider;
    this.mapDataProvider = mapDataProvider;
    this.width = width;
    this.height = height;
    this.simulation = forceSimulation();
    this.simulation
      .force('link', forceLink().id((d: any) => d.id).distance(80))
      .force('charge', forceManyBody().strength(-200))
      .force('center', forceCenter(this.width / 2, this.height / 2))
      .force('collide', forceCollide().radius((d: any) => this.nodeScale ? this.nodeScale(d.weight) + 8 : 16));
    this.svg.style('width', width + 'px').style('height', height + 'px');
    const graphDefs = this.svg.append('defs').attr('id', 'graph-defs');
    addArrowHeadDef(this.defMarkerArrowName, graphDefs);
    this.graphGroup = this.svg.append('g').attr('id', 'graph');
    this.transformationHandler = new TransformationHandler(
      this.width,
      this.height,
      this.graphGroup
    );
    this.mapLocationHandler = new MapLocationHandler(
      this.simulation,
      this.transformationHandler
    );
    this.hovercard = new HovercardHtml(svg, 0, 0);

    // Initialize Kumu.io-inspired features
    this.insightEngine = new NetworkInsightEngine(this.graphDataProvider);
    this.initializeControlPanel();

    this.refreshDisplayedGraph();
    setTimeout(() => {
      const clearBtn = document.getElementById('graph-clear-selection');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => this.clearSelection());
      }

      // Add event handlers for main insights section
      const refreshInsightsBtn = document.getElementById('refresh-insights-main');
      if (refreshInsightsBtn) {
        refreshInsightsBtn.addEventListener('click', () => {
          this.updateNetworkMetrics();
          this.generateSmartInsights();
        });
      }

      const exportInsightsBtn = document.getElementById('export-insights');
      if (exportInsightsBtn) {
        exportInsightsBtn.addEventListener('click', () => this.exportInsights());
      }
    }, 0);
  } // <-- Ensure constructor is closed here

  refreshDisplayedGraph() {
    this.simulation.stop();
    this.isSimulationRunning = false;

    // Remove nodes group before links group to ensure correct stacking order
    if (this.nodesGroup) this.nodesGroup.remove();
    if (this.linksGroup) this.linksGroup.remove();
    if (this.mapGroup) this.mapGroup.remove();

    this.transformationHandler.projectionExtent(
      this.mapDataProvider.getSelectedMap()
    );

    // Scales may change
    this.updateScales();

    this.displayMap();
    this.displayLinks();
    this.displayNodes();
    // Move nodes group to the end of the SVG to guarantee nodes are on top
    if (this.nodesGroup) this.nodesGroup.node().parentNode.appendChild(this.nodesGroup.node());
    // Remove custom drag handler, rely on D3 zoom for panning
    // this.transformationHandler.registerPanningDragListener(this.svg);

    // Enable mouse scroll zoom and pan
    this.transformationHandler.registerZoom(this.svg);

    this.simulation.nodes(this.graphDataProvider.getFilteredNodes());
    this.simulation.force('link').links(this.graphDataProvider.getFilteredEdges());
    this.simulation.alpha(1).restart();
    this.isSimulationRunning = true;

    // Performance optimization: Add timeout to stop simulation after reasonable time
    const nodeCount = this.graphDataProvider.getFilteredNodes().length;
    const timeoutMs = nodeCount > 200 ? 10000 : 30000; // 10s for large graphs, 30s for small
    setTimeout(() => {
      if (this.simulation && this.isSimulationRunning) {
        this.simulation.stop();
        this.isSimulationRunning = false;
        console.log('Force simulation stopped after timeout to improve performance');
      }
    }, timeoutMs);

    this.simulate();
    this.hovercard.registerHovercard(
      this.node,
      this.simulation,
      this.transformationHandler
    );

    const nodeDragHandler = new NodeDragHandler(this.simulation, this.nodeScale);
    nodeDragHandler.register(this.node);
    this.mapLocationHandler = new MapLocationHandler(
      this.simulation,
      this.transformationHandler
    );

    if (this.mapDataProvider.isMapDisplayEnabled()) this.showMap();

    // Clean, production-ready global click handler for SVG circles to show node info panel with improved UI
    setTimeout(() => {
      const self = this;
      document.querySelectorAll('svg circle').forEach(el => {
        el.addEventListener('click', function(this: SVGCircleElement, e: any) {
          const d = (this as any).__data__;
          // Deselect if already selected
          if (self.selectedNodeId === d.id) {
            self.clearSelection();
            return;
          }
          self.selectedNodeId = d.id;
          // Always close cluster panel when selecting a node
          const clusterPanel = document.getElementById('cluster-panel');
          if (clusterPanel) clusterPanel.style.display = 'none';
          // Try to get the most complete node object
          const contributor = self.graphDataProvider.contributorNodes.find((n: any) => n.id === d.id);
          const space = self.graphDataProvider.spaceNodes.find((n: any) => n.id === d.id);
          const filtered = self.graphDataProvider.getFilteredNodes().find((n: any) => n.id === d.id);
          // Merge all available data, preferring contributor > space > filtered > d
          const node = Object.assign({}, d, filtered, space, contributor);
          self.showNodeInfoPanel(node);
          // Highlight 1-jump and 2-jump neighborhood
          self.highlightNodeNeighbors(node);
        });
      });
    }, 0);

    // Update insights engine with new data
    if (this.insightEngine) {
      this.insightEngine.updateData();
      this.updateNetworkMetrics();
      this.generateSmartInsights();

      // Also update control panel if it's open
      if (this.controlPanelOpen) {
        this.updateNetworkMetrics();
      }
    }

    // Refresh smart search
    if (this.smartSearch) {
      this.smartSearch.refresh();
    }
  }

  clearSelection() {
    // Reset highlighting/dimming
    if (this.node) {
      (this.node as any).each(function(d: any) {
        delete d.fx;
        delete d.fy;
      }).transition().duration(200)
        .style('opacity', 1)
        .attr('stroke', (d: any) => d.type === 'organization' || d.type === 'space' ? '#0A6E8A' : '#251607 ')
        .attr('stroke-width', (d: any) => d.type === 'organization' || d.type === 'space' ? 3.0 : 0.5);
    }
    if (this.link) {
      (this.link as any).transition().duration(200)
        .style('opacity', 1)
        .style('stroke', '#bfc9d1')
        .style('stroke-width', 1);
    }
    // Hide info panels by removing 'visible' class
    const nodePanel = document.getElementById('graph-info-panel');
    if (nodePanel) nodePanel.classList.remove('visible');
    const clusterPanel = document.getElementById('cluster-panel');
    if (clusterPanel) clusterPanel.classList.remove('visible');
    this.selectedNodeId = null;
    // Restart simulation to relax layout only if not already running
    if (this.simulation && !this.isSimulationRunning) {
      this.simulation.alpha(0.3).restart(); // Gentle restart
      this.isSimulationRunning = true;

      // Auto-stop after a short time to prevent performance issues
      setTimeout(() => {
        if (this.simulation && this.isSimulationRunning) {
          this.simulation.stop();
          this.isSimulationRunning = false;
        }
      }, 3000);
    }
  }

  private updateScales() {
    // Get max values
    const maxNodeWeight =
      max(
        this.graphDataProvider.getFilteredNodes().map(node => node.weight)
      ) || 10;
    const maxLinkWeight =
      max(
        this.graphDataProvider.getFilteredEdges().map(link => link.weight)
      ) || 10;

    // Create the scales
    this.nodeColorScale = scaleOrdinal(schemeCategory10);
    this.nodeScale = scaleLinear()
      .domain([0, maxNodeWeight])
      .range([8, this.maxNodeRadius]);
    this.linkWidthScale = scaleLinear()
      .domain([0, maxLinkWeight])
      .range([0.5, 5]);
  }

  simulate() {
    // Gravity determines how strongly the nodes push / pull each other.
    // In effect, the lower the number goes, the more spread out the graph will be.
    const filteredNodes: any = this.graphDataProvider.getFilteredNodes();
    const nodeCount = filteredNodes.length;

    // Performance optimization: adjust forces based on node count
    const isLargeGraph = nodeCount > 200;
    const gravity = isLargeGraph ? -20 : -40; // Weaker gravity for large graphs

    // Defensive: filter out links whose source/target is not in filteredNodes
    const nodeIds = new Set(filteredNodes.map((n: any) => n.id));
    const safeEdges = this.graphDataProvider.getFilteredEdges().filter((e: any) => nodeIds.has(e.sourceID) && nodeIds.has(e.targetID));
    const safeSpaceEdges = this.graphDataProvider.getSpaceEdges().filter((e: any) => nodeIds.has(e.sourceID) && nodeIds.has(e.targetID));

    // Performance optimization: adjust simulation parameters based on node count
    const alphaDecay = isLargeGraph ? 0.05 : 0.0228; // Much faster convergence for large graphs
    const velocityDecay = isLargeGraph ? 0.8 : 0.4; // Higher friction for large graphs
    const alphaMin = isLargeGraph ? 0.1 : 0.001; // Stop much earlier for large graphs

    this.simulation = forceSimulation(filteredNodes)
      .alphaDecay(alphaDecay)
      .velocityDecay(velocityDecay)
      .alphaMin(alphaMin)
      .force('link', forceLink(safeEdges)
        .id((d: any) => d.id)
        .distance(isLargeGraph ? 100 : 150) // Shorter links for large graphs
        .strength((edge: any) => {
          const baseStrength = isLargeGraph ? 0.1 : 0.2; // Weaker links for large graphs
          if (edge.type === 'child') {
            return baseStrength * 3.5; // Maintain ratio
          }
          return baseStrength;
        }))
      .force('linkSpaces', forceLink(safeSpaceEdges)
        .id((d: any) => d.id)
        .distance(isLargeGraph ? 800 : 1500) // Shorter space links for large graphs
        .strength(isLargeGraph ? 0.5 : 1)) // Weaker space links
      .force('charge', forceManyBody().strength(gravity))
      .force('collision', forceCollide()
        .radius((d: any) => {
          if (d.type === 'space') {
            return d.r * (isLargeGraph ? 3 : 5); // Smaller collision radius for large graphs
          }
          return d.r;
        })
        .strength(isLargeGraph ? 50 : 100) // Weaker collision for large graphs
        .iterations(1))
      .force('center', forceCenter(this.width / 2, this.height / 2));

    // Performance optimization: throttle animation updates for large graphs
    let tickCounter = 0;
    const tickSkip = isLargeGraph ? 5 : 1; // Skip more frames for large graphs

    this.simulation.on('tick', () => {
      tickCounter++;
      if (tickCounter % tickSkip === 0) {
        this.animateNode();
        this.animateLinks();
      }
    });

    this.simulation.on('end', () => {
      this.isSimulationRunning = false;
      console.log('Force simulation completed naturally');
    });

    // Performance optimization: pre-run simulation ticks for initial stabilization
    if (isLargeGraph) {
      this.simulation.tick(50); // More pre-calculated positions for large graphs
    }
  }

  private displayNodes() {
    this.nodesGroup = this.graphGroup.append('g').attr('class', 'nodes');
    const allNodes = this.graphDataProvider.getFilteredNodes();
    const nodeScale = this.nodeScale;
    const self = this;

    // D3 join: one <g> per node
    const nodeGroup = this.nodesGroup
      .selectAll('g.node-group')
      .data(allNodes, (d: any) => d.id)
      .join('g')
      .attr('class', 'node-group')
      .attr('id', (d: any) => 'node-' + d.id)
      .style('cursor', 'pointer');

    this.node = nodeGroup;
    nodeGroup.selectAll('*').remove();

    function getNodeColorType(d: any) {
      if (d.group === 'contributors' || d.type === 'user') return 'user';
      if (d.type && d.type.startsWith('space')) return 'space';
      if (d.type === 'organization') return 'organization';
      if (d.type === 'subspace') return 'subspace';
      return d.type || d.group;
    }
    nodeGroup.each(function(this: SVGGElement, d: any) {
      const colorType = getNodeColorType(d);
      const color = self.nodeColorScale(colorType) || '#7dafff';
    });

    // Always render a circle for every node
    nodeGroup.append('circle')
      .attr('r', (d: any) => nodeScale(d.weight) || 14)
      .attr('fill', (d: any) => self.nodeColorScale(d.group || d.type) || '#7dafff')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('filter', 'url(#node-shadow)')
      .classed('node', true)
      .classed('fixed', (d: any) => d.fx !== undefined);

    // Attach click/hover handlers to <g>
    nodeGroup.on('click', (event: any, d: any) => {
      event.stopPropagation();
      this.showNodeInfoPanel(d);
    });
    nodeGroup.on('mouseover', function(this: SVGGElement, event: any, d: any) {
      d3.select(this).select('circle')
        .transition().duration(150)
        .attr('r', (d: any) => (nodeScale(d.weight) || 14) + 4)
        .attr('stroke', '#222')
        .attr('stroke-width', 3)
        .style('filter', 'drop-shadow(0 4px 12px rgba(80,120,200,0.25))');
    });
    nodeGroup.on('mouseout', function(this: SVGGElement, event: any, d: any) {
      d3.select(this).select('circle')
        .transition().duration(150)
        .attr('r', (d: any) => nodeScale(d.weight) || 14)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .style('filter', 'drop-shadow(0 2px 6px rgba(80,120,200,0.15))');
    });

    // Update all node positions on every simulation tick
    const simulation = this.simulation;
    simulation.on('tick.node', () => {
      nodeGroup.attr('transform', (d: any) => `translate(${d.x || 0},${d.y || 0})`);
    });
  }

  private displayLinks() {
    this.linksGroup = this.graphGroup.append('g').attr('class', 'links');
    const allLinks = this.graphDataProvider.getFilteredEdges();
    this.link = this.linksGroup
      .selectAll('line')
      .data(allLinks, (d: any) => d.id || d.sourceID + '-' + d.targetID)
      .join('line')
      .attr('stroke', '#bfc9d1')
      .attr('stroke-width', 2)
      .attr('pointer-events', 'none')
      .attr('opacity', 0.85)
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y);

    // On every simulation tick, update link positions:
    this.simulation.on('tick.links', () => {
      this.link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);
    });
  }

  private displayMap() {
    this.mapGroup = this.graphGroup
      .append('g')
      .attr('class', 'map')
      .style('opacity', 0);

    // Check if this is a world map for styling
    const mapFeatures = this.mapDataProvider.getSelectedMap().features;
    const selectedMapPath = this.mapDataProvider.getSelectedMapPath();
    const isWorldMap = selectedMapPath.includes('world');

    // For world maps, explicitly ensure no background sphere is rendered
    // Remove any existing sphere/background elements
    this.mapGroup.selectAll('.sphere, .background').remove();

    this.map = this.mapGroup
      .selectAll('path.country')
      .data(mapFeatures, (d: any, i: number) => {
        // Try different property names for different map formats
        const name = d.properties?.name_en || d.properties?.NAME || d.properties?.name || d.id || i;
        return name;
      })
      .join('path')
      .attr('class', 'country')
      .attr('id', (d: any, i: number) => {
        const name = d.properties?.name_en || d.properties?.NAME || d.properties?.name || d.id || i;
        return String(name);
      })
      .attr('d', this.transformationHandler.geoGenerator)
      .attr('fill', isWorldMap ? '#B0B0B0' : 'rgba(200, 200, 200, 0.6)') // Grey for world map countries
      .attr('stroke', isWorldMap ? '#FFFFFF' : '#333') // White borders for world map
      .attr('stroke-width', isWorldMap ? '0.5px' : '0.5px')
      .style('pointer-events', 'none'); // Ensure countries don't interfere with node interactions
  }

  showMap() {
    this.mapGroup.transition().duration(200).style('opacity', 1);
    this.mapDataProvider.setMapsDisplay(true);
  }

  hideMap() {
    this.mapGroup.transition().duration(200).style('opacity', 0);
  }

  zoomFit() {
    this.transformationHandler.zoomFit(this.maxNodeRadius, this.node.data());
    this.transformationHandler.transformDisplay(750);
  }

  zoomPlus() {
    this.transformationHandler.zoomPlus();
  }

  zoomMin() {
    this.transformationHandler.zoomMin();
  }

  fixLocationToMap(nodeType: string) {
    console.log(`Attempting to fix ${nodeType} nodes to map locations...`);

    // Check if map is displayed - better approach using the actual mapGroup
    if (!this.mapGroup || this.mapGroup.empty() || this.mapGroup.style('opacity') === '0') {
      console.warn('Map is not displayed! Please enable "Display Map" first.');
      alert('Please enable "Display Map" first before moving contributors to location.');
      return;
    }

    // Count nodes with location data
    const nodesData = this.node.data();
    const nodesWithLocation = nodesData.filter((node: any) => {
      if (node.type !== nodeType) return false;
      const lon = node.profile?.location?.lon;
      const lat = node.profile?.location?.lat;
      return lon && lat && lon !== 0 && lat !== 0;
    });

    console.log(`Found ${nodesWithLocation.length} ${nodeType} nodes with location data out of ${nodesData.filter((n: any) => n.type === nodeType).length} total ${nodeType} nodes`);

    if (nodesWithLocation.length === 0) {
      console.warn(`No ${nodeType} nodes have location data (lon/lat). Cannot move to map positions.`);
      //alert(`No ${nodeType} nodes have location data. Make sure your data includes latitude and longitude information.`);
      return;
    }

    this.mapLocationHandler.fixNodeLocationToMap(this.node, nodeType);
    this.mapLocationHandler.registerNodeExpansion(this.node);
    this.transformationHandler.transformDisplay(750);

    console.log(`Successfully moved ${nodesWithLocation.length} ${nodeType} nodes to their map locations.`);
  }

  unfixLocationFromMap(nodeType: string) {
    console.log(`Unfixing ${nodeType} nodes from map locations...`);
    this.mapLocationHandler.unfixNodeLocationFromMap(this.node, nodeType);
    this.transformationHandler.transformDisplay(750);
    console.log(`${nodeType} nodes are now free to move based on force simulation.`);
  }

  private animateNode() {
    const nodes = this.graphDataProvider.getFilteredNodes();

    // Performance optimization: Skip expensive clustering for large graphs or throttle it
    const nodeCount = nodes.length;
    const shouldCluster = nodeCount < 300; // Only cluster for smaller graphs

    let clusters: { x: number, y: number, count: number, members: any[] }[] = [];

    if (shouldCluster) {
      // Group nodes by proximity (10px radius) - only for smaller graphs
      const assigned = new Set();
      const radius = 10;
      for (let i = 0; i < nodes.length; i++) {
        const ni = nodes[i] as any;
        if (assigned.has(ni.id)) continue;
        const group = [ni];
        assigned.add(ni.id);
        for (let j = i + 1; j < nodes.length; j++) {
          const nj = nodes[j] as any;
          if (assigned.has(nj.id)) continue;
          const dx = ni.x - nj.x;
          const dy = ni.y - nj.y;
          if (Math.sqrt(dx * dx + dy * dy) < radius) {
            group.push(nj);
            assigned.add(nj.id);
          }
        }
        if (group.length > 1) {
          // Compute average position
          const avgX = group.reduce((sum, n) => sum + (n as any).x, 0) / group.length;
          const avgY = group.reduce((sum, n) => sum + (n as any).y, 0) / group.length;
          clusters.push({ x: avgX, y: avgY, count: group.length, members: group });
        }
      }
    }

    // Update node positions
    this.node.attr('cx', (d: any) => (d as any).x)
      .attr('cy', (d: any) => (d as any).y)
      .style('display', (d: any) => {
        // If a cluster is fanned out, show its member nodes
        if (this.fannedNodes && this.fannedNodes.length > 0) {
          if (this.fannedNodes.find((n: any) => n.id === d.id)) return '';
        }
        // Only hide nodes in clusters if clustering is enabled
        if (shouldCluster) {
          for (const c of clusters) {
            if (c.members.find((n: any) => n.id === d.id)) return 'none';
          }
        }
        return '';
      });

    // Only create cluster visualizations for smaller graphs
    if (shouldCluster) {
      // Remove previous clusters
      if (this.clusterGroup) this.clusterGroup.remove();
      // Append cluster group directly to graphGroup, after nodesGroup, so clusters are on top
      this.clusterGroup = this.graphGroup.append('g').attr('class', 'clusters');

      // Draw cluster circles and badges
      const self = this;
      const clusterSelection = this.clusterGroup.selectAll('g.cluster')
        .data(clusters)
        .join('g')
        .attr('class', 'cluster')
        // Hide the cluster circle if it's fanned out
        .style('display', (d: any) => {
          if (this.fannedNodes && this.fannedNodes.length > 0 && this.fannedCluster === d) return 'none';
          return '';
        });

      // Draw/Update cluster circles (with larger invisible hitbox and hover effect)
      clusterSelection.selectAll('circle.cluster-hitbox')
        .data((d: any) => [d])
        .join('circle')
        .attr('class', 'cluster-hitbox')
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y)
        .attr('r', 28) // Larger than visible badge
        .attr('fill', 'transparent')
        .style('cursor', 'pointer')
        .on('click', (event: any, d: any) => {
          event.stopPropagation();
          self.showClusterPanel(d);
        });

      clusterSelection.selectAll('circle.cluster-badge')
        .data((d: any) => [d])
        .join('circle')
        .attr('class', 'cluster-badge')
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y)
        .attr('r', 18)
        .attr('fill', '#eee')
        .attr('stroke', '#333')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('click', (event: any, d: any) => {
          event.stopPropagation();
          self.showClusterPanel(d);
        })
        .on('mouseover', function (this: SVGCircleElement) { d3.select(this).attr('stroke', '#007bff').attr('stroke-width', 4); })
        .on('mouseout', function (this: SVGCircleElement) { d3.select(this).attr('stroke', '#333').attr('stroke-width', 2); });

      // Draw/Update cluster badges (show +count)
      clusterSelection.selectAll('text')
        .data((d: any) => [d])
        .join('text')
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y + 5)
        .attr('text-anchor', 'middle')
        .attr('font-size', '1.1em')
        .attr('font-weight', 'bold')
        .attr('fill', '#333')
        .text((d: any) => '+' + d.count);

      // After drawing clusters, move clusterGroup to end of graphGroup to ensure on top
      if (this.clusterGroup) this.graphGroup.node().appendChild(this.clusterGroup.node());
    }
  }

  private animateLinks() {
    // Performance optimization: simplify link drawing for large graphs
    const nodeCount = this.graphDataProvider.getFilteredNodes().length;
    const isLargeGraph = nodeCount > 200;

    this.link.attr('d', (d: any) => {
      // For large graphs, use straight lines to improve performance
      if (isLargeGraph) {
        return `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`;
      }

      // For smaller graphs, keep the curved links
      const mid: [number, number] = [
        (d.source.x + d.target.x) / 2,
        (d.source.y + d.target.y) / 2,
      ];

      // If two lines overlap with each other, curve one of the lines.
      if (d.overlap > 0) {
        const index = d.overlap;
        // const index = d.overlap.filter((ol) => ol.weight > d.weight).length;

        const distance = Math.sqrt(
          Math.pow(d.target.x - d.source.x, 2) +
            Math.pow(d.target.y - d.source.y, 2)
        );

        //The math below finds a point just off the center of the line.
        const slopeX = (d.target.x - d.source.x) / distance;
        const slopeY = (d.target.y - d.source.y) / distance;

        const curveSharpness = 3.5 * index;
        mid[0] += curveSharpness * slopeY;
        mid[1] -= curveSharpness * slopeX;
      }

      const linePoints: [number, number][] = [
        [d.source.x, d.source.y],
        mid,
        [d.target.x, d.target.y],
      ];

      return this.lineGenerator(linePoints);
    });
  }

  // --- Fan out cluster nodes and zoom in ---
  public fanOutCluster(cluster: any, self: any) {
    if (!self.transformationHandler || !self.svg) return;
    // Zoom in to cluster center
    const zoomTarget = [cluster.x, cluster.y];
    const zoomScale = 2.5; // How much to zoom in
    self.svg.transition().duration(600).call(
      self.transformationHandler['d3Zoom'].transform,
      d3.zoomIdentity
        .translate(self.width / 2, self.height / 2)
        .scale(zoomScale)
        .translate(-zoomTarget[0], -zoomTarget[1])
    );
    // Fan out nodes in a circle
    const angleStep = (2 * Math.PI) / cluster.members.length;
    self.fannedNodes = [];
    cluster.members.forEach((n: any, i: number) => {
      const angle = i * angleStep;
      n.fx = cluster.x + 60 * Math.cos(angle);
      n.fy = cluster.y + 60 * Math.sin(angle);
      self.fannedNodes.push(n);
    });
    // Restart simulation to animate nodes to new positions - but gently
    if (self.simulation && !self.isSimulationRunning) {
      self.simulation.alpha(0.5).restart();
      self.isSimulationRunning = true;

      // Auto-stop after animation time
      setTimeout(() => {
        if (self.simulation && self.isSimulationRunning) {
          self.simulation.stop();
          self.isSimulationRunning = false;
        }
      }, 5000);
    }
    // On background click, reset
    self.svg.on('click.fanout', function () {
      self.resetFanOut();
    });
  }

  public resetFanOut() {
    // Remove fixed positions
    this.fannedNodes.forEach((n: any) => {
      n.fx = null;
      n.fy = null;
    });
    this.fannedNodes = [];
    // Zoom out smoothly
    if (this.svg && this.transformationHandler && this.transformationHandler['d3Zoom']) {
      this.svg.transition().duration(600).call(
        this.transformationHandler['d3Zoom'].transform,
        d3.zoomIdentity
      );
    }
    // Remove background click handler
    this.svg.on('click.fanout', null);
  }

  // --- Show cluster members in right side panel ---
  public showClusterPanel(cluster: any) {
    const panel = document.getElementById('cluster-panel');
    const content = document.getElementById('cluster-panel-content');
    if (!panel || !content) return;
    content.innerHTML = '';
    cluster.members.forEach((member: any) => {
      const displayName = member.profile?.displayName || member.label || member.name || member.id;
      const avatarUrl = member.avatar || '';
      const avatarImg = avatarUrl ? `<img src="${avatarUrl}" alt="avatar" style="width:36px;height:36px;border-radius:50%;margin-right:10px;vertical-align:middle;box-shadow:0 2px 8px #bbb;" />` : '';
      const div = document.createElement('div');
      div.className = 'cluster-member';
      div.onclick = () => {
        if (this.selectedNodeId === member.id) {
          this.clearSelection();
          return;
        }
        this.selectedNodeId = member.id;
        // Always close cluster panel when selecting a cluster member
        const clusterPanel = document.getElementById('cluster-panel');
        if (clusterPanel) clusterPanel.classList.remove('visible');
        // Open left-side node info panel
        let node = this.graphDataProvider.getFilteredNodes().find((n: any) => n.id === member.id);
        if (!node) node = this.graphDataProvider.spaceNodes.find((n: any) => n.id === member.id) || this.graphDataProvider.contributorNodes.find((n: any) => n.id === member.id);
        if (node) this.showNodeInfoPanel(node);
      };
      div.innerHTML = `
        <div class="cluster-member-info" style="display:flex;align-items:center;gap:14px;padding:10px 0 10px 0;">
          ${avatarImg}
          <div style="display:flex;flex-direction:column;justify-content:center;">
            <span class="cluster-member-name" style="font-weight:600;font-size:1.08em;line-height:1.2;">${displayName}</span>
            <span class="cluster-member-role" style="font-size:0.97em;color:#888;margin-top:2px;">${member.role || member.type || ''}</span>
          </div>
        </div>
      `;
      content.appendChild(div);
    });
    panel.classList.add('visible');
    const closeBtn = document.getElementById('cluster-panel-close');
    if (closeBtn) closeBtn.onclick = () => panel.classList.remove('visible');
    const titleElem = document.getElementById('cluster-panel-title');
    if (titleElem) {
      const memberWithCity = cluster.members.find((m: any) => m.profile?.location?.city);
      titleElem.textContent = memberWithCity ? memberWithCity.profile.location.city : 'Cluster Members';
    }
  }

  // --- Show node info in left side panel ---
  public showNodeInfoPanel(node: any) {
    const panel = document.getElementById('graph-info-panel');
    const content = document.getElementById('graph-info-content');
    const titleElem = document.getElementById('graph-info-title');
    if (!panel || !content || !titleElem) return;
    // Set title
    titleElem.textContent = node.profile?.displayName || node.label || node.name || node.id;
    // Build info HTML with avatar
    const avatarUrl = node.avatar || '';
    const avatarImg = avatarUrl ? `<img src="${avatarUrl}" alt="avatar" style="width:64px;height:64px;border-radius:50%;margin-bottom:10px;box-shadow:0 2px 8px #bbb;" />` : '';
    // Quick actions section
    const quickActions = `
      <div class="node-info-quick-actions" style="margin: 16px 0; display: flex; gap: 10px; justify-content: center;">
        <button class="quick-action-btn" id="zoom-to-node-btn" title="Zoom to node">🔍 Zoom to</button>
        <button class="quick-action-btn" id="highlight-neighbors-btn" title="Highlight neighbors">🌐 Highlight neighbors</button>
      </div>
    `;
    // Set panel content
    content.innerHTML = `
      <div class="node-info-panel-body">
        <div style="text-align:center;">${avatarImg}</div>
        ${quickActions}
        <div class="node-info-details">
          <div><b>Type:</b> ${node.type || ''}</div>
          <div><b>Group:</b> ${node.group || ''}</div>
          <div><b>Role:</b> ${node.role || ''}</div>
          <div><b>ID:</b> ${node.id}</div>
          <div><b>NameID:</b> ${node.nameID || ''}</div>
          <div><b>Weight:</b> ${node.weight || ''}</div>
          <div><b>Profile URL:</b> ${node.profile?.url ? `<a href='${node.profile.url}' target='_blank'>${node.profile.url}</a>` : ''}</div>
          <div><b>Location:</b> ${node.profile?.location?.city || ''}, ${node.profile?.location?.country || ''}</div>
          <div><b>Lat/Lon:</b> ${node.profile?.location?.lat || ''}, ${node.profile?.location?.lon || ''}</div>
        </div>
      </div>
    `;
    panel.classList.add('visible');
    panel.style.display = '';
    panel.style.border = '';
    // Attach button handlers after rendering content
    const zoomBtn = document.getElementById('zoom-to-node-btn');
    if (zoomBtn) zoomBtn.onclick = () => this.zoomToNode(node);
    const highlightBtn = document.getElementById('highlight-neighbors-btn');
    if (highlightBtn) highlightBtn.onclick = () => this.highlightNodeNeighbors(node);
    const closeBtn = document.getElementById('graph-info-close');
    if (closeBtn) closeBtn.onclick = () => panel.classList.remove('visible');
  }

  // Zoom to node (centers and zooms in on the node)
  public zoomToNode(node: any) {
    if (!this.transformationHandler || !this.svg || !node) return;
    const svgRect = this.svg.node().getBoundingClientRect();
    const x = node.x;
    const y = node.y;
    const scale = 1.5; // Zoom in factor
    this.svg.transition().duration(600).call(
      this.transformationHandler['d3Zoom'].transform,
      d3.zoomIdentity
        .translate(svgRect.width / 2, svgRect.height / 2)
        .scale(scale)
        .translate(-x, -y)
    );
  }

  private highlightNodeNeighbors(node: any) {
    // Highlight 1-jump and 2-jump neighbors with animated transitions
    const neighbors1 = new Set(this.graphDataProvider.getNeighbors(node.id, 1));
    const neighbors2 = new Set(this.graphDataProvider.getNeighbors(node.id, 2));
    (this.node as any).transition().duration(300)
      .style('opacity', (d: any) =>
        d.id === node.id || neighbors1.has(d.id) || neighbors2.has(d.id) ? 1 : 0.1)
      .attr('stroke', (d: any) =>
        d.id === node.id ? '#0050C8' : neighbors1.has(d.id) ? '#0050C8' : neighbors2.has(d.id) ? '#339CFF' : '#bfc9d1')
      .attr('stroke-width', (d: any) =>
        d.id === node.id ? 7 : neighbors1.has(d.id) ? 5 : neighbors2.has(d.id) ? 2.5 : 1)
      .style('filter', ''); // Remove glow from nodes
    (this.link as any).transition().duration(300)
      .style('opacity', (l: any) => {
        // 1st jump: link connects selected node to a 1st jump neighbor
        if ((l.source.id === node.id && neighbors1.has(l.target.id)) || (l.target.id === node.id && neighbors1.has(l.source.id))) {
          return 1;
        }
        // 2nd jump: link connects a 1st jump neighbor to a 2nd jump neighbor (but not the selected node)
        if ((neighbors1.has(l.source.id) && neighbors2.has(l.target.id) && l.source.id !== node.id) ||
            (neighbors1.has(l.target.id) && neighbors2.has(l.source.id) && l.target.id !== node.id)) {
          return 0.38;
        }
        return 0.05;
      })
      .style('stroke', (l: any) => {
        if ((l.source.id === node.id && neighbors1.has(l.target.id)) || (l.target.id === node.id && neighbors1.has(l.source.id))) {
          return '#0050C8';
        }
        if ((neighbors1.has(l.source.id) && neighbors2.has(l.target.id) && l.source.id !== node.id) ||
            (neighbors1.has(l.target.id) && neighbors2.has(l.source.id) && l.target.id !== node.id)) {
          return '#339CFF';
        }
        return '#bfc9d1';
      })
      .style('stroke-width', (l: any) => {
        if ((l.source.id === node.id && neighbors1.has(l.target.id)) || (l.target.id === node.id && neighbors1.has(l.source.id))) {
          return 4.5;
        }
        if ((neighbors1.has(l.source.id) && neighbors2.has(l.target.id) && l.source.id !== node.id) ||
            (neighbors1.has(l.target.id) && neighbors2.has(l.source.id) && l.target.id !== node.id)) {
          return 2.2;
        }
        return 1;
      })
      .style('filter', ''); // Remove glow from links
  }

  // =================================
  // KUMU.IO-INSPIRED FEATURES
  // =================================

  private initializeControlPanel() {
    // Create control panel toggle button if it doesn't exist
    if (!document.getElementById('control-panel-toggle')) {
      this.createControlPanelToggle();
    }

    // Load control panel HTML if it doesn't exist
    if (!document.getElementById('network-control-panel')) {
      this.loadControlPanel();
    }

    // Search bar functionality is handled by existing JavaScript in index.html
    // SmartSearch component (which creates overlay divs) is only used in control panel
  }

  private createControlPanelToggle() {
    const toggle = document.createElement('button');
    toggle.id = 'control-panel-toggle';
    toggle.innerHTML = '⚙️';
    toggle.title = 'Open Network Analysis Panel';
    toggle.style.cssText = `
      position: fixed;
      right: 20px;
      top: 20px;
      z-index: 1001;
      background: linear-gradient(135deg, #0A6E8A 0%, #068293 100%);
      color: white;
      border: none;
      border-radius: 50%;
      width: 56px;
      height: 56px;
      font-size: 20px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(10,110,138,0.3);
      transition: all 0.2s;
    `;

    toggle.addEventListener('click', () => this.toggleControlPanel());
    document.body.appendChild(toggle);
  }

  private async loadControlPanel() {
    try {
      // Load CSS
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'network-control-panel.css';
      document.head.appendChild(cssLink);

      const smartSearchCss = document.createElement('link');
      smartSearchCss.rel = 'stylesheet';
      smartSearchCss.href = 'smart-search.css';
      document.head.appendChild(smartSearchCss);

      // Load HTML
      const response = await fetch('network-control-panel.html');
      const html = await response.text();
      document.body.insertAdjacentHTML('beforeend', html);

      // Initialize control panel functionality
      this.setupControlPanelEvents();
      this.updateNetworkMetrics();

    } catch (error) {
      console.warn('Could not load control panel:', error);
      // Create a basic inline control panel as fallback (without insights section)
      this.createInlineControlPanel();
    }
  }

  private createInlineControlPanel() {
    const panelHtml = `
      <div id="network-control-panel" class="network-control-panel" style="
        position: fixed;
        right: 0;
        top: 0;
        width: 320px;
        height: 100vh;
        background: rgba(255, 255, 255, 0.98);
        backdrop-filter: blur(12px);
        box-shadow: -4px 0 20px rgba(0,0,0,0.08);
        z-index: 1000;
        overflow-y: auto;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        font-family: 'Inter', sans-serif;
      ">
        <div style="padding: 20px; background: linear-gradient(135deg, #0A6E8A 0%, #068293 100%); color: white;">
          <h2 style="margin: 0; font-size: 18px;">Network Explorer</h2>
          <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 13px;">Control your network visualization</p>
        </div>
        <div style="padding: 16px 20px;">
          <h3 style="margin: 0 0 12px 0; color: #0A6E8A; font-size: 14px; font-weight: 600;">Visual Controls</h3>
          <button onclick="window.graphVisualization?.updateVisualMode?.('centrality')" style="
            width: 100%;
            padding: 10px 16px;
            border: none;
            border-radius: 6px;
            background: linear-gradient(135deg, #0A6E8A 0%, #068293 100%);
            color: white;
            cursor: pointer;
            margin-bottom: 8px;
          ">📊 Centrality View</button>
          <button onclick="window.graphVisualization?.updateVisualMode?.('community')" style="
            width: 100%;
            padding: 10px 16px;
            border: none;
            border-radius: 6px;
            background: linear-gradient(135deg, #0A6E8A 0%, #068293 100%);
            color: white;
            cursor: pointer;
            margin-bottom: 8px;
          ">🏘️ Communities</button>
          <button onclick="window.graphVisualization?.updateVisualMode?.('geographic')" style="
            width: 100%;
            padding: 10px 16px;
            border: none;
            border-radius: 6px;
            background: linear-gradient(135deg, #0A6E8A 0%, #068293 100%);
            color: white;
            cursor: pointer;
          ">🌍 Geographic</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', panelHtml);
    this.setupControlPanelEvents();
  }

  private setupControlPanelEvents() {
    // Update metrics periodically
    setInterval(() => {
      this.updateNetworkMetrics();
    }, 5000);

    // Setup filter controls
    const nodeTypeFilters = document.querySelectorAll('[data-type]');
    nodeTypeFilters.forEach(filter => {
      filter.addEventListener('change', () => this.updateFilters());
    });

    // Setup visual controls
    const nodeSizeMetric = document.getElementById('node-size-metric') as HTMLSelectElement;
    if (nodeSizeMetric) {
      nodeSizeMetric.addEventListener('change', () => {
        this.updateVisualMode('centrality');
      });
    }
  }

  private toggleControlPanel() {
    this.controlPanelOpen = !this.controlPanelOpen;
    const panel = document.getElementById('network-control-panel');
    if (panel) {
      if (this.controlPanelOpen) {
        panel.classList.add('open');
        panel.style.transform = 'translateX(0)';
        this.updateNetworkMetrics();
      } else {
        panel.classList.remove('open');
        panel.style.transform = 'translateX(100%)';
      }
    }
  }

  public updateNetworkMetrics() {
    const metrics = this.insightEngine.getNetworkMetrics();

    // Update main insights section metrics cards
    const metricsCardsContainer = document.getElementById('network-metrics-cards');
    if (metricsCardsContainer) {
      metricsCardsContainer.innerHTML = `
        <div class="metric-card" style="
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          border: 1px solid #e8f1f5;
        ">
          <div style="font-size: 32px; font-weight: 700; color: #0A6E8A; margin-bottom: 4px;">${metrics.totalNodes}</div>
          <div style="color: #556B7D; font-size: 14px; font-weight: 500;">Total Nodes</div>
        </div>
        <div class="metric-card" style="
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          border: 1px solid #e8f1f5;
        ">
          <div style="font-size: 32px; font-weight: 700; color: #0A6E8A; margin-bottom: 4px;">${metrics.totalEdges}</div>
          <div style="color: #556B7D; font-size: 14px; font-weight: 500;">Connections</div>
        </div>
        <div class="metric-card" style="
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          border: 1px solid #e8f1f5;
        ">
          <div style="font-size: 32px; font-weight: 700; color: #0A6E8A; margin-bottom: 4px;">${metrics.avgDegree}</div>
          <div style="color: #556B7D; font-size: 14px; font-weight: 500;">Avg. Connections</div>
        </div>
        <div class="metric-card" style="
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          border: 1px solid #e8f1f5;
        ">
          <div style="font-size: 32px; font-weight: 700; color: #0A6E8A; margin-bottom: 4px;">${metrics.density}%</div>
          <div style="color: #556B7D; font-size: 14px; font-weight: 500;">Network Density</div>
        </div>
      `;
    }

    // Update control panel metrics (smaller version)
    const totalNodesEl = document.getElementById('total-nodes');
    const totalEdgesEl = document.getElementById('total-edges');
    const avgDegreeEl = document.getElementById('avg-degree');
    const densityEl = document.getElementById('density');

    if (totalNodesEl) totalNodesEl.textContent = metrics.totalNodes.toString();
    if (totalEdgesEl) totalEdgesEl.textContent = metrics.totalEdges.toString();
    if (avgDegreeEl) avgDegreeEl.textContent = metrics.avgDegree.toString();
    if (densityEl) densityEl.textContent = `${metrics.density}%`;
  }

  public generateSmartInsights() {
    const insights = this.insightEngine.generateBasicInsights();

    // Update main insights section only
    const mainContainer = document.getElementById('insights-container-main');
    if (mainContainer) {
      mainContainer.innerHTML = insights.map(insight => `
        <div class="insight-card" onclick="window.graphVisualization?.highlightInsight?.('${insight.type}', ${JSON.stringify(insight.nodes).replace(/"/g, '&quot;')})" style="
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          border: 1px solid #e8f1f5;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        ">
          <div style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(135deg, #0A6E8A 0%, #068293 100%);
          "></div>
          <div style="
            font-size: 12px;
            font-weight: 700;
            color: #068293;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
          ">
            ${insight.type.replace('_', ' ')}
          </div>
          <div style="
            font-size: 18px;
            font-weight: 600;
            color: #2C3E50;
            line-height: 1.4;
            margin-bottom: 12px;
          ">
            ${insight.title}
          </div>
          <div style="
            font-size: 14px;
            color: #556B7D;
            line-height: 1.5;
          ">
            ${insight.description || 'Click to highlight these nodes in the network'}
          </div>
          <div style="
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #e8f1f5;
            display: flex;
            align-items: center;
            justify-content: between;
            font-size: 12px;
            color: #068293;
            font-weight: 600;
          ">
            <span>${insight.nodes.length} nodes affected</span>
            <span style="margin-left: auto;">Click to explore →</span>
          </div>
        </div>
      `).join('');
    }
  }

  public highlightInsight(type: string, nodeIds: string[]) {
    // Clear previous highlights
    this.clearSelection();

    // Highlight the insight nodes
    if (this.node) {
      (this.node as any).transition().duration(300)
        .style('opacity', (d: any) => nodeIds.includes(d.id) ? 1 : 0.3)
        .attr('stroke', (d: any) => nodeIds.includes(d.id) ? '#e74c3c' : '#bfc9d1')
        .attr('stroke-width', (d: any) => nodeIds.includes(d.id) ? 4 : 1);
    }

    // Zoom to fit the highlighted nodes if there are few enough
    if (nodeIds.length <= 10) {
      this.zoomToNodes(nodeIds);
    }
  }

  private zoomToNodes(nodeIds: string[]) {
    const nodes = this.graphDataProvider.getFilteredNodes().filter((n: any) => nodeIds.includes(n.id));
    if (nodes.length === 0) return;

    // Calculate bounding box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach((node: any) => {
      if (node.x < minX) minX = node.x;
      if (node.x > maxX) maxX = node.x;
      if (node.y < minY) minY = node.y;
      if (node.y > maxY) maxY = node.y;
    });

    // Add padding
    const padding = 100;
    minX -= padding;
    maxX += padding;
    minY -= padding;
    maxY += padding;

    // Calculate center and scale
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const width = maxX - minX;
    const height = maxY - minY;
    const scale = Math.min(this.width / width, this.height / height) * 0.8;

    // Apply zoom
    if (this.transformationHandler && this.svg) {
      this.svg.transition().duration(750).call(
        this.transformationHandler['d3Zoom'].transform,
        d3.zoomIdentity
          .translate(this.width / 2, this.height / 2)
          .scale(scale)
          .translate(-centerX, -centerY)
      );
    }
  }

  public updateVisualMode(mode: 'default' | 'centrality' | 'community' | 'geographic') {
    this.currentVisualMode = mode;
    this.updateNodeStyling();
  }

  private updateNodeStyling() {
    if (!this.node) return;

    switch (this.currentVisualMode) {
      case 'centrality':
        this.applyCentralityBasedStyling();
        break;
      case 'community':
        this.applyCommunityBasedStyling();
        break;
      case 'geographic':
        this.applyGeographicBasedStyling();
        break;
      default:
        this.applyDefaultStyling();
        break;
    }
  }

  private applyCentralityBasedStyling() {
    if (!this.node) return;

    // Calculate centrality for all nodes
    const centralityData = this.graphDataProvider.getFilteredNodes().map((node: any) => ({
      ...node,
      centrality: this.insightEngine.calculateNodeCentrality(node.id)
    }));

    // Create scale for centrality-based sizing
    const maxCentrality = Math.max(...centralityData.map(n => n.centrality.degree));
    const centralityScale = scaleLinear()
      .domain([0, maxCentrality])
      .range([8, this.maxNodeRadius * 1.5]);

    // Apply centrality-based styling
    (this.node as any).select('circle')
      .transition().duration(500)
      .attr('r', (d: any) => {
        const nodeData = centralityData.find(n => n.id === d.id);
        return nodeData ? centralityScale(nodeData.centrality.degree) : 14;
      })
      .attr('fill', (d: any) => {
        const nodeData = centralityData.find(n => n.id === d.id);
        if (!nodeData) return '#7dafff';

        const normalizedCentrality = nodeData.centrality.normalized;
        if (normalizedCentrality > 0.1) return '#e74c3c'; // High centrality - red
        if (normalizedCentrality > 0.05) return '#f39c12'; // Medium centrality - orange
        return '#3498db'; // Low centrality - blue
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);
  }

  private applyCommunityBasedStyling() {
    // This would implement community detection and color coding
    // For now, use a simplified version based on node types
    if (!this.node) return;

    const communityColors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e'];
    let colorIndex = 0;

    const nodeTypes = new Set(this.graphDataProvider.getFilteredNodes().map((n: any) => n.type));
    const typeColorMap = new Map();

    nodeTypes.forEach(type => {
      typeColorMap.set(type, communityColors[colorIndex % communityColors.length]);
      colorIndex++;
    });

    (this.node as any).select('circle')
      .transition().duration(500)
      .attr('fill', (d: any) => typeColorMap.get(d.type) || '#7dafff');
  }

  private applyGeographicBasedStyling() {
    if (!this.node) return;

    const locationColors = new Map();
    const locations = new Set(this.graphDataProvider.getFilteredNodes()
      .map((n: any) => n.profile?.location?.city || 'Unknown'));

    const geoColors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
    let colorIndex = 0;

    locations.forEach(location => {
      locationColors.set(location, geoColors[colorIndex % geoColors.length]);
      colorIndex++;
    });

    (this.node as any).select('circle')
      .transition().duration(500)
      .attr('fill', (d: any) => {
        const location = d.profile?.location?.city || 'Unknown';
        return locationColors.get(location) || '#7dafff';
      });
  }

  private applyDefaultStyling() {
    if (!this.node) return;

    (this.node as any).select('circle')
      .transition().duration(500)
      .attr('r', (d: any) => this.nodeScale(d.weight) || 14)
      .attr('fill', (d: any) => this.nodeColorScale(d.group || d.type) || '#7dafff')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);
  }

  private handleSearchResult(result: any) {
    if (result.type === 'node') {
      // Focus on the selected node
      this.selectedNodeId = result.item.id;
      this.showNodeInfoPanel(result.item);
      this.highlightNodeNeighbors(result.item);
      this.zoomToNode(result.item);
    } else if (result.type === 'insight') {
      // Highlight the insight
      this.highlightInsight(result.item.type, result.item.nodes);
    }
  }

  private updateFilters() {
    // This would update the graph filters based on control panel settings
    // For now, just refresh the display
    this.refreshDisplayedGraph();
    if (this.smartSearch) {
      this.smartSearch.refresh();
    }
  }

  private exportInsights() {
    const insights = this.insightEngine.generateBasicInsights();
    const metrics = this.insightEngine.getNetworkMetrics();

    const exportData = {
      timestamp: new Date().toISOString(),
      networkMetrics: metrics,
      insights: insights.map(insight => ({
        type: insight.type,
        title: insight.title,
        description: insight.description,
        affectedNodes: insight.nodes.length,
        nodes: insight.nodes
      }))
    };

    // Create and download JSON file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network-insights-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Override the original refreshDisplayedGraph to update insights
}
