document.addEventListener('DOMContentLoaded', () => {
    // ---- CONFIGURACIÓN INICIAL ----
    // Pega tu API Key de OpenWeatherMap aquí. ¡Es crucial para que funcione!
    const apiKey = '784dca6a594643137304d1166a7f3a43'; 

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
    
    // ---- FUNCIÓN PRINCIPAL PARA OBTENER DATOS DEL CLIMA ----
    async function fetchWeatherData(city) {
        // Mostrar loader y ocultar información previa
        showLoader(true);
        hideError();
        hideWeatherInfo();

        const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=es`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric&lang=es`;

        try {
            // Realizar ambas peticiones a la API en paralelo
            const [currentWeatherResponse, forecastResponse] = await Promise.all([
                fetch(currentWeatherUrl),
                fetch(forecastUrl)
            ]);

            if (!currentWeatherResponse.ok || !forecastResponse.ok) {
                throw new Error('Ciudad no encontrada o error en la API');
            }

            const currentWeatherData = await currentWeatherResponse.json();
            const forecastData = await forecastResponse.json();
            
            // Mostrar los datos en la UI
            displayCurrentWeather(currentWeatherData);
            displayForecast(forecastData);

        } catch (error) {
            console.error('Error fetching weather data:', error);
            showError();
        } finally {
            // Ocultar el loader al finalizar
            showLoader(false);
        }
    }

    // ---- FUNCIONES PARA ACTUALIZAR LA INTERFAZ ----
    function displayCurrentWeather(data) {
        weatherInfo.innerHTML = `
            <h2>${data.name}, ${data.sys.country}</h2>
            <p class="temperature">${Math.round(data.main.temp)}°C</p>
            <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="Icono del clima" class="weather-icon">
            <p class="description">${data.weather[0].description}</p>
            <div class="weather-details">
                <span>Humedad: ${data.main.humidity}%</span>
                <span>Viento: ${data.wind.speed} m/s</span>
            </div>
        `;
        weatherInfo.classList.remove('hidden');
    }

    function displayForecast(data) {
        forecastContainer.innerHTML = ''; // Limpiar pronóstico anterior

        // Filtrar para obtener un pronóstico por día (a mediodía)
        const dailyForecasts = data.list.filter(item => item.dt_txt.includes("12:00:00"));

        dailyForecasts.forEach(forecast => {
            const date = new Date(forecast.dt * 1000);
            const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });

            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item';
            forecastItem.innerHTML = `
                <p>${dayName}</p>
                <img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png" alt="Icono del clima">
                <p>${Math.round(forecast.main.temp)}°C</p>
            `;
            forecastContainer.appendChild(forecastItem);
        });
        forecastContainer.classList.remove('hidden');
    }
    
    // ---- FUNCIONES AUXILIARES PARA MOSTRAR/OCULTAR ELEMENTOS ----
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