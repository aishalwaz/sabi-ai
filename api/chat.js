import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

function cleanTextForTTS(text) {
  return (text || '')
    .replace(/\s+/g, ' ')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim()
    .slice(0, 1200)
}

async function generateElevenLabsAudio(text) {
  const voiceId = process.env.ELEVENLABS_VOICE_ID
  const apiKey = process.env.ELEVENLABS_API_KEY

  if (!voiceId || !apiKey || !text) return null

  const voiceRes = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: cleanTextForTTS(text),
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
        },
      }),
    }
  )

  if (!voiceRes.ok) return null

  const audioBuffer = await voiceRes.arrayBuffer()
  return Buffer.from(audioBuffer).toString('base64')
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      messages,
      system,
      language = 'en',
      tts = true,
      communityId = 'bitcoin-abuja',
    } = req.body || {}

    if (!Array.isArray(messages) || !system) {
      return res.status(400).json({ error: 'Missing messages or system prompt' })
    }

    supabase
      .from('conversations')
      .insert({
        language,
        type: 'chat',
        community_id: communityId,
      })
      .then(() => {})
      .catch(() => {})

    const model = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5'

    const response = await anthropic.messages.create({
      model,
      max_tokens: 1024,
      system,
      messages,
    })

    const text = response.content?.[0]?.text || ''

    if (tts) {
      const audio = await generateElevenLabsAudio(text)
      return res.status(200).json({
        content: [{ type: 'text', text }],
        audio,
      })
    }

    return res.status(200).json({
      content: [{ type: 'text', text }],
    })
  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({
      error: error?.message || 'Internal server error',
    })
  }
}
