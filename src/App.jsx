import React, { useCallback, useEffect, useRef, useState } from 'react'

const COMMUNITY = {
  name: 'Sabi Ai',
  city: 'Abuja, Nigeria',
}

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'ha', label: 'HA' },
  { code: 'yo', label: 'YO' },
  { code: 'ig', label: 'IG' },
  { code: 'pc', label: 'PID' },
]

const WELCOME = {
  en: {
    title: 'How can I help you?',
    sub: 'Ask, learn, or start using Bitcoin in your language.',
  },
  ha: {
    title: 'Ina iya taimaka maka?',
    sub: 'Tambaya, koya, ko fara amfani da Bitcoin a harshenka.',
  },
  yo: {
    title: 'Bawo ni mo se le ran o lowo?',
    sub: 'Beere, ko eko, tabi bere fun lilo Bitcoin ni ede re.',
  },
  ig: {
    title: 'Kedu ka m ga-esi nyere gi aka?',
    sub: 'Jụọ, mụta, ma ọ bụ bido iji Bitcoin n’asụsụ gị.',
  },
  pc: {
    title: 'How I fit help you?',
    sub: 'Ask, learn, or start to use Bitcoin for your side.',
  },
}

const PROMPTS = {
  en: [
    { label: 'BTC price in Naira', msg: 'What is the current price of 1 sat in Naira and 1 BTC in Naira?' },
    { label: 'Buy BTC with Naira', msg: 'How do I buy Bitcoin with Naira on Fedi?' },
  ],
  ha: [
    { label: 'Farashin BTC a Naira', msg: 'Nawa ne farashin 1 sat a Naira da 1 BTC a Naira yanzu?' },
    { label: 'Saya BTC da Naira', msg: 'Ta yaya zan saya Bitcoin da Naira a Fedi?' },
  ],
  yo: [
    { label: 'Iye BTC ni Naira', msg: 'Elo ni iye 1 sat ni Naira ati 1 BTC ni Naira bayi?' },
    { label: 'Ra BTC pelu Naira', msg: 'Bawo ni mo se le ra Bitcoin pelu Naira lori Fedi?' },
  ],
  ig: [
    { label: 'Ulo BTC na Naira', msg: 'Ego ole ka 1 sat na Naira na 1 BTC na Naira ugbu a?' },
    { label: 'Zuo BTC na Naira', msg: 'Kedu ka m ga-esi zuo Bitcoin na Naira na Fedi?' },
  ],
  pc: [
    { label: 'BTC price for Naira', msg: 'How much be 1 sat in Naira and 1 BTC in Naira now?' },
    { label: 'Buy BTC with Naira', msg: 'How I go take buy Bitcoin with Naira for Fedi?' },
  ],
}

const BIG_ACTIONS = [
  {
    key: 'merchant',
    icon: '🏪',
    title: 'Accept Bitcoin at my shop',
    sub: 'Create a merchant setup and payment QR.',
    accent: '#2DD4BF',
  },
  {
    key: 'member',
    icon: '📚',
    title: 'New to Bitcoin? Start here',
    sub: 'A guided path that explains Bitcoin simply.',
    accent: '#F97316',
  },
]

const COLORS = {
  bg: '#1B2232',
  panel: '#222D3F',
  panel2: '#20293A',
  border: 'rgba(212,168,67,.18)',
  borderSoft: 'rgba(255,255,255,.08)',
  gold: '#D4A843',
  gold2: '#A67C2A',
  teal: '#2DD4BF',
  orange: '#F97316',
  text: '#EDF2FF',
  sub: '#8A9BB5',
  dim: '#4A5A72',
  green: '#34C77A',
}

