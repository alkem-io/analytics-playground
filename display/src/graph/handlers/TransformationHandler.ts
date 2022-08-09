import * as d3 from 'd3';
import { GeoConicProjection, Simulation } from 'd3';

export class TransformationHandler {
  defaultScale = 1;
  defaultTranslation: [number, number] = [0, 0];

  width: number;
  height: number;

  group: any;

  scale: number;
  translate: [number, number];

  projection: GeoConicProjection;
  geoGenerator: any;

  constructor(width: number, height: number, group: any) {
    this.width = width;
    this.height = height;

    this.group = group;

    this.scale = this.defaultScale;
    this.translate = this.defaultTranslation;
    this.projection = d3.geoAlbers().rotate([-30, 0, 0]);
    this.geoGenerator = d3.geoPath().projection(this.projection);
  }

  projectionExtent(geoJson: any) {
    this.projection.fitExtent([ [0, 0], [ this.width, this.height]], geoJson);
  }

  transformCoordinates(x: number, y: number) {
    return [
      this.scale * x + this.translate[0],
      this.scale * y + this.translate[1],
    ];
  }

  registerPanningDragListener(targetElement: any) {
    const listener = d3.drag();
    listener.on('drag', (event: any) => {
      this.translate = [
        this.translate[0] + event.dx * this.scale,
        this.translate[1] + event.dy * this.scale,
      ];
      this.transformDisplay(0);
    });
    targetElement.call(listener);
  }

  // dataNodes typically obtained by doing a d3.selectAll().data();
  scaleToFit(maxNodeRadius: number, dataNodes: any) {
    const buffer = maxNodeRadius;
    const maxX = d3.max(dataNodes, (d: any) => d.x + buffer - 0) || 0;
    const minX = d3.min(dataNodes, (d: any) => d.x - buffer) || 0;
    const rangeX = maxX - minX;

    const maxY = d3.max(dataNodes, (d: any) => d.y + buffer - 0) || 0;
    const minY = d3.min(dataNodes, (d: any) => d.y - buffer - 0) || 0;
    const rangeY = maxY - minY;

    this.scale = 1 / Math.max(rangeX / this.width, rangeY / this.height);
    this.translate = [-minX * this.scale, -minY * this.scale];
  }

  transformDisplay(duration: number) {
    this.group
      .transition()
      .duration(duration)
      .attr('transform', `translate(${this.translate})scale(${this.scale})`);
  }

  private handleZoom = (e: any) => {
    this.group.attr('transform', e.transform);
    console.log(`zoom called: ${e}`);
  };

  private registerZoom() {
    let zoom = d3.zoom().on('zoom', this.handleZoom);
    this.group.call(zoom);
  }

}
