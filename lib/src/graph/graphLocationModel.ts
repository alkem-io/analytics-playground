export class GraphLocationModel {
  country: string;
  city: string;
  lon: number;
  lat: number;

  // Constructor to initialize the location model
  constructor(country: string, city: string, lon: number, lat: number) {
    this.country = country;
    this.city = city;
    this.lon = lon;
    this.lat = lat;
  }
}
