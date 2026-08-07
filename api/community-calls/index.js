import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-admin-key',
    },
  });
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function isAdmin(req) {
  const key = req.headers.get('x-admin-key');
  return key === (process.env.ADMIN_API_KEY || 'moi-admin-key');
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return json(null, 204);
  }

  const supabase = getSupabase();
  if (!supabase) {
    return json({ error: 'Database not configured' }, 500);
  }

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('community_calls')
        .select('*')
        .order('date', { ascending: true });
      if (error) throw error;
      return json(data || []);
    }

    if (req.method === 'POST') {
      if (!isAdmin(req)) return json({ error: 'Unauthorized' }, 401);
      const body = await req.json();
      if (!body.title || !body.date) {
        return json({ error: 'title and date are required' }, 400);
      }
      const { data, error } = await supabase
        .from('community_calls')
        .insert({
          title: body.title,
          description: body.description,
          date: body.date,
          duration_minutes: body.duration_minutes || 60,
          timezone: body.timezone || 'UTC',
          meeting_link: body.meeting_link,
          meeting_link_label: body.meeting_link_label,
          category: body.category || 'dev_call',
          max_attendees: body.max_attendees,
        })
        .select()
        .single();
      if (error) throw error;
      return json(data, 201);
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (err) {
    console.error('Community calls error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
}
