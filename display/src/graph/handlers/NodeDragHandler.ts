import * as d3 from 'd3';
import { Simulation } from 'd3';

export class NodeDragHandler {
  dragHandler: any;
  simulation: Simulation<any, any>;

  constructor(simulation: Simulation<any, any>) {
    this.simulation = simulation;

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
    d.fx = event.x;
    d.fy = event.y;
    this.simulation.alpha(1).restart();
  }
}
