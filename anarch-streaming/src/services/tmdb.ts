import axios from "axios";
import { Movie, MovieDetails, Cast, Video } from "../types";

const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

const getApiKey = () => {
  return "0e3de8096e149b33d945f3b2684d9cdd";
};

const tmdbApi = axios.create({
  baseURL: BASE_URL,
});

// Use interceptor to add API key to every request
tmdbApi.interceptors.request.use((config) => {
  const key = getApiKey();
  if (!key) {
    throw new Error("TMDB_API_KEY_MISSING");
  }
  config.params = {
    ...config.params,
    api_key: key,
  };
  return config;
});

export const getImageUrl = (path: string | null | undefined, size: "w500" | "original" = "w500") => {
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
  getVideos: async (id: number, type: "movie" | "tv" = "movie"): Promise<Video[]> => {
    const { data } = await tmdbApi.get(`/${type}/${id}/videos`);
    return data.results;
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
};
