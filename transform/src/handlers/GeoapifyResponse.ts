export type GeoapifyResponse = {
  type: string;
  features: [
    {
      type: string,
      properties: {
        country: string,
        lon: number,
        lat: number
      }
    }
  ]
};