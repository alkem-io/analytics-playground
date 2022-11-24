import * as d3 from 'd3';
import { GeoConicProjection, Simulation, Selection, ZoomBehavior } from 'd3';

export class TransformationHandler {
  defaultScale = 1;
  defaultTranslation: [number, number] = [0, 0];
  scaleFactor = 0.1;

  svg: Selection<any, any, any, any>;
  width: number;
  height: number;

  group: any;

  scale: number;
  translate: [number, number];

  projection: GeoConicProjection;
  geoGenerator: any;

  zoomBehavior: ZoomBehavior<any, any>;

  constructor(svg: any, width: number, height: number, group: any) {
    this.svg = svg;
    this.width = width;
    this.height = height;

    this.group = group;

    this.scale = this.defaultScale;
    this.translate = this.defaultTranslation;
    this.projection = d3.geoAlbers().rotate([-30, 0, 0]);
    this.geoGenerator = d3.geoPath().projection(this.projection);

    this.zoomBehavior = d3.zoom()
      .extent([[0, 0], [this.width, this.height]])
      .scaleExtent([0.1, 30])
      .on("zoom", ({ transform }) => {
        this.scale = transform.k;
        this.translate = [transform.x, transform.y];
        this.transformDisplay(0);
      });
    this.svg.call(this.zoomBehavior);

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


  // dataNodes typically obtained by doing a d3.selectAll().data();
  zoomFit(dataNodes: any, buffer: number = 0) {
    const maxX = d3.max(dataNodes, (d: any) => d.x + buffer - 0) || 0;
    const minX = d3.min(dataNodes, (d: any) => d.x - buffer) || 0;
    const rangeX = maxX - minX;

    const maxY = d3.max(dataNodes, (d: any) => d.y + buffer - 0) || 0;
    const minY = d3.min(dataNodes, (d: any) => d.y - buffer - 0) || 0;
    const rangeY = maxY - minY;

    const scale = 1 / Math.max(rangeX / this.width, rangeY / this.height);
    const translate = [-minX * scale, -minY * scale];
    var transform = d3.zoomIdentity
      .translate(translate[0], translate[1])
      .scale(scale);
    this.svg.call(this.zoomBehavior.transform, transform);
  }

  zoomPlus() {
    var transform = d3.zoomIdentity
      .translate(this.translate[0] - (this.width / 2) * this.scaleFactor, this.translate[1] - (this.height / 2) * this.scaleFactor)
      .scale(this.scale * (1 + this.scaleFactor));
    this.svg.call(this.zoomBehavior.transform, transform);
  }

  zoomMin() {
    var transform = d3.zoomIdentity
      .translate(this.translate[0] + (this.width / 2) * this.scaleFactor, this.translate[1] + (this.height / 2) * this.scaleFactor)
      .scale(this.scale * (1 - this.scaleFactor));
    this.svg.call(this.zoomBehavior.transform, transform);
  }

  transformDisplay(duration: number) {
    this.group
      .transition()
      .duration(duration)
      .attr('transform', `translate(${this.translate})scale(${this.scale})`);
  }
}
