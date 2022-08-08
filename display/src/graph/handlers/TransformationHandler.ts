import * as d3 from 'd3';
import { Simulation } from 'd3';

export class TransformationHandler {
  defaultScale = 1;
  defaultTranslation = [0, 0];

  width: number;
  height: number;

  group: any;

  scale: any;
  translate: any;

  constructor(width: number, height: number, group: any) {
    this.width = width;
    this.height = height;

    this.group = group;

    this.scale = this.defaultScale;
    this.translate = this.defaultTranslation;
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
}
