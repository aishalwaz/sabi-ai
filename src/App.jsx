import { useState, useEffect, useRef, useCallback } from 'react'

async function fetchBTC() {
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,ngn')
    const d = await r.json()
    if (d?.bitcoin?.usd) return d.bitcoin
  } catch (e) {}
  return { usd: 96300, ngn: 154000000 }
}

function speak(text) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const clean = text.replace(/[①②③④⑤⑥⑦⑧→₿⚡●#*•]/g, ' ')
  const u = new SpeechSynthesisUtterance(clean)
  u.rate = 0.9
  u.pitch = 1.0
  window.speechSynthesis.speak(u)
}

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = () => res(reader.result.split(',')[1])
    reader.onerror = () => rej(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

function detectLang(text) {
  const t = text.toLowerCase()
  const hausa  = ['ina', 'yaya', 'sannu', 'kudi', 'mene', 'yaushe', 'wane', 'kai', 'shi', 'ita', 'mu', 'ku', 'su', 'don', 'da', 'ko', 'ba', 'ne', 'ce']
  const yoruba = ['bawo', 'elo', 'jowo', 'owo', 'se', 'ni', 'mo', 'wa', 'pe', 'ti', 'fun', 'ati', 'tabi', 'ile']
  const igbo   = ['kedu', 'gini', 'oge', 'ego', 'obere', 'nke', 'ya', 'ha', 'site', 'na']
  const pidgin = ['abeg', 'wetin', 'oya', 'na so', 'e dey', 'dem', 'wey', 'nah', 'comot', 'chop', 'ginger']
  const words = t.split(/\s+/)
  const score = (list) => words.filter(w => list.includes(w)).length
  const scores = { ha: score(hausa), yo: score(yoruba), ig: score(igbo), pc: score(pidgin) }
  const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
  return top[1] > 0 ? top[0] : 'en'
}

const PROMPTS_BY_LANG = {
  en: [
    { label: 'Buy BTC with Naira',        msg: 'How do I buy Bitcoin with Naira on Fedi?' },
    { label: 'Sat price in Naira',         msg: 'What is 1 sat worth in Naira right now?' },
    { label: 'Accept Bitcoin at my shop',  msg: 'I want to accept Bitcoin payments at my shop. How do I set it up?' },
    { label: 'What is Fedi?',              msg: 'What is Fedi and how does it work?' },
  ],
  ha: [
    { label: 'Saya Bitcoin da Naira',      msg: 'Ta yaya zan saya Bitcoin da Naira a Fedi?' },
    { label: 'Farashin sat a Naira',       msg: 'Nawa ne 1 sat a Naira yanzu?' },
    { label: 'Karbi Bitcoin a kantin na',  msg: 'Ina son karbar biyan kudi na Bitcoin a kantin na. Ta yaya zan kafa shi?' },
    { label: 'Menene Fedi?',               msg: 'Menene Fedi kuma yaya yake aiki?' },
  ],
  yo: [
    { label: 'Ra Bitcoin pelu Naira',      msg: 'Bawo ni mo se le ra Bitcoin pelu Naira lori Fedi?' },
    { label: 'Iye sat ni Naira',           msg: 'Elo ni 1 sat ni Naira ni bayi?' },
    { label: 'Gba Bitcoin ni ile itaja mi',msg: 'Mo fe gba isanwo Bitcoin ni ile itaja mi. Bawo ni mo se le seto re?' },
    { label: 'Kini Fedi?',                 msg: 'Kini Fedi ati bawo ni o se n sisise?' },
  ],
  ig: [
    { label: 'Zuo Bitcoin na Naira',       msg: 'Kedu ka m ga-esi zuo Bitcoin na Naira na Fedi?' },
    { label: 'Onu ego sat na Naira',       msg: 'Ego ole bu 1 sat na Naira ugbu a?' },
    { label: 'Nata Bitcoin n\'ulo ahia m', msg: 'Achoro m inata ugwo Bitcoin n\'ulo ahia m. Kedu ka m ga-etinye ya?' },
    { label: 'Gini bu Fedi?',              msg: 'Gini bu Fedi na kedu ka o si aru oru?' },
  ],
  pc: [
    { label: 'Buy Bitcoin with Naira',     msg: 'Abeg how I go take buy Bitcoin with Naira for Fedi?' },
    { label: 'How much be 1 sat',          msg: 'How much be 1 sat in Naira right now?' },
    { label: 'Accept Bitcoin for my shop', msg: 'I wan start to accept Bitcoin for my shop. How e dey work?' },
    { label: 'Wetin be Fedi?',             msg: 'Wetin be Fedi and how e dey work?' },
  ],
}

const WELCOME_BY_LANG = {
  en: { greeting: 'How can I help you?',            sub: 'Ask me anything — Bitcoin, Fedi, merchants, savings, payments, or anything else on your mind.',                             langs: 'English · Hausa · Yoruba · Igbo · Pidgin' },
  ha: { greeting: 'Ina iya taimaka maka?',          sub: 'Tambaye ni komai — Bitcoin, Fedi, yan kasuwa, ajiya, biyan kudi, ko kowane tambaya da kake da ita.',                       langs: 'Hausa · English · Yoruba · Igbo · Pidgin' },
  yo: { greeting: 'Bawo ni mo se le ran o lowo?',   sub: 'Beere ohunkohun — Bitcoin, Fedi, awon onisowo, ifowopamo, awon isanwo, tabi ohunkohun ti o wa lori okan re.',              langs: 'Yoruba · Hausa · English · Igbo · Pidgin' },
  ig: { greeting: 'Kedu ka m ga-esi nyere gi aka?', sub: 'Juo m ihe o bula — Bitcoin, Fedi, ndi ahia, nchekwa ego, ugwo, ma o bu ihe o bula di n\'obi gi.',                         langs: 'Igbo · Hausa · Yoruba · English · Pidgin' },
  pc: { greeting: 'How I fit help you?',            sub: 'Ask me anything — Bitcoin, Fedi, merchants, savings, payments, or any other thing wey dey your mind.',                     langs: 'Pidgin · Hausa · Yoruba · Igbo · English' },
}

const ERROR_BY_LANG = {
  en: 'Sabi couldn\'t respond right now. Please check your connection and try again. If the problem continues, contact Aisha directly in the community.',
  ha: 'Sabi bai iya amsa yanzu ba. Da fatan za a duba hadin ku ku sake gwadawa. Idan matsalar ta ci gaba, tuntubi Aisha kai tsaye a cikin al\'umma.',
  yo: 'Sabi ko le dahun ni bayi. Jowo sayewo asopo re ki o tun gbiyanju. Ti isoro naa ba tesiwaju, kan si Aisha taara ninu agbegbe.',
  ig: 'Sabi enwehi ike iza ugbu a. Biko lelee njiko gi ma gbalia ozo. O buru na nsogbu ahu na-aga n\'ihu, kpoturu Aisha ozugbo n\'obodo.',
  pc: 'Sabi no fit answer now. Abeg check your connection and try again. If e no work, reach Aisha directly for the community.',
}

async function sendToAI(conversationHistory, btc) {
  const satN  = btc ? (btc.ngn / 100000000).toFixed(2) : '1.54'
  const kSat  = btc ? Math.round(btc.ngn / 100000).toLocaleString() : '1,540'
  const tenK  = btc ? Math.round(btc.ngn / 10000).toLocaleString() : '15,400'
  const hundK = btc ? Math.round(btc.ngn / 1000).toLocaleString() : '154,000'
  const usd   = btc ? btc.usd.toLocaleString() : '96,300'
  const ngnM  = btc ? (btc.ngn / 1000000).toFixed(0) : '154'

  const systemPrompt = `You are Sabi — the AI guide for Bitcoin Abuja, a Bitcoin circular economy community in Nigeria built on the Fedi app.

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
You are warm, direct, and knowledgeable — like a trusted friend from Nigeria who uses Bitcoin every day. You are not a generic chatbot. You speak like a real Nigerian. You are concise because this is a mobile app. No walls of text. No unnecessary filler.

SCOPE — NIGERIA-WIDE:
You serve all Nigerians, not just Abuja. When answering questions about where to spend Bitcoin, find merchants, or use Lightning, think Nigeria-wide. Bitcoin merchants exist in Lagos, Abuja, Kano, Port Harcourt, Ibadan, and across the country. Use BTCMap to find the nearest one.

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

OTHER WAYS TO GET BITCOIN:
- Earn from merchants who pay in Bitcoin
- Receive from friends on Fedi
- P2P platforms: Bitnob, Paxful, or any local exchange
- Stack sats weekly — even ₦500 at a time adds up

HOW TO ACCEPT BITCOIN AT YOUR SHOP (Merchant Setup):
① Open Fedi app → tap Wallet tab
② Tap Receive
③ You will see a QR code — this is your payment address
④ Tap Share or Screenshot to save it
⑤ Print it out or display it on your phone screen at your counter
⑥ When a customer wants to pay — they open any Bitcoin wallet, scan your QR code, enter the amount, and send
⑦ You receive sats instantly — no POS machine, no transfer fees, no waiting
⑧ To convert sats to Naira: go to Cashwyre mini app → Crypto Offramp → enter amount → send to your Nigerian bank account
Benefits: No POS fees, no failed transfers, works 24/7, any amount from ₦100 upward.

HOW TO FIND BITCOIN MERCHANTS IN NIGERIA:
Use BTCMap — it is a mini app inside Fedi, or visit btcmap.org. It shows every merchant in Nigeria that accepts Bitcoin. Lagos, Abuja, Kano, Port Harcourt and more are on the map.

WHAT IS BITCOIN:
Digital money that no bank or government controls. Fixed supply of exactly 21 million — forever. Nobody can print more. You own it completely yourself. Send it anywhere in seconds like a WhatsApp message. The Naira has lost over 80% of its purchasing power since 2020. Bitcoin cannot be inflated.

WHY BITCOIN MATTERS FOR NIGERIANS:
1. Protect savings from Naira inflation
2. Send money internationally without Western Union fees or 48hr waits
3. Accept payments at your shop — just a QR code, no POS needed
4. Works 24/7, no bank holidays, no transfer limits
5. No bank account required — just a phone
6. Stack sats weekly and build wealth over time

WHAT IS FEDI:
A Bitcoin app with three things: a Lightning wallet, a chat system, and Mini Apps (Cashwyre, BTCMap, LnESIM). Your Bitcoin is protected by a federation — a group of trusted community members hold it together, not one company.

WALLET BACKUP:
Profile → Personal Backup → write recovery words on PHYSICAL PAPER — never a screenshot. Those words = complete access to your money.

LIGHTNING NETWORK:
Makes Bitcoin payments instant (under 1 second) and nearly free (less than ₦1 per transaction). Fedi uses Lightning automatically.

BITCOIN ABUJA COMMUNITY:
A Bitcoin circular economy community based in Abuja, Nigeria. 60+ members, 6 active merchants in Abuja and Minna. Weekly education classes. Led by Aisha Ummi Waziri. Part of a growing Nigerian Bitcoin movement.

KEEP YOUR RESPONSES:
- Short and to the point (mobile users)
- Numbered or bullet steps for instructions
- Warm and human — never robotic
- Always in the same language the user wrote in`

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: conversationHistory, system: systemPrompt })
  })

  if (!response.ok) throw new Error(`API responded with status ${response.status}`)
  const data = await response.json()
  if (data.error) throw new Error(data.error)
  return data.content?.[0]?.text || data.content || 'Something went wrong. Please try again.'
}

