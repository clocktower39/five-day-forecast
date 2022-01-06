import React, { useState, useEffect } from "react";
import { Button, TextField } from '@mui/material';
import "./App.css";

function App() {
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState({});
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const [zipcode, setZipcode] = useState("85296");
  const [city, setCity] = useState("Gilbert");
  const [state, setState] = useState("AZ");
  const [newRequest, setNewRequest] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const locationData = await fetch(
        `http://api.positionstack.com/v1/forward?access_key=${process.env.REACT_APP_POSITIONKEY}&query=${isNaN(Number(zipcode)) || zipcode.length < 5 || zipcode.length > 5 ? "00000" : zipcode}`
      ).then(res => res.json());

      if (locationData.data[0]) {
        const latitude = locationData.data[0].latitude;
        const longitude = locationData.data[0].longitude;
        const locality = locationData.data[0].locality;
        const region_code = locationData.data[0].region_code;

        setCity(locality);
        setState(region_code);

        const data = await fetch(
          `https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely,hourly&appid=${process.env.REACT_APP_OPENAPI}`
        );
        const fetchedWeather = await data.json();

        const fixedDailyLength = {
          ...fetchedWeather,
          daily: fetchedWeather.daily.slice(0, 5),
        };
        setWeatherData(fixedDailyLength);
      }
      else {
        setCity('Zip code invalid');
        setState('');
      }
    };
    fetchData().then(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newRequest]);

  return loading ? (
    <h5 style={{ textAlign: "center" }}>Loading...</h5>
  ) : (
    <div className="App">
      <h1 style={{ textAlign: "center" }}>
        {city} {state} {city !== "Zip code invalid" && "5 Day Forecast"}
      </h1>
      <TextField value={zipcode} onChange={(e) => setZipcode(e.target.value)} />
      <div style={{ padding: '5px' }}><Button variant="contained" onClick={() => setNewRequest(!newRequest)}>Submit</Button></div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {weatherData.daily && weatherData.daily.map((day, dayIndex) => {
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
