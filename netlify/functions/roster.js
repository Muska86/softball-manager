import { getStore } from '@netlify/blobs'

function checkPasscode(req) {
  return req.headers.get('x-passcode') === process.env.SITE_PASSCODE
}

export default async function handler(req, context) {
  const store = getStore({ name: 'softball', consistency: 'strong' })

  if (req.method === 'GET') {
    try {
      const raw = await store.get('roster', { type: 'text' })
      return Response.json(raw ? JSON.parse(raw) : { roster: [], preferences: {} })
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
      const existing = await store.get('roster', { type: 'text' }).catch(() => null)
      const current = existing ? JSON.parse(existing) : {}
      await store.setJSON('roster', {
        roster: body.roster,
        preferences: body.preferences ?? current.preferences ?? {},
      })
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