const B = {
  navy: '#1B2232', navyL: '#222D3F', navyLL: '#2A3650',
  navyB: 'rgba(212,168,67,.14)', gold: '#D4A843', goldD: '#A67C2A',
  goldF: 'rgba(212,168,67,.08)', goldB: 'rgba(212,168,67,.22)',
  white: '#EDF2FF', mid: '#8A9BB5', dim: '#4A5A72',
  green: '#34C77A', red: '#F87171',
}

const CSS = `
  @import url('https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #1B2232; -webkit-font-smoothing: antialiased; }
  ::-webkit-scrollbar { width: 0; }

  @keyframes splashFadeOut { from { opacity:1 } to { opacity:0 } }
  @keyframes chatFadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
  @keyframes slideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
  @keyframes slideFromLeft { from { opacity:0; transform:translateX(-14px) } to { opacity:1; transform:translateX(0) } }
  @keyframes slideFromRight { from { opacity:0; transform:translateX(14px) } to { opacity:1; transform:translateX(0) } }
  @keyframes dotBounce { 0%,60%,100% { transform:scale(1); opacity:.25 } 30% { transform:scale(1.8); opacity:1 } }
  @keyframes liveDot { 0%,100% { opacity:1 } 50% { opacity:.35 } }
  @keyframes pulse { 0%,100% { transform:scale(1); opacity:1 } 50% { transform:scale(1.15); opacity:.7 } }
  @keyframes micRing { 0% { box-shadow:0 0 0 0 rgba(212,168,67,.6) } 100% { box-shadow:0 0 0 12px rgba(212,168,67,0) } }

  .splash-leaving { animation: splashFadeOut 0.45s ease forwards; }
  .chat-entering  { animation: chatFadeIn 0.45s cubic-bezier(0.22,1,0.36,1) both; }
  .welcome-item-1 { animation: slideUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.00s both; }
  .welcome-item-2 { animation: slideUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.07s both; }
  .welcome-item-3 { animation: slideUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.14s both; }
  .welcome-item-4 { animation: slideUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.21s both; }
  .msg-user { animation: slideFromRight 0.28s cubic-bezier(0.22,1,0.36,1) both; }
  .msg-bot  { animation: slideFromLeft  0.28s cubic-bezier(0.22,1,0.36,1) both; }

  .prompt-card { transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease; cursor: pointer; -webkit-tap-highlight-color: transparent; }
  .prompt-card:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(212,168,67,.2) !important; border-color:rgba(212,168,67,.4) !important; }
  .prompt-card:active { transform:scale(0.97); }

  .send-button { transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease; }
  .send-button:not(:disabled):hover { transform:scale(1.08); box-shadow:0 4px 24px rgba(212,168,67,.6) !important; }
  .send-button:not(:disabled):active { transform:scale(0.96); }

  .mic-button { transition: transform 0.15s ease, box-shadow 0.15s ease; -webkit-tap-highlight-color: transparent; }
  .mic-button:hover { transform:scale(1.08); }
  .mic-button:active { transform:scale(0.94); }
  .mic-button.recording { animation: micRing 1s ease-out infinite; }

  .listen-btn { transition: color 0.15s ease; cursor: pointer; -webkit-tap-highlight-color: transparent; }
  .listen-btn:hover { color: #D4A843 !important; }

  .chat-input:focus { border-color:#D4A843 !important; box-shadow:0 0 0 3px rgba(212,168,67,.15) !important; outline:none; }

  .attach-btn { transition: color 0.15s ease, background 0.15s ease; -webkit-tap-highlight-color: transparent; }
  .attach-btn:hover { color:#D4A843 !important; background:rgba(212,168,67,.1) !important; }
  .attach-btn:active { transform:scale(0.94); }

  .remove-attach { transition: background 0.15s ease; -webkit-tap-highlight-color: transparent; }
  .remove-attach:hover { background:rgba(248,113,113,.25) !important; }

  .msg-file-pill { display:inline-flex; align-items:center; gap:6px; background:rgba(212,168,67,.15); border:1px solid rgba(212,168,67,.3); border-radius:8px; padding:5px 10px; font-size:11px; color:#D4A843; margin-bottom:6px; max-width:200px; overflow:hidden; }
  .msg-file-pill span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

  .error-bubble { background:rgba(248,113,113,.08); border:1px solid rgba(248,113,113,.25); border-radius:18px 18px 18px 4px; padding:12px 16px; font-size:13.5px; color:#F87171; line-height:1.6; }

  .lang-bar { display:flex; gap:6px; padding:8px 16px; overflow-x:auto; -webkit-overflow-scrolling:touch; background:#222D3F; border-bottom:1px solid rgba(212,168,67,.14); }
  .lang-pill { flex-shrink:0; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:500; cursor:pointer; border:1px solid rgba(212,168,67,.25); color:#8A9BB5; background:transparent; font-family:inherit; transition:all 0.15s ease; -webkit-tap-highlight-color:transparent; }
  .lang-pill.active, .lang-pill:hover { background:rgba(212,168,67,.12); border-color:rgba(212,168,67,.5); color:#D4A843; }
`

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

function MicIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="2"/>
      <path d="M5 10a7 7 0 0014 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function AttachIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
    </svg>
  )
}

function SplashScreen({ onDone }) {
  const [leaving, setLeaving] = useState(false)
  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 1800)
    const t2 = setTimeout(() => onDone(), 2250)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])
  return (
    <div className={leaving ? 'splash-leaving' : ''} style={{ position:'fixed', inset:0, zIndex:999, background:'#1B2232', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <img src="/logo.png" alt="Sabi AI" style={{ width:280, maxWidth:'75vw', height:'auto', objectFit:'contain' }}/>
    </div>
  )
}

export default function App() {
  const [splashDone, setSplashDone]         = useState(false)
  const [btc, setBtc]                       = useState({ usd:96300, ngn:154000000 })
  const [messages, setMessages]             = useState([])
  const [displayMsgs, setDisplayMsgs]       = useState([])
  const [inputText, setInputText]           = useState('')
  const [isLoading, setIsLoading]           = useState(false)
  const [speakingIdx, setSpeakingIdx]       = useState(null)
  const [attachedFile, setAttachedFile]     = useState(null)
  const [activeLang, setActiveLang]         = useState('en')
  const [isRecording, setIsRecording]       = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [micError, setMicError]             = useState('')
  const messagesEndRef = useRef(null)
  const fileInputRef   = useRef(null)
  const recognitionRef = useRef(null)

  const satNgn  = btc ? (btc.ngn / 100000000).toFixed(2) : '1.54'
  const welcome = WELCOME_BY_LANG[activeLang] || WELCOME_BY_LANG.en
  const prompts = PROMPTS_BY_LANG[activeLang] || PROMPTS_BY_LANG.en

  useEffect(() => {
    fetchBTC().then(setBtc)
    const iv = setInterval(() => fetchBTC().then(setBtc), 180000)
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SR) setVoiceSupported(true)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [displayMsgs, isLoading])

const startRecording = useCallback(() => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) {
    setMicError('Voice not supported on this browser. Please type your question.')
    return
  }
  setMicError('')

  // Android Chrome needs this exact flow
  const isAndroid = /android/i.test(navigator.userAgent)
  const isChrome = /chrome/i.test(navigator.userAgent)

  const startSR = () => {
    const langMap = { en:'en-NG', ha:'ha', yo:'yo', ig:'ig', pc:'en-NG' }
    const recognition = new SR()
    recognition.lang = langMap[activeLang] || 'en-NG'
    recognition.continuous = false
    recognition.interimResults = !isAndroid // Android handles interim poorly
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsRecording(true)
      setMicError('')
    }

    recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(r => r[0].transcript)
        .join('')
      setInputText(transcript)
    }

    recognition.onspeechend = () => {
      recognition.stop()
    }

    recognition.onend = () => {
      setIsRecording(false)
      recognitionRef.current = null
    }

    recognition.onerror = (e) => {
      setIsRecording(false)
      recognitionRef.current = null
      if (e.error === 'not-allowed') {
        setMicError('Microphone blocked. Go to your browser Settings → Site Settings → Microphone → allow this site.')
      } else if (e.error === 'no-speech') {
        setMicError('No speech detected. Tap mic and speak clearly.')
      } else if (e.error === 'network') {
        setMicError('Network error. Check your connection and try again.')
      } else {
        setMicError('Voice error. Please type your question instead.')
      }
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch(e) {
      setMicError('Could not start voice. Please type your question.')
    }
  }

  // Always request mic permission first
  if (navigator.mediaDevices?.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => startSR())
      .catch(() => {
        setMicError('Microphone access denied. Go to browser Settings → Site Settings → Microphone → allow this site.')
      })
  } else {
    // Fallback for older browsers
    startSR()
  }
}, [activeLang])


  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop()
    setIsRecording(false)
  }, [])

  const toggleMic = useCallback(() => {
    if (isRecording) { stopRecording() } else { startRecording() }
  }, [isRecording, startRecording, stopRecording])

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
    if (messages.length === 0 && text) {
      const detected = detectLang(text)
      if (detected !== 'en') setActiveLang(detected)
    }
    setInputText('')
    setAttachedFile(null)
    setMicError('')
    setDisplayMsgs(prev => [...prev, { r:'user', c:text, file }])
    const contentParts = []
    if (file) {
      if (file.type === 'image') {
        contentParts.push({ type:'image', source:{ type:'base64', media_type:file.mediaType, data:file.base64 } })
      } else {
        contentParts.push({ type:'document', source:{ type:'base64', media_type:'application/pdf', data:file.base64 } })
      }
    }
    contentParts.push({ type:'text', text: text || 'Please look at this and help me understand it.' })
    const newHistory = [...messages, { role:'user', content:contentParts }]
    setMessages(newHistory)
    setIsLoading(true)
    try {
      const reply = await sendToAI(newHistory, btc)
      setMessages(prev => [...prev, { role:'assistant', content:[{ type:'text', text:reply }] }])
      setDisplayMsgs(prev => [...prev, { r:'bot', c:reply }])
    } catch (err) {
      const errMsg = ERROR_BY_LANG[activeLang] || ERROR_BY_LANG.en
      setDisplayMsgs(prev => [...prev, { r:'error', c:errMsg }])
      setMessages(prev => [...prev, { role:'assistant', content:[{ type:'text', text:errMsg }] }])
    }
    setIsLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const handleListen = (text, idx) => {
    if (speakingIdx === idx) {
      window.speechSynthesis?.cancel()
      setSpeakingIdx(null)
    } else {
      speak(text)
      setSpeakingIdx(idx)
      const check = setInterval(() => {
        if (!window.speechSynthesis?.speaking) { setSpeakingIdx(null); clearInterval(check) }
      }, 300)
    }
  }

  const hasMessages = displayMsgs.length > 0
  const langLabels  = { en:'EN', ha:'HA', yo:'YO', ig:'IG', pc:'PID' }

  return (
    <>
      <style>{CSS}</style>

      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}

      <div
        className={splashDone ? 'chat-entering' : ''}
        style={{ background:B.navy, minHeight:'100dvh', maxWidth:440, margin:'0 auto', fontFamily:"'Satoshi', -apple-system, sans-serif", color:B.white, display:'flex', flexDirection:'column' }}
      >
        {/* HEADER — logo only, no text */}
        <div style={{ padding:'12px 16px', background:B.navyL, borderBottom:`1px solid ${B.navyB}`, display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:10 }}>
          <img src="/logo.png" alt="Sabi AI" style={{ height:28, width:'auto', objectFit:'contain', maxWidth:140 }}/>

         <div style={{ display:'flex', alignItems:'center', gap:7, background:B.goldF, border:`1px solid ${B.goldB}`, borderRadius:100, padding:'5px 13px' }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:B.green, animation:'liveDot 2s ease infinite' }}/>
            <span style={{ fontSize:11, fontWeight:500, color:B.white }}>1 sat</span>
            <span style={{ fontSize:12, fontWeight:700, color:B.gold }}>₦{satNgn}</span>
          </div>
        </div>

        {/* LANGUAGE BAR */}
        <div className="lang-bar">
          {Object.entries(langLabels).map(([code, label]) => (
            <button key={code} className={`lang-pill${activeLang === code ? ' active' : ''}`} onClick={() => setActiveLang(code)}>
              {label}
            </button>
          ))}
        </div>

        {/* BODY */}
        <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>

          {/* WELCOME */}
          {!hasMessages && !isLoading && (
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 22px 60px' }}>
              <h1 className="welcome-item-1" style={{ fontSize:24, fontWeight:700, color:B.white, textAlign:'center', marginBottom:10 }}>
                {welcome.greeting}
              </h1>
              <p className="welcome-item-2" style={{ fontSize:14, color:B.mid, textAlign:'center', lineHeight:1.65, marginBottom:6, maxWidth:290 }}>
                {welcome.sub}
              </p>
              <p className="welcome-item-2" style={{ fontSize:11, color:B.dim, textAlign:'center', marginBottom:28, letterSpacing:0.4 }}>
                {welcome.langs}
              </p>
              <div className="welcome-item-3" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, width:'100%', maxWidth:360 }}>
                {prompts.map((p, i) => (
                  <button key={i} onClick={() => sendMessage(p.msg)} className="prompt-card"
                    style={{ background:B.navyL, border:`1px solid ${B.navyB}`, borderRadius:16, padding:'16px 14px 14px', textAlign:'left', boxShadow:'0 2px 12px rgba(0,0,0,.3)', fontFamily:'inherit' }}>
                    <div style={{ width:20, height:3, borderRadius:2, background: i%2===0 ? B.gold : B.goldD, marginBottom:12, opacity: i%2===0 ? 1 : 0.7 }}/>
                    <div style={{ fontSize:13, fontWeight:400, color:B.white, lineHeight:1.4 }}>{p.label}</div>
                  </button>
                ))}
              </div>
              {voiceSupported && (
                <div className="welcome-item-4" style={{ marginTop:20, display:'flex', alignItems:'center', gap:6, color:B.dim, fontSize:11 }}>
                  <MicIcon/>
                  <span>Tap the mic to speak instead of typing</span>
                </div>
              )}
            </div>
          )}
{/* MESSAGES */}
{hasMessages && (
  <div style={{ padding:'16px 16px 8px', display:'flex', flexDirection:'column', gap:16 }}>
    {displayMsgs.map((msg, i) => {
      const cleanText =
        typeof msg.c === 'string'
          ? msg.c.replace(/\*(.*?)\*/g, '$1').replace(/\*/g, '')
          : msg.c;

      return (
        <div key={i}
          className={msg.r === 'user' ? 'msg-user' : 'msg-bot'}
          style={{ display:'flex', justifyContent: msg.r==='user' ? 'flex-end' : 'flex-start', alignItems:'flex-start', gap:9 }}
        >
          {msg.r !== 'user' && (
            <img src="/logo.png" alt="Sabi" style={{ width:32, height:32, objectFit:'contain', flexShrink:0, marginTop:2 }}/>
          )}

          <div style={{ maxWidth:'80%', display:'flex', flexDirection:'column', alignItems: msg.r==='user' ? 'flex-end' : 'flex-start', gap:5 }}>
            
            {msg.r === 'error' ? (
              <div className="error-bubble">{cleanText}</div>
            ) : (
              <div style={{
                padding:'12px 16px',
                fontSize:14,
                lineHeight:1.75,
                whiteSpace:'pre-wrap',
                fontFamily:'inherit',
                ...(msg.r === 'user' ? {
                  background:`linear-gradient(135deg, ${B.gold}, ${B.goldD})`,
                  color:'#0D0A00',
                  fontWeight:600,
                  borderRadius:'18px 18px 4px 18px',
                  boxShadow:'0 3px 14px rgba(212,168,67,.3)',
                } : {
                  background:B.navyL,
                  color:B.white,
                  borderRadius:'18px 18px 18px 4px',
                  border:`1px solid ${B.navyB}`,
                }),
              }}>
                
                {msg.file && (
                  <div style={{ marginBottom: cleanText ? 8 : 0 }}>
                    {msg.file.type === 'image' && msg.file.previewUrl ? (
                      <img src={msg.file.previewUrl} alt="attachment" style={{ maxWidth:200, maxHeight:160, borderRadius:10, display:'block', objectFit:'cover' }}/>
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

                {cleanText}
              </div>
            )}

            {msg.r === 'bot' && (
              <button
                className="listen-btn"
                onClick={() => handleListen(cleanText, i)}
                style={{
                  display:'flex',
                  alignItems:'center',
                  gap:4,
                  background:'transparent',
                  border:'none',
                  padding:'2px 4px',
                  borderRadius:6,
                  fontSize:11,
                  color: speakingIdx===i ? B.gold : B.dim,
                  fontFamily:'inherit',
                  cursor:'pointer'
                }}
              >
                <SpeakerIcon/>{speakingIdx===i ? 'Stop' : 'Listen'}
              </button>
            )}
          </div>
        </div>
      );
    })}

    {isLoading && (
      <div className="msg-bot" style={{ display:'flex', alignItems:'flex-start', gap:9 }}>
        <img src="/logo.png" alt="Sabi" style={{ width:32, height:32, objectFit:'contain', flexShrink:0, marginTop:2 }}/>
        <div style={{ background:B.navyL, borderRadius:'18px 18px 18px 4px', padding:'14px 18px', border:`1px solid ${B.navyB}` }}>
          <div style={{ display:'flex', gap:5, alignItems:'center' }}>
            {[0,1,2].map(j => (
              <div key={j} style={{ width:7, height:7, borderRadius:'50%', background:B.gold, animation:`dotBounce 1.2s ${j*0.15}s ease-in-out infinite` }}/>
            ))}
          </div>
        </div>
      </div>
    )}

    <div ref={messagesEndRef}/>
  </div>
)}
        </div>

        {/* INPUT BAR */}
        <div style={{ padding:'12px 16px 24px', background:B.navyL, borderTop:`1px solid ${B.navyB}`, position:'sticky', bottom:0 }}>

          {isRecording && (
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, padding:'8px 12px', background:'rgba(212,168,67,.08)', border:`1px solid ${B.goldB}`, borderRadius:12 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:B.gold, animation:'pulse 1s ease-in-out infinite' }}/>
              <span style={{ fontSize:12, color:B.gold, fontWeight:500 }}>Listening… tap mic to stop</span>
            </div>
          )}

          {micError && (
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, padding:'8px 12px', background:'rgba(248,113,113,.08)', border:`1px solid rgba(248,113,113,.25)`, borderRadius:12 }}>
              <span style={{ fontSize:12, color:B.red }}>{micError}</span>
            </div>
          )}

          {attachedFile && (
            <div style={{ display:'flex', alignItems:'center', gap:8, background:B.navy, border:`1px solid ${B.navyB}`, borderRadius:12, padding:'7px 10px', marginBottom:8, maxWidth:260 }}>
              {attachedFile.type === 'image' && attachedFile.previewUrl ? (
                <img src={attachedFile.previewUrl} alt="preview" style={{ width:34, height:34, borderRadius:7, objectFit:'cover', flexShrink:0 }}/>
              ) : (
                <div style={{ width:34, height:34, borderRadius:7, background:B.navyLL, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={B.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
              )}
              <span style={{ fontSize:11.5, color:B.white, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{attachedFile.name}</span>
              <button className="remove-attach" onClick={clearAttachment}
                style={{ width:20, height:20, borderRadius:'50%', background:B.navyLL, border:'none', color:B.mid, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, flexShrink:0 }}>✕</button>
            </div>
          )}

          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,application/pdf" onChange={handleFileChange} style={{ display:'none' }}/>

            <button className="attach-btn" onClick={() => fileInputRef.current?.click()}
              style={{ width:40, height:40, borderRadius:12, background: attachedFile ? B.goldF : 'transparent', border:`1px solid ${attachedFile ? B.goldB : B.navyB}`, color: attachedFile ? B.gold : B.dim, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <AttachIcon/>
            </button>

            <input className="chat-input" value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={isRecording ? 'Listening…' : (attachedFile ? 'Add a question… (optional)' : 'Ask anything…')}
              style={{ flex:1, padding:'13px 18px', background:B.navy, border:`1px solid ${B.navyB}`, borderRadius:28, fontSize:14, color:B.white, fontFamily:'inherit', transition:'border-color 0.2s, box-shadow 0.2s' }}
            />

            {voiceSupported && !inputText.trim() && !attachedFile && (
              <button className={`mic-button${isRecording ? ' recording' : ''}`} onClick={toggleMic}
                style={{ width:46, height:46, borderRadius:'50%', border:'none', background: isRecording ? `linear-gradient(135deg, ${B.gold}, ${B.goldD})` : B.navyLL, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color: isRecording ? '#0D0A00' : B.mid, boxShadow: isRecording ? '0 3px 16px rgba(212,168,67,.5)' : 'none' }}>
                <MicIcon/>
              </button>
            )}

            {(inputText.trim() || attachedFile) && (
              <button onClick={() => sendMessage()} disabled={isLoading} className="send-button"
                style={{ width:46, height:46, borderRadius:'50%', border:'none', background: !isLoading ? `linear-gradient(135deg, ${B.gold}, ${B.goldD})` : B.navyLL, cursor: !isLoading ? 'pointer' : 'default', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow: !isLoading ? '0 3px 16px rgba(212,168,67,.4)' : 'none' }}>
                <SendIcon color={!isLoading ? '#0D0A00' : B.dim}/>
              </button>
            )}
          </div>

          <div style={{ fontSize:9, color:B.dim, textAlign:'center', marginTop:8, letterSpacing:0.8 }}>
            Bitcoin Abuja · Powered by Fedi
          </div>
        </div>
      </div>
    </>
  )
}
