import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
}

function checkPasscode(req) {
  return req.headers.get('x-passcode') === process.env.SITE_PASSCODE
}

export default async function handler(req) {
  const supabase = getSupabase()

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase.from('roster').select('*').eq('id', 1).single()
      if (error || !data) {
        return Response.json({ roster: [], preferences: {} })
      }
      return Response.json({ roster: data.roster, preferences: data.preferences })
    } catch (err) {
      console.error('roster GET error:', err)
      return Response.json({ roster: [], preferences: {} }, { status: 500 })
    }
  }

  if (req.method === 'POST') {
    if (!checkPasscode(req)) {
      return Response.json({ error: 'Invalid passcode' }, { status: 401 })
    }
    let body
    try {
      body = await req.json()
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    if (!Array.isArray(body.roster)) {
      return Response.json({ error: 'roster must be an array' }, { status: 400 })
    }
    try {
      // Fetch existing preferences if not supplied in body
      let preferences = body.preferences
      if (preferences === undefined) {
        const { data } = await supabase.from('roster').select('preferences').eq('id', 1).single()
        preferences = data?.preferences ?? {}
      }

      const { error } = await supabase.from('roster').upsert({
        id: 1,
        roster: body.roster,
        preferences,
      })
      if (error) throw error

      return Response.json({ ok: true })
    } catch (err) {
      console.error('roster POST error:', err)
      return Response.json({ error: 'Failed to save roster' }, { status: 500 })
    }
  }

  return new Response('Method not allowed', { status: 405 })
}

export const config = {
  path: '/api/roster',
}
