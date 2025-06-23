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

  private d3Zoom: any = null;
  private svgElem: any = null;
  private currentTransform: any = null;

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
    // Increase the map scale by expanding the fitExtent area
    // Old: this.projection.fitExtent([ [0, 0], [ this.width, this.height]], geoJson);
    const scaleFactor = 1.3; // Moderate separation
    this.projection.fitExtent([[0, 0], [this.width * scaleFactor, this.height * scaleFactor]], geoJson);
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

  public zoomPlus() {
    if (this.svgElem && this.d3Zoom) {
      // Get the current center of the viewport in SVG coordinates
      const center = this.currentTransform
        ? [
            (this.width / 2 - this.currentTransform.x) / this.currentTransform.k,
            (this.height / 2 - this.currentTransform.y) / this.currentTransform.k
          ]
        : [this.width / 2, this.height / 2];
      this.svgElem.transition().duration(400).call(
        this.d3Zoom.scaleBy,
        1 + this.scaleFactor,
        center
      );
    }
  }

  public zoomMin() {
    if (this.svgElem && this.d3Zoom) {
      // Get the current center of the viewport in SVG coordinates
      const center = this.currentTransform
        ? [
            (this.width / 2 - this.currentTransform.x) / this.currentTransform.k,
            (this.height / 2 - this.currentTransform.y) / this.currentTransform.k
          ]
        : [this.width / 2, this.height / 2];
      this.svgElem.transition().duration(400).call(
        this.d3Zoom.scaleBy,
        1 - this.scaleFactor,
        center
      );
    }
  }

  transformDisplay(duration: number) {
    this.group
      .transition()
      .duration(duration)
      .attr('transform', `translate(${this.translate})scale(${this.scale})`);
  }

  // Make registerZoom public and accept the svg as an argument
  public registerZoom(svg: any) {
    this.svgElem = svg;
    this.d3Zoom = zoom()
      .scaleExtent([0.2, 10]) // Allow more zoom in and out
      .on('zoom', (e: any) => {
        this.currentTransform = e.transform;
        this.group.attr('transform', e.transform);
      });
    svg.call(this.d3Zoom);
  }

}
