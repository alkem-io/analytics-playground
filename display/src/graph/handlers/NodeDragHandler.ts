import { drag, DragBehavior } from 'd3-drag';
import { Simulation } from 'd3-force';
import { select } from 'd3-selection';

export class NodeDragHandler {
  dragHandler: DragBehavior<any, any, any>;

  constructor(simulation: Simulation<any, any>, nodeScale?: any) {
    // Capture simulation and nodeScale in closure for all handlers
    this.dragHandler = drag()
      .on('start', function(event: any, d: any) {
        const selectedNode = select(this);
        selectedNode.classed('fixed-location', false);
        selectedNode.classed('fixed', true);
        // Store original position for snap-back
        d._originalX = d.x;
        d._originalY = d.y;
        // Visual feedback: grow node and add shadow
        selectedNode.select('circle')
          .transition().duration(120)
          .attr('r', (d: any) => nodeScale ? nodeScale(d.weight) * 1.35 : ((d.weight || 14) * 1.35))
          .attr('stroke', '#007bff')
          .attr('stroke-width', 4)
          .style('filter', 'drop-shadow(0 6px 18px rgba(80,120,200,0.35))');
      })
      .on('drag', function(event: any, d: any) {
        d.fx = event.x;
        d.fy = event.y;
        // Keep node large while dragging
        const selectedNode = select(this);
        selectedNode.select('circle')
          .attr('r', (d: any) => nodeScale ? nodeScale(d.weight) * 1.35 : ((d.weight || 14) * 1.35));
        simulation.alpha(0.2).restart();
      })
      .on('end', function(event: any, d: any) {
        // Optionally, keep node fixed after drag, or release if Ctrl is held
        if (event.ctrlKey) {
          delete d.fx;
          delete d.fy;
          select(this).classed('fixed', false);
        } else {
          // Snap back to original position if not fixed
          if (d._originalX !== undefined && d._originalY !== undefined) {
            // Animate node back to original position
            d.fx = d._originalX;
            d.fy = d._originalY;
            simulation.alpha(0.3).restart();
            setTimeout(() => {
              delete d.fx;
              delete d.fy;
              simulation.alpha(0.1).restart();
            }, 400); // Let it snap, then release
          } else {
            delete d.fx;
            delete d.fy;
          }
        }
        // Visual feedback: restore node appearance
        const selectedNode = select(this);
        selectedNode.select('circle')
          .transition().duration(180)
          .attr('r', (d: any) => nodeScale ? nodeScale(d.weight) : (d.weight || 14))
          .attr('stroke', '#fff')
          .attr('stroke-width', 2)
          .style('filter', 'drop-shadow(0 2px 6px rgba(80,120,200,0.15))');
      });
  }

  register(node: any) {
    node.call(this.dragHandler).on('click', this.click.bind(this));
  }

  private click(event: any, d: any) {
    // Unfix node on click with Shift key
    if (event.shiftKey) {
      delete d.fx;
      delete d.fy;
      delete d.fixedLocation;
      select(event.currentTarget).classed('fixed', false);
      select(event.currentTarget).classed('fixed-location', false);
      // simulation is not available here, but this is only for unfixing
    }
  }
}
