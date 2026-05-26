import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
}

export default async function handler(req) {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('plans')
      .select('game_id, title, date')
      .order('date', { ascending: false })

    if (error) throw error

    const manifest = (data || []).map((r) => ({ id: r.game_id, title: r.title, date: r.date }))
    return Response.json(manifest)
  } catch (err) {
    console.error('plans-list error:', err)
    return Response.json([], { status: 500 })
  }
}

export const config = {
  path: '/api/plans',
}
