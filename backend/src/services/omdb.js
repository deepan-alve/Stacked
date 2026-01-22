// OMDb API Service - Uses IMDB data
// Free tier: 1000 requests/day
// Get your own key at: https://www.omdbapi.com/apikey.aspx

const OMDB_API_KEY = process.env.OMDB_API_KEY || "trilogy"; // Default demo key
const OMDB_BASE_URL = "https://www.omdbapi.com";

class OMDbService {
  async search(query) {
    try {
      const response = await fetch(
        `${OMDB_BASE_URL}/?s=${encodeURIComponent(query)}&apikey=${OMDB_API_KEY}`
      );
      const data = await response.json();

      if (data.Response === "False") {
        console.log("OMDb search returned no results:", data.Error);
        return [];
      }

      return (data.Search || []).map((item) => ({
        imdbId: item.imdbID,
        title: item.Title,
        year: item.Year ? parseInt(item.Year) : null,
        type: item.Type === "movie" ? "Movie" : item.Type === "series" ? "Series" : item.Type,
        poster: item.Poster !== "N/A" ? item.Poster : null,
        provider: "omdb",
      }));
    } catch (error) {
      console.error("OMDb Search Error:", error);
      return [];
    }
  }

  async getDetails(imdbId) {
    try {
      const response = await fetch(
        `${OMDB_BASE_URL}/?i=${imdbId}&plot=full&apikey=${OMDB_API_KEY}`
      );
      const data = await response.json();

      if (data.Response === "False") {
        throw new Error(data.Error);
      }

      return {
        imdbId: data.imdbID,
        title: data.Title,
        year: data.Year ? parseInt(data.Year) : null,
        type: data.Type === "movie" ? "Movie" : data.Type === "series" ? "Series" : data.Type,
        poster: data.Poster !== "N/A" ? data.Poster : null,
        plot: data.Plot !== "N/A" ? data.Plot : null,
        rating: data.imdbRating !== "N/A" ? parseFloat(data.imdbRating) : null,
        runtime: data.Runtime !== "N/A" ? data.Runtime : null,
        genres: data.Genre !== "N/A" ? data.Genre.split(", ") : [],
        director: data.Director !== "N/A" ? data.Director : null,
        actors: data.Actors !== "N/A" ? data.Actors : null,
        language: data.Language !== "N/A" ? data.Language : null,
        country: data.Country !== "N/A" ? data.Country : null,
        provider: "omdb",
      };
    } catch (error) {
      console.error("OMDb Details Error:", error);
      throw error;
    }
  }
}

export default new OMDbService();
