import { useState, useEffect, useRef } from 'react'

async function fetchBTC() {
  try {
    const r = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,ngn'
    )
    const d = await r.json()
    if (d?.bitcoin?.usd) return d.bitcoin
  } catch (e) {
    console.warn('BTC fetch failed, using fallback', e)
  }
  return { usd: 96300, ngn: 154000000 }
}

function speak(text) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const clean = text.replace(/[①②③④⑤⑥⑦⑧→₿⚡●#*•]/g, ' ')
  const utterance = new SpeechSynthesisUtterance(clean)
  utterance.rate = 0.9
  utterance.pitch = 1.0
  window.speechSynthesis.speak(utterance)
}

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = () => res(reader.result.split(',')[1])
    reader.onerror = () => rej(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

async function sendToAI(conversationHistory, btc) {
  const satN  = btc ? (btc.ngn / 100000000).toFixed(2) : '1.54'
  const kSat  = btc ? Math.round(btc.ngn / 100000).toLocaleString() : '1,540'
  const tenK  = btc ? Math.round(btc.ngn / 10000).toLocaleString() : '15,400'
  const hundK = btc ? Math.round(btc.ngn / 1000).toLocaleString() : '154,000'
  const usd   = btc ? btc.usd.toLocaleString() : '96,300'
  const ngnM  = btc ? (btc.ngn / 1000000).toFixed(0) : '154'

  const systemPrompt = `You are Sabi — the AI guide for Bitcoin Abuja, a Bitcoin circular economy community in Abuja, Nigeria built on the Fedi app.

CRITICAL INSTRUCTION — LANGUAGE:
You MUST detect the language the user is writing in and respond in THAT EXACT LANGUAGE.
- If they write in Hausa → respond fully in Hausa
- If they write in Yoruba → respond fully in Yoruba
- If they write in Igbo → respond fully in Igbo
- If they write in Nigerian Pidgin → respond fully in Pidgin
- If they write in English → respond in English
- If they mix languages → match their primary language
Never respond in a different language than what the user wrote in.

PERSONALITY:
You are warm, direct, and knowledgeable — like a trusted friend from Abuja who uses Bitcoin every day. You are not a generic chatbot. You speak like a real Nigerian. You are concise because this is a mobile app. No walls of text. No unnecessary filler.

LIVE BITCOIN PRICES (use these exact numbers — they are current):
- 1 satoshi = ₦${satN}
- 1,000 sats = ₦${kSat}
- 10,000 sats = ₦${tenK}
- 100,000 sats = ₦${hundK}
- 1 full Bitcoin = $${usd} USD = ₦${ngnM}M NGN

KEY KNOWLEDGE:

HOW TO BUY BITCOIN WITH NAIRA ON FEDI (via Cashwyre):
① Open Fedi app → tap Community tab
② Scroll to Community Mini Apps → tap Cashwyre
③ Tap Crypto Onramp → select NGN
④ Enter your Naira amount (minimum ₦2,000)
⑤ Cashwyre shows you a Nigerian bank account number
⑥ Open your bank app and transfer to that account (GTB, Access, Zenith, Opay, any bank works)
⑦ Wait 5–10 minutes → sats appear in your Fedi wallet ✓
No ID required. No paperwork. Just your phone.

Other ways to get Bitcoin: earn from merchants who pay in Bitcoin, receive from friends on Fedi, use P2P platforms like Bitnob or Paxful.

WHAT IS BITCOIN:
Digital money that no bank or government controls. Fixed supply of exactly 21 million — forever. Nobody can print more. You own it completely yourself. Send it anywhere in seconds like a WhatsApp message. The Naira has lost over 80% of its purchasing power since 2020 because the government keeps printing more. Bitcoin cannot be inflated.

WHY BITCOIN MATTERS FOR NIGERIANS:
1. Protect savings from Naira inflation
2. Send money internationally without Western Union fees or 48hr waits
3. Accept payments at your shop — just a QR code, no POS machine needed
4. Works 24/7, no bank holidays, no transfer limits
5. No bank account required — just a phone
6. Stack sats weekly (even ₦500 worth) and build wealth over time

WHAT IS FEDI:
Fedi is a Bitcoin app with three things: a Lightning wallet (send/receive sats instantly with near-zero fees), a chat system (message people and send money inside conversations), and Mini Apps (Cashwyre for buying BTC with Naira, BTCMap for finding Bitcoin merchants, LnESIM for travel SIMs). What makes it unique: your Bitcoin is protected by a federation — a group of trusted community members hold it together, not one company that can disappear or get hacked.

WALLET BACKUP:
Profile → Personal Backup → you see recovery words → write them on PHYSICAL PAPER (never a screenshot, never notes app) → store that paper somewhere safe like you would store cash. Those words = complete access to your money. Lose your phone but have the words = you get everything back. Lose the words AND your phone = permanent loss. Do this immediately.

MERCHANTS:
Set up Fedi wallet → Wallet → Receive → copy or print QR code → display at counter → customer scans with any Bitcoin wallet → payment is instant. No POS machine. No transfer fees for receiving. Convert to Naira anytime via Cashwyre. Bitcoin Abuja has 6 merchants already live across Abuja and Minna.

LIGHTNING NETWORK:
Layer on top of Bitcoin that makes payments instant (under 1 second) and nearly free (less than ₦1 per transaction). Fedi uses Lightning for all transactions automatically. You do not need to understand it technically — it just makes Bitcoin work for daily payments.

BITCOIN ABUJA COMMUNITY:
A Bitcoin circular economy community in Abuja, Nigeria. 60+ members, 6 active merchants. Running weekly education classes. Uses Fedi as the community platform. Led by Aisha Ummi Waziri.

KEEP YOUR RESPONSES:
- Short and to the point (mobile users)
- In numbered or bullet steps when giving instructions
- Warm and human — never robotic
- Always in the same language the user wrote in`

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: conversationHistory,
      system: systemPrompt
    })
  })

  if (!response.ok) {
    throw new Error(`API responded with status ${response.status}`)
  }

  const data = await response.json()

  if (data.error) {
    throw new Error(data.error)
  }

  return data.content?.[0]?.text || data.content || 'Something went wrong. Please try again.'
}