const CSS = `
*{box-sizing:border-box} html,body,#root{height:100%} body{margin:0;background:${COLORS.bg};-webkit-font-smoothing:antialiased;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Inter,Arial,sans-serif} button,input{font:inherit} button{touch-action:manipulation}
.app-shell{min-height:100%;display:flex;flex-direction:column;color:${COLORS.text};background:${COLORS.bg}}
.topbar{position:sticky;top:0;z-index:20;display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:${COLORS.panel2};border-bottom:1px solid ${COLORS.borderSoft}}
.brand{display:flex;align-items:center;gap:10px;min-width:0}
.brand-mark{width:28px;height:28px;border-radius:999px;display:grid;place-items:center;background:linear-gradient(135deg,${COLORS.gold},${COLORS.gold2});color:#0D0A00;font-weight:900;flex:0 0 auto}
.brand-text{display:flex;flex-direction:column;min-width:0}
.brand-text strong{font-size:15px;line-height:1.1;color:${COLORS.gold}}
.brand-text span{font-size:10px;color:${COLORS.sub};margin-top:2px}
.top-right{display:flex;align-items:center;gap:8px;flex-shrink:0}
.pill{display:inline-flex;align-items:center;gap:7px;padding:8px 12px;border-radius:999px;border:1px solid ${COLORS.borderSoft};background:rgba(255,255,255,.03);color:${COLORS.text};font-size:12px;font-weight:700;white-space:nowrap}
.pill.gold{border-color:${COLORS.border};background:rgba(212,168,67,.08);color:${COLORS.gold}}
.lang-row{display:flex;gap:8px;padding:10px 14px 0;overflow-x:auto}
.lang-chip{flex:0 0 auto;padding:8px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:transparent;color:${COLORS.sub};font-weight:700;font-size:12px}
.lang-chip.active{border-color:${COLORS.gold};background:rgba(212,168,67,.12);color:${COLORS.gold}}
.content{width:min(100%, 720px);margin:0 auto;flex:1;display:flex;flex-direction:column;padding:12px 14px 18px}
.hero{padding:10px 2px 6px}
.hero h1{margin:0 0 8px;font-size:24px;line-height:1.1;letter-spacing:-.02em}
.hero p{margin:0;color:${COLORS.sub};font-size:14px;line-height:1.55}
.cards{display:flex;flex-direction:column;gap:12px;margin-top:14px}
.action-card{width:100%;border-radius:20px;border:1px solid rgba(255,255,255,.09);background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,.015));padding:18px;display:flex;align-items:center;gap:14px;text-align:left;color:${COLORS.text};box-shadow:0 10px 28px rgba(0,0,0,.18)}
.action-card.big{min-height:132px;border-color:rgba(45,212,191,.18)}
.action-card.big.orange{border-color:rgba(249,115,22,.18)}
.action-icon{width:56px;height:56px;border-radius:16px;display:grid;place-items:center;flex:0 0 auto;font-size:26px;color:#fff;background:rgba(255,255,255,.06)}
.action-card.big .action-icon{width:78px;height:78px;border-radius:22px;font-size:30px}
.action-body{min-width:0;flex:1}
.action-title{font-size:18px;font-weight:800;line-height:1.2;margin-bottom:6px}
.action-sub{font-size:14px;line-height:1.45;color:${COLORS.sub}}
.action-arrow{width:40px;height:40px;border-radius:999px;display:grid;place-items:center;background:rgba(255,255,255,.05);color:${COLORS.teal};font-size:22px;flex:0 0 auto}
.assist-line{margin:18px 0 10px;font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:${COLORS.dim}}
.mini-help{margin-top:10px;font-size:12px;color:${COLORS.sub};line-height:1.5}
.chatbar{position:sticky;bottom:0;z-index:15;background:linear-gradient(180deg,rgba(27,34,50,0),rgba(27,34,50,.9) 22%, rgba(27,34,50,1));padding:14px 14px 16px;margin-top:auto}
.chatwrap{width:min(100%,720px);margin:0 auto;background:rgba(255,255,255,.02);border-top:1px solid rgba(255,255,255,.04);padding-top:14px}
.input-row{display:flex;align-items:center;gap:8px}
.attach-btn,.mic-btn,.send-btn{width:42px;height:42px;border-radius:13px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);color:${COLORS.sub};display:grid;place-items:center;flex:0 0 auto}
.mic-btn.recording{border-color:${COLORS.gold};background:rgba(212,168,67,.15);color:${COLORS.gold}}
.chat-input{flex:1;height:46px;border-radius:999px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);color:${COLORS.text};padding:0 18px;font-size:15px;outline:none}
.chat-input::placeholder{color:${COLORS.sub}}
.footer-meta{display:flex;justify-content:center;align-items:center;gap:12px;margin-top:8px;font-size:11px;color:${COLORS.dim};flex-wrap:wrap}
.footer-link{color:${COLORS.gold};text-decoration:underline;background:transparent;border:none;padding:0;font-size:11px;font-weight:700}
.messages{width:min(100%,720px);margin:0 auto;display:flex;flex-direction:column;gap:14px;padding-top:8px}
.msg{display:flex;gap:8px;align-items:flex-start}
.msg.user{justify-content:flex-end}
.bubble{max-width:85%;padding:12px 16px;border-radius:18px;line-height:1.65;font-size:14px;white-space:pre-wrap}
.bubble.user{background:linear-gradient(135deg,${COLORS.gold},${COLORS.gold2});color:#0D0A00;font-weight:700;border-bottom-right-radius:4px}
.bubble.bot{background:${COLORS.panel};border:1px solid rgba(255,255,255,.08);color:${COLORS.text};border-bottom-left-radius:4px}
.bot-avatar{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:rgba(212,168,67,.14);color:${COLORS.gold};font-weight:900;flex:0 0 auto}
.screen{flex:1;display:flex;flex-direction:column}
.screen-head{position:sticky;top:0;z-index:18;display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:${COLORS.panel2};border-bottom:1px solid ${COLORS.borderSoft}}
.back-btn{border:none;background:transparent;color:${COLORS.sub};font-size:13px;display:flex;align-items:center;gap:6px;padding:0}
.section{width:min(100%,720px);margin:0 auto;padding:16px 14px 24px;display:flex;flex-direction:column;gap:14px}
.card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:18px}
.card-title{font-size:18px;font-weight:800;margin:0 0 6px}
.card-sub{margin:0;color:${COLORS.sub};font-size:14px;line-height:1.55}
.field{width:100%;height:46px;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);color:${COLORS.text};padding:0 14px;outline:none}
.field::placeholder{color:${COLORS.sub}}
.btn{height:46px;border:none;border-radius:14px;font-weight:800}
.btn.primary{background:linear-gradient(135deg,${COLORS.teal},#0ea5a0);color:#0D1A1A}
.btn.secondary{background:rgba(255,255,255,.04);color:${COLORS.text};border:1px solid rgba(255,255,255,.08)}
.banner-preview{border-radius:24px;background:linear-gradient(180deg,#121826,#1b2232);border:1px solid rgba(255,255,255,.08);padding:18px}
.banner-line{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:${COLORS.gold};font-weight:800}
.banner-name{margin-top:10px;font-size:28px;line-height:1.05;font-weight:900}
.banner-accept{margin-top:12px;font-size:20px;line-height:1.15;color:${COLORS.orange};font-weight:900}
.banner-support{margin-top:6px;color:${COLORS.sub};font-size:13px}
.banner-meta{margin-top:14px;color:${COLORS.teal};font-size:12px;font-weight:700}
`

