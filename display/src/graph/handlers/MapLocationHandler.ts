import * as d3 from 'd3';
import { Simulation } from 'd3';
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
        const lon = node.lon;
        const lat = node.lat;
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
}
