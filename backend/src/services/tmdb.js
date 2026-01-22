// TMDB API Service
const TMDB_API_KEY = "***REMOVED_TMDB_KEY***";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

class TMDBService {
  async searchMovies(query) {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
          query
        )}`
      );
      const data = await response.json();

      return data.results.map((movie) => ({
        id: movie.id,
        title: movie.title,
        year: movie.release_date
          ? new Date(movie.release_date).getFullYear()
          : null,
        poster: movie.poster_path
          ? `${TMDB_IMAGE_BASE}${movie.poster_path}`
          : null,
        overview: movie.overview,
        rating: movie.vote_average,
        releaseDate: movie.release_date,
        type: "Movie",
        provider: "tmdb",
      }));
    } catch (error) {
      console.error("TMDB Movie Search Error:", error);
      throw new Error("Failed to search movies");
    }
  }

  async searchTVShows(query) {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
          query
        )}`
      );
      const data = await response.json();

      return data.results.map((show) => ({
        id: show.id,
        title: show.name,
        year: show.first_air_date
          ? new Date(show.first_air_date).getFullYear()
          : null,
        poster: show.poster_path
          ? `${TMDB_IMAGE_BASE}${show.poster_path}`
          : null,
        overview: show.overview,
        rating: show.vote_average,
        releaseDate: show.first_air_date,
        type: "Series",
        provider: "tmdb",
      }));
    } catch (error) {
      console.error("TMDB TV Search Error:", error);
      throw new Error("Failed to search TV shows");
    }
  }

  async getMovieDetails(id) {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}`
      );
      const data = await response.json();

      return {
        id: data.id,
        title: data.title,
        year: data.release_date
          ? new Date(data.release_date).getFullYear()
          : null,
        poster: data.poster_path
          ? `${TMDB_IMAGE_BASE}${data.poster_path}`
          : null,
        overview: data.overview,
        rating: data.vote_average,
        releaseDate: data.release_date,
        runtime: data.runtime,
        genres: data.genres,
        type: "Movie",
        provider: "tmdb",
      };
    } catch (error) {
      console.error("TMDB Movie Details Error:", error);
      throw new Error("Failed to get movie details");
    }
  }

  async getTVDetails(id) {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/tv/${id}?api_key=${TMDB_API_KEY}`
      );
      const data = await response.json();

      return {
        id: data.id,
        title: data.name,
        year: data.first_air_date
          ? new Date(data.first_air_date).getFullYear()
          : null,
        poster: data.poster_path
          ? `${TMDB_IMAGE_BASE}${data.poster_path}`
          : null,
        overview: data.overview,
        rating: data.vote_average,
        releaseDate: data.first_air_date,
        seasons: data.number_of_seasons,
        genres: data.genres,
        type: "Series",
        provider: "tmdb",
      };
    } catch (error) {
      console.error("TMDB TV Details Error:", error);
      throw new Error("Failed to get TV show details");
    }
  }

  async searchMulti(query) {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
          query
        )}`
      );
      const data = await response.json();

      return data.results
        .filter((item) => item.media_type === "movie" || item.media_type === "tv")
        .map((item) => {
          const isMovie = item.media_type === "movie";
          return {
            id: item.id,
            title: isMovie ? item.title : item.name,
            year: isMovie
              ? item.release_date
                ? new Date(item.release_date).getFullYear()
                : null
              : item.first_air_date
              ? new Date(item.first_air_date).getFullYear()
              : null,
            poster: item.poster_path
              ? `${TMDB_IMAGE_BASE}${item.poster_path}`
              : null,
            plot: item.overview,
            rating: item.vote_average,
            type: isMovie ? "Movie" : "Series",
            provider: "tmdb",
          };
        });
    } catch (error) {
      console.error("TMDB Multi Search Error:", error);
      throw new Error("Failed to search");
    }
  }
}

export default new TMDBService();