const B = {
  navy:    '#1B2232',
  navyL:   '#222D3F',
  navyLL:  '#2A3650',
  navyB:   'rgba(212,168,67,.14)',
  gold:    '#D4A843',
  goldD:   '#A67C2A',
  goldL:   '#E8C876',
  goldF:   'rgba(212,168,67,.08)',
  goldB:   'rgba(212,168,67,.22)',
  white:   '#EDF2FF',
  mid:     '#8A9BB5',
  dim:     '#4A5A72',
  dark:    '#2A3650',
  green:   '#34C77A',
  red:     '#F87171',
}

const CSS = `
  @import url('https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #1B2232; -webkit-font-smoothing: antialiased; }
  ::-webkit-scrollbar { width: 0; }

  @keyframes splashFadeOut {
    from { opacity: 1; }
    to   { opacity: 0; }
  }
  @keyframes chatFadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideFromLeft {
    from { opacity: 0; transform: translateX(-14px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes slideFromRight {
    from { opacity: 0; transform: translateX(14px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes dotBounce {
    0%, 60%, 100% { transform: scale(1); opacity: 0.25; }
    30%           { transform: scale(1.8); opacity: 1; }
  }
  @keyframes liveDot {
    0%, 100% { opacity: 1; }
    50%      { opacity: 0.35; }
  }

  .splash-leaving { animation: splashFadeOut 0.45s ease forwards; }
  .chat-entering  { animation: chatFadeIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }

  .welcome-item-1 { animation: slideUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.00s both; }
  .welcome-item-2 { animation: slideUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.07s both; }
  .welcome-item-3 { animation: slideUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.14s both; }
  .welcome-item-4 { animation: slideUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.21s both; }

  .msg-user { animation: slideFromRight 0.28s cubic-bezier(0.22,1,0.36,1) both; }
  .msg-bot  { animation: slideFromLeft  0.28s cubic-bezier(0.22,1,0.36,1) both; }

  .prompt-card {
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .prompt-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(212,168,67,.2) !important;
    border-color: rgba(212,168,67,.4) !important;
  }
  .prompt-card:active { transform: scale(0.97); }

  .send-button { transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease; }
  .send-button:not(:disabled):hover {
    transform: scale(1.08);
    box-shadow: 0 4px 24px rgba(212,168,67,.6) !important;
  }
  .send-button:not(:disabled):active { transform: scale(0.96); }

  .listen-btn {
    transition: color 0.15s ease;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .listen-btn:hover { color: #D4A843 !important; }

  .chat-input:focus {
    border-color: #D4A843 !important;
    box-shadow: 0 0 0 3px rgba(212,168,67,.15) !important;
    outline: none;
  }

  .attach-btn {
    transition: color 0.15s ease, background 0.15s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .attach-btn:hover { color: #D4A843 !important; background: rgba(212,168,67,.1) !important; }
  .attach-btn:active { transform: scale(0.94); }

  .remove-attach {
    transition: background 0.15s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .remove-attach:hover { background: rgba(248,113,113,.25) !important; }

  .msg-file-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(212,168,67,.15);
    border: 1px solid rgba(212,168,67,.3);
    border-radius: 8px;
    padding: 5px 10px;
    font-size: 11px;
    color: #D4A843;
    margin-bottom: 6px;
    max-width: 200px;
    overflow: hidden;
  }

  .msg-file-pill span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

const PROMPTS = [
  { label: 'Buy BTC with Naira',  msg: 'How do I buy Bitcoin with Naira on Fedi?' },
  { label: 'Sat price in Naira',  msg: 'What is 1 sat worth in Naira right now?' },
  { label: 'Why Bitcoin matters', msg: 'Why should I use Bitcoin as a Nigerian?' },
  { label: 'What is Fedi?',       msg: 'What is Fedi and how does it work?' },
]

function SendIcon({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 19V5M5 12L12 5L19 12" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function SpeakerIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19.07 4.93a10 10 0 010 14.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M15.54 8.46a5 5 0 010 7.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function SplashScreen({ onDone }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const leaveTimer = setTimeout(() => setLeaving(true), 1800)
    const doneTimer  = setTimeout(() => onDone(), 2250)
    return () => {
      clearTimeout(leaveTimer)
      clearTimeout(doneTimer)
    }
  }, [onDone])

  return (
    <div
      className={leaving ? 'splash-leaving' : ''}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        background: B.navy,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img
        src="/logo.png"
        alt="Sabi AI"
        style={{
          width: 260,
          maxWidth: '70vw',
          height: 'auto',
          objectFit: 'contain',
        }}
      />
    </div>
  )
}

export default function App() {
  const [splashDone, setSplashDone]     = useState(false)
  const [btc, setBtc]                   = useState({ usd: 96300, ngn: 154000000 })
  const [messages, setMessages]         = useState([])
  const [displayMsgs, setDisplayMsgs]   = useState([])
  const [inputText, setInputText]       = useState('')
  const [isLoading, setIsLoading]       = useState(false)
  const [speakingIdx, setSpeakingIdx]   = useState(null)
  const [error, setError]               = useState('')
  const [attachedFile, setAttachedFile] = useState(null)
  const messagesEndRef                  = useRef(null)
  const fileInputRef                    = useRef(null)

  useEffect(() => {
    fetchBTC().then(setBtc)
    const interval = setInterval(() => fetchBTC().then(setBtc), 180000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayMsgs, isLoading])

  const satNgn = btc ? (btc.ngn / 100000000).toFixed(2) : '1.54'

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const isImage = file.type.startsWith('image/')
    const isPDF   = file.type === 'application/pdf'
    if (!isImage && !isPDF) return
    const base64     = await fileToBase64(file)
    const previewUrl = isImage ? URL.createObjectURL(file) : null
    setAttachedFile({ type: isImage ? 'image' : 'pdf', base64, mediaType: file.type, name: file.name, previewUrl })
    e.target.value = ''
  }

  const clearAttachment = () => setAttachedFile(null)

  const sendMessage = async (textOverride) => {
    const text = (textOverride || inputText).trim()
    const file = attachedFile
    if (!text && !file) return
    if (isLoading) return

    setInputText('')
    setError('')
    setAttachedFile(null)

    setDisplayMsgs(prev => [...prev, { r: 'user', c: text, file }])

    const contentParts = []
    if (file) {
      if (file.type === 'image') {
        contentParts.push({ type: 'image', source: { type: 'base64', media_type: file.mediaType, data: file.base64 } })
      } else {
        contentParts.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: file.base64 } })
      }
    }
    if (text) {
      contentParts.push({ type: 'text', text })
    } else {
      contentParts.push({ type: 'text', text: 'Please look at this and help me understand it.' })
    }

    const newHistory = [...messages, { role: 'user', content: contentParts }]
    setMessages(newHistory)
    setIsLoading(true)

    try {
      const reply = await sendToAI(newHistory, btc)
      setMessages(prev => [...prev, { role: 'assistant', content: [{ type: 'text', text: reply }] }])
      setDisplayMsgs(prev => [...prev, { r: 'bot', c: reply }])
    } catch (err) {
      console.error('AI error:', err)
      const errMsg = 'Could not connect to Sabi. Please check your internet connection and try again.'
      setDisplayMsgs(prev => [...prev, { r: 'bot', c: errMsg }])
      setMessages(prev => [...prev, { role: 'assistant', content: [{ type: 'text', text: errMsg }] }])
      setError(err.message)
    }

    setIsLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleListen = (text, idx) => {
    if (speakingIdx === idx) {
      window.speechSynthesis?.cancel()
      setSpeakingIdx(null)
    } else {
      speak(text)
      setSpeakingIdx(idx)
      const check = setInterval(() => {
        if (!window.speechSynthesis?.speaking) {
          setSpeakingIdx(null)
          clearInterval(check)
        }
      }, 300)
    }
  }

  const hasMessages = displayMsgs.length > 0

  return (
    <>
      <style>{CSS}</style>

      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}

      <div
        className={splashDone ? 'chat-entering' : ''}
        style={{
          background: B.navy,
          minHeight: '100dvh',
          maxWidth: 440,
          margin: '0 auto',
          fontFamily: "'Satoshi', -apple-system, sans-serif",
          color: B.white,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* HEADER */}
        <div style={{
          padding: '12px 16px',
          background: B.navyL,
          borderBottom: `1px solid ${B.navyB}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="/logo.png"
              alt="Sabi AI"
              style={{ width: 34, height: 34, borderRadius: 10, objectFit: 'cover' }}
            />
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: B.gold, letterSpacing: 0.5 }}>Sabi AI</div>
              <div style={{ fontSize: 10, color: B.dim }}>Bitcoin Abuja</div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            background: B.goldF,
            border: `1px solid ${B.goldB}`,
            borderRadius: 100,
            padding: '5px 13px',
          }}>
            <div style={{
              width: 6, height: 6,
              borderRadius: '50%',
              background: B.green,
              animation: 'liveDot 2s ease infinite',
            }}/>
            <span style={{ fontSize: 11, fontWeight: 500, color: B.white }}>1 sat</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: B.gold }}>₦{satNgn}</span>
          </div>
        </div>

        {/* BODY */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          {!hasMessages && !isLoading && (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px 22px 80px',
            }}>
              <div className="welcome-item-1" style={{ marginBottom: 20 }}>
                <img
                  src="/logo.png"
                  alt="Sabi AI"
                  style={{ width: 86, height: 86, borderRadius: 24, objectFit: 'cover' }}
                />
              </div>

              <h1 className="welcome-item-2" style={{
                fontSize: 22, fontWeight: 600, color: B.white,
                textAlign: 'center', marginBottom: 8,
              }}>
                How can I help you?
              </h1>

              <p className="welcome-item-3" style={{
                fontSize: 14, color: B.mid, textAlign: 'center',
                lineHeight: 1.65, marginBottom: 6, maxWidth: 280,
              }}>
                Ask about Bitcoin, Fedi, or buying sats with Naira.
              </p>

              <p className="welcome-item-3" style={{
                fontSize: 11, color: B.dim, textAlign: 'center',
                marginBottom: 28, letterSpacing: 0.4,
              }}>
                English · Hausa · Yoruba · Igbo · Pidgin
              </p>

              <div className="welcome-item-4" style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: 10, width: '100%', maxWidth: 360,
              }}>
                {PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(p.msg)}
                    className="prompt-card"
                    style={{
                      background: B.navyL,
                      border: `1px solid ${B.navyB}`,
                      borderRadius: 16,
                      padding: '16px 14px 14px',
                      textAlign: 'left',
                      boxShadow: '0 2px 12px rgba(0,0,0,.3)',
                      fontFamily: 'inherit',
                    }}
                  >
                    <div style={{
                      width: 20, height: 3, borderRadius: 2,
                      background: i % 2 === 0 ? B.gold : B.goldD,
                      marginBottom: 12,
                      opacity: i % 2 === 0 ? 1 : 0.7,
                    }}/>
                    <div style={{ fontSize: 13, fontWeight: 400, color: B.white, lineHeight: 1.4 }}>
                      {p.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasMessages && (
            <div style={{ padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {displayMsgs.map((msg, i) => (
                <div
                  key={i}
                  className={msg.r === 'user' ? 'msg-user' : 'msg-bot'}
                  style={{
                    display: 'flex',
                    justifyContent: msg.r === 'user' ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-start',
                    gap: 9,
                  }}
                >
                  {msg.r === 'bot' && (
                    <img
                      src="/logo.png"
                      alt="Sabi"
                      style={{ width: 30, height: 30, borderRadius: 9, objectFit: 'cover', flexShrink: 0, marginTop: 2 }}
                    />
                  )}

                  <div style={{
                    maxWidth: '80%', display: 'flex', flexDirection: 'column',
                    alignItems: msg.r === 'user' ? 'flex-end' : 'flex-start', gap: 5,
                  }}>
                    <div style={{
                      padding: '12px 16px', fontSize: 14, lineHeight: 1.75,
                      whiteSpace: 'pre-wrap', fontFamily: 'inherit',
                      ...(msg.r === 'user' ? {
                        background: `linear-gradient(135deg, ${B.gold}, ${B.goldD})`,
                        color: '#0D0A00', fontWeight: 600,
                        borderRadius: '18px 18px 4px 18px',
                        boxShadow: '0 3px 14px rgba(212,168,67,.3)',
                      } : {
                        background: B.navyL, color: B.white,
                        borderRadius: '18px 18px 18px 4px',
                        border: `1px solid ${B.navyB}`,
                      }),
                    }}>
                      {msg.file && (
                        <div style={{ marginBottom: msg.c ? 8 : 0 }}>
                          {msg.file.type === 'image' && msg.file.previewUrl ? (
                            <img src={msg.file.previewUrl} alt="attachment"
                              style={{ maxWidth: 200, maxHeight: 160, borderRadius: 10, display: 'block', objectFit: 'cover', border: '1px solid rgba(0,0,0,.2)' }}
                            />
                          ) : (
                            <div className="msg-file-pill">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                              </svg>
                              <span>{msg.file.name}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {msg.c}
                    </div>

                    {msg.r === 'bot' && (
                      <button
                        className="listen-btn"
                        onClick={() => handleListen(msg.c, i)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          background: 'transparent', border: 'none',
                          padding: '2px 4px', borderRadius: 6, fontSize: 11,
                          color: speakingIdx === i ? B.gold : B.dim,
                          fontFamily: 'inherit', cursor: 'pointer',
                        }}
                      >
                        <SpeakerIcon />
                        {speakingIdx === i ? 'Stop' : 'Listen'}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="msg-bot" style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                  <img src="/logo.png" alt="Sabi"
                    style={{ width: 30, height: 30, borderRadius: 9, objectFit: 'cover', flexShrink: 0, marginTop: 2 }}
                  />
                  <div style={{ background: B.navyL, borderRadius: '18px 18px 18px 4px', padding: '14px 18px', border: `1px solid ${B.navyB}` }}>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                      {[0, 1, 2].map(j => (
                        <div key={j} style={{ width: 7, height: 7, borderRadius: '50%', background: B.gold, animation: `dotBounce 1.2s ${j * 0.15}s ease-in-out infinite` }}/>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* INPUT BAR */}
        <div style={{
          padding: '12px 16px 24px', background: B.navyL,
          borderTop: `1px solid ${B.navyB}`, position: 'sticky', bottom: 0,
        }}>
          {attachedFile && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: B.navy, border: `1px solid ${B.navyB}`,
              borderRadius: 12, padding: '7px 10px', marginBottom: 8, maxWidth: 260,
            }}>
              {attachedFile.type === 'image' && attachedFile.previewUrl ? (
                <img src={attachedFile.previewUrl} alt="preview"
                  style={{ width: 34, height: 34, borderRadius: 7, objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: 34, height: 34, borderRadius: 7, background: B.navyLL, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={B.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
              )}
              <span style={{ fontSize: 11.5, color: B.white, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {attachedFile.name}
              </span>
              <button className="remove-attach" onClick={clearAttachment}
                style={{ width: 20, height: 20, borderRadius: '50%', background: B.navyLL, border: 'none', color: B.mid, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0 }}
              >✕</button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,application/pdf" onChange={handleFileChange} style={{ display: 'none' }} />

            <button className="attach-btn" onClick={() => fileInputRef.current?.click()} title="Attach image or PDF"
              style={{
                width: 40, height: 40, borderRadius: 12,
                background: attachedFile ? B.goldF : 'transparent',
                border: `1px solid ${attachedFile ? B.goldB : B.navyB}`,
                color: attachedFile ? B.gold : B.dim,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
              </svg>
            </button>

            <input
              className="chat-input"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={attachedFile ? 'Add a question… (optional)' : 'Ask anything...'}
              style={{
                flex: 1, padding: '13px 18px', background: B.navy,
                border: `1px solid ${B.navyB}`, borderRadius: 28,
                fontSize: 14, color: B.white, fontFamily: 'inherit',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={(!inputText.trim() && !attachedFile) || isLoading}
              className="send-button"
              style={{
                width: 46, height: 46, borderRadius: '50%', border: 'none',
                background: (inputText.trim() || attachedFile) && !isLoading
                  ? `linear-gradient(135deg, ${B.gold}, ${B.goldD})` : B.navyLL,
                cursor: (inputText.trim() || attachedFile) && !isLoading ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                boxShadow: (inputText.trim() || attachedFile) ? '0 3px 16px rgba(212,168,67,.4)' : 'none',
              }}
            >
              <SendIcon color={(inputText.trim() || attachedFile) && !isLoading ? '#0D0A00' : B.dim} />
            </button>
          </div>

          <div style={{ fontSize: 9, color: B.dim, textAlign: 'center', marginTop: 8, letterSpacing: 0.8 }}>
            Bitcoin Abuja · Powered by Fedi
          </div>
        </div>
      </div>
    </>
  )
}
