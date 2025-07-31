import { zoom, ZoomBehavior } from 'd3-zoom';
import { drag, DragBehavior } from 'd3-drag';
import { geoAlbers, geoPath, GeoConicProjection, geoNaturalEarth1 } from 'd3-geo';
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

  projection: any; // Changed from GeoConicProjection to any to support different projection types
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
    this.projection = geoAlbers().rotate([-30, 0, 0]); // Default regional projection
    this.geoGenerator = geoPath().projection(this.projection);
  }

  projectionExtent(geoJson: any) {
    // Determine if this is a world map based on coordinate extent
    const features = geoJson.features || [];
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    
    // Calculate coordinate bounds
    features.forEach((feature: any) => {
      if (feature.geometry && feature.geometry.coordinates) {
        this.extractCoordinates(feature.geometry.coordinates).forEach(([lng, lat]: [number, number]) => {
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
        });
      }
    });

    // Check if this is a world map (covers most of the globe)
    const lngSpan = maxLng - minLng;
    const latSpan = maxLat - minLat;
    const isWorldMap = lngSpan > 300 || (lngSpan > 200 && latSpan > 100);
    
    console.log('TransformationHandler: Coordinate bounds:', { minLng, maxLng, minLat, maxLat });
    console.log('TransformationHandler: Spans:', { lngSpan, latSpan });
    console.log('TransformationHandler: Is world map:', isWorldMap);

    // Use appropriate projection
    if (isWorldMap) {
      console.log('TransformationHandler: Using Natural Earth projection for world map');
      this.projection = geoNaturalEarth1();
    } else {
      console.log('TransformationHandler: Using Albers projection for regional map');
      this.projection = geoAlbers().rotate([-30, 0, 0]);
    }
    
    this.geoGenerator = geoPath().projection(this.projection);
    // Fit the projection to the actual SVG dimensions
    // Leave some margin for positioning nodes around the map
    const margin = 100; // pixels of margin
    
    console.log('TransformationHandler: Setting up projection with dimensions:', this.width, 'x', this.height);
    console.log('TransformationHandler: Projection extent will be:', [margin, margin], 'to', [this.width - margin, this.height - margin]);
    
    this.projection.fitExtent([
      [margin, margin], 
      [this.width - margin, this.height - margin]
    ], geoJson);
    
    // Test projection with known coordinates after setup
    const testCoords = [
      [4.3113461, 52.0799838], // Rotterdam
      [4.8924534, 52.3730796], // Amsterdam  
      [11.5753822, 48.1371079], // Munich
    ];
    
    console.log('TransformationHandler: Testing projection after setup:');
    testCoords.forEach(([lon, lat], index) => {
      const projected = this.projection([lon, lat]);
      const locationName = ['Rotterdam', 'Amsterdam', 'Munich'][index];
      console.log(`  ${locationName} [${lon}, ${lat}] -> [${projected ? projected[0].toFixed(2) : 'null'}, ${projected ? projected[1].toFixed(2) : 'null'}]`);
    });
  }

  // Helper method to recursively extract all coordinates from geometry
  private extractCoordinates(coords: any): [number, number][] {
    const result: [number, number][] = [];
    
    if (Array.isArray(coords)) {
      if (coords.length === 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
        // This is a coordinate pair [lng, lat]
        result.push([coords[0], coords[1]]);
      } else {
        // This is an array of coordinates or coordinate arrays
        coords.forEach(coord => {
          result.push(...this.extractCoordinates(coord));
        });
      }
    }
    
    return result;
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
