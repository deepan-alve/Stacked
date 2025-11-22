// Open Library API Service
const OPENLIBRARY_BASE_URL = "https://openlibrary.org";
const OPENLIBRARY_COVERS_URL = "https://covers.openlibrary.org/b";

class OpenLibraryService {
  async searchBooks(query) {
    try {
      const response = await fetch(
        `${OPENLIBRARY_BASE_URL}/search.json?q=${encodeURIComponent(
          query
        )}&limit=10`
      );

      const data = await response.json();

      if (!data.docs || data.docs.length === 0) {
        return [];
      }

      return data.docs.map((book) => ({
        id: book.key,
        title: book.title,
        author: book.author_name ? book.author_name[0] : "Unknown",
        year: book.first_publish_year,
        poster: book.cover_i
          ? `${OPENLIBRARY_COVERS_URL}/id/${book.cover_i}-L.jpg`
          : null,
        overview: book.first_sentence ? book.first_sentence[0] : "",
        rating: null,
        releaseDate: book.first_publish_year
          ? `${book.first_publish_year}-01-01`
          : null,
        isbn: book.isbn ? book.isbn[0] : null,
        publisher: book.publisher ? book.publisher[0] : null,
        type: "Book",
        provider: "openlibrary",
      }));
    } catch (error) {
      console.error("Open Library Search Error:", error);
      throw new Error("Failed to search books");
    }
  }

  async getBookDetails(workId) {
    try {
      // Remove /works/ prefix if present
      const cleanId = workId.replace("/works/", "");

      const response = await fetch(
        `${OPENLIBRARY_BASE_URL}/works/${cleanId}.json`
      );
      const data = await response.json();

      // Get cover ID from covers array
      const coverId =
        data.covers && data.covers.length > 0 ? data.covers[0] : null;

      return {
        id: data.key,
        title: data.title,
        author:
          data.authors && data.authors.length > 0
            ? await this.getAuthorName(data.authors[0].author.key)
            : "Unknown",
        year: data.created?.value
          ? new Date(data.created.value).getFullYear()
          : null,
        poster: coverId
          ? `${OPENLIBRARY_COVERS_URL}/id/${coverId}-L.jpg`
          : null,
        overview:
          typeof data.description === "string"
            ? data.description
            : data.description?.value || "",
        rating: null,
        releaseDate: data.created?.value
          ? new Date(data.created.value).toISOString().split("T")[0]
          : null,
        subjects: data.subjects || [],
        type: "Book",
        provider: "openlibrary",
      };
    } catch (error) {
      console.error("Open Library Details Error:", error);
      throw new Error("Failed to get book details");
    }
  }

  async getAuthorName(authorKey) {
    try {
      const response = await fetch(`${OPENLIBRARY_BASE_URL}${authorKey}.json`);
      const data = await response.json();
      return data.name || "Unknown";
    } catch (error) {
      console.error("Author Name Error:", error);
      return "Unknown";
    }
  }
}

export default new OpenLibraryService();
