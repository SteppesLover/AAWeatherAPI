document.addEventListener("DOMContentLoaded", () => {
    const OPEN_METEO = "https://api.open-meteo.com/v1/forecast";

    const cityInput = document.getElementById("city_input"),
        searchBtn = document.getElementById("searchBtn"),
        locationBtn = document.getElementById("locationBtn");

    const weatherIcons = {
        sunny: "sunny.png",  
        cloudy: "cloudy.png", 
        rain: "rainy.png",    
        foggy: "foggy.png",
        freezing_rain: "freezing_raing.png",
        snowfall: "snowfall.png",
        thunderstorm: "thunderstorm.png"
    };
        
        function getWeatherIcon(weatherCode) {
            if (weatherCode === 0) return weatherIcons.sunny; 
            if ([1, 2, 3].includes(weatherCode)) return weatherIcons.cloudy; 
            if ([45, 48].includes(weatherCode)) return weatherIcons.foggy;
            if ([56,57, 66, 67, 77].includes(weatherCode)) return weatherIcons.freezing_dizzle;
            if ([51, 53, 55, 61, 63, 65].includes(weatherCode)) return weatherIcons.rain; 
            if ([71, 73, 75].includes(weatherCode)) return weatherIcons.snowfall; 
            if ([95, 96, 99].includes(weatherCode)) return weatherIcons.thunderstorm; 
            return weatherIcons.cloudy;
        }
        
    async function getCityCoordinates() {
        const cityName = cityInput.value.trim();
        cityInput.value = "";
        if (!cityName) return;

        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${cityName}`);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const { latitude, longitude, name, country } = data.results[0];
            getWeatherDetails(name, latitude, longitude, country);
        } else {
            alert(`Failed to fetch coordinates of ${cityName}`);
        }
    }

    function getWeatherDetails(name, lat, lon, country) {
        document.getElementById("currentForecast").innerHTML = `${name}, ${country}`;
        getCurrentForecast(lat, lon);
        getHourlyForecast(lat, lon);
        getDailyForecast(lat, lon);
        getSunriseSunset(lat, lon);
    }

    async function getCurrentForecast(lat, lon) {
        const response = await fetch(`${OPEN_METEO}?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,weathercode&timezone=auto`);
        const data = await response.json();
        const now = new Date(data.current_weather.time);
        const formattedTime = now.toLocaleString([], { weekday: 'long', hour: '2-digit', minute: '2-digit' });
        const weatherCode = data.current_weather.weathercode; 
        const weatherIcon = getWeatherIcon(weatherCode); 
        document.getElementById("currentForecast").innerHTML = `
            <p>Now weather</p>
            <img src="${weatherIcon}" alt="Weather Icon">
            <h2>${data.current_weather.temperature}&deg;C</h2>
            <p>${formattedTime}</p>
        `;
    }
    
    async function getHourlyForecast(lat, lon) {
        const response = await fetch(`${OPEN_METEO}?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode&timezone=auto`);
        const data = await response.json();
    
        const hourlyData = data.hourly.temperature_2m.slice(0, 24).filter((_, index) => index % 2 === 0);
        const times = data.hourly.time.slice(0, 24).filter((_, index) => index % 2 === 0);
        const weatherCodes = data.hourly.weathercode.slice(0, 24).filter((_, index) => index % 2 === 0);
    
        document.getElementById("hourlyForecast").innerHTML = hourlyData
            .map((temp, index) => {
                const hour = new Date(times[index]);
                const formattedHour = hour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const weatherIcon = getWeatherIcon(weatherCodes[index]);
                return `
                    <div class="card">
                        <p>${formattedHour}</p>
                        <img src="${weatherIcon}" alt="Weather Icon">
                        <p>${temp}&deg;C</p>
                    </div>
                `;
            })
            .join("");
    }
    
    async function getDailyForecast(lat, lon) {
        const response = await fetch(`${OPEN_METEO}?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`);
        const data = await response.json();
    
        const dailyMax = data.daily.temperature_2m_max.slice(0, 7);
        const dailyMin = data.daily.temperature_2m_min.slice(0, 7);
        const dates = data.daily.time.slice(0, 7);
        const weatherCodes = data.daily.weathercode.slice(0, 7);
    
        document.getElementById("dailyForecast").innerHTML = dailyMax
            .map((tempMax, index) => {
                const date = new Date(dates[index]);
                const formattedDate = date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
                const weatherIcon = getWeatherIcon(weatherCodes[index]); 
                return `
                    <div class="card">
                        <p>${formattedDate}</p>
                        <img src="${weatherIcon}" alt="Weather Icon">
                        <p>${tempMax}&deg;C / ${dailyMin[index]}&deg;C</p>
                    </div>
                `;
            })
            .join("");
    }

    async function getSunriseSunset(lat, lon) {
        const response = await fetch(`${OPEN_METEO}?latitude=${lat}&longitude=${lon}&daily=sunrise,sunset&timezone=auto`);
        const data = await response.json();
        document.getElementById("sunriseSunset").innerHTML = `
            <div class="item">
                <div class="icon">
                    <i class="fas fa-sun fa-4x"></i>
                </div>
                <p>Sunrise</p>
                <h2>${data.daily.sunrise[0]}</h2>
            </div>
            <div class="item">
                <div class="icon">
                    <i class="fas fa-moon fa-4x"></i>
                </div>
                <p>Sunset</p>
                <h2>${data.daily.sunset[0]}</h2>
            </div>
        `;
    }

    searchBtn.addEventListener("click", getCityCoordinates);
    locationBtn.addEventListener("click", () => navigator.geolocation.getCurrentPosition(
        position => getWeatherDetails("Current Location", position.coords.latitude, position.coords.longitude, ""),
        () => alert("Location access denied.")
    ));
});