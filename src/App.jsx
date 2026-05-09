import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const COMMUNITY = {
  id: 'bitcoin-abuja',
  name: 'Bitcoin Abuja',
  city: 'Abuja, Nigeria',
  communityLink:
    'fedi:community210v3xzat5dphhyhmsw43xketeygazycehvscnydmzxsmxzvnyx4jkze3jv5ek2e3jvycxvep4x4jnydtzvscrve35x4nrxd3hx33nxdfk893kgwpkvsenxvpnvvukyen9v3sjytpzvdhk6mt4de5hg72lw46kjezldpjhsg36ygmr2vt98ycnscejveskxef5vsex2ct9x3jnqcm98ycxxvtyxqmxxetxvgcrgvmpx43rxdeexsexvenyvyekgdf4vd3xzvtrv93ngvmrygkzyer9vde8jur5d9hkuhmtv4ujyw3zxe85umetgc6rj56ddyh4qntsd4ujk2m4v4s4wn2sfa6ksntnfed85nnz2enxzstpfdrrs0fz05uvt3ry',
  faucetLink: 'https://prod.fedi-faucet.dev.fedibtc.com/c/9651a0b10fd1deafbaf4df554dc4bf85',
  appLogo: '/logo.png',
  communityQR: '/community-qr.png',
  bitcoinLogo: '/bitcoin-abuja-logo.png',
  fediLogoDark: '/fedi-logo-dark.png',
  memberCount: '60+',
  merchantCount: '6',
}

const COLORS = {
  bg: '#111827',
  panel: '#1F2937',
  panel2: '#0F172A',
  border: 'rgba(212,168,67,0.16)',
  gold: '#D4A843',
  goldD: '#A67C2A',
  teal: '#2DD4BF',
  orange: '#F97316',
  red: '#F87171',
  white: '#F9FAFB',
  mid: '#9CA3AF',
  dim: '#4B5563',
  green: '#34D399',
}

const CATS = [
  { id: 'food', label: 'Food & Restaurant', emoji: '🍲' },
  { id: 'fashion', label: 'Fashion & Clothing', emoji: '👗' },
  { id: 'beauty', label: 'Beauty & Hair', emoji: '💇' },
  { id: 'tech', label: 'Electronics & Tech', emoji: '💻' },
  { id: 'pharmacy', label: 'Pharmacy & Health', emoji: '💊' },
  { id: 'grocery', label: 'Grocery & Market', emoji: '🛒' },
  { id: 'transport', label: 'Transport & Logistics', emoji: '🚗' },
  { id: 'education', label: 'Education & Training', emoji: '📚' },
  { id: 'services', label: 'Services & Repairs', emoji: '🔧' },
  { id: 'other', label: 'Other', emoji: '🏪' },
]

const PROMPTS = {
  en: [
    { label: '1 sat price in Naira', msg: 'What is 1 sat worth in Naira right now?' },
    { label: 'Buy BTC with Naira', msg: 'How do I buy Bitcoin with Naira on Fedi?' },
    { label: 'Accept Bitcoin at my shop', msg: '__MERCHANT__' },
    { label: 'New to Bitcoin? Start here', msg: '__MEMBER__' },
  ],
  ha: [
    { label: 'Farashin sat a Naira', msg: 'Nawa ne 1 sat a Naira yanzu?' },
    { label: 'Saya Bitcoin da Naira', msg: 'Ta yaya zan saya Bitcoin da Naira a Fedi?' },
    { label: 'Karbi Bitcoin a kantin na', msg: '__MERCHANT__' },
    { label: 'Sabon zuwa Bitcoin?', msg: '__MEMBER__' },
  ],
  yo: [
    { label: 'Iye sat ni Naira', msg: 'Elo ni 1 sat ni Naira ni bayi?' },
    { label: 'Ra Bitcoin pelu Naira', msg: 'Bawo ni mo se le ra Bitcoin pelu Naira lori Fedi?' },
    { label: 'Gba Bitcoin ni ile itaja mi', msg: '__MERCHANT__' },
    { label: 'Tuntun si Bitcoin?', msg: '__MEMBER__' },
  ],
  ig: [
    { label: 'Ego 1 sat na Naira', msg: 'Ego ole ka 1 sat na Naira ugbu a?' },
    { label: 'Zuo Bitcoin na Naira', msg: 'Kedu ka m ga-esi zuo Bitcoin na Naira na Fedi?' },
    { label: 'Nata Bitcoin n’ụlọ ahịa m', msg: '__MERCHANT__' },
    { label: 'Ọhụrụ na Bitcoin?', msg: '__MEMBER__' },
  ],
  pc: [
    { label: '1 sat price for Naira', msg: 'How much be 1 sat for Naira right now?' },
    { label: 'Buy BTC with Naira', msg: 'How I go take buy Bitcoin with Naira for Fedi?' },
    { label: 'Accept Bitcoin for my shop', msg: '__MERCHANT__' },
    { label: 'New to Bitcoin?', msg: '__MEMBER__' },
  ],
}

const WELCOME = {
  en: { title: 'How can I help you?', sub: 'Ask about Bitcoin, Fedi, merchants, savings, or payments.' },
  ha: { title: 'Yaya zan taimaka?', sub: 'Tambayi Bitcoin, Fedi, yan kasuwa, ajiya, ko biyan kudi.' },
  yo: { title: 'Bawo ni mo se le ran o lowo?', sub: 'Beere nipa Bitcoin, Fedi, awon onisowo, ifowopamo, tabi isanwo.' },
  ig: { title: 'Kedu ka m ga-esi nyere gi aka?', sub: 'Jụọ maka Bitcoin, Fedi, ndi ahia, nchekwa ego, ma ọ bụ ugwo.' },
  pc: { title: 'How I fit help you?', sub: 'Ask about Bitcoin, Fedi, merchants, savings, or payments.' },
}

const ERROR_BY_LANG = {
  en: "Sabi couldn't respond right now. Check your connection and try again.",
  ha: 'Sabi bai iya amsawa yanzu ba. Duba hadin ka ka sake gwadawa.',
  yo: 'Sabi ko le dahun bayi. Jowo sayewo asopo re ki o tun gbiyanju.',
  ig: 'Sabi enweghi ike iza ugbu a. Biko lelee njikọ gi ma nwaa ozo.',
  pc: 'Sabi no fit answer now. Abeg check your connection and try again.',
}

const BILINGUAL = {
  en: ['Bitcoin accepted here', null],
  'en-ha': ['Bitcoin accepted here', 'Muna karbar Bitcoin'],
  'en-yo': ['Bitcoin accepted here', 'A gba Bitcoin'],
  'en-ig': ['Bitcoin accepted here', 'Anyi na-anabata Bitcoin'],
  'en-pc': ['Bitcoin accepted here', 'We dey collect Bitcoin'],
}

const CSS = `
*{box-sizing:border-box} html,body,#root{margin:0;min-height:100%;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased}
body{-webkit-tap-highlight-color:transparent} ::-webkit-scrollbar{width:0;height:0}
button,input,textarea{font:inherit} a{text-decoration:none}
@keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes ring{0%{box-shadow:0 0 0 0 rgba(212,168,67,.5)}100%{box-shadow:0 0 0 10px rgba(212,168,67,0)}}
.app-shell{min-height:100dvh;max-width:440px;margin:0 auto;background:${COLORS.bg};color:${COLORS.white};display:flex;flex-direction:column}
.panel{background:${COLORS.panel};border:1px solid ${COLORS.border};border-radius:18px}
.btn{cursor:pointer;transition:transform .15s,opacity .15s,border-color .15s,background .15s}
.btn:active{transform:scale(.98)}
.input:focus{outline:none;border-color:${COLORS.gold} !important;box-shadow:0 0 0 3px rgba(212,168,67,.12) !important}
.fade{animation:rise .28s cubic-bezier(.22,1,.36,1) both}
.mic-ring{animation:ring 1s ease-out infinite}
`

