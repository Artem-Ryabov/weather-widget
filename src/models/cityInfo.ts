export interface CityInfo {
  name: string;
  lat: number;
  lon: number;
  coutry: string;
  [p: string]: any;
}

export interface City {
  name: string;
  coutry: string;
  order: number;
}
