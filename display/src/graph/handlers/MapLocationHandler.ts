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
    console.log(`MapLocationHandler: Processing ${nodeType} nodes for map positioning...`);
    
    // Debug: Check current map and projection status
    console.log('Projection available:', typeof this.transformationHandler.projection === 'function');
    console.log('Map viewport size:', this.transformationHandler.width, 'x', this.transformationHandler.height);
    
    const nodesData = nodes.data();
    let processedCount = 0;
    let validLocationCount = 0;
    let projectedCount = 0;
    
    for (const node of nodesData) {
      // Always check the current projection type for each node (in case map was switched)
      const projection = this.transformationHandler.projection;
      const isWorldMap = projection && projection.toString().includes('geoNaturalEarth1');
      if (nodeType == node.type) {
        processedCount++;
        const lon = node.profile?.location?.lon || '';
        const lat = node.profile?.location?.lat || '';
        console.log(`Node ${node.id}: lon=${lon}, lat=${lat}, profile=`, node.profile);
        
        // For world map, use [lon, lat] as expected by geoNaturalEarth1; for others, swap if needed
        let actualLon, actualLat;
        if (isWorldMap) {
          actualLon = lon;
          actualLat = lat;
        } else {
          // If data is swapped, correct it for regional maps
          actualLon = lat;
          actualLat = lon;
        }
        console.log(`CORRECTED: Node ${node.id}: actualLon=${actualLon}, actualLat=${actualLat}`);
        
        if (this.isValidLocation(lon, lat)) {
          validLocationCount++;
          
          // Debug: Show the projection bounds and test coordinates
          const projectionBounds = projection.invert ? 
            [projection.invert([0, 0]), projection.invert([2000, 1000])] : 
            'No invert method';
          console.log('Projection bounds check:', projectionBounds);
          
          const fixedLocation = projection([
            actualLon,
            actualLat,
          ]);
          console.log(`Projection for [${actualLon}, ${actualLat}]:`, fixedLocation);
          
          // Debug: Test a known Netherlands coordinate
          if (node.id.includes('test') || Math.abs(lon - 4.3113461) < 0.001) {
            const netherlandsTest = projection([4.47917, 51.9225]); // Rotterdam
            console.log('Rotterdam test projection [4.47917, 51.9225]:', netherlandsTest);
          }
          
          if (fixedLocation) {
            projectedCount++;
            console.log(`Setting node ${node.id} to position [${fixedLocation[0]}, ${fixedLocation[1]}]`);
            node.fx = fixedLocation[0];
            node.fy = fixedLocation[1];
            // a bit of a hack: set a fixed value on the bound data that is then picked up via classed on the selection...
            node.fixedLocation = 'true';
            
            // Add a visual indicator for positioned nodes
            setTimeout(() => {
              const nodeElement = d3.select(`[data-node-id="${node.id}"]`);
              if (!nodeElement.empty()) {
                nodeElement
                  .style('stroke', '#ff6b6b')
                  .style('stroke-width', '3px')
                  .style('filter', 'drop-shadow(0px 0px 8px rgba(255, 107, 107, 0.8))');
              }
            }, 100);
          } else {
            console.warn(`Projection failed for node ${node.id} at [${lon}, ${lat}]`);
          }
        } else {
          console.log(`Node ${node.id} has invalid location: [${lon}, ${lat}]`);
        }
      }
    }
    
    console.log(`MapLocationHandler summary: Processed ${processedCount} ${nodeType} nodes, ${validLocationCount} had valid locations, ${projectedCount} were successfully projected`);
    
    // Calculate bounds of positioned nodes for auto-zoom
    if (projectedCount > 0) {
      const positionedNodes = nodes.data().filter((d: any) => d.fx !== undefined && d.fy !== undefined);
      if (positionedNodes.length > 0) {
        const bounds = this.calculateNodeBounds(positionedNodes);
        console.log('Positioned nodes bounds:', bounds);
        
        // Trigger auto-zoom to show positioned nodes
        setTimeout(() => {
          this.autoZoomToPositionedNodes(bounds);
        }, 1000); // Wait for simulation to settle
      }
    }
    
    nodes.classed('fixed-location', (d:any) => d.fixedLocation);

    // Instead of a full simulation restart, force a limited number of ticks for immediate update
    console.log(`Restarting simulation and forcing ticks to update positions...`);
    this.simulation.alpha(1).restart();
    // For large graphs, fewer ticks for performance
    const nodeCount = nodes.data().length;
    const ticks = nodeCount > 500 ? 10 : 30;
    for (let i = 0; i < ticks; i++) this.simulation.tick();
    this.simulation.alpha(0);
    // Optionally, trigger a manual update/redraw if needed (links update on tick)
  }

  unfixNodeLocationFromMap(nodes: any, nodeType: string) {
    const nodesData = nodes.data();
    for (const node of nodesData) {
      if (nodeType == node.type) {
        node.fx = null;
        node.fy = null;
        node.fixedLocation = false;
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

  private calculateNodeBounds(nodes: any[]): { minX: number, maxX: number, minY: number, maxY: number } {
    if (nodes.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }
    
    let minX = nodes[0].fx;
    let maxX = nodes[0].fx;
    let minY = nodes[0].fy;
    let maxY = nodes[0].fy;
    
    for (const node of nodes) {
      if (node.fx < minX) minX = node.fx;
      if (node.fx > maxX) maxX = node.fx;
      if (node.fy < minY) minY = node.fy;
      if (node.fy > maxY) maxY = node.fy;
    }
    
    return { minX, maxX, minY, maxY };
  }
  
  private autoZoomToPositionedNodes(bounds: { minX: number, maxX: number, minY: number, maxY: number }): void {
    const svg = d3.select('#graph-svg');
    const viewBox = svg.attr('viewBox');
    if (!viewBox) return;
    
    const [vx, vy, vw, vh] = viewBox.split(' ').map(Number);
    
    // Add padding around the bounds
    const padding = 100;
    const width = Math.max(bounds.maxX - bounds.minX, 200) + padding * 2;
    const height = Math.max(bounds.maxY - bounds.minY, 200) + padding * 2;
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    
    const newViewBox = `${centerX - width/2} ${centerY - height/2} ${width} ${height}`;
    
    console.log(`Auto-zooming to positioned nodes. New viewBox: ${newViewBox}`);
    
    // Smoothly transition to the new view
    svg.transition()
      .duration(1500)
      .attr('viewBox', newViewBox);
  }

}
