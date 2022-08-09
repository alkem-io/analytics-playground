import * as d3 from 'd3';

export class MapDataProvider {
  private countriesGeoJsonFile = '';
  private countriesGeoJson: any;
  private cities: any;

  constructor(countriesGeoJsonFile: string) {
    this.countriesGeoJsonFile = countriesGeoJsonFile;
  }

  async loadData() {
    this.countriesGeoJson = await d3.json(this.countriesGeoJsonFile);
    if (!this.countriesGeoJson) {
      throw new Error('Unable to load data');
    }
    console.log(`countries geojson loaded from ${this.countriesGeoJsonFile}`);

  }

  getCountries() {
    return this.countriesGeoJson;
  }

  getCityLocation(country: string, city: string): [number, number] {
    console.log(`Obtaining ${country} - ${city}`);
    return [0,0];
  }

}
