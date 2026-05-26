import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
}

function checkPasscode(req) {
  return req.headers.get('x-passcode') === process.env.SITE_PASSCODE
}

export default async function handler(req) {
  const supabase = getSupabase()

  // GET — return a plan (no auth required)
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    try {
      let query = supabase.from('plans').select('data')
      if (id) {
        query = query.eq('game_id', id)
      } else {
        query = query.eq('is_active', true)
      }
      const { data, error } = await query.single()
      if (error || !data) {
        return Response.json({ error: 'Plan not found' }, { status: 404 })
      }
      return Response.json(data.data)
    } catch (err) {
      console.error('plan GET error:', err)
      return Response.json({ error: 'Failed to load plan' }, { status: 500 })
    }
  }

  // POST — save a plan (passcode required)
  if (req.method === 'POST') {
    if (!checkPasscode(req)) {
      return Response.json({ error: 'Invalid passcode' }, { status: 401 })
    }

    let plan
    try {
      plan = await req.json()
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (!plan.gameId) {
      return Response.json({ error: 'Missing gameId' }, { status: 400 })
    }

    plan.version = (plan.version || 0) + 1
    plan.lastUpdated = new Date().toISOString()

    try {
      // Clear current active flag
      await supabase.from('plans').update({ is_active: false }).eq('is_active', true)

      // Upsert this plan as active
      const { error } = await supabase.from('plans').upsert({
        game_id: plan.gameId,
        title: plan.title,
        date: plan.date,
        data: plan,
        version: plan.version,
        last_updated: plan.lastUpdated,
        is_active: true,
      })
      if (error) throw error

      return Response.json({ ok: true, version: plan.version })
    } catch (err) {
      console.error('plan POST error:', err)
      return Response.json({ error: 'Failed to save plan' }, { status: 500 })
    }
  }

  // DELETE — remove a plan (passcode required)
  if (req.method === 'DELETE') {
    if (!checkPasscode(req)) {
      return Response.json({ error: 'Invalid passcode' }, { status: 401 })
    }
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) {
      return Response.json({ error: 'Missing id' }, { status: 400 })
    }
    try {
      const { data: existing } = await supabase
        .from('plans').select('is_active').eq('game_id', id).single()

      const { error } = await supabase.from('plans').delete().eq('game_id', id)
      if (error) throw error

      // If the deleted plan was active, promote the most recent remaining plan
      if (existing?.is_active) {
        const { data: remaining } = await supabase
          .from('plans').select('game_id').order('date', { ascending: false }).limit(1)
        if (remaining?.length > 0) {
          await supabase.from('plans').update({ is_active: true }).eq('game_id', remaining[0].game_id)
        }
      }

      return Response.json({ ok: true })
    } catch (err) {
      console.error('plan DELETE error:', err)
      return Response.json({ error: 'Failed to delete plan' }, { status: 500 })
    }
  }

  return new Response('Method not allowed', { status: 405 })
}

export const config = {
  path: '/api/plan',
}
