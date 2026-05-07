import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { messages, system, language, tts } = req.body

    // Log conversation to Supabase (non-blocking)
    supabase.from('conversations').insert({
      language: language || 'en',
      type: 'chat'
    }).then(() => {}).catch(() => {})

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system,
      messages,
    })

    const text = response.content[0]?.text || ''

    // ElevenLabs TTS — only for English and Pidgin
    if (tts && (language === 'en' || language === 'pc')) {
      try {
        const voiceRes = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
          {
            method: 'POST',
            headers: {
              'xi-api-key': process.env.ELEVENLABS_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: text.slice(0, 1000),
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

        if (voiceRes.ok) {
          const audioBuffer = await voiceRes.arrayBuffer()
          const audioBase64 = Buffer.from(audioBuffer).toString('base64')
          return res.status(200).json({
            content: [{ type: 'text', text }],
            audio: audioBase64,
          })
        }
      } catch (e) {
        // ElevenLabs failed — return text only, no crash
      }
    }

    return res.status(200).json({ content: [{ type: 'text', text }] })

  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ error: error.message })
  }
}
