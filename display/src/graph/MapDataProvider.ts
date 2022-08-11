import * as d3 from 'd3';

export class MapDataProvider {
  private selectedMap: string;
  private loadedMaps: Map<string, any>;
  private mapDisplayed: boolean;

  constructor() {
    this.loadedMaps = new Map();
    this.selectedMap = '';
    this.mapDisplayed = false;
  }

  async loadMap(geoJsonFile: string) {
    const loadedMap = await d3.json(geoJsonFile);
    if (!loadedMap) {
      throw new Error('Unable to load data');
    }
    this.loadedMaps.set(geoJsonFile, loadedMap);
    this.selectedMap = geoJsonFile;
    console.log(`geojson loaded from ${geoJsonFile}`);
  }

  setMapsDisplay(value: boolean) {
    this.mapDisplayed = value;
  }

  isMapDisplayEnabled() {
    return this.mapDisplayed;
  }

  setSelectedMap(geoJsonFile: string) {
    const loadedMap = this.loadedMaps.get(geoJsonFile);
    if (!loadedMap) {
      throw new Error(`Unable to find specified map data: ${geoJsonFile}`);
    }
    this.selectedMap = geoJsonFile;
  }

  getSelectedMap() {
    if (this.selectedMap === "") {
      throw new Error(`No map selected: ${this.selectedMap}`);
    }
    const loadedMap = this.loadedMaps.get(this.selectedMap);
    if (!loadedMap) {
      throw new Error(`Unable to find specified map data: ${this.selectedMap}`);
    }
    return loadedMap;
  }

}