function Icon({ type }) {
  if (type === 'share') return <span>↗</span>
  if (type === 'mic') return <span>🎙</span>
  if (type === 'attach') return <span>📎</span>
  if (type === 'send') return <span>➤</span>
  return <span>₿</span>
}

function useSpeechRecognition(onResult, onStatus) {
  const recognitionRef = useRef(null)

  const start = useCallback(() => {
    const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null
    if (!SR) {
      onStatus?.('unsupported')
      return false
    }

    const recognition = new SR()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => onStatus?.('recording')
    recognition.onend = () => onStatus?.('idle')
    recognition.onerror = () => onStatus?.('error')
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || ''
      onResult?.(transcript)
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
      return true
    } catch {
      onStatus?.('error')
      return false
    }
  }, [onResult, onStatus])

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
      recognitionRef.current = null
    }
    onStatus?.('idle')
  }, [onStatus])

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {}
      }
    }
  }, [])

  return { start, stop, recognitionRef }
}

function App() {
  const [activeLang, setActiveLang] = useState('en')
  const [view, setView] = useState('home')
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi. I’m Sabi — your Bitcoin assistant.' },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [micStatus, setMicStatus] = useState('idle')
  const [btc, setBtc] = useState({ usd: 96300, ngn: 154000000 })

  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)
  const audioRef = useRef(null)

  const satNgn = btc?.ngn ? (btc.ngn / 100000000).toFixed(2) : '1.54'
  const welcome = WELCOME[activeLang] || WELCOME.en
  const prompts = PROMPTS[activeLang] || PROMPTS.en

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,ngn')
        const data = await res.json()
        if (data?.bitcoin) setBtc(data.bitcoin)
      } catch {}
    }
    load()
    const id = setInterval(load, 180000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const speak = useCallback((text, lang = activeLang) => {
    if (!window?.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(String(text || '').replace(/[₿⚡●#*•①②③④⑤]/g, ' '))
    u.lang = { en: 'en-NG', ha: 'ha', yo: 'yo', ig: 'ig', pc: 'en-NG' }[lang] || 'en-NG'
    u.rate = 0.95
    window.speechSynthesis.speak(u)
  }, [activeLang])

  const stopSpeaking = useCallback(() => {
    try {
      window.speechSynthesis?.cancel()
    } catch {}
    if (audioRef.current) {
      try {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      } catch {}
      audioRef.current = null
    }
    setIsSpeaking(false)
  }, [])

  const { start: startListening, stop: stopListening } = useSpeechRecognition(
    (text) => setInput(text),
    (status) => {
      setMicStatus(status)
      setIsRecording(status === 'recording')
    }
  )

  const handleMic = () => {
    if (isRecording) stopListening()
    else startListening()
  }

  const replyFor = (text) => {
    const lower = text.toLowerCase()
    if (lower.includes('merchant') || lower.includes('shop')) {
      return 'Use the merchant flow to create a clean Bitcoin accepted here banner and payment QR.'
    }
    if (lower.includes('community')) {
      return 'Use the community flow to bring Sabi to your group and build a Bitcoin routine.'
    }
    if (lower.includes('price') || lower.includes('sat')) {
      return `1 sat is about ₦${satNgn} right now. 1 BTC is roughly ₦${((btc.ngn || 0) / 1000000).toFixed(0)}M.`
    }
    if (lower.includes('buy') || lower.includes('onramp')) {
      return 'You can buy Bitcoin with Naira inside Fedi using the Cashwyre onramp flow.'
    }
    return 'I can help with Bitcoin price, buying BTC, merchant setup, or community onboarding.'
  }

  const sendMessage = async (override) => {
    const text = String(override ?? input).trim()
    if (!text || isLoading) return

    if (text === '__MERCHANT__') {
      setView('merchant')
      return
    }
    if (text === '__MEMBER__') {
      setView('member')
      return
    }

    setMessages((prev) => [...prev, { role: 'user', text }])
    setInput('')
    setIsLoading(true)

    setTimeout(() => {
      const reply = replyFor(text)
      setMessages((prev) => [...prev, { role: 'bot', text: reply }])
      speak(reply)
      setIsLoading(false)
    }, 500)
  }

  const resetHome = () => {
    stopSpeaking()
    setView('home')
    setMessages([{ role: 'bot', text: 'Hi. I’m Sabi — your Bitcoin assistant.' }])
    setInput('')
    setIsLoading(false)
    setMicStatus('idle')
    setIsRecording(false)
  }

  const Home = () => (
    <>
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">₿</div>
          <div className="brand-text">
            <strong>Sabi Ai</strong>
            <span>{COMMUNITY.city}</span>
          </div>
        </div>
        <div className="top-right">
          <button className="pill">Impact Dashboard</button>
          <div className="pill gold">● 1 sat ≈ ₦{satNgn}</div>
        </div>
      </div>

      <div className="lang-row">
        {LANGS.map((l) => (
          <button
            key={l.code}
            onClick={() => setActiveLang(l.code)}
            className={`lang-chip ${activeLang === l.code ? 'active' : ''}`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="content">
        <div className="hero">
          <h1>{welcome.title}</h1>
          <p>{welcome.sub}</p>
        </div>

        <div className="assist-line">Start using Bitcoin</div>
        <div className="cards">
          {BIG_ACTIONS.map((item) => (
            <button
              key={item.key}
              className={`action-card big ${item.key === 'member' ? 'orange' : ''}`}
              onClick={() => setView(item.key)}
            >
              <div className="action-icon" style={{ background: `linear-gradient(135deg, ${item.accent}, rgba(255,255,255,.06))` }}>
                {item.icon}
              </div>
              <div className="action-body">
                <div className="action-title">{item.title}</div>
                <div className="action-sub">{item.sub}</div>
              </div>
              <div className="action-arrow" style={{ color: item.accent }}>›</div>
            </button>
          ))}
        </div>

        <div className="assist-line" style={{ marginTop: 20 }}>How can I help you today?</div>
        <div className="mini-help">Ask anything about Bitcoin in your language.</div>
      </div>

      <div className="chatbar">
        <div className="chatwrap">
          <div className="input-row">
            <button className="attach-btn" onClick={() => fileInputRef.current?.click()} aria-label="attach file">
              <Icon type="attach" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              style={{ display: 'none' }}
              onChange={() => {
                fileInputRef.current.value = ''
              }}
            />
            <input
              className="chat-input"
              placeholder="Ask anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
            />
            <button
              className={`mic-btn ${isRecording ? 'recording' : ''}`}
              onClick={handleMic}
              aria-label="voice input"
              title={micStatus === 'unsupported' ? 'Voice not supported in this browser' : 'Voice input'}
            >
              <Icon type="mic" />
            </button>
            <button className="send-btn" onClick={() => sendMessage()} aria-label="send message">
              <Icon type="send" />
            </button>
          </div>
          <div className="footer-meta">
            <span>Bitcoin Abuja · Powered by Fedi</span>
            <button className="footer-link" onClick={() => setView('request')}>
              Bring Sabi to your community
            </button>
          </div>
        </div>
      </div>
    </>
  )

  const Merchant = () => {
    const [shopName, setShopName] = useState('')
    const [category, setCategory] = useState('food')
    const [location, setLocation] = useState('')

    return (
      <div className="screen">
        <div className="screen-head">
          <button className="back-btn" onClick={resetHome}>← Back</button>
          <strong style={{ color: COLORS.teal, fontSize: 13, letterSpacing: '.04em', textTransform: 'uppercase' }}>Merchant Setup</strong>
          <div style={{ width: 46 }} />
        </div>
        <div className="section">
          <div className="card">
            <div className="card-title">Accept Bitcoin at your shop</div>
            <p className="card-sub">Create a clean banner and payment QR for your store.</p>
          </div>

          <input className="field" placeholder="Shop name" value={shopName} onChange={(e) => setShopName(e.target.value)} />
          <input className="field" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />

          <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {['food', 'fashion', 'beauty', 'tech', 'other'].map((c) => (
              <button
                key={c}
                className="btn secondary"
                onClick={() => setCategory(c)}
                style={{
                  color: category === c ? COLORS.gold : COLORS.text,
                  borderColor: category === c ? COLORS.gold : 'rgba(255,255,255,.08)',
                  background: category === c ? 'rgba(212,168,67,.12)' : 'rgba(255,255,255,.04)',
                }}
              >
                {CAT_EMOJI[c] || '🏪'} {c}
              </button>
            ))}
          </div>

          <div className="banner-preview">
            <div className="banner-line">Bitcoin accepted here</div>
            <div className="banner-name">{shopName || 'Your Shop'}</div>
            <div className="banner-accept">Accept Bitcoin</div>
            <div className="banner-support">Lightning payments. Instant settlement.</div>
            <div className="banner-support">{location || 'Location goes here'}</div>
            <div className="banner-meta">{CAT_EMOJI[category] || '🏪'} {category}</div>
          </div>

          <button className="btn primary" onClick={resetHome}>Done</button>
        </div>
      </div>
    )
  }

  const Member = () => (
    <div className="screen">
      <div className="screen-head">
        <button className="back-btn" onClick={resetHome}>← Back</button>
        <strong style={{ color: COLORS.orange, fontSize: 13, letterSpacing: '.04em', textTransform: 'uppercase' }}>New Member Setup</strong>
        <div style={{ width: 46 }} />
      </div>
      <div className="section">
        <div className="card">
          <div className="card-title">New to Bitcoin?</div>
          <p className="card-sub">Start here and learn the basics step by step.</p>
        </div>
        <div className="card">
          <div className="card-title" style={{ fontSize: 16 }}>1. Install Fedi</div>
          <p className="card-sub">Download the app from your app store.</p>
        </div>
        <div className="card">
          <div className="card-title" style={{ fontSize: 16 }}>2. Join a federation</div>
          <p className="card-sub">Open Wallet and create your Bitcoin wallet.</p>
        </div>
        <div className="card">
          <div className="card-title" style={{ fontSize: 16 }}>3. Join your community</div>
          <p className="card-sub">Join Bitcoin Abuja and start learning with others.</p>
        </div>
        <button className="btn primary" onClick={resetHome}>Back to home</button>
      </div>
    </div>
  )

  const Stats = () => (
    <div className="screen">
      <div className="screen-head">
        <button className="back-btn" onClick={resetHome}>← Back</button>
        <strong style={{ color: COLORS.gold, fontSize: 13, letterSpacing: '.04em', textTransform: 'uppercase' }}>Impact Dashboard</strong>
        <div style={{ width: 46 }} />
      </div>
      <div className="section">
        <div className="card">
          <div className="card-title">Impact Dashboard</div>
          <p className="card-sub">Track conversations, merchants, and member onboarding.</p>
        </div>
        <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[
            ['Conversations', '128'],
            ['Members', '60+'],
            ['Merchants', '6'],
          ].map(([label, value]) => (
            <div key={label} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 16, padding: 12 }}>
              <div style={{ fontSize: 11, color: COLORS.sub, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
              <div style={{ marginTop: 8, fontSize: 26, fontWeight: 900, color: COLORS.gold }}>{value}</div>
            </div>
          ))}
        </div>
        <button className="btn primary" onClick={resetHome}>Back to home</button>
      </div>
    </div>
  )

  const Request = () => (
    <div className="screen">
      <div className="screen-head">
        <button className="back-btn" onClick={resetHome}>← Back</button>
        <strong style={{ color: COLORS.teal, fontSize: 13, letterSpacing: '.04em', textTransform: 'uppercase' }}>Community Request</strong>
        <div style={{ width: 46 }} />
      </div>
      <div className="section">
        <div className="card">
          <div className="card-title">Bring Sabi to your community</div>
          <p className="card-sub">Fill this later. For now it is a clean placeholder that will not break the homepage.</p>
        </div>
        <button className="btn primary" onClick={resetHome}>Back to home</button>
      </div>
    </div>
  )

  return (
    <div className="app-shell">
      <style>{CSS}</style>
      {view === 'home' && <Home />}
      {view === 'merchant' && <Merchant />}
      {view === 'member' && <Member />}
      {view === 'stats' && <Stats />}
      {view === 'request' && <Request />}

      {view === 'home' && (
        <div className="messages" aria-live="polite">
          {messages.map((msg, i) => (
            <div key={i} className={`msg ${msg.role === 'user' ? 'user' : 'bot'}`}>
              {msg.role !== 'user' && <div className="bot-avatar">₿</div>}
              <div className={`bubble ${msg.role === 'user' ? 'user' : 'bot'}`}>{msg.text}</div>
            </div>
          ))}
          {isLoading && (
            <div className="msg">
              <div className="bot-avatar">₿</div>
              <div className="bubble bot">Typing…</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  )
}
