import { max as d3Max } from 'd3-array';
import { scaleLinear } from 'd3-scale';

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
    const weights: number[] = nodes.map((node: any) => Number(node.weight));
    const maxWeight = d3Max(weights) || 10;
    const fontSizeScale = scaleLinear<number, number>().domain([0, maxWeight]).range([7, 12]);

    this.textContainer = this.svg
      .append('g')
      .attr('class', 'textContainer')
      .selectAll('g.label')
      .data(nodes)
      .join('g')
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
