const loading = document.getElementById('loading');
const cityInput = document.getElementById("cityInput");
const cityName = document.getElementById("cityName");
const temperature = document.getElementById("temperature");
const description = document.getElementById("description");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const localTime = document.getElementById("localTime");
const localDate = document.getElementById("localDate");

const weatherCodes = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Rime fog", 51: "Light drizzle", 53: "Moderate drizzle",
  55: "Heavy drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain",
  71: "Light snow", 73: "Snow", 75: "Heavy snow", 80: "Rain showers",
  81: "Heavy showers", 82: "Violent rain", 95: "Thunderstorm", 96: "Thunderstorm with hail"
};

async function geocode(city) {
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}`);
  const data = await res.json();
  return data.results ? data.results[0] : null;
}

async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,windspeed_10m&timezone=auto`;
  const res = await fetch(url);
  return await res.json();
}

function findClosestTimeIndex(times, currentTime) {
  const current = new Date(currentTime).getTime();
  let closestIndex = 0;
  let smallestDiff = Infinity;

  for (let i = 0; i < times.length; i++) {
    const diff = Math.abs(new Date(times[i]).getTime() - current);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      closestIndex = i;
    }
  }
  return closestIndex;
}

async function updateWeatherByCoords(lat, lon, label = "Your Location") {
  loading.style.display = 'block';
  const weather = await fetchWeather(lat, lon);
  const cw = weather.current_weather;
  cityName.innerText = label;
  temperature.innerText = `${Math.round(cw.temperature)}°C`;
  description.innerText = weatherCodes[cw.weathercode] || "Unknown";
  wind.innerText = `${cw.windspeed} km/h`;

  const index = findClosestTimeIndex(weather.hourly.time, cw.time);
  const humidityValue = weather.hourly.relativehumidity_2m[index] || "--";
  humidity.innerText = `${humidityValue}%`;

  const now = new Date(weather.current_weather.time);
  localTime.innerText = `Local Time: ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  localDate.innerText = `Local Date: ${now.toLocaleDateString([], { day: '2-digit', month: 'long', year: 'numeric' })}`;
  loading.style.display = 'none';
}

cityInput.addEventListener("keyup", async (e) => {
  if (e.key === "Enter") {
    const city = cityInput.value.trim();
    if (!city) return;
    cityName.innerText = "Loading...";
    const loc = await geocode(city);
    if (!loc) {
      cityName.innerText = "City not found";
      return;
    }
    updateWeatherByCoords(loc.latitude, loc.longitude, loc.name);
  }
});

navigator.geolocation?.getCurrentPosition(
  pos => updateWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
  err => console.log("Location access denied.")
);
