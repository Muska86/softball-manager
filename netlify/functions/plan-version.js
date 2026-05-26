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
      .select('version, last_updated')
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return Response.json({ version: 0, lastUpdated: null })
    }

    return Response.json({ version: data.version, lastUpdated: data.last_updated })
  } catch (err) {
    console.error('plan-version error:', err)
    return Response.json({ error: 'Failed to check version' }, { status: 500 })
  }
}

export const config = {
  path: '/api/version',
}
