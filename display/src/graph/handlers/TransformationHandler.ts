import { zoom, ZoomBehavior } from 'd3-zoom';
import { drag, DragBehavior } from 'd3-drag';
import { geoAlbers, geoPath, GeoConicProjection } from 'd3-geo';
import { max, min } from 'd3-array';

export class TransformationHandler {
  defaultScale = 1;
  defaultTranslation: [number, number] = [0, 0];
  scaleFactor = 0.1;


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
    this.projection = geoAlbers().rotate([-30, 0, 0]);
    this.geoGenerator = geoPath().projection(this.projection);
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
    const listener = drag();
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
  zoomFit(maxNodeRadius: number, dataNodes: any) {
    const buffer = maxNodeRadius;
    const maxX = max(dataNodes, (d: any) => d.x + buffer - 0) || 0;
    const minX = min(dataNodes, (d: any) => d.x - buffer) || 0;
    const rangeX = maxX - minX;

    const maxY = max(dataNodes, (d: any) => d.y + buffer - 0) || 0;
    const minY = min(dataNodes, (d: any) => d.y - buffer - 0) || 0;
    const rangeY = maxY - minY;

    this.scale = 1 / Math.max(rangeX / this.width, rangeY / this.height);
    this.translate = [-minX * this.scale, -minY * this.scale];
  }

  zoomPlus() {
    this.scale = this.scale * (1 + this.scaleFactor);
  }

  zoomMin() {
    this.scale = this.scale * (1 - this.scaleFactor);
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
    const z = zoom();
    z.on('zoom', this.handleZoom);
    this.group.call(z);
  }

}
