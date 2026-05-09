export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb',
    },
  },
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body || {}

    if (!audioBase64) {
      return res.status(400).json({ error: 'Missing audio' })
    }

    const audioBuffer = Buffer.from(audioBase64, 'base64')

    const form = new FormData()
    form.append('model_id', 'scribe_v2')
    form.append('file', new Blob([audioBuffer], { type: mimeType }), mimeType.includes('mp4') ? 'recording.mp4' : 'recording.webm')

    const sttRes = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
      },
      body: form,
    })

    if (!sttRes.ok) {
      const errText = await sttRes.text().catch(() => '')
      return res.status(500).json({ error: errText || 'Transcription failed' })
    }

    const data = await sttRes.json()
    return res.status(200).json({
      text: data.text || '',
      language_code: data.language_code || 'en',
    })
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Transcription failed' })
  }
}
