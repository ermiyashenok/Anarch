import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { userId } = req.query;

  if (req.method === 'GET') {
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId parameter is required' });
    }

    try {
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json(data);
    } catch (error: any) {
      console.error('Fetch watchlist error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch watchlist' });
    }
  }

  if (req.method === 'POST') {
    const { userId, movie } = req.body;
    if (!userId || !movie || !movie.id) {
      return res.status(400).json({ error: 'userId and movie details are required' });
    }

    try {
      console.log('Attempting upsert to watchlist table...', { userId, movieId: movie.id });
      const { data, error } = await supabase
        .from('watchlist')
        .upsert([
          {
            user_id: userId,
            movie_id: movie.id,
            title: movie.title || movie.name,
            poster_path: movie.poster_path || null,
            backdrop_path: movie.backdrop_path || null,
            vote_average: movie.vote_average || null,
            release_date: movie.release_date || movie.first_air_date || null,
            media_type: movie.media_type || (movie.title ? 'movie' : 'tv')
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase upsert error:', error);
        throw error;
      }
      console.log('✓ Successfully upserted to watchlist:', data);
      return res.status(200).json(data);
    } catch (error: any) {
      console.error('Add to watchlist error:', error.message);
      return res.status(500).json({ error: 'Failed to save to watchlist', details: error.message });
    }
  }

  if (req.method === 'DELETE') {
    const { userId, movieId } = req.query;
    if (!userId || !movieId) {
      return res.status(400).json({ error: 'userId and movieId are required' });
    }

    try {
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', userId)
        .eq('movie_id', parseInt(movieId as string, 10));

      if (error) throw error;
      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Delete from watchlist error:', error.message);
      return res.status(500).json({ error: 'Failed to delete from watchlist' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
