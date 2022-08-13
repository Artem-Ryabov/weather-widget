export interface WeatherReport {
  coord: {
    lon: number;
    lan: number;
  };

  weather: [
    {
      id: number;
      main: string;
      description: string;
      icon: string;
    }
  ];

  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
    dew_point: number;
  };

  wind: {
    speed: number;
    deg: number;
  };

  name: string;

  visibility: number;

  sys: {
    country: string;
    [p: string]: any;
  };

  [p: string]: any;
}

export interface SortabeWeatherReport extends WeatherReport {
  order: number;
}
