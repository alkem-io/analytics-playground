import axios, { AxiosRequestConfig } from 'axios';
import { GeoapifyResponse } from './GeoapifyResponse';
import { Logger } from 'winston';

export class GeoapifyGeocodeHandler {
  urlBase = 'https://api.geoapify.com/v1/geocode/search';
  apiKey: string;
  logger: Logger;

  constructor(apiKey: string, logger: Logger) {
    this.apiKey = apiKey;
    this.logger = logger;
  }

  async lookup(
    country: string,
    city: string,
    identifier: string
  ): Promise<[number, number]> {
    if (!country.trim() && !city.trim()) {
      this.logger.info?.(
        `[${identifier}] Ignoring lookup with values '${city}', ${country}`
      );
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
      const firstFeature = data.features[0];
      if (!firstFeature) {
        this.logger.error(
          `[${identifier}] ERROR - Search term '${searchText}' resulted in no results: ${JSON.stringify(
            data
          )}`
        );
        return [0,0];
      }
      const properties = firstFeature.properties;
      const longitude = properties.lon;
      const latitude = properties.lat;
      const result: [number, number] = [longitude, latitude];
      this.logger.info?.(
        `[${identifier}] Search term '${searchText}' resulted in location: longitude=${longitude}, latitude=${latitude}`
      );
      return result;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `[${identifier}] error message on search text '${searchText}' based on city(${city}), country(${country}): `,
          error.message,
          JSON.stringify(error)
        );
        return [0, 0];
      } else {
        this.logger.error(
          `[${identifier}] unexpected error on searching for '${searchText}': `,
          error,
          JSON.stringify(error)
        );
        return [0, 0];
      }
    }
  }
}
