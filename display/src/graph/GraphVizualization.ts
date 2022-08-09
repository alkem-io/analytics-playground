import * as d3 from 'd3';
import { GraphDataProvider } from './GraphDataProvider';
import { Hovercard } from './components/Hovercard';
import { Selection, Simulation } from 'd3';
import { addArrowHeadDef } from './util/VisualDefinitions';
import { NodeDragHandler } from './handlers/NodeDragHandler';
import { TransformationHandler } from './handlers/TransformationHandler';

export class GraphVizualization {

  defMarkerArrow = 'markerArrow';
  maxNodeRadius = 20;

  dataLoader: GraphDataProvider;
  svg: Selection<any, any, any, any>;
  graphGroup: Selection<any, any, any, any>;
  node: any; // Selection<any, any, any, any>;
  nodesGroup: any;
  nodeScale: any; // d3.ScaleLinear<any, any>;
  nodeColorScale: any;
  width: number;
  height: number;

  dragEnabled = true;

  link: any;
  linksGroup: any;
  linkWidthScale: any;
  simulation: Simulation<any, any>;
  lineGenerator = d3.line().curve(d3.curveCardinal);
  hovercard: Hovercard;
  transformationHandler: TransformationHandler;

  constructor(
    svg: any,
    dataLoader: GraphDataProvider,
    width: number,
    height: number
  ) {
    this.dataLoader = dataLoader;
    this.svg = svg;

    this.width = width;
    this.height = height;

    this.simulation = d3.forceSimulation();

    this.svg.style('width', width + 'px').style('height', height + 'px');
    const graphDefs = this.svg.append('defs').attr('id', 'graph-defs');
    addArrowHeadDef(this.defMarkerArrow, graphDefs);

    this.graphGroup = this.svg.append('g').attr('id', 'graph');
    this.transformationHandler = new TransformationHandler(this.width, this.height, this.graphGroup);

    this.hovercard = new Hovercard(svg, 0, 0);

    this.refreshDisplayedGraph();
  }

  refreshDisplayedGraph() {
    this.simulation.stop();
    if (this.linksGroup) this.linksGroup.remove();
    if (this.nodesGroup) this.nodesGroup.remove();

    // Scales may change
    this.updateScales();

    this.displayLinks();
    this.displayNodes();
    this.transformationHandler.registerPanningDragListener(this.svg);

    this.simulate();
    this.hovercard.registerHovercard(this.node, this.simulation, this.transformationHandler);

    const nodeDragHandler = new NodeDragHandler(this.simulation);
    nodeDragHandler.register(this.node);
  }

  private displayNodes() {
    this.nodesGroup = this.graphGroup.append('g').attr('class', 'nodes');
    this.node = this.nodesGroup
      .selectAll('circle')
      .data(this.dataLoader.getFilteredNodes(), (d: any) => d.id)
      .enter()
      .append('circle')
      .attr('r', (d: any) => this.nodeScale(d.weight))
      .attr('stroke', '#251607 ')
      .attr('stroke-width', (d: any) => {
        if (d.type === 'organization') return 3.0;
        if (d.type === 'hub') return 3.0;
        return 0.5;
      })
      .style('fill', (d: any) => this.nodeColorScale(d.group))
      .classed("node", true)
      .classed("fixed", (d: any) => d.fx !== undefined);
  }

  private displayLinks() {
    this.linksGroup = this.graphGroup.append('g').attr('class', 'links');
    this.link = this.linksGroup
      .selectAll('path')
      .data(this.dataLoader.getFilteredEdges(), (d: any) => d.id)
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
            return `url(#${this.defMarkerArrow})`;

          default:
            return 'none';
        }
      })
      .attr('fill', 'none');
  }

  scaleToFit() {
    this.transformationHandler.scaleToFit(this.maxNodeRadius, this.node.data());
    this.transformationHandler.transformDisplay(750);
  }

  private updateScales() {
    // Get max values
    const maxNodeWeight =
      d3.max(this.dataLoader.getFilteredNodes().map(node => node.weight)) || 10;
    const maxLinkWeight =
      d3.max(this.dataLoader.getFilteredEdges().map(link => link.weight)) || 10;

    // Create the scales
    this.nodeColorScale = d3.scaleOrdinal(d3.schemeCategory10);
    this.nodeScale = d3.scaleLinear().domain([0, maxNodeWeight]).range([8, this.maxNodeRadius]);
    this.linkWidthScale = d3
      .scaleLinear()
      .domain([0, maxLinkWeight])
      .range([0.5, 5]);
  }

  simulate() {
    // Gravity determines how strongly the nodes push / pull eachother.
    // In effect, the lower the number goes, the more spread out the graph will be.
    const gravity = -100;

    const forceManyBody = d3.forceManyBody().strength(gravity);

    const forceLink = d3
      .forceLink(this.dataLoader.getFilteredEdges())
      .id((d: any) => d.id)
      .distance(150)
      .strength(0.7);

    const hubEdges = this.dataLoader.getHubEdges();

    const forceLinkHubs = d3
      .forceLink(hubEdges)
      .id((d: any) => d.id)
      .distance(500)
      .strength(0.7);

    const forceCollision = d3
      .forceCollide()
      .radius((d: any) => {
        if (d.type === 'hub') {
          return d.radius * 5;
        }
        return d.radius;
      })
      .strength(10);

    const filteredNodes: any = this.dataLoader.getFilteredNodes();
    this.simulation = d3
      .forceSimulation(filteredNodes)
      .force('link', forceLink)
      .force('linkHubs', forceLinkHubs)
      .force('charge', forceManyBody)
      .force('collision', forceCollision)
      .force('center', d3.forceCenter(this.width / 2, this.height / 2));

    this.simulation.on('tick', () => {
      this.animateNode();
      this.animateLinks();
    });
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

  // private calculateFixedHubLocations() {
  //   const hubNodes = this.dataLoader.getHubNodes();
  //   const yOffset = 100;
  //   const xOffset = 100;
  //   let yValue = 0;
  //   let xValue = xOffset;
  //   const yIncrement = (this.height - yOffset * 2) / hubNodes.length;
  //   const xIncrement = (this.width - xOffset * 2) / 3;
  //   for (const hub of hubNodes) {
  //     yValue = yValue + yIncrement;
  //     this.hubLocations.set(hub.id, [xValue, yValue]);
  //     xValue = xValue + xIncrement;
  //     if (xValue > this.width) xValue = xOffset;
  //   }
  // }

  // private getHubXValue(d: any) {
  //   const location = this.hubLocations.get(d.id);
  //   const xAnchor = location ? location[0] : this.width / 2;
  //   return xAnchor;
  // }

  // private getHubYValue(d: any) {
  //   const location = this.hubLocations.get(d.id);
  //   const yAnchor = location ? location[1] : this.width / 2;
  //   return yAnchor;
  // }
}