const icon = {
  Back: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  Mic: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="2" /><path d="M5 10a7 7 0 0014 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
  ),
  Attach: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>
  ),
  Send: ({ color }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 19V5M5 12l7-7 7 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  Speaker: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M19.07 4.93a10 10 0 010 14.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
  ),
  Check: ({ color = COLORS.teal }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill={color + '22'} stroke={color} strokeWidth="1.5" /><path d="M8 12l3 3 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  Download: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
  ),
}

const inputStyle = {
  padding: '13px 14px',
  background: COLORS.bg,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 14,
  fontSize: 14,
  color: COLORS.white,
  outline: 'none',
}

function getLang(text) {
  const t = text.toLowerCase()
  const list = {
    ha: ['ina', 'yaya', 'sannu', 'kudi', 'mene', 'yaushe', 'wane', 'kai', 'ba', 'ne', 'ce', 'don', 'da'],
    yo: ['bawo', 'elo', 'jowo', 'owo', 'ni', 'mo', 'wa', 'ti', 'fun', 'ati'],
    ig: ['kedu', 'gini', 'ego', 'ya', 'ha', 'site', 'na'],
    pc: ['abeg', 'wetin', 'oya', 'dem', 'wey', 'nah', 'comot', 'chop'],
  }
  const words = t.split(/\s+/)
  const score = (arr) => words.filter((w) => arr.includes(w)).length
  const scores = Object.fromEntries(Object.entries(list).map(([k, arr]) => [k, score(arr)]))
  const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
  return top && top[1] > 0 ? top[0] : 'en'
}

async function fetchBTC() {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,ngn')
    const data = await res.json()
    if (data?.bitcoin?.usd && data?.bitcoin?.ngn) return data.bitcoin
  } catch (e) {}
  return { usd: 96300, ngn: 154000000 }
}

async function logConversation(language, communityId = COMMUNITY.id) {
  try {
    await supabase.from('conversations').insert({ language, type: 'chat', community_id: communityId })
  } catch (e) {}
}

async function logOnboarding(type, shopName = null, location = null, category = null, communityId = COMMUNITY.id) {
  try {
    await supabase.from('onboardings').insert({ type, shop_name: shopName, location, category, completed: true, community_id: communityId })
  } catch (e) {}
}

async function submitRequest(data) {
  try {
    await supabase.from('community_requests').insert(data)
  } catch (e) {}
}

async function sendToAI(history, btc, lang) {
  const satN = btc ? (btc.ngn / 100000000).toFixed(2) : '1.54'
  const usd = btc ? btc.usd.toLocaleString() : '96,300'
  const ngnM = btc ? (btc.ngn / 1000000).toFixed(0) : '154'
  const system =
    'You are Sabi, the Bitcoin assistant for Bitcoin Abuja in Abuja, Nigeria. ' +
    'Always reply in the same language the user used. ' +
    'Never use markdown, asterisks, or bullets unless needed for a short list. Plain text only. ' +
    '1 satoshi equals ' + satN + ' Naira. 1 Bitcoin equals $' + usd + ' and about ' + ngnM + 'M Naira. ' +
    'Keep replies short, direct, and practical. ' +
    'If the user asks how to buy Bitcoin, explain: Fedi > Mini Apps > Cashwyre > Crypto Onramp > NGN > bank transfer. ' +
    'If the user asks how to accept Bitcoin, explain: Fedi wallet > Receive > show QR > customer scans. '

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: history, system, language: lang, tts: true }),
  })
  if (!res.ok) throw new Error('API ' + res.status)
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return { text: data.content?.[0]?.text || '', audio: data.audio || null }
}

function audioFromBase64(base64) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  const blob = new Blob([bytes], { type: 'audio/mpeg' })
  const url = URL.createObjectURL(blob)
  const audio = new Audio(url)
  audio.__url = url
  return audio
}

