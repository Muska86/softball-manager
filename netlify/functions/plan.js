import { getStore } from '@netlify/blobs'

function checkPasscode(req) {
  const provided = req.headers.get('x-passcode')
  return provided === process.env.SITE_PASSCODE
}

export default async function handler(req, context) {
  const store = getStore({ name: 'softball', consistency: 'strong' })

  // GET — return a plan (no auth required)
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    const key = id ? `plan-${id}` : 'active-plan'

    try {
      const raw = await store.get(key, { type: 'text' })
      if (!raw) {
        return Response.json({ error: 'Plan not found' }, { status: 404 })
      }
      return Response.json(JSON.parse(raw))
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
      await store.setJSON(`plan-${plan.gameId}`, plan)
      await store.setJSON('active-plan', plan)

      const raw = await store.get('plan-manifest', { type: 'text' })
      const manifest = raw ? JSON.parse(raw) : []
      const existing = manifest.findIndex((m) => m.id === plan.gameId)
      const entry = { id: plan.gameId, title: plan.title, date: plan.date }
      if (existing >= 0) {
        manifest[existing] = entry
      } else {
        manifest.push(entry)
      }
      await store.setJSON('plan-manifest', manifest)

      return Response.json({ ok: true, version: plan.version })
    } catch (err) {
      console.error('plan POST error:', err)
      return Response.json({ error: 'Failed to save plan' }, { status: 500 })
    }
  }

  return new Response('Method not allowed', { status: 405 })
}

export const config = {
  path: '/api/plan',
}
