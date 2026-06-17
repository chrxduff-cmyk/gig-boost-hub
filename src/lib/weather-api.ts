// Weather API types and service
export interface WeatherData {
  latitude: number;
  longitude: number;
  timezone: string;
  current_weather: {
    temperature: number;
    windspeed: number;
    winddirection: number;
    weathercode: number;
    is_day: number;
    time: string;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation: number[];
    weathercode: number[];
    relative_humidity_2m: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    windspeed_10m_max: number[];
  };
}

export interface LocationData {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1: string;
  timezone: string;
}

export interface GeocodingResult {
  results: LocationData[];
}

// Weather codes to descriptions mapping (WMO codes)
const weatherCodeMap: Record<number, { label: string; icon: string }> = {
  0: { label: "Clear sky", icon: "☀️" },
  1: { label: "Mainly clear", icon: "🌤️" },
  2: { label: "Partly cloudy", icon: "⛅" },
  3: { label: "Overcast", icon: "☁️" },
  45: { label: "Foggy", icon: "🌫️" },
  48: { label: "Depositing rime fog", icon: "🌫️" },
  51: { label: "Light drizzle", icon: "🌧️" },
  53: { label: "Moderate drizzle", icon: "🌧️" },
  55: { label: "Dense drizzle", icon: "🌧️" },
  61: { label: "Slight rain", icon: "🌧️" },
  63: { label: "Moderate rain", icon: "🌧️" },
  65: { label: "Heavy rain", icon: "⛈️" },
  71: { label: "Slight snow", icon: "❄️" },
  73: { label: "Moderate snow", icon: "❄️" },
  75: { label: "Heavy snow", icon: "❄️" },
  77: { label: "Snow grains", icon: "❄️" },
  80: { label: "Slight rain showers", icon: "🌧️" },
  81: { label: "Moderate rain showers", icon: "🌧️" },
  82: { label: "Violent rain showers", icon: "⛈️" },
  85: { label: "Slight snow showers", icon: "❄️" },
  86: { label: "Heavy snow showers", icon: "❄️" },
  95: { label: "Thunderstorm", icon: "⛈️" },
  96: { label: "Thunderstorm with hail", icon: "⛈️" },
  99: { label: "Thunderstorm with hail", icon: "⛈️" },
};

export function getWeatherDescription(code: number): { label: string; icon: string } {
  return weatherCodeMap[code] || { label: "Unknown", icon: "🌍" };
}

export async function fetchWeather(latitude: number, longitude: number): Promise<WeatherData> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.append("latitude", latitude.toString());
  url.searchParams.append("longitude", longitude.toString());
  url.searchParams.append("current_weather", "true");
  url.searchParams.append("hourly", "temperature_2m,precipitation,weather_code,relative_humidity_2m");
  url.searchParams.append("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max");
  url.searchParams.append("timezone", "auto");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  return response.json();
}

export async function geocodeLocation(query: string): Promise<LocationData[]> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.append("name", query);
  url.searchParams.append("count", "10");
  url.searchParams.append("language", "en");
  url.searchParams.append("format", "json");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Geocoding API error: ${response.status}`);
  }

  const data: GeocodingResult = await response.json();
  return data.results || [];
}

export async function getWeatherByLocation(latitude: number, longitude: number): Promise<WeatherData> {
  return fetchWeather(latitude, longitude);
}