function speakFallback(text, lang) {
  if (!window.speechSynthesis) return false
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(String(text || '').replace(/[₿⚡●#*•]/g, ' '))
  u.lang = { en: 'en-NG', ha: 'ha', yo: 'yo', ig: 'ig', pc: 'en-NG' }[lang] || 'en-NG'
  u.rate = 0.92
  window.speechSynthesis.speak(u)
  return true
}

function Header({ onStats, satPrice, speaking, onStopSpeak }) {
  return (
    <div style={{ padding: '12px 14px', background: COLORS.panel, borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, position: 'sticky', top: 0, zIndex: 10 }}>
      <img src={COMMUNITY.appLogo} alt="Sabi AI" style={{ height: 32, width: 'auto', objectFit: 'contain' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {speaking && (
          <button onClick={onStopSpeak} className="btn" style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(45,212,191,.1)', border: `1px solid rgba(45,212,191,.25)`, borderRadius: 999, padding: '5px 10px', fontSize: 11, color: COLORS.teal, fontWeight: 700 }}>
            <icon.Speaker /> Stop
          </button>
        )}
        <button onClick={onStats} className="btn" style={{ fontSize: 11, color: COLORS.white, background: 'rgba(212,168,67,.12)', border: `1px solid rgba(212,168,67,.22)`, borderRadius: 999, padding: '6px 10px', fontWeight: 800 }}>
          Stats
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(212,168,67,.08)', border: `1px solid rgba(212,168,67,.2)`, borderRadius: 999, padding: '5px 11px' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS.green, animation: 'pulse 2s ease infinite' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.gold }}>₦{satPrice} / sat</span>
        </div>
      </div>
    </div>
  )
}

function SubHeader({ title, color, onBack, right = null }) {
  return (
    <div style={{ padding: '12px 14px', background: COLORS.panel, borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, position: 'sticky', top: 0, zIndex: 10 }}>
      <button className="btn" onClick={onBack} style={{ background: 'transparent', border: 'none', color: COLORS.mid, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', fontSize: 13 }}>
        <icon.Back /> Back
      </button>
      <div style={{ flex: 1, textAlign: 'center', fontSize: 12, fontWeight: 800, color: color || COLORS.white, letterSpacing: 0.8, textTransform: 'uppercase' }}>{title}</div>
      <div style={{ minWidth: 40, display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
    </div>
  )
}

function QuickCard({ title, subtitle, accent, onClick, big = false }) {
  return (
    <button onClick={onClick} className="btn panel" style={{ width: '100%', padding: big ? '16px' : '14px', textAlign: 'left', border: `1px solid ${accent}33`, background: `${accent}08`, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: big ? 42 : 34, height: big ? 42 : 34, borderRadius: 13, background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent === COLORS.teal ? '#0D1A1A' : '#0D0A00', fontSize: big ? 20 : 17, flexShrink: 0 }}>
        {big ? '₿' : '•'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: big ? 14.5 : 13.2, fontWeight: 800, color: COLORS.white, lineHeight: 1.25, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 11.2, color: COLORS.mid, lineHeight: 1.45 }}>{subtitle}</div>
      </div>
      <div style={{ color: accent, fontSize: 18, flexShrink: 0 }}>→</div>
    </button>
  )
}

function JoinScreen({ title, color, onDone, onBack }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <SubHeader title={title} color={color} onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="panel" style={{ padding: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.white, marginBottom: 8, textAlign: 'center' }}>Join Bitcoin Abuja on Fedi</div>
          <div style={{ fontSize: 12.5, color: COLORS.gold, background: 'rgba(212,168,67,.08)', border: `1px solid rgba(212,168,67,.2)`, borderRadius: 12, padding: '10px 12px', lineHeight: 1.6, textAlign: 'center' }}>
            Join a federation first from the Wallet tab. Then join the community separately.
          </div>
          <div style={{ background: 'white', borderRadius: 14, padding: 12, display: 'inline-flex', margin: '14px auto 0' }}>
            <img src={COMMUNITY.communityQR} alt="Community QR" style={{ width: 160, height: 160, display: 'block' }} />
          </div>
          <div style={{ fontSize: 12, color: COLORS.mid, textAlign: 'center', lineHeight: 1.6, marginTop: 12 }}>Open Fedi → scan this QR</div>
          <button className="btn" onClick={() => { window.location.href = COMMUNITY.communityLink }} style={{ width: '100%', marginTop: 12, padding: 13, borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${COLORS.orange}, #c2610f)`, color: 'white', fontWeight: 800 }}>
            Open in Fedi
          </button>
          <button className="btn" onClick={onDone} style={{ width: '100%', marginTop: 10, background: 'transparent', border: 'none', color: COLORS.dim, fontSize: 12, padding: 6 }}>
            I have already joined
          </button>
        </div>
      </div>
    </div>
  )
}

function MerchantOnboarding({ onBack }) {
  const [step, setStep] = useState(0)
  const [shopName, setShopName] = useState('')
  const [shopCat, setShopCat] = useState('')
  const [shopLoc, setShopLoc] = useState('')
  const [qrData, setQrData] = useState(null)
  const [bannerMode, setBannerMode] = useState('print')
  const [bannerLang, setBannerLang] = useState('en')
  const [phase, setPhase] = useState('start')
  const [ready, setReady] = useState(false)
  const canvasRef = useRef(null)

  const steps = [
    { ins: 'Step 1 of 4', q: 'What is your shop name?', yes: 'Great.', no: 'Add a name for the banner.' },
    { ins: 'Step 2 of 4', q: 'What type of business is this?', yes: 'Good.', no: 'Choose a category.' },
    { ins: 'Step 3 of 4', q: 'Where is your shop located?', yes: 'Nice.', no: 'Add a location or skip.' },
    { ins: 'Step 4 of 4', q: 'Upload your payment QR screenshot', yes: 'Ready to generate.', no: 'Upload a QR screenshot from Fedi.' },
  ]

  const current = steps[Math.min(step, steps.length - 1)]
  const catEmoji = useMemo(() => CATS.find((c) => c.id === shopCat)?.emoji || '🏪', [shopCat])

  useEffect(() => {
    if (phase !== 'banner' || !canvasRef.current || !qrData) return
    setReady(false)
    let cancelled = false

    const draw = async () => {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      const isPrint = bannerMode === 'print'
      const W = isPrint ? 1240 : 1080
      const H = isPrint ? 620 : 1080
      canvas.width = W
      canvas.height = H

      const loadImg = (src) => new Promise((resolve) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = () => resolve(null)
        img.src = src
      })

      const [btcLogo, fediLogo, qrImg] = await Promise.all([loadImg(COMMUNITY.bitcoinLogo), loadImg(COMMUNITY.fediLogoDark), loadImg(qrData)])
      if (cancelled) return

      const [line1, line2] = BILINGUAL[bannerLang] || BILINGUAL.en
      const background = ctx.createLinearGradient(0, 0, 0, H)
      background.addColorStop(0, '#0E1524')
      background.addColorStop(1, '#111827')
      ctx.fillStyle = background
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = COLORS.orange
      ctx.fillRect(0, 0, W, 10)

      const drawWhitePanel = (x, y, w, h, r = 22) => {
        ctx.fillStyle = 'rgba(255,255,255,.97)'
        rounded(ctx, x, y, w, h, r)
        ctx.fill()
      }

      if (isPrint) {
        if (btcLogo) ctx.drawImage(btcLogo, 72, 30, 180, 50)
        if (fediLogo) ctx.drawImage(fediLogo, W - 120, H - 42, 98, 26)
        drawWhitePanel(700, 110, 430, 370, 24)
        if (qrImg) ctx.drawImage(qrImg, 740, 150, 350, 350)
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillStyle = COLORS.gold
        ctx.font = '700 22px Arial'
        ctx.fillText('BITCOIN ACCEPTED HERE', 72, 110)
        ctx.fillStyle = '#EDF2FF'
        ctx.font = '900 58px Arial'
        ctx.fillText((shopName || 'Your Shop').slice(0, 18), 72, 155)
        ctx.fillStyle = COLORS.orange
        ctx.font = '900 42px Arial'
        ctx.fillText('Accept Bitcoin', 72, 234)
        ctx.fillStyle = COLORS.teal
        ctx.font = '700 22px Arial'
        ctx.fillText('Lightning payments. Instant settlement.', 72, 292)
        if (shopLoc) {
          ctx.fillStyle = '#9CA3AF'
          ctx.font = '500 20px Arial'
          ctx.fillText('📍 ' + shopLoc, 72, 332)
        }
        ctx.fillStyle = '#E5E7EB'
        ctx.font = '700 19px Arial'
        ctx.fillText(`${catEmoji} ${CATS.find((c) => c.id === shopCat)?.label || 'Business'}`, 72, shopLoc ? 374 : 336)
        ctx.fillStyle = '#9CA3AF'
        ctx.font = '500 16px Arial'
        ctx.fillText(line1, 72, shopLoc ? 410 : 372)
        if (line2) ctx.fillText(line2, 72, shopLoc ? 438 : 400)
        ctx.fillStyle = '#E5E7EB'
        ctx.font = '500 15px Arial'
        ctx.fillText('Bitcoin Abuja · Powered by Fedi', 72, H - 44)
      } else {
        if (btcLogo) ctx.drawImage(btcLogo, 72, 30, 180, 50)
        if (fediLogo) ctx.drawImage(fediLogo, (W - 96) / 2, H - 42, 96, 26)
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillStyle = COLORS.gold
        ctx.font = '700 24px Arial'
        ctx.fillText('BITCOIN ACCEPTED HERE', W / 2, 112)
        ctx.fillStyle = '#EDF2FF'
        ctx.font = '900 64px Arial'
        ctx.fillText((shopName || 'Your Shop').slice(0, 18), W / 2, 158)
        ctx.fillStyle = COLORS.orange
        ctx.font = '900 48px Arial'
        ctx.fillText('Accept Bitcoin', W / 2, 244)
        ctx.fillStyle = COLORS.teal
        ctx.font = '700 22px Arial'
        ctx.fillText('Lightning payments. Instant settlement.', W / 2, 308)
        ctx.fillStyle = '#9CA3AF'
        ctx.font = '500 20px Arial'
        ctx.fillText(shopLoc || 'Abuja, Nigeria', W / 2, 348)
        ctx.fillStyle = '#E5E7EB'
        ctx.font = '700 20px Arial'
        ctx.fillText(`${catEmoji} ${CATS.find((c) => c.id === shopCat)?.label || 'Business'}`, W / 2, 386)
        drawWhitePanel(140, 440, 800, 400, 28)
        if (qrImg) ctx.drawImage(qrImg, 400, 490, 280, 280)
        ctx.fillStyle = '#9CA3AF'
        ctx.font = '500 18px Arial'
        ctx.fillText('Scan to pay', W / 2, 790)
        ctx.fillStyle = '#E5E7EB'
        ctx.font = '500 16px Arial'
        ctx.fillText(line1, W / 2, 824)
        if (line2) ctx.fillText(line2, W / 2, 852)
      }

      if (!cancelled) setReady(true)
    }

    draw().catch(() => {
      if (!cancelled) setReady(true)
    })

    return () => { cancelled = true }
  }, [phase, bannerMode, qrData, shopName, shopCat, shopLoc, bannerLang, catEmoji])

  function rounded(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }

  if (phase === 'banner') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <SubHeader title="Your Banner" color={COLORS.teal} onBack={() => setPhase('upload')} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button className="btn" onClick={() => setBannerMode('print')} style={{ padding: 10, borderRadius: 12, border: `1px solid ${bannerMode === 'print' ? COLORS.gold : COLORS.border}`, background: bannerMode === 'print' ? 'rgba(212,168,67,.1)' : 'transparent', color: bannerMode === 'print' ? COLORS.gold : COLORS.mid, fontSize: 12, fontWeight: 700 }}>Print A4</button>
            <button className="btn" onClick={() => setBannerMode('square')} style={{ padding: 10, borderRadius: 12, border: `1px solid ${bannerMode === 'square' ? COLORS.gold : COLORS.border}`, background: bannerMode === 'square' ? 'rgba(212,168,67,.1)' : 'transparent', color: bannerMode === 'square' ? COLORS.gold : COLORS.mid, fontSize: 12, fontWeight: 700 }}>Square Social</button>
          </div>
          <div className="panel" style={{ overflow: 'hidden', minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.panel2 }}>
            {!ready && <div style={{ color: COLORS.mid, fontSize: 13, padding: 20 }}>Generating banner...</div>}
            <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: ready ? 'block' : 'none' }} />
          </div>
          {ready && (
            <button className="btn" onClick={() => {
              const slug = (shopName || 'merchant').toLowerCase().replace(/[^a-z0-9]/g, '-')
              const a = document.createElement('a')
              a.download = `${slug}-${bannerMode}.png`
              a.href = canvasRef.current.toDataURL('image/png')
              a.click()
            }} style={{ width: '100%', padding: 14, borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldD})`, color: '#0D0A00', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <icon.Download /> Download Banner
            </button>
          )}
          <button className="btn" onClick={onBack} style={{ width: '100%', padding: 12, borderRadius: 14, border: `1px solid ${COLORS.border}`, background: 'transparent', color: COLORS.mid, fontSize: 13 }}>
            Back to Sabi AI
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'upload') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <SubHeader title="Merchant Setup" color={COLORS.teal} onBack={() => setPhase('lang')} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="panel" style={{ padding: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.white, marginBottom: 8 }}>Upload your payment QR</div>
            <div style={{ fontSize: 13, color: COLORS.mid, lineHeight: 1.6, marginBottom: 14 }}>Open Fedi → Wallet → Receive → screenshot that screen → upload here.</div>
            {!qrData ? (
              <div className="btn" onClick={() => document.getElementById('merchantQr').click()} style={{ border: '2px dashed rgba(45,212,191,.35)', borderRadius: 16, padding: '28px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, background: 'rgba(45,212,191,.05)' }}>
                <div style={{ fontSize: 36 }}>📸</div>
                <div style={{ color: COLORS.teal, fontWeight: 800, fontSize: 14 }}>Tap to upload QR screenshot</div>
                <div style={{ fontSize: 11, color: COLORS.dim }}>JPEG or PNG from your camera roll</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <img src={qrData} alt="QR" style={{ maxWidth: 180, maxHeight: 180, borderRadius: 12, border: `2px solid rgba(45,212,191,.3)` }} />
                <button className="btn" onClick={() => document.getElementById('merchantQr').click()} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, color: COLORS.mid, fontSize: 12, padding: '8px 16px', borderRadius: 20 }}>Upload different image</button>
              </div>
            )}
            <input id="merchantQr" type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = (ev) => setQrData(ev.target.result)
              reader.readAsDataURL(file)
              e.target.value = ''
            }} />
            <button className="btn" disabled={!qrData} onClick={() => setPhase('banner')} style={{ width: '100%', marginTop: 14, padding: 14, borderRadius: 14, border: 'none', background: qrData ? `linear-gradient(135deg, ${COLORS.teal}, #0ea5a0)` : 'rgba(255,255,255,.08)', color: qrData ? '#0D1A1A' : COLORS.dim, fontWeight: 800 }}>
              Generate Banner
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'lang') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <SubHeader title="Merchant Setup" color={COLORS.teal} onBack={() => setPhase('location')} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 40px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.white, marginBottom: 4 }}>Choose banner language</div>
          {[
            { key: 'en', label: 'English only' },
            { key: 'en-ha', label: 'English + Hausa' },
            { key: 'en-yo', label: 'English + Yoruba' },
            { key: 'en-ig', label: 'English + Igbo' },
            { key: 'en-pc', label: 'English + Pidgin' },
          ].map((o) => (
            <button key={o.key} className="btn panel" onClick={() => { setBannerLang(o.key); setPhase('upload') }} style={{ width: '100%', padding: '13px 14px', textAlign: 'left', color: COLORS.white, fontWeight: 700, border: `1px solid ${COLORS.border}` }}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (phase === 'location') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <SubHeader title="Merchant Setup" color={COLORS.teal} onBack={() => setPhase('category')} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.white }}>Where is your shop?</div>
          <div style={{ fontSize: 13, color: COLORS.mid }}>Optional. Helps customers find you.</div>
          <input className="input" value={shopLoc} onChange={(e) => setShopLoc(e.target.value)} placeholder="e.g. Wuse Market, Abuja" style={inputStyle} />
          <button className="btn" onClick={() => setPhase('lang')} style={{ padding: 14, borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${COLORS.teal}, #0ea5a0)`, color: '#0D1A1A', fontWeight: 800 }}>Continue</button>
          <button className="btn" onClick={() => setPhase('lang')} style={{ background: 'transparent', border: 'none', color: COLORS.dim, fontSize: 12, padding: 6 }}>Skip</button>
        </div>
      </div>
    )
  }

  if (phase === 'category') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <SubHeader title="Merchant Setup" color={COLORS.teal} onBack={() => setPhase('name')} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.white }}>What type of business?</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {CATS.map((c) => (
              <button key={c.id} className="btn panel" onClick={() => setShopCat(c.id)} style={{ padding: '14px 12px', textAlign: 'left', border: `1px solid ${shopCat === c.id ? COLORS.gold : COLORS.border}`, background: shopCat === c.id ? 'rgba(212,168,67,.1)' : COLORS.panel }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{c.emoji}</div>
                <div style={{ fontSize: 12.4, fontWeight: 700, color: COLORS.white, lineHeight: 1.3 }}>{c.label}</div>
              </button>
            ))}
          </div>
          <button className="btn" disabled={!shopCat} onClick={() => setPhase('location')} style={{ padding: 14, borderRadius: 14, border: 'none', background: shopCat ? `linear-gradient(135deg, ${COLORS.teal}, #0ea5a0)` : 'rgba(255,255,255,.08)', color: shopCat ? '#0D1A1A' : COLORS.dim, fontWeight: 800 }}>Continue</button>
        </div>
      </div>
    )
  }

  if (phase === 'name') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <SubHeader title="Merchant Setup" color={COLORS.teal} onBack={onBack} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.white }}>What is your shop name?</div>
          <input className="input" value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="e.g. Fatima Fashion" style={inputStyle} />
          <button className="btn" onClick={() => setPhase('category')} style={{ padding: 14, borderRadius: 14, border: 'none', background: shopName.trim() ? `linear-gradient(135deg, ${COLORS.teal}, #0ea5a0)` : 'rgba(255,255,255,.08)', color: shopName.trim() ? '#0D1A1A' : COLORS.dim, fontWeight: 800 }}>Continue</button>
          <button className="btn" onClick={() => setPhase('category')} style={{ background: 'transparent', border: 'none', color: COLORS.dim, fontSize: 12, padding: 6 }}>Skip</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <SubHeader title="Merchant Setup" color={COLORS.teal} onBack={onBack} />
      <div style={{ padding: '10px 14px 0' }}>
        <div style={{ height: 3, background: 'rgba(255,255,255,.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ width: `${((step + 1) / steps.length) * 100}%`, height: '100%', background: COLORS.teal, borderRadius: 3 }} />
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 14px 40px' }}>
        <StepPrompt
          step={current}
          accent={COLORS.teal}
          onYes={() => { if (step >= steps.length - 1) setPhase('name'); else setStep((s) => s + 1) }}
          onNo={() => { if (step === 2) setPhase('join') }}
          onSkip={() => setStep((s) => s + 1)}
          canSkip={step === 3}
          shopName={shopName}
          setShopName={setShopName}
          shopCat={shopCat}
          setShopCat={setShopCat}
          shopLoc={shopLoc}
          setShopLoc={setShopLoc}
        />
      </div>
    </div>
  )
}

function StepPrompt({ step, accent, onYes, onNo, onSkip, canSkip }) {
  return (
    <div className="panel" style={{ padding: 18 }}>
      <div style={{ fontSize: 10, color: COLORS.dim, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>{step.ins}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.white, lineHeight: 1.5, marginBottom: 18 }}>{step.q}</div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn" onClick={onYes} style={{ flex: 1, padding: 13, borderRadius: 13, border: 'none', background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, color: accent === COLORS.teal ? '#0D1A1A' : 'white', fontWeight: 800 }}>Yes</button>
        <button className="btn" onClick={onNo} style={{ flex: 1, padding: 13, borderRadius: 13, border: `1px solid rgba(248,113,113,.28)`, background: 'rgba(248,113,113,.08)', color: COLORS.red, fontWeight: 700 }}>Not yet</button>
      </div>
      {canSkip && <button className="btn" onClick={onSkip} style={{ width: '100%', marginTop: 10, background: 'transparent', border: 'none', color: COLORS.dim, fontSize: 12, padding: 6 }}>Skip this step</button>}
    </div>
  )
}

function MemberOnboarding({ onBack }) {
  const [phase, setPhase] = useState('choice')
  const [step, setStep] = useState(0)
  const [choice, setChoice] = useState(null)
  const [seen, setSeen] = useState(false)
  const steps = [
    { ins: 'Step 1 of 3', q: 'Do you have the Fedi app installed?', yes: 'Great.', no: 'Download Fedi from the App Store or Google Play.' },
    { ins: 'Step 2 of 3', q: 'Have you joined a federation in Fedi?', yes: 'Good.', no: 'Open Wallet and join any federation.' },
    { ins: 'Step 3 of 3', q: 'Have you backed up your recovery words?', yes: 'Perfect.', no: 'Write your recovery words on paper. Never screenshot them.' },
  ]
  const current = steps[Math.min(step, steps.length - 1)]

  useEffect(() => {
    if (phase === 'done' && !seen) {
      logOnboarding('member')
      setSeen(true)
    }
  }, [phase, seen])

  if (phase === 'join') {
    return <JoinScreen title="New Member Setup" color={COLORS.orange} onBack={() => setPhase('steps')} onDone={() => { setPhase('steps'); setStep((s) => s + 1) }} />
  }

  if (phase === 'done') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <SubHeader title="Welcome" color={COLORS.orange} onBack={onBack} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="panel" style={{ padding: 18, textAlign: 'center' }}>
            <div style={{ fontSize: 50, marginBottom: 10 }}>₿</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: COLORS.orange, lineHeight: 1.3, marginBottom: 10 }}>Welcome to Bitcoin Abuja</div>
            <div style={{ fontSize: 13, color: COLORS.mid, lineHeight: 1.65 }}>You are now part of a real Bitcoin circular economy in Nigeria. Your sats are yours — no bank, no middleman.</div>
          </div>
          <div className="panel" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, color: COLORS.gold, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>100 Free Sats Waiting</div>
            <div style={{ fontSize: 13, color: COLORS.white, lineHeight: 1.6, marginBottom: 12 }}>Claim your free sats from the Bitcoin Abuja faucet.</div>
            <button className="btn" onClick={() => window.open(COMMUNITY.faucetLink, '_blank')} style={{ width: '100%', padding: 13, borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldD})`, color: '#0D0A00', fontWeight: 800 }}>Claim My Free Sats</button>
          </div>
          <button className="btn" onClick={onBack} style={{ width: '100%', padding: 12, borderRadius: 14, border: `1px solid ${COLORS.border}`, background: 'transparent', color: COLORS.mid, fontSize: 13 }}>Back to Sabi AI</button>
        </div>
      </div>
    )
  }

  if (phase === 'steps') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <SubHeader title="New Member Setup" color={COLORS.orange} onBack={step > 0 ? () => setStep((s) => s - 1) : onBack} />
        <div style={{ padding: '10px 14px 0' }}>
          <div style={{ height: 3, background: 'rgba(255,255,255,.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ width: `${((step + 1) / steps.length) * 100}%`, height: '100%', background: COLORS.orange, borderRadius: 3 }} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 14px 40px' }}>
          <StepPrompt step={current} accent={COLORS.orange} onYes={() => { if (step >= steps.length - 1) setPhase('done'); else setStep((s) => s + 1) }} onNo={() => { if (step === 1) setPhase('join') }} onSkip={() => setStep((s) => s + 1)} canSkip={false} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <SubHeader title="New Member Setup" color={COLORS.orange} onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: COLORS.white, lineHeight: 1.35 }}>What brings you to Bitcoin Abuja?</div>
        <div style={{ fontSize: 13, color: COLORS.mid, lineHeight: 1.65 }}>Choose one path. We keep the rest simple.</div>
        {[
          { icon: '📉', title: 'Protect my savings', subtitle: 'See why Bitcoin helps against Naira inflation.', type: 'choice1', accent: COLORS.gold },
          { icon: '⚡', title: 'Send money cheaper', subtitle: 'See how Lightning cuts transfer friction.', type: 'choice2', accent: COLORS.teal },
          { icon: '📚', title: 'Learn Bitcoin first', subtitle: 'Get a simple overview in a few cards.', type: 'choice3', accent: COLORS.orange },
          { icon: '🚀', title: 'Just set me up', subtitle: 'Go straight to wallet setup.', type: 'skip', accent: COLORS.orange },
        ].map((c) => (
          <button key={c.type} onClick={() => { setChoice(c.type); setPhase(c.type === 'choice3' ? 'steps' : 'steps'); setStep(0) }} className="btn panel" style={{ width: '100%', padding: 16, textAlign: 'left', border: `1px solid ${c.accent}33`, background: `${c.accent}08`, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 26, flexShrink: 0, marginTop: 2 }}>{c.icon}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.white, marginBottom: 4 }}>{c.title}</div>
              <div style={{ fontSize: 11.5, color: COLORS.mid, lineHeight: 1.45 }}>{c.subtitle}</div>
            </div>
          </button>
        ))}
        <div style={{ fontSize: 11, color: COLORS.dim, textAlign: 'center', marginTop: 2 }}>Bitcoin Abuja · Powered by Fedi</div>
      </div>
    </div>
  )
}

function StatsView({ onBack }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const h = { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` }
    const q = (table, params) => fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/${table}?${params}`, { headers: h }).then((r) => r.json())
    Promise.all([
      q('conversations', `select=id&community_id=eq.${COMMUNITY.id}&created_at=gte.${monthStart}`),
      q('conversations', `select=id&community_id=eq.${COMMUNITY.id}&created_at=gte.${weekAgo}`),
      q('onboardings', `select=id&type=eq.member&community_id=eq.${COMMUNITY.id}&created_at=gte.${monthStart}`),
      q('onboardings', `select=id&type=eq.member&community_id=eq.${COMMUNITY.id}&created_at=gte.${weekAgo}`),
      q('onboardings', `select=shop_name,location,category,created_at&community_id=eq.${COMMUNITY.id}&type=eq.merchant&order=created_at.desc`),
    ])
      .then(([allC, weekC, allM, weekM, merchants]) => {
        setData({
          totalConv: Array.isArray(allC) ? allC.length : 0,
          weekConv: Array.isArray(weekC) ? weekC.length : 0,
          totalMemb: Array.isArray(allM) ? allM.length : 0,
          weekMemb: Array.isArray(weekM) ? weekM.length : 0,
          merchants: Array.isArray(merchants) ? merchants.filter((m) => m.shop_name) : [],
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <SubHeader title="Impact Dashboard" color={COLORS.gold} onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="panel" style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ fontSize: 32 }}>🇳🇬</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: COLORS.white, lineHeight: 1.3, marginBottom: 4 }}>Real people. Real language. Real sats.</div>
            <div style={{ fontSize: 11, color: COLORS.mid }}>Built by Aisha Ummi Waziri · Powered by Fedi</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <MiniStat label="Conversations" value={loading ? '—' : data?.totalConv || 0} delta={loading ? '...' : `+${data?.weekConv || 0} this week`} color={COLORS.gold} />
          <MiniStat label="Members" value={loading ? '—' : data?.totalMemb || 0} delta={loading ? '...' : `+${data?.weekMemb || 0} this week`} color={COLORS.teal} />
        </div>
        <div className="panel" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.white, marginBottom: 12 }}>Active Merchants</div>
          {loading ? <div style={{ color: COLORS.mid, fontSize: 12 }}>Loading...</div> : !data?.merchants?.length ? <div style={{ color: COLORS.mid, fontSize: 12 }}>No merchants yet.</div> : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {data.merchants.map((m, i) => (
                <div key={i} style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldD})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{CATS.find((c) => c.id === m.category)?.emoji || '🏪'}</div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: COLORS.white, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.shop_name}</div>
                    <div style={{ fontSize: 9.5, color: COLORS.mid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.location || 'Abuja'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MiniStat({ label, value, delta, color }) {
  return (
    <div className="panel" style={{ padding: 14, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, ${color}66)` }} />
      <div style={{ fontSize: 9.5, color: COLORS.mid, textTransform: 'uppercase', letterSpacing: .6, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: 9.5, color: COLORS.green, marginTop: 2 }}>{delta}</div>
    </div>
  )
}

