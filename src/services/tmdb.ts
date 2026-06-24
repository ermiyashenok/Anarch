import axios from "axios";
import { Movie, MovieDetails, Cast, Video } from "../types";

const IS_DEV = import.meta.env.DEV;
const BASE_URL = IS_DEV ? "https://api.themoviedb.org/3" : "/api/tmdb";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

const tmdbApi = axios.create({
  baseURL: BASE_URL,
});

// Use interceptor to handle proxying or direct API calls
tmdbApi.interceptors.request.use((config) => {
  if (IS_DEV) {
    // In development, use the key from .env directly
    const key = import.meta.env.VITE_TMDB_API_KEY;
    config.params = {
      ...config.params,
      api_key: key,
    };
  } else if (config.url) {
    // In production, route through Vercel Serverless Function
    config.params = {
      ...config.params,
      endpoint: config.url,
    };
    config.url = "";
  }
  return config;
});

type ImageSize = "w92" | "w154" | "w185" | "w300" | "w500" | "original";
export const getImageUrl = (path: string | null | undefined, size: ImageSize = "w500") => {
  if (!path) return "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=500&auto=format&fit=crop";
  return `${IMAGE_BASE_URL}/${size}${path}`;
};

export const tmdbService = {
  getTrending: async (type: "movie" | "tv" | "all" = "all", page: number = 1): Promise<Movie[]> => {
    const { data } = await tmdbApi.get(`/trending/${type}/week`, { params: { page } });
    return data.results;
  },
  getPopular: async (type: "movie" | "tv" = "movie", page: number = 1): Promise<Movie[]> => {
    const { data } = await tmdbApi.get(`/${type}/popular`, { params: { page } });
    return data.results;
  },
  getTopRated: async (type: "movie" | "tv" = "movie", page: number = 1): Promise<Movie[]> => {
    const { data } = await tmdbApi.get(`/${type}/top_rated`, { params: { page } });
    return data.results;
  },
  getUpcoming: async (page: number = 1): Promise<Movie[]> => {
    const { data } = await tmdbApi.get("/movie/upcoming", { params: { page } });
    return data.results;
  },
  getSeries: async (page: number = 1): Promise<Movie[]> => {
    const { data } = await tmdbApi.get("/tv/on_the_air", { params: { page } });
    return data.results.map((r: any) => ({ ...r, media_type: "tv" }));
  },
  search: async (query: string, page: number = 1): Promise<Movie[]> => {
    const { data } = await tmdbApi.get("/search/multi", {
      params: { query, page },
    });
    return data.results;
  },
  getDetails: async (id: number, type: "movie" | "tv" = "movie"): Promise<MovieDetails> => {
    const { data } = await tmdbApi.get(`/${type}/${id}`, {
      params: { append_to_response: "external_ids" }
    });
    // For movies, imdb_id is in the data. For TV, it's in external_ids
    if (type === "tv" && data.external_ids) {
      data.imdb_id = data.external_ids.imdb_id;
    }
    return data;
  },
  getCredits: async (id: number, type: "movie" | "tv" = "movie"): Promise<Cast[]> => {
    const { data } = await tmdbApi.get(`/${type}/${id}/credits`);
    return data.cast.slice(0, 10);
  },
  getSeasonDetails: async (tvId: number, seasonNumber: number): Promise<any[]> => {
    try {
      const { data } = await tmdbApi.get(`/tv/${tvId}/season/${seasonNumber}`);
      return data.episodes || [];
    } catch {
      return [];
    }
  },
  getVideos: async (id: number, type: "movie" | "tv" = "movie"): Promise<Video[]> => {
    const { data } = await tmdbApi.get(`/${type}/${id}/videos`);
    return data.results;
  },
  getRecommendations: async (id: number, type: "movie" | "tv" = "movie"): Promise<Movie[]> => {
    try {
      const { data } = await tmdbApi.get(`/${type}/${id}/recommendations`);
      return data.results || [];
    } catch {
      return [];
    }
  },
  getGenres: async (type: "movie" | "tv" = "movie"): Promise<{ id: number; name: string }[]> => {
    const { data } = await tmdbApi.get(`/genre/${type}/list`);
    return data.genres;
  },
  getMoviesByGenre: async (genreId: number, type: "movie" | "tv" = "movie", page: number = 1): Promise<Movie[]> => {
    const { data } = await tmdbApi.get(`/discover/${type}`, {
      params: { 
        with_genres: genreId, 
        page,
        sort_by: "popularity.desc",
        "vote_count.gte": 100 // Ensure some quality
      },
    });
    return data.results;
  },
  getTopMoviesForGenre: async (genreId: number, type: "movie" | "tv" = "movie"): Promise<Movie[]> => {
    const { data } = await tmdbApi.get(`/discover/${type}`, {
      params: { 
        with_genres: genreId, 
        sort_by: "vote_average.desc",
        "vote_count.gte": 1000,
        page: 1
      },
    });
    return data.results;
  },
  // Anime: Japanese-language Animation (genre 16) — both movie and TV
  getAnime: async (type: "movie" | "tv" = "tv", page: number = 1): Promise<Movie[]> => {
    const { data } = await tmdbApi.get(`/discover/${type}`, {
      params: {
        with_original_language: "ja",
        with_genres: 16, // Animation genre ID on TMDB
        sort_by: "popularity.desc",
        "vote_count.gte": 50,
        page,
      },
    });
    // Tag TV results so the rest of the app knows the media_type
    if (type === "tv") {
      return data.results.map((r: any) => ({ ...r, media_type: "tv" }));
    }
    return data.results;
  },
  // Search anime — search TMDB then keep only Japanese-language Animation results
  searchAnime: async (query: string): Promise<Movie[]> => {
    // Search both movie and tv in parallel
    const [moviesRes, tvRes] = await Promise.all([
      tmdbApi.get("/search/movie", { params: { query, page: 1 } }),
      tmdbApi.get("/search/tv",    { params: { query, page: 1 } }),
    ]);
    const movies: Movie[] = moviesRes.data.results.map((r: any) => ({ ...r, media_type: "movie" }));
    const tv: Movie[]     = tvRes.data.results.map((r: any) => ({ ...r, media_type: "tv" }));
    // Filter: must be Japanese original language AND include Animation genre (16)
    const isAnime = (item: Movie) =>
      item.original_language === "ja" && (item.genre_ids ?? []).includes(16);
    return [...movies, ...tv].filter(isAnime);
  },
};
