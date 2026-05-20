import axios from 'axios';
import { Movie } from '../types';

const api = axios.create({
  baseURL: '',
});

export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  created_at: string;
}

export interface FriendRelation {
  id: string;
  name: string;
  lastWatched: string;
  watched: Movie[];
  wishlist: Movie[];
}

export const dbService = {
  // Auth
  register: async (username: string, password: string, email?: string): Promise<UserProfile> => {
    const { data } = await api.post('/api/auth?action=register', { username, password, email });
    return data.user;
  },

  login: async (username: string, password: string): Promise<UserProfile> => {
    const { data } = await api.post('/api/auth?action=login', { username, password });
    return data.user;
  },

  // Watchlist
  getWatchlist: async (userId: string): Promise<Movie[]> => {
    const { data } = await api.get(`/api/watchlist?userId=${userId}`);
    return data.map((item: any) => ({
      id: item.movie_id,
      title: item.title,
      poster_path: item.poster_path,
      backdrop_path: item.backdrop_path,
      vote_average: item.vote_average,
      release_date: item.release_date,
      media_type: item.media_type
    }));
  },

  addToWatchlist: async (userId: string, movie: Movie): Promise<void> => {
    await api.post('/api/watchlist', { userId, movie });
  },

  removeFromWatchlist: async (userId: string, movieId: number): Promise<void> => {
    await api.delete(`/api/watchlist?userId=${userId}&movieId=${movieId}`);
  },

  // History (Recent watches)
  getHistory: async (userId: string): Promise<Movie[]> => {
    const { data } = await api.get(`/api/history?userId=${userId}`);
    return data.map((item: any) => ({
      id: item.movie_id,
      title: item.title,
      poster_path: item.poster_path,
      backdrop_path: item.backdrop_path,
      vote_average: item.vote_average,
      release_date: item.release_date,
      media_type: item.media_type
    }));
  },

  addToHistory: async (userId: string, movie: Movie): Promise<void> => {
    await api.post('/api/history', { userId, movie });
  },

  clearHistory: async (userId: string): Promise<void> => {
    await api.delete(`/api/history?userId=${userId}`);
  },

  // People & Friends
  searchPeople: async (query: string): Promise<UserProfile[]> => {
    const { data } = await api.get(`/api/users?query=${encodeURIComponent(query)}`);
    return data;
  },

  getFriends: async (userId: string): Promise<FriendRelation[]> => {
    const { data } = await api.get(`/api/users?action=friends&userId=${userId}`);
    return data;
  },

  addFriend: async (userId: string, friendUsername: string): Promise<FriendRelation> => {
    const { data } = await api.post('/api/users?action=addFriend', { userId, friendUsername });
    return data;
  },

  removeFriend: async (userId: string, friendId: string): Promise<void> => {
    await api.delete(`/api/users?action=removeFriend&userId=${userId}&friendId=${friendId}`);
  }
};
