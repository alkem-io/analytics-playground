import * as d3 from 'd3';
import { Simulation } from 'd3-force';
import { TransformationHandler } from './TransformationHandler';

export class MapLocationHandler {
  simulation: Simulation<any, any>;
  transformationHandler: TransformationHandler;


  constructor(
    simulation: Simulation<any, any>,
    transformationHandler: TransformationHandler
  ) {
    this.simulation = simulation;
    this.transformationHandler = transformationHandler;
  }


  fixNodeLocationToMap(nodes: any, nodeType: string) {
    const nodesData = nodes.data();
    for (const node of nodesData) {
      if (nodeType == node.type) {
        const lon = node.location?.lon || '';
        const lat = node.location?.lat || '';
        if (this.isValidLocation(lon, lat)) {
          const fixedLocation = this.transformationHandler.projection([
            lon,
            lat,
          ]);
          if (fixedLocation) {
            node.fx = fixedLocation[0];
            node.fy = fixedLocation[1];
            // a bit of a hack: set a fixed value on the bound data that is then picked up via classed on the selection...
            node.fixedLocation = 'true';
          }
        }
      }
    }
    nodes.classed('fixed-location', (d:any) => d.fixedLocation);

    this.simulation.alpha(1).restart();
  }

  private isValidLocation(lon: number, lat: number): boolean {
    if (!lon || !lat) return false;
    if (lon === 0 || lat === 0) return false;
    return true;
  }

  // Register node expansion on click for overlapping nodes
  registerNodeExpansion(nodes: any) {
    nodes.on('click', (event: any, clickedNode: any) => {
      // Find all nodes at the same fx/fy location
      const allNodes = nodes.data();
      const overlapping = allNodes.filter((n: any) =>
        n.fx === clickedNode.fx && n.fy === clickedNode.fy
      );
      if (overlapping.length <= 1) return; // No overlap

      // Fan out the overlapping nodes in a circle
      const radius = 30; // distance from center
      overlapping.forEach((node: any, i: number) => {
        const angle = (2 * Math.PI * i) / overlapping.length;
        node.fx = clickedNode.fx + radius * Math.cos(angle);
        node.fy = clickedNode.fy + radius * Math.sin(angle);
        node.expanded = true;
      });
      this.simulation.alpha(1).restart();

      // Collapse on background click
      d3.select('svg').on('click', (e: any) => {
        overlapping.forEach((node: any) => {
          node.fx = clickedNode.fx;
          node.fy = clickedNode.fy;
          node.expanded = false;
        });
        this.simulation.alpha(1).restart();
        d3.select('svg').on('click', null); // Remove handler
      }, true);
      event.stopPropagation(); // Prevent immediate collapse
    });
  }

}
