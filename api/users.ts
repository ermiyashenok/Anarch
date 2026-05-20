import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action, query, userId } = req.query;

  // 1. Search people (accounts) by username
  if (req.method === 'GET' && !action) {
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'search query parameter is required' });
    }

    try {
      // Find users matching search query (excluding password hash)
      const { data, error } = await supabase
        .from('users')
        .select('id, username, created_at')
        .ilike('username', `%${query}%`)
        .limit(10);

      if (error) throw error;
      return res.status(200).json(data);
    } catch (error: any) {
      console.error('Search users error:', error.message);
      return res.status(500).json({ error: 'Failed to search users' });
    }
  }

  // 2. Get Friends List (along with their last watched movie and lists)
  if (req.method === 'GET' && action === 'friends') {
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId parameter is required' });
    }

    try {
      // Select friend relations
      const { data: friendships, error: friendError } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', userId);

      if (friendError) throw friendError;
      if (!friendships || friendships.length === 0) {
        return res.status(200).json([]);
      }

      const friendIds = friendships.map(f => f.friend_id);

      // Fetch profiles of friends
      const { data: friendProfiles, error: profileError } = await supabase
        .from('users')
        .select('id, username')
        .in('id', friendIds);

      if (profileError) throw profileError;

      // For each friend, fetch their last watched movie, watchlist, and history
      const friendsData = await Promise.all((friendProfiles || []).map(async (friend) => {
        // Fetch recent watches
        const { data: history } = await supabase
          .from('recent_watches')
          .select('*')
          .eq('user_id', friend.id)
          .order('watched_at', { ascending: false });

        // Fetch watchlist
        const { data: watchlist } = await supabase
          .from('watchlist')
          .select('*')
          .eq('user_id', friend.id)
          .order('created_at', { ascending: false });

        const lastWatched = history && history.length > 0 ? history[0].title : 'None';

        return {
          id: friend.id,
          name: friend.username,
          lastWatched,
          watched: history || [],
          wishlist: watchlist || []
        };
      }));

      return res.status(200).json(friendsData);
    } catch (error: any) {
      console.error('Fetch friends error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch friends' });
    }
  }

  // 3. Add Friend (make connection)
  if (req.method === 'POST' && action === 'addFriend') {
    const { userId, friendUsername } = req.body;
    if (!userId || !friendUsername) {
      return res.status(400).json({ error: 'userId and friendUsername are required' });
    }

    try {
      // Find the user to add as friend
      const { data: targetUser, error: findError } = await supabase
        .from('users')
        .select('id, username')
        .eq('username', friendUsername)
        .maybeSingle();

      if (findError || !targetUser) {
        return res.status(404).json({ error: `User "${friendUsername}" not found` });
      }

      if (targetUser.id === userId) {
        return res.status(400).json({ error: "You cannot add yourself as a friend" });
      }

      // Add to friends
      const { error: insertError } = await supabase
        .from('friends')
        .upsert([
          {
            user_id: userId,
            friend_id: targetUser.id
          }
        ]);

      if (insertError) throw insertError;

      // Fetch the details of the added friend to return
      const { data: history } = await supabase
        .from('recent_watches')
        .select('*')
        .eq('user_id', targetUser.id)
        .order('watched_at', { ascending: false });

      const { data: watchlist } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', targetUser.id)
        .order('created_at', { ascending: false });

      const lastWatched = history && history.length > 0 ? history[0].title : 'None';

      return res.status(200).json({
        id: targetUser.id,
        name: targetUser.username,
        lastWatched,
        watched: history || [],
        wishlist: watchlist || []
      });
    } catch (error: any) {
      console.error('Add friend error:', error.message);
      return res.status(500).json({ error: 'Failed to add friend' });
    }
  }

  // 4. Remove Friend
  if (req.method === 'DELETE' && action === 'removeFriend') {
    const { userId, friendId } = req.query;
    if (!userId || !friendId) {
      return res.status(400).json({ error: 'userId and friendId are required' });
    }

    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('user_id', userId)
        .eq('friend_id', friendId);

      if (error) throw error;
      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Remove friend error:', error.message);
      return res.status(500).json({ error: 'Failed to remove friend' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
