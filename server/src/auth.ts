import express from 'express';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize Supabase Client for backend verification
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || ''; // We only need anon key for JWT verification if passing token directly, or service role for admin tasks.
const supabase = createClient(supabaseUrl, supabaseKey);

export const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);

  // Securely verify the JWT against the Supabase Auth server
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(403).json({ error: 'Invalid or expired Supabase token' });
  }

  req.user = user;
  next();
};

export default router;
