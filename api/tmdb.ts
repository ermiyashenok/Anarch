import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Extract path and original query params
  const { endpoint, ...params } = req.query;
  const API_KEY = process.env.TMDB_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: 'TMDB_API_KEY is not configured on the server.' });
  }

  if (!endpoint || typeof endpoint !== 'string') {
    return res.status(400).json({ error: 'Endpoint parameter is required.' });
  }

  try {
    const response = await axios.get(`https://api.themoviedb.org/3${endpoint}`, {
      params: {
        ...params,
        api_key: API_KEY,
      },
    });

    // Add cache headers for better performance
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error('TMDB Proxy Error:', error.message);
    const status = error.response?.status || 500;
    const data = error.response?.data || { error: 'Failed to fetch from TMDB' };
    return res.status(status).json(data);
  }
}
