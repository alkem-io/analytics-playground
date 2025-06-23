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
import { zoomIdentity } from 'd3';

// @ts-ignore: DOM access for UI panel
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

  node: any; // Selection<any, any, any, any>;
  nodeScale: any; // d3.ScaleLinear<any, any>;
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

    this.graphDataProvider = graphDataProvider;
    this.mapDataProvider = mapDataProvider;

    this.width = width;
    this.height = height;

    this.simulation = forceSimulation()
      .force('link', forceLink().id((d: any) => d.id).distance(80))
      .force('charge', forceManyBody().strength(-200))
      .force('center', forceCenter(this.width / 2, this.height / 2))
      .force('collide', forceCollide().radius((d: any) => this.nodeScale ? this.nodeScale(d.weight) + 8 : 16));

    this.svg.style('width', width + 'px').style('height', height + 'px').style('background', '#f7f9fa'); // Soft background
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

    // Make SVG fill the viewport
    this.svg
      .attr('width', '100%')
      .attr('height', '100%')
      .style('width', '100vw')
      .style('height', '100vh')
      .style('background', '#f7fafd');

    // Enable D3 zoom & pan
    const zoomed = (event: any) => {
      this.graphGroup.attr('transform', event.transform);
    };
    this.svg.call(d3.zoom()
      .scaleExtent([0.1, 8])
      .on('zoom', zoomed));

    // Modern pastel color scale for node types
    // Get all unique groups/types in the data for color mapping
    const allNodesForColor = graphDataProvider.getFilteredNodes();
    const uniqueGroups = Array.from(new Set(allNodesForColor.map((d: any) => d.group || d.type)));
    const pastelPalette = [
      '#7dafff', // blue
      '#ff7d7d', // red
      '#7dffb0', // green
      '#c7a6ff', // purple
      '#ffd47d', // yellow
      '#ffb3e6', // pink
      '#b3fff6', // cyan
      '#e6b3ff', // lavender
      '#b3ffb3', // mint
      '#ffe6b3'  // peach
    ];
    this.nodeColorScale = d3.scaleOrdinal()
      .domain(uniqueGroups)
      .range(pastelPalette);
    console.log('Node color scale set for groups:', uniqueGroups, pastelPalette);

    // Add SVG drop shadow filter for nodes
    const defs = this.svg.select('defs');
    const filter = defs.append('filter')
      .attr('id', 'node-shadow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');
    filter.append('feDropShadow')
      .attr('dx', 0)
      .attr('dy', 2)
      .attr('stdDeviation', 3)
      .attr('flood-color', '#000')
      .attr('flood-opacity', 0.18);

    this.refreshDisplayedGraph();
    // Add event listener for clear selection button
    setTimeout(() => {
      const clearBtn = document.getElementById('graph-clear-selection');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => this.clearSelection());
      }
    }, 0);

    // Set a soft background color
    this.svg.style('background', '#f7fafd');
  }

  refreshDisplayedGraph() {
    this.simulation.stop();
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
          // Debug log
          console.log('Node for info panel:', node);
          self.showNodeInfoPanel(node);
          // Highlight 1-jump and 2-jump neighborhood
          self.highlightNodeNeighborhood(d.id);
        });
      });
    }, 0);
  }

  clearSelection() {
    // Reset highlighting/dimming
    if (this.node) {
      (this.node as any).transition().duration(200)
        .style('opacity', 1)
        .attr('stroke', (d: any) => d.type === 'organization' || d.type === 'space' ? '#0A6E8A' : '#251607 ')
        .attr('stroke-width', (d: any) => d.type === 'organization' || d.type === 'space' ? 3.0 : 0.5);
    }
    if (this.link) {
      (this.link as any).transition().duration(200)
        .style('opacity', 1);
    }
    // Hide info panels
    const nodePanel = document.getElementById('node-info-panel');
    if (nodePanel) nodePanel.style.display = 'none';
    const clusterPanel = document.getElementById('cluster-panel');
    if (clusterPanel) clusterPanel.style.display = 'none';
    this.selectedNodeId = null;
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
      console.log('Rendering node', d.id, 'type:', d.type, 'group:', d.group, 'colorType:', colorType, 'color:', color);
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

    // In displayNodes, after getNodeColorType and before rendering:
    const allColorTypes = new Set();
    allNodes.forEach((d: any) => {
      const colorType = getNodeColorType(d);
      allColorTypes.add(colorType);
    });
    console.log('All normalized color types in data:', Array.from(allColorTypes));
  }

  private displayLinks() {
    console.log('Rendering links:', this.graphDataProvider.getFilteredEdges());
    this.linksGroup = this.graphGroup.append('g').attr('class', 'links');
    const allLinks = this.graphDataProvider.getFilteredEdges();
    this.link = this.linksGroup
      .selectAll('line')
      .data(allLinks, (d: any) => d.id || d.sourceID + '-' + d.targetID)
      .join('line')
      .attr('stroke', '#bfc9d1') // modern, visible gray
      .attr('stroke-width', 2)
      .attr('opacity', 0.85)
      .attr('pointer-events', 'none'); // so nodes are always clickable

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
    const mapFeatures = this.mapDataProvider.getSelectedMap().features;
    this.map = this.mapGroup
      .selectAll('path')
      .data(mapFeatures, (d: any) => d.properties.name_en)
      .join('path')
      .attr('id', (d: any) => d.properties.name_en)
      .attr('d', this.transformationHandler.geoGenerator)
      .attr('fill', 'lightgray')
      .attr('stroke', 'white');
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
    this.mapLocationHandler.fixNodeLocationToMap(this.node, nodeType);
    this.mapLocationHandler.registerNodeExpansion(this.node);
    this.transformationHandler.transformDisplay(750);
  }

  unfixLocationFromMap(nodeType: string) {
    this.mapLocationHandler.unfixNodeLocationFromMap(this.node, nodeType);
    this.transformationHandler.transformDisplay(750);
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
    const gravity = -40;

    const forceManyBodyInstance = forceManyBody().strength(gravity);

    const forceLinkInstance = forceLink(this.graphDataProvider.getFilteredEdges())
      .id((d: any) => d.id)
      .distance(150)
      .strength((edge: any) => {
        // Want space-challenge-opp links to dominate
        if (edge.type === 'child') {
          return 0.7;
        }
        return 0.2;
      });

    const spaceEdges = this.graphDataProvider.getSpaceEdges();

    const forceLinkSpacesInstance = forceLink(spaceEdges)
      .id((d: any) => d.id)
      .distance(1500)
      .strength(1);

    const forceCollisionInstance = forceCollide()
      .radius((d: any) => {
        if (d.type === 'space') {
          return d.r * 5;
        }
        return d.r;
      })
      .strength(100)
      .iterations(1);

    const filteredNodes: any = this.graphDataProvider.getFilteredNodes();
    // Defensive: filter out links whose source/target is not in filteredNodes
    const nodeIds = new Set(filteredNodes.map((n: any) => n.id));
    const safeEdges = this.graphDataProvider.getFilteredEdges().filter((e: any) => nodeIds.has(e.sourceID) && nodeIds.has(e.targetID));
    const safeSpaceEdges = this.graphDataProvider.getSpaceEdges().filter((e: any) => nodeIds.has(e.sourceID) && nodeIds.has(e.targetID));
    this.simulation = forceSimulation(filteredNodes)
      .force('link', forceLink(safeEdges)
        .id((d: any) => d.id)
        .distance(150)
        .strength((edge: any) => {
          if (edge.type === 'child') {
            return 0.7;
          }
          return 0.2;
        }))
      .force('linkSpaces', forceLink(safeSpaceEdges)
        .id((d: any) => d.id)
        .distance(1500)
        .strength(1))
      .force('charge', forceManyBody().strength(gravity))
      .force('collision', forceCollide()
        .radius((d: any) => {
          if (d.type === 'space') {
            return d.r * 5;
          }
          return d.r;
        })
        .strength(100)
        .iterations(1))
      .force('center', forceCenter(this.width / 2, this.height / 2));

    this.simulation.on('tick', () => {
      this.animateNode();
      this.animateLinks();
    });
    //this.simulation.tick(10);
  }

  private animateNode() {
    // Group nodes by proximity (10px radius)
    const nodes = this.graphDataProvider.getFilteredNodes();
    const clusters: { x: number, y: number, count: number, members: any[] }[] = [];
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

    // Hide individual nodes in clusters, except if fanned out
    this.node.attr('cx', (d: any) => (d as any).x)
      .attr('cy', (d: any) => (d as any).y)
      .style('display', (d: any) => {
        // If a cluster is fanned out, show its member nodes
        if (this.fannedNodes && this.fannedNodes.length > 0) {
          if (this.fannedNodes.find((n: any) => n.id === d.id)) return '';
        }
        // Otherwise, hide nodes that are in a cluster
        for (const c of clusters) {
          if (c.members.find((n: any) => n.id === d.id)) return 'none';
        }
        return '';
      });

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

  private animateLinks() {
    this.link.attr('d', (d: any) => {
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
    // Restart simulation to animate nodes to new positions
    if (self.simulation) {
      self.simulation.alpha(1).restart();
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

  // --- Show cluster members in side panel ---
  public showClusterPanel(cluster: any) {
    const panel = document.getElementById('cluster-panel');
    const content = document.getElementById('cluster-panel-content');
    if (!panel || !content) return;
    // Clear previous content
    content.innerHTML = '';
    // Add each member
    cluster.members.forEach((member: any) => {
      const displayName = member.profile?.displayName || member.label || member.name || member.id;
      const div = document.createElement('div');
      div.className = 'cluster-member';
      div.onclick = () => {
        // Deselect if already selected
        if (this.selectedNodeId === member.id) {
          this.clearSelection();
          return;
        }
        this.selectedNodeId = member.id;
        // Always close node info panel when selecting a cluster member
        const nodePanel = document.getElementById('node-info-panel');
        if (nodePanel) nodePanel.style.display = 'none';
        this.focusNodeAndDimOthers(member.id);
        // Also open left-side node info panel
        let node = this.graphDataProvider.getFilteredNodes().find((n: any) => n.id === member.id);
        if (!node) node = this.graphDataProvider.spaceNodes.find((n: any) => n.id === member.id) || this.graphDataProvider.contributorNodes.find((n: any) => n.id === member.id);
        if (node) this.showNodeInfoPanel(node);
      };
      div.innerHTML = `
        <div class="cluster-member-info">
          <span class="cluster-member-name">${displayName}</span>
          <span class="cluster-member-role">${member.role || member.type || ''}</span>
        </div>
      `;
      content.appendChild(div);
    });
    // Show panel
    panel.style.display = 'flex';
    // Close button
    const closeBtn = document.getElementById('cluster-panel-close');
    if (closeBtn) closeBtn.onclick = () => (panel.style.display = 'none');
    // Set the side panel header to the city/town name if available
    const titleElem = document.getElementById('cluster-panel-title');
    if (titleElem) {
      const memberWithCity = cluster.members.find((m: any) => m.profile?.location?.city);
      titleElem.textContent = memberWithCity ? memberWithCity.profile.location.city : 'Cluster Members';
    }
  }

  // --- Show node info in left side panel ---
  public showNodeInfoPanel(node: any) {
    const panel = document.getElementById('node-info-panel');
    const content = document.getElementById('node-info-panel-content');
    const titleElem = document.getElementById('node-info-panel-title');
    if (!panel || !content || !titleElem) {
      console.error('Panel or content or titleElem not found in DOM');
      return;
    }
    // Set title
    titleElem.textContent = node.profile?.displayName || node.label || node.name || node.id;
    // Build info HTML with avatar
    const avatarUrl = node.avatar || '';
    const avatarImg = avatarUrl ? `<img src="${avatarUrl}" alt="avatar" style="width:64px;height:64px;border-radius:50%;margin-bottom:10px;box-shadow:0 2px 8px #bbb;" />` : '';
    content.innerHTML = `
      <div class="node-info-panel-body">
        <div style="text-align:center;">${avatarImg}</div>
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
    panel.style.display = 'flex';
    // Close button
    const closeBtn = document.getElementById('node-info-panel-close');
    if (closeBtn) closeBtn.onclick = () => (panel.style.display = 'none');
  }

  // --- Highlight node in graph ---
  public highlightNode(nodeId: string) {
    if (!this.node) return;
    this.node.attr('stroke', (d: any) => d.id === nodeId ? '#f39c12' : '#251607 ')
      .attr('stroke-width', (d: any) => d.id === nodeId ? 5 : (d.type === 'organization' || d.type === 'space' ? 3.0 : 0.5));
    // Optionally, scroll to node in SVG or zoom in
  }

  // --- Focus on a node and dim others ---
  public focusNodeAndDimOthers(nodeId: string) {
    if (!this.node) return;
    (this.node as any).transition().duration(200)
      .style('opacity', (d: any) => d.id === nodeId ? 1 : 0.15)
      .attr('stroke', (d: any) => d.id === nodeId ? '#f39c12' : '#251607 ')
      .attr('stroke-width', (d: any) => d.id === nodeId ? 5 : (d.type === 'organization' || d.type === 'space' ? 3.0 : 0.5));
    if (this.link) {
      (this.link as any).transition().duration(200)
        .style('opacity', (d: any) => (d.source.id === nodeId || d.target.id === nodeId) ? 1 : 0.1);
    }
    // Optionally zoom/pan to node
    const nodeDatum = this.graphDataProvider.getFilteredNodes().find((d: any) => d.id === nodeId);
    if (nodeDatum && (nodeDatum as any).x !== undefined && (nodeDatum as any).y !== undefined && this.transformationHandler && this.svg) {
      (this.svg as any).transition().duration(600).call(
        (this.transformationHandler as any)['d3Zoom'].transform,
        (d3 as any).zoomIdentity
          .translate(this.width / 2, this.height / 2)
          .scale(2.5)
          .translate(-(nodeDatum as any).x, -(nodeDatum as any).y)
      );
    }
  }

  // Highlight selected node, 1-jump, and 2-jump neighbors/edges
  public highlightNodeNeighborhood(nodeId: string) {
    if (!this.node || !this.link) return;
    const nodes = this.graphDataProvider.getFilteredNodes();
    const edges = this.graphDataProvider.getFilteredEdges();
    // 1-jump neighbors
    const oneJump = new Set<string>();
    // 2-jump neighbors
    const twoJump = new Set<string>();
    // 1-jump edges
    const oneJumpEdges = new Set<string>();
    // 2-jump edges
    const twoJumpEdges = new Set<string>();
    // Build 1-jump
    edges.forEach((e: any) => {
      if (e.source.id === nodeId) {
        oneJump.add(e.target.id);
        oneJumpEdges.add(e.id || e.source.id + '-' + e.target.id);
      } else if (e.target.id === nodeId) {
        oneJump.add(e.source.id);
        oneJumpEdges.add(e.id || e.source.id + '-' + e.target.id);
      }
    });
    // Build 2-jump
    edges.forEach((e: any) => {
      // If edge connects to a 1-jump node but not the selected node
      if (oneJump.has(e.source.id) && e.target.id !== nodeId && !oneJump.has(e.target.id)) {
        twoJump.add(e.target.id);
        twoJumpEdges.add(e.id || e.source.id + '-' + e.target.id);
      } else if (oneJump.has(e.target.id) && e.source.id !== nodeId && !oneJump.has(e.source.id)) {
        twoJump.add(e.source.id);
        twoJumpEdges.add(e.id || e.source.id + '-' + e.target.id);
      }
    });
    // Style nodes
    (this.node as any).transition().duration(200)
      .style('opacity', (d: any) => {
        if (d.id === nodeId) return 1;
        if (oneJump.has(d.id)) return 0.95;
        if (twoJump.has(d.id)) return 0.7;
        return 0.15;
      })
      .attr('stroke', (d: any) => {
        if (d.id === nodeId) return '#f39c12';
        if (oneJump.has(d.id)) return '#007bff';
        if (twoJump.has(d.id)) return '#7dafff';
        return '#bbb';
      })
      .attr('stroke-width', (d: any) => {
        if (d.id === nodeId) return 5;
        if (oneJump.has(d.id)) return 3.5;
        if (twoJump.has(d.id)) return 2.2;
        return 0.5;
      });
    // Style edges
    (this.link as any).transition().duration(200)
      .style('opacity', (d: any) => {
        const edgeId = d.id || d.source.id + '-' + d.target.id;
        if (oneJumpEdges.has(edgeId)) return 0.95;
        if (twoJumpEdges.has(edgeId)) return 0.7;
        return 0.1;
      })
      .attr('stroke', (d: any) => {
        const edgeId = d.id || d.source.id + '-' + d.target.id;
        if (oneJumpEdges.has(edgeId)) return '#007bff';
        if (twoJumpEdges.has(edgeId)) return '#7dafff';
        return '#bfc9d1';
      })
      .attr('stroke-width', (d: any) => {
        const edgeId = d.id || d.source.id + '-' + d.target.id;
        if (oneJumpEdges.has(edgeId)) return 3.5;
        if (twoJumpEdges.has(edgeId)) return 2.2;
        return 1;
      });
  }
}
