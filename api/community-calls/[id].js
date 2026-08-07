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
      'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
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

export default async function handler(req, { params }) {
  if (req.method === 'OPTIONS') {
    return json(null, 204);
  }

  if (!isAdmin(req)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const supabase = getSupabase();
  if (!supabase) {
    return json({ error: 'Database not configured' }, 500);
  }

  const id = params.id;

  try {
    if (req.method === 'PUT') {
      const body = await req.json();
      const { data, error } = await supabase
        .from('community_calls')
        .update({
          title: body.title,
          description: body.description,
          date: body.date,
          duration_minutes: body.duration_minutes,
          timezone: body.timezone,
          meeting_link: body.meeting_link,
          meeting_link_label: body.meeting_link_label,
          category: body.category,
          max_attendees: body.max_attendees,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return json(data);
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase
        .from('community_calls')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return new Response(null, { status: 204 });
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (err) {
    console.error('Community calls error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
}
