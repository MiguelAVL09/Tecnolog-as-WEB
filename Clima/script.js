document.addEventListener('DOMContentLoaded', () => {
    
    // ---- CONFIGURACIÓN INICIAL ----
    // Pega tu Token de Acceso de la API (v4 auth) de TMDb aquí.
    const apiToken = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5MmVhNTlkNmY0N2NlNTRhZGYwMzQ1YTRmMWIwOWZkYiIsIm5iZiI6MTc1OTYyMTY5MC42MTYsInN1YiI6IjY4ZTFiMjNhMmE1YTQxZWQyZjYxNzI5NCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.i8OemNzGoyV3jqQu91LPSw8nFwNqRc-4Qq95fqQi5OA';

    // ---- ELEMENTOS DEL DOM ----
    const movieGrid = document.getElementById('movie-grid');
    const loader = document.getElementById('loader');

    // ---- URLS Y OPCIONES DE LA API ----
    const apiUrl = 'https://api.themoviedb.org/3/movie/popular?language=es-MX&page=1';
    const imageBaseUrl = 'https://image.tmdb.org/t/p/w500';

    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            // El token se envía en la cabecera 'Authorization'
            Authorization: `Bearer ${apiToken}`
        }
    };

    // ---- FUNCIÓN PARA OBTENER Y MOSTRAR LAS PELÍCULAS ----
    async function fetchAndDisplayMovies() {
        showLoader(true);
        try {
            const response = await fetch(apiUrl, options);

            if (!response.ok) {
                throw new Error(`Error en la API: ${response.statusText}`);
            }

            const data = await response.json();
            displayMovies(data.results);

        } catch (error) {
            console.error('No se pudieron obtener las películas:', error);
            movieGrid.innerHTML = '<p>Error al cargar las películas. Verifica tu token de API.</p>';
        } finally {
            showLoader(false);
        }
    }

    // ---- FUNCIÓN PARA RENDERIZAR LAS PELÍCULAS EN EL HTML ----
    function displayMovies(movies) {
        movieGrid.innerHTML = ''; // Limpiar el contenedor

        movies.forEach(movie => {
            const movieCard = document.createElement('div');
            movieCard.className = 'movie-card';

            const imageUrl = movie.poster_path ? `${imageBaseUrl}${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image';

            movieCard.innerHTML = `
                <img src="${imageUrl}" alt="${movie.title}">
                <div class="movie-info">
                    <h3>${movie.title}</h3>
                </div>
                <div class="rating">${movie.vote_average.toFixed(1)}</div>
            `;
            
            // Añadimos un evento de clic para abrir la página de la película
            movieCard.addEventListener('click', () => {
                window.open(`https://www.themoviedb.org/movie/${movie.id}`, '_blank');
            });

            movieGrid.appendChild(movieCard);
        });
    }

    // ---- FUNCIÓN AUXILIAR PARA EL LOADER ----
    function showLoader(isLoading) {
        loader.style.display = isLoading ? 'block' : 'none';
    }

    // ---- INICIAR LA APLICACIÓN ----
    fetchAndDisplayMovies();
});