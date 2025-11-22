// AniList GraphQL API Service
const ANILIST_API_URL = "https://graphql.anilist.co";

class AniListService {
  async searchAnime(query) {
    const graphqlQuery = `
      query ($search: String) {
        Page(page: 1, perPage: 10) {
          media(search: $search, type: ANIME) {
            id
            title {
              romaji
              english
              native
            }
            coverImage {
              large
              medium
            }
            description
            averageScore
            startDate {
              year
              month
              day
            }
            episodes
            season
            seasonYear
          }
        }
      }
    `;

    try {
      const response = await fetch(ANILIST_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query: graphqlQuery,
          variables: { search: query },
        }),
      });

      const data = await response.json();

      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      return data.data.Page.media.map((anime) => ({
        id: anime.id,
        title: anime.title.english || anime.title.romaji,
        titleAlt: anime.title.romaji,
        year: anime.startDate?.year,
        poster: anime.coverImage.large || anime.coverImage.medium,
        overview: anime.description
          ? anime.description.replace(/<[^>]*>/g, "")
          : "",
        rating: anime.averageScore ? anime.averageScore / 10 : null,
        releaseDate: anime.startDate?.year
          ? `${anime.startDate.year}-${anime.startDate.month || 1}-${
              anime.startDate.day || 1
            }`
          : null,
        episodes: anime.episodes,
        season: 1,
        type: "Anime",
        provider: "anilist",
      }));
    } catch (error) {
      console.error("AniList Search Error:", error);
      throw new Error("Failed to search anime");
    }
  }

  async getAnimeDetails(id) {
    const graphqlQuery = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            large
            extraLarge
          }
          description
          averageScore
          startDate {
            year
            month
            day
          }
          episodes
          duration
          season
          seasonYear
          genres
          studios {
            nodes {
              name
            }
          }
        }
      }
    `;

    try {
      const response = await fetch(ANILIST_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query: graphqlQuery,
          variables: { id: parseInt(id) },
        }),
      });

      const data = await response.json();

      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      const anime = data.data.Media;
      return {
        id: anime.id,
        title: anime.title.english || anime.title.romaji,
        titleAlt: anime.title.romaji,
        year: anime.startDate?.year,
        poster: anime.coverImage.extraLarge || anime.coverImage.large,
        overview: anime.description
          ? anime.description.replace(/<[^>]*>/g, "")
          : "",
        rating: anime.averageScore ? anime.averageScore / 10 : null,
        releaseDate: anime.startDate?.year
          ? `${anime.startDate.year}-${anime.startDate.month || 1}-${
              anime.startDate.day || 1
            }`
          : null,
        episodes: anime.episodes,
        duration: anime.duration,
        genres: anime.genres,
        studios: anime.studios.nodes.map((s) => s.name),
        type: "Anime",
        provider: "anilist",
      };
    } catch (error) {
      console.error("AniList Details Error:", error);
      throw new Error("Failed to get anime details");
    }
  }
}

export default new AniListService();
