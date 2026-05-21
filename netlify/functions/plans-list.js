import { getStore } from '@netlify/blobs'

export default async function handler(req, context) {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const store = getStore({ name: 'softball', consistency: 'strong' })
    const raw = await store.get('plan-manifest', { type: 'text' })

    if (!raw) {
      return Response.json([])
    }

    const manifest = JSON.parse(raw)
    // Sort newest first
    manifest.sort((a, b) => new Date(b.date) - new Date(a.date))

    return Response.json(manifest)
  } catch (err) {
    console.error('plans-list error:', err)
    return Response.json([], { status: 500 })
  }
}

export const config = {
  path: '/api/plans',
}
