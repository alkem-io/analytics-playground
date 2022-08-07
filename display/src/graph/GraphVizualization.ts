import * as d3 from 'd3';
import { GraphDataProvider } from './GraphDataProvider';
import { Hovercard } from './components/Hovercard';
import { Selection } from 'd3';
import { INode } from './model/node.interface';
import { addArrowHeadDef } from './util/VisualDefinitions';

export class GraphVizualization {
  dataLoader: GraphDataProvider;
  svg: Selection<any, any, any, any>;
  graphGroup: Selection<any, any, any, any>;
  node: any; // Selection<any, any, any, any>;
  nodeScale: any; // d3.ScaleLinear<any, any>;
  nodeColorScale: any;
  width: number;
  height: number;

  scale: any;
  translate: any;

  dragEnabled = false;
  defMarkerArrow = 'markerArrow';

  link: any;
  linkWidthScale: any;
  simulation: any;
  lineGenerator = d3.line().curve(d3.curveCardinal);
  hovercard: Hovercard;

  defaultScale = 1;
  defaultTranslation = [0, 0];

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

    this.scale = this.defaultScale;
    this.translate = this.defaultTranslation;

    this.svg.style('width', width + 'px').style('height', height + 'px');
    const graphDefs = this.svg.append('defs').attr('id', 'graph-defs');
    addArrowHeadDef(this.defMarkerArrow, graphDefs);

    this.graphGroup = this.svg.append('g').attr('id', 'graph');

    this.updateScales();
    this.displayGraph();
    this.registerZoom();

    this.hovercard = new Hovercard(svg, 0, 0);
    this.simulate();
    this.registerHovercard(this.node, this.simulation);
  }

  displayGraph() {
    this.displayNodes();
    this.displayLinks();
  }

  private displayNodes() {
    this.node = this.graphGroup
      .append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(this.dataLoader.getFilteredNodes(), (d: any) => d.id)
      .enter()
      .append('circle')
      .attr('r', (d: any) => this.nodeScale(d.weight))
      .attr('stroke', '#251607 ')
      .attr('stroke-width', function (d: any) {
        if (d.type === 'organization') return 2.0;
        return 0.5;
      })
      .style('fill', (d: any) => this.nodeColorScale(d.group));
  }

  private displayLinks() {
    this.link = this.graphGroup
      .append('g')
      .attr('class', 'links')
      .selectAll('path')
      .data(this.dataLoader.getFilteredEdges(), (d: any) => d.id)
      .enter()
      .append('path')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      //.attr("stroke-dasharray", (d) => linkDashScale(d.weight))
      .attr('stroke-width', (d: any) => this.linkWidthScale(d.weight))
      .attr('marker-mid', (d: any) => {
        /**
         * Define a marker to indicate what kind of line it is.
         * Currently defined: arrow for subordinate / supervisory relationship.
         */
        switch (d.type) {
          case 'lead':
            return `url(#${this.defMarkerArrow})`;

          default:
            return 'none';
        }
      })
      .attr('fill', 'none');
  }

  updateScales() {
    // Get max values
    const maxNodeWeight =
      d3.max(this.dataLoader.getFilteredNodes().map(node => node.weight)) || 10;
    const maxLinkWeight =
      d3.max(this.dataLoader.getFilteredEdges().map(link => link.weight)) || 10;

    // Create the scales
    this.nodeColorScale = d3.scaleOrdinal(d3.schemeCategory10);
    this.nodeScale = d3.scaleLinear().domain([0, maxNodeWeight]).range([8, 20]);
    this.linkWidthScale = d3
      .scaleLinear()
      .domain([0, maxLinkWeight])
      .range([0.5, 5]);
  }

  simulate() {
    /**
     * Gravity determines how strongly the nodes push / pull eachother.
     * In effect, the lower the number goes, the more spread out the graph will be.
     */
    const gravity = -100;

    const forceManyBody = d3.forceManyBody().strength(gravity);

    const forceLink = d3
      .forceLink(this.dataLoader.getFilteredEdges())
      .id((d: any) => d.id)
      .distance(150)
      .strength(0.7);

    const forceCollision = d3
      .forceCollide()
      .radius(function (d: any) {
        return d.radius;
      })
      .strength(-10);

    const filteredNodes: any = this.dataLoader.getFilteredNodes();
    this.simulation = d3
      .forceSimulation(filteredNodes)
      .force('link', forceLink)
      .force('charge', forceManyBody)
      .force('collision', forceCollision)
      .force('center', d3.forceCenter(this.width / 2, this.height / 2));

    this.simulation.on('tick', () => {
      this.animateNode();
      this.animateLinks();
    });
  }

  transformCoordinates(x: number, y: number) {
    return [
      this.scale * x + this.translate[0],
      this.scale * y + this.translate[1],
    ];
  }

  handleZoom = (e: any) => {
    this.graphGroup.attr('transform', e.transform);
  };

  registerZoom() {
    let zoom = d3.zoom().on('zoom', this.handleZoom);

    this.graphGroup.call(zoom);
  }

  updateGraph() {
    this.graphGroup.remove();
    this.simulation.stop();

    this.graphGroup = this.svg.append('g').attr('id', 'graph');
    // Scales may change
    this.updateScales();
    this.displayGraph();
    this.registerZoom();

    this.simulate();
    this.registerHovercard(this.node, this.simulation);
  }

  drag() {
    const dragstarted = (d: any) => {
      if (!d.active) {
        this.simulation.alphaTarget(0.3).restart();
      }

      d.subject.fx = d.x;
      d.subject.fy = d.y;
    };

    const dragged = (d: any) => {
      d.subject.fx = d.x;
      d.subject.fy = d.y;
    };

    const dragended = (d: any) => {
      if (!d.active) {
        this.simulation.alphaTarget(0);
      }

      d.subject.fx = null;
      d.subject.fy = null;
    };

    return d3
      .drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }

  animateNode() {
    this.node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);
    if (this.dragEnabled) this.node.call(this.drag());
  }

  animateLinks() {
    this.link.attr('d', (d: any) => {
      const mid: [number, number] = [
        (d.source.x + d.target.x) / 2,
        (d.source.y + d.target.y) / 2,
      ];

      /**
       * If two lines overlap with each other, curve one of the lines.
       */

      if (d.overlap > 0) {
        const index = d.overlap;

        // console.log("Index?", index);
        // const index = d.overlap.filter((ol) => ol.weight > d.weight).length;

        const distance = Math.sqrt(
          Math.pow(d.target.x - d.source.x, 2) +
            Math.pow(d.target.y - d.source.y, 2)
        );

        /**
         * The math below finds a point just off the center of the line.
         */

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

  registerHovercard(node: any, simulation: any) {
    node.on('mouseover', (event: any, d: any) => {
      console.log(`Node mouse over`);

      const radius = event.target.r.baseVal.value;
      const offset = radius + 3;
      this.hovercard.moveTo(d.x + offset, d.y - offset, d);

      simulation.alphaTarget(0).restart();
    });

    node.on('mouseout', () => {
      /**
       * When the mouse is moved off a node, hide the card.
       */
      this.hovercard.remove();
    });
  }
}
