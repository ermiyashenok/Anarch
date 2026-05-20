import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './db';
import { hashPassword, verifyPassword } from './crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action } = req.query;

  if (req.method === 'POST') {
    if (action === 'register') {
      const { username, password, email } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      try {
        // Check if user already exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('username', username)
          .maybeSingle();

        if (existingUser) {
          return res.status(400).json({ error: 'Username is already taken' });
        }

        const hashedPassword = hashPassword(password);

        const { data, error } = await supabase
          .from('users')
          .insert([
            {
              username,
              password_hash: hashedPassword,
              email: email || null,
            }
          ])
          .select('id, username, email, created_at')
          .single();

        if (error) throw error;

        return res.status(201).json({ user: data });
      } catch (error: any) {
        console.error('Registration error:', error.message);
        return res.status(500).json({ error: error.message || 'Failed to register user' });
      }
    }

    if (action === 'login') {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      try {
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('username', username)
          .maybeSingle();

        if (error || !user) {
          return res.status(400).json({ error: 'Invalid username or password' });
        }

        const isValid = verifyPassword(password, user.password_hash);
        if (!isValid) {
          return res.status(400).json({ error: 'Invalid username or password' });
        }

        // Return user info (excluding password hash)
        return res.status(200).json({
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            created_at: user.created_at
          }
        });
      } catch (error: any) {
        console.error('Login error:', error.message);
        return res.status(500).json({ error: 'Internal server error during login' });
      }
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
