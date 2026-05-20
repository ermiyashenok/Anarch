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
        .from('recent_watches')
        .select('*')
        .eq('user_id', userId)
        .order('watched_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json(data);
    } catch (error: any) {
      console.error('Fetch history error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch history' });
    }
  }

  if (req.method === 'POST') {
    const { userId, movie } = req.body;
    if (!userId || !movie || !movie.id) {
      return res.status(400).json({ error: 'userId and movie details are required' });
    }

    try {
      // Check if it's already in history - if so, update watched_at to now
      const { data: existing } = await supabase
        .from('recent_watches')
        .select('id')
        .eq('user_id', userId)
        .eq('movie_id', movie.id)
        .limit(1);

      let result;
      if (existing && existing.length > 0) {
        const { data, error } = await supabase
          .from('recent_watches')
          .update({ watched_at: new Date().toISOString() })
          .eq('id', existing[0].id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('recent_watches')
          .insert([
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
        if (error) throw error;
        result = data;
      }

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Save to history error:', error.message);
      return res.status(500).json({ error: 'Failed to save to history' });
    }
  }

  if (req.method === 'DELETE') {
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    try {
      const { error } = await supabase
        .from('recent_watches')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Clear history error:', error.message);
      return res.status(500).json({ error: 'Failed to clear history' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
