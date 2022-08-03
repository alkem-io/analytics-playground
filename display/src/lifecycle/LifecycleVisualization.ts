import * as d3 from 'd3';
import { LifecycleVisualizationOptions } from './LifecycleVisualizationOptions';
import { LifecycleDataProvider } from './LifecycleDataProvider';

export class LifecycleVisualization {
  lifecycleData: LifecycleDataProvider;
  svg: any;
  node: any;
  width: number;
  height: number;

  link: any;
  linkWidthScale: any;
  simulation: any;

  text: any;

  options: LifecycleVisualizationOptions;

  constructor(
    svg: any,
    dataLoader: LifecycleDataProvider,
    width: number,
    height: number,
    options?: LifecycleVisualizationOptions
  ) {
    this.lifecycleData = dataLoader;
    this.svg = svg;
    this.width = width;
    this.height = height;
    this.options = options || new LifecycleVisualizationOptions();
  }

  displayLifecycle() {


    const boxWidth = 120;
    const boxHeight = 30;
    const cornerRound = 10;

    const machine = this.lifecycleData.machine;
    const initialState: string = machine.id + '.' + machine.initial?.toString();

    const nodes = this.lifecycleData.graph.children.map((node: any) => {
      // 2 is current state
      const group =
        this.lifecycleData.state && node.id.endsWith(this.lifecycleData.state) ? 2 : 1;
      if (node.id.endsWith(initialState)) {
        return {
          id: node.id,
          group: group,
          fx: boxWidth / 2 + 10,
        };
      }

      if (node.stateNode.type === 'final') {
        return {
          id: node.id,
          group: group,
          fx: this.width - boxWidth / 2 - 10,
        };
      }
      return {
        id: node.id,
        group: group,
      };
    });

    const links = this.lifecycleData.graph.children.flatMap((node: any) =>
      node.edges.map((edge: any) => ({
        source: edge.source.id,
        target: edge.target.id,
      }))
    );
    this.simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3.forceLink(links).id((d: any) => d.id)
      )
      .force('charge', d3.forceManyBody().strength(-100))
      .force('collide', d3.forceCollide().radius(80).iterations(2))
      .force('center', d3.forceCenter(this.width / 2, this.height / 2));

    this.svg.select('*').remove();

    const defs = this.svg.append('svg:defs');
    defs
      .append('svg:marker')
      .attr('id', 'end-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 10)
      .attr('markerWidth', 10.5)
      .attr('markerHeight', 10.5)
      .attr('orient', 'auto')
      .append('svg:path')
      .attr('d', 'M0,-5L10,0L0,5');

    const filter = defs
      .append('filter')
      .attr('id', 'drop-shadow')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', '200%')
      .attr('height', '200%');

    filter
      .append('feDropShadow')
      .attr('dx', 2)
      .attr('dy', 2)
      .attr('stdDeviation', 1)
      .attr('flood-color', this.options.strokeDefaultColor)
      .attr('flood-opacity', 1);

    this.svg.attr('viewBox', [0, 0, this.width, this.height]);
    this.link = this.svg
      .append('g')
      .attr('stroke', this.options.strokeDefaultColor)
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', (_: any) => 1)
      .style('marker-end', 'url(#end-arrow)');

    this.node = this.svg
      .append('g')
      .attr('class', 'nodes')
      .attr('stroke-width', 1.5)
      .selectAll('rect')
      .data(nodes)
      .enter()
      .append('rect')
      .attr('stroke', (d: any)  =>
        d.group === 1 ? this.options.strokeDefaultColor : this.options.strokePrimaryColor
      )
      .attr('width', boxWidth)
      .attr('height', boxHeight)
      .attr('rx', cornerRound)
      .attr('ry', cornerRound)
      .attr('fill', this.options.fillColor)
      .style('filter', 'url(#drop-shadow)');
    this.text = this.svg
      .append('g')
      .attr('class', 'text')
      .attr('stroke-width', 1.5)
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .attr('x', '50%')
      .attr('y', boxHeight)
      .attr('dx', boxWidth / 2)
      .attr('dy', boxHeight / 2)
      .attr('fill', (d: any)  =>
        d.group === 1 ? this.options.strokeDefaultColor : this.options.strokePrimaryColor
      )
      .attr('font-weight', 400)
      .attr('font', this.options.font)
      .attr('font-size', this.options.fontSize)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .text((d: any)  => d.id.split('.').pop());
    this.node.append('title').text((d: any)  => d.id);

    this.simulation.on('tick', () => {
      this.link
        .attr('x1', (d: any)  => {
          let change = 0;
          if (Math.abs(d.target.x - d.source.x) > boxWidth) {
            // Boxes are far apart, draw from corner
            const direction = Math.sign(d.target.x - d.source.x);
            change = (direction * (boxWidth - cornerRound / 2)) / 2;
          }
          return d.source.x + change;
        })
        .attr('y1', (d: any)  => {
          let change = 0;
          if (Math.abs(d.target.y - d.source.y) > boxHeight) {
            // Boxes are far apart, draw from corner
            const direction = Math.sign(d.target.y - d.source.y);
            change = (direction * (boxHeight - cornerRound / 2)) / 2;
          }
          return d.source.y + change;
        })
        .attr('x2', (d: any)  => {
          let change = 0;
          if (Math.abs(d.target.x - d.source.x) > boxWidth) {
            // Boxes are far apart, draw from corner
            const direction = -Math.sign(d.target.x - d.source.x);
            change = (direction * (boxWidth - cornerRound / 2)) / 2;
          }
          return d.target.x + change;
        })
        .attr('y2', (d: any)  => {
          let change = 0;
          if (Math.abs(d.target.y - d.source.y) > boxHeight) {
            // Boxes are far apart, draw from corner
            const direction = -Math.sign(d.target.y - d.source.y);
            change = (direction * (boxHeight - cornerRound / 2)) / 2;
          }
          return d.target.y + change;
        });

      this.node
        .attr('x', (d: any)  => d.x - boxWidth / 2)
        .attr('y', (d: any)  => d.y - boxHeight / 2);
      this.text
        .attr('x', (d: any)  => d.x - boxWidth / 2)
        .attr('y', (d: any)  => d.y - boxHeight / 2);
    });
    this.simulation.tick(1000);
    //simulation.stop();
    setTimeout(() => {
      this.simulation.stop();
    }, 1);
  }
}