function RequestForm({ onBack }) {
  const [name, setName] = useState('')
  const [community, setCommunity] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('Nigeria')
  const [fediLink, setFediLink] = useState('')
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  const submit = async () => {
    if (!name.trim() || !community.trim() || !city.trim()) return
    await submitRequest({ name: name.trim(), community: community.trim(), city: city.trim(), country: country.trim(), fediLink: fediLink.trim(), email: email.trim() })
    setDone(true)
  }

  if (done) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <SubHeader title="Request Sent" color={COLORS.teal} onBack={onBack} />
        <div style={{ flex: 1, padding: '16px 14px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="panel" style={{ padding: 18, textAlign: 'center' }}>
            <div style={{ fontSize: 42, marginBottom: 10 }}>✓</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: COLORS.white, marginBottom: 8 }}>Request received</div>
            <div style={{ fontSize: 13, color: COLORS.mid, lineHeight: 1.65 }}>Sabi can be adapted for your community.</div>
          </div>
          <button className="btn" onClick={onBack} style={{ width: '100%', padding: 13, borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${COLORS.teal}, #0ea5a0)`, color: '#0D1A1A', fontWeight: 800 }}>Back to Sabi AI</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <SubHeader title="Community Request" color={COLORS.gold} onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: COLORS.white }}>Bring Sabi to your community</div>
        <div style={{ fontSize: 13, color: COLORS.mid, lineHeight: 1.65 }}>This saves the request to Supabase.</div>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={inputStyle} />
        <input className="input" value={community} onChange={(e) => setCommunity(e.target.value)} placeholder="Community name" style={inputStyle} />
        <input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" style={inputStyle} />
        <input className="input" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" style={inputStyle} />
        <input className="input" value={fediLink} onChange={(e) => setFediLink(e.target.value)} placeholder="Fedi link (optional)" style={inputStyle} />
        <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" style={inputStyle} />
        <button className="btn" onClick={submit} style={{ padding: 14, borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldD})`, color: '#0D0A00', fontWeight: 800 }}>Submit Request</button>
        <button className="btn" onClick={onBack} style={{ background: 'transparent', border: 'none', color: COLORS.dim, fontSize: 12, padding: 6 }}>Cancel</button>
      </div>
    </div>
  )
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function ChatHome({ onMerchant, onMember, onRequest, onStats, onAsk, satPrice, lang, setLang, speaking, onStopSpeak, currentLangPrompts, currentWelcome, hasSpeech, toggleMic, recording, micErr, input, setInput, send, attached, setAttached, fileRef, handleFile, messages, loading, display, endRef }) {
  return (
    <>
      <Header onStats={onStats} satPrice={satPrice} speaking={speaking} onStopSpeak={onStopSpeak} />

      <div style={{ padding: '10px 14px 0', background: COLORS.panel, borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10 }}>
          {Object.entries({ en: 'EN', ha: 'HA', yo: 'YO', ig: 'IG', pc: 'PID' }).map(([k, v]) => (
            <button key={k} className="btn" onClick={() => setLang(k)} style={{ flexShrink: 0, padding: '4px 11px', borderRadius: 999, fontSize: 11, fontWeight: 800, border: `1px solid ${lang === k ? 'rgba(212,168,67,.5)' : 'rgba(212,168,67,.18)'}`, background: lang === k ? 'rgba(212,168,67,.12)' : 'transparent', color: lang === k ? COLORS.gold : COLORS.mid }}>
              {v}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px 14px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="panel" style={{ padding: 16 }}>
          <div style={{ fontSize: 23, fontWeight: 900, color: COLORS.white, marginBottom: 8, lineHeight: 1.15 }}>{currentWelcome.title}</div>
          <div style={{ fontSize: 13.5, color: COLORS.mid, lineHeight: 1.65 }}>{currentWelcome.sub}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={onRequest} style={{ flex: 1, padding: '10px 12px', borderRadius: 14, border: `1px solid ${COLORS.border}`, background: 'rgba(45,212,191,.08)', color: COLORS.teal, fontSize: 12.5, fontWeight: 800, textAlign: 'left' }}>
            Bring Sabi to your community
            <div style={{ fontSize: 10.5, color: COLORS.mid, fontWeight: 600, marginTop: 4 }}>Request deployment</div>
          </button>
          <button className="btn" onClick={onStats} style={{ flex: 1, padding: '10px 12px', borderRadius: 14, border: `1px solid ${COLORS.border}`, background: 'rgba(212,168,67,.08)', color: COLORS.gold, fontSize: 12.5, fontWeight: 800, textAlign: 'left' }}>
            Impact dashboard
            <div style={{ fontSize: 10.5, color: COLORS.mid, fontWeight: 600, marginTop: 4 }}>See live activity</div>
          </button>
        </div>
      </div>

      <div style={{ padding: '12px 14px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 11, color: COLORS.dim, fontWeight: 800, letterSpacing: .7, textTransform: 'uppercase' }}>Ask Sabi</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {currentLangPrompts.slice(0, 2).map((p) => (
            <QuickCard key={p.label} title={p.label} subtitle={p.msg.includes('__') ? 'Starts onboarding' : 'Opens chat' } accent={p.msg.includes('sat') ? COLORS.gold : COLORS.teal} onClick={() => onAsk(p.msg)} />
          ))}
        </div>
        <div style={{ fontSize: 11, color: COLORS.dim, fontWeight: 800, letterSpacing: .7, textTransform: 'uppercase', marginTop: 2 }}>Start here</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <QuickCard title="Accept Bitcoin at my shop" subtitle="Simple merchant setup and a clean banner." accent={COLORS.teal} onClick={onMerchant} big />
          <QuickCard title="New to Bitcoin? Start here" subtitle="Short onboarding for new members." accent={COLORS.orange} onClick={onMember} big />
        </div>
        {hasSpeech && (
          <div className="panel" style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className={`btn ${recording ? 'mic-ring' : ''}`} onClick={toggleMic} style={{ width: 50, height: 50, borderRadius: '50%', border: `1px solid ${COLORS.gold}66`, background: recording ? `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldD})` : 'rgba(212,168,67,.12)', color: recording ? '#0D0A00' : COLORS.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <icon.Mic />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 900, color: COLORS.white, marginBottom: 2 }}>Speak to Sabi</div>
              <div style={{ fontSize: 11.2, color: COLORS.mid, lineHeight: 1.45 }}>Tap the mic and speak. Sabi will transcribe your question using your browser.</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '14px 14px 8px' }}>
        {display.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {display.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.r === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-start', gap: 8 }}>
                {msg.r !== 'user' && <img src={COMMUNITY.appLogo} alt="Sabi" style={{ width: 30, height: 30, objectFit: 'contain', flexShrink: 0, marginTop: 2 }} />}
                <div style={{ maxWidth: '84%', display: 'flex', flexDirection: 'column', alignItems: msg.r === 'user' ? 'flex-end' : 'flex-start', gap: 6 }}>
                  {msg.r === 'error' ? (
                    <div style={{ padding: '11px 14px', fontSize: 13.5, color: COLORS.red, lineHeight: 1.6, background: 'rgba(248,113,113,.08)', border: `1px solid rgba(248,113,113,.25)`, borderRadius: '16px 16px 16px 4px' }}>{msg.c}</div>
                  ) : (
                    <div style={{ padding: '12px 14px', fontSize: 14, lineHeight: 1.75, whiteSpace: 'pre-wrap', background: msg.r === 'user' ? `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldD})` : COLORS.panel, color: msg.r === 'user' ? '#0D0A00' : COLORS.white, fontWeight: msg.r === 'user' ? 700 : 500, borderRadius: msg.r === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', border: msg.r === 'user' ? 'none' : `1px solid ${COLORS.border}` }}>
                      {msg.file && msg.file.type === 'image' && msg.file.preview && <img src={msg.file.preview} alt="attachment" style={{ maxWidth: 180, borderRadius: 10, display: 'block', marginBottom: msg.c ? 8 : 0 }} />}
                      {msg.file && msg.file.type === 'pdf' && <div style={{ display: 'inline-block', fontSize: 11, color: COLORS.gold, border: `1px solid rgba(212,168,67,.25)`, background: 'rgba(212,168,67,.08)', borderRadius: 8, padding: '4px 8px', marginBottom: msg.c ? 8 : 0 }}>{msg.file.name}</div>}
                      {msg.c}
                      {msg.r !== 'user' && msg.audio && (
                        <button className="btn" onClick={() => playAssistantAudio(msg.audio)} style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(212,168,67,.1)', border: `1px solid rgba(212,168,67,.22)`, color: COLORS.gold, borderRadius: 999, padding: '6px 10px', fontSize: 11, fontWeight: 800 }}>
                          <icon.Speaker /> Listen
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <img src={COMMUNITY.appLogo} alt="Sabi" style={{ width: 30, height: 30, objectFit: 'contain', flexShrink: 0, marginTop: 2 }} />
                <div className="panel" style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                    {[0, 1, 2].map((j) => <div key={j} style={{ width: 7, height: 7, borderRadius: '50%', background: COLORS.gold, animation: `pulse 1.2s ${j * 0.15}s ease-in-out infinite` }} />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <div style={{ padding: '10px 14px 18px', background: COLORS.panel, borderTop: `1px solid ${COLORS.border}`, position: 'sticky', bottom: 0 }}>
        {recording && <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '8px 12px', background: 'rgba(212,168,67,.08)', border: `1px solid rgba(212,168,67,.2)`, borderRadius: 12 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.gold, animation: 'pulse 1s ease infinite' }} /><span style={{ fontSize: 12, color: COLORS.gold, fontWeight: 700 }}>Listening… tap mic to stop</span></div>}
        {micErr && <div style={{ marginBottom: 8, padding: '8px 12px', background: 'rgba(248,113,113,.08)', border: `1px solid rgba(248,113,113,.25)`, borderRadius: 12 }}><span style={{ fontSize: 12, color: COLORS.red }}>{micErr}</span></div>}
        {attached && <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: '7px 10px', marginBottom: 8, maxWidth: 260 }}><div style={{ width: 34, height: 34, borderRadius: 7, background: COLORS.panel2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{attached.type === 'image' && attached.preview ? <img src={attached.preview} alt="preview" style={{ width: 34, height: 34, borderRadius: 7, objectFit: 'cover' }} /> : '📄'}</div><span style={{ fontSize: 11.5, color: COLORS.white, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attached.name}</span><button className="btn" onClick={() => setAttached(null)} style={{ width: 20, height: 20, borderRadius: '50%', background: COLORS.panel2, border: 'none', color: COLORS.mid, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button></div>}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleFile} style={{ display: 'none' }} />
          <button className="btn" onClick={() => fileRef.current?.click()} style={{ width: 40, height: 40, borderRadius: 12, background: attached ? 'rgba(212,168,67,.1)' : 'transparent', border: `1px solid ${attached ? 'rgba(212,168,67,.3)' : COLORS.border}`, color: attached ? COLORS.gold : COLORS.mid, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <icon.Attach />
          </button>
          <input className="input" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} placeholder={recording ? 'Listening…' : attached ? 'Add a question… (optional)' : 'Ask anything…'} style={{ flex: 1, ...inputStyle, borderRadius: 24, padding: '12px 14px' }} />
          {hasWebSpeech() && !input.trim() && !attached && <button className={`btn ${recording ? 'mic-ring' : ''}`} onClick={toggleMic} style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: recording ? `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldD})` : 'rgba(212,168,67,.1)', color: recording ? '#0D0A00' : COLORS.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><icon.Mic /></button>}
          {(input.trim() || attached) && <button className="btn" onClick={() => send()} disabled={loading} style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: !loading ? `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldD})` : 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><icon.Send color={!loading ? '#0D0A00' : COLORS.dim} /></button>}
        </div>
        <div style={{ fontSize: 9, color: COLORS.dim, textAlign: 'center', marginTop: 8, letterSpacing: .5 }}>Bitcoin Abuja · Powered by Fedi</div>
      </div>
    </>
  )

  function hasWebSpeech() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  }
}

export default function App() {
  const [view, setView] = useState('chat')
  const [btc, setBtc] = useState({ usd: 96300, ngn: 154000000 })
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Welcome. Ask me anything about Bitcoin and Fedi.' }])
  const [display, setDisplay] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [lang, setLang] = useState('en')
  const [recording, setRecording] = useState(false)
  const [micErr, setMicErr] = useState('')
  const [attached, setAttached] = useState(null)
  const [audioPlayer, setAudioPlayer] = useState(null)
  const [splashDone, setSplashDone] = useState(true)
  const fileRef = useRef(null)
  const endRef = useRef(null)
  const recRef = useRef(null)
  const chunksRef = useRef([])

  useEffect(() => { fetchBTC().then(setBtc); const iv = setInterval(() => fetchBTC().then(setBtc), 180000); return () => clearInterval(iv) }, [])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [display, loading])

  const satPrice = useMemo(() => ((btc?.ngn || 154000000) / 100000000).toFixed(2), [btc])
  const welcome = WELCOME[lang] || WELCOME.en
  const prompts = PROMPTS[lang] || PROMPTS.en

  const stopSpeak = useCallback(() => {
    window.speechSynthesis?.cancel()
    if (audioPlayer) {
      try {
        audioPlayer.pause()
        if (audioPlayer.__url) URL.revokeObjectURL(audioPlayer.__url)
      } catch (e) {}
    }
    setAudioPlayer(null)
    setSpeaking(false)
  }, [audioPlayer])

  const playAssistantAudio = useCallback(async (base64) => {
    if (!base64) return false
    try {
      stopSpeak()
      const audio = audioFromBase64(base64)
      setAudioPlayer(audio)
      setSpeaking(true)
      audio.onended = () => {
        setSpeaking(false)
        if (audio.__url) URL.revokeObjectURL(audio.__url)
        setAudioPlayer(null)
      }
      audio.onerror = () => {
        setSpeaking(false)
        if (audio.__url) URL.revokeObjectURL(audio.__url)
        setAudioPlayer(null)
      }
      await audio.play()
      return true
    } catch (e) {
      setSpeaking(false)
      return false
    }
  }, [stopSpeak])

  const startMic = useCallback(async () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setMicErr('Voice recognition is not supported on this browser.')
      return
    }
    setMicErr('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new SR()
      rec.lang = { en: 'en-NG', ha: 'ha', yo: 'yo', ig: 'ig', pc: 'en-NG' }[lang] || 'en-NG'
      rec.continuous = false
      rec.interimResults = false
      rec.onstart = () => setRecording(true)
      rec.onresult = (e) => {
        const transcript = Array.from(e.results).map((x) => x[0].transcript).join('')
        setInput(transcript)
      }
      rec.onend = () => { setRecording(false); recRef.current = null; stream.getTracks().forEach((t) => t.stop()) }
      rec.onerror = (e) => { setRecording(false); recRef.current = null; stream.getTracks().forEach((t) => t.stop()); setMicErr(e.error === 'not-allowed' ? 'Microphone blocked. Allow access in browser settings.' : 'Voice error. Please type instead.') }
      recRef.current = rec
      rec.start()
    } catch (e) {
      setMicErr('Microphone access denied or blocked.')
    }
  }, [lang])

  const stopMic = useCallback(() => {
    try { recRef.current?.stop() } catch (e) {}
    setRecording(false)
  }, [])

  const toggleMic = useCallback(() => { if (recording) stopMic(); else startMic() }, [recording, startMic, stopMic])

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isImage = file.type.startsWith('image/')
    const isPDF = file.type === 'application/pdf'
    if (!isImage && !isPDF) return
    const reader = new FileReader()
    const base64 = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(String(reader.result).split(',')[1] || '')
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    setAttached({ type: isImage ? 'image' : 'pdf', name: file.name, mime: file.type, base64, preview: isImage ? URL.createObjectURL(file) : null })
    e.target.value = ''
  }

  const resetChat = () => {
    stopSpeak()
    setView('chat')
    setMessages([{ role: 'assistant', content: 'Welcome. Ask me anything about Bitcoin and Fedi.' }])
    setDisplay([])
    setInput('')
    setAttached(null)
    setLoading(false)
    setMicErr('')
    setRecording(false)
  }

  const ask = async (textOverride) => {
    const text = (textOverride || input).trim()
    if (text === '__MERCHANT__') { setView('merchant'); return }
    if (text === '__MEMBER__') { setView('member'); return }
    if (!text && !attached) return
    if (loading) return

    if (messages.length <= 1 && text) {
      const d = getLang(text)
      if (d !== 'en') setLang(d)
    }

    setInput('')
    setMicErr('')
    const file = attached
    setAttached(null)
    setDisplay((p) => [...p, { r: 'user', c: text, file }])
    const parts = []
    if (file) {
      if (file.type === 'image') parts.push({ type: 'image', source: { type: 'base64', media_type: file.mime, data: file.base64 } })
      else parts.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: file.base64 } })
    }
    parts.push({ type: 'text', text: text || 'Please look at this and help me understand it.' })
    const history = [...messages, { role: 'user', content: parts }]
    setMessages(history)
    setLoading(true)
    try {
      const { text: reply, audio } = await sendToAI(history, btc, lang)
      logConversation(lang)
      setMessages((p) => [...p, { role: 'assistant', content: reply }])
      setDisplay((p) => [...p, { r: 'bot', c: reply, audio }])
      const played = await playAssistantAudio(audio)
      if (!played) {
        setSpeaking(true)
        const ok = speakFallback(reply, lang)
        if (ok) {
          const chk = setInterval(() => {
            if (!window.speechSynthesis?.speaking) {
              setSpeaking(false)
              clearInterval(chk)
            }
          }, 300)
        } else {
          setSpeaking(false)
        }
      }
    } catch (e) {
      setDisplay((p) => [...p, { r: 'error', c: ERROR_BY_LANG[lang] || ERROR_BY_LANG.en }])
    }
    setLoading(false)
  }

  const wrap = (children) => <div className="app-shell"><style>{CSS}</style>{children}</div>

  if (!splashDone) {
    return wrap(
      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.bg }}>
        <img src={COMMUNITY.appLogo} alt="Sabi AI" style={{ width: 280, maxWidth: '78vw' }} />
      </div>
    )
  }

  if (view === 'stats') return wrap(<StatsView onBack={() => setView('chat')} />)
  if (view === 'merchant') return wrap(<MerchantOnboarding onBack={resetChat} />)
  if (view === 'member') return wrap(<MemberOnboarding onBack={resetChat} />)
  if (view === 'request') return wrap(<RequestForm onBack={() => setView('chat')} />)

  return wrap(
    <>
      <ChatHome
        onMerchant={() => setView('merchant')}
        onMember={() => setView('member')}
        onRequest={() => setView('request')}
        onStats={() => setView('stats')}
        onAsk={ask}
        satPrice={satPrice}
        lang={lang}
        setLang={setLang}
        speaking={speaking}
        onStopSpeak={stopSpeak}
        currentLangPrompts={prompts}
        currentWelcome={welcome}
        hasSpeech={!!(window.SpeechRecognition || window.webkitSpeechRecognition)}
        toggleMic={toggleMic}
        recording={recording}
        micErr={micErr}
        input={input}
        setInput={setInput}
        send={ask}
        attached={attached}
        setAttached={setAttached}
        fileRef={fileRef}
        handleFile={handleFile}
        messages={messages}
        loading={loading}
        display={display}
        endRef={endRef}
      />
    </>
  )
}
