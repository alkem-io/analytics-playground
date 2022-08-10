import axios, { AxiosRequestConfig } from 'axios';
import { GeoapifyResponse } from './GeoapifyResponse';

export class GeoapifyGeocodeHandler {
  urlBase = 'https://api.geoapify.com/v1/geocode/search';
  apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async lookup(country: string, city: string, identifier: string): Promise<[number, number]> {
    if (!country.trim() && !city.trim()) {
      console.log(`[${identifier}] Ignoring lookup with values '${city}', ${country}`);
      return [0, 0];
    }
    const url = `${this.urlBase}`;
    let searchText = '';
    if (country) {
      searchText = country;
      if (city) {
        searchText = `${city}, ${country}`;
      }
    } else {
      // country not specified
      if (city) {
        searchText = city;
      }
    }
    const params = {
      text: searchText,
      apiKey: this.apiKey,
    };
    try {
      const axiosConfig: AxiosRequestConfig = {
        headers: {
          Accept: 'application/json',
        },
        params: params,
      };
      // 👇️ const data: GetUsersResponse
      const { data, status } = await axios.get<GeoapifyResponse>(
        url,
        axiosConfig
      );

      //console.log(JSON.stringify(data, null, 4));

      // 👇️ "response status is: 200"
      //console.log('response status is: ', status);

      const properties = data.features[0].properties;
      const result: [number, number] = [properties.lon, properties.lat];
      console.log(
        `[${identifier}] Search term '${searchText}' resulted in location: ${result}`
      );
      return result;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log(
          `[${identifier}] error message on search text '${searchText}' based on city(${city}), country(${country}): `,
          error.message,
          JSON.stringify(error)
        );
        return [0, 0];
      } else {
        console.log(`[${identifier}] unexpected error: `, error, JSON.stringify(error));
        return [0, 0];
      }
    }
  }
}
