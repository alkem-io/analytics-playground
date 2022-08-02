import * as d3 from 'd3';
import { DataLoader } from './DataLoader';
import { Hovercard } from './components/Hovercard';

export class ForceGraph {
  dataLoader: DataLoader;
  svg: any;
  node: any;
  nodeScale: any;
  nodeColorScale: any;
  width: number;
  height: number;

  link: any;
  linkScale: any;
  linkWidthScale: any;
  simulation: any;
  lineGenerator = d3.line().curve(d3.curveCardinal);
  hovercard: any;

  constructor(svg: any, dataLoader: DataLoader, width: number, height: number) {
    this.dataLoader = dataLoader;
    this.svg = svg;
    this.hovercard = new Hovercard(svg);
    this.width = width;
    this.height = height;
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
      this.hovercard.animateHovercard();
    });
  }

  addHubSelector(hubSelector: any) {
    // Add in a Hub selection for each Hub in the data set
    hubSelector
      .selectAll('option.hub')
      .data(this.dataLoader.getHubNodes())
      .join('option')
      .attr('id', (d: any) => d.id)
      .attr('class', 'hub')
      .attr('value', (d: any) => d.id)
      .text((d: any) => d.displayName);
  }
  handleZoom = (e: any) => {
    this.svg.selectAll('.nodes').attr('transform', e.transform);
    this.svg.selectAll('.links').attr('transform', e.transform);
    this.svg.selectAll('.hovercard').attr('transform', e.transform);
  };

  registerZoom() {
    let zoom = d3.zoom().on('zoom', this.handleZoom);

    this.svg.call(zoom);
  }

  setNodeScales() {
    this.nodeColorScale = d3.scaleOrdinal(d3.schemeCategory10);

    const max =
      d3.max(this.dataLoader.getFilteredNodes().map(node => node.weight)) || 10;
    this.nodeScale = d3.scaleLinear().domain([0, max]).range([8, 20]);
  }

  displayNodes() {
    this.node = this.svg
      .append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(this.dataLoader.getFilteredNodes())
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

  animateNode() {
    this.node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);
    this.node.call(this.drag());
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

  /**
   * Define a width scale for the lines. Higher weight means thicker links.
   */
  setLinkScales() {
    this.linkWidthScale = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(this.dataLoader.getFilteredEdges().map(link => link.weight)) ||
          10,
      ])
      .range([0.5, 5]);

      /**
   * Define how the dashes will work. Extra light and light weight lines get dashes, anything heavier is solid.
   */
  // this.linkDashScale = d3
  //     .scaleOrdinal()
  //     .domain([0, 2, 3])
  //     .range(["4 2", "2 2", null]);
  }



  displayLinks() {
    this.link = this.svg
      .append('g')
      .attr('class', 'links')
      .selectAll('path.link')
      .data(this.dataLoader.getFilteredEdges())
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
            return 'url(#markerArrow)';

          default:
            return 'none';
        }
      })
      .attr('fill', 'none');
  }

  animateLinks() {
    this.link.attr('d', (d: any) => {
      const mid = [
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

      return this.lineGenerator([
        [d.source.x, d.source.y],
        // mid,
        [d.target.x, d.target.y],
      ]);
    });
  }
}
