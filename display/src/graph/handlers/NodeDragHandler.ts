import * as d3 from 'd3';
import { Simulation } from 'd3';

export class NodeDragHandler {
  svg: any;
  dragHandler: any;
  width: number;
  height: number;

  simulation: Simulation<any, any>;

  constructor(simulation: Simulation<any, any>, width: number, height: number) {
    this.simulation = simulation;
    this.width = width;
    this.height = height;

    this.dragHandler = d3
      .drag()
      .on('start', this.dragstartNode)
      .on('drag', this.draggedNode.bind(this));
  }

  register(node: any) {
    node.call(this.dragHandler).on('click', this.click.bind(this));
  }

  private click(event: any, d: any) {
    delete d.fx;
    delete d.fy;
    d3.select(event.currentTarget).classed('fixed', false);
    this.simulation.alpha(1).restart();
  }

  private dragstartNode() {
    d3.select(this).classed('fixed', true);
  }

  private draggedNode(event: any, d: any) {
    const clamp = function(x: number, lo: number, hi: number) {
        return x < lo ? lo : x > hi ? hi : x;
      }

    d.fx = clamp(event.x, 0, this.width);
    d.fy = clamp(event.y, 0, this.height);
    this.simulation.alpha(1).restart();
  }
}
