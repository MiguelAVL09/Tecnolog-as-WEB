document.addEventListener('DOMContentLoaded', () => {
    // ---- CONFIGURACIÓN INICIAL ----
    // Pega tu API Key de WeatherAPI.com aquí.
    const apiKey = '3dbfbca8fa9f48ec91200511250510';

    // ---- ELEMENTOS DEL DOM ----
    const cityInput = document.getElementById('city-input');
    const searchBtn = document.getElementById('search-btn');
    const weatherInfo = document.getElementById('weather-info');
    const forecastContainer = document.getElementById('forecast-container');
    const loader = document.getElementById('loader');
    const errorMessage = document.getElementById('error-message');

    // ---- EVENT LISTENERS ----
    searchBtn.addEventListener('click', () => {
        const city = cityInput.value.trim();
        if (city) {
            fetchWeatherData(city);
        }
    });

    cityInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            const city = cityInput.value.trim();
            if (city) {
                fetchWeatherData(city);
            }
        }
    });
    
    // ---- FUNCIÓN PRINCIPAL PARA OBTENER DATOS (AHORA USA WEATHERAPI) ----
    async function fetchWeatherData(city) {
        showLoader(true);
        hideError();
        hideWeatherInfo();

        // Esta URL obtiene el clima actual y el pronóstico de 5 días en una sola llamada
        const apiUrl = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=5&aqi=no&alerts=no&lang=es`;

        try {
            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error('Ciudad no encontrada.');
            }

            const data = await response.json();
            
            displayCurrentWeather(data);
            displayForecast(data.forecast.forecastday);

        } catch (error) {
            console.error('Error fetching weather data:', error);
            showError();
        } finally {
            showLoader(false);
        }
    }

    // ---- FUNCIONES PARA ACTUALIZAR LA INTERFAZ (ADAPTADAS A LA NUEVA API) ----
    function displayCurrentWeather(data) {
        const current = data.current;
        const location = data.location;

        weatherInfo.innerHTML = `
            <h2>${location.name}, ${location.country}</h2>
            <p class="temperature">${Math.round(current.temp_c)}°C</p>
            <img src="${current.condition.icon}" alt="Icono del clima" class="weather-icon">
            <p class="description">${current.condition.text}</p>
            <div class="weather-details">
                <span>Humedad: ${current.humidity}%</span>
                <span>Viento: ${current.wind_kph} km/h</span>
            </div>
        `;
        weatherInfo.classList.remove('hidden');
    }

    function displayForecast(forecastDays) {
        forecastContainer.innerHTML = ''; // Limpiar pronóstico anterior

        forecastDays.forEach(day => {
            const date = new Date(day.date);
            // Sumamos 1 día porque JS maneja la zona horaria de forma extraña a veces
            date.setDate(date.getDate() + 1); 
            const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });

            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item';
            forecastItem.innerHTML = `
                <p>${dayName}</p>
                <img src="${day.day.condition.icon}" alt="Icono del clima">
                <p>${Math.round(day.day.avgtemp_c)}°C</p>
            `;
            forecastContainer.appendChild(forecastItem);
        });
        forecastContainer.classList.remove('hidden');
    }
    
    // ---- FUNCIONES AUXILIARES (SIN CAMBIOS) ----
    function showLoader(show) {
        loader.classList.toggle('hidden', !show);
    }

    function showError() {
        errorMessage.classList.remove('hidden');
    }

    function hideError() {
        errorMessage.classList.add('hidden');
    }

    function hideWeatherInfo() {
        weatherInfo.classList.add('hidden');
        forecastContainer.classList.add('hidden');
    }
});