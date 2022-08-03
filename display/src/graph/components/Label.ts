import * as d3 from 'd3';

/**
 * Force directed graph component which displays the name associated with any Node at the place
 * that the Node is arranged by the force directed graph.
 */
export class Label {
  textContainer: any;

  svg: any;

  constructor(svg: any) {
    this.svg = svg;
  }

  register(nodes: any, nodeScale: any) {
    const max = d3.max(nodes.map((node: any) => node.weight)) || 10;

    const fontSizeScale = d3.scaleLinear().domain([0]).range([7, 12]);

    const textContainer = this.svg
      .append('g')
      .attr('class', 'textContainer')
      .selectAll('g.label')
      .data(nodes)
      .enter()
      .append('g');

    textContainer
      .append('text')
      .text((d: any) => d.name)
      .attr('font-size', (d: any) => fontSizeScale(d.weight))
      .attr('transform', (d: any) => {
        const scale = nodeScale(d.weight);
        const x = scale + 2;
        const y = scale + 4;
        return `translate(${x}, ${y})`;
      });
  }

  animate() {
    this.textContainer.attr('transform', (d: any) => `translate(${d.x}, ${d.y})`);
  }
}
