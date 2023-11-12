import * as d3 from 'd3';
import { GraphDataProvider } from './GraphDataProvider';
import { Selection, Simulation } from 'd3';
import { addArrowHeadDef } from './util/VisualDefinitions';
import { NodeDragHandler } from './handlers/NodeDragHandler';
import { TransformationHandler } from './handlers/TransformationHandler';
import { MapDataProvider } from './MapDataProvider';
import { MapLocationHandler } from './handlers/MapLocationHandler';
import { HovercardHtml } from './components/HovercardHtml';

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
  simulation: Simulation<any, any>;
  lineGenerator = d3.line().curve(d3.curveCardinal);
  hovercard: HovercardHtml;
  transformationHandler: TransformationHandler;
  mapLocationHandler: MapLocationHandler;

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

    this.simulation = d3.forceSimulation();

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



    this.refreshDisplayedGraph();
  }

  refreshDisplayedGraph() {
    this.simulation.stop();
    if (this.linksGroup) this.linksGroup.remove();
    if (this.nodesGroup) this.nodesGroup.remove();
    if (this.mapGroup) this.mapGroup.remove();

    this.transformationHandler.projectionExtent(
      this.mapDataProvider.getSelectedMap()
    );

    // Scales may change
    this.updateScales();

    this.displayMap();
    this.displayLinks();
    this.displayNodes();
    this.transformationHandler.registerPanningDragListener(this.svg);

    this.simulate();
    this.hovercard.registerHovercard(
      this.node,
      this.simulation,
      this.transformationHandler
    );

    const nodeDragHandler = new NodeDragHandler(this.simulation);
    nodeDragHandler.register(this.node);
    this.mapLocationHandler = new MapLocationHandler(
      this.simulation,
      this.transformationHandler
    );

    if (this.mapDataProvider.isMapDisplayEnabled()) this.showMap();
  }

  private displayNodes() {
    this.nodesGroup = this.graphGroup.append('g').attr('class', 'nodes');
    this.node = this.nodesGroup
      .selectAll('circle')
      .data(this.graphDataProvider.getFilteredNodes(), (d: any) => d.id)
      .enter()
      .append('circle')
      .attr('id', (d: any) => d.id)
      .attr('r', (d: any) => this.nodeScale(d.weight))
      .attr('stroke', '#251607 ')
      .attr('stroke-width', (d: any) => {
        if (d.type === 'organization') return 3.0;
        if (d.type === 'space') return 3.0;
        return 0.5;
      })
      .style('fill', (d: any) => this.nodeColorScale(d.group))
      .classed('node', true)
      .classed('fixed', (d: any) => d.fx !== undefined);
  }

  private displayLinks() {
    this.linksGroup = this.graphGroup.append('g').attr('class', 'links');
    this.link = this.linksGroup
      .selectAll('path')
      .data(this.graphDataProvider.getFilteredEdges(), (d: any) => d.id)
      .enter()
      .append('path')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      //.attr("stroke-dasharray", (d) => linkDashScale(d.weight))
      .attr('stroke-width', (d: any) => this.linkWidthScale(d.weight))
      .attr('marker-mid', (d: any) => {
        // Define a marker to indicate what kind of line it is.
        // Currently defined: arrow for subordinate / supervisory relationship.
        switch (d.type) {
          case 'lead':
            return `url(#${this.defMarkerArrowName})`;

          default:
            return 'none';
        }
      })
      .attr('fill', 'none');
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
    this.transformationHandler.transformDisplay(750);
  }

  zoomMin() {
    this.transformationHandler.zoomMin();
    this.transformationHandler.transformDisplay(750);
  }

  fixLocationToMap(nodeType: string) {
    this.mapLocationHandler.fixNodeLocationToMap(this.node, nodeType);
    this.transformationHandler.transformDisplay(750);
  }

  private updateScales() {
    // Get max values
    const maxNodeWeight =
      d3.max(
        this.graphDataProvider.getFilteredNodes().map(node => node.weight)
      ) || 10;
    const maxLinkWeight =
      d3.max(
        this.graphDataProvider.getFilteredEdges().map(link => link.weight)
      ) || 10;

    // Create the scales
    this.nodeColorScale = d3.scaleOrdinal(d3.schemeCategory10);
    this.nodeScale = d3
      .scaleLinear()
      .domain([0, maxNodeWeight])
      .range([8, this.maxNodeRadius]);
    this.linkWidthScale = d3
      .scaleLinear()
      .domain([0, maxLinkWeight])
      .range([0.5, 5]);
  }

  simulate() {
    // Gravity determines how strongly the nodes push / pull each other.
    // In effect, the lower the number goes, the more spread out the graph will be.
    const gravity = -40;

    const forceManyBody = d3.forceManyBody().strength(gravity);

    const forceLink = d3
      .forceLink(this.graphDataProvider.getFilteredEdges())
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

    const forceLinkSpaces = d3
      .forceLink(spaceEdges)
      .id((d: any) => d.id)
      .distance(1500)
      .strength(1);

    const forceCollision = d3
      .forceCollide()
      .radius((d: any) => {
        if (d.type === 'space') {
          return d.r * 5;
        }
        return d.r;
      })
      .strength(100)
      .iterations(1);

    const filteredNodes: any = this.graphDataProvider.getFilteredNodes();
    this.simulation = d3
      .forceSimulation(filteredNodes)
      .force('link', forceLink)
      .force('linkSpaces', forceLinkSpaces)
      .force('charge', forceManyBody)
      .force('collision', forceCollision)
      .force('center', d3.forceCenter(this.width / 2, this.height / 2));

    this.simulation.on('tick', () => {
      this.animateNode();
      this.animateLinks();
    });
    //this.simulation.tick(10);
  }

  private animateNode() {
    this.node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);
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

  // private calculateFixedSpaceLocations() {
  //   const spaceNodes = this.dataLoader.getSpaceNodes();
  //   const yOffset = 100;
  //   const xOffset = 100;
  //   let yValue = 0;
  //   let xValue = xOffset;
  //   const yIncrement = (this.height - yOffset * 2) / spaceNodes.length;
  //   const xIncrement = (this.width - xOffset * 2) / 3;
  //   for (const space of spaceNodes) {
  //     yValue = yValue + yIncrement;
  //     this.spaceLocations.set(space.id, [xValue, yValue]);
  //     xValue = xValue + xIncrement;
  //     if (xValue > this.width) xValue = xOffset;
  //   }
  // }

  // private getSpaceXValue(d: any) {
  //   const location = this.spaceLocations.get(d.id);
  //   const xAnchor = location ? location[0] : this.width / 2;
  //   return xAnchor;
  // }

  // private getSpaceYValue(d: any) {
  //   const location = this.spaceLocations.get(d.id);
  //   const yAnchor = location ? location[1] : this.width / 2;
  //   return yAnchor;
  // }
}
