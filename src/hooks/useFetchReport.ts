import { CityInfo } from "../models/cityInfo";
import { WeatherReport } from "../models/weatherReport";
import { ref } from "vue";

const apiKey = "c6606b05829251b654112c39968482e9";

const useFetchReport = () => {
  const loading = ref<boolean>(false);
  const weatherReport = ref<WeatherReport>(null);

  const fetchReportByCoord = async (latitude: number, longitude: number) => {
    weatherReport.value = (await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}`,
      {
        method: "GET",
      }
    ).then((res) => res.json())) as WeatherReport;

    // API "Current weather data" doesn't have dew point
    weatherReport.value.main.dew_point = (
      await fetch(
        `https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely,hourly,daily,alerts
      &appid=${apiKey}`,
        {
          method: "GET",
        }
      ).then((res) => res.json())
    ).current.dew_point;
  };

  const fetchReport = async (city: string) => {
    try {
      loading.value = true;
      weatherReport.value = null;

      const cityInfo: CityInfo = (
        await fetch(
          `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`,
          {
            method: "GET",
          }
        ).then((res) => res.json())
      )[0] as CityInfo;

      if (!(cityInfo && cityInfo.lat && cityInfo.lon)) {
        throw new Error(`City ${city} does not exist in OpenWeather API`);
      }

      await fetchReportByCoord(cityInfo.lat, cityInfo.lon);
    } catch (error) {
      console.error(error);
    } finally {
      loading.value = false;
    }
  };
  return { loading, weatherReport, fetchReport, fetchReportByCoord };
};

export default useFetchReport;
