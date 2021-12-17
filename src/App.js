import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState({});
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetch(
        `https://api.openweathermap.org/data/2.5/onecall?lat=41.88&lon=-87.62&exclude=minutely,hourly&appid=41cbd590d4c3346d4debb4594f8068ab`
      );
      const fetchedWeather = await data.json();

      const fixedDailyLength = {
        ...fetchedWeather,
        daily: fetchedWeather.daily.slice(0, 5),
      };
      setWeatherData(fixedDailyLength);
    };
    fetchData().then(() => setLoading(false));
  }, []);

  return loading ? (
    <h5 style={{ textAlign: 'center' }}>Loading...</h5>
  ) : (
    <div className="App">
      <h1 style={{ textAlign: 'center' }}>Chicago 5 Day Forecast</h1>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {weatherData.daily.map((day, dayIndex) => {
            let date = new Date(day.dt * 1000);
            let dayOfWeek = weekday[date.getDay()];

            let convertKelvinToFahrenheit = (k) => Math.floor((k - 273) * (9 / 5) + 32);

            let highTemp = convertKelvinToFahrenheit(day.temp.max);
            let lowTemp = convertKelvinToFahrenheit(day.temp.min);

            return (
              <div
                key={dayIndex}
                style={
                  dayIndex === 0
                    ? { backgroundColor: "#ccc", borderBottom: "1px solid #ccc", padding: "5px" }
                    : dayIndex === 4
                    ? {
                        borderTop: "1px solid #ccc",
                        borderBottom: "1px solid #ccc",
                        borderRight: "1px solid #ccc",
                        padding: "5px",
                      }
                    : {
                        borderTop: "1px solid #ccc",
                        borderBottom: "1px solid #ccc",
                        padding: "5px",
                      }
                }
              >
                <h3>{dayOfWeek}</h3>
                <img
                  src={`http://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`}
                  alt={day.weather[0].descripton}
                  style={{ minHeight: "100px", minWidth: "100px" }}
                />
                <div
                  style={{ display: "flex", flexDirection: "row", justifyContent: "space-around" }}
                >
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

export default App;
