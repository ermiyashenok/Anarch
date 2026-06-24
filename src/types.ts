export interface Movie {
  id: number;
  title: string;
  name?: string; // For TV shows
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids: number[];
  original_language?: string;
  media_type?: "movie" | "tv";
}

export interface MovieDetails extends Movie {
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  genres: { id: number; name: string }[];
  tagline?: string;
  imdb_id?: string;
}

export interface Cast {
  id: number;
  name: string;
  character: string;
  profile_path: string;
}

export interface Video {
  id: string;
  key: string;
  site: string;
  type: string;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  still_path: string;
  episode_number: number;
  season_number: number;
  vote_average: number;
  air_date: string;
}
