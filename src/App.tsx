import React, { useEffect, useMemo, useState } from "react";
import { Button, TextField } from "@mui/material";
const zipApiKey = import.meta.env.VITE_ZIPCODE;
const openApiKey = import.meta.env.VITE_OPENAPI;
import "./App.css";

// --------------------
// Types: Zipcodebase
// --------------------
type ZipcodebaseResultItem = {
  postal_code: string;
  country_code: string;
  state: string;
  city: string;
  latitude: number;
  longitude: number;
};

type ZipcodebaseSearchResponse = {
  results?: Record<string, ZipcodebaseResultItem[]>;
  // other fields may exist; we don't need them for this app
};

// --------------------
// Types: OpenWeather One Call
// --------------------
type OpenWeatherDaily = {
  dt: number;
  temp: {
    min: number;
    max: number;
  };
  weather: Array<{
    icon: string;
    description: string;
  }>;
};

type OpenWeatherForecastItem = {
  dt: number;
  main: {
    temp_min: number;
    temp_max: number;
  };
  weather: Array<{
    icon: string;
    description: string;
  }>;
};

type OpenWeatherForecastResponse = {
  list: OpenWeatherForecastItem[];
  city?: {
    timezone?: number;
  };
  // other fields may exist; we don't need them for this app
};

type OpenWeatherErrorResponse = {
  cod?: number | string;
  message?: string;
};

type WeatherState = { daily: OpenWeatherDaily[] } | null;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isOpenWeatherErrorResponse(value: unknown): value is OpenWeatherErrorResponse {
  return isObject(value) && ("cod" in value || "message" in value);
}

function isForecastResponse(value: unknown): value is OpenWeatherForecastResponse {
  return isObject(value) && Array.isArray((value as { list?: unknown }).list);
}

function buildDailyFromForecast(forecast: OpenWeatherForecastResponse): OpenWeatherDaily[] {
  const tzOffsetSec = forecast.city?.timezone ?? 0;
  const keys: string[] = [];
  const byDay = new Map<
    string,
    { min: number; max: number; icon?: string; description?: string; bestHourDiff: number; dt: number }
  >();

  for (const entry of forecast.list) {
    const local = new Date((entry.dt + tzOffsetSec) * 1000);
    const key = local.toISOString().slice(0, 10);
    const hour = local.getUTCHours();

    let day = byDay.get(key);
    if (!day) {
      day = {
        min: entry.main.temp_min,
        max: entry.main.temp_max,
        bestHourDiff: Number.POSITIVE_INFINITY,
        dt: entry.dt,
      };
      byDay.set(key, day);
      keys.push(key);
    } else {
      day.min = Math.min(day.min, entry.main.temp_min);
      day.max = Math.max(day.max, entry.main.temp_max);
    }

    const diff = Math.abs(hour - 12);
    if (!day.icon || diff < day.bestHourDiff) {
      day.icon = entry.weather?.[0]?.icon;
      day.description = entry.weather?.[0]?.description;
      day.bestHourDiff = diff;
      day.dt = entry.dt;
    }
  }

  return keys.slice(0, 5).map((key) => {
    const day = byDay.get(key)!;
    return {
      dt: day.dt,
      temp: { min: day.min, max: day.max },
      weather: day.icon ? [{ icon: day.icon, description: day.description ?? "" }] : [],
    };
  });
}

function kelvinToFahrenheit(k: number): number {
  return Math.floor((k - 273.15) * (9 / 5) + 32);
}

export default function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const [weatherData, setWeatherData] = useState<WeatherState>(null);

  const weekday = useMemo(() => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], []);

  const [zipcode, setZipcode] = useState<string>("85296");
  const [city, setCity] = useState<string>("Gilbert");
  const [state, setState] = useState<string>("AZ");
  const [newRequest, setNewRequest] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      if (!zipApiKey) throw new Error("Missing VITE_ZIPCODE");
      if (!openApiKey) throw new Error("Missing VITE_OPENAPI");

      const safeZip = isNaN(Number(zipcode)) ? "" : zipcode.trim();

      const locationRes = await fetch(
        `https://app.zipcodebase.com/api/v1/search?apikey=${zipApiKey}&codes=${safeZip}&country=us`
      );
      if (!locationRes.ok) {
        throw new Error(`Zipcodebase error: ${locationRes.status}`);
      }

      const locationData: ZipcodebaseSearchResponse = await locationRes.json();

      const firstMatch = locationData.results?.[safeZip]?.[0];

      if (!firstMatch) {
        setCity("Zip code invalid");
        setState("");
        setWeatherData(null);
        return;
      }

      const { latitude, longitude, city: rCity, state: rState } = firstMatch;

      setCity(rCity);
      setState(rState);

      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${openApiKey}`
      );
      const weatherJson: unknown = await weatherRes.json();

      if (!weatherRes.ok) {
        const message = isOpenWeatherErrorResponse(weatherJson)
          ? `${weatherJson.cod ?? ""} ${weatherJson.message ?? ""}`.trim()
          : `HTTP ${weatherRes.status}`;
        throw new Error(`OpenWeather error: ${message}`);
      }

      if (!isForecastResponse(weatherJson)) {
        throw new Error("OpenWeather response missing forecast list.");
      }

      const fetchedWeather = weatherJson;
      const daily = buildDailyFromForecast(fetchedWeather);

      if (daily.length === 0) {
        throw new Error("OpenWeather forecast list was empty.");
      }

      setWeatherData({ daily });
    };

    fetchData()
      .catch((err) => {
        console.error(err);
        setCity("Error");
        setState("");
        setWeatherData(null);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newRequest]);

  if (loading) {
    return <h5 style={{ textAlign: "center" }}>Loading...</h5>;
  }

  return (
    <div className="App">
      <h1 style={{ textAlign: "center" }}>
        {city !== "Zip code invalid" && city !== "Error" && "5 Day Forecast"}
      </h1>

      <h3>
        {city} {state}
      </h3>

      <TextField
        value={zipcode}
        onChange={(e) => setZipcode(e.target.value)}
      />

      <div style={{ padding: "5px" }}>
        <Button variant="contained" onClick={() => setNewRequest((v) => !v)}>
          Submit
        </Button>
      </div>

      <div className="five-day-container">
        {weatherData?.daily?.map((day, dayIndex) => {
          const date = new Date(day.dt * 1000);
          const dayOfWeek = weekday[date.getDay()];

          const highTemp = kelvinToFahrenheit(day.temp.max);
          const lowTemp = kelvinToFahrenheit(day.temp.min);

          const icon = day.weather?.[0]?.icon;
          const description = day.weather?.[0]?.description ?? "";

          return (
            <div key={dayIndex} className="day-container">
              <h3>{dayOfWeek}</h3>

              {icon && (
                <img
                  src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
                  alt={description}
                  className="weather-icon"
                />
              )}

              <div className="temp-container">
                <h6>{highTemp}&deg;F</h6>
                <h6>{lowTemp}&deg;F</h6>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
