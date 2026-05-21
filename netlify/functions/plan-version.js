import { getStore } from '@netlify/blobs'

export default async function handler(req, context) {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const store = getStore({ name: 'softball', consistency: 'strong' })
    const raw = await store.get('active-plan', { type: 'text' })

    if (!raw) {
      return Response.json({ version: 0, lastUpdated: null })
    }

    const { version, lastUpdated } = JSON.parse(raw)
    return Response.json({ version, lastUpdated })
  } catch (err) {
    console.error('plan-version error:', err)
    return Response.json({ error: 'Failed to check version' }, { status: 500 })
  }
}

export const config = {
  path: '/api/version',
}
